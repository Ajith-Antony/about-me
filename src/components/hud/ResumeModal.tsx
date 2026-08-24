import React from 'react';
import { FileText, X, Download, Printer, ExternalLink, MapPin, Mail, Phone, Globe, Award } from 'lucide-react';

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResumeModal: React.FC<ResumeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col glass-panel-glow rounded-2xl overflow-hidden border border-sky-500/40 text-slate-100 shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Ajith Pallissery Antony — Curriculum Vitae</h2>
              <p className="text-xs text-slate-400">Senior Frontend Engineer • Dubai, UAE</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-700 hover:border-sky-400 transition-colors flex items-center gap-1.5 text-xs font-mono"
              title="Print / Save as PDF"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Resume Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 flex-1 bg-slate-950/60 text-slate-200 text-xs sm:text-sm font-sans leading-relaxed">
          
          {/* Header Summary */}
          <div className="border-b border-slate-800 pb-6 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Ajith Pallissery Antony</h1>
                <p className="text-sm sm:text-base font-semibold text-sky-400">Senior Frontend Engineer</p>
              </div>
              <div className="text-xs font-mono text-slate-400 space-y-1 sm:text-right">
                <p className="flex items-center sm:justify-end gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" /> Dubai, United Arab Emirates
                </p>
                <p className="flex items-center sm:justify-end gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-sky-400" /> ajithpallisseryantony@gmail.com
                </p>
                <p className="flex items-center sm:justify-end gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-sky-400" /> +971 589817188
                </p>
              </div>
            </div>

            <p className="text-slate-300 pt-2 text-xs sm:text-sm">
              High-impact Senior Frontend Engineer with 6+ years of specialized experience architecting low-latency, real-time financial trading systems, Web3 decentralized exchanges, and proptech platforms. Expert in React, TypeScript, Next.js, WebSockets, state architecture, and micro-second UI performance optimization.
            </p>
          </div>

          {/* Core Technical Proficiencies */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-sky-400 font-bold border-b border-slate-800 pb-1">
              Core Technical Skills
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                <p className="font-bold text-white">Frontend & UI</p>
                <p className="text-slate-300">React, Next.js, TypeScript, JavaScript (ES6+), WebSockets, Redux Toolkit, Redux Saga, Context API, Tailwind CSS, Styled Components, Material UI, Ant Design, Ag-Grid, TradingView Charts, Lightweight Charts.</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                <p className="font-bold text-white">Backend, Web3 & DevOps</p>
                <p className="text-slate-300">Node.js, Express, Fastify, MongoDB, PostgreSQL, SQL, REST APIs, Shufti KYC, Wallet Integrations, Web3.js, Ethers.js, Docker, Webpack, Vite, Git, SEO Architecture, Core Web Vitals.</p>
              </div>
            </div>
          </div>

          {/* Professional Experience */}
          <div className="space-y-6">
            <h3 className="text-xs font-mono uppercase tracking-wider text-sky-400 font-bold border-b border-slate-800 pb-1">
              Professional Experience
            </h3>

            {/* Role 1 */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h4 className="font-bold text-white text-sm sm:text-base">boli.ae</h4>
                  <p className="text-sky-300 text-xs font-semibold">Senior Frontend Engineer</p>
                </div>
                <span className="text-xs font-mono text-slate-400">Dec 2025 – Present | Dubai, UAE</span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300">
                <li>Spearheaded the end-to-end frontend launch for a high-growth proptech ecosystem in the UAE.</li>
                <li>Integrated automated Shufti KYC pipelines for real-time identity verification and regulatory compliance.</li>
                <li>Built multi-gateway payment architecture for Power of Attorney (POA) and automated property valuation workflows.</li>
                <li>Revamped legacy SEO architecture and Core Web Vitals, achieving 95+ performance scores across desktop and mobile.</li>
              </ul>
            </div>

            {/* Role 2 */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h4 className="font-bold text-white text-sm sm:text-base">Coinroutes</h4>
                  <p className="text-sky-300 text-xs font-semibold">Senior Frontend Engineer</p>
                </div>
                <span className="text-xs font-mono text-slate-400">Sept 2024 – Dec 2025 | Dubai, UAE</span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300">
                <li>Architected real-time crypto trading interfaces using React, TypeScript & WebSockets for algorithmic execution.</li>
                <li>Streamlined high-frequency live order books, replacing REST polling with sub-50ms latency WebSockets.</li>
                <li>Modernized codebase from JavaScript to TypeScript and Redux Saga to Redux Toolkit.</li>
                <li>Replaced heavy TradingView Advanced Charts with TradingView Lightweight Charts, syncing candle + volume rendering cycles.</li>
                <li>Built server-side Ag-Grid tables with flexlayout-react for customizable multi-monitor trader dashboards.</li>
              </ul>
            </div>

            {/* Role 3 */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h4 className="font-bold text-white text-sm sm:text-base">TNC IT Solutions</h4>
                  <p className="text-sky-300 text-xs font-semibold">Senior Frontend Engineer</p>
                </div>
                <span className="text-xs font-mono text-slate-400">May 2023 – Sept 2024 | Dubai, UAE</span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300">
                <li>Launched a production NFT marketplace serving 150,000+ active users with multi-wallet support.</li>
                <li>Engineered decentralized exchange (DEX) interfaces and real-time Socket.IO trade engines.</li>
                <li>Built multi-chain blockchain explorer analytics dashboards.</li>
              </ul>
            </div>

            {/* Role 4 */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h4 className="font-bold text-white text-sm sm:text-base">CoolShop SRL</h4>
                  <p className="text-sky-300 text-xs font-semibold">Senior Full Stack Developer</p>
                </div>
                <span className="text-xs font-mono text-slate-400">Aug 2022 – Apr 2023 | Dubai, UAE</span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300">
                <li>Created React marketing portals and Salesforce CloudPages integrated with SQL databases.</li>
              </ul>
            </div>

            {/* Role 5 */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h4 className="font-bold text-white text-sm sm:text-base">Freelance & Factweavers Technologies</h4>
                  <p className="text-sky-300 text-xs font-semibold">Frontend Developer</p>
                </div>
                <span className="text-xs font-mono text-slate-400">2020 – 2022 | India</span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300">
                <li>Built fintech, property booking, and data visualization platforms.</li>
              </ul>
            </div>

          </div>

          {/* Education */}
          <div className="space-y-2 border-t border-slate-800 pt-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-sky-400 font-bold">
              Education
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <div>
                <p className="font-bold text-white text-sm">B.Tech in Computer Science & Engineering</p>
                <p className="text-xs text-slate-300">APJ Abdul Kalam Technological University, Kerala, India</p>
              </div>
              <span className="text-xs font-mono text-slate-400">2016 – 2020</span>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Ajith Pallissery Antony • Contact: +971 589817188
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-sky-500/20"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
