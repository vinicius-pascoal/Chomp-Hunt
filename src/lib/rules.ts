import type { Board, Position } from "./board";

export type Conflict = "row" | "column" | "region" | "adjacent" | "outside";

export type PlacementCheck = { valid: true } | { valid: false; conflict: Conflict };

export function isInside(board: Board, position: Position): boolean {
  return (
    position.row >= 0 &&
    position.row < board.size &&
    position.col >= 0 &&
    position.col < board.size
  );
}

export function areAdjacent(a: Position, b: Position): boolean {
  return (
    a.row !== b.row || a.col !== b.col
  ) &&
    Math.abs(a.row - b.row) <= 1 &&
    Math.abs(a.col - b.col) <= 1;
}

export function canPlaceChomp(
  board: Board,
  placed: Position[],
  position: Position,
): PlacementCheck {
  if (!isInside(board, position)) return { valid: false, conflict: "outside" };
  if (placed.some((item) => item.row === position.row)) {
    return { valid: false, conflict: "row" };
  }
  if (placed.some((item) => item.col === position.col)) {
    return { valid: false, conflict: "column" };
  }
  if (placed.some((item) => board.regions[item.row][item.col] === board.regions[position.row][position.col])) {
    return { valid: false, conflict: "region" };
  }
  if (placed.some((item) => areAdjacent(item, position))) {
    return { valid: false, conflict: "adjacent" };
  }
  return { valid: true };
}

export function isComplete(board: Board, placed: Position[]): boolean {
  if (placed.length !== board.size) return false;
  const rows = new Set(placed.map((position) => position.row));
  const columns = new Set(placed.map((position) => position.col));
  const regions = new Set(
    placed.map((position) => board.regions[position.row][position.col]),
  );
  return rows.size === board.size && columns.size === board.size && regions.size === board.size;
}

export function validateRegionMap(regions: number[][], size: number): boolean {
  if (regions.length !== size || regions.some((row) => row.length !== size)) return false;
  const values = regions.flat();
  const unique = new Set(values);
  if (unique.size !== size || [...unique].some((value) => value < 0 || value >= size)) return false;

  for (const region of unique) {
    const cells = regions.flatMap((row, rowIndex) =>
      row.flatMap((value, colIndex) => (value === region ? [{ row: rowIndex, col: colIndex }] : [])),
    );
    const seen = new Set([`${cells[0].row}:${cells[0].col}`]);
    const queue = [cells[0]];
    while (queue.length) {
      const current = queue.shift();
      if (!current) break;
      for (const delta of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const next = { row: current.row + delta[0], col: current.col + delta[1] };
        const key = `${next.row}:${next.col}`;
        if (
          next.row >= 0 && next.row < size &&
          next.col >= 0 && next.col < size &&
          regions[next.row][next.col] === region &&
          !seen.has(key)
        ) {
          seen.add(key);
          queue.push(next);
        }
      }
    }
    if (seen.size !== cells.length) return false;
  }
  return true;
}

export function validateBoard(board: Board): boolean {
  return board.size >= 1 && validateRegionMap(board.regions, board.size);
}
