import React from 'react';
import { NEON } from '../theme';
import { NeonText } from './DesignSystem';

export const AdminPortal = ({ onClose }) => {
  const stats = {
    webauthLogs: 1247, cloudRunStatus: "HEALTHY", firestoreOps: 38291, nodeHealth: "99.7%", activeUsers: 1, sessionsToday: 3,
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)", animation: "fade-in 0.3s ease" }}>
      <div className="neon-border" style={{ width: "min(900px, 95vw)", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column", background: "rgba(8, 18, 40, 0.85)", backdropFilter: "blur(20px)", borderRadius: 12, border: "1px solid rgba(0,212,255,0.15)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,122,24,0.2)", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: NEON.orange, fontSize: "1.2rem" }}>⬡</span>
          <div>
            <NeonText color={NEON.orange} size="1rem" weight={700}>ADMIN PORTAL</NeonText>
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.textMuted }}>AGAPE SOVEREIGN · RESTRICTED ACCESS</div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.65rem", color: "#0f0" }}>● idin@agape.nyc</div>
          <button onClick={onClose} style={{ background: "rgba(255,122,24,0.1)", border: "1px solid rgba(255,122,24,0.3)", borderRadius: 6, padding: "6px 12px", color: NEON.orange, cursor: "pointer", fontFamily: "'Orbitron'", fontSize: "0.65rem" }}>CLOSE</button>
        </div>

        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          <div style={{ marginBottom: 12 }}>
            <NeonText color={NEON.orange} size="0.7rem">FIREBASE INFRASTRUCTURE · GCP FREE TIER</NeonText>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
            {[
              { label: "WebAuthn Logs", value: stats.webauthLogs.toLocaleString(), unit: "events", color: NEON.blue },
              { label: "Cloud Run Status", value: stats.cloudRunStatus, unit: "containerized", color: "#0f0" },
              { label: "Firestore Ops", value: stats.firestoreOps.toLocaleString(), unit: "reads/writes", color: NEON.blue },
              { label: "Node Health", value: stats.nodeHealth, unit: "uptime", color: "#0f0" },
              { label: "Active Users", value: stats.activeUsers, unit: "live sessions", color: NEON.orange },
              { label: "Sessions Today", value: stats.sessionsToday, unit: "authenticated", color: NEON.orange },
            ].map(s => (
              <div key={s.label} style={{ padding: "14px", background: "rgba(0,212,255,0.03)", borderRadius: 8, border: `1px solid ${s.color}22` }}>
                <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.58rem", color: NEON.textMuted, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontFamily: "'Orbitron'", fontSize: "1.3rem", fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.55rem", color: NEON.textMuted, marginTop: 2 }}>{s.unit}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 12 }}>
            <NeonText color={NEON.blue} size="0.7rem">FIREBASE SERVICES STATUS</NeonText>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
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
              <div key={s.svc} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: "rgba(0,0,0,0.2)", borderRadius: 6, border: "1px solid rgba(0,212,255,0.08)" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0f0", flexShrink: 0 }} />
                <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.65rem", color: NEON.text, width: 220 }}>{s.svc}</span>
                <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: "#0f0", width: 60 }}>{s.status}</span>
                <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.58rem", color: NEON.textMuted }}>{s.note}</span>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 12 }}>
            <NeonText color={NEON.magenta} size="0.7rem">REAL-TIME AUDIT TRAIL</NeonText>
          </div>
          <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: 8, padding: "14px", fontFamily: "'Share Tech Mono'", fontSize: "0.62rem", color: NEON.textMuted, lineHeight: 2, border: "1px solid rgba(0,212,255,0.1)", maxHeight: 160, overflowY: "auto" }}>
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
      </div>
    </div>
  );
};
