import { NEON } from "../../theme";

interface SovereignScoreProps {
  score: number;
}

export const SovereignScore = ({ score }: SovereignScoreProps) => {
  const r = 52, cx = 64, cy = 64;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  const color = score > 75 ? NEON.blue : score > 50 ? NEON.orange : NEON.magenta;

  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      <svg width="128" height="128" className="score-ring" style={{ filter: `drop-shadow(0 0 12px ${color})` }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
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
          style={{ transition: "stroke-dasharray 1.5s ease" }}
        />
        <text x={cx} y={cy - 6} textAnchor="middle" fill={color} fontFamily="Orbitron" fontSize="22" fontWeight="900">{score}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#7B9BB5" fontFamily="Rajdhani" fontSize="9" letterSpacing="2">SOVEREIGN</text>
        <text x={cx} y={cy + 25} textAnchor="middle" fill="#7B9BB5" fontFamily="Rajdhani" fontSize="9" letterSpacing="2">SCORE</text>
      </svg>
    </div>
  );
};