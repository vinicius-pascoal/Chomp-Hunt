"use client";

import { useGame } from "@/src/components/GameProvider";
import { DIFFICULTY_LABELS } from "@/src/lib/difficulty";
import type { LevelDefinition } from "@/src/lib/difficulty";
import { LEVELS } from "@/src/lib/difficulty";

function LevelCard({ level }: { level: LevelDefinition }) {
  const { isLevelCompleted, isLevelUnlocked, openLevel } = useGame();
  const unlocked = isLevelUnlocked(level.id);
  const completed = isLevelCompleted(level.id);

  return (
    <button className={`level-card ${unlocked ? "" : "level-locked"} ${completed ? "level-completed" : ""}`} onClick={() => openLevel(level)} disabled={!unlocked}>
      <span className="level-number">{level.label}</span>
      <span className="level-card-copy">
        <small>{DIFFICULTY_LABELS[level.difficulty]} · {level.size}×{level.size}</small>
        <strong>{level.title}</strong>
        <span>{completed ? "Concluído · jogar novamente" : level.description}</span>
      </span>
      <span className="level-arrow" aria-hidden>{unlocked ? "→" : "⌁"}</span>
    </button>
  );
}

export function LevelsScreen() {
  const { progress } = useGame();

  return (
    <section className="levels-screen page-content narrow-content">
      <div className="section-heading">
        <div><p className="eyebrow">SUA JORNADA</p><h2>Escolha um nível</h2></div>
        <span className="progress-badge">{progress.completed.length}/{LEVELS.length} completos</span>
      </div>
      <div className="level-list">{LEVELS.map((level) => <LevelCard key={level.id} level={level} />)}</div>
    </section>
  );
}
