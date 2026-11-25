import { Server, X, Smartphone } from 'lucide-react';
import { GlassCard } from './ui';
import { CLOUD_RUN_SERVICES, NEON, type SovereignUser } from '../data/sovereignData';

export function AdminPortal({
  user,
  onClose,
}: {
  user: SovereignUser;
  onClose: () => void;
}) {
  const hasAndroidBridge =
    typeof window !== 'undefined' && Boolean((window as unknown as Record<string, unknown>).AgapeAndroidBridge);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <GlassCard
        className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#FF7A18]/25 px-6 py-4">
          <div className="flex items-center gap-3">
            <Server className="h-5 w-5 text-[#FF7A18]" />
            <div>
              <h3 className="font-orbitron text-sm font-bold tracking-wider text-[#FF7A18]">
                ENCLAVE ADMIN PORTAL · agape-sovereign
              </h3>
              <p className="font-mono-tech text-[11px] text-[#7B9BB5]">
                GCP Project #956088455461 · us-central1 · {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-[#FF7A18]/30 bg-[#FF7A18]/10 p-1.5 text-[#FF7A18] hover:bg-[#FF7A18]/20"
            aria-label="Close admin portal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto p-6">
          {/* Cloud Run Services */}
          <div>
            <div className="font-orbitron mb-2.5 text-xs font-bold tracking-wider text-[#00D4FF]">
              CLOUD RUN & FIREBASE APP HOSTING SERVICES
            </div>
            <div className="space-y-2">
              {CLOUD_RUN_SERVICES.map((svc) => (
                <div
                  key={svc.name}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#00D4FF]/15 bg-black/30 px-4 py-2.5 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="font-mono-tech font-bold text-[#E8F4FF]">{svc.name}</span>
                  </div>
                  <span className="text-[#7B9BB5]">{svc.role}</span>
                  <span className="font-mono-tech text-emerald-400">{svc.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Android PWA Operation Framework */}
          <div className="rounded-xl border border-[#00D4FF]/20 bg-[#00D4FF]/5 p-4">
            <div className="mb-1.5 flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-[#00D4FF]" />
              <span className="font-orbitron text-xs font-bold text-[#00D4FF]">
                ANDROID PWA OPERATION FRAMEWORK (com.agape.sovereign.ai)
              </span>
            </div>
            <p className="font-mono-tech text-xs text-[#7B9BB5]">
              JS Bridge Status:{' '}
              <span style={{ color: hasAndroidBridge ? '#34d399' : NEON.orange }}>
                {hasAndroidBridge ? 'CONNECTED (PwaBridgeInterface)' : 'STANDALONE BROWSER PWA MODE'}
              </span>{' '}
              · InAppMcpServer Port 3001 · Ollama gemma4:e2b
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
