<template>
  <Teleport to="body">
    <div ref="backdropEl" class="modal-backdrop" @pointerdown.self="requestClose">
      <div
        ref="panelEl"
        class="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ntm-title"
        @keydown="onKeydown"
      >
        <header class="modal-header">
          <h2 id="ntm-title">{{ isEdit ? 'Editar tarefa' : 'Forjar nova tarefa' }}</h2>
          <button type="button" class="modal-close" aria-label="Fechar janela" @click="requestClose">×</button>
        </header>

        <form class="modal-body" novalidate @submit.prevent="save">
          <div class="field">
            <label for="ntm-title-input">Título <span class="req">*</span></label>
            <input
              id="ntm-title-input"
              ref="titleEl"
              v-model="draft.title"
              type="text"
              maxlength="140"
              placeholder="Ex.: Fechar proposta — Aurora Café"
              :aria-invalid="!!error"
              :aria-describedby="error ? 'ntm-error' : undefined"
            />
            <p v-if="error" id="ntm-error" class="field-error" role="alert">{{ error }}</p>
          </div>

          <div class="field-row">
            <div class="field">
              <label for="ntm-status">Coluna</label>
              <select id="ntm-status" v-model="draft.status">
                <option v-for="c in columns" :key="c.id" :value="c.id">{{ c.title }} — {{ c.subtitle }}</option>
              </select>
            </div>
            <div class="field">
              <label for="ntm-due">Prazo</label>
              <input id="ntm-due" v-model="draft.dueDate" type="date" />
              <div class="quick-chips" role="group" aria-label="Prazos rápidos">
                <button type="button" @click="draft.dueDate = isoAddDays(0)">Hoje</button>
                <button type="button" @click="draft.dueDate = isoAddDays(1)">Amanhã</button>
                <button type="button" @click="draft.dueDate = isoAddDays(7)">+7 dias</button>
                <button type="button" @click="draft.dueDate = ''">Sem prazo</button>
              </div>
            </div>
          </div>

          <div class="field">
            <span class="field-label" id="ntm-tags-label">Tags <span class="field-hint">(máx. 6)</span></span>
            <div class="tag-picker" role="group" aria-labelledby="ntm-tags-label">
              <button
                v-for="tag in TAG_PRESETS"
                :key="tag"
                type="button"
                class="tag-option"
                :class="{ active: draft.tags.includes(tag) }"
                :aria-pressed="draft.tags.includes(tag)"
                @click="toggleTag(tag)"
              >{{ tag }}</button>
            </div>
            <div class="tag-custom">
              <input v-model="customTag" type="text" maxlength="24" placeholder="Tag personalizada + Enter" aria-label="Adicionar tag personalizada" @keydown.enter.prevent="addCustomTag" />
              <button type="button" class="btn-ghost" @click="addCustomTag">Adicionar</button>
            </div>
            <div v-if="customTags.length" class="tag-selected">
              <span v-for="tag in customTags" :key="tag" class="tag-pill tag-default">
                {{ tag }}
                <button type="button" :aria-label="'Remover tag ' + tag" @click="toggleTag(tag)">×</button>
              </span>
            </div>
          </div>

          <div class="field">
            <span class="field-label" id="ntm-assignees-label">Responsáveis</span>
            <div class="assignee-picker" role="group" aria-labelledby="ntm-assignees-label">
              <button
                v-for="p in partners"
                :key="p.id"
                type="button"
                class="assignee-option"
                :class="{ active: draft.assignees.includes(p.initials) }"
                :aria-pressed="draft.assignees.includes(p.initials)"
                @click="toggleAssignee(p.initials)"
              >
                <span class="avatar-badge" :class="'avatar-' + p.initials" aria-hidden="true">{{ p.initials }}</span>
                {{ p.name }} <span v-if="p.isYou" class="you-tag">(você)</span>
              </button>
            </div>
          </div>

          <div class="field">
            <label class="switch-row">
              <input v-model="draft.urgent" type="checkbox" class="switch-input" />
              <span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
              <span>🚩 Marcar como urgente</span>
            </label>
          </div>

          <div class="field">
            <span class="field-label">Checklist</span>
            <div class="checklist-edit">
              <div v-for="(item, i) in draft.checklist" :key="i" class="checklist-edit-row">
                <input v-model="item.done" type="checkbox" :aria-label="'Item ' + (i + 1) + ' concluído'" />
                <input v-model="item.text" type="text" maxlength="120" :placeholder="'Item ' + (i + 1)" :aria-label="'Texto do item ' + (i + 1)" @keydown.enter.prevent="addChecklistItem" />
                <button type="button" class="btn-card-icon danger" :aria-label="'Remover item ' + (i + 1)" @click="draft.checklist.splice(i, 1)">×</button>
              </div>
              <button type="button" class="btn-ghost add-item" @click="addChecklistItem">+ Adicionar item</button>
            </div>
          </div>

          <footer class="modal-footer">
            <template v-if="confirmDiscard">
              <span class="discard-warn" role="alert">Descartar alterações?</span>
              <button type="button" class="btn-ghost" @click="confirmDiscard = false">Continuar editando</button>
              <button type="button" class="btn-danger" @click="closeAnimated">Descartar</button>
            </template>
            <template v-else>
              <button type="button" class="btn-ghost" @click="requestClose">Cancelar</button>
              <button type="submit" class="btn-primary">{{ isEdit ? 'Salvar alterações' : '⚒ Forjar tarefa' }}</button>
            </template>
          </footer>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import gsap from 'gsap'
import { useBoard, TAG_PRESETS, isoAddDays, normalizeText, CURRENT_USER } from '../../composables/useBoard'
import { reducedMotion } from '../../utils/motion'

const props = defineProps({
  initialTask: { type: Object, default: null },
  partners: { type: Array, default: () => [] }
})
const emit = defineEmits(['close', 'save'])

const { columns } = useBoard()
const isEdit = computed(() => !!props.initialTask?.id)

const draft = reactive({
  id: props.initialTask?.id ?? null,
  title: props.initialTask?.title ?? '',
  status: props.initialTask?.status ?? 'todo',
  tags: [...(props.initialTask?.tags ?? [])],
  dueDate: props.initialTask?.dueDate ?? '',
  urgent: props.initialTask?.urgent ?? false,
  assignees: [...(props.initialTask?.assignees ?? (isEdit.value ? [] : [CURRENT_USER]))],
  checklist: (props.initialTask?.checklist ?? []).map(i => ({ text: i.text, done: !!i.done }))
})
const snapshot = JSON.stringify(draft)

const backdropEl = ref(null)
const panelEl = ref(null)
const titleEl = ref(null)
const customTag = ref('')
const error = ref('')
const confirmDiscard = ref(false)
let closing = false
let prevFocus = null

const customTags = computed(() => draft.tags.filter(t => !TAG_PRESETS.includes(t)))
const isDirty = computed(() => JSON.stringify(draft) !== snapshot)

function toggleTag(tag) {
  const i = draft.tags.indexOf(tag)
  if (i >= 0) draft.tags.splice(i, 1)
  else if (draft.tags.length < 6) draft.tags.push(tag)
}
function addCustomTag() {
  const t = customTag.value.trim()
  if (!t) return
  if (!draft.tags.some(x => normalizeText(x) === normalizeText(t)) && draft.tags.length < 6) draft.tags.push(t)
  customTag.value = ''
}
function toggleAssignee(initials) {
  const i = draft.assignees.indexOf(initials)
  if (i >= 0) draft.assignees.splice(i, 1)
  else draft.assignees.push(initials)
}
async function addChecklistItem() {
  draft.checklist.push({ text: '', done: false })
  await nextTick()
  const inputs = panelEl.value?.querySelectorAll('.checklist-edit-row input[type="text"]')
  inputs?.[inputs.length - 1]?.focus()
}

function save() {
  const title = draft.title.trim()
  if (!title) {
    error.value = 'Dê um título à tarefa antes de forjar.'
    titleEl.value?.focus()
    if (!reducedMotion() && panelEl.value) gsap.fromTo(panelEl.value, { x: -7 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.35)' })
    return
  }
  error.value = ''
  emit('save', {
    ...draft,
    title,
    tags: [...draft.tags],
    assignees: [...draft.assignees],
    checklist: draft.checklist.map(i => ({ text: i.text.trim(), done: !!i.done })).filter(i => i.text)
  })
}

function requestClose() {
  if (closing) return
  if (isDirty.value && !confirmDiscard.value) { confirmDiscard.value = true; return }
  closeAnimated()
}
function closeAnimated() {
  if (closing) return
  closing = true
  if (reducedMotion() || !panelEl.value) { emit('close'); return }
  gsap.to(panelEl.value, { y: 16, opacity: 0, scale: 0.97, duration: 0.2, ease: 'power2.in' })
  gsap.to(backdropEl.value, { opacity: 0, duration: 0.22, delay: 0.04, onComplete: () => emit('close') })
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    e.preventDefault()
    if (confirmDiscard.value) closeAnimated()
    else requestClose()
    return
  }
  if (e.key !== 'Tab' || !panelEl.value) return
  const focusables = Array.from(panelEl.value.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
    .filter(el => !el.disabled && el.offsetParent !== null)
  if (!focusables.length) return
  const first = focusables[0], last = focusables[focusables.length - 1]
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}

onMounted(async () => {
  prevFocus = document.activeElement
  document.body.classList.add('modal-open')
  document.body.style.overflow = 'hidden'
  if (!reducedMotion()) {
    gsap.fromTo(backdropEl.value, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power1.out' })
    gsap.fromTo(panelEl.value, { y: 28, scale: 0.96, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.35, ease: 'power3.out' })
  }
  await nextTick()
  titleEl.value?.focus()
})
onBeforeUnmount(() => {
  document.body.classList.remove('modal-open')
  document.body.style.overflow = ''
  if (panelEl.value) gsap.killTweensOf(panelEl.value)
  if (backdropEl.value) gsap.killTweensOf(backdropEl.value)
  if (prevFocus && prevFocus.isConnected) prevFocus.focus()
})
</script>