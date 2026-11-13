import { OWNER_CONTACT } from '../data/demoData';
import type { AppView } from '../types/wellnest';

interface FooterProps {
  onNavigate: (view: AppView) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="relative z-10 mt-16 border-t border-white/15 bg-[#070E0C]/70 backdrop-blur-2xl">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
        <div>
          <div className="inline-flex items-center gap-2.5">
            <img
              src="/assets/wellnest-logo.png"
              alt=""
              referrerPolicy="no-referrer"
              className="w-7 h-7 object-contain shrink-0"
            />
            <p className="font-display text-base font-semibold text-[#F2F6F3]">
              Wellnest
            </p>
          </div>
          <p className="mt-2 text-xs text-[#9BB0A5] leading-relaxed max-w-xs">
            Educational health insights workspace. Never a substitute for qualified medical diagnosis, clinical judgment, or emergency care.
          </p>
        </div>

        <div>
          <p className="font-display text-xs font-semibold tracking-wide text-[#C4D4CB]">
            Navigation
          </p>
          <ul className="mt-3 space-y-2 text-xs text-[#9BB0A5]">
            <li>
              <button
                type="button"
                onClick={() => onNavigate('research')}
                className="hover:text-[#F2F6F3] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[#E87A3D] rounded"
              >
                Nutrition Research &amp; Sources
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('privacy')}
                className="hover:text-[#F2F6F3] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[#E87A3D] rounded"
              >
                Privacy Policy
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="hover:text-[#F2F6F3] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[#E87A3D] rounded"
              >
                Contact &amp; Urgent Care Guidance
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className="hover:text-[#F2F6F3] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[#E87A3D] rounded"
              >
                Consent &amp; Account Settings
              </button>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-display text-xs font-semibold tracking-wide text-[#C4D4CB]">
            Owner Contact
          </p>
          <div className="mt-3 space-y-1.5 text-xs text-[#E2EBE6] font-mono-tabular">
            <p className="font-semibold text-[#F2F6F3]">{OWNER_CONTACT.name}</p>
            <p>CONTACT NO. {OWNER_CONTACT.phone}</p>
            <p>
              EMAIL:{' '}
              <a
                href={`mailto:${OWNER_CONTACT.email}`}
                className="text-[#F28D54] hover:underline focus-visible:outline-2 focus-visible:outline-[#E87A3D] rounded"
              >
                {OWNER_CONTACT.email}
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
