# Alertes SkyflyerAviation

Overlay d'alertes Twitch sous forme de carte d'embarquement.
Stack : Bun + Vite + Vue 3 (Composition API), SCSS, pas de TypeScript.
Deux polices Google Fonts (Barlow Condensed, IBM Plex Mono), tout le reste est local.

## Structure

```
src/
├── config/alertTypes.js        — types d'événements, textes, durées, sampleEvent()
├── composables/useAlertSound.js — Web Audio : carillon synthétisé + fichiers custom
├── components/AlertCard.vue    — carte .bug avec animations CSS
├── components/TestPanel.vue    — panneau de test (masqué en mode OBS)
├── App.vue                     — file d'attente, clavier, init Twitch
├── main.js                     — point d'entrée Vue
├── twitch.js                   — connexion EventSub WebSocket
└── styles/
    ├── _base.scss              — reset, tokens --ui-*, thème clair/sombre
    ├── _bug.scss               — composant .bug : couleurs, structure, animations
    └── _panel.scss             — aperçu + panneau (absents en mode OBS)
```

## Développer

```bash
bun install
bun run dev       # serveur de dev Vite
bun run build     # build de prod dans dist/
bun run preview   # sert le build depuis dist/
```

## Utiliser dans OBS

Après `bun run build`, dans OBS : source navigateur, fichier local `dist/index.html`.
Pour le fond transparent et le panneau masqué, passer par l'URL complète :

```
file:///chemin/vers/dist/index.html?clean=1
```

Taille conseillée : **820 × 270**.

## Tester depuis OBS

Dans OBS, clic droit sur la Browser Source → **Interact**, puis clic dans la fenêtre pour la focus.

| Touche | Alerte |
| --- | --- |
| `F` | Follow |
| `S` | Abonnement |
| `G` | Subs offerts |
| `B` | Bits |
| `R` | Raid |

## Mode dev

URL avec `?dev=1`, ou bouton « Mode dev » du panneau : l'alerte apparaît instantanément,
figée, sans animation, et reste affichée indéfiniment. Sert à valider le rendu statique
(couleurs, textes, mise en page) avant de retoucher la charte.

## Personnaliser

### Couleurs — `src/styles/_bug.scss`

Couleur d'encre du coupon (haut du fichier, bloc `CHARTE`) :

```css
--ink: #101a24;  /* texte principal */
--dim: #51606d;  /* texte secondaire */
```

Couleur par type via `--name` (teinte pleine) et `--grad` (dégradé bandeau + souche) :

| Type | `--name` |
| --- | --- |
| `follow` | `#009fe3` |
| `sub` | `#128a3c` |
| `gift` | `#6b2d8f` |
| `bits` | `#c2317e` |
| `raid` | `#d97400` |

### Textes et codes — `src/config/alertTypes.js`

Objet `TYPES` — chaque type définit `label`, `stamp`, `code`, `figure`, `unit`, `line` et `hold` (durée d'affichage en ms).

### Sons — `src/assets/sound/`

Dépose un fichier `<type>.mp3`, `.ogg` ou `.wav` (ex. `follow.mp3`, `sub.wav`) pour remplacer le carillon synthétisé de ce type. Si le fichier est absent, le carillon de cabine synthétisé prend le relais — rien ne casse.

Chaque fichier custom est décodé une fois au chargement et son pic normalisé pour sortir au même volume que le carillon synthétisé (`TARGET_PEAK` dans `useAlertSound.js`).

## Déclencher une alerte depuis le code

```js
Alerts.push({ type: 'follow', user: 'pseudo' });
Alerts.push({ type: 'sub',    user: 'pseudo', tier: 2, months: 14 });
Alerts.push({ type: 'gift',   user: 'pseudo', count: 10, tier: 1 });
Alerts.push({ type: 'bits',   user: 'pseudo', amount: 500, message: 'gg' });
Alerts.push({ type: 'raid',   user: 'pseudo', viewers: 34 });
```

Les appels s'empilent et s'affichent l'un après l'autre.
Champs communs : `user`, `message` (optionnel), `hold` (optionnel, écrase la durée du type).

## Connexion Twitch

`src/twitch.js` lit le token OAuth dans `?token=` (ou `localStorage`) et ouvre un WebSocket EventSub. Correspondance des abonnements :

| Abonnement EventSub | Type |
| --- | --- |
| `channel.follow` | `follow` |
| `channel.subscribe` + `channel.subscription.message` | `sub` |
| `channel.subscription.gift` | `gift` |
| `channel.cheer` | `bits` |
| `channel.raid` | `raid` |

## Animations

La carte entre et sort via une transition CSS sur `.bug` (fondu + léger décalage/zoom).
Quelques détails suivent par-dessus :

1. **Volets du pseudo** — chaque lettre jaillit du bas, décalage de 34 ms entre chaque
2. **Ligne d'action** — `riseIn` 300 ms, déclenché à 300 ms
3. **Tampon** — `stampIn` 520 ms, déclenché à 400 ms
4. **Balayage lumineux** — `sheen` 660 ms, déclenché à 160 ms
5. **Éclat tournant** — `letterGlint` en boucle sur le pseudo (7 s, pause longue)

`prefers-reduced-motion` remplace tout cela par un simple fondu.
