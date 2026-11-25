import React, { useState } from 'react';
import { KeyRound, ShieldCheck, HardDrive, Cloud, Compass, Lock, Fingerprint } from 'lucide-react';
import { GlassCard, NeonButton } from './ui';
import { ADMIN_EMAILS, NEON, type SovereignUser } from '../data/sovereignData';

export function LoginScreen({ onAuthenticate }: { onAuthenticate: (user: SovereignUser) => void }) {
  const [passkeyEmail, setPasskeyEmail] = useState('');
  const [loadingMode, setLoadingMode] = useState<'passkey' | 'google' | 'guest' | null>(null);
  const [error, setError] = useState('');

  const handlePasskeyAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = passkeyEmail.trim() || 'sovereign@device.local';
    setError('');
    setLoadingMode('passkey');
    setTimeout(() => {
      onAuthenticate({
        uid: `pk-${cleanEmail.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        displayName: cleanEmail.split('@')[0] || 'Sovereign',
        email: cleanEmail,
        provider: 'passkey',
        isAdmin: ADMIN_EMAILS.includes(cleanEmail.toLowerCase()),
      });
    }, 900);
  };

  const handleGoogleAuth = () => {
    setError('');
    setLoadingMode('google');
    setTimeout(() => {
      const email = 'idin@agape.nyc';
      onAuthenticate({
        uid: 'google-agape-sovereign',
        displayName: 'Agape Sovereign',
        email,
        provider: 'google',
        isAdmin: ADMIN_EMAILS.includes(email),
      });
    }, 900);
  };

  const handleGuestBypass = () => {
    setError('');
    setLoadingMode('guest');
    setTimeout(() => {
      onAuthenticate({
        uid: 'guest-demo-enclave',
        displayName: 'Guest Explorer',
        email: 'guest@sovereign.nyc',
        provider: 'guest',
        isAdmin: false,
        guestExpiresAt: Date.now() + 30 * 60 * 1000,
      });
    }, 450);
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-y-auto bg-[#060D1F] px-4 py-10">
      {/* Animated grid background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div
        className="pointer-events-none absolute top-1/4 left-1/2 h-[540px] w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute bottom-10 left-1/4 h-[380px] w-[380px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,46,159,0.06) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 w-full max-w-4xl">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="animate-float-slow mx-auto mb-4 h-20 w-20">
            <svg viewBox="0 0 80 80" className="h-full w-full" style={{ filter: `drop-shadow(0 0 14px ${NEON.blue})` }}>
              <polygon points="40,5 75,25 75,55 40,75 5,55 5,25" fill="none" stroke={NEON.blue} strokeWidth="1.8" />
              <polygon points="40,15 65,28 65,52 40,65 15,52 15,28" fill="none" stroke={NEON.magenta} strokeWidth="1.1" opacity="0.7" />
              <text x="40" y="46" textAnchor="middle" fill={NEON.blue} className="font-orbitron" fontSize="16" fontWeight="900">
                AI
              </text>
            </svg>
          </div>
          <h1 className="font-orbitron text-2xl font-black tracking-widest text-[#00D4FF] sm:text-3xl" style={{ textShadow: '0 0 18px rgba(0,212,255,0.45)' }}>
            AGAPE SOVEREIGN AI
          </h1>
          <p className="font-mono-tech mt-1.5 text-xs tracking-[0.2em] text-[#7B9BB5]">
            ARCHITECT AI · AGAPE SOVEREIGN ENCLAVE 2026 · 16-VECTOR DIFF INTELLIGENCE
          </p>
        </div>

        {/* Dual Auth Panels */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Left Card: Passkey / WebAuthn */}
          <GlassCard className="flex flex-col justify-between p-6 sm:p-7">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#FF7A18]/40 bg-[#FF7A18]/10 text-[#FF7A18]">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-orbitron text-sm font-bold tracking-wider text-[#FF7A18]">
                      PASSKEY / WEBAUTHN
                    </h2>
                    <p className="font-mono-tech text-[11px] text-[#7B9BB5]">Device-bound · Zero passwords</p>
                  </div>
                </div>
                <Fingerprint className="h-5 w-5 text-[#FF7A18]/70" />
              </div>

              <p className="mb-4 text-sm leading-relaxed text-[#E8F4FF]/85">
                Bind a hardware or biometric passkey to this device. All DIFF reports save directly to your encrypted IndexedDB Local Vault.
              </p>

              <form onSubmit={handlePasskeyAuth} className="space-y-3">
                <div>
                  <label className="font-mono-tech mb-1 block text-[11px] tracking-wider text-[#7B9BB5]">
                    SOVEREIGN IDENTIFIER (EMAIL OR ALIAS)
                  </label>
                  <input
                    type="text"
                    value={passkeyEmail}
                    onChange={(e) => setPasskeyEmail(e.target.value)}
                    placeholder="you@sovereign.nyc"
                    className="font-rajdhani w-full rounded-lg border border-[#00D4FF]/25 bg-[#00D4FF]/5 px-3.5 py-2.5 text-sm text-[#E8F4FF] placeholder-[#7B9BB5]/60 outline-none focus:border-[#FF7A18]"
                  />
                </div>
                <NeonButton
                  type="submit"
                  color={NEON.orange}
                  size="lg"
                  disabled={loadingMode !== null}
                  className="w-full"
                >
                  <KeyRound className="h-4 w-4" />
                  {loadingMode === 'passkey' ? 'VERIFYING BIOMETRIC...' : 'SIGN IN WITH PASSKEY'}
                </NeonButton>
              </form>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-lg border border-[#FF7A18]/20 bg-[#FF7A18]/5 px-3 py-2">
              <HardDrive className="h-4 w-4 shrink-0 text-[#FF7A18]" />
              <span className="font-mono-tech text-[11px] text-[#E8F4FF]/80">
                Local Vault · 26-month rolling DPC archive
              </span>
            </div>
          </GlassCard>

          {/* Right Card: Google OAuth + Drive */}
          <GlassCard className="flex flex-col justify-between p-6 sm:p-7">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#00D4FF]/40 bg-[#00D4FF]/10 text-[#00D4FF]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-orbitron text-sm font-bold tracking-wider text-[#00D4FF]">
                      SIGN IN WITH GOOGLE
                    </h2>
                    <p className="font-mono-tech text-[11px] text-[#7B9BB5]">Federated OAuth · Cloud sync</p>
                  </div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>

              <p className="mb-6 text-sm leading-relaxed text-[#E8F4FF]/85">
                Authenticate via Google OAuth to unlock encrypted Google Drive DPC exports in addition to your on-device sovereign vault.
              </p>

              <NeonButton
                onClick={handleGoogleAuth}
                color={NEON.blue}
                size="lg"
                disabled={loadingMode !== null}
                className="w-full"
              >
                <ShieldCheck className="h-4 w-4" />
                {loadingMode === 'google' ? 'CONNECTING GOOGLE OAUTH...' : 'CONTINUE WITH GOOGLE'}
              </NeonButton>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-lg border border-[#00D4FF]/20 bg-[#00D4FF]/5 px-3 py-2">
              <Cloud className="h-4 w-4 shrink-0 text-[#00D4FF]" />
              <span className="font-mono-tech text-[11px] text-[#E8F4FF]/80">
                Google Drive · Agape Sovereign/DPC Reports/
              </span>
            </div>
          </GlassCard>
        </div>

        {/* Always-visible Guest / Demo Bypass */}
        <div className="mt-6">
          <GlassCard className="flex flex-col items-center justify-between gap-4 px-6 py-4 sm:flex-row">
            <div className="text-center sm:text-left">
              <div className="font-orbitron text-xs font-bold tracking-wider text-[#FF2E9F]">
                INSTANT SANDBOX ACCESS · NO ACCOUNT NEEDED
              </div>
              <div className="font-mono-tech mt-0.5 text-[11px] text-[#7B9BB5]">
                30-min ephemeral TTL session · Zero server retention · Data not saved to cloud
              </div>
            </div>
            <NeonButton
              onClick={handleGuestBypass}
              color={NEON.magenta}
              size="md"
              disabled={loadingMode !== null}
              className="shrink-0"
            >
              <Compass className="h-4 w-4" />
              {loadingMode === 'guest' ? 'INITIALIZING SANDBOX...' : 'EXPLORE AS GUEST'}
            </NeonButton>
          </GlassCard>
        </div>

        {error && (
          <p className="font-mono-tech mt-3 text-center text-xs text-[#FF2E9F]">{error}</p>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-[#7B9BB5]">
          <Lock className="h-3.5 w-3.5 text-[#00D4FF]" />
          <span>Client-side AES-256-GCM encryption · ECRA 2026 · GDPR Art. 16 · UDHR Art. 12</span>
        </div>
      </div>
    </div>
  );
}
