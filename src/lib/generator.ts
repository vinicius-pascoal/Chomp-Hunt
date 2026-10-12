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

function regionSizes(regions: number[][], size: number): number[] {
  return Array.from({ length: size }, (_, region) => regions.flat().filter((value) => value === region).length);
}

function hasReadableRegions(regions: number[][], size: number): boolean {
  return regionSizes(regions, size).every((count) => count >= Math.max(3, Math.floor(size / 2)));
}

function growGuaranteedRegions(size: number, solution: Position[], seed: number): number[][] | null {
  const random = mulberry32(seed + 4000007);
  let regions = Array.from({ length: size }, () => Array(size).fill(0));
  solution.slice(1).forEach((position) => {
    regions[position.row][position.col] = position.row;
  });
  const minimumRegionSize = Math.max(3, Math.floor(size / 2));
  let changed = true;

  while (changed) {
    changed = false;
    const regionOrder = shuffle(Array.from({ length: size - 1 }, (_, index) => index + 1), random)
      .sort((a, b) => regionSizes(regions, size)[a] - regionSizes(regions, size)[b]);
    for (const region of regionOrder) {
      if (regionSizes(regions, size)[region] >= minimumRegionSize) continue;
      const candidates = shuffle(
        regions.flatMap((row, rowIndex) => row.flatMap((value, colIndex) => value === 0 ? [{ row: rowIndex, col: colIndex }] : [])),
        random,
      ).filter((cell) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([row, col]) => {
        const nextRow = cell.row + row;
        const nextCol = cell.col + col;
        return nextRow >= 0 && nextRow < size && nextCol >= 0 && nextCol < size && regions[nextRow][nextCol] === region;
      }));
      for (const cell of candidates) {
        const nextRegions = regions.map((row) => [...row]);
        nextRegions[cell.row][cell.col] = region;
        const candidate: Board = { id: `generated-${size}x${size}-${seed}-grown`, size, seed, regions: nextRegions, solution };
        if (validateBoard(candidate) && countSolutions(candidate) === 1) {
          regions = nextRegions;
          changed = true;
          break;
        }
      }
    }
  }

  return regionSizes(regions, size).every((count) => count >= minimumRegionSize) ? regions : null;
}

function createGuaranteedPuzzle(size: number, seed: number): Board {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const random = mulberry32(seed + 1000003 + attempt * 7919);
    const solution = findNonAdjacentSolution(size, random);
    if (!solution) continue;
    const regions = growGuaranteedRegions(size, solution, seed + attempt);
    if (!regions) continue;
    const candidate: Board = { id: `generated-${size}x${size}-${seed}-grown`, size, seed, regions, solution };
    if (validateBoard(candidate) && countSolutions(candidate) === 1) return candidate;
  }
  throw new Error(`Não foi possível preparar um puzzle ${size}x${size} único agora.`);
}

export function generatePuzzle(size: number, seed: number, maxAttempts = 5000): Board {
  if (!Number.isInteger(size) || size < 4) throw new Error("O tamanho mínimo do tabuleiro é 4x4.");
  const attempts = size >= 8 ? Math.min(maxAttempts, 1000) : maxAttempts;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const random = mulberry32(seed + attempt * 7919);
    const solution = findNonAdjacentSolution(size, random);
    if (!solution) continue;
    const regions = growRegions(size, solution, random);
    const candidate: Board = { id: `generated-${size}x${size}-${seed}`, size, seed, regions, solution };
    if (!validateRegionMap(regions, size) || !validateBoard(candidate)) continue;
    if (size >= 8 && !hasReadableRegions(regions, size)) continue;
    if (countSolutions(candidate) === 1) return candidate;
  }
  return createGuaranteedPuzzle(size, seed);
}

export function generateWithFallback(size: number, seed: number): Board {
  return generatePuzzle(size, seed);
}
