import React from 'react';
import { NEON, GRADIENT_BORDER } from '../theme';
import { NeonText } from './DesignSystem';

export const LeftNav = ({ diffModules, activeModule, setActiveModule, activeSection, setActiveSection }) => {
  const sections = [
    { id: "dashboard", icon: "⬡", label: "DASHBOARD" },
    { id: "architect", icon: "◈", label: "ARCHITECT AI" },
    { id: "report", icon: "⊟", label: "DIFF REPORT" },
  ];

  const totalNuked = diffModules.reduce((s, m) => s + m.nuked, 0);
  const totalKnoxed = diffModules.reduce((s, m) => s + m.knoxed, 0);

  return (
    <div style={{ width: 260, height: "100vh", background: "rgba(6,13,31,0.97)", borderRight: "1px solid rgba(0,212,255,0.12)", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, transparent, ${NEON.blue}44, transparent)`, animation: "scan-line 4s linear infinite", pointerEvents: "none", zIndex: 10 }} />

      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(0,212,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg viewBox="0 0 32 32" width="28" style={{ flexShrink: 0, filter: `drop-shadow(0 0 6px ${NEON.blue})` }}>
            <polygon points="16,2 30,10 30,22 16,30 2,22 2,10" fill="none" stroke={NEON.blue} strokeWidth="1.5" />
            <polygon points="16,8 24,12 24,20 16,24 8,20 8,12" fill="none" stroke={NEON.magenta} strokeWidth="0.8" opacity="0.7" />
            <text x="16" y="20" textAnchor="middle" fill={NEON.blue} fontFamily="Orbitron" fontSize="8" fontWeight="900">AI</text>
          </svg>
          <div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.7rem", fontWeight: 700, color: NEON.blue, letterSpacing: "0.1em" }}>ARCHITECT AI</div>
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.55rem", color: NEON.textMuted, letterSpacing: "0.1em" }}>AGAPE SOVEREIGN 2026</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <div style={{ flex: 1, background: "rgba(255,46,159,0.1)", borderRadius: 6, padding: "4px 8px", textAlign: "center", border: "1px solid rgba(255,46,159,0.2)" }}>
            <div style={{ color: NEON.magenta, fontFamily: "'Orbitron'", fontSize: "0.85rem", fontWeight: 700 }}>{totalNuked}</div>
            <div style={{ color: NEON.textMuted, fontSize: "0.58rem", letterSpacing: "0.1em" }}>NUKED</div>
          </div>
          <div style={{ flex: 1, background: "rgba(0,212,255,0.08)", borderRadius: 6, padding: "4px 8px", textAlign: "center", border: "1px solid rgba(0,212,255,0.2)" }}>
            <div style={{ color: NEON.blue, fontFamily: "'Orbitron'", fontSize: "0.85rem", fontWeight: 700 }}>{totalKnoxed}</div>
            <div style={{ color: NEON.textMuted, fontSize: "0.58rem", letterSpacing: "0.1em" }}>KNOXED</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "12px 8px 4px" }}>
        {sections.map(s => (
          <div key={s.id} className={`nav-item ${activeSection === s.id ? "active" : ""}`} onClick={() => setActiveSection(s.id)} style={{ padding: "10px 12px", borderRadius: 8, marginBottom: 2, display: "flex", alignItems: "center", gap: 10, borderLeft: activeSection === s.id ? `2px solid ${NEON.blue}` : "2px solid transparent" }}>
            <span style={{ color: NEON.blue, fontSize: "1rem", width: 20 }}>{s.icon}</span>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.68rem", fontWeight: 600, color: activeSection === s.id ? NEON.blue : NEON.text, letterSpacing: "0.08em" }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ margin: "8px 16px", height: 1, background: GRADIENT_BORDER, opacity: 0.3 }} />

      <div style={{ padding: "6px 16px 8px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.orange, letterSpacing: "0.15em" }}>DIFF MODULES</span>
        <div style={{ flex: 1, height: 1, background: `${NEON.orange}44` }} />
        <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.orange }}>16</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
        {diffModules.map((m) => {
          const isActive = activeModule === m.id;
          const sev = m.severity;
          const sevColor = sev > 80 ? NEON.blue : sev > 60 ? NEON.orange : NEON.magenta;
          return (
            <div key={m.id} className={`nav-item ${isActive ? "active" : ""}`} onClick={() => { setActiveModule(m.id); setActiveSection("modules"); }} style={{ padding: "8px 10px", borderRadius: 6, marginBottom: 1, display: "flex", alignItems: "center", gap: 8, borderLeft: isActive ? `2px solid ${sevColor}` : "2px solid transparent", background: isActive ? `rgba(${sev > 80 ? "0,212,255" : sev > 60 ? "255,122,24" : "255,46,159"},0.06)` : "transparent" }}>
              <span style={{ color: sevColor, fontSize: "0.85rem", width: 16, textAlign: "center", flexShrink: 0 }}>{m.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.72rem", fontWeight: 600, color: isActive ? sevColor : NEON.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.label}</div>
                <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.55rem", color: NEON.textMuted }}>{m.vector} · {m.nuked}✕ {m.knoxed}✓</div>
              </div>
              <div style={{ width: 24, height: 24, borderRadius: "50%", border: `1.5px solid ${sevColor}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: "'Orbitron'", fontSize: "0.5rem", color: sevColor, fontWeight: 700 }}>{sev}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ height: 2, background: GRADIENT_BORDER, backgroundSize: "200% 100%", animation: "rotate-gradient 3s linear infinite", opacity: 0.8 }} />
    </div>
  );
};
