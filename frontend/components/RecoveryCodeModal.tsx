import { useState } from 'react';
import { KeyRound, Copy, Check, ShieldAlert } from 'lucide-react';
import { NEON } from '../theme';
import { useSovereign } from '../context/SovereignContext';
import { GlassCard, NeonButton, SovereignDialog } from './ui';

export function RecoveryCodeModal() {
  const { recoveryCode, acknowledgeRecoveryCode } = useSovereign();
  const [copied, setCopied] = useState(false);

  if (!recoveryCode) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <SovereignDialog
      open={Boolean(recoveryCode)}
      onClose={acknowledgeRecoveryCode}
      labelledBy="recovery-code-title"
      className="w-full max-w-md p-3"
    >
      <GlassCard className="w-full p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#00FF87]/40 bg-[#00FF87]/10 text-[#00FF87]">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h1 id="recovery-code-title" className="font-orbitron text-sm font-bold tracking-wider text-[#00FF87]">
              ONE-TIME ENCLAVE RECOVERY CODE
            </h1>
            <p className="font-mono-tech text-[11px] text-[#7B9BB5]">
              AES-256-GCM DEK BACKUP · SHOWN ONCE
            </p>
          </div>
        </div>

        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-[#FF7A18]/35 bg-[#FF7A18]/10 p-3 text-xs text-[#F8FAFC]">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#FF7A18]" />
          <span>
            Save this code offline now. It wraps your Data Encryption Key (DEK) and is never stored in plaintext or shown again.
          </span>
        </div>

        <div className="mb-5 flex items-center justify-between gap-2 rounded-lg border border-[#00D4FF]/35 bg-[#060D1F] px-3.5 py-3">
          <code className="font-mono-tech break-all text-sm font-bold tracking-wider text-[#00D4FF]">
            {recoveryCode}
          </code>
          <button
            type="button"
            onClick={() => void handleCopy()}
            aria-label="Copy recovery code"
            className="shrink-0 rounded-md border border-[#00D4FF]/40 bg-[#00D4FF]/10 px-2.5 py-1.5 text-xs text-[#00D4FF] hover:bg-[#00D4FF]/20"
          >
            {copied ? <Check className="h-4 w-4 text-[#00FF87]" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        <NeonButton color={NEON.green} size="md" className="w-full" onClick={acknowledgeRecoveryCode} autoFocus>
          I HAVE SAVED MY RECOVERY CODE
        </NeonButton>
      </GlassCard>
    </SovereignDialog>
  );
}
