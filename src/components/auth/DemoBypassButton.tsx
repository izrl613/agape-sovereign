import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

// Visible only when VITE_DEMO_MODE=true or ?demo=true in the URL
function isDemoVisible(): boolean {
  if (import.meta.env.VITE_DEMO_MODE === 'true') return true;
  if (typeof window !== 'undefined' && window.location.search.includes('demo=true')) return true;
  return false;
}

// CSS keyframes injected once
const GLITCH_CSS = `
@keyframes sovereign-glitch {
  0%   { clip-path: inset(40% 0 61% 0); transform: translate(-2px, 0); }
  10%  { clip-path: inset(92% 0 1% 0);  transform: translate(1px, 0); }
  20%  { clip-path: inset(43% 0 1% 0);  transform: translate(-1px, 0); }
  30%  { clip-path: inset(25% 0 58% 0); transform: translate(2px, 0); }
  40%  { clip-path: inset(54% 0 7% 0);  transform: translate(0px, 0); }
  50%  { clip-path: inset(58% 0 43% 0); transform: translate(-1px, 0); }
  60%  { clip-path: inset(20% 0 50% 0); transform: translate(1px, 0); }
  70%  { clip-path: inset(11% 0 80% 0); transform: translate(2px, 0); }
  80%  { clip-path: inset(78% 0 3% 0);  transform: translate(-2px, 0); }
  90%  { clip-path: inset(87% 0 3% 0);  transform: translate(1px, 0); }
  100% { clip-path: inset(56% 0 30% 0); transform: translate(-1px, 0); }
}
@keyframes sovereign-border-pulse {
  0%   { box-shadow: 0 0 6px #FF7A18, 0 0 14px rgba(255,122,24,0.3), inset 0 0 6px rgba(255,122,24,0.05); }
  50%  { box-shadow: 0 0 16px #FF7A18, 0 0 32px rgba(255,122,24,0.5), inset 0 0 12px rgba(255,122,24,0.12); }
  100% { box-shadow: 0 0 6px #FF7A18, 0 0 14px rgba(255,122,24,0.3), inset 0 0 6px rgba(255,122,24,0.05); }
}
`;

export const DemoBypassButton: React.FC = () => {
  const [visible] = useState(isDemoVisible);
  const [hovered, setHovered] = useState(false);
  const { setDemoUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!visible) return;
    const el = document.getElementById('sovereign-glitch-style');
    if (!el) {
      const style = document.createElement('style');
      style.id = 'sovereign-glitch-style';
      style.textContent = GLITCH_CSS;
      document.head.appendChild(style);
    }
  }, [visible]);

  if (!visible) return null;

  const handleClick = () => {
    setDemoUser();
    navigate('/dashboard', { replace: true });
  };

  const labelStyle: React.CSSProperties = {
    position: 'relative',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 12,
    letterSpacing: '0.18em',
    color: '#FF7A18',
    userSelect: 'none',
  };

  const glitchOverlayStyle: React.CSSProperties = {
    ...labelStyle,
    position: 'absolute',
    inset: 0,
    color: '#FF2E9F',
    animation: hovered ? 'sovereign-glitch 0.6s infinite linear alternate-reverse' : 'none',
    pointerEvents: 'none',
  };

  return (
    <div style={{ marginTop: 16 }}>
      {/* OR divider */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        color: 'rgba(255,122,24,0.3)', fontSize: 10,
        letterSpacing: '0.1em', fontFamily: 'monospace',
        marginBottom: 12,
      }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,122,24,0.15)' }} />
        OR
        <div style={{ flex: 1, height: 1, background: 'rgba(255,122,24,0.15)' }} />
      </div>

      <motion.button
        id="demo-bypass-btn"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleClick}
        whileTap={{ scale: 0.975 }}
        style={{
          width: '100%',
          padding: '14px 20px',
          borderRadius: 10,
          background: 'rgba(255,122,24,0.05)',
          border: '1px solid rgba(255,122,24,0.45)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          animation: 'sovereign-border-pulse 2.4s ease-in-out infinite',
          outline: 'none',
          position: 'relative',
          overflow: 'hidden',
        }}
        aria-label="Enter as demo guest"
      >
        {/* Subtle scanline overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,122,24,0.025) 2px, rgba(255,122,24,0.025) 4px)',
        }} />

        {/* Demo icon */}
        <span style={{ fontSize: 14, flexShrink: 0 }} aria-hidden>⚗</span>

        {/* Glitch label */}
        <span style={labelStyle}>
          ENTER AS GUEST // DEMO MODE
          <span style={glitchOverlayStyle} aria-hidden>
            ENTER AS GUEST // DEMO MODE
          </span>
        </span>
      </motion.button>

      <div style={{
        textAlign: 'center', marginTop: 8,
        fontSize: 9.5, color: 'rgba(255,122,24,0.4)',
        fontFamily: 'monospace', letterSpacing: '0.08em',
      }}>
        TEMPORARY · SESSION EXPIRES IN 30 MIN · DATA NOT SAVED
      </div>
    </div>
  );
};
