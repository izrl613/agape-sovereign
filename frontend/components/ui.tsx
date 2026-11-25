import { useEffect, useRef, type CSSProperties, type MouseEventHandler, type ReactNode } from 'react';
import { NEON } from '../theme';

export function GlassCard({
  children,
  className = '',
  style = {},
  onClick,
}: {
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
  autoFocus = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  color?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit';
  autoFocus?: boolean;
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
      : color === NEON.green
      ? 'rgba(0,255,135,0.12)'
      : 'rgba(0,212,255,0.12)';

  return (
    <button
      type={type}
      autoFocus={autoFocus}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`neon-border font-orbitron inline-flex items-center justify-center gap-2 rounded-lg font-semibold tracking-wider transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${sizeClass} ${className}`}
      style={{ background: bgRgba, color, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      {children}
    </button>
  );
}

export function SovereignScoreRing({ score, label = 'SOVEREIGN' }: { score: number; label?: string }) {
  const r = 52;
  const cx = 64;
  const cy = 64;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const color = score >= 75 ? NEON.blue : score >= 40 ? NEON.orange : NEON.magenta;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width="128"
        height="128"
        role="img"
        aria-label={`${label} score ${score} percent`}
        style={{ filter: `drop-shadow(0 0 12px ${color}88)` }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(232,244,255,0.08)"
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
          fill="#F8FAFC"
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
          fill="#00D4FF"
          className="font-rajdhani"
          fontSize="9"
          letterSpacing="2"
        >
          POSTURE
        </text>
      </svg>
    </div>
  );
}

/**
 * Native modal <dialog> wrapper with showModal(), Esc dismissal,
 * closedby="any", and pointer-position light-dismiss fallback for Safari.
 */
export function SovereignDialog({
  open,
  onClose,
  labelledBy,
  className = '',
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = '';
      onClose();
    };
    dialog.addEventListener('close', handleClose);

    // Fallback for browsers without HTMLDialogElement.prototype.closedBy (Safari)
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      let pressedOutside = false;
      const isOutside = (e: PointerEvent) => {
        const r = dialog.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      const onPointerDown = (e: PointerEvent) => {
        pressedOutside = isOutside(e);
      };
      const onPointerUp = (e: PointerEvent) => {
        if (pressedOutside && isOutside(e)) dialog.close();
      };
      dialog.addEventListener('pointerdown', onPointerDown);
      dialog.addEventListener('pointerup', onPointerUp);
      return () => {
        dialog.removeEventListener('close', handleClose);
        dialog.removeEventListener('pointerdown', onPointerDown);
        dialog.removeEventListener('pointerup', onPointerUp);
      };
    }

    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      {...({ closedby: 'any' } as Record<string, string>)}
      className={`arena-scope ${className}`}
    >
      {open ? children : null}
    </dialog>
  );
}
