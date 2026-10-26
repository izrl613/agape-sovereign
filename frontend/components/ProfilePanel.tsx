import React, { useState } from 'react';
import { NEON } from '../theme';
import { NeonButton, GlassCard } from './DesignSystem';
import { StatusBadge } from './DesignSystem';

export const ProfilePanel = ({ user, onClose, onSignOut }) => {
  const [email, setEmail] = useState("");
  const [savedEmails, setSavedEmails] = useState(["user@agape.nyc"]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 900, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", backdropFilter: "blur(6px)", animation: "fade-in 0.2s ease" }} onClick={onClose}>
      <GlassCard style={{ width: 340, margin: "56px 16px 0 0", padding: "20px", animation: "slide-in-left 0.3s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.9rem", color: NEON.magenta, fontWeight: 700 }}>SOVEREIGN PROFILE</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: NEON.textMuted, cursor: "pointer", fontSize: "1.2rem" }}>×</button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", background: "rgba(255,46,159,0.06)", borderRadius: 8, marginBottom: 16, border: "1px solid rgba(255,46,159,0.15)" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg, ${NEON.magenta}, ${NEON.blue}, ${NEON.orange})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Orbitron'", fontWeight: 900, color: "#fff", fontSize: "1.2rem" }}>
            {user?.name?.[0] || "S"}
          </div>
          <div>
            <div style={{ fontFamily: "'Rajdhani'", fontWeight: 700, color: NEON.text }}>{user?.name || "Sovereign User"}</div>
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.62rem", color: NEON.textMuted }}>{user?.email || "identity@sovereign.nyc"}</div>
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.58rem", color: NEON.blue, marginTop: 2 }}>● {user?.provider || "Passkey"} · Passkey bound</div>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.orange, marginBottom: 8, letterSpacing: "0.1em" }}>MONITORED EMAIL ADDRESSES</div>
          {savedEmails.map((e, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "rgba(0,212,255,0.04)", borderRadius: 6, marginBottom: 4, border: "1px solid rgba(0,212,255,0.1)" }}>
              <span style={{ color: NEON.blue, fontSize: "0.75rem" }}>✉</span>
              <span style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.65rem", color: NEON.text, flex: 1 }}>{e}</span>
              <StatusBadge type="KNOXED" />
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <div className="neon-border" style={{ flex: 1, borderRadius: 6 }}>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Add email to monitor" style={{ width: "100%", background: "rgba(0,212,255,0.04)", border: "none", outline: "none", padding: "8px 10px", borderRadius: 6, color: NEON.text, fontFamily: "'Rajdhani'", fontSize: "0.8rem" }} />
            </div>
            <NeonButton size="sm" color={NEON.blue} onClick={() => { if (email.trim()) { setSavedEmails(p => [...p, email.trim()]); setEmail(""); } }}>ADD</NeonButton>
          </div>
        </div>

        <div style={{ height: 1, background: `${NEON.blue}22`, margin: "12px 0" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[["⚙", "Passkey Settings", NEON.blue], ["◌", "Backup to Google Account", NEON.blue], ["◍", "Backup to Apple Account", NEON.textMuted]].map(([icon, label, color]) => (
            <button key={label as string} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "transparent", border: `1px solid ${color}22`, borderRadius: 6, color: color as string, fontFamily: "'Rajdhani'", fontSize: "0.8rem", cursor: "pointer", textAlign: "left" }}>
              <span>{icon}</span>{label}
            </button>
          ))}
          <button
            onClick={() => { onClose?.(); onSignOut?.(); }}
            disabled={!onSignOut}
            title="Clear this session and return to the login portal"
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "rgba(255,46,159,0.06)", border: `1px solid ${NEON.magenta}44`, borderRadius: 6, color: NEON.magenta, fontFamily: "'Rajdhani'", fontSize: "0.8rem", cursor: onSignOut ? "pointer" : "not-allowed", textAlign: "left", opacity: onSignOut ? 1 : 0.5 }}
          >
            <span>⏏</span>Sign Out
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
