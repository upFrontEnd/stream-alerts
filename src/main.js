import './styles/main.scss';
import lottie from 'lottie-web';
import followAnimData from './assets/lottie/plus.json';
import subAnimData from './assets/lottie/check.json';
import giftAnimData from './assets/lottie/gifting.json';
import bitsAnimData from './assets/lottie/shining.json';
import raidAnimData from './assets/lottie/radar.json';

(function(){
  'use strict';

  var bug    = document.getElementById('bug');
  var codeEl = document.getElementById('code');
  var figure = document.getElementById('figure');
  var unit   = document.getElementById('unit');
  var nameEl = document.getElementById('name');
  var lineEl = document.getElementById('line');
  var noteEl = document.getElementById('note');
  var iconEl = document.getElementById('icon');

  /* --- visuel animé du bloc bug__icon, par type --------------- */
  /* segment : ne joue que le marqueur "in-reveal" du fichier, pas les
     segments hover/morph qui suivent dans la même timeline */
  var ICON_ANIMS = {
    follow:{ data:followAnimData, segment:[0, 100] },
    sub:{ data:subAnimData },
    gift:{ data:giftAnimData },
    bits:{ data:bitsAnimData },
    raid:{ data:raidAnimData, loop:true } /* balayage continu tant que l'alerte est affichée */
  };
  var iconAnim = null;
  function setIcon(type){
    if (iconAnim){ iconAnim.destroy(); iconAnim = null; }
    iconEl.innerHTML = '';
    var cfg = ICON_ANIMS[type];
    if (!cfg) return;
    iconAnim = lottie.loadAnimation({
      container: iconEl,
      renderer: 'svg',
      loop: !!cfg.loop,
      autoplay: true,
      animationData: cfg.data,
      initialSegment: cfg.segment,
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' }
    });
  }

  function pad(n){ n = Number(n) || 0; return n < 10 ? '0' + n : String(n); }

  /* ================================================================
     CHARTE — textes et codes par type d'événement
  ================================================================ */
  var TYPES = {
    follow:{
      code:'ARR', figure:function(){ return '01'; }, unit:function(){ return 'pax'; },
      line:function(){ return 'vient d\u2019embarquer'; },
      hold:4200
    },
    sub:{
      code:'CLS', figure:function(e){ return pad(e.tier || 1); }, unit:function(){ return 'tier'; },
      line:function(){ return 'rejoint l\u2019\u00E9quipage'; },
      hold:5200
    },
    gift:{
      code:'GFT', figure:function(e){ return pad(e.count || 1); },
      unit:function(e){ return (e.count || 1) > 1 ? 'places' : 'place'; },
      line:function(e){
        var c = e.count || 1;
        return 'offre ' + c + ' abonnement' + (c > 1 ? 's' : '') + '.';
      },
      hold:5400
    },
    bits:{
      code:'FUEL', figure:function(e){ return e.amount || 100; }, unit:function(){ return 'bits'; },
      line:function(){ return 'fait le plein de kérosène'; },
      hold:5000
    },
    raid:{
      code:'FMN', figure:function(e){ return e.viewers || 10; }, unit:function(){ return 'pax'; },
      line:function(){ return 'Rejoint la formation'; },
      hold:5400
    }
  };

  var NOTES = [
    'Vol parfait, merci Sky.',
    'Le posé de tout \u00E0 l\u2019heure \u00E9tait magnifique.',
    'Premi\u00E8re fois ici, je reste.',
    'Direction LFPG ?',
    'On est bien \u00E0 bord.'
  ];

  /* --- volets du nom ------------------------------------------- */
  function setName(text){
    nameEl.textContent = '';
    var chars = String(text).split('');
    for (var i = 0; i < chars.length; i++){
      var s = document.createElement('span');
      s.className = 'ch';
      s.style.setProperty('--i', i);
      s.textContent = chars[i] === ' ' ? '\u00A0' : chars[i];
      nameEl.appendChild(s);
    }
    nameEl.setAttribute('aria-label', text);
  }

  /* --- file d'attente ------------------------------------------ */
  var queue = [], busy = false, timers = [];
  var devMode = /[?&]dev=1/.test(location.search);
  function clearTimers(){ timers.forEach(clearTimeout); timers = []; }

  function push(evt){
    if (!evt || !TYPES[evt.type]) return;
    if (devMode){
      queue = [];
      clearTimers();
      show(evt);
      return;
    }
    queue.push(evt);
    if (!busy) next();
  }
  function next(){
    var evt = queue.shift();
    if (!evt){ busy = false; return; }
    busy = true;
    show(evt);
  }
  function show(evt){
    var cfg  = TYPES[evt.type];
    var hold = evt.hold || cfg.hold;

    bug.dataset.type = evt.type;
    codeEl.textContent = cfg.code;
    figure.textContent = cfg.figure(evt);
    unit.textContent   = cfg.unit(evt);
    lineEl.textContent = cfg.line(evt);
    noteEl.textContent = evt.message || '';
    setName(evt.user || 'anonyme');
    setIcon(evt.type);

    bug.classList.remove('is-in','is-out');
    void bug.offsetWidth;
    bug.classList.add('is-live','is-in');
    if (!devMode) chime(evt.type);

    clearTimers();
    if (devMode) return; /* alerte figée : pas de sortie auto, next() ne joue pas la file */
    timers.push(setTimeout(function(){
      bug.classList.remove('is-in');
      bug.classList.add('is-out');
    }, hold + 600));
    timers.push(setTimeout(function(){
      bug.classList.remove('is-out','is-live');
      next();
    }, hold + 940));
  }

  window.Alerts = { push:push, types:Object.keys(TYPES) };

  /* --- son ------------------------------------------------------- */
  var soundOn = true;
  var ctx = null;
  function getCtx(){
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /* son custom : dépose un fichier src/assets/sound/<type>.mp3, .ogg ou
     .wav (ex. src/assets/sound/follow.ogg) pour remplacer le carillon
     synthétisé de ce type. Absent -> bascule automatiquement sur le
     carillon. import.meta.glob liste les fichiers présents au moment
     du build, donc rien ne casse tant qu'ils ne sont pas tous fournis. */
  var SOUND_URLS = import.meta.glob('./assets/sound/*.{mp3,ogg,wav}', { eager:true, query:'?url', import:'default' });
  var SOUND_EXTS = ['mp3', 'ogg', 'wav'];
  function soundUrl(type){
    for (var i = 0; i < SOUND_EXTS.length; i++){
      var url = SOUND_URLS['./assets/sound/' + type + '.' + SOUND_EXTS[i]];
      if (url) return url;
    }
  }

  /* normalisation : chaque fichier custom est décodé une fois au
     chargement, son pic d'amplitude mesuré, puis rejoué via un gain qui
     ramène ce pic au même niveau que le carillon synthétisé
     (TARGET_PEAK) — pour que fichiers et carillon sortent à un volume
     comparable, quelle que soit la façon dont chaque fichier a été
     mastérisé à l'origine. */
  var TARGET_PEAK = 0.18;
  var MAX_GAIN = 6;
  var soundBuffers = {};
  function loadSoundBuffer(type){
    var url = soundUrl(type);
    if (!url || soundBuffers[type]) return;
    soundBuffers[type] = 'loading';
    fetch(url)
      .then(function(r){ return r.arrayBuffer(); })
      .then(function(data){ return getCtx().decodeAudioData(data); })
      .then(function(buffer){
        var peak = 0;
        for (var ch = 0; ch < buffer.numberOfChannels; ch++){
          var samples = buffer.getChannelData(ch);
          for (var i = 0; i < samples.length; i += 32){
            var v = Math.abs(samples[i]);
            if (v > peak) peak = v;
          }
        }
        soundBuffers[type] = { buffer:buffer, gain: peak > 0 ? Math.min(TARGET_PEAK / peak, MAX_GAIN) : 1 };
      })
      .catch(function(){ soundBuffers[type] = null; });
  }
  Object.keys(TYPES).forEach(loadSoundBuffer);

  function chime(type){
    if (!soundOn) return;
    var entry = soundBuffers[type];
    if (entry && entry !== 'loading'){
      var c = getCtx();
      var src = c.createBufferSource();
      src.buffer = entry.buffer;
      var g = c.createGain();
      g.gain.value = entry.gain;
      src.connect(g).connect(c.destination);
      src.start();
      return;
    }
    synthChime(type);
  }

  /* --- carillon de cabine (synthétisé, fallback) ------------------ */
  var MOTIF = {
    follow:[587.33, 880],        /* le "bing bong" de la cabine */
    sub:[698.46, 880, 1174.66],
    gift:[523.25, 698.46, 880],
    bits:[880, 659.25],
    raid:[440, 587.33, 880]
  };
  function synthChime(type){
    try{
      var c = getCtx();
      var notes = MOTIF[type] || MOTIF.follow;
      var t0 = c.currentTime + 0.12;
      notes.forEach(function(f, i){
        var t = t0 + i * 0.16;
        var osc = c.createOscillator();
        var gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.18, t + 0.014);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.52);
        osc.connect(gain).connect(c.destination);
        osc.start(t);
        osc.stop(t + 0.55);
      });
    } catch(err){ /* pas d'audio, l'alerte reste visuelle */ }
  }

  /* --- panneau de test ------------------------------------------ */
  var NICKS = ['skywalker_lfpb','MarcoPolyfill','luneb','TangoCharlie','cockpit_vue','Nono_le_dev','vol_a_vue','aria_labelled'];
  var pseudo = document.getElementById('pseudo');

  function sample(type){
    var user = (pseudo.value || '').trim() || NICKS[Math.floor(Math.random() * NICKS.length)];
    var evt = { type:type, user:user };
    if (type === 'sub'){ evt.tier = 1 + Math.floor(Math.random() * 3); evt.months = Math.floor(Math.random() * 26); }
    if (type === 'gift'){ evt.count = [1,5,10,25,50][Math.floor(Math.random() * 5)]; evt.tier = 1; }
    if (type === 'bits'){ evt.amount = [100,500,1000,5000][Math.floor(Math.random() * 4)]; }
    if (type === 'raid'){ evt.viewers = 8 + Math.floor(Math.random() * 180); }
    if (Math.random() < 0.5 && type !== 'follow'){
      evt.message = NOTES[Math.floor(Math.random() * NOTES.length)];
    }
    return evt;
  }

  document.querySelectorAll('[data-fire]').forEach(function(b){
    b.addEventListener('click', function(){ push(sample(b.dataset.fire)); });
  });
  document.getElementById('burst').addEventListener('click', function(){
    ['follow','gift','sub','raid'].forEach(function(t){ push(sample(t)); });
  });

  var scene = document.getElementById('scene');
  var bgBtn = document.getElementById('bg');
  var BGS = ['cockpit','ciel','damier'];
  var bgIdx = 0;
  bgBtn.addEventListener('click', function(){
    bgIdx = (bgIdx + 1) % BGS.length;
    scene.dataset.bg = BGS[bgIdx];
    bgBtn.textContent = 'Fond : ' + BGS[bgIdx];
  });

  var sndBtn = document.getElementById('snd');
  sndBtn.addEventListener('click', function(){
    soundOn = !soundOn;
    sndBtn.setAttribute('aria-pressed', String(soundOn));
    sndBtn.textContent = 'Son : ' + (soundOn ? 'activ\u00E9' : 'coup\u00E9');
  });

  var devBtn = document.getElementById('dev');
  function setDevMode(on){
    devMode = on;
    document.documentElement.dataset.dev = devMode ? '1' : '0';
    devBtn.setAttribute('aria-pressed', String(devMode));
    devBtn.textContent = 'Mode dev : ' + (devMode ? 'activ\u00E9' : 'd\u00E9sactiv\u00E9');
    clearTimers();
    queue = [];
    busy = false;
    if (!devMode) bug.classList.remove('is-live','is-in','is-out');
  }
  devBtn.addEventListener('click', function(){ setDevMode(!devMode); });
  if (devMode) setDevMode(true);

  if (/[?&]clean=1/.test(location.search)){
    document.documentElement.dataset.mode = 'clean';
  } else {
    setTimeout(function(){ push(sample('follow')); }, 600);
  }
})();
