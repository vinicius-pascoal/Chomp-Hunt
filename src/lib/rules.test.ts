import { describe, expect, it } from "vitest";
import { TUTORIAL_BOARD, type Position } from "./board";
import { areAdjacent, canPlaceChomp, isComplete, validateBoard } from "./rules";

describe("regras do tabuleiro", () => {
  it("valida o puzzle tutorial e suas quatro regiões conectadas", () => {
    expect(validateBoard(TUTORIAL_BOARD)).toBe(true);
  });

  it("rejeita linha, coluna, região e diagonal", () => {
    const placed: Position[] = [{ row: 0, col: 2 }];
    expect(canPlaceChomp(TUTORIAL_BOARD, placed, { row: 0, col: 0 })).toEqual({ valid: false, conflict: "row" });
    expect(canPlaceChomp(TUTORIAL_BOARD, placed, { row: 1, col: 2 })).toEqual({ valid: false, conflict: "column" });
    const regionBoard = { ...TUTORIAL_BOARD, regions: TUTORIAL_BOARD.regions.map((row) => [...row]) };
    regionBoard.regions[2][1] = regionBoard.regions[0][2];
    expect(canPlaceChomp(regionBoard, placed, { row: 2, col: 1 })).toEqual({ valid: false, conflict: "region" });
    expect(canPlaceChomp(TUTORIAL_BOARD, placed, { row: 1, col: 3 })).toEqual({ valid: false, conflict: "adjacent" });
  });

  it("considera a diagonal como adjacência, mas não a mesma célula", () => {
    expect(areAdjacent({ row: 1, col: 1 }, { row: 2, col: 2 })).toBe(true);
    expect(areAdjacent({ row: 1, col: 1 }, { row: 1, col: 1 })).toBe(false);
  });

  it("reconhece uma solução completa sem expor a solução ao jogador", () => {
    expect(isComplete(TUTORIAL_BOARD, TUTORIAL_BOARD.solution ?? [])).toBe(true);
  });
});
