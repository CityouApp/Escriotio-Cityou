import gsap from 'gsap'

export function reducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function burstSparks(el, colors = ['#ffd76a', '#3ddc84', '#22e4ff']) {
  if (!el || reducedMotion()) return
  const rect = el.getBoundingClientRect()
  const host = document.createElement('div')
  host.className = 'spark-host'
  host.setAttribute('aria-hidden', 'true')
  host.style.left = rect.left + rect.width / 2 + 'px'
  host.style.top = rect.top + rect.height / 2 + 'px'
  document.body.appendChild(host)
  const n = 16
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span')
    s.className = 'spark'
    s.style.background = colors[i % colors.length]
    host.appendChild(s)
    const angle = (i / n) * Math.PI * 2 + Math.random() * 0.5
    const dist = 60 + Math.random() * 70
    gsap.fromTo(s, { x: 0, y: 0, scale: 1, opacity: 1 }, {
      x: Math.cos(angle) * dist, y: Math.sin(angle) * dist - 20,
      scale: 0, opacity: 0, duration: 0.7 + Math.random() * 0.4,
      ease: 'power2.out', onComplete: () => s.remove()
    })
  }
  gsap.delayedCall(1.4, () => host.remove())
}
