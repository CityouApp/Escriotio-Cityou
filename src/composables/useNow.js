import { ref } from 'vue'

// Relógio compartilhado: um único intervalo para todos os relógios da tela
export const now = ref(new Date())
let timer = null
let users = 0
export function useNow() {
  users++
  if (!timer) {
    const tick = () => { now.value = new Date() }
    // alinha ao início do próximo minuto e depois atualiza a cada 15 s
    timer = setTimeout(function loop() { tick(); timer = setTimeout(loop, 15000) }, 1000)
  }
  return {
    now,
    release() { users--; if (users <= 0 && timer) { clearTimeout(timer); timer = null; users = 0 } }
  }
}

export function relativeTime(ts, ref = Date.now()) {
  const m = Math.max(0, Math.round((ref - ts) / 60000))
  if (m < 1) return 'agora'
  if (m < 60) return `há ${m} min`
  const h = Math.round(m / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.round(h / 24)
  return d === 1 ? 'ontem' : `há ${d} dias`
}

export function isToday(ts) {
  const a = new Date(ts), b = new Date()
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
