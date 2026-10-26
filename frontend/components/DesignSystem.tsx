import React from 'react';
import { VectorScanStatus } from '../services/moduleAgents';

export const StatusBadge: React.FC<{ status: VectorScanStatus }> = ({ status }) => {
  const map: Record<VectorScanStatus, { label: string; cls: string }> = {
    IDLE: {
      label: 'AWAITING SCAN',
      cls: 'border-slate-700 bg-slate-900/90 text-slate-400',
    },
    SCANNING: {
      label: 'AGENT VERIFYING…',
      cls: 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200 animate-pulse',
    },
    VERIFIED_SAFE: {
      label: 'VERIFIED HARDENED',
      cls: 'border-emerald-400/60 bg-emerald-500/15 text-emerald-300',
    },
    ELEVATED_RISK: {
      label: 'ELEVATED RISK',
      cls: 'border-amber-400/60 bg-amber-500/15 text-amber-300',
    },
    EXPOSED: {
      label: 'EXPOSURE DETECTED',
      cls: 'border-rose-500/70 bg-rose-500/15 text-rose-300',
    },
    API_DEGRADED: {
      label: 'API RATE-LIMITED',
      cls: 'border-purple-400/50 bg-purple-500/15 text-purple-200',
    },
  };

  const item = map[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase font-mono-code ${item.cls}`}
    >
      {item.label}
    </span>
  );
};
