export type DifficultyKey = "tutorial" | "easy" | "medium" | "hard" | "expert";

export type LevelDefinition = {
  id: string;
  label: string;
  title: string;
  size: number;
  seed: number;
  description: string;
  difficulty: DifficultyKey;
};

export const LEVELS: LevelDefinition[] = [
  { id: "tutorial-4x4", label: "01", title: "Primeiro mordisco", size: 4, seed: 2401, description: "Aprenda o ritmo do Chomp Hunt.", difficulty: "tutorial" },
  { id: "easy-4x4", label: "02", title: "Caminho de migalhas", size: 4, seed: 2402, description: "Mais de um caminho para observar.", difficulty: "easy" },
  { id: "easy-5x5", label: "03", title: "Lanche no bosque", size: 5, seed: 2501, description: "Regiões maiores, olhos atentos.", difficulty: "easy" },
  { id: "medium-6x6", label: "04", title: "Trilha escondida", size: 6, seed: 2601, description: "As pistas começam a se cruzar.", difficulty: "medium" },
  { id: "medium-7x7", label: "05", title: "Folhas ao vento", size: 7, seed: 2701, description: "Pense uma casa à frente.", difficulty: "medium" },
  { id: "hard-8x8", label: "06", title: "Bosque profundo", size: 8, seed: 2801, description: "O silêncio esconde boas respostas.", difficulty: "hard" },
  { id: "hard-9x9", label: "07", title: "Noite de cogumelos", size: 9, seed: 2901, description: "Um desafio para olhos treinados.", difficulty: "hard" },
  { id: "expert-10x10", label: "08", title: "A grande caçada", size: 10, seed: 3001, description: "O maior mapa da toca.", difficulty: "expert" },
];

export const DIFFICULTY_LABELS: Record<DifficultyKey, string> = {
  tutorial: "Tutorial",
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
  expert: "Especialista",
};

export function getLevel(id: string): LevelDefinition {
  return LEVELS.find((level) => level.id === id) ?? LEVELS[0];
}
