import React from 'react';

// Core colors for a futuristic, Google-like security dashboard
export const NEON = {
  magenta: "#FF2E9F",
  blue: "#00D4FF",
  orange: "#FF7A18",
  bg: "#040914", // Deep, clean dark background
  bgCard: "rgba(10, 15, 30, 0.9)", // slightly less translucent, solid Google-like panels
  bgGlass: "rgba(255, 255, 255, 0.03)",
  text: "#F1F5F9",
  textMuted: "#94A3B8",
  border: "rgba(255, 255, 255, 0.08)",
  success: "#10B981", // Bitdefender-style green
  error: "#EF4444",
  warning: "#F59E0B"
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
  weight = 600, 
  style = {},
  className = ""
}) => (
  <span className={className} style={{ fontFamily: "'Inter', sans-serif", color, fontSize: size, fontWeight: weight, textShadow: `0 0 15px ${color}40`, ...style }}>
    {children}
  </span>
);

export const GlassCard: React.FC<{ children: React.ReactNode, style?: React.CSSProperties, className?: string, onClick?: () => void }> = ({ 
  children, 
  style = {}, 
  className = "", 
  onClick 
}) => (
  <div className={`transition-all duration-300 ${onClick ? 'cursor-pointer hover:border-[#00D4FF]/40' : ''} ${className}`} onClick={onClick} style={{
    background: NEON.bgCard, backdropFilter: "blur(24px)", borderRadius: 16,
    border: `1px solid ${NEON.border}`, position: "relative", boxShadow: "0 4px 24px -4px rgba(0,0,0,0.5)", ...style
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
  const pad = size === "sm" ? "6px 14px" : size === "lg" ? "12px 28px" : "8px 20px";
  const fs = size === "sm" ? "0.75rem" : size === "lg" ? "1rem" : "0.875rem";
  const isPrimary = color === NEON.blue;
  
  return (
    <button 
      type={type}
      className={`relative overflow-hidden transition-all duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'} ${className}`} 
      onClick={disabled ? undefined : onClick} 
      disabled={disabled} 
      style={{
        padding: pad, borderRadius: 8, 
        background: isPrimary ? `rgba(0,212,255,0.1)` : 'transparent',
        border: `1px solid ${isPrimary ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
        color: isPrimary ? NEON.blue : NEON.text, 
        fontFamily: "'Inter', sans-serif", fontSize: fs, fontWeight: 500,
        ...style
      }}
    >
      {children}
    </button>
  );
};

export const StatusBadge: React.FC<{ type: 'NUKED' | 'KNOXED' | 'MONITORED' | 'SCANNING' }> = ({ type }) => {
  const cfg = {
    NUKED: { color: NEON.error, bg: "rgba(239, 68, 68, 0.1)", label: "CRITICAL", icon: "⚠" },
    KNOXED: { color: NEON.success, bg: "rgba(16, 185, 129, 0.1)", label: "SECURE", icon: "✓" },
    MONITORED: { color: NEON.warning, bg: "rgba(245, 158, 11, 0.1)", label: "MONITORED", icon: "◎" },
    SCANNING: { color: NEON.blue, bg: "rgba(0, 212, 255, 0.1)", label: "SCANNING", icon: "⟳" },
  };
  const c = cfg[type] || cfg.MONITORED;
  return (
    <span style={{ background: c.bg, color: c.color, padding: "4px 12px", borderRadius: 24, fontSize: "0.75rem", fontWeight: 600, fontFamily: "'Inter', sans-serif", border: `1px solid ${c.color}30`, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span className={type === 'SCANNING' ? 'animate-spin' : ''}>{c.icon}</span> {c.label}
    </span>
  );
};

export const Skeleton: React.FC<{ width?: string | number, height?: string | number, borderRadius?: string | number, style?: React.CSSProperties }> = ({ 
  width = "100%", 
  height = "1rem", 
  borderRadius = 6, 
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

// ── Enriched Module Primitives (Firefox Monitor & Optery style) ──────────────

export const DataTag: React.FC<{ icon: React.ReactNode, label: string, color?: string }> = ({ icon, label, color = NEON.textMuted }) => (
  <div style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 12px',
    borderRadius: 8,
    background: `rgba(255,255,255,0.02)`,
    border: `1px solid rgba(255,255,255,0.05)`,
    color: '#E2E8F0',
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.75rem',
    fontWeight: 500
  }}>
    <span style={{ color, opacity: 0.8 }}>{icon}</span>
    {label}
  </div>
);

export const ProgressTimeline: React.FC<{ steps: { label: string, status: 'complete' | 'active' | 'pending' }[] }> = ({ steps }) => (
  <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 4, marginTop: 24 }}>
    {steps.map((step, idx) => {
      const isComplete = step.status === 'complete';
      const isActive = step.status === 'active';
      const color = isComplete ? NEON.success : isActive ? NEON.blue : 'rgba(255,255,255,0.1)';
      
      return (
        <React.Fragment key={idx}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
            <div style={{
              width: 14, height: 14, borderRadius: '50%',
              background: isComplete ? color : 'transparent',
              border: `2px solid ${color}`,
              boxShadow: isComplete || isActive ? `0 0 12px ${color}40` : 'none',
              transition: 'all 0.3s ease'
            }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.65rem', fontWeight: 500, color: isActive || isComplete ? NEON.text : NEON.textMuted, textAlign: 'center', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div style={{ flex: 2, height: 2, background: 'rgba(255,255,255,0.05)', margin: '0 4px', marginBottom: 20, position: 'relative', overflow: 'hidden', borderRadius: 2 }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, bottom: 0,
                width: isComplete ? '100%' : '0%',
                background: NEON.success,
                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
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
    <GlassCard style={{ padding: 20, borderLeft: `4px solid ${status === 'complete' ? NEON.success : status === 'running' ? NEON.blue : NEON.border}`, marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        {icon && <div style={{ color: status === 'complete' ? NEON.success : NEON.textMuted, marginTop: 2 }}>{icon}</div>}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.95rem', fontWeight: 600, color: NEON.text, letterSpacing: '-0.01em' }}>{title}</div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8rem', color: NEON.textMuted, marginTop: 6, marginBottom: 16, lineHeight: 1.5 }}>
            {description}
          </div>
          
          {status === 'running' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,212,255,0.05)', padding: '8px 16px', borderRadius: 8 }}>
              <div className="animate-spin" style={{ width: 16, height: 16, border: `2px solid ${NEON.blue}`, borderTopColor: 'transparent', borderRadius: '50%' }} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.75rem', fontWeight: 500, color: NEON.blue }}>Architect AI Resolving...</span>
            </div>
          ) : status === 'complete' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: NEON.success, fontFamily: "'Inter', sans-serif", fontSize: '0.8rem', fontWeight: 600, background: 'rgba(16,185,129,0.05)', padding: '8px 16px', borderRadius: 8 }}>
              <span>✓</span> Secured & Encrypted
            </div>
          ) : (
            <NeonButton size="sm" onClick={onAction} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.2em' }}>✦</span> {actionLabel}
            </NeonButton>
          )}
        </div>
      </div>
    </GlassCard>
  );
};
