import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { ASSETS } from "@/src/lib/assets";

type CozyButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: "primary" | "secondary" | "square";
  icon?: ReactNode;
};

export function CozyButton({ children, tone = "primary", icon, className = "", style, ...props }: CozyButtonProps) {
  const background = tone === "primary" ? ASSETS.buttons.primary : tone === "secondary" ? ASSETS.buttons.secondary : ASSETS.buttons.square;
  const buttonStyle = { backgroundImage: `url(${background})`, ...style } as CSSProperties;
  return (
    <button className={`cozy-button cozy-button-${tone} ${className}`} style={buttonStyle} {...props}>
      {icon}
      <span>{children}</span>
    </button>
  );
}
