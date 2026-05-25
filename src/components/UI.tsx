import React from 'react';

export const NEON = {
  magenta: "#FF2E9F",
  blue: "#00D4FF",
  orange: "#FF7A18",
  bg: "#060D1F",
  bgCard: "rgba(8, 18, 40, 0.85)",
  bgGlass: "rgba(0, 212, 255, 0.04)",
  text: "#E8F4FF",
  textMuted: "#7B9BB5",
};

export const NeonText: React.FC<{ 
  children: React.ReactNode, 
  color?: string, 
  size?: string, 
  weight?: number, 
  style?: React.CSSProperties,
  className?: string
}> = ({ 
  children, 
  color = NEON.blue, 
  size = "1rem", 
  weight = 700, 
  style = {},
  className = ""
}) => (
  <span className={className} style={{ fontFamily: "'Orbitron', monospace", color, fontSize: size, fontWeight: weight, textShadow: `0 0 10px ${color}66`, letterSpacing: "0.05em", ...style }}>
    {children}
  </span>
);

export const GlassCard: React.FC<{ children: React.ReactNode, style?: React.CSSProperties, className?: string, onClick?: () => void }> = ({ 
  children, 
  style = {}, 
  className = "", 
  onClick 
}) => (
  <div className={`neon-border ${className}`} onClick={onClick} style={{
    background: NEON.bgCard, backdropFilter: "blur(20px)", borderRadius: 12,
    border: "1px solid rgba(0,212,255,0.15)", position: "relative", ...style
  }}>
    {children}
  </div>
);

export const NeonButton: React.FC<{ 
  children: React.ReactNode, 
  onClick?: (e: React.MouseEvent) => void, 
  color?: string, 
  style?: React.CSSProperties, 
  disabled?: boolean, 
  size?: "sm" | "md" | "lg",
  type?: "button" | "submit" | "reset",
  className?: string
}> = ({ 
  children, 
  onClick, 
  color = NEON.blue, 
  style = {}, 
  disabled = false, 
  size = "md",
  type = "button",
  className = ""
}) => {
  const pad = size === "sm" ? "8px 18px" : size === "lg" ? "14px 32px" : "10px 24px";
  const fs = size === "sm" ? "0.75rem" : size === "lg" ? "1rem" : "0.85rem";
  return (
    <button 
      type={type}
      className={`btn-neon neon-border ${className}`} 
      onClick={disabled ? undefined : onClick} 
      disabled={disabled} 
      style={{
        padding: pad, borderRadius: 8, background: `rgba(${color === NEON.blue ? "0,212,255" : color === NEON.magenta ? "255,46,159" : "255,122,24"},0.1)`,
        color, fontFamily: "'Orbitron', monospace", fontSize: fs, fontWeight: 600, letterSpacing: "0.08em",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, ...style
      }}
    >
      {children}
    </button>
  );
};

export const StatusBadge: React.FC<{ type: 'NUKED' | 'KNOXED' | 'MONITORED' | 'SCANNING' }> = ({ type }) => {
  const cfg = {
    NUKED: { color: NEON.magenta, bg: "rgba(255,46,159,0.12)", label: "🔥 NUKED" },
    KNOXED: { color: NEON.blue, bg: "rgba(0,212,255,0.12)", label: "🛡️ KNOXED" },
    MONITORED: { color: NEON.orange, bg: "rgba(255,122,24,0.12)", label: "👁️ MONITORED" },
    SCANNING: { color: "#FFD700", bg: "rgba(255,215,0,0.12)", label: "⟳ SCANNING" },
  };
  const c = cfg[type] || cfg.MONITORED;
  return (
    <span style={{ background: c.bg, color: c.color, padding: "3px 10px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 700, fontFamily: "'Orbitron', monospace", border: `1px solid ${c.color}44` }}>
      {c.label}
    </span>
  );
};

export const Skeleton: React.FC<{ width?: string | number, height?: string | number, borderRadius?: string | number, style?: React.CSSProperties }> = ({ 
  width = "100%", 
  height = "1rem", 
  borderRadius = 4, 
  style = {} 
}) => (
  <div 
    className="animate-pulse" 
    style={{ 
      width, 
      height, 
      borderRadius, 
      background: "rgba(255,255,255,0.05)", 
      ...style 
    }} 
  />
);

export const SovereignScore: React.FC<{ score: number }> = ({ score }) => {
  const r = 52, cx = 64, cy = 64;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  const color = score > 75 ? NEON.blue : score > 50 ? NEON.orange : NEON.magenta;
  
  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      <svg width="128" height="128" className="score-ring" style={{ filter: `drop-shadow(0 0 12px ${color})` }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${pct * circ} ${circ}`} strokeDashoffset={circ * 0.25}
          strokeLinecap="round" style={{ transition: "all 1s ease-out" }} />
        <text x={cx} y={cy - 6} textAnchor="middle" fill={color} fontFamily="Orbitron" fontSize="24" fontWeight="900">{score}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill={NEON.textMuted} fontFamily="Rajdhani" fontSize="9" letterSpacing="0.2em">SOVEREIGN</text>
        <text x={cx} y={cy + 25} textAnchor="middle" fill={NEON.textMuted} fontFamily="Rajdhani" fontSize="9" letterSpacing="0.2em">SCORE</text>
      </svg>
    </div>
  );
};
