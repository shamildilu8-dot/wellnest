import { useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileUp,
  Plus,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import {
  SAMPLE_INTERPRETED_GENETIC_JSON,
  SAMPLE_LAB_PASTE_TEXT,
} from '../data/demoData';
import { isSupabaseConfigured, uploadPrivateReportFile } from '../lib/supabase';
import type {
  ConsentPreferences,
  ExtractedFinding,
  HealthApiStatus,
  ReportCategory,
  ReportRecord,
  UserProfile,
} from '../types/wellnest';
import {
  detectRawDnaContent,
  evaluateBiomarkerAgainstReportRange,
  getRangeStatusLabel,
  parseLabReportText,
  validateUploadFile,
} from '../utils/wellnestLogic';
import { SafetyDisclaimer } from './SafetyDisclaimer';

interface UploadViewProps {
  user: UserProfile;
  apiStatus: HealthApiStatus | null;
  consents: ConsentPreferences;
  onSaveReport: (report: ReportRecord) => void;
  onNavigateToInsights: () => void;
}

export function UploadView({
  user,
  apiStatus,
  consents,
  onSaveReport,
  onNavigateToInsights,
}: UploadViewProps) {
  const [category, setCategory] = useState<ReportCategory>('lab');
  const [title, setTitle] = useState('');
  const [labName, setLabName] = useState('');
  const [reportDate, setReportDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [pastedText, setPastedText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [useAiForBinary, setUseAiForBinary] = useState(false);

  const [extracting, setExtracting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  const [draftReportId, setDraftReportId] = useState<string | null>(null);
  const [draftFindings, setDraftFindings] = useState<ExtractedFinding[]>([]);
  const [confirmedChecked, setConfirmedChecked] = useState<Record<string, boolean>>({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  const aiReady = Boolean(
    apiStatus?.aiConfigured &&
      apiStatus?.aiDataControlsVerified &&
      consents.allowAiReportExtraction,
  );

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setNoticeMsg(null);
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const validation = validateUploadFile(file.name, file.type, file.size);
    if (!validation.valid) {
      setSelectedFile(null);
      setErrorMsg(validation.error ?? 'Invalid file.');
      return;
    }

    // Immediate client-side Raw DNA screening for text files
    if (
      file.type.startsWith('text/') ||
      file.type === 'application/json' ||
      /\.(txt|csv|json|vcf)$/i.test(file.name)
    ) {
      const text = await file.text();
      const rawCheck = detectRawDnaContent(text, file.name);
      if (rawCheck.isRawDna) {
        setSelectedFile(null);
        setErrorMsg(rawCheck.reason ?? 'Raw DNA files are not supported.');
        return;
      }
      setPastedText(text);
    } else {
      const rawNameCheck = detectRawDnaContent('', file.name);
      if (rawNameCheck.isRawDna) {
        setSelectedFile(null);
        setErrorMsg(rawNameCheck.reason ?? 'Raw DNA files are not supported.');
        return;
      }
    }

    setSelectedFile(file);
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleLoadSample = (targetCategory: ReportCategory) => {
    setErrorMsg(null);
    setNoticeMsg(null);
    setSelectedFile(null);
    setCategory(targetCategory);
    if (targetCategory === 'lab') {
      setTitle('Sample Blood Panel (Demo)');
      setLabName('Sample Diagnostics Lab');
      setPastedText(SAMPLE_LAB_PASTE_TEXT);
    } else {
      setTitle('Sample Interpreted Pharmacogenomic Summary (Demo)');
      setLabName('Clinical Genetics Reference Lab');
      setPastedText(SAMPLE_INTERPRETED_GENETIC_JSON);
    }
  };

  const handleExtract = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setNoticeMsg(null);
    setSavedSuccess(false);

    if (!selectedFile && !pastedText.trim()) {
      setErrorMsg('Please select a valid report file or paste structured report text.');
      return;
    }

    const rawCheck = detectRawDnaContent(pastedText, selectedFile?.name ?? '');
    if (rawCheck.isRawDna) {
      setErrorMsg(rawCheck.reason ?? 'Raw DNA files cannot be analyzed.');
      return;
    }

    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('reportDate', reportDate);
      formData.append('allowAiExtraction', String(useAiForBinary && aiReady));
      if (pastedText.trim()) {
        formData.append('rawText', pastedText);
      }
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const res = await fetch('/api/reports/parse', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        // Fallback to local deterministic parser if text was provided
        if (pastedText.trim()) {
          const fallbackId = `rep-${Date.now()}`;
          const parsed = parseLabReportText(pastedText, reportDate, category, fallbackId);
          if (parsed.length > 0) {
            setDraftReportId(fallbackId);
            setDraftFindings(parsed);
            setConfirmedChecked({});
            return;
          }
        }
        setErrorMsg(data.error || 'Could not extract report rows.');
        return;
      }

      setDraftReportId(data.reportId);
      setDraftFindings(data.findings ?? []);
      setConfirmedChecked({});
      if (data.notice) {
        setNoticeMsg(data.notice);
      }
    } catch {
      setErrorMsg('Network error while processing report. Please try again.');
    } finally {
      setExtracting(false);
    }
  };

  const handleUpdateFinding = (
    id: string,
    field: keyof ExtractedFinding,
    value: string,
  ) => {
    setDraftFindings((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        const evalRes = evaluateBiomarkerAgainstReportRange(
          updated.result,
          updated.unit,
          updated.referenceRange,
          updated.category,
        );
        const missingRequired =
          !updated.testName.trim() ||
          !updated.result.trim() ||
          !updated.reportDate.trim() ||
          (updated.category === 'lab' &&
            (!updated.unit.trim() || !updated.referenceRange.trim()));
        return {
          ...updated,
          uncertain: missingRequired || evalRes.status === 'needs_review',
          uncertaintyReason: missingRequired
            ? 'Complete test name, result, unit, date, and reference range.'
            : evalRes.status === 'needs_review'
              ? evalRes.explanation
              : undefined,
          rangeStatus:
            missingRequired && updated.category === 'lab'
              ? 'needs_review'
              : evalRes.status,
        };
      }),
    );
  };

  const handleAddBlankRow = () => {
    const repId = draftReportId || `rep-${Date.now()}`;
    if (!draftReportId) setDraftReportId(repId);
    const newRow: ExtractedFinding = {
      id: `${repId}-f-${Date.now()}`,
      reportId: repId,
      category,
      testName: '',
      result: '',
      unit: category === 'lab' ? '' : 'Clinical interpretation',
      reportDate,
      referenceRange:
        category === 'lab' ? '' : 'Interpreted by clinical geneticist',
      rangeStatus: category === 'lab' ? 'needs_review' : 'interpreted_finding',
      uncertain: true,
      uncertaintyReason: 'Manually added row—please enter values and confirm.',
      confirmedByUser: false,
    };
    setDraftFindings((prev) => [...prev, newRow]);
  };

  const handleRemoveRow = (id: string) => {
    setDraftFindings((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveReport = async () => {
    setErrorMsg(null);
    if (draftFindings.length === 0) {
      setErrorMsg('Add or extract at least one finding before saving.');
      return;
    }

    const preparedFindings = draftFindings.map((f) => {
      const isConfirmed = Boolean(confirmedChecked[f.id]);
      const hasAllFields =
        Boolean(f.testName.trim()) &&
        Boolean(f.result.trim()) &&
        Boolean(f.reportDate.trim()) &&
        (f.category === 'interpreted_genetic' ||
          (Boolean(f.unit.trim()) && Boolean(f.referenceRange.trim())));

      return {
        ...f,
        confirmedByUser: isConfirmed && hasAllFields,
        uncertain: !isConfirmed || !hasAllFields,
        isDemo: user.mode === 'demo' && !selectedFile,
      };
    });

    const anyConfirmed = preparedFindings.some((f) => f.confirmedByUser);
    if (!anyConfirmed) {
      setErrorMsg(
        'Please review and check the confirmation box on at least one complete row before saving.',
      );
      return;
    }

    const repId = draftReportId || `rep-${Date.now()}`;
    let storagePath: string | undefined;

    if (
      selectedFile &&
      user.mode === 'authenticated' &&
      isSupabaseConfigured &&
      consents.storeConfirmedReports
    ) {
      const uploadRes = await uploadPrivateReportFile(user.id, repId, selectedFile);
      if (uploadRes.error) {
        setNoticeMsg(
          `Report values saved, but private file upload reported: ${uploadRes.error}`,
        );
      } else {
        storagePath = uploadRes.path;
      }
    }

    const newReport: ReportRecord = {
      id: repId,
      title:
        title.trim() ||
        (category === 'lab'
          ? 'Uploaded Lab Report'
          : 'Interpreted Genetic Report'),
      category,
      reportDate,
      labOrProviderName: labName.trim() || 'User-provided report',
      fileName: selectedFile?.name ?? 'text-entry.txt',
      fileType: selectedFile?.type ?? 'text/plain',
      fileSizeBytes:
        selectedFile?.size ?? new TextEncoder().encode(pastedText || 'entry').length,
      storagePath,
      uploadedAt: new Date().toISOString(),
      isDemo: user.mode === 'demo' && !selectedFile,
      findings: preparedFindings,
    };

    onSaveReport(newReport);
    setSavedSuccess(true);
    setDraftFindings([]);
    setDraftReportId(null);
    setPastedText('');
    setSelectedFile(null);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 pb-12 space-y-8">
      <SafetyDisclaimer compact />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#F2F6F3]">
            Upload &amp; Confirm Report Values
          </h1>
          <p className="mt-1 text-sm text-[#A7BBB1]">
            Extract test names, results, units, dates, and each report&apos;s own reference ranges. Uncertain extractions always require your confirmation.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleLoadSample('lab')}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-[#E2EBE6] hover:bg-white/10 whitespace-nowrap shrink-0"
          >
            Load Sample Lab Text
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('interpreted_genetic')}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-[#E2EBE6] hover:bg-white/10 whitespace-nowrap shrink-0"
          >
            Load Sample Genetic JSON
          </button>
        </div>
      </div>

      {/* Raw DNA Safeguard Notice */}
      <div className="wn-glass-subtle rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-[#F28D54] shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-xs text-[#C8D7CF] leading-relaxed">
          <strong className="text-[#F2F6F3] font-semibold">
            Raw DNA Files Prohibited:
          </strong>{' '}
          Wellnest accepts standard clinical lab reports and <em>professionally interpreted</em> genetic reports only. Raw SNP genotype files (23andMe, AncestryDNA, MyHeritage, VCF) are blocked and never analyzed.
        </div>
      </div>

      {savedSuccess && (
        <div
          role="status"
          className="rounded-xl border border-[#34D399]/40 bg-[#123024]/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2 text-sm text-[#A7F3D0]">
            <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>Confirmed report values saved to your workspace.</span>
          </div>
          <button
            type="button"
            onClick={onNavigateToInsights}
            className="rounded-lg bg-[#34D399] px-4 py-2 text-xs font-semibold text-[#09120F] hover:opacity-90 whitespace-nowrap shrink-0"
          >
            View Results &amp; Insights
          </button>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="rounded-xl border border-[#F87171]/40 bg-[#3B1517]/60 p-4 flex items-start gap-3 text-xs text-[#FECACA]"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      {noticeMsg && (
        <div
          role="status"
          className="rounded-xl border border-[#FBBF24]/35 bg-[#3B2A12]/40 p-4 text-xs text-[#FDE68A]"
        >
          {noticeMsg}
        </div>
      )}

      {/* Upload & Metadata Form */}
      <form
        onSubmit={handleExtract}
        className="wn-glass rounded-2xl p-6 sm:p-8 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <span className="block text-xs font-medium text-[#C8D7CF] mb-2">
              Report Type
            </span>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-[#0A1511] border border-white/10">
              <button
                type="button"
                onClick={() => setCategory('lab')}
                className={`py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                  category === 'lab'
                    ? 'bg-[#1A3329] text-[#F2F6F3]'
                    : 'text-[#A7BBB1] hover:text-[#F2F6F3]'
                }`}
              >
                Lab Report
              </button>
              <button
                type="button"
                onClick={() => setCategory('interpreted_genetic')}
                className={`py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                  category === 'interpreted_genetic'
                    ? 'bg-[#1A3329] text-[#F2F6F3]'
                    : 'text-[#A7BBB1] hover:text-[#F2F6F3]'
                }`}
              >
                Interpreted Genetic
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="report-date"
              className="block text-xs font-medium text-[#C8D7CF] mb-2"
            >
              Report Date
            </label>
            <input
              id="report-date"
              type="date"
              required
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-[#0A1511] px-3.5 py-2 text-sm text-[#F2F6F3] font-mono-tabular focus:outline-none focus:ring-2 focus:ring-[#E87A3D]"
            />
          </div>

          <div>
            <label
              htmlFor="report-title"
              className="block text-xs font-medium text-[#C8D7CF] mb-1.5"
            >
              Report Title
            </label>
            <input
              id="report-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual Metabolic & Lipid Panel"
              className="w-full rounded-lg border border-white/15 bg-[#0A1511] px-3.5 py-2.5 text-sm text-[#F2F6F3] placeholder:text-[#6E857A] focus:outline-none focus:ring-2 focus:ring-[#E87A3D]"
            />
          </div>

          <div>
            <label
              htmlFor="report-lab"
              className="block text-xs font-medium text-[#C8D7CF] mb-1.5"
            >
              Laboratory or Clinical Genetics Provider
            </label>
            <input
              id="report-lab"
              type="text"
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
              placeholder="e.g. Quest / Clinical Genomics Center"
              className="w-full rounded-lg border border-white/15 bg-[#0A1511] px-3.5 py-2.5 text-sm text-[#F2F6F3] placeholder:text-[#6E857A] focus:outline-none focus:ring-2 focus:ring-[#E87A3D]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="report-file"
              className="block text-xs font-medium text-[#C8D7CF] mb-2"
            >
              Upload File (PDF, PNG, JPG, TXT, CSV, JSON · Max 10 MB)
            </label>
            <label
              htmlFor="report-file"
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-[#0A1511]/70 px-4 py-6 text-center cursor-pointer hover:border-[#E87A3D]/60 transition-colors"
            >
              <FileUp className="w-6 h-6 text-[#F28D54]" aria-hidden="true" />
              <span className="text-xs font-medium text-[#F2F6F3]">
                {selectedFile
                  ? `${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)`
                  : 'Choose a report file from your device'}
              </span>
              <span className="text-[11px] text-[#8FA89C]">
                Stored privately per account when Supabase is configured
              </span>
              <input
                id="report-file"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,.json"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
          </div>

          <div>
            <label
              htmlFor="report-paste"
              className="block text-xs font-medium text-[#C8D7CF] mb-2"
            >
              Or Paste Report Lines (e.g. Test: Result Unit (Ref: Min - Max))
            </label>
            <textarea
              id="report-paste"
              rows={5}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Vitamin D (25-OH): 24 ng/mL (Ref: 30 - 100)"
              className="w-full rounded-xl border border-white/15 bg-[#0A1511] p-3 text-xs font-mono-tabular text-[#F2F6F3] placeholder:text-[#6E857A] focus:outline-none focus:ring-2 focus:ring-[#E87A3D]"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-white/10">
          <label className="flex items-start gap-2.5 text-xs text-[#B6C8BE]">
            <input
              type="checkbox"
              checked={useAiForBinary && aiReady}
              disabled={!aiReady}
              onChange={(e) => setUseAiForBinary(e.target.checked)}
              className="mt-0.5 accent-[#E87A3D]"
            />
            <span>
              Allow AI-assisted extraction for binary PDF/images via server Gemini route{' '}
              {!aiReady && (
                <span className="text-[#8FA89C]">
                  (Disabled until server GEMINI_API_KEY + data-use controls and Account Settings consent are active)
                </span>
              )}
            </span>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleAddBlankRow}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-medium text-[#F2F6F3] hover:bg-white/10 whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Add Row Manually</span>
            </button>

            <button
              type="submit"
              disabled={extracting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#E87A3D] px-5 py-2.5 text-xs font-semibold text-[#09120F] hover:bg-[#F28D54] disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <span>{extracting ? 'Extracting...' : 'Extract & Review Values'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Review & Confirmation Table */}
      {draftFindings.length > 0 && (
        <section
          aria-labelledby="confirm-table-heading"
          className="wn-glass rounded-2xl p-6 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2
                id="confirm-table-heading"
                className="font-display text-lg font-semibold text-[#F2F6F3]"
              >
                Confirm Extracted Report Values
              </h2>
              <p className="text-xs text-[#A7BBB1]">
                Verify every highlighted or uncertain field against your original report and check &ldquo;Confirmed&rdquo; before saving.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveReport}
              className="inline-flex items-center gap-2 rounded-lg bg-[#34D399] px-5 py-2.5 text-xs font-semibold text-[#09120F] hover:opacity-90 whitespace-nowrap shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>Save Confirmed Report</span>
            </button>
          </div>

          <div className="space-y-4">
            {draftFindings.map((item) => {
              const isConfirmed = Boolean(confirmedChecked[item.id]);
              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-4 space-y-3 ${
                    item.uncertain && !isConfirmed
                      ? 'border-[#FBBF24]/50 bg-[#2C200E]/40'
                      : 'border-white/10 bg-[#0A1511]/60'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-medium">
                      <span
                        className={
                          isConfirmed
                            ? 'text-[#34D399]'
                            : item.uncertain
                              ? 'text-[#FBBF24]'
                              : 'text-[#C8D7CF]'
                        }
                      >
                        {isConfirmed
                          ? 'Confirmed by user'
                          : item.uncertain
                            ? 'Uncertain extraction — review carefully'
                            : 'Awaiting your confirmation'}
                      </span>
                      <span className="text-[#6E857A]">{' · '}</span>
                      <span className="text-[#9BB0A5]">
                        {getRangeStatusLabel(item.rangeStatus)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveRow(item.id)}
                      aria-label={`Remove ${item.testName || 'row'}`}
                      className="text-xs text-[#FCA5A5] hover:underline inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Remove</span>
                    </button>
                  </div>

                  {item.uncertaintyReason && (
                    <p className="text-xs text-[#FDE68A]">{item.uncertaintyReason}</p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#9BB0A5] mb-1">
                        Test / Marker Name
                      </label>
                      <input
                        type="text"
                        value={item.testName}
                        onChange={(e) =>
                          handleUpdateFinding(item.id, 'testName', e.target.value)
                        }
                        className="w-full rounded-lg border border-white/15 bg-[#09120F] px-3 py-2 text-xs text-[#F2F6F3]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#9BB0A5] mb-1">
                        Result
                      </label>
                      <input
                        type="text"
                        value={item.result}
                        onChange={(e) =>
                          handleUpdateFinding(item.id, 'result', e.target.value)
                        }
                        className="w-full rounded-lg border border-white/15 bg-[#09120F] px-3 py-2 text-xs font-mono-tabular text-[#F2F6F3]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#9BB0A5] mb-1">
                        Unit
                      </label>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) =>
                          handleUpdateFinding(item.id, 'unit', e.target.value)
                        }
                        placeholder="e.g. ng/mL"
                        className="w-full rounded-lg border border-white/15 bg-[#09120F] px-3 py-2 text-xs font-mono-tabular text-[#F2F6F3]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#9BB0A5] mb-1">
                        Lab Reference Range
                      </label>
                      <input
                        type="text"
                        value={item.referenceRange}
                        onChange={(e) =>
                          handleUpdateFinding(
                            item.id,
                            'referenceRange',
                            e.target.value,
                          )
                        }
                        placeholder="e.g. 30 - 100"
                        className="w-full rounded-lg border border-white/15 bg-[#09120F] px-3 py-2 text-xs font-mono-tabular text-[#F2F6F3]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#9BB0A5] mb-1">
                        Report Date
                      </label>
                      <input
                        type="date"
                        value={item.reportDate}
                        onChange={(e) =>
                          handleUpdateFinding(item.id, 'reportDate', e.target.value)
                        }
                        className="w-full rounded-lg border border-white/15 bg-[#09120F] px-3 py-2 text-xs font-mono-tabular text-[#F2F6F3]"
                      />
                    </div>
                  </div>

                  {item.category === 'interpreted_genetic' && (
                    <div>
                      <label className="block text-[11px] text-[#9BB0A5] mb-1">
                        Professionally Interpreted Context
                      </label>
                      <input
                        type="text"
                        value={item.clinicalInterpretation ?? ''}
                        onChange={(e) =>
                          handleUpdateFinding(
                            item.id,
                            'clinicalInterpretation',
                            e.target.value,
                          )
                        }
                        placeholder="Summary from clinical genetics report (risk context only)"
                        className="w-full rounded-lg border border-white/15 bg-[#09120F] px-3 py-2 text-xs text-[#F2F6F3]"
                      />
                    </div>
                  )}

                  <label className="inline-flex items-center gap-2 pt-1 text-xs font-medium text-[#F2F6F3] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isConfirmed}
                      onChange={(e) =>
                        setConfirmedChecked((prev) => ({
                          ...prev,
                          [item.id]: e.target.checked,
                        }))
                      }
                      className="accent-[#34D399] w-4 h-4"
                    />
                    <span>
                      I confirm this test name, result, unit, date, and reference range match my original report
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
