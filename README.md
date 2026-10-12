# Chomp Hunt

Chomp Hunt é um puzzle lógico cozy pixel art em Next.js, TypeScript e Tailwind CSS. O objetivo é posicionar um Chomp por linha, coluna e região, sem que dois Chomps sejam adjacentes — inclusive na diagonal.

## Executar

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

Comandos de verificação:

```bash
npm run lint
npm test
npm run build
```

## Controles

- Toque/clique: alterna uma marca X.
- Dois toques/cliques na mesma célula: tenta posicionar um Chomp.
- Em uma célula com Chomp, toque simples substitui por X; toque duplo remove o Chomp.
- Teclado: Espaço marca, Enter tenta posicionar e Delete/Backspace limpa.
- Uma tentativa em conflito consome uma vida. Uma hipótese válida que ainda não fecha o mapa não consome vida.

## Arquitetura

- `src/lib/board.ts`: tipos, puzzle tutorial e estado das células.
- `src/lib/rules.ts`: regras, conflitos e integridade das regiões.
- `src/lib/solver.ts`: backtracking com poda e contagem limitada a duas soluções.
- `src/lib/generator.ts`: geração reproduzível, regiões conectadas e unicidade.
- `src/lib/generator.worker.ts`: execução do gerador fora da thread da interface.
- `src/lib/difficulty.ts`: catálogo de dificuldades e progressão.
- `src/components/`: sprite, botões e tabuleiro reutilizáveis.
- `app/page.tsx`: telas, reducer implícito de partida, gestos e persistência.

O progresso desbloqueado e os níveis concluídos são salvos em `localStorage` com a chave `chomp-hunt-progress`. A fonte Fredoka é carregada globalmente com `next/font/google`. Os caminhos dos assets são centralizados em `src/lib/assets.ts` e os PNGs originais ficam em `public/assets`.

## Limitações conhecidas

- O tutorial e o primeiro nível usam o puzzle 4×4 obrigatório. Níveis maiores são gerados sob demanda no Web Worker e exibem uma mensagem recuperável se o limite de tentativas não encontrar uma solução única.
- A spritesheet fornecida possui três variantes visuais, não quatro direções completas; o componente seleciona linha, frame, FPS e tamanho sem borrar a pixel art.
- Os assets do Cozy UI são uma demo; verifique os termos do autor antes de publicar comercialmente.
