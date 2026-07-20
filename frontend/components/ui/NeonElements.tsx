import React from 'react';
import { NEON, GRADIENT_BORDER } from '../../constants';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', style = {} }) => (
  <div
    className={`relative rounded-2xl overflow-hidden ${className}`}
    style={{
      background: 'rgba(8, 18, 40, 0.85)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(0, 212, 255, 0.1)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      ...style
    }}
  >
    {children}
  </div>
);

interface NeonTextProps {
  children: React.ReactNode;
  color?: string;
  size?: string;
  weight?: number;
  className?: string;
}

export const NeonText: React.FC<NeonTextProps> = ({ 
  children, 
  color = NEON.blue, 
  size = '1.5rem', 
  weight = 900,
  className = '' 
}) => (
  <span
    className={`font-['Orbitron'] ${className}`}
    style={{
      fontSize: size,
      fontWeight: weight,
      color,
      textShadow: `0 0 8px ${color}, 0 0 16px ${color}66, 0 0 24px ${color}33`,
    }}
  >
    {children}
  </span>
);

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const NeonButton: React.FC<NeonButtonProps> = ({ 
  children, 
  color = NEON.blue, 
  size = 'md', 
  className = '',
  disabled,
  ...props 
}) => {
  const padding = size === 'sm' ? 'py-2 px-4 text-sm' : size === 'lg' ? 'py-4 px-8 text-base' : 'py-3 px-6 text-sm';
  
  return (
    <button
      className={`relative overflow-hidden font-semibold font-['Orbitron'] transition-all ${padding} ${className}`}
      style={{
        background: `linear-gradient(135deg, ${color} 0%, ${color}DD 100%)`,
        color: NEON.bg,
        boxShadow: `0 0 20px ${color}66, 0 0 40px ${color}33`,
        border: 'none',
        ...(disabled && { opacity: 0.5, cursor: 'not-allowed' })
      }}
      disabled={disabled}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <span 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full transition-transform duration-500"
        style={{ transform: 'skewX(-15deg)' }}
      />
    </button>
  );
};

export const NeonInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({
  label,
  className = '',
  style = {},
  ...props
}) => (
  <div className={className}>
    {label && <label className="block text-xs font-['Share_Tech_Mono'] tracking-wide mb-1" style={{ color: NEON.textMuted }}>{label}</label>}
    <input
      {...props}
      className={`w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#00D4FF]/50 transition-all font-mono text-sm ${props.className || ''}`}
      style={{
        background: 'rgba(255,255,255,0.05)',
        borderColor: 'rgba(255,255,255,0.1)',
        color: NEON.text,
        caretColor: NEON.blue,
        ...style
      }}
    />
  </div>
);

export const NeonSeparator: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-[1px] rounded-sm ${className}`} style={{ background: GRADIENT_BORDER }} />
);

export const PulseRing: React.FC<{ color?: string; size?: number; className?: string }> = ({
  color = NEON.blue,
  size = 48,
  className = ''
}) => (
  <div 
    className={className} 
    style={{ width: size, height: size }}
  >
    <div className="absolute inset-0 rounded-full" style={{ 
      border: `2px solid ${color}`,
      animation: 'pulse-ring 2s ease-out infinite',
      opacity: 0.6
    }} />
    <div className="absolute inset-0 rounded-full" style={{ 
      border: `2px solid ${color}`,
      animation: 'pulse-ring 2s ease-out infinite 1s',
      opacity: 0.3
    }} />
    <style jsx>{`
      @keyframes pulse-ring {
        0% { transform: scale(0.8); opacity: 0.6; }
        100% { transform: scale(1.4); opacity: 0; }
      }
    `}</style>
  </div>
);

export const GridBackground: React.FC<{ opacity?: number }> = ({ opacity = 0.1 }) => (
  <div 
    className="fixed inset-0 pointer-events-none"
    style={{ 
      backgroundImage: `linear-gradient(rgba(0,212,255,${opacity * 0.4}) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,${opacity * 0.4}) 1px, transparent 1px)`,
      backgroundSize: "40px 40px",
      animation: "grid-move 20s linear infinite"
    }}
  >
    <style jsx>{`
      @keyframes grid-move {
        0% { transform: translate(0, 0); }
        100% { transform: translate(40px, 40px); }
      }
    `}</style>
  </div>
);

export const RadialGlow: React.FC<{ position: string; color?: string; size?: number; opacity?: number }> = ({ 
  position, 
  color = NEON.blue, 
  size = 400,
  opacity = 0.04 
}) => (
  <div 
    className="fixed pointer-events-none"
    style={{ 
      position,
      width: size, 
      height: size,
      background: `radial-gradient(circle, ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`
    }} 
  />
);