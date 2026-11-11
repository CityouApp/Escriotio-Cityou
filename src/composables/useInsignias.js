import { reactive, watch } from 'vue'
import { INSIGNIA_BY_ID } from '../data/insignias'

const STORAGE_KEY = 'cityou_insignias_v1'
export const DEFAULT_INSIGNIAS = { LF: 'rasengan', LC: 'cardinal', AX: 'sharingan' }

// Cor de identidade de cada sócio (anel de presença, linhas de energia)
export const MEMBER_COLORS = { LF: '#38c6ff', LC: '#ff8a3d', AX: '#2fe0b5' }

function load() {
  const out = { ...DEFAULT_INSIGNIAS }
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    for (const [k, v] of Object.entries(raw || {})) if (INSIGNIA_BY_ID[v]) out[k] = v
  } catch { /* dados corrompidos: volta ao padrão */ }
  return out
}

export const memberInsignias = reactive(load())

watch(memberInsignias, (val) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(val)) } catch { /* modo privado */ }
}, { deep: true })

// Estado global do seletor de insígnias e do popover de sócio
export const ui = reactive({
  pickerFor: null,            // iniciais do sócio cujo seletor está aberto
  pickerReturnFocus: null,
  popover: null               // { initials, taskId|null, rect, returnFocus }
})

export function insigniaOf(initials) {
  return INSIGNIA_BY_ID[memberInsignias[initials]] || INSIGNIA_BY_ID[DEFAULT_INSIGNIAS[initials]] || INSIGNIA_BY_ID.shuriken
}
export function setInsignia(initials, id) {
  if (!INSIGNIA_BY_ID[id]) return false
  memberInsignias[initials] = id
  return true
}
export function openPicker(initials, returnFocus = null) {
  ui.popover = null
  ui.pickerReturnFocus = returnFocus || (typeof document !== 'undefined' ? document.activeElement : null)
  ui.pickerFor = initials
}
export function closePicker() { ui.pickerFor = null }
export function openMemberPopover(initials, anchorEl, taskId = null) {
  if (ui.popover && ui.popover.returnFocus === anchorEl) { ui.popover = null; return }
  const r = anchorEl.getBoundingClientRect()
  ui.popover = { initials, taskId, rect: { left: r.left, top: r.top, width: r.width, height: r.height, bottom: r.bottom, right: r.right }, returnFocus: anchorEl, key: Date.now() }
}
export function closeMemberPopover() { ui.popover = null }
export function memberColor(initials) { return MEMBER_COLORS[initials] || '#22e4ff' }
