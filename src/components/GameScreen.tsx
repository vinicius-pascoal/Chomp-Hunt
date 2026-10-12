"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import type { LevelDefinition } from "@/src/lib/difficulty";
import { DIFFICULTY_LABELS, LEVELS } from "@/src/lib/difficulty";
import { CozyButton } from "@/src/components/CozyButton";
import { GameBoard } from "@/src/components/GameBoard";
import { useGame } from "@/src/components/GameProvider";
import { ASSETS } from "@/src/lib/assets";
import { createInfiniteLevel } from "@/src/components/GameProvider";

function getLevelFromId(levelId: string): LevelDefinition | undefined {
  if (levelId.startsWith("infinite-")) {
    const round = Number(levelId.replace("infinite-", ""));
    return Number.isFinite(round) && round > 0 ? createInfiniteLevel(round) : undefined;
  }
  return LEVELS.find((level) => level.id === levelId);
}

function Hearts({ lives }: { lives: number }) {
  return <div className="hearts" aria-label={`${lives} de 3 vidas restantes`}>{[0, 1, 2].map((heart) => <Image key={heart} src={heart < lives ? ASSETS.hearts.full : ASSETS.hearts.empty} alt={heart < lives ? "Vida" : "Vida perdida"} width={28} height={28} className={heart === lives && lives < 3 ? "heart-lost" : ""} />)}</div>;
}

export function GameScreen({ levelId }: { levelId: string }) {
  const router = useRouter();
  const {
    board,
    cells,
    chomps,
    generationError,
    generationState,
    historyLength,
    invalidCell,
    isLevelUnlocked,
    lives,
    loadLevelFromRoute,
    nextLevel,
    onKeyDown,
    onPointerDown,
    onPointerEnter,
    onPointerUp,
    openLevel,
    phase,
    restart,
    selectedLevel,
    undo,
  } = useGame();

  const routeLevel = useMemo(() => getLevelFromId(levelId), [levelId]);

  useEffect(() => {
    if (routeLevel) {
      // Esta chamada fica separada do render para suportar acesso direto a /game.
      loadLevelFromRoute(routeLevel);
    }
  }, [loadLevelFromRoute, routeLevel]);

  if (!routeLevel) {
    return <section className="game-screen page-content narrow-content"><div className="toast-message error-message">Nível não encontrado. <button onClick={() => router.push("/levels")}>Voltar aos níveis</button></div></section>;
  }

  return (
    <>
      {generationState === "loading" && <div className="generation-overlay"><span className="loading-dot" /> preparando a próxima fase…</div>}
      {generationState === "error" && <div className="generation-overlay generation-error-overlay"><div><p>{generationError}</p><CozyButton onClick={() => openLevel(selectedLevel)}>Tentar de novo</CozyButton></div></div>}
      <section className="game-screen page-content">
        <div className="game-heading">
          <button className="back-button" onClick={() => router.push("/levels")}>← <span>Níveis</span></button>
          <div className="game-title"><p className="eyebrow">{DIFFICULTY_LABELS[selectedLevel.difficulty]}</p><h2>{selectedLevel.title}</h2></div>
          <div className="game-level-pill">{selectedLevel.size}×{selectedLevel.size}</div>
        </div>
        <div className="game-layout">
          <aside className="side-panel left-panel">
            <div className="hud-card"><span className="hud-label">VIDAS</span><Hearts lives={lives} /><span className="hud-note">Cada erro de regra<br />consome uma vida.</span></div>
            <div className="note-card"><span className="note-pin" /><strong>Dica da toca</strong><p>Use X para riscar possibilidades. A solução continua escondida até você completar o mapa.</p></div>
          </aside>
          <div className="board-column">
            <div className="board-status"><span><b>{chomps}</b> de {board.size} Chomps</span><span className="status-divider" /><span className="status-soft">um por região</span></div>
            <GameBoard board={board} cells={cells} invalidCell={invalidCell} disabled={phase !== "playing"} onPointerDown={onPointerDown} onPointerEnter={onPointerEnter} onPointerUp={onPointerUp} onKeyDown={onKeyDown} />
            <p className="gesture-hint"><span className="tap-icon">◉</span> toque para marcar <span className="hint-separator">·</span> <span className="double-icon">◍</span> toque duas vezes para colocar <span className="hint-separator">·</span> arraste para marcar ou apagar X</p>
          </div>
          <aside className="side-panel right-panel">
            <div className="rules-mini"><span className="hud-label">REGRAS</span><p><i>01</i> uma linha</p><p><i>02</i> uma coluna</p><p><i>03</i> uma região</p><p><i>04</i> sem vizinhos</p></div>
            <div className="game-actions"><button onClick={undo} disabled={historyLength === 0}>↶ Desfazer</button><button onClick={restart}>↻ Reiniciar</button></div>
          </aside>
        </div>
      </section>
      {phase === "victory" && <div className="modal-backdrop"><div className="modal-card result-card victory-card"><div className="confetti-dot">✦</div><p className="eyebrow">MAPA COMPLETO</p><h2>Você encontrou todos!</h2><p>O Chomp está feliz no seu cantinho. Respire fundo e prepare a próxima mordida.</p><CozyButton onClick={() => nextLevel && isLevelUnlocked(nextLevel.id) ? openLevel(nextLevel) : router.push("/levels")}>{nextLevel ? "Próximo nível →" : "Voltar aos níveis"}</CozyButton></div></div>}
      {phase === "defeat" && <div className="modal-backdrop"><div className="modal-card result-card defeat-card"><div className="defeat-face">◌</div><p className="eyebrow">A TOCA FICOU SILENCIOSA</p><h2>As vidas acabaram</h2><p>O mapa continua o mesmo. Tente outra vez com três novas vidas.</p><CozyButton onClick={restart}>Tentar novamente</CozyButton><button className="link-button modal-link" onClick={() => router.push("/levels")}>Voltar aos níveis</button></div></div>}
    </>
  );
}
