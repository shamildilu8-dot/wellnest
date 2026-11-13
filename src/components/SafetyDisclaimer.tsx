import { AlertTriangle, ShieldAlert } from 'lucide-react';

interface SafetyDisclaimerProps {
  compact?: boolean;
}

export function SafetyDisclaimer({ compact = false }: SafetyDisclaimerProps) {
  return (
    <section
      aria-label="Medical safety and urgent care notice"
      className="space-y-3"
    >
      <div className="wn-glass-subtle rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <ShieldAlert
            className="w-4 h-4 text-[#E87A3D] shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="text-xs text-[#C8D7CF] leading-relaxed">
            <strong className="text-[#F2F6F3] font-semibold">
              Educational Information Only:
            </strong>{' '}
            Wellnest is not a diagnostic or treatment tool. Out-of-range notes describe values outside a specific report&apos;s reference range—never a diagnosis. Always review reports and medication questions with a qualified clinician.
          </p>
        </div>
      </div>

      {!compact && (
        <div className="rounded-xl border border-[#F87171]/30 bg-[#3B1517]/50 px-4 py-3 flex items-start gap-3">
          <AlertTriangle
            className="w-4 h-4 text-[#FCA5A5] shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="text-xs text-[#FECACA] leading-relaxed">
            <strong className="font-semibold text-white">
              Urgent Care Notice:
            </strong>{' '}
            If you experience chest pain, trouble breathing, sudden facial or limb weakness, severe bleeding, fainting, or thoughts of self-harm, call local emergency services or go to the nearest emergency department immediately.
          </p>
        </div>
      )}
    </section>
  );
}
