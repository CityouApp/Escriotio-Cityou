# NÓS — Estúdio · Quadro Kanban (Vue 3 + Vite + GSAP)

## Integração

1. Instale as dependências:
```bash
npm install
# ou, num app existente: npm install gsap
```

2. Arquivos do projeto:
- `index.html`, `vite.config.js`, `package.json`, `src/main.js`
- `src/composables/useBoard.js`
- `src/composables/useDragDrop.js`
- `src/utils/motion.js`
- `src/assets/board.css`
- `src/views/BoardView.vue`
- `src/components/board/BoardSidebar.vue`
- `src/components/board/MemberMedallion.vue`
- `src/components/board/BoardColumn.vue`
- `src/components/board/TaskCard.vue`
- `src/components/board/TaskDetailDrawer.vue`
- `src/components/board/NewTaskModal.vue`

> As fontes (Cinzel, Rajdhani, Inter) são carregadas pelo `<link>` no
> `index.html`. Num app existente, copie esse bloco de `<link>` para o seu
> próprio `index.html`. O CSS tem fallbacks (`serif`, `sans-serif`,
> `system-ui`) caso as fontes não carreguem.

3. Em app existente com vue-router, registre a rota em vez de usar o `main.js`:
```js
{ path: '/quadro', name: 'quadro', component: () => import('./views/BoardView.vue') }
```

4. Rode:
```bash
npm run dev      # desenvolvimento
npm run build    # produção (valida que tudo compila)
```

## Fluxos principais

- **Criar/editar**: “+ Nova tarefa” ou ✎ no cartão / “Editar tarefa” no drawer.
  Modal com título, tags (presets + personalizadas), coluna, prazo com atalhos,
  responsáveis, urgência e checklist. Focus trap, Esc, confirmação de descarte.
- **Detalhes**: clique no título do cartão (ou Enter na haste) abre o drawer
  lateral com checklist interativo, mudança de coluna, prazo, responsáveis e
  ações de editar/excluir/concluir.
- **Arrastar**: pegue o cartão pela haste superior do pergaminho (mouse e toque
  via Pointer Events). Barra luminosa indica a posição de inserção; solte para
  mover/reordenar. `Esc` cancela com retorno animado.
- **Teclado**: foque a haste e use `←`/`→` (coluna), `↑`/`↓` (reordenar),
  `Enter` (detalhes). Mudanças anunciadas via `aria-live`.
- **Seleção em lote**: checkbox no cartão (visível no hover; sempre visível no
  toque) ou checkbox no header da coluna. Barra inferior com mover, marcar
  urgente, concluir e excluir em lote.
- **Excluir com desfazer**: × no cartão, drawer ou barra em lote abre toast com
  “Desfazer” por 6 s (restaura a posição original, inclusive em lote).
- **Filtros**: visões salvas (Todas / Minhas / Urgentes), medalhão do sócio,
  busca textual e ordenação (manual, prazo, urgência, título).
- **Persistência**: `localStorage` (`nos_estudio_kanban_v2`, migração automática
  da v1, incluindo `dueText` → `dueDate`). “Restaurar exemplo” repõe o seed.

## Acessibilidade & movimento

- Diálogos com `role="dialog"`, `aria-modal`, focus trap, Esc e restauração de foco.
- `aria-pressed` nos filtros, `aria-expanded` no checklist, `aria-live` para
  mudanças de estado, labels em todos os controles-ícone.
- `prefers-reduced-motion` desativa animações, aura e partículas.
- Scrollbars temáticas em sidebar, colunas, modal e drawer.

## Checklist de validação manual (antes de apresentar)

1. `npm run build` sem erros.
2. Criar tarefa → aparece no topo da coluna escolhida, com pop GSAP.
3. Arrastar com mouse: ghost segue o cursor, barra de inserção aparece, soltar move.
4. Arrastar no celular (ou DevTools em modo toque): mesma experiência pela haste.
5. `Esc` durante o arraste devolve o cartão à origem.
6. Teclado: Tab até a haste → setas movem → Enter abre o drawer.
7. Concluir tarefa: faíscas + glow verde + anel % FORJADO anima.
8. Excluir → Desfazer restaura na posição original (individual e em lote).
9. Busca, filtros e ordenação refletem imediatamente; “Limpar filtros” reseta.
10. Recarregar a página: tarefas persistem (localStorage).