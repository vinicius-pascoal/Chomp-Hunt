"use client";

import { useRouter } from "next/navigation";
import { ChompSprite } from "@/src/components/ChompSprite";
import { CozyButton } from "@/src/components/CozyButton";
import { useGame } from "@/src/components/GameProvider";
import { LEVELS } from "@/src/lib/difficulty";

function MiniBoard() {
  const cells = ["leaf", "leaf", "sky", "sky", "leaf", "mint", "sky", "sky", "mint", "mint", "butter", "butter", "mint", "butter", "butter", "butter"];
  return <div className="mini-board" aria-hidden>{cells.map((region, index) => <span key={index} className={`mini-cell mini-${region}`} />)}</div>;
}

export function HomeScreen() {
  const router = useRouter();
  const { openLevel, startInfinite } = useGame();

  return (
    <section className="home-screen page-content">
      <div className="home-copy">
        <p className="eyebrow">UM PUZZLE DE LÓGICA ACONCHEGANTE</p>
        <h1>CHOMP <span>HUNT</span></h1>
        <p className="home-description">Ajude os Chomps a encontrar seu cantinho. Pense com calma, marque suas pistas e deixe cada mordida no lugar certo.</p>
        <div className="home-actions">
          <CozyButton onClick={() => openLevel(LEVELS[0])}>Jogar agora <span className="button-arrow">→</span></CozyButton>
          <CozyButton tone="secondary" className="infinite-button" onClick={startInfinite}><span className="infinite-icon" aria-hidden>∞</span> Modo infinito</CozyButton>
          <button className="link-button" onClick={() => router.push("/tutorial")}>Como jogar <span>↗</span></button>
        </div>
      </div>
      <div className="home-art" aria-label="Chomp descansando ao lado de um tabuleiro">
        <div className="art-sun" />
        <div className="art-leaf leaf-one">✦</div>
        <div className="art-leaf leaf-two">✿</div>
        <div className="art-card"><MiniBoard /><span>encontre o equilíbrio</span></div>
        <div className="art-chomp"><ChompSprite size={128} variant={1} /></div>
        <div className="art-shadow" />
      </div>
    </section>
  );
}
