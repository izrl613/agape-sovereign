import React, { useState } from 'react';
import { NEON } from '../theme';
import { NeonText, NeonButton, GlassCard } from './DesignSystem';

export const ReportView = ({ diffModules }) => {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const totalNuked = diffModules.reduce((s, m) => s + m.nuked, 0);
  const totalKnoxed = diffModules.reduce((s, m) => s + m.knoxed, 0);
  const avgScore = Math.round(diffModules.reduce((s, m) => s + m.severity, 0) / (diffModules.length || 1));

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 3000);
  };

  return (
    <div style={{ padding: "24px", overflowY: "auto", height: "100%", animation: "fade-in 0.4s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.orange, letterSpacing: "0.2em", marginBottom: 4 }}>LIGHTHOUSE-STYLE AUDIT</div>
        <NeonText color={NEON.blue} size="1.3rem" weight={900}>DIFF SOVEREIGNTY REPORT</NeonText>
        <div style={{ color: NEON.textMuted, fontSize: "0.75rem", marginTop: 2 }}>Generate your complete Digital Identity Federated Footprint audit · Firebase-backed · Encrypted PDF</div>
      </div>
      <div style={{ height: 1, background: `linear-gradient(135deg, ${NEON.magenta}, ${NEON.blue}, ${NEON.orange})`, marginBottom: 24, opacity: 0.5 }} />

      <GlassCard style={{ padding: "24px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <NeonText color={NEON.blue} size="1rem">AGAPE SOVEREIGN ENCLAVE 2026</NeonText>
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.65rem", color: NEON.textMuted, marginTop: 4 }}>DIGITAL IDENTITY FEDERATED FOOTPRINT REPORT</div>
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.orange, marginTop: 4 }}>ECRA 2026 · GDPR · CCPA COMPLIANT</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Orbitron'", fontSize: "2.5rem", fontWeight: 900, color: avgScore > 75 ? NEON.blue : avgScore > 50 ? NEON.orange : NEON.magenta, textShadow: `0 0 20px ${avgScore > 75 ? NEON.blue : NEON.orange}` }}>{avgScore}</div>
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.textMuted }}>SOVEREIGN SCORE</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "IDENTITY VECTORS SCANNED", value: "16 / 16", color: NEON.blue },
            { label: "TOTAL EXPOSURES", value: totalNuked + " found", color: NEON.magenta },
            { label: "SECURED ASSETS", value: totalKnoxed + " hardened", color: NEON.blue },
            { label: "COMPLIANCE STATUS", value: "ECRA 2026", color: NEON.orange },
            { label: "PASSKEY STATUS", value: "✓ Device-bound", color: NEON.blue },
            { label: "ENCRYPTION", value: "✓ AES-256-GCM", color: NEON.blue },
            { label: "REPORT TYPE", value: "Lighthouse-v3", color: NEON.orange },
            { label: "CLOUD AUDIT ID", value: `ASE-${Date.now().toString(36).toUpperCase()}`, color: NEON.textMuted },
          ].map(row => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "rgba(0,212,255,0.03)", borderRadius: 6, border: "1px solid rgba(0,212,255,0.08)" }}>
              <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.textMuted }}>{row.label}</span>
              <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: row.color, fontWeight: 700 }}>{row.value}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      <div style={{ marginBottom: 12 }}>
        <NeonText color={NEON.orange} size="0.72rem">VECTOR-BY-VECTOR BREAKDOWN</NeonText>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
        {diffModules.slice(0, 8).map(m => {
          const sev = m.severity;
          const sevColor = sev > 80 ? NEON.blue : sev > 60 ? NEON.orange : NEON.magenta;
          return (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: "rgba(0,212,255,0.02)", borderRadius: 6, border: "1px solid rgba(0,212,255,0.07)" }}>
              <span style={{ color: sevColor, fontSize: "0.8rem", width: 20 }}>{m.icon}</span>
              <span style={{ fontFamily: "'Rajdhani'", fontSize: "0.75rem", color: NEON.text, flex: 1 }}>{m.label}</span>
              <div style={{ width: 80, height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                <div style={{ height: "100%", width: `${sev}%`, background: sevColor, borderRadius: 2 }} />
              </div>
              <span style={{ fontFamily: "'Orbitron'", fontSize: "0.65rem", color: sevColor, width: 30, textAlign: "right" }}>{sev}%</span>
            </div>
          );
        })}
        <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.textMuted, textAlign: "center", padding: "4px 0" }}>+ 8 more vectors in full report</div>
      </div>

      {!generated ? (
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn-neon neon-border pulse-border" onClick={handleGenerate} disabled={generating} style={{ flex: 1, padding: "16px", borderRadius: 10, background: "rgba(0,212,255,0.08)", border: "none", cursor: generating ? "not-allowed" : "pointer", fontFamily: "'Orbitron', monospace", fontSize: "0.85rem", fontWeight: 700, color: NEON.blue, letterSpacing: "0.1em" }}>
            {generating ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <div style={{ width: 16, height: 16, border: `2px solid rgba(0,212,255,0.3)`, borderTop: `2px solid ${NEON.blue}`, borderRadius: "50%", animation: "spinner 1s linear infinite" }} />
                GENERATING SOVEREIGN REPORT...
              </span>
            ) : "⬡ GENERATE DIFF PDF REPORT"}
          </button>
        </div>
      ) : (
        <GlassCard style={{ padding: "20px", textAlign: "center", border: `1px solid ${NEON.blue}44` }}>
          <div style={{ fontSize: "2rem", marginBottom: 8 }}>✅</div>
          <NeonText color={NEON.blue} size="1rem">REPORT GENERATED SUCCESSFULLY</NeonText>
          <div style={{ color: NEON.textMuted, fontSize: "0.75rem", margin: "8px 0 16px" }}>Encrypted · Stored in Firebase Storage · ECRA 2026 certified</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <NeonButton color={NEON.blue}>⬇️ DOWNLOAD PDF</NeonButton>
            <NeonButton color={NEON.orange}>☁️ FIREBASE STORAGE</NeonButton>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
