import React, { useEffect, useState } from 'react';
import { NEON, FONTS, GRADIENT_BORDER } from '../theme';
import { NeonButton } from './DesignSystem';
import { DossierStrip } from './UserBriefing';
import { useSovereign } from '../context/SovereignContext';

export const TopHeader: React.FC<{
  currentLabel?: string;
  onLogout: () => void;
  onBindPasskey?: () => void;
}> = ({ currentLabel, onLogout, onBindPasskey }) => {
  const { user, dossier } = useSovereign();
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const isAdmin = ['idin@agape.nyc', 'agape@sovereign.nyc'].includes(user?.email || '');

  return (
    <div
      style={{
        height: 56,
        background: 'rgba(6,13,31,0.98)',
        borderBottom: '1px solid rgba(0,212,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          height: 1,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: GRADIENT_BORDER,
          backgroundSize: '200% 100%',
          animation: 'rotate-gradient 4s linear infinite',
          opacity: 0.6,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0f0', boxShadow: '0 0 8px #0f0', animation: 'pulse-border 1.5s infinite' }} />
        <span style={{ fontFamily: FONTS.mono, fontSize: '0.65rem', color: '#0f0', letterSpacing: '0.1em' }}>LIVE</span>
      </div>

      <div style={{ height: 20, width: 1, background: 'rgba(0,212,255,0.2)' }} />
      <span style={{ fontFamily: FONTS.mono, fontSize: '0.7rem', color: NEON.blue, flexShrink: 0 }}>
        {time.toLocaleTimeString('en-US', { hour12: false })} UTC
      </span>
      <div style={{ height: 20, width: 1, background: 'rgba(0,212,255,0.2)' }} />
      <span style={{ fontFamily: FONTS.mono, fontSize: '0.62rem', color: NEON.orange, letterSpacing: '0.08em', flexShrink: 0 }}>
        ECRA 2026 · GDPR · CCPA
      </span>

      <DossierStrip dossier={dossier} current={currentLabel} />

      {onBindPasskey && (
        <NeonButton color={NEON.blue} size="sm" onClick={onBindPasskey}>
          🔑 ADD DEVICE
        </NeonButton>
      )}
      {isAdmin && (
        <NeonButton color={NEON.orange} size="sm">
          ⬡ ADMIN
        </NeonButton>
      )}
      <button
        onClick={onLogout}
        title="Sign out"
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'rgba(255,46,159,0.1)',
          border: `1px solid ${NEON.magenta}55`,
          cursor: 'pointer',
          color: NEON.magenta,
          fontFamily: FONTS.orbitron,
          fontSize: '0.7rem',
          flexShrink: 0,
        }}
      >
        {user?.authMethod === 'GOOGLE' ? 'G' : user?.displayName?.[0]?.toUpperCase() || 'U'}
      </button>
    </div>
  );
};
