import { ref } from 'vue'
import { TYPES } from '../config/alertTypes.js'

/* import.meta.glob résout les chemins relatifs au fichier courant */
const SOUND_URLS = import.meta.glob('../assets/sound/*.{mp3,ogg,wav}', {
  eager: true, query: '?url', import: 'default',
})
const SOUND_EXTS = ['mp3', 'ogg', 'wav']

const MOTIF = {
  follow: [587.33, 880],
  sub:    [698.46, 880, 1174.66],
  gift:   [523.25, 698.46, 880],
  bits:   [880, 659.25],
  raid:   [440, 587.33, 880],
}

const TARGET_PEAK = 0.18
const MAX_GAIN    = 6

export function useAlertSound() {
  const soundOn = ref(true)
  let ctx = null
  const soundBuffers = {}

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  }

  function soundUrl(type) {
    for (const ext of SOUND_EXTS) {
      const url = SOUND_URLS[`../assets/sound/${type}.${ext}`]
      if (url) return url
    }
  }

  function loadSoundBuffer(type) {
    const url = soundUrl(type)
    if (!url || soundBuffers[type]) return
    soundBuffers[type] = 'loading'
    fetch(url)
      .then(r => r.arrayBuffer())
      .then(data => getCtx().decodeAudioData(data))
      .then(buffer => {
        let peak = 0
        for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
          const samples = buffer.getChannelData(ch)
          for (let i = 0; i < samples.length; i += 32) {
            const v = Math.abs(samples[i])
            if (v > peak) peak = v
          }
        }
        soundBuffers[type] = {
          buffer,
          gain: peak > 0 ? Math.min(TARGET_PEAK / peak, MAX_GAIN) : 1,
        }
      })
      .catch(() => { soundBuffers[type] = null })
  }

  Object.keys(TYPES).forEach(loadSoundBuffer)

  function synthChime(type) {
    try {
      const c = getCtx()
      const notes = MOTIF[type] || MOTIF.follow
      const t0 = c.currentTime + 0.12
      notes.forEach((f, i) => {
        const t = t0 + i * 0.16
        const osc = c.createOscillator()
        const gain = c.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(f, t)
        gain.gain.setValueAtTime(0.0001, t)
        gain.gain.exponentialRampToValueAtTime(0.18, t + 0.014)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.52)
        osc.connect(gain).connect(c.destination)
        osc.start(t)
        osc.stop(t + 0.55)
      })
    } catch (_) {}
  }

  function chime(type) {
    if (!soundOn.value) return
    const entry = soundBuffers[type]
    if (entry && entry !== 'loading') {
      const c = getCtx()
      const src = c.createBufferSource()
      src.buffer = entry.buffer
      const g = c.createGain()
      g.gain.value = entry.gain
      src.connect(g).connect(c.destination)
      src.start()
      return
    }
    synthChime(type)
  }

  return { soundOn, chime }
}
