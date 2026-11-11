<template>
  <section
    ref="rootEl"
    class="kanban-column"
    :class="[column.themeClass, { 'drag-over': isOver }]"
    :aria-label="`${column.title} — ${column.subtitle}, ${tasks.length} tarefas`"
  >
    <!-- Raios e descargas de plasma mais vivos na coluna "A Forja" -->
    <div v-if="column.id === 'inprogress'" class="column-lightning" aria-hidden="true">
      <svg class="lightning-svg" viewBox="0 0 100 600" preserveAspectRatio="none">
        <path class="bolt b1" vector-effect="non-scaling-stroke" d="M6 0 L15 55 L4 95 L18 155 L7 215 L19 275 L8 340 L16 410"/>
        <path class="bolt bolt-core b1" vector-effect="non-scaling-stroke" d="M6 0 L15 55 L4 95 L18 155 L7 215 L19 275 L8 340 L16 410"/>
        <path class="bolt b2" vector-effect="non-scaling-stroke" d="M94 25 L83 85 L96 135 L84 195 L95 260 L82 325 L93 395 L85 470"/>
        <path class="bolt bolt-core b2" vector-effect="non-scaling-stroke" d="M94 25 L83 85 L96 135 L84 195 L95 260 L82 325 L93 395 L85 470"/>
        <path class="bolt b3" vector-effect="non-scaling-stroke" d="M18 360 L8 420 L22 475 L10 530 L20 595"/>
        <path class="bolt b4" vector-effect="non-scaling-stroke" d="M84 380 L94 435 L80 485 L92 545 L82 595"/>
      </svg>
      <div class="forge-flash"></div>
    </div>

    <!-- Brilho verde esmeralda e feixes/folhas de energia em "Relíquias" -->
    <div v-if="column.id === 'done'" class="column-energy" aria-hidden="true">
      <svg class="energy-svg" viewBox="0 0 100 600" preserveAspectRatio="none">
        <path class="energy-path" vector-effect="non-scaling-stroke" d="M82 20 C22 120 92 220 38 320 C12 400 84 480 52 585"/>
        <path class="energy-path secondary" vector-effect="non-scaling-stroke" d="M18 80 C78 180 15 290 68 390 C88 450 25 530 60 595"/>
      </svg>
      <svg class="relic-wisps" viewBox="0 0 220 220" fill="none">
        <path d="M15 208 C92 182, 155 122, 202 18" stroke="#34d399" stroke-width="3.2" stroke-linecap="round" opacity="0.9"/>
        <path d="M52 216 C122 186, 176 136, 212 58" stroke="#10b981" stroke-width="2.2" stroke-linecap="round" opacity="0.7"/>
        <ellipse cx="145" cy="125" rx="10" ry="4" transform="rotate(-40 145 125)" fill="#6ee7b7"/>
        <ellipse cx="95" cy="175" rx="9" ry="3.5" transform="rotate(-30 95 175)" fill="#34d399"/>
        <ellipse cx="178" cy="70" rx="8" ry="3" transform="rotate(-55 178 70)" fill="#a7f3d0"/>
        <circle cx="122" cy="150" r="2.5" fill="#ffffff"/>
        <circle cx="166" cy="94" r="2" fill="#ffffff"/>
      </svg>
    </div>

    <header class="column-header">
      <div>
        <h2 class="column-title">{{ column.title }}</h2>
        <div class="column-subtitle">({{ column.subtitle }})</div>
      </div>
      <div class="column-header-right">
        <label v-if="tasks.length" class="col-select-all" :title="allSelected ? 'Desmarcar todas desta coluna' : 'Selecionar todas desta coluna'">
          <input
            type="checkbox"
            :checked="allSelected"
            :aria-label="allSelected ? 'Desmarcar todas as tarefas visíveis desta coluna' : 'Selecionar todas as tarefas visíveis desta coluna'"
            @change="toggleAll"
          />
        </label>
        <span class="column-count" aria-hidden="true">{{ tasks.length }}</span>
      </div>
    </header>

    <div ref="listEl" class="column-cards-list" role="list">
      <template v-for="(task, i) in tasks" :key="task.id">
        <div v-if="showIndicator && dropIndex === i" class="drop-indicator" aria-hidden="true"></div>
        <TaskCard
          :task="task"
          :column-id="column.id"
          :index="i"
          @edit="$emit('edit-task', task)"
          @delete="$emit('delete-task', task.id)"
          @open="$emit('open-task', task)"
          @keymove="onKeyMove(task, i, $event)"
        />
      </template>
      <div v-if="showIndicator && dropIndex === tasks.length" class="drop-indicator" aria-hidden="true"></div>
      <div v-if="!tasks.length" class="column-empty">
        <span class="empty-glyph" aria-hidden="true">⚒</span>
        <p>Nenhum pergaminho aqui.<br/>Arraste uma tarefa ou crie uma nova.</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import TaskCard from './TaskCard.vue'
import { useBoard, COLUMN_ORDER } from '../../composables/useBoard'
import { dragState, registerDropColumn } from '../../composables/useDragDrop'

const props = defineProps({
  column: { type: Object, required: true },
  tasks: { type: Array, default: () => [] }
})
const emit = defineEmits(['drop-task', 'edit-task', 'delete-task', 'open-task'])

const { selectedIds, toggleSelectMany } = useBoard()
const rootEl = ref(null)
const listEl = ref(null)
let unregister = null

const allSelected = computed(() => props.tasks.length > 0 && props.tasks.every(t => selectedIds.value.includes(t.id)))
function toggleAll() { toggleSelectMany(props.tasks.map(t => t.id), !allSelected.value) }

const isOver = computed(() => dragState.active && dragState.overColumnId === props.column.id)
const showIndicator = computed(() => isOver.value && dragState.taskId !== null)
const dropIndex = computed(() => {
  if (!showIndicator.value) return -1
  if (!dragState.beforeTaskId) return props.tasks.length
  const i = props.tasks.findIndex(t => t.id === dragState.beforeTaskId)
  return i >= 0 ? i : props.tasks.length
})

function onKeyMove(task, index, dir) {
  const ci = COLUMN_ORDER.indexOf(props.column.id)
  if (dir === 'left' && ci > 0) {
    emit('drop-task', { taskId: task.id, status: COLUMN_ORDER[ci - 1], beforeTaskId: null, via: 'keyboard' })
  } else if (dir === 'right' && ci < COLUMN_ORDER.length - 1) {
    emit('drop-task', { taskId: task.id, status: COLUMN_ORDER[ci + 1], beforeTaskId: null, via: 'keyboard' })
  } else if (dir === 'up' && index > 0) {
    emit('drop-task', { taskId: task.id, status: props.column.id, beforeTaskId: props.tasks[index - 1].id, via: 'keyboard' })
  } else if (dir === 'down' && index < props.tasks.length - 1) {
    emit('drop-task', { taskId: task.id, status: props.column.id, beforeTaskId: props.tasks[index + 2]?.id ?? null, via: 'keyboard' })
  }
}

onMounted(() => {
  unregister = registerDropColumn(props.column.id, { el: rootEl.value, listEl: listEl.value })
})
onBeforeUnmount(() => { if (unregister) unregister() })
</script>
