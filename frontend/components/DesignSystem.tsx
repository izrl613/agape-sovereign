import React from 'react';
import { NEON, GRADIENT_BORDER } from '../theme';

export const NeonText = ({ children, color = NEON.blue, size = "1rem", weight = 700, style = {} }) => (
  <span style={{
    fontFamily: "'Orbitron', monospace",
    color,
    fontSize: size,
    fontWeight: weight,
    textShadow: `0 0 10px ${color}66`,
    letterSpacing: "0.05em",
    ...style
  }}>
    {children}
  </span>
);

type GlassCardProps = {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  /** Optional panel heading rendered above the children. */
  title?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
};

export const GlassCard = ({ children, style = {}, className = "", title, onClick }: GlassCardProps) => (
  <div className={`neon-border ${className}`} onClick={onClick} style={{
    background: NEON.bgCard,
    backdropFilter: "blur(20px)",
    borderRadius: 12,
    border: "1px solid rgba(0,212,255,0.15)",
    position: "relative",
    ...style
  }}>
    {title && (
      <div style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: "0.62rem",
        letterSpacing: "0.14em",
        color: NEON.orange,
        textTransform: "uppercase",
        marginBottom: 12
      }}>
        {title}
      </div>
    )}
    {children}
  </div>
);

type NeonButtonProps = {
  children?: React.ReactNode;
  onClick?: () => void;
  color?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  /** Visual emphasis; `secondary` renders the quieter outline treatment. */
  variant?: string;
};

export const NeonButton = ({ children, onClick, color = NEON.blue, style = {}, disabled = false, size = "md", variant }: NeonButtonProps) => {
  const pad = size === "sm" ? "8px 18px" : size === "lg" ? "14px 32px" : "10px 24px";
  const fs = size === "sm" ? "0.75rem" : size === "lg" ? "1rem" : "0.85rem";

  // Convert hex to rgba for background
  const rgbaColor = color === NEON.blue ? "rgba(0,212,255,0.1)" : color === NEON.magenta ? "rgba(255,46,159,0.1)" : "rgba(255,122,24,0.1)";

  return (
    <button className="btn-neon neon-border" onClick={disabled ? undefined : onClick} disabled={disabled} style={{
      padding: pad,
      borderRadius: 8,
      background: variant === "secondary" ? "rgba(255,255,255,0.03)" : rgbaColor,
      border: variant === "secondary" ? "1px solid rgba(0,212,255,0.28)" : "1px solid rgba(0,212,255,0.45)",
      color,
      fontFamily: "'Orbitron', monospace",
      fontSize: fs,
      fontWeight: 600,
      letterSpacing: "0.08em",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      ...style
    }}>
      {children}
    </button>
  );
};

export const StatusBadge = ({ type }) => {
  const cfg = {
    NUKED: { color: NEON.magenta, bg: "rgba(255,46,159,0.12)", label: "✕ NUKED" },
    KNOXED: { color: NEON.blue, bg: "rgba(0,212,255,0.12)", label: "✓ KNOXED" },
    MONITORED: { color: NEON.orange, bg: "rgba(255,122,24,0.12)", label: "◉ MONITORED" },
    SCANNING: { color: "#FFD700", bg: "rgba(255,215,0,0.12)", label: "⟳ SCANNING" },
  };
  const c = cfg[type] || cfg.MONITORED;
  return (
    <span style={{
      background: c.bg,
      color: c.color,
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: "0.7rem",
      fontWeight: 700,
      fontFamily: "'Orbitron', monospace",
      border: `1px solid ${c.color}44`
    }}>
      {c.label}
    </span>
  );
};
