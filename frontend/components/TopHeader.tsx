import React, { useState, useEffect } from 'react';
import { NEON, GRADIENT_BORDER } from '../theme';
import { NeonButton } from './DesignSystem';

export const TopHeader = ({ user, onAdmin, onProfile, onLogout }) => {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  const isAdmin = ["idin@agape.nyc", "agape@sovereign.nyc"].includes(user?.email);

  return (
    <div style={{ height: 56, background: "rgba(6,13,31,0.98)", borderBottom: "1px solid rgba(0,212,255,0.1)", display: "flex", alignItems: "center", padding: "0 20px", gap: 16, position: "relative" }}>
      <div style={{ height: 1, position: "absolute", bottom: 0, left: 0, right: 0, background: GRADIENT_BORDER, backgroundSize: "200% 100%", animation: "rotate-gradient 4s linear infinite", opacity: 0.6 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0f0", boxShadow: "0 0 8px #0f0", animation: "pulse-border 1.5s infinite" }} />
        <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.65rem", color: "#0f0", letterSpacing: "0.1em" }}>LIVE</span>
      </div>

      <div style={{ height: 20, width: 1, background: "rgba(0,212,255,0.2)" }} />
      <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.7rem", color: NEON.blue }}>
        {time.toLocaleTimeString("en-US", { hour12: false })} UTC
      </span>
      <div style={{ height: 20, width: 1, background: "rgba(0,212,255,0.2)" }} />
      <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.65rem", color: NEON.orange, letterSpacing: "0.08em" }}>
        ECRA 2026 · GDPR · CCPA
      </span>

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontFamily: "'Orbitron'", fontSize: "0.65rem", color: NEON.textMuted }}>DIFF ACTIVE</span>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: NEON.blue, animation: "glow-pulse 2s infinite" }} />
      </div>

      <div style={{ height: 20, width: 1, background: "rgba(0,212,255,0.2)" }} />
      {isAdmin && (
        <NeonButton onClick={onAdmin} color={NEON.orange} size="sm">⬡ ADMIN</NeonButton>
      )}
      <button
        className="btn-neon neon-border"
        onClick={onProfile}
        title={user?.email ? `${user.email} · session profile` : 'Session profile'}
        aria-label="Open sovereign profile"
        style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,46,159,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: NEON.magenta, fontSize: "1rem" }}
      >
        {user?.provider === "google" ? "G" : user?.provider === "anonymous" ? "◌" : "U"}
      </button>
      {onLogout && (
        <button
          onClick={onLogout}
          title="End this session"
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "0.6rem",
            letterSpacing: "0.1em",
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid rgba(255,46,159,0.35)",
            background: "rgba(255,46,159,0.08)",
            color: NEON.magenta,
            cursor: "pointer",
          }}
        >
          SIGN OUT
        </button>
      )}
    </div>
  );
};
