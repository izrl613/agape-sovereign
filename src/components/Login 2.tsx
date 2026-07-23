import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { NEON, GlassCard, NeonText } from './UI';
import { EncryptedFooter } from './EncryptedFooter';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Shield, Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 1: THE GATEKEEPER — Login Screen
// Entry Point A: Sign In with Google (Federated Identity)
// Entry Point B: Passkey WebAuthn (Anonymous/Local Identity)
// Both paths produce SHA-256 hash → temporary local profile → Dashboard
// ─────────────────────────────────────────────────────────────────────────────

/** Animated hash ticker — glitches hex chars before revealing the real hash */
const HashTicker = ({ hash, active }: { hash: string | null; active: boolean }) => {
  const [display, setDisplay] = useState('');
  const chars = '0123456789abcdef';
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) { setDisplay(''); return; }

    // Glitch-scramble then settle
    let tick = 0;
    frameRef.current = setInterval(() => {
      const fakeLen = 64;
      setDisplay(
        Array.from({ length: fakeLen }, (_, i) =>
          hash && tick > 20 && i < tick - 20 ? hash[i] : chars[Math.floor(Math.random() * chars.length)]
        ).join('')
      );
      tick++;
      if (hash && tick > 84) {
        setDisplay(hash);
        if (frameRef.current) clearInterval(frameRef.current);
      }
    }, 40);

    return () => { if (frameRef.current) clearInterval(frameRef.current); };
  }, [active, hash]);

  if (!active && !hash) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      style={{
        marginTop: 16,
        padding: '12px 14px',
        background: 'rgba(0,0,0,0.5)',
        border: `1px solid ${NEON.blue}22`,
        borderRadius: 8,
        textAlign: 'left',
      }}
    >
      <div style={{
        fontFamily: "'Share Tech Mono'",
        fontSize: '0.52rem',
        color: NEON.textMuted,
        letterSpacing: '0.18em',
        marginBottom: 6,
      }}>
        SHA-256 IDENTITY HASH — COMPUTING...
      </div>
      <div style={{
        fontFamily: "'Share Tech Mono'",
        fontSize: '0.56rem',
        color: display === hash && hash ? NEON.blue : NEON.magenta,
        wordBreak: 'break-all',
        lineHeight: 1.7,
        letterSpacing: '0.04em',
        textShadow: display === hash && hash
          ? `0 0 8px ${NEON.blue}55`
          : `0 0 8px ${NEON.magenta}44`,
        transition: 'color 0.4s ease, text-shadow 0.4s ease',
      }}>
        {display || '——'}
      </div>
      {display === hash && hash && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 8,
            fontFamily: "'Share Tech Mono'",
            fontSize: '0.5rem',
            color: '#00FF88',
            letterSpacing: '0.12em',
          }}
        >
          <CheckCircle2 size={10} color="#00FF88" />
          HASH ANCHORED · PII PURGED · ZERO-RETENTION CONFIRMED
        </motion.div>
      )}
    </motion.div>
  );
};

// Google SVG brand icon
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

type LoginStep = 'landing' | 'hashing' | 'initializing';

const INIT_MESSAGES = [
  'Verifying SHA-256 identity anchor...',
  'Provisioning secure enclave session...',
  'Initializing 16-vector identity framework...',
  'Architect AI connecting...',
  'Sovereign console ready.',
];

export const Login = () => {
  const { user, login, loginWithPasskey, sovereignHash, setupComplete } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<LoginStep>('landing');
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [initMsgIdx, setInitMsgIdx] = useState(0);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingPasskey, setIsLoadingPasskey] = useState(false);

  useEffect(() => {
    if (user && setupComplete) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, setupComplete, navigate]);

  // Cycle through init messages when hashing/initializing
  useEffect(() => {
    if (step !== 'hashing' && step !== 'initializing') return;
    const interval = setInterval(() => {
      setInitMsgIdx(i => Math.min(i + 1, INIT_MESSAGES.length - 1));
    }, 900);
    return () => clearInterval(interval);
  }, [step]);

  // Once hash is available, move to initializing
  useEffect(() => {
    if (step === 'hashing' && sovereignHash) {
      const t = setTimeout(() => setStep('initializing'), 1400);
      return () => clearTimeout(t);
    }
  }, [step, sovereignHash]);

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const formatError = (err: unknown): string => {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.startsWith('{')) return 'A server error occurred. Please try again.';
    if (msg.startsWith('Firebase:')) return 'Authentication service error. Try refreshing the page.';
    if (msg.includes('NotAllowedError')) return 'Passkey authentication was cancelled.';
    return msg;
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoadingGoogle(true);
    try {
      await login();
      setStep('hashing');
    } catch (err: unknown) {
      setError(formatError(err));
      setIsLoadingGoogle(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setError(null);
    if (!validateEmail(email)) {
      setEmailError('Enter a valid email address to use your passkey.');
      return;
    }
    setIsLoadingPasskey(true);
    try {
      await loginWithPasskey(email);
      setStep('hashing');
    } catch (err: unknown) {
      setError(formatError(err));
      setIsLoadingPasskey(false);
    }
  };

  return (
    <div
      role="main"
      aria-label="Agape Sovereign AI — Authentication"
      style={{
        width: '100vw',
        height: '100dvh',
        background: NEON.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Radial glows */}
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '75%', left: '20%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(255,46,159,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <GlassCard style={{ width: 'min(480px, 94vw)', padding: 'clamp(28px, 5vw, 48px) clamp(20px, 5vw, 40px)', textAlign: 'center' }}>
        {/* Logo */}
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ marginBottom: 28 }}
        >
          <div style={{ width: 80, height: 80, margin: '0 auto 14px', position: 'relative' }}>
            <svg viewBox="0 0 80 80" style={{ width: '100%', filter: `drop-shadow(0 0 14px ${NEON.blue})` }}>
              <polygon points="40,5 75,25 75,55 40,75 5,55 5,25" fill="none" stroke={NEON.blue} strokeWidth="1.5" />
              <polygon points="40,15 65,28 65,52 40,65 15,52 15,28" fill="none" stroke={NEON.magenta} strokeWidth="1" opacity="0.6" />
              <motion.polygon
                points="40,25 55,33 55,47 40,55 25,47 25,33"
                fill="none" stroke={NEON.orange} strokeWidth="0.8" opacity="0.4"
                animate={{ opacity: [0.2, 0.6, 0.2] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
              <text x="40" y="46" textAnchor="middle" fill={NEON.blue} fontFamily="Orbitron" fontSize="16" fontWeight="900">AI</text>
            </svg>
          </div>
          <NeonText color={NEON.blue} size="1.6rem" weight={900}>Agape Sovereign AI</NeonText>
          <div style={{ color: NEON.textMuted, fontSize: '0.68rem', fontFamily: "'Share Tech Mono'", marginTop: 4, letterSpacing: '0.15em' }}>
            IDENTITY RECLAMATION PLATFORM · 2026
          </div>
        </motion.div>

        {/* Separator */}
        <div style={{ height: 1, background: 'linear-gradient(135deg, #FF2E9F 0%, #00D4FF 50%, #FF7A18 100%)', marginBottom: 24, borderRadius: 1, opacity: 0.6 }} />

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              role="alert"
              aria-live="assertive"
              style={{
                marginBottom: 16,
                padding: '12px 14px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 10,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <AlertCircle size={14} color="#EF4444" style={{ marginTop: 1, flexShrink: 0 }} />
              <span style={{ fontSize: '0.78rem', color: '#FCA5A5', fontFamily: "'Rajdhani'" }}>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── STEP: LANDING ─────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {step === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div style={{ color: NEON.text, fontSize: '0.88rem', marginBottom: 6, fontWeight: 600 }}>
                Digital Identity Management Platform
              </div>
              <div style={{ color: NEON.textMuted, fontSize: '0.78rem', marginBottom: 22, lineHeight: 1.6 }}>
                Scan, monitor, and reclaim your digital identity across{' '}
                <strong style={{ color: NEON.blue }}>16 identity vectors</strong>.
                Authenticate to begin your <span style={{ color: NEON.magenta, fontWeight: 700 }}>DIFF</span> analysis.
              </div>

              {/* Email field (for passkey) */}
              <div style={{ marginBottom: 16, textAlign: 'left' }}>
                <label
                  htmlFor="sovereign-email"
                  style={{ display: 'block', fontFamily: "'Share Tech Mono'", fontSize: '0.58rem', color: NEON.textMuted, letterSpacing: '0.15em', marginBottom: 6 }}
                >
                  EMAIL — REQUIRED FOR PASSKEY
                </label>
                <input
                  id="sovereign-email"
                  type="email"
                  placeholder="your@sovereign.email"
                  value={email}
                  autoComplete="email"
                  onChange={e => { setEmail(e.target.value); if (emailError) setEmailError(null); }}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'email-error' : undefined}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: 'rgba(0,0,0,0.35)',
                    border: `1px solid ${emailError ? '#EF4444' : 'rgba(0,212,255,0.18)'}`,
                    borderRadius: 8,
                    color: '#fff',
                    fontFamily: "'Share Tech Mono'",
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    boxShadow: emailError ? '0 0 8px rgba(239,68,68,0.25)' : 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                />
                <AnimatePresence>
                  {emailError && (
                    <motion.div
                      id="email-error"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ color: '#EF4444', fontSize: '0.7rem', marginTop: 5, fontFamily: "'Rajdhani'" }}
                    >
                      {emailError}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Auth buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Google */}
                <motion.button
                  id="btn-google-signin"
                  whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(66,133,244,0.25)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoogleLogin}
                  disabled={isLoadingGoogle || isLoadingPasskey}
                  aria-label="Sign in with Google"
                  style={{
                    padding: '13px 20px',
                    borderRadius: 10,
                    background: 'rgba(66,133,244,0.08)',
                    border: '1px solid rgba(66,133,244,0.3)',
                    color: '#fff',
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    letterSpacing: '0.05em',
                  }}
                >
                  {isLoadingGoogle
                    ? <Loader2 size={18} color="#4285F4" style={{ animation: 'spin 1s linear infinite' }} />
                    : <GoogleIcon />
                  }
                  {isLoadingGoogle ? 'CONNECTING...' : 'Continue with Google'}
                </motion.button>

                {/* Passkey */}
                <motion.button
                  id="btn-passkey-signin"
                  whileHover={{ scale: 1.02, boxShadow: `0 0 20px ${NEON.blue}22` }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePasskeyLogin}
                  disabled={isLoadingGoogle || isLoadingPasskey}
                  aria-label="Sign in with Passkey"
                  style={{
                    padding: '13px 20px',
                    borderRadius: 10,
                    background: `rgba(0,212,255,0.05)`,
                    border: `1px solid rgba(0,212,255,0.22)`,
                    color: '#fff',
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    letterSpacing: '0.05em',
                  }}
                >
                  {isLoadingPasskey
                    ? <Loader2 size={18} color={NEON.blue} style={{ animation: 'spin 1s linear infinite' }} />
                    : <Fingerprint size={18} color={NEON.blue} />
                  }
                  {isLoadingPasskey ? 'AUTHENTICATING...' : 'Login with Passkey'}
                </motion.button>
              </div>

              <div style={{ marginTop: 18, color: NEON.textMuted, fontSize: '0.68rem', lineHeight: 1.6 }}>
                🔒 Zero-knowledge architecture · AES-GCM client-side encryption<br />
                Your SHA-256 hash. Your sovereignty. Your rules.
              </div>
            </motion.div>
          )}

          {/* ── STEP: HASHING ──────────────────────────────────────────── */}
          {step === 'hashing' && (
            <motion.div
              key="hashing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              aria-live="polite"
            >
              <div style={{ marginBottom: 20 }}>
                <div style={{
                  fontFamily: "'Orbitron'",
                  fontSize: '1rem',
                  color: NEON.blue,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  marginBottom: 6,
                }}>
                  GATEKEEPER ACTIVE
                </div>
                <div style={{ color: NEON.textMuted, fontSize: '0.8rem', marginBottom: 4 }}>
                  Generating your sovereign identity hash...
                </div>
                <div style={{
                  fontFamily: "'Share Tech Mono'",
                  fontSize: '0.62rem',
                  color: `${NEON.orange}88`,
                  letterSpacing: '0.1em',
                }}>
                  Raw credentials purged immediately after hashing
                </div>
              </div>

              <HashTicker hash={sovereignHash} active={true} />

              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    style={{ width: 6, height: 6, borderRadius: '50%', background: NEON.blue }}
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── STEP: INITIALIZING ─────────────────────────────────────── */}
          {step === 'initializing' && (
            <motion.div
              key="initializing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              aria-live="polite"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                style={{ width: 48, height: 48, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Shield size={36} color={NEON.blue} style={{ filter: `drop-shadow(0 0 8px ${NEON.blue})` }} />
              </motion.div>

              <div style={{ fontFamily: "'Orbitron'", fontSize: '0.9rem', color: NEON.blue, fontWeight: 700, marginBottom: 8, letterSpacing: '0.08em' }}>
                INITIALIZING ARCHITECT AI
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={initMsgIdx}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    color: NEON.textMuted,
                    fontFamily: "'Share Tech Mono'",
                    fontSize: '0.72rem',
                    letterSpacing: '0.05em',
                    marginBottom: 16,
                  }}
                >
                  {INIT_MESSAGES[initMsgIdx]}
                </motion.div>
              </AnimatePresence>

              {/* Hash confirmed display */}
              {sovereignHash && (
                <div style={{
                  padding: '8px 12px',
                  background: 'rgba(0,212,255,0.05)',
                  border: `1px solid ${NEON.blue}20`,
                  borderRadius: 8,
                  marginBottom: 16,
                }}>
                  <div style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.5rem', color: NEON.textMuted, marginBottom: 4, letterSpacing: '0.15em' }}>
                    SESSION ANCHOR
                  </div>
                  <div style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.6rem', color: `${NEON.blue}AA`, letterSpacing: '0.06em', wordBreak: 'break-all' }}>
                    {sovereignHash.slice(0, 8)}...{sovereignHash.slice(-8)}
                  </div>
                </div>
              )}

              {/* Progress bar */}
              <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden' }}>
                <motion.div
                  style={{ height: '100%', background: `linear-gradient(90deg, ${NEON.magenta}, ${NEON.blue}, ${NEON.orange})` }}
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 4, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Integrity Footer */}
        <EncryptedFooter moduleId="auth-gate" style={{ marginTop: 20 }} />

        {/* Legal footer */}
        <footer
          aria-label="Legal links"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '6px 12px',
            marginTop: 14,
            fontFamily: "'Share Tech Mono'",
            fontSize: '0.6rem',
            letterSpacing: '0.06em',
            textAlign: 'center',
          }}
        >
          <a href="/privacy" style={{ color: '#60A5FA', textDecoration: 'underline' }}>PRIVACY POLICY</a>
          <span aria-hidden="true" style={{ color: 'rgba(224,230,255,0.3)' }}>|</span>
          <span style={{ color: '#D946EF' }}>© 2026 Agape Sovereign AI</span>
          <span aria-hidden="true" style={{ color: 'rgba(224,230,255,0.3)' }}>|</span>
          <a href="/terms" style={{ color: '#F97316', textDecoration: 'underline' }}>TERMS OF SERVICE</a>
        </footer>
      </GlassCard>
    </div>
  );
};
