import { reactive } from 'vue'
import gsap from 'gsap'
import { reducedMotion } from '../utils/motion'

const columnRegistry = new Map()
let dropHandler = null
let activeSession = null

export const dragState = reactive({
  active: false, taskId: null, fromStatus: null, overColumnId: null, beforeTaskId: null
})

export function registerDropColumn(id, refs) {
  columnRegistry.set(id, refs)
  return () => { if (columnRegistry.get(id) === refs) columnRegistry.delete(id) }
}
export function setDropHandler(fn) { dropHandler = fn }
export function cancelActiveDrag() { if (activeSession) activeSession.cancel() }

export function startDrag(event, task, sourceEl) {
  if (activeSession || document.body.classList.contains('modal-open')) return
  if (event.pointerType === 'mouse' && event.button !== 0) return

  const pointerId = event.pointerId
  const handleEl = event.currentTarget
  const startX = event.clientX
  const startY = event.clientY
  const rect = sourceEl.getBoundingClientRect()
  const offsetX = startX - rect.left
  const offsetY = startY - rect.top

  let ghost = null, qx = null, qy = null, rotTo = null, prevX = startX
  let overId = null, beforeId = null
  let rafId = 0, lastX = startX, lastY = startY

  function updateHover(x, y) {
    let found = null
    for (const [id, refs] of columnRegistry) {
      if (!refs.el || !refs.el.isConnected) continue
      const r = refs.el.getBoundingClientRect()
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) { found = id; break }
    }
    overId = found
    beforeId = null
    if (found) {
      const cards = columnRegistry.get(found).listEl?.querySelectorAll('[data-task-id]') || []
      for (const c of cards) {
        if (c.dataset.taskId === task.id) continue
        const cr = c.getBoundingClientRect()
        if (y < cr.top + cr.height / 2) { beforeId = c.dataset.taskId; break }
      }
    }
    dragState.overColumnId = overId
    dragState.beforeTaskId = beforeId
  }

  function tick() {
    const edge = 72
    let scrolled = false
    const vy = lastY < edge ? -Math.ceil((edge - lastY) / 6)
      : lastY > window.innerHeight - edge ? Math.ceil((lastY - (window.innerHeight - edge)) / 6) : 0
    if (vy) { window.scrollBy(0, vy); scrolled = true }
    const grid = document.querySelector('.kanban-grid')
    if (grid && grid.scrollWidth > grid.clientWidth + 4) {
      const gr = grid.getBoundingClientRect()
      const vx = lastX < gr.left + edge ? -9 : lastX > gr.right - edge ? 9 : 0
      if (vx) { grid.scrollLeft += vx; scrolled = true }
    }
    if (scrolled) updateHover(lastX, lastY)
    rafId = requestAnimationFrame(tick)
  }

  function onMove(e) {
    if (e.pointerId !== pointerId) return
    if (e.cancelable) e.preventDefault()
    lastX = e.clientX; lastY = e.clientY
    if (qx) { qx(e.clientX - offsetX); qy(e.clientY - offsetY) }
    if (rotTo) { rotTo(Math.max(-9, Math.min(9, (e.clientX - prevX) * 0.6))); prevX = e.clientX }
    updateHover(lastX, lastY)
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); endDrag(false) }
  }
  function onContextMenu(e) { e.preventDefault() }

  function teardown() {
    cancelAnimationFrame(rafId)
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onCancelEvent)
    window.removeEventListener('keydown', onKey, true)
    window.removeEventListener('contextmenu', onContextMenu)
    try { handleEl.releasePointerCapture(pointerId) } catch { /* noop */ }
    document.body.classList.remove('is-dragging')
    sourceEl.classList.remove('drag-source')
    dragState.active = false
    dragState.taskId = null
    dragState.fromStatus = null
    dragState.overColumnId = null
    dragState.beforeTaskId = null
    activeSession = null
    qx = qy = rotTo = null
  }

  function endDrag(commit) {
    const target = commit ? overId : null
    const before = beforeId
    const g = ghost
    ghost = null
    teardown()
    if (target && dropHandler) {
      dropHandler({ taskId: task.id, status: target, beforeTaskId: before, via: 'pointer' })
      if (g) landGhost(g, task.id)
    } else if (g) {
      const r = sourceEl.isConnected ? sourceEl.getBoundingClientRect() : rect
      if (reducedMotion()) g.remove()
      else gsap.to(g, { x: r.left, y: r.top, scale: 1, rotation: 0, opacity: 1, duration: 0.3, ease: 'power3.inOut', onComplete: () => g.remove() })
    }
  }

  function onUp(e) { if (e.pointerId === pointerId) endDrag(true) }
  function onCancelEvent(e) { if (e.pointerId === pointerId) endDrag(false) }

  function activate() {
    removePreListeners()
    dragState.active = true
    dragState.taskId = task.id
    dragState.fromStatus = task.status
    sourceEl.classList.add('drag-source')
    document.body.classList.add('is-dragging')

    ghost = sourceEl.cloneNode(true)
    ghost.removeAttribute('id')
    ghost.removeAttribute('data-task-id')
    ghost.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'))
    ghost.classList.add('drag-ghost')
    ghost.setAttribute('aria-hidden', 'true')
    Object.assign(ghost.style, {
      position: 'fixed', left: '0', top: '0', margin: '0',
      width: rect.width + 'px', zIndex: '9999', pointerEvents: 'none'
    })
    document.body.appendChild(ghost)
    gsap.set(ghost, { x: rect.left, y: rect.top, transformOrigin: '50% 50%' })
    qx = gsap.quickSetter(ghost, 'x', 'px')
    qy = gsap.quickSetter(ghost, 'y', 'px')
    if (!reducedMotion()) {
      gsap.to(ghost, { scale: 1.05, duration: 0.25, ease: 'back.out(2)' })
      rotTo = gsap.quickTo(ghost, 'rotation', { duration: 0.35, ease: 'power3.out' })
    }

    try { handleEl.setPointerCapture(pointerId) } catch { /* noop */ }
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancelEvent)
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('contextmenu', onContextMenu)
    activeSession = { cancel: () => endDrag(false) }
    rafId = requestAnimationFrame(tick)
    updateHover(lastX, lastY)
  }

  function onPreMove(e) {
    if (e.pointerId !== pointerId) return
    if (Math.hypot(e.clientX - startX, e.clientY - startY) > 5) { activate(); onMove(e) }
  }
  function onPreEnd(e) { if (e.pointerId === pointerId) removePreListeners() }
  function removePreListeners() {
    window.removeEventListener('pointermove', onPreMove)
    window.removeEventListener('pointerup', onPreEnd)
    window.removeEventListener('pointercancel', onPreEnd)
  }

  window.addEventListener('pointermove', onPreMove)
  window.addEventListener('pointerup', onPreEnd)
  window.addEventListener('pointercancel', onPreEnd)
}

// Pouso do "fantasma": voa até a posição final do cartão e some no lugar dele (FLIP)
function landGhost(g, taskId) {
  if (reducedMotion()) { g.remove(); return }
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const card = document.getElementById('task-card-' + taskId)
    if (!card) { gsap.to(g, { autoAlpha: 0, scale: 0.9, duration: 0.18, onComplete: () => g.remove() }); return }
    const r = card.getBoundingClientRect()
    card.style.visibility = 'hidden'
    gsap.to(g, {
      x: r.left, y: r.top, rotation: 0, scale: 1, duration: 0.42, ease: 'expo.out',
      onComplete: () => {
        card.style.visibility = ''
        g.remove()
        gsap.fromTo(card, { scale: 1.03 }, { scale: 1, duration: 0.45, ease: 'elastic.out(1, 0.5)', clearProps: 'transform' })
      }
    })
  }))
}
