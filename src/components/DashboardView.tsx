import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FilePlus2,
  Sparkles,
} from 'lucide-react';
import type {
  AppView,
  ReportRecord,
  UserProfile,
  WellbeingCheckIn,
} from '../types/wellnest';
import {
  getRangeStatusLabel,
  validateWellbeingCheckInInput,
} from '../utils/wellnestLogic';
import { DietPlanSection } from './DietPlanSection';
import { SafetyDisclaimer } from './SafetyDisclaimer';

interface DashboardViewProps {
  user: UserProfile;
  reports: ReportRecord[];
  checkIns: WellbeingCheckIn[];
  allowWellbeingCheckIns: boolean;
  onAddCheckIn: (checkIn: WellbeingCheckIn) => void;
  onNavigate: (view: AppView) => void;
}

export function DashboardView({
  user,
  reports,
  checkIns,
  allowWellbeingCheckIns,
  onAddCheckIn,
  onNavigate,
}: DashboardViewProps) {
  const [energy, setEnergy] = useState(4);
  const [sleep, setSleep] = useState(4);
  const [stress, setStress] = useState(2);
  const [sleepHoursInput, setSleepHoursInput] = useState('');
  const [movementMinutesInput, setMovementMinutesInput] = useState('');
  const [showDeviceReadings, setShowDeviceReadings] = useState(false);
  const [restingHrInput, setRestingHrInput] = useState('');
  const [systolicInput, setSystolicInput] = useState('');
  const [diastolicInput, setDiastolicInput] = useState('');
  const [moodNote, setMoodNote] = useState('');
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [checkInSaved, setCheckInSaved] = useState(false);

  const allFindings = reports.flatMap((r) => r.findings);
  const confirmedFindings = allFindings.filter((f) => f.confirmedByUser);
  const pendingFindings = allFindings.filter((f) => !f.confirmedByUser);
  const outsideRangeCount = confirmedFindings.filter(
    (f) => f.rangeStatus === 'outside_range',
  ).length;
  const geneticReportsCount = reports.filter(
    (r) => r.category === 'interpreted_genetic',
  ).length;

  const handleCheckInSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!allowWellbeingCheckIns) return;
    setCheckInError(null);
    setCheckInSaved(false);

    const validation = validateWellbeingCheckInInput({
      energyLevel: energy,
      sleepQuality: sleep,
      stressSelfRating: stress,
      sleepHours: sleepHoursInput,
      movementMinutes: movementMinutesInput,
      restingHeartRateBpm: restingHrInput,
      systolicMmHg: systolicInput,
      diastolicMmHg: diastolicInput,
      moodNote,
    });

    if (!validation.valid || !validation.normalized) {
      setCheckInError(validation.error ?? 'Please check your entered values.');
      return;
    }

    onAddCheckIn({
      id: `checkin-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      ...validation.normalized,
      isDemo: user.mode === 'demo',
    });
    setSleepHoursInput('');
    setMovementMinutesInput('');
    setRestingHrInput('');
    setSystolicInput('');
    setDiastolicInput('');
    setMoodNote('');
    setCheckInSaved(true);
    window.setTimeout(() => setCheckInSaved(false), 3000);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 pb-12 space-y-8">
      {user.mode === 'demo' && (
        <div
          role="status"
          className="rounded-xl border border-[#F28D54]/35 bg-[#361F13]/50 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <p className="text-xs text-[#FDE3D2]">
            <strong className="font-semibold text-white">Demo Data Active:</strong>{' '}
            You are viewing sample lab and interpreted genetic records for demonstration. Sign in for private personal storage.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('auth')}
            className="text-xs font-semibold text-[#F28D54] hover:underline whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            Sign In / Create Account
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#A7BBB1]">
            {user.mode === 'demo'
              ? 'Demo Workspace'
              : `Signed in as ${user.fullName || user.email}`}
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-semibold text-[#F2F6F3]">
            Health Insights Dashboard
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('upload')}
            className="inline-flex items-center gap-2 rounded-lg bg-[#E87A3D] px-4 py-2.5 text-xs font-semibold text-[#09120F] hover:bg-[#F28D54] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F28D54]"
          >
            <FilePlus2 className="w-4 h-4" aria-hidden="true" />
            <span>Upload Report</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('ai-guide')}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-medium text-[#F2F6F3] hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E87A3D]"
          >
            <Sparkles className="w-4 h-4 text-[#F28D54]" aria-hidden="true" />
            <span>Ask AI Guide</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <section
        aria-label="Report summary metrics"
        className="wn-reveal-up grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="wn-glass rounded-xl p-5">
          <p className="text-xs text-[#A7BBB1]">Confirmed Findings</p>
          <p className="mt-2 font-mono-tabular text-2xl font-semibold text-[#F2F6F3]">
            {confirmedFindings.length}
          </p>
          <p className="mt-1 text-xs text-[#7F998D]">Verified by you</p>
        </div>
        <div className="wn-glass rounded-xl p-5">
          <p className="text-xs text-[#A7BBB1]">Needs Confirmation</p>
          <p className="mt-2 font-mono-tabular text-2xl font-semibold text-[#FBBF24]">
            {pendingFindings.length}
          </p>
          <p className="mt-1 text-xs text-[#7F998D]">Uncertain or unverified</p>
        </div>
        <div className="wn-glass rounded-xl p-5">
          <p className="text-xs text-[#A7BBB1]">Outside Report Range</p>
          <p className="mt-2 font-mono-tabular text-2xl font-semibold text-[#F28D54]">
            {outsideRangeCount}
          </p>
          <p className="mt-1 text-xs text-[#7F998D]">For clinician discussion</p>
        </div>
        <div className="wn-glass rounded-xl p-5">
          <p className="text-xs text-[#A7BBB1]">Interpreted Genetics</p>
          <p className="mt-2 font-mono-tabular text-2xl font-semibold text-[#34D399]">
            {geneticReportsCount}
          </p>
          <p className="mt-1 text-xs text-[#7F998D]">Clinical summaries only</p>
        </div>
      </section>

      {pendingFindings.length > 0 && (
        <section
          aria-label="Pending confirmation notice"
          className="wn-glass rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-[#FBBF24]/30"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className="w-5 h-5 text-[#FBBF24] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <h2 className="font-display text-sm font-semibold text-[#F2F6F3]">
                {`${pendingFindings.length} extracted ${
                  pendingFindings.length === 1 ? 'item requires' : 'items require'
                } your confirmation`}
              </h2>
              <p className="mt-1 text-xs text-[#B6C8BE]">
                Uncertain extractions are excluded from insights and AI Guide until you confirm their exact test name, result, unit, date, and reference range.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('insights')}
            className="inline-flex items-center gap-2 rounded-lg border border-[#FBBF24]/40 bg-[#FBBF24]/10 px-4 py-2 text-xs font-semibold text-[#FDE68A] hover:bg-[#FBBF24]/20 whitespace-nowrap shrink-0"
          >
            <span>Review Pending Items</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Recent Confirmed Findings */}
        <section
          aria-labelledby="recent-findings-heading"
          className="lg:col-span-7 wn-glass rounded-2xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2
                id="recent-findings-heading"
                className="font-display text-lg font-semibold text-[#F2F6F3]"
              >
                Confirmed Report Snapshot
              </h2>
              <p className="text-xs text-[#A7BBB1]">
                Evaluated strictly against each report&apos;s own units and reference range
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('insights')}
              className="text-xs font-medium text-[#F28D54] hover:underline whitespace-nowrap shrink-0"
            >
              View All Results
            </button>
          </div>

          {confirmedFindings.length === 0 ? (
            <div className="py-10 text-center space-y-3 border-t border-white/10">
              <p className="text-sm text-[#B6C8BE]">
                No confirmed findings yet. Upload a report or confirm pending extractions to see them here.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('upload')}
                className="inline-flex items-center gap-2 rounded-lg bg-[#E87A3D] px-4 py-2 text-xs font-semibold text-[#09120F]"
              >
                Add Your First Report
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {confirmedFindings.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#F2F6F3]">
                        {item.testName}
                      </p>
                      {item.isDemo && (
                        <span className="text-[11px] text-[#F28D54]">· Demo</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-[#9BB0A5] font-mono-tabular">
                      {item.reportDate} · Ref: {item.referenceRange || 'Not listed'}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="font-mono-tabular text-sm font-semibold text-[#F2F6F3]">
                      {item.result} {item.unit}
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        item.rangeStatus === 'within_range'
                          ? 'text-[#34D399]'
                          : item.rangeStatus === 'outside_range'
                            ? 'text-[#F28D54]'
                            : 'text-[#93C5FD]'
                      }`}
                    >
                      {getRangeStatusLabel(item.rangeStatus)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Optional Self-Reported Wellbeing Check-In */}
        <section
          aria-labelledby="wellbeing-heading"
          className="lg:col-span-5 wn-glass rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-[#34D399]" aria-hidden="true" />
            <h2
              id="wellbeing-heading"
              className="font-display text-lg font-semibold text-[#F2F6F3]"
            >
              Self-Reported Wellbeing Check-In
            </h2>
          </div>
          <p className="text-xs text-[#A7BBB1] leading-relaxed">
            Optional daily reflection in your own words. Wellnest never uses facial photos or camera scans to guess stress, health, or biological age.
          </p>

          {!allowWellbeingCheckIns ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-[#A7BBB1] space-y-2">
              <p>Wellbeing check-ins are paused in your Consent &amp; Account Settings.</p>
              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className="text-[#F28D54] font-medium hover:underline"
              >
                Enable in Settings
              </button>
            </div>
          ) : (
            <form onSubmit={handleCheckInSubmit} className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-[#C8D7CF] mb-1">
                  <label htmlFor="wb-energy">Energy Level (1 low – 5 steady)</label>
                  <span className="font-mono-tabular">{energy}/5</span>
                </div>
                <input
                  id="wb-energy"
                  type="range"
                  min={1}
                  max={5}
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="w-full accent-[#E87A3D]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-[#C8D7CF] mb-1">
                  <label htmlFor="wb-sleep">Sleep Quality (1 poor – 5 restful)</label>
                  <span className="font-mono-tabular">{sleep}/5</span>
                </div>
                <input
                  id="wb-sleep"
                  type="range"
                  min={1}
                  max={5}
                  value={sleep}
                  onChange={(e) => setSleep(Number(e.target.value))}
                  className="w-full accent-[#E87A3D]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-[#C8D7CF] mb-1">
                  <label htmlFor="wb-stress">Self-Rated Stress (1 calm – 5 high)</label>
                  <span className="font-mono-tabular">{stress}/5</span>
                </div>
                <input
                  id="wb-stress"
                  type="range"
                  min={1}
                  max={5}
                  value={stress}
                  onChange={(e) => setStress(Number(e.target.value))}
                  className="w-full accent-[#E87A3D]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="wb-sleep-hours"
                    className="block text-xs text-[#C8D7CF] mb-1.5"
                  >
                    Sleep Duration (hrs)
                  </label>
                  <input
                    id="wb-sleep-hours"
                    type="text"
                    inputMode="decimal"
                    value={sleepHoursInput}
                    onChange={(e) => setSleepHoursInput(e.target.value)}
                    placeholder="e.g. 7.5"
                    className="w-full rounded-lg border border-white/15 bg-[#0A1511] px-3 py-2 text-xs font-mono-tabular text-[#F2F6F3] placeholder:text-[#6E857A] focus:outline-none focus:ring-2 focus:ring-[#E87A3D]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="wb-movement-min"
                    className="block text-xs text-[#C8D7CF] mb-1.5"
                  >
                    Daily Movement (min)
                  </label>
                  <input
                    id="wb-movement-min"
                    type="text"
                    inputMode="numeric"
                    value={movementMinutesInput}
                    onChange={(e) => setMovementMinutesInput(e.target.value)}
                    placeholder="e.g. 30"
                    className="w-full rounded-lg border border-white/15 bg-[#0A1511] px-3 py-2 text-xs font-mono-tabular text-[#F2F6F3] placeholder:text-[#6E857A] focus:outline-none focus:ring-2 focus:ring-[#E87A3D]"
                  />
                </div>
              </div>

              <div className="pt-1 border-t border-white/10">
                <button
                  type="button"
                  aria-expanded={showDeviceReadings}
                  aria-controls="wb-device-readings-panel"
                  onClick={() => setShowDeviceReadings((prev) => !prev)}
                  className="flex w-full items-center justify-between py-1.5 text-left text-xs font-medium text-[#D7E4DD] hover:text-[#F28D54] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E87A3D]"
                >
                  <span>Add Optional Device Readings (Manual)</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      showDeviceReadings ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {showDeviceReadings && (
                  <div
                    id="wb-device-readings-panel"
                    className="mt-2.5 space-y-3"
                  >
                    <p className="text-[11px] text-[#9BB0A5] leading-relaxed">
                      Enter numbers measured by your own cuff or wearable—never guessed from a camera.
                    </p>
                    <div>
                      <label
                        htmlFor="wb-resting-hr"
                        className="block text-xs text-[#C8D7CF] mb-1.5"
                      >
                        Resting Heart Rate (bpm)
                      </label>
                      <input
                        id="wb-resting-hr"
                        type="text"
                        inputMode="numeric"
                        value={restingHrInput}
                        onChange={(e) => setRestingHrInput(e.target.value)}
                        placeholder="e.g. 64"
                        className="w-full rounded-lg border border-white/15 bg-[#0A1511] px-3 py-2 text-xs font-mono-tabular text-[#F2F6F3] placeholder:text-[#6E857A] focus:outline-none focus:ring-2 focus:ring-[#E87A3D]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="wb-bp-systolic"
                          className="block text-xs text-[#C8D7CF] mb-1.5"
                        >
                          Systolic (mmHg)
                        </label>
                        <input
                          id="wb-bp-systolic"
                          type="text"
                          inputMode="numeric"
                          value={systolicInput}
                          onChange={(e) => setSystolicInput(e.target.value)}
                          placeholder="e.g. 118"
                          className="w-full rounded-lg border border-white/15 bg-[#0A1511] px-3 py-2 text-xs font-mono-tabular text-[#F2F6F3] placeholder:text-[#6E857A] focus:outline-none focus:ring-2 focus:ring-[#E87A3D]"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="wb-bp-diastolic"
                          className="block text-xs text-[#C8D7CF] mb-1.5"
                        >
                          Diastolic (mmHg)
                        </label>
                        <input
                          id="wb-bp-diastolic"
                          type="text"
                          inputMode="numeric"
                          value={diastolicInput}
                          onChange={(e) => setDiastolicInput(e.target.value)}
                          placeholder="e.g. 76"
                          className="w-full rounded-lg border border-white/15 bg-[#0A1511] px-3 py-2 text-xs font-mono-tabular text-[#F2F6F3] placeholder:text-[#6E857A] focus:outline-none focus:ring-2 focus:ring-[#E87A3D]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="wb-note"
                  className="block text-xs text-[#C8D7CF] mb-1.5"
                >
                  Optional Context Note
                </label>
                <input
                  id="wb-note"
                  type="text"
                  value={moodNote}
                  onChange={(e) => setMoodNote(e.target.value)}
                  placeholder="e.g. Afternoon walk, steady hydration"
                  className="w-full rounded-lg border border-white/15 bg-[#0A1511] px-3 py-2 text-xs text-[#F2F6F3] placeholder:text-[#6E857A] focus:outline-none focus:ring-2 focus:ring-[#E87A3D]"
                />
              </div>

              {checkInError && (
                <div
                  role="alert"
                  className="rounded-lg border border-[#F87171]/40 bg-[#3B1517]/60 px-3 py-2 text-xs text-[#FECACA] flex items-start gap-2"
                >
                  <AlertTriangle
                    className="w-3.5 h-3.5 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{checkInError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-lg bg-[#1C382D] border border-white/15 px-4 py-2.5 text-xs font-semibold text-[#F2F6F3] hover:bg-[#234538] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E87A3D]"
              >
                Save Check-In
              </button>

              {checkInSaved && (
                <p
                  role="status"
                  className="flex items-center gap-1.5 text-xs text-[#34D399]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Check-in saved.</span>
                </p>
              )}
            </form>
          )}

          {checkIns.length > 0 && (
            <div className="pt-3 border-t border-white/10 space-y-2.5">
              <p className="text-xs font-medium text-[#C8D7CF]">
                Recent Check-Ins
              </p>
              {checkIns.slice(0, 3).map((entry) => {
                const metricParts: string[] = [];
                if (entry.sleepHours !== undefined) {
                  metricParts.push(`${entry.sleepHours} hrs sleep`);
                }
                if (entry.movementMinutes !== undefined) {
                  metricParts.push(`${entry.movementMinutes} min active`);
                }
                if (entry.restingHeartRateBpm !== undefined) {
                  metricParts.push(`${entry.restingHeartRateBpm} bpm RHR`);
                }
                if (
                  entry.systolicMmHg !== undefined &&
                  entry.diastolicMmHg !== undefined
                ) {
                  metricParts.push(
                    `${entry.systolicMmHg}/${entry.diastolicMmHg} mmHg`,
                  );
                }

                return (
                  <div
                    key={entry.id}
                    className="text-xs text-[#9BB0A5] space-y-0.5"
                  >
                    <p className="font-mono-tabular text-[#D7E4DD]">
                      {entry.date} · Energy {entry.energyLevel}/5 · Sleep {entry.sleepQuality}/5 · Stress {entry.stressSelfRating}/5
                      {entry.isDemo ? ' · Demo' : ''}
                    </p>
                    {metricParts.length > 0 && (
                      <p className="font-mono-tabular text-[11px] text-[#8FA89C]">
                        {metricParts.join(' · ')}
                      </p>
                    )}
                    {entry.moodNote && <p className="italic">{entry.moodNote}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <DietPlanSection findings={allFindings} onNavigate={onNavigate} />

      <SafetyDisclaimer />
    </div>
  );
}
