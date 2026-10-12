export type CellState = "empty" | "mark" | "chomp";

export type Position = { row: number; col: number };

export type Board = {
  id: string;
  size: number;
  regions: number[][];
  seed: number;
  solution?: Position[];
};

export type GameCells = CellState[][];

export const TUTORIAL_REGIONS = [
  [1, 1, 0, 0],
  [1, 1, 0, 2],
  [1, 3, 0, 2],
  [3, 3, 3, 2],
] as const;

export const TUTORIAL_SOLUTION: Position[] = [
  { row: 0, col: 2 },
  { row: 1, col: 0 },
  { row: 2, col: 3 },
  { row: 3, col: 1 },
];

export const TUTORIAL_BOARD: Board = {
  id: "tutorial-4x4",
  size: 4,
  regions: TUTORIAL_REGIONS.map((row) => [...row]),
  seed: 2401,
  solution: TUTORIAL_SOLUTION,
};

export function createEmptyCells(size: number): GameCells {
  return Array.from({ length: size }, () =>
    Array<CellState>(size).fill("empty"),
  );
}

export function cloneCells(cells: GameCells): GameCells {
  return cells.map((row) => [...row]);
}

export function positionsFromCells(cells: GameCells): Position[] {
  const positions: Position[] = [];
  cells.forEach((row, rowIndex) =>
    row.forEach((state, colIndex) => {
      if (state === "chomp") positions.push({ row: rowIndex, col: colIndex });
    }),
  );
  return positions;
}

export function boardCellKey(position: Position): string {
  return `${position.row}:${position.col}`;
}
