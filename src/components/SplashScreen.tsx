import React from 'react';
import { motion } from 'framer-motion';
import { NEON } from './UI';
import { EncryptedFooter } from './EncryptedFooter';

// ─── Upgraded SplashScreen with encrypted seal footer ─────────────────────────
export const SplashScreen = () => (
  <div style={{
    position: 'fixed',
    inset: 0,
    background: 'rgba(6,13,31,0.98)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(16px)',
    gap: 28
  }}>
    {/* Animated grid */}
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: `linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)`,
      backgroundSize: '40px 40px',
      pointerEvents: 'none'
    }} />
    {/* Radial glow */}
    <div style={{
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%,-50%)',
      width: 500, height: 500,
      background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)',
      pointerEvents: 'none'
    }} />

    {/* Logo + spinner */}
    <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
      {/* Hex logo */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ marginBottom: 24 }}
      >
        <svg viewBox="0 0 80 80" style={{ width: 72, height: 72, filter: `drop-shadow(0 0 14px ${NEON.blue})` }}>
          <polygon points="40,5 75,25 75,55 40,75 5,55 5,25" fill="none" stroke={NEON.blue} strokeWidth="1.5" />
          <polygon points="40,15 65,28 65,52 40,65 15,52 15,28" fill="none" stroke={NEON.magenta} strokeWidth="1" opacity="0.5" />
          <text x="40" y="46" textAnchor="middle" fill={NEON.blue} fontFamily="Orbitron" fontSize="15" fontWeight="900">AI</text>
        </svg>
      </motion.div>

      {/* Spinner ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        style={{
          width: 52, height: 52,
          borderRadius: '50%',
          border: `6px solid rgba(0,212,255,0.12)`,
          borderTopColor: NEON.blue,
          borderRightColor: NEON.magenta,
          boxShadow: `0 0 20px ${NEON.blue}44`,
          margin: '0 auto 20px'
        }}
      />

      {/* Labels */}
      <div style={{
        fontFamily: "'Orbitron', monospace",
        fontSize: '0.75rem',
        color: NEON.blue,
        letterSpacing: '0.25em',
        textShadow: `0 0 10px ${NEON.blue}66`,
        marginBottom: 6
      }}>
        ARCHITECT AI
      </div>
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{
          fontFamily: "'Share Tech Mono'",
          fontSize: '0.6rem',
          color: NEON.textMuted,
          letterSpacing: '0.2em'
        }}
      >
        INITIALIZING SOVEREIGN ENCLAVE...
      </motion.div>
    </div>

    {/* Encrypted Footer pinned to bottom */}
    <div style={{
      position: 'absolute',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 420,
      maxWidth: '90vw',
      background: 'rgba(6,13,31,0.6)',
      border: '1px solid rgba(0,212,255,0.1)',
      borderRadius: 10,
      padding: '10px 16px',
      zIndex: 2
    }}>
      <EncryptedFooter moduleId="splash-loading" uid="system" />
    </div>
  </div>
);
