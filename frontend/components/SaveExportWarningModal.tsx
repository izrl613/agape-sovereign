import { HardDrive, Cloud, Download, ShieldAlert, Lock, X } from 'lucide-react';
import { NEON } from '../theme';
import type { LoginMethod } from '../context/SovereignContext';
import { GlassCard, NeonButton, SovereignDialog } from './ui';

export function SaveExportWarningModal({
  open,
  authMethod,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  authMethod: LoginMethod;
  onConfirm: (target: 'local' | 'drive' | 'download') => void;
  onCancel: () => void;
}) {
  const isGoogle = authMethod === 'GOOGLE';

  return (
    <SovereignDialog open={open} onClose={onCancel} labelledBy="export-notice-title" className="w-full max-w-lg p-3">
      <GlassCard className="w-full p-6 sm:p-7">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#FF7A18]/40 bg-[#FF7A18]/10 text-[#FF7A18]">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h1 id="export-notice-title" className="font-orbitron text-sm font-bold tracking-wider text-[#FF7A18]">
                SOVEREIGN EXPORT & STORAGE NOTICE
              </h1>
              <p className="font-mono-tech text-[11px] text-[#7B9BB5]">
                ZERO-KNOWLEDGE DPC ARCHIVE PROTOCOL
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1.5 text-[#7B9BB5] hover:bg-[#00D4FF]/10 hover:text-[#F8FAFC]"
            aria-label="Close export notice"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 rounded-lg border border-[#00D4FF]/20 bg-[#00D4FF]/5 p-4 text-sm text-[#E8F4FF]/90">
          <div className="flex items-start gap-2.5">
            {isGoogle ? (
              <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-[#00D4FF]" />
            ) : (
              <HardDrive className="mt-0.5 h-4 w-4 shrink-0 text-[#FF7A18]" />
            )}
            <div>
              <span className="font-semibold text-[#00D4FF]">Destination: </span>
              {isGoogle
                ? 'Encrypted IndexedDB Local Vault + Google Drive (Agape Sovereign PDF / local JSON snapshot)'
                : 'Encrypted IndexedDB Local Vault (this device only) or direct JSON artifact download'}
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#FF2E9F]" />
            <div>
              <span className="font-semibold text-[#FF2E9F]">Retention & Zero-Knowledge: </span>
              Local Vault archives enforce a <strong className="text-[#F8FAFC]">26-month rolling window</strong> and store only SHA-256 receipt digests and verification outcomes — never raw PII.
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <NeonButton onClick={onCancel} color={NEON.magenta} size="sm" autoFocus>
            CANCEL
          </NeonButton>
          <NeonButton onClick={() => onConfirm('local')} color={NEON.orange} size="sm">
            <HardDrive className="h-3.5 w-3.5" />
            SAVE TO DEVICE VAULT
          </NeonButton>
          <NeonButton onClick={() => onConfirm('drive')} color={NEON.blue} size="sm">
            <Cloud className="h-3.5 w-3.5" />
            {isGoogle ? 'SAVE TO GOOGLE DRIVE' : 'ATTACH GOOGLE · DRIVE'}
          </NeonButton>
          <NeonButton onClick={() => onConfirm('download')} color={NEON.green} size="sm">
            <Download className="h-3.5 w-3.5" />
            DOWNLOAD JSON
          </NeonButton>
        </div>
      </GlassCard>
    </SovereignDialog>
  );
}
