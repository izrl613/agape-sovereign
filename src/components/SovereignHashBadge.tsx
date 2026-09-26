import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, ShieldCheck, Fingerprint } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { NEON } from './UI';

// ─────────────────────────────────────────────────────────────────────────────
// SovereignHashBadge — LIT SHA-256 ID
// The perpetual glow-indicator of the zero-knowledge session. Shows the user's
// SHA-256 Session Identity (computed by the Gatekeeper from their credential —
// raw uid/email never displayed) in three sizes:
//   header  — slim pill inside the app header, always lit
//   banner  — large dashboard banner: "Everything on this page is sealed to this ID"
//   inline  — compact dot + hash for module rows
// Click to copy. Expandable to reveal the full 64-char digest.
// ─────────────────────────────────────────────────────────────────────────────

type BadgeVariant = 'header' | 'banner' | 'inline';

interface SovereignHashBadgeProps {
  variant?: BadgeVariant;
  /** Optional module context shown under the banner */
  contextLabel?: string;
  style?: React.CSSProperties;
}

const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return reduced;
};

const LitDot: React.FC<{ color: string; size?: number }> = ({ color, size = 7 }) => (
  <span style={{ position: 'relative', width: size + 6, height: size + 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <motion.span
      aria-hidden
      animate={{ scale: [1, 2.1, 2.1], opacity: [0.55, 0, 0] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
      style={{ position: 'absolute', width: size, height: size, borderRadius: '50%', border: `1.5px solid ${color}` }}
    />
    <motion.span
      animate={{ boxShadow: [`0 0 4px ${color}`, `0 0 12px ${color}`, `0 0 4px ${color}`], opacity: [1, 0.75, 1] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'block' }}
    />
  </span>
);

export const SovereignHashBadge: React.FC<SovereignHashBadgeProps> = ({ variant = 'header', contextLabel, style }) => {
  const { sovereignHash, authType } = useAuth();
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const reducedMotion = useReducedMotion();

  const lit = !!sovereignHash && !sovereignHash.startsWith('degraded_');
  const light = lit ? NEON.green : NEON.orange;
  const short = lit ? `${sovereignHash!.slice(0, 10)}…${sovereignHash!.slice(-6)}` : '🛡 COMPUTING SESSION HASH…';

  const handleCopy = useCallback(() => {
    if (!sovereignHash || sovereignHash.startsWith('degraded_')) return;
    navigator.clipboard.writeText(sovereignHash).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }).catch(() => {});
  }, [sovereignHash]);

  const authLabel = authType === 'google' ? 'GOOGLE OAUTH' : authType === 'passkey' ? 'FIDO2 PASSKEY' : 'ANON VAULT';

  /* ── inline variant ── */
  if (variant === 'inline') {
    return (
      <span
        onClick={handleCopy}
        title={lit ? `SHA-256: ${sovereignHash} — click to copy` : 'Hash initialising…'}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem',
          color: lit ? `${light}CC` : 'rgba(255,255,255,0.35)',
          cursor: lit ? 'pointer' : 'default', letterSpacing: '0.06em',
          ...style,
        }}
      >
        <LitDot color={light} size={5} />
        {short}
        {copied ? <Check size={10} color={NEON.green} /> : lit ? <Copy size={10} color={`${light}66`} /> : null}
      </span>
    );
  }

  /* ── header variant ── */
  if (variant === 'header') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => setExpanded(e => !e)}
        title="SHA-256 Session ID — all data on this page is validated, sealed and encrypted against this zero-knowledge identity"
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '4px 11px 4px 7px',
          background: lit ? 'rgba(0,255,135,0.05)' : 'rgba(255,122,24,0.06)',
          border: `1px solid ${lit ? 'rgba(0,255,135,0.22)' : 'rgba(255,122,24,0.25)'}`,
          borderRadius: 100,
          cursor: 'pointer',
          position: 'relative',
          boxShadow: lit ? `0 0 12px rgba(0,255,135,${reducedMotion ? 0.06 : 0.1})` : 'none',
          ...style,
        }}
        role="status"
        aria-live="polite"
        aria-label={lit ? `Zero knowledge active. SHA-256 ID ${sovereignHash}` : 'Session hash computing'}
      >
        <LitDot color={light} size={6} />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.14em' }}>
            SHA-256 ID · {authLabel}
          </span>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.62rem', color: lit ? light : NEON.orange, letterSpacing: '0.07em', textShadow: lit ? `0 0 8px ${light}55` : 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
            {expanded && lit ? sovereignHash : short}
            {copied
              ? <Check size={10} color={NEON.green} />
              : lit
              ? <Copy size={10} color={`${light}77`} onClick={(e) => { e.stopPropagation(); handleCopy(); }} />
              : null}
          </span>
        </div>
      </motion.div>
    );
  }

  /* ── banner variant ── */
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      style={{
        position: 'relative',
        borderRadius: 14,
        border: `1.5px solid ${lit ? 'rgba(0,255,135,0.35)' : 'rgba(255,122,24,0.3)'}`,
        background: `linear-gradient(135deg, ${lit ? 'rgba(0,255,135,0.06)' : 'rgba(255,122,24,0.06)'} 0%, rgba(0,0,0,0.35) 60%)`,
        boxShadow: lit ? `0 0 32px rgba(0,255,135,0.12), inset 0 0 24px rgba(0,255,135,0.03)` : 'none',
        overflow: 'hidden',
        ...style,
      }}
      role="status"
      aria-live="polite"
    >
      {/* scanning sheen */}
      {!reducedMotion && lit && (
        <motion.div
          aria-hidden
          animate={{ x: ['-30%', '130%'] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute', top: 0, bottom: 0, width: '22%',
            background: 'linear-gradient(90deg, transparent, rgba(0,255,135,0.06), transparent)',
            pointerEvents: 'none',
          }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', flexWrap: 'wrap' }}>
        <LitDot color={light} size={9} />

        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <ShieldCheck size={13} color={light} />
            <span style={{
              fontFamily: "'Orbitron', monospace", fontSize: '0.62rem', fontWeight: 800,
              color: light, letterSpacing: '0.16em', textShadow: `0 0 10px ${light}66`,
            }}>
              ZERO-KNOWLEDGE SHIELD {lit ? 'ACTIVE' : 'INITIALISING'}
            </span>
            {authLabel && (
              <span style={{
                fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 4, padding: '1px 6px',
              }}>
                {authLabel}
              </span>
            )}
          </div>

          <div
            onClick={handleCopy}
            title="Click to copy full SHA-256 Session ID"
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.72rem',
              color: lit ? '#D9FFE9' : 'rgba(255,255,255,0.5)',
              letterSpacing: '0.08em',
              textShadow: lit ? `0 0 10px ${light}44` : 'none',
              cursor: lit ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', gap: 8,
              wordBreak: 'break-all',
            }}
          >
            {lit ? `SHA-256 ID · ${short}` : 'Computing SHA-256 session identity from your credential…'}
            {copied ? <Check size={12} color={NEON.green} /> : lit ? <Copy size={12} color={`${light}88`} /> : null}
          </div>

          {contextLabel && (
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.52rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', marginTop: 3 }}>
              {contextLabel}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.5rem', fontWeight: 700, color: lit ? light : NEON.orange, letterSpacing: '0.14em' }}>
              AES-256-GCM · SEALED
            </span>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.48rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
              16 MODULE AGENTS ENFORCED
            </span>
          </div>
          {lit && (
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setExpanded(e => !e)}
              style={{
                background: 'rgba(0,255,135,0.07)',
                border: '1px solid rgba(0,255,135,0.22)',
                borderRadius: 6, padding: '4px 9px',
                fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem',
                color: light, cursor: 'pointer', letterSpacing: '0.1em',
              }}
            >
              {expanded ? 'HIDE' : 'FULL ID'}
            </motion.button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && lit && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              margin: '0 18px 14px',
              padding: '10px 12px',
              background: 'rgba(0,0,0,0.45)',
              border: `1px solid rgba(0,255,135,0.15)`,
              borderRadius: 8,
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.58rem',
              color: `${light}CC`,
              letterSpacing: '0.08em',
              lineHeight: 1.9,
              wordBreak: 'break-all',
            }}>
              <Fingerprint size={11} color={light} style={{ verticalAlign: -1, marginRight: 6 }} />
              {sovereignHash!.match(/.{1,8}/g)?.join('  ')}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SovereignHashBadge;
