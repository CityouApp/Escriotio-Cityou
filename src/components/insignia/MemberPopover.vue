<template>
  <Teleport to="body">
    <div
      ref="el"
      class="member-popover glass"
      role="dialog"
      :aria-label="isAssign ? 'Atribuir sócios à tarefa' : `Sócio ${name}`"
      :style="[posStyle, { '--m-color': color, '--i-color': ins?.color, '--i-glow': ins?.glow }]"
      @keydown="onKeydown"
      @pointerdown.stop
    >
      <!-- Modo atribuição: lista dos três sócios com alternância -->
      <template v-if="isAssign">
        <div class="mp-title">Quem trabalha nesta tarefa?</div>
        <div class="mp-assign-list">
          <button
            v-for="p in partners"
            :key="p.initials"
            type="button"
            class="mp-assign-row"
            :class="{ on: task?.assignees.includes(p.initials) }"
            :aria-pressed="!!task?.assignees.includes(p.initials)"
            :style="{ '--m-color': memberColor(p.initials) }"
            @click="toggle(p.initials)"
          >
            <MemberAvatar :initials="p.initials" size="sm" :interactive="false" />
            <span class="mp-row-name">{{ titleCase(p.name) }}</span>
            <span class="mp-switch" aria-hidden="true"><span></span></span>
          </button>
        </div>
      </template>

      <!-- Modo sócio: cartão de perfil -->
      <template v-else>
        <div class="mp-head">
          <span class="mp-orb"><InsigniaGlyph :id="ins.id" /></span>
          <div class="mp-id">
            <div class="mp-name">{{ name }}</div>
            <div class="mp-ins">{{ ins.name }}</div>
          </div>
        </div>
        <dl class="mp-stats">
          <div><dt>Tarefas</dt><dd>{{ stats.total }}</dd></div>
          <div><dt>Na forja</dt><dd>{{ stats.doing }}</dd></div>
          <div><dt>Concluídas</dt><dd>{{ stats.done }}</dd></div>
        </dl>
        <div class="mp-actions">
          <button v-if="task" type="button" class="mp-btn" :class="{ danger: assigned }" @click="toggle(pop.initials)">
            {{ assigned ? 'Remover desta tarefa' : 'Atribuir a esta tarefa' }}
          </button>
          <button type="button" class="mp-btn" @click="filterBy">{{ selectedMember === pop.initials ? 'Mostrar todos' : 'Ver só as tarefas' }}</button>
          <button type="button" class="mp-btn accent" @click="changeInsignia">Trocar insígnia</button>
        </div>
      </template>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import gsap from 'gsap'
import InsigniaGlyph from './InsigniaGlyph.vue'
import MemberAvatar from './MemberAvatar.vue'
import { ui, insigniaOf, memberColor, closeMemberPopover, openPicker } from '../../composables/useInsignias'
import { useBoard } from '../../composables/useBoard'
import { showToast } from '../../composables/useToast'
import { reducedMotion } from '../../utils/motion'

const { tasks, partners, selectedMember } = useBoard()
const el = ref(null)
const pop = computed(() => ui.popover)
const isAssign = computed(() => !pop.value.initials)
const task = computed(() => pop.value.taskId ? tasks.value.find(t => t.id === pop.value.taskId) : null)
const ins = computed(() => pop.value.initials ? insigniaOf(pop.value.initials) : null)
const color = computed(() => pop.value.initials ? memberColor(pop.value.initials) : '#22e4ff')
const partner = computed(() => partners.value.find(p => p.initials === pop.value.initials))
const name = computed(() => titleCase(partner.value?.name || pop.value.initials || ''))
const assigned = computed(() => !!task.value?.assignees.includes(pop.value.initials))
const stats = computed(() => {
  const mine = tasks.value.filter(t => t.assignees.includes(pop.value.initials))
  return { total: mine.length, doing: mine.filter(t => t.status === 'inprogress').length, done: mine.filter(t => t.status === 'done').length }
})

function titleCase(s) { return String(s).toLowerCase().replace(/(?<=^|[\s'])\p{L}/gu, c => c.toUpperCase()) }

// Posição: abaixo da âncora, ajustada para caber na tela
const W = 264
const posStyle = computed(() => {
  const r = pop.value.rect
  const vw = window.innerWidth, vh = window.innerHeight
  const left = Math.min(Math.max(12, r.left + r.width / 2 - W / 2), vw - W - 12)
  const below = r.bottom + 10
  const estH = isAssign.value ? 210 : 250
  const top = below + estH > vh - 8 ? Math.max(8, r.top - estH - 10) : below
  return { left: left + 'px', top: top + 'px', width: W + 'px' }
})

function toggle(ini) {
  const t = task.value
  if (!t) return
  const i = t.assignees.indexOf(ini)
  const who = titleCase(partners.value.find(p => p.initials === ini)?.name || ini)
  if (i >= 0) { t.assignees.splice(i, 1); showToast(`${who} saiu de “${t.title}”`) }
  else { t.assignees.push(ini); showToast(`${who} entrou em “${t.title}”`, { tone: 'success' }) }
}
function filterBy() {
  selectedMember.value = selectedMember.value === pop.value.initials ? null : pop.value.initials
  close()
}
function changeInsignia() {
  const ini = pop.value.initials
  const rf = pop.value.returnFocus
  closeMemberPopover()
  openPicker(ini, rf)
}
function close(restore = true) {
  const rf = pop.value?.returnFocus
  closeMemberPopover()
  if (restore && rf && rf.isConnected) rf.focus()
}
function onKeydown(e) {
  if (e.key === 'Escape') { e.preventDefault(); close() }
}
function onOutside(e) {
  if (el.value && !el.value.contains(e.target)) close(false)
}
function onViewportChange() { close(false) }

onMounted(async () => {
  if (!reducedMotion() && el.value) {
    gsap.fromTo(el.value, { autoAlpha: 0, y: -6, scale: 0.94, transformOrigin: '50% 0%' },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.32, ease: 'back.out(1.8)' })
    gsap.fromTo(el.value.querySelectorAll('.mp-stats > div, .mp-btn, .mp-assign-row'), { autoAlpha: 0, y: 6 },
      { autoAlpha: 1, y: 0, duration: 0.28, stagger: 0.03, delay: 0.06, ease: 'power2.out', clearProps: 'all' })
  }
  await nextTick()
  el.value?.querySelector('button')?.focus({ preventScroll: true })
  setTimeout(() => {
    document.addEventListener('pointerdown', onOutside)
    window.addEventListener('resize', onViewportChange)
    window.addEventListener('scroll', onViewportChange, true)
  }, 0)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onOutside)
  window.removeEventListener('resize', onViewportChange)
  window.removeEventListener('scroll', onViewportChange, true)
  if (el.value) gsap.killTweensOf(el.value)
})
</script>
