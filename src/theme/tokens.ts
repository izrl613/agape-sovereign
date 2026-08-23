export const NEON = {
  magenta: "#FF2E9F",
  blue: "#00D4FF",
  orange: "#FF7A18",
  bg: "#060D1F",
  bgCard: "rgba(8, 18, 40, 0.85)",
  bgGlass: "rgba(0, 212, 255, 0.04)",
  text: "#E8F4FF",
  textMuted: "#7B9BB5",
} as const;

export const GRADIENT = `linear-gradient(135deg, ${NEON.magenta}, ${NEON.blue}, ${NEON.orange})`;
export const GRADIENT_BORDER = `linear-gradient(135deg, ${NEON.magenta} 0%, ${NEON.blue} 50%, ${NEON.orange} 100%)`;

export const FONTS = {
  orbitron: "'Orbitron', monospace",
  rajdhani: "'Rajdhani', sans-serif",
  shareTechMono: "'Share Tech Mono', monospace",
} as const;

export const SPACING = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
} as const;

export const BORDER_RADIUS = {
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  full: "50%",
} as const;

export const TRANSITIONS = {
  fast: "0.2s ease",
  normal: "0.3s ease",
  slow: "0.4s ease",
} as const;

export const SHADOWS = {
  glowBlue: `0 0 12px ${NEON.blue}, 0 0 20px rgba(0,212,255,0.3)`,
  glowMagenta: `0 0 12px ${NEON.magenta}, 0 0 20px rgba(255,46,159,0.3)`,
  glowOrange: `0 0 12px ${NEON.orange}, 0 0 20px rgba(255,122,24,0.3)`,
  card: "0 8px 32px rgba(0,212,255,0.2)",
} as const;

export const Z_INDEX = {
  base: 1,
  header: 10,
  modal: 1000,
  tooltip: 2000,
} as const;

export const ANIMATIONS = {
  pulseBorder: "pulse-border 2s ease-in-out infinite",
  scanLine: "scan-line 4s linear infinite",
  float: "float 4s ease-in-out infinite",
  glowPulse: "glow-pulse 2s infinite",
  textGlow: "text-glow 2s ease-in-out infinite",
  slideInLeft: "slide-in-left 0.3s ease",
  slideInUp: "slide-in-up 0.3s ease",
  fadeIn: "fade-in 0.4s ease",
  rotateGradient: "rotate-gradient 3s linear infinite",
  dataStream: "data-stream 1s ease-in-out infinite",
  nukeFlash: "nuke-flash 3s ease-in-out infinite",
  knoxPulse: "knox-pulse 3s ease-in-out infinite",
  spinner: "spinner 1s linear infinite",
  matrixRain: "matrix-rain 2s linear infinite",
  thinkingDot: "pulse-border 0.8s ease-in-out infinite",
} as const;

export const KEYFRAMES = `
  @keyframes pulse-border {
    0%,100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  @keyframes scan-line {
    0% { top: -2px; }
    100% { top: 100%; }
  }
  @keyframes float {
    0%,100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
  }
  @keyframes glow-pulse {
    0%,100% { box-shadow: 0 0 8px ${NEON.magenta}, 0 0 20px rgba(255,46,159,0.3); }
    33% { box-shadow: 0 0 8px ${NEON.blue}, 0 0 20px rgba(0,212,255,0.3); }
    66% { box-shadow: 0 0 8px ${NEON.orange}, 0 0 20px rgba(255,122,24,0.3); }
  }
  @keyframes text-glow {
    0%,100% { text-shadow: 0 0 10px ${NEON.magenta}, 0 0 20px rgba(255,46,159,0.5); }
    50% { text-shadow: 0 0 10px ${NEON.blue}, 0 0 20px rgba(0,212,255,0.5); }
  }
  @keyframes slide-in-left {
    from { transform: translateX(-30px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slide-in-up {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes rotate-gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes data-stream {
    0% { transform: translateY(0); opacity: 1; }
    100% { transform: translateY(-40px); opacity: 0; }
  }
  @keyframes nuke-flash {
    0%,100% { background: rgba(255,46,159,0.1); }
    50% { background: rgba(255,46,159,0.25); }
  }
  @keyframes knox-pulse {
    0%,100% { background: rgba(0,212,255,0.1); }
    50% { background: rgba(0,212,255,0.2); }
  }
  @keyframes spinner {
    to { transform: rotate(360deg); }
  }
  @keyframes matrix-rain {
    0% { transform: translateY(-100%); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateY(100vh); opacity: 0; }
  }
`;