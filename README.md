# Alertes SkyflyerAviation

Overlay d'alertes Twitch. Projet Bun + Vite, HTML/SCSS/JS vanilla (pas de framework, pas de TypeScript).
Deux polices Google Fonts (Barlow Condensed, IBM Plex Mono), tout le reste est local.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `index.html` | Structure du bandeau + panneau de test |
| `src/styles/main.scss` | Charte, mise en page, séquence d'animation |
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

## Personnaliser

Deux points d'entrée, tous les deux marqués `CHARTE` dans le code.

**Couleurs** dans `src/styles/main.scss`, sur le sélecteur `.bug` :

```css
--hull-900: #04121c;  /* fond du bandeau */
--hull-700: #0b2438;
--hull-500: #12384f;
--paper:    #eef6fb;  /* texte principal */
--dim:      #7fa3ba;  /* texte secondaire */
--accent:   #ffb020;  /* couleur maison */
--accent-ink:#1a0f00; /* texte sur la couleur maison */
--skew:     0deg;     /* -8deg pour la version inclinée */
```

Une couleur d'accent par type juste en dessous, sur `.bug[data-type="..."]`.

**Textes et codes** dans `src/main.js`, objet `TYPES`. Chaque type définit
`code` (3 ou 4 lettres du bloc gauche), `figure`, `unit`, `line`, `tag` et `hold`
(durée d'affichage en ms).

**Son** dans `src/main.js`, objet `MOTIF` : une liste de fréquences par type,
jouées en sinus. Remplacer `chime()` par un `new Audio()` si tu préfères des fichiers.

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

Dans `src/styles/main.scss`, sous le commentaire `Séquence`. L'ordre et les délais :

1. `lifeDraw` 170 ms, la ligne de piste se trace
2. `shutter` 280 ms à 130 ms, le bandeau s'ouvre par le bas
3. `markWipe` 230 ms à 320 ms, le bloc chiffre se découpe
4. `flap` par caractère à 380 ms, décalage de 28 ms, les volets tombent
5. `sheen` 660 ms à 440 ms, le balayage lumineux
6. `riseIn` 320 ms à 560 ms, la phrase et le tag
7. `lifeDrain` sur toute la durée `--hold`

La sortie inverse les découpes. `prefers-reduced-motion` remplace le tout par un fondu.
