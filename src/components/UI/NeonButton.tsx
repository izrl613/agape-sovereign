import { ReactNode, CSSProperties, ButtonHTMLAttributes } from "react";
import { NEON } from "../../theme";

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  color?: typeof NEON.blue | typeof NEON.magenta | typeof NEON.orange;
  style?: CSSProperties;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export const NeonButton = ({
  children,
  onClick,
  color = NEON.blue,
  style = {},
  disabled = false,
  size = "md",
  ...rest
}: NeonButtonProps) => {
  const pad = size === "sm" ? "8px 18px" : size === "lg" ? "14px 32px" : "10px 24px";
  const fs = size === "sm" ? "0.75rem" : size === "lg" ? "1rem" : "0.85rem";
  const colorMap = {
    [NEON.blue]: "0,212,255",
    [NEON.magenta]: "255,46,159",
    [NEON.orange]: "255,122,24",
  };
  const colorRgb = colorMap[color] || colorMap[NEON.blue];

  return (
    <button
      className="btn-neon neon-border"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      {...rest}
      style={{
        padding: pad,
        borderRadius: "8px",
        background: `rgba(${colorRgb},0.1)`,
        color,
        fontFamily: "'Orbitron', monospace",
        fontSize: fs,
        fontWeight: 600,
        letterSpacing: "0.08em",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        border: "none",
        outline: "none",
        ...style,
      }}
    >
      {children}
    </button>
  );
};