import { useEffect, useState } from 'react';
import { Server, X, Smartphone, Sparkles } from 'lucide-react';
import { NEON } from '../theme';
import { useSovereign } from '../context/SovereignContext';
import { checkLocalLlmStatus, type LocalLlmStatus } from '../services/architect';
import { GlassCard, NeonButton, SovereignDialog } from './ui';

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
  const { user, receipts, collectedVectors } = useSovereign();
  const [llmStatus, setLlmStatus] = useState<LocalLlmStatus | null>(null);

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
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#FF7A18]/30 bg-[#FF7A18]/10 p-1.5 text-[#FF7A18] hover:bg-[#FF7A18]/20"
            aria-label="Close admin portal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto p-6">
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
        </div>
      </GlassCard>
    </SovereignDialog>
  );
}
