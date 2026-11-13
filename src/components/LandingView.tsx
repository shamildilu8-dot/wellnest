import { useState } from 'react';
import { ArrowRight, CheckCircle2, FileText, Lock, ShieldCheck } from 'lucide-react';
import heroBotanicalImg from '../assets/images/wellnest_hero_botanical_1794574083236.jpg';
import classicApothecaryImg from '../assets/images/wellnest_classic_apothecary_1794580224291.jpg';
import type { AppView } from '../types/wellnest';
import { SafetyDisclaimer } from './SafetyDisclaimer';

interface LandingViewProps {
  onEnterDemo: () => void;
  onNavigate: (view: AppView) => void;
}

export function LandingView({ onEnterDemo, onNavigate }: LandingViewProps) {
  const [heroImgError, setHeroImgError] = useState(false);
  const [calmImgError, setCalmImgError] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 pb-12 space-y-14">
      <SafetyDisclaimer />

      {/* Hero Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-6 wn-glass wn-shimmer-card wn-reveal-up rounded-2xl p-6 sm:p-10 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium tracking-wide text-[#F28D54]">
              Personal Lab &amp; Interpreted Genetics Workspace
            </p>
            <div className="mt-3">
              <span className="wn-liquid-glass-wrap font-display text-3xl sm:text-4xl lg:text-[2.65rem] font-bold tracking-tight leading-[1.14] text-balance">
                <span aria-hidden="true" className="wn-liquid-glass-prism">
                  Understand your reports calmly, with human confirmation first.
                </span>
                <h1 className="wn-liquid-glass-core">
                  Understand your reports calmly, with human confirmation first.
                </h1>
                <span aria-hidden="true" className="wn-liquid-glass-shine">
                  Understand your reports calmly, with human confirmation first.
                </span>
              </span>
            </div>
            <p className="wn-glass-subtext mt-4 text-base leading-relaxed max-w-xl">
              Review extracted test names, units, dates, and each lab&apos;s own reference ranges side by side. Explore cautious educational explanations and gradual lifestyle context without diagnostic overreach.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onEnterDemo}
                className="inline-flex items-center gap-2 rounded-lg bg-[#E87A3D] px-5 py-3 text-sm font-semibold text-[#09120F] hover:bg-[#F28D54] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F28D54]"
              >
                <span>Explore Demo Workspace</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('auth')}
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 backdrop-blur-md px-5 py-3 text-sm font-medium text-[#F4F7F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-white/15 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E87A3D]"
              >
                <span>Sign In / Create Account</span>
              </button>
            </div>
            <p className="text-xs text-[#A7BBB1]">
              Demo workspace uses clearly labeled sample reports · No account required to preview
            </p>
          </div>
        </div>

        <div className="lg:col-span-6 wn-reveal-up wn-delay-1 rounded-2xl overflow-hidden border border-white/20 bg-[#101F19]/60 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_20px_50px_rgba(0,0,0,0.45)] min-h-[280px] lg:min-h-[420px] relative">
          {!heroImgError ? (
            <img
              src={heroBotanicalImg}
              alt="Frosted dark green glass vessels and river stones resting on charcoal slate in calm evening light"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgError(true)}
              className="wn-kenburns-classic w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-br from-[#12261E] to-[#0A130F]">
              <p className="text-sm text-[#A7BBB1]">Wellnest calm botanical sanctuary</p>
            </div>
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#09120F]/75 via-transparent to-transparent pointer-events-none"
          />
          <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#E4EDE8]">
            <span>Range-aware extraction</span>
            <span aria-hidden="true">·</span>
            <span>Per-request AI consent</span>
            <span aria-hidden="true">·</span>
            <span>Private user storage</span>
          </div>
        </div>
      </section>

      {/* Core Safeguards Grid */}
      <section aria-labelledby="safeguards-heading" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2
              id="safeguards-heading"
              className="font-display text-2xl font-semibold text-[#F2F6F3]"
            >
              Built around clinical caution and consent
            </h2>
            <p className="mt-1 text-sm text-[#A7BBB1]">
              Every workflow separates educational context from medical diagnosis.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="wn-glass rounded-xl p-6 space-y-3">
            <CheckCircle2 className="w-5 h-5 text-[#34D399]" aria-hidden="true" />
            <h3 className="font-display text-lg font-semibold text-[#F2F6F3]">
              Confirm before you rely on it
            </h3>
            <p className="text-sm text-[#B6C8BE] leading-relaxed">
              Extracted test names, results, units, dates, and lab reference ranges are flagged whenever uncertain and require your explicit confirmation before entering insights or AI explanations.
            </p>
          </div>

          <div className="wn-glass rounded-xl p-6 space-y-3">
            <FileText className="w-5 h-5 text-[#F28D54]" aria-hidden="true" />
            <h3 className="font-display text-lg font-semibold text-[#F2F6F3]">
              Interpreted genetics only
            </h3>
            <p className="text-sm text-[#B6C8BE] leading-relaxed">
              Raw DNA files (23andMe, AncestryDNA, VCF) are automatically blocked. Wellnest only summarizes professionally interpreted clinical genetic reports as risk context.
            </p>
          </div>

          <div className="wn-glass rounded-xl p-6 space-y-3">
            <Lock className="w-5 h-5 text-[#34D399]" aria-hidden="true" />
            <h3 className="font-display text-lg font-semibold text-[#F2F6F3]">
              Explicit AI permission every time
            </h3>
            <p className="text-sm text-[#B6C8BE] leading-relaxed">
              Before any AI request runs, Wellnest shows the exact confirmed report items and provider involved. No personal files are sent without your approval.
            </p>
          </div>
        </div>
      </section>

      {/* Classic Editorial Feature */}
      <section className="wn-glass wn-shimmer-card wn-reveal-up wn-delay-2 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-6 min-h-[260px] lg:min-h-[340px] bg-[#101F19] overflow-hidden relative">
          {!calmImgError ? (
            <img
              src={classicApothecaryImg}
              alt="Dark fluted emerald apothecary glass bottles, warm amber crystal vessel, linen wellness journal, brass fountain pen, and olive sprig on veined forest marble"
              referrerPolicy="no-referrer"
              onError={() => setCalmImgError(true)}
              className="wn-kenburns-classic w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-8">
              <ShieldCheck className="w-10 h-10 text-[#34D399]" aria-hidden="true" />
            </div>
          )}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#08100D]/55 via-transparent to-transparent"
          />
        </div>

        <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-center space-y-4">
          <p className="text-xs font-medium text-[#F28D54]">
            Classic Stewardship &amp; Cautious Guidance
          </p>
          <h2 className="font-display text-2xl font-semibold text-[#F2F6F3] text-balance">
            No camera stress guesses. Just simple check-ins you control.
          </h2>
          <p className="text-sm text-[#B6C8BE] leading-relaxed">
            Wellnest never attempts to infer stress, health, or biological age from a facial photo. Instead, you can log an optional self-reported energy, sleep, and stress check-in alongside your confirmed lab history to prepare thoughtful questions for your clinician.
          </p>
          <div className="pt-2 flex flex-wrap gap-4 text-xs text-[#A7BBB1]">
            <button
              type="button"
              onClick={() => onNavigate('privacy')}
              className="text-[#F2F6F3] underline underline-offset-4 hover:text-[#F28D54]"
            >
              Read our plain-language Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="text-[#F2F6F3] underline underline-offset-4 hover:text-[#F28D54]"
            >
              Contact &amp; clinical safety details
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
