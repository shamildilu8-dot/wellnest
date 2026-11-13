import { Mail, Phone, UserCheck } from 'lucide-react';
import { OWNER_CONTACT } from '../data/demoData';
import { SafetyDisclaimer } from './SafetyDisclaimer';

export function ContactView() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-8 pb-12 space-y-8">
      <SafetyDisclaimer />

      <section className="wn-glass rounded-2xl p-6 sm:p-10 space-y-6">
        <div>
          <p className="text-xs font-medium text-[#F28D54]">
            Wellnest Ownership &amp; Inquiries
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-semibold text-[#F2F6F3]">
            Contact Information
          </h1>
          <p className="mt-2 text-sm text-[#B6C8BE] leading-relaxed">
            For questions about Wellnest, privacy requests, or educational platform feedback, reach the owner directly below. Please do not email urgent medical emergencies—contact local emergency services instead.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="wn-glass-subtle rounded-xl p-5 space-y-2">
            <UserCheck className="w-5 h-5 text-[#34D399]" aria-hidden="true" />
            <p className="text-xs text-[#9BB0A5]">Owner</p>
            <p className="font-display text-sm font-semibold text-[#F2F6F3]">
              {OWNER_CONTACT.name}
            </p>
          </div>

          <div className="wn-glass-subtle rounded-xl p-5 space-y-2">
            <Phone className="w-5 h-5 text-[#F28D54]" aria-hidden="true" />
            <p className="text-xs text-[#9BB0A5]">Contact No.</p>
            <p className="font-mono-tabular text-sm font-semibold text-[#F2F6F3]">
              <a
                href={`tel:${OWNER_CONTACT.phone}`}
                className="hover:underline focus-visible:outline-2 focus-visible:outline-[#E87A3D] rounded"
              >
                {OWNER_CONTACT.phone}
              </a>
            </p>
          </div>

          <div className="wn-glass-subtle rounded-xl p-5 space-y-2">
            <Mail className="w-5 h-5 text-[#34D399]" aria-hidden="true" />
            <p className="text-xs text-[#9BB0A5]">Email</p>
            <p className="font-mono-tabular text-sm font-semibold text-[#F2F6F3] break-all">
              <a
                href={`mailto:${OWNER_CONTACT.email}`}
                className="text-[#F28D54] hover:underline focus-visible:outline-2 focus-visible:outline-[#E87A3D] rounded"
              >
                {OWNER_CONTACT.email}
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
