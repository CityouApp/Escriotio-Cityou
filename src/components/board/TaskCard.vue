<template>
  <article
    :id="'task-card-' + task.id"
    ref="rootEl"
    :data-task-id="task.id"
    role="listitem"
    class="scroll-card-wrapper"
    :class="{ urgent: task.urgent, 'is-done': columnId === 'done', expanded, selected: isSelected }"
  >
    <div v-if="columnId === 'inprogress'" class="electric-aura-fx" aria-hidden="true"></div>
    <span v-if="task.urgent" class="urgent-ribbon" aria-hidden="true">!</span>

    <button
      ref="handleEl"
      class="scroll-roller scroll-roller--top"
      :aria-label="`Mover '${task.title}'. Arraste para outra coluna, ou use as setas: esquerda/direita muda de coluna, cima/baixo reordena.`"
      @pointerdown="onPointerDown"
      @keydown="onHandleKey"
    >
      <span class="roller-grip" aria-hidden="true">•••</span>
    </button>

    <div class="scroll-body">
      <div class="card-tags-row">
        <label class="card-select">
          <input
            type="checkbox"
            :checked="isSelected"
            :aria-label="`Selecionar tarefa '${task.title}' para ações em lote`"
            @change="toggleSelect(task.id)"
          />
        </label>
        <div class="card-tags">
          <span v-for="tag in task.tags" :key="tag" class="tag-pill" :class="tagClass(tag)">{{ tag }}</span>
        </div>
        <div class="card-quick-actions">
          <button class="btn-card-icon" :aria-label="`Editar '${task.title}'`" @click.stop="$emit('edit')">✎</button>
          <button class="btn-card-icon danger" :aria-label="`Excluir '${task.title}'`" @click.stop="$emit('delete')">×</button>
        </div>
      </div>

      <h3 class="card-title">
        <button class="card-title-btn" :aria-label="`Abrir detalhes de '${task.title}'`" @click.stop="$emit('open')">{{ task.title }}</button>
      </h3>

      <button
        class="card-progress-row"
        :aria-expanded="expanded"
        :aria-controls="drawerId"
        :aria-label="`Checklist: ${doneCount} de ${total} itens concluídos. Clique para ${expanded ? 'recolher' : 'expandir'}.`"
        @click.stop="expanded = !expanded"
      >
        <span class="progress-track"><span class="progress-fill" :style="{ width: progressPct + '%' }"></span></span>
        <span class="progress-count">
          <svg v-if="progressPct === 100 && total > 0" class="progress-seal" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          {{ doneCount }}/{{ total }}
        </span>
        <span class="chevron" :class="{ open: expanded }" aria-hidden="true">▾</span>
      </button>

      <div :id="drawerId" class="checklist-drawer" :class="{ open: expanded }">
        <div class="checklist-inner">
          <label v-for="(item, i) in task.checklist" :key="i" class="checklist-item" :class="{ done: item.done }">
            <input type="checkbox" v-model="item.done" />
            <span>{{ item.text }}</span>
          </label>
          <p v-if="!task.checklist.length" class="checklist-empty">Sem itens de checklist.</p>
        </div>
      </div>

      <div class="card-footer">
        <div class="card-meta-left">
          <span v-if="task.dueDate" class="due-chip" :class="{ overdue: overdue }"><svg class="chip-icon" viewBox="0 0 16 16" aria-hidden="true"><rect x="2.5" y="3.5" width="11" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>{{ dueLabel(task) }}<span v-if="overdue" class="sr-only"> (atrasada)</span></span>
          <span v-if="task.urgent" class="urgent-flag" title="Urgente"><svg class="chip-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 14V2.5M3.5 3h8l-1.8 3 1.8 3h-8" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg><span class="sr-only">Urgente</span></span>
          <span v-if="task.comments" class="comments-chip"><svg class="chip-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>{{ task.comments }}<span class="sr-only"> comentários</span></span>
        </div>
        <AssigneeStack :task="task" />
      </div>
    </div>

    <div class="scroll-roller scroll-roller--bottom" aria-hidden="true"></div>
  </article>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useBoard, dueLabel, isOverdue, tagClass } from '../../composables/useBoard'
import { startDrag } from '../../composables/useDragDrop'
import AssigneeStack from '../insignia/AssigneeStack.vue'

const props = defineProps({
  task: { type: Object, required: true },
  columnId: { type: String, required: true },
  index: { type: Number, default: 0 }
})
const emit = defineEmits(['edit', 'delete', 'open', 'keymove'])

const { selectedIds, toggleSelect } = useBoard()
const rootEl = ref(null)
const handleEl = ref(null)
const expanded = ref(false)
const drawerId = 'checklist-' + props.task.id

const isSelected = computed(() => selectedIds.value.includes(props.task.id))
const total = computed(() => props.task.checklist.length)
const doneCount = computed(() => props.task.checklist.filter(i => i.done).length)
const progressPct = computed(() => total.value ? Math.round((doneCount.value / total.value) * 100) : 0)
const overdue = computed(() => isOverdue(props.task))

function onPointerDown(e) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  e.preventDefault()
  handleEl.value?.focus({ preventScroll: true })
  startDrag(e, props.task, rootEl.value)
}
function onHandleKey(e) {
  const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }
  const dir = map[e.key]
  if (dir) { e.preventDefault(); emit('keymove', dir) }
  else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); emit('open') }
}
</script>
