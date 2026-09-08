import React from 'react';
import { Volume2, VolumeX, Compass, MapPin, Layers, Tent, Eye, Radio, Navigation } from 'lucide-react';

interface HUDControlsProps {
  scrollProgress: number;
  onJumpToProgress: (progress: number) => void;
  isMuted: boolean;
  onToggleSound: () => void;
  activeCheckpoint: number | null;
  onOpenCheckpointModal: (checkpointId: number) => void;
}

export const HUDControls: React.FC<HUDControlsProps> = ({
  scrollProgress,
  onJumpToProgress,
  isMuted,
  onToggleSound,
  activeCheckpoint,
  onOpenCheckpointModal,
}) => {
  // Continuous elevation calculation: 120m trailhead -> 4,810m summit
  const currentElevation = Math.round(120 + scrollProgress * 4690);

  // Real-time GPS coordinate telemetry
  const latProgress = (25.2048 + scrollProgress * (78.2232 - 25.2048)).toFixed(2);
  const longProgress = (55.2708 - scrollProgress * (55.2708 - 15.6267)).toFixed(2);

  const checkpoints = [
    { id: 0, p: 0.0, label: 'Base', icon: Navigation },
    { id: 1, p: 0.25, label: 'Skills', icon: Layers },
    { id: 2, p: 0.55, label: 'Experience', icon: Tent },
    { id: 3, p: 0.80, label: 'Philosophy', icon: Eye },
    { id: 4, p: 1.00, label: 'Summit', icon: Radio },
  ];

  return (
    <>
      {/* Top Header Bar — Single-Line Apple Translucent Chrome */}
      <header className="fixed top-0 left-0 right-0 z-30 p-3 sm:p-5 flex items-center justify-between pointer-events-none">
        
        {/* Left: Compass & Elevation Tracker */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          <div className="glass-panel px-3.5 sm:px-4 py-2 rounded-full flex items-center gap-2.5 text-xs font-mono text-slate-200 border border-white/10 shadow-xl">
            <Compass className="w-4 h-4 text-sky-400 animate-spin-slow" />
            <div className="flex items-center gap-2 tracking-[0.16em]">
              <span className="font-bold text-white">ALT {currentElevation}m</span>
              <span className="text-slate-600">•</span>
              <span className="hidden md:inline text-sky-300/80">{latProgress}°N, {longProgress}°E</span>
            </div>
          </div>
        </div>

        {/* Center: Checkpoint Quick Navigation (Single Line Desktop) */}
        <nav className="hidden lg:flex items-center gap-1.5 glass-panel px-3 py-1.5 rounded-full border border-white/10 pointer-events-auto shadow-xl">
          {checkpoints.map((cp) => {
            const Icon = cp.icon;
            const isNear = Math.abs(scrollProgress - cp.p) < 0.1;
            return (
              <button
                key={cp.id}
                onClick={() => {
                  onJumpToProgress(cp.p);
                  if (cp.id > 0) onOpenCheckpointModal(cp.id);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono tracking-[0.14em] font-medium flex items-center gap-1.5 transition-all active:scale-95 ${
                  isNear
                    ? 'bg-sky-500/25 border border-sky-400 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-sky-400" />
                <span>{cp.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Sound Design Toggle */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onToggleSound}
            className={`glass-panel p-2.5 sm:px-4 sm:py-2 rounded-full flex items-center gap-2 text-xs font-mono tracking-[0.16em] transition-all border active:scale-95 ${
              !isMuted
                ? 'border-emerald-400/40 text-emerald-300 bg-emerald-950/30 shadow-lg shadow-emerald-950/40'
                : 'border-white/10 text-slate-400 hover:text-slate-200'
            }`}
            title={isMuted ? 'Unmute Arctic Atmosphere' : 'Mute Audio'}
          >
            {!isMuted ? <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline font-semibold">{!isMuted ? 'AUDIO LIVE' : 'SOUND MUTED'}</span>
          </button>
        </div>
      </header>

      {/* Floating Checkpoint Trigger Beacon on Right Screen */}
      {activeCheckpoint && activeCheckpoint > 0 && (
        <div className="fixed right-6 bottom-24 z-20 pointer-events-auto animate-in slide-in-from-right duration-200">
          <button
            onClick={() => onOpenCheckpointModal(activeCheckpoint)}
            className="group flex items-center gap-3 glass-panel-glow px-4 py-3 rounded-2xl border border-sky-400 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
            <div className="text-left">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-sky-400 font-bold">
                Checkpoint {activeCheckpoint} Active
              </p>
              <p className="text-xs font-bold text-white">
                {activeCheckpoint === 1 && 'Open Skills Signpost'}
                {activeCheckpoint === 2 && 'Open Campsite Quest Log'}
                {activeCheckpoint === 3 && 'Open Observatory Specs'}
                {activeCheckpoint === 4 && 'Open Summit Terminal'}
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Bottom Scrollytelling Progress Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 p-3 sm:p-5 pointer-events-none flex flex-col items-center">
        <div className="w-full max-w-xl glass-panel p-3 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto space-y-2">
          
          <div className="flex items-center justify-between text-[11px] font-mono tracking-[0.16em] text-slate-300">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span>Expedition Progress</span>
            </span>
            <span className="font-bold text-sky-400">{Math.round(scrollProgress * 100)}%</span>
          </div>

          {/* Interactive Progress Track */}
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickP = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              onJumpToProgress(clickP);
            }}
            className="relative w-full h-2 rounded-full bg-slate-900/90 cursor-pointer overflow-hidden border border-slate-800"
          >
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-150"
              style={{ width: `${scrollProgress * 100}%` }}
            />
          </div>

          {/* Checkpoint Markers on Progress Bar */}
          <div className="flex justify-between items-center px-1 text-[10px] font-mono tracking-[0.14em] text-slate-400">
            {checkpoints.map((cp) => (
              <button
                key={cp.id}
                onClick={() => {
                  onJumpToProgress(cp.p);
                  if (cp.id > 0) onOpenCheckpointModal(cp.id);
                }}
                className={`hover:text-sky-300 transition-colors active:scale-95 ${
                  Math.abs(scrollProgress - cp.p) < 0.08 ? 'text-sky-400 font-bold' : ''
                }`}
              >
                {cp.label}
              </button>
            ))}
          </div>

        </div>
      </footer>
    </>
  );
};
