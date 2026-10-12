"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent, ReactNode } from "react";
import {
  boardCellKey,
  cloneCells,
  createEmptyCells,
  EASY_BOARD,
  positionsFromCells,
  TUTORIAL_BOARD,
  type Board,
  type GameCells,
} from "@/src/lib/board";
import { DIFFICULTY_LABELS, LEVELS, type LevelDefinition } from "@/src/lib/difficulty";
import { canPlaceChomp, isComplete } from "@/src/lib/rules";

export type GamePhase = "playing" | "victory" | "defeat";
export type GenerationState = "idle" | "loading" | "error";
export type Progress = { unlocked: string[]; completed: string[] };

type GameContextValue = {
  progress: Progress;
  selectedLevel: LevelDefinition;
  board: Board;
  cells: GameCells;
  historyLength: number;
  lives: number;
  phase: GamePhase;
  invalidCell: string | null;
  generationState: GenerationState;
  generationError: string;
  infiniteMode: boolean;
  chomps: number;
  nextLevel?: LevelDefinition;
  isLevelUnlocked: (id: string) => boolean;
  isLevelCompleted: (id: string) => boolean;
  openLevel: (level: LevelDefinition) => void;
  startInfinite: () => void;
  loadLevelFromRoute: (level: LevelDefinition) => void;
  restart: () => void;
  undo: () => void;
  openRules: () => void;
  closeRules: () => void;
  rulesOpen: boolean;
  onPointerDown: (row: number, col: number, event: PointerEvent<HTMLButtonElement>) => void;
  onPointerEnter: (row: number, col: number, event: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (row: number, col: number, event: PointerEvent<HTMLButtonElement>) => void;
  onKeyDown: (row: number, col: number, event: KeyboardEvent<HTMLButtonElement>) => void;
};

const DEFAULT_PROGRESS: Progress = { unlocked: LEVELS.map((level) => level.id), completed: [] };
const STORAGE_KEY = "chomp-hunt-progress";

function readProgress(): Progress {
  if (typeof window === "undefined") return DEFAULT_PROGRESS;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(stored) as Partial<Progress>;
    return {
      unlocked: Array.from(new Set([...(parsed.unlocked ?? []), ...DEFAULT_PROGRESS.unlocked])),
      completed: parsed.completed ?? [],
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function freshBoardForLevel(level: LevelDefinition): Board {
  if (level.id === "tutorial-4x4") return TUTORIAL_BOARD;
  if (level.id === "easy-4x4") return EASY_BOARD;
  throw new Error("Este nível precisa ser preparado pelo gerador.");
}

export function createInfiniteLevel(round: number): LevelDefinition {
  const size = Math.min(10, 4 + Math.floor((round - 1) / 2));
  const difficulty = size >= 10 ? "expert" : size >= 8 ? "hard" : size >= 6 ? "medium" : size === 5 ? "easy" : "tutorial";
  return {
    id: `infinite-${round}`,
    label: `∞${round}`,
    title: `Caçada infinita · fase ${round}`,
    size,
    seed: 9000 + round * 7919,
    description: "A toca fica mais difícil a cada nova fase.",
    difficulty,
  };
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [progress, setProgress] = useState<Progress>(readProgress);
  const [selectedLevel, setSelectedLevel] = useState<LevelDefinition>(LEVELS[0]);
  const [board, setBoard] = useState<Board>(TUTORIAL_BOARD);
  const [cells, setCells] = useState<GameCells>(() => createEmptyCells(TUTORIAL_BOARD.size));
  const [history, setHistory] = useState<GameCells[]>([]);
  const [lives, setLives] = useState(3);
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [invalidCell, setInvalidCell] = useState<string | null>(null);
  const [generationState, setGenerationState] = useState<GenerationState>("idle");
  const [generationError, setGenerationError] = useState("");
  const [infiniteMode, setInfiniteMode] = useState(false);
  const [infiniteRound, setInfiniteRound] = useState(1);
  const [rulesOpen, setRulesOpen] = useState(false);
  const pendingTaps = useRef<Map<string, number>>(new Map());
  const pointerStart = useRef<{ key: string; x: number; y: number; pointerId: number } | null>(null);
  const dragGesture = useRef<{ pointerId: number; startKey: string; baseCells: GameCells; mode: "mark" | "erase" | "none"; moved: boolean; visited: Set<string>; historyCaptured: boolean } | null>(null);
  const invalidTimer = useRef<number | null>(null);
  const generator = useRef<Worker | null>(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  useEffect(() => () => {
    generator.current?.terminate();
    pendingTaps.current.forEach((timer) => window.clearTimeout(timer));
    if (invalidTimer.current) window.clearTimeout(invalidTimer.current);
  }, []);

  const beginGame = useCallback((nextBoard: Board, level: LevelDefinition) => {
    setSelectedLevel(level);
    setBoard(nextBoard);
    setCells(createEmptyCells(nextBoard.size));
    setHistory([]);
    setLives(3);
    setPhase("playing");
    setInvalidCell(null);
    setGenerationState("idle");
  }, []);

  const generateLevel = useCallback((level: LevelDefinition) => {
    generator.current?.terminate();
    setGenerationError("");
    setPhase("playing");
    setLives(3);
    setHistory([]);
    setInvalidCell(null);

    if (level.size === 4 && !level.id.startsWith("infinite-")) {
      beginGame(freshBoardForLevel(level), level);
      return;
    }

    setSelectedLevel(level);
    setGenerationState("loading");
    const worker = new Worker(new URL("../lib/generator.worker.ts", import.meta.url));
    generator.current = worker;
    worker.onmessage = (event: MessageEvent<{ ok: boolean; board?: Board; error?: string }>) => {
      worker.terminate();
      if (generator.current === worker) generator.current = null;
      if (event.data.ok && event.data.board) {
        beginGame(event.data.board, level);
      } else {
        setGenerationState("error");
        setGenerationError(event.data.error ?? "O mapa não ficou pronto. Tente novamente.");
      }
    };
    worker.onerror = () => {
      worker.terminate();
      if (generator.current === worker) generator.current = null;
      setGenerationState("error");
      setGenerationError("O mapa não ficou pronto. Tente novamente.");
    };
    worker.postMessage({ size: level.size, seed: level.seed });
  }, [beginGame]);

  const setInfiniteLevelState = useCallback((level: LevelDefinition) => {
    const isInfinite = level.id.startsWith("infinite-");
    setInfiniteMode(isInfinite);
    if (isInfinite) setInfiniteRound(Number(level.id.replace("infinite-", "")) || 1);
  }, []);

  const openLevel = useCallback((level: LevelDefinition) => {
    setInfiniteLevelState(level);
    router.push(`/game?level=${encodeURIComponent(level.id)}`);
    generateLevel(level);
  }, [generateLevel, router, setInfiniteLevelState]);

  const loadLevelFromRoute = useCallback((level: LevelDefinition) => {
    if (selectedLevel.id === level.id && generationState !== "error") return;
    setInfiniteLevelState(level);
    generateLevel(level);
  }, [generateLevel, generationState, selectedLevel.id, setInfiniteLevelState]);

  const startInfinite = useCallback(() => {
    openLevel(createInfiniteLevel(1));
  }, [openLevel]);

  const commitCells = useCallback((next: GameCells) => {
    setHistory((current) => [...current, cloneCells(cells)]);
    setCells(next);
  }, [cells]);

  const performSingle = useCallback((row: number, col: number) => {
    if (phase !== "playing") return;
    const next = cloneCells(cells);
    const current = next[row][col];
    next[row][col] = current === "empty" ? "mark" : current === "mark" ? "empty" : "mark";
    commitCells(next);
  }, [cells, commitCells, phase]);

  const performDouble = useCallback((row: number, col: number) => {
    if (phase !== "playing") return;
    if (cells[row][col] === "chomp") {
      const next = cloneCells(cells);
      next[row][col] = "empty";
      commitCells(next);
      return;
    }

    const check = canPlaceChomp(board, positionsFromCells(cells), { row, col });
    if (!check.valid) {
      const key = boardCellKey({ row, col });
      setInvalidCell(key);
      if (invalidTimer.current) window.clearTimeout(invalidTimer.current);
      invalidTimer.current = window.setTimeout(() => setInvalidCell(null), 720);
      setLives((current) => {
        const nextLives = Math.max(0, current - 1);
        if (nextLives === 0) setPhase("defeat");
        return nextLives;
      });
      return;
    }

    const next = cloneCells(cells);
    next[row][col] = "chomp";
    commitCells(next);
    if (isComplete(board, positionsFromCells(next))) {
      setPhase("victory");
      setProgress((current) => {
        const completed = current.completed.includes(selectedLevel.id) ? current.completed : [...current.completed, selectedLevel.id];
        const levelIndex = LEVELS.findIndex((level) => level.id === selectedLevel.id);
        const followingLevel = LEVELS[levelIndex + 1];
        const unlocked = followingLevel && !current.unlocked.includes(followingLevel.id) ? [...current.unlocked, followingLevel.id] : current.unlocked;
        return { completed, unlocked };
      });
    }
  }, [board, cells, commitCells, phase, selectedLevel.id]);

  const clearCell = useCallback((row: number, col: number) => {
    if (phase !== "playing" || cells[row][col] === "empty") return;
    const next = cloneCells(cells);
    next[row][col] = "empty";
    commitCells(next);
  }, [cells, commitCells, phase]);

  const paintDraggedCell = useCallback((row: number, col: number) => {
    const gesture = dragGesture.current;
    if (!gesture || gesture.mode === "none" || (gesture.moved && gesture.visited.has(boardCellKey({ row, col })))) return;
    const key = boardCellKey({ row, col });
    const expectedState = gesture.mode === "mark" ? "empty" : "mark";
    if (gesture.baseCells[row][col] !== expectedState) return;
    gesture.moved = true;
    gesture.visited.add(key);
    const pending = pendingTaps.current.get(gesture.startKey);
    if (pending) {
      window.clearTimeout(pending);
      pendingTaps.current.delete(gesture.startKey);
    }
    if (!gesture.historyCaptured) {
      setHistory((current) => [...current, cloneCells(gesture.baseCells)]);
      gesture.historyCaptured = true;
    }
    setCells((current) => {
      if (current[row][col] !== expectedState) return current;
      const next = cloneCells(current);
      next[row][col] = gesture.mode === "mark" ? "mark" : "empty";
      return next;
    });
  }, []);

  const onPointerDown = useCallback((row: number, col: number, event: PointerEvent<HTMLButtonElement>) => {
    if ((event.button !== 0 && event.pointerType !== "touch") || phase !== "playing") return;
    const key = boardCellKey({ row, col });
    pointerStart.current = { key, x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    const mode = cells[row][col] === "mark" ? "erase" : cells[row][col] === "empty" ? "mark" : "none";
    dragGesture.current = { pointerId: event.pointerId, startKey: key, baseCells: cloneCells(cells), mode, moved: false, visited: new Set(), historyCaptured: false };
  }, [cells, phase]);

  const onPointerEnter = useCallback((row: number, col: number, event: PointerEvent<HTMLButtonElement>) => {
    const gesture = dragGesture.current;
    if (!gesture || gesture.pointerId !== event.pointerId || (event.buttons === 0 && event.pointerType !== "touch")) return;
    const start = pointerStart.current;
    if (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) <= 10) return;
    const [startRow, startCol] = start.key.split(":").map(Number);
    paintDraggedCell(startRow, startCol);
    paintDraggedCell(row, col);
  }, [paintDraggedCell]);

  const onPointerUp = useCallback((row: number, col: number, event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 && event.pointerType !== "touch") return;
    const key = boardCellKey({ row, col });
    const start = pointerStart.current;
    pointerStart.current = null;
    const gesture = dragGesture.current;
    dragGesture.current = null;
    if (gesture?.pointerId === event.pointerId && gesture.moved) return;
    if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) return;
    const pending = pendingTaps.current.get(key);
    if (pending) {
      window.clearTimeout(pending);
      pendingTaps.current.delete(key);
      performDouble(row, col);
      return;
    }
    const timer = window.setTimeout(() => {
      pendingTaps.current.delete(key);
      performSingle(row, col);
    }, 280);
    pendingTaps.current.set(key, timer);
  }, [performDouble, performSingle]);

  const onKeyDown = useCallback((row: number, col: number, event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === " ") {
      event.preventDefault();
      performSingle(row, col);
    } else if (event.key === "Enter") {
      event.preventDefault();
      performDouble(row, col);
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      clearCell(row, col);
    }
  }, [clearCell, performDouble, performSingle]);

  const undo = useCallback(() => {
    if (phase !== "playing" || history.length === 0) return;
    setCells(cloneCells(history[history.length - 1]));
    setHistory((current) => current.slice(0, -1));
  }, [history, phase]);

  const restart = useCallback(() => {
    beginGame(board, selectedLevel);
  }, [beginGame, board, selectedLevel]);

  const isLevelUnlocked = useCallback((id: string) => progress.unlocked.includes(id) || (infiniteMode && id.startsWith("infinite-")), [infiniteMode, progress.unlocked]);
  const isLevelCompleted = useCallback((id: string) => progress.completed.includes(id), [progress.completed]);
  const chomps = positionsFromCells(cells).length;
  const nextLevel = infiniteMode ? createInfiniteLevel(infiniteRound + 1) : LEVELS[LEVELS.findIndex((level) => level.id === selectedLevel.id) + 1];

  const value = useMemo<GameContextValue>(() => ({
    progress,
    selectedLevel,
    board,
    cells,
    historyLength: history.length,
    lives,
    phase,
    invalidCell,
    generationState,
    generationError,
    infiniteMode,
    chomps,
    nextLevel,
    isLevelUnlocked,
    isLevelCompleted,
    openLevel,
    startInfinite,
    loadLevelFromRoute,
    restart,
    undo,
    openRules: () => setRulesOpen(true),
    closeRules: () => setRulesOpen(false),
    rulesOpen,
    onPointerDown,
    onPointerEnter,
    onPointerUp,
    onKeyDown,
  }), [board, cells, chomps, generationError, generationState, history.length, infiniteMode, isLevelCompleted, isLevelUnlocked, invalidCell, lives, loadLevelFromRoute, nextLevel, onKeyDown, onPointerDown, onPointerEnter, onPointerUp, openLevel, phase, progress, restart, rulesOpen, selectedLevel, startInfinite, undo]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame deve ser usado dentro de GameProvider");
  return context;
}

export { DIFFICULTY_LABELS };
