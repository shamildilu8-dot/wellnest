import { useState } from 'react';
import { Download, LogOut, RotateCcw, Trash2 } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';
import type {
  ConsentPreferences,
  ReportRecord,
  UserProfile,
  WellbeingCheckIn,
} from '../types/wellnest';
import { SafetyDisclaimer } from './SafetyDisclaimer';

interface SettingsViewProps {
  user: UserProfile;
  reports: ReportRecord[];
  checkIns: WellbeingCheckIn[];
  consents: ConsentPreferences;
  onUpdateConsents: (next: ConsentPreferences) => void;
  onDeleteAllData: () => void;
  onResetDemoData: () => void;
  onSignOut: () => void;
}

export function SettingsView({
  user,
  reports,
  checkIns,
  consents,
  onUpdateConsents,
  onDeleteAllData,
  onResetDemoData,
  onSignOut,
}: SettingsViewProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const toggleConsent = (key: keyof Omit<ConsentPreferences, 'updatedAt'>) => {
    const next: ConsentPreferences = {
      ...consents,
      [key]: !consents[key],
      updatedAt: new Date().toISOString(),
    };
    onUpdateConsents(next);
    setStatusMsg('Consent preferences updated.');
    window.setTimeout(() => setStatusMsg(null), 2500);
  };

  const handleExportJson = () => {
    const exportBundle = {
      exportedAt: new Date().toISOString(),
      accountMode: user.mode,
      consentPreferences: consents,
      reports,
      wellbeingCheckIns: checkIns,
    };
    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wellnest-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg('Exported your records as JSON.');
  };

  const handleDeleteAll = async () => {
    onDeleteAllData();
    setConfirmDelete(false);
    setStatusMsg('All stored reports and wellbeing check-ins have been deleted.');
  };

  const handleSignOutClick = async () => {
    const sb = getSupabaseClient();
    if (sb && user.mode === 'authenticated') {
      await sb.auth.signOut();
    }
    onSignOut();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-8 pb-12 space-y-8">
      <SafetyDisclaimer compact />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#F2F6F3]">
            Consent &amp; Account Settings
          </h1>
          <p className="mt-1 text-sm text-[#A7BBB1]">
            {user.mode === 'demo'
              ? 'Demo Mode · Local browser session'
              : `Authenticated Account · ${user.email}`}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSignOutClick}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-[#F2F6F3] hover:bg-white/10 self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          <span>{user.mode === 'demo' ? 'Exit Demo Mode' : 'Sign Out'}</span>
        </button>
      </div>

      {statusMsg && (
        <div
          role="status"
          className="rounded-xl border border-[#34D399]/35 bg-[#123024]/70 px-4 py-3 text-xs text-[#A7F3D0]"
        >
          {statusMsg}
        </div>
      )}

      {/* Consent Controls */}
      <section className="wn-glass rounded-2xl p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-[#F2F6F3]">
          Privacy &amp; Processing Consents
        </h2>

        <div className="divide-y divide-white/10">
          <label className="py-3.5 flex items-start justify-between gap-4 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-[#F2F6F3]">
                Store confirmed reports in workspace
              </p>
              <p className="text-xs text-[#9BB0A5]">
                Keeps confirmed lab and interpreted genetic summaries available across sessions.
              </p>
            </div>
            <input
              type="checkbox"
              checked={consents.storeConfirmedReports}
              onChange={() => toggleConsent('storeConfirmedReports')}
              className="mt-1 w-4 h-4 accent-[#E87A3D]"
            />
          </label>

          <label className="py-3.5 flex items-start justify-between gap-4 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-[#F2F6F3]">
                Enable self-reported wellbeing check-ins
              </p>
              <p className="text-xs text-[#9BB0A5]">
                Allows manual energy, sleep, and stress check-ins on the dashboard.
              </p>
            </div>
            <input
              type="checkbox"
              checked={consents.allowWellbeingCheckIns}
              onChange={() => toggleConsent('allowWellbeingCheckIns')}
              className="mt-1 w-4 h-4 accent-[#E87A3D]"
            />
          </label>

          <label className="py-3.5 flex items-start justify-between gap-4 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-[#F2F6F3]">
                Allow optional AI OCR extraction on uploaded PDFs/images
              </p>
              <p className="text-xs text-[#9BB0A5]">
                Only active when server GEMINI_API_KEY and AI_DATA_CONTROLS_VERIFIED=true are configured.
              </p>
            </div>
            <input
              type="checkbox"
              checked={consents.allowAiReportExtraction}
              onChange={() => toggleConsent('allowAiReportExtraction')}
              className="mt-1 w-4 h-4 accent-[#E87A3D]"
            />
          </label>
        </div>
      </section>

      {/* Data Export & Deletion */}
      <section className="wn-glass rounded-2xl p-6 space-y-5">
        <h2 className="font-display text-lg font-semibold text-[#F2F6F3]">
          Your Data Rights (Export &amp; Deletion)
        </h2>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-medium text-[#F2F6F3] hover:bg-white/10"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Export All Data (JSON)</span>
          </button>

          {user.mode === 'demo' && (
            <button
              type="button"
              onClick={() => {
                onResetDemoData();
                setStatusMsg('Demo dataset restored.');
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-medium text-[#F2F6F3] hover:bg-white/10"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Restore Sample Demo Data</span>
            </button>
          )}

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#F87171]/40 bg-[#3B1517]/50 px-4 py-2.5 text-xs font-medium text-[#FECACA] hover:bg-[#3B1517]/80"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span>Delete All Stored Data</span>
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#F87171]/40 bg-[#3B1517]/70 p-3">
              <span className="text-xs text-[#FECACA]">
                Permanently remove all reports and check-ins?
              </span>
              <button
                type="button"
                onClick={handleDeleteAll}
                className="rounded-lg bg-[#F87171] px-3 py-1.5 text-xs font-semibold text-[#09120F]"
              >
                Confirm Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-[#F2F6F3]"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
