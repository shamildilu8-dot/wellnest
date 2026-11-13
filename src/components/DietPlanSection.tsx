import { useState } from 'react';
import { ArrowRight, Sparkles, Utensils } from 'lucide-react';
import type { AppView, ExtractedFinding } from '../types/wellnest';
import {
  buildCautiousDietContext,
  DIET_PATTERN_GUIDES,
  type DietPatternId,
} from '../utils/wellnestLogic';

interface DietPlanSectionProps {
  findings: ExtractedFinding[];
  onNavigate: (view: AppView) => void;
}

export function DietPlanSection({
  findings,
  onNavigate,
}: DietPlanSectionProps) {
  const dietContext = buildCautiousDietContext(findings);
  const [activePatternId, setActivePatternId] = useState<DietPatternId>(
    dietContext.recommendedPatternId,
  );
  const [imgError, setImgError] = useState(false);

  const activeGuide =
    DIET_PATTERN_GUIDES.find((g) => g.id === activePatternId) ??
    DIET_PATTERN_GUIDES[0];

  return (
    <section
      aria-labelledby="diet-plan-heading"
      className="wn-glass wn-reveal-up wn-delay-2 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch"
    >
      {/* Left Glassy Whole-Foods Frame */}
      <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col">
        <div className="wn-shimmer-card relative flex-1 min-h-[260px] lg:min-h-[340px] rounded-xl overflow-hidden border border-white/25 bg-[#0E1E18]/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_18px_40px_rgba(0,0,0,0.45)]">
          {!imgError ? (
            <img
              src="/assets/aistudio/image_7fa9cde5.png"
              alt="Fresh whole foods including salmon, broccoli, spinach, blueberries, oats, legumes, walnuts, whole-grain bread, eggs, and citrus"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-br from-[#142B22] to-[#0A130F]">
              <Utensils className="w-10 h-10 text-[#F28D54]" aria-hidden="true" />
            </div>
          )}

          {/* Subtle optical top specular highlight & bottom readability scrim */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#08100D]/85 via-[#08100D]/15 to-white/10"
          />

          {/* Floating frosted glass caption card */}
          <div className="absolute bottom-3.5 left-3.5 right-3.5 rounded-xl border border-white/25 bg-[#0A1511]/72 backdrop-blur-xl px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)]">
            <p className="text-[11px] font-medium tracking-wide text-[#F28D54]">
              General Whole-Food Patterns
            </p>
            <p className="mt-0.5 text-xs text-[#F2F6F3] leading-relaxed">
              Gradual, balanced meal building to discuss with your clinician or dietitian—never extreme diets.
            </p>
          </div>
        </div>
      </div>

      {/* Right Cautious Nutrition & Diet Plan Details */}
      <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-5">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-[#34D399]">
                <Utensils className="w-3.5 h-3.5" aria-hidden="true" />
                <span>General Diet &amp; Lifestyle Area</span>
              </div>
              <h2
                id="diet-plan-heading"
                className="mt-1 font-display text-xl sm:text-2xl font-semibold text-[#F2F6F3]"
              >
                Cautious Nutrition &amp; Diet Plan Guide
              </h2>
            </div>
          </div>

          <p className="text-xs text-[#B6C8BE] leading-relaxed">
            {dietContext.note}
          </p>

          {/* Educational Focus Pattern Tabs */}
          <div
            role="tablist"
            aria-label="General diet focus patterns"
            className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#0A1511]/70 border border-white/12 w-fit"
          >
            {DIET_PATTERN_GUIDES.map((guide) => {
              const selected = guide.id === activeGuide.id;
              return (
                <button
                  key={guide.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActivePatternId(guide.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E87A3D] ${
                    selected
                      ? 'bg-[#1D3B2F] text-[#F2F6F3] border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]'
                      : 'text-[#A7BBB1] hover:text-[#F2F6F3]'
                  }`}
                >
                  {guide.label}
                </button>
              );
            })}
          </div>

          {/* Active Pattern Content */}
          <div
            role="tabpanel"
            aria-label={activeGuide.label}
            className="wn-glass-subtle rounded-xl p-4 sm:p-5 space-y-3.5"
          >
            <div>
              <h3 className="font-display text-sm font-semibold text-[#F2F6F3]">
                {activeGuide.headline}
              </h3>
              <p className="mt-1 text-xs text-[#C8D7CF] leading-relaxed">
                {activeGuide.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {activeGuide.plateHighlights.map((item) => (
                <div
                  key={item.group}
                  className="rounded-lg border border-white/10 bg-[#09120F]/55 p-3 space-y-1"
                >
                  <p className="text-[11px] font-semibold text-[#F28D54]">
                    {item.group}
                  </p>
                  <p className="text-xs text-[#D7E4DD] leading-relaxed">
                    {item.examples}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-xs text-[#9BB0A5] leading-relaxed pt-1 border-t border-white/10">
              <strong className="font-medium text-[#F2F6F3]">Gradual step:</strong>{' '}
              {activeGuide.gradualHabit}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
          <p className="text-[11px] text-[#8FA89C]">
            Educational guide only · Consult your clinician before changing diet or medications.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('research')}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-medium text-[#D7E4DD] hover:bg-white/12 hover:text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E87A3D]"
            >
              <span>Official Sources &amp; Daily Research</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('ai-guide')}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-3.5 py-2 text-xs font-medium text-[#F2F6F3] hover:bg-white/14 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E87A3D]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#F28D54]" aria-hidden="true" />
              <span>Discuss Meal Questions in AI Guide</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
