import React from 'react';

const NEON = {
  magenta: "#FF2E9F",
  blue: "#00D4FF",
  orange: "#FF7A18",
  bg: "#060D1F",
  text: "#E8F4FF",
};

const NeonButton = ({ children, onClick, color = NEON.blue, style = {}, disabled = false }: any) => (
  <button
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    style={{
      flex: 1,
      padding: '16px',
      borderRadius: '12px',
      background: `rgba(${color === NEON.blue ? "0,212,255" : color === NEON.magenta ? "255,46,159" : "255,122,24"}, 0.1)`,
      color,
      fontFamily: "'Orbitron', monospace",
      fontSize: '0.85rem',
      fontWeight: 700,
      letterSpacing: '0.1em',
      border: `1px solid ${color}44`,
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.3s ease',
      opacity: disabled ? 0.5 : 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      ...style
    }}
    onMouseEnter={(e: any) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = `0 8px 20px ${color}33`;
    }}
    onMouseLeave={(e: any) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}
  >
    {children}
  </button>
);

interface ActionRowProps {
  onScan: () => void;
  onRemediate: () => void;
  onReport: () => void;
  onRecover: () => void;
  isScanning: boolean;
}

export const ActionRow: React.FC<ActionRowProps> = ({ onScan, onRemediate, onReport, onRecover, isScanning }) => {
  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <NeonButton onClick={onScan} disabled={isScanning} color={NEON.blue}>
        <span>🔍</span> SCAN
      </NeonButton>
      <NeonButton onClick={onRemediate} disabled={isScanning} color={NEON.magenta}>
        <span>🔥</span> REMEDIATE
      </NeonButton>
      <NeonButton onClick={onReport} color={NEON.orange}>
        <span>📄</span> REPORT
      </NeonButton>
      <NeonButton onClick={onRecover} color={NEON.blue}>
        <span>🛡️</span> RECOVER
      </NeonButton>
    </div>
  );
};
