import React, { useState, useEffect, useRef } from "react";
import {
  NEON,
  NeonText,
  GlassCard,
  NeonButton,
  StatusBadge,
} from "./UI";

export { NEON, NeonText, GlassCard, NeonButton, StatusBadge };

/**
 * CopyButton — Zero-knowledge copy-to-clipboard with animated feedback.
 * Shows a temporary "COPIED ✓" pulse then reverts.
 */
export const CopyButton: React.FC<{
  value: string;
  label?: string;
  size?: number;
  style?: React.CSSProperties;
}> = ({ value, label, size = 14, style }) => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      style={{
        background: copied ? "rgba(0,255,135,0.12)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${copied ? "rgba(0,255,135,0.3)" : "rgba(255,255,255,0.12)"}`,
        borderRadius: 6,
        padding: "4px 8px",
        color: copied ? NEON.green : NEON.textMuted,
        fontSize: "0.6rem",
        fontFamily: "'Share Tech Mono', monospace",
        letterSpacing: "0.08em",
        cursor: value ? "pointer" : "not-allowed",
        opacity: value ? 1 : 0.4,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        transition: "all 0.2s ease",
        ...style,
      }}
    >
      {copied ? (
        <>✓ COPIED</>
      ) : (
        <>
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
          </svg>
          {label}
        </>
      )}
    </button>
  );
};

/**
 * RevealText — masked value with an eye toggle to reveal/hide.
 */
export const RevealText: React.FC<{
  value: string;
  masked?: boolean;
  maskChar?: string;
  style?: React.CSSProperties;
}> = ({ value, masked = true, maskChar = "•", style }) => {
  const [show, setShow] = useState(false);
  const reveal = masked ? !show : true;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, ...style }}>
      <span style={{ fontFamily: "'Share Tech Mono', monospace", wordBreak: "break-all" }}>
        {reveal ? value : maskChar.repeat(Math.min(value.length, 24))}
      </span>
      {masked && value && (
        <button
          onClick={() => setShow(s => !s)}
          title={show ? "Hide" : "Reveal"}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: NEON.textMuted,
            display: "inline-flex",
            padding: 2,
          }}
        >
          {show ? (
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
          ) : (
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          )}
        </button>
      )}
    </div>
  );
};

/**
 * HoverCard — GlassCard with interactive lift + glow on hover.
 */
export const HoverCard: React.FC<{ children: React.ReactNode, style?: React.CSSProperties, className?: string, onClick?: () => void, accent?: string }> = ({ children, style = {}, className = "", onClick, accent = NEON.blue }) => {
  return (
    <div
      className={`hover-card neon-border ${className}`}
      onClick={onClick}
      style={{
        background: NEON.bgCard,
        backdropFilter: "blur(20px)",
        borderRadius: 12,
        border: "1px solid rgba(0,212,255,0.15)",
        position: "relative",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
        ...style,
      }}
    >
      <style>{`
        .hover-card:hover { transform: translateY(-3px); border-color: ${accent}55; box-shadow: 0 10px 30px ${accent}22; }
      `}</style>
      {children}
    </div>
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