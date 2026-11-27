import { useEffect, useState } from 'react';
import { Activity, ClipboardCheck, Server, X, Smartphone, Sparkles , BarChart3 , CheckCircle2, KeyRound , Fingerprint, Trash2, RefreshCw, ShieldCheck } from 'lucide-react';
import { NEON } from '../theme';
import { useSovereign } from '../context/SovereignContext';
import { auth } from '../firebase';
import { PasskeyService, type RegisteredPasskey } from '../auth/passkey-service';
import { checkLocalLlmStatus, type LocalLlmStatus } from '../services/architect';
import { GlassCard, NeonButton, SovereignDialog } from './ui';
import { LiveOpsView } from './LiveOpsView';
import { ProjectStatusView } from './ProjectStatusView';
import { EvalReviewQueue } from './EvalReviewQueue';

const CONFIGURED_ROUTES = [
  { name: 'Hosting Origin', detail: typeof window !== 'undefined' ? window.location.origin : 'sovereign.nyc' },
  { name: '/api/auth/**', detail: 'WebAuthn / Passkey Auth Cloud Function (us-central1)' },
  { name: '/api/architect/**', detail: 'Zero-PII Gemini Architect Cloud Function (us-central1)' },
  { name: 'Firestore (agape-sovereign)', detail: 'Encrypted Receipt & Envelope Key Store (nam7)' },
] as const;

export function AdminPortal({
  open,
  onClose,
  onOpenAlpha,
}: {
  open: boolean;
  onClose: () => void;
  onOpenAlpha: () => void;
}) {
  const { user, receipts, collectedVectors, registerPasskey, loginWithPasskey } = useSovereign();
  const [passkeyEmail, setPasskeyEmail] = useState(user?.email || '');
  const [passkeyLabel, setPasskeyLabel] = useState('');
  const [passkeyBusy, setPasskeyBusy] = useState<'register' | 'login' | 'list' | string | null>(null);
  const [passkeyMsg, setPasskeyMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [registeredPasskeys, setRegisteredPasskeys] = useState<RegisteredPasskey[]>([]);
  const [passkeySupported, setPasskeySupported] = useState<boolean>(true);
  const [llmStatus, setLlmStatus] = useState<LocalLlmStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'LIVE_OPS' | 'REVIEW_QUEUE' | 'PASSKEYS' | 'STATUS'>('LIVE_OPS');

  const refreshPasskeys = async () => {
    const current = auth.currentUser;
    if (!current) return;
    setPasskeyBusy('list');
    try {
      const idToken = await current.getIdToken();
      const list = await PasskeyService.listPasskeys(idToken);
      setRegisteredPasskeys(list);
    } catch {
      // Backend may be offline in local dev; keep existing list
    } finally {
      setPasskeyBusy(null);
    }
  };

  useEffect(() => {
    if (!open || activeTab !== 'PASSKEYS') return;
    const supported = typeof window !== 'undefined' && Boolean(window.PublicKeyCredential);
    setPasskeySupported(supported);
    void refreshPasskeys();
  }, [open, activeTab]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    checkLocalLlmStatus().then((status) => {
      if (active) setLlmStatus(status);
    });
    return () => {
      active = false;
    };
  }, [open]);

  if (!user) return null;

  const hasAndroidBridge =
    typeof window !== 'undefined' && Boolean((window as unknown as Record<string, unknown>).AgapeAndroidBridge);

  return (
    <SovereignDialog open={open} onClose={onClose} labelledBy="admin-portal-title" className="w-full max-w-4xl p-3">
      <GlassCard className="flex max-h-[88vh] w-full flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#FF7A18]/25 px-6 py-4">
          <div className="flex items-center gap-3">
            <Server className="h-5 w-5 text-[#FF7A18]" />
            <div>
              <h1 id="admin-portal-title" className="font-orbitron text-sm font-bold tracking-wider text-[#FF7A18]">
                ENCLAVE ADMIN PORTAL · agape-sovereign
              </h1>
              <p className="font-mono-tech text-[11px] text-[#7B9BB5]">
                {user.email || user.id} · {collectedVectors.length}/16 vectors · {receipts.length} sealed receipts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('LIVE_OPS')}
              className={`font-orbitron inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[11px] font-bold tracking-wider transition-colors ${
                activeTab === 'LIVE_OPS'
                  ? 'border-[#00D4FF]/60 bg-[#00D4FF]/15 text-[#00D4FF]'
                  : 'border-[#00D4FF]/20 bg-transparent text-[#7B9BB5] hover:text-[#F8FAFC]'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              LIVE OPS
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('REVIEW_QUEUE')}
              className={`font-orbitron inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[11px] font-bold tracking-wider transition-colors ${
                activeTab === 'REVIEW_QUEUE'
                  ? 'border-[#FF2E9F]/60 bg-[#FF2E9F]/15 text-[#FF2E9F]'
                  : 'border-[#00D4FF]/20 bg-transparent text-[#7B9BB5] hover:text-[#F8FAFC]'
              }`}
            >
              <ClipboardCheck className="h-3.5 w-3.5" />
              REVIEW QUEUE
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('STATUS')}
              className={`font-orbitron inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[11px] font-bold tracking-wider transition-colors ${
                activeTab === 'STATUS'
                  ? 'border-[#FF2E9F]/60 bg-[#FF2E9F]/15 text-[#FF2E9F]'
                  : 'border-[#00D4FF]/20 bg-transparent text-[#7B9BB5] hover:text-[#F8FAFC]'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              STATUS
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PASSKEYS')}
              className={`font-orbitron inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[11px] font-bold tracking-wider transition-colors ${
                activeTab === 'PASSKEYS'
                  ? 'border-[#10B981]/60 bg-[#10B981]/15 text-[#10B981]'
                  : 'border-[#00D4FF]/20 bg-transparent text-[#7B9BB5] hover:text-[#F8FAFC]'
              }`}
            >
              <Fingerprint className="h-3.5 w-3.5" />
              PASSKEYS
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('OVERVIEW')}
              className={`font-orbitron inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[11px] font-bold tracking-wider transition-colors ${
                activeTab === 'OVERVIEW'
                  ? 'border-[#FF7A18]/60 bg-[#FF7A18]/15 text-[#FF7A18]'
                  : 'border-[#00D4FF]/20 bg-transparent text-[#7B9BB5] hover:text-[#F8FAFC]'
              }`}
            >
              <Server className="h-3.5 w-3.5" />
              OVERVIEW
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[#FF7A18]/30 bg-[#FF7A18]/10 p-1.5 text-[#FF7A18] hover:bg-[#FF7A18]/20"
              aria-label="Close admin portal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-5 overflow-y-auto p-6">
          {activeTab === 'LIVE_OPS' ? (
            <LiveOpsView />
          ) : activeTab === 'REVIEW_QUEUE' ? (
            <EvalReviewQueue defaultReviewer={user.email || user.id} />
          ) : activeTab === 'PASSKEYS' ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#00FF87]/25 bg-[#00FF87]/5 p-4">
                <div className="mb-1.5 flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-[#00FF87]" />
                  <span className="font-orbitron text-xs font-bold text-[#00FF87]">
                    WEBAUTHN / FIDO2 PASSKEY MANAGEMENT
                  </span>
                </div>
                <p className="text-xs text-[#7B9BB5]">
                  Register a new FIDO2 passkey bound to your device biometrics or hardware security key, or verify an existing passkey assertion against the enclave backend.
                </p>
              </div>

              <div className="space-y-3 rounded-xl border border-[#00D4FF]/20 bg-[#060D1F]/70 p-4">
                <label className="block">
                  <span className="font-orbitron mb-1.5 block text-[11px] font-bold tracking-wider text-[#00D4FF]">
                    ACCOUNT EMAIL FOR PASSKEY BINDING
                  </span>
                  <input
                    type="email"
                    value={passkeyEmail}
                    onChange={(e) => setPasskeyEmail(e.target.value)}
                    placeholder="admin@sovereign.nyc"
                    className="w-full rounded-lg border border-[#00D4FF]/25 bg-[#0B1020] px-3.5 py-2 text-xs text-[#F8FAFC] outline-none focus:border-[#00D4FF]"
                  />
                </label>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <NeonButton
                    size="sm"
                    color={NEON.green}
                    disabled={passkeyBusy !== null || !passkeyEmail.trim()}
                    onClick={async () => {
                      setPasskeyBusy('register');
                      setPasskeyMsg(null);
                      try {
                        await registerPasskey(passkeyEmail);
                        setPasskeyMsg({
                          kind: 'ok',
                          text: `Passkey registered for ${passkeyEmail.trim()}.`,
                        });
                      } catch (err) {
                        setPasskeyMsg({
                          kind: 'err',
                          text: err instanceof Error ? err.message : 'Passkey registration failed.',
                        });
                      } finally {
                        setPasskeyBusy(null);
                      }
                    }}
                  >
                    <Fingerprint className="h-3.5 w-3.5" />
                    {passkeyBusy === 'register' ? 'REGISTERING...' : 'REGISTER PASSKEY'}
                  </NeonButton>

                  <NeonButton
                    size="sm"
                    color={NEON.blue}
                    disabled={passkeyBusy !== null}
                    onClick={async () => {
                      setPasskeyBusy('login');
                      setPasskeyMsg(null);
                      try {
                        await loginWithPasskey(passkeyEmail.trim() || undefined);
                        setPasskeyMsg({
                          kind: 'ok',
                          text: `Passkey verified for ${passkeyEmail.trim() || user.email || user.id}.`,
                        });
                      } catch (err) {
                        setPasskeyMsg({
                          kind: 'err',
                          text: err instanceof Error ? err.message : 'Passkey verification failed.',
                        });
                      } finally {
                        setPasskeyBusy(null);
                      }
                    }}
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    {passkeyBusy === 'login' ? 'VERIFYING...' : 'VERIFY PASSKEY'}
                  </NeonButton>
                </div>
              </div>

              {passkeyMsg && (
                <div
                  className="flex items-start gap-2.5 rounded-xl border p-3.5 text-xs"
                  style={{
                    borderColor: passkeyMsg.kind === 'ok' ? 'rgba(0,255,135,0.4)' : 'rgba(255,46,159,0.45)',
                    background: passkeyMsg.kind === 'ok' ? 'rgba(0,255,135,0.08)' : 'rgba(255,46,159,0.08)',
                    color: passkeyMsg.kind === 'ok' ? NEON.green : NEON.magenta,
                  }}
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="font-semibold">{passkeyMsg.text}</div>
                </div>
              )}
            </div>
          ) : (
            <>
          <div>
            <div className="font-orbitron mb-2.5 text-xs font-bold tracking-wider text-[#00D4FF]">
              CONFIGURED ENCLAVE ENDPOINTS
            </div>
            <div className="space-y-2">
              {CONFIGURED_ROUTES.map((svc) => (
                <div
                  key={svc.name}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#00D4FF]/15 bg-[#060D1F]/70 px-4 py-2.5 text-xs"
                >
                  <span className="font-mono-tech font-bold text-[#F8FAFC]">{svc.name}</span>
                  <span className="text-[#7B9BB5]">{svc.detail}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#00D4FF]/20 bg-[#00D4FF]/5 p-4">
            <div className="mb-1.5 flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-[#00D4FF]" />
              <span className="font-orbitron text-xs font-bold text-[#00D4FF]">
                LOCAL ENCLAVE RUNTIME &amp; ANDROID PWA BRIDGE
              </span>
            </div>
            <p className="font-mono-tech text-xs text-[#7B9BB5]">
              JS Bridge:{' '}
              <span style={{ color: hasAndroidBridge ? NEON.green : NEON.orange }}>
                {hasAndroidBridge ? 'CONNECTED (AgapeAndroidBridge)' : 'STANDALONE BROWSER PWA MODE'}
              </span>{' '}
              · Local LLM:{' '}
              <span style={{ color: llmStatus?.online ? NEON.green : NEON.blue }}>
                {llmStatus?.online ? `ONLINE (${llmStatus.model})` : 'OFFLINE / CLOUD FALLBACK'}
              </span>
            </p>
          </div>

          <div className="rounded-xl border border-[#00D4FF]/25 bg-[#060D1F]/80 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-[#00D4FF]" />
                <span className="font-orbitron text-xs font-bold tracking-wider text-[#00D4FF]">
                  WEBAUTHN PASSKEY MANAGEMENT
                </span>
              </div>
              <span className="font-mono-tech rounded border border-[#00D4FF]/30 bg-[#00D4FF]/10 px-2 py-0.5 text-[10px] text-[#00D4FF]">
                AUTH: {user.method}
              </span>
            </div>
            <p className="mb-3 text-xs text-[#7B9BB5]">
              Register a hardware-backed FIDO2 passkey for this enclave account or verify/sign in with an existing passkey.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="email"
                value={passkeyEmail}
                onChange={(e) => setPasskeyEmail(e.target.value)}
                placeholder="operator@sovereign.nyc"
                aria-label="Passkey account email"
                className="font-mono-tech min-w-[210px] flex-1 rounded-md border border-[#00D4FF]/25 bg-[#0B1020] px-3 py-1.5 text-xs text-[#F8FAFC] placeholder-[#7B9BB5]/60 focus:border-[#00D4FF] focus:outline-none"
              />
              <NeonButton
                size="sm"
                color={NEON.blue}
                disabled={passkeyBusy !== null || !passkeyEmail.trim()}
                onClick={async () => {
                  setPasskeyBusy('register');
                  setPasskeyMsg(null);
                  try {
                    await registerPasskey(passkeyEmail.trim());
                    setPasskeyMsg({ kind: 'ok', text: `Passkey registered for ${passkeyEmail.trim()}.` });
                  } catch (err) {
                    setPasskeyMsg({
                      kind: 'err',
                      text: err instanceof Error ? err.message : 'Passkey registration failed.',
                    });
                  } finally {
                    setPasskeyBusy(null);
                  }
                }}
              >
                {passkeyBusy === 'register' ? 'REGISTERING…' : 'REGISTER PASSKEY'}
              </NeonButton>
              <NeonButton
                size="sm"
                color={NEON.orange}
                disabled={passkeyBusy !== null}
                onClick={async () => {
                  setPasskeyBusy('login');
                  setPasskeyMsg(null);
                  try {
                    await loginWithPasskey(passkeyEmail.trim() || undefined);
                    setPasskeyMsg({ kind: 'ok', text: 'Passkey verified and session updated.' });
                  } catch (err) {
                    setPasskeyMsg({
                      kind: 'err',
                      text: err instanceof Error ? err.message : 'Passkey authentication failed.',
                    });
                  } finally {
                    setPasskeyBusy(null);
                  }
                }}
              >
                {passkeyBusy === 'login' ? 'VERIFYING…' : 'SIGN IN / VERIFY PASSKEY'}
              </NeonButton>
            </div>
            {passkeyMsg && (
              <div
                className={`mt-2.5 flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs ${
                  passkeyMsg.kind === 'ok'
                    ? 'border-[#00D4FF]/35 bg-[#00D4FF]/10 text-[#00D4FF]'
                    : 'border-[#FF2E9F]/35 bg-[#FF2E9F]/10 text-[#FF2E9F]'
                }`}
              >
                {passkeyMsg.kind === 'ok' && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                <span>{passkeyMsg.text}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#FF2E9F]/30 bg-[#FF2E9F]/5 p-4">
            <div>
              <div className="font-orbitron text-xs font-bold text-[#FF2E9F]">
                ARENA ALPHA SANDBOX (/alpha)
              </div>
              <p className="mt-0.5 text-xs text-[#7B9BB5]">
                Isolated alpha build of the Arena prototype — simulated demo data only, never touches live enclave receipts or exports.
              </p>
            </div>
            <NeonButton
              size="sm"
              color={NEON.magenta}
              onClick={() => {
                onClose();
                onOpenAlpha();
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              LAUNCH /alpha
            </NeonButton>
          </div>
            </>
          )}
        </div>
      </GlassCard>
    </SovereignDialog>
  );
}
