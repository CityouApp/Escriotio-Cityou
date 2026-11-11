<template>
  <component
    :is="interactive ? 'button' : 'span'"
    ref="el"
    :type="interactive ? 'button' : undefined"
    class="member-avatar"
    :class="['ma-' + size, { 'is-online': online, 'is-static': !interactive }]"
    :style="{ '--m-color': color, '--i-color': ins.color, '--i-glow': ins.glow }"
    :aria-label="interactive ? ariaLabel : undefined"
    :aria-haspopup="interactive ? 'dialog' : undefined"
    :aria-hidden="interactive ? undefined : 'true'"
    @click.stop="onClick"
    @pointermove="onTilt"
    @pointerleave="resetTilt"
    @pointerdown="interactive && $event.stopPropagation()"
  >
    <span class="ma-ring" aria-hidden="true"></span>
    <span class="ma-disc" aria-hidden="true">
      <InsigniaGlyph :id="ins.id" :animated="animated" />
    </span>
    <span v-if="showInitials" class="ma-initials" aria-hidden="true">{{ initials }}</span>
    <span v-if="online" class="ma-presence" aria-hidden="true"></span>
    <span v-if="interactive" class="ma-tip" role="presentation" aria-hidden="true">{{ displayName }}</span>
  </component>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import InsigniaGlyph from './InsigniaGlyph.vue'
import { insigniaOf, memberColor, openMemberPopover } from '../../composables/useInsignias'
import { partners } from '../../composables/useBoard'
import { reducedMotion } from '../../utils/motion'

const props = defineProps({
  initials: { type: String, required: true },
  size: { type: String, default: 'md' },          // sm | md | lg
  taskId: { type: String, default: null },
  interactive: { type: Boolean, default: true },
  animated: { type: Boolean, default: true },
  showInitials: { type: Boolean, default: true }
})

const el = ref(null)
const elNode = () => el.value?.$el || el.value
const ins = computed(() => insigniaOf(props.initials))
const color = computed(() => memberColor(props.initials))
const partner = computed(() => partners.value.find(p => p.initials === props.initials))
const online = computed(() => !!partner.value?.online)
const displayName = computed(() => {
  const n = partner.value?.name || props.initials
  return n.toLowerCase().replace(/(?<=^|[\s'])\p{L}/gu, c => c.toUpperCase())
})
const ariaLabel = computed(() => `${displayName.value}, insígnia ${ins.value.name}${props.interactive ? '. Abrir detalhes do sócio' : ''}`)

function onClick() {
  if (!props.interactive || !el.value) return
  if (!reducedMotion()) gsap.fromTo(elNode(), { scale: 0.86 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.4)', clearProps: 'scale' })
  openMemberPopover(props.initials, elNode(), props.taskId)
}

let rx = null, ry = null
function onTilt(e) {
  if (!props.interactive || e.pointerType !== 'mouse' || reducedMotion() || !el.value) return
  if (!rx) {
    rx = gsap.quickTo(elNode(), 'rotationX', { duration: 0.3, ease: 'power3.out' })
    ry = gsap.quickTo(elNode(), 'rotationY', { duration: 0.3, ease: 'power3.out' })
  }
  const r = elNode().getBoundingClientRect()
  const px = (e.clientX - r.left) / r.width - 0.5
  const py = (e.clientY - r.top) / r.height - 0.5
  rx(-py * 28); ry(px * 28)
}
function resetTilt() { if (rx) { rx(0); ry(0) } }
onBeforeUnmount(() => { const n = elNode(); if (n) gsap.killTweensOf(n) })
</script>
