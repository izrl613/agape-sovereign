/**
 * Agape Sovereign — neon design tokens (single source of truth).
 * Superset palette: every key referenced by any component is defined here.
 */
export const NEON = {
  blue: '#00d4ff',
  purple: '#bc13fe',
  magenta: '#ff2e9f',
  pink: '#ff2e9f',
  orange: '#ff7a18',
  green: '#00ff87',
  yellow: '#ffd700',
  bg: '#060c1a',
  bgCard: 'rgba(10, 18, 38, 0.85)',
  surface: 'rgba(255,255,255,0.03)',
  text: '#e8f4ff',
  textMuted: 'rgba(180,190,220,0.55)',
  border: 'rgba(0,212,255,0.18)',
} as const;

export const GRADIENT_BORDER =
  'linear-gradient(90deg, #ff2e9f, #00d4ff, #ff7a18, #00ff87)';

export const COLORS = {
  background: NEON.bg,
  surface: '#0a1226',
  text: NEON.text,
  textMuted: NEON.textMuted,
  border: NEON.border,
} as const;
