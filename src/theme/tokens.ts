/**
 * Sovereign Design Tokens
 * Strict adherence to the Zero-Grey Mandate.
 */

export const SOVEREIGN_PALETTE = {
  canvas: '#0B1020',      // Deep Sovereign Dark Blue
  surface: '#111830',     // Elevated surface
  ice: '#F8FAFC',         // Luminous Ice White
  cyan: '#00D4FF',        // Electric Cyan
  magenta: '#FF2E9F',     // Neon Magenta
  orange: '#FF7A18',      // Burnt Neon Orange
} as const;

export const NEON = {
  bg: SOVEREIGN_PALETTE.canvas,
  surface: SOVEREIGN_PALETTE.surface,
  text: SOVEREIGN_PALETTE.ice,
  textMuted: 'rgba(0, 212, 255, 0.6)', // 60% opacity Electric Cyan
  blue: SOVEREIGN_PALETTE.cyan,
  magenta: SOVEREIGN_PALETTE.magenta,
  orange: SOVEREIGN_PALETTE.orange,
};

export type SovereignColor = typeof SOVEREIGN_PALETTE[keyof typeof SOVEREIGN_PALETTE];
