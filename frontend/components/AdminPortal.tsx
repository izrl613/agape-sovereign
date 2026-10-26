import React from 'react';
import { CheckCircle2, Lock, Server, ShieldAlert } from 'lucide-react';
import { ADMIN_ALLOWLIST, FIREBASE_CONFIG, FIRESTORE_DATABASE_ID } from '../firebase';
import { useSovereign } from '../context/SovereignContext';
import { IDENTITY_VECTOR_MODULES } from '../services/moduleAgents';

export const AdminPortal: React.FC = () => {
  const { user, isAdmin, sha256Id, scannedVectorCount } = useSovereign();

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-rose-500/40 bg-rose-950/20 p-6 text-sm text-rose-200">
        Access Restricted: Sovereign Governance HQ requires an authorized principal ({ADMIN_ALLOWLIST.join(' or ')}).
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-400/40 bg-[#091224] p-6 space-y-4">
        <div className="flex items-center gap-2.5 text-emerald-300 font-bold text-sm">
          <ShieldAlert className="h-5 w-5" />
          SOVEREIGN GOVERNANCE HQ — ZERO-COST &amp; ZERO-KNOWLEDGE ATTESTATION
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="text-slate-400 flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-cyan-400" />
              Firebase Project Binding
            </div>
            <div className="mt-1 font-mono-code font-bold text-white">{FIREBASE_CONFIG.projectId}</div>
            <div className="mt-1 text-[11px] text-slate-400">
              Firestore DB: {FIRESTORE_DATABASE_ID} · Principal: {user?.email}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="text-slate-400 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-emerald-400" />
              Zero-Cost Operating Posture
            </div>
            <div className="mt-1 font-mono-code font-bold text-emerald-300">$0.00 Paid API Keys</div>
            <div className="mt-1 text-[11px] text-slate-400">
              All 16 Module Agents verify against keyless public security endpoints.
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Session Seal Integrity
            </div>
            <div className="mt-1 font-mono-code text-[11px] text-emerald-200 truncate">
              {sha256Id}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {scannedVectorCount}/16 Vectors Verified in Active Enclave
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-3">
            Zero-Cost Third-Party Verification Registry (V-01 .. V-16)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {IDENTITY_VECTOR_MODULES.map((m) => (
              <div
                key={m.id}
                className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 flex items-center justify-between gap-2"
              >
                <span className="font-mono-code text-cyan-300 font-bold">{m.id} ({m.agentId})</span>
                <span className="text-slate-300 truncate">{m.thirdPartyApis.join(', ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
