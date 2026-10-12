import { describe, expect, it } from "vitest";
import { generatePuzzle } from "./generator";
import { countSolutions } from "./solver";
import { validateBoard } from "./rules";

describe("gerador reproduzível", () => {
  it("gera um tabuleiro válido, conectado e de solução única", () => {
    const first = generatePuzzle(4, 4040);
    const second = generatePuzzle(4, 4040);
    expect(first.regions).toEqual(second.regions);
    expect(validateBoard(first)).toBe(true);
    expect(countSolutions(first)).toBe(1);
  });

  it("também consegue preparar um nível fácil 5×5", () => {
    const board = generatePuzzle(5, 2501);
    expect(validateBoard(board)).toBe(true);
    expect(countSolutions(board)).toBe(1);
  });

  it("prepara o primeiro nível difícil 8×8", () => {
    const board = generatePuzzle(8, 2801);
    expect(validateBoard(board)).toBe(true);
    expect(Math.min(...board.regions.flat().map((region) => board.regions.flat().filter((value) => value === region).length))).toBeGreaterThanOrEqual(4);
    expect(countSolutions(board)).toBe(1);
  });

  it("prepara os níveis 9×9 e 10×10", () => {
    const nine = generatePuzzle(9, 2901);
    const ten = generatePuzzle(10, 3001);
    expect(validateBoard(nine)).toBe(true);
    expect(validateBoard(ten)).toBe(true);
    expect(Math.min(...nine.regions.flat().map((region) => nine.regions.flat().filter((value) => value === region).length))).toBeGreaterThanOrEqual(4);
    expect(Math.min(...ten.regions.flat().map((region) => ten.regions.flat().filter((value) => value === region).length))).toBeGreaterThanOrEqual(5);
    expect(countSolutions(nine)).toBe(1);
    expect(countSolutions(ten)).toBe(1);
  });
});
