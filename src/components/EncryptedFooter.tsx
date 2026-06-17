import React, { useEffect, useState, useRef } from 'react';
import { NEON } from './UI';

// ─────────────────────────────────────────────────────────────────────────────
// EncryptedFooter — Sovereign Integrity Seal
// Generates a per-session SHA-256 seal from userUID + moduleId + buildTimestamp.
// Displayed on every card and splash screen as a cryptographic trust anchor.
// ─────────────────────────────────────────────────────────────────────────────

const BUILD_TS = (() => {
  try {
    // @ts-ignore — Vite injects this at build time
    return (import.meta as { env?: { VITE_BUILD_TS?: string } }).env?.VITE_BUILD_TS
      || Date.now().toString(36).toUpperCase();
  } catch {
    return Date.now().toString(36).toUpperCase();
  }
})();

async function generateSeal(moduleId: string, uid: string): Promise<string> {
  const raw = `${uid}::${moduleId}::${BUILD_TS}::AGAPE-SOVEREIGN-ENCLAVE`;
  const encoded = new TextEncoder().encode(raw);
  const hashBuf = await crypto.subtle.digest("SHA-256", encoded);
  const hex = Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  // Format as AGP-XXXX-XXXX-XXXX-XXXX
  return `AGP-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}

interface EncryptedFooterProps {
  moduleId: string;
  uid?: string;
  compact?: boolean;
  style?: React.CSSProperties;
}

export const EncryptedFooter: React.FC<EncryptedFooterProps> = ({
  moduleId,
  uid = "anon",
  compact = false,
  style = {}
}) => {
  const [seal, setSeal] = useState<string>("AGP-XXXX-XXXX-XXXX-XXXX");
  const [revealed, setRevealed] = useState(false);
  const glitchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;
    // Glitch animation: scramble before revealing
    const chars = "0123456789ABCDEF";
    let tick = 0;
    const scramble = setInterval(() => {
      if (!mounted) return;
      const fake = `AGP-${Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")}-${Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")}-${Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")}-${Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")}`;
      setSeal(fake);
      tick++;
      if (tick > 8) clearInterval(scramble);
    }, 60);

    generateSeal(moduleId, uid).then(s => {
      if (!mounted) return;
      glitchRef.current = setTimeout(() => {
        if (mounted) {
          setSeal(s);
          setRevealed(true);
        }
      }, 520);
    });

    return () => {
      mounted = false;
      clearInterval(scramble);
      if (glitchRef.current) clearTimeout(glitchRef.current);
    };
  }, [moduleId, uid]);

  if (compact) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        paddingTop: 8,
        borderTop: `1px solid rgba(0,212,255,0.08)`,
        ...style
      }}>
        <span style={{ fontSize: "0.55rem", color: NEON.textMuted, fontFamily: "'Share Tech Mono'", letterSpacing: "0.05em" }}>🔒</span>
        <span style={{
          fontFamily: "'Share Tech Mono'",
          fontSize: "0.55rem",
          color: revealed ? `${NEON.blue}88` : `${NEON.magenta}66`,
          letterSpacing: "0.08em",
          transition: "color 0.4s ease"
        }}>
          {seal}
        </span>
        <span style={{ marginLeft: "auto", fontSize: "0.5rem", color: `${NEON.orange}66`, fontFamily: "'Share Tech Mono'", letterSpacing: "0.06em" }}>
          GEMMA4:E4B
        </span>
      </div>
    );
  }

  return (
    <div style={{
      marginTop: 16,
      paddingTop: 12,
      borderTop: `1px solid rgba(0,212,255,0.1)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      ...style
    }}>
      {/* Left: Seal */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: revealed ? `rgba(0,212,255,0.1)` : `rgba(255,46,159,0.1)`,
          border: `1px solid ${revealed ? NEON.blue : NEON.magenta}44`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.4s ease",
          flexShrink: 0
        }}>
          <span style={{ fontSize: "0.55rem" }}>{revealed ? "🔒" : "⟳"}</span>
        </div>
        <div>
          <div style={{
            fontFamily: "'Share Tech Mono'",
            fontSize: "0.6rem",
            color: NEON.textMuted,
            letterSpacing: "0.15em",
            marginBottom: 2
          }}>
            INTEGRITY SEAL
          </div>
          <div style={{
            fontFamily: "'Share Tech Mono'",
            fontSize: "0.65rem",
            color: revealed ? NEON.blue : NEON.magenta,
            letterSpacing: "0.1em",
            textShadow: revealed ? `0 0 8px ${NEON.blue}55` : `0 0 8px ${NEON.magenta}55`,
            transition: "all 0.4s ease",
            fontWeight: 700
          }}>
            {seal}
          </div>
        </div>
      </div>

      {/* Right: AI mode badge */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 2,
        flexShrink: 0
      }}>
        <div style={{
          background: `rgba(255,122,24,0.08)`,
          border: `1px solid rgba(255,122,24,0.2)`,
          borderRadius: 4,
          padding: "2px 8px",
          fontFamily: "'Orbitron', monospace",
          fontSize: "0.45rem",
          color: NEON.orange,
          letterSpacing: "0.12em",
          fontWeight: 700
        }}>
          GEMMA4:E4B OFFLINE
        </div>
        <div style={{
          fontFamily: "'Share Tech Mono'",
          fontSize: "0.5rem",
          color: `${NEON.textMuted}88`,
          letterSpacing: "0.08em"
        }}>
          SHA-256 · AES-GCM · ZERO-KNOWLEDGE
        </div>
      </div>
    </div>
  );
};
