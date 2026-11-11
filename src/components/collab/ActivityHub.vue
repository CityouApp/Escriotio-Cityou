<template>
  <section id="tab-panel-activity" class="activity-hub" role="tabpanel" aria-label="Atividade e decisões">
    <div class="hub-card decisions-card">
      <header class="hub-card-head">
        <div>
          <h2 class="hub-title">Registro de decisões</h2>
          <p class="hub-sub">O que foi decidido fica aqui, com autor e data, para quem estava em outro fuso não perder o fio.</p>
        </div>
        <span class="count-pill">{{ collab.decisions.length }}</span>
      </header>

      <form class="decision-form" @submit.prevent="submit">
        <label class="hub-field">
          <span>Decisão</span>
          <input ref="titleEl" v-model="draft.title" type="text" maxlength="140" placeholder="Ex.: Lançar a versão beta em dezembro" />
        </label>
        <label class="hub-field">
          <span>Por quê</span>
          <input v-model="draft.context" type="text" maxlength="280" placeholder="Contexto para os outros sócios (opcional)" />
        </label>
        <div class="decision-form-row">
          <label class="hub-field">
            <span>Quem decidiu</span>
            <select v-model="draft.author">
              <option v-for="p in partners" :key="p.initials" :value="p.initials">{{ initialsName(p.initials) }}</option>
            </select>
          </label>
          <label class="hub-field grow">
            <span>Tarefa ligada</span>
            <select v-model="draft.taskId">
              <option value="">Nenhuma</option>
              <option v-for="t in tasks" :key="t.id" :value="t.id">{{ t.title }}</option>
            </select>
          </label>
          <button type="submit" class="hub-btn primary" :disabled="!draft.title.trim()">Registrar decisão</button>
        </div>
      </form>

      <TransitionGroup v-if="collab.decisions.length" tag="ol" name="hub-list" class="decision-list">
        <li v-for="d in collab.decisions" :key="d.id" class="decision-item" :style="{ '--m-color': memberColor(d.author) }">
          <MemberAvatar :initials="d.author" size="sm" :interactive="false" :show-initials="false" />
          <div class="decision-body">
            <strong class="decision-title">{{ d.title }}</strong>
            <p v-if="d.context" class="decision-context">{{ d.context }}</p>
            <span class="decision-meta">
              {{ initialsName(d.author) }} · {{ dateLabel(d.createdAt) }}
              <button v-if="d.taskId && taskById(d.taskId)" type="button" class="hub-link inline" @click="$emit('open-task', taskById(d.taskId))">↗ {{ taskById(d.taskId).title }}</button>
            </span>
          </div>
          <button type="button" class="btn-card-icon danger" :aria-label="`Remover a decisão '${d.title}'`" @click="remove(d)">×</button>
        </li>
      </TransitionGroup>
      <div v-else class="hub-empty">
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 8h16l8 8v24H14z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M19 22h14M19 28h14M19 34h9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <p>Nenhuma decisão registrada ainda. A primeira fica guardada aqui.</p>
      </div>
    </div>

    <div class="hub-card feed-card">
      <header class="hub-card-head">
        <div>
          <h2 class="hub-title">Atividade</h2>
          <p class="hub-sub">Tudo o que mudou no quadro. Clique para abrir a tarefa.</p>
        </div>
        <div class="feed-filters" role="group" aria-label="Filtrar atividade">
          <button v-for="f in feedFilters" :key="f.id" type="button" class="feed-filter" :class="{ active: feedFilter === f.id }" :aria-pressed="feedFilter === f.id" @click="feedFilter = f.id">{{ f.label }}</button>
        </div>
      </header>

      <TransitionGroup v-if="feed.length" tag="ol" name="hub-list" class="feed-list">
        <li v-for="a in feed" :key="a.id" class="feed-item" :class="'type-' + a.type">
          <component
            :is="a.taskId && taskById(a.taskId) ? 'button' : 'div'"
            :type="a.taskId && taskById(a.taskId) ? 'button' : undefined"
            class="feed-row"
            @click="a.taskId && taskById(a.taskId) && $emit('open-task', taskById(a.taskId))"
          >
            <span class="feed-dot" :style="{ '--m-color': memberColor(a.actor) }" aria-hidden="true">
              <svg v-if="a.type === 'handoff'" viewBox="0 0 16 16"><path d="M9.5 1.5L3.5 9h4l-1 5.5 6-7.5h-4z" fill="currentColor" /></svg>
              <svg v-else-if="a.type === 'done'" viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              <svg v-else-if="a.type === 'decision'" viewBox="0 0 16 16"><path d="M4 2.5h6l3 3v8H4z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
              <svg v-else-if="a.type === 'checkin'" viewBox="0 0 16 16"><circle cx="8" cy="7" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 10v4" stroke="currentColor" stroke-width="1.5"/></svg>
              <svg v-else viewBox="0 0 16 16"><circle cx="8" cy="8" r="3" fill="currentColor"/></svg>
            </span>
            <span class="feed-text"><strong>{{ initialsName(a.actor) }}</strong> {{ a.text }}</span>
            <span class="feed-time">{{ relativeTime(a.createdAt, now.getTime()) }}</span>
          </component>
        </li>
      </TransitionGroup>
      <div v-else class="hub-empty">
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 34l10-12 8 6 12-16 6 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <p>{{ feedFilter === 'all' ? 'Sem atividade ainda. Mova uma tarefa, passe um bastão ou faça o check-in.' : 'Nada deste tipo por enquanto.' }}</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed, onBeforeUnmount } from 'vue'
import MemberAvatar from '../insignia/MemberAvatar.vue'
import { useBoard, initialsName, CURRENT_USER } from '../../composables/useBoard'
import { memberColor } from '../../composables/useInsignias'
import { useNow, relativeTime } from '../../composables/useNow'
import { showToast } from '../../composables/useToast'

defineEmits(['open-task'])
const { collab, partners, tasks, addDecision, removeDecision } = useBoard()
const { now, release } = useNow()
onBeforeUnmount(release)

const titleEl = ref(null)
const draft = reactive({ title: '', context: '', author: CURRENT_USER, taskId: '' })
const feedFilter = ref('all')
const feedFilters = [
  { id: 'all', label: 'Tudo' },
  { id: 'handoff', label: 'Bastões' },
  { id: 'checkin', label: 'Check-ins' },
  { id: 'task', label: 'Tarefas' }
]
const feed = computed(() => {
  const f = feedFilter.value
  return collab.activities.filter(a => f === 'all' || (f === 'task' ? ['create', 'edit', 'move', 'done'].includes(a.type) : a.type === f)).slice(0, 60)
})
const taskMap = computed(() => Object.fromEntries(tasks.value.map(t => [t.id, t])))
function taskById(id) { return taskMap.value[id] || null }

function dateLabel(ts) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(ts)).replace('.', '')
}
function submit() {
  const d = addDecision({ ...draft, taskId: draft.taskId || null })
  if (!d) { titleEl.value?.focus(); return }
  draft.title = ''
  draft.context = ''
  draft.taskId = ''
  showToast('Decisão registrada', { tone: 'success' })
  titleEl.value?.focus()
}
function remove(d) {
  removeDecision(d.id)
  showToast('Decisão removida')
}
</script>
