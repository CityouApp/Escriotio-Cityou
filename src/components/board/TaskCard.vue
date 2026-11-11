<template>
  <article
    :id="'task-card-' + task.id"
    ref="rootEl"
    :data-task-id="task.id"
    role="listitem"
    class="scroll-card-wrapper"
    :class="{ urgent: task.urgent, 'is-done': columnId === 'done', expanded, selected: isSelected, 'has-baton': !!task.handoff, 'baton-mine': task.handoff?.holder === CURRENT_USER }"
    :data-flip-id="'task-' + task.id"
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
          <button
            type="button"
            class="btn-card-icon baton-trigger"
            :class="{ active: !!task.handoff }"
            :aria-expanded="batonOpen"
            :aria-label="task.handoff ? `Bastão com ${initialsName(task.handoff.holder)}. Passar o bastão de '${task.title}'` : `Passar o bastão de '${task.title}'`"
            :title="task.handoff ? `Bastão com ${initialsName(task.handoff.holder)}` : 'Passar o bastão'"
            @click.stop="toggleBaton"
            @pointerdown.stop
          ><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9.5 1.5L3.5 9h4l-1 5.5 6-7.5h-4z" fill="currentColor" /></svg></button>
          <button class="btn-card-icon" :aria-label="`Editar '${task.title}'`" @click.stop="$emit('edit')">✎</button>
          <button class="btn-card-icon danger" :aria-label="`Excluir '${task.title}'`" @click.stop="$emit('delete')">×</button>
        </div>
      </div>

      <div v-if="task.handoff" class="baton-seal" :class="{ mine: task.handoff.holder === CURRENT_USER }" :style="{ '--b-color': memberColor(task.handoff.holder) }">
        <span class="baton-seal-icon" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M9.5 1.5L3.5 9h4l-1 5.5 6-7.5h-4z" fill="currentColor" /></svg></span>
        <span class="baton-seal-text">
          <strong>{{ task.handoff.holder === CURRENT_USER ? 'Bastão com você' : 'Bastão com ' + initialsName(task.handoff.holder) }}</strong>
          <span class="baton-seal-from">de {{ initialsName(task.handoff.from) }} · {{ relTime(task.handoff.updatedAt) }}</span>
        </span>
        <span v-if="task.handoff.note" class="baton-seal-note">“{{ task.handoff.note }}”</span>
      </div>

      <div v-if="batonOpen" class="baton-editor" role="group" :aria-label="`Passar o bastão de '${task.title}'`" @click.stop @pointerdown.stop>
        <span class="baton-editor-label">Passar o bastão para</span>
        <div class="baton-editor-people">
          <button
            v-for="p in partners"
            :key="p.initials"
            type="button"
            class="baton-person"
            :class="{ active: batonTarget === p.initials }"
            :aria-pressed="batonTarget === p.initials"
            :style="{ '--b-color': memberColor(p.initials) }"
            @click="batonTarget = p.initials"
          >{{ initialsName(p.initials) }}</button>
        </div>
        <input
          ref="batonInputEl"
          v-model="batonNote"
          type="text"
          maxlength="160"
          class="baton-note-input"
          placeholder="Recado para quem recebe (opcional)"
          aria-label="Recado da passagem de bastão"
          @keydown.enter.prevent="confirmBaton"
          @keydown.esc.prevent="batonOpen = false"
        />
        <div class="baton-editor-actions">
          <button v-if="task.handoff" type="button" class="baton-btn ghost" @click="clearBaton">Recolher bastão</button>
          <button type="button" class="baton-btn ghost" @click="batonOpen = false">Cancelar</button>
          <button type="button" class="baton-btn primary" @click="confirmBaton">Passar bastão</button>
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
import { ref, computed, nextTick } from 'vue'
import { useBoard, dueLabel, isOverdue, tagClass, CURRENT_USER, initialsName } from '../../composables/useBoard'
import { memberColor } from '../../composables/useInsignias'
import { showToast } from '../../composables/useToast'
import { startDrag } from '../../composables/useDragDrop'
import AssigneeStack from '../insignia/AssigneeStack.vue'

const props = defineProps({
  task: { type: Object, required: true },
  columnId: { type: String, required: true },
  index: { type: Number, default: 0 }
})
const emit = defineEmits(['edit', 'delete', 'open', 'keymove'])

const { selectedIds, toggleSelect, passBaton, partners } = useBoard()
const batonOpen = ref(false)
const batonTarget = ref('LC')
const batonNote = ref('')
const batonInputEl = ref(null)

function toggleBaton() {
  batonOpen.value = !batonOpen.value
  if (batonOpen.value) {
    const h = props.task.handoff
    batonTarget.value = h ? (h.holder === CURRENT_USER ? 'LC' : h.holder) : (props.task.assignees.find(a => a !== CURRENT_USER) || 'LC')
    batonNote.value = ''
    nextTick(() => batonInputEl.value?.focus())
  }
}
function confirmBaton() {
  passBaton(props.task.id, batonTarget.value, batonNote.value)
  batonOpen.value = false
  showToast(batonTarget.value === CURRENT_USER ? 'Bastão ficou com você' : `Bastão passado para ${initialsName(batonTarget.value)}`, { tone: 'success' })
}
function clearBaton() {
  passBaton(props.task.id, null)
  batonOpen.value = false
  showToast('Bastão recolhido')
}
function relTime(ts) {
  const m = Math.max(0, Math.round((Date.now() - ts) / 60000))
  if (m < 1) return 'agora'
  if (m < 60) return `há ${m} min`
  const h = Math.round(m / 60)
  if (h < 24) return `há ${h} h`
  return `há ${Math.round(h / 24)} d`
}
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
