<template>
  <section
    ref="rootEl"
    class="kanban-column"
    :class="[column.themeClass, { 'drag-over': isOver }]"
    @pointermove="onSpot"
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
        <span ref="countEl" class="column-count" aria-hidden="true">{{ displayCount }}</span>
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
      <div v-if="!tasks.length && !loading" class="column-empty">
        <svg class="empty-glyph" viewBox="0 0 48 48" aria-hidden="true">
          <rect x="10" y="8" width="28" height="32" rx="4" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4" />
          <path d="M24 18v12M18 24h12" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
        </svg>
        <p>{{ emptyText }}</p>
        <button type="button" class="empty-cta" @click="$emit('create-here', column.id)">Criar tarefa aqui</button>
      </div>
      <template v-if="loading">
        <div v-for="n in 2" :key="'sk' + n" class="skeleton-card" aria-hidden="true">
          <span class="sk-line w40"></span><span class="sk-line w90"></span><span class="sk-line w70"></span>
          <span class="sk-foot"><span class="sk-dot"></span><span class="sk-dot"></span></span>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { reducedMotion } from '../../utils/motion'
import TaskCard from './TaskCard.vue'
import { useBoard, COLUMN_ORDER } from '../../composables/useBoard'
import { dragState, registerDropColumn } from '../../composables/useDragDrop'

const props = defineProps({
  column: { type: Object, required: true },
  tasks: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})
const emit = defineEmits(['drop-task', 'edit-task', 'delete-task', 'open-task', 'create-here'])

const EMPTY = {
  todo: 'Nada na fila. Anote a próxima missão do time.',
  inprogress: 'A forja está fria. Puxe uma tarefa da fila para cá.',
  done: 'Nenhuma vitória ainda. Arraste para cá o que terminar.'
}
const emptyText = computed(() => EMPTY[props.column.id] || 'Arraste uma tarefa ou crie uma nova.')

// Contador animado: rola até o novo número e dá um "pulso"
const countEl = ref(null)
const displayCount = ref(props.tasks.length)
const counter = { v: props.tasks.length }
watch(() => props.tasks.length, (n, old) => {
  if (reducedMotion()) { displayCount.value = n; return }
  gsap.to(counter, { v: n, duration: 0.5, ease: 'power2.out', overwrite: true, onUpdate: () => { displayCount.value = Math.round(counter.v) } })
  if (countEl.value) gsap.fromTo(countEl.value, { scale: n > old ? 1.45 : 0.7 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' })
})

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

function onSpot(e) {
  if (e.pointerType !== 'mouse' || !rootEl.value) return
  const r = rootEl.value.getBoundingClientRect()
  rootEl.value.style.setProperty('--spot-x', (e.clientX - r.left) + 'px')
  rootEl.value.style.setProperty('--spot-y', (e.clientY - r.top) + 'px')
}

onMounted(() => {
  unregister = registerDropColumn(props.column.id, { el: rootEl.value, listEl: listEl.value })
})
onBeforeUnmount(() => { if (unregister) unregister() })
</script>
