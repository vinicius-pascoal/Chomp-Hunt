import type { Board, Position } from "./board";
import { countSolutions } from "./solver";
import { validateBoard, validateRegionMap } from "./rules";

type Random = () => number;

function mulberry32(seed: number): Random {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: Random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function findNonAdjacentSolution(size: number, random: Random): Position[] | null {
  const columns = new Set<number>();
  const result: Position[] = [];
  function search(row: number): boolean {
    if (row === size) return true;
    for (const col of shuffle(Array.from({ length: size }, (_, index) => index), random)) {
      if (columns.has(col)) continue;
      if (result.some((position) => Math.abs(position.row - row) <= 1 && Math.abs(position.col - col) <= 1)) continue;
      columns.add(col);
      result.push({ row, col });
      if (search(row + 1)) return true;
      result.pop();
      columns.delete(col);
    }
    return false;
  }
  return search(0) ? result : null;
}

function growRegions(size: number, solution: Position[], random: Random): number[][] {
  const regions = Array.from({ length: size }, () => Array(size).fill(-1));
  const frontier: Position[] = [];
  solution.forEach((position, region) => {
    regions[position.row][position.col] = region;
    frontier.push(position);
  });
  while (frontier.length) {
    const frontierIndex = Math.floor(random() * frontier.length);
    const current = frontier[frontierIndex];
    const neighbors = shuffle(
      [[1, 0], [-1, 0], [0, 1], [0, -1]],
      random,
    ).map(([row, col]) => ({ row: current.row + row, col: current.col + col }))
      .filter((next) => next.row >= 0 && next.row < size && next.col >= 0 && next.col < size && regions[next.row][next.col] === -1);
    if (!neighbors.length) {
      frontier.splice(frontierIndex, 1);
      continue;
    }
    const next = neighbors[0];
    regions[next.row][next.col] = regions[current.row][current.col];
    frontier.push(next);
  }
  return regions;
}

export function generatePuzzle(size: number, seed: number, maxAttempts = 160): Board {
  if (!Number.isInteger(size) || size < 4) throw new Error("O tamanho mínimo do tabuleiro é 4x4.");
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const random = mulberry32(seed + attempt * 7919);
    const solution = findNonAdjacentSolution(size, random);
    if (!solution) continue;
    const regions = growRegions(size, solution, random);
    const candidate: Board = { id: `generated-${size}x${size}-${seed}`, size, seed, regions, solution };
    if (!validateRegionMap(regions, size) || !validateBoard(candidate)) continue;
    if (countSolutions(candidate) === 1) return candidate;
  }
  throw new Error(`Não foi possível preparar um puzzle ${size}x${size} único agora.`);
}

export function generateWithFallback(size: number, seed: number): Board {
  return generatePuzzle(size, seed);
}
