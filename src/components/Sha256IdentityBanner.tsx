import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { isValidSHA256 } from '../services/sovereignHashService';

/**
 * Sha256IdentityBanner
 * The always-visible proof that this session is running under a real SHA-256
 * identity. It lights up only when the displayed digest is a genuine 64-hex
 * SHA-256 — a missing or placeholder hash renders RED and blocks the claim of
 * zero-knowledge protection rather than faking a green state.
 */

const VALID_GLOW = '#00FF87';
const INVALID_GLOW = '#FF2E9F';

interface Sha256IdentityBannerProps {
  /** Optional per-module digest to display alongside the session identity. */
  moduleLabel?: string;
  moduleSha256?: string | null;
  compact?: boolean;
}

export const Sha256IdentityBanner: React.FC<Sha256IdentityBannerProps> = ({
  moduleLabel,
  moduleSha256,
  compact = false,
}) => {
  const { sovereignHash, googleLinked, passkeyBound } = useAuth();
  const [copied, setCopied] = useState<'session' | 'module' | null>(null);
  const [pulse, setPulse] = useState(0);

  const valid = !!sovereignHash && isValidSHA256(sovereignHash);
  const glow = valid ? VALID_GLOW : INVALID_GLOW;

  // Heartbeat: the banner visibly "breathes" while the hash is live.
  useEffect(() => {
    if (!valid) return;
    const t = setInterval(() => setPulse(p => p + 1), 2600);
    return () => clearInterval(t);
  }, [valid]);

  const copy = useCallback(async (value: string, which: 'session' | 'module') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard blocked — the digest stays visible on screen */
    }
  }, []);

  const grouped = (sovereignHash || '').match(/.{1,8}/g) || [];

  const HashRow = ({ label, value, which, lit }: { label: string; value: string; which: 'session' | 'module'; lit: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 9, letterSpacing: '0.18em',
          color: lit ? `${glow}AA` : `${INVALID_GLOW}CC`,
          marginBottom: 3,
        }}>
          {label}
        </div>
        <div
          title={value}
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: compact ? 9.5 : 11,
            color: lit ? '#E8FBFF' : INVALID_GLOW,
            letterSpacing: '0.06em',
            textShadow: lit ? `0 0 10px ${glow}66` : `0 0 10px ${INVALID_GLOW}55`,
            wordBreak: 'break-all',
            lineHeight: 1.5,
          }}
        >
          {lit ? (value.match(/.{1,8}/g) || []).join(' ') : (value || 'NOT ISSUED')}
        </div>
      </div>
      <button
        onClick={() => copy(value, which)}
        aria-label={`Copy ${label}`}
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${lit ? `${glow}44` : `${INVALID_GLOW}44`}`,
          borderRadius: 6, padding: '6px 8px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5,
          color: lit ? glow : INVALID_GLOW,
          fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.08em',
          flexShrink: 0,
        }}
      >
        {copied === which ? <Check size={11} /> : <Copy size={11} />}
        {copied === which ? 'COPIED' : 'COPY'}
      </button>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        position: 'relative',
        borderRadius: 12,
        padding: compact ? '10px 14px' : '14px 18px',
        background: valid
          ? `radial-gradient(120% 140% at 0% 0%, ${glow}14 0%, rgba(255,255,255,0.015) 60%)`
          : `radial-gradient(120% 140% at 0% 0%, ${INVALID_GLOW}18 0%, rgba(255,255,255,0.015) 60%)`,
        border: `1px solid ${valid ? `${glow}44` : `${INVALID_GLOW}55`}`,
        boxShadow: valid ? `0 0 24px ${glow}22, inset 0 0 30px ${glow}08` : `0 0 24px ${INVALID_GLOW}22`,
        overflow: 'hidden',
        marginBottom: compact ? 12 : 20,
      }}
    >
      {/* travelling light sweep — the "lit up" indicator */}
      {valid && (
        <motion.div
          key={pulse}
          initial={{ x: '-40%', opacity: 0 }}
          animate={{ x: '140%', opacity: [0, 0.5, 0] }}
          transition={{ duration: 2.4, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: 0, bottom: 0, width: '35%',
            background: `linear-gradient(90deg, transparent, ${glow}22, transparent)`,
            pointerEvents: 'none',
          }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <motion.div
          animate={valid ? { opacity: [1, 0.45, 1], scale: [1, 1.12, 1] } : {}}
          transition={{ duration: 2.2, repeat: Infinity }}
          style={{
            width: 26, height: 26, borderRadius: '50%',
            background: `${glow}18`, border: `1px solid ${glow}66`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 14px ${glow}55`, flexShrink: 0,
          }}
        >
          {valid ? <ShieldCheck size={14} color={glow} /> : <ShieldAlert size={14} color={INVALID_GLOW} />}
        </motion.div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em',
            color: valid ? '#FFFFFF' : INVALID_GLOW,
          }}>
            {valid ? 'ZERO-KNOWLEDGE SESSION ACTIVE' : 'IDENTITY HASH NOT ISSUED'}
          </div>
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 9, letterSpacing: '0.1em',
            color: valid ? `${glow}CC` : `${INVALID_GLOW}CC`, marginTop: 2,
          }}>
            {valid
              ? 'AES-256-GCM CLIENT-SIDE ENCRYPTION · SHA-256 SEALED INPUTS · NO PLAINTEXT STORED'
              : 'SIGN IN AGAIN — MODULE AGENTS WILL NOT RUN WITHOUT A VALID SHA-256 IDENTITY'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <FactorChip label="GOOGLE" active={googleLinked} />
          <FactorChip label="PASSKEY" active={passkeyBound} />
        </div>
      </div>

      <HashRow
        label="SESSION SHA-256 IDENTITY ID"
        value={sovereignHash || ''}
        which="session"
        lit={valid}
      />

      {moduleLabel && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${valid ? `${glow}22` : `${INVALID_GLOW}22`}` }}>
          <HashRow
            label={`${moduleLabel} INPUT SHA-256 ID`}
            value={moduleSha256 || ''}
            which="module"
            lit={!!moduleSha256 && isValidSHA256(moduleSha256)}
          />
        </div>
      )}

      {!compact && (
        <div style={{
          marginTop: 10, fontFamily: "'Share Tech Mono', monospace",
          fontSize: 8.5, letterSpacing: '0.08em',
          color: 'rgba(180,190,220,0.5)',
        }}>
          {grouped.length === 8
            ? 'Every value you enter is hashed to this digest class, encrypted on device, and sealed by its Module Agent before it is written anywhere.'
            : 'Awaiting a valid 64-character SHA-256 digest.'}
        </div>
      )}
    </motion.div>
  );
};

const FactorChip = ({ label, active }: { label: string; active: boolean }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '4px 9px', borderRadius: 100,
    border: `1px solid ${active ? '#4285F455' : 'rgba(255,255,255,0.08)'}`,
    background: active ? 'rgba(66,133,244,0.1)' : 'transparent',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 8.5, letterSpacing: '0.1em',
    color: active ? '#8AB4F8' : 'rgba(180,190,220,0.35)',
  }}>
    <span style={{
      width: 5, height: 5, borderRadius: '50%',
      background: active ? '#00FF87' : 'rgba(255,255,255,0.2)',
      boxShadow: active ? '0 0 6px #00FF87' : 'none',
    }} />
    {label}
  </div>
);
