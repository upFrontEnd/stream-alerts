# Alertes SkyflyerAviation

Overlay d'alertes Twitch. Projet Bun + Vite, HTML/SCSS/JS vanilla (pas de framework, pas de TypeScript).
Deux polices Google Fonts (Barlow Condensed, IBM Plex Mono), tout le reste est local.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `index.html` | Structure du bandeau + panneau de test |
| `src/styles/main.scss` | Point d'entrée, importe les fichiers ci-dessous |
| `src/styles/_base.scss` | Reset, tokens `--ui-*`, thème clair/sombre, `body` |
| `src/styles/_bug.scss` | Composant d'alerte `.bug` : charte, structure, séquence |
| `src/styles/_panel.scss` | Aperçu + panneau de test (absents en mode OBS) |
| `src/main.js` | Catalogue d'événements, file d'attente, son, panneau de test |

## Développer

```bash
bun install
bun run dev       # serveur de dev Vite
bun run build     # build de prod dans dist/
bun run preview   # sert le build de dist/
```

## Utiliser dans OBS

Après `bun run build`, dans OBS : source navigateur, fichier local `dist/index.html`,
cocher « fichier local », puis ajouter `?clean=1` n'est pas possible sur un fichier local,
donc passer plutôt par `file:///chemin/dist/index.html?clean=1` dans le champ URL,
ou forcer le mode propre en remplaçant `data-mode="demo"` par `data-mode="clean"`
sur la balise `<html>`.
Taille conseillée : 820 × 270.

## Mode dev

URL suivie de `?dev=1`, ou bouton « Mode dev » du panneau : l'alerte apparaît
instantanément, figée, sans aucune animation (bandeau, volets, balayage,
ligne de piste), et reste affichée jusqu'au prochain déclenchement au lieu
de disparaître après `hold`. Sert à valider le rendu statique (couleurs,
textes, mise en page) avant de donner des instructions de retouche précises.

## Personnaliser

Deux points d'entrée, tous les deux marqués `CHARTE` dans le code.

**Couleurs** dans `src/styles/_bug.scss`, sur le sélecteur `.bug` :

```css
--ink: #101a24;  /* texte principal, coupon blanc */
--dim: #51606d;  /* texte secondaire (bug__line, bug__note) */
```

Une couleur par type juste en dessous, sur `.bug[data-type="..."]`, dans `--name` :
utilisée pour la bande de gauche, la souche et le pseudo (`bug__name`) :

| Type (clé) | Libellé | `--name` |
| --- | --- | --- |
| `follow` | FOLLOWER | `#009fe3` |
| `sub` | SUB | `#00b132` |
| `gift` | HOST | `#5e008a` |
| `bits` | DONS | `#db4798` |
| `raid` | RAID | `#ff9000` |

**Textes et codes** dans `src/main.js`, objet `TYPES`. Chaque type définit
`code` (3 ou 4 lettres du bloc gauche), `figure`, `unit`, `line` et `hold`
(durée d'affichage en ms).

**Son** : dépose un fichier `src/assets/sound/<type>.mp3` ou `.ogg` (ex.
`src/assets/sound/follow.mp3`, `src/assets/sound/sub.ogg`...) pour un son
custom sur ce type d'alerte. Si le fichier
est absent, `chime()` bascule automatiquement sur le carillon synthétisé
(`synthChime()` dans `src/main.js`, objet `MOTIF` : liste de fréquences par
type, jouées en sinus) — donc rien ne casse tant que tous les sons ne sont
pas fournis.

## Brancher les vrais événements

```js
Alerts.push({ type: 'follow', user: 'pseudo' });
Alerts.push({ type: 'sub',    user: 'pseudo', tier: 2, months: 14, prime: false });
Alerts.push({ type: 'gift',   user: 'pseudo', count: 10, tier: 1 });
Alerts.push({ type: 'bits',   user: 'pseudo', amount: 500, message: 'gg' });
Alerts.push({ type: 'raid',   user: 'pseudo', viewers: 34 });
```

`Alerts.push` empile : deux événements simultanés s'affichent l'un après l'autre.
Champs communs : `user`, `message` (optionnel), `hold` (optionnel, écrase la durée du type).

Côté Twitch, écouter EventSub en WebSocket sur `wss://eventsub.wss.twitch.tv/ws`
et mapper les notifications vers ces appels :

| Abonnement EventSub | Type |
| --- | --- |
| `channel.follow` | `follow` |
| `channel.subscribe` et `channel.subscription.message` | `sub` |
| `channel.subscription.gift` | `gift` |
| `channel.cheer` | `bits` |
| `channel.raid` | `raid` |

## Séquence d'animation

La carte entre et sort d'un seul mouvement (fondu + léger décalage/zoom), via
une transition CSS sur `.bug` (voir `src/styles/_bug.scss`, juste après le
bloc `CHARTE`) — pas de découpe par élément. Quelques détails suivent en
douceur par-dessus :

1. `flap` par caractère à 120 ms, décalage de 26 ms, les volets du pseudo tombent
2. `riseIn` 300 ms à 300 ms, la phrase (`bug__line`)
3. `sheen` 660 ms à 160 ms, le balayage lumineux sur le coupon

`prefers-reduced-motion` supprime le décalage/zoom (garde un simple fondu) et
les détails ci-dessus.
