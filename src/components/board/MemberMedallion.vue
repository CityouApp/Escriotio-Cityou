<template>
  <button
    class="medallion-card"
    :class="{ 'selected-filter': selected, 'is-online': partner.online }"
    :aria-pressed="selected"
    :aria-label="`${partner.name}${partner.isYou ? ' (você)' : ''} — ${partner.statusText}. Clique para filtrar tarefas.`"
    @click="$emit('select')"
  >
    <span class="medallion-visual" aria-hidden="true">
      <!-- Aura de Chakra Azul Animada (Sócio Online) -->
      <span v-if="partner.online" class="combat-aura"></span>
      <span v-if="partner.online" class="combat-plasma-ring"></span>
      <span v-if="partner.online" class="combat-vortex-ring"></span>

      <!-- Medalhão Metálico em SVG Fiel à Imagem de Referência -->
      <svg class="medallion-svg" viewBox="0 0 150 150">
        <defs>
          <radialGradient :id="'chakraCore-' + partner.id" cx="50%" cy="50%" r="52%">
            <stop offset="0%" stop-color="#a5f3fc" stop-opacity="0.55"/>
            <stop offset="55%" stop-color="#0284c7" stop-opacity="0.85"/>
            <stop offset="100%" stop-color="#061826" stop-opacity="1"/>
          </radialGradient>
          <linearGradient :id="'bronzeRim-' + partner.id" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#b89972"/>
            <stop offset="50%" stop-color="#574633"/>
            <stop offset="100%" stop-color="#221b14"/>
          </linearGradient>
          <linearGradient :id="'ironRim-' + partner.id" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#7c8594"/>
            <stop offset="50%" stop-color="#2d333d"/>
            <stop offset="100%" stop-color="#12151b"/>
          </linearGradient>
        </defs>

        <!-- Base octogonal chanfrada -->
        <polygon
          points="44,6 106,6 144,44 144,106 106,144 44,144 6,106 6,44"
          :fill="partner.online ? '#0b2b3c' : '#1b2028'"
          :stroke="partner.online ? '#22e4ff' : '#404959'"
          stroke-width="2.2"
        />

        <!-- Anel metálico principal -->
        <circle
          cx="75" cy="75" r="61"
          :fill="partner.online ? 'url(#chakraCore-' + partner.id + ')' : '#1c2129'"
          :stroke="partner.online ? '#00f7ff' : (partner.emblem === 'shield' ? 'url(#bronzeRim-' + partner.id + ')' : 'url(#ironRim-' + partner.id + ')')"
          stroke-width="8"
        />
        <!-- Anel tracejado interno -->
        <circle
          cx="75" cy="75" r="50"
          fill="none"
          :stroke="partner.online ? '#7dd3fc' : '#3b4454'"
          stroke-width="1.6"
          stroke-dasharray="7 4"
        />

        <!-- GLIFO 1 (Online / LF): Selo de Mão Chakra / Energia Azul -->
        <g v-if="partner.online" stroke="#e0faff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M52 92 C44 66, 62 42, 88 48 C106 52, 106 82, 88 96" stroke="#22e4ff" stroke-width="3" opacity="0.75"/>
          <path d="M71 96 V44 C71 39 78 39 78 44 V72" fill="#0891b2"/>
          <path d="M78 64 C78 60 85 60 85 64 V76" fill="#0891b2"/>
          <path d="M85 69 C85 65 91 65 91 69 V83 C91 93 81 100 70 100 C61 100 57 91 57 82 V72 C57 67 65 67 65 74" fill="#0e7490"/>
          <circle cx="75" cy="33" r="3.5" fill="#ffffff" stroke="none"/>
        </g>

        <!-- GLIFO 2 (Offline / LC): Medalhão de Bronze com Espiral Shinobi -->
        <g v-else-if="partner.emblem === 'shield'">
          <circle cx="75" cy="71" r="25" fill="#251f19" stroke="#856b4d" stroke-width="3"/>
          <path d="M75 54 C87 54 91 67 83 76 C75 84 61 78 63 67 C65 60 74 61 76 68" fill="none" stroke="#b09372" stroke-width="3.5" stroke-linecap="round"/>
          <polygon points="75,96 67,106 83,106" fill="#856b4d"/>
        </g>

        <!-- GLIFO 3 (Offline / AX): Medalhão de Ferro Negro com Hexagrama Forjado -->
        <g v-else stroke="#7c8594" stroke-width="3" fill="none" stroke-linejoin="round">
          <polygon points="75,44 101,88 49,88" fill="rgba(255,255,255,0.04)"/>
          <polygon points="75,98 101,54 49,54" fill="rgba(0,0,0,0.3)"/>
          <circle cx="75" cy="71" r="8.5" fill="#1e232b" stroke="#9ca3af" stroke-width="2.2"/>
        </g>

        <!-- Mini ícone de controle nos medalhões offline -->
        <g v-if="!partner.online" transform="translate(61, 113)">
          <circle cx="14" cy="14" r="13" fill="#181c23" stroke="#566070" stroke-width="2"/>
          <rect x="7" y="10" width="14" height="8" rx="4" fill="none" stroke="#9ca3af" stroke-width="1.5"/>
        </g>
      </svg>

      <!-- Insígnia BRASIL nos sócios offline -->
      <span v-if="!partner.online" class="medallion-br-badge">
        <svg viewBox="0 0 20 13">
          <rect width="20" height="13" rx="1.5" fill="#059669"/>
          <polygon points="10,2 17,6.5 10,11 3,6.5" fill="#fbbf24"/>
          <circle cx="10" cy="6.5" r="2.5" fill="#1d4ed8"/>
        </svg>
        <span>BRASIL</span>
      </span>
    </span>

    <span class="medallion-info">
      <span class="medallion-name">{{ partner.name }} <span v-if="partner.isYou" class="you-tag">(você)</span></span>
      <span class="medallion-status" :class="{ online: partner.online }">{{ partner.statusText }}</span>
    </span>
  </button>
</template>

<script setup>
defineProps({
  partner: { type: Object, required: true },
  selected: { type: Boolean, default: false }
})
defineEmits(['select'])
</script>
