import { Suspense } from "react";
import { GameRoute } from "@/src/components/GameRoute";

function GameFallback() {
  return <section className="game-screen page-content"><div className="generation-overlay"><span className="loading-dot" /> preparando o mapa…</div></section>;
}

export default function Page() {
  return <Suspense fallback={<GameFallback />}><GameRoute /></Suspense>;
}
