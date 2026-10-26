import React from 'react';
import { NEON } from '../theme';
import { MODULE_CONFIGS } from '../module-config';
import type { AppView } from '../App';

interface Props {
  activeView: AppView;
  activeModule: string | null;
  collectedVectors: string[];
  onNavigate: (view: AppView) => void;
  onSelectModule: (moduleId: string) => void;
}

export const LeftNav: React.FC<Props> = ({ activeView, activeModule, collectedVectors, onNavigate, onSelectModule }) => {
  const sections: { id: AppView; icon: string; label: string }[] = [
    { id: 'DASHBOARD', icon: '⬡', label: 'DASHBOARD' },
    { id: 'ARCHITECT', icon: '◈', label: 'ARCHITECT AI' },
    { id: 'REPORT', icon: '⊟', label: '26-MONTH AUDIT' },
  ];
  const modules = Object.values(MODULE_CONFIGS);

  const item = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'left',
    padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
    background: active ? 'rgba(0,212,255,0.1)' : 'transparent',
    border: `1px solid ${active ? 'rgba(0,212,255,0.35)' : 'transparent'}`,
    color: active ? NEON.blue : NEON.textMuted,
    fontFamily: "'Rajdhani', sans-serif", fontSize: '0.78rem', fontWeight: 600,
  });

  return (
    <nav aria-label="Primary" style={{
      width: 248, flexShrink: 0, background: 'rgba(6,13,31,0.9)', borderRight: '1px solid rgba(0,212,255,0.1)',
      padding: '18px 12px 90px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      {sections.map((s) => (
        <button key={s.id} type="button" style={{ ...item(activeView === s.id), fontFamily: "'Orbitron', monospace", fontSize: '0.68rem', letterSpacing: '0.08em' }} onClick={() => onNavigate(s.id)}>
          <span>{s.icon}</span> {s.label}
        </button>
      ))}

      <div style={{ margin: '16px 4px 8px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', letterSpacing: '0.14em', color: NEON.orange }}>
        16 IDENTITY VECTORS · {collectedVectors.length}/16 SEALED
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', margin: '0 4px 10px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(collectedVectors.length / 16) * 100}%`, background: NEON.green, boxShadow: `0 0 8px ${NEON.green}`, transition: 'width .6s ease' }} />
      </div>

      {modules.map((m, i) => {
        const sealed = collectedVectors.includes(m.id);
        return (
          <button key={m.id} type="button" style={item(activeView === 'MODULE' && activeModule === m.id)} onClick={() => onSelectModule(m.id)}>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', color: NEON.textMuted, width: 20 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span style={{ flex: 1 }}>{m.name}</span>
            <span
              title={sealed ? 'Sealed — SHA-256 receipt issued by its Module Agent' : 'Not sealed yet'}
              style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: sealed ? NEON.green : 'rgba(255,255,255,0.18)',
                boxShadow: sealed ? `0 0 8px ${NEON.green}` : 'none',
              }}
            />
          </button>
        );
      })}
    </nav>
  );
};
