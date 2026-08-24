import { CSSProperties } from "react";
import { NEON } from "../../theme";

type StatusType = "NUKED" | "KNOXED" | "MONITORED" | "SCANNING";

interface StatusBadgeProps {
  type: StatusType;
}

const CONFIG: Record<StatusType, { color: string; bg: string; label: string }> = {
  NUKED: { color: NEON.magenta, bg: "rgba(255,46,159,0.12)", label: "🔥 NUKED" },
  KNOXED: { color: NEON.blue, bg: "rgba(0,212,255,0.12)", label: "🛡️ KNOXED" },
  MONITORED: { color: NEON.orange, bg: "rgba(255,122,24,0.12)", label: "👁️ MONITORED" },
  SCANNING: { color: "#FFD700", bg: "rgba(255,215,0,0.12)", label: "⟳ SCANNING" },
};

export const StatusBadge = ({ type }: StatusBadgeProps) => {
  const cfg = CONFIG[type] || CONFIG.MONITORED;
  return (
    <span
      style={{
        background: cfg.bg,
        color: cfg.color,
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "0.7rem",
        fontWeight: 700,
        fontFamily: "'Orbitron', monospace",
        border: `1px solid ${cfg.color}44`,
      } as CSSProperties
    >
      {cfg.label}
    </span>
  );
};