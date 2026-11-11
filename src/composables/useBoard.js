import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'nos_estudio_kanban_v3'
const LEGACY_KEY = 'nos_estudio_kanban_v1'

export const COLUMN_ORDER = ['todo', 'inprogress', 'done']
export const CURRENT_USER = 'LF'
export const TAG_PRESETS = ['Produto', 'UX', 'Design', 'Financeiro', 'Comercial', 'Cliente', 'Ops', 'Jurídico']

function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 't-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
}
function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export function isoAddDays(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return isoDate(d)
}
function parseISO(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export function dueLabel(task) {
  if (!task.dueDate) return ''
  const diff = Math.round((parseISO(task.dueDate) - parseISO(isoDate(new Date()))) / 86400000)
  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Amanhã'
  if (diff === -1) return 'Ontem'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(parseISO(task.dueDate)).replace('.', '')
}
export function isOverdue(task) {
  return !!task.dueDate && task.status !== 'done' && parseISO(task.dueDate) < parseISO(isoDate(new Date()))
}
export function normalizeText(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}
export function tagClass(tag) {
  const known = ['produto', 'ux', 'design', 'financeiro', 'comercial', 'cliente', 'ops', 'juridico']
  const n = normalizeText(tag).replace(/\s+/g, '-')
  return known.includes(n) ? 'tag-' + n : 'tag-default'
}
function clone(v) { return JSON.parse(JSON.stringify(v)) }

const INITIAL_TASKS = [
  { id: 't1', status: 'todo', tags: ['Produto', 'UX'], title: 'Revisar fluxo de onboarding no app',
    checklist: [{ text: 'Auditar telas de boas-vindas', done: false }, { text: 'Ajustar microcopy do tutorial', done: false }],
    urgent: false, dueDate: '', comments: 0, assignees: ['LF'] },
  { id: 't2', status: 'todo', tags: ['Financeiro'], title: 'Atualizar orçamento de novembro',
    checklist: [{ text: 'Consolidar notas fiscais', done: true }, { text: 'Projetar fluxo de caixa Q4', done: false }],
    urgent: false, dueDate: isoAddDays(1), comments: 0, assignees: ['AX'] },
  { id: 't3', status: 'inprogress', tags: ['Comercial', 'Cliente'], title: 'Fechar proposta comercial — Aurora Café',
    checklist: [{ text: 'Definir escopo técnico', done: true }, { text: 'Orçamentar cronograma 3D', done: true }, { text: 'Revisão final com sócios', done: false }],
    urgent: true, dueDate: '', comments: 1, assignees: ['LF', 'LC'] },
  { id: 't4', status: 'inprogress', tags: ['Design', 'Produto'], title: 'Aprovar identidade visual do lançamento',
    checklist: [{ text: 'Key visual e shaders', done: true }, { text: 'Guia tipográfico', done: true }, { text: 'Assets redes sociais', done: false }],
    urgent: false, dueDate: '', comments: 0, assignees: ['LF'] },
  { id: 't5', status: 'done', tags: ['Comercial', 'Cliente'], title: 'Enviar contrato assinado — Studio Vega',
    checklist: [{ text: 'Assinatura jurídica', done: true }, { text: 'Disparo no portal do cliente', done: true }],
    urgent: false, dueDate: '', comments: 0, assignees: ['LF'] },
  { id: 't6', status: 'done', tags: ['Produto', 'Ops'], title: 'Configurar ambiente de produção',
    checklist: [{ text: 'Pipeline CI/CD Vite', done: true }, { text: 'Certificados SSL e CDN', done: true }],
    urgent: false, dueDate: '', comments: 0, assignees: ['LC'] }
]

function normalizeTask(raw) {
  if (!raw || typeof raw !== 'object' || !raw.title) return null
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : uid(),
    status: COLUMN_ORDER.includes(raw.status) ? raw.status : 'todo',
    title: String(raw.title).slice(0, 140),
    tags: Array.isArray(raw.tags) ? raw.tags.filter(t => typeof t === 'string' && t.trim()).map(t => t.trim()).slice(0, 6) : [],
    checklist: Array.isArray(raw.checklist) ? raw.checklist.filter(i => i && typeof i.text === 'string').map(i => ({ text: i.text, done: !!i.done })) : [],
    urgent: !!raw.urgent,
    dueDate: typeof raw.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.dueDate) ? raw.dueDate : '',
    comments: Number.isFinite(raw.comments) ? raw.comments : 0,
    assignees: Array.isArray(raw.assignees) ? raw.assignees.filter(a => typeof a === 'string') : [],
    createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now()
  }
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY)
    if (!raw) return clone(INITIAL_TASKS).map(normalizeTask)
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return clone(INITIAL_TASKS).map(normalizeTask)
    const migrated = parsed.map(t => {
      if (t && !t.dueDate && typeof t.dueText === 'string') {
        const d = normalizeText(t.dueText)
        if (d === 'hoje') t.dueDate = isoAddDays(0)
        else if (d === 'amanha') t.dueDate = isoAddDays(1)
      }
      return normalizeTask(t)
    }).filter(Boolean)
    return migrated.length ? migrated : clone(INITIAL_TASKS).map(normalizeTask)
  } catch {
    return clone(INITIAL_TASKS).map(normalizeTask)
  }
}

const tasks = ref(loadTasks())
const savedView = ref('all')
const selectedMember = ref(null)
const searchQuery = ref('')
const sortMode = ref('manual')
const selectedIds = ref([])
const lastDeleted = ref(null)

const partners = ref([
  { id: 'luiz-felipe', name: 'LUIZ FELIPE', initials: 'LF', isYou: true, online: true, emblem: 'bolt', statusText: 'NO COMBATE (Online)' },
  { id: 'luiz-carlos', name: 'LUIZ CARLOS', initials: 'LC', isYou: false, online: false, emblem: 'shield', statusText: 'Offline — há 1 h' },
  { id: 'alexandre', name: "ALEXANDRE 'XANDE'", initials: 'AX', isYou: false, online: false, emblem: 'star', statusText: 'Offline — há 1 h' }
])

const columns = [
  { id: 'todo', title: 'PORTAL DOS PREPARATIVOS', subtitle: 'A fazer', themeClass: 'col-todo' },
  { id: 'inprogress', title: 'A FORJA / ATIVAÇÃO', subtitle: 'Em andamento', themeClass: 'col-inprogress' },
  { id: 'done', title: 'RELÍQUIAS / VITÓRIA', subtitle: 'Concluído', themeClass: 'col-done' }
]

let persistTimer = null
watch(tasks, (val) => {
  clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(val)) }
    catch (e) { console.warn('[useBoard] Falha ao persistir:', e) }
  }, 200)
}, { deep: true })

export function useBoard() {
  const forgedPercentage = computed(() => {
    if (!tasks.value.length) return 0
    return Math.round((tasks.value.filter(t => t.status === 'done').length / tasks.value.length) * 100)
  })
  const onlineCount = computed(() => partners.value.filter(p => p.online).length)
  const hasActiveFilters = computed(() => savedView.value !== 'all' || !!selectedMember.value || !!searchQuery.value.trim())

  function filteredTasksByColumn(colId) {
    const q = normalizeText(searchQuery.value.trim())
    let list = tasks.value.filter(t => {
      if (t.status !== colId) return false
      if (savedView.value === 'mine' && !t.assignees.includes(CURRENT_USER)) return false
      if (savedView.value === 'urgent' && !t.urgent) return false
      if (selectedMember.value && !t.assignees.includes(selectedMember.value)) return false
      if (q) {
        const hay = normalizeText([t.title, ...t.tags, ...t.checklist.map(i => i.text)].join(' '))
        if (!hay.includes(q)) return false
      }
      return true
    })
    if (sortMode.value === 'due') list = [...list].sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'))
    else if (sortMode.value === 'urgent') list = [...list].sort((a, b) => (b.urgent - a.urgent) || (a.dueDate || '9999').localeCompare(b.dueDate || '9999'))
    else if (sortMode.value === 'title') list = [...list].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))
    return list
  }

  function moveTask(taskId, newStatus, beforeTaskId = null) {
    if (!COLUMN_ORDER.includes(newStatus)) return null
    const idx = tasks.value.findIndex(t => t.id === taskId)
    if (idx < 0) return null
    const task = tasks.value[idx]
    const fromStatus = task.status
    if (fromStatus === newStatus && beforeTaskId === taskId) return null
    tasks.value.splice(idx, 1)
    const completed = newStatus === 'done' && fromStatus !== 'done'
    task.status = newStatus
    if (completed) task.checklist.forEach(i => (i.done = true))
    let insertAt
    if (beforeTaskId && beforeTaskId !== taskId) {
      const bi = tasks.value.findIndex(t => t.id === beforeTaskId)
      insertAt = bi >= 0 ? bi : tasks.value.length
    } else {
      const colTasks = tasks.value.filter(t => t.status === newStatus)
      const last = colTasks[colTasks.length - 1]
      insertAt = last ? tasks.value.indexOf(last) + 1 : tasks.value.length
    }
    tasks.value.splice(insertAt, 0, task)
    return { task, fromStatus, completed }
  }

  function upsertTask(payload) {
    const clean = normalizeTask({ ...payload, id: payload.id || uid() })
    if (!clean) return null
    const idx = tasks.value.findIndex(t => t.id === clean.id)
    if (idx >= 0) {
      clean.comments = tasks.value[idx].comments
      clean.createdAt = tasks.value[idx].createdAt
      tasks.value[idx] = clean
    } else {
      tasks.value.unshift(clean)
    }
    return clean
  }

  function removeTasks(ids) {
    const idSet = new Set(ids)
    const items = []
    for (let i = tasks.value.length - 1; i >= 0; i--) {
      if (idSet.has(tasks.value[i].id)) {
        const [task] = tasks.value.splice(i, 1)
        items.push({ task, index: i })
      }
    }
    items.reverse()
    if (items.length) lastDeleted.value = { items }
    selectedIds.value = selectedIds.value.filter(id => !idSet.has(id))
    return items.length
  }
  function removeTask(taskId) {
    const n = removeTasks([taskId])
    return n ? lastDeleted.value.items[0].task : null
  }
  function undoDelete() {
    if (!lastDeleted.value?.items?.length) return false
    for (const { task, index } of lastDeleted.value.items) {
      tasks.value.splice(Math.min(index, tasks.value.length), 0, task)
    }
    lastDeleted.value = null
    return true
  }

  function bulkSetUrgent(ids, val) {
    let n = 0
    const idSet = new Set(ids)
    tasks.value.forEach(t => { if (idSet.has(t.id) && t.urgent !== val) { t.urgent = val; n++ } })
    return n
  }

  function toggleSelect(id) {
    const i = selectedIds.value.indexOf(id)
    if (i >= 0) selectedIds.value.splice(i, 1)
    else selectedIds.value.push(id)
  }
  function toggleSelectMany(ids, on) {
    const set = new Set(selectedIds.value)
    ids.forEach(id => (on ? set.add(id) : set.delete(id)))
    selectedIds.value = [...set]
  }
  function clearSelection() { selectedIds.value = [] }

  function clearFilters() {
    savedView.value = 'all'
    selectedMember.value = null
    searchQuery.value = ''
  }
  function resetBoard() {
    tasks.value = clone(INITIAL_TASKS).map(normalizeTask)
    lastDeleted.value = null
    clearSelection()
    clearFilters()
    sortMode.value = 'manual'
  }

  return {
    tasks, partners, columns,
    savedView, selectedMember, searchQuery, sortMode, selectedIds,
    forgedPercentage, onlineCount, hasActiveFilters,
    filteredTasksByColumn, moveTask, upsertTask, removeTask, removeTasks,
    undoDelete, bulkSetUrgent, toggleSelect, toggleSelectMany, clearSelection,
    clearFilters, resetBoard
  }
}

export { partners }
