import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { AppView, UserProfile } from '../types/wellnest';

interface NavbarProps {
  currentView: AppView;
  user: UserProfile | null;
  onNavigate: (view: AppView) => void;
}

export function Navbar({ currentView, user, onNavigate }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: Array<{ id: AppView; label: string }> = user
    ? [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'upload', label: 'Upload' },
        { id: 'insights', label: 'Results' },
        { id: 'research', label: 'Research' },
        { id: 'ai-guide', label: 'AI Guide' },
        { id: 'privacy', label: 'Privacy' },
      ]
    : [
        { id: 'landing', label: 'Overview' },
        { id: 'research', label: 'Research' },
        { id: 'privacy', label: 'Privacy' },
        { id: 'contact', label: 'Contact' },
        { id: 'auth', label: 'Sign In' },
      ];

  const handleNav = (view: AppView) => {
    setMobileMenuOpen(false);
    onNavigate(view);
  };

  const primaryActionLabel = user
    ? user.mode === 'demo'
      ? 'Settings'
      : 'Account'
    : 'Open Workspace';

  const primaryActionTarget: AppView = user ? 'settings' : 'dashboard';

  return (
    <header className="sticky top-0 z-40 border-b border-white/15 bg-[#0B1713]/60 backdrop-blur-2xl shadow-[inset_0_-1px_0_rgba(255,255,255,0.06)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Logo & Wordmark */}
        <button
          type="button"
          onClick={() => handleNav(user ? 'dashboard' : 'landing')}
          className="inline-flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight text-[#F2F6F3] hover:text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E87A3D] rounded"
        >
          <img
            src="/assets/wellnest-logo.png"
            alt=""
            referrerPolicy="no-referrer"
            className="w-8 h-8 object-contain shrink-0"
          />
          <span>Wellnest</span>
        </button>

        {/* Zone 2: Concise single-line nav links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium"
        >
          {navItems.map((item) => {
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E87A3D] ${
                  active
                    ? 'border-[#E87A3D] text-[#F2F6F3]'
                    : 'border-transparent text-[#A7BBB1] hover:text-[#F2F6F3]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action + mobile menu button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleNav(primaryActionTarget)}
            className="hidden sm:inline-flex items-center justify-center rounded-lg bg-[#E87A3D] px-4 py-2 text-xs font-semibold text-[#09120F] hover:bg-[#F28D54] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F28D54]"
          >
            {primaryActionLabel}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-white/15 text-[#F2F6F3] hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E87A3D]"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-white/10 bg-[#0B1713] px-4 py-4 space-y-1"
        >
          {navItems.map((item) => {
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white/10 text-[#F2F6F3]'
                    : 'text-[#A7BBB1] hover:bg-white/5 hover:text-[#F2F6F3]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          {user && (
            <button
              type="button"
              onClick={() => handleNav('contact')}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#A7BBB1] hover:bg-white/5 hover:text-[#F2F6F3]"
            >
              Contact
            </button>
          )}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleNav(primaryActionTarget)}
              className="w-full rounded-lg bg-[#E87A3D] px-4 py-2.5 text-sm font-semibold text-[#09120F] hover:bg-[#F28D54]"
            >
              {primaryActionLabel}
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
