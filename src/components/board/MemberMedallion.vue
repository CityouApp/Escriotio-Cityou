<template>
  <div class="medallion-wrap" :style="{ '--m-color': color, '--i-color': ins.color, '--i-glow': ins.glow }">
    <button
      class="medallion-card"
      :class="{ 'selected-filter': selected, 'is-online': partner.online }"
      :aria-pressed="selected"
      :aria-label="`${displayName}${partner.isYou ? ' (você)' : ''}, insígnia ${ins.name}. ${partner.statusText}. Clique para filtrar as tarefas.`"
      @click="$emit('select')"
    >
      <span class="medallion-visual" aria-hidden="true">
        <span class="medallion-halo"></span>
        <span v-if="partner.online" class="combat-plasma-ring"></span>
        <svg class="medallion-svg" viewBox="0 0 150 150">
          <defs>
            <radialGradient :id="'mCore-' + partner.id" cx="50%" cy="42%" r="60%">
              <stop offset="0%" :stop-color="ins.color" stop-opacity=".38" />
              <stop offset="60%" stop-color="#0c1422" stop-opacity="1" />
              <stop offset="100%" stop-color="#05080f" stop-opacity="1" />
            </radialGradient>
            <linearGradient :id="'mRim-' + partner.id" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#d9e2ef" />
              <stop offset="45%" stop-color="#4a5466" />
              <stop offset="100%" stop-color="#151a23" />
            </linearGradient>
          </defs>
          <polygon points="44,6 106,6 144,44 144,106 106,144 44,144 6,106 6,44" fill="#0d131e" :stroke="color" stroke-opacity=".75" stroke-width="2" />
          <circle cx="75" cy="75" r="61" :fill="'url(#mCore-' + partner.id + ')'" :stroke="'url(#mRim-' + partner.id + ')'" stroke-width="7" />
          <circle class="medallion-dash" cx="75" cy="75" r="51" fill="none" :stroke="color" stroke-opacity=".6" stroke-width="1.4" stroke-dasharray="6 5" />
        </svg>
        <span class="medallion-glyph"><InsigniaGlyph :id="ins.id" /></span>
      </span>
      <span class="medallion-info">
        <span class="medallion-name">{{ displayName }} <span v-if="partner.isYou" class="you-tag">(você)</span></span>
        <span class="medallion-status" :class="{ online: partner.online }">{{ partner.statusText }}</span>
      </span>
    </button>
    <button
      type="button"
      class="medallion-edit"
      :aria-label="`Trocar a insígnia de ${displayName} (atual: ${ins.name})`"
      title="Trocar insígnia"
      @click="openPicker(partner.initials, $event.currentTarget)"
    >
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M13.6 3.6l2.8 2.8L7 15.8l-3.6.8.8-3.6z M12 5.2l2.8 2.8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" /></svg>
      <span class="medallion-edit-label">Insígnia</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import InsigniaGlyph from '../insignia/InsigniaGlyph.vue'
import { insigniaOf, memberColor, openPicker } from '../../composables/useInsignias'

const props = defineProps({
  partner: { type: Object, required: true },
  selected: { type: Boolean, default: false }
})
defineEmits(['select'])
const ins = computed(() => insigniaOf(props.partner.initials))
const color = computed(() => memberColor(props.partner.initials))
const displayName = computed(() => props.partner.name.toLowerCase().replace(/(?<=^|[\s'])\p{L}/gu, c => c.toUpperCase()))
</script>
