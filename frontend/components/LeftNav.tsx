import React from 'react';
import { NEON, FONTS, GRADIENT_BORDER } from '../theme';
import { MODULE_AGENTS } from '../module-catalog';
import { useSovereign } from '../context/SovereignContext';
import { scoreFromFindings, statusColor, worstStatus } from '../utils/briefing';

export type AppSection = 'dashboard' | 'architect' | 'report' | 'module';

export const LeftNav: React.FC<{
  section: AppSection;
  activeModule: string | null;
  onSection: (s: AppSection) => void;
  onModule: (id: string) => void;
}> = ({ section, activeModule, onSection, onModule }) => {
  const { modules, dossier } = useSovereign();
  const items = [
    { id: 'dashboard' as const, icon: '⬡', label: 'DASHBOARD' },
    { id: 'architect' as const, icon: '◈', label: 'ARCHITECT AI' },
    { id: 'report' as const, icon: '⊟', label: 'DIFF REPORT' },
  ];

  return (
    <div
      style={{
        width: 260,
        height: '100vh',
        background: 'rgba(6,13,31,0.97)',
        borderRight: '1px solid rgba(0,212,255,0.12)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${NEON.blue}44, transparent)`,
          animation: 'scan-line 4s linear infinite',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />

      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(0,212,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg viewBox="0 0 32 32" width="28" style={{ flexShrink: 0, filter: `drop-shadow(0 0 6px ${NEON.blue})` }}>
            <polygon points="16,2 30,10 30,22 16,30 2,22 2,10" fill="none" stroke={NEON.blue} strokeWidth="1.5" />
            <polygon points="16,8 24,12 24,20 16,24 8,20 8,12" fill="none" stroke={NEON.magenta} strokeWidth="0.8" opacity="0.7" />
            <text x="16" y="20" textAnchor="middle" fill={NEON.blue} fontFamily="Orbitron" fontSize="8" fontWeight="900">
              AI
            </text>
          </svg>
          <div>
            <div style={{ fontFamily: FONTS.orbitron, fontSize: '0.7rem', fontWeight: 700, color: NEON.blue, letterSpacing: '0.1em' }}>
              ARCHITECT AI
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: '0.55rem', color: NEON.textMuted, letterSpacing: '0.1em' }}>
              AGAPE SOVEREIGN 2026
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <div style={countBox(NEON.magenta)}>
            <div style={{ color: NEON.magenta, fontFamily: FONTS.orbitron, fontSize: '0.85rem', fontWeight: 700 }}>{dossier.nuked}</div>
            <div style={{ color: NEON.textMuted, fontSize: '0.58rem', letterSpacing: '0.1em' }}>NUKED</div>
          </div>
          <div style={countBox(NEON.blue)}>
            <div style={{ color: NEON.blue, fontFamily: FONTS.orbitron, fontSize: '0.85rem', fontWeight: 700 }}>{dossier.knoxed}</div>
            <div style={{ color: NEON.textMuted, fontSize: '0.58rem', letterSpacing: '0.1em' }}>KNOXED</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 8px 4px' }}>
        {items.map((s) => {
          const active = section === s.id && !activeModule;
          return (
            <div
              key={s.id}
              className={`nav-item ${active ? 'active' : ''}`}
              onClick={() => onSection(s.id)}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                marginBottom: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                borderLeft: active ? `2px solid ${NEON.blue}` : '2px solid transparent',
              }}
            >
              <span style={{ color: NEON.blue, fontSize: '1rem', width: 20 }}>{s.icon}</span>
              <span
                style={{
                  fontFamily: FONTS.orbitron,
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: active ? NEON.blue : NEON.text,
                  letterSpacing: '0.08em',
                }}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ margin: '8px 16px', height: 1, background: GRADIENT_BORDER, opacity: 0.3 }} />

      <div style={{ padding: '6px 16px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: FONTS.mono, fontSize: '0.6rem', color: NEON.orange, letterSpacing: '0.15em' }}>DIFF MODULES</span>
        <div style={{ flex: 1, height: 1, background: `${NEON.orange}44` }} />
        <span style={{ fontFamily: FONTS.mono, fontSize: '0.6rem', color: NEON.orange }}>16</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }}>
        {MODULE_AGENTS.map((m) => {
          const row = modules[m.id];
          const findings = row?.findings || [];
          const sev = scoreFromFindings(findings);
          const status = worstStatus(findings);
          const sevColor = statusColor(status === 'EMPTY' ? 'KNOXED' : status);
          const isActive = activeModule === m.id;
          const nuked = findings.filter((f) => f.status === 'NUKED').length;
          const knoxed = findings.filter((f) => f.status === 'KNOXED').length;
          return (
            <div
              key={m.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onModule(m.id)}
              style={{
                padding: '8px 10px',
                borderRadius: 6,
                marginBottom: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderLeft: isActive ? `2px solid ${sevColor}` : '2px solid transparent',
                background: isActive ? `${sevColor}14` : 'transparent',
              }}
            >
              <span style={{ color: sevColor, fontSize: '0.85rem', width: 16, textAlign: 'center', flexShrink: 0 }}>{m.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: FONTS.rajdhani,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: isActive ? sevColor : NEON.text,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {m.name}
                </div>
                <div style={{ fontFamily: FONTS.mono, fontSize: '0.55rem', color: NEON.textMuted }}>
                  {m.vector} · {nuked}🔥 {knoxed}🛡️
                </div>
              </div>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: `1.5px solid ${sevColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontFamily: FONTS.orbitron, fontSize: '0.5rem', color: sevColor, fontWeight: 700 }}>{sev}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const countBox = (color: string): React.CSSProperties => ({
  flex: 1,
  background: `${color}18`,
  borderRadius: 6,
  padding: '4px 8px',
  textAlign: 'center',
  border: `1px solid ${color}33`,
});
