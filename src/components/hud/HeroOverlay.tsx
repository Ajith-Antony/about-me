import React from 'react';
import { ChevronDown, Compass, Sparkles, Terminal, MapPin } from 'lucide-react';

interface HeroOverlayProps {
  scrollProgress: number;
  onBeginExpedition: () => void;
}

export const HeroOverlay: React.FC<HeroOverlayProps> = ({
  scrollProgress,
  onBeginExpedition,
}) => {
  // Dissolve opacity as scroll advances (0 to 0.15)
  const opacity = Math.max(0, 1 - scrollProgress * 7);
  const translateY = scrollProgress * -80;

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
      {/* Top Header Badge */}
      <div className="flex items-center gap-3">
        <div className="glass-badge px-3.5 py-1.5 rounded-full flex items-center gap-2 border border-sky-400/30 text-xs font-mono tracking-wider text-sky-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-emerald-400 font-semibold">AVAILABLE FOR SENIOR ROLES</span>
          <span className="text-slate-500">|</span>
          <span className="flex items-center gap-1 text-slate-300">
            <MapPin className="w-3 h-3 text-sky-400" /> Dubai, UAE
          </span>
        </div>
      </div>

      {/* Hero Left Content Section */}
      <div className="max-w-2xl my-auto space-y-6 pt-12 md:pt-0">
        {/* Sub-eyebrow */}
        <div className="flex items-center gap-2 text-sky-400 font-mono text-xs md:text-sm tracking-widest uppercase">
          <Terminal className="w-4 h-4" />
          <span>Interactive 3D Expedition</span>
        </div>

        {/* Main Name & Title */}
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-none">
            Ajith <br />
            <span className="aurora-text-gradient">Pallissery Antony</span>
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-200 tracking-tight pt-1">
            Senior Frontend Engineer
          </p>
        </div>

        {/* Subtitle / Value Proposition */}
        <p className="text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed max-w-xl font-normal">
          Architecting Real-Time Systems, Web3 Platforms & High-Performance Web Apps with micro-second responsiveness and cinematic visual polish.
        </p>

        {/* Interactive Experience Badge */}
        <div className="inline-flex items-center gap-3 glass-panel px-4 py-3 rounded-xl border border-sky-500/20 text-slate-200 text-xs sm:text-sm">
          <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
          <span>
            <strong className="text-white font-semibold">6+ Years</strong> building low-latency Financial & PropTech products
          </span>
        </div>
      </div>

      {/* Bottom Scroll Prompt */}
      <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          onClick={onBeginExpedition}
          className="pointer-events-auto group flex items-center gap-3 glass-panel-glow px-6 py-3.5 rounded-full hover:border-sky-400 text-white font-medium text-sm transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-sky-950/50"
        >
          <Compass className="w-4 h-4 text-sky-400 group-hover:rotate-45 transition-transform duration-500" />
          <span>Begin Expedition</span>
          <ChevronDown className="w-4 h-4 text-sky-400 animate-bounce" />
        </button>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <span className="hidden sm:inline">Use [Wheel / Drag / Arrow Keys] to Trek</span>
          <span className="text-sky-400 font-bold">ALT 120m</span>
        </div>
      </div>
    </div>
  );
};
