import { ReactNode, CSSProperties, MouseEventHandler } from "react";
import { NEON } from "../../theme";

interface GlassCardProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

export const GlassCard = ({
  children,
  style = {},
  className = "",
  onClick,
}: GlassCardProps) => (
  <div
    className={`neon-border ${className}`}
    onClick={onClick}
    style={{
      background: "rgba(8, 18, 40, 0.85)",
      backdropFilter: "blur(20px)",
      borderRadius: "12px",
      border: "1px solid rgba(0,212,255,0.15)",
      position: "relative",
      ...style,
    }}
    onClick={onClick}
  >
    {children}
  </div>
);