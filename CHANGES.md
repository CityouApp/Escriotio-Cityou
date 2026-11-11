# Escritório Cityou — v5.1 (apelidos e locais do time)

- Apelidos na interface: **Fifo** (Luiz Felipe), **Luixx** (Luiz Carlos) e **Xandy** (Alexandre), com o nome completo como texto secundário. Iniciais e ids (LF, LC, AX) não mudaram, então tarefas, insígnias e filtros salvos continuam ligados.
- Locais padrão: Fifo no Rio de Janeiro (America/Sao_Paulo), Luixx em Brasília (America/Sao_Paulo) e Xandy no Texas, EUA (America/Chicago), todos 9:00–18:00 no horário local. Hoje (Chicago em CST, UTC−6) a janela em comum é de 6 h, das 12:00 às 18:00 em Brasília; com o horário de verão de Chicago (CDT, UTC−5) passa a 7 h, das 11:00 às 18:00. O cálculo usa `Intl` na data atual.
- Migração: os dados de equipe da v5 (cidade vazia e fuso de Brasília para todos) recebem os novos padrões. Os valores que o usuário já editou ficam como estão.

---

# Escritório Cityou — v5 (abas conectadas + trabalho à distância)

## Novidades
- **Abas conectadas**: Quadro, Equipe & locais e Atividade & decisões agora funcionam, com indicador animado que desliza entre elas (GSAP). Filtros, busca, ordenação e seleção continuam iguais ao trocar de aba. Atalhos: `1`, `2`, `3`.
- **Quadro ↔ Lista**: alternador com pílula deslizante (tecla `V`). A troca usa GSAP Flip, então cada cartão vira a sua linha. A visão escolhida fica salva.
- **Fusos e janela em comum** (aba Equipe): relógio de cada sócio calculado com `Intl` no aparelho (sem internet), régua de 24 h no seu horário com o expediente de cada um e a faixa em que os três estão disponíveis. Cidade, fuso e expediente de cada sócio são editáveis; o padrão é Brasília (America/Sao_Paulo) para todos.
- **Passagem de bastão**: botão ⚡ em cada cartão para passar a tarefa a outro sócio com recado. O selo "Bastão com…" aparece no cartão e na lista, há a visão salva "Bastão comigo" e a lista de bastões por sócio. Ao concluir a tarefa o bastão é recolhido.
- **Check-in do dia**: foco, cidade e bloqueios de cada sócio, com hora do último check-in.
- **Registro de decisões** com autor, data e tarefa ligada, e **feed de atividade** (criação, movimento, conclusão, bastão, check-in, decisão, importação) com filtro e clique que abre a tarefa.
- **Paleta de comandos** (`Ctrl+K` / `⌘K`, ou o atalho no campo de busca): ir para abas, filtros, sócio, nova tarefa, check-in, decisão, exportar/importar e busca de tarefas por título.
- **Exportar / importar** (botão "Sincronizar"): baixa um `.json` com tarefas, bastões, check-ins, decisões e insígnias, ou importa por arquivo ou texto colado. Serve para os três sincronizarem sem servidor.

## Dados
- Tarefas continuam em `nos_estudio_kanban_v3` (agora com o campo opcional `handoff`); dados antigos são lidos sem perda.
- Colaboração em `cityou_collab_v1`, visão em `cityou_view_v1`. Insígnias continuam em `cityou_insignias_v1`.

## Fora desta rodada
- Sincronização automática entre aparelhos, presença em tempo real e avisos de bastão precisam de servidor (Cloudflare Durable Objects/KV) e ficaram para depois.
- A proposta do Gemini de trocar as insígnias por outros brasões não foi aplicada: as 9 insígnias do time continuam as mesmas.

---

# Escritório Cityou — v4 (insígnias + links vivos + acabamento premium)

## Novidades
- **Seletor de insígnias** (9 opções, SVG desenhado à mão, cada uma com cor e animação própria). Abre pelo botão "Insígnia" no medalhão, pelo bloco "Time e insígnias" da barra lateral, ou pelo popover do sócio. Salvo em `localStorage` (`cityou_insignias_v1`).
  1. Dedo do Meio · 2. Pedaço de Coco · 3. Folha da Vila · 4. Mangekyō Sharingan · 5. Cardinal TVCC · 6. Rasengan · 7. Shuriken · 8. Nuvem Rubra · 9. Pirâmide de Stunt
- **Insígnias em todo lugar**: medalhões, barra lateral, avatares dos cartões, escolha de responsáveis no modal e gaveta de detalhes.
- **Responsáveis vivos nos cartões** (`AssigneeStack` + `MemberAvatar`): anel de presença girando/respirando na cor do sócio, hover com elevação + inclinação 3D (gsap.quickTo) + tooltip, clique abre popover (insígnia, tarefas / na forja / concluídas, remover/atribuir, filtrar, trocar insígnia), botão "+" para alternar quem trabalha na tarefa, fio de energia tracejado com partículas de chakra entre os responsáveis, entrada/saída com GSAP.
- **Acabamento premium** (`src/assets/premium.css`): tokens de tipo/espaço/raio/sombra/easing, superfícies de vidro com grão, botão "Nova tarefa" magnético (diretiva `v-magnetic`) com brilho, estados de pressão, holofote que segue o cursor nas colunas, contadores animados, esqueletos de carregamento, estados vazios com ação "Criar tarefa aqui", toasts com tom (sucesso/info), fantasma de arraste que inclina com a velocidade e pousa no lugar final (FLIP).
- Tipografia: Cinzel (títulos) + Chakra Petch (rótulos) + Manrope (texto). Emojis usados como ícones trocados por SVG.

## Skills aplicadas
- **frontend-design (Anthropic)**: sem rótulos em caixa alta forçada, sem "→"/emoji como ícone, uma sequência de entrada orquestrada só, movimento que responde à ação.
- **ui-ux-pro-max**: par tipográfico gaming (Chakra Petch), alvos de toque ≥ 44px nos menus, hover 150–300 ms, saída mais rápida que entrada, linear para giros, stagger em grade, sem emoji como ícone.
- **impeccable (audit/polish)**: detector rodado na página; corrigidos texto funcional < 11px, gradiente em texto do título e pontos pulsando infinitamente; movimento reduzido agora preserva feedback (transições curtas) em vez de zerar tudo. Brilhos coloridos mantidos de propósito (identidade anime/chakra pedida pelo time).
- **gsap-skills**: transform/opacity/autoAlpha em vez de propriedades de layout, `gsap.quickTo` para inclinação e magnetismo, `gsap.matchMedia` para prefers-reduced-motion, limpeza em `onBeforeUnmount`.


---

# Alterações no quadro (board-final)

Cópia de `/workspace/qwen/output_v2/`. A pasta original não foi alterada.

## Correções feitas

1. **Nomes dos sócios.** O código do Qwen ainda usava Marina, Rafael e Julia (iniciais MC, RL e JA). Troquei pelos três sócios:
   - Luiz Felipe (LF), usuário logado, com a tag “(você)”
   - Luiz Carlos (LC)
   - Alexandre 'Xande' (AX)
   Isso foi feito em `src/composables/useBoard.js` (lista de sócios, usuário atual e tarefas de exemplo) e no cumprimento do cabeçalho em `src/views/BoardView.vue` (“Bom dia, Luiz Felipe”).

2. **Avatares no CSS.** As classes `.avatar-MC`, `.avatar-RL` e `.avatar-JA` em `src/assets/board.css` passaram a ser `.avatar-LF`, `.avatar-LC` e `.avatar-AX`, para combinar com as novas iniciais.

3. **Chave do localStorage.** A chave de persistência mudou de `nos_estudio_kanban_v2` para `nos_estudio_kanban_v3`. Assim o quadro não reaproveita um salvamento antigo com os nomes e as iniciais errados.

## Build e execução

- Não foi preciso criar um `App.vue`: o `src/main.js` já monta o `BoardView` direto no `#app`.
- As dependências `vue`, `gsap`, `vite` e `@vitejs/plugin-vue` já estavam no `package.json`. Não alterei esse arquivo.
- `npm install` e `npm run build` passaram na primeira tentativa, sem erro de import ou de compilação.
- No `vite preview`, o console do navegador não mostrou erro nem aviso em tempo de execução. Nada mais precisou ser corrigido no código por causa disso.

## Testes manuais (Playwright, Chromium headless)

- Criar tarefa pelo modal “+ Nova tarefa” funcionou: a tarefa apareceu na coluna Portal dos Preparativos.
- Arrastar essa tarefa para A Forja / Ativação também funcionou.
- Capturas: `shots/desktop.png` (1440×900) e `shots/mobile.png` (390×844).

## O que já estava certo e não mexi

- Colunas Portal dos Preparativos, A Forja / Ativação e Relíquias / Vitória.
- Emblemas TVCC, Cheerathletics e Brasil na barra lateral.
- Anel “% FORJADO”, filtros, checklist, drawer de detalhes e animações GSAP.

## Observação de layout (não é um bug de execução)

No desktop 1440×900 o anel “% FORJADO” fica abaixo da área visível da barra lateral (dá para chegar rolando a barra, que tem `overflow-y: auto`). No celular o anel aparece no topo, ao lado das visões salvas.

## Rodada final do Gemini (board-final-v3)

Cópia de `/workspace/board-final/` (v2 intacta). Por cima, entrei os 4 arquivos da rodada visual do Gemini: `src/assets/board.css`, `BoardSidebar.vue`, `MemberMedallion.vue`, `BoardColumn.vue` e o `RESPOSTA.md`.

### O que o Gemini mudou (e que mantive)

- Barra lateral compacta em 100dvh, com as visões salvas e as runas na mesma placa, e os emblemas TVCC, Cheerathletics e Brasil numa placa só. O anel “% FORJADO” ficou no rodapé, com aura ciano e magenta, para aparecer no desktop sem rolar a barra.
- Medalhões redesenhados: selo de chakra para Luiz Felipe (online), espiral de bronze para Luiz Carlos e hexagrama de ferro para Alexandre 'Xande', com a insígnia Brasil nos dois que estão offline.
- Mais raios (com núcleo claro) na coluna A Forja e feixes verdes (relic-wisps) em Relíquias.
- Textura de pergaminho e outros acabamentos no CSS.

### Checagem dos arquivos `.vue`

Os três componentes vieram como SFCs válidos: começam em `<template>` e terminam em `</script>`, sem wrapper HTML de exportação e sem entidades escapadas do tipo `&lt;` no template. O `&amp;` de “Equipe &amp; locais” já era o correto.

O `BoardColumn.vue` não estava incompleto: a lógica de arrastar e soltar, teclado, seleção em lote, props e eventos usados pelo `BoardView` continuam iguais. Só mudou a decoração SVG. Filtros, modal, drawer e o anel também seguem no lugar.

### Correções minhas nesta rodada

1. **IDs dos gradientes SVG nos medalhões.** Os três medalhões repetiam `chakraCore`, `bronzeRim` e `ironRim`. Passei a usar o `partner.id` no nome (`chakraCore-luiz-felipe`, etc.), para o preenchimento de cada um não misturar.
2. **Quebra de linha no fim** dos três `.vue` do Gemini, que vinham sem newline final.

### Build, testes e comparação visual

- `npm install` e `npm run build` passaram sem erro de compilação.
- No `vite preview`, o console do navegador não mostrou erro nem aviso.
- Criar tarefa pelo modal e arrastar para A Forja continuam funcionando.
- No desktop 1440×900 o anel “33% FORJADO” aparece inteiro, sem rolar a barra lateral (o rodapé do anel fica por volta de 869 px, dentro dos 900 px da tela).
- Visualmente a v3 está melhor que a v2, não pior: o anel passou a caber na tela, os medalhões ficaram mais detalhados e as colunas mais vivas, sem perder função.
