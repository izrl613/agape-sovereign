import React from 'react';
import { ShieldCheck, UserCheck, KeyRound, Sparkles, Terminal, FileText } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  userProfile: UserProfile;
  sovereignScore: number;
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
  onOpenChat: () => void;
  onOpenReport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userProfile,
  sovereignScore,
  onOpenProfile,
  onOpenAdmin,
  onOpenChat,
  onOpenReport,
}) => {
  // Score color calculation
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-[#00D4FF] border-[#00D4FF]';
    if (score >= 60) return 'text-[#FF7A18] border-[#FF7A18]';
    return 'text-[#FF2E9F] border-[#FF2E9F]';
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#0B1020]/90 border-b border-slate-800/80 shadow-2xl">
      {/* Top pulsing neon accent line */}
      <div className="w-full h-[2px] bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] animate-pulse" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Left: Brand & Enclave Status */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] opacity-75 blur-sm group-hover:opacity-100 transition duration-300"></div>
            <div className="relative w-12 h-12 rounded-xl bg-[#0B1020] border border-cyan-400/40 flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-7 h-7 text-[#00D4FF]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-wider text-white">ARCHITECT <span className="text-[#00D4FF]">AI</span></span>
              <span className="px-2 py-0.5 text-[10px] font-mono tracking-widest font-bold uppercase rounded-md bg-[#FF2E9F]/20 text-[#FF2E9F] border border-[#FF2E9F]/40">
                2026 ECRA LTS
              </span>
            </div>
            <p className="text-xs font-mono text-cyan-200/70 tracking-tight">
              Agape Sovereign Enclave • DIFF Platform
            </p>
          </div>
        </div>

        {/* Center: Sovereign Score Gauge */}
        <div className="hidden md:flex items-center gap-3 bg-[#111A33]/70 px-4 py-2 rounded-2xl border border-slate-700/60 shadow-inner">
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-semibold">
              SOVEREIGN SCORE (DIFF)
            </div>
            <div className="text-xs text-slate-300">
              Zero-Access Perimeter Hardening
            </div>
          </div>
          <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-mono font-extrabold text-base bg-[#0B1020] shadow-[0_0_15px_rgba(0,212,255,0.3)] ${getScoreColor(sovereignScore)}`}>
            {sovereignScore}%
          </div>
        </div>

        {/* Right: Actions, Passkey Badge & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Architect AI Chat */}
          <button
            onClick={onOpenChat}
            className="relative p-[1.5px] rounded-xl overflow-hidden group focus:outline-none"
            title="Ask Chief of Staff AI"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] animate-border-flow" />
            <div className="relative px-3.5 py-2 rounded-[10px] bg-[#0B1020] hover:bg-[#111A33] transition-all flex items-center gap-2 text-xs font-bold text-white shadow-md">
              <Sparkles className="w-4 h-4 text-[#00D4FF] animate-spin" />
              <span className="hidden sm:inline">Chief of Staff AI</span>
            </div>
          </button>

          {/* Export PDF Report */}
          <button
            onClick={onOpenReport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#111A33] hover:bg-[#18264b] border border-cyan-500/30 text-xs font-medium text-cyan-200 hover:text-white transition shadow-sm"
            title="Generate Lighthouse PDF Report"
          >
            <FileText className="w-4 h-4 text-[#00D4FF]" />
            <span className="hidden lg:inline font-semibold">Lighthouse Audit PDF</span>
          </button>

          {/* Admin Nerdy Portal Button */}
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-950/30 hover:bg-orange-900/40 border border-[#FF7A18]/40 text-xs font-mono font-medium text-[#FF7A18] hover:text-white transition"
            title="Sovereign Admin Telemetry Portal"
          >
            <Terminal className="w-4 h-4" />
            <span className="hidden md:inline">Admin Enclave</span>
          </button>

          {/* Passkey & Profile binding */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-[#111A33] hover:bg-slate-800 border border-slate-700 transition group"
            title="Federated User Identity & Passkey Settings"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00D4FF] to-[#FF2E9F] flex items-center justify-center font-bold text-white text-xs shadow-md">
              {userProfile.fullName ? userProfile.fullName[0].toUpperCase() : 'A'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-white leading-tight flex items-center gap-1">
                {userProfile.fullName.split(' ')[0]}
                <KeyRound className="w-3 h-3 text-[#00D4FF]" />
              </div>
              <div className="text-[10px] text-cyan-300 font-mono">
                {userProfile.federatedProvider} Passkey
              </div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
