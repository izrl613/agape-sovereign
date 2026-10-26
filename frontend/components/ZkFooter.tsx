import React from 'react';
import { useSovereign } from '../context/SovereignContext';
import { Sha256Badge } from './Sha256Badge';

/**
 * Persistent zero-knowledge footer: the session Sovereign SHA-256 ID,
 * lit up on every screen so the user always sees the exact hash their
 * experience is sealed under. No Node crypto — real session hash.
 */
export const ZkFooter: React.FC<{ pageId?: string }> = () => {
  const { sovereignId, receipts } = useSovereign();
  if (!sovereignId) return null;
  return (
    <footer style={{
      position: 'fixed', bottom: 14, left: 0, right: 0, zIndex: 1000,
      display: 'flex', justifyContent: 'center', pointerEvents: 'none',
    }}>
      <div style={{
        pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(6,12,26,0.92)', backdropFilter: 'blur(14px)',
        border: '1px solid rgba(0,255,135,0.25)', borderRadius: 999,
        padding: '6px 10px 6px 16px',
        boxShadow: '0 6px 30px rgba(0,0,0,0.55), 0 0 18px rgba(0,255,135,0.12)',
        fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: 'rgba(180,190,220,0.7)',
        letterSpacing: '0.08em',
      }}>
        <span>ZERO-KNOWLEDGE SESSION · {receipts.length} SEALED</span>
        <Sha256Badge hash={sovereignId} label="SOVEREIGN" />
      </div>
    </footer>
  );
};
