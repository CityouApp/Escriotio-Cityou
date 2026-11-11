<template>
  <Teleport to="body">
    <div ref="scrimEl" class="drawer-scrim" @pointerdown.self="$emit('close')">
      <aside
        ref="panelEl"
        class="drawer-panel"
        :class="'status-' + task.status"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        @keydown="onKeydown"
      >
        <header class="drawer-header">
          <span class="drawer-status-badge">{{ statusLabel }}</span>
          <button ref="closeEl" class="modal-close" aria-label="Fechar detalhes" @click="$emit('close')">×</button>
        </header>

        <div class="drawer-scroll">
          <h2 id="drawer-title" class="drawer-title">{{ task.title }}</h2>

          <div class="drawer-tags">
            <span v-for="tag in task.tags" :key="tag" class="tag-pill" :class="tagClass(tag)">{{ tag }}</span>
            <span v-if="task.urgent" class="tag-pill tag-urgent-pill">🚩 Urgente</span>
          </div>

          <div class="drawer-meta-grid">
            <div class="drawer-field">
              <span class="field-label">Coluna</span>
              <select :value="task.status" aria-label="Mover tarefa para a coluna" @change="$emit('move', $event.target.value)">
                <option v-for="c in columns" :key="c.id" :value="c.id">{{ c.title }} — {{ c.subtitle }}</option>
              </select>
            </div>
            <div class="drawer-field">
              <span class="field-label">Prazo</span>
              <span class="drawer-value" :class="{ 'overdue-text': overdue }">
                {{ task.dueDate ? dueLabel(task) : 'Sem prazo' }}
                <span v-if="overdue" class="overdue-tag">atrasada</span>
              </span>
            </div>
            <div class="drawer-field">
              <span class="field-label">Responsáveis</span>
              <div class="drawer-assignees">
                <span v-for="ini in task.assignees" :key="ini" class="drawer-assignee">
                  <span class="avatar-badge" :class="'avatar-' + ini" aria-hidden="true">{{ ini }}</span>
                  {{ partnerByInitials[ini]?.name || ini }}
                </span>
                <span v-if="!task.assignees.length" class="drawer-value">Ninguém atribuído</span>
              </div>
            </div>
            <div class="drawer-field">
              <span class="field-label">Criada em</span>
              <span class="drawer-value">{{ createdLabel }}</span>
            </div>
          </div>

          <div class="drawer-checklist-block">
            <div class="drawer-checklist-head">
              <span class="field-label">Checklist</span>
              <span class="drawer-progress-label">{{ doneCount }}/{{ task.checklist.length }} · {{ progressPct }}%</span>
            </div>
            <div class="progress-track drawer-track"><span class="progress-fill" :style="{ width: progressPct + '%' }"></span></div>
            <label v-for="(item, i) in task.checklist" :key="i" class="checklist-item drawer-item" :class="{ done: item.done }">
              <input type="checkbox" v-model="item.done" />
              <span>{{ item.text }}</span>
            </label>
            <p v-if="!task.checklist.length" class="checklist-empty">Esta tarefa não tem itens de checklist.</p>
            <button v-if="progressPct === 100 && task.checklist.length && task.status !== 'done'" class="btn-primary drawer-complete" @click="$emit('move', 'done')">
              ✓ Concluir tarefa
            </button>
          </div>
        </div>

        <footer class="drawer-footer">
          <button class="btn-danger" @click="$emit('delete', task.id)">Excluir</button>
          <button class="btn-primary" @click="$emit('edit', task)">✎ Editar tarefa</button>
        </footer>
      </aside>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { useBoard, dueLabel, isOverdue, tagClass } from '../../composables/useBoard'
import { reducedMotion } from '../../utils/motion'

const props = defineProps({
  task: { type: Object, required: true },
  partners: { type: Array, default: () => [] }
})
const emit = defineEmits(['close', 'edit', 'delete', 'move'])

const { columns } = useBoard()
const scrimEl = ref(null)
const panelEl = ref(null)
const closeEl = ref(null)
let prevFocus = null

const statusLabel = computed(() => columns.find(c => c.id === props.task.status)?.subtitle ?? props.task.status)
const overdue = computed(() => isOverdue(props.task))
const doneCount = computed(() => props.task.checklist.filter(i => i.done).length)
const progressPct = computed(() => props.task.checklist.length ? Math.round((doneCount.value / props.task.checklist.length) * 100) : 0)
const partnerByInitials = computed(() => Object.fromEntries(props.partners.map(p => [p.initials, p])))
const createdLabel = computed(() =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(props.task.createdAt))
)

function onKeydown(e) {
  if (e.key === 'Escape') { e.preventDefault(); emit('close'); return }
  if (e.key !== 'Tab' || !panelEl.value) return
  const list = Array.from(panelEl.value.querySelectorAll('button, input, select, [tabindex]:not([tabindex="-1"])'))
    .filter(el => !el.disabled && el.offsetParent !== null)
  if (!list.length) return
  const first = list[0], last = list[list.length - 1]
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}

onMounted(() => {
  prevFocus = document.activeElement
  document.body.classList.add('modal-open')
  document.body.style.overflow = 'hidden'
  if (!reducedMotion()) {
    gsap.fromTo(scrimEl.value, { opacity: 0 }, { opacity: 1, duration: 0.22 })
    gsap.fromTo(panelEl.value, { xPercent: 100 }, { xPercent: 0, duration: 0.38, ease: 'power3.out' })
  }
  closeEl.value?.focus()
})
onBeforeUnmount(() => {
  document.body.classList.remove('modal-open')
  document.body.style.overflow = ''
  if (panelEl.value) gsap.killTweensOf(panelEl.value)
  if (scrimEl.value) gsap.killTweensOf(scrimEl.value)
  if (prevFocus && prevFocus.isConnected) prevFocus.focus()
})
</script>
