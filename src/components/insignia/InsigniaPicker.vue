<template>
  <Teleport to="body">
    <div ref="backdropEl" class="ip-backdrop" @pointerdown.self="close">
      <div
        ref="panelEl"
        class="ip-panel glass"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ip-title"
        :style="{ '--m-color': mColor, '--i-color': current.color, '--i-glow': current.glow }"
        @keydown="onKeydown"
      >
        <header class="ip-header">
          <div>
            <h2 id="ip-title">Escolha sua insígnia</h2>
            <p class="ip-sub">A insígnia de {{ memberName }} aparece no quadro, nos cartões e no time.</p>
          </div>
          <button type="button" class="ip-close icon-btn" aria-label="Fechar seletor de insígnias" @click="close">×</button>
        </header>

        <div class="ip-body">
          <div class="ip-preview" aria-live="polite">
            <div ref="previewEl" class="ip-preview-orb">
              <span class="ip-preview-halo" aria-hidden="true"></span>
              <InsigniaGlyph :id="previewId" class="ip-preview-glyph" />
            </div>
            <div class="ip-preview-name">{{ preview.name }}</div>
            <div class="ip-preview-hint">{{ preview.hint }}</div>
            <div class="ip-preview-state">{{ previewId === selected ? 'Em uso' : 'Clique para usar' }}</div>
          </div>

          <div ref="gridEl" class="ip-grid" role="radiogroup" aria-label="Insígnias disponíveis">
            <button
              v-for="(ins, i) in INSIGNIAS"
              :key="ins.id"
              type="button"
              role="radio"
              class="ip-option"
              :class="{ active: selected === ins.id }"
              :aria-checked="selected === ins.id"
              :aria-label="`${ins.name}: ${ins.hint}`"
              :tabindex="focusIndex === i ? 0 : -1"
              :style="{ '--o-color': ins.color, '--o-glow': ins.glow }"
              @click="choose(ins.id, $event)"
              @pointerenter="hoverId = ins.id"
              @pointerleave="hoverId = null"
              @focus="focusIndex = i; hoverId = ins.id"
            >
              <span class="ip-option-orb"><InsigniaGlyph :id="ins.id" :animated="selected === ins.id || hoverId === ins.id" /></span>
              <span class="ip-option-name">{{ ins.name }}</span>
              <span v-if="selected === ins.id" class="ip-check" aria-hidden="true">✓</span>
            </button>
          </div>
        </div>

        <footer class="ip-footer">
          <span class="ip-foot-note">Salvo neste navegador automaticamente.</span>
          <button type="button" class="btn-primary" @click="close">Pronto</button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import gsap from 'gsap'
import InsigniaGlyph from './InsigniaGlyph.vue'
import { INSIGNIAS, INSIGNIA_BY_ID } from '../../data/insignias'
import { memberInsignias, setInsignia, closePicker, ui, memberColor } from '../../composables/useInsignias'
import { partners } from '../../composables/useBoard'
import { showToast } from '../../composables/useToast'
import { reducedMotion, burstSparks } from '../../utils/motion'

const props = defineProps({ initials: { type: String, required: true } })

const backdropEl = ref(null)
const panelEl = ref(null)
const gridEl = ref(null)
const previewEl = ref(null)
const hoverId = ref(null)
const selected = computed(() => memberInsignias[props.initials])
const focusIndex = ref(Math.max(0, INSIGNIAS.findIndex(i => i.id === selected.value)))
const previewId = computed(() => hoverId.value || selected.value)
const preview = computed(() => INSIGNIA_BY_ID[previewId.value])
const current = computed(() => INSIGNIA_BY_ID[selected.value])
const mColor = computed(() => memberColor(props.initials))
const member = computed(() => partners.value.find(p => p.initials === props.initials))
const memberName = computed(() => member.value ? titleCase(member.value.name) : props.initials)
let closing = false

function titleCase(s) { return s.toLowerCase().replace(/(?<=^|[\s'])\p{L}/gu, c => c.toUpperCase()) }

function choose(id, e) {
  if (id === selected.value) return
  setInsignia(props.initials, id)
  const ins = INSIGNIA_BY_ID[id]
  showToast(`${memberName.value} agora usa ${ins.name}`, { tone: 'success' })
  if (!reducedMotion()) {
    burstSparks(e.currentTarget, [ins.color, '#ffffff', mColor.value])
    if (previewEl.value) gsap.fromTo(previewEl.value, { scale: 0.82, rotate: -12 }, { scale: 1, rotate: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)' })
  }
}

function close() {
  if (closing) return
  closing = true
  const done = () => {
    closePicker()
    const rf = ui.pickerReturnFocus
    if (rf && rf.isConnected) rf.focus()
  }
  if (reducedMotion() || !panelEl.value) return done()
  gsap.to(panelEl.value, { y: 14, scale: 0.96, opacity: 0, duration: 0.2, ease: 'power2.in' })
  gsap.to(backdropEl.value, { opacity: 0, duration: 0.22, delay: 0.03, onComplete: done })
}

function onKeydown(e) {
  if (e.key === 'Escape') { e.preventDefault(); close(); return }
  const opts = gridEl.value ? [...gridEl.value.querySelectorAll('.ip-option')] : []
  const inGrid = opts.includes(document.activeElement)
  const moves = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 3, ArrowUp: -3 }
  if (inGrid && moves[e.key] !== undefined) {
    e.preventDefault()
    focusIndex.value = (focusIndex.value + moves[e.key] + opts.length) % opts.length
    opts[focusIndex.value].focus()
    return
  }
  if (e.key === 'Tab' && panelEl.value) {
    const f = [...panelEl.value.querySelectorAll('button:not([tabindex="-1"])')]
    if (!f.length) return
    const first = f[0], last = f[f.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }
}

onMounted(async () => {
  document.body.classList.add('modal-open')
  if (!reducedMotion()) {
    gsap.fromTo(backdropEl.value, { opacity: 0 }, { opacity: 1, duration: 0.25 })
    gsap.fromTo(panelEl.value, { y: 26, scale: 0.94, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.5, ease: 'expo.out' })
    gsap.fromTo(panelEl.value.querySelectorAll('.ip-option'), { y: 14, opacity: 0, scale: 0.9 },
      { y: 0, opacity: 1, scale: 1, duration: 0.45, stagger: { each: 0.035, grid: [3, 3], from: 'center' }, ease: 'back.out(1.7)', delay: 0.08, clearProps: 'transform,opacity' })
  }
  await nextTick()
  gridEl.value?.querySelectorAll('.ip-option')[focusIndex.value]?.focus()
})
onBeforeUnmount(() => {
  document.body.classList.remove('modal-open')
  if (panelEl.value) gsap.killTweensOf(panelEl.value)
})
</script>
