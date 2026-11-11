import { ref, reactive, computed, watch } from 'vue'
import { memberInsignias, setInsignia } from './useInsignias'

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

const PARTNER_INITIALS = ['LF', 'LC', 'AX']

function normalizeHandoff(h) {
  if (!h || typeof h !== 'object' || !PARTNER_INITIALS.includes(h.holder)) return null
  return {
    holder: h.holder,
    from: PARTNER_INITIALS.includes(h.from) ? h.from : CURRENT_USER,
    to: h.holder,
    note: String(h.note || '').slice(0, 160),
    updatedAt: Number.isFinite(h.updatedAt) ? h.updatedAt : Date.now()
  }
}

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
    handoff: normalizeHandoff(raw.handoff),
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

// ============ COLABORAÇÃO À DISTÂNCIA (offline, localStorage) ============
const COLLAB_KEY = 'cityou_collab_v1'
const VIEW_KEY = 'cityou_view_v1'
export const DEFAULT_TZ = 'America/Sao_Paulo'
export const TIMEZONE_OPTIONS = [
  { id: 'America/Sao_Paulo', label: 'Brasília / São Paulo / Rio' },
  { id: 'America/Manaus', label: 'Manaus / Cuiabá' },
  { id: 'America/Noronha', label: 'Fernando de Noronha' },
  { id: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires' },
  { id: 'America/Santiago', label: 'Santiago' },
  { id: 'America/Bogota', label: 'Bogotá / Lima' },
  { id: 'America/Mexico_City', label: 'Cidade do México' },
  { id: 'America/New_York', label: 'Nova York / Miami' },
  { id: 'America/Chicago', label: 'Chicago / Dallas' },
  { id: 'America/Denver', label: 'Denver' },
  { id: 'America/Los_Angeles', label: 'Los Angeles / São Francisco' },
  { id: 'Europe/Lisbon', label: 'Lisboa / Porto' },
  { id: 'Europe/London', label: 'Londres' },
  { id: 'Europe/Madrid', label: 'Madri / Paris / Roma / Berlim' },
  { id: 'Africa/Luanda', label: 'Luanda' },
  { id: 'Asia/Dubai', label: 'Dubai' },
  { id: 'Asia/Tokyo', label: 'Tóquio' },
  { id: 'Australia/Sydney', label: 'Sydney' }
]
function validTz(tz) {
  if (typeof tz !== 'string' || !tz) return false
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true } catch { return false }
}
function defaultCollab(initials) {
  return { city: '', timezone: DEFAULT_TZ, workStart: 9, workEnd: 18, checkin: null }
}
function clampHour(n, d) { n = Number(n); return Number.isFinite(n) ? Math.min(24, Math.max(0, Math.round(n))) : d }
function normalizeCollabPartner(raw, initials) {
  const base = defaultCollab(initials)
  if (!raw || typeof raw !== 'object') return base
  const c = raw.checkin
  return {
    city: String(raw.city || '').slice(0, 60),
    timezone: validTz(raw.timezone) ? raw.timezone : DEFAULT_TZ,
    workStart: clampHour(raw.workStart, 9),
    workEnd: clampHour(raw.workEnd, 18),
    checkin: c && typeof c === 'object' && Number.isFinite(c.updatedAt)
      ? { focus: String(c.focus || '').slice(0, 160), city: String(c.city || '').slice(0, 60), blockers: String(c.blockers || '').slice(0, 160), updatedAt: c.updatedAt }
      : null
  }
}
function normalizeDecision(d) {
  if (!d || typeof d !== 'object' || !String(d.title || '').trim()) return null
  return {
    id: typeof d.id === 'string' && d.id ? d.id : uid(),
    title: String(d.title).trim().slice(0, 140),
    context: String(d.context || '').trim().slice(0, 280),
    author: PARTNER_INITIALS.includes(d.author) ? d.author : CURRENT_USER,
    taskId: typeof d.taskId === 'string' ? d.taskId : null,
    createdAt: Number.isFinite(d.createdAt) ? d.createdAt : Date.now()
  }
}
function normalizeActivity(a) {
  if (!a || typeof a !== 'object' || typeof a.text !== 'string') return null
  return {
    id: typeof a.id === 'string' ? a.id : uid(),
    type: String(a.type || 'edit'),
    actor: PARTNER_INITIALS.includes(a.actor) ? a.actor : CURRENT_USER,
    text: a.text.slice(0, 220),
    taskId: typeof a.taskId === 'string' ? a.taskId : null,
    createdAt: Number.isFinite(a.createdAt) ? a.createdAt : Date.now()
  }
}
function normalizeCollab(raw) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const team = {}
  for (const ini of PARTNER_INITIALS) team[ini] = normalizeCollabPartner(src.team?.[ini], ini)
  return {
    team,
    decisions: Array.isArray(src.decisions) ? src.decisions.map(normalizeDecision).filter(Boolean).slice(0, 200) : [],
    activities: Array.isArray(src.activities) ? src.activities.map(normalizeActivity).filter(Boolean).slice(0, 150) : []
  }
}
function loadCollab() {
  try { return normalizeCollab(JSON.parse(localStorage.getItem(COLLAB_KEY) || 'null')) }
  catch { return normalizeCollab(null) }
}

const collab = reactive(loadCollab())
const activeTab = ref('board') // 'board' | 'team' | 'activity'
const boardSubView = ref((() => { try { return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'kanban' } catch { return 'kanban' } })())

let collabTimer = null
watch(collab, (val) => {
  clearTimeout(collabTimer)
  collabTimer = setTimeout(() => {
    try { localStorage.setItem(COLLAB_KEY, JSON.stringify(val)) }
    catch (e) { console.warn('[useBoard] Falha ao persistir colaboração:', e) }
  }, 150)
}, { deep: true })
watch(boardSubView, (v) => { try { localStorage.setItem(VIEW_KEY, v) } catch { /* modo privado */ } })

function initialsName(ini) {
  return { LF: 'Luiz Felipe', LC: 'Luiz Carlos', AX: 'Xande' }[ini] || ini
}
function logActivity(type, text, taskId = null, actor = CURRENT_USER) {
  collab.activities.unshift({ id: uid(), type, actor, text: String(text).slice(0, 220), taskId, createdAt: Date.now() })
  if (collab.activities.length > 150) collab.activities.length = 150
}

export function formatTimeInZone(tz, date = new Date()) {
  try { return new Intl.DateTimeFormat('pt-BR', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(date) }
  catch { return '--:--' }
}
export function hourInZone(tz, date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(date)
    const h = Number(parts.find(p => p.type === 'hour')?.value ?? 0) % 24
    const m = Number(parts.find(p => p.type === 'minute')?.value ?? 0)
    return h + m / 60
  } catch { return date.getHours() + date.getMinutes() / 60 }
}
// Diferença (em horas) entre o fuso e UTC no instante dado
export function tzOffsetHours(tz, date = new Date()) {
  const utc = date.getUTCHours() + date.getUTCMinutes() / 60
  let d = hourInZone(tz, date) - utc
  if (d > 14) d -= 24
  if (d < -12) d += 24
  return Math.round(d * 4) / 4
}
export function isWorking(member, localHour) {
  const s = member.workStart, e = member.workEnd
  const h = ((localHour % 24) + 24) % 24
  return s <= e ? (h >= s && h < e) : (h >= s || h < e)
}
// Horas UTC (0..23) em que todos estão no expediente
export function overlapUtcHours(team, date = new Date()) {
  const out = []
  for (let u = 0; u < 24; u++) {
    if (PARTNER_INITIALS.every(ini => isWorking(team[ini], u + tzOffsetHours(team[ini].timezone, date)))) out.push(u)
  }
  return out
}

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
  const batonWithMeCount = computed(() => tasks.value.filter(t => t.status !== 'done' && t.handoff?.holder === CURRENT_USER).length)
  const hasActiveFilters = computed(() => savedView.value !== 'all' || !!selectedMember.value || !!searchQuery.value.trim())

  function filteredTasksByColumn(colId) {
    const q = normalizeText(searchQuery.value.trim())
    let list = tasks.value.filter(t => {
      if (colId && t.status !== colId) return false
      if (savedView.value === 'mine' && !t.assignees.includes(CURRENT_USER)) return false
      if (savedView.value === 'urgent' && !t.urgent) return false
      if (savedView.value === 'baton' && t.handoff?.holder !== CURRENT_USER) return false
      if (selectedMember.value && !t.assignees.includes(selectedMember.value) && t.handoff?.holder !== selectedMember.value) return false
      if (q) {
        const hay = normalizeText([t.title, ...t.tags, ...t.checklist.map(i => i.text), t.handoff?.note || ''].join(' '))
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
    if (completed) { task.checklist.forEach(i => (i.done = true)); task.handoff = null }
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
    if (fromStatus !== newStatus) {
      const col = columns.find(c => c.id === newStatus)?.subtitle || newStatus
      logActivity(completed ? 'done' : 'move', `${completed ? 'concluiu' : 'moveu'} “${task.title}”${completed ? '' : ' para ' + col}`, task.id)
    }
    return { task, fromStatus, completed }
  }

  function upsertTask(payload) {
    const clean = normalizeTask({ ...payload, id: payload.id || uid() })
    if (!clean) return null
    const idx = tasks.value.findIndex(t => t.id === clean.id)
    if (idx >= 0) {
      clean.comments = tasks.value[idx].comments
      clean.createdAt = tasks.value[idx].createdAt
      if (payload.handoff === undefined) clean.handoff = tasks.value[idx].handoff
      tasks.value[idx] = clean
      logActivity('edit', `editou “${clean.title}”`, clean.id)
    } else {
      tasks.value.unshift(clean)
      logActivity('create', `criou “${clean.title}”`, clean.id)
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

  function passBaton(taskId, toInitials, note = '', fromInitials = CURRENT_USER) {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return null
    if (!toInitials) {
      task.handoff = null
      logActivity('handoff', `recolheu o bastão de “${task.title}”`, task.id, fromInitials)
      return task
    }
    if (!PARTNER_INITIALS.includes(toInitials)) return null
    task.handoff = normalizeHandoff({ holder: toInitials, from: fromInitials, note: String(note || '').trim(), updatedAt: Date.now() })
    if (!task.assignees.includes(toInitials)) task.assignees.push(toInitials)
    const n = task.handoff.note
    logActivity('handoff', `passou o bastão de “${task.title}” para ${initialsName(toInitials)}${n ? ` — “${n}”` : ''}`, task.id, fromInitials)
    return task
  }

  function updateMemberSettings(initials, patch) {
    const m = collab.team[initials]
    if (!m) return false
    if (patch.city !== undefined) m.city = String(patch.city).slice(0, 60)
    if (patch.timezone !== undefined && validTz(patch.timezone)) m.timezone = patch.timezone
    if (patch.workStart !== undefined) m.workStart = clampHour(patch.workStart, m.workStart)
    if (patch.workEnd !== undefined) m.workEnd = clampHour(patch.workEnd, m.workEnd)
    return true
  }

  function saveCheckin(initials, { focus = '', city = '', blockers = '' } = {}) {
    const m = collab.team[initials]
    if (!m) return null
    m.checkin = { focus: String(focus).trim().slice(0, 160), city: String(city).trim().slice(0, 60), blockers: String(blockers).trim().slice(0, 160), updatedAt: Date.now() }
    if (m.checkin.city) m.city = m.checkin.city
    logActivity('checkin', `fez o check-in${m.checkin.city ? ' em ' + m.checkin.city : ''}${m.checkin.focus ? `: “${m.checkin.focus}”` : ''}`, null, initials)
    return m.checkin
  }

  function addDecision({ title, context = '', author = CURRENT_USER, taskId = null }) {
    const entry = normalizeDecision({ title, context, author, taskId: taskId || null, createdAt: Date.now() })
    if (!entry) return null
    collab.decisions.unshift(entry)
    logActivity('decision', `registrou a decisão “${entry.title}”`, entry.taskId, entry.author)
    return entry
  }
  function removeDecision(id) {
    const i = collab.decisions.findIndex(d => d.id === id)
    if (i >= 0) collab.decisions.splice(i, 1)
  }

  function exportWorkspace() {
    return {
      app: 'escritorio-cityou',
      version: 1,
      exportedAt: new Date().toISOString(),
      exportedBy: CURRENT_USER,
      tasks: JSON.parse(JSON.stringify(tasks.value)),
      collab: JSON.parse(JSON.stringify(collab)),
      insignias: { ...memberInsignias }
    }
  }
  function importWorkspace(input) {
    const data = typeof input === 'string' ? JSON.parse(input) : input
    if (!data || typeof data !== 'object' || !Array.isArray(data.tasks)) throw new Error('Arquivo sem a lista de tarefas')
    const nextTasks = data.tasks.map(normalizeTask).filter(Boolean)
    if (!nextTasks.length && data.tasks.length) throw new Error('Nenhuma tarefa válida no arquivo')
    tasks.value = nextTasks
    if (data.collab) {
      const c = normalizeCollab(data.collab)
      Object.assign(collab.team, c.team)
      collab.decisions.splice(0, collab.decisions.length, ...c.decisions)
      collab.activities.splice(0, collab.activities.length, ...c.activities)
    }
    if (data.insignias && typeof data.insignias === 'object') {
      for (const [k, v] of Object.entries(data.insignias)) if (PARTNER_INITIALS.includes(k)) setInsignia(k, v)
    }
    clearSelection()
    lastDeleted.value = null
    logActivity('sync', `importou um quadro com ${nextTasks.length} tarefa${nextTasks.length === 1 ? '' : 's'}`)
    return nextTasks.length
  }

  return {
    collab, activeTab, boardSubView, batonWithMeCount,
    passBaton, updateMemberSettings, saveCheckin, addDecision, removeDecision,
    exportWorkspace, importWorkspace,
    tasks, partners, columns,
    savedView, selectedMember, searchQuery, sortMode, selectedIds,
    forgedPercentage, onlineCount, hasActiveFilters,
    filteredTasksByColumn, moveTask, upsertTask, removeTask, removeTasks,
    undoDelete, bulkSetUrgent, toggleSelect, toggleSelectMany, clearSelection,
    clearFilters, resetBoard
  }
}

export { partners, collab, initialsName, PARTNER_INITIALS }
