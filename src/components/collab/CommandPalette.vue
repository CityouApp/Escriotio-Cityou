<template>
  <Teleport to="body">
    <div class="modal-backdrop cmd-backdrop" @pointerdown.self="$emit('close')">
      <div ref="panelEl" class="cmd-palette" role="dialog" aria-modal="true" aria-label="Comandos rápidos" @keydown="onKey">
        <div class="cmd-input-row">
          <svg viewBox="0 0 24 24" class="cmd-search" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.5 15.5 L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          <input
            ref="inputEl"
            v-model="query"
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmd-list"
            :aria-activedescendant="items[active] ? 'cmd-' + active : undefined"
            placeholder="Ir para uma aba, filtrar, abrir tarefa…"
            aria-label="Buscar comando ou tarefa"
          />
          <kbd class="cmd-esc">Esc</kbd>
        </div>
        <ul id="cmd-list" ref="listEl" class="cmd-results" role="listbox">
          <template v-for="(item, i) in items" :key="item.id">
            <li v-if="i === 0 || items[i - 1].group !== item.group" class="cmd-group" role="presentation">{{ item.group }}</li>
            <li
              :id="'cmd-' + i"
              role="option"
              class="cmd-item"
              :class="{ active: i === active }"
              :aria-selected="i === active"
              @pointermove="active = i"
              @click="run(item)"
            >
              <span class="cmd-item-label">{{ item.label }}</span>
              <kbd v-if="item.hint" class="cmd-hint">{{ item.hint }}</kbd>
            </li>
          </template>
          <li v-if="!items.length" class="cmd-empty" role="presentation">Nada encontrado para “{{ query }}”.</li>
        </ul>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import gsap from 'gsap'
import { normalizeText } from '../../composables/useBoard'
import { reducedMotion } from '../../utils/motion'

const props = defineProps({ commands: { type: Array, default: () => [] } })
const emit = defineEmits(['close', 'run'])
const query = ref('')
const active = ref(0)
const inputEl = ref(null)
const panelEl = ref(null)
const listEl = ref(null)

const items = computed(() => {
  const q = normalizeText(query.value.trim())
  const list = q ? props.commands.filter(c => normalizeText(c.label + ' ' + (c.keywords || '')).includes(q)) : props.commands.filter(c => !c.searchOnly)
  return list.slice(0, 40)
})
watch(query, () => { active.value = 0 })
watch(active, () => nextTick(() => listEl.value?.querySelector('.cmd-item.active')?.scrollIntoView({ block: 'nearest' })))

function run(item) { emit('run', item) }
function onKey(e) {
  if (e.key === 'Escape') { e.preventDefault(); emit('close') }
  else if (e.key === 'ArrowDown') { e.preventDefault(); active.value = Math.min(items.value.length - 1, active.value + 1) }
  else if (e.key === 'ArrowUp') { e.preventDefault(); active.value = Math.max(0, active.value - 1) }
  else if (e.key === 'Enter') { e.preventDefault(); if (items.value[active.value]) run(items.value[active.value]) }
  else if (e.key === 'Tab') { e.preventDefault(); inputEl.value?.focus() }
}
onMounted(() => {
  inputEl.value?.focus()
  if (!reducedMotion() && panelEl.value) gsap.from(panelEl.value, { y: -12, scale: 0.97, autoAlpha: 0, duration: 0.32, ease: 'expo.out', clearProps: 'all' })
})
</script>
