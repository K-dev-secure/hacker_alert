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

  /* ---------- Premier toucher : on débloque la voix et le son ---------- */
  function unlock() {
    if (unlocked) return;
    unlocked = true;
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
     opts : { lang, voice, pitch, rate, channel ("hacker" | "call"), onEnd }
     Renvoie true si la voix a été lancée. */
  function speak(text, opts) {
    opts = opts || {};
    var channel = opts.channel || "hacker";
    if (!synth || !canPlay()) return false;
    if (channel === "hacker" && callActive) return false;   // on ne parle pas par-dessus un appel
    if (channel === "hacker" && document.hidden) return false;

    clearTimeout(speakTimer);
    try {
      synth.cancel();                    // la nouvelle voix remplace l'ancienne
      if (synth.paused) synth.resume();  // Chrome peut rester en pause après un changement d'onglet
    } catch (e) { /* rien */ }

    var u = new SpeechSynthesisUtterance(text);
    u.lang = opts.lang || "fr-FR";
    u.rate = opts.rate || 0.9;
    u.pitch = opts.pitch != null ? opts.pitch : 0.6;
    if (opts.voice) u.voice = opts.voice;
    var done = false;
    var finish = function () {
      if (done) return;
      done = true;
      if (currentChannel === channel) currentChannel = null;
      if (opts.onEnd) opts.onEnd();
    };
    u.onend = finish;
    u.onerror = finish;

    currentChannel = channel;
    // Petit délai : Chrome perd parfois une voix lancée juste après cancel()
    speakTimer = setTimeout(function () {
      try { synth.speak(u); } catch (e) { finish(); }
    }, 60);
    return true;
  }

  function stop() {
    clearTimeout(speakTimer);
    currentChannel = null;
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
