/**
 * PasskeySetupPrompt
 * ─────────────────
 * Shown once after a user's first Google Sign-In to offer passkey binding.
 * Dismisses permanently via localStorage flag; never blocks the app.
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, X, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '../../AuthContext';

const NEON_BLUE = '#00D4FF';
const NEON_MAGENTA = '#FF2E9F';
const NEON_ORANGE = '#FF6B00';
const STORAGE_KEY = 'agape_passkey_prompt_dismissed';

export const PasskeySetupPrompt: React.FC = () => {
  const { user, bindPasskey, authType } = useAuth();
  const [visible, setVisible] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [hasPasskey, setHasPasskey] = useState<boolean | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!user || user.isAnonymous) {
      setVisible(false);
      setHasPasskey(null);
      return;
    }
    let cancelled = false;
    setHasPasskey(null);
    if (typeof window !== 'undefined' && window.PublicKeyCredential) setPasskeySupported(true);

    user.getIdToken().then(async (idToken) => {
      const response = await fetch('/api/auth/has-passkey', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const body = await response.json().catch(() => ({}));
      if (!cancelled && response.ok && typeof body.hasPasskey === 'boolean') {
        setHasPasskey(body.hasPasskey);
      }
    }).catch(() => {
      if (!cancelled) setHasPasskey(null);
    });

    return () => { cancelled = true; };
  }, [user]);

  const openPrompt = () => {
    localStorage.removeItem(STORAGE_KEY);
    setVisible(true);
  };

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  const handleSetup = async () => {
    setStatus('loading');
    setErrorMsg('');
    try {
      await bindPasskey();
      setStatus('success');
      localStorage.setItem(STORAGE_KEY, '1');
      setTimeout(() => setVisible(false), 2200);
    } catch (err: unknown) {
      setStatus('error');
      const msg = err instanceof Error ? err.message : 'Setup failed';
      if (msg.includes('cancelled') || msg.includes('NotAllowedError')) {
        setErrorMsg('Prompt dismissed — you can set up a passkey later in Settings.');
      } else {
        setErrorMsg(msg);
      }
    }
  };

  if (!passkeySupported || !user || user.isAnonymous || authType === 'anonymous' || hasPasskey === true) return null;

  return (
    <>
      <button
        onClick={openPrompt}
        aria-label="Set up a passkey"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9998,
          border: '1px solid rgba(0,212,255,0.35)', borderRadius: 12,
          padding: '10px 14px', background: 'rgba(11,16,32,0.96)',
          color: NEON_BLUE, fontWeight: 700, cursor: 'pointer',
        }}
      >
        <Fingerprint size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        Set Up Passkey
          {hasPasskey === null && (
            <span style={{ marginLeft: 8, fontSize: 9, opacity: 0.65 }}>CHECK STATUS</span>
          )}
      </button>
      <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          style={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            zIndex: 9999,
            width: 360,
            background: 'rgba(11,16,32,0.96)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: 16,
            padding: '22px 22px 20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(0,212,255,0.07)',
          }}
        >
          {/* Close */}
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 4 }}
          >
            <X size={16} />
          </button>

          {status === 'success' ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '12px 0' }}>
              <CheckCircle size={32} color={NEON_BLUE} style={{ margin: '0 auto 12px', display: 'block' }} />
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Device passkey saved!</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 6 }}>
                Next time, sign in instantly with your fingerprint or Face ID.
              </div>
            </motion.div>
          ) : (
            <>
              {/* Icon + title */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: `linear-gradient(135deg, rgba(255,46,159,0.15), rgba(0,212,255,0.15))`,
                  border: `1px solid rgba(0,212,255,0.2)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Fingerprint size={20} color={NEON_BLUE} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#fff', lineHeight: 1.3, marginBottom: 4 }}>
                    Enable Passkey Login
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                    Sign in next time with your fingerprint or Face ID — no password, no Google prompt.
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['Phishing-resistant authentication', 'Device-bound — never leaves your hardware', 'Instant biometric unlock'].map(b => (
                  <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Shield size={11} color={NEON_ORANGE} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{b}</span>
                  </div>
                ))}
              </div>

              {status === 'error' && errorMsg && (
                <div style={{ fontSize: 11, color: '#fca5a5', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 10px', marginBottom: 12 }}>
                  {errorMsg}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSetup}
                  disabled={status === 'loading'}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    borderRadius: 10,
                    border: 'none',
                    background: `linear-gradient(135deg, ${NEON_MAGENTA}, ${NEON_BLUE})`,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: status === 'loading' ? 'wait' : 'pointer',
                    opacity: status === 'loading' ? 0.7 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {status === 'loading' ? 'Setting up…' : 'Set Up Passkey'}
                </motion.button>
                <button
                  onClick={dismiss}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)',
                    color: 'rgba(255,255,255,0.45)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Later
                </button>
              </div>
            </>
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
};
