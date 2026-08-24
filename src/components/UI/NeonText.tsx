import { ReactNode, CSSProperties } from "react";
import { NEON } from "../../theme";

interface NeonTextProps {
  children: ReactNode;
  color?: typeof NEON.blue | typeof NEON.magenta | typeof NEON.orange | string;
  size?: string;
  weight?: number;
  style?: CSSProperties;
}

export const NeonText = ({
  children,
  color = NEON.blue,
  size = "1rem",
  weight = 700,
  style = {},
}: NeonTextProps) => (
  <span
    style={{
      fontFamily: "'Orbitron', monospace",
      color,
      fontSize: size,
      fontWeight: weight,
      textShadow: `0 0 10px ${color}66`,
      letterSpacing: "0.05em",
      ...style,
    }}
  >
    {children}
  </span>
);