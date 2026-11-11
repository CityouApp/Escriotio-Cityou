import { reactive } from 'vue'

// Barramento simples de avisos: qualquer componente pode disparar um toast.
export const toastState = reactive({ show: false, message: '', action: '', tone: 'info', key: 0, onAction: null })
let timer = null

export function showToast(message, { action = '', tone = 'info', onAction = null, duration = 5000 } = {}) {
  clearTimeout(timer)
  Object.assign(toastState, { show: true, message, action, tone, onAction, key: toastState.key + 1 })
  timer = setTimeout(hideToast, duration)
}
export function hideToast() { clearTimeout(timer); toastState.show = false }
