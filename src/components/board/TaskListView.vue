<template>
  <section id="tab-panel-list" class="task-list-view" aria-label="Lista de tarefas">
    <div v-for="col in columns" :key="col.id" class="list-group" :class="col.themeClass">
      <header class="list-group-head">
        <label v-if="rows(col.id).length" class="col-select-all">
          <input type="checkbox" :checked="allSel(col.id)" :aria-label="`Selecionar todas em ${col.subtitle}`" @change="toggleSelectMany(rows(col.id).map(t => t.id), !allSel(col.id))" />
        </label>
        <h2 class="list-group-title">{{ col.title }} <span>{{ col.subtitle }}</span></h2>
        <span class="column-count">{{ rows(col.id).length }}</span>
      </header>
      <ul v-if="rows(col.id).length" class="list-rows" role="list">
        <li
          v-for="t in rows(col.id)"
          :key="t.id"
          class="list-row"
          :class="{ selected: selectedIds.includes(t.id), urgent: t.urgent, 'baton-mine': t.handoff?.holder === CURRENT_USER }"
          :data-flip-id="'task-' + t.id"
        >
          <label class="card-select">
            <input type="checkbox" :checked="selectedIds.includes(t.id)" :aria-label="`Selecionar '${t.title}'`" @change="toggleSelect(t.id)" />
          </label>
          <button type="button" class="list-row-main" @click="$emit('open-task', t)">
            <span class="list-row-title">{{ t.title }}</span>
            <span class="list-row-meta">
              <span v-if="t.handoff" class="list-baton" :style="{ '--b-color': memberColor(t.handoff.holder) }">
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9.5 1.5L3.5 9h4l-1 5.5 6-7.5h-4z" fill="currentColor" /></svg>
                {{ t.handoff.holder === CURRENT_USER ? 'Com você' : initialsName(t.handoff.holder) }}
              </span>
              <span v-for="tag in t.tags" :key="tag" class="tag-pill" :class="tagClass(tag)">{{ tag }}</span>
            </span>
          </button>
          <span class="list-row-prog" :title="`Checklist ${done(t)}/${t.checklist.length}`">
            <span class="progress-track"><span class="progress-fill" :style="{ width: pct(t) + '%' }"></span></span>
            {{ done(t) }}/{{ t.checklist.length }}
          </span>
          <span class="list-row-due" :class="{ overdue: isOverdue(t), empty: !t.dueDate }">{{ t.dueDate ? dueLabel(t) : '—' }}</span>
          <AssigneeStack :task="t" />
        </li>
      </ul>
      <p v-else class="list-empty">Nenhuma tarefa aqui com os filtros atuais.</p>
    </div>
  </section>
</template>

<script setup>
import { useBoard, dueLabel, isOverdue, tagClass, CURRENT_USER, initialsName } from '../../composables/useBoard'
import { memberColor } from '../../composables/useInsignias'
import AssigneeStack from '../insignia/AssigneeStack.vue'

defineEmits(['open-task'])
const { columns, filteredTasksByColumn, selectedIds, toggleSelect, toggleSelectMany } = useBoard()
const rows = (id) => filteredTasksByColumn(id)
const allSel = (id) => rows(id).every(t => selectedIds.value.includes(t.id))
const done = (t) => t.checklist.filter(i => i.done).length
const pct = (t) => t.checklist.length ? Math.round(done(t) / t.checklist.length * 100) : 0
</script>
