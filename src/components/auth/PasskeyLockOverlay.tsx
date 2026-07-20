/**
 * PasskeyLockOverlay — Biometric Verification Gate
 * ============================================================
 * Full-screen overlay rendered over protected zones (Vault / Identity)
 * when passkey protection is enabled and the zone is locked.
 *
 * PWA-native replacement for Android VaultLockOverlay / IdentityLockOverlay:
 *   - Uses WebAuthn biometric prompt (Touch ID / Face ID / Windows Hello)
 *   - Sandbox mode bypass for headless/CI environments
 *   - Neon glassmorphism design matching Agape Sovereign aesthetic
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Shield, AlertTriangle, Loader2, CheckCircle, Lock } from 'lucide-react';
import { NEON, NeonText } from '../UI';
import { passkeyLockService, type LockZone, type PasskeyLockState } from '../../services/passkeyLockService';

interface PasskeyLockOverlayProps {
  zone: LockZone;
}

const ZONE_CONFIG = {
  vault: {
    label: 'SECURE DOCUMENT VAULT',
    sublabel: 'Shield Platform Suite · V-17',
    icon: '🛡️',
    accentColor: NEON.magenta,
  },
  identity: {
    label: 'IDENTITY CORE PORTAL',
    sublabel: 'Command Center · DIFF Matrix',
    icon: '⬡',
    accentColor: NEON.blue,
  },
};

type OverlayStatus = 'locked' | 'verifying' | 'unlocked' | 'error';

export const PasskeyLockOverlay: React.FC<PasskeyLockOverlayProps> = ({ zone }) => {
  const [lockState, setLockState] = useState<PasskeyLockState>(passkeyLockService.getState());
  const [status, setStatus] = useState<OverlayStatus>('locked');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    return passkeyLockService.subscribe(setLockState);
  }, []);

  const isLocked = zone === 'vault' ? lockState.vaultLocked : lockState.identityLocked;
  const isEnabled = zone === 'vault' ? lockState.vaultEnabled : lockState.identityEnabled;
  const config = ZONE_CONFIG[zone];

  // Don't render if not enabled or not locked
  if (!isEnabled || !isLocked) return null;

  const handleUnlock = async () => {
    setStatus('verifying');
    setErrorMsg('');

    const result = await passkeyLockService.requestPasskeyUnlock(zone);

    if (result.success) {
      setStatus('unlocked');
      // Brief success animation before overlay disappears
    } else {
      setStatus('error');
      setErrorMsg('Verification failed or was cancelled. Try again.');
    }
  };

  const handleSimulationBypass = async () => {
    setStatus('verifying');
    const result = await passkeyLockService.requestPasskeyUnlock(zone);
    if (result.success) {
      setStatus('unlocked');
    }
  };

  return (
    <AnimatePresence>
      {status !== 'unlocked' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(6, 13, 31, 0.97)',
            backdropFilter: 'blur(24px)',
            borderRadius: 12,
          }}
        >
          {/* Ambient glow */}
          <div style={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${config.accentColor}15, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          {/* Top accent bar */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${NEON.magenta}, ${NEON.blue}, ${NEON.orange})`,
            borderRadius: '12px 12px 0 0',
          }} />

          {/* Lock icon container */}
          <motion.div
            animate={status === 'verifying' ? { scale: [1, 1.05, 1] } : { scale: 1 }}
            transition={status === 'verifying' ? { repeat: Infinity, duration: 1.5 } : {}}
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              background: `${config.accentColor}12`,
              border: `2px solid ${config.accentColor}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
              position: 'relative',
              boxShadow: `0 0 40px ${config.accentColor}20`,
            }}
          >
            {status === 'verifying' ? (
              <Loader2 size={40} color={config.accentColor} style={{ animation: 'spin 1s linear infinite' }} />
            ) : status === 'error' ? (
              <AlertTriangle size={40} color={NEON.orange} />
            ) : (
              <Fingerprint size={40} color={config.accentColor} />
            )}
            {/* Scanning ring animation */}
            {status === 'locked' && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  inset: -4,
                  borderRadius: '50%',
                  border: `2px solid transparent`,
                  borderTopColor: config.accentColor,
                  opacity: 0.5,
                }}
              />
            )}
          </motion.div>

          {/* Zone label */}
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '0.6rem',
            color: config.accentColor,
            letterSpacing: '0.25em',
            marginBottom: 8,
            opacity: 0.8,
          }}>
            {config.icon} {config.sublabel}
          </div>

          <NeonText color={config.accentColor} size="1.3rem" weight={900} style={{ marginBottom: 8 }}>
            {config.label}
          </NeonText>

          {/* Status text */}
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '0.85rem',
            color: NEON.textMuted,
            textAlign: 'center',
            maxWidth: 320,
            lineHeight: 1.5,
            marginBottom: 28,
          }}>
            {status === 'locked' && 'This zone is protected by hardware-bound passkey verification. Authenticate to proceed.'}
            {status === 'verifying' && 'Awaiting biometric verification...'}
            {status === 'error' && errorMsg}
          </div>

          {/* Action button */}
          {status === 'locked' && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleUnlock}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 32px',
                borderRadius: 12,
                border: 'none',
                background: `linear-gradient(135deg, ${NEON.magenta}, ${config.accentColor})`,
                color: '#fff',
                fontFamily: "'Orbitron', monospace",
                fontSize: '0.8rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                cursor: 'pointer',
                boxShadow: `0 0 24px ${config.accentColor}33`,
              }}
            >
              <Fingerprint size={18} />
              VERIFY IDENTITY
            </motion.button>
          )}

          {/* Error retry */}
          {status === 'error' && (
            <div style={{ display: 'flex', gap: 10 }}>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleUnlock}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  borderRadius: 10,
                  border: 'none',
                  background: `linear-gradient(135deg, ${NEON.magenta}, ${config.accentColor})`,
                  color: '#fff',
                  fontFamily: "'Orbitron', monospace",
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Fingerprint size={16} />
                RETRY
              </motion.button>
            </div>
          )}

          {/* Simulation mode badge + bypass */}
          {lockState.simulationMode && (
            <div style={{
              marginTop: 24,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                background: 'rgba(255,122,24,0.1)',
                border: '1px solid rgba(255,122,24,0.3)',
                borderRadius: 6,
              }}>
                <AlertTriangle size={12} color={NEON.orange} />
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '0.6rem',
                  color: NEON.orange,
                  letterSpacing: '0.1em',
                  fontWeight: 700,
                }}>
                  ⚠ SANDBOX MODE — NO PLATFORM AUTHENTICATOR
                </span>
              </div>
              {(status === 'locked' || status === 'error') && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSimulationBypass}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 8,
                    border: `1px solid ${NEON.orange}44`,
                    background: 'rgba(255,122,24,0.08)',
                    color: NEON.orange,
                    fontFamily: "'Orbitron', monospace",
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    letterSpacing: '0.06em',
                  }}
                >
                  BYPASS GATE (SANDBOX)
                </motion.button>
              )}
            </div>
          )}

          {/* Bottom info line */}
          <div style={{
            position: 'absolute',
            bottom: 16,
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '0.5rem',
            color: `${NEON.textMuted}66`,
            letterSpacing: '0.1em',
          }}>
            WEBAUTHN FIDO2 · DEVICE-BOUND · ZERO-KNOWLEDGE
          </div>

          {/* Keyframe for spinner */}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
