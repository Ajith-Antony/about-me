import React, { useState } from 'react';
import { Layers, Database, ShieldCheck, Cpu, X, Sparkles, CheckCircle2, Search } from 'lucide-react';
import { SkillCategory } from '../../types';

interface SkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SkillsModal: React.FC<SkillsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const categories: SkillCategory[] = [
    {
      category: 'Frontend & UI Architecture',
      icon: 'Layers',
      description: 'Ultra-responsive real-time interfaces, state management & design systems',
      skills: [
        { name: 'React & Next.js (App Router / SSR / CSR)', level: 98, highlight: true },
        { name: 'TypeScript & Modern ES6+', level: 96, highlight: true },
        { name: 'WebSockets & Real-Time Data Streams', level: 95, highlight: true },
        { name: 'Redux Toolkit & Redux Saga', level: 94 },
        { name: 'TradingView & Lightweight Charts', level: 95, highlight: true },
        { name: 'Ag-Grid & High-Frequency Data Tables', level: 92 },
        { name: 'Tailwind CSS & Modern CSS Systems', level: 96 },
        { name: 'Styled Components & Emotion', level: 90 },
        { name: 'Material UI & Ant Design', level: 88 },
        { name: 'Context API & Custom React Hooks', level: 95 },
        { name: 'Responsive & Accessible Architecture (a11y)', level: 94 },
      ],
    },
    {
      category: 'Backend & Data Pipelines',
      icon: 'Database',
      description: 'High-throughput APIs, database schemas & microservices integration',
      skills: [
        { name: 'Node.js & Express.js', level: 90, highlight: true },
        { name: 'Fastify & Low-Overhead APIs', level: 86 },
        { name: 'PostgreSQL & SQL Schema Design', level: 88, highlight: true },
        { name: 'MongoDB & Document Databases', level: 88 },
        { name: 'RESTful API Engineering & Webhooks', level: 94 },
        { name: 'Server-Side Caching (Redis)', level: 85 },
      ],
    },
    {
      category: 'Web3, Fintech & Security',
      icon: 'ShieldCheck',
      description: 'Decentralized exchanges, multi-wallet connectivity & identity verification',
      skills: [
        { name: 'Shufti KYC Pipeline & Identity Verification', level: 96, highlight: true },
        { name: 'EVM Wallet Integrations (MetaMask / WalletConnect)', level: 94, highlight: true },
        { name: 'NFT Marketplace & DEX Architecture', level: 92 },
        { name: 'Multi-Gateway Payment Workflows (POA / Valuation)', level: 92 },
        { name: 'Smart Contract ABI Integration (Ethers.js / Viem)', level: 88 },
      ],
    },
    {
      category: 'Practices, Performance & DevOps',
      icon: 'Cpu',
      description: 'Sub-second Core Web Vitals, modular architectures & CI/CD deployment',
      skills: [
        { name: 'Performance Tuning & Core Web Vitals Optimization', level: 98, highlight: true },
        { name: 'Docker & Containerization', level: 86 },
        { name: 'Webpack, Vite & Rollup Bundler Optimization', level: 92 },
        { name: 'Technical SEO Architecture & Rich Snippets', level: 94, highlight: true },
        { name: 'Git & Trunk-Based Workflow', level: 95 },
        { name: 'Modular Component Driven Architecture', level: 96 },
      ],
    },
  ];

  const currentCategory = categories[activeTab];
  const filteredSkills = currentCategory.skills.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col glass-panel-glow rounded-2xl overflow-hidden border border-sky-500/30 text-slate-100 shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">The Signpost of Mastery</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono border border-sky-500/30">
                  CHECKPOINT 1 • 25%
                </span>
              </div>
              <p className="text-xs text-slate-400">Technical Inventory & Skill Tree</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector & Search */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-800/80 bg-slate-900/40 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {categories.map((cat, idx) => (
              <button
                key={cat.category}
                onClick={() => setActiveTab(idx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 border ${
                  activeTab === idx
                    ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-sm'
                    : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {idx === 0 && <Layers className="w-3.5 h-3.5" />}
                {idx === 1 && <Database className="w-3.5 h-3.5" />}
                {idx === 2 && <ShieldCheck className="w-3.5 h-3.5" />}
                {idx === 3 && <Cpu className="w-3.5 h-3.5" />}
                <span>{cat.category.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          <div className="relative shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-48 pl-8 pr-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
            />
          </div>
        </div>

        {/* Modal Body / Skill Cards */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-950/40">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{currentCategory.category}</span>
              <Sparkles className="w-4 h-4 text-sky-400" />
            </h3>
            <p className="text-xs text-slate-400 mt-1">{currentCategory.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredSkills.map((skill) => (
              <div
                key={skill.name}
                className={`p-3.5 rounded-xl border transition-all ${
                  skill.highlight
                    ? 'bg-sky-950/30 border-sky-500/40 hover:border-sky-400'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${skill.highlight ? 'text-sky-400' : 'text-slate-500'}`} />
                    <span className="text-xs sm:text-sm font-semibold text-slate-100">{skill.name}</span>
                  </div>
                  <span className="text-xs font-mono text-sky-400 font-bold shrink-0">{skill.level}%</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      skill.highlight
                        ? 'bg-gradient-to-r from-sky-400 to-emerald-400'
                        : 'bg-slate-400'
                    }`}
                    style={{ width: `${skill.level}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            {currentCategory.skills.length} Technical Proficiencies Loaded
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-sky-500/20"
          >
            Continue Journey
          </button>
        </div>

      </div>
    </div>
  );
};
