import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface OpeningSplashProps {
  onComplete: () => void;
}

export function OpeningSplash({ onComplete }: OpeningSplashProps) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const timer = window.setTimeout(
      () => {
        setFading(true);
        window.setTimeout(onComplete, prefersReduced ? 50 : 280);
      },
      prefersReduced ? 350 : 1500,
    );

    return () => window.clearTimeout(timer);
  }, [onComplete]);

  const handleSkip = () => {
    setFading(true);
    window.setTimeout(onComplete, 120);
  };

  return (
    <div
      role="region"
      aria-label="Wellnest opening welcome"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center wn-ambient-bg px-6 transition-opacity duration-300 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="wn-glass rounded-2xl p-8 sm:p-10 max-w-md w-full text-center shadow-2xl">
        <div className="mx-auto mb-6 relative w-20 h-20 flex items-center justify-center">
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border border-[#34D399]/30 animate-ping [animation-duration:2.4s]"
          />
          <span
            aria-hidden="true"
            className="absolute inset-2 rounded-full border border-[#E87A3D]/40"
          />
          <svg
            width="36"
            height="36"
            viewBox="0 0 36 36"
            fill="none"
            aria-hidden="true"
            className="text-[#E87A3D]"
          >
            <path
              d="M5 19H11L14.5 11L19.5 25L23 16L25.5 19H31"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="font-display text-2xl font-semibold tracking-tight text-[#F2F6F3]">
          Wellnest
        </h1>
        <p className="mt-2 text-sm text-[#A7BBB1] leading-relaxed">
          Calm, educational context for your lab reports and interpreted genetic findings.
        </p>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleSkip}
            className="inline-flex items-center gap-2 rounded-lg bg-[#E87A3D] px-5 py-2.5 text-sm font-medium text-[#09120F] hover:bg-[#F28D54] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F28D54] whitespace-nowrap shrink-0"
          >
            <span>Continue to Wellnest</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
