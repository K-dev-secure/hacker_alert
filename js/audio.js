/* =========================================================
   HACKER ALERT — GESTION DU SON (voix + sonnerie)
   ---------------------------------------------------------
   Règles pour éviter les sons qui partent seuls ou en retard :
   1. Les téléphones bloquent le son tant que personne n'a touché
      l'écran. Avant ce premier toucher, on ne lance RIEN (sinon
      tout part d'un coup au premier toucher).
   2. Une nouvelle voix coupe l'ancienne au lieu d'attendre derrière.
   3. La voix d'un appel est prioritaire : pendant un appel,
      le hacker ne parle pas (son sous-titre s'affiche quand même).
   4. La sonnerie n'est programmée que si le son est vraiment actif :
      elle ne s'empile jamais.
   ========================================================= */
window.NovaAudio = (function () {
  "use strict";

  var synth = "speechSynthesis" in window ? window.speechSynthesis : null;
  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null;
  var unlocked = false;
  var callActive = false;
  var ringNodes = [];
  var speakTimer = null;
  var currentChannel = null;

  /* Lecteur des fichiers de voix (audio/fr/*.mp3, audio/en/*.mp3).
     Un seul lecteur pour toute l'appli : une fois débloqué par un toucher,
     il peut jouer les phrases suivantes (obligatoire sur iPhone). */
  var player = typeof Audio !== "undefined" ? new Audio() : null;
  if (player) player.preload = "auto";
  var playerToken = 0;

  /* Un tout petit son muet (fabriqué ici, aucun fichier) pour débloquer le lecteur */
  function silentUrl() {
    var n = 400, buf = new ArrayBuffer(44 + n), v = new DataView(buf);
    function str(o, s) { for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); }
    str(0, "RIFF"); v.setUint32(4, 36 + n, true); str(8, "WAVEfmt ");
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
    str(36, "data"); v.setUint32(40, n, true);
    for (var i = 0; i < n; i++) v.setUint8(44 + i, 128);
    return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
  }

  /* ---------- Premier toucher : on débloque la voix et le son ---------- */
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    if (player) {
      try {
        player.src = silentUrl();
        var p = player.play();
        if (p && p.then) p.then(function () { player.pause(); }).catch(function () { /* rien */ });
      } catch (e) { /* rien */ }
    }
    // Une phrase vide et muette : obligatoire sur iPhone pour pouvoir parler plus tard
    if (synth) {
      try {
        var u = new SpeechSynthesisUtterance(" ");
        u.volume = 0;
        synth.speak(u);
      } catch (e) { /* rien */ }
    }
    if (AC) {
      try {
        ctx = ctx || new AC();
        // Le son est débloqué : la musique de fond démarre
        var ready = ctx.state === "suspended" ? ctx.resume() : Promise.resolve();
        ready.then(musicStart).catch(function () { /* rien */ });
      } catch (e) { ctx = null; }
    }
  }
  ["pointerdown", "touchend", "keydown"].forEach(function (type) {
    document.addEventListener(type, unlock, { capture: true, passive: true });
  });

  function canPlay() {
    if (unlocked) return true;
    // Navigateurs récents : l'écran a-t-il déjà été touché ?
    return !!(navigator.userActivation && navigator.userActivation.hasBeenActive);
  }

  /* ---------- Voix ----------
     opts : { audio (fichier mp3), lang, voice, pitch, rate, channel ("hacker" | "call"), onEnd }
     1. Si un fichier de voix existe (opts.audio), on le joue : voix enregistrée, claire.
     2. Sinon, ou si le fichier ne se lit pas (pas de réseau...), voix du téléphone.
     Renvoie true si la voix a été lancée. */
  function speak(text, opts) {
    opts = opts || {};
    var channel = opts.channel || "hacker";
    if (!canPlay()) return false;
    if (channel === "hacker" && callActive) return false;   // on ne parle pas par-dessus un appel
    if (channel === "hacker" && document.hidden) return false;

    stop();   // la nouvelle voix remplace l'ancienne
    currentChannel = channel;
    duck(true);   // la musique baisse pendant que quelqu'un parle

    var done = false;
    var finish = function () {
      if (done) return;
      done = true;
      if (currentChannel === channel) currentChannel = null;
      duck(false);
      if (opts.onEnd) opts.onEnd();
    };

    if (opts.audio && player) {
      // opts.audio : un fichier, ou une liste de fichiers joués l'un après l'autre
      var files = [].concat(opts.audio);
      var next = 0;
      var token = ++playerToken;
      var fallback = function () {
        if (token !== playerToken || done) return;   // une autre voix a pris la place
        playerToken++;
        speakSynth(text, opts, channel, finish);
      };
      var playNext = function () {
        if (token !== playerToken || done) return;
        if (next >= files.length) { finish(); return; }
        try {
          player.src = files[next++];
          player.currentTime = 0;
          var p = player.play();
          if (p && p.catch) p.catch(fallback);
        } catch (e) { fallback(); }
      };
      player.onended = playNext;
      player.onerror = fallback;
      playNext();
      return true;
    }
    if (!synth) return false;
    speakSynth(text, opts, channel, finish);
    return true;
  }

  /* Voix de synthèse du téléphone (si pas de fichier de voix) */
  function speakSynth(text, opts, channel, finish) {
    if (!synth) { finish(); return; }
    try {
      synth.cancel();
      if (synth.paused) synth.resume();  // Chrome peut rester en pause après un changement d'onglet
    } catch (e) { /* rien */ }

    var u = new SpeechSynthesisUtterance(text);
    u.lang = opts.lang || "fr-FR";
    // Voix du hacker : un peu grave mais claire (0.6 rendait la voix difficile à comprendre)
    u.rate = opts.rate || 0.92;
    u.pitch = opts.pitch != null ? opts.pitch : 0.8;
    if (opts.voice) u.voice = opts.voice;
    u.onend = finish;
    u.onerror = finish;

    // Petit délai : Chrome perd parfois une voix lancée juste après cancel()
    clearTimeout(speakTimer);
    speakTimer = setTimeout(function () {
      try { synth.speak(u); } catch (e) { finish(); }
    }, 60);
  }

  function stop() {
    clearTimeout(speakTimer);
    currentChannel = null;
    playerToken++;   // annule une éventuelle voix de secours en attente
    if (music.ducked) duck(false);
    if (player) {
      player.onended = null;
      player.onerror = null;
      try { player.pause(); } catch (e) { /* rien */ }
    }
    if (synth) { try { synth.cancel(); } catch (e) { /* rien */ } }
  }

  /* ---------- Appel en cours (le hacker se tait) ---------- */
  function setCallActive(on) {
    callActive = !!on;
    if (on && currentChannel === "hacker") stop();
    updateMusicLevel();   // la musique baisse pendant tout l'appel
  }

  /* ---------- Sonnerie du téléphone (bips générés, aucun fichier) ---------- */
  function ring() {
    if (!ctx || ctx.state !== "running") return false;  // son pas encore autorisé : on ne programme rien
    try {
      var t0 = ctx.currentTime;
      [0, 0.45].forEach(function (offset, i) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = i ? 440 : 480;
        gain.gain.setValueAtTime(0.0001, t0 + offset);
        gain.gain.exponentialRampToValueAtTime(0.15, t0 + offset + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + offset + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0 + offset);
        osc.stop(t0 + offset + 0.42);
        ringNodes.push(osc);
        osc.onended = function () {
          var k = ringNodes.indexOf(osc);
          if (k >= 0) ringNodes.splice(k, 1);
        };
      });
    } catch (e) { return false; }
    vibrate([300, 150, 300]);
    return true;
  }

  /* Coupe la sonnerie tout de suite (en décrochant) */
  function stopRing() {
    ringNodes.forEach(function (osc) { try { osc.stop(); } catch (e) { /* rien */ } });
    ringNodes = [];
    vibrate(0);
  }

  /* Vibrer seulement si l'écran a déjà été touché (sinon le navigateur refuse) */
  function vibrate(pattern) {
    if (!navigator.vibrate || !canPlay()) return;
    try { navigator.vibrate(pattern); } catch (e) { /* rien */ }
  }

  /* =========================================================
     MUSIQUE DE FOND (fabriquée ici, aucun fichier, aucun droit d'auteur)
     - un bourdon grave + une petite mélodie qui tourne en boucle
     - plus rapide à l'alerte rouge (5/10) et dans les 30 dernières secondes
     - baisse toute seule quand le hacker ou un appel parle
     ========================================================= */
  /* Musique désactivée pour l'instant : mettre true pour la remettre (bouton 🎵 compris) */
  var MUSIC_ENABLED = false;
  var MUSIC_KEY = "novacorp-music";
  var MOODS = {
    calm:  { bpm: 84,  level: 1 },
    alert: { bpm: 112, level: 1.15 },
    final: { bpm: 144, level: 1.3 }
  };
  // La mineur : la, do, mi, sol, mi, do, sol grave, si grave
  var NOTES = [220, 261.63, 329.63, 392, 329.63, 261.63, 196, 246.94];
  var MUSIC_VOLUME = 0.05;
  var music = { on: readMusicPref(), nodes: null, timer: null, mood: "calm", next: 0, step: 0, ducked: false };

  function readMusicPref() {
    try { return window.localStorage.getItem(MUSIC_KEY) !== "off"; } catch (e) { return true; }
  }

  function musicLevel() {
    var lvl = MUSIC_VOLUME * MOODS[music.mood].level;
    return music.ducked || callActive ? lvl * 0.25 : lvl;
  }

  function updateMusicLevel() {
    if (!music.nodes) return;
    try { music.nodes.master.gain.setTargetAtTime(musicLevel(), ctx.currentTime, 0.25); } catch (e) { /* rien */ }
  }

  function musicStart() {
    if (!MUSIC_ENABLED || !music.on || music.nodes || !ctx || ctx.state !== "running") return;
    try {
      var now = ctx.currentTime;
      var master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(musicLevel(), now + 2.5);   // arrive doucement
      master.connect(ctx.destination);

      // Bourdon : deux notes graves légèrement décalées, filtrées, qui "respirent"
      var filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 280;
      filter.Q.value = 5;
      filter.connect(master);
      var droneGain = ctx.createGain();
      droneGain.gain.value = 0.5;
      droneGain.connect(filter);
      var oscs = [55, 55.7].map(function (f) {
        var o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = f;
        o.connect(droneGain);
        o.start(now);
        return o;
      });
      var lfo = ctx.createOscillator();
      var lfoGain = ctx.createGain();
      lfo.frequency.value = 0.08;
      lfoGain.gain.value = 140;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start(now);
      oscs.push(lfo);

      music.nodes = { master: master, oscs: oscs };
      music.next = now + 0.2;
      music.step = 0;
      music.timer = setInterval(scheduleMusic, 60);
    } catch (e) { music.nodes = null; }
  }

  /* Programme les notes un peu à l'avance (son régulier même si l'écran rame) */
  function scheduleMusic() {
    if (!music.nodes || !ctx) return;
    var beat = 60 / MOODS[music.mood].bpm / 2;   // croches
    while (music.next < ctx.currentTime + 0.25) {
      var t = music.next, s = music.step;
      // Petite note de la mélodie
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = NOTES[s % NOTES.length] * (music.mood === "final" && s % 2 ? 2 : 1);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + beat * 0.9);
      o.connect(g);
      g.connect(music.nodes.master);
      o.start(t);
      o.stop(t + beat);
      // Pulsation grave (comme un cœur) toutes les 4 notes
      if (s % 4 === 0) {
        var k = ctx.createOscillator();
        var kg = ctx.createGain();
        k.type = "sine";
        k.frequency.setValueAtTime(110, t);
        k.frequency.exponentialRampToValueAtTime(40, t + 0.15);
        kg.gain.setValueAtTime(0.9, t);
        kg.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        k.connect(kg);
        kg.connect(music.nodes.master);
        k.start(t);
        k.stop(t + 0.25);
      }
      music.next += beat;
      music.step++;
    }
  }

  function musicStop() {
    clearInterval(music.timer);
    music.timer = null;
    if (!music.nodes) return;
    var n = music.nodes;
    music.nodes = null;
    try {
      n.master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.2);
      n.oscs.forEach(function (o) { o.stop(ctx.currentTime + 1); });
    } catch (e) { /* rien */ }
  }

  /* Allumer / couper la musique (bouton 🎵), choix gardé dans le téléphone */
  function setMusic(on) {
    music.on = !!on;
    try { window.localStorage.setItem(MUSIC_KEY, on ? "on" : "off"); } catch (e) { /* rien */ }
    if (on) musicStart(); else musicStop();
  }

  /* Ambiance : "calm", "alert" (jauge à 5 ou plus), "final" (30 dernières secondes) */
  function setMusicMood(mood) {
    if (!MOODS[mood] || mood === music.mood) return;
    music.mood = mood;
    updateMusicLevel();
  }

  /* La musique baisse quand quelqu'un parle */
  function duck(on) {
    music.ducked = !!on;
    updateMusicLevel();
  }

  /* Écran éteint ou autre onglet : on coupe tout le son, on le remet au retour */
  document.addEventListener("visibilitychange", function () {
    if (!ctx) return;
    try {
      if (document.hidden) ctx.suspend();
      else if (unlocked) ctx.resume().then(musicStart);
    } catch (e) { /* rien */ }
  });

  return {
    speak: speak, stop: stop, ring: ring, stopRing: stopRing,
    setCallActive: setCallActive, canPlay: canPlay, unlock: unlock,
    setMusic: setMusic, setMusicMood: setMusicMood, musicOn: function () { return music.on; },
    musicEnabled: MUSIC_ENABLED
  };
})();
