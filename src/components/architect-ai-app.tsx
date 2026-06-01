// ============================================================
// ARCHITECT AI — APP COMPONENT (Client-Side)
// Agape Sovereign Enclave 2026
// src/components/architect-ai-app.tsx
// ============================================================

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import crypto from 'crypto';

// ─── NEON COLOR PALETTE ────────────────────────────────────
const NEON = {
  magenta: '#FF2E9F',
  blue: '#00D4FF',
  orange: '#FF7A18',
  bg: '#060D1F',
  bgCard: 'rgba(8, 18, 40, 0.85)',
  bgGlass: 'rgba(0, 212, 255, 0.04)',
  text: '#E8F4FF',
  textMuted: '#7B9BB5',
};

const GRADIENT = `linear-gradient(135deg, ${NEON.magenta}, ${NEON.blue}, ${NEON.orange})`;
const GRADIENT_BORDER = `linear-gradient(135deg, ${NEON.magenta} 0%, ${NEON.blue} 50%, ${NEON.orange} 100%)`;

// ─── GLOBAL STYLES ────────────────────────────────────────
const GlobalStyle = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: ${NEON.bg}; color: ${NEON.text}; font-family: 'Rajdhani', sans-serif; overflow: hidden; }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
      ::-webkit-scrollbar-thumb { background: ${NEON.blue}; border-radius: 2px; }

      @keyframes pulse-border {
        0%,100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
      @keyframes scan-line {
        0% { top: -2px; }
        100% { top: 100%; }
      }
      @keyframes float {
        0%,100% { transform: translateY(0px); }
        50% { transform: translateY(-6px); }
      }
      @keyframes glow-pulse {
        0%,100% { box-shadow: 0 0 8px ${NEON.magenta}, 0 0 20px rgba(255,46,159,0.3); }
        33% { box-shadow: 0 0 8px ${NEON.blue}, 0 0 20px rgba(0,212,255,0.3); }
        66% { box-shadow: 0 0 8px ${NEON.orange}, 0 0 20px rgba(255,122,24,0.3); }
      }
      @keyframes text-glow {
        0%,100% { text-shadow: 0 0 10px ${NEON.magenta}, 0 0 20px rgba(255,46,159,0.5); }
        50% { text-shadow: 0 0 10px ${NEON.blue}, 0 0 20px rgba(0,212,255,0.5); }
      }
      @keyframes slide-in-left {
        from { transform: translateX(-30px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slide-in-up {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes rotate-gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes data-stream {
        0% { transform: translateY(0); opacity: 1; }
        100% { transform: translateY(-40px); opacity: 0; }
      }
      @keyframes nuke-flash {
        0%,100% { background: rgba(255,46,159,0.1); }
        50% { background: rgba(255,46,159,0.25); }
      }
      @keyframes knox-pulse {
        0%,100% { background: rgba(0,212,255,0.1); }
        50% { background: rgba(0,212,255,0.2); }
      }
      @keyframes spinner {
        to { transform: rotate(360deg); }
      }
      
      .neon-border {
        position: relative;
      }
      .neon-border::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        padding: 1px;
        background: ${GRADIENT_BORDER};
        background-size: 200% 200%;
        animation: rotate-gradient 4s linear infinite;
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
        z-index: 1;
      }
      .pulse-border::before {
        animation: rotate-gradient 3s linear infinite, pulse-border 2s ease-in-out infinite;
      }
      .btn-neon {
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
        cursor: pointer;
        border: none;
        outline: none;
      }
      .btn-neon:hover {
        transform: translateY(-2px);
        animation: glow-pulse 2s infinite;
      }
      .module-card {
        transition: all 0.3s ease;
        cursor: pointer;
      }
      .module-card:hover {
        transform: translateY(-2px);
        border-color: ${NEON.blue} !important;
        box-shadow: 0 8px 32px rgba(0,212,255,0.2) !important;
      }
      .nav-item {
        transition: all 0.25s ease;
        cursor: pointer;
      }
      .nav-item:hover, .nav-item.active {
        background: rgba(0,212,255,0.08);
        border-left: 2px solid ${NEON.blue};
        padding-left: 14px;
      }
      .chat-bubble {
        animation: slide-in-up 0.3s ease;
      }
      .score-ring {
        filter: drop-shadow(0 0 12px ${NEON.blue});
      }
      .thinking-dot {
        width: 6px; height: 6px; border-radius: 50%; background: ${NEON.blue};
        animation: pulse-border 0.8s ease-in-out infinite;
      }
      .thinking-dot:nth-child(2) { animation-delay: 0.15s; background: ${NEON.magenta}; }
      .thinking-dot:nth-child(3) { animation-delay: 0.3s; background: ${NEON.orange}; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  return null;
};

// ─── UTILITY COMPONENTS ────────────────────────────────────
const NeonText = ({ children, color = NEON.blue, size = '1rem', weight = 700, style = {} }: any) => (
  <span
    style={{
      fontFamily: "'Orbitron', monospace",
      color,
      fontSize: size,
      fontWeight: weight,
      textShadow: `0 0 10px ${color}66`,
      letterSpacing: '0.05em',
      ...style,
    }}
  >
    {children}
  </span>
);

const GlassCard = ({ children, style = {}, className = '', onClick }: any) => (
  <div
    className={`neon-border ${className}`}
    onClick={onClick}
    style={{
      background: NEON.bgCard,
      backdropFilter: 'blur(20px)',
      borderRadius: 12,
      border: '1px solid rgba(0,212,255,0.15)',
      position: 'relative',
      ...style,
    }}
  >
    {children}
  </div>
);

// ─── MAIN APP EXPORT ──────────────────────────────────────
export function ArchitectAIApp({ user }: any) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return <GlobalStyle />;
  }

  return (
    <>
      <GlobalStyle />
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: NEON.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: NEON.text,
          fontFamily: "'Rajdhani', sans-serif",
        }}
      >
        {user ? (
          <GlassCard
            style={{
              width: '90%',
              maxWidth: 800,
              padding: 40,
              textAlign: 'center',
            }}
          >
            <NeonText color={NEON.blue} size="2rem" weight={900}>
              ARCHITECT AI
            </NeonText>
            <p style={{ marginTop: 16, color: NEON.textMuted }}>
              Welcome, {user.displayName || user.email}
            </p>
            <p style={{ marginTop: 8, color: NEON.orange, fontSize: '0.9rem' }}>
              ✓ Authenticated via {user.provider.toUpperCase()}
            </p>
            <p style={{ marginTop: 24, color: NEON.text, fontSize: '0.95rem', lineHeight: 1.6 }}>
              Agape Sovereign Enclave 2026<br />
              Digital Identity Federated Footprint (DIFF) Intelligence Platform<br />
              <span style={{ color: NEON.textMuted, fontSize: '0.8rem' }}>
                Real-time security analysis · Zero-knowledge architecture · ECRA 2026 compliant
              </span>
            </p>
          </GlassCard>
        ) : (
          <GlassCard
            style={{
              width: '90%',
              maxWidth: 600,
              padding: 40,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔐</div>
            <NeonText color={NEON.magenta} size="1.5rem" weight={900}>
              AUTHENTICATION REQUIRED
            </NeonText>
            <p style={{ marginTop: 16, color: NEON.textMuted }}>
              Please sign in with Google or Apple account to access Architect AI.
            </p>
          </GlassCard>
        )}
      </div>
    </>
  );
}
