import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Wifi, WifiOff, Shield, Cpu, Zap } from 'lucide-react';
import { NEON } from './UI';
import { useAuth } from '../AuthContext';
import {
  IdentityToken,
  SessionStatus,
  STATUS_COLORS,
  truncateHash,
} from '../types/identityTokenSchema';

// ─────────────────────────────────────────────────────────────────────────────
// IdentityTokenBadge
// Cross-module sovereign identity token displayed in Dashboard header +
// each protected module's header. Shows the live session SHA-256 hash,
// auth type, capacity slot, and pipeline status — zero raw PII.
// ─────────────────────────────────────────────────────────────────────────────

interface IdentityTokenBadgeProps {
  token?: IdentityToken | null;
  compact?: boolean;
  showFullHash?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const AUTH_TYPE_LABELS: Record<string, { icon: string; label: string; color: string }> = {
  google: { icon: 'G', label: 'GOOGLE', color: '#4285F4' },
  passkey: { icon: '⬡', label: 'PASSKEY', color: '#00D4FF' },
  anonymous: { icon: '⊕', label: 'ANON', color: '#FF7A18' },
};

const PulsingDot = ({ color }: { color: string }) => (
  <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
    <motion.span
      style={{
        width: 8, height: 8, borderRadius: '50%',
        background: color, display: 'block',
        boxShadow: `0 0 6px ${color}`,
      }}
      animate={{ opacity: [1, 0.4, 1], scale: [1, 1.3, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    />
  </span>
);

/** Compact single-line badge for module headers */
const CompactBadge = ({
  sovereignHash,
  sessionStatus,
  authType,
}: {
  sovereignHash: string | null;
  sessionStatus?: SessionStatus;
  authType?: string;
}) => {
  const [copied, setCopied] = useState(false);
  const statusColor = sessionStatus ? STATUS_COLORS[sessionStatus] : NEON.blue;
  const authInfo = AUTH_TYPE_LABELS[authType || 'anonymous'];

  const handleCopy = useCallback(() => {
    if (!sovereignHash) return;
    navigator.clipboard.writeText(sovereignHash).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [sovereignHash]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(0,0,0,0.4)',
        border: `1px solid ${statusColor}22`,
        borderRadius: 6,
        padding: '4px 10px',
        cursor: sovereignHash ? 'pointer' : 'default',
      }}
      onClick={handleCopy}
      title={sovereignHash ? `SHA-256: ${sovereignHash} — Click to copy` : 'Computing hash...'}
    >
      <PulsingDot color={statusColor} />
      <span style={{
        fontFamily: "'Share Tech Mono'",
        fontSize: '0.62rem',
        color: `${statusColor}CC`,
        letterSpacing: '0.08em',
      }}>
        {sovereignHash ? truncateHash(sovereignHash, 6) : '------...------'}
      </span>
      {authInfo && (
        <span style={{
          fontFamily: "'Orbitron'",
          fontSize: '0.45rem',
          color: authInfo.color,
          background: `${authInfo.color}15`,
          border: `1px solid ${authInfo.color}30`,
          borderRadius: 3,
          padding: '1px 5px',
          letterSpacing: '0.1em',
        }}>
          {authInfo.label}
        </span>
      )}
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span key="check" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Check size={10} color="#00FF88" />
          </motion.span>
        ) : sovereignHash ? (
          <motion.span key="copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Copy size={10} color={`${statusColor}66`} />
          </motion.span>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
};

/** Full badge — displayed in Dashboard header */
export const IdentityTokenBadge: React.FC<IdentityTokenBadgeProps> = ({
  token,
  compact = false,
  showFullHash = false,
  style,
}) => {
  const { sovereignHash, userData } = useAuth();
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const hash = token?.sha256Id || sovereignHash;
  const sessionStatus = token?.sessionStatus || (hash ? 'AUTHENTICATED' : 'INITIALIZING');
  const authType = token?.authType || userData?.authType || 'google';
  const statusColor = STATUS_COLORS[sessionStatus] || NEON.blue;
  const authInfo = AUTH_TYPE_LABELS[authType] || AUTH_TYPE_LABELS.anonymous;

  const handleCopy = useCallback(() => {
    if (!hash) return;
    navigator.clipboard.writeText(hash).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [hash]);

  if (compact) {
    return (
      <CompactBadge
        sovereignHash={hash}
        sessionStatus={sessionStatus}
        authType={authType}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        background: 'rgba(0,0,0,0.5)',
        border: `1px solid ${statusColor}25`,
        borderRadius: 12,
        padding: '12px 16px',
        backdropFilter: 'blur(12px)',
        ...style,
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        {/* Left: Status + Hash */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <PulsingDot color={statusColor} />
          <div>
            <div style={{
              fontFamily: "'Share Tech Mono'",
              fontSize: '0.58rem',
              color: NEON.textMuted,
              letterSpacing: '0.15em',
              marginBottom: 2,
            }}>
              IDENTITY TOKEN · SHA-256
            </div>
            <div
              style={{
                fontFamily: "'Share Tech Mono'",
                fontSize: '0.72rem',
                color: statusColor,
                letterSpacing: '0.08em',
                textShadow: `0 0 8px ${statusColor}55`,
                cursor: hash ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              onClick={handleCopy}
              title={hash || 'Computing...'}
            >
              {hash ? truncateHash(hash, 8) : 'COMPUTING HASH...'}
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span key="c" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                    <Check size={11} color="#00FF88" />
                  </motion.span>
                ) : hash ? (
                  <motion.span key="cp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Copy size={11} color={`${statusColor}66`} />
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right: Auth badge + status + slot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Auth type */}
          <div style={{
            background: `${authInfo.color}12`,
            border: `1px solid ${authInfo.color}30`,
            borderRadius: 6,
            padding: '3px 8px',
            fontFamily: "'Orbitron'",
            fontSize: '0.48rem',
            color: authInfo.color,
            letterSpacing: '0.1em',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <span style={{ fontSize: '0.6rem' }}>{authInfo.icon}</span>
            {authInfo.label}
          </div>

          {/* Session status */}
          <div style={{
            background: `${statusColor}10`,
            border: `1px solid ${statusColor}25`,
            borderRadius: 6,
            padding: '3px 8px',
            fontFamily: "'Share Tech Mono'",
            fontSize: '0.48rem',
            color: statusColor,
            letterSpacing: '0.08em',
          }}>
            {sessionStatus}
          </div>

          {/* Expand toggle */}
          {(token || showFullHash) && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setExpanded(e => !e)}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 4,
                padding: '3px 6px',
                color: NEON.textMuted,
                cursor: 'pointer',
                fontSize: '0.55rem',
                fontFamily: "'Share Tech Mono'",
                letterSpacing: '0.08em',
              }}
            >
              {expanded ? 'LESS' : 'MORE'}
            </motion.button>
          )}
        </div>
      </div>

      {/* Expanded: full hash + token fields */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: `1px dashed ${statusColor}20`,
            }}>
              {/* Full SHA-256 */}
              {hash && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.5rem', color: NEON.textMuted, letterSpacing: '0.15em', marginBottom: 4 }}>
                    FULL SHA-256 IDENTIFIER
                  </div>
                  <div style={{
                    fontFamily: "'Share Tech Mono'",
                    fontSize: '0.52rem',
                    color: `${statusColor}99`,
                    wordBreak: 'break-all',
                    lineHeight: 1.7,
                    letterSpacing: '0.04em',
                  }}>
                    {hash.match(/.{1,8}/g)?.join(' ') ?? hash}
                  </div>
                </div>
              )}

              {/* Token metadata */}
              {token && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {[
                    { label: 'VECTORS', value: `${token.vectorsScanned} / ${token.vectorsTotal}` },
                    { label: 'AUDIT SCORE', value: token.sovereignAuditScore != null ? `${token.sovereignAuditScore}` : '—' },
                    { label: 'RISK TIER', value: token.riskTier || '—' },
                    { label: 'EXPORTABLE', value: token.exportable ? 'YES' : 'NO' },
                    { label: 'SLOT', value: token.capacitySlot != null ? `#${token.capacitySlot}` : '—' },
                    { label: 'VERSION', value: token.tokenVersion },
                  ].map(({ label, value }) => (
                    <div key={label} style={{
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: 4,
                      padding: '4px 8px',
                    }}>
                      <div style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.45rem', color: NEON.textMuted, letterSpacing: '0.15em', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontFamily: "'Orbitron'", fontSize: '0.55rem', color: NEON.text, fontWeight: 600 }}>{value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* AGP Seal */}
              {token?.agpSeal && (
                <div style={{
                  marginTop: 8,
                  fontFamily: "'Share Tech Mono'",
                  fontSize: '0.5rem',
                  color: `${NEON.orange}88`,
                  letterSpacing: '0.08em',
                  textAlign: 'right',
                }}>
                  {token.agpSeal}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Named export for compact variant
export const IdentityTokenCompact: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const { sovereignHash, userData } = useAuth();
  return (
    <CompactBadge
      sovereignHash={sovereignHash}
      sessionStatus={sovereignHash ? 'AUTHENTICATED' : 'INITIALIZING'}
      authType={userData?.authType || 'google'}
    />
  );
};

export default IdentityTokenBadge;
