"use client";

import { useEffect, useState } from "react";
import { ASSETS } from "@/src/lib/assets";

type ChompSpriteProps = {
  variant?: 0 | 1 | 2;
  size?: number;
  fps?: number;
  label?: string;
};

export function ChompSprite({ variant = 0, size = 32, fps = 6, label = "Chomp" }: ChompSpriteProps) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setFrame((current) => (current + 1) % 4), 1000 / fps);
    return () => window.clearInterval(timer);
  }, [fps]);

  return (
    <span
      aria-label={label}
      role="img"
      className="chomp-sprite"
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${ASSETS.chompIdle})`,
        backgroundSize: `${size * 4}px ${size * 3}px`,
        backgroundPosition: `-${frame * size}px -${variant * size}px`,
      }}
    />
  );
}
