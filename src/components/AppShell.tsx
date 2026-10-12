"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChompSprite } from "@/src/components/ChompSprite";
import { CozyButton } from "@/src/components/CozyButton";
import { GameProvider, useGame } from "@/src/components/GameProvider";

function TopBar() {
  const router = useRouter();
  const { openRules } = useGame();

  return (
    <header className="top-bar">
      <button className="brand-button" onClick={() => router.push("/")} aria-label="Voltar ao início">
        <span className="brand-mark">✦</span>
        <span>CHOMP <em>HUNT</em></span>
      </button>
      <div className="top-actions">
        <button className="text-button" onClick={() => router.push("/levels")}>Níveis</button>
        <button className="help-button" onClick={openRules} aria-label="Como jogar">?</button>
      </div>
    </header>
  );
}

function RulesModal() {
  const { closeRules, rulesOpen } = useGame();
  if (!rulesOpen) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={closeRules}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="rules-title" onClick={(event) => event.stopPropagation()}>
        <button className="close-x" onClick={closeRules} aria-label="Fechar">×</button>
        <ChompSprite size={64} variant={1} />
        <p className="eyebrow">A REGRA DA TOCA</p>
        <h2 id="rules-title">Cada Chomp tem seu cantinho</h2>
        <p>Complete o tabuleiro com um Chomp em cada linha, coluna e região. Eles gostam de espaço: nem mesmo na diagonal um Chomp pode encostar no outro.</p>
        <CozyButton onClick={closeRules}>Entendi</CozyButton>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <GameProvider>
      <main className="app-shell">
        <TopBar />
        {children}
        <RulesModal />
      </main>
    </GameProvider>
  );
}
