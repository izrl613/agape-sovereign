import React, { useState } from 'react';
import { NEON } from '../theme';
import { shortHash } from '../services/sha256Vault';

/**
 * The lit-up SHA-256 ID. Pulsing green = zero-knowledge session active
 * and this exact hash protects the user's data. Click to copy the full
 * 64-character hash; the title always carries the complete value.
 */
export const Sha256Badge: React.FC<{ hash: string; label?: string; size?: 'sm' | 'md' }> = ({
  hash,
  label = 'SHA-256 ID',
  size = 'sm',
}) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard unavailable (permissions) — title still shows the hash */ }
  };
  return (
    <button
      type="button"
      onClick={copy}
      title={`Full ${label}: ${hash}\nClick to copy`}
      aria-label={`${label} ${hash}. Click to copy.`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: size === 'md' ? '8px 14px' : '5px 11px',
        borderRadius: 999,
        border: `1px solid ${NEON.green}66`,
        background: 'rgba(0,255,135,0.07)',
        boxShadow: `0 0 14px rgba(0,255,135,0.25), inset 0 0 10px rgba(0,255,135,0.06)`,
        color: NEON.green,
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: size === 'md' ? '0.72rem' : '0.62rem',
        letterSpacing: '0.06em',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{
        width: 7, height: 7, borderRadius: '50%', background: NEON.green,
        boxShadow: `0 0 9px ${NEON.green}`, animation: 'shaPulse 1.8s ease-in-out infinite', flexShrink: 0,
      }} />
      <span style={{ opacity: 0.75 }}>{label}</span>
      <strong>{copied ? 'COPIED ✓' : shortHash(hash)}</strong>
      <style>{`@keyframes shaPulse { 0%,100% { opacity: 1; transform: scale(1);} 50% { opacity: .35; transform: scale(1.35);} }`}</style>
    </button>
  );
};
