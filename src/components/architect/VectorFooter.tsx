import React from 'react';
import { useScan } from '../../ScanContext';
import { DIFF_MODULES } from '../../lib/diffModules';

const NEON = {
  magenta: "#FF2E9F",
  blue: "#00D4FF",
  orange: "#FF7A18",
  bg: "#060D1F",
  text: "#E8F4FF",
  textMuted: "#7B9BB5",
};

export const VectorFooter: React.FC = () => {
  const { diffModules } = useScan();

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      background: 'rgba(0, 0, 0, 0.3)',
      borderRadius: '16px',
      border: '1px solid rgba(0, 212, 255, 0.1)',
      overflowX: 'auto',
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {DIFF_MODULES.map((m) => {
        const currentData = diffModules.find((dm: any) => dm.id === m.id || dm.vector === m.vector);
        const severity = currentData?.severity ?? m.severity;
        const sevColor = severity > 80 ? NEON.blue : severity > 60 ? NEON.orange : NEON.magenta;

        return (
          <div
            key={m.id}
            title={`${m.label} (${m.vector})`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              padding: '4px 8px',
              borderRadius: '8px',
              border: `1px solid ${sevColor}22`,
              background: `rgba(${sevColor === NEON.blue ? "0,212,255" : sevColor === NEON.magenta ? "255,46,159" : "255,122,24"}, 0.05)`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `rgba(${sevColor === NEON.blue ? "0,212,255" : sevColor === NEON.magenta ? "255,46,159" : "255,122,24"}, 0.15)`;
              e.currentTarget.style.borderColor = `${sevColor}66`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `rgba(${sevColor === NEON.blue ? "0,212,255" : sevColor === NEON.magenta ? "255,46,159" : "255,122,24"}, 0.05)`;
              e.currentTarget.style.borderColor = `${sevColor}22`;
            }}
          >
            <span style={{ color: sevColor, fontSize: '1.1rem' }}>{m.icon}</span>
            <span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.5rem', color: sevColor, fontWeight: 700 }}>{m.vector}</span>
          </div>
        );
      })}
    </div>
  );
};
