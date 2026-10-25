import React from 'react';
import { NEON, FONTS } from '../theme';
import { NeonText, GlassCard } from './DesignSystem';
import { MODULE_AGENTS } from '../module-catalog';
import { useSovereign } from '../context/SovereignContext';
import { buildModuleBriefing, statusColor } from '../utils/briefing';

export const ReportView: React.FC = () => {
  const { modules, dossier, user } = useSovereign();

  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%', animation: 'fade-in 0.35s ease' }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: '0.6rem', color: NEON.orange, letterSpacing: '0.18em' }}>
        IDENTITY AUDIT · 16 VECTORS
      </div>
      <NeonText color={NEON.blue} size="1.4rem" weight={900}>
        CONDENSED SOVEREIGN REPORT
      </NeonText>
      <p style={{ fontFamily: FONTS.rajdhani, color: NEON.textMuted, maxWidth: 720, margin: '8px 0 20px' }}>
        {dossier.oneLiner}. This page is the same story the splash screens tell — one plain-English card per agent, so you never have to decode a hash to know where you stand.
      </p>

      <GlassCard style={{ padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <Stat label="Score" value={String(dossier.score)} color={NEON.blue} />
          <Stat label="Nuked" value={String(dossier.nuked)} color={NEON.magenta} />
          <Stat label="Knoxed" value={String(dossier.knoxed)} color={NEON.blue} />
          <Stat label="Sealed" value={`${dossier.sealed}/16`} color={NEON.orange} />
        </div>
        <div style={{ fontFamily: FONTS.mono, fontSize: '0.62rem', color: NEON.textMuted, marginTop: 12 }}>
          Operator {user?.displayName} · {dossier.emailMasked} · {dossier.authLabel}
        </div>
      </GlassCard>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 40 }}>
        {MODULE_AGENTS.map((m) => {
          const row = modules[m.id] || { record: {}, findings: [] };
          const briefing = buildModuleBriefing(m, row.record, row.findings, user?.displayName || 'You');
          const c = statusColor(briefing.status);
          return (
            <GlassCard key={m.id} style={{ padding: 16, borderLeft: `4px solid ${c}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: '0.55rem', color: NEON.orange }}>
                    {m.vector} · {m.icon} {m.name}
                  </div>
                  <div style={{ fontFamily: FONTS.orbitron, fontSize: '0.95rem', color: c, margin: '4px 0' }}>{briefing.headline}</div>
                  <div style={{ fontFamily: FONTS.rajdhani, fontSize: '0.9rem', color: NEON.text, lineHeight: 1.45 }}>{briefing.plainEnglish}</div>
                  <div style={{ fontFamily: FONTS.rajdhani, fontSize: '0.8rem', color: NEON.blue, marginTop: 6 }}>Next: {briefing.nextAction}</div>
                </div>
                <div style={{ fontFamily: FONTS.orbitron, fontSize: '1.4rem', color: c, fontWeight: 800 }}>{briefing.score}</div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};

const Stat = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div>
    <div style={{ fontFamily: FONTS.mono, fontSize: '0.55rem', color: NEON.textMuted, letterSpacing: '0.1em' }}>{label.toUpperCase()}</div>
    <div style={{ fontFamily: FONTS.orbitron, fontSize: '1.4rem', fontWeight: 800, color }}>{value}</div>
  </div>
);
