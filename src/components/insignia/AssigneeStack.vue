<template>
  <div class="assignee-stack" :class="{ linked: task.assignees.length > 1 }" :style="stackStyle">
    <span v-if="task.assignees.length > 1" class="as-thread" aria-hidden="true">
      <span class="as-thread-line"></span>
      <span class="as-particle p1"></span>
      <span class="as-particle p2"></span>
      <span class="as-particle p3"></span>
    </span>
    <TransitionGroup tag="div" class="as-list" :css="false" @enter="onEnter" @leave="onLeave">
      <MemberAvatar
        v-for="ini in task.assignees"
        :key="ini"
        :initials="ini"
        :task-id="task.id"
        size="sm"
      />
    </TransitionGroup>
    <button
      type="button"
      class="as-add"
      :aria-label="`Atribuir ou remover sócios em '${task.title}'`"
      aria-haspopup="dialog"
      @click.stop="openAssign"
      @pointerdown.stop
    >
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import gsap from 'gsap'
import MemberAvatar from './MemberAvatar.vue'
import { memberColor, openMemberPopover } from '../../composables/useInsignias'
import { reducedMotion } from '../../utils/motion'

const props = defineProps({ task: { type: Object, required: true } })

const stackStyle = computed(() => {
  const a = props.task.assignees
  const cols = a.map(memberColor)
  return {
    '--n': a.length,
    '--c1': cols[0] || '#22e4ff',
    '--c2': cols[1] || cols[0] || '#22e4ff',
    '--c3': cols[2] || cols[1] || cols[0] || '#22e4ff'
  }
})

function openAssign(e) { openMemberPopover(null, e.currentTarget, props.task.id) }

function onEnter(el, done) {
  if (reducedMotion()) return done()
  gsap.fromTo(el, { scale: 0, rotate: -120, opacity: 0 },
    { scale: 1, rotate: 0, opacity: 1, duration: 0.6, ease: 'back.out(2.2)', clearProps: 'transform,opacity', onComplete: done })
}
function onLeave(el, done) {
  if (reducedMotion()) return done()
  gsap.to(el, { scale: 0, rotate: 90, opacity: 0, width: 0, marginLeft: 0, marginRight: 0, duration: 0.35, ease: 'power3.in', onComplete: done })
}
</script>
