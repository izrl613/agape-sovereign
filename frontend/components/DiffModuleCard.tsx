import React from 'react';
import { DiffVector } from '../types';
import { Flame, ShieldAlert, ShieldCheck, Hash, Eye, Sparkles, ExternalLink, ArrowRight } from 'lucide-react';

interface DiffModuleCardProps {
  vector: DiffVector;
  onNuke: (id: string) => void;
  onKnox: (id: string) => void;
  onConsultAI: (vector: DiffVector) => void;
  onEdit: (vector: DiffVector) => void;
}

export const DiffModuleCard: React.FC<DiffModuleCardProps> = ({
  vector,
  onNuke,
  onKnox,
  onConsultAI,
  onEdit,
}) => {
  const getStatusBadge = () => {
    switch (vector.status) {
      case 'NUKED':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[#FF2E9F]/20 text-[#FF2E9F] border border-[#FF2E9F]/50 shadow-[0_0_10px_rgba(255,46,159,0.3)]">
            <Flame className="w-3.5 h-3.5 animate-pulse" /> NUKED (ERASED)
          </span>
        );
      case 'KNOXED':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50 shadow-[0_0_10px_rgba(0,212,255,0.3)]">
            <ShieldCheck className="w-3.5 h-3.5" /> KNOXED (ENCLAVE)
          </span>
        );
      case 'EXPOSED':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[#FF7A18]/20 text-[#FF7A18] border border-[#FF7A18]/50 shadow-[0_0_10px_rgba(255,122,24,0.3)]">
            <ShieldAlert className="w-3.5 h-3.5 animate-bounce" /> EXPOSED RISK
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-600">
            <Eye className="w-3.5 h-3.5" /> MONITORED
          </span>
        );
    }
  };

  const getRiskBorder = () => {
    if (vector.status === 'EXPOSED') {
      return 'border-[#FF7A18]/60 hover:border-[#FF2E9F] shadow-[0_0_15px_rgba(255,122,24,0.15)]';
    }
    if (vector.status === 'KNOXED') {
      return 'border-[#00D4FF]/50 shadow-[0_0_15px_rgba(0,212,255,0.1)]';
    }
    return 'border-[#FF2E9F]/50 shadow-[0_0_15px_rgba(255,46,159,0.1)]';
  };

  return (
    <div className="relative group rounded-2xl p-[1.5px] transition-all duration-300 hover:scale-[1.01]">
      {/* Outer pulsing neon border gradient */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] opacity-35 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />

      {/* Main card body */}
      <div className={`relative h-full flex flex-col justify-between rounded-2xl bg-[#0F172A] p-5 border ${getRiskBorder()} backdrop-blur-xl transition-all`}>
        {/* Header: Module Number & Status */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[#0B1020] border border-cyan-500/40 font-mono text-xs font-bold text-[#00D4FF] flex items-center justify-center shadow-inner">
                {vector.moduleNumber}
              </span>
              <span className="text-[11px] font-mono tracking-wider font-semibold uppercase text-cyan-300/80">
                {vector.category.replace('_', ' ')}
              </span>
            </div>
            {getStatusBadge()}
          </div>

          <h3 className="text-base font-bold text-white group-hover:text-[#00D4FF] transition-colors leading-snug">
            {vector.name}
          </h3>

          <p className="text-xs text-slate-300 mt-1 line-clamp-2">
            {vector.shortDesc}
          </p>

          {/* User Input & Exposure Summary */}
          <div className="mt-4 p-3 rounded-xl bg-[#0B1020]/90 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-semibold text-slate-300">Identity Data Vector:</span>
              <button
                onClick={() => onEdit(vector)}
                className="text-[10px] text-[#00D4FF] hover:underline font-mono"
              >
                Edit
              </button>
            </div>
            <p className="font-mono text-xs text-white truncate font-medium">
              {vector.dataValue || 'None recorded'}
            </p>

            <div className="mt-2 text-[11px] text-[#FF7A18] flex items-start gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A18] mt-1.5 shrink-0" />
              <span>{vector.exposureDetails}</span>
            </div>
          </div>

          {/* Cryptographic SHA-256 Fingerprint */}
          <div className="mt-3 px-3 py-2 rounded-lg bg-[#0B1020] border border-slate-800/80 flex items-center gap-2 text-[11px] font-mono text-slate-300">
            <Hash className="w-3.5 h-3.5 text-[#00D4FF] shrink-0" />
            <span className="text-slate-300">SHA-256:</span>
            <span className="truncate text-cyan-300 font-mono" title={vector.sha256Hash}>
              {vector.sha256Hash.substring(0, 18)}...
            </span>
          </div>

          <div className="mt-2 text-[10px] text-slate-300 flex items-center justify-between font-mono">
            <span>Inspiration: {vector.sourceInspiration}</span>
            <span>Scanned: {vector.lastScanned}</span>
          </div>
        </div>

        {/* Footer Actions: NUKED vs KNOXED & Ask AI */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {/* NUKE Button */}
            <button
              onClick={() => onNuke(vector.id)}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-mono text-xs font-bold transition-all ${
                vector.status === 'NUKED'
                  ? 'bg-[#FF2E9F] text-white shadow-[0_0_12px_rgba(255,46,159,0.5)]'
                  : 'bg-[#FF2E9F]/15 hover:bg-[#FF2E9F]/30 text-[#FF2E9F] border border-[#FF2E9F]/40 hover:border-[#FF2E9F]'
              }`}
              title="Issue DSAR purge or scrub public record"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{vector.status === 'NUKED' ? 'NUKED ✓' : 'NUKE'}</span>
            </button>

            {/* KNOX Button */}
            <button
              onClick={() => onKnox(vector.id)}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-mono text-xs font-bold transition-all ${
                vector.status === 'KNOXED'
                  ? 'bg-[#00D4FF] text-[#0B1020] shadow-[0_0_12px_rgba(0,212,255,0.5)] font-extrabold'
                  : 'bg-[#00D4FF]/15 hover:bg-[#00D4FF]/30 text-[#00D4FF] border border-[#00D4FF]/40 hover:border-[#00D4FF]'
              }`}
              title="Encrypt with Web Crypto AES-GCM and bind to passkey"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{vector.status === 'KNOXED' ? 'KNOXED ✓' : 'KNOX'}</span>
            </button>
          </div>

          {/* Consult Architect AI Button */}
          <button
            onClick={() => onConsultAI(vector)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#111A33] hover:bg-slate-800/90 border border-slate-700 text-xs font-medium text-slate-200 hover:text-[#00D4FF] transition"
          >
            <Sparkles className="w-3 h-3 text-[#FF2E9F]" />
            <span>Consult Architect AI on this vector</span>
          </button>
        </div>
      </div>
    </div>
  );
};
