<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AlertCard from './components/AlertCard.vue'
import TestPanel from './components/TestPanel.vue'
import { TYPES, sampleEvent } from './config/alertTypes.js'
import { useAlertSound } from './composables/useAlertSound.js'
import { initTwitch } from './twitch.js'

const alertCard = ref(null)
const { soundOn, chime } = useAlertSound()

const queue   = ref([])
const busy    = ref(false)
const devMode = ref(/[?&]dev=1/.test(location.search))
const sceneBg = ref('cockpit')

/* ---- file d'attente -------------------------------------------- */
function push(evt) {
  if (!evt || !TYPES[evt.type]) return
  if (devMode.value) {
    queue.value = []
    alertCard.value?.show(evt, true)
    /* pas de chime en mode dev */
    return
  }
  queue.value.push(evt)
  if (!busy.value) next()
}

function next() {
  const evt = queue.value.shift()
  if (!evt) { busy.value = false; return }
  busy.value = true
  alertCard.value?.show(evt, false)
  chime(evt.type)
}

function onDismissed() {
  next()
}

/* ---- contrôles du panneau -------------------------------------- */
function toggleSound() {
  soundOn.value = !soundOn.value
}

function toggleDev() {
  devMode.value = !devMode.value
  document.documentElement.dataset.dev = devMode.value ? '1' : '0'
  queue.value = []
  busy.value  = false
  if (!devMode.value) alertCard.value?.clear()
}

function setBg(bg) {
  sceneBg.value = bg
}

/* ---- raccourcis clavier ---------------------------------------- */
const KEY_MAP = { f: 'follow', s: 'sub', g: 'gift', b: 'bits', r: 'raid' }
function onKeydown(e) {
  const type = KEY_MAP[e.key.toLowerCase()]
  if (type) push(sampleEvent(type))
}

/* ---- initialisation -------------------------------------------- */
onMounted(() => {
  window.Alerts = { push, types: Object.keys(TYPES) }
  initTwitch(push)
  document.addEventListener('keydown', onKeydown)

  if (/[?&]clean=1/.test(location.search)) {
    document.documentElement.dataset.mode = 'clean'
  } else {
    setTimeout(() => push(sampleEvent('follow')), 600)
  }

  if (devMode.value) {
    document.documentElement.dataset.dev = '1'
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="wrap">
    <div class="scene" :data-bg="sceneBg">
      <div class="stage">
        <AlertCard ref="alertCard" @dismissed="onDismissed" />
      </div>
    </div>

    <TestPanel
      :sound-on="soundOn"
      :dev-mode="devMode"
      @fire="push"
      @burst="evts => evts.forEach(push)"
      @toggle-sound="toggleSound"
      @toggle-dev="toggleDev"
      @bg-change="setBg"
    />
  </div>
</template>
