"use client";

import { useRouter } from "next/navigation";
import { CozyButton } from "@/src/components/CozyButton";
import { useGame } from "@/src/components/GameProvider";
import { LEVELS } from "@/src/lib/difficulty";

export function TutorialScreen() {
  const router = useRouter();
  const { openLevel } = useGame();

  return (
    <section className="tutorial-screen page-content narrow-content">
      <div className="section-heading">
        <div><p className="eyebrow">AQUEÇA AS PATINHAS</p><h2>Como jogar</h2></div>
        <button className="close-x" onClick={() => router.push("/")} aria-label="Fechar">×</button>
      </div>
      <div className="tutorial-grid">
        <article className="tutorial-card"><span className="rule-icon">×</span><div><strong>Marque uma pista</strong><p>Um toque coloca um X. Toque outra vez para tirar.</p></div></article>
        <article className="tutorial-card"><span className="rule-icon">●</span><div><strong>Chame um Chomp</strong><p>Dois toques tentam posicionar o Chomp na célula.</p></div></article>
        <article className="tutorial-card"><span className="rule-icon">⌗</span><div><strong>Observe as regras</strong><p>Um Chomp por linha, coluna e região. Eles não encostam, nem na diagonal.</p></div></article>
        <article className="tutorial-card"><span className="rule-icon">♥</span><div><strong>Você tem três vidas</strong><p>Uma tentativa em conflito custa uma vida. Uma hipótese válida nunca entrega a solução.</p></div></article>
      </div>
      <div className="tutorial-footer"><span>Teclado: Espaço marca · Enter coloca · Delete limpa</span><CozyButton onClick={() => openLevel(LEVELS[0])}>Começar tutorial →</CozyButton></div>
    </section>
  );
}
