<template>
  <Teleport to="body">
    <div class="modal-backdrop" @pointerdown.self="$emit('close')">
      <div class="modal-panel sync-panel" role="dialog" aria-modal="true" aria-labelledby="sync-title" @keydown.esc="$emit('close')">
        <header class="modal-header">
          <h2 id="sync-title">Exportar e importar</h2>
          <button ref="closeEl" class="modal-close" aria-label="Fechar" @click="$emit('close')">×</button>
        </header>
        <div class="modal-body">
          <p class="sync-intro">Sem servidor: exporte o quadro e mande o arquivo para os sócios. Quem importar fica com exatamente a mesma versão (tarefas, bastões, check-ins, decisões e insígnias).</p>

          <div class="sync-actions">
            <button type="button" class="hub-btn primary" @click="download">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v8M4.5 6.5L8 10l3.5-3.5M3 13h10" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Baixar arquivo .json
            </button>
            <button type="button" class="hub-btn ghost" @click="copy">Copiar JSON</button>
            <label class="hub-btn ghost file-btn">
              <input type="file" accept="application/json,.json" class="sr-only" data-testid="import-file" @change="onFile" />
              Importar arquivo
            </label>
          </div>

          <label class="hub-field">
            <span>Ou cole aqui o JSON recebido</span>
            <textarea v-model="pasted" rows="6" class="sync-textarea" spellcheck="false" placeholder='{"app":"escritorio-cityou", ...}'></textarea>
          </label>
          <p v-if="error" class="field-error" role="alert">{{ error }}</p>
          <div class="hub-actions">
            <button type="button" class="hub-btn ghost" @click="$emit('close')">Fechar</button>
            <button type="button" class="hub-btn primary" :disabled="!pasted.trim()" @click="applyText(pasted)">Importar JSON colado</button>
          </div>
          <p class="sync-note">Importar substitui o quadro deste aparelho. Exporte antes se quiser guardar uma cópia.</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useBoard } from '../../composables/useBoard'
import { showToast } from '../../composables/useToast'

const emit = defineEmits(['close', 'imported'])
const { exportWorkspace, importWorkspace } = useBoard()
const pasted = ref('')
const error = ref('')
const closeEl = ref(null)
onMounted(() => closeEl.value?.focus())

function json() { return JSON.stringify(exportWorkspace(), null, 2) }
function download() {
  const blob = new Blob([json()], { type: 'application/json' })
  const a = document.createElement('a')
  const d = new Date()
  a.href = URL.createObjectURL(blob)
  a.download = `escritorio-cityou-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
  showToast('Arquivo exportado', { tone: 'success' })
}
async function copy() {
  try { await navigator.clipboard.writeText(json()); showToast('JSON copiado', { tone: 'success' }) }
  catch { pasted.value = json(); showToast('Não deu para copiar sozinho. O JSON está na caixa abaixo.') }
}
function applyText(text) {
  error.value = ''
  let n
  try { n = importWorkspace(text) }
  catch (e) { error.value = 'Não consegui ler esse JSON: ' + (e?.message || 'formato inválido'); return }
  showToast(`Quadro importado: ${n} tarefa${n === 1 ? '' : 's'}`, { tone: 'success' })
  emit('imported', n)
  emit('close')
}
function onFile(e) {
  const f = e.target.files?.[0]
  if (!f) return
  const r = new FileReader()
  r.onload = () => applyText(String(r.result || ''))
  r.onerror = () => { error.value = 'Não consegui abrir o arquivo.' }
  r.readAsText(f)
  e.target.value = ''
}
</script>
