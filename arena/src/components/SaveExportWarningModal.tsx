import { HardDrive, Cloud, Download, ShieldAlert, Lock, X } from 'lucide-react';
import { GlassCard, NeonButton } from './ui';
import { NEON, type AuthProviderType } from '../data/sovereignData';

export function SaveExportWarningModal({
  authType,
  storageTarget,
  onConfirm,
  onCancel,
}: {
  authType: AuthProviderType;
  storageTarget: 'local' | 'drive' | 'download';
  onConfirm: (target: 'local' | 'drive' | 'download') => void;
  onCancel: () => void;
}) {
  const isDrive = storageTarget === 'drive';
  const isLocal = storageTarget === 'local';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onCancel}
    >
      <GlassCard
        className="w-full max-w-lg p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#FF7A18]/40 bg-[#FF7A18]/10 text-[#FF7A18]">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-orbitron text-sm font-bold tracking-wider text-[#FF7A18]">
                SOVEREIGN EXPORT & STORAGE NOTICE
              </h3>
              <p className="font-mono-tech text-[11px] text-[#7B9BB5]">
                ZERO-KNOWLEDGE DPC ARCHIVE PROTOCOL
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="rounded-md p-1 text-[#7B9BB5] hover:bg-white/5 hover:text-[#E8F4FF]"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 rounded-lg border border-[#00D4FF]/20 bg-[#00D4FF]/5 p-4 text-sm text-[#E8F4FF]/90">
          <div className="flex items-start gap-2.5">
            {isDrive ? (
              <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-[#00D4FF]" />
            ) : (
              <HardDrive className="mt-0.5 h-4 w-4 shrink-0 text-[#FF7A18]" />
            )}
            <div>
              <span className="font-semibold text-[#00D4FF]">Destination: </span>
              {isDrive
                ? 'Google Drive (Agape Sovereign/DPC Reports/) + Local Download'
                : isLocal
                ? 'Encrypted IndexedDB Local Vault (this device only)'
                : 'Direct Device File Download (.json / .txt credential)'}
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#FF2E9F]" />
            <div>
              <span className="font-semibold text-[#FF2E9F]">Retention & Zero-Knowledge: </span>
              Local Vault archives enforce a <strong className="text-[#E8F4FF]">26-month rolling window</strong>. Agape Sovereign servers never retain your raw PII or unencrypted DPC reports.
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <NeonButton onClick={onCancel} color={NEON.magenta} size="sm">
            CANCEL
          </NeonButton>
          <NeonButton onClick={() => onConfirm('local')} color={NEON.orange} size="sm">
            <HardDrive className="h-3.5 w-3.5" />
            SAVE TO DEVICE VAULT
          </NeonButton>
          {authType === 'google' && (
            <NeonButton onClick={() => onConfirm('drive')} color={NEON.blue} size="sm">
              <Cloud className="h-3.5 w-3.5" />
              SAVE TO GOOGLE DRIVE
            </NeonButton>
          )}
          <NeonButton onClick={() => onConfirm('download')} color={NEON.blue} size="sm">
            <Download className="h-3.5 w-3.5" />
            DOWNLOAD ARTIFACT
          </NeonButton>
        </div>
      </GlassCard>
    </div>
  );
}
