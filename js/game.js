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
      usedGreen: [],        // cartes vertes déjà jouées (Pro et Expert)
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
      cost: p.total,
      played: attack.played || null,   // carte(s) verte(s) jouée(s)
      best: attack.best || null,       // meilleure défense (pour le débrief)
      lesson: attack.lesson || null    // explication (pour le débrief)
    });

    // Cartes vertes usées (sauf au niveau Junior, et sauf "It's safe!" toujours disponible)
    if (state.level !== "junior" && attack.played) {
      if (!state.usedGreen) state.usedGreen = [];
      attack.played.forEach(function (name) {
        if (name !== "It's safe!" && state.usedGreen.indexOf(name) < 0) state.usedGreen.push(name);
      });
    }

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

  /* Combien de cartes vertes faut-il poser ? (2 pour #11, #21, #30 au niveau Expert) */
  function picksNeeded(card, level) {
    return level === "expert" && card.expert ? 2 : 1;
  }

  /* ---------- L'appli juge toute seule ----------
     picks : noms des cartes vertes posées par l'équipe.
     Renvoie { verdict, falseAlarm }. */
  function judgeCard(card, level, picks) {
    picks = picks || [];
    // Carte "vrai message" : seule "It's safe!" est juste ; toute autre carte = fausse alerte
    if (card.real) {
      return picks.indexOf("It's safe!") >= 0 && picks.length === 1
        ? { verdict: "right", falseAlarm: false }
        : { verdict: "wrong", falseAlarm: true };
    }
    // Expert, attaque à 2 cartes : les 2 = Right, une seule des 2 = Almost, aucune = Wrong
    if (level === "expert" && card.expert) {
      var good = card.expert.filter(function (name) { return picks.indexOf(name) >= 0; }).length;
      if (good === 2) return { verdict: "right", falseAlarm: false };
      if (good === 1) return { verdict: "almost", falseAlarm: false };
      return { verdict: "wrong", falseAlarm: false };
    }
    var pick = picks[0];
    if (pick === card.best) return { verdict: "right", falseAlarm: false };
    if (card.ok && pick === card.ok) return { verdict: "almost", falseAlarm: false };
    return { verdict: "wrong", falseAlarm: false };
  }

  /* Carte verte déjà jouée ? ("It's safe!" reste toujours disponible) */
  function greenUsed(name) {
    if (!state || state.level === "junior" || name === "It's safe!") return false;
    return (state.usedGreen || []).indexOf(name) >= 0;
  }

  /* Numéro imprimé sur une carte verte : 1 à 12, et 0 pour "It's safe!" */
  function greenNumber(name) {
    return name === "It's safe!" ? 0 : D.DEFENCES.indexOf(name) + 1;
  }
  function greenName(num) {
    return num === 0 ? "It's safe!" : D.DEFENCES[num - 1] || null;
  }

  /* ---------- Le téléphone propose les défenses ----------
     Junior : 2 choix · Pro : 3 · Expert : 4, et toujours "It's safe!" (n°0) en plus.
     - la meilleure défense si elle est encore disponible, sinon la défense acceptable ;
       Expert #11, #21, #30 : les 2 bonnes cartes ;
     - les autres choix : des pièges tirés au hasard parmi les cartes encore disponibles ;
     - ordre mélangé. Renvoie les numéros des cartes vertes. */
  var CHOICES = { junior: 2, pro: 3, expert: 4 };
  function proposeDefences(card, level, practice) {
    var count = CHOICES[level] || 3;
    var free = function (name) { return practice || !greenUsed(name); };
    var pool = D.DEFENCES.slice(0, 12).filter(free);
    var chosen = [];
    var add = function (name) {
      if (name && name !== "It's safe!" && pool.indexOf(name) >= 0 && chosen.indexOf(name) < 0) chosen.push(name);
    };
    if (level === "expert" && card.expert) card.expert.forEach(add);
    else if (!card.real) {
      if (free(card.best)) add(card.best);
      else if (card.ok) add(card.ok);
    }
    var traps = shuffle(pool.filter(function (name) { return chosen.indexOf(name) < 0; }));
    while (chosen.length < count && traps.length) chosen.push(traps.shift());
    chosen.push("It's safe!");
    return shuffle(chosen).map(greenNumber);
  }

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  /* ---------- Voix (synthèse du navigateur) + sous-titres ---------- */
  var subtitleEl = null;
  var subtitleTimer = null;

  function voiceOn() {
    return read(VOICE_KEY) !== "off";
  }

  function setVoice(on) {
    write(VOICE_KEY, on ? "on" : "off");
    if (!on) window.NovaAudio.stop();
  }

  /* Voix dans la langue de l'appli : fr-FR en français, en-GB en anglais */
  var SPEECH_LANG = window.NovaI18n && window.NovaI18n.lang === "fr" ? "fr-FR" : "en-GB";

  /* Choisit la voix la plus naturelle du téléphone :
     les voix "Natural", "Neural", "Online", "Google", "Premium", "Enhanced" sont bien plus claires. */
  var GOOD_VOICE = /natural|neural|online|google|premium|enhanced|siri|amélie|amelie|thomas|denise|henri|eloise|daniel|libby|sonia|ryan/i;
  function voiceScore(v) {
    var score = 0;
    if (new RegExp("^" + SPEECH_LANG.replace("-", "[-_]"), "i").test(v.lang)) score += 10;
    else if (new RegExp("^" + SPEECH_LANG.slice(0, 2), "i").test(v.lang)) score += 5;
    else return -1;
    if (GOOD_VOICE.test(v.name)) score += 4;
    if (/compact|espeak/i.test(v.name)) score -= 3;
    if (v.localService === false) score += 1;   // voix en ligne : souvent plus naturelle
    return score;
  }
  function pickVoice() {
    if (!("speechSynthesis" in window)) return null;
    var voices = window.speechSynthesis.getVoices() || [];
    var best = null, bestScore = -1;
    voices.forEach(function (v) {
      var sc = voiceScore(v);
      if (sc > bestScore) { best = v; bestScore = sc; }
    });
    return best;
  }

  /* Parle (voix gérée par js/audio.js) et affiche le sous-titre.
     opts : speaker (nom affiché), channel ("hacker" par défaut, ou "call"),
            pitch, rate, noSubtitle, onEnd */
  var lastSpeech = null;   // pour le bouton "Réécouter"

  function speak(text, opts) {
    opts = opts || {};
    lastSpeech = { text: text, opts: opts };
    if (!opts.noSubtitle) showSubtitle(opts.speaker || "HACKER", text, opts.subtitleMs);
    var started = voiceOn() && window.NovaAudio.speak(text, {
      audio: opts.audio || null,
      lang: SPEECH_LANG,
      voice: pickVoice(),
      pitch: opts.pitch,
      rate: opts.rate,
      channel: opts.channel || "hacker",
      onEnd: opts.onEnd
    });
    // Pas de voix (coupée, pas encore autorisée...) : le sous-titre suffit
    if (!started && opts.onEnd) setTimeout(opts.onEnd, Math.min(8000, 1200 + text.length * 45));
    return started;
  }

  function stopSpeaking() {
    window.NovaAudio.stop();
  }

  /* Réécouter la dernière phrase (le bouton est un toucher : le son est autorisé) */
  function replay() {
    if (!lastSpeech) return;
    var o = {};
    Object.keys(lastSpeech.opts).forEach(function (k) { o[k] = lastSpeech.opts[k]; });
    o.onEnd = null;
    if (o.channel === "call") o.noSubtitle = true;
    speak(lastSpeech.text, o);
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
  /* ---------- Fichiers de voix enregistrés (audio/fr ou audio/en) ----------
     Générés gratuitement avec Piper (voir tools/). Clés : hacker-start,
     hacker-timed-0..3, hacker-alert, hacker-win, hacker-lose, call-0..7 */
  var AUDIO_LANG = window.NovaI18n && window.NovaI18n.lang === "en" ? "en" : "fr";
  function audioFile(key) {
    return "audio/" + AUDIO_LANG + "/" + key + ".mp3";
  }

  /* Phrase du hacker avec sa voix enregistrée.
     key peut être une liste : les fichiers sont joués l'un après l'autre. */
  function speakLine(key, text) {
    var files = [].concat(key).map(audioFile);
    return speak(text, { audio: files.length === 1 ? files[0] : files });
  }

  /* Phrases chronométrées : renvoie { key, text } ou null */
  function dueHackerLine() {
    if (!isPlaying()) return null;
    var elapsed = elapsedSeconds();
    for (var i = 0; i < D.HACKER.timed.length; i++) {
      var at = (i + 1) * 120;
      if (elapsed >= at && state.voiceDone.indexOf(i) < 0) {
        state.voiceDone.push(i);
        save();
        // Après un rechargement tardif, on ne rejoue pas une vieille phrase
        if (elapsed - at <= 15) return { key: "hacker-timed-" + i, text: D.HACKER.timed[i] };
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
    findCard: findCard, bestFor: bestFor, picksNeeded: picksNeeded, judgeCard: judgeCard, greenUsed: greenUsed,
    greenNumber: greenNumber, greenName: greenName, proposeDefences: proposeDefences,
    voiceOn: voiceOn, setVoice: setVoice, speak: speak, stopSpeaking: stopSpeaking, replay: replay,
    audioFile: audioFile, speakLine: speakLine,
    showSubtitle: showSubtitle, hideSubtitle: hideSubtitle,
    dueHackerLine: dueHackerLine, markAlertSpoken: markAlertSpoken
  };
})();
