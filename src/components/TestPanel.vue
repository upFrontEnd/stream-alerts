<script setup>
import { ref } from 'vue'
import { NOTES, NICKS } from '../config/alertTypes.js'

const props = defineProps({
  soundOn: { type: Boolean, required: true },
  devMode: { type: Boolean, required: true },
})

const emit = defineEmits(['fire', 'burst', 'toggle-sound', 'toggle-dev', 'bg-change'])

const pseudo    = ref('')
const bgLabels  = ['cockpit', 'ciel', 'damier']
const bgIdx     = ref(0)

function sample(type) {
  const user = pseudo.value.trim() || NICKS[Math.floor(Math.random() * NICKS.length)]
  const evt  = { type, user }
  if (type === 'sub')  { evt.tier = 1 + Math.floor(Math.random() * 3); evt.months = Math.floor(Math.random() * 26) }
  if (type === 'gift') { evt.count = [1, 5, 10, 25, 50][Math.floor(Math.random() * 5)]; evt.tier = 1 }
  if (type === 'bits') { evt.amount = [100, 500, 1000, 5000][Math.floor(Math.random() * 4)] }
  if (type === 'raid') { evt.viewers = 8 + Math.floor(Math.random() * 180) }
  if (Math.random() < 0.5 && type !== 'follow') {
    evt.message = NOTES[Math.floor(Math.random() * NOTES.length)]
  }
  return evt
}

function fire(type)  { emit('fire', sample(type)) }
function burst()     { emit('burst', ['follow', 'gift', 'sub', 'raid'].map(sample)) }

function changeBg() {
  bgIdx.value = (bgIdx.value + 1) % bgLabels.length
  emit('bg-change', bgLabels[bgIdx.value])
}
</script>

<template>
  <div class="chrome">
    <div class="row">
      <button class="btn" @click="fire('follow')">Nouveau follow</button>
      <button class="btn" @click="fire('sub')">Abonnement</button>
      <button class="btn" @click="fire('gift')">Subs offerts</button>
      <button class="btn" @click="fire('bits')">Bits</button>
      <button class="btn" @click="fire('raid')">Raid</button>
      <span class="sep"></span>
      <button class="btn" @click="burst">Envoyer 4 alertes d'affilée</button>
    </div>
    <div class="row">
      <input
        v-model="pseudo"
        class="field"
        placeholder="Pseudo à afficher"
        aria-label="Pseudo à afficher"
      >
      <button class="btn" @click="changeBg">Fond : {{ bgLabels[bgIdx] }}</button>
      <button
        class="btn"
        :aria-pressed="String(soundOn)"
        @click="$emit('toggle-sound')"
      >Son : {{ soundOn ? 'activé' : 'coupé' }}</button>
      <button
        class="btn"
        :aria-pressed="String(devMode)"
        @click="$emit('toggle-dev')"
      >Mode dev : {{ devMode ? 'activé' : 'désactivé' }}</button>
    </div>
    <p class="hint">
      Source navigateur dans OBS, URL suivie de <code>?clean=1</code> : fond transparent, panneau masqué. Taille conseillée 820 × 270.
      URL suivie de <code>?dev=1</code>, ou bouton « Mode dev » : alerte figée sans animation, pour valider le rendu avant d'ajuster la charte.
      Déclenchement depuis ton code : <code>Alerts.push({ type:'sub', user:'Nom', tier:2, months:14 })</code>.
    </p>
  </div>
</template>
