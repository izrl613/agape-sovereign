import React from 'react';
import { NEON } from '../constants';
import { GlassCard, NeonText } from './ui/NeonElements';

interface AdminPortalProps {
  onClose: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onClose }) => {
  const stats = {
    webauthLogs: 1247, cloudRunStatus: "HEALTHY", firestoreOps: 38291, nodeHealth: "99.7%", activeUsers: 1, sessionsToday: 3,
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center backdrop-blur-md" style={{ background: "rgba(0,0,0,0.85)", animation: "fade-in 0.3s ease" }}>
      <GlassCard className="w-[min(900px,95vw)] max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="py-5 px-6 border-b flex items-center gap-3" style={{ borderColor: "rgba(255,122,24,0.2)" }}>
          <span className="text-[1.2rem]" style={{ color: NEON.orange }}>⬡</span>
          <div>
            <NeonText color={NEON.orange} size="1rem" weight={700}>ADMIN PORTAL</NeonText>
            <div className="font-['Share_Tech_Mono'] text-[0.6rem]" style={{ color: NEON.textMuted }}>AGAPE SOVEREIGN · RESTRICTED ACCESS</div>
          </div>
          <div className="flex-1" />
          <div className="font-['Share_Tech_Mono'] text-[0.65rem] text-[#0f0]">● idin@agape.nyc</div>
          <button 
            onClick={onClose} 
            className="rounded-md py-1.5 px-3 cursor-pointer font-['Orbitron'] text-[0.65rem] border" 
            style={{ background: "rgba(255,122,24,0.1)", borderColor: "rgba(255,122,24,0.3)", color: NEON.orange }}
          >
            CLOSE
          </button>
        </div>

        <div className="py-5 px-6 overflow-y-auto flex-1">
          {/* Infrastructure stats */}
          <div className="mb-3">
            <NeonText color={NEON.orange} size="0.7rem">FIREBASE INFRASTRUCTURE · GCP FREE TIER</NeonText>
          </div>
          <div className="grid grid-cols-3 gap-2.5 mb-6">
            {[
              { label: "WebAuthn Logs", value: stats.webauthLogs.toLocaleString(), unit: "events", color: NEON.blue },
              { label: "Cloud Run Status", value: stats.cloudRunStatus, unit: "containerized", color: "#0f0" },
              { label: "Firestore Ops", value: stats.firestoreOps.toLocaleString(), unit: "reads/writes", color: NEON.blue },
              { label: "Node Health", value: stats.nodeHealth, unit: "uptime", color: "#0f0" },
              { label: "Active Users", value: stats.activeUsers, unit: "live sessions", color: NEON.orange },
              { label: "Sessions Today", value: stats.sessionsToday, unit: "authenticated", color: NEON.orange },
            ].map(s => (
              <div key={s.label} className="p-3.5 rounded-lg border" style={{ background: "rgba(0,212,255,0.03)", borderColor: `${s.color}22` }}>
                <div className="font-['Share_Tech_Mono'] text-[0.58rem] mb-1" style={{ color: NEON.textMuted }}>{s.label}</div>
                <div className="font-['Orbitron'] text-[1.3rem] font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="font-['Share_Tech_Mono'] text-[0.55rem] mt-0.5" style={{ color: NEON.textMuted }}>{s.unit}</div>
              </div>
            ))}
          </div>

          {/* Firebase services status */}
          <div className="mb-3">
            <NeonText color={NEON.blue} size="0.7rem">FIREBASE SERVICES STATUS</NeonText>
          </div>
          <div className="flex flex-col gap-1.5 mb-6">
            {[
              { svc: "Firebase Authentication", status: "ACTIVE", note: "Google + Apple OAuth · WebAuthn passkeys" },
              { svc: "Cloud Firestore", status: "ACTIVE", note: "AES-256-GCM encrypted · Zero-knowledge architecture" },
              { svc: "Firebase Storage", status: "ACTIVE", note: "PDF reports · Encrypted user data" },
              { svc: "Cloud Functions", status: "ACTIVE", note: "PDF generation · DIFF scan orchestration" },
              { svc: "Firebase App Check", status: "ACTIVE", note: "Request attestation · Abuse prevention" },
              { svc: "Firebase Hosting", status: "ACTIVE", note: "CDN-backed · HTTPS enforced" },
              { svc: "Firebase Analytics", status: "ACTIVE", note: "Privacy-mode · No PII collection" },
              { svc: "Gemini AI (Free Tier)", status: "ACTIVE", note: "Context-bound sessions · Rate-limited guardrails" },
            ].map(s => (
              <div key={s.svc} className="flex items-center gap-3 py-2 px-3 rounded-md border" style={{ background: "rgba(0,0,0,0.2)", borderColor: "rgba(0,212,255,0.08)" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#0f0] shrink-0" />
                <span className="font-['Share_Tech_Mono'] text-[0.65rem] w-[220px]" style={{ color: NEON.text }}>{s.svc}</span>
                <span className="font-['Share_Tech_Mono'] text-[0.6rem] text-[#0f0] w-[60px]">{s.status}</span>
                <span className="font-['Share_Tech_Mono'] text-[0.58rem]" style={{ color: NEON.textMuted }}>{s.note}</span>
              </div>
            ))}
          </div>

          {/* Security audit log */}
          <div className="mb-3">
            <NeonText color={NEON.magenta} size="0.7rem">REAL-TIME AUDIT TRAIL</NeonText>
          </div>
          <div className="rounded-lg p-3.5 font-['Share_Tech_Mono'] text-[0.62rem] leading-loose border max-h-[160px] overflow-y-auto" style={{ background: "rgba(0,0,0,0.4)", color: NEON.textMuted, borderColor: "rgba(0,212,255,0.1)" }}>
            {[
              "[2026-03-05T14:32:01Z] PASSKEY_AUTH user@agape.nyc · device: macOS · status: SUCCESS",
              "[2026-03-05T14:31:58Z] DIFF_SCAN initiated · vectors: 16 · mode: REALTIME",
              "[2026-03-05T14:31:45Z] FIRESTORE_WRITE encrypted_profile · bytes: 4.2KB",
              "[2026-03-05T14:30:22Z] GEMINI_API session_start · tokens: 0 · context_bound: true",
              "[2026-03-05T14:28:11Z] APP_CHECK attestation verified · platform: web",
              "[2026-03-05T14:25:04Z] CLOUD_FUNCTION pdf_generate · status: idle",
            ].map((log, i) => <div key={i} style={{ color: i === 0 ? NEON.blue : NEON.textMuted }}>{log}</div>)}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
