import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NEON } from './UI';

// ─────────────────────────────────────────────────────────────────────────────
// ModuleSplashScreen — Per-Module Identity Vector Entry Screen
//
// Renders a full-screen animated splash on every module navigation.
// Adapts to user's stored data: shows masked value, SHA-256 seal, and
// security status. Auto-dismisses after AUTO_DISMISS_MS.
// ─────────────────────────────────────────────────────────────────────────────

const AUTO_DISMISS_MS = 1800;

interface ModuleSplashProps {
  moduleId: string;
  vector: string;
  icon: string;
  title: string;
  uid: string;
  storedHash?: string;
  hasData: boolean;
  status?: 'KNOXED' | 'NUKED' | 'MONITORED' | null;
  onDismiss: () => void;
}

// Glitch-animate a SHA-256 hex string before settling
const GLITCH_CHARS = '0123456789ABCDEF';
function randomHex(len: number) {
  return Array.from({ length: len }, () =>
    GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
  ).join('');
}

// Format a 64-char hex into groups of 8 for readability
function formatHex(hex: string): string {
  if (!hex || hex.length < 8) return hex;
  return hex.match(/.{1,8}/g)?.join(' · ') ?? hex;
}

const STATUS_COLOR: Record<string, string> = {
  KNOXED: NEON.blue,
  NUKED: NEON.magenta,
  MONITORED: NEON.orange,
};

const STATUS_LABEL: Record<string, string> = {
  KNOXED: '🔒 SECURED — KNOXED',
  NUKED: '🔥 CRITICAL — NUKED',
  MONITORED: '👁 WATCHING — MONITORED',
};

export const ModuleSplashScreen: React.FC<ModuleSplashProps> = ({
  moduleId,
  vector,
  icon,
  title,
  uid,
  storedHash,
  hasData,
  status,
  onDismiss,
}) => {
  const [visible, setVisible] = useState(true);
  const [displayHash, setDisplayHash] = useState(storedHash ? randomHex(64) : randomHex(64));
  const [hashRevealed, setHashRevealed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const glitchRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start glitch animation then settle on the real (or placeholder) hash
  useEffect(() => {
    let tick = 0;
    glitchRef.current = setInterval(() => {
      setDisplayHash(randomHex(64));
      tick++;
      if (tick > 10) {
        clearInterval(glitchRef.current!);
        setDisplayHash(storedHash ?? randomHex(64));
        setTimeout(() => setHashRevealed(true), 80);
      }
    }, 50);

    return () => {
      if (glitchRef.current) clearInterval(glitchRef.current);
    };
  }, [storedHash]);

  // Auto-dismiss
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 500); // let exit animation finish
    }, AUTO_DISMISS_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onDismiss]);

  const statusColor = status ? (STATUS_COLOR[status] ?? NEON.textMuted) : NEON.textMuted;
  const statusLabel = status ? (STATUS_LABEL[status] ?? 'AWAITING CONFIGURATION') : 'AWAITING CONFIGURATION';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={`splash-${moduleId}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9000,
            background: 'rgba(6, 13, 31, 0.97)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0,
          }}
        >
          {/* Animated grid overlay */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: `linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }} />

          {/* Radial glow centered */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600, height: 600,
            background: `radial-gradient(circle, ${statusColor}08 0%, transparent 65%)`,
            pointerEvents: 'none',
          }} />

          {/* Corner decorations */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTop: `2px solid ${NEON.magenta}44`, borderLeft: `2px solid ${NEON.magenta}44` }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTop: `2px solid ${NEON.blue}44`, borderRight: `2px solid ${NEON.blue}44` }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottom: `2px solid ${NEON.blue}44`, borderLeft: `2px solid ${NEON.blue}44` }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottom: `2px solid ${NEON.magenta}44`, borderRight: `2px solid ${NEON.magenta}44` }} />

          {/* Main content card */}
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
              position: 'relative', zIndex: 1,
              width: '100%', maxWidth: 640,
              padding: '40px 48px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 20,
              textAlign: 'center',
            }}
          >
            {/* Vector badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '4px 16px',
              background: `${statusColor}11`,
              border: `1px solid ${statusColor}33`,
              borderRadius: 999,
              marginBottom: 4,
            }}>
              <span style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.6rem', color: NEON.orange, letterSpacing: '0.2em' }}>
                {vector} · DIFF VECTOR
              </span>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
            </div>

            {/* Icon */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: '3.5rem', filter: `drop-shadow(0 0 20px ${statusColor})` }}
            >
              {icon}
            </motion.div>

            {/* Module title */}
            <div>
              <div style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: '1.5rem', fontWeight: 900,
                color: statusColor,
                textShadow: `0 0 20px ${statusColor}66`,
                letterSpacing: '0.05em',
                marginBottom: 6,
              }}>
                {title.toUpperCase()}
              </div>
              <div style={{
                fontFamily: "'Share Tech Mono'",
                fontSize: '0.65rem',
                color: statusColor,
                letterSpacing: '0.15em',
                opacity: 0.8,
              }}>
                {statusLabel}
              </div>
            </div>

            {/* Data status row */}
            <div style={{
              width: '100%',
              background: 'rgba(0,0,0,0.4)',
              border: `1px solid rgba(255,255,255,0.07)`,
              borderRadius: 12,
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.55rem', color: NEON.textMuted, letterSpacing: '0.15em', marginBottom: 4 }}>
                  VECTOR PARAMETER
                </div>
                <div style={{
                  fontFamily: "'Share Tech Mono'", fontSize: '0.8rem',
                  color: hasData ? NEON.text : NEON.textMuted,
                  letterSpacing: '0.05em',
                }}>
                  {hasData ? '●●●●●●●●●●●●●●●●' : '— NOT CONFIGURED —'}
                </div>
              </div>
              <div style={{
                background: hasData ? `${NEON.blue}11` : `${NEON.orange}11`,
                border: `1px solid ${hasData ? NEON.blue : NEON.orange}33`,
                borderRadius: 6,
                padding: '4px 12px',
                fontFamily: "'Orbitron'",
                fontSize: '0.5rem',
                fontWeight: 700,
                color: hasData ? NEON.blue : NEON.orange,
                letterSpacing: '0.1em',
                flexShrink: 0,
              }}>
                {hasData ? 'SEALED' : 'CONFIGURE'}
              </div>
            </div>

            {/* SHA-256 seal block */}
            <div style={{
              width: '100%',
              background: 'rgba(0, 212, 255, 0.03)',
              border: `1px solid rgba(0, 212, 255, 0.12)`,
              borderRadius: 12,
              padding: '14px 20px',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.7rem' }}>{hashRevealed ? '🔒' : '⟳'}</span>
                  <span style={{
                    fontFamily: "'Share Tech Mono'",
                    fontSize: '0.55rem',
                    color: NEON.textMuted,
                    letterSpacing: '0.15em',
                  }}>
                    INTEGRITY SEAL · SHA-256
                  </span>
                </div>
                <span style={{
                  fontFamily: "'Orbitron'",
                  fontSize: '0.45rem',
                  color: NEON.orange,
                  letterSpacing: '0.1em',
                  background: 'rgba(255,122,24,0.08)',
                  border: '1px solid rgba(255,122,24,0.2)',
                  borderRadius: 4,
                  padding: '2px 8px',
                }}>
                  AGAPE-SOVEREIGN
                </span>
              </div>
              <div style={{
                fontFamily: "'Share Tech Mono'",
                fontSize: '0.58rem',
                color: hashRevealed ? NEON.blue : NEON.magenta,
                letterSpacing: '0.06em',
                lineHeight: 1.7,
                wordBreak: 'break-all',
                textShadow: `0 0 6px ${hashRevealed ? NEON.blue : NEON.magenta}44`,
                transition: 'color 0.4s ease',
              }}>
                {formatHex(displayHash)}
              </div>
            </div>

            {/* Auto-dismiss progress bar */}
            <div style={{ width: '100%', height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: AUTO_DISMISS_MS / 1000, ease: 'linear' }}
                style={{
                  height: '100%',
                  background: `linear-gradient(90deg, ${NEON.magenta}, ${statusColor}, ${NEON.blue})`,
                  borderRadius: 1,
                }}
              />
            </div>

            {/* UID + module footer seal */}
            <div style={{
              width: '100%',
              borderTop: `1px solid rgba(0,212,255,0.08)`,
              paddingTop: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{
                fontFamily: "'Share Tech Mono'",
                fontSize: '0.5rem',
                color: NEON.textMuted,
                letterSpacing: '0.1em',
              }}>
                UID · {uid.slice(0, 8).toUpperCase()}…
              </span>
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                style={{
                  fontFamily: "'Share Tech Mono'",
                  fontSize: '0.5rem',
                  color: NEON.blue,
                  letterSpacing: '0.15em',
                }}
              >
                SOVEREIGN ENCLAVE LOADING…
              </motion.span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
