# Chomp Hunt - assets prontos para Next.js

Este arquivo ZIP deve ser extraído **na raiz do projeto Next.js**.

## Conteúdo

- `public/assets/characters/chomp/chomp_idle.png`: spritesheet original de 128x96 px, 4 colunas, 3 linhas, 32x32 por frame.
  - Linha 0 = rosto simples; linha 1 = rosto com expressão/boca; linha 2 = costas.
    São três linhas visuais, não quatro direções completas.
- `public/assets/ui/cozy/`: 76 imagens PNG originais do pack DEMO, sem renomear.
- `docs/cozy-ui-author-note.txt`: texto informativo incluído pelo autor original.

## Arquivos recomendados

- HUD vidas: `ui/cozy/icons/default/32px/IconsDefault38_32px.png` (coração vermelho);
  `ui/cozy/icons/default/32px/IconsDefault39_32px.png` (coração escuro).
- Botão primário: `ui/cozy/buttons/round/RoundButton2_white.png`.
- Botão secundário: `ui/cozy/buttons/round/RoundButton2_wood.png`.
- Ações quadradas: `ui/cozy/buttons/square/SquareButton2_white.png`.
- Cards: `ui/cozy/cards/CardRegular1_wood.png`.
- Painel: `ui/cozy/containers/Container1.png` e `ui/cozy/containers/NoteContainerSimple.png`.
- Setas: `ui/cozy/arrows/ArrowBrownOuline16.png` etc. (o original escreve `Ouline`, sem o `t`).
- Marcador X: desenhar com CSS/texto ou usar `ui/cozy/icons/default/32px/IconsDefault25_32px.png` (ícone de X de erro, optativo).
- As imagens de botão prontas `ButtonPrefab_buy/claim/exitGame.png` têm texto embutido:
  NÃO usar para botões genéricos, preferir as versões `RoundButton` e `SquareButton` vazias.

Em Next.js, um arquivo `public/assets/ui/cozy/...` é acessível com URL `/assets/ui/cozy/...`.
A fonte Fredoka deve ser carregada via `next/font/google` e não está incluída neste ZIP.

## Direitos de uso

O ZIP original do Cozy UI é uma versão demo do pacote de `dobo_ui` (https://dobo-ui.itch.io/).
A nota da demo não especifica licença de redistribuição ou uso comercial.
Verifique os termos oficiais do autor antes de publicar. O personagem Chomp foi incluído como enviado pelo usuário;
verifique também sua licença de uso conforme a origem do sprite.
