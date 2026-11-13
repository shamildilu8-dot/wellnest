import { SafetyDisclaimer } from './SafetyDisclaimer';

export function PrivacyView() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-8 pb-12 space-y-8">
      <SafetyDisclaimer compact />

      <article className="wn-glass rounded-2xl p-6 sm:p-10 space-y-6">
        <div>
          <p className="text-xs font-medium text-[#F28D54]">
            Plain-Language Policy
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-semibold text-[#F2F6F3]">
            Wellnest Privacy Policy
          </h1>
          <p className="mt-2 text-xs text-[#9BB0A5]">
            Last updated: November 13, 2026
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-[#F2F6F3]">
            1. Information We Collect
          </h2>
          <p className="text-sm text-[#B6C8BE] leading-relaxed">
            When you create an account, Wellnest collects your email address and optional display name for authentication. If you upload lab reports or professionally interpreted genetic reports, we store the file metadata and the structured values you review and confirm (test name, result, unit, report date, and lab reference range). You may also log optional self-reported wellbeing check-ins (energy, sleep, stress ratings, and brief notes). Wellnest never collects facial photos or camera scans for health or stress inference, and never accepts raw consumer DNA genotype files.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-[#F2F6F3]">
            2. How Information Is Processed &amp; Stored
          </h2>
          <p className="text-sm text-[#B6C8BE] leading-relaxed">
            Authenticated records are designed to be stored in Supabase Postgres with per-user Row Level Security (RLS) policies and a private Supabase Storage bucket (<code>wellnest-reports</code>) where uploaded files are never public and are accessed only via short-lived signed links (60 seconds). Health values are never placed in analytics, URLs, or server console logs. In Demo Mode, sample records stay in your browser&apos;s local session storage only.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-[#F2F6F3]">
            3. AI Providers &amp; Explicit Consent
          </h2>
          <p className="text-sm text-[#B6C8BE] leading-relaxed">
            Wellnest routes optional AI explanations through a server-side endpoint to Google Gemini API (<code>gemini-4-hydrogen</code>). AI features remain disabled unless the server operator configures <code>GEMINI_API_KEY</code> and verifies data-use controls (<code>AI_DATA_CONTROLS_VERIFIED=true</code>). Before any AI request is sent, Wellnest asks for your explicit approval and displays the exact confirmed fields included. Wellnest does not claim that data sent to an external AI provider is excluded from model training unless the operator has independently verified and enabled a contractual zero-retention or non-training tier.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-[#F2F6F3]">
            4. Retention, Export &amp; Deletion Rights
          </h2>
          <p className="text-sm text-[#B6C8BE] leading-relaxed">
            You retain full control over your records. From Account Settings, you can adjust consent toggles, export all stored reports and wellbeing check-ins as JSON, or permanently delete your stored records at any time. Unconfirmed extractions are never used in insights or sent to AI providers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-[#F2F6F3]">
            5. Scope &amp; Compliance Honesty
          </h2>
          <p className="text-sm text-[#B6C8BE] leading-relaxed">
            Wellnest is an educational wellness tool and does not claim HIPAA, GDPR, or clinical regulatory certification without independent legal and security audit by the operator deploying it.
          </p>
        </section>
      </article>
    </div>
  );
}
