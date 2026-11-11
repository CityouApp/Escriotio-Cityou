<template>
  <div ref="rootEl" class="board-app-layout">
    <BoardSidebar
      :total-count="tasks.length"
      :online-count="onlineCount"
      :saved-view="savedView"
      :forged-percentage="forgedPercentage"
      :active-tab="activeTab"
      :baton-count="batonWithMeCount"
      :decisions-count="collab.decisions.length"
      @update:saved-view="onSavedView"
      @update:active-tab="switchTab"
      @open-cmd="openCmd"
      @open-sync="syncOpen = true"
      @reset="onReset"
    />

    <main class="board-main">
      <header class="board-header">
        <div class="header-left">
          <div class="header-date">{{ headerDate }}</div>
          <h1 class="header-greeting">{{ greeting }}, Fifo</h1>
          <div class="header-online-status">
            <span class="dot-online" aria-hidden="true"></span>
            {{ onlineCount }} de {{ partners.length }} sócios online
            <button type="button" class="tz-strip" title="Ver fusos e janela em comum" @click="switchTab('team')">
              <span v-for="p in partners" :key="p.initials" class="tz-chip" :style="{ '--m-color': memberColor(p.initials) }">
                <i aria-hidden="true"></i>{{ p.initials }} {{ formatTimeInZone(collab.team[p.initials].timezone, now) }}
              </span>
            </button>
          </div>
        </div>
        <div class="header-tools">
          <div v-if="activeTab === 'board'" ref="switcherEl" class="view-switcher" role="group" aria-label="Modo de visualização (tecla V)">
            <span ref="switchPillEl" class="view-switch-pill" aria-hidden="true"></span>
            <button
              v-for="v in subViews"
              :key="v.id"
              :ref="el => (switchBtns[v.id] = el)"
              type="button"
              class="view-switch-btn"
              :class="{ active: boardSubView === v.id }"
              :aria-pressed="boardSubView === v.id"
              @click="setSubView(v.id)"
            >
              <svg v-if="v.id === 'kanban'" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 2.5h3v11h-3zM6.5 2.5h3v7h-3zM10.5 2.5h3v9h-3z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
              <svg v-else viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4h11M2.5 8h11M2.5 12h11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
              {{ v.label }}
            </button>
          </div>
          <div class="search-box">
            <svg viewBox="0 0 24 24" class="search-icon" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/>
              <path d="M15.5 15.5 L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <input v-model="searchQuery" type="search" placeholder="Buscar tarefas…" aria-label="Buscar tarefas por título, tag ou checklist" />
            <button type="button" class="search-cmd" :title="`Comandos rápidos (${isMac ? '⌘' : 'Ctrl'}+K)`" aria-label="Abrir comandos rápidos" @click="openCmd"><kbd>{{ isMac ? '⌘' : 'Ctrl' }}</kbd><kbd>K</kbd></button>
          </div>
          <label v-if="activeTab === 'board'" class="sort-box">
            <span class="sr-only">Ordenar tarefas</span>
            <select v-model="sortMode" aria-label="Ordenar tarefas">
              <option value="manual">Ordem manual</option>
              <option value="due">Prazo</option>
              <option value="urgent">Urgência</option>
              <option value="title">Título (A–Z)</option>
            </select>
          </label>
          <button v-magnetic class="btn-new-task" @click="openNewModal">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            Nova tarefa
          </button>
        </div>
      </header>

      <div v-if="hasActiveFilters" class="filter-bar" role="status">
        <span v-if="savedView !== 'all'" class="filter-chip">{{ savedViewLabel }}</span>
        <span v-if="selectedMember" class="filter-chip">Sócio: {{ memberName(selectedMember) }}</span>
        <span v-if="searchQuery.trim()" class="filter-chip">Busca: “{{ searchQuery.trim() }}”</span>
        <button class="filter-clear" @click="clearFilters">Limpar filtros</button>
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

      <div ref="stageEl" class="tab-stage">
      <section v-if="activeTab === 'board' && boardSubView === 'kanban'" id="tab-panel-board" class="kanban-grid" role="tabpanel" aria-label="Quadro de tarefas">
        <BoardColumn
          v-for="col in columns"
          :key="col.id"
          :column="col"
          :tasks="booting ? [] : filteredTasksByColumn(col.id)"
          :loading="booting"
          @create-here="openNewModal($event)"
          @drop-task="onDropTask"
          @edit-task="openEditModal"
          @delete-task="onDeleteTask"
          @open-task="openDetail"
        />
      </section>
      <TaskListView v-else-if="activeTab === 'board'" @open-task="openDetail" />
      <TeamHub v-else-if="activeTab === 'team'" @open-task="openTaskAnywhere" @filter-member="jumpToMember" />
      <ActivityHub v-else @open-task="openTaskAnywhere" />
      </div>
    </main>

    <CommandPalette v-if="cmdOpen" :commands="commands" @close="closeCmd" @run="runCommand" />
    <SyncModal v-if="syncOpen" @close="syncOpen = false" @imported="announce('Quadro importado')" />

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
        <button class="bulk-btn" @click="onBulkUrgent">Marcar urgente</button>
        <button class="bulk-btn success" @click="onBulkComplete">Concluir</button>
        <button class="bulk-btn danger" @click="onBulkDelete">Excluir</button>
        <button class="bulk-btn" @click="clearSelection">Limpar</button>
      </div>
    </Transition>

    <Transition name="toast">
      <div v-if="toast.show" :key="toast.key" class="board-toast glass" :class="'tone-' + toast.tone" role="status">
        <span class="toast-icon" aria-hidden="true">
          <svg v-if="toast.tone === 'success'" viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <svg v-else viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 7v4M8 4.8v.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </span>
        <span class="toast-msg">{{ toast.message }}</span>
        <button v-if="toast.action" class="toast-action" @click="onToastAction">{{ toast.action }}</button>
        <button class="toast-close" aria-label="Fechar aviso" @click="hideToast">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
        <span class="toast-timer" aria-hidden="true"></span>
      </div>
    </Transition>

    <InsigniaPicker v-if="ui.pickerFor" :key="'pk-' + ui.pickerFor" :initials="ui.pickerFor" />
    <MemberPopover v-if="ui.popover" :key="ui.popover.key" />

    <div class="sr-only" role="status" aria-live="polite">{{ announcement }}</div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import { useBoard, formatTimeInZone, CURRENT_USER } from '../composables/useBoard'
import { memberColor } from '../composables/useInsignias'
import { useNow } from '../composables/useNow'
import TaskListView from '../components/board/TaskListView.vue'
import TeamHub from '../components/collab/TeamHub.vue'
import ActivityHub from '../components/collab/ActivityHub.vue'
import CommandPalette from '../components/collab/CommandPalette.vue'
import SyncModal from '../components/collab/SyncModal.vue'
import { setDropHandler, cancelActiveDrag } from '../composables/useDragDrop'
import { reducedMotion, burstSparks } from '../utils/motion'
import BoardSidebar from '../components/board/BoardSidebar.vue'
import MemberMedallion from '../components/board/MemberMedallion.vue'
import BoardColumn from '../components/board/BoardColumn.vue'
import NewTaskModal from '../components/board/NewTaskModal.vue'
import TaskDetailDrawer from '../components/board/TaskDetailDrawer.vue'
import InsigniaPicker from '../components/insignia/InsigniaPicker.vue'
import MemberPopover from '../components/insignia/MemberPopover.vue'
import { ui } from '../composables/useInsignias'
import { toastState as toast, showToast as pushToast, hideToast } from '../composables/useToast'
import { vMagnetic } from '../utils/magnetic'
import '../assets/board.css'
import '../assets/premium.css'
import '../assets/collab.css'

gsap.registerPlugin(Flip)

const {
  collab, activeTab, boardSubView, batonWithMeCount,
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
const booting = ref(true)
let mm = null
const { now, release: releaseNow } = useNow()
const stageEl = ref(null)
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
const cmdOpen = ref(false)
const syncOpen = ref(false)
let cmdReturnFocus = null

// ============ ABAS CONECTADAS ============
const TAB_NAMES = { board: 'Quadro', team: 'Equipe e locais', activity: 'Atividade e decisões' }
const savedViewLabel = computed(() => ({ mine: 'Minhas tarefas', urgent: 'Urgentes', baton: 'Bastão comigo' })[savedView.value] || '')
function animateStage() {
  nextTick(() => {
    if (reducedMotion() || !stageEl.value) return
    gsap.fromTo(stageEl.value.children, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: 'expo.out', stagger: 0.04, clearProps: 'transform,opacity,visibility' })
  })
}
function switchTab(tab) {
  if (!TAB_NAMES[tab] || activeTab.value === tab) return
  cancelActiveDrag()
  activeTab.value = tab
  announce(`Aba ${TAB_NAMES[tab]}`)
  animateStage()
  if (tab === 'board') nextTick(placeSwitchPill)
}
function onSavedView(v) {
  savedView.value = v
  if (activeTab.value !== 'board') switchTab('board')
}
function jumpToMember(ini) {
  selectedMember.value = ini
  switchTab('board')
  announce(`Filtrando tarefas de ${memberName(ini)}`)
}
function openTaskAnywhere(task) {
  if (!task) return
  if (activeTab.value !== 'board') switchTab('board')
  openDetail(task)
}

// Quadro ↔ Lista com GSAP Flip (cartão vira linha)
const subViews = [{ id: 'kanban', label: 'Quadro' }, { id: 'list', label: 'Lista' }]
const switcherEl = ref(null)
const switchPillEl = ref(null)
const switchBtns = {}
let pillPlaced = false
function placeSwitchPill() {
  const b = switchBtns[boardSubView.value]
  const pill = switchPillEl.value
  if (!b || !pill) { pillPlaced = false; return }
  const box = { x: b.offsetLeft, width: b.offsetWidth, height: b.offsetHeight, y: b.offsetTop }
  if (!pillPlaced || reducedMotion()) { gsap.set(pill, box); pillPlaced = true }
  else gsap.to(pill, { ...box, duration: 0.45, ease: 'expo.out', overwrite: true })
}
async function setSubView(v) {
  if (boardSubView.value === v) return
  cancelActiveDrag()
  const els = rootEl.value?.querySelectorAll('[data-flip-id]')
  const state = !reducedMotion() && els?.length ? Flip.getState(els) : null
  boardSubView.value = v
  announce(v === 'list' ? 'Visão em lista' : 'Visão em quadro')
  await nextTick()
  placeSwitchPill()
  if (state) {
    Flip.from(state, {
      targets: rootEl.value.querySelectorAll('[data-flip-id]'),
      duration: 0.55, ease: 'expo.inOut', absolute: false, scale: false, nested: true,
      fade: true, prune: true, stagger: 0.012,
      onEnter: els => gsap.fromTo(els, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, clearProps: 'all' }),
      onComplete: () => gsap.set(rootEl.value.querySelectorAll('[data-flip-id]'), { clearProps: 'transform,opacity,visibility,width,height' })
    })
  }
}

// ============ PALETA DE COMANDOS (Ctrl/⌘K) ============
const commands = computed(() => {
  const list = [
    { id: 'new', group: 'Ações', label: 'Nova tarefa', hint: 'N', run: () => openNewModal() },
    { id: 'sync', group: 'Ações', label: 'Exportar ou importar o quadro (JSON)', keywords: 'sincronizar backup arquivo', run: () => { syncOpen.value = true } },
    { id: 'checkin', group: 'Ações', label: 'Fazer meu check-in do dia', keywords: 'foco bloqueio cidade', run: () => { switchTab('team') } },
    { id: 'decision', group: 'Ações', label: 'Registrar uma decisão', keywords: 'adr diario', run: () => { switchTab('activity'); nextTick(() => document.querySelector('.decision-form input')?.focus()) } },
    { id: 'tab-board', group: 'Ir para', label: 'Quadro', hint: '1', run: () => switchTab('board') },
    { id: 'tab-team', group: 'Ir para', label: 'Equipe & locais (fusos e check-in)', hint: '2', run: () => switchTab('team') },
    { id: 'tab-activity', group: 'Ir para', label: 'Atividade & decisões', hint: '3', run: () => switchTab('activity') },
    { id: 'view-toggle', group: 'Ir para', label: boardSubView.value === 'kanban' ? 'Ver em lista' : 'Ver em quadro', hint: 'V', run: () => { switchTab('board'); setSubView(boardSubView.value === 'kanban' ? 'list' : 'kanban') } },
    { id: 'f-baton', group: 'Filtros', label: `Bastão comigo (${batonWithMeCount.value})`, run: () => onSavedView('baton') },
    { id: 'f-mine', group: 'Filtros', label: 'Minhas tarefas', run: () => onSavedView('mine') },
    { id: 'f-urgent', group: 'Filtros', label: 'Urgentes', run: () => onSavedView('urgent') },
    ...partners.value.map(p => ({ id: 'f-' + p.initials, group: 'Filtros', label: `Tarefas de ${memberName(p.initials)}`, keywords: p.initials, run: () => jumpToMember(p.initials) })),
    { id: 'f-clear', group: 'Filtros', label: 'Limpar filtros', run: () => clearFilters() }
  ]
  for (const t of tasks.value) {
    list.push({ id: 'task-' + t.id, group: 'Tarefas', label: t.title, keywords: t.tags.join(' '), searchOnly: true, run: () => openTaskAnywhere(t) })
  }
  return list
})
function openCmd() { cmdReturnFocus = document.activeElement; cmdOpen.value = true }
function closeCmd() { cmdOpen.value = false; nextTick(() => cmdReturnFocus?.focus?.()) }
function runCommand(item) { cmdOpen.value = false; nextTick(() => item.run()) }

function onGlobalKeydown(e) {
  if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    if (cmdOpen.value) closeCmd(); else openCmd()
    return
  }
  if (e.metaKey || e.ctrlKey || e.altKey) return
  const t = e.target
  const tag = t?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t?.isContentEditable) return
  if (modalOpen.value || cmdOpen.value || syncOpen.value || detailTask.value || ui.pickerFor) return
  const k = e.key.toLowerCase()
  if (k === '1') switchTab('board')
  else if (k === '2') switchTab('team')
  else if (k === '3') switchTab('activity')
  else if (k === 'v' && activeTab.value === 'board') setSubView(boardSubView.value === 'kanban' ? 'list' : 'kanban')
  else if (k === 'n') { e.preventDefault(); openNewModal() }
}

const headerDate = computed(() =>
  new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()).toUpperCase()
)
const greeting = computed(() => {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
})

function announce(msg) { announcement.value = msg }
function colName(id) { return columns.find(c => c.id === id)?.subtitle ?? id }

function memberName(ini) {
  const p = partners.value.find(x => x.initials === ini)
  return p ? p.name.toLowerCase().replace(/(?<=^|[\s'])\p{L}/gu, c => c.toUpperCase()) : ini
}
function toggleMember(initials) {
  selectedMember.value = selectedMember.value === initials ? null : initials
  announce(selectedMember.value ? `Filtrando tarefas de ${memberName(initials)}` : 'Filtro de sócio removido')
}

function openNewModal(status) {
  cancelActiveDrag()
  editingTask.value = typeof status === 'string' ? { status } : null
  modalOpen.value = true
}
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
  showToast(isEdit ? 'Tarefa atualizada' : `Tarefa forjada em ${colName(saved.status)}`, '', 'success')
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
  if (via !== 'pointer') popCard(taskId)
  if (result.completed) {
    el.classList.add('just-completed')
    burstSparks(el)
    setTimeout(() => el.classList.remove('just-completed'), 1200)
    announce(`Tarefa "${result.task.title}" concluída! ${forgedPercentage.value}% forjado.`)
    showToast(`Vitória! ${forgedPercentage.value}% do quadro forjado`, '', 'success')
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
  if (undoDelete()) { hideToast(); announce('Exclusão desfeita'); showToast('Exclusão desfeita', '', 'success') }
}
function showToast(message, action = '', tone = 'info') {
  pushToast(message, { action, tone, onAction: action ? onUndo : null, duration: action ? 6000 : 4000 })
}
function onToastAction() { if (toast.onAction) toast.onAction() }

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

onMounted(async () => {
  setDropHandler(onDropTask)
  window.addEventListener('keydown', onGlobalKeydown)
  window.addEventListener('resize', placeSwitchPill)
  nextTick(placeSwitchPill)
  document.fonts?.ready?.then(() => { pillPlaced = false; placeSwitchPill() })
  // Uma única sequência de entrada orquestrada (gsap.matchMedia respeita movimento reduzido)
  mm = gsap.matchMedia()
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out', clearProps: 'transform,opacity,visibility' } })
    tl.from('.board-header', { y: -14, autoAlpha: 0, duration: 0.7 })
      .from('.medallion-wrap', { y: 22, autoAlpha: 0, scale: 0.9, stagger: 0.09, duration: 0.8, ease: 'back.out(1.5)' }, 0.08)
    if (rootEl.value.querySelector('.kanban-column')) tl.from('.kanban-column', { y: 30, autoAlpha: 0, stagger: 0.1, duration: 0.8 }, 0.18)
    else if (rootEl.value.querySelector('.list-group')) tl.from('.list-group', { y: 24, autoAlpha: 0, stagger: 0.08, duration: 0.7 }, 0.18)
  }, rootEl.value)
  // Esqueleto curto enquanto as fontes carregam (no máximo 450 ms)
  await Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise(r => setTimeout(r, 450))])
  await new Promise(r => setTimeout(r, 180))
  booting.value = false
  await nextTick()
  if (!reducedMotion() && rootEl.value.querySelector('.scroll-card-wrapper')) {
    gsap.from(rootEl.value.querySelectorAll('.scroll-card-wrapper'), {
      y: 16, autoAlpha: 0, scale: 0.96, duration: 0.5, ease: 'back.out(1.4)',
      stagger: { each: 0.05, from: 'start' }, clearProps: 'transform,opacity,visibility'
    })
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
  window.removeEventListener('resize', placeSwitchPill)
  releaseNow()
  setDropHandler(null)
  cancelActiveDrag()
  hideToast()
  if (mm) mm.revert()
})
</script>
