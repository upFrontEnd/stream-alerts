export function pad(n) {
  n = Number(n) || 0
  return n < 10 ? '0' + n : String(n)
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;' }
export function withNumbers(text) {
  return String(text == null ? '' : text)
    .replace(/[&<>]/g, c => ESCAPES[c])
    .replace(/\d+/g, '<span class="bug__num">$&</span>')
}

export const TYPES = {
  follow: {
    label: 'Nouveau follow', stamp: 'Welcome',
    code: 'ARR', figure: () => '01', unit: () => 'pax',
    line: () => 'vient d’embarquer',
    hold: 11760,
  },
  sub: {
    label: 'Abonnement', stamp: 'À bord !',
    code: 'CLS', figure: e => pad(e.tier || 1), unit: () => 'tier',
    line: () => 'rejoint l’équipage',
    hold: 5000,
  },
  gift: {
    label: 'Subs offerts', stamp: 'Excellence !',
    code: 'GFT', figure: e => pad(e.count || 1),
    unit: e => (e.count || 1) > 1 ? 'places' : 'place',
    line: e => {
      const c = e.count || 1
      return 'offre ' + c + ' abonnement' + (c > 1 ? 's' : '') + '.'
    },
    hold: 12764,
  },
  bits: {
    label: 'Bits', stamp: 'Merci !',
    code: 'FUEL', figure: e => e.amount || 100, unit: () => 'bits',
    line: () => 'fait le plein de kérosène',
    hold: 3250,
  },
  raid: {
    label: 'Raid', stamp: 'Bienvenue !',
    code: 'FMN', figure: e => e.viewers || 10, unit: () => 'pax',
    line: () => 'Rejoint la formation',
    hold: 7908,
  },
}

export const NOTES = [
  'Vol parfait, merci Sky.',
  'Le posé de tout à l’heure était magnifique.',
  'Première fois ici, je reste.',
  'Direction LFPG ?',
  'On est bien à bord.',
]

export const NICKS = [
  'skywalker_lfpb', 'MarcoPolyfill', 'luneb', 'TangoCharlie',
  'cockpit_vue', 'Nono_le_dev', 'vol_a_vue', 'aria_labelled',
]

export function sampleEvent(type, user) {
  const u = user || NICKS[Math.floor(Math.random() * NICKS.length)]
  const evt = { type, user: u }
  if (type === 'sub') { evt.tier = 1 + Math.floor(Math.random() * 3); evt.months = Math.floor(Math.random() * 26) }
  if (type === 'gift') { evt.count = [1, 5, 10, 25, 50][Math.floor(Math.random() * 5)]; evt.tier = 1 }
  if (type === 'bits') { evt.amount = [100, 500, 1000, 5000][Math.floor(Math.random() * 4)] }
  if (type === 'raid') { evt.viewers = 8 + Math.floor(Math.random() * 180) }
  if (Math.random() < 0.5 && type !== 'follow') {
    evt.message = NOTES[Math.floor(Math.random() * NOTES.length)]
  }
  return evt
}
