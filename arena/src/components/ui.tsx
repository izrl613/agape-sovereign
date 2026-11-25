import type { ReactNode, CSSProperties, MouseEventHandler, Key } from 'react';
import { Flame, ShieldCheck, Eye, RefreshCw } from 'lucide-react';
import { NEON, type FindingStatus } from '../data/sovereignData';

export function GlassCard({
  children,
  className = '',
  style = {},
  onClick,
}: {
  key?: Key;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: MouseEventHandler<HTMLDivElement>;
}) {
  return (
    <div
      onClick={onClick}
      className={`neon-border rounded-xl border border-[#00D4FF]/20 backdrop-blur-xl ${className}`}
      style={{ background: NEON.bgCard, ...style }}
    >
      {children}
    </div>
  );
}

export function NeonButton({
  children,
  onClick,
  color = NEON.blue,
  disabled = false,
  size = 'md',
  className = '',
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  color?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit';
}) {
  const sizeClass =
    size === 'sm'
      ? 'px-3.5 py-1.5 text-xs'
      : size === 'lg'
      ? 'px-7 py-3.5 text-sm'
      : 'px-5 py-2.5 text-xs';

  const bgRgba =
    color === NEON.magenta
      ? 'rgba(255,46,159,0.12)'
      : color === NEON.orange
      ? 'rgba(255,122,24,0.12)'
      : 'rgba(0,212,255,0.12)';

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`neon-border font-orbitron inline-flex items-center justify-center gap-2 rounded-lg font-semibold tracking-wider transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${sizeClass} ${className}`}
      style={{ background: bgRgba, color, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      {children}
    </button>
  );
}

export function StatusBadge({ type }: { type: FindingStatus | 'SCANNING' }) {
  const cfg = {
    NUKED: {
      color: NEON.magenta,
      bg: 'rgba(255,46,159,0.14)',
      label: 'NUKED',
      Icon: Flame,
    },
    KNOXED: {
      color: NEON.blue,
      bg: 'rgba(0,212,255,0.14)',
      label: 'KNOXED',
      Icon: ShieldCheck,
    },
    MONITORED: {
      color: NEON.orange,
      bg: 'rgba(255,122,24,0.14)',
      label: 'MONITORED',
      Icon: Eye,
    },
    SCANNING: {
      color: '#FFD700',
      bg: 'rgba(255,215,0,0.14)',
      label: 'SCANNING',
      Icon: RefreshCw,
    },
  }[type];

  const Icon = cfg.Icon;

  return (
    <span
      className="font-orbitron inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider"
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.color}44`,
      }}
    >
      <Icon className={`h-3 w-3 ${type === 'SCANNING' ? 'animate-spin' : ''}`} />
      {cfg.label}
    </span>
  );
}

export function SovereignScoreRing({ score, label = 'SOVEREIGN' }: { score: number; label?: string }) {
  const r = 52;
  const cx = 64;
  const cy = 64;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const color = score >= 75 ? NEON.blue : score >= 55 ? NEON.orange : NEON.magenta;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width="128"
        height="128"
        style={{ filter: `drop-shadow(0 0 12px ${color}88)` }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="8"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${pct * circ} ${circ}`}
          strokeDashoffset={circ * 0.25}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.9s ease' }}
        />
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fill={color}
          className="font-orbitron"
          fontSize="24"
          fontWeight="900"
        >
          {score}
        </text>
        <text
          x={cx}
          y={cy + 15}
          textAnchor="middle"
          fill={NEON.textMuted}
          className="font-rajdhani"
          fontSize="9"
          letterSpacing="2"
        >
          {label}
        </text>
        <text
          x={cx}
          y={cy + 26}
          textAnchor="middle"
          fill={NEON.textMuted}
          className="font-rajdhani"
          fontSize="9"
          letterSpacing="2"
        >
          SCORE
        </text>
      </svg>
    </div>
  );
}
