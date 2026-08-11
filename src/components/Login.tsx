import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, ArrowLeft, Shield, EyeOff } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { isPrivateBrowsing } from '../utils/incognitoDetector';
import { DemoBypassButton } from './auth/DemoBypassButton';

// ── Brand palette ──────────────────────────────────────────────
const C = {
  blue:    '#00D4FF',
  magenta: '#FF2E9F',
  orange:  '#FF7A18',
  green:   '#00FF87',
  muted:   'rgba(180,190,220,0.45)',
  surface: 'rgba(255,255,255,0.025)',
} as const;

// ── Real brand trust logos ────────────────────────────────────
const GoogleLogo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-label="Google" role="img">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const FirebaseLogo = () => (
  <svg width="12" height="14" viewBox="0 0 32 48" aria-label="Firebase" role="img" fill="none">
    <path d="M1.05 35.96L8.98 2.41a.96.96 0 011.87.08l4.67 17.35 2.01-3.8a.86.86 0 011.55 0l12.9 24.37L1.05 35.96z" fill="#FFA000"/>
    <path d="M18.08 22.48l-3.56-13.26a.96.96 0 00-1.87-.08L1.05 35.96l17.03-13.48z" fill="#F57C00"/>
    <path d="M32 40.18L25.05 3.07a.9.9 0 00-1.65-.28L1.05 35.96 18.1 46.18a3.27 3.27 0 003.2 0L32 40.18z" fill="#FFCA28"/>
  </svg>
);

const ShieldCheckIcon = ({ color }: { color: string }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);

const TRUST_LOGOS = [
  { label: 'Google OAuth 2.0', icon: <GoogleLogo /> },
  { label: 'Firebase', icon: <FirebaseLogo /> },
  { label: 'SHA-256', icon: <ShieldCheckIcon color="#00D4FF" /> },
  { label: 'AES-256-GCM', icon: <ShieldCheckIcon color="#00FF87" /> },
];

// ── Google logo (official spec) ────────────────────────────────
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// ── Animated shield hexagon ────────────────────────────────────
const ShieldPulse = () => (
  <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 24px' }}>
    {/* Outer ring pulse */}
    <motion.div
      animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0, 0.35] }}
      transition={{ duration: 2.4, repeat: Infinity }}
      style={{
        position: 'absolute', inset: -12,
        borderRadius: '50%',
        border: `1px solid ${C.blue}`,
        pointerEvents: 'none',
      }}
    />
    {/* Mid ring pulse */}
    <motion.div
      animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0, 0.5] }}
      transition={{ duration: 2.4, delay: 0.6, repeat: Infinity }}
      style={{
        position: 'absolute', inset: -4,
        borderRadius: '50%',
        border: `1px solid rgba(0,212,255,0.4)`,
        pointerEvents: 'none',
      }}
    />
    {/* Logo SVG */}
    <motion.svg
      viewBox="0 0 80 80"
      style={{ width: '100%', height: '100%', filter: `drop-shadow(0 0 14px ${C.blue})` }}
      animate={{ filter: [`drop-shadow(0 0 10px ${C.blue})`, `drop-shadow(0 0 20px ${C.blue})`, `drop-shadow(0 0 10px ${C.blue})`] }}
      transition={{ duration: 3, repeat: Infinity }}
    >
      <polygon points="40,4 76,24 76,56 40,76 4,56 4,24" fill="none" stroke={C.blue} strokeWidth="1.5" />
      <polygon points="40,16 66,29 66,51 40,64 14,51 14,29" fill="none" stroke={C.magenta} strokeWidth="1" opacity="0.7" />
      <polygon points="40,28 52,36 52,44 40,52 28,44 28,36" fill={C.orange} fillOpacity="0.85" stroke={C.orange} strokeWidth="0.5" />
    </motion.svg>
  </div>
);

// ── Multi-step loading copy ────────────────────────────────────
const LOADING_STEPS = [
  'Establishing secure channel…',
  'Verifying identity…',
  'Initializing Sovereign console…',
];

const LoadingSpinner = () => {
  const [step, setStep] = useState(0);

  React.useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(s + 1, LOADING_STEPS.length - 1)), 1200);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '20px 0', textAlign: 'center' }}>
      {/* Hex spinner */}
      <div style={{ position: 'relative', width: 56, height: 56, margin: '0 auto 24px' }}>
        <motion.svg viewBox="0 0 56 56" style={{ width: '100%', height: '100%' }}>
          <motion.polygon
            points="28,2 52,16 52,40 28,54 4,40 4,16"
            fill="none" stroke="rgba(0,212,255,0.15)" strokeWidth="1.5"
          />
          <motion.polygon
            points="28,2 52,16 52,40 28,54 4,40 4,16"
            fill="none" stroke={C.blue} strokeWidth="1.5"
            strokeDasharray="140"
            animate={{ strokeDashoffset: [140, 0, 140] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        </motion.svg>
        <Shield size={16} color={C.blue} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          style={{ color: C.blue, fontFamily: "'Share Tech Mono', monospace", fontSize: 12, letterSpacing: '0.12em' }}
        >
          {LOADING_STEPS[step]}
        </motion.div>
      </AnimatePresence>

      <div style={{ color: C.muted, fontSize: 11, marginTop: 8 }}>
        Secured with AES-256-GCM · Zero-knowledge session
      </div>
    </motion.div>
  );
};

// ── Main Login component ───────────────────────────────────────
export const Login = () => {
  const { login, loginWithPasskey, registerWithPasskey } = useAuth();

  const [step, setStep] = useState<'landing' | 'passkey-email' | 'passkey-auth' | 'creating'>('landing');
  const [passkeyAction, setPasskeyAction] = useState<'login' | 'register'>('login');
  const [scanning, setScanning] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isIncognito, setIsIncognito] = useState<boolean | null>(null); // null = detecting

  // Detect private browsing on mount
  useEffect(() => {
    isPrivateBrowsing().then(setIsIncognito).catch(() => setIsIncognito(false));
  }, []);

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const formatError = (err: unknown): string => {
    const msg = err instanceof Error ? err.message : String(err);
    const code = err && typeof err === 'object' && 'code' in err
      ? String((err as { code?: string }).code || '')
      : '';
    if (msg.startsWith('{')) return 'A server error occurred. Please try again.';
    if (code === 'auth/popup-closed-by-user' || msg.includes('popup was closed')) {
      return 'Sign-in popup was closed. Please try again.';
    }
    if (code === 'auth/unauthorized-domain' || msg.includes('not authorized')) {
      return 'This site is not on the Firebase authorized domain list.';
    }
    if (code === 'auth/operation-not-allowed') {
      return 'Google Sign-In is not enabled for this project.';
    }
    if (msg.startsWith('Firebase:')) {
      return msg.replace(/^Firebase:\s*/i, '').replace(/\s*\([^)]*\)\s*\.?$/, '').trim() ||
        'Authentication service error. Try refreshing the page.';
    }
    if (msg.includes('No passkey') || msg.includes('No account found')) return msg;
    return msg;
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setScanning(true);
    try {
      await login();
      // Redirect fallback navigates away; if we are still here, session is ready.
      setStep('creating');
    } catch (err: unknown) {
      setScanning(false);
      setAuthError(formatError(err));
    }
  };

  const handlePasskeyEmailNext = () => {
    setAuthError(null);
    if (!validateEmail(email)) {
      setEmailError('Enter a valid email address.');
      return;
    }
    setEmailError(null);
    setStep('passkey-auth');
  };

  const handlePasskeyLogin = async () => {
    setAuthError(null);
    setScanning(true);
    try {
      if (passkeyAction === 'register') {
        await registerWithPasskey(email);
      } else {
        await loginWithPasskey(email);
      }
      setStep('creating');
    } catch (err: unknown) {
      setScanning(false);
      const msg = err instanceof Error ? err.message : 'Passkey action failed.';
      if (msg.includes('cancelled') || msg.includes('NotAllowedError')) {
        setAuthError('Passkey prompt was dismissed. Try again or use Google Sign-In.');
      } else {
        setAuthError(formatError(err));
      }
      setStep('passkey-auth');
    }
  };

  // Gradient border wrapper
  const gradientBorder: React.CSSProperties = {
    position: 'relative',
    padding: 1.5,
    borderRadius: 22,
    background: 'linear-gradient(135deg, rgba(255,46,159,0.5) 0%, rgba(0,212,255,0.5) 50%, rgba(255,107,0,0.5) 100%)',
    boxShadow: '0 0 40px rgba(0,212,255,0.08), 0 32px 80px rgba(0,0,0,0.6)',
  };

  const cardInner: React.CSSProperties = {
    background: 'rgba(6,12,26,0.92)',
    backdropFilter: 'blur(24px)',
    borderRadius: 21,
    padding: '44px 40px 36px',
    textAlign: 'center',
    minWidth: 360,
    maxWidth: 420,
    width: '100%',
  };

  const btnBase: React.CSSProperties = {
    width: '100%', padding: '14px 20px',
    borderRadius: 10, color: '#fff',
    fontFamily: "'Inter', sans-serif",
    fontSize: 14, fontWeight: 600,
    letterSpacing: '0.04em',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
    cursor: 'pointer', transition: 'all 0.2s',
    border: 'none',
  };

  return (
    <div style={{
      width: '100vw', minHeight: '100vh',
      background: '#060C1A',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      padding: '32px 16px',
    }}>
      {/* Backgrounds */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />
      <div style={{ position: 'fixed', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 800, background: 'radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(255,46,159,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* ── Back link ── */}
      <a
        href="/"
        style={{
          position: 'absolute', top: 24, left: 28,
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 11, color: 'rgba(255,255,255,0.35)',
          textDecoration: 'none', letterSpacing: '0.12em',
          fontFamily: 'monospace', transition: 'color 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
        id="login-back-link"
      >
        <ArrowLeft size={12} /> SOVEREIGN.NYC
      </a>

      {/* ── Secure status indicator ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          marginBottom: 24, fontSize: 10, letterSpacing: '0.16em',
          color: 'rgba(0,255,135,0.7)', fontFamily: 'monospace',
          border: '1px solid rgba(0,255,135,0.15)',
          borderRadius: 100, padding: '5px 14px',
          background: 'rgba(0,255,135,0.04)',
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ width: 5, height: 5, borderRadius: '50%', background: '#00FF87' }}
        />
        SECURE CONNECTION ESTABLISHED
      </motion.div>

      {/* ── Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={gradientBorder}
      >
        <div style={cardInner}>

          {/* ── Logo block ── */}
          <ShieldPulse />

          <div style={{ fontWeight: 900, fontSize: '1.15rem', letterSpacing: '0.1em', color: '#fff', marginBottom: 4 }}>
            Agape Sovereign AI
          </div>
          <div style={{ color: C.blue, fontSize: '0.6rem', fontFamily: "'Share Tech Mono', monospace", letterSpacing: '0.2em', opacity: 0.8, marginBottom: 4 }}>
            DIGITAL IDENTITY DEFENSE
          </div>
          {/* OAuth badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 8, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 100, padding: '3px 10px', marginBottom: 28,
            fontFamily: 'monospace',
          }}>
            FIDO2 · GOOGLE OAUTH 2.0 VERIFIED
          </div>

          {/* Gradient separator */}
          <div style={{
            height: 1, marginBottom: 28, borderRadius: 1,
            background: 'linear-gradient(135deg, rgba(255,46,159,0.6) 0%, rgba(0,212,255,0.6) 50%, rgba(255,107,0,0.6) 100%)',
            opacity: 0.5,
          }} />

          {/* ── Incognito / Private mode banner ── */}
          <AnimatePresence>
            {isIncognito && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  marginBottom: 18,
                  padding: '12px 14px',
                  background: 'rgba(255,193,7,0.06)',
                  border: '1px solid rgba(255,193,7,0.25)',
                  borderRadius: 10, overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <EyeOff size={14} color="#FFC107" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#FFC107', letterSpacing: '0.1em', fontFamily: 'monospace', marginBottom: 4 }}>
                      PRIVATE BROWSING DETECTED
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,193,7,0.7)', lineHeight: 1.55 }}>
                      Incognito bypass active — signing in with a popup window instead of a redirect. Your session will persist for this tab only.
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Error ── */}
          <AnimatePresence>
            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  marginBottom: 18, padding: '10px 14px',
                  background: 'rgba(255,107,0,0.07)',
                  border: '1px solid rgba(255,107,0,0.3)',
                  borderRadius: 10, color: '#ffaa66',
                  fontSize: 12, fontFamily: "'Share Tech Mono', monospace",
                  textAlign: 'left', overflow: 'hidden',
                }}
              >
                ⚠ {authError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Loading (shared between google + passkey) ── */}
          {scanning && <LoadingSpinner />}

          {/* ── Landing step ── */}
          <AnimatePresence mode="wait">
            {step === 'landing' && !scanning && (
              <motion.div
                key="landing"
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.28 }}
              >
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>
                  Digital Identity Federated Footprint
                </div>
                <div style={{ color: C.muted, fontSize: 12, marginBottom: 24, lineHeight: 1.65 }}>
                  Authenticate to begin your{' '}
                  <span style={{ color: C.magenta, fontWeight: 700 }}>DIFF</span>{' '}
                  analysis. Your sovereignty begins here.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* PRIMARY — Google */}
                  <motion.button
                    whileHover={{ scale: 1.015, boxShadow: '0 6px 22px rgba(66,133,244,0.5)' }}
                    whileTap={{ scale: 0.975 }}
                    id="login-google-btn"
                    onClick={handleGoogleLogin}
                    style={{
                      ...btnBase,
                      backgroundColor: '#4285F4',
                      padding: '2px 20px 2px 2px',
                      boxShadow: '0 4px 14px rgba(66,133,244,0.35)',
                      fontFamily: 'Roboto, Arial, sans-serif',
                      fontWeight: 500,
                      fontSize: 15,
                      justifyContent: 'flex-start',
                      gap: 0,
                    }}
                    aria-label="Sign in with Google"
                  >
                    <div style={{
                      background: '#fff', borderRadius: 4, padding: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginRight: 14, flexShrink: 0,
                    }}>
                      <GoogleIcon />
                    </div>
                    <span style={{ flex: 1, textAlign: 'left', letterSpacing: '0.2px' }}>
                      Sign in with Google
                    </span>
                  </motion.button>

                  {/* DIVIDER */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.18)', fontSize: 10, letterSpacing: '0.1em', fontFamily: 'monospace' }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                    OR
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                  </div>

                  {/* SECONDARY — Passkey actions */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <motion.button
                      whileHover={{ scale: 1.01, borderColor: `rgba(0,212,255,0.45)`, background: 'rgba(0,212,255,0.07)' }}
                      whileTap={{ scale: 0.975 }}
                      id="login-passkey-btn"
                      onClick={() => { setPasskeyAction('login'); setStep('passkey-email'); }}
                      style={{
                        ...btnBase,
                        background: 'rgba(0,212,255,0.04)',
                        border: `1px solid rgba(0,212,255,0.2)`,
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: 12,
                        padding: '12px 10px',
                      }}
                      aria-label="Sign in with Passkey"
                    >
                      <Fingerprint size={16} color={C.blue} />
                      Sign in Passkey
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.01, borderColor: `rgba(255,46,159,0.45)`, background: 'rgba(255,46,159,0.07)' }}
                      whileTap={{ scale: 0.975 }}
                      id="register-passkey-btn"
                      onClick={() => { setPasskeyAction('register'); setStep('passkey-email'); }}
                      style={{
                        ...btnBase,
                        background: 'rgba(255,46,159,0.04)',
                        border: `1px solid rgba(255,46,159,0.25)`,
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: 12,
                        padding: '12px 10px',
                      }}
                      aria-label="Register Passkey"
                    >
                      <Fingerprint size={16} color={C.magenta} />
                      Register Passkey
                    </motion.button>
                  </div>
                </div>

                {/* Trust logos — real brand marks */}
                <div style={{
                  display: 'flex', justifyContent: 'center', gap: 14,
                  marginTop: 24, flexWrap: 'wrap',
                }}>
                  {TRUST_LOGOS.map(b => (
                    <div key={b.label} title={b.label} style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      fontSize: 9.5, color: 'rgba(255,255,255,0.3)',
                      letterSpacing: '0.06em', fontFamily: 'monospace',
                    }}>
                      {b.icon} {b.label}
                    </div>
                  ))}
                </div>

                {/* Demo bypass — only visible in demo mode */}
                <DemoBypassButton />

                {/* OAuth-required links */}
                <div style={{
                  marginTop: 20, paddingTop: 16,
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex', justifyContent: 'center', gap: 20,
                }}>
                  <a href="/privacy" rel="privacy-policy" id="login-privacy-link" style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textDecoration: 'none', letterSpacing: '0.1em', fontFamily: 'monospace', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}>
                    Privacy Policy
                  </a>
                  <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: 10 }}>·</span>
                  <a href="/terms" rel="terms-of-service" id="login-terms-link" style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textDecoration: 'none', letterSpacing: '0.1em', fontFamily: 'monospace', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}>
                    Terms of Service
                  </a>
                </div>
              </motion.div>
            )}

            {/* ── Passkey email entry ── */}
            {step === 'passkey-email' && !scanning && (
              <motion.div
                key="passkey-email"
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.28 }}
              >
                <div style={{ color: passkeyAction === 'register' ? C.magenta : C.blue, fontFamily: "'Share Tech Mono', monospace", fontSize: 11, letterSpacing: '0.15em', marginBottom: 8 }}>
                  {passkeyAction === 'register' ? 'PASSKEY REGISTRATION' : 'PASSKEY AUTHENTICATION'}
                </div>
                <div style={{ color: C.muted, fontSize: 12, marginBottom: 20, lineHeight: 1.65 }}>
                  {passkeyAction === 'register'
                    ? 'Enter your email to bind a new Passkey to your hardware device.'
                    : 'Enter the email linked to your passkey. Your device will handle authentication.'}
                </div>

                <div style={{ textAlign: 'left', marginBottom: 14 }}>
                  <input
                    type="email"
                    id="passkey-email-input"
                    placeholder="sovereign@email.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); if (emailError) setEmailError(null); }}
                    autoFocus
                    style={{
                      width: '100%', padding: '12px 14px',
                      background: 'rgba(0,0,0,0.3)',
                      border: `1px solid ${emailError ? '#ef4444' : 'rgba(0,212,255,0.18)'}`,
                      borderRadius: 10, color: '#fff',
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: 13, outline: 'none',
                      boxSizing: 'border-box',
                      caretColor: C.blue,
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => { if (!emailError) e.currentTarget.style.borderColor = `rgba(0,212,255,0.45)`; }}
                    onBlur={e => { if (!emailError) e.currentTarget.style.borderColor = 'rgba(0,212,255,0.18)'; }}
                    onKeyDown={e => e.key === 'Enter' && handlePasskeyEmailNext()}
                    aria-label="Email for passkey"
                  />
                  {emailError && (
                    <div style={{ color: '#ef4444', fontSize: 11, marginTop: 5, fontFamily: "'Inter', sans-serif" }}>
                      {emailError}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <motion.button
                    whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.975 }}
                    id="passkey-continue-btn"
                    onClick={handlePasskeyEmailNext}
                    style={{ ...btnBase, background: passkeyAction === 'register' ? `rgba(255,46,159,0.1)` : `rgba(0,212,255,0.08)`, border: `1px solid ${passkeyAction === 'register' ? 'rgba(255,46,159,0.35)' : 'rgba(0,212,255,0.3)'}`, color: '#fff' }}
                  >
                    <Fingerprint size={18} color={passkeyAction === 'register' ? C.magenta : C.blue} />
                    {passkeyAction === 'register' ? 'Register Passkey' : 'Continue with Passkey'}
                  </motion.button>
                  <button
                    onClick={() => { setStep('landing'); setEmailError(null); setAuthError(null); }}
                    id="passkey-back-btn"
                    style={{ background: 'none', border: 'none', color: C.muted, fontSize: 11, cursor: 'pointer', fontFamily: 'monospace', letterSpacing: '0.1em', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                  >
                    <ArrowLeft size={10} /> Back to sign-in options
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Passkey authentication prompt ── */}
            {step === 'passkey-auth' && !scanning && (
              <motion.div
                key="passkey-auth"
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.28 }}
              >
                <motion.div
                  animate={{ rotate: [0, -3, 3, 0] }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  style={{ fontSize: '2.8rem', marginBottom: 16 }}
                >
                  🔑
                </motion.div>
                <div style={{ color: passkeyAction === 'register' ? C.magenta : C.orange, fontFamily: "'Share Tech Mono', monospace", fontSize: 11, letterSpacing: '0.15em', marginBottom: 10 }}>
                  {passkeyAction === 'register' ? 'CREATE HARDWARE PASSKEY' : 'BIND UNIVERSAL PASSKEY'}
                </div>
                <div style={{ color: C.muted, fontSize: 12, marginBottom: 8, lineHeight: 1.65 }}>
                  {email}
                </div>
                <div style={{ color: C.muted, fontSize: 12, marginBottom: 24, lineHeight: 1.65 }}>
                  Your passkey is device-bound to this session.<br />No password. No breach vector. Pure sovereignty.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <motion.button
                    whileHover={{ scale: 1.015, borderColor: `${passkeyAction === 'register' ? C.magenta : C.orange}80` }}
                    whileTap={{ scale: 0.975 }}
                    id="passkey-auth-btn"
                    onClick={handlePasskeyLogin}
                    style={{ ...btnBase, background: passkeyAction === 'register' ? `rgba(255,46,159,0.08)` : `rgba(255,122,24,0.07)`, border: `1px solid ${passkeyAction === 'register' ? 'rgba(255,46,159,0.35)' : 'rgba(255,122,24,0.3)'}`, color: passkeyAction === 'register' ? C.magenta : C.orange }}
                  >
                    <Fingerprint size={18} color={passkeyAction === 'register' ? C.magenta : C.orange} />
                    {passkeyAction === 'register' ? 'Create & Register Passkey' : 'Authenticate with Passkey'}
                  </motion.button>
                  <button
                    onClick={() => { setStep('passkey-email'); setAuthError(null); }}
                    id="passkey-auth-back-btn"
                    style={{ background: 'none', border: 'none', color: C.muted, fontSize: 11, cursor: 'pointer', fontFamily: 'monospace', letterSpacing: '0.1em', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                  >
                    <ArrowLeft size={10} /> Change email
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Initializing ── */}
            {step === 'creating' && (
              <motion.div key="creating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '16px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
                      style={{ width: 8, height: 8, borderRadius: '50%', background: C.blue }}
                    />
                  ))}
                </div>
                <div style={{ color: C.blue, fontFamily: "'Share Tech Mono', monospace", fontSize: 11, letterSpacing: '0.15em' }}>
                  INITIALIZING ARCHITECT AI…
                </div>
                <div style={{ color: C.muted, fontSize: 11, marginTop: 8 }}>
                  Preparing your DIFF sovereignty console
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Bottom note */}
      {step === 'landing' && !scanning && (
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          style={{ marginTop: 24, fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', letterSpacing: '0.06em', maxWidth: 340 }}
        >
          By signing in you agree to our{' '}
          <a href="/terms" rel="terms-of-service" style={{ color: 'rgba(0,212,255,0.5)', textDecoration: 'none' }}>Terms</a>
          {' '}and{' '}
          <a href="/privacy" rel="privacy-policy" style={{ color: 'rgba(0,212,255,0.5)', textDecoration: 'none' }}>Privacy Policy</a>.
          Your data is encrypted client-side — we never see it.
        </motion.p>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 100px rgba(0,0,0,0.3) inset;
          -webkit-text-fill-color: #fff;
          caret-color: #00D4FF;
        }
      `}</style>
    </div>
  );
};
