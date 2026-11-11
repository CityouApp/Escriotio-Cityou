<template>
  <div ref="rootEl" class="board-app-layout">
    <BoardSidebar
      :total-count="tasks.length"
      :online-count="onlineCount"
      :saved-view="savedView"
      :forged-percentage="forgedPercentage"
      @update:saved-view="savedView = $event"
      @reset="onReset"
    />

    <main class="board-main">
      <header class="board-header">
        <div class="header-left">
          <div class="header-date">{{ headerDate }}</div>
          <h1 class="header-greeting">{{ greeting }}, Luiz Felipe <span class="wave" aria-hidden="true">👋</span></h1>
          <div class="header-online-status">
            <span class="dot-online" aria-hidden="true"></span>
            {{ onlineCount }} de {{ partners.length }} sócios online
          </div>
        </div>
        <div class="header-tools">
          <div class="search-box">
            <svg viewBox="0 0 24 24" class="search-icon" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/>
              <path d="M15.5 15.5 L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <input v-model="searchQuery" type="search" placeholder="Buscar tarefas…" aria-label="Buscar tarefas por título, tag ou checklist" />
          </div>
          <label class="sort-box">
            <span class="sr-only">Ordenar tarefas</span>
            <select v-model="sortMode" aria-label="Ordenar tarefas">
              <option value="manual">Ordem manual</option>
              <option value="due">Prazo</option>
              <option value="urgent">Urgência</option>
              <option value="title">Título (A–Z)</option>
            </select>
          </label>
          <button class="btn-new-task" @click="openNewModal">+ Nova tarefa</button>
        </div>
      </header>

      <div v-if="hasActiveFilters" class="filter-bar" role="status">
        <span v-if="savedView !== 'all'" class="filter-chip">{{ savedView === 'mine' ? '@ Minhas tarefas' : '⚡ Urgentes' }}</span>
        <span v-if="selectedMember" class="filter-chip">Sócio: {{ selectedMember }}</span>
        <span v-if="searchQuery.trim()" class="filter-chip">Busca: “{{ searchQuery.trim() }}”</span>
        <button class="filter-clear" @click="clearFilters">Limpar filtros ×</button>
      </div>

      <section class="medallions-section" aria-label="Filtrar por sócio">
        <MemberMedallion
          v-for="partner in partners"
          :key="partner.id"
          :partner="partner"
          :selected="selectedMember === partner.initials"
          @select="toggleMember(partner.initials)"
        />
      </section>
      <div class="medallions-connector" aria-hidden="true"></div>

      <section class="kanban-grid" aria-label="Quadro de tarefas">
        <BoardColumn
          v-for="col in columns"
          :key="col.id"
          :column="col"
          :tasks="filteredTasksByColumn(col.id)"
          @drop-task="onDropTask"
          @edit-task="openEditModal"
          @delete-task="onDeleteTask"
          @open-task="openDetail"
        />
      </section>
    </main>

    <TaskDetailDrawer
      v-if="detailTask"
      :task="detailTask"
      :partners="partners"
      @close="detailTask = null"
      @edit="onDrawerEdit"
      @delete="onDrawerDelete"
      @move="onDrawerMove"
    />

    <NewTaskModal
      v-if="modalOpen"
      :initial-task="editingTask"
      :partners="partners"
      @close="closeModal"
      @save="handleSaveTask"
    />

    <Transition name="bulkbar">
      <div v-if="selectedIds.length" class="bulk-bar" role="toolbar" aria-label="Ações em lote">
        <span class="bulk-count">{{ selectedIds.length }} selecionada{{ selectedIds.length > 1 ? 's' : '' }}</span>
        <select v-model="bulkTarget" aria-label="Mover selecionadas para a coluna" @change="onBulkMove">
          <option value="" disabled>Mover para…</option>
          <option v-for="c in columns" :key="c.id" :value="c.id">{{ c.subtitle }}</option>
        </select>
        <button class="bulk-btn" @click="onBulkUrgent">🚩 Urgente</button>
        <button class="bulk-btn success" @click="onBulkComplete">✓ Concluir</button>
        <button class="bulk-btn danger" @click="onBulkDelete">Excluir</button>
        <button class="bulk-btn" @click="clearSelection">Limpar</button>
      </div>
    </Transition>

    <Transition name="toast">
      <div v-if="toast.show" :key="toast.key" class="board-toast" role="status">
        <span class="toast-msg">{{ toast.message }}</span>
        <button v-if="toast.action" class="toast-action" @click="onUndo">{{ toast.action }}</button>
        <button class="toast-close" aria-label="Fechar aviso" @click="hideToast">×</button>
        <span class="toast-timer" aria-hidden="true"></span>
      </div>
    </Transition>

    <div class="sr-only" role="status" aria-live="polite">{{ announcement }}</div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { useBoard } from '../composables/useBoard'
import { setDropHandler, cancelActiveDrag } from '../composables/useDragDrop'
import { reducedMotion, burstSparks } from '../utils/motion'
import BoardSidebar from '../components/board/BoardSidebar.vue'
import MemberMedallion from '../components/board/MemberMedallion.vue'
import BoardColumn from '../components/board/BoardColumn.vue'
import NewTaskModal from '../components/board/NewTaskModal.vue'
import TaskDetailDrawer from '../components/board/TaskDetailDrawer.vue'
import '../assets/board.css'

const {
  tasks, partners, columns,
  savedView, selectedMember, searchQuery, sortMode, selectedIds,
  forgedPercentage, onlineCount, hasActiveFilters,
  filteredTasksByColumn, moveTask, upsertTask, removeTask, removeTasks,
  undoDelete, bulkSetUrgent, clearSelection, clearFilters, resetBoard
} = useBoard()

const rootEl = ref(null)
const modalOpen = ref(false)
const editingTask = ref(null)
const detailTask = ref(null)
const bulkTarget = ref('')
const announcement = ref('')
const toast = ref({ show: false, message: '', action: '', key: 0 })
let toastTimer = null
let gsapCtx = null

const headerDate = computed(() =>
  new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()).toUpperCase()
)
const greeting = computed(() => {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
})

function announce(msg) { announcement.value = msg }
function colName(id) { return columns.find(c => c.id === id)?.subtitle ?? id }

function toggleMember(initials) {
  selectedMember.value = selectedMember.value === initials ? null : initials
  announce(selectedMember.value ? `Filtrando tarefas de ${initials}` : 'Filtro de sócio removido')
}

function openNewModal() { cancelActiveDrag(); editingTask.value = null; modalOpen.value = true }
function openEditModal(task) { cancelActiveDrag(); editingTask.value = task; modalOpen.value = true }
function closeModal() { modalOpen.value = false; editingTask.value = null }
function openDetail(task) { cancelActiveDrag(); detailTask.value = task }
function onDrawerEdit(task) { detailTask.value = null; openEditModal(task) }
function onDrawerDelete(id) { detailTask.value = null; onDeleteTask(id) }
function onDrawerMove(status) { if (detailTask.value) onDropTask({ taskId: detailTask.value.id, status, via: 'drawer' }) }

async function handleSaveTask(payload) {
  const isEdit = !!payload.id
  const saved = upsertTask(payload)
  closeModal()
  if (!saved) return
  announce(isEdit ? `Tarefa "${saved.title}" atualizada` : `Tarefa "${saved.title}" criada`)
  await nextTick()
  popCard(saved.id)
}

async function onDropTask({ taskId, status, beforeTaskId = null, via = 'pointer' }) {
  const result = moveTask(taskId, status, beforeTaskId)
  if (!result) return
  announce(`Tarefa "${result.task.title}" movida para ${colName(status)}`)
  await nextTick()
  const el = document.getElementById('task-card-' + taskId)
  if (!el) return
  popCard(taskId)
  if (result.completed) {
    el.classList.add('just-completed')
    burstSparks(el)
    setTimeout(() => el.classList.remove('just-completed'), 1200)
    announce(`Tarefa "${result.task.title}" concluída! ${forgedPercentage.value}% forjado.`)
  }
  if (via === 'keyboard') el.querySelector('.scroll-roller--top')?.focus()
}

function popCard(taskId) {
  const el = document.getElementById('task-card-' + taskId)
  if (!el || reducedMotion()) return
  gsap.fromTo(el, { scale: 0.9, y: -14, opacity: 0.4 },
    { scale: 1, y: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.8)', clearProps: 'transform,opacity' })
}

function onDeleteTask(taskId) {
  const t = removeTask(taskId)
  if (!t) return
  showToast(`“${t.title}” excluída`, 'Desfazer')
  announce(`Tarefa "${t.title}" excluída. Use Desfazer para recuperar.`)
}
function onUndo() {
  if (undoDelete()) { hideToast(); announce('Exclusão desfeita') }
}
function showToast(message, action = '') {
  clearTimeout(toastTimer)
  toast.value = { show: true, message, action, key: toast.value.key + 1 }
  toastTimer = setTimeout(hideToast, 6000)
}
function hideToast() { clearTimeout(toastTimer); toast.value = { ...toast.value, show: false } }

function onBulkMove() {
  const target = bulkTarget.value
  if (!target) return
  const ids = [...selectedIds.value]
  let n = 0
  ids.forEach(id => { if (moveTask(id, target, null)) n++ })
  bulkTarget.value = ''
  clearSelection()
  showToast(`${n} tarefa${n > 1 ? 's' : ''} movida${n > 1 ? 's' : ''} para ${colName(target)}`)
  announce(`${n} tarefas movidas para ${colName(target)}`)
}
function onBulkUrgent() {
  const n = bulkSetUrgent([...selectedIds.value], true)
  clearSelection()
  showToast(`${n} tarefa${n > 1 ? 's' : ''} marcada${n > 1 ? 's' : ''} como urgente`)
  announce(`${n} tarefas marcadas como urgentes`)
}
function onBulkComplete() {
  const ids = [...selectedIds.value]
  let n = 0
  ids.forEach(id => { const r = moveTask(id, 'done', null); if (r?.completed) n++ })
  clearSelection()
  showToast(`${n} tarefa${n > 1 ? 's' : ''} concluída${n > 1 ? 's' : ''} — ${forgedPercentage.value}% forjado`)
  announce(`${n} tarefas concluídas`)
}
function onBulkDelete() {
  const n = removeTasks([...selectedIds.value])
  if (!n) return
  showToast(`${n} tarefa${n > 1 ? 's' : ''} excluída${n > 1 ? 's' : ''}`, 'Desfazer')
  announce(`${n} tarefas excluídas. Use Desfazer para recuperar.`)
}

function onReset() {
  if (window.confirm('Restaurar os dados de exemplo? Suas tarefas atuais serão substituídas.')) {
    resetBoard()
    showToast('Quadro restaurado com os dados de exemplo')
    announce('Quadro restaurado')
  }
}

onMounted(() => {
  setDropHandler(onDropTask)
  if (!reducedMotion() && rootEl.value) {
    gsapCtx = gsap.context(() => {
      gsap.from('.board-header', { y: -16, opacity: 0, duration: 0.5, ease: 'power2.out', clearProps: 'transform,opacity' })
      gsap.from('.medallion-card', { y: 20, opacity: 0, scale: 0.9, stagger: 0.08, duration: 0.5, ease: 'back.out(1.6)', delay: 0.1, clearProps: 'transform,opacity' })
      gsap.from('.kanban-column', { y: 28, opacity: 0, stagger: 0.1, duration: 0.55, ease: 'power3.out', delay: 0.2, clearProps: 'transform,opacity' })
    }, rootEl.value)
  }
})
onBeforeUnmount(() => {
  setDropHandler(null)
  cancelActiveDrag()
  clearTimeout(toastTimer)
  if (gsapCtx) gsapCtx.revert()
})
</script>
