import React from 'react';
import { ChevronDown, Compass, Sparkles, Terminal, MapPin, Radio, Activity } from 'lucide-react';

interface HeroOverlayProps {
  scrollProgress: number;
  onBeginExpedition: () => void;
}

export const HeroOverlay: React.FC<HeroOverlayProps> = ({
  scrollProgress,
  onBeginExpedition,
}) => {
  // Smooth dissolve opacity as scroll advances
  const opacity = Math.max(0, 1 - scrollProgress * 7.5);
  const translateY = scrollProgress * -70;

  if (opacity <= 0.01) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6 sm:p-12 md:p-16 max-w-7xl mx-auto"
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        transition: 'opacity 0.2s ease-out',
      }}
    >
      {/* Top Header Eyebrow (Monoio Style) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 sm:pt-0">
        <div className="glass-badge px-3.5 py-1.5 rounded-full flex items-center gap-2.5 border border-white/10 text-[11px] font-mono tracking-[0.2em] text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 font-bold">EXPEDITION LIVE</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-sky-400" /> DUBAI, UAE
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400 tracking-[0.18em]">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>SYS.LATENCY: &lt;12ms</span>
        </div>
      </div>

      {/* Main Hero Typography & Void Composition (Monoio Aesthetic) */}
      <div className="max-w-2xl my-auto space-y-6 pt-10 md:pt-0">
        
        {/* Eyebrow */}
        <div className="flex items-center gap-2 text-sky-400 font-mono text-xs md:text-sm tracking-[0.22em] uppercase font-semibold">
          <Terminal className="w-4 h-4" />
          <span>Interactive 3D Portfolio</span>
        </div>

        {/* Display Headline */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-[-0.04em] text-white leading-[0.94]">
            Ajith <br />
            <span className="aurora-text-gradient">Pallissery Antony</span>
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-200 tracking-[-0.02em] pt-1">
            Senior Frontend Engineer
          </p>
        </div>

        {/* Editorial Subtext */}
        <p className="text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed max-w-xl font-normal">
          Architecting real-time trading engines, Web3 platforms, and high-performance web ecosystems with microsecond responsiveness and cinematic visual craft.
        </p>

        {/* Experience Pill */}
        <div className="inline-flex items-center gap-3 glass-panel px-4 py-3 rounded-2xl border border-white/10 text-slate-200 text-xs sm:text-sm shadow-xl">
          <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
          <span>
            <strong className="text-white font-bold">6+ Years</strong> engineering high-throughput Financial & PropTech products
          </span>
        </div>
      </div>

      {/* Bottom Expedition Launch Bar */}
      <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          onClick={onBeginExpedition}
          className="pointer-events-auto group flex items-center gap-3 glass-panel-glow px-7 py-3.5 rounded-full hover:border-sky-400 text-white font-semibold text-sm transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl shadow-sky-950/60"
        >
          <Compass className="w-4 h-4 text-sky-400 group-hover:rotate-45 transition-transform duration-500" />
          <span>Begin Expedition</span>
          <ChevronDown className="w-4 h-4 text-sky-400 animate-bounce" />
        </button>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400 tracking-[0.16em]">
          <span className="hidden sm:inline">SCROLL / ARROW KEYS TO TREK</span>
          <span className="text-sky-400 font-bold">ALT 120m</span>
        </div>
      </div>
    </div>
  );
};
