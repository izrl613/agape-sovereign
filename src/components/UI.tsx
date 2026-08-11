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

// ── Enriched Module Primitives ──────────────────────────────────────────────

export const DataTag: React.FC<{ icon: React.ReactNode, label: string, color?: string }> = ({ icon, label, color = NEON.magenta }) => (
  <div style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 6,
    background: `rgba(255,255,255,0.03)`,
    border: `1px solid ${color}33`,
    color: '#E8F4FF',
    fontFamily: "'Share Tech Mono'",
    fontSize: '0.7rem'
  }}>
    <span style={{ color }}>{icon}</span>
    {label}
  </div>
);

export const ProgressTimeline: React.FC<{ steps: { label: string, status: 'complete' | 'active' | 'pending' }[] }> = ({ steps }) => (
  <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 4, marginTop: 16 }}>
    {steps.map((step, idx) => {
      const isComplete = step.status === 'complete';
      const isActive = step.status === 'active';
      const color = isComplete ? NEON.blue : isActive ? NEON.orange : 'rgba(255,255,255,0.2)';
      
      return (
        <React.Fragment key={idx}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
            <div style={{
              width: 12, height: 12, borderRadius: '50%',
              background: isComplete ? color : 'transparent',
              border: `2px solid ${color}`,
              boxShadow: isComplete || isActive ? `0 0 8px ${color}` : 'none'
            }} />
            <span style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.6rem', color: isActive || isComplete ? NEON.text : NEON.textMuted, textAlign: 'center' }}>
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div style={{ flex: 2, height: 2, background: 'rgba(255,255,255,0.1)', margin: '0 4px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, bottom: 0,
                width: isComplete ? '100%' : '0%',
                background: NEON.blue,
                transition: 'width 0.5s ease'
              }} />
            </div>
          )}
        </React.Fragment>
      );
    })}
  </div>
);

export const AutomationCard: React.FC<{
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  status: 'idle' | 'running' | 'complete';
  icon?: React.ReactNode;
}> = ({ title, description, actionLabel, onAction, status, icon }) => {
  return (
    <GlassCard style={{ padding: 16, borderLeft: `3px solid ${NEON.blue}`, marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {icon && <div style={{ color: NEON.blue, marginTop: 2 }}>{icon}</div>}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Rajdhani'", fontSize: '0.9rem', fontWeight: 600, color: NEON.text }}>{title}</div>
          <div style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.7rem', color: NEON.textMuted, marginTop: 4, marginBottom: 12 }}>
            {description}
          </div>
          
          {status === 'running' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="animate-spin" style={{ width: 14, height: 14, border: `2px solid ${NEON.orange}`, borderTopColor: 'transparent', borderRadius: '50%' }} />
              <span style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.7rem', color: NEON.orange }}>ARCHITECT AI IS RESOLVING THIS VECTOR...</span>
            </div>
          ) : status === 'complete' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: NEON.blue, fontFamily: "'Share Tech Mono'", fontSize: '0.7rem' }}>
              <span>✓</span> VECTOR SECURED
            </div>
          ) : (
            <NeonButton size="sm" onClick={onAction} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {actionLabel}
            </NeonButton>
          )}
        </div>
      </div>
    </GlassCard>
  );
};
