import { LogOut, X, HardDrive, Cloud, Compass, Sparkles, ShieldCheck } from 'lucide-react';
import { NEON } from '../theme';
import { useSovereign } from '../context/SovereignContext';
import { GlassCard, NeonButton, SovereignDialog } from './ui';
import { Sha256Badge } from './Sha256Badge';

export function ProfilePanel({
  open,
  onClose,
  onSignOut,
  onOpenAlpha,
}: {
  open: boolean;
  onClose: () => void;
  onSignOut: () => void;
  onOpenAlpha: () => void;
}) {
  const { user, sovereignId, receipts, collectedVectors, attachGoogle } = useSovereign();

  if (!user) return null;

  const displayLabel = user.email || (user.method === 'ANON' ? 'Guest Sandbox User' : 'Sovereign Identity');
  const avatarChar = (user.email?.[0] || user.method[0] || 'S').toUpperCase();

  return (
    <SovereignDialog
      open={open}
      onClose={onClose}
      labelledBy="profile-panel-title"
      className="profile-drawer p-3"
    >
      <GlassCard className="flex h-full w-full flex-col overflow-y-auto p-5">
        <div className="mb-4 flex items-center justify-between">
          <h1 id="profile-panel-title" className="font-orbitron text-sm font-bold tracking-wider text-[#FF2E9F]">
            SOVEREIGN PROFILE
          </h1>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-[#7B9BB5] hover:bg-[#00D4FF]/10 hover:text-[#F8FAFC]"
            aria-label="Close profile panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#FF2E9F]/25 bg-[#FF2E9F]/10 p-3.5">
          <div
            className="font-orbitron flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-black text-[#F8FAFC]"
            style={{ background: 'linear-gradient(135deg, #FF2E9F, #00D4FF, #FF7A18)' }}
          >
            {avatarChar}
          </div>
          <div className="min-w-0">
            <div className="truncate font-bold text-[#F8FAFC]">{displayLabel}</div>
            <div className="font-mono-tech mt-0.5 flex items-center gap-1.5 text-[11px] text-[#00D4FF]">
              {user.method === 'PASSKEY' && <HardDrive className="h-3 w-3" />}
              {user.method === 'GOOGLE' && <Cloud className="h-3 w-3" />}
              {user.method === 'ANON' && <Compass className="h-3 w-3" />}
              <span>
                {user.method === 'PASSKEY'
                  ? 'Passkey · Local Enclave'
                  : user.method === 'GOOGLE'
                  ? 'Google OAuth · Drive Ready'
                  : 'Guest Session · Local Outbox'}
              </span>
            </div>
          </div>
        </div>

        {sovereignId && (
          <div className="mb-4">
            <div className="font-mono-tech mb-1.5 text-[10px] tracking-wider text-[#7B9BB5]">
              SESSION SOVEREIGN SHA-256
            </div>
            <Sha256Badge hash={sovereignId} label="SOVEREIGN" size="md" />
          </div>
        )}

        <div className="mb-4 space-y-2 rounded-xl border border-[#00D4FF]/20 bg-[#00D4FF]/5 p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono-tech text-[#7B9BB5]">SEALED VECTORS</span>
            <span className="font-orbitron font-bold text-[#00D4FF]">{collectedVectors.length} / 16</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono-tech text-[#7B9BB5]">TOTAL RECEIPTS</span>
            <span className="font-orbitron font-bold text-[#00FF87]">{receipts.length}</span>
          </div>
        </div>

        {user.method !== 'GOOGLE' && (
          <div className="mb-4 rounded-xl border border-[#00D4FF]/25 bg-[#00D4FF]/5 p-3.5">
            <div className="font-orbitron mb-1 flex items-center gap-1.5 text-[11px] font-bold text-[#00D4FF]">
              <ShieldCheck className="h-3.5 w-3.5" />
              DUAL PROTECTION + DRIVE ARCHIVE
            </div>
            <p className="mb-2.5 text-xs text-[#7B9BB5]">
              Link a Google account to enable encrypted 26-month PDF exports to your Google Drive.
            </p>
            <NeonButton size="sm" color={NEON.blue} className="w-full" onClick={() => void attachGoogle()}>
              <Cloud className="h-3.5 w-3.5" />
              ATTACH GOOGLE ACCOUNT
            </NeonButton>
          </div>
        )}

        <div className="mt-auto space-y-2.5 pt-4">
          <NeonButton
            onClick={() => {
              onClose();
              onOpenAlpha();
            }}
            color={NEON.orange}
            size="sm"
            className="w-full"
          >
            <Sparkles className="h-3.5 w-3.5" />
            OPEN ARENA ALPHA (/alpha)
          </NeonButton>
          <NeonButton onClick={onSignOut} color={NEON.magenta} size="md" className="w-full" autoFocus>
            <LogOut className="h-4 w-4" />
            SIGN OUT
          </NeonButton>
        </div>
      </GlassCard>
    </SovereignDialog>
  );
}
