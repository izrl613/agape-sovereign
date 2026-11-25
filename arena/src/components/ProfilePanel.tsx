import React, { useState } from 'react';
import { Mail, LogOut, Plus, X, HardDrive, Cloud, Compass } from 'lucide-react';
import { GlassCard, NeonButton, StatusBadge } from './ui';
import { NEON, type SovereignUser } from '../data/sovereignData';

export function ProfilePanel({
  user,
  onClose,
  onSignOut,
}: {
  user: SovereignUser;
  onClose: () => void;
  onSignOut: () => void;
}) {
  const [newEmail, setNewEmail] = useState('');
  const [emails, setEmails] = useState<string[]>([user.email]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newEmail.trim();
    if (!clean || emails.includes(clean)) return;
    setEmails((prev) => [...prev, clean]);
    setNewEmail('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <GlassCard
        className="m-4 flex h-fit max-h-[90vh] w-full max-w-sm flex-col overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-orbitron text-sm font-bold tracking-wider text-[#FF2E9F]">
            SOVEREIGN PROFILE
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[#7B9BB5] hover:bg-white/5 hover:text-[#E8F4FF]"
            aria-label="Close profile"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#FF2E9F]/25 bg-[#FF2E9F]/10 p-3.5">
          <div
            className="font-orbitron flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-black text-white"
            style={{ background: 'linear-gradient(135deg, #FF2E9F, #00D4FF, #FF7A18)' }}
          >
            {user.displayName[0]?.toUpperCase() || 'S'}
          </div>
          <div className="min-w-0">
            <div className="truncate font-bold text-[#E8F4FF]">{user.displayName}</div>
            <div className="font-mono-tech truncate text-xs text-[#7B9BB5]">{user.email}</div>
            <div className="font-mono-tech mt-0.5 flex items-center gap-1.5 text-[11px] text-[#00D4FF]">
              {user.provider === 'passkey' && <HardDrive className="h-3 w-3" />}
              {user.provider === 'google' && <Cloud className="h-3 w-3" />}
              {user.provider === 'guest' && <Compass className="h-3 w-3" />}
              <span>
                {user.provider === 'passkey'
                  ? 'Passkey · Local Vault'
                  : user.provider === 'google'
                  ? 'Google OAuth · Drive Sync'
                  : 'Guest Sandbox · 30m TTL'}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="font-mono-tech mb-2 text-[11px] tracking-wider text-[#FF7A18]">
            MONITORED EMAIL ADDRESSES
          </div>
          <div className="space-y-1.5">
            {emails.map((addr) => (
              <div
                key={addr}
                className="flex items-center justify-between gap-2 rounded-lg border border-[#00D4FF]/20 bg-[#00D4FF]/5 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-[#00D4FF]" />
                  <span className="font-mono-tech truncate text-xs text-[#E8F4FF]">{addr}</span>
                </div>
                <StatusBadge type="KNOXED" />
              </div>
            ))}
          </div>

          <form onSubmit={handleAdd} className="mt-2.5 flex gap-2">
            <input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Add email to monitor"
              className="font-rajdhani flex-1 rounded-lg border border-[#00D4FF]/25 bg-[#00D4FF]/5 px-3 py-1.5 text-sm text-[#E8F4FF] placeholder-[#7B9BB5]/60 outline-none focus:border-[#00D4FF]"
            />
            <NeonButton type="submit" size="sm" color={NEON.blue}>
              <Plus className="h-3.5 w-3.5" />
              ADD
            </NeonButton>
          </form>
        </div>

        <NeonButton onClick={onSignOut} color={NEON.magenta} size="md" className="w-full">
          <LogOut className="h-4 w-4" />
          SIGN OUT
        </NeonButton>
      </GlassCard>
    </div>
  );
}
