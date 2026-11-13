import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Search,
  Sparkles,
} from 'lucide-react';
import { createShortLivedReportLink } from '../lib/supabase';
import type {
  AppView,
  ExtractedFinding,
  ReportRecord,
} from '../types/wellnest';
import {
  canCompareLabValues,
  evaluateBiomarkerAgainstReportRange,
  getRangeStatusLabel,
} from '../utils/wellnestLogic';
import { DietPlanSection } from './DietPlanSection';
import { SafetyDisclaimer } from './SafetyDisclaimer';

interface InsightsViewProps {
  reports: ReportRecord[];
  onConfirmFinding: (reportId: string, findingId: string) => void;
  onNavigate: (view: AppView) => void;
}

function buildEducationalSuggestion(finding: ExtractedFinding): string {
  if (!finding.confirmedByUser) {
    return 'Awaiting your confirmation against the original report before educational context is shown.';
  }

  if (finding.category === 'interpreted_genetic') {
    return (
      finding.clinicalInterpretation ||
      'Professionally interpreted risk context only. Do not alter medications or start supplements based on genetic findings without consulting your prescribing clinician or genetic counselor.'
    );
  }

  const name = finding.testName.toLowerCase();
  if (finding.rangeStatus === 'within_range') {
    return "This value sits within this report's reference range. Continue steady, balanced daily routines and bring routine labs to regular checkups.";
  }

  if (name.includes('vitamin d')) {
    return "This result is outside this report's reference range. Ask your clinician whether sensible daylight habits, vitamin-D-containing foods (like fortified dairy/fish), or a personalized supplement check make sense for you.";
  }

  if (name.includes('ldl') || name.includes('triglyceride') || name.includes('cholesterol')) {
    return "This value is outside this report's reference range. Gradual adjustments—such as adding soluble fiber (oats, legumes, vegetables), choosing unsaturated fats, and gentle regular walking if cleared by your clinician—are worth discussing at your next visit. Never change prescribed medications without medical advice.";
  }

  return "This value is outside this report's reference range. Because reference intervals vary by lab and individual context, review this result with a qualified clinician before making major dietary, supplement, or exercise changes.";
}

export function InsightsView({
  reports,
  onConfirmFinding,
  onNavigate,
}: InsightsViewProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'lab' | 'genetic'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [linkStatus, setLinkStatus] = useState<string | null>(null);

  const allFindings = useMemo(
    () =>
      reports.flatMap((r) =>
        r.findings.map((f) => ({
          finding: f,
          report: r,
        })),
      ),
    [reports],
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allFindings.filter(({ finding, report }) => {
      if (filter === 'pending' && finding.confirmedByUser) return false;
      if (filter === 'lab' && finding.category !== 'lab') return false;
      if (filter === 'genetic' && finding.category !== 'interpreted_genetic')
        return false;
      if (!q) return true;
      return (
        finding.testName.toLowerCase().includes(q) ||
        report.title.toLowerCase().includes(q) ||
        finding.result.toLowerCase().includes(q)
      );
    });
  }, [allFindings, filter, searchQuery]);

  // Unit & Range Comparison Safety Check between any two confirmed lab findings of same name
  const comparisonPairs = useMemo(() => {
    const confirmedLabs = allFindings
      .map((x) => x.finding)
      .filter((f) => f.confirmedByUser && f.category === 'lab');

    const grouped = new Map<string, ExtractedFinding[]>();
    for (const f of confirmedLabs) {
      const key = f.testName.trim().toLowerCase();
      const arr = grouped.get(key) ?? [];
      arr.push(f);
      grouped.set(key, arr);
    }

    const pairs: Array<{
      testName: string;
      comparable: boolean;
      reason?: string;
    }> = [];
    for (const [name, list] of grouped.entries()) {
      if (list.length >= 2) {
        const res = canCompareLabValues(list[0], list[1]);
        pairs.push({
          testName: list[0].testName || name,
          comparable: res.comparable,
          reason: res.reason,
        });
      }
    }
    return pairs;
  }, [allFindings]);

  const handleOpenPrivateFile = async (storagePath: string) => {
    setLinkStatus(null);
    const res = await createShortLivedReportLink(storagePath, 60);
    if (res.error) {
      setLinkStatus(res.error);
      return;
    }
    if (res.signedUrl) {
      setLinkStatus('Generated 60-second short-lived private link.');
      // Render clickable anchor instead of window.open per runtime constraints
      const anchor = document.createElement('a');
      anchor.href = res.signedUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.click();
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 pb-12 space-y-8">
      <SafetyDisclaimer compact />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#F2F6F3]">
            Results &amp; Educational Insights
          </h1>
          <p className="mt-1 text-sm text-[#A7BBB1]">
            Every value is shown with its unit, date, and the specific report&apos;s reference range—never diagnostic labels.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('ai-guide')}
          className="inline-flex items-center gap-2 rounded-lg bg-[#E87A3D] px-4 py-2.5 text-xs font-semibold text-[#09120F] hover:bg-[#F28D54] whitespace-nowrap shrink-0"
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          <span>Discuss Confirmed Results in AI Guide</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Filter report results"
          className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#0B1713] border border-white/10"
        >
          {(
            [
              { id: 'all', label: 'All Items' },
              { id: 'pending', label: 'Needs Confirmation' },
              { id: 'lab', label: 'Lab Tests' },
              { id: 'genetic', label: 'Interpreted Genetics' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={filter === tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                filter === tab.id
                  ? 'bg-[#1A3329] text-[#F2F6F3]'
                  : 'text-[#A7BBB1] hover:text-[#F2F6F3]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search
            className="w-4 h-4 text-[#8FA89C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Search test names or reports"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tests..."
            className="w-full rounded-lg border border-white/15 bg-[#0A1511] pl-9 pr-3 py-2 text-xs text-[#F2F6F3] placeholder:text-[#6E857A] focus:outline-none focus:ring-2 focus:ring-[#E87A3D]"
          />
        </div>
      </div>

      {linkStatus && (
        <div
          role="status"
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs text-[#C8D7CF]"
        >
          {linkStatus}
        </div>
      )}

      {comparisonPairs.length > 0 && (
        <section className="wn-glass-subtle rounded-xl p-4 space-y-2">
          <h2 className="font-display text-xs font-semibold text-[#F2F6F3]">
            Unit &amp; Reference-Range Comparison Check
          </h2>
          {comparisonPairs.map((pair) => (
            <p key={pair.testName} className="text-xs text-[#B6C8BE]">
              <strong className="text-[#F2F6F3]">{pair.testName}:</strong>{' '}
              {pair.comparable
                ? 'Units and lab reference ranges match across reports.'
                : pair.reason}
            </p>
          ))}
        </section>
      )}

      {/* Results List */}
      {filtered.length === 0 ? (
        <div className="wn-glass rounded-2xl p-10 text-center space-y-3">
          <p className="text-sm text-[#B6C8BE]">
            No report findings match this filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilter('all');
              setSearchQuery('');
            }}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-[#F2F6F3] hover:bg-white/10"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(({ finding, report }) => {
            const evalCheck = evaluateBiomarkerAgainstReportRange(
              finding.result,
              finding.unit,
              finding.referenceRange,
              finding.category,
            );
            const displayStatus = finding.confirmedByUser
              ? evalCheck.status
              : 'needs_review';

            return (
              <article
                key={finding.id}
                className="wn-glass rounded-2xl p-6 space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#9BB0A5]">
                      <span>{report.title}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">{finding.reportDate}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {finding.category === 'lab'
                          ? 'Clinical Lab'
                          : 'Interpreted Genetics'}
                      </span>
                      {finding.isDemo && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#F28D54]">Demo Data</span>
                        </>
                      )}
                    </div>

                    <h2 className="font-display text-lg font-semibold text-[#F2F6F3]">
                      {finding.testName}
                    </h2>
                  </div>

                  <div className="md:text-right shrink-0">
                    <p className="font-mono-tabular text-xl font-semibold text-[#F2F6F3]">
                      {finding.result}{' '}
                      <span className="text-sm font-normal text-[#A7BBB1]">
                        {finding.unit}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs font-mono-tabular text-[#9BB0A5]">
                      Report range: {finding.referenceRange || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5">
                    <p
                      className={`text-xs font-semibold ${
                        displayStatus === 'within_range'
                          ? 'text-[#34D399]'
                          : displayStatus === 'outside_range'
                            ? 'text-[#F28D54]'
                            : displayStatus === 'interpreted_finding'
                              ? 'text-[#93C5FD]'
                              : 'text-[#FBBF24]'
                      }`}
                    >
                      {getRangeStatusLabel(displayStatus)}
                    </p>
                    <p className="text-xs text-[#C8D7CF] leading-relaxed max-w-3xl">
                      {buildEducationalSuggestion(finding)}
                    </p>
                    {finding.uncertaintyReason && !finding.confirmedByUser && (
                      <p className="text-xs text-[#FDE68A]">
                        Note: {finding.uncertaintyReason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!finding.confirmedByUser && (
                      <button
                        type="button"
                        onClick={() => onConfirmFinding(report.id, finding.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#34D399] px-3.5 py-2 text-xs font-semibold text-[#09120F] hover:opacity-90 whitespace-nowrap"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Confirm Accuracy</span>
                      </button>
                    )}

                    {report.storagePath && (
                      <button
                        type="button"
                        onClick={() => handleOpenPrivateFile(report.storagePath!)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-[#F2F6F3] hover:bg-white/10 whitespace-nowrap"
                      >
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>60s Private File Link</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <DietPlanSection
        findings={allFindings.map((item) => item.finding)}
        onNavigate={onNavigate}
      />
    </div>
  );
}
