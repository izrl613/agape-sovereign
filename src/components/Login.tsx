import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Shield, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';

const NEON_BLUE = '#00D4FF';
const NEON_MAGENTA = '#FF2E9F';
const NEON_ORANGE = '#FF6B00';

// ─── Inline Google logo SVG ──────────────────────────────────
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// ─── Passkey icon with biometric ring ───────────────────────
const PasskeyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="10" r="4" stroke={NEON_BLUE} strokeWidth="1.5"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={NEON_BLUE} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M17 3l1.5 1.5M21 7l-1.5-1.5M19.5 3L21 7" stroke={NEON_MAGENTA} strokeWidth="1.2" strokeLinecap="round"/>
    <circle cx="20" cy="5" r="2.5" stroke={NEON_ORANGE} strokeWidth="1" opacity="0.8"/>
  </svg>
);

// ─── Auth button base styles ─────────────────────────────────
const authBtnBase: React.CSSProperties = {
  width: '100%',
  padding: '14px 20px',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff',
  fontFamily: "'Rajdhani', sans-serif",
  fontSize: '0.97rem',
  fontWeight: 600,
  letterSpacing: '0.05em',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  position: 'relative',
  overflow: 'hidden',
};

// ─── Passkey availability indicator ─────────────────────────
const PasskeyAvailabilityBadge: React.FC<{ available: boolean | null }> = ({ available }) => {
  if (available === null) return null;
  return (
    <span style={{
      fontSize: 9,
      fontFamily: 'monospace',
      letterSpacing: '0.1em',
      padding: '2px 8px',
      borderRadius: 100,
      background: available ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.06)',
      color: available ? NEON_BLUE : 'rgba(255,255,255,0.3)',
      border: `1px solid ${available ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
      marginLeft: 'auto',
    }}>
      {available ? '● AVAILABLE' : '○ NOT SUPPORTED'}
    </span>
  );
};

export const Login = () => {
  const { login, loginWithPasskey, emergencyBypass } = useAuth();

  const [mode, setMode] = useState<'main' | 'passkey' | 'loading'>('main');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyAvailable, setPasskeyAvailable] = useState<boolean | null>(null);

  // Detect platform authenticator support on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(setPasskeyAvailable)
        .catch(() => setPasskeyAvailable(false));
    } else {
      setPasskeyAvailable(false);
    }
  }, []);

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await login();
      setMode('loading');
    } catch (err: unknown) {
      setGoogleLoading(false);
      setError(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.');
    }
  };

  const handlePasskeyLogin = async () => {
    setError(null);
    if (!validateEmail(email)) {
      setEmailError('Enter a valid email to locate your passkey.');
      return;
    }
    setPasskeyLoading(true);
    try {
      await loginWithPasskey(email);
      setMode('loading');
    } catch (err: unknown) {
      setPasskeyLoading(false);
      const msg = err instanceof Error ? err.message : 'Passkey authentication failed.';
      if (msg.includes('cancelled') || msg.includes('NotAllowedError')) {
        setError('Passkey prompt was dismissed. Try again or use Google Sign-In.');
      } else {
        setError(msg);
      }
    }
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
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 700, background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '75%', left: '18%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(255,46,159,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: 460,
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0,212,255,0.15)',
          borderRadius: 20,
          padding: '44px 40px 36px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 40px rgba(0,212,255,0.06)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo + Title */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ marginBottom: 16 }}
          >
            <svg viewBox="0 0 56 56" width={56} height={56} style={{ filter: `drop-shadow(0 0 14px ${NEON_BLUE})`, margin: '0 auto', display: 'block' }}>
              <polygon points="28,3 53,17 53,39 28,53 3,39 3,17" fill="none" stroke={NEON_BLUE} strokeWidth="1.5" />
              <polygon points="28,11 45,21 45,35 28,45 11,35 11,21" fill="none" stroke={NEON_MAGENTA} strokeWidth="1" opacity="0.6" />
              <polygon points="28,19 37,25 37,31 28,37 19,31 19,25" fill={NEON_ORANGE} fillOpacity="0.7" stroke={NEON_ORANGE} strokeWidth="0.5" />
            </svg>
          </motion.div>
          <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: '0.1em', color: '#fff' }}>
            Agape Sovereign AI
          </div>
          <div style={{ fontSize: 10, color: NEON_BLUE, fontFamily: 'monospace', letterSpacing: '0.22em', marginTop: 5, opacity: 0.8 }}>
            DIGITAL IDENTITY DEFENSE
          </div>
        </div>

        {/* Gradient separator */}
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${NEON_MAGENTA}, ${NEON_BLUE}, ${NEON_ORANGE}, transparent)`, marginBottom: 28, opacity: 0.6 }} />

        <AnimatePresence mode="wait">

          {/* ── MAIN auth panel ── */}
          {mode === 'main' && (
            <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '12px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, marginBottom: 20 }}
                >
                  <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ color: '#fca5a5', fontSize: '0.8rem', fontFamily: "'Share Tech Mono'" }}>{error}</span>
                </motion.div>
              )}

              {/* ── Sign In with Google ── */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', letterSpacing: '0.2em', marginBottom: 8 }}>RECOMMENDED</div>
                <motion.button
                  whileHover={{ scale: 1.01, borderColor: 'rgba(66,133,244,0.5)', background: 'rgba(66,133,244,0.12)' }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleGoogleLogin}
                  disabled={googleLoading || passkeyLoading}
                  style={{
                    ...authBtnBase,
                    background: 'rgba(66,133,244,0.08)',
                    border: '1px solid rgba(66,133,244,0.25)',
                    boxShadow: '0 0 0 0 rgba(66,133,244,0)',
                  }}
                  aria-label="Sign in with Google"
                >
                  {googleLoading ? <Loader2 size={20} className="animate-spin" /> : <GoogleIcon />}
                  <span>{googleLoading ? 'Signing in…' : 'Sign in with Google'}</span>
                  {!googleLoading && <ChevronRight size={16} style={{ marginLeft: 'auto', opacity: 0.4 }} />}
                </motion.button>
              </div>

              {/* ── Divider ── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', letterSpacing: '0.15em' }}>OR</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
              </div>

              {/* ── Login with Passkey ── */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', letterSpacing: '0.2em' }}>PASSKEY — ZERO PASSWORD</span>
                  <PasskeyAvailabilityBadge available={passkeyAvailable} />
                </div>

                <div style={{ marginBottom: 10 }}>
                  <input
                    type="email"
                    placeholder="Your sovereign email…"
                    value={email}
                    autoComplete="username webauthn"
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
                    }}
                  />
                  {emailError && (
                    <div style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: 5, fontFamily: "'Rajdhani'" }}>
                      {emailError}
                    </div>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.01, borderColor: 'rgba(0,212,255,0.45)', background: 'rgba(0,212,255,0.08)' }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handlePasskeyLogin}
                  disabled={passkeyLoading || googleLoading || passkeyAvailable === false}
                  style={{
                    ...authBtnBase,
                    background: 'rgba(0,212,255,0.04)',
                    border: `1px solid ${passkeyAvailable === false ? 'rgba(255,255,255,0.07)' : 'rgba(0,212,255,0.2)'}`,
                    opacity: passkeyAvailable === false ? 0.45 : 1,
                  }}
                  aria-label="Sign in with passkey"
                  title={passkeyAvailable === false ? 'Platform authenticator not available on this device/browser' : undefined}
                >
                  {passkeyLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Fingerprint size={20} color={passkeyAvailable === false ? 'rgba(255,255,255,0.3)' : NEON_BLUE} />
                  )}
                  <span style={{ color: passkeyAvailable === false ? 'rgba(255,255,255,0.35)' : '#fff' }}>
                    {passkeyLoading ? 'Prompting device…' : 'Login with Passkey'}
                  </span>
                  {!passkeyLoading && passkeyAvailable !== false && (
                    <ChevronRight size={16} style={{ marginLeft: 'auto', opacity: 0.4 }} />
                  )}
                </motion.button>

                {passkeyAvailable === false && (
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', marginTop: 7, textAlign: 'center' }}>
                    Use Chrome/Safari on a device with biometrics or a hardware key
                  </div>
                )}
              </div>

              {/* ── Security note ── */}
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', lineHeight: 1.6, marginBottom: 16 }}>
                <Shield size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5, color: NEON_ORANGE }} />
                Zero-knowledge · AES-GCM encrypted · No password stored
              </div>

              {/* ── Emergency bypass (hidden) ── */}
              <button
                onClick={async () => {
                  setError(null);
                  try { await emergencyBypass(); setMode('loading'); }
                  catch (err: unknown) { setError(err instanceof Error ? err.message : 'Bypass failed.'); }
                }}
                style={{ display: 'block', margin: '0 auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, color: 'rgba(255,255,255,0.12)', fontFamily: 'monospace', letterSpacing: '0.2em', padding: '4px 0' }}
              >
                [ EMERGENCY BYPASS ]
              </button>
            </motion.div>
          )}

          {/* ── Loading / initializing ── */}
          {mode === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '28px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    style={{ width: 8, height: 8, borderRadius: '50%', background: NEON_BLUE }}
                  />
                ))}
              </div>
              <div style={{ color: NEON_BLUE, fontFamily: "'Share Tech Mono'", fontSize: '0.82rem', letterSpacing: '0.15em' }}>
                INITIALIZING SOVEREIGN ENCLAVE…
              </div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', marginTop: 8 }}>
                Preparing your DIFF sovereignty console
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
};
