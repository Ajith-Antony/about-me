import React from 'react';
import { Compass, ChevronDown, Sparkles } from 'lucide-react';

interface HeroOverlayProps {
  scrollProgress: number;
  onBeginExpedition: () => void;
}

export const HeroOverlay: React.FC<HeroOverlayProps> = ({
  scrollProgress,
  onBeginExpedition,
}) => {
  // Smooth dissolve as expedition advances
  const opacity = Math.max(0, 1 - scrollProgress * 7.0);
  const translateY = scrollProgress * -80;

  if (opacity <= 0.01) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6 sm:p-12 md:p-16 max-w-7xl mx-auto"
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        transition: 'opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* 1. Header Status Eyebrow (Single eyebrow on the entire page) */}
      <div className="flex items-center justify-between pt-3 sm:pt-0">
        <div className="glass-badge px-4 py-1.5 rounded-full flex items-center gap-2.5 text-[11px] font-mono tracking-[0.18em] text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-200">EXPEDITION LIVE</span>
          <span className="text-slate-600">/</span>
          <span className="text-sky-400 font-bold">DUBAI, UAE</span>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-slate-400 tracking-[0.16em]">
          <span>LATENCY: &lt;10ms</span>
          <span className="text-slate-600">•</span>
          <span className="text-sky-400 font-semibold">ALT 120m</span>
        </div>
      </div>

      {/* 2. Main Editorial Headline & Value-Prop (Max 4 text elements) */}
      <div className="max-w-2xl my-auto space-y-6 pt-12 md:pt-0">
        <div className="space-y-2">
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-[-0.04em] text-white leading-[0.92]">
            Ajith <br />
            <span className="text-sky-400">Pallissery Antony</span>
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-200 tracking-[-0.02em] pt-1">
            Senior Frontend Engineer
          </p>
        </div>

        {/* Concise value prop: exactly 17 words */}
        <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-lg font-normal">
          Architecting low-latency trading engines, Web3 platforms, and high-performance web ecosystems with microsecond responsiveness.
        </p>

        {/* Experience Metric Pill */}
        <div className="inline-flex items-center gap-2.5 glass-panel px-4 py-2.5 rounded-2xl border border-white/10 text-slate-300 text-xs sm:text-sm shadow-xl">
          <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
          <span>
            <strong className="text-white font-bold">6+ Years</strong> building real-time Financial & PropTech products
          </span>
        </div>
      </div>

      {/* 3. Bottom Launch Bar */}
      <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          onClick={onBeginExpedition}
          className="pointer-events-auto group flex items-center gap-3 glass-panel-glow px-6 py-3.5 rounded-full hover:border-sky-400 text-white font-semibold text-xs sm:text-sm tracking-wide transition-all duration-200 active:scale-95 shadow-2xl shadow-sky-950/50"
        >
          <Compass className="w-4 h-4 text-sky-400 group-hover:rotate-45 transition-transform duration-300" />
          <span>Begin Expedition</span>
          <ChevronDown className="w-4 h-4 text-sky-400 animate-bounce" />
        </button>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-400 tracking-[0.16em]">
          <span className="hidden sm:inline">SCROLL / ARROWS TO TREK</span>
          <span className="text-sky-400 font-bold">4 CHECKPOINTS AHEAD</span>
        </div>
      </div>
    </div>
  );
};
