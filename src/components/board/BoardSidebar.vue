<template>
  <aside class="sidebar" aria-label="Navegação do estúdio">
    <div class="studio-selector">
      <span class="studio-mark" aria-hidden="true"><InsigniaGlyph id="folha" :animated="false" /></span>
      <span class="studio-name">Escritório Cityou</span>
    </div>

    <nav class="nav-list" aria-label="Seções">
      <button class="nav-item active" aria-current="page">
        <span class="nav-label">
          <svg viewBox="0 0 24 24" class="nav-icon" aria-hidden="true"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>
          Quadro
        </span>
        <span class="nav-badge">{{ totalCount }}</span>
      </button>
      <button class="nav-item" disabled title="Disponível em breve">
        <span class="nav-label">
          <svg viewBox="0 0 24 24" class="nav-icon" aria-hidden="true"><circle cx="9" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5M16 8.5a2.8 2.8 0 1 0-.01 0M17.5 14c2 .5 3.2 2 3.6 4.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          Equipe &amp; locais
        </span>
        <span class="nav-badge green">{{ onlineCount }}</span>
      </button>
      <button class="nav-item" disabled title="Disponível em breve">
        <span class="nav-label">
          <svg viewBox="0 0 24 24" class="nav-icon" aria-hidden="true"><path d="M3 17l5-6 4 3 6-8 3 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Atividade
        </span>
      </button>
    </nav>

    <div class="sidebar-section-label">Visões salvas</div>

    <!-- Placa Metálica 1: Visões Salvas + Entalhe de Runas (igual à referência) -->
    <div class="metal-plate plate-views-runes">
      <div class="saved-views-list" role="group" aria-label="Visões salvas">
        <button class="saved-view-btn" :class="{ active: savedView === 'all' }" :aria-pressed="savedView === 'all'" @click="$emit('update:saved-view', 'all')">
          <svg class="sv-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 4h14M3 10h14M3 16h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg> Todas
        </button>
        <button class="saved-view-btn" :class="{ active: savedView === 'mine' }" :aria-pressed="savedView === 'mine'" @click="$emit('update:saved-view', 'mine')">
          <svg class="sv-icon" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="7" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 17c.8-3.2 3.2-5 6-5s5.2 1.8 6 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg> Minhas tarefas
        </button>
        <button class="saved-view-btn" :class="{ active: savedView === 'urgent' }" :aria-pressed="savedView === 'urgent'" @click="$emit('update:saved-view', 'urgent')">
          <svg class="sv-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M11 2L4 11.5h5L8 18l7-9.5h-5z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg> Urgentes
        </button>
      </div>

      </div>

    <div class="sidebar-section-label">Time e insígnias</div>
    <div class="metal-plate team-plate" role="list" aria-label="Insígnias do time">
      <button
        v-for="p in partners"
        :key="p.initials"
        type="button"
        role="listitem"
        class="team-row"
        :style="{ '--m-color': memberColor(p.initials) }"
        :aria-label="`Trocar a insígnia de ${tc(p.name)} (atual: ${insigniaOf(p.initials).name})`"
        @click="openPicker(p.initials, $event.currentTarget)"
      >
        <MemberAvatar :initials="p.initials" size="sm" :interactive="false" :show-initials="false" />
        <span class="team-text">
          <span class="team-name">{{ tc(p.name).split(' ')[0] === 'Alexandre' ? 'Xande' : tc(p.name) }}</span>
          <span class="team-ins">{{ insigniaOf(p.initials).name }}</span>
        </span>
        <svg class="team-edit" viewBox="0 0 20 20" aria-hidden="true"><path d="M13.6 3.6l2.8 2.8L7 15.8l-3.6.8.8-3.6z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" /></svg>
      </button>
    </div>

    <!-- Placa Metálica 2: Emblemas Compactos TVCC, Cheerathletics e Brasil -->
    <div class="sidebar-plates" aria-hidden="true">
      <div class="metal-plate crests-unified-plate">
        <svg class="crest-svg crest-tvcc" viewBox="0 0 120 62">
          <defs>
            <linearGradient id="sbMetalGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#3f4a5a"/>
              <stop offset="50%" stop-color="#1f2530"/>
              <stop offset="100%" stop-color="#12161e"/>
            </linearGradient>
          </defs>
          <path d="M60 3 L100 15 C100 38 83 51 60 59 C37 51 20 38 20 15 Z" fill="url(#sbMetalGrad)" stroke="#59687d" stroke-width="2"/>
          <path d="M60 8 L94 18 C94 35 79 46 60 53 C41 46 26 35 26 18 Z" fill="none" stroke="#0d1117" stroke-width="1.8"/>
          <text x="60" y="37" text-anchor="middle" fill="#9fb0c7" font-family="Cinzel, serif" font-weight="800" font-size="17" letter-spacing="1">TVCC</text>
        </svg>

        <svg class="crest-svg crest-cheer" viewBox="0 0 155 56">
          <polygon points="77,4 97,18 140,13 121,35 130,51 77,43 24,51 33,35 14,13 57,18" fill="url(#sbMetalGrad)" stroke="#59687d" stroke-width="1.8"/>
          <rect x="16" y="23" width="123" height="15" rx="3" fill="#151a22" stroke="#4c5a6d" stroke-width="1.2"/>
          <text x="77" y="34" text-anchor="middle" fill="#a3b4ca" font-family="Rajdhani, sans-serif" font-weight="700" font-size="11" letter-spacing="1.2">CHEERATHLETICS</text>
        </svg>

        <svg class="crest-svg crest-brasil" viewBox="0 0 115 68">
          <path d="M22 5 H93 L98 41 L57 65 L17 41 Z" fill="url(#sbMetalGrad)" stroke="#59687d" stroke-width="2"/>
          <polygon points="57,13 84,29 57,45 30,29" fill="#131922" stroke="#4d5b6e" stroke-width="1.5"/>
          <circle cx="57" cy="29" r="8" fill="#232c3a" stroke="#64748b" stroke-width="1.2"/>
          <rect x="27" y="48" width="60" height="11" rx="2" fill="#141922" stroke="#495668" stroke-width="1"/>
          <text x="57" y="56.5" text-anchor="middle" fill="#9fb0c7" font-family="Rajdhani, sans-serif" font-weight="700" font-size="9" letter-spacing="1.5">BRASIL</text>
        </svg>
      </div>
    </div>

    <!-- Anel "% FORJADO" sempre visível no rodapé da barra lateral -->
    <div class="forge-ring-widget" role="img" :aria-label="`${forgedPercentage}% das tarefas forjadas`">
      <div class="forge-ring-container">
        <div class="forge-ring-aura" aria-hidden="true"></div>
        <div class="forge-ring-sparks" aria-hidden="true"></div>
        <svg class="forge-ring-svg" viewBox="0 0 120 120" aria-hidden="true">
          <defs>
            <linearGradient id="forgeRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#e0faff"/>
              <stop offset="45%" stop-color="#22e4ff"/>
              <stop offset="100%" stop-color="#ff3d81"/>
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="48" fill="none" stroke="#182232" stroke-width="9"/>
          <circle class="forge-ring-progress" cx="60" cy="60" r="48" fill="none"
            stroke="url(#forgeRingGrad)" stroke-width="9" stroke-linecap="round"
            :stroke-dasharray="circumference" :stroke-dashoffset="dashOffset" transform="rotate(-90 60 60)"/>
        </svg>
        <div class="forge-ring-text">
          <span class="forge-percent">{{ displayPercent }}%</span>
          <span class="forge-label">forjado</span>
        </div>
      </div>
    </div>

    <button class="sidebar-reset" @click="$emit('reset')">Restaurar exemplo</button>
  </aside>
</template>

<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { reducedMotion } from '../../utils/motion'
import InsigniaGlyph from '../insignia/InsigniaGlyph.vue'
import MemberAvatar from '../insignia/MemberAvatar.vue'
import { partners } from '../../composables/useBoard'
import { insigniaOf, memberColor, openPicker } from '../../composables/useInsignias'

const tc = (s) => s.toLowerCase().replace(/(?<=^|[\s'])\p{L}/gu, c => c.toUpperCase())

const props = defineProps({
  totalCount: { type: Number, default: 0 },
  onlineCount: { type: Number, default: 1 },
  savedView: { type: String, default: 'all' },
  forgedPercentage: { type: Number, default: 0 }
})
defineEmits(['update:saved-view', 'reset'])

const circumference = 2 * Math.PI * 48
const dashOffset = computed(() => circumference - (props.forgedPercentage / 100) * circumference)

const displayPercent = ref(props.forgedPercentage)
const counter = { val: props.forgedPercentage }
let tween = null
watch(() => props.forgedPercentage, (target) => {
  if (reducedMotion()) { displayPercent.value = target; return }
  if (tween) tween.kill()
  counter.val = displayPercent.value
  tween = gsap.to(counter, {
    val: target, duration: 0.8, ease: 'power2.out',
    onUpdate: () => { displayPercent.value = Math.round(counter.val) }
  })
})
onBeforeUnmount(() => { if (tween) tween.kill() })
</script>
