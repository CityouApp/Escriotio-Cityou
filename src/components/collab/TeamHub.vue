<template>
  <section id="tab-panel-team" class="team-hub" role="tabpanel" aria-label="Equipe e locais">
    <!-- Régua de fusos -->
    <div class="hub-card tz-card">
      <header class="hub-card-head">
        <div>
          <h2 class="hub-title">Fusos e janela em comum</h2>
          <p class="hub-sub">Relógios calculados no seu aparelho, sem internet. Ajuste a cidade e o fuso de cada sócio abaixo.</p>
        </div>
        <span class="overlap-pill" :class="{ none: !overlap.length }">
          <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 4.5V8l2.5 1.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          {{ overlapLabel }}
        </span>
      </header>

      <div class="tz-ruler" :style="{ '--now-pos': nowPos.toFixed(2) }">
        <div class="tz-ruler-scale" aria-hidden="true">
          <span v-for="h in [0, 3, 6, 9, 12, 15, 18, 21]" :key="h" :style="{ left: (h / 24 * 100) + '%' }">{{ String(h).padStart(2, '0') }}h</span>
        </div>
        <div v-for="p in partners" :key="p.initials" class="tz-row" :style="{ '--m-color': memberColor(p.initials) }">
          <div class="tz-who">
            <MemberAvatar :initials="p.initials" size="sm" :interactive="false" :show-initials="false" />
            <div class="tz-who-text">
              <strong>{{ short(p) }}</strong>
              <span>{{ team[p.initials].city || cityFromTz(team[p.initials].timezone) }}</span>
            </div>
            <span class="tz-clock" :aria-label="`Agora são ${formatTimeInZone(team[p.initials].timezone, now)} para ${short(p)}`">{{ formatTimeInZone(team[p.initials].timezone, now) }}</span>
          </div>
          <div class="tz-track" role="img" :aria-label="`Expediente de ${short(p)}: ${team[p.initials].workStart}h às ${team[p.initials].workEnd}h no horário local`">
            <span
              v-for="u in 24"
              :key="u"
              class="tz-cell"
              :class="{ work: cellWork(p.initials, u - 1), overlap: overlap.includes(cellUtc(u - 1)) }"
            ></span>
          </div>
        </div>
        <span class="tz-now-line" aria-hidden="true"><span>agora</span></span>
      </div>
      <p class="tz-legend">
        <span><i class="lg work"></i>Expediente</span>
        <span><i class="lg overlap"></i>Todos disponíveis</span>
        <span class="muted">Régua no seu horário ({{ cityFromTz(viewerTz) }})</span>
      </p>
    </div>

    <!-- Cartões dos sócios -->
    <div class="team-grid">
      <article
        v-for="p in partners"
        :key="p.initials"
        class="hub-card member-card"
        :style="{ '--m-color': memberColor(p.initials) }"
      >
        <header class="member-head">
          <MemberAvatar :initials="p.initials" size="md" :task-id="null" />
          <div class="member-id">
            <h3>{{ short(p) }} <span class="full-name">{{ fullNameOf(p.initials) }}</span> <span v-if="p.isYou" class="you-tag">(você)</span></h3>
            <span class="member-local">{{ formatTimeInZone(team[p.initials].timezone, now) }} · {{ team[p.initials].city || cityFromTz(team[p.initials].timezone) }}</span>
          </div>
          <span class="member-state" :class="stateOf(p.initials).cls">{{ stateOf(p.initials).label }}</span>
        </header>

        <details class="member-settings">
          <summary>Cidade, fuso e expediente</summary>
          <div class="ms-grid">
            <label class="hub-field">
              <span>Cidade</span>
              <input type="text" :value="team[p.initials].city" maxlength="60" placeholder="Ex.: Rio de Janeiro" @change="updateMemberSettings(p.initials, { city: $event.target.value })" />
            </label>
            <label class="hub-field">
              <span>Fuso horário</span>
              <select :value="team[p.initials].timezone" @change="updateMemberSettings(p.initials, { timezone: $event.target.value })">
                <option v-for="tz in tzOptions(team[p.initials].timezone)" :key="tz.id" :value="tz.id">{{ tz.label }} ({{ offsetLabel(tz.id) }})</option>
              </select>
            </label>
            <label class="hub-field half">
              <span>Começa</span>
              <select :value="team[p.initials].workStart" @change="updateMemberSettings(p.initials, { workStart: $event.target.value })">
                <option v-for="h in 24" :key="h" :value="h - 1">{{ String(h - 1).padStart(2, '0') }}:00</option>
              </select>
            </label>
            <label class="hub-field half">
              <span>Termina</span>
              <select :value="team[p.initials].workEnd" @change="updateMemberSettings(p.initials, { workEnd: $event.target.value })">
                <option v-for="h in 24" :key="h" :value="h">{{ String(h).padStart(2, '0') }}:00</option>
              </select>
            </label>
          </div>
        </details>

        <div class="checkin-block">
          <div class="checkin-head">
            <span class="hub-label">Check-in do dia</span>
            <span v-if="team[p.initials].checkin" class="checkin-when" :class="{ today: isToday(team[p.initials].checkin.updatedAt) }">
              {{ isToday(team[p.initials].checkin.updatedAt) ? 'Hoje, ' : '' }}{{ relativeTime(team[p.initials].checkin.updatedAt, now.getTime()) }}
            </span>
            <span v-else class="checkin-when pending">Pendente</span>
          </div>

          <form v-if="editing[p.initials]" class="checkin-form" @submit.prevent="submitCheckin(p.initials)">
            <label class="hub-field">
              <span>Foco de hoje</span>
              <input v-model="drafts[p.initials].focus" type="text" maxlength="160" placeholder="No que você vai trabalhar?" :data-checkin-focus="p.initials" />
            </label>
            <label class="hub-field">
              <span>Cidade</span>
              <input v-model="drafts[p.initials].city" type="text" maxlength="60" placeholder="Onde você está hoje?" />
            </label>
            <label class="hub-field">
              <span>Bloqueios</span>
              <input v-model="drafts[p.initials].blockers" type="text" maxlength="160" placeholder="Precisa de algo de alguém?" />
            </label>
            <div class="hub-actions">
              <button v-if="team[p.initials].checkin" type="button" class="hub-btn ghost" @click="editing[p.initials] = false">Cancelar</button>
              <button type="submit" class="hub-btn primary">Salvar check-in</button>
            </div>
          </form>

          <div v-else class="checkin-view">
            <p class="checkin-focus">{{ team[p.initials].checkin.focus || 'Sem foco definido' }}</p>
            <p class="checkin-blockers" :class="{ clear: !team[p.initials].checkin.blockers }">
              <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><path v-if="team[p.initials].checkin.blockers" d="M5 11l6-6" stroke="currentColor" stroke-width="1.5"/><path v-else d="M5 8.3l2 2 4-4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
              {{ team[p.initials].checkin.blockers || 'Sem bloqueios' }}
            </p>
            <button type="button" class="hub-btn ghost sm" @click="startEdit(p.initials)">Atualizar check-in</button>
          </div>
        </div>

        <footer class="member-batons">
          <span class="hub-label">Bastões com {{ p.isYou ? 'você' : short(p) }}</span>
          <div v-if="batonsOf(p.initials).length" class="baton-chips">
            <button v-for="t in batonsOf(p.initials)" :key="t.id" type="button" class="baton-chip" @click="$emit('open-task', t)">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9.5 1.5L3.5 9h4l-1 5.5 6-7.5h-4z" fill="currentColor" /></svg>
              {{ t.title }}
            </button>
          </div>
          <p v-else class="hub-empty-line">Nenhum bastão pendente.</p>
          <button type="button" class="hub-link" @click="$emit('filter-member', p.initials)">Ver as {{ countOf(p.initials) }} tarefas no quadro →</button>
        </footer>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, nextTick, onBeforeUnmount } from 'vue'
import MemberAvatar from '../insignia/MemberAvatar.vue'
import { useBoard, initialsName, fullNameOf, TIMEZONE_OPTIONS, formatTimeInZone, tzOffsetHours, isWorking, overlapUtcHours, CURRENT_USER } from '../../composables/useBoard'
import { memberColor } from '../../composables/useInsignias'
import { useNow, relativeTime, isToday } from '../../composables/useNow'
import { showToast } from '../../composables/useToast'

defineEmits(['open-task', 'filter-member'])

const { collab, partners, tasks, updateMemberSettings, saveCheckin } = useBoard()
const { now, release } = useNow()
onBeforeUnmount(release)
const team = collab.team

const short = (p) => initialsName(p.initials)
const viewerTz = computed(() => team[CURRENT_USER]?.timezone || 'America/Sao_Paulo')
const viewerOffset = computed(() => tzOffsetHours(viewerTz.value, now.value))

// coluna i da régua = hora i no fuso de quem está vendo
function cellUtc(i) { return ((Math.floor(i - viewerOffset.value) % 24) + 24) % 24 }
function cellWork(ini, i) {
  const m = team[ini]
  return isWorking(m, cellUtc(i) + tzOffsetHours(m.timezone, now.value))
}
const overlap = computed(() => overlapUtcHours(team, now.value))
const nowPos = computed(() => {
  const d = now.value
  const utc = d.getUTCHours() + d.getUTCMinutes() / 60
  return ((((utc + viewerOffset.value) % 24) + 24) % 24) / 24 * 100
})
const overlapLabel = computed(() => {
  const o = overlap.value
  if (!o.length) return 'Sem horário em comum: use o bastão'
  const local = o.map(u => (((u + viewerOffset.value) % 24) + 24) % 24).sort((a, b) => a - b)
  // agrupa em faixas contínuas
  const ranges = []
  for (const h of local) {
    const last = ranges[ranges.length - 1]
    if (last && Math.round(h - last[1]) === 1) last[1] = h
    else ranges.push([h, h])
  }
  const fmt = (h) => String(Math.floor(h)).padStart(2, '0') + ':' + (h % 1 ? String(Math.round((h % 1) * 60)).padStart(2, '0') : '00')
  return `${o.length} h em comum · ` + ranges.map(([a, b]) => `${fmt(a)}–${fmt(b + 1)}`).join(', ')
})

function cityFromTz(tz) {
  const known = TIMEZONE_OPTIONS.find(o => o.id === tz)
  if (known) return known.label.split(' / ')[0]
  return tz.split('/').pop().replace(/_/g, ' ')
}
function offsetLabel(tz) {
  const o = tzOffsetHours(tz, now.value)
  const sign = o >= 0 ? '+' : '−'
  const a = Math.abs(o)
  return `UTC${sign}${Math.floor(a)}${a % 1 ? ':' + String(Math.round((a % 1) * 60)).padStart(2, '0') : ''}`
}
function tzOptions(current) {
  return TIMEZONE_OPTIONS.some(o => o.id === current) ? TIMEZONE_OPTIONS : [{ id: current, label: current }, ...TIMEZONE_OPTIONS]
}
function stateOf(ini) {
  const m = team[ini]
  const local = tzOffsetHours(m.timezone, now.value) + now.value.getUTCHours() + now.value.getUTCMinutes() / 60
  if (isWorking(m, local)) return { label: 'No expediente', cls: 'on' }
  return { label: 'Fora do expediente', cls: 'off' }
}

const editing = reactive({})
const drafts = reactive({})
for (const p of partners.value) {
  const c = team[p.initials].checkin
  editing[p.initials] = !c
  drafts[p.initials] = { focus: c?.focus || '', city: c?.city || team[p.initials].city || '', blockers: c?.blockers || '' }
}
function startEdit(ini) {
  const c = team[ini].checkin
  drafts[ini] = { focus: c?.focus || '', city: c?.city || team[ini].city || '', blockers: c?.blockers || '' }
  editing[ini] = true
  nextTick(() => document.querySelector(`[data-checkin-focus="${ini}"]`)?.focus())
}
function submitCheckin(ini) {
  const d = drafts[ini]
  if (!d.focus.trim() && !d.blockers.trim() && !d.city.trim()) {
    showToast('Escreva pelo menos o foco de hoje')
    return
  }
  saveCheckin(ini, d)
  editing[ini] = false
  showToast(`Check-in de ${initialsName(ini)} salvo`, { tone: 'success' })
}

function batonsOf(ini) { return tasks.value.filter(t => t.status !== 'done' && t.handoff?.holder === ini) }
function countOf(ini) { return tasks.value.filter(t => t.assignees.includes(ini) || t.handoff?.holder === ini).length }
</script>
