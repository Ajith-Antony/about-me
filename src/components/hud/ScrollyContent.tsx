import React, { useState } from 'react';
import {
  Layers,
  Database,
  ShieldCheck,
  Cpu,
  Tent,
  Eye,
  Radio,
  Award,
  Mail,
  Phone,
  Copy,
  Check,
  FileText,
  Send,
  Zap,
  Shield,
  Target,
  GraduationCap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ScrollyContentProps {
  scrollProgress: number;
  onOpenResume: () => void;
  onOpenMessage: () => void;
}

export const ScrollyContent: React.FC<ScrollyContentProps> = ({
  scrollProgress,
  onOpenResume,
  onOpenMessage,
}) => {
  const [skillTab, setSkillTab] = useState<number>(0);
  const [selectedExpId, setSelectedExpId] = useState<string>('boli');
  const [copied, setCopied] = useState<boolean>(false);

  // Active section calculation based on scroll progression along the trail
  let activeSection = 0;
  if (scrollProgress >= 0.88) activeSection = 4;
  else if (scrollProgress >= 0.68) activeSection = 3;
  else if (scrollProgress >= 0.38) activeSection = 2;
  else if (scrollProgress >= 0.14) activeSection = 1;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('ajithpallisseryantony@gmail.com');
    setCopied(true);
    try {
      confetti({
        particleCount: 50,
        spread: 55,
        origin: { y: 0.65 },
        colors: ['#38bdf8', '#7dd3fc', '#ffffff', '#34d399'],
      });
    } catch {
      // fallback
    }
    setTimeout(() => setCopied(false), 2400);
  };

  const skillCategories = [
    {
      name: 'Frontend & UI',
      icon: Layers,
      skills: [
        { name: 'React & Next.js (App Router / SSR)', level: 98 },
        { name: 'TypeScript & Modern ES6+', level: 96 },
        { name: 'WebSockets & Live Order Books', level: 95 },
        { name: 'TradingView & Lightweight Charts', level: 95 },
        { name: 'Redux Toolkit / Saga & State Isolation', level: 94 },
        { name: 'Ag-Grid & High-Frequency Tables', level: 92 },
        { name: 'Tailwind CSS & Design Systems', level: 96 },
      ],
    },
    {
      name: 'Backend & Data',
      icon: Database,
      skills: [
        { name: 'Node.js & Express / Fastify', level: 90 },
        { name: 'PostgreSQL & SQL Schema Architecture', level: 88 },
        { name: 'MongoDB & Document Pipelines', level: 88 },
        { name: 'RESTful API Engineering & Webhooks', level: 94 },
        { name: 'Redis Caching & Performance Tuning', level: 86 },
      ],
    },
    {
      name: 'Web3 & Security',
      icon: ShieldCheck,
      skills: [
        { name: 'Shufti KYC Identity Pipeline Verification', level: 96 },
        { name: 'EVM Wallet Connectivity (MetaMask/WalletConnect)', level: 94 },
        { name: 'NFT Marketplace & DEX Architecture', level: 92 },
        { name: 'Multi-Gateway Payment Integration', level: 92 },
      ],
    },
    {
      name: 'DevOps & Perf',
      icon: Cpu,
      skills: [
        { name: 'Core Web Vitals Optimization (95+ Scores)', level: 98 },
        { name: 'Docker & Containerization', level: 86 },
        { name: 'Vite & Webpack Bundler Optimization', level: 92 },
        { name: 'Technical SEO Architecture', level: 94 },
      ],
    },
  ];

  const experiences = [
    {
      id: 'boli',
      company: 'boli.ae',
      role: 'Senior Frontend Engineer',
      period: 'Dec 2025 – Present | Dubai, UAE',
      badge: 'CURRENT MISSION',
      summary: 'Spearheading the end-to-end frontend launch for a high-growth proptech ecosystem.',
      highlights: [
        'Integrated Shufti KYC pipelines for automated identity verification & regulatory compliance.',
        'Built multi-gateway payment architecture for Power of Attorney (POA) & property valuation workflows.',
        'Revamped legacy SEO architecture, boosting Core Web Vitals to 95+ desktop/mobile.',
      ],
      tags: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Shufti KYC'],
      metric: '100% KYC Automated & Sub-second Vitals',
    },
    {
      id: 'coinroutes',
      company: 'Coinroutes',
      role: 'Senior Frontend Engineer',
      period: 'Sept 2024 – Dec 2025 | Dubai, UAE',
      badge: 'CRYPTO TRADING ENGINE',
      summary: 'Architected real-time crypto trading interfaces using React, TypeScript & WebSockets.',
      highlights: [
        'Streamlined high-frequency live order books, replacing REST polling with low-latency WebSockets (<50ms).',
        'Modernized codebase from JS to TypeScript and Redux Saga to Redux Toolkit.',
        'Replaced TradingView Advanced Charts with Lightweight Charts, syncing candle + volume rendering cycles.',
        'Built server-side Ag-Grid tables with flexlayout-react for customizable trader dashboards.',
      ],
      tags: ['React', 'TypeScript', 'WebSockets', 'TradingView', 'Ag-Grid'],
      metric: '<50ms Order Book Latency & 60% Faster Load',
    },
    {
      id: 'tnc',
      company: 'TNC IT Solutions',
      role: 'Senior Frontend Engineer',
      period: 'May 2023 – Sept 2024 | Dubai, UAE',
      badge: 'WEB3 & NFT PLATFORMS',
      summary: 'Launched production NFT marketplace serving 150,000+ active users with multi-wallet support.',
      highlights: [
        'Engineered decentralized exchange (DEX) interfaces and real-time Socket.IO trade engines.',
        'Built multi-chain blockchain explorer analytics dashboards.',
      ],
      tags: ['React', 'Next.js', 'Ethers.js', 'Socket.IO', 'Web3.js'],
      metric: '150,000+ Users & Multi-Chain DEX',
    },
    {
      id: 'coolshop',
      company: 'CoolShop SRL',
      role: 'Senior Full Stack Developer',
      period: 'Aug 2022 – Apr 2023 | Dubai, UAE',
      badge: 'ENTERPRISE PORTALS',
      summary: 'Created React marketing portals and Salesforce CloudPages integrated with SQL databases.',
      highlights: [
        'Built enterprise React customer portals connected to backend SQL and Salesforce Marketing Cloud.',
      ],
      tags: ['React', 'Node.js', 'SQL', 'Salesforce Cloud'],
      metric: 'Enterprise Cloud Integration',
    },
    {
      id: 'factweavers',
      company: 'Freelance & Factweavers',
      role: 'Frontend Developer',
      period: '2020 – 2022 | Remote',
      badge: 'FOUNDATIONAL CRAFT',
      summary: 'Built fintech, property booking, and data visualization platforms.',
      highlights: [
        'Delivered responsive web applications and interactive chart widgets.',
      ],
      tags: ['React', 'Redux', 'Node.js', 'CSS3'],
      metric: '10+ Production Client Deliveries',
    },
  ];

  const selectedExp = experiences.find((e) => e.id === selectedExpId) || experiences[0];

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex items-center p-4 sm:p-8 md:p-12 lg:p-16 max-w-7xl mx-auto">
      <div className="w-full max-w-xl">
        
        {/* CHECKPOINT 1: SKILLS SIGNPOST (25%) */}
        {activeSection === 1 && (
          <div className="pointer-events-auto glass-panel-glow p-6 sm:p-7 rounded-3xl border border-sky-400/30 text-slate-100 shadow-2xl space-y-4 transition-all duration-300">
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white tracking-tight">The Signpost of Mastery</h2>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono border border-sky-500/30 font-bold">
                      25% ELEV
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">Core Technical Stack & Engineering Competencies</p>
                </div>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {skillCategories.map((cat, idx) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.name}
                    onClick={() => setSkillTab(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono tracking-wide transition-all flex items-center gap-1.5 border active:scale-95 ${
                      skillTab === idx
                        ? 'bg-sky-500/25 border-sky-400 text-white font-bold shadow-md'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Skill Bars List */}
            <div className="space-y-2 max-h-[38vh] overflow-y-auto pr-1">
              {skillCategories[skillTab].skills.map((s) => (
                <div key={s.name} className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-200">
                    <span>{s.name}</span>
                    <span className="font-mono text-sky-400 font-bold">{s.level}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full"
                      style={{ width: `${s.level}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CHECKPOINT 2: EXPERIENCE CAMPSITE (55%) */}
        {activeSection === 2 && (
          <div className="pointer-events-auto glass-panel-glow p-6 sm:p-7 rounded-3xl border border-sky-400/30 text-slate-100 shadow-2xl space-y-4 transition-all duration-300">
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
                  <Tent className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white tracking-tight">The Mountain Shelter</h2>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono border border-sky-500/30 font-bold">
                      55% ELEV
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">Journey & Impact Quest Log</p>
                </div>
              </div>
            </div>

            {/* Role Switcher */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {experiences.map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => setSelectedExpId(exp.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all border active:scale-95 ${
                    selectedExp.id === exp.id
                      ? 'bg-sky-500/25 border-sky-400 text-white font-bold shadow-md'
                      : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {exp.company}
                </button>
              ))}
            </div>

            {/* Selected Role Detail */}
            <div className="space-y-3 bg-slate-950/70 p-4 rounded-2xl border border-white/5 max-h-[40vh] overflow-y-auto">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {selectedExp.role} <span className="text-sky-400">@ {selectedExp.company}</span>
                  </h3>
                  <p className="text-xs font-mono text-slate-400">{selectedExp.period}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-md bg-sky-500/20 text-sky-300 font-mono text-[10px] font-bold border border-sky-500/30">
                  {selectedExp.badge}
                </span>
              </div>

              {selectedExp.metric && (
                <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-500/30 flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <Award className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Impact: <strong className="text-sky-300">{selectedExp.metric}</strong></span>
                </div>
              )}

              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {selectedExp.summary}
              </p>

              <ul className="space-y-1.5 text-xs text-slate-200">
                {selectedExp.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedExp.tags.map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-slate-300 text-[11px] font-mono">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CHECKPOINT 3: ANCIENT OBSERVATORY (80%) */}
        {activeSection === 3 && (
          <div className="pointer-events-auto glass-panel-glow p-6 sm:p-7 rounded-3xl border border-sky-400/30 text-slate-100 shadow-2xl space-y-4 transition-all duration-300">
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white tracking-tight">The Ancient Observatory</h2>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono border border-sky-500/30 font-bold">
                      80% ELEV
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">Academic Credentials & Core Pillars</p>
                </div>
              </div>
            </div>

            {/* Academic Degree */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-sky-500/30 flex items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono text-sky-400 font-bold uppercase">
                  <GraduationCap className="w-4 h-4" />
                  <span>Computer Science & Engineering</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  B.Tech — APJ Abdul Kalam Technological University
                </h3>
                <p className="text-xs text-slate-400 font-mono">Kerala, India • 2016 – 2020</p>
              </div>
            </div>

            {/* Three Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 space-y-1">
                <Zap className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs font-bold text-white">Performance-First</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Zero-lag mindset for real-time high-throughput financial trading systems.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 space-y-1">
                <Shield className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs font-bold text-white">Clean Engineering</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Pragmatic, maintainable TypeScript architecture over premature complexity.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 space-y-1">
                <Target className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs font-bold text-white">Ownership</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Full product lifecycle delivery in fast-moving engineering teams.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CHECKPOINT 4: SUMMIT BEACON (100%) */}
        {activeSection === 4 && (
          <div className="pointer-events-auto glass-panel-glow p-6 sm:p-7 rounded-3xl border border-sky-400/30 text-slate-100 shadow-2xl space-y-4 transition-all duration-300">
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white tracking-tight">The Summit Beacon</h2>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono border border-sky-500/30 font-bold">
                      SUMMIT PEAK • 100%
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">Transmission Terminal • Open for Opportunities</p>
                </div>
              </div>
            </div>

            {/* Contact Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <Mail className="w-3.5 h-3.5 text-sky-400" />
                  <span>Direct Email</span>
                </div>
                <p className="text-xs font-bold text-white truncate">ajithpallisseryantony@gmail.com</p>
                <button
                  onClick={handleCopyEmail}
                  className="w-full py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-200 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Email'}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Direct Phone / WhatsApp</span>
                </div>
                <p className="text-xs font-bold text-white">+971 589817188</p>
                <a
                  href="tel:+971589817188"
                  className="w-full py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Directly</span>
                </a>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={onOpenResume}
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/15 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
              >
                <FileText className="w-4 h-4 text-sky-400" />
                <span>View Full Resume</span>
              </button>

              <button
                onClick={onOpenMessage}
                className="py-2.5 px-4 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-sky-400/20"
              >
                <Send className="w-4 h-4" />
                <span>Dispatch Message</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
