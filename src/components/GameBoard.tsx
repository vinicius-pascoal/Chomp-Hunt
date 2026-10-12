"use client";

import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import type { Board, GameCells } from "@/src/lib/board";
import { ChompSprite } from "./ChompSprite";

const REGION_CLASSES = ["region-mint", "region-sky", "region-butter", "region-lilac", "region-peach", "region-blue", "region-rose", "region-green", "region-sand", "region-coral"];

type GameBoardProps = {
  board: Board;
  cells: GameCells;
  invalidCell: string | null;
  disabled?: boolean;
  onPointerDown: (row: number, col: number, event: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (row: number, col: number, event: PointerEvent<HTMLButtonElement>) => void;
  onKeyDown: (row: number, col: number, event: KeyboardEvent<HTMLButtonElement>) => void;
};

export function GameBoard({ board, cells, invalidCell, disabled = false, onPointerDown, onPointerUp, onKeyDown }: GameBoardProps) {
  return (
    <div className="board-frame" style={{ "--board-size": board.size } as CSSProperties}>
      <div className="game-board" role="grid" aria-label={`Tabuleiro ${board.size} por ${board.size}`}>
        {cells.map((row, rowIndex) => row.map((state, colIndex) => {
          const key = `${rowIndex}:${colIndex}`;
          const region = board.regions[rowIndex][colIndex];
          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              aria-label={`Linha ${rowIndex + 1}, coluna ${colIndex + 1}, ${state === "empty" ? "vazia" : state === "mark" ? "marcada" : "Chomp"}`}
              className={`game-cell ${REGION_CLASSES[region % REGION_CLASSES.length]} ${state === "mark" ? "cell-mark" : ""} ${state === "chomp" ? "cell-chomp" : ""} ${invalidCell === key ? "cell-invalid" : ""}`}
              disabled={disabled}
              onPointerDown={(event) => onPointerDown(rowIndex, colIndex, event)}
              onPointerUp={(event) => onPointerUp(rowIndex, colIndex, event)}
              onKeyDown={(event) => onKeyDown(rowIndex, colIndex, event)}
            >
              {state === "mark" && <span className="mark-symbol" aria-hidden>×</span>}
              {state === "chomp" && <ChompSprite size={Math.min(72, Math.max(38, 300 / board.size))} label="Chomp posicionado" />}
            </button>
          );
        }))}
      </div>
    </div>
  );
}
