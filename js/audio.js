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
        if (ctx.state === "suspended") ctx.resume();
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

    var done = false;
    var finish = function () {
      if (done) return;
      done = true;
      if (currentChannel === channel) currentChannel = null;
      if (opts.onEnd) opts.onEnd();
    };

    if (opts.audio && player) {
      var token = ++playerToken;
      var fallback = function () {
        if (token !== playerToken || done) return;   // une autre voix a pris la place
        speakSynth(text, opts, channel, finish);
      };
      player.onended = function () { if (token === playerToken) finish(); };
      player.onerror = fallback;
      try {
        player.src = opts.audio;
        player.currentTime = 0;
        var p = player.play();
        if (p && p.catch) p.catch(fallback);
      } catch (e) { fallback(); }
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

  return {
    speak: speak, stop: stop, ring: ring, stopRing: stopRing,
    setCallActive: setCallActive, canPlay: canPlay, unlock: unlock
  };
})();
