import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

const DEMO_TTL_MS = 30 * 60 * 1000;
const DEMO_SESSION_KEY = 'sovereign_demo_mode';

export const DemoBanner: React.FC = () => {
  const { demoMode, clearDemoUser } = useAuth();
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-expire: check remaining TTL and schedule expiry redirect
  useEffect(() => {
    if (!demoMode) return;

    try {
      const raw = sessionStorage.getItem(DEMO_SESSION_KEY);
      if (!raw) return;
      const session = JSON.parse(raw) as { expiresAt: number };
      const remaining = session.expiresAt - Date.now();

      if (remaining <= 0) {
        clearDemoUser();
        navigate('/login', { replace: true });
        return;
      }

      timerRef.current = setTimeout(() => {
        clearDemoUser();
        navigate('/login', { replace: true });
      }, remaining);
    } catch {
      // session storage parse error — treat as expired
      clearDemoUser();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode]);

  const handleSignIn = () => {
    clearDemoUser();
    navigate('/login');
  };

  // Calculate remaining minutes for display
  let minutesLeft = 30;
  try {
    const raw = sessionStorage.getItem(DEMO_SESSION_KEY);
    if (raw) {
      const session = JSON.parse(raw) as { expiresAt: number };
      minutesLeft = Math.max(0, Math.ceil((session.expiresAt - Date.now()) / 60000));
    }
  } catch {
    // ignore
  }

  return (
    <AnimatePresence>
      {demoMode && (
        <motion.div
          key="demo-banner"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 9999,
            width: '100%',
            background: 'linear-gradient(90deg, rgba(255,122,24,0.12) 0%, rgba(255,46,159,0.08) 100%)',
            borderBottom: '1px solid rgba(255,122,24,0.35)',
            backdropFilter: 'blur(10px)',
            padding: '8px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
          role="alert"
          aria-live="polite"
        >
          {/* Animated indicator */}
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            style={{ fontSize: 14 }}
            aria-hidden
          >
            🔬
          </motion.span>

          <span style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.14em',
            color: '#FF7A18',
            fontWeight: 700,
          }}>
            DEMO MODE
          </span>

          <span style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.6)',
            fontFamily: "'Inter', sans-serif",
          }}>
            — Sign in to save your data · expires in {minutesLeft} min
          </span>

          <button
            onClick={handleSignIn}
            style={{
              background: 'rgba(255,122,24,0.12)',
              border: '1px solid rgba(255,122,24,0.4)',
              borderRadius: 6,
              color: '#FF7A18',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.12em',
              padding: '4px 12px',
              cursor: 'pointer',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,122,24,0.22)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,122,24,0.12)')}
            aria-label="Sign in and exit demo mode"
          >
            SIGN IN →
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
