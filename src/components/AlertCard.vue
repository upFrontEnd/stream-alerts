<script setup>
import { ref, computed, nextTick } from 'vue'
import { TYPES, withNumbers } from '../config/alertTypes.js'

const emit = defineEmits(['dismissed'])

const bugEl  = ref(null)
const evt    = ref(null)
const isLive = ref(false)
const isIn   = ref(false)
const isOut  = ref(false)

let timers = []
function clearTimers() { timers.forEach(clearTimeout); timers = [] }

async function show(event, devMode) {
  clearTimers()

  /* réinitialise l'état pour que la transition CSS reparte de zéro */
  isIn.value   = false
  isOut.value  = false
  isLive.value = false
  evt.value    = null

  await nextTick()
  if (bugEl.value) void bugEl.value.offsetWidth   /* force reflow */

  evt.value    = event
  isLive.value = true
  isIn.value   = true

  if (devMode) return

  const cfg  = TYPES[event.type]
  const hold = event.hold || cfg.hold

  timers.push(setTimeout(() => {
    isIn.value  = false
    isOut.value = true
  }, hold + 600))

  timers.push(setTimeout(() => {
    isOut.value  = false
    isLive.value = false
    evt.value    = null
    emit('dismissed')
  }, hold + 940))
}

function clear() {
  clearTimers()
  isIn.value   = false
  isOut.value  = false
  isLive.value = false
  evt.value    = null
}

defineExpose({ show, clear })

const cfg       = computed(() => evt.value ? TYPES[evt.value.type] : null)
const dataType  = computed(() => evt.value?.type ?? 'follow')

const chars = computed(() => {
  const user = evt.value?.user ?? 'anonyme'
  return String(user).split('').map((c, i) => ({
    ch: c === ' ' ? ' ' : c,
    i,
  }))
})

const kindText   = computed(() => cfg.value?.label ?? '')
const stampText  = computed(() => cfg.value?.stamp ?? '')
const codeText   = computed(() => cfg.value?.code  ?? '')
const figureText = computed(() => (evt.value && cfg.value) ? String(cfg.value.figure(evt.value)) : '')
const unitText   = computed(() => (evt.value && cfg.value) ? cfg.value.unit(evt.value) : '')
const lineHtml   = computed(() => (evt.value && cfg.value) ? withNumbers(cfg.value.line(evt.value)) : '')
const noteHtml   = computed(() => evt.value ? withNumbers((evt.value.message || '').trim()) : '')
</script>

<template>
  <div
    ref="bugEl"
    class="bug"
    :class="{ 'is-live': isLive, 'is-in': isIn, 'is-out': isOut }"
    :data-type="dataType"
    role="status"
    aria-live="polite"
  >
    <div class="bug__coupon">
      <div class="bug__header">
        <span class="bug__airline">
          <svg class="bug__plane" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L12 19v-5.5z"/>
          </svg>
          <span>{{ kindText }}</span>
        </span>
        <span class="bug__doc">Carte d'embarquement</span>
      </div>

      <div class="bug__body">
        <div class="bug__pax">
          <span class="bug__tag">Passager</span>
          <p class="bug__name" :aria-label="evt?.user ?? 'anonyme'">
            <span
              v-for="c in chars"
              :key="c.i"
              class="ch"
              :style="{ '--i': c.i }"
            >{{ c.ch }}</span>
          </p>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <p class="bug__line" v-html="lineHtml"></p>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <span class="bug__note" v-html="noteHtml"></span>
        </div>

        <div class="bug__stampwrap" aria-hidden="true">
          <span class="bug__stamp">{{ stampText }}</span>
        </div>
      </div>
    </div>

    <div class="bug__stub">
      <div class="bug__seat">
        <span class="bug__label">Vol</span>
        <span class="bug__flightno">{{ codeText }}</span>
      </div>
      <div class="bug__seat">
        <span class="bug__label">{{ unitText }}</span>
        <span class="bug__value">{{ figureText }}</span>
      </div>
      <div class="bug__barcode"></div>
    </div>
  </div>
</template>
