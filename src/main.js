import './styles/main.scss';

(function(){
  'use strict';

  var bug    = document.getElementById('bug');
  var codeEl = document.getElementById('code');
  var figure = document.getElementById('figure');
  var unit   = document.getElementById('unit');
  var nameEl = document.getElementById('name');
  var lineEl = document.getElementById('line');
  var noteEl = document.getElementById('note');
  var tagEl  = document.getElementById('tag');

  function pad(n){ n = Number(n) || 0; return n < 10 ? '0' + n : String(n); }

  /* ================================================================
     CHARTE — textes et codes par type d'événement
  ================================================================ */
  var TYPES = {
    follow:{
      code:'ARR', figure:function(){ return '01'; }, unit:function(){ return 'pax'; },
      line:function(){ return 'monte \u00E0 bord'; },
      tag:function(){ return 'NOUVEAU'; },
      hold:4200
    },
    sub:{
      code:'CLS', figure:function(e){ return pad(e.tier || 1); }, unit:function(){ return 'tier'; },
      line:function(e){
        var m = e.months || 1;
        return m > 1 ? 'embarque pour le ' + m + 'e mois d\u2019affil\u00E9e'
                     : 'prend sa place \u00E0 bord pour la premi\u00E8re fois';
      },
      tag:function(e){ return e.prime ? 'PRIME' : ''; },
      hold:5200
    },
    gift:{
      code:'GFT', figure:function(e){ return pad(e.count || 1); },
      unit:function(e){ return (e.count || 1) > 1 ? 'places' : 'place'; },
      line:function(e){
        var c = e.count || 1;
        return 'offre ' + c + ' place' + (c > 1 ? 's' : '') + ' \u00E0 l\u2019\u00E9quipage';
      },
      tag:function(e){ return e.tier ? 'TIER ' + e.tier : ''; },
      hold:5400
    },
    bits:{
      code:'FUEL', figure:function(e){ return e.amount || 100; }, unit:function(){ return 'bits'; },
      line:function(){ return 'fait le plein de kérosène'; },
      tag:function(){ return ''; },
      hold:5000
    },
    raid:{
      code:'FMN', figure:function(e){ return e.viewers || 10; }, unit:function(){ return 'pax'; },
      line:function(){ return 'arrive en formation'; },
      tag:function(){ return 'RAID'; },
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
  function clearTimers(){ timers.forEach(clearTimeout); timers = []; }

  function push(evt){
    if (!evt || !TYPES[evt.type]) return;
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
    bug.style.setProperty('--hold', hold + 'ms');
    codeEl.textContent = cfg.code;
    figure.textContent = cfg.figure(evt);
    unit.textContent   = cfg.unit(evt);
    lineEl.textContent = cfg.line(evt);
    tagEl.textContent  = cfg.tag(evt);
    noteEl.textContent = evt.message || '';
    setName(evt.user || 'anonyme');

    bug.classList.remove('is-in','is-out');
    void bug.offsetWidth;
    bug.classList.add('is-live','is-in');
    chime(evt.type);

    clearTimers();
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

  /* --- son : carillon de cabine --------------------------------- */
  var ctx = null, soundOn = true;
  var MOTIF = {
    follow:[587.33, 880],        /* le "bing bong" de la cabine */
    sub:[698.46, 880, 1174.66],
    gift:[523.25, 698.46, 880],
    bits:[880, 659.25],
    raid:[440, 587.33, 880]
  };
  function chime(type){
    if (!soundOn) return;
    try{
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      var notes = MOTIF[type] || MOTIF.follow;
      var t0 = ctx.currentTime + 0.12;
      notes.forEach(function(f, i){
        var t = t0 + i * 0.16;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.18, t + 0.014);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.52);
        osc.connect(gain).connect(ctx.destination);
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

  if (/[?&]clean=1/.test(location.search)){
    document.documentElement.dataset.mode = 'clean';
  } else {
    setTimeout(function(){ push(sample('follow')); }, 600);
  }
})();
