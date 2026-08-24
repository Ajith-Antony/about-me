import React from 'react';
import { Eye, X, GraduationCap, Zap, Shield, Target, Sparkles } from 'lucide-react';
import { EngineeringPhilosophy } from '../../types';

interface PhilosophyPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PhilosophyPanel: React.FC<PhilosophyPanelProps> = ({ isOpen, onClose }) => {
  const philosophies: EngineeringPhilosophy[] = [
    {
      title: 'Performance-First Architecture',
      tagline: 'Zero-lag mindset for high-frequency systems',
      description: 'In financial trading and live Web3 platforms, milliseconds matter. I obsess over minimizing render cycles, optimizing WebSocket streaming buffers, and eliminating unnecessary re-renders with surgical state isolation.',
      icon: 'Zap',
    },
    {
      title: 'Pragmatic, Clean Engineering',
      tagline: 'Maintainability over speculative complexity',
      description: 'Code is written for humans to read and maintain for years. I favor explicit modular design, typed contracts with TypeScript, and battle-tested patterns over trendy premature abstractions.',
      icon: 'Shield',
    },
    {
      title: 'End-to-End Ownership',
      tagline: 'Full lifecycle delivery in fast-moving teams',
      description: 'From initial UI design and architecture to production deployment, KYC regulatory compliance, and telemetry monitoring, I take end-to-end accountability for shipping scalable software that drives real business value.',
      icon: 'Target',
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col glass-panel-glow rounded-2xl overflow-hidden border border-purple-500/30 text-slate-100 shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">The Ancient Observatory</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
                  CHECKPOINT 3 • 80%
                </span>
              </div>
              <p className="text-xs text-slate-400">Education & Core Engineering Philosophy</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-950/40">
          
          {/* Section 1: Education */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span>Academic Foundation</span>
            </h3>

            <div className="p-5 rounded-xl bg-slate-900/70 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-base sm:text-lg font-bold text-white">
                  B.Tech in Computer Science & Engineering
                </h4>
                <p className="text-sm text-slate-300">
                  APJ Abdul Kalam Technological University
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  Kerala, India • 2016 – 2020
                </p>
              </div>
              <div className="px-3.5 py-2 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-200 text-xs font-mono font-semibold shrink-0">
                CS & Systems Degree
              </div>
            </div>
          </div>

          {/* Section 2: Core Engineering Philosophies */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Three Engineering Pillars</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {philosophies.map((phil, idx) => (
                <div
                  key={phil.title}
                  className="p-4.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                      {idx === 0 && <Zap className="w-4 h-4" />}
                      {idx === 1 && <Shield className="w-4 h-4" />}
                      {idx === 2 && <Target className="w-4 h-4" />}
                    </div>
                    <h4 className="text-sm font-bold text-white tracking-tight">{phil.title}</h4>
                    <p className="text-xs font-mono text-purple-300">{phil.tagline}</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{phil.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Approaching Mountain Apex • 4,810m Altitude
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-purple-500/20"
          >
            Reach Summit
          </button>
        </div>

      </div>
    </div>
  );
};
