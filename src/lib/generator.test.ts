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
});
