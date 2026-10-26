import React, { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { NEON, GRADIENT_BORDER } from '../theme';
import { SovereignUser } from '../context/SovereignContext';
import { Sha256Badge } from './Sha256Badge';

interface Props {
  user: SovereignUser;
  sovereignId: string | null;
  onLogout: () => void;
}

const METHOD_LABEL: Record<SovereignUser['method'], string> = {
  PASSKEY: '🔑 PASSKEY',
  GOOGLE: 'G GOOGLE FEDERATED',
  ANON: '◎ GUEST (LIMITED)',
};

export const TopHeader: React.FC<Props> = ({ user, sovereignId, onLogout }) => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header style={{
      minHeight: 56, background: 'rgba(6,13,31,0.98)', borderBottom: '1px solid rgba(0,212,255,0.12)',
      display: 'flex', alignItems: 'center', padding: '8px 16px', gap: 14, position: 'relative', flexWrap: 'wrap',
    }}>
      <div style={{ height: 2, position: 'absolute', bottom: 0, left: 0, right: 0, background: GRADIENT_BORDER, opacity: 0.55 }} />
      <span style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '0.8rem', letterSpacing: '0.12em', color: NEON.text }}>
        AGAPE <span style={{ color: NEON.blue }}>SOVEREIGN</span>
      </span>
      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: NEON.blue }}>
        {time.toISOString().slice(11, 19)} UTC
      </span>
      <div style={{ flex: 1 }} />
      {sovereignId && <Sha256Badge hash={sovereignId} label="SOVEREIGN SHA-256" />}
      <span style={{
        fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.08em',
        color: user.method === 'GOOGLE' ? NEON.green : NEON.orange,
        border: `1px solid ${user.method === 'GOOGLE' ? NEON.green : NEON.orange}55`,
        borderRadius: 999, padding: '5px 10px',
      }}>
        {METHOD_LABEL[user.method]}{user.isAdmin ? ' · ADMIN' : ''}
      </span>
      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: NEON.textMuted }}>
        {user.email || 'guest session'}
      </span>
      <button
        type="button" onClick={onLogout} aria-label="Log out"
        style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,46,159,0.08)',
          border: `1px solid ${NEON.magenta}55`, color: NEON.magenta, borderRadius: 8,
          padding: '7px 12px', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: '0.65rem', fontWeight: 700,
        }}
      >
        <LogOut size={13} /> LOGOUT
      </button>
    </header>
  );
};
