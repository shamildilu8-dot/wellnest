import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { ChevronUp } from 'lucide-react';

interface FrontPageCurtainProps {
  onOpen: () => void;
}

export function FrontPageCurtain({ onOpen }: FrontPageCurtainProps) {
  const [closing, setClosing] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const dragStateRef = useRef<{
    active: boolean;
    startY: number;
    lastY: number;
    lastTime: number;
    velocityY: number;
    currentDeltaY: number;
  }>({
    active: false,
    startY: 0,
    lastY: 0,
    lastTime: 0,
    velocityY: 0,
    currentDeltaY: 0,
  });

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const triggerOpen = () => {
    if (closing) return;
    setClosing(true);
    setIsDragging(false);
    window.setTimeout(
      () => {
        onOpen();
      },
      prefersReduced ? 30 : 440,
    );
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        triggerOpen();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handlePointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (closing) return;
    dragStateRef.current = {
      active: true,
      startY: e.clientY,
      lastY: e.clientY,
      lastTime: performance.now(),
      velocityY: 0,
      currentDeltaY: 0,
    };
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore synthetic capture issues
    }
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (!dragStateRef.current.active || closing) return;
    const now = performance.now();
    const dt = Math.max(8, now - dragStateRef.current.lastTime);
    const dySinceLast = e.clientY - dragStateRef.current.lastY;
    dragStateRef.current.velocityY = dySinceLast / dt;
    dragStateRef.current.lastY = e.clientY;
    dragStateRef.current.lastTime = now;

    const rawDelta = e.clientY - dragStateRef.current.startY;
    const clamped =
      rawDelta < 0
        ? Math.max(-720, rawDelta)
        : Math.min(24, rawDelta * 0.22);
    dragStateRef.current.currentDeltaY = clamped;
    setOffsetY(clamped);
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLElement>) => {
    if (!dragStateRef.current.active) return;
    dragStateRef.current.active = false;
    setIsDragging(false);

    const finalDelta = Math.min(
      dragStateRef.current.currentDeltaY,
      e.clientY - dragStateRef.current.startY,
    );
    const velocityY = dragStateRef.current.velocityY;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    // Pure drag threshold: simple clicks without upward drag rebound gently back
    if (finalDelta < -85 || (finalDelta < -25 && velocityY < -0.3)) {
      triggerOpen();
    } else {
      dragStateRef.current.currentDeltaY = 0;
      setOffsetY(0);
    }
  };

  const progress = Math.min(1, Math.max(0, -offsetY / 260));
  const curtainOpacity = closing ? 0 : 1 - progress * 0.35;
  const cardScale = 1 - progress * 0.035;

  return (
    <section
      aria-label="Wellnest front cover page — drag up to enter"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        transform: closing
          ? 'translate3d(0, -100%, 0)'
          : `translate3d(0, ${offsetY}px, 0)`,
        opacity: curtainOpacity,
        transition:
          isDragging || prefersReduced
            ? 'none'
            : 'transform 440ms cubic-bezier(0.16, 1, 0.3, 1), opacity 380ms ease-out',
      }}
      className="fixed inset-0 z-50 overflow-hidden bg-[#050A08] flex flex-col justify-between select-none cursor-grab active:cursor-grabbing touch-none"
    >
      {/* Animated Glass DNA Helix & Refractive Obsidian Backdrop */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        {!imgError && (
          <img
            src="/assets/aistudio/image_52309581.png"
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center opacity-75 wn-animate-helix"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 48%, rgba(20, 72, 54, 0.28), rgba(4, 7, 6, 0.86) 62%, rgba(2, 4, 4, 0.96) 100%), radial-gradient(circle at 72% 38%, rgba(232, 122, 61, 0.14), transparent 46%)',
          }}
        />
      </div>

      {/* Top Brand Header (no click-to-skip button — pure drag interaction) */}
      <header className="relative z-10 mx-auto w-full max-w-6xl px-5 sm:px-8 pt-6 flex items-center justify-between gap-4 pointer-events-none">
        <span className="inline-flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight text-[#F4F7F5] whitespace-nowrap shrink-0">
          <img
            src="/assets/wellnest-logo.png"
            alt=""
            referrerPolicy="no-referrer"
            className="w-7 h-7 object-contain shrink-0"
          />
          <span>Wellnest</span>
        </span>
        <span className="text-xs text-[#C8D7CF]">
          Educational Health Insights
        </span>
      </header>

      {/* Glass Centerpiece Card */}
      <div
        style={{
          transform: `scale(${cardScale})`,
          transition: isDragging
            ? 'none'
            : 'transform 340ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="relative z-10 mx-auto w-full max-w-2xl px-5 sm:px-6 my-auto pointer-events-none"
      >
        <div className="wn-glass-crystal wn-shimmer-card rounded-3xl px-6 py-9 sm:px-12 sm:py-11 text-center relative overflow-hidden">
          <div className="relative z-10 space-y-5">
            <div
              className="mx-auto w-14 h-1.5 rounded-full bg-white/35"
              aria-hidden="true"
            />

            <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
              <svg
                aria-hidden="true"
                viewBox="0 0 100 100"
                className="wn-spin-slow absolute inset-0 w-full h-full text-[#F28D54]/55"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.75"
                  strokeDasharray="3 4"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="41"
                  fill="none"
                  stroke="rgba(167,243,208,0.28)"
                  strokeWidth="0.6"
                />
              </svg>
              <img
                src="/assets/wellnest-logo.png"
                alt="Wellnest emblem"
                referrerPolicy="no-referrer"
                className="wn-medallion-breathe relative z-10 w-16 h-16 object-contain"
              />
            </div>

            <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-[#E4EDE8]/85 drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)]">
              Calm Educational Health Insights
            </p>

            {/* Refractive Crystal Orb centered directly behind the 3-layer shiny glass headline */}
            <div className="relative py-5 sm:py-7 flex items-center justify-center">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                <div className="relative w-52 h-52 sm:w-64 sm:h-64 rounded-full border border-white/25 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.22),rgba(18,44,36,0.28)_48%,rgba(3,6,5,0.9)_100%)] shadow-[inset_0_2px_18px_rgba(255,255,255,0.48),inset_0_-12px_28px_rgba(103,232,249,0.18),0_20px_50px_rgba(0,0,0,0.8)]">
                  <svg
                    viewBox="0 0 240 240"
                    className="wn-spin-slow w-full h-full opacity-90"
                  >
                    <defs>
                      <linearGradient id="wnPrismArcA" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.92)" />
                        <stop offset="45%" stopColor="rgba(103,232,249,0.68)" />
                        <stop offset="80%" stopColor="rgba(251,146,60,0.68)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                      </linearGradient>
                      <linearGradient id="wnPrismArcB" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
                        <stop offset="50%" stopColor="rgba(167,243,208,0.45)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 28 112 C 42 48, 128 24, 194 64"
                      fill="none"
                      stroke="url(#wnPrismArcA)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 48 184 C 98 214, 178 194, 210 132"
                      fill="none"
                      stroke="url(#wnPrismArcA)"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 42 84 C 94 128, 148 136, 206 106"
                      fill="none"
                      stroke="url(#wnPrismArcB)"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 52 152 C 110 174, 162 158, 198 118"
                      fill="none"
                      stroke="url(#wnPrismArcB)"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              {/* 3-Layer Shiny Chromatic Transparent Liquid-Crystal Headline */}
              <h1 className="relative mx-auto max-w-xl font-display text-4xl sm:text-5xl lg:text-[3.35rem] font-bold tracking-tight leading-[1.08] text-balance">
                <span
                  aria-hidden="true"
                  className="pointer-events-none select-none absolute inset-0 block wn-crystal-prism"
                >
                  Clarity for your labs &amp; clinical genetics.
                </span>
                <span className="relative z-10 block wn-crystal-rim">
                  Clarity for your labs &amp; clinical genetics.
                </span>
                <span
                  aria-hidden="true"
                  className="pointer-events-none select-none absolute inset-0 z-20 block wn-crystal-shine"
                >
                  Clarity for your labs &amp; clinical genetics.
                </span>
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Minimal Bottom Drag-Up Gesture Chevrons & Progress Bar (No down text) */}
      <div
        style={{ opacity: Math.max(0.2, 1 - progress * 1.2) }}
        className="relative z-10 pb-9 px-6 flex flex-col items-center gap-2.5 pointer-events-none"
      >
        <div className="flex flex-col items-center -space-y-2.5" aria-hidden="true">
          <ChevronUp className="w-5 h-5 text-[#F28D54] wn-animate-chevron" />
          <ChevronUp className="w-5 h-5 text-[#F28D54]/60 wn-animate-chevron [animation-delay:220ms]" />
        </div>
        <div
          aria-hidden="true"
          className="w-28 h-1 rounded-full bg-white/15 overflow-hidden"
        >
          <div
            className="h-full bg-[#E87A3D] rounded-full transition-[width] duration-75"
            style={{ width: `${Math.max(12, Math.round(progress * 100))}%` }}
          />
        </div>
      </div>
    </section>
  );
}
