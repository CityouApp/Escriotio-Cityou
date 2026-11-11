import gsap from 'gsap'
import { reducedMotion } from './motion'

// Diretiva v-magnetic: o botão é levemente "puxado" pelo cursor e volta com mola.
export const vMagnetic = {
  mounted(el, binding) {
    const strength = binding.value || 0.28
    let xTo, yTo
    const move = (e) => {
      if (e.pointerType !== 'mouse' || reducedMotion()) return
      if (!xTo) {
        xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' })
        yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' })
      }
      const r = el.getBoundingClientRect()
      xTo((e.clientX - (r.left + r.width / 2)) * strength)
      yTo((e.clientY - (r.top + r.height / 2)) * strength)
    }
    const leave = () => {
      if (!xTo) return
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' })
      xTo = yTo = null
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    el._mag = { move, leave }
  },
  unmounted(el) {
    if (!el._mag) return
    el.removeEventListener('pointermove', el._mag.move)
    el.removeEventListener('pointerleave', el._mag.leave)
    gsap.killTweensOf(el)
  }
}
