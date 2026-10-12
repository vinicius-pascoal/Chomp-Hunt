"use client";

import { useEffect, useState } from "react";
import { ASSETS } from "@/src/lib/assets";

type ChompSpriteProps = {
  variant?: 0 | 1 | 2;
  size?: number;
  fps?: number;
  label?: string;
  fit?: boolean;
};

export function ChompSprite({ variant = 0, size = 32, fps = 6, label = "Chomp", fit = false }: ChompSpriteProps) {
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
        width: fit ? "100%" : size,
        height: fit ? "100%" : size,
        backgroundImage: `url(${ASSETS.chompIdle})`,
        backgroundSize: fit ? "400% 300%" : `${size * 4}px ${size * 3}px`,
        backgroundPosition: fit ? `${(frame / 3) * 100}% ${(variant / 2) * 100}%` : `-${frame * size}px -${variant * size}px`,
      }}
    />
  );
}
