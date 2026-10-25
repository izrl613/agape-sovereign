import React from 'react';
import { NEON, FONTS } from '../theme';
import { UserBriefing as Briefing, IdentityDossier, statusColor } from '../utils/briefing';

const TONE = {
  ok: NEON.blue,
  warn: NEON.orange,
  bad: NEON.magenta,
  info: NEON.textMuted,
};

export const DossierStrip: React.FC<{ dossier: IdentityDossier; current?: string }> = ({ dossier, current }) => {
  const scoreColor = dossier.score > 80 ? NEON.blue : dossier.score > 60 ? NEON.orange : NEON.magenta;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 14px',
        background: 'rgba(0,0,0,0.35)',
        border: '1px solid rgba(0,212,255,0.12)',
        borderRadius: 10,
        minWidth: 0,
        flex: 1,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.orbitron,
          fontSize: '0.95rem',
          fontWeight: 800,
          color: scoreColor,
          textShadow: `0 0 10px ${scoreColor}66`,
          flexShrink: 0,
        }}
      >
        {dossier.score}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: '0.62rem',
            color: NEON.text,
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {dossier.emailMasked} · {dossier.authLabel}
          {current ? ` · ${current}` : ''}
        </div>
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: '0.55rem',
            color: NEON.textMuted,
            letterSpacing: '0.06em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {dossier.sealed}/{dossier.total} sealed ·{' '}
          <span style={{ color: NEON.magenta }}>{dossier.nuked} NUKED</span> ·{' '}
          <span style={{ color: NEON.blue }}>{dossier.knoxed} KNOXED</span> ·{' '}
          <span style={{ color: NEON.orange }}>{dossier.monitored} WATCH</span>
        </div>
      </div>
    </div>
  );
};

export const ModuleBriefingCard: React.FC<{ briefing: Briefing; compact?: boolean }> = ({ briefing, compact }) => {
  const color = statusColor(briefing.status);
  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.35)',
        border: `1px solid ${color}33`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 12,
        padding: compact ? '12px 14px' : '16px 18px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <div>
          <div style={{ fontFamily: FONTS.mono, fontSize: '0.55rem', color: NEON.orange, letterSpacing: '0.16em' }}>
            {briefing.vector} · YOUR PICTURE IN THIS VECTOR
          </div>
          <div
            style={{
              fontFamily: FONTS.orbitron,
              fontSize: compact ? '0.85rem' : '1rem',
              color,
              fontWeight: 700,
              marginTop: 4,
            }}
          >
            {briefing.headline}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: FONTS.orbitron, fontSize: '1.2rem', fontWeight: 800, color }}>{briefing.score}</div>
          <div style={{ fontFamily: FONTS.mono, fontSize: '0.5rem', color: NEON.textMuted }}>SCORE</div>
        </div>
      </div>

      <p
        style={{
          fontFamily: FONTS.rajdhani,
          fontSize: compact ? '0.85rem' : '0.95rem',
          color: NEON.text,
          lineHeight: 1.45,
          margin: '0 0 12px',
        }}
      >
        {briefing.plainEnglish}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: compact ? 0 : 12 }}>
        {briefing.facts.map((f, i) => (
          <span
            key={i}
            style={{
              fontFamily: FONTS.mono,
              fontSize: '0.58rem',
              color: TONE[f.tone],
              border: `1px solid ${TONE[f.tone]}44`,
              background: `${TONE[f.tone]}12`,
              borderRadius: 999,
              padding: '3px 8px',
              letterSpacing: '0.03em',
            }}
          >
            {f.label}: {f.value}
          </span>
        ))}
      </div>

      {!compact && (
        <div
          style={{
            fontFamily: FONTS.rajdhani,
            fontSize: '0.82rem',
            color: NEON.blue,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: 10,
          }}
        >
          <strong style={{ fontFamily: FONTS.mono, fontSize: '0.58rem', letterSpacing: '0.12em', marginRight: 8 }}>
            NEXT
          </strong>
          {briefing.nextAction}
        </div>
      )}
    </div>
  );
};
