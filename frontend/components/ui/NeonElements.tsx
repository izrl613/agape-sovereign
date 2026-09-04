import React from 'react';
import { NEON } from '../../constants';

export const NeonText: React.FC<{ children: React.ReactNode, color?: string, size?: string, weight?: number, className?: string }> = ({ 
  children, color = NEON.blue, size = "1rem", weight = 700, className = "" 
}) => (
  <span 
    className={`font-['Orbitron'] tracking-wider ${className}`}
    style={{ color, fontSize: size, fontWeight: weight, textShadow: `0 0 10px ${color}66` }}
  >
    {children}
  </span>
);

export const GlassCard: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void, style?: React.CSSProperties }> = ({ 
  children, className = "", onClick, style = {} 
}) => (
  <div 
    className={`neon-border rounded-xl relative backdrop-blur-xl ${className}`} 
    onClick={onClick} 
    style={{ background: NEON.bgCard, border: "1px solid rgba(0,212,255,0.15)", ...style }}
  >
    {children}
  </div>
);

export const NeonButton: React.FC<{ children: React.ReactNode, onClick?: () => void, color?: string, disabled?: boolean, size?: "sm" | "md" | "lg", className?: string, style?: React.CSSProperties }> = ({ 
  children, onClick, color = NEON.blue, disabled = false, size = "md", className = "", style = {} 
}) => {
  const pad = size === "sm" ? "px-4 py-2" : size === "lg" ? "px-8 py-3" : "px-6 py-2.5";
  const fs = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";
  const bgOpacity = color === NEON.blue ? "rgba(0,212,255,0.1)" : color === NEON.magenta ? "rgba(255,46,159,0.1)" : "rgba(255,122,24,0.1)";
  
  return (
    <button 
      className={`btn-neon neon-border rounded-lg font-['Orbitron'] font-semibold tracking-widest ${pad} ${fs} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      onClick={disabled ? undefined : onClick} 
      disabled={disabled} 
      style={{ background: bgOpacity, color, ...style }}
    >
      {children}
    </button>
  );
};

export const StatusBadge: React.FC<{ type: "NUKED" | "KNOXED" | "MONITORED" | "SCANNING" }> = ({ type }) => {
  const cfg = {
    NUKED: { color: NEON.magenta, bg: "rgba(255,46,159,0.12)", label: "🔥 NUKED" },
    KNOXED: { color: NEON.blue, bg: "rgba(0,212,255,0.12)", label: "🛡️ KNOXED" },
    MONITORED: { color: NEON.orange, bg: "rgba(255,122,24,0.12)", label: "👁️ MONITORED" },
    SCANNING: { color: "#FFD700", bg: "rgba(255,215,0,0.12)", label: "⟳ SCANNING" },
  };
  const c = cfg[type] || cfg.MONITORED;
  return (
    <span 
      className="px-3 py-1 rounded-full text-[0.7rem] font-bold font-['Orbitron'] border"
      style={{ background: c.bg, color: c.color, borderColor: `${c.color}44` }}
    >
      {c.label}
    </span>
  );
};

export const SovereignScore: React.FC<{ score: number }> = ({ score }) => {
  const r = 52, cx = 64, cy = 64;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  const color = score > 75 ? NEON.blue : score > 50 ? NEON.orange : NEON.magenta;
  
  return (
    <div className="text-center relative">
      <svg width="128" height="128" className="score-ring" style={{ filter: `drop-shadow(0 0 12px ${color})` }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${pct * circ} ${circ}`} strokeDashoffset={circ * 0.25}
          strokeLinecap="round" className="transition-all duration-1000 ease-out" />
        <text x={cx} y={cy - 6} textAnchor="middle" fill={color} className="font-['Orbitron'] text-2xl font-black">{score}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill={NEON.textMuted} className="font-['Rajdhani'] text-[9px] tracking-widest">SOVEREIGN</text>
        <text x={cx} y={cy + 25} textAnchor="middle" fill={NEON.textMuted} className="font-['Rajdhani'] text-[9px] tracking-widest">SCORE</text>
      </svg>
    </div>
  );
};
