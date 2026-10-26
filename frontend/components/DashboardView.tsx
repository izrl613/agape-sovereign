import React from 'react';
import { NEON } from '../theme';
import { NeonText, GlassCard } from './DesignSystem';

export const DashboardView = ({ diffModules, onModuleClick }) => {
  const sovereignScore = Math.round(diffModules.reduce((s, m) => s + m.severity, 0) / (diffModules.length || 1));
  const totalExposures = diffModules.reduce((s, m) => s + m.nuked + m.monitored, 0);
  const totalSecured = diffModules.reduce((s, m) => s + m.knoxed, 0);
  const criticalModules = diffModules.filter(m => m.severity < 60);

  return (
    <div style={{ padding: "24px", paddingBottom: 72, overflowY: "auto", height: "100%", animation: "fade-in 0.4s ease" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 24, marginBottom: 28 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.orange, letterSpacing: "0.2em", marginBottom: 6 }}>DIGITAL IDENTITY FEDERATED FOOTPRINT</div>
          <NeonText color={NEON.blue} size="1.5rem" weight={900}>DIFF COMMAND CENTER</NeonText>
          <div style={{ color: NEON.textMuted, fontSize: "0.8rem", marginTop: 4 }}>16-Layer identity vector analysis · Real-time threat intelligence</div>
        </div>
        <SovereignScore score={sovereignScore} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "VECTORS ACTIVE", value: "16", sub: "All layers online", color: NEON.blue },
          { label: "EXPOSURES FOUND", value: totalExposures, sub: "Across all surfaces", color: NEON.magenta },
          { label: "SECURED", value: totalSecured, sub: "KNOXED & hardened", color: NEON.blue },
          { label: "CRITICAL FLAGS", value: criticalModules.length, sub: "Require attention", color: NEON.orange },
        ].map((kpi) => (
          <GlassCard key={kpi.label} style={{ padding: "16px" }}>
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.textMuted, letterSpacing: "0.1em", marginBottom: 6 }}>{kpi.label}</div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.8rem", fontWeight: 900, color: kpi.color, textShadow: `0 0 12px ${kpi.color}66` }}>{kpi.value}</div>
            <div style={{ fontSize: "0.7rem", color: NEON.textMuted, marginTop: 4 }}>{kpi.sub}</div>
          </GlassCard>
        ))}
      </div>

      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <NeonText color={NEON.orange} size="0.75rem" weight={700}>IDENTITY VECTOR MODULES</NeonText>
        <div style={{ flex: 1, height: 1, background: `${NEON.orange}33` }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {diffModules.map((m) => {
          const sev = m.severity;
          const sevColor = sev > 80 ? NEON.blue : sev > 60 ? NEON.orange : NEON.magenta;
          return (
            <GlassCard
              key={m.id}
              className="module-card"
              onClick={() => onModuleClick(m.id)}
              style={{ padding: "14px", cursor: "pointer" }}
              {...{ role: "button", tabIndex: 0, "aria-label": `Open ${m.label} module`, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onModuleClick(m.id); } } }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <span style={{ color: sevColor, fontSize: "1.2rem" }}>{m.icon}</span>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontFamily: "'Orbitron'", fontSize: "0.7rem", color: sevColor, fontWeight: 700 }}>{sev}%</span>
                  <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.5rem", color: NEON.textMuted }}>{m.vector}</div>
                </div>
              </div>
              <div style={{ fontFamily: "'Rajdhani'", fontSize: "0.72rem", fontWeight: 600, color: NEON.text, marginBottom: 8, lineHeight: 1.3 }}>{m.label}</div>
              <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ height: "100%", width: `${sev}%`, background: sevColor, borderRadius: 1, boxShadow: `0 0 6px ${sevColor}`, transition: "width 1s ease" }} />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.58rem", color: NEON.magenta }}>✕ {m.nuked}</span>
                <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.58rem", color: NEON.blue }}>✓ {m.knoxed}</span>
                <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.58rem", color: NEON.orange }}>◉ {m.monitored}</span>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};

const SovereignScore = ({ score }) => {
  const r = 52, cx = 64, cy = 64;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  const color = score > 75 ? NEON.blue : score > 50 ? NEON.orange : NEON.magenta;
  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      <svg width="128" height="128" className="score-ring" style={{ filter: `drop-shadow(0 0 12px ${color})` }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${pct * circ} ${circ}`} strokeDashoffset={circ * 0.25}
          strokeLinecap="round" style={{ transition: "stroke-dasharray 1.5s ease" }} />
        <text x={cx} y={cy - 6} textAnchor="middle" fill={color} fontFamily="Orbitron" fontSize="22" fontWeight="900">{score}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill={NEON.textMuted} fontFamily="Rajdhani" fontSize="9" letterSpacing="2">SOVEREIGN</text>
        <text x={cx} y={cy + 25} textAnchor="middle" fill={NEON.textMuted} fontFamily="Rajdhani" fontSize="9" letterSpacing="2">SCORE</text>
      </svg>
    </div>
  );
};
