import React, { useMemo } from 'react';
import { NEON, FONTS } from '../theme';
import { NeonText, GlassCard } from './DesignSystem';
import { MODULE_AGENTS } from '../module-catalog';
import { useSovereign } from '../context/SovereignContext';
import { buildModuleBriefing, scoreFromFindings, statusColor, worstStatus } from '../utils/briefing';
import { ModuleBriefingCard } from './UserBriefing';

export const DashboardView: React.FC<{ onModuleClick: (id: string) => void }> = ({ onModuleClick }) => {
  const { modules, dossier, user } = useSovereign();

  const cards = useMemo(
    () =>
      MODULE_AGENTS.map((m) => {
        const row = modules[m.id] || { record: {}, findings: [] };
        const briefing = buildModuleBriefing(m, row.record, row.findings, user?.displayName || 'You');
        return { m, row, briefing, sev: scoreFromFindings(row.findings), status: worstStatus(row.findings) };
      }),
    [modules, user]
  );

  const hot = cards.find((c) => c.status === 'NUKED') || cards[0];

  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%', animation: 'fade-in 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 22 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: '0.6rem', color: NEON.orange, letterSpacing: '0.2em', marginBottom: 6 }}>
            DIGITAL IDENTITY FEDERATED FOOTPRINT
          </div>
          <NeonText color={NEON.blue} size="1.5rem" weight={900}>
            DIFF COMMAND CENTER
          </NeonText>
          <div style={{ color: NEON.textMuted, fontSize: '0.9rem', marginTop: 4, fontFamily: FONTS.rajdhani }}>
            {dossier.oneLiner}
          </div>
        </div>
        <SovereignScore score={dossier.score} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'VECTORS SEALED', value: `${dossier.sealed}/16`, sub: 'Identity modules with data', color: NEON.blue },
          { label: 'EXPOSURES', value: dossier.nuked, sub: 'Live NUKED findings', color: NEON.magenta },
          { label: 'SECURED', value: dossier.knoxed, sub: 'KNOXED & hardened', color: NEON.blue },
          { label: 'AUDIT PAGES', value: '22', sub: 'Identity report after biometrics', color: NEON.orange },
        ].map((kpi) => (
          <GlassCard key={kpi.label} style={{ padding: 16 }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: '0.58rem', color: NEON.textMuted, letterSpacing: '0.1em', marginBottom: 6 }}>
              {kpi.label}
            </div>
            <div
              style={{
                fontFamily: FONTS.orbitron,
                fontSize: '1.6rem',
                fontWeight: 900,
                color: kpi.color,
                textShadow: `0 0 12px ${kpi.color}66`,
              }}
            >
              {kpi.value}
            </div>
            <div style={{ fontSize: '0.75rem', color: NEON.textMuted, marginTop: 4 }}>{kpi.sub}</div>
          </GlassCard>
        ))}
      </div>

      {hot && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: FONTS.orbitron, fontSize: '0.7rem', color: NEON.orange, letterSpacing: '0.12em', marginBottom: 8 }}>
            START HERE · CONDENSED BRIEFING
          </div>
          <div onClick={() => onModuleClick(hot.m.id)} style={{ cursor: 'pointer' }}>
            <ModuleBriefingCard briefing={hot.briefing} />
          </div>
        </div>
      )}

      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <NeonText color={NEON.orange} size="0.75rem" weight={700}>
          16 MODULE AGENTS
        </NeonText>
        <div style={{ flex: 1, height: 1, background: `${NEON.orange}33` }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, paddingBottom: 28 }}>
        {cards.map(({ m, briefing, sev, status, row }) => {
          const sevColor = statusColor(status === 'EMPTY' ? 'KNOXED' : status);
          const oneLiner =
            briefing.facts[0]?.value ||
            (row.findings[0]?.label ?? 'Not configured — tap to brief this vector');
          return (
            <GlassCard key={m.id} className="module-card" onClick={() => onModuleClick(m.id)} style={{ padding: 14, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ color: sevColor, fontSize: '1.2rem' }}>{m.icon}</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontFamily: FONTS.orbitron, fontSize: '0.7rem', color: sevColor, fontWeight: 700 }}>{sev}%</span>
                  <div style={{ fontFamily: FONTS.mono, fontSize: '0.5rem', color: NEON.textMuted }}>{m.vector}</div>
                </div>
              </div>
              <div style={{ fontFamily: FONTS.rajdhani, fontSize: '0.8rem', fontWeight: 700, color: NEON.text, marginBottom: 4, lineHeight: 1.25 }}>
                {m.name}
              </div>
              <div
                style={{
                  fontFamily: FONTS.rajdhani,
                  fontSize: '0.72rem',
                  color: NEON.textMuted,
                  lineHeight: 1.35,
                  minHeight: 34,
                  marginBottom: 8,
                }}
              >
                {oneLiner}
              </div>
              <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', width: `${sev}%`, background: sevColor, boxShadow: `0 0 6px ${sevColor}` }} />
              </div>
              <div style={{ display: 'flex', gap: 8, fontFamily: FONTS.mono, fontSize: '0.55rem' }}>
                <span style={{ color: NEON.magenta }}>🔥{row.findings.filter((f) => f.status === 'NUKED').length}</span>
                <span style={{ color: NEON.blue }}>🛡️{row.findings.filter((f) => f.status === 'KNOXED').length}</span>
                <span style={{ color: NEON.orange }}>👁️{row.findings.filter((f) => f.status === 'MONITORED').length}</span>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};

const SovereignScore = ({ score }: { score: number }) => {
  const r = 52,
    cx = 64,
    cy = 64;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  const color = score > 75 ? NEON.blue : score > 50 ? NEON.orange : NEON.magenta;
  return (
    <div style={{ textAlign: 'center', position: 'relative' }}>
      <svg width="128" height="128" className="score-ring" style={{ filter: `drop-shadow(0 0 12px ${color})` }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${pct * circ} ${circ}`}
          strokeDashoffset={circ * 0.25}
          strokeLinecap="round"
        />
        <text x={cx} y={cy - 6} textAnchor="middle" fill={color} fontFamily="Orbitron" fontSize="22" fontWeight="900">
          {score}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill={NEON.textMuted} fontFamily="Rajdhani" fontSize="9" letterSpacing="2">
          SOVEREIGN
        </text>
        <text x={cx} y={cy + 25} textAnchor="middle" fill={NEON.textMuted} fontFamily="Rajdhani" fontSize="9" letterSpacing="2">
          SCORE
        </text>
      </svg>
    </div>
  );
};
