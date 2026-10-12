"use client";

import { useSearchParams } from "next/navigation";
import { GameScreen } from "@/src/components/GameScreen";

export function GameRoute() {
  const searchParams = useSearchParams();
  return <GameScreen levelId={searchParams.get("level") ?? "tutorial-4x4"} />;
}
