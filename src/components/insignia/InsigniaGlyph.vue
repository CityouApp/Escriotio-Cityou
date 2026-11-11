<template>
  <svg
    class="insignia-glyph"
    :class="['ig-' + insignia.id, { 'ig-static': !animated }]"
    viewBox="0 0 64 64"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
    focusable="false"
  >
    <defs>
      <linearGradient :id="u('a')" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="pal[0]" />
        <stop offset="100%" :stop-color="pal[1]" />
      </linearGradient>
      <radialGradient :id="u('r')" cx="40%" cy="35%" r="70%">
        <stop offset="0%" :stop-color="pal[2]" />
        <stop offset="55%" :stop-color="pal[0]" />
        <stop offset="100%" :stop-color="pal[1]" />
      </radialGradient>
    </defs>

    <!-- 1 · Dedo do meio estilizado -->
    <g v-if="insignia.id === 'dedo'" stroke="#2b1704" stroke-width="2" stroke-linejoin="round">
      <g class="ig-wiggle">
        <rect x="27" y="6" width="10" height="32" rx="5" :fill="g('a')" />
        <rect x="29.6" y="8.6" width="4.8" height="6" rx="2.4" fill="rgba(255,255,255,.6)" stroke="none" />
      </g>
      <rect x="17" y="26" width="10" height="15" rx="5" :fill="g('a')" />
      <rect x="37" y="26" width="10" height="15" rx="5" :fill="g('a')" />
      <rect x="46" y="29" width="8" height="13" rx="4" :fill="g('a')" />
      <rect x="16" y="33" width="38" height="20" rx="9" :fill="g('a')" />
      <path d="M17 40 C10 40 9 48 15 50 L27 50 C30 50 31 45.5 27.5 44.5 Z" :fill="g('a')" />
      <path d="M22 36 h3 M41 36 h3 M49 37.5 h2" stroke="rgba(43,23,4,.55)" stroke-linecap="round" />
      <rect x="21" y="52" width="28" height="7" rx="2.5" fill="#1d2433" stroke="#0b0f17" />
      <path d="M24 55.5 h22" stroke="#ffb547" stroke-width="1.6" stroke-linecap="round" />
    </g>

    <!-- 2 · Pedaço de coco -->
    <g v-else-if="insignia.id === 'coco'">
      <g class="ig-bob">
        <circle cx="31" cy="35" r="23" :fill="g('a')" stroke="#24120a" stroke-width="2" />
        <path d="M12 30 l4 1 M14 44 l4 -1 M48 22 l-3 3 M51 40 l-4 0 M24 55 l2 -3" stroke="#a87347" stroke-width="1.6" stroke-linecap="round" />
        <circle cx="31" cy="35" r="17" fill="#fffaf0" stroke="#e7d6b8" stroke-width="1.5" />
        <circle cx="31" cy="35" r="11" fill="#efe2c8" />
        <path d="M22 28 C25 24 30 22.5 35 23.5" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" fill="none" />
      </g>
      <g class="ig-float">
        <path d="M46 6 L58 10 L54 20 L43 15 Z" fill="#6b3f1d" stroke="#24120a" stroke-width="1.6" stroke-linejoin="round" />
        <path d="M46.5 9 L55.5 12 L53 17.5 L45 14 Z" fill="#fffaf0" />
      </g>
    </g>

    <!-- 3 · Folha da vila (espiral + ponta) -->
    <g v-else-if="insignia.id === 'folha'" class="ig-sway" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M30 6 C44 12 54 24 52 38 C50 50 40 57 28 56 C19 55 13 48 12.5 39 C12 26 20 15 30 6 Z" :fill="g('r')" fill-opacity=".22" :stroke="pal[0]" stroke-width="3.2" />
      <path d="M15 47 L5 59 L19 52.5" :stroke="pal[0]" stroke-width="3.2" />
      <path d="M33.5 40 C27.5 41 24.5 35 28.2 31.2 C32 27.4 39.2 30.2 38.2 37 C37.2 45.2 26 48.4 20.8 41.2 C15.8 34.2 21 22.8 32.4 21.4" :stroke="pal[2]" stroke-width="3.6" />
    </g>

    <!-- 4 · Mangekyō Sharingan (cata-vento de três lâminas) -->
    <g v-else-if="insignia.id === 'sharingan'">
      <circle cx="32" cy="32" r="28" :fill="g('r')" stroke="#0a0a0a" stroke-width="3" />
      <circle cx="32" cy="32" r="20.5" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.2" />
      <g class="ig-spin-slow" fill="#0a0a0a">
        <path d="M32 32 C28 20 32 9 45 6.5 C39 13 39.5 22 46.5 29.5 C41.5 33 36.5 33.4 32 32 Z" />
        <path d="M32 32 C28 20 32 9 45 6.5 C39 13 39.5 22 46.5 29.5 C41.5 33 36.5 33.4 32 32 Z" transform="rotate(120 32 32)" />
        <path d="M32 32 C28 20 32 9 45 6.5 C39 13 39.5 22 46.5 29.5 C41.5 33 36.5 33.4 32 32 Z" transform="rotate(240 32 32)" />
      </g>
      <circle cx="32" cy="32" r="5" fill="#ff2d46" stroke="#0a0a0a" stroke-width="1.6" />
      <circle cx="32" cy="32" r="1.8" fill="#0a0a0a" />
      <ellipse cx="22" cy="18" rx="5" ry="2.4" transform="rotate(-35 22 18)" fill="rgba(255,255,255,.35)" />
    </g>

    <!-- 5 · Cardinal TVCC (crista de pássaro original) -->
    <g v-else-if="insignia.id === 'cardinal'" stroke-linejoin="round">
      <g class="ig-peck">
        <path d="M13 58 C9 45 13 32 23 26 L20 7 L30 19 L33 11 L37.5 23.5 C47.5 25 54 33 53 42.5 C52 51.5 44 58 34 58 Z" :fill="g('a')" stroke="#2a0508" stroke-width="2" />
        <path d="M35.5 30 C42 27.5 50 31 52.5 37.5 L44.5 44.5 C40 44.5 34.5 40.5 34.5 35 Z" fill="#140507" />
        <path d="M49 34.5 L62 40 L49 45.5 C46.8 42 46.8 38 49 34.5 Z" fill="#ffb020" stroke="#5a2a00" stroke-width="1.4" />
        <circle cx="42.5" cy="35" r="2.6" fill="#fff" />
        <circle cx="43.2" cy="35.2" r="1.2" fill="#000" />
        <path d="M17 51 C23 46.5 30 47 34.5 52.5 M20 56 C25 52.5 30 53 33 56.5" stroke="rgba(42,5,8,.6)" stroke-width="1.6" fill="none" stroke-linecap="round" />
        <path d="M24 14 L26 22" stroke="rgba(255,255,255,.45)" stroke-width="1.6" stroke-linecap="round" />
      </g>
    </g>

    <!-- 6 · Rasengan -->
    <g v-else-if="insignia.id === 'rasengan'" fill="none" stroke-linecap="round">
      <circle cx="32" cy="32" r="27" stroke="rgba(92,200,255,.45)" stroke-width="1.4" stroke-dasharray="3 5" class="ig-spin-fast" />
      <circle cx="32" cy="32" r="21" :fill="g('r')" />
      <g class="ig-spin" stroke="#ffffff" stroke-width="2.6" opacity=".9">
        <path d="M32 12 A20 20 0 0 1 51 26" />
        <path d="M32 12 A20 20 0 0 1 51 26" transform="rotate(120 32 32)" />
        <path d="M32 12 A20 20 0 0 1 51 26" transform="rotate(240 32 32)" />
      </g>
      <g class="ig-spin-rev" stroke="#bdf3ff" stroke-width="1.8" opacity=".85">
        <path d="M32 19 A13 13 0 0 1 44 27" />
        <path d="M32 19 A13 13 0 0 1 44 27" transform="rotate(180 32 32)" />
      </g>
      <circle cx="32" cy="32" r="5.5" fill="#f0fbff" />
    </g>

    <!-- 7 · Shuriken -->
    <g v-else-if="insignia.id === 'shuriken'" class="ig-spin-slow">
      <path d="M32 3 L37.5 22 Q38.5 25.5 42 26.5 L61 32 L42 37.5 Q38.5 38.5 37.5 42 L32 61 L26.5 42 Q25.5 38.5 22 37.5 L3 32 L22 26.5 Q25.5 25.5 26.5 22 Z" :fill="g('a')" stroke="#141a23" stroke-width="2" stroke-linejoin="round" />
      <path d="M32 7 L36 22 M57 32 L42 36 M32 57 L28 42 M7 32 L22 28" stroke="rgba(255,255,255,.7)" stroke-width="1.2" stroke-linecap="round" />
      <circle cx="32" cy="32" r="5.5" fill="#0b0f16" stroke="#e6edf7" stroke-width="1.8" />
    </g>

    <!-- 8 · Nuvem rubra -->
    <g v-else-if="insignia.id === 'nuvem'" class="ig-drift" stroke-linejoin="round" stroke-linecap="round">
      <path d="M13 42 C5 42 5 30 13.5 30 C13.5 21.5 24 18 30 24 C33 14.5 47.5 14.5 49.5 25 C57.5 23 61.5 32.5 56 37.5 C61 42.5 56 51 49 48.5 C46 54.5 36 54.5 33 49 C28 54.5 18 52.5 18 46.5 C15 46.5 13 44.5 13 42 Z" :fill="g('a')" stroke="#ffffff" stroke-width="2.8" />
      <path d="M23 37 C23 32 30 31.5 30.5 36 M39 31 C40 27 46 27.5 46 31.5 M37 44 C37.5 41 42 41 42.5 43.5" stroke="#ffffff" stroke-width="2.2" fill="none" />
    </g>

    <!-- 9 · Pirâmide de stunt (cheer) -->
    <g v-else fill="none" :stroke="g('a')" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
      <g class="ig-sparkle" :fill="pal[2]" stroke="none">
        <path d="M12 9 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z" />
        <path d="M52 12 l1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2 -3 -3 -1.2 3 -1.2 Z" />
      </g>
      <g class="ig-flyer">
        <circle cx="32" cy="9" r="3.8" :fill="pal[0]" stroke="none" />
        <path d="M32 15 L32 23 M32 16 L24.5 7.5 M32 16 L39.5 7.5 M32 23 L28.5 31 M32 23 L35.5 31" />
      </g>
      <circle cx="19" cy="37" r="3.8" :fill="pal[0]" stroke="none" />
      <circle cx="45" cy="37" r="3.8" :fill="pal[0]" stroke="none" />
      <path d="M19 43 L19 51 M15 59 L19 51 L23 59 M19 45 L28.5 32 M45 43 L45 51 M41 59 L45 51 L49 59 M45 45 L35.5 32" />
      <path d="M8 61 H56" stroke="rgba(255,255,255,.25)" stroke-width="1.6" />
    </g>
  </svg>
</template>

<script setup>
import { computed } from 'vue'
import { INSIGNIA_BY_ID } from '../../data/insignias'

const props = defineProps({
  id: { type: String, required: true },
  animated: { type: Boolean, default: true },
  label: { type: String, default: '' }
})

let seq = 0
const uidBase = 'ig' + Math.random().toString(36).slice(2, 7) + (++seq)
const u = (k) => `${uidBase}-${k}`
const g = (k) => `url(#${u(k)})`

const insignia = computed(() => INSIGNIA_BY_ID[props.id] || INSIGNIA_BY_ID.shuriken)

// [cor principal, sombra, brilho]
const PALETTES = {
  dedo: ['#ffd38a', '#e58a0c', '#fff1cf'],
  coco: ['#8a5530', '#3f2210', '#b07a4c'],
  folha: ['#4ade80', '#14532d', '#d9ffe6'],
  sharingan: ['#e8122b', '#6d0010', '#ff6d7d'],
  cardinal: ['#ff5560', '#a50e1a', '#ff9aa0'],
  rasengan: ['#5cc8ff', '#0b3f7a', '#f2fcff'],
  shuriken: ['#eef3fa', '#566174', '#ffffff'],
  nuvem: ['#ff4747', '#a3101c', '#ff9999'],
  piramide: ['#ff5fb0', '#ffb547', '#ffe08a']
}
const pal = computed(() => PALETTES[insignia.value.id] || PALETTES.shuriken)
</script>
