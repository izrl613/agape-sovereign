import React, { useEffect, useState } from 'react';
import { NEON, FONTS, GRADIENT } from '../theme';
import { ModuleAgentDef } from '../module-catalog';
import { ModuleBriefingCard } from './UserBriefing';
import { UserBriefing as Briefing, statusColor } from '../utils/briefing';
import { NeonButton } from './DesignSystem';

interface Props {
  module: ModuleAgentDef;
  briefing: Briefing;
  hash?: string;
  uid?: string;
  onEnter: () => void;
}

function formatHex(hex: string): string {
  if (!hex) return '— awaiting seal —';
  return hex.match(/.{1,8}/g)?.join(' · ') ?? hex;
}

export const ModuleSplash: React.FC<Props> = ({ module, briefing, hash, uid, onEnter }) => {
  const [ticks, setTicks] = useState(0);
  const color = statusColor(briefing.status);
  const AUTO_MS = 7000;

  useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => setTicks(Date.now() - started), 80);
    const done = setTimeout(onEnter, AUTO_MS);
    return () => {
      clearInterval(id);
      clearTimeout(done);
    };
  }, [onEnter]);

  const pct = Math.min(100, (ticks / AUTO_MS) * 100);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 20,
        background: 'rgba(6,13,31,0.97)',
        backdropFilter: 'blur(18px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        animation: 'fade-in 0.35s ease',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            'linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div style={{ width: '100%', maxWidth: 720, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: '0.62rem',
              color: NEON.orange,
              letterSpacing: '0.18em',
              border: `1px solid ${color}44`,
              background: `${color}14`,
              borderRadius: 999,
              padding: '4px 12px',
            }}
          >
            {module.vector} · DIFF AGENT
          </span>
          <span style={{ fontFamily: FONTS.mono, fontSize: '0.58rem', color: color }}>{briefing.status}</span>
        </div>

        <div style={{ fontSize: '2.4rem', filter: `drop-shadow(0 0 16px ${color})`, marginBottom: 8 }}>{module.icon}</div>
        <div
          style={{
            fontFamily: FONTS.orbitron,
            fontSize: '1.45rem',
            fontWeight: 800,
            color,
            letterSpacing: '0.04em',
            marginBottom: 6,
            textShadow: `0 0 18px ${color}55`,
          }}
        >
          {module.splash.headline}
        </div>
        <p style={{ fontFamily: FONTS.rajdhani, fontSize: '1.05rem', color: NEON.text, lineHeight: 1.5, margin: '0 0 16px', maxWidth: 640 }}>
          {module.splash.narrative}
        </p>

        <ModuleBriefingCard briefing={briefing} compact />

        <div
          style={{
            marginTop: 14,
            padding: '12px 14px',
            borderRadius: 10,
            background: 'rgba(0,212,255,0.04)',
            border: '1px solid rgba(0,212,255,0.12)',
          }}
        >
          <div style={{ fontFamily: FONTS.mono, fontSize: '0.55rem', color: NEON.textMuted, letterSpacing: '0.14em', marginBottom: 6 }}>
            YOU WILL SEE
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {module.splash.youWillSee.map((item) => (
              <span key={item} style={{ fontFamily: FONTS.rajdhani, fontSize: '0.85rem', color: NEON.blue }}>
                ▸ {item}
              </span>
            ))}
          </div>
          <div style={{ fontFamily: FONTS.rajdhani, fontSize: '0.8rem', color: NEON.textMuted, marginTop: 10 }}>
            <strong style={{ color: NEON.text }}>Privacy pledge.</strong> {module.splash.privacyPledge}
          </div>
        </div>

        <div style={{ marginTop: 12, fontFamily: FONTS.mono, fontSize: '0.55rem', color: NEON.blue, letterSpacing: '0.08em', wordBreak: 'break-all' }}>
          SHA-256 · {formatHex((hash || '').toUpperCase())}
        </div>
        <div style={{ fontFamily: FONTS.mono, fontSize: '0.5rem', color: NEON.textMuted, marginTop: 4 }}>
          UID {uid ? `${uid.slice(0, 8).toUpperCase()}…` : 'GUEST'} · AGAPE SOVEREIGN
        </div>

        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', margin: '16px 0 14px' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: GRADIENT }} />
        </div>

        <NeonButton onClick={onEnter} color={NEON.blue} style={{ width: '100%' }}>
          ENTER {module.name.toUpperCase()}
        </NeonButton>
      </div>
    </div>
  );
};
