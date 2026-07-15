import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { motion } from 'framer-motion';
import { Fingerprint } from 'lucide-react';

const NEON_BLUE = '#00D4FF';
const NEON_MAGENTA = '#FF2E9F';
const NEON_ORANGE = '#FF7A18';
const NEON_TEXT = '#E0E6FF';
const NEON_MUTED = 'rgba(180,190,220,0.5)';
const GRADIENT_BORDER = 'linear-gradient(135deg, #FF2E9F 0%, #00D4FF 50%, #FF7A18 100%)';

// ─── Google logo SVG ──────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export const Login = () => {
  const { login, loginWithPasskey } = useAuth();

  const [step, setStep] = useState<'landing' | 'passkey' | 'creating'>('landing');
  const [scanning, setScanning] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  // Strip raw JSON blobs or Firebase error prefixes
  const formatError = (err: unknown): string => {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.startsWith('{')) return 'A server error occurred. Please try again.';
    if (msg.startsWith('Firebase:')) return 'Authentication service error. Try refreshing the page.';
    return msg;
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setScanning(true);
    try {
      await login();
      setStep('creating');
    } catch (err: unknown) {
      setScanning(false);
      setAuthError(formatError(err));
    }
  };

  const handlePasskeyStep = async () => {
    setAuthError(null);

    if (!validateEmail(email)) {
      setEmailError('Enter a valid email to locate your passkey.');
      return;
    }
    setEmailError(null);
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setStep('passkey');
    }, 900);
  };

  const handlePasskeyLogin = async () => {
    setAuthError(null);
    try {
      await loginWithPasskey(email);
      setStep('creating');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Passkey authentication failed.';
      if (msg.includes('cancelled') || msg.includes('NotAllowedError')) {
        setAuthError('Passkey prompt was dismissed. Try again or use Google Sign-In.');
      } else {
        setAuthError(formatError(err));
      }
      setStep('passkey');
    }
  };

  // ── Shared card style ──────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    width: 480,
    padding: '48px 40px',
    textAlign: 'center',
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(0,212,255,0.15)',
    borderRadius: 20,
    boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 40px rgba(0,212,255,0.06)',
    position: 'relative',
    zIndex: 1,
  };

  const btnBase: React.CSSProperties = {
    width: '100%',
    padding: '13px 20px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '0.95rem',
    fontWeight: 600,
    letterSpacing: '0.05em',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#0B1020',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Grid background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />
      {/* Radial glows */}
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '70%', left: '20%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(255,46,159,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={cardStyle}
      >
        {/* Logo */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ marginBottom: 32 }}
        >
          <div style={{ width: 80, height: 80, margin: '0 auto 16px', position: 'relative' }}>
            <svg viewBox="0 0 80 80" style={{ width: '100%', filter: `drop-shadow(0 0 12px ${NEON_BLUE})` }}>
              <polygon points="40,5 75,25 75,55 40,75 5,55 5,25" fill="none" stroke={NEON_BLUE} strokeWidth="1.5" />
              <polygon points="40,15 65,28 65,52 40,65 15,52 15,28" fill="none" stroke={NEON_MAGENTA} strokeWidth="1" opacity="0.6" />
              <text x="40" y="46" textAnchor="middle" fill={NEON_BLUE} fontFamily="Orbitron" fontSize="16" fontWeight="900">AI</text>
            </svg>
          </div>
          <div style={{ fontWeight: 900, fontSize: '1.5rem', letterSpacing: '0.06em', color: NEON_BLUE, textShadow: `0 0 20px ${NEON_BLUE}88` }}>
            ARCHITECT AI
          </div>
          <div style={{ color: NEON_MUTED, fontSize: '0.7rem', fontFamily: "'Share Tech Mono'", marginTop: 4, letterSpacing: '0.15em' }}>
            AGAPE SOVEREIGN ENCLAVE 2026
          </div>
        </motion.div>

        {/* Neon separator */}
        <div style={{ height: 1, background: GRADIENT_BORDER, marginBottom: 28, borderRadius: 1, opacity: 0.7 }} />

        {/* Error display */}
        {authError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 20, padding: '10px 14px', background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.3)', borderRadius: 10, color: '#ffaa66', fontSize: '0.8rem', fontFamily: "'Share Tech Mono'", textAlign: 'left' }}
          >
            {authError}
          </motion.div>
        )}

        {/* ── Landing ── */}
        {step === 'landing' && !scanning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ color: NEON_TEXT, fontSize: '0.9rem', marginBottom: 8, fontWeight: 500 }}>
              Digital Identity Federated Footprint
            </div>
            <div style={{ color: NEON_MUTED, fontSize: '0.78rem', marginBottom: 20, lineHeight: 1.6 }}>
              Authenticate to begin your{' '}
              <span style={{ color: NEON_MAGENTA, fontWeight: 700 }}>DIFF</span>{' '}
              analysis. Your sovereignty begins here.
            </div>

            <div style={{ marginBottom: 16, textAlign: 'left' }}>
              <input
                type="email"
                placeholder="Enter sovereign email for passkey..."
                value={email}
                onChange={e => { setEmail(e.target.value); if (emailError) setEmailError(null); }}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: 'rgba(0,0,0,0.25)',
                  border: `1px solid ${emailError ? '#ef4444' : 'rgba(0,212,255,0.15)'}`,
                  borderRadius: 10,
                  color: '#fff',
                  fontFamily: "'Share Tech Mono'",
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                  caretColor: NEON_BLUE,
                }}
                aria-label="Sovereign email"
              />
              {emailError && (
                <div style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: 5, fontFamily: "'Rajdhani'" }}>
                  {emailError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={handleGoogleLogin}
                style={{ ...btnBase, background: 'rgba(66,133,244,0.1)', border: '1px solid rgba(66,133,244,0.25)' }}
                aria-label="Continue with Google"
              >
                <GoogleIcon />
                Continue with Google
              </button>
              <button
                onClick={handlePasskeyStep}
                style={{ ...btnBase, background: 'rgba(0,212,255,0.05)', border: `1px solid ${NEON_BLUE}44` }}
                aria-label="Sign in with Passkey"
              >
                <Fingerprint size={20} color={NEON_BLUE} />
                Sign in with Passkey
              </button>
            </div>

            <div style={{ marginTop: 20, color: NEON_MUTED, fontSize: '0.7rem', lineHeight: 1.5 }}>
              🔒 All data encrypted client-side. Zero-knowledge architecture.<br />
              Your identity. Your sovereignty. Your rules.
            </div>

          </motion.div>
        )}

        {/* ── Scanning spinner ── */}
        {scanning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '20px 0' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', margin: '0 auto 20px',
              border: `3px solid rgba(0,212,255,0.2)`,
              borderTop: `3px solid ${NEON_BLUE}`,
              animation: 'spin 1s linear infinite',
            }} />
            <div style={{ color: NEON_BLUE, fontFamily: "'Share Tech Mono'", fontSize: '0.8rem', letterSpacing: '0.15em' }}>
              AUTHENTICATING IDENTITY...
            </div>
            <div style={{ color: NEON_MUTED, fontSize: '0.7rem', marginTop: 8 }}>
              Establishing secure federated session
            </div>
          </motion.div>
        )}

        {/* ── Passkey confirmation ── */}
        {step === 'passkey' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🔑</div>
            <div style={{ color: NEON_ORANGE, fontFamily: "'Share Tech Mono'", fontSize: '0.95rem', letterSpacing: '0.12em', marginBottom: 12 }}>
              BIND UNIVERSAL PASSKEY
            </div>
            <div style={{ color: NEON_MUTED, fontSize: '0.8rem', marginBottom: 24, lineHeight: 1.6 }}>
              Your passkey will be device-bound to this session.<br />No password. No breach. Pure sovereignty.
            </div>
            <button
              onClick={handlePasskeyLogin}
              style={{ ...btnBase, background: `rgba(255,122,24,0.08)`, border: `1px solid ${NEON_ORANGE}66`, color: NEON_ORANGE }}
              aria-label="Authenticate with Passkey"
            >
              AUTHENTICATE WITH PASSKEY
            </button>
            <button
              onClick={() => { setStep('landing'); setAuthError(null); }}
              style={{ marginTop: 14, background: 'none', border: 'none', color: NEON_MUTED, fontSize: '0.75rem', cursor: 'pointer', fontFamily: "'Share Tech Mono'" }}
            >
              ← Back
            </button>
          </motion.div>
        )}

        {/* ── Initializing ── */}
        {step === 'creating' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
                  style={{ width: 8, height: 8, borderRadius: '50%', background: NEON_BLUE }}
                />
              ))}
            </div>
            <div style={{ color: NEON_BLUE, fontFamily: "'Share Tech Mono'", fontSize: '0.8rem', letterSpacing: '0.15em' }}>
              INITIALIZING ARCHITECT AI...
            </div>
            <div style={{ color: NEON_MUTED, fontSize: '0.7rem', marginTop: 8 }}>
              Preparing your DIFF sovereignty console
            </div>
          </motion.div>
        )}
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
