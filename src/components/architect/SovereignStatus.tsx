import React from 'react';
import { useScan } from '../../ScanContext';

// Re-using the NEON tokens from ArchitectUI
const NEON = {
  magenta: "#FF2E9F",
  blue: "#00D4FF",
  orange: "#FF7A18",
  bg: "#060D1F",
  bgCard: "rgba(8, 18, 40, 0.85)",
  text: "#E8F4FF",
  textMuted: "#7B9BB5",
};

const GlassCard = ({ children, style = {}, className = "" }: any) => (
  <div className={`neon-border ${className}`} style={{
    background: NEON.bgCard, backdropFilter: "blur(20px)", borderRadius: 12,
    border: "1px solid rgba(0,212,255,0.15)", position: "relative", ...style
  }}>
    {children}
  </div>
);

const SovereignScore = ({ score }: { score: number }) => {
  const r = 60, cx = 70, cy = 70;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  const color = score > 75 ? NEON.blue : score > 50 ? NEON.orange : NEON.magenta;

  return (
    <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="140" height="140" style={{ filter: `drop-shadow(0 0 12px ${color})` }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={`${pct * circ} ${circ}`} strokeDashoffset={circ * 0.25}
          strokeLinecap="round" style={{ transition: "stroke-dasharray 1.5s ease" }} />
        <text x={cx} y={cy - 5} textAnchor="middle" fill={color} fontFamily="Orbitron" fontSize="32" fontWeight="900">{score}</text>
        <text x={cx} y={cy + 15} textAnchor="middle" fill={NEON.textMuted} fontFamily="Rajdhani" fontSize="10" letterSpacing="2">SOVEREIGN</text>
        <text x={cx} y={cy + 28} textAnchor="middle" fill={NEON.textMuted} fontFamily="Rajdhani" fontSize="10" letterSpacing="2">SCORE</text>
      </svg>
    </div>
  );
};

export const SovereignStatus: React.FC = () => {
  const { findings, diffModules } = useScan();

  const score = Math.round(diffModules.reduce((s: any, m: any) => s + m.severity, 0) / (diffModules.length || 1));
  const critical = findings.filter(f => f.status === 'NUKED').length;
  const review = findings.filter(f => f.status === 'MONITORED').length;
  const verified = findings.filter(f => f.status === 'KNOXED').length;
  const sources = 16; // Fixed as per DIFF spec

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '40px',
      padding: '20px',
      background: 'rgba(0, 212, 255, 0.03)',
      borderRadius: '24px',
      border: '1px solid rgba(0, 212, 255, 0.1)',
      animation: 'fade-in 0.5s ease'
    }}>
      <SovereignScore score={score} />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
        flex: 1
      }}>
        {[
          { label: 'Critical Exposures', value: critical, color: NEON.magenta, icon: '🔥' },
          { label: 'Require Review', value: review, color: NEON.orange, icon: '⚠️' },
          { label: 'Verified Protections', value: verified, color: NEON.blue, icon: '🛡️' },
          { label: 'Sources Monitored', value: sources, color: NEON.textMuted, icon: '👁️' },
        ].map(kpi => (
          <GlassCard key={kpi.label} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '10px', background: `rgba(${kpi.color === NEON.magenta ? "255,46,159" : kpi.color === NEON.orange ? "255,122,24" : kpi.color === NEON.blue ? "0,212,255" : "232,244,255"}, 0.1)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
              border: `1px solid ${kpi.color}33`
            }}>
              {kpi.icon}
            </div>
            <div>
              <div style={{ fontFamily: 'Share Tech Mono', fontSize: '0.7rem', color: NEON.textMuted, letterSpacing: '0.1em' }}>{kpi.label}</div>
              <div style={{ fontFamily: 'Orbitron', fontSize: '1.5rem', fontWeight: 900, color: kpi.color }}>{kpi.value}</div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};
