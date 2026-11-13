import { useState } from 'react';
import {
  AlertCircle,
  BookmarkCheck,
  BookOpen,
  ExternalLink,
  FlaskConical,
  Globe,
} from 'lucide-react';
import type { NutritionTopicId } from '../types/wellnest';
import {
  filterResearchContent,
  NUTRITION_TOPICS,
  TRUSTED_NUTRITION_SOURCES,
} from '../utils/wellnestLogic';
import { SafetyDisclaimer } from './SafetyDisclaimer';

export function NutritionResearchHub() {
  const [selectedTopic, setSelectedTopic] = useState<NutritionTopicId | 'all'>(
    'all',
  );

  const { rows, sources } = filterResearchContent(selectedTopic);
  const topFiveSources = TRUSTED_NUTRITION_SOURCES.filter((s) => s.isTopFive).sort(
    (a, b) => (a.topFiveRank ?? 99) - (b.topFiveRank ?? 99),
  );
  const organizationSources = sources.filter((s) => s.group === 'organization');
  const databaseSources = sources.filter(
    (s) => s.group === 'scientific_database',
  );

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 pb-12 space-y-8">
      <SafetyDisclaimer compact />

      <div className="wn-reveal-up space-y-2">
        <p className="text-xs font-medium tracking-wide text-[#F28D54]">
          Trusted Scientific &amp; Global Nutrition Directory
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#F2F6F3]">
          Nutrition Research Sources &amp; Daily Evidence Table
        </h1>
        <p className="text-sm text-[#A7BBB1] max-w-3xl leading-relaxed">
          Explore authoritative public health guidelines, supplement safety sheets, peer-reviewed research databases, and a curated daily &amp; upcoming research tracker across five nutrition focus areas.
        </p>
      </div>

      {/* 5 Interest Areas Filter */}
      <section
        aria-labelledby="interest-topics-heading"
        className="wn-glass wn-reveal-up wn-delay-1 rounded-2xl p-6 space-y-4"
      >
        <div>
          <h2
            id="interest-topics-heading"
            className="font-display text-base font-semibold text-[#F2F6F3]"
          >
            Choose Your Nutrition Knowledge Focus
          </h2>
          <p className="mt-1 text-xs text-[#A7BBB1]">
            Filter both the Daily &amp; Upcoming Research Table and the official source links below by interest area.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Nutrition knowledge interest areas"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedTopic === 'all'}
            onClick={() => setSelectedTopic('all')}
            className={`text-left rounded-xl border px-4 py-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E87A3D] ${
              selectedTopic === 'all'
                ? 'border-[#E87A3D]/60 bg-[#1B382C]/85 text-[#F2F6F3] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                : 'border-white/12 bg-[#0A1511]/55 text-[#B6C8BE] hover:border-white/25 hover:text-[#F2F6F3]'
            }`}
          >
            <p className="text-xs font-semibold text-[#F28D54]">All 5 Areas</p>
            <p className="mt-0.5 text-xs">
              Full daily research watchlist &amp; all 10 official portals
            </p>
          </button>

          {NUTRITION_TOPICS.map((topic) => {
            const active = selectedTopic === topic.id;
            return (
              <button
                key={topic.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedTopic(topic.id)}
                className={`text-left rounded-xl border px-4 py-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E87A3D] ${
                  active
                    ? 'border-[#E87A3D]/60 bg-[#1B382C]/85 text-[#F2F6F3] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                    : 'border-white/12 bg-[#0A1511]/55 text-[#B6C8BE] hover:border-white/25 hover:text-[#F2F6F3]'
                }`}
              >
                <p className="text-xs font-semibold text-[#F2F6F3]">
                  <span className="font-mono-tabular text-[#34D399] mr-1.5">
                    0{topic.number}.
                  </span>
                  {topic.title}
                </p>
                <p className="mt-0.5 text-xs text-[#9BB0A5]">{topic.subtitle}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Daily Information & Upcoming Research Details Table */}
      <section
        aria-labelledby="daily-research-table-heading"
        className="wn-glass wn-reveal-up wn-delay-2 rounded-2xl p-6 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#34D399]">
              <FlaskConical className="w-4 h-4" aria-hidden="true" />
              <span>Curated Educational Tracker · Non-Diagnostic</span>
            </div>
            <h2
              id="daily-research-table-heading"
              className="mt-1 font-display text-xl font-semibold text-[#F2F6F3]"
            >
              Daily Information &amp; Upcoming Research Details
            </h2>
          </div>
          <p className="text-xs font-mono-tabular text-[#9BB0A5]">
            Showing {rows.length} {rows.length === 1 ? 'topic entry' : 'topic entries'}
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/12 bg-[#09120F]/65">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/15 bg-white/5 text-[#D7E4DD]">
                <th scope="col" className="py-3.5 px-4 font-semibold whitespace-nowrap">
                  Topic Area
                </th>
                <th scope="col" className="py-3.5 px-4 font-semibold min-w-[230px]">
                  Daily Nutrition Information
                </th>
                <th scope="col" className="py-3.5 px-4 font-semibold min-w-[230px]">
                  Upcoming / Ongoing Research Details
                </th>
                <th scope="col" className="py-3.5 px-4 font-semibold whitespace-nowrap">
                  Evidence &amp; Official Link
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {rows.map((row) => (
                <tr key={row.id} className="align-top hover:bg-white/[0.03]">
                  <td className="py-4 px-4 font-medium text-[#F2F6F3] whitespace-nowrap">
                    {row.topicTitle}
                  </td>
                  <td className="py-4 px-4 text-[#C8D7CF] leading-relaxed">
                    {row.dailyInformation}
                  </td>
                  <td className="py-4 px-4 text-[#B6C8BE] leading-relaxed">
                    {row.upcomingResearchFocus}
                  </td>
                  <td className="py-4 px-4 space-y-1.5 whitespace-nowrap">
                    <p className="text-[11px] text-[#9BB0A5]">
                      {row.evidenceStandard}
                    </p>
                    <a
                      href={row.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-semibold text-[#F28D54] hover:underline focus-visible:outline-2 focus-visible:outline-[#E87A3D] rounded"
                    >
                      <span>{row.sourceName}</span>
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recommended Top 5 & Scientific Caution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section
          aria-labelledby="top-five-heading"
          className="lg:col-span-7 wn-glass rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-5 h-5 text-[#34D399]" aria-hidden="true" />
            <h2
              id="top-five-heading"
              className="font-display text-lg font-semibold text-[#F2F6F3]"
            >
              Recommended Top 5 Nutrition Bookmarks
            </h2>
          </div>

          <ol className="divide-y divide-white/10">
            {topFiveSources.map((src) => (
              <li
                key={src.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <p className="text-sm font-medium text-[#F2F6F3]">
                    <span className="font-mono-tabular text-[#F28D54] mr-2">
                      {src.topFiveRank}.
                    </span>
                    {src.name}
                  </p>
                  <p className="text-xs text-[#9BB0A5] mt-0.5">{src.summary}</p>
                </div>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-[#F2F6F3] hover:bg-white/12 whitespace-nowrap shrink-0 self-start sm:self-auto"
                >
                  <span>Visit {src.shortLabel}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#F28D54]" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="evidence-advice-heading"
          className="lg:col-span-5 wn-glass rounded-2xl p-6 flex flex-col justify-between space-y-4 border-[#F28D54]/30"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#F28D54]">
              <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
              <h2
                id="evidence-advice-heading"
                className="font-display text-lg font-semibold text-[#F2F6F3]"
              >
                How to Read Nutrition Studies Safely
              </h2>
            </div>
            <p className="text-xs text-[#D7E4DD] leading-relaxed">
              <strong className="text-white">
                Don&apos;t believe every nutrition study you see online.
              </strong>{' '}
              Headlines often contradict each other—for example, one study highlights eggs positively, another suggests limiting intake, and a third finds no significant association.
            </p>
            <p className="text-xs text-[#B6C8BE] leading-relaxed">
              A single study never establishes scientific truth. Look for{' '}
              <strong className="text-[#F2F6F3]">
                systematic reviews, meta-analyses, randomized controlled trials (RCTs), and consistency across multiple independent studies
              </strong>{' '}
              before changing habits.
            </p>
          </div>
          <p className="pt-3 border-t border-white/10 text-[11px] text-[#9BB0A5]">
            Educational literacy note · Discuss supplement or diet changes with your clinician.
          </p>
        </section>
      </div>

      {/* Global Nutrition & Health Authorities */}
      <section
        aria-labelledby="global-authorities-heading"
        className="space-y-4"
      >
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-[#34D399]" aria-hidden="true" />
          <h2
            id="global-authorities-heading"
            className="font-display text-xl font-semibold text-[#F2F6F3]"
          >
            Official Global &amp; National Nutrition Authorities
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {organizationSources.map((src) => (
            <article
              key={src.id}
              className="wn-glass rounded-2xl p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-base font-semibold text-[#F2F6F3]">
                    {src.name}
                  </h3>
                  {src.isTopFive && (
                    <span className="text-[11px] font-mono-tabular text-[#34D399] whitespace-nowrap shrink-0">
                      Top 5 #{src.topFiveRank}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#B6C8BE] leading-relaxed">
                  {src.summary}
                </p>
                <ul className="space-y-1.5 text-xs text-[#C8D7CF]">
                  {src.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-[#F28D54] mt-0.5" aria-hidden="true">
                        ·
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-white/10">
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#F28D54] hover:underline"
                >
                  <span>Open {src.shortLabel} Official Website</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Best Websites for Scientific Research Papers */}
      <section
        aria-labelledby="scientific-papers-heading"
        className="wn-glass rounded-2xl p-6 space-y-4"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#F28D54]" aria-hidden="true" />
          <h2
            id="scientific-papers-heading"
            className="font-display text-xl font-semibold text-[#F2F6F3]"
          >
            Best Websites for Original Scientific Research Papers
          </h2>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/12 bg-[#09120F]/65">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/15 bg-white/5 text-[#D7E4DD]">
                <th scope="col" className="py-3 px-4 font-semibold">
                  Website
                </th>
                <th scope="col" className="py-3 px-4 font-semibold">
                  What You Can Find
                </th>
                <th scope="col" className="py-3 px-4 font-semibold">
                  Direct Portal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {databaseSources.map((src) => (
                <tr key={src.id} className="align-top hover:bg-white/[0.03]">
                  <td className="py-3.5 px-4 font-medium text-[#F2F6F3] whitespace-nowrap">
                    {src.shortLabel}
                  </td>
                  <td className="py-3.5 px-4 text-[#C8D7CF]">
                    <p>{src.summary}</p>
                    <p className="mt-1 text-[11px] text-[#9BB0A5]">
                      {src.highlights.join(' · ')}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-semibold text-[#F28D54] hover:underline"
                    >
                      <span>Open {src.shortLabel}</span>
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
