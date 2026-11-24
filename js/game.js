/* =========================================================
   HACKER ALERT — CŒUR DU JEU
   Partie sauvegardée, calcul des sanctions, chrono, voix.
   ========================================================= */
window.NovaGame = (function () {
  "use strict";

  var D = window.NOVA_DATA;
  var STORAGE_KEY = "novacorp-game";
  var VOICE_KEY = "novacorp-voice";
  var GAME_SECONDS = 600;
  var ATTACKS_PER_GAME = 6;
  var LEVELS = ["junior", "pro", "expert"];

  /* ---------- Stockage (protégé : navigation privée, etc.) ---------- */
  function read(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function write(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* rien */ }
  }
  function remove(key) {
    try { window.localStorage.removeItem(key); } catch (e) { /* rien */ }
  }

  /* ---------- Partie ---------- */
  var state = null;

  function load() {
    var raw = read(STORAGE_KEY);
    if (!raw) { state = null; return null; }
    try {
      var s = JSON.parse(raw);
      // Une ancienne sauvegarde d'un autre format est ignorée
      if (!s || s.v !== 2 || LEVELS.indexOf(s.level) < 0 || typeof s.endsAt !== "number") { state = null; return null; }
      state = s;
    } catch (e) {
      state = null;
    }
    return state;
  }

  function save() {
    if (state) write(STORAGE_KEY, JSON.stringify(state));
  }

  function newGame(level) {
    var now = Date.now();
    state = {
      v: 2,
      level: LEVELS.indexOf(level) >= 0 ? level : "pro",
      startedAt: now,
      endsAt: now + GAME_SECONDS * 1000,
      gauge: 0,
      attacks: [],          // { card, label, fam, verdict, falseAlarm, cost, detail }
      missedFamilies: [],   // familles déjà ratées (bonus "même erreur")
      voiceDone: [],        // phrases chronométrées déjà dites
      alertDone: false,
      status: "playing",    // playing | won | lost
      endedAt: null
    };
    save();
    return state;
  }

  function clear() {
    state = null;
    remove(STORAGE_KEY);
  }

  function get() { return state; }

  function remainingSeconds() {
    if (!state) return GAME_SECONDS;
    var end = state.status === "playing" ? Date.now() : (state.endedAt || Date.now());
    return Math.max(0, Math.ceil((state.endsAt - end) / 1000));
  }

  function elapsedSeconds() {
    return GAME_SECONDS - remainingSeconds();
  }

  function isPlaying() {
    return !!state && state.status === "playing";
  }

  function cardPlayed(n) {
    if (!state) return false;
    return state.attacks.some(function (a) { return a.card === n; });
  }

  /* ---------- Calcul de la sanction ----------
     verdict    : "right" | "almost" | "wrong"
     sev        : gravité de la carte ou du mini-jeu
     fam        : famille
     falseAlarm : vrai message / situation normale signalé(e)
     Right = 0 · Almost = +1 · Wrong = +gravité · fausse alerte = +1
     Bonus : +1 si la famille a déjà été ratée (jamais pour une fausse alerte)
             +1 si la jauge était déjà à 5 ou plus (sauf Right)
     La jauge s'arrête à 10. */
  function penalty(opts, gaugeBefore, missedFamilies) {
    var res = { base: 0, familyBonus: 0, alertBonus: 0, total: 0 };
    if (opts.verdict === "right") return res;

    if (opts.falseAlarm) res.base = 1;
    else if (opts.verdict === "almost") res.base = 1;
    else res.base = opts.sev;

    if (opts.verdict === "wrong" && !opts.falseAlarm && missedFamilies.indexOf(opts.fam) >= 0) {
      res.familyBonus = 1;
    }
    if (gaugeBefore >= 5) res.alertBonus = 1;

    res.total = res.base + res.familyBonus + res.alertBonus;
    return res;
  }

  /* Applique une attaque jouée à la partie. Renvoie le détail du calcul. */
  function applyAttack(attack) {
    if (!isPlaying()) return null;
    var before = state.gauge;
    var p = penalty(attack, before, state.missedFamilies);
    state.gauge = Math.min(10, before + p.total);

    if (attack.verdict === "wrong" && !attack.falseAlarm && state.missedFamilies.indexOf(attack.fam) < 0) {
      state.missedFamilies.push(attack.fam);
    }

    state.attacks.push({
      card: attack.card || null,
      label: attack.label,
      fam: attack.fam,
      verdict: attack.verdict,
      falseAlarm: !!attack.falseAlarm,
      cost: p.total
    });

    var crossedAlert = before < 5 && state.gauge >= 5;
    checkEnd();
    save();
    return { penalty: p, before: before, after: state.gauge, crossedAlert: crossedAlert };
  }

  /* Fin de partie : jauge à 10, chrono à zéro, ou 6 attaques jouées */
  function checkEnd() {
    if (!isPlaying()) return state ? state.status : null;
    if (state.gauge >= 10 || remainingSeconds() <= 0) {
      state.status = "lost";
    } else if (state.attacks.length >= ATTACKS_PER_GAME) {
      state.status = "won";
    }
    if (state.status !== "playing") {
      state.endedAt = Math.min(Date.now(), state.endsAt);
      save();
    }
    return state.status;
  }

  function score() {
    return state ? 10 - state.gauge : 0;
  }

  /* ---------- Cartes ---------- */
  function findCard(n) {
    for (var i = 0; i < D.CARDS.length; i++) {
      if (D.CARDS[i].n === n) return D.CARDS[i];
    }
    return null;
  }

  /* Meilleure défense selon le niveau (Expert : 2 cartes pour #11, #21, #30) */
  function bestFor(card, level) {
    if (level === "expert" && card.expert) return card.expert.map(D.defence).join(" + ");
    return D.defence(card.best);
  }

  /* Le bouton Almost est-il possible ? */
  function almostAllowed(card, level) {
    if (level === "expert" && card.expert) return true;
    return !!card.ok;
  }

  /* ---------- Voix (synthèse du navigateur) + sous-titres ---------- */
  var subtitleEl = null;
  var subtitleTimer = null;

  function voiceOn() {
    return read(VOICE_KEY) !== "off";
  }

  function setVoice(on) {
    write(VOICE_KEY, on ? "on" : "off");
    if (!on && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  /* Voix dans la langue de l'appli : fr-FR en français, en-GB en anglais */
  var SPEECH_LANG = window.NovaI18n && window.NovaI18n.lang === "fr" ? "fr-FR" : "en-GB";

  function pickVoice() {
    if (!("speechSynthesis" in window)) return null;
    var voices = window.speechSynthesis.getVoices() || [];
    var exact = new RegExp("^" + SPEECH_LANG.replace("-", "[-_]"), "i");
    var same = voices.filter(function (v) { return exact.test(v.lang); });
    if (same.length) return same[0];
    var prefix = new RegExp("^" + SPEECH_LANG.slice(0, 2), "i");
    var close = voices.filter(function (v) { return prefix.test(v.lang); });
    return close.length ? close[0] : null;
  }

  /* speaker : texte affiché avant le sous-titre ("HACKER", nom de l'appelant...) */
  function speak(text, opts) {
    opts = opts || {};
    if (!opts.noSubtitle) showSubtitle(opts.speaker || "HACKER", text, opts.subtitleMs);
    if (!voiceOn() || !("speechSynthesis" in window)) {
      if (opts.onEnd) setTimeout(opts.onEnd, Math.min(8000, 1200 + text.length * 45));
      return;
    }
    try {
      var u = new SpeechSynthesisUtterance(text);
      u.lang = SPEECH_LANG;
      u.rate = opts.rate || 0.9;
      u.pitch = opts.pitch != null ? opts.pitch : 0.6;
      var v = pickVoice();
      if (v) u.voice = v;
      if (opts.onEnd) {
        var done = false;
        var finish = function () { if (!done) { done = true; opts.onEnd(); } };
        u.onend = finish;
        u.onerror = finish;
        // Filet de sécurité si le navigateur ne déclenche jamais "onend"
        setTimeout(finish, 2000 + text.length * 90);
      }
      window.speechSynthesis.speak(u);
    } catch (e) {
      if (opts.onEnd) setTimeout(opts.onEnd, 1500);
    }
  }

  function stopSpeaking() {
    if ("speechSynthesis" in window) {
      try { window.speechSynthesis.cancel(); } catch (e) { /* rien */ }
    }
  }

  function showSubtitle(speaker, text, ms) {
    if (!subtitleEl) subtitleEl = document.getElementById("subtitle");
    if (!subtitleEl) return;
    subtitleEl.querySelector(".subtitle__who").textContent = speaker;
    subtitleEl.querySelector(".subtitle__text").textContent = text;
    subtitleEl.hidden = false;
    clearTimeout(subtitleTimer);
    subtitleTimer = setTimeout(function () { subtitleEl.hidden = true; }, ms || Math.max(4500, text.length * 85));
  }

  function hideSubtitle() {
    if (!subtitleEl) subtitleEl = document.getElementById("subtitle");
    if (subtitleEl) subtitleEl.hidden = true;
    clearTimeout(subtitleTimer);
  }

  /* Les voix se chargent parfois en retard (Chrome) */
  if ("speechSynthesis" in window) {
    try { window.speechSynthesis.getVoices(); } catch (e) { /* rien */ }
  }

  /* Phrases chronométrées : à 2, 4, 6 et 8 minutes. Renvoie la phrase à dire, ou null. */
  function dueHackerLine() {
    if (!isPlaying()) return null;
    var elapsed = elapsedSeconds();
    for (var i = 0; i < D.HACKER.timed.length; i++) {
      var at = (i + 1) * 120;
      if (elapsed >= at && state.voiceDone.indexOf(i) < 0) {
        state.voiceDone.push(i);
        save();
        // Après un rechargement tardif, on ne rejoue pas une vieille phrase
        if (elapsed - at <= 15) return D.HACKER.timed[i];
      }
    }
    return null;
  }

  function markAlertSpoken() {
    if (!state || state.alertDone) return false;
    state.alertDone = true;
    save();
    return true;
  }

  return {
    GAME_SECONDS: GAME_SECONDS,
    ATTACKS_PER_GAME: ATTACKS_PER_GAME,
    load: load, save: save, newGame: newGame, clear: clear, get: get,
    remainingSeconds: remainingSeconds, elapsedSeconds: elapsedSeconds,
    isPlaying: isPlaying, cardPlayed: cardPlayed,
    penalty: penalty, applyAttack: applyAttack, checkEnd: checkEnd, score: score,
    findCard: findCard, bestFor: bestFor, almostAllowed: almostAllowed,
    voiceOn: voiceOn, setVoice: setVoice, speak: speak, stopSpeaking: stopSpeaking,
    showSubtitle: showSubtitle, hideSubtitle: hideSubtitle,
    dueHackerLine: dueHackerLine, markAlertSpoken: markAlertSpoken
  };
})();
