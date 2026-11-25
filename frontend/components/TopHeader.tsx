import React, { useEffect, useState } from 'react';
import { LogOut, Server, User, Sparkles } from 'lucide-react';
import { NEON, GRADIENT_BORDER } from '../theme';
import { SovereignUser } from '../context/SovereignContext';
import { Sha256Badge } from './Sha256Badge';

interface Props {
  user: SovereignUser;
  sovereignId: string | null;
  onLogout: () => void;
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
  onOpenAlpha: () => void;
}

const METHOD_LABEL: Record<SovereignUser['method'], string> = {
  PASSKEY: '🔑 PASSKEY',
  GOOGLE: 'G GOOGLE FEDERATED',
  ANON: '◎ GUEST (LIMITED)',
};

export const TopHeader: React.FC<Props> = ({
  user,
  sovereignId,
  onLogout,
  onOpenProfile,
  onOpenAdmin,
  onOpenAlpha,
}) => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header style={{
      minHeight: 56, background: 'rgba(6,13,31,0.98)', borderBottom: '1px solid rgba(0,212,255,0.12)',
      display: 'flex', alignItems: 'center', padding: '8px 16px', gap: 12, position: 'relative', flexWrap: 'wrap',
    }}>
      <div style={{ height: 2, position: 'absolute', bottom: 0, left: 0, right: 0, background: GRADIENT_BORDER, opacity: 0.55 }} />
      <span style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '0.8rem', letterSpacing: '0.12em', color: NEON.text }}>
        AGAPE <span style={{ color: NEON.blue }}>SOVEREIGN</span>
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'Share Tech Mono', monospace", fontSize: '0.62rem', color: NEON.green }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: NEON.green, boxShadow: `0 0 8px ${NEON.green}` }} />
        LIVE
      </span>
      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: NEON.blue }}>
        {time.toISOString().slice(11, 19)} UTC
      </span>
      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: NEON.orange, letterSpacing: '0.08em' }}>
        ECRA 2026 · GDPR ART. 16 · UDHR ART. 12
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
      <button
        type="button" onClick={onOpenAlpha} aria-label="Open Arena Alpha Build"
        style={{
          display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,122,24,0.09)',
          border: `1px solid ${NEON.orange}55`, color: NEON.orange, borderRadius: 8,
          padding: '6px 10px', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: '0.62rem', fontWeight: 700,
        }}
      >
        <Sparkles size={12} /> ALPHA
      </button>
      {user.isAdmin && (
        <button
          type="button" onClick={onOpenAdmin} aria-label="Open Enclave Admin Portal"
          style={{
            display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,212,255,0.09)',
            border: `1px solid ${NEON.blue}55`, color: NEON.blue, borderRadius: 8,
            padding: '6px 10px', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: '0.62rem', fontWeight: 700,
          }}
        >
          <Server size={12} /> ADMIN
        </button>
      )}
      <button
        type="button" onClick={onOpenProfile} aria-label="Open Sovereign Profile"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32,
          borderRadius: '50%', border: `1px solid ${NEON.magenta}77`, background: 'rgba(255,46,159,0.14)',
          color: NEON.magenta, cursor: 'pointer',
        }}
      >
        <User size={15} />
      </button>
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
