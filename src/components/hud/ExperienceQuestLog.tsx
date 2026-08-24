import React, { useState } from 'react';
import { Tent, X, Briefcase, Calendar, MapPin, ChevronRight, Award, Flame, ExternalLink } from 'lucide-react';
import { ExperienceItem } from '../../types';

interface ExperienceQuestLogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExperienceQuestLog: React.FC<ExperienceQuestLogProps> = ({ isOpen, onClose }) => {
  const experiences: ExperienceItem[] = [
    {
      id: 'boli',
      company: 'boli.ae',
      role: 'Senior Frontend Engineer',
      period: 'Dec 2025 – Present',
      location: 'Dubai, UAE',
      badge: 'CURRENT EXPEDITION',
      summary: 'Spearheading the end-to-end frontend launch for a high-growth proptech ecosystem in the UAE.',
      highlights: [
        'Integrated Shufti KYC pipelines for automated identity verification & regulatory compliance.',
        'Built multi-gateway payment architecture for Power of Attorney (POA) & property valuation workflows.',
        'Revamped legacy SEO architecture and Core Web Vitals, achieving 95+ performance scores.',
        'Engineered responsive property management dashboards with real-time valuation updates.',
      ],
      techStack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Shufti KYC', 'Payment Gateways', 'SEO'],
      impactMetric: '100% KYC Automated & Sub-second Core Web Vitals',
    },
    {
      id: 'coinroutes',
      company: 'Coinroutes',
      role: 'Senior Frontend Engineer',
      period: 'Sept 2024 – Dec 2025',
      location: 'Dubai, UAE',
      badge: 'FINANCIAL TRADING ENGINE',
      summary: 'Architected high-throughput, low-latency institutional crypto algorithmic trading interfaces.',
      highlights: [
        'Architected real-time crypto trading interfaces using React, TypeScript & WebSockets.',
        'Streamlined high-frequency live order books, replacing REST polling with low-latency WebSockets (<50ms).',
        'Modernized entire codebase from JavaScript to TypeScript and Redux Saga to Redux Toolkit.',
        'Replaced heavy TradingView Advanced Charts with TradingView Lightweight Charts, synchronizing candle + volume rendering cycles.',
        'Built server-side Ag-Grid tables with flexlayout-react for customizable multi-monitor trader dashboards.',
      ],
      techStack: ['React', 'TypeScript', 'WebSockets', 'TradingView Lightweight Charts', 'Redux Toolkit', 'Ag-Grid', 'FlexLayout'],
      impactMetric: '<50ms Order Book Latency & 60% Faster Bundle Load',
    },
    {
      id: 'tnc',
      company: 'TNC IT Solutions',
      role: 'Senior Frontend Engineer',
      period: 'May 2023 – Sept 2024',
      location: 'Dubai, UAE',
      badge: 'WEB3 & BLOCKCHAIN PLATFORM',
      summary: 'Engineered decentralized exchange (DEX) interfaces and production NFT platforms.',
      highlights: [
        'Launched a production NFT marketplace serving 150,000+ active users with multi-wallet support.',
        'Engineered decentralized exchange (DEX) interfaces and real-time Socket.IO trade engines.',
        'Built multi-chain blockchain explorer analytics dashboards with token swap routing.',
        'Implemented rigorous Web3 wallet connection workflows (MetaMask, WalletConnect, Phantom).',
      ],
      techStack: ['React', 'Next.js', 'TypeScript', 'Ethers.js', 'Socket.IO', 'Web3.js', 'Tailwind CSS'],
      impactMetric: '150,000+ Active Users & Multi-Chain DEX Engine',
    },
    {
      id: 'coolshop',
      company: 'CoolShop SRL',
      role: 'Senior Full Stack Developer',
      period: 'Aug 2022 – Apr 2023',
      location: 'Dubai, UAE',
      badge: 'ENTERPRISE MARKETING & PORTALS',
      summary: 'Created enterprise React marketing portals and Salesforce CloudPages integrations.',
      highlights: [
        'Built high-conversion React marketing portals integrated with Salesforce CloudPages.',
        'Developed backend SQL database schemas and high-throughput REST APIs for customer telemetry.',
        'Optimized customer conversion funnels with multi-language localization (i18n).',
      ],
      techStack: ['React', 'JavaScript', 'Node.js', 'SQL', 'Salesforce Marketing Cloud', 'REST APIs'],
      impactMetric: 'Enterprise Portal Delivery & Cloud Integration',
    },
    {
      id: 'factweavers',
      company: 'Freelance & Factweavers Technologies',
      role: 'Frontend / Full Stack Developer',
      period: '2020 – 2022',
      location: 'India & Remote',
      badge: 'FOUNDATIONAL CRAFT',
      summary: 'Built fintech, property booking, and real-time data visualization platforms.',
      highlights: [
        'Delivered responsive web applications across fintech, booking engines, and analytics portals.',
        'Pioneered interactive chart widgets and modular component libraries.',
        'Collaborated closely with cross-functional product and design teams across multiple timezones.',
      ],
      techStack: ['React', 'Redux', 'Node.js', 'Express', 'MongoDB', 'CSS3', 'Chart.js'],
      impactMetric: '10+ Production Client Deliveries',
    },
  ];

  const [selectedExp, setSelectedExp] = useState<ExperienceItem>(experiences[0]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col glass-panel-glow rounded-2xl overflow-hidden border border-sky-500/30 text-slate-100 shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Tent className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">The Expedition Campsite</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                  CHECKPOINT 2 • 55%
                </span>
              </div>
              <p className="text-xs text-slate-400">Journey & Impact Quest Log</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Split: Master Quest List (Left) + Detailed Quest Log (Right) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden bg-slate-950/40">
          
          {/* Left Column: Timeline List */}
          <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-slate-800/80 overflow-y-auto p-4 space-y-2.5 max-h-[35vh] md:max-h-[unset]">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 px-2 py-1">
              Select Career Mission
            </div>
            {experiences.map((exp) => (
              <button
                key={exp.id}
                onClick={() => setSelectedExp(exp)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                  selectedExp.id === exp.id
                    ? 'bg-sky-500/15 border-sky-400 text-white shadow-md'
                    : 'bg-slate-900/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="space-y-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white truncate">{exp.company}</span>
                    {exp.id === 'boli' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300 truncate">{exp.role}</p>
                  <p className="text-[11px] font-mono text-slate-500">{exp.period}</p>
                </div>
                <ChevronRight className={`w-4 h-4 mt-1 shrink-0 transition-transform ${selectedExp.id === exp.id ? 'text-sky-400 translate-x-0.5' : 'text-slate-600'}`} />
              </button>
            ))}
          </div>

          {/* Right Column: Mission Detail */}
          <div className="md:col-span-7 overflow-y-auto p-6 space-y-6">
            
            {/* Header info */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-md bg-sky-500/20 text-sky-300 font-mono text-xs font-semibold border border-sky-500/30">
                  {selectedExp.badge}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" /> {selectedExp.location}
                </span>
              </div>

              <h3 className="text-2xl font-extrabold text-white tracking-tight">
                {selectedExp.role} <span className="text-sky-400 font-medium">@ {selectedExp.company}</span>
              </h3>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{selectedExp.period}</span>
              </div>
            </div>

            {/* Impact Metric Banner */}
            {selectedExp.impactMetric && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-950/60 to-emerald-950/40 border border-sky-500/30 flex items-center gap-3">
                <Award className="w-5 h-5 text-sky-400 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-slate-100">
                  Key Achievement: <span className="text-emerald-400">{selectedExp.impactMetric}</span>
                </span>
              </div>
            )}

            {/* Summary */}
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              {selectedExp.summary}
            </p>

            {/* Highlights List */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Key Mission Outcomes</span>
              </h4>
              <ul className="space-y-2.5">
                {selectedExp.highlights.map((h, i) => (
                  <li key={i} className="text-xs sm:text-sm text-slate-200 flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tech Stack Chips */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h4 className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Tech Stack Deployed
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedExp.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/70 text-slate-200 text-xs font-mono"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            6+ Years Track Record • PropTech & High-Frequency Crypto
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-amber-500/20"
          >
            Continue Ascending
          </button>
        </div>

      </div>
    </div>
  );
};
