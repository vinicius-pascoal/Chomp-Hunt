import type { Board, Position } from "./board";
import { canPlaceChomp } from "./rules";

export type SolverResult = {
  count: number;
  solutions: Position[][];
  nodes: number;
};

export function solve(board: Board, limit = 2): SolverResult {
  const solutions: Position[][] = [];
  const usedColumns = new Set<number>();
  const usedRegions = new Set<number>();
  let nodes = 0;

  function search(row: number, placed: Position[]): void {
    if (solutions.length >= limit) return;
    nodes += 1;
    if (row === board.size) {
      solutions.push(placed.map((position) => ({ ...position })));
      return;
    }

    for (let col = 0; col < board.size; col += 1) {
      const region = board.regions[row][col];
      if (usedColumns.has(col) || usedRegions.has(region)) continue;
      if (!canPlaceChomp(board, placed, { row, col }).valid) continue;
      const position = { row, col };
      usedColumns.add(col);
      usedRegions.add(region);
      search(row + 1, [...placed, position]);
      usedColumns.delete(col);
      usedRegions.delete(region);
      if (solutions.length >= limit) return;
    }
  }

  search(0, []);
  return { count: solutions.length, solutions, nodes };
}

export function countSolutions(board: Board): number {
  return solve(board, 2).count;
}
