import React from 'react';
import { NEON, NeonText, GlassCard } from '../UI';
import { DIFF_MODULES } from '../lib/diffModules';

interface IdentityModulesViewProps {
  onModuleClick: (id: string) => void;
}

export const IdentityModulesView: React.FC<IdentityModulesViewProps> = ({ onModuleClick }) => {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24, animation: 'fade-in 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,212,255,0.1)', border: `1px solid ${NEON.blue}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: NEON.blue, fontWeight: 'bold' }}>16</span>
          </div>
          <NeonText color={NEON.blue} size="1.4rem" weight={900}>UNIQUE IDENTITY MODULES</NeonText>
        </div>
        <div style={{ flex: 1, height: 1, background: `${NEON.blue}33` }} />
        <div style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.65rem', color: NEON.textMuted, letterSpacing: '0.1em' }}>
          AGENT PROCESSING · ENCRYPTED · VERIFIED · YOURS
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {DIFF_MODULES.map((m, index) => (
          <GlassCard
            key={m.id}
            onClick={() => onModuleClick(m.id)}
            style={{ padding: '20px', cursor: 'pointer', border: '1px solid rgba(0,212,255,0.15)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: "'Orbitron'", fontSize: '0.8rem', color: NEON.blue, opacity: 0.6 }}>
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                <span style={{ fontSize: '1.4rem' }}>{m.icon}</span>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: NEON.blue, boxShadow: `0 0 8px ${NEON.blue}` }} />
            </div>

            <div style={{ fontFamily: "'Orbitron'", fontSize: '0.9rem', fontWeight: 700, color: NEON.text, marginBottom: 6 }}>
              {m.label}
            </div>

            <div style={{ fontFamily: "'Rajdhani'", fontSize: '0.75rem', color: NEON.textMuted, lineHeight: 1.4, marginBottom: 16 }}>
              {m.description}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.6rem', color: NEON.blue, letterSpacing: '0.1em' }}>
                Processing...
              </span>
              <div style={{ display: 'flex', gap: 3 }}>
                <div className="thinking-dot" />
                <div className="thinking-dot" style={{ animationDelay: '0.2s' }} />
                <div className="thinking-dot" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};
