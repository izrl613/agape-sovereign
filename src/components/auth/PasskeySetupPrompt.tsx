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

type AuthenticatorMode = 'platform' | 'cross-platform' | null;

export const PasskeySetupPrompt: React.FC = () => {
  const { user, bindPasskey } = useAuth();
  const [visible, setVisible] = useState(false);
  const [authenticatorMode, setAuthenticatorMode] = useState<AuthenticatorMode>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!user || user.isAnonymous) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    if (typeof window === 'undefined' || !window.PublicKeyCredential) return;

    // Check platform authenticator first (TouchID / FaceID / Windows Hello)
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      .then(platformOk => {
        if (platformOk) {
          setAuthenticatorMode('platform');
          setTimeout(() => setVisible(true), 1200);
          return;
        }
        // Fall through: check if WebAuthn is at least available (cross-device)
        // Using a basic availability check — if PublicKeyCredential exists,
        // cross-device passkeys (hardware keys, phone passkeys) may work.
        setAuthenticatorMode('cross-platform');
        setTimeout(() => setVisible(true), 1200);
      })
      .catch(() => {
        // If the platform check itself throws, still offer cross-platform option
        setAuthenticatorMode('cross-platform');
        setTimeout(() => setVisible(true), 1800);
      });
  }, [user]);

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

  if (!authenticatorMode) return null;

  const isPlatform = authenticatorMode === 'platform';

  const title = isPlatform
    ? 'Enable Passkey Login'
    : 'Add a Cross-Device Passkey';
  const subtitle = isPlatform
    ? 'Sign in next time with your fingerprint or Face ID — no password, no Google prompt.'
    : 'Register a hardware key or phone passkey for passwordless sign-in on any device.';

  return (
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
                    {title}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                    {subtitle}
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(isPlatform
                  ? ['Phishing-resistant authentication', 'Device-bound — never leaves your hardware', 'Instant biometric unlock']
                  : ['Works with hardware security keys', 'Use your phone as a passkey via QR code', 'Phishing-resistant — no password']
                ).map(b => (
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
  );
};
