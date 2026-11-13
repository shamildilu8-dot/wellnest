import { useState, type FormEvent } from 'react';
import { ArrowRight, KeyRound, ShieldCheck } from 'lucide-react';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import type { UserProfile } from '../types/wellnest';
import { SafetyDisclaimer } from './SafetyDisclaimer';

interface AuthViewProps {
  onAuthenticated: (profile: UserProfile) => void;
  onEnterDemo: () => void;
}

export function AuthView({ onAuthenticated, onEnterDemo }: AuthViewProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    const sb = getSupabaseClient();
    if (!sb) {
      setErrorMsg(
        'Supabase Authentication is not configured in this environment yet. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to enable personal accounts, or continue in Demo Mode below.',
      );
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const { data, error } = await sb.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          setErrorMsg(error.message);
          return;
        }
        if (data.user) {
          onAuthenticated({
            id: data.user.id,
            email: data.user.email ?? email.trim(),
            fullName:
              (data.user.user_metadata?.full_name as string | undefined) || undefined,
            mode: 'authenticated',
          });
        }
      } else {
        const { data, error } = await sb.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() || undefined },
          },
        });
        if (error) {
          setErrorMsg(error.message);
          return;
        }
        if (data.session && data.user) {
          onAuthenticated({
            id: data.user.id,
            email: data.user.email ?? email.trim(),
            fullName: fullName.trim() || undefined,
            mode: 'authenticated',
          });
        } else {
          setInfoMsg(
            'Account created. Please check your email inbox to confirm your address before signing in.',
          );
        }
      }
    } catch {
      setErrorMsg('Unable to reach the authentication service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-8 pb-12 space-y-8">
      <SafetyDisclaimer compact />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 wn-glass rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-semibold text-[#F2F6F3]">
                {mode === 'signin' ? 'Sign in to Wellnest' : 'Create your Wellnest account'}
              </h1>
              <p className="mt-1 text-sm text-[#A7BBB1]">
                Personal reports are stored privately per authenticated account.
              </p>
            </div>
          </div>

          <div
            role="tablist"
            aria-label="Authentication mode"
            className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-[#0B1713] border border-white/10"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className={`py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                mode === 'signin'
                  ? 'bg-[#1A3329] text-[#F2F6F3]'
                  : 'text-[#A7BBB1] hover:text-[#F2F6F3]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className={`py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                mode === 'signup'
                  ? 'bg-[#1A3329] text-[#F2F6F3]'
                  : 'text-[#A7BBB1] hover:text-[#F2F6F3]'
              }`}
            >
              Create Account
            </button>
          </div>

          {!isSupabaseConfigured && (
            <div className="rounded-xl border border-[#FBBF24]/30 bg-[#3B2A12]/40 p-4 text-xs text-[#FDE68A] leading-relaxed">
              <strong className="font-semibold text-white">Supabase Auth Setup Pending:</strong>{' '}
              <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> are not configured yet. Real account sign-in activates automatically once configured in <code>.env</code>. You can explore all features right now using Demo Mode.
            </div>
          )}

          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl border border-[#F87171]/40 bg-[#3B1517]/60 p-3.5 text-xs text-[#FECACA]"
            >
              {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div
              role="status"
              className="rounded-xl border border-[#34D399]/35 bg-[#123024]/70 p-3.5 text-xs text-[#A7F3D0]"
            >
              {infoMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label
                  htmlFor="auth-fullname"
                  className="block text-xs font-medium text-[#C8D7CF] mb-1.5"
                >
                  Full Name (optional)
                </label>
                <input
                  id="auth-fullname"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Amina Patel"
                  className="w-full rounded-lg border border-white/15 bg-[#0A1511] px-3.5 py-2.5 text-sm text-[#F2F6F3] placeholder:text-[#6E857A] focus:outline-none focus:ring-2 focus:ring-[#E87A3D]"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-medium text-[#C8D7CF] mb-1.5"
              >
                Email Address
              </label>
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-white/15 bg-[#0A1511] px-3.5 py-2.5 text-sm text-[#F2F6F3] placeholder:text-[#6E857A] focus:outline-none focus:ring-2 focus:ring-[#E87A3D]"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-medium text-[#C8D7CF] mb-1.5"
              >
                Password (8+ characters)
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={8}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-white/15 bg-[#0A1511] px-3.5 py-2.5 text-sm text-[#F2F6F3] placeholder:text-[#6E857A] focus:outline-none focus:ring-2 focus:ring-[#E87A3D]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#E87A3D] px-5 py-3 text-sm font-semibold text-[#09120F] hover:bg-[#F28D54] disabled:opacity-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F28D54]"
            >
              <KeyRound className="w-4 h-4" aria-hidden="true" />
              <span>
                {loading
                  ? 'Please wait...'
                  : mode === 'signin'
                    ? 'Sign In'
                    : 'Create Account'}
              </span>
            </button>
          </form>
        </div>

        <aside className="lg:col-span-5 wn-glass rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2.5 text-[#34D399]">
            <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            <h2 className="font-display text-lg font-semibold text-[#F2F6F3]">
              Preview with Demo Data
            </h2>
          </div>
          <p className="text-sm text-[#B6C8BE] leading-relaxed">
            Want to inspect Wellnest before connecting Supabase? Enter the clearly labeled Demo Mode with sample lab panels, an interpreted pharmacogenomic summary, and local-only session state.
          </p>
          <ul className="space-y-2 text-xs text-[#A7BBB1]">
            <li>· Sample data is clearly marked as demo content</li>
            <li>· Test report upload, confirmation, and AI consent flow</li>
            <li>· Zero personal health records stored on remote servers</li>
          </ul>
          <button
            type="button"
            onClick={onEnterDemo}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-[#F2F6F3] hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E87A3D]"
          >
            <span>Continue in Demo Mode</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </aside>
      </div>
    </div>
  );
}
