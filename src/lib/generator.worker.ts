import { generatePuzzle } from "./generator";

self.onmessage = (event: MessageEvent<{ size: number; seed: number }>) => {
  try {
    self.postMessage({ ok: true, board: generatePuzzle(event.data.size, event.data.seed) });
  } catch (error) {
    self.postMessage({ ok: false, error: error instanceof Error ? error.message : "Falha ao gerar o puzzle." });
  }
};
