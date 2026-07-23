import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WifiOff, Shield, RefreshCw } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// OfflinePage — Sovereign offline fallback with full neon aesthetic
// Served from service worker when navigation fails and network is unavailable.
// Shows last-known sovereign score from localStorage.
// ─────────────────────────────────────────────────────────────────────────────

const NEON = {
  bg: '#0B1020',
  blue: '#00D4FF',
  magenta: '#FF2E9F',
  orange: '#FF7A18',
  text: '#E2E8F0',
  textMuted: 'rgba(226,232,240,0.45)',
};

export const OfflinePage: React.FC = () => {
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Read last-known score from localStorage
    try {
      const cached = localStorage.getItem('agape_sovereign_score');
      if (cached) setLastScore(parseInt(cached, 10));
    } catch { /* ignore */ }
  }, []);

  const handleRetry = () => {
    setChecking(true);
    // Small delay to show animation before page reload
    setTimeout(() => window.location.reload(), 800);
  };

  return (
    <div style={{
      width: '100vw',
      height: '100dvh',
      background: NEON.bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Rajdhani', sans-serif",
      color: NEON.text,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Radial glow — magenta (offline/warning) */}
      <div style={{
        position: 'absolute',
        top: '40%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        height: 600,
        background: 'radial-gradient(circle, rgba(255,46,159,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Content card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          background: 'rgba(11,16,32,0.85)',
          border: `1px solid rgba(255,46,159,0.2)`,
          borderRadius: 20,
          padding: '48px 40px',
          textAlign: 'center',
          maxWidth: 440,
          width: '90%',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 40px rgba(255,46,159,0.1)',
        }}
      >
        {/* Offline icon */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ marginBottom: 24 }}
        >
          <div style={{
            width: 80,
            height: 80,
            margin: '0 auto 16px',
            background: 'rgba(255,46,159,0.1)',
            border: `2px solid rgba(255,46,159,0.3)`,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <WifiOff size={32} color={NEON.magenta} />
          </div>
        </motion.div>

        {/* Title */}
        <div style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '1.3rem',
          fontWeight: 900,
          color: NEON.text,
          marginBottom: 8,
          letterSpacing: '0.05em',
        }}>
          OFFLINE MODE
        </div>

        <div style={{
          fontFamily: "'Share Tech Mono'",
          fontSize: '0.65rem',
          color: `${NEON.magenta}88`,
          letterSpacing: '0.2em',
          marginBottom: 24,
        }}>
          AGAPE SOVEREIGN AI — DISCONNECTED
        </div>

        {/* Separator */}
        <div style={{
          height: 1,
          background: `linear-gradient(135deg, transparent, ${NEON.magenta}55, transparent)`,
          marginBottom: 24,
        }} />

        {/* Last known score */}
        {lastScore !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              background: 'rgba(0,212,255,0.05)',
              border: '1px solid rgba(0,212,255,0.12)',
              borderRadius: 12,
              padding: '16px',
              marginBottom: 24,
            }}
          >
            <div style={{
              fontFamily: "'Share Tech Mono'",
              fontSize: '0.58rem',
              color: NEON.textMuted,
              letterSpacing: '0.15em',
              marginBottom: 6,
            }}>
              LAST KNOWN SOVEREIGN SCORE
            </div>
            <div style={{
              fontFamily: "'Orbitron'",
              fontSize: '2rem',
              fontWeight: 900,
              color: lastScore > 75 ? NEON.blue : lastScore > 50 ? NEON.orange : NEON.magenta,
              textShadow: `0 0 20px ${lastScore > 75 ? NEON.blue : lastScore > 50 ? NEON.orange : NEON.magenta}55`,
            }}>
              {lastScore}
            </div>
            <div style={{
              fontFamily: "'Share Tech Mono'",
              fontSize: '0.5rem',
              color: NEON.textMuted,
              letterSpacing: '0.12em',
              marginTop: 4,
            }}>
              / 100 · CACHED LOCALLY
            </div>
          </motion.div>
        )}

        {/* Message */}
        <p style={{
          color: NEON.textMuted,
          fontSize: '0.9rem',
          lineHeight: 1.6,
          marginBottom: 28,
        }}>
          Your device is offline. Your sovereign data is encrypted and stored locally.{' '}
          <strong style={{ color: NEON.text }}>No data has been lost.</strong>
        </p>

        {/* Shield assurance */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 28,
          padding: '10px 16px',
          background: 'rgba(0,212,255,0.05)',
          borderRadius: 8,
          border: '1px solid rgba(0,212,255,0.1)',
        }}>
          <Shield size={14} color={`${NEON.blue}88`} />
          <span style={{
            fontFamily: "'Share Tech Mono'",
            fontSize: '0.55rem',
            color: `${NEON.blue}88`,
            letterSpacing: '0.1em',
          }}>
            AES-GCM ENCRYPTED · ZERO-KNOWLEDGE · SHA-256 VERIFIED
          </span>
        </div>

        {/* Retry button */}
        <motion.button
          whileHover={{ scale: 1.03, boxShadow: `0 0 20px ${NEON.blue}33` }}
          whileTap={{ scale: 0.97 }}
          onClick={handleRetry}
          disabled={checking}
          style={{
            width: '100%',
            padding: '14px 24px',
            background: `rgba(0,212,255,0.08)`,
            border: `1px solid ${NEON.blue}44`,
            borderRadius: 10,
            color: NEON.blue,
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '0.95rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            cursor: checking ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            transition: 'all 0.2s ease',
          }}
        >
          <motion.span
            animate={checking ? { rotate: 360 } : { rotate: 0 }}
            transition={checking ? { duration: 0.8, repeat: Infinity, ease: 'linear' } : {}}
          >
            <RefreshCw size={16} />
          </motion.span>
          {checking ? 'RECONNECTING...' : 'RETRY CONNECTION'}
        </motion.button>

        {/* Footer */}
        <div style={{
          marginTop: 24,
          fontFamily: "'Share Tech Mono'",
          fontSize: '0.52rem',
          color: `${NEON.textMuted}66`,
          letterSpacing: '0.12em',
        }}>
          AGAPE SOVEREIGN AI · OFFLINE SECURE ENCLAVE · 2026
        </div>
      </motion.div>
    </div>
  );
};

export default OfflinePage;
