/* =========================================================
   HACKER ALERT — L'APPLI (écrans, pavé, jugement, débrief)
   Adresses (QR "Start" de la boîte et anciens QR imprimés : ne jamais changer) :
   ?c=start · ?c=trap · ?c=password · ?c=desk · ?c=ransom
   ?c=call · ?c=link · ?c=practice

   LE TÉLÉPHONE EST LE MAÎTRE DU JEU : avec la voix du hacker,
   il mène chaque tour, propose les défenses possibles, juge,
   et dit où mettre le pion papier. Il n'y a pas de maître du jeu humain.
   ========================================================= */
(function () {
  "use strict";

  var D = window.NOVA_DATA;
  var G = window.NovaGame;
  var I = window.NovaI18n;
  var t = I.t;
  var $ = function (id) { return document.getElementById(id); };
  var QR_KEYS = ["trap", "password", "desk", "ransom", "call", "link"];
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var current = null;        // écran affiché
  var typed = "";            // numéro tapé sur le pavé
  var shownCard = null;      // carte affichée
  var picks = [];            // cartes vertes choisies
  var offered = [];          // numéros des cartes vertes proposées pour cette carte rouge
  var TURN = D.HACKER.turn;  // phrases de chaque tour (affichées dans la langue de l'écran)
  var DV = window.NOVA_DATA_EN || D;   // la voix parle toujours anglais (English Game)
  var TV = DV.HACKER.turn;   // phrases dites par la voix
  var pendingQ = null;       // question de suivi à poser après le résultat
  var resultInGame = false;
  var practiceLevel = "junior";
  var cardPractice = false;  // carte rouge jouée en entraînement (sans partie)
  var mgContext = null;      // { inGame, card, practice, scannedWithoutGame }
  var lastResultEnded = false;
  var practiceMode = false;
  var returnTo = "home";     // écran où revenir après la fiche des règles ou le glossaire

  /* Traduit tous les textes fixes de la page */
  I.apply(document);

  /* ---------- Écrans ---------- */
  function show(name) {
    Array.prototype.forEach.call(document.querySelectorAll(".screen"), function (s) {
      s.hidden = s.id !== "screen-" + name;
    });
    current = name;
    var practicing = (mgContext && !mgContext.inGame) || cardPractice;
    var inGame = G.isPlaying() && (name === "game" || ((name === "minigame" || name === "result" || name === "question") && !practicing));
    $("hud").hidden = !inGame;
    document.body.classList.toggle("is-ingame", inGame);
    var st = G.get();
    $("levelChip").hidden = !inGame;
    if (st) $("levelChip").textContent = st.level.charAt(0).toUpperCase() + st.level.slice(1);
    window.scrollTo(0, 0);
    updateHud();
  }

  function skulls(n) { return new Array(n + 1).join("💀"); }

  function makeEl(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* =========================================================
     CHRONO + JAUGE (mis à jour 4 fois par seconde)
     ========================================================= */
  var hudCells = $("hudCells");
  for (var i = 1; i <= 10; i++) {
    hudCells.appendChild(makeEl("span", "hud__cell hud__cell--" + (i <= 2 ? "g" : i <= 4 ? "o" : "r")));
  }

  function formatTime(s) {
    var m = Math.floor(s / 60), r = s % 60;
    return (m < 10 ? "0" : "") + m + ":" + (r < 10 ? "0" : "") + r;
  }

  function updateHud() {
    var st = G.get();
    if (!st) return;
    var left = G.remainingSeconds();
    $("hudTimer").textContent = formatTime(left);
    $("hudLabel").textContent = t("hud.pawn", { n: st.gauge });
    Array.prototype.forEach.call(hudCells.children, function (cell, idx) {
      cell.classList.toggle("is-on", idx < st.gauge);
    });
    $("hudCount").textContent = st.attacks.length + "/" + G.ATTACKS_PER_GAME;
    var playing = G.isPlaying();
    document.body.classList.toggle("is-alert", playing && st.gauge >= 5);
    document.body.classList.toggle("is-final", playing && left <= 30);
    // La musique accélère à l'alerte rouge et dans les 30 dernières secondes
    NovaAudio.setMusicMood(!playing ? "calm" : left <= 30 ? "final" : st.gauge >= 5 ? "alert" : "calm");
  }

  /* ---------- L'écran reste allumé pendant la partie (téléphone posé sur la table) ---------- */
  var wakeLock = null;
  function keepScreenOn() {
    if (!("wakeLock" in navigator) || wakeLock || document.hidden || !G.isPlaying()) return;
    navigator.wakeLock.request("screen").then(function (lock) {
      wakeLock = lock;
      lock.addEventListener("release", function () { wakeLock = null; });
    }).catch(function () { /* refusé (batterie faible...) : pas grave */ });
  }
  function releaseScreen() {
    if (wakeLock) { try { wakeLock.release(); } catch (e) { /* rien */ } wakeLock = null; }
  }
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) { keepScreenOn(); updateHud(); }
  });

  function tick() {
    if (!G.isPlaying()) { if (wakeLock) releaseScreen(); return; }
    keepScreenOn();
    updateHud();
    var line = G.dueHackerLine();
    if (line) G.speakLine(line.key, line.text);
    if (G.remainingSeconds() <= 0) {
      G.checkEnd();
      // Un entraînement en cours n'est pas interrompu
      var practicing = (mgContext && !mgContext.inGame) || cardPractice;
      if (practicing && (current === "minigame" || current === "result" || current === "game")) return;
      Minigames.abort();
      G.stopSpeaking();
      goToEnd();
    }
  }
  setInterval(tick, 250);

  /* =========================================================
     BARRE DU HAUT : langue + voix ; sous-titres : réécouter
     ========================================================= */
  $("langBtn").addEventListener("click", function () {
    I.setLang(I.lang === "fr" ? "en" : "fr");
    G.stopSpeaking();
    // On recharge la page : la partie en cours est gardée dans le téléphone
    window.location.href = window.location.pathname + (practiceMode ? "?c=practice" : "");
  });

  function renderVoiceBtn() {
    var on = G.voiceOn();
    $("voiceBtn").textContent = on ? "🔊" : "🔇";
    $("voiceBtn").setAttribute("aria-pressed", on ? "true" : "false");
    $("voiceBtn").setAttribute("aria-label", t(on ? "voice.on" : "voice.off"));
    $("voiceBtn").title = t(on ? "voice.on" : "voice.off");
  }
  $("voiceBtn").addEventListener("click", function () {
    G.setVoice(!G.voiceOn());
    renderVoiceBtn();
  });
  renderVoiceBtn();

  $("subReplay").addEventListener("click", function () { G.replay(); });

  /* ---------- Musique de fond (bouton 🎵) ---------- */
  function renderMusicBtn() {
    var on = NovaAudio.musicOn();
    $("musicBtn").setAttribute("aria-pressed", on ? "true" : "false");
    $("musicBtn").setAttribute("aria-label", t(on ? "music.on" : "music.off"));
    $("musicBtn").title = t(on ? "music.on" : "music.off");
  }
  $("musicBtn").addEventListener("click", function () {
    NovaAudio.setMusic(!NovaAudio.musicOn());
    renderMusicBtn();
  });
  renderMusicBtn();
  $("musicBtn").hidden = !NovaAudio.musicEnabled;   // pas de bouton 🎵 tant que la musique est désactivée

  /* =========================================================
     ACCUEIL
     ========================================================= */
  function showHome() {
    var st = G.get();
    $("resumeBox").hidden = !(st && st.status === "playing");
    show("home");
  }

  $("levelForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var st = G.get();
    if (st && st.status === "playing" && !window.confirm(t("confirm.newGame"))) return;
    var level = (new FormData(e.target)).get("level") || "pro";
    G.newGame(level);
    cardPractice = false;
    resetPad();
    G.speakLine(["hacker-start", "guide-draw"], DV.HACKER.start + " " + TV.draw);
    show("game");
  });

  $("resumeBtn").addEventListener("click", function () { cardPractice = false; resetPad(); show("game"); });
  $("discardBtn").addEventListener("click", function () {
    G.clear();
    $("resumeBox").hidden = true;
    document.body.classList.remove("is-alert", "is-final");
  });

  /* ---------- Fiche des règles et glossaire : on revient là où on était ---------- */
  function goBack() {
    if (returnTo === "game" && G.isPlaying() && !cardPractice) show("game");
    else if (returnTo === "end") show("end");
    else if (returnTo === "rules") show("rules");
    else if (practiceMode) show("practice");
    else showHome();
  }
  Array.prototype.forEach.call(document.querySelectorAll("[data-open-rules]"), function (btn) {
    btn.addEventListener("click", function () { returnTo = current || "home"; show("rules"); });
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-open-glossary]"), function (btn) {
    btn.addEventListener("click", function () {
      if (current !== "rules") returnTo = current || "home";
      else returnTo = "rules";
      $("gloSearch").value = "";
      renderGlossary("");
      show("glossary");
    });
  });
  $("rulesBack").addEventListener("click", function () {
    if (returnTo === "rules") returnTo = "home";
    goBack();
  });
  $("gloBack").addEventListener("click", goBack);

  /* =========================================================
     GLOSSAIRE ANGLAIS / FRANÇAIS
     ========================================================= */
  function normalize(s) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }
  function renderGlossary(filter) {
    var list = $("gloList");
    list.innerHTML = "";
    var f = normalize(filter || "");
    D.GLOSSARY.forEach(function (g) {
      if (f && normalize(g.en + " " + g.fr + " " + g.def).indexOf(f) < 0) return;
      var item = makeEl("div", "glossary__item");
      var dt = makeEl("dt", "glossary__term");
      dt.appendChild(makeEl("span", "glossary__en", g.en));
      dt.appendChild(makeEl("span", "glossary__fr", g.fr));
      item.appendChild(dt);
      item.appendChild(makeEl("dd", "glossary__def", g.def));
      list.appendChild(item);
    });
    if (!list.children.length) list.appendChild(makeEl("p", "glossary__empty", t("glo.empty")));
  }
  $("gloSearch").addEventListener("input", function () { renderGlossary(this.value); });
  $("gloSearch").setAttribute("placeholder", t("glo.placeholder"));

  /* =========================================================
     OÙ SIGNALER (France) : affiché dans la fiche et le débrief
     ========================================================= */
  Array.prototype.forEach.call(document.querySelectorAll("[data-report-list]"), function (ul) {
    D.REPORT.forEach(function (r) {
      var li = makeEl("li", "report__item");
      var name;
      if (r.url) {
        name = makeEl("a", "report__name", r.name);
        name.href = r.url;
        name.target = "_blank";
        name.rel = "noopener";
      } else {
        name = makeEl("span", "report__name", r.name);
      }
      li.appendChild(name);
      li.appendChild(makeEl("span", "report__what", r.what));
      ul.appendChild(li);
    });
  });

  /* =========================================================
     PAVÉ : taper le numéro de la carte rouge
     ========================================================= */
  function resetPad() {
    typed = "";
    shownCard = null;
    picks = [];
    $("padNumber").textContent = "—";
    $("padMsg").textContent = "";
    $("pad").hidden = cardPractice;
    $("cardPanel").hidden = true;
    $("qrPanel").hidden = true;
    $("gameLinks").hidden = cardPractice;
  }

  function padMessage(text) {
    $("padMsg").textContent = text;
  }

  $("padKeys").addEventListener("click", function (e) {
    var btn = e.target.closest("button");
    if (!btn) return;
    var key = btn.getAttribute("data-key");
    padMessage("");
    if (key === "del") typed = typed.slice(0, -1);
    else if (key === "ok") return openCard();
    else if (typed.length < 2) typed = (typed + key).replace(/^0+/, "");
    $("padNumber").textContent = typed || "—";
  });

  /* Clavier physique (ordinateur) */
  document.addEventListener("keydown", function (e) {
    if (current !== "game") return;
    if (!$("cardPanel").hidden && !$("gpConfirm").hidden) {
      if (e.key === "Enter") { e.preventDefault(); $("gpYes").click(); }
      else if (e.key === "Escape" || e.key === "Backspace") { e.preventDefault(); $("gpNo").click(); }
      return;
    }
    var keys = !$("pad").hidden ? $("padKeys") : !$("cardPanel").hidden ? $("gpKeys") : null;
    if (!keys) return;
    if (/^[0-9]$/.test(e.key)) keys.querySelector("[data-key='" + e.key + "']").click();
    else if (e.key === "Backspace") keys.querySelector("[data-key='del']").click();
    else if (e.key === "Enter") { e.preventDefault(); keys.querySelector("[data-key='ok']").click(); }
  });

  function openCard() {
    var n = parseInt(typed, 10);
    var card = n ? G.findCard(n) : null;
    if (!card) { padMessage(t("pad.invalid")); return; }
    var lvl = G.get().level;
    if (!G.inDeck(n, lvl)) { padMessage(t(lvl === "expert" ? "pad.expertDeck" : "pad.standardDeck")); return; }
    if (G.cardPlayed(n)) { padMessage(t("pad.played", { n: n })); return; }
    if (card.qr) {
      shownCard = card;
      $("pad").hidden = true;
      var m = D.MINIGAMES[card.qr];
      $("qrName").textContent = "#" + n + " · " + (card.title || m.name) + " " + skulls(m.sev);
      $("qrPanel").hidden = false;
      $("qrOpen").focus();
      return;
    }
    showCardPanel(card, G.get().level);
  }

  /* =========================================================
     CARTE ROUGE : la situation, SANS la réponse, puis le choix
     de la carte verte. C'est l'appli qui juge.
     ========================================================= */
  function showCardPanel(card, level) {
    shownCard = card;
    currentQ = null;
    picks = [];
    $("cpRead").textContent = t("card.read");
    $("cpBack").hidden = false;
    $("pad").hidden = true;
    $("qrPanel").hidden = true;
    $("gameLinks").hidden = cardPractice;   // pas de "Abandonner la partie" pendant un entraînement
    $("cpNum").textContent = "#" + card.n;
    $("cpFam").textContent = D.FAMILIES[card.fam];
    $("cpSev").textContent = skulls(card.sev);
    $("cpSev").setAttribute("aria-label", t("card.sev", { n: card.sev }));
    $("cpTitle").textContent = card.title || "";
    $("cpText").textContent = card.text;
    $("cpText").hidden = true;          // l'équipe lit la carte papier à voix haute
    $("cpShowText").hidden = false;

    // Indice : seulement au niveau Junior et en entraînement
    var hintAllowed = level === "junior" || cardPractice;
    $("cpHintBtn").hidden = !hintAllowed;
    $("cpHint").hidden = true;
    $("cpHint").textContent = "💡 " + D.FAMILY_INFO[card.fam].hint;

    var need = G.picksNeeded(card, level);
    // Le téléphone propose les défenses (2, 3 ou 4 selon le niveau, + "It's safe!")
    offered = G.proposeDefences(card, level, cardPractice);
    renderChoices();
    $("pickTitle").textContent = t(need === 2 ? "pick.title2" : "pick.title", { list: choiceList() });
    buildGreenPad(need);
    $("cardPanel").hidden = false;
    // ... et le dit à voix haute : "Choose your defence: card 9, card 3 or card 0"
    speakChoices(need, [], []);
  }

  /* La voix dit les numéros proposés (jamais les noms des cartes vertes) */
  function speakChoices(need, keys, texts) {
    keys.push(need === 2 ? "guide-choose2" : "guide-choose");
    var said = [];
    offered.forEach(function (num, k) {
      if (k === offered.length - 1 && k > 0) { keys.push("guide-or"); said.push(TV.or); }
      keys.push("guide-card-" + num);
      said.push(TV.card.replace("{n}", num));
    });
    texts.push((need === 2 ? TV.choose2 : TV.choose) + " " + said.join(" ").replace(/(\d) (card|carte)/g, "$1, $2") + ".");
    G.speakLine(keys, texts.join(" "));
  }

  /* "card 9, card 3 or card 0" */
  function choiceList() {
    var names = offered.map(function (num) { return t("pick.card", { n: num }); });
    return names.length < 2 ? names.join("") : names.slice(0, -1).join(", ") + t("pick.or") + names[names.length - 1];
  }

  function renderChoices() {
    var ul = $("gpChoices");
    ul.innerHTML = "";
    offered.forEach(function (num) {
      var li = makeEl("li", "choice" + (num === 0 ? " choice--safe" : ""));
      li.appendChild(makeEl("span", "choice__num", String(num)));
      ul.appendChild(li);
    });
  }

  $("cpShowText").addEventListener("click", function () {
    $("cpText").hidden = false;
    this.hidden = true;
  });

  $("cpHintBtn").addEventListener("click", function () {
    $("cpHint").hidden = false;
    this.hidden = true;
  });

  /* =========================================================
     CARTE VERTE : on tape le NUMÉRO imprimé sur la carte posée
     (1 à 12, et 0 pour "It's safe!"). L'appli n'affiche jamais les
     noms des cartes vertes : il faut les cartes papier pour jouer.
     ========================================================= */
  var slots = [];   // numéros tapés (texte), 1 case ou 2 en Expert
  var slot = 0;     // case en cours
  var need = 1;

  function greenName(num) { return G.greenName(num); }

  function buildGreenPad(n) {
    need = n;
    slots = [];
    for (var k = 0; k < need; k++) slots.push("");
    slot = 0;
    $("gpMsg").textContent = "";
    showConfirm(false);
    renderSlots();
  }

  /* Problème avec le numéro de la case idx ? (renvoie le message, ou "") */
  function slotError(v, idx) {
    if (v === "") return "";
    var num = parseInt(v, 10);
    if (isNaN(num) || num > G.greensFor(shownCard)) return t("gp.invalid", { max: G.greensFor(shownCard) });
    if (!cardPractice && !currentQ && G.greenUsed(greenName(num))) return t("gp.used", { n: num });
    if (offered.indexOf(num) < 0) return t("gp.notOffered", { n: num });
    for (var j = 0; j < slots.length; j++) {
      if (j !== idx && slots[j] !== "" && parseInt(slots[j], 10) === num) return t("gp.twice");
    }
    return "";
  }

  function allValid() {
    return slots.every(function (v, i) { return v !== "" && !slotError(v, i); });
  }

  function renderSlots() {
    var box = $("gpSlots");
    box.innerHTML = "";
    slots.forEach(function (v, i) {
      var cell = makeEl("span", "greenpad__slot" + (i === slot ? " is-active" : "") + (v !== "" && !slotError(v, i) ? " is-ok" : ""));
      cell.appendChild(makeEl("span", "greenpad__hash", t("gp.hash")));
      cell.appendChild(makeEl("span", "greenpad__num", v === "" ? "—" : v));
      box.appendChild(cell);
    });
    var ok = allValid();
    $("pickValidate").disabled = !ok;
    $("pickValidate").textContent = ok
      ? t("pick.validateWith", { c: slots.map(function (v) { return t("pick.card", { n: parseInt(v, 10) }); }).join(" + ") })
      : t("pick.validate");
  }

  $("gpKeys").addEventListener("click", function (e) {
    var btn = e.target.closest("button");
    if (!btn || !shownCard) return;
    var key = btn.getAttribute("data-key");
    if (key === "del") {
      if (slots[slot] === "" && slot > 0) slot--;
      slots[slot] = slots[slot].slice(0, -1);
    } else if (key === "ok") {
      var err = slotError(slots[slot], slot);
      if (slots[slot] === "" || err) {
        $("gpMsg").textContent = err || t("gp.empty");
        return;
      }
      if (slot < need - 1) slot++;           // Expert : on passe à la 2e carte
      else if (allValid()) { showConfirm(true); return; }
    } else {
      var v = slots[slot] === "0" ? key : slots[slot] + key;
      if (v.length > 2) v = key;             // on recommence le nombre
      slots[slot] = v;
    }
    $("gpMsg").textContent = slotError(slots[slot], slot);
    renderSlots();
  });

  $("pickValidate").addEventListener("click", function () {
    if (!shownCard || !allValid()) return;
    showConfirm(true);
  });

  /* ---------- Confirmation : "Card 9 · Call back to check. Confirm?" ---------- */
  function showConfirm(on) {
    $("gpConfirm").hidden = !on;
    $("greenpad").hidden = on;
    $("pickValidate").hidden = on;
    if (!on) return;
    var nums = slots.map(function (v) { return parseInt(v, 10); });
    $("gpConfirmText").textContent = t(nums.length === 2 ? "pick.confirmQ2" : "pick.confirmQ", {
      c: nums.join(" + "),
      d: ""
    });
    $("gpYes").focus();
  }
  $("gpYes").addEventListener("click", function () {
    if (!shownCard || !allValid()) return;
    showConfirm(false);
    judge();
  });
  $("gpNo").addEventListener("click", function () {
    showConfirm(false);
    renderSlots();
  });

  /* "card 9 + card 12" : l'appli ne donne que les numéros des cartes vertes */
  function cardsText(names) {
    return names.map(function (name) { return t("pick.card", { n: G.greenNumber(name) }); }).join(" + ");
  }

  /* ---------- L'appli juge ---------- */
  function judge() {
    if (currentQ) return judgeQuestion();
    var card = shownCard;
    var level = cardPractice ? practiceLevel : G.get().level;
    var nums = slots.map(function (v) { return parseInt(v, 10); });
    picks = nums.map(greenName);
    var res = G.judgeCard(card, level, picks);
    var played = picks.slice();
    var info = {
      verdict: res.verdict, falseAlarm: res.falseAlarm, sev: card.sev, fam: card.fam,
      played: nums.map(function (n) { return t("pick.card", { n: n }); }).join(" + "),
      flip: level !== "junior" ? nums.filter(function (n) { return n !== 0; }).length : 0,   // cartes à retourner
      best: cardsText(level === "expert" && card.expert ? card.expert : [card.best]),
      acceptable: card.ok && !(level === "expert" && card.expert) ? cardsText([card.ok]) : null,
      why: card.why,
      rule: card.rule || null,
      greenRule: D.EXPERT_GREENS[card.best] ? cardsText([card.best]) + (I.lang === "fr" ? " : " : ": ") + D.EXPERT_GREENS[card.best].rule : null
    };

    if (cardPractice || !G.isPlaying()) {
      info.practiceCost = G.penalty({ verdict: res.verdict, falseAlarm: res.falseAlarm, sev: card.sev, fam: card.fam }, 0, []).total;
      info.flip = 0;
      showResult(info, null, false);
      return;
    }
    mgContext = null;
    // Pro et Expert : une question de suivi après chaque carte rouge à texte
    pendingQ = level !== "junior" ? G.pickQuestion(card, level) : null;
    var out = G.applyAttack({
      card: card.n,
      label: "#" + card.n + " " + (card.title || D.FAMILIES[card.fam]),
      fam: card.fam, sev: card.sev, verdict: res.verdict, falseAlarm: res.falseAlarm,
      played: played, best: info.best, lesson: card.why,   // gardés pour le débrief de fin
      followUp: !!pendingQ
    });
    if (!G.isPlaying()) pendingQ = null;   // jauge à 10 : la partie est perdue, pas de question
    // Le verso des cartes rouges n'a pas de réponse : c'est l'appli qui l'affiche
    showResult(info, out, true);
  }

  $("cpBack").addEventListener("click", function () {
    if (cardPractice) { cardPractice = false; show("practice"); return; }
    resetPad();
  });
  $("qrBack").addEventListener("click", resetPad);

  /* ---------- Carte mini-jeu ouverte depuis le pavé ---------- */
  $("qrOpen").addEventListener("click", function () {
    if (!shownCard || !shownCard.qr) return;
    startMinigame(shownCard.qr, { inGame: true, card: shownCard.n });
  });

  $("abandonBtn").addEventListener("click", function () {
    if (!window.confirm(t("confirm.abandon"))) return;
    G.clear();
    G.stopSpeaking();
    document.body.classList.remove("is-alert", "is-final");
    showHome();
  });

  /* =========================================================
     MINI-JEUX
     ========================================================= */
  function startMinigame(key, context) {
    mgContext = context;
    cardPractice = false;
    show("minigame");
    Minigames.run(key, $("mgRoot"), onMinigameDone);
  }

  function onMinigameDone(r) {
    var meta = D.MINIGAMES[r.key];
    var info = { verdict: r.verdict, falseAlarm: r.falseAlarm, sev: r.sev, fam: r.fam,
      summary: r.summary, best: null, why: r.why };
    if (mgContext.inGame && G.isPlaying()) {
      var lvl = G.get().level;
      pendingQ = lvl !== "junior" && mgContext.card ? G.pickQuestion({ n: mgContext.card }, lvl) : null;
      var out = G.applyAttack({
        card: mgContext.card,
        label: (mgContext.card ? "#" + mgContext.card + " " : "") + meta.name,
        fam: r.fam, sev: r.sev, verdict: r.verdict, falseAlarm: r.falseAlarm,
        lesson: r.why,
        followUp: !!pendingQ
      });
      if (!G.isPlaying()) pendingQ = null;
      showResult(info, out, true);
    } else {
      // Entraînement, ou mini-jeu ouvert par son adresse sans partie en cours sur ce téléphone
      info.practiceCost = G.penalty(r, 0, []).total;
      info.note = mgContext.scannedWithoutGame ? t("res.noGame") : null;
      showResult(info, null, false);
    }
  }

  /* =========================================================
     RÉSULTAT : ce que vous avez joué, la bonne réponse, pourquoi,
     et la règle d'or à retenir
     ========================================================= */
  var VERDICTS = {
    right: { icon: "✅", key: "res.right", cls: "is-right" },
    almost: { icon: "🟠", key: "res.almost", cls: "is-almost" },
    wrong: { icon: "❌", key: "res.wrong", cls: "is-wrong" },
    falseAlarm: { icon: "❌", key: "res.false", cls: "is-wrong" }
  };

  function showResult(r, out, inGame) {
    var v = r.falseAlarm ? VERDICTS.falseAlarm : VERDICTS[r.verdict];
    $("resBox").className = "result__box " + v.cls;
    $("resIcon").textContent = v.icon;
    $("resTitle").textContent = r.question ? t("q." + r.verdict) : t(v.key);
    var summary = r.summary || (r.played ? t("res.played", { c: r.played }) : "");
    $("resSummary").textContent = summary;
    $("resSummary").hidden = !summary;

    var calc = $("resCalc");
    calc.innerHTML = "";
    function line(text, cls) { calc.appendChild(makeEl("li", cls || "", text)); }

    if (inGame && out && r.question) {
      var qp = out.penalty;
      if (r.level !== "expert") line(t("calc.qPro"));
      else if (r.verdict === "right") line(t("calc.right"));
      else if (r.verdict === "almost") line(t("calc.qAlmost"));
      else line(t("calc.qWrong"));
      if (qp.alertBonus) line(t("calc.alert"), "is-bonus");
      line(t("calc.total", { n: qp.total }), "is-total");
      $("resGauge").textContent = t("calc.gauge", { a: out.before, b: out.after });
      $("resGauge").hidden = false;
    } else if (inGame && out) {
      var p = out.penalty;
      if (r.verdict === "right") line(t("calc.right"));
      else if (r.falseAlarm) line(t("calc.false"));
      else if (r.verdict === "almost") line(t("calc.almost"));
      else line(t("calc.wrong", { sk: skulls(r.sev), n: r.sev }));
      if (p.alertBonus) line(t("calc.alert"), "is-bonus");
      if (p.familyBonus) line(t("calc.family"), "is-bonus");
      line(t("calc.total", { n: p.total }), "is-total");
      $("resGauge").textContent = t("calc.gauge", { a: out.before, b: out.after });
      $("resGauge").hidden = false;
    } else {
      line(t("calc.practice", { n: r.practiceCost || 0 }), "is-total");
      $("resGauge").hidden = true;
    }

    // Le pion papier : "Hacker blocked! Don't move the pawn." ou "Move the pawn to space 7."
    var moved = !!(inGame && out && out.after !== out.before);
    var pawnText = !inGame || !out ? "" : moved ? TURN.pawn.replace("{n}", out.after) : TURN.blocked;
    $("resPawn").textContent = moved ? pawnText : t("pawn.stay");   // le titre dit déjà "Hacker blocked!"
    $("resPawn").hidden = !pawnText;
    $("resPawn").className = "result__pawn" + (moved ? " is-move" : "");
    var flipText = inGame && r.flip ? (r.flip > 1 ? TURN.flip2 : TURN.flip) : "";
    $("resFlip").textContent = flipText ? "🃏 " + flipText : "";
    $("resFlip").hidden = !flipText;

    var best = r.best ? t("res.best", { d: r.best }) : "";
    if (r.best && r.acceptable) best += " · " + t("res.acceptable", { d: r.acceptable });
    $("resBest").textContent = best;
    $("resBest").hidden = !best;
    $("resWhy").textContent = r.why || "";
    var info = D.FAMILY_INFO[r.fam];
    $("resRule").textContent = r.rule || (info ? info.rule : "");
    $("resRuleBox").hidden = !info;
    $("resRule2").textContent = r.greenRule ? "🟩 " + r.greenRule : "";
    $("resRule2").hidden = !r.greenRule;
    $("resNote").textContent = r.note || "";
    $("resNote").hidden = !r.note;

    lastResultEnded = inGame && !G.isPlaying();
    resultInGame = inGame;
    if (!inGame) pendingQ = null;
    var next = $("resNext");
    if (!inGame) next.textContent = t((mgContext && mgContext.practice) || cardPractice ? "res.backPractice" : "res.backHome");
    else next.textContent = t(lastResultEnded ? "res.toEnd" : pendingQ ? "res.toQuestion" : "res.next");
    show("result");
    next.focus();

    // Le téléphone le dit à voix haute
    if (inGame && out) {
      var keys = [moved ? "guide-pawn-" + out.after : "guide-blocked"];
      var texts = [moved ? TV.pawn.replace("{n}", out.after) : TV.blocked];
      if (out.crossedAlert && G.markAlertSpoken()) {
        keys.push("hacker-alert"); texts.push(DV.HACKER.alert);
        flashAlert();
      }
      if (flipText) { keys.push(r.flip > 1 ? "guide-flip2" : "guide-flip"); texts.push(r.flip > 1 ? TV.flip2 : TV.flip); }
      if (!lastResultEnded && !pendingQ) { keys.push("guide-next"); texts.push(TV.next); }
      G.speakLine(keys, texts.join(" "));
    }
  }

  $("resNext").addEventListener("click", function () {
    if (lastResultEnded) return goToEnd();
    if (resultInGame && pendingQ) return showQuestion(pendingQ);
    if (cardPractice) { cardPractice = false; show("practice"); return; }
    if (mgContext && !mgContext.inGame) {
      mgContext = null;
      if (practiceMode) show("practice"); else showHome();
      return;
    }
    nextAttack();
  });

  function nextAttack() {
    resetPad();
    show(G.isPlaying() ? "game" : "home");
    if (G.isPlaying()) G.speakLine("guide-draw", TV.draw);   // "Attack incoming! Draw a red card."
  }

  /* =========================================================
     QUESTION DE SUIVI (Pro et Expert)
     La question est imprimée au dos de la carte rouge. La voix ne la lit
     JAMAIS : elle dit "Turn the card over. Read the question aloud.",
     puis propose des cartes vertes par leur numéro. On répond avec une
     carte verte, comme pour une attaque. La carte verte n'est pas usée.
     ========================================================= */
  var currentQ = null;

  /* La question jouée comme une carte : bonne réponse, acceptable, pièges */
  function questionCard(q) {
    return { n: q.card, fam: q.family, sev: 1, best: q.best, ok: q.ok, traps: q.traps,
             deck: q.level === "expert" ? "expert" : "standard" };
  }

  function showQuestion(q) {
    pendingQ = null;
    cardPractice = false;
    resetPad();
    show("game");
    currentQ = q;
    shownCard = questionCard(q);
    picks = [];
    var lvl = G.get().level;
    $("pad").hidden = true;
    $("qrPanel").hidden = true;
    $("cpNum").textContent = "#" + q.card;
    $("cpFam").textContent = t(lvl === "expert" ? "q.tagExpert" : "q.tagPro");
    $("cpSev").textContent = "🔄";
    $("cpSev").removeAttribute("aria-label");
    $("cpTitle").textContent = t("q.title");
    $("cpRead").textContent = t("q.read", { n: q.card });
    $("cpText").hidden = true;
    $("cpShowText").hidden = true;
    $("cpHintBtn").hidden = true;
    $("cpHint").hidden = true;
    $("cpBack").hidden = true;          // on ne peut pas revenir en arrière
    offered = G.proposeDefences(shownCard, lvl, true);   // une question n'use pas les cartes vertes
    renderChoices();
    $("pickTitle").textContent = t("pick.title", { list: choiceList() });
    buildGreenPad(1);
    $("cardPanel").hidden = false;
    // "Turn the card over. Read the question aloud. Choose your defence: card 9, card 3 or card 0."
    speakChoices(1, ["guide-question"], [TV.question]);
  }

  function judgeQuestion() {
    var q = currentQ;
    var nums = slots.map(function (v) { return parseInt(v, 10); });
    var res = G.judgeCard(shownCard, "pro", nums.map(greenName));
    var out = G.answerQuestion(q, res.verdict);
    var info = {
      question: true, level: G.get().level, verdict: res.verdict, falseAlarm: false, fam: q.family,
      played: nums.map(function (n) { return t("pick.card", { n: n }); }).join(" + "),
      best: cardsText([q.best]),
      acceptable: q.ok ? cardsText([q.ok]) : null,
      why: I.lang === "fr" ? q.explain.fr : q.explain.en,
      note: t("q.source") + " " + q.source.replace(/^https?:\/\//, "").split("/")[0]
    };
    currentQ = null;
    showResult(info, out, true);
  }

  function flashAlert() {
    document.body.classList.remove("flash");
    void document.body.offsetWidth;
    document.body.classList.add("flash");
  }

  /* =========================================================
     FIN DE PARTIE + DÉBRIEF PÉDAGOGIQUE
     ========================================================= */
  function goToEnd() {
    var st = G.get();
    if (!st || st.status === "playing") return showHome();
    var won = st.status === "won";
    if (!st.endSpoken) {
      st.endSpoken = true;
      G.save();
      G.speakLine(won ? "hacker-win" : "hacker-lose", won ? DV.HACKER.win : DV.HACKER.lose);
    }
    document.body.classList.remove("is-alert", "is-final");
    NovaAudio.setMusicMood("calm");
    $("endScreen").className = "end__screen " + (won ? "is-won" : "is-lost");
    $("endBig").textContent = t(won ? "end.wonBig" : "end.lostBig");
    $("endBig").setAttribute("data-text", $("endBig").textContent);
    $("endTitle").textContent = t(won ? "end.wonTitle" : "end.lostTitle");
    $("endScore").textContent = won
      ? t("end.score", { n: G.score() }) + (G.score() === 10 ? t("end.perfect") : "")
      : t(st.gauge >= 10 ? "end.gauge10" : "end.time");

    // --- Point faible : la famille qui a coûté le plus ---
    var costByFam = {};
    st.attacks.forEach(function (a) { costByFam[a.fam] = (costByFam[a.fam] || 0) + a.cost; });
    (st.questions || []).forEach(function (q) { costByFam[q.fam] = (costByFam[q.fam] || 0) + q.cost; });
    var weak = null;
    Object.keys(costByFam).forEach(function (f) {
      if (costByFam[f] > 0 && (!weak || costByFam[f] > costByFam[weak])) weak = f;
    });
    $("dbWeak").hidden = !weak;
    if (weak) {
      $("dbWeakName").textContent = D.FAMILIES[weak] + " (+" + costByFam[weak] + ")";
      $("dbWeakRule").textContent = "⭐ " + D.FAMILY_INFO[weak].rule;
      $("dbWeakHome").textContent = "🏠 " + D.FAMILY_INFO[weak].home;
    }

    // --- Récapitulatif : chaque attaque, et la leçon quand ce n'était pas la bonne réponse ---
    var recap = $("endRecap");
    recap.innerHTML = "";
    if (!st.attacks.length) recap.appendChild(makeEl("li", "", t("end.none")));
    st.attacks.forEach(function (a) {
      var li = makeEl("li", "end__row end__row--" + (a.falseAlarm ? "wrong" : a.verdict));
      li.appendChild(makeEl("span", "end__name", a.label));
      li.appendChild(makeEl("span", "end__verdict", t(a.falseAlarm ? "end.v.false" : "end.v." + a.verdict)));
      li.appendChild(makeEl("span", "end__cost", "+" + a.cost));
      if (a.verdict !== "right" && (a.best || a.lesson)) {
        var lesson = makeEl("p", "end__lesson");
        if (a.best) lesson.appendChild(makeEl("strong", "", t("res.best", { d: a.best }) + ". "));
        if (a.lesson) lesson.appendChild(document.createTextNode(a.lesson));
        li.appendChild(lesson);
      }
      recap.appendChild(li);
    });

    if ((st.questions || []).length) {
      var good = st.questions.filter(function (q) { return q.right; }).length;
      var qCost = st.questions.reduce(function (sum, q) { return sum + q.cost; }, 0);
      var qli = makeEl("li", "end__row end__row--" + (good === st.questions.length ? "right" : "almost"));
      qli.appendChild(makeEl("span", "end__name", t("end.questions")));
      qli.appendChild(makeEl("span", "end__verdict", good + "/" + st.questions.length));
      qli.appendChild(makeEl("span", "end__cost", "+" + qCost));
      recap.appendChild(qli);
    }

    // --- Règles d'or des familles rencontrées ---
    var rules = $("dbRules");
    rules.innerHTML = "";
    var seen = [];
    st.attacks.forEach(function (a) { if (seen.indexOf(a.fam) < 0) seen.push(a.fam); });
    if (!seen.length) seen = Object.keys(D.FAMILY_INFO);
    seen.forEach(function (f) {
      var li = makeEl("li", "debrief__ruleitem");
      li.appendChild(makeEl("strong", "", D.FAMILIES[f]));
      li.appendChild(makeEl("span", "", D.FAMILY_INFO[f].rule));
      li.appendChild(makeEl("span", "debrief__homeline", "🏠 " + D.FAMILY_INFO[f].home));
      rules.appendChild(li);
    });

    // --- On en parle ? ---
    var talk = $("dbTalk");
    talk.innerHTML = "";
    D.DISCUSS.forEach(function (q) { talk.appendChild(makeEl("li", "", q)); });

    show("end");
  }

  $("newGameBtn").addEventListener("click", function () {
    G.clear();
    G.stopSpeaking();
    showHome();
  });

  /* =========================================================
     ENTRAÎNEMENT : mini-jeux + cartes rouges au hasard
     ========================================================= */
  function practiceButton(cards, name, sev, onClick, cls) {
    var li = makeEl("li");
    var btn = makeEl("button", "practice__item" + (cls ? " " + cls : ""));
    btn.type = "button";
    btn.appendChild(makeEl("span", "practice__cards", cards));
    btn.appendChild(makeEl("span", "practice__name", name));
    btn.appendChild(makeEl("span", "practice__sev", sev));
    btn.addEventListener("click", onClick);
    li.appendChild(btn);
    $("practiceList").appendChild(li);
  }

  practiceButton("🎴", t("pr.redCards"), "", function () {
    var textCards = D.CARDS.filter(function (c) { return !c.qr; });
    var card = textCards[Math.floor(Math.random() * textCards.length)];
    mgContext = null;
    cardPractice = true;
    practiceLevel = card.deck === "expert" ? "expert" : "junior";
    show("game");
    showCardPanel(card, practiceLevel);
  }, "practice__item--cards");

  QR_KEYS.forEach(function (key) {
    var m = D.MINIGAMES[key];
    practiceButton(m.cards.map(function (n) { return "#" + n; }).join(" · "), m.name, skulls(m.sev), function () {
      startMinigame(key, { inGame: false, practice: true });
    });
  });

  /* =========================================================
     DÉMARRAGE : lecture de l'adresse (?c=...)
     ========================================================= */
  function cleanUrl() {
    if (window.history && history.replaceState) {
      history.replaceState(null, "", window.location.pathname);
    }
  }

  function init() {
    G.load();
    var st = G.get();
    // Une partie dont le chrono est fini pendant que la page était fermée
    if (st && st.status === "playing") G.checkEnd();
    if (st && st.status === "playing" && st.gauge >= 5) st.alertDone = true;

    var c = null;
    try { c = new URLSearchParams(window.location.search).get("c"); } catch (e) { c = null; }

    if (c === "practice") {
      practiceMode = true;
      show("practice");
      return;
    }
    if (c && QR_KEYS.indexOf(c) >= 0) {
      cleanUrl();
      if (G.isPlaying()) startMinigame(c, { inGame: true, card: null });
      else startMinigame(c, { inGame: false, scannedWithoutGame: true });
      return;
    }
    if (c === "start") cleanUrl();

    // En arrivant sur le site, on montre TOUJOURS l'accueil.
    // Une partie en cours se reprend avec "Continuer la partie" ; une partie finie est effacée.
    if (st && st.status !== "playing") G.clear();
    showHome();
  }

  if (reduceMotion) document.body.classList.add("reduce-motion");
  init();
})();
