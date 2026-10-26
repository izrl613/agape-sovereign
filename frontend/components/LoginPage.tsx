import React, { useEffect, useState } from 'react';
import {
  completeGoogleRedirect,
  loginAnonymously,
  loginWithDiscoverablePasskey,
  loginWithGoogle,
  loginWithPasskey,
  registerPasskey,
} from '../firebase';
import { NEON, FONTS, GRADIENT } from '../theme';

type Step = 'landing' | 'passkey-email' | 'passkey-register';
type Method = 'google' | 'passkey' | 'register' | 'anonymous' | null;

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

function formatAuthError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const code = err && typeof err === 'object' && 'code' in err ? String((err as { code?: string }).code || '') : '';
  if (code === 'auth/popup-closed-by-user' || msg.includes('popup was closed')) return 'Sign-in popup was closed. Try again.';
  if (code === 'auth/unauthorized-domain') return 'This site is not on the Firebase authorized domain list.';
  if (code === 'auth/operation-not-allowed') return 'That sign-in method is not enabled for this project.';
  if (msg.includes('No passkey') || msg.includes('No account found') || msg.includes('already has a passkey')) return msg;
  if (msg.startsWith('Firebase:')) {
    return msg.replace(/^Firebase:\s*/i, '').replace(/\s*\([^)]*\)\s*\.?$/, '').trim();
  }
  return msg || 'Authentication failed. Please try again.';
}

export const LoginPage: React.FC<{ onAuthenticated: () => void }> = ({ onAuthenticated }) => {
  const [step, setStep] = useState<Step>('landing');
  const [method, setMethod] = useState<Method>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    completeGoogleRedirect()
      .then((user) => {
        if (user) onAuthenticated();
      })
      .catch((err) => setError(formatAuthError(err)));
  }, [onAuthenticated]);

  const run = async (fn: () => Promise<unknown>, nextMethod: Method) => {
    setError(null);
    setBusy(true);
    setMethod(nextMethod);
    try {
      await fn();
      onAuthenticated();
    } catch (err) {
      setError(formatAuthError(err));
      setBusy(false);
      setMethod(null);
    }
  };

  const handleGoogle = () => run(() => loginWithGoogle(false), 'google');
  const handleAnon = () => run(() => loginAnonymously(), 'anonymous');
  const handleDiscoverable = () => run(() => loginWithDiscoverablePasskey(), 'passkey');

  const handlePasskey = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter the email bound to your passkey.');
      return;
    }
    run(() => loginWithPasskey(email), 'passkey');
  };

  const handleRegister = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter an email to register this device.');
      return;
    }
    run(() => registerPasskey(email), 'register');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#060C1A',
        color: NEON.text,
        fontFamily: FONTS.rajdhani,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            'linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <a
        href="/"
        style={{
          position: 'absolute',
          top: 24,
          left: 28,
          color: 'rgba(255,255,255,0.4)',
          textDecoration: 'none',
          fontFamily: FONTS.mono,
          fontSize: 11,
          letterSpacing: '0.14em',
        }}
      >
        ← AGAPE SOVEREIGN
      </a>

      <div
        style={{
          width: '100%',
          maxWidth: 440,
          padding: 2,
          borderRadius: 22,
          background: GRADIENT,
          boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ background: 'rgba(6,12,26,0.96)', borderRadius: 20, padding: '40px 32px 28px', textAlign: 'center' }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: NEON.orange, letterSpacing: '0.22em', marginBottom: 10 }}>
            SOVEREIGN.NYC / LOGIN
          </div>
          <div
            style={{
              fontFamily: FONTS.orbitron,
              fontSize: '1.45rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              background: GRADIENT,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 8,
            }}
          >
            AUTHENTICATE
          </div>
          <p style={{ color: NEON.textMuted, fontSize: 14, lineHeight: 1.5, marginBottom: 22 }}>
            Three Firebase Auth paths: Google OAuth 2.0, FIDO2 passkeys on any device, or an anonymous guest session. Privacy Policy and Terms stay one tap away for OAuth verification.
          </p>

          {error && (
            <div
              role="alert"
              style={{
                marginBottom: 16,
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid rgba(255,122,24,0.35)',
                background: 'rgba(255,122,24,0.08)',
                color: '#ffaa66',
                fontFamily: FONTS.mono,
                fontSize: 12,
                textAlign: 'left',
              }}
            >
              ⚠ {error}
            </div>
          )}

          {busy && (
            <div style={{ color: NEON.blue, fontFamily: FONTS.mono, fontSize: 12, letterSpacing: '0.12em', marginBottom: 16 }}>
              {method === 'google' && 'Opening Google…'}
              {method === 'passkey' && 'Waiting for authenticator…'}
              {method === 'register' && 'Registering this device…'}
              {method === 'anonymous' && 'Opening Firebase guest session…'}
              {!method && 'Securing channel…'}
            </div>
          )}

          {step === 'landing' && !busy && (
            <div style={{ display: 'grid', gap: 12 }}>
              <button type="button" onClick={() => { setError(null); setStep('passkey-email'); }} style={rowStyle('rgba(0,212,255,0.08)', 'rgba(0,212,255,0.3)')} aria-label="Sign in with Passkey">
                <span style={iconWrap('#00D4FF')}>🔑</span>
                <span style={{ flex: 1, textAlign: 'left' }}>
                  <strong style={{ display: 'block', fontSize: 14 }}>Passkey / WebAuthn</strong>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>Sign in · any registered device</span>
                </span>
              </button>

              <button type="button" onClick={() => { setError(null); setEmail(''); setStep('passkey-register'); }} id="register-passkey-btn" style={rowStyle('rgba(0,255,135,0.08)', 'rgba(0,255,135,0.3)')} aria-label="Register a passkey">
                <span style={iconWrap('#00FF87')}>🧬</span>
                <span style={{ flex: 1, textAlign: 'left' }}>
                  <strong style={{ display: 'block', fontSize: 14 }}>Register a passkey</strong>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>New account · Face ID, Touch ID, security key</span>
                </span>
              </button>

              <button type="button" onClick={handleGoogle} id="google-signin-btn" style={rowStyle('rgba(66,133,244,0.1)', 'rgba(66,133,244,0.4)')} aria-label="Sign in with Google">
                <span style={{ ...iconWrap('#4285F4'), background: '#fff' }}>
                  <GoogleIcon />
                </span>
                <span style={{ flex: 1, textAlign: 'left' }}>
                  <strong style={{ display: 'block', fontSize: 14 }}>Sign in with Google</strong>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>OAuth 2.0 · Fast, secure access</span>
                </span>
              </button>

              <button type="button" onClick={handleAnon} id="anon-bypass-btn" style={rowStyle('rgba(255,122,24,0.08)', 'rgba(255,122,24,0.35)')} aria-label="Continue anonymously">
                <span style={iconWrap(NEON.orange)}>🚀</span>
                <span style={{ flex: 1, textAlign: 'left' }}>
                  <strong style={{ display: 'block', fontSize: 14 }}>ANON Bypass</strong>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>Firebase guest session · link Google later</span>
                </span>
              </button>
            </div>
          )}

          {step === 'passkey-email' && !busy && (
            <div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: NEON.blue, letterSpacing: '0.14em', marginBottom: 8 }}>PASSKEY SIGN-IN</div>
              <input
                type="email"
                autoFocus
                value={email}
                placeholder="you@sovereign.nyc"
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasskey()}
                aria-label="Email for passkey"
                style={inputStyle}
              />
              <button type="button" onClick={handlePasskey} style={{ ...rowStyle('rgba(0,212,255,0.12)', 'rgba(0,212,255,0.4)'), justifyContent: 'center' }}>
                Continue with passkey
              </button>
              <button type="button" onClick={handleDiscoverable} style={{ ...rowStyle('rgba(0,255,135,0.08)', 'rgba(0,255,135,0.25)'), justifyContent: 'center', marginTop: 10 }}>
                Use passkey on this device
              </button>
              <button type="button" onClick={() => { setStep('landing'); setError(null); }} style={backStyle}>
                ← Back to sign-in options
              </button>
            </div>
          )}

          {step === 'passkey-register' && !busy && (
            <div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: '#00FF87', letterSpacing: '0.14em', marginBottom: 8 }}>REGISTER THIS DEVICE</div>
              <p style={{ color: NEON.textMuted, fontSize: 13, lineHeight: 1.5, marginBottom: 14, textAlign: 'left' }}>
                Creates a Firebase Auth user and binds a FIDO2 credential. Platform biometrics and roaming security keys are both allowed.
              </p>
              <input
                type="email"
                autoFocus
                value={email}
                placeholder="you@sovereign.nyc"
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                aria-label="Email for passkey registration"
                style={inputStyle}
              />
              <button type="button" onClick={handleRegister} id="register-passkey-submit" style={{ ...rowStyle('rgba(0,255,135,0.12)', 'rgba(0,255,135,0.4)'), justifyContent: 'center' }}>
                Register passkey on this device
              </button>
              <button type="button" onClick={() => { setStep('landing'); setError(null); }} style={backStyle}>
                ← Back to sign-in options
              </button>
            </div>
          )}

          <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'center', gap: 18 }}>
            <a href="/privacy" rel="privacy-policy" id="login-privacy-link" style={legalLink}>
              Privacy Policy
            </a>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
            <a href="/terms" rel="terms-of-service" id="login-terms-link" style={legalLink}>
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const legalLink: React.CSSProperties = {
  fontSize: 10,
  color: 'rgba(255,255,255,0.35)',
  textDecoration: 'none',
  letterSpacing: '0.1em',
  fontFamily: "'Share Tech Mono', monospace",
};

const backStyle: React.CSSProperties = {
  marginTop: 12,
  background: 'none',
  border: 'none',
  color: NEON.textMuted,
  fontFamily: FONTS.mono,
  fontSize: 11,
  cursor: 'pointer',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid rgba(0,212,255,0.25)',
  background: 'rgba(0,0,0,0.35)',
  color: '#fff',
  fontFamily: FONTS.mono,
  fontSize: 13,
  marginBottom: 12,
  outline: 'none',
};

function rowStyle(bg: string, border: string): React.CSSProperties {
  return {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 16px',
    borderRadius: 14,
    border: `1px solid ${border}`,
    background: bg,
    color: '#fff',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
  };
}

function iconWrap(color: string): React.CSSProperties {
  return {
    width: 40,
    height: 40,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${color}55`,
    flexShrink: 0,
  };
}
