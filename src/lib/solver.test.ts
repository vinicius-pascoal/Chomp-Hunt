import { describe, expect, it } from "vitest";
import { EASY_BOARD, TUTORIAL_BOARD } from "./board";
import { countSolutions, solve } from "./solver";

describe("solucionador", () => {
  it("encontra exatamente uma solução no primeiro nível", () => {
    const result = solve(TUTORIAL_BOARD);
    expect(result.count).toBe(1);
    expect(result.solutions[0].map((position) => position.col)).toEqual([2, 0, 3, 1]);
  });

  it("para a contagem no limite de duas soluções", () => {
    const openBoard = { ...TUTORIAL_BOARD, regions: Array.from({ length: 4 }, (_, row) => Array.from({ length: 4 }, (_, col) => (row + col) % 4)) };
    expect(countSolutions(openBoard)).toBeLessThanOrEqual(2);
  });

  it("mantém o segundo nível 4×4 diferente e único", () => {
    expect(EASY_BOARD.regions).not.toEqual(TUTORIAL_BOARD.regions);
    expect(countSolutions(EASY_BOARD)).toBe(1);
  });
});
