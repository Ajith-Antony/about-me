import React, { useState } from 'react';
import { Radio, X, Mail, Phone, Copy, Check, FileText, Send, Sparkles, MapPin, ExternalLink, Globe } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ContactTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenResume: () => void;
  onOpenMessage: () => void;
}

export const ContactTerminal: React.FC<ContactTerminalProps> = ({
  isOpen,
  onClose,
  onOpenResume,
  onOpenMessage,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const email = 'ajithpallisseryantony@gmail.com';
  const phone = '+971 589817188';
  const linkedin = 'https://www.linkedin.com/in/ajithpallisseryantony/';
  const github = 'https://github.com/Ajith-Antony';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);

    try {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#38bdf8', '#a855f7', '#34d399', '#facc15'],
      });
    } catch {
      // Confetti fallback
    }

    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col glass-panel-glow rounded-2xl overflow-hidden border border-yellow-500/30 text-slate-100 shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">The Summit Beacon</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 font-mono border border-yellow-500/30">
                  SUMMIT PEAK • 100%
                </span>
              </div>
              <p className="text-xs text-slate-400">Summit Transmission Terminal • Open for Collaboration</p>
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
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-950/50">
          
          {/* Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-yellow-950/30 via-slate-900 to-sky-950/30 border border-yellow-500/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-yellow-400">
              <Sparkles className="w-4 h-4" />
              <span>Expedition Complete • Summit Reached</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">
              Let&apos;s Build the Next Generation of High-Performance Web Apps
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Whether you&apos;re building real-time trading engines, fintech platforms, proptech ecosystems, or high-performance React architectures, I&apos;m ready to architect and deliver.
            </p>
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* Email Card */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/40 transition-all flex flex-col justify-between space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[11px] font-mono text-slate-400">Direct Email</p>
                  <p className="text-xs sm:text-sm font-semibold text-white truncate">{email}</p>
                </div>
              </div>
              <button
                onClick={handleCopyEmail}
                className="w-full py-2 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-200 text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Email Address'}</span>
              </button>
            </div>

            {/* Phone Card */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-mono text-slate-400">Direct Phone / WhatsApp</p>
                  <p className="text-xs sm:text-sm font-semibold text-white">{phone}</p>
                </div>
              </div>
              <a
                href={`tel:${phone.replace(/\s+/g, '')}`}
                className="w-full py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Directly</span>
              </a>
            </div>

            {/* LinkedIn Card */}
            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[11px] font-mono text-slate-400">Professional Network</p>
                  <p className="text-xs sm:text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                    linkedin.com/in/ajithpallisseryantony
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </a>

            {/* GitHub Card */}
            <a
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-500/40 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-700/40 text-slate-300 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[11px] font-mono text-slate-400">Open Source & Code</p>
                  <p className="text-xs sm:text-sm font-semibold text-white group-hover:text-slate-300 transition-colors">
                    github.com/Ajith-Antony
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
            </a>

          </div>

          {/* Quick Actions Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={onOpenResume}
              className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
            >
              <FileText className="w-4 h-4 text-sky-400" />
              <span>View / Download Full Resume</span>
            </button>

            <button
              onClick={onOpenMessage}
              className="py-3 px-4 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-yellow-500/20"
            >
              <Send className="w-4 h-4" />
              <span>Send Direct Message</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-yellow-400" />
            <span>Based in Dubai, United Arab Emirates • Relocation & Remote Capable</span>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Ajith Pallissery Antony • Senior Frontend Engineer
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close Terminal
          </button>
        </div>

      </div>
    </div>
  );
};
