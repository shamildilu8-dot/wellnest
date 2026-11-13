import { useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Lock,
  Send,
  ShieldCheck,
} from 'lucide-react';
import type {
  AiChatMessage,
  ConsentPreferences,
  HealthApiStatus,
  ReportRecord,
  WellbeingCheckIn,
} from '../types/wellnest';
import {
  buildMinimalAiPayload,
  type MinimalAiContextPayload,
} from '../utils/wellnestLogic';
import { SafetyDisclaimer } from './SafetyDisclaimer';

interface AiGuideViewProps {
  reports: ReportRecord[];
  checkIns: WellbeingCheckIn[];
  apiStatus: HealthApiStatus | null;
  consents: ConsentPreferences;
}

export function AiGuideView({
  reports,
  checkIns,
  apiStatus,
  consents,
}: AiGuideViewProps) {
  const confirmedFindings = reports
    .flatMap((r) => r.findings)
    .filter((f) => f.confirmedByUser);

  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const item of confirmedFindings.slice(0, 3)) {
      init[item.id] = true;
    }
    return init;
  });

  const [includeCheckIn, setIncludeCheckIn] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Per-request explicit consent modal state
  const [pendingConsentPayload, setPendingConsentPayload] =
    useState<MinimalAiContextPayload | null>(null);

  const aiAvailable = Boolean(
    apiStatus?.aiConfigured && apiStatus?.aiDataControlsVerified,
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrepareRequest = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const chosen = confirmedFindings.filter((f) => selectedIds[f.id]);
    if (chosen.length === 0) {
      setErrorMsg(
        'Select at least one confirmed report item so the AI Guide knows what to explain.',
      );
      return;
    }

    if (!question.trim()) {
      setErrorMsg('Enter an educational question about your selected report values.');
      return;
    }

    const latestCheckIn =
      includeCheckIn && consents.allowWellbeingCheckIns ? checkIns[0] : undefined;

    const minimalPayload = buildMinimalAiPayload(chosen, question, latestCheckIn);
    setPendingConsentPayload(minimalPayload);
  };

  const handleConfirmAndSend = async () => {
    if (!pendingConsentPayload) return;
    const payloadToSend = pendingConsentPayload;
    setPendingConsentPayload(null);

    const userMessage: AiChatMessage = {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      content: payloadToSend.question,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ai/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consentConfirmed: true,
          payload: payloadToSend,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'AI Guide request failed.');
        return;
      }

      const assistantMsg: AiChatMessage = {
        id: `msg-a-${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        providerLabel: `${data.provider} · ${data.model}`,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setErrorMsg('Network error reaching AI Guide endpoint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 pb-12 space-y-8">
      <SafetyDisclaimer />

      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#F2F6F3]">
          Wellnest AI Guide
        </h1>
        <p className="mt-1 text-sm text-[#A7BBB1]">
          Cautious educational explanations for confirmed report items. Every request requires your explicit approval of the exact data shared.
        </p>
      </div>

      {/* Server AI Status Banner */}
      {!aiAvailable && (
        <div
          role="status"
          className="wn-glass rounded-xl p-5 border-[#FBBF24]/35 space-y-2"
        >
          <div className="flex items-center gap-2 text-[#FDE68A] text-sm font-semibold">
            <Lock className="w-4 h-4" aria-hidden="true" />
            <span>
              {!apiStatus?.aiConfigured
                ? 'AI Guide is disabled until GEMINI_API_KEY is configured'
                : 'AI Guide is paused pending verified provider data-use controls'}
            </span>
          </div>
          <p className="text-xs text-[#C8D7CF] leading-relaxed">
            {!apiStatus?.aiConfigured
              ? 'No server-side GEMINI_API_KEY was detected. Set GEMINI_API_KEY and AI_DATA_CONTROLS_VERIFIED=true on the server (see README.md). All report upload, confirmation, and non-AI educational insights remain fully usable.'
              : 'GEMINI_API_KEY is present on the server, but AI_DATA_CONTROLS_VERIFIED is not set to true. Wellnest does not send health information until your operator verifies appropriate provider data-use controls.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Minimal Data Selection */}
        <aside className="lg:col-span-5 wn-glass rounded-2xl p-6 space-y-4">
          <h2 className="font-display text-base font-semibold text-[#F2F6F3]">
            1. Select Confirmed Items to Share
          </h2>
          <p className="text-xs text-[#A7BBB1]">
            Only confirmed test names, values, units, dates, and reference ranges are included. Filenames, emails, and unconfirmed rows are excluded.
          </p>

          {confirmedFindings.length === 0 ? (
            <p className="text-xs text-[#FDE68A]">
              No confirmed items yet. Confirm at least one finding in Upload or Results first.
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {confirmedFindings.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-[#0A1511]/70 p-3 cursor-pointer hover:border-white/25"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(selectedIds[item.id])}
                    onChange={() => toggleSelect(item.id)}
                    className="mt-0.5 accent-[#E87A3D]"
                  />
                  <div className="text-xs">
                    <p className="font-medium text-[#F2F6F3]">{item.testName}</p>
                    <p className="text-[#9BB0A5] font-mono-tabular">
                      {item.result} {item.unit} · Ref: {item.referenceRange}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {checkIns.length > 0 && consents.allowWellbeingCheckIns && (
            <label className="flex items-start gap-2.5 pt-2 border-t border-white/10 text-xs text-[#C8D7CF] cursor-pointer">
              <input
                type="checkbox"
                checked={includeCheckIn}
                onChange={(e) => setIncludeCheckIn(e.target.checked)}
                className="mt-0.5 accent-[#E87A3D]"
              />
              <span>
                Include latest self-reported wellbeing check-in scores ({checkIns[0].date})
              </span>
            </label>
          )}
        </aside>

        {/* Right column: Question & Responses */}
        <section className="lg:col-span-7 wn-glass rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-base font-semibold text-[#F2F6F3]">
              2. Educational Q&amp;A
            </h2>
            <span className="text-xs text-[#9BB0A5]">
              Provider: {apiStatus?.aiProvider ?? 'Google Gemini API (server-side)'}
            </span>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl border border-[#F87171]/40 bg-[#3B1517]/60 p-3.5 text-xs text-[#FECACA] flex items-start gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-4 min-h-[220px] max-h-[420px] overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-[#0A1511]/50 p-5 text-xs text-[#A7BBB1] space-y-2.5">
                <p className="font-medium text-[#F2F6F3]">
                  Suggested educational questions (click to use):
                </p>
                <div className="space-y-1.5">
                  {[
                    "What questions should I ask my doctor about my Vitamin D result being outside this report's range?",
                    'Can you explain what CYP2C19 Intermediate Metabolizer means as general risk context?',
                    'What gradual food or daily habit ideas are generally worth discussing with a clinician?',
                  ].map((promptText) => (
                    <button
                      key={promptText}
                      type="button"
                      onClick={() => setQuestion(promptText)}
                      className="block w-full text-left rounded-lg px-2.5 py-1.5 text-[#C8D7CF] hover:bg-white/5 hover:text-[#F2F6F3] transition-colors"
                    >
                      · &ldquo;{promptText}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-xl p-4 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#1A3329]/80 border border-white/10 text-[#F2F6F3] ml-6'
                      : 'bg-[#0A1511]/90 border border-white/10 text-[#D7E4DD] mr-6'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5 text-[11px] text-[#8FA89C]">
                    <span>{msg.role === 'user' ? 'You' : 'Wellnest AI Guide'}</span>
                    <span className="font-mono-tabular">{msg.timestamp}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.providerLabel && (
                    <p className="mt-2 pt-2 border-t border-white/10 text-[11px] text-[#7F998D]">
                      Educational context only · Generated via {msg.providerLabel}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          <form onSubmit={handlePrepareRequest} className="space-y-3 pt-2 border-t border-white/10">
            <label htmlFor="ai-question" className="sr-only">
              Ask an educational question about your confirmed findings
            </label>
            <textarea
              id="ai-question"
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask for a cautious educational explanation or questions to bring to your clinician..."
              className="w-full rounded-xl border border-white/15 bg-[#0A1511] p-3 text-sm text-[#F2F6F3] placeholder:text-[#6E857A] focus:outline-none focus:ring-2 focus:ring-[#E87A3D]"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] text-[#8FA89C]">
                You will be asked to review and approve the exact payload before sending.
              </p>
              <button
                type="submit"
                disabled={loading || confirmedFindings.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-[#E87A3D] px-4 py-2.5 text-xs font-semibold text-[#09120F] hover:bg-[#F28D54] disabled:opacity-45 transition-colors whitespace-nowrap shrink-0"
              >
                <Send className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{loading ? 'Generating...' : 'Review & Request Explanation'}</span>
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* Explicit Per-Request AI Consent Modal */}
      {pendingConsentPayload && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-consent-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
        >
          <div className="wn-glass rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-[#34D399]">
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              <h2
                id="ai-consent-title"
                className="font-display text-lg font-semibold text-[#F2F6F3]"
              >
                Confirm Data Sent to AI Provider
              </h2>
            </div>

            <p className="text-xs text-[#C8D7CF] leading-relaxed">
              Before sending this request, please review the exact minimum confirmed information that will be transmitted to{' '}
              <strong className="text-white">
                {apiStatus?.aiProvider ?? 'Google Gemini API'} ({apiStatus?.aiModel ?? 'gemini-4-hydrogen'})
              </strong>{' '}
              via Wellnest&apos;s server route. Do not assume provider training exclusion unless your operator has verified a zero-retention/paid data agreement.
            </p>

            {!aiAvailable && (
              <div className="rounded-xl border border-[#FBBF24]/35 bg-[#3B2A12]/50 p-3 text-xs text-[#FDE68A]">
                Sending is currently disabled because{' '}
                {!apiStatus?.aiConfigured
                  ? 'GEMINI_API_KEY is not configured on the server.'
                  : 'AI_DATA_CONTROLS_VERIFIED is not set to true on the server.'}{' '}
                No data will leave your browser.
              </div>
            )}

            <div className="rounded-xl border border-white/15 bg-[#09120F] p-3.5 max-h-56 overflow-y-auto">
              <pre className="text-[11px] font-mono-tabular text-[#D7E4DD] whitespace-pre-wrap">
                {JSON.stringify(pendingConsentPayload, null, 2)}
              </pre>
            </div>

            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingConsentPayload(null)}
                className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-[#F2F6F3] hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!aiAvailable}
                onClick={handleConfirmAndSend}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#E87A3D] px-4 py-2 text-xs font-semibold text-[#09120F] hover:bg-[#F28D54] disabled:opacity-45"
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>Approve &amp; Send Request</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
