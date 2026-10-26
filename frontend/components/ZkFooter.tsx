import React from 'react';
import { Lock } from 'lucide-react';
import { useSovereign } from '../context/SovereignContext';
import { formatSha256Display, RETENTION_MONTHS } from '../services/sovereignCrypto';

export const ZkFooter: React.FC = () => {
  const { sha256Id, encryptedEnvelopeCount } = useSovereign();

  return (
    <footer className="border-t border-slate-800/90 bg-[#040812] px-4 py-3.5 sm:px-6 text-[11px] text-slate-400">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-300">
            <Lock className="h-3 w-3" />
            Zero-Knowledge Enforced
          </span>
          <span>·</span>
          <span className="font-mono-code text-slate-300">
            {formatSha256Display(sha256Id, true)}
          </span>
          <span>·</span>
          <span>
            {encryptedEnvelopeCount} AES-256-GCM Envelope{encryptedEnvelopeCount === 1 ? '' : 's'} ({RETENTION_MONTHS}-Month Vault)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <a href="/privacy" className="hover:text-cyan-300">Privacy Policy</a>
          <a href="/terms" className="hover:text-cyan-300">Terms of Service</a>
          <a href="/contact" className="hover:text-cyan-300">Contact</a>
          <span className="text-slate-500">idin@agape.nyc</span>
        </div>
      </div>
    </footer>
  );
};
