/**
 * AuthBypassPanel
 * ───────────────
 * Recovery / bypass panel shown inline in Login.tsx whenever Google Sign-In
 * or Passkey authentication fails.  Offers:
 *  • Switch to the other auth method
 *  • Magic link (email sign-in link) via /api/auth/magic-link
 *  • Demo Mode escape hatch
 *  • Contact support link
 *
 * Never blocks the primary auth flow — appears below the error message.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Fingerprint, ChevronRight, Zap } from 'lucide-react';
import {
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendSignInLinkToEmail,
} from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../AuthContext';
import { useNavigate } from 'react-router-dom';

// ── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
  blue:    '#00D4FF',
  magenta: '#FF2E9F',
  orange:  '#FF7A18',
  green:   '#00FF87',
  muted:   'rgba(180,190,220,0.45)',
  danger:  '#fca5a5',
} as const;

export type FailedMethod = 'google' | 'passkey' | null;

interface AuthBypassPanelProps {
  /** Which method just failed so we can offer the opposite */
  failedMethod: FailedMethod;
  /** Pre-filled email (from passkey email step) */
  email?: string;
  /** Called when user chooses to switch to Google */
  onSwitchToGoogle?: () => void;
  /** Called when user chooses to switch to Passkey */
  onSwitchToPasskey?: () => void;
}

const EMAIL_STORAGE_KEY = 'sovereign_magic_link_email';

// Check for pending magic link sign-in on mount
export function useMagicLinkRedirect() {
  const navigate = useNavigate();

  React.useEffect(() => {
    const href = window.location.href;
    if (!isSignInWithEmailLink(auth, href)) return;

    const storedEmail = localStorage.getItem(EMAIL_STORAGE_KEY) ||
      sessionStorage.getItem(EMAIL_STORAGE_KEY);
    if (!storedEmail) return; // email needed — handled in MagicLinkConfirm

    signInWithEmailLink(auth, storedEmail, href)
      .then(() => {
        localStorage.removeItem(EMAIL_STORAGE_KEY);
        sessionStorage.removeItem(EMAIL_STORAGE_KEY);
        navigate('/dashboard', { replace: true });
      })
      .catch((err) => {
        console.error('[MAGIC_LINK] Sign-in failed:', err);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// ─────────────────────────────────────────────────────────────────────────────

export const AuthBypassPanel: React.FC<AuthBypassPanelProps> = ({
  failedMethod,
  email = '',
  onSwitchToGoogle,
  onSwitchToPasskey,
}) => {
  const { setDemoUser } = useAuth();
  const navigate = useNavigate();

  const [magicState, setMagicState] = useState<'idle' | 'input' | 'loading' | 'sent' | 'error'>('idle');
  const [magicEmail, setMagicEmail] = useState(email);
  const [magicError, setMagicError] = useState('');

  const handleDemoMode = () => {
    setDemoUser();
    navigate('/dashboard', { replace: true });
  };

  const handleSendMagicLink = async () => {
    const normalized = magicEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setMagicError('Enter a valid email address.');
      return;
    }
    setMagicState('loading');
    setMagicError('');

    try {
      // Try the server-side magic link endpoint first (tracks in Firestore)
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalized }),
      });

      if (res.ok) {
        // Server sent it — just store email for redirect handler
        localStorage.setItem(EMAIL_STORAGE_KEY, normalized);
        setMagicState('sent');
        return;
      }

      // Fallback: use Firebase client SDK sendSignInLinkToEmail
      await sendSignInLinkToEmail(auth, normalized, {
        url: `${window.location.origin}/login?source=magic`,
        handleCodeInApp: true,
      });
      localStorage.setItem(EMAIL_STORAGE_KEY, normalized);
      setMagicState('sent');
    } catch (err) {
      console.error('[MAGIC_LINK] Send failed:', err);
      setMagicState('error');
      setMagicError(
        err instanceof Error ? err.message : 'Failed to send magic link. Try again.'
      );
    }
  };

  const btnBase: React.CSSProperties = {
    width: '100%',
    padding: '11px 16px',
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif",
    letterSpacing: '0.04em',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: 4, height: 0 }}
      transition={{ duration: 0.3 }}
      style={{ overflow: 'hidden' }}
    >
      <div style={{
        marginTop: 16,
        padding: '16px 18px',
        background: 'rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        textAlign: 'left',
      }}>
        {/* Header */}
        <div style={{
          fontSize: 10,
          letterSpacing: '0.16em',
          color: C.orange,
          fontFamily: 'monospace',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 7,
        }}>
          <Zap size={10} color={C.orange} />
          AUTH BYPASS OPTIONS
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Switch method */}
          {failedMethod === 'passkey' && onSwitchToGoogle && (
            <motion.button
              id="bypass-switch-google"
              whileHover={{ scale: 1.01, background: 'rgba(66,133,244,0.14)' }}
              whileTap={{ scale: 0.98 }}
              onClick={onSwitchToGoogle}
              style={{
                ...btnBase,
                background: 'rgba(66,133,244,0.07)',
                border: '1px solid rgba(66,133,244,0.25)',
                color: '#7ab4ff',
                justifyContent: 'space-between',
              }}
              aria-label="Switch to Google Sign-In"
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google instead
              </span>
              <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
            </motion.button>
          )}

          {failedMethod === 'google' && onSwitchToPasskey && (
            <motion.button
              id="bypass-switch-passkey"
              whileHover={{ scale: 1.01, background: 'rgba(0,212,255,0.1)' }}
              whileTap={{ scale: 0.98 }}
              onClick={onSwitchToPasskey}
              style={{
                ...btnBase,
                background: 'rgba(0,212,255,0.05)',
                border: `1px solid rgba(0,212,255,0.2)`,
                color: C.blue,
                justifyContent: 'space-between',
              }}
              aria-label="Switch to Passkey"
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Fingerprint size={14} color={C.blue} />
                Try Passkey instead
              </span>
              <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
            </motion.button>
          )}

          {/* Magic Link */}
          <div>
            <AnimatePresence mode="wait">
              {magicState === 'sent' ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(0,255,135,0.06)',
                    border: `1px solid rgba(0,255,135,0.2)`,
                    borderRadius: 10,
                    fontSize: 11,
                    color: C.green,
                    fontFamily: 'monospace',
                    letterSpacing: '0.05em',
                  }}
                >
                  ✓ Magic link sent to <strong>{magicEmail}</strong> — check your inbox and click the link to sign in.
                </motion.div>
              ) : magicState === 'input' || magicState === 'loading' || magicState === 'error' ? (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      id="bypass-magic-email"
                      type="email"
                      placeholder="your@email.com"
                      value={magicEmail}
                      onChange={e => { setMagicEmail(e.target.value); setMagicError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleSendMagicLink()}
                      disabled={magicState === 'loading'}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        background: 'rgba(0,0,0,0.3)',
                        border: `1px solid ${magicError ? '#ef4444' : 'rgba(255,255,255,0.12)'}`,
                        borderRadius: 9,
                        color: '#fff',
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: 12,
                        outline: 'none',
                        caretColor: C.blue,
                      }}
                      aria-label="Email for magic link"
                    />
                    <motion.button
                      id="bypass-magic-send"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleSendMagicLink}
                      disabled={magicState === 'loading'}
                      style={{
                        ...btnBase,
                        width: 'auto',
                        padding: '10px 16px',
                        background: `rgba(0,212,255,0.1)`,
                        border: `1px solid rgba(0,212,255,0.3)`,
                        color: C.blue,
                        opacity: magicState === 'loading' ? 0.6 : 1,
                        cursor: magicState === 'loading' ? 'wait' : 'pointer',
                      }}
                      aria-label="Send magic link"
                    >
                      <Mail size={13} />
                      {magicState === 'loading' ? '…' : 'Send'}
                    </motion.button>
                  </div>
                  {magicError && (
                    <div style={{ fontSize: 10, color: C.danger, marginTop: 5, fontFamily: 'monospace' }}>
                      ⚠ {magicError}
                    </div>
                  )}
                  <button
                    onClick={() => setMagicState('idle')}
                    style={{
                      background: 'none', border: 'none',
                      color: 'rgba(255,255,255,0.2)', fontSize: 10,
                      cursor: 'pointer', marginTop: 6, fontFamily: 'monospace',
                    }}
                  >
                    ✕ Cancel
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="idle"
                  id="bypass-magic-link-btn"
                  whileHover={{ scale: 1.01, background: 'rgba(255,255,255,0.05)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setMagicEmail(email); setMagicState('input'); }}
                  style={{
                    ...btnBase,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    color: 'rgba(255,255,255,0.55)',
                    justifyContent: 'space-between',
                  }}
                  aria-label="Send magic sign-in link to email"
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Mail size={13} color="rgba(255,255,255,0.4)" />
                    Send magic sign-in link
                  </span>
                  <ChevronRight size={13} color="rgba(255,255,255,0.2)" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Demo Mode */}
          <motion.button
            id="bypass-demo-btn"
            whileHover={{ scale: 1.01, background: 'rgba(255,122,24,0.08)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDemoMode}
            style={{
              ...btnBase,
              background: 'rgba(255,122,24,0.04)',
              border: '1px solid rgba(255,122,24,0.2)',
              color: C.orange,
              justifyContent: 'space-between',
            }}
            aria-label="Continue as demo guest"
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚗ Continue as Guest (Demo)
            </span>
            <ChevronRight size={13} color="rgba(255,122,24,0.3)" />
          </motion.button>
        </div>

        {/* Support link */}
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <a
            href="/contact"
            id="bypass-contact-link"
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.2)',
              textDecoration: 'none',
              fontFamily: 'monospace',
              letterSpacing: '0.08em',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
          >
            Need help? Contact support →
          </a>
        </div>
      </div>
    </motion.div>
  );
};
