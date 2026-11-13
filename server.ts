import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import {
  MAX_UPLOAD_BYTES,
  checkRateLimit,
  detectRawDnaContent,
  evaluateBiomarkerAgainstReportRange,
  parseLabReportText,
  validateUploadFile,
  type RateLimitBucket,
} from './src/utils/wellnestLogic';
import type { ExtractedFinding, ReportCategory } from './src/types/wellnest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const AI_MODEL = 'gemini-4-hydrogen';
const AI_PROVIDER_LABEL = 'Google Gemini API (server-side)';

const aiRateBuckets = new Map<string, RateLimitBucket>();

function getClientKey(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : req.socket.remoteAddress || 'local';
  return ip;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey === 'YOUR_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isAiDataControlsVerified(): boolean {
  return process.env.AI_DATA_CONTROLS_VERIFIED === 'true';
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 1,
  },
});

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  // Baseline security headers; never cache API responses containing health data
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'no-referrer');
    if (req.path.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
    next();
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    const geminiReady = Boolean(getGeminiClient());
    const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
    const supabaseAnon = process.env.VITE_SUPABASE_ANON_KEY?.trim();
    const supabaseConfigured = Boolean(
      supabaseUrl &&
        supabaseAnon &&
        !supabaseUrl.includes('YOUR_PROJECT_REF') &&
        !supabaseAnon.includes('YOUR_SUPABASE_ANON_KEY'),
    );

    res.json({
      ok: true,
      aiConfigured: geminiReady,
      aiDataControlsVerified: isAiDataControlsVerified(),
      aiProvider: AI_PROVIDER_LABEL,
      aiModel: AI_MODEL,
      supabaseConfigured,
    });
  });

  // Report parsing & validation route (supports text/CSV/JSON or file upload; AI OCR optional & consent-gated)
  app.post(
    '/api/reports/parse',
    (req, res, next) => {
      upload.single('file')(req, res, (err) => {
        if (err) {
          if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({
              error: 'File exceeds the 10 MB security limit.',
            });
            return;
          }
          res.status(400).json({ error: 'Invalid upload payload.' });
          return;
        }
        next();
      });
    },
    async (req: Request, res: Response) => {
      try {
        const category = (
          req.body?.category === 'interpreted_genetic' ? 'interpreted_genetic' : 'lab'
        ) as ReportCategory;
        const reportDate =
          typeof req.body?.reportDate === 'string' && req.body.reportDate.trim()
            ? req.body.reportDate.trim()
            : new Date().toISOString().slice(0, 10);
        const reportId = `rep-${Date.now()}`;
        const allowAiExtraction = req.body?.allowAiExtraction === 'true' || req.body?.allowAiExtraction === true;
        const pastedText = typeof req.body?.rawText === 'string' ? req.body.rawText : '';

        const file = req.file;
        let sourceText = pastedText;
        let fileMeta = {
          fileName: 'pasted-report.txt',
          fileType: 'text/plain',
          fileSizeBytes: Buffer.byteLength(pastedText, 'utf8'),
        };

        if (file) {
          const check = validateUploadFile(file.originalname, file.mimetype, file.size);
          if (!check.valid) {
            res.status(400).json({ error: check.error });
            return;
          }
          fileMeta = {
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSizeBytes: file.size,
          };

          const isTextLike =
            file.mimetype.startsWith('text/') ||
            file.mimetype === 'application/json' ||
            /\.(txt|csv|json)$/i.test(file.originalname);

          if (isTextLike) {
            sourceText = file.buffer.toString('utf8');
          }
        }

        // Strict Raw DNA Guard
        const rawCheck = detectRawDnaContent(sourceText, fileMeta.fileName);
        if (rawCheck.isRawDna) {
          res.status(422).json({
            error: rawCheck.reason,
            code: 'RAW_DNA_BLOCKED',
          });
          return;
        }

        // Deterministic parsing for text/CSV/JSON content
        if (sourceText.trim()) {
          const parsedFindings = parseLabReportText(
            sourceText,
            reportDate,
            category,
            reportId,
          );
          if (parsedFindings.length > 0) {
            res.json({
              reportId,
              ...fileMeta,
              extractionMode: 'deterministic',
              findings: parsedFindings,
            });
            return;
          }
        }

        // Optional AI-assisted extraction for binary PDF/images ONLY with explicit consent + verified data controls
        if (file && !sourceText.trim()) {
          const ai = getGeminiClient();
          if (!allowAiExtraction) {
            res.json({
              reportId,
              ...fileMeta,
              extractionMode: 'manual_review_required',
              notice:
                'File validated and stored locally for review. Automatic AI OCR is off—add or confirm extracted rows below against your document.',
              findings: [
                {
                  id: `${reportId}-f-1`,
                  reportId,
                  category,
                  testName: category === 'lab' ? 'Enter test name from report' : 'Enter interpreted gene/marker',
                  result: '',
                  unit: category === 'lab' ? '' : 'Clinical interpretation',
                  reportDate,
                  referenceRange: category === 'lab' ? '' : 'Interpreted by clinical geneticist',
                  rangeStatus: 'needs_review',
                  uncertain: true,
                  uncertaintyReason:
                    'Binary PDF/image requires manual entry or explicit AI extraction consent. Please enter and confirm values from your document.',
                  confirmedByUser: false,
                } satisfies ExtractedFinding,
              ],
            });
            return;
          }

          if (!ai || !isAiDataControlsVerified()) {
            res.status(503).json({
              error: !ai
                ? 'AI extraction is unavailable because GEMINI_API_KEY is not configured on the server. Please enter values manually or upload a CSV/TXT/JSON report.'
                : 'AI extraction is paused until operator data-use controls are verified (AI_DATA_CONTROLS_VERIFIED=true). You can enter values manually below.',
            });
            return;
          }

          const clientKey = getClientKey(req);
          const bucket = aiRateBuckets.get(clientKey) ?? { timestamps: [] };
          const rate = checkRateLimit(bucket, Date.now(), 12, 60_000);
          aiRateBuckets.set(clientKey, bucket);
          if (!rate.allowed) {
            res.status(429).json({
              error: `AI request rate limit reached. Please try again in ${rate.retryAfterSeconds} seconds.`,
            });
            return;
          }

          const base64Data = file.buffer.toString('base64');
          const response = await ai.models.generateContent({
            model: AI_MODEL,
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: file.mimetype,
                    data: base64Data,
                  },
                },
                {
                  text:
                    category === 'interpreted_genetic'
                      ? 'Extract ONLY professionally interpreted clinical genetic findings (gene/marker, clinical interpretation summary, date). Reject or return empty if this appears to be raw SNP genotype data.'
                      : 'Extract lab test rows with testName, result, unit, reportDate (YYYY-MM-DD), referenceRange, and uncertain (boolean) if anything is blurry or incomplete.',
                },
              ],
            },
            config: {
              systemInstruction:
                'You extract structured medical report fields faithfully without diagnosing or inventing missing units or ranges. Mark uncertain=true if any field is unclear.',
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    testName: { type: Type.STRING },
                    result: { type: Type.STRING },
                    unit: { type: Type.STRING },
                    reportDate: { type: Type.STRING },
                    referenceRange: { type: Type.STRING },
                    uncertain: { type: Type.BOOLEAN },
                    uncertaintyReason: { type: Type.STRING },
                    geneOrMarker: { type: Type.STRING },
                    clinicalInterpretation: { type: Type.STRING },
                  },
                },
              },
            },
          });

          const rawJson = (response.text ?? '[]').trim();
          let items: Array<Record<string, unknown>> = [];
          try {
            items = JSON.parse(rawJson);
          } catch {
            items = [];
          }

          const findings: ExtractedFinding[] = items.map((item, idx) => {
            const testName = String(item.testName ?? '').trim();
            const result = String(item.result ?? '').trim();
            const unit = String(item.unit ?? '').trim();
            const date = String(item.reportDate ?? reportDate).trim();
            const referenceRange = String(item.referenceRange ?? '').trim();
            const evalRes = evaluateBiomarkerAgainstReportRange(
              result,
              unit,
              referenceRange,
              category,
            );
            const uncertain =
              Boolean(item.uncertain) ||
              !testName ||
              !result ||
              (category === 'lab' && (!unit || !referenceRange)) ||
              evalRes.status === 'needs_review';

            return {
              id: `${reportId}-f-${idx + 1}`,
              reportId,
              category,
              testName: testName || `Item #${idx + 1}`,
              result,
              unit,
              reportDate: date || reportDate,
              referenceRange,
              rangeStatus: uncertain && category === 'lab' ? 'needs_review' : evalRes.status,
              uncertain,
              uncertaintyReason: item.uncertaintyReason
                ? String(item.uncertaintyReason)
                : uncertain
                  ? 'Please confirm extracted value, unit, and report range.'
                  : undefined,
              confirmedByUser: false,
              geneOrMarker: item.geneOrMarker ? String(item.geneOrMarker) : undefined,
              clinicalInterpretation: item.clinicalInterpretation
                ? String(item.clinicalInterpretation)
                : undefined,
            };
          });

          res.json({
            reportId,
            ...fileMeta,
            extractionMode: 'gemini_assisted',
            findings,
          });
          return;
        }

        res.status(400).json({
          error:
            'Could not find structured test lines in the submitted text. Use format "Test Name: 24 ng/mL (Ref: 30 - 100)" or enter values manually.',
        });
      } catch {
        res.status(500).json({
          error: 'Unable to process the report right now. Please try manual entry or check server configuration.',
        });
      }
    },
  );

  // Server-side AI Guide endpoint with strict consent + data-control + medical-safety enforcement
  app.post('/api/ai/guide', async (req: Request, res: Response) => {
    try {
      const { consentConfirmed, payload } = req.body ?? {};

      if (consentConfirmed !== true) {
        res.status(400).json({
          error: 'Explicit per-request user consent is required before sending report details to the AI provider.',
        });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error:
            'AI Guide is currently disabled because GEMINI_API_KEY is not configured on the server. The rest of Wellnest remains available.',
          code: 'AI_NOT_CONFIGURED',
        });
        return;
      }

      if (!isAiDataControlsVerified()) {
        res.status(503).json({
          error:
            'Outgoing health data to the AI provider is paused because AI_DATA_CONTROLS_VERIFIED is not set to true on the server.',
          code: 'DATA_CONTROLS_UNVERIFIED',
        });
        return;
      }

      const clientKey = getClientKey(req);
      const bucket = aiRateBuckets.get(clientKey) ?? { timestamps: [] };
      const rate = checkRateLimit(bucket, Date.now(), 12, 60_000);
      aiRateBuckets.set(clientKey, bucket);

      if (!rate.allowed) {
        res.status(429).json({
          error: `Rate limit reached for AI Guide. Please wait ${rate.retryAfterSeconds} seconds before sending another question.`,
          retryAfterSeconds: rate.retryAfterSeconds,
        });
        return;
      }

      const question = typeof payload?.question === 'string' ? payload.question.trim() : '';
      const confirmedFindings = Array.isArray(payload?.confirmedFindings)
        ? payload.confirmedFindings
        : [];

      if (!question || question.length > 1500) {
        res.status(400).json({
          error: 'Please provide a concise question (1 to 1,500 characters).',
        });
        return;
      }

      if (confirmedFindings.length === 0) {
        res.status(400).json({
          error: 'Select at least one user-confirmed report item before asking the AI Guide.',
        });
        return;
      }

      const systemInstruction = `You are Wellnest AI Guide, a calm educational health information assistant.
STRICT MEDICAL SAFETY RULES:
1. You are strictly an educational information tool—NOT a diagnostic or treatment tool.
2. Never diagnose any disease or condition. Say "outside this report's reference range" rather than "you have a disease" or "abnormal diagnosis".
3. Never compare values across different tests/dates without respecting their exact units and each report's own reference range.
4. For professionally interpreted genetic findings, describe them solely as risk or pharmacogenomic context—never analyze raw DNA or predict disease deterministically.
5. Keep food, exercise, and lifestyle suggestions general, gradual, and cautious. Never recommend stopping or changing prescription medication, extreme diets, or strenuous exercise for someone with a relevant condition.
6. Encourage qualified clinician review whenever a value is outside the report's reference range or involves medication/genetic interpretation.
7. If the user describes emergency symptoms (chest pain, difficulty breathing, sudden weakness, severe bleeding, suicidal thoughts, loss of consciousness), immediately instruct them to seek urgent emergency care.`;

      const minimalPrompt = JSON.stringify(
        {
          confirmedFindings: confirmedFindings.slice(0, 15),
          latestWellbeingCheckIn: payload?.latestWellbeingCheckIn ?? undefined,
          userQuestion: question,
        },
        null,
        2,
      );

      const response = await ai.models.generateContent({
        model: AI_MODEL,
        contents: `Please provide a calm, structured educational explanation for this user-confirmed summary:\n${minimalPrompt}`,
        config: {
          systemInstruction,
        },
      });

      const answer = response.text?.trim();
      if (!answer) {
        res.status(502).json({
          error: 'The AI provider returned an empty response. Please try again.',
        });
        return;
      }

      res.json({
        answer,
        provider: AI_PROVIDER_LABEL,
        model: AI_MODEL,
        rateLimitRemaining: rate.remaining,
      });
    } catch {
      res.status(500).json({
        error: 'Unable to complete the AI Guide request right now. Please try again later.',
      });
    }
  });

  // Short-lived signed URL generator for private Supabase Storage files
  app.post('/api/storage/signed-url', async (req: Request, res: Response) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const authHeader = req.headers.authorization;
    const storagePath = typeof req.body?.storagePath === 'string' ? req.body.storagePath.trim() : '';

    if (!supabaseUrl || !serviceKey || serviceKey === 'YOUR_SUPABASE_SERVICE_ROLE_KEY') {
      res.status(503).json({
        error: 'Server-side private storage signing is not configured.',
      });
      return;
    }

    if (!authHeader?.startsWith('Bearer ') || !storagePath) {
      res.status(401).json({ error: 'Authenticated bearer token and storage path required.' });
      return;
    }

    const token = authHeader.slice('Bearer '.length);
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: userRes, error: userErr } = await adminClient.auth.getUser(token);

    if (userErr || !userRes?.user) {
      res.status(401).json({ error: 'Invalid or expired user session.' });
      return;
    }

    if (!storagePath.startsWith(`${userRes.user.id}/`)) {
      res.status(403).json({ error: 'Access denied for the requested private file.' });
      return;
    }

    const { data, error } = await adminClient.storage
      .from('wellnest-reports')
      .createSignedUrl(storagePath, 60);

    if (error || !data?.signedUrl) {
      res.status(404).json({ error: 'Unable to generate short-lived file link.' });
      return;
    }

    res.json({ signedUrl: data.signedUrl, expiresInSeconds: 60 });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Wellnest server listening on http://localhost:${PORT}`);
  });
}

startServer();
