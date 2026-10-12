"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { ChompSprite } from "@/src/components/ChompSprite";
import { CozyButton } from "@/src/components/CozyButton";
import { GameBoard } from "@/src/components/GameBoard";
import { ASSETS } from "@/src/lib/assets";
import {
  boardCellKey,
  cloneCells,
  createEmptyCells,
  positionsFromCells,
  TUTORIAL_BOARD,
  type Board,
  type GameCells,
} from "@/src/lib/board";
import { DIFFICULTY_LABELS, LEVELS, type LevelDefinition } from "@/src/lib/difficulty";
import { canPlaceChomp, isComplete } from "@/src/lib/rules";

type Screen = "home" | "levels" | "tutorial" | "game";
type GamePhase = "playing" | "victory" | "defeat";
type Progress = { unlocked: string[]; completed: string[] };

const DEFAULT_PROGRESS: Progress = { unlocked: LEVELS.map((level) => level.id), completed: [] };
const STORAGE_KEY = "chomp-hunt-progress";

function readProgress(): Progress {
  if (typeof window === "undefined") return DEFAULT_PROGRESS;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(stored) as Partial<Progress>;
    return { unlocked: Array.from(new Set([...(parsed.unlocked ?? []), ...DEFAULT_PROGRESS.unlocked])), completed: parsed.completed ?? [] };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function freshBoardForLevel(level: LevelDefinition): Board {
  if (level.id === "tutorial-4x4") return TUTORIAL_BOARD;
  if (level.id === "easy-4x4") return { ...TUTORIAL_BOARD, id: level.id, seed: level.seed };
  throw new Error("Este nível precisa ser preparado pelo gerador.");
}

function MiniBoard() {
  const cells = ["leaf", "leaf", "sky", "sky", "leaf", "mint", "sky", "sky", "mint", "mint", "butter", "butter", "mint", "butter", "butter", "butter"];
  return <div className="mini-board" aria-hidden>{cells.map((region, index) => <span key={index} className={`mini-cell mini-${region}`} />)}</div>;
}

function Hearts({ lives }: { lives: number }) {
  return <div className="hearts" aria-label={`${lives} de 3 vidas restantes`}>{[0, 1, 2].map((heart) => <Image key={heart} src={heart < lives ? ASSETS.hearts.full : ASSETS.hearts.empty} alt={heart < lives ? "Vida" : "Vida perdida"} width={28} height={28} className={heart === lives && lives < 3 ? "heart-lost" : ""} />)}</div>;
}

function TopBar({ onHome, onLevels }: { onHome: () => void; onLevels: () => void }) {
  return <header className="top-bar"><button className="brand-button" onClick={onHome} aria-label="Voltar ao início"><span className="brand-mark">✦</span><span>CHOMP <em>HUNT</em></span></button><div className="top-actions"><button className="text-button" onClick={onLevels}>Níveis</button><button className="help-button" onClick={() => window.dispatchEvent(new CustomEvent("open-rules"))} aria-label="Como jogar">?</button></div></header>;
}

function LevelCard({ level, unlocked, completed, onSelect }: { level: LevelDefinition; unlocked: boolean; completed: boolean; onSelect: () => void }) {
  return <button className={`level-card ${unlocked ? "" : "level-locked"} ${completed ? "level-completed" : ""}`} onClick={onSelect} disabled={!unlocked}><span className="level-number">{level.label}</span><span className="level-card-copy"><small>{DIFFICULTY_LABELS[level.difficulty]} · {level.size}×{level.size}</small><strong>{level.title}</strong><span>{completed ? "Concluído · jogar novamente" : level.description}</span></span><span className="level-arrow" aria-hidden>{unlocked ? "→" : "⌁"}</span></button>;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [progress, setProgress] = useState<Progress>(readProgress);
  const [selectedLevel, setSelectedLevel] = useState<LevelDefinition>(LEVELS[0]);
  const [board, setBoard] = useState<Board>(TUTORIAL_BOARD);
  const [cells, setCells] = useState<GameCells>(() => createEmptyCells(TUTORIAL_BOARD.size));
  const [history, setHistory] = useState<GameCells[]>([]);
  const [lives, setLives] = useState(3);
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [invalidCell, setInvalidCell] = useState<string | null>(null);
  const [generationState, setGenerationState] = useState<"idle" | "loading" | "error">("idle");
  const [generationError, setGenerationError] = useState("");
  const [rulesOpen, setRulesOpen] = useState(false);
  const pendingTaps = useRef<Map<string, number>>(new Map());
  const pointerStart = useRef<{ key: string; x: number; y: number; pointerId: number } | null>(null);
  const dragGesture = useRef<{ pointerId: number; startKey: string; baseCells: GameCells; mode: "mark" | "erase" | "none"; moved: boolean; visited: Set<string>; historyCaptured: boolean } | null>(null);
  const invalidTimer = useRef<number | null>(null);

  useEffect(() => {
    const openRules = () => setRulesOpen(true);
    window.addEventListener("open-rules", openRules);
    return () => window.removeEventListener("open-rules", openRules);
  }, []);

  useEffect(() => { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }, [progress]);
  useEffect(() => () => { pendingTaps.current.forEach((timer) => window.clearTimeout(timer)); if (invalidTimer.current) window.clearTimeout(invalidTimer.current); }, []);

  function beginGame(nextBoard: Board, level: LevelDefinition) {
    setSelectedLevel(level); setBoard(nextBoard); setCells(createEmptyCells(nextBoard.size)); setHistory([]); setLives(3); setPhase("playing"); setInvalidCell(null); setScreen("game");
  }

  function chooseLevel(level: LevelDefinition) {
    setGenerationError("");
    if (level.size === 4) { setGenerationState("idle"); beginGame(freshBoardForLevel(level), level); return; }
    setSelectedLevel(level); setGenerationState("loading");
    const worker = new Worker(new URL("../src/lib/generator.worker.ts", import.meta.url));
    worker.onmessage = (event: MessageEvent<{ ok: boolean; board?: Board; error?: string }>) => { worker.terminate(); if (event.data.ok && event.data.board) { setGenerationState("idle"); beginGame(event.data.board, level); } else { setGenerationState("error"); setGenerationError(event.data.error ?? "O mapa não ficou pronto. Tente novamente."); } };
    worker.onerror = () => { worker.terminate(); setGenerationState("error"); setGenerationError("O mapa não ficou pronto. Tente novamente."); };
    worker.postMessage({ size: level.size, seed: level.seed });
  }

  function commitCells(next: GameCells) { setHistory((current) => [...current, cloneCells(cells)]); setCells(next); }

  function performSingle(row: number, col: number) {
    if (phase !== "playing") return;
    const next = cloneCells(cells); const current = next[row][col];
    next[row][col] = current === "empty" ? "mark" : current === "mark" ? "empty" : "mark"; commitCells(next);
  }

  function performDouble(row: number, col: number) {
    if (phase !== "playing") return;
    if (cells[row][col] === "chomp") { const next = cloneCells(cells); next[row][col] = "empty"; commitCells(next); return; }
    const check = canPlaceChomp(board, positionsFromCells(cells), { row, col });
    if (!check.valid) {
      const key = boardCellKey({ row, col }); setInvalidCell(key); if (invalidTimer.current) window.clearTimeout(invalidTimer.current); invalidTimer.current = window.setTimeout(() => setInvalidCell(null), 720);
      setLives((current) => { const nextLives = Math.max(0, current - 1); if (nextLives === 0) setPhase("defeat"); return nextLives; }); return;
    }
    const next = cloneCells(cells); next[row][col] = "chomp"; commitCells(next);
    if (isComplete(board, positionsFromCells(next))) {
      setPhase("victory");
      setProgress((current) => { const completed = current.completed.includes(selectedLevel.id) ? current.completed : [...current.completed, selectedLevel.id]; const levelIndex = LEVELS.findIndex((level) => level.id === selectedLevel.id); const nextLevel = LEVELS[levelIndex + 1]; const unlocked = nextLevel && !current.unlocked.includes(nextLevel.id) ? [...current.unlocked, nextLevel.id] : current.unlocked; return { completed, unlocked }; });
    }
  }

  function clearCell(row: number, col: number) { if (phase !== "playing" || cells[row][col] === "empty") return; const next = cloneCells(cells); next[row][col] = "empty"; commitCells(next); }

  function handlePointerDown(row: number, col: number, event: PointerEvent<HTMLButtonElement>) {
    if ((event.button !== 0 && event.pointerType !== "touch") || phase !== "playing") return;
    const key = boardCellKey({ row, col });
    pointerStart.current = { key, x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    const mode = cells[row][col] === "mark" ? "erase" : cells[row][col] === "empty" ? "mark" : "none";
    dragGesture.current = { pointerId: event.pointerId, startKey: key, baseCells: cloneCells(cells), mode, moved: false, visited: new Set(), historyCaptured: false };
  }

  function paintDraggedCell(row: number, col: number) {
    const gesture = dragGesture.current;
    if (!gesture || gesture.mode === "none" || gesture.moved && gesture.visited.has(boardCellKey({ row, col }))) return;
    const key = boardCellKey({ row, col });
    const expectedState = gesture.mode === "mark" ? "empty" : "mark";
    if (gesture.baseCells[row][col] !== expectedState) return;
    gesture.moved = true;
    gesture.visited.add(key);
    const pending = pendingTaps.current.get(gesture.startKey);
    if (pending) { window.clearTimeout(pending); pendingTaps.current.delete(gesture.startKey); }
    if (!gesture.historyCaptured) { setHistory((current) => [...current, cloneCells(gesture.baseCells)]); gesture.historyCaptured = true; }
    setCells((current) => {
      if (current[row][col] !== expectedState) return current;
      const next = cloneCells(current);
      next[row][col] = gesture.mode === "mark" ? "mark" : "empty";
      return next;
    });
  }

  function handlePointerEnter(row: number, col: number, event: PointerEvent<HTMLButtonElement>) {
    const gesture = dragGesture.current;
    if (!gesture || gesture.pointerId !== event.pointerId || (event.buttons === 0 && event.pointerType !== "touch")) return;
    const start = pointerStart.current;
    if (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) <= 10) return;
    paintDraggedCell(start.key.split(":").map(Number)[0], start.key.split(":").map(Number)[1]);
    paintDraggedCell(row, col);
  }

  function handlePointerUp(row: number, col: number, event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 && event.pointerType !== "touch") return;
    const key = boardCellKey({ row, col }); const start = pointerStart.current; pointerStart.current = null;
    const gesture = dragGesture.current;
    dragGesture.current = null;
    if (gesture?.pointerId === event.pointerId && gesture.moved) return;
    if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) return;
    const pending = pendingTaps.current.get(key);
    if (pending) { window.clearTimeout(pending); pendingTaps.current.delete(key); performDouble(row, col); return; }
    const timer = window.setTimeout(() => { pendingTaps.current.delete(key); performSingle(row, col); }, 280);
    pendingTaps.current.set(key, timer);
  }

  function handleKeyDown(row: number, col: number, event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === " ") { event.preventDefault(); performSingle(row, col); } else if (event.key === "Enter") { event.preventDefault(); performDouble(row, col); } else if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); clearCell(row, col); }
  }

  function undo() { if (phase !== "playing" || history.length === 0) return; setCells(cloneCells(history[history.length - 1])); setHistory((current) => current.slice(0, -1)); }
  function restart() { beginGame(board, selectedLevel); }
  const chomps = positionsFromCells(cells).length;
  const unlocked = (id: string) => progress.unlocked.includes(id);
  const completed = (id: string) => progress.completed.includes(id);
  const nextLevel = LEVELS[LEVELS.findIndex((level) => level.id === selectedLevel.id) + 1];

  return <main className="app-shell">
    <TopBar onHome={() => setScreen("home")} onLevels={() => setScreen("levels")} />
    {screen === "home" && <section className="home-screen page-content"><div className="home-copy"><p className="eyebrow">UM PUZZLE DE LÓGICA ACONCHEGANTE</p><h1>CHOMP <span>HUNT</span></h1><p className="home-description">Ajude os Chomps a encontrar seu cantinho. Pense com calma, marque suas pistas e deixe cada mordida no lugar certo.</p><div className="home-actions"><CozyButton onClick={() => chooseLevel(LEVELS[0])}>Jogar agora <span className="button-arrow">→</span></CozyButton><button className="link-button" onClick={() => setScreen("tutorial")}>Como jogar <span>↗</span></button></div><p className="home-hint"><span className="hint-dot" /> 4×4 · primeiro nível desbloqueado</p></div><div className="home-art" aria-label="Chomp descansando ao lado de um tabuleiro"><div className="art-sun" /><div className="art-leaf leaf-one">✦</div><div className="art-leaf leaf-two">✿</div><div className="art-card"><MiniBoard /><span>encontre o equilíbrio</span></div><div className="art-chomp"><ChompSprite size={128} variant={1} /></div><div className="art-shadow" /></div></section>}
    {screen === "levels" && <section className="levels-screen page-content narrow-content"><div className="section-heading"><div><p className="eyebrow">SUA JORNADA</p><h2>Escolha um nível</h2></div><span className="progress-badge">{progress.completed.length}/{LEVELS.length} completos</span></div><div className="level-list">{LEVELS.map((level) => <LevelCard key={level.id} level={level} unlocked={unlocked(level.id)} completed={completed(level.id)} onSelect={() => chooseLevel(level)} />)}</div>{generationState === "loading" && <div className="toast-message"><span className="loading-dot" /> preparando o mapa {selectedLevel.size}×{selectedLevel.size}…</div>}{generationState === "error" && <div className="toast-message error-message">{generationError} <button onClick={() => chooseLevel(selectedLevel)}>Tentar de novo</button></div>}</section>}
    {screen === "tutorial" && <section className="tutorial-screen page-content narrow-content"><div className="section-heading"><div><p className="eyebrow">AQUEÇA AS PATINHAS</p><h2>Como jogar</h2></div><button className="close-x" onClick={() => setScreen("home")} aria-label="Fechar">×</button></div><div className="tutorial-grid"><article className="tutorial-card"><span className="rule-icon">×</span><div><strong>Marque uma pista</strong><p>Um toque coloca um X. Toque outra vez para tirar.</p></div></article><article className="tutorial-card"><span className="rule-icon">●</span><div><strong>Chame um Chomp</strong><p>Dois toques tentam posicionar o Chomp na célula.</p></div></article><article className="tutorial-card"><span className="rule-icon">⌗</span><div><strong>Observe as regras</strong><p>Um Chomp por linha, coluna e região. Eles não encostam, nem na diagonal.</p></div></article><article className="tutorial-card"><span className="rule-icon">♥</span><div><strong>Você tem três vidas</strong><p>Uma tentativa em conflito custa uma vida. Uma hipótese válida nunca entrega a solução.</p></div></article></div><div className="tutorial-footer"><span>Teclado: Espaço marca · Enter coloca · Delete limpa</span><CozyButton onClick={() => chooseLevel(LEVELS[0])}>Começar tutorial →</CozyButton></div></section>}
    {screen === "game" && <section className="game-screen page-content"><div className="game-heading"><button className="back-button" onClick={() => setScreen("levels")}>← <span>Níveis</span></button><div className="game-title"><p className="eyebrow">{DIFFICULTY_LABELS[selectedLevel.difficulty]}</p><h2>{selectedLevel.title}</h2></div><div className="game-level-pill">{selectedLevel.size}×{selectedLevel.size}</div></div><div className="game-layout"><aside className="side-panel left-panel"><div className="hud-card"><span className="hud-label">VIDAS</span><Hearts lives={lives} /><span className="hud-note">Cada erro de regra<br />consome uma vida.</span></div><div className="note-card"><span className="note-pin" /><strong>Dica da toca</strong><p>Use X para riscar possibilidades. A solução continua escondida até você completar o mapa.</p></div></aside><div className="board-column"><div className="board-status"><span><b>{chomps}</b> de {board.size} Chomps</span><span className="status-divider" /><span className="status-soft">um por região</span></div><GameBoard board={board} cells={cells} invalidCell={invalidCell} disabled={phase !== "playing"} onPointerDown={handlePointerDown} onPointerEnter={handlePointerEnter} onPointerUp={handlePointerUp} onKeyDown={handleKeyDown} /><p className="gesture-hint"><span className="tap-icon">◉</span> toque para marcar <span className="hint-separator">·</span> <span className="double-icon">◎</span> toque duas vezes para colocar <span className="hint-separator">·</span> arraste para marcar ou apagar X</p></div><aside className="side-panel right-panel"><div className="rules-mini"><span className="hud-label">REGRAS</span><p><i>01</i> uma linha</p><p><i>02</i> uma coluna</p><p><i>03</i> uma região</p><p><i>04</i> sem vizinhos</p></div><div className="game-actions"><button onClick={undo} disabled={history.length === 0}>↶ Desfazer</button><button onClick={restart}>↻ Reiniciar</button></div></aside></div></section>}
    {rulesOpen && <div className="modal-backdrop" role="presentation" onClick={() => setRulesOpen(false)}><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="rules-title" onClick={(event) => event.stopPropagation()}><button className="close-x" onClick={() => setRulesOpen(false)} aria-label="Fechar">×</button><ChompSprite size={64} variant={1} /><p className="eyebrow">A REGRA DA TOCA</p><h2 id="rules-title">Cada Chomp tem seu cantinho</h2><p>Complete o tabuleiro com um Chomp em cada linha, coluna e região. Eles gostam de espaço: nem mesmo na diagonal um Chomp pode encostar no outro.</p><CozyButton onClick={() => setRulesOpen(false)}>Entendi</CozyButton></div></div>}
    {phase === "victory" && screen === "game" && <div className="modal-backdrop"><div className="modal-card result-card victory-card"><div className="confetti-dot">✦</div><p className="eyebrow">MAPA COMPLETO</p><h2>Você encontrou todos!</h2><p>O Chomp está feliz no seu cantinho. Respire fundo e prepare a próxima mordida.</p><CozyButton onClick={() => nextLevel && unlocked(nextLevel.id) ? chooseLevel(nextLevel) : setScreen("levels")}>{nextLevel ? "Próximo nível →" : "Voltar aos níveis"}</CozyButton></div></div>}
    {phase === "defeat" && screen === "game" && <div className="modal-backdrop"><div className="modal-card result-card defeat-card"><div className="defeat-face">◌</div><p className="eyebrow">A TOCA FICOU SILENCIOSA</p><h2>As vidas acabaram</h2><p>O mapa continua o mesmo. Tente outra vez com três novas vidas.</p><CozyButton onClick={restart}>Tentar novamente</CozyButton><button className="link-button modal-link" onClick={() => setScreen("levels")}>Voltar aos níveis</button></div></div>}
  </main>;
}
