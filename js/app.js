/* =========================================================
   HACKER ALERT — L'APPLI (écrans, pavé, résultats, fin)
   Adresses des QR codes (déjà imprimées, ne pas changer) :
   ?c=start · ?c=trap · ?c=password · ?c=desk · ?c=ransom
   ?c=call · ?c=link · ?c=practice
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
  var mgContext = null;      // { inGame, card, practice, scannedWithoutGame }
  var lastResultEnded = false;
  var practiceMode = false;
  var rulesReturn = "home";  // écran où revenir après la fiche des règles

  /* Traduit tous les textes fixes de la page */
  I.apply(document);

  /* ---------- Écrans ---------- */
  function show(name) {
    Array.prototype.forEach.call(document.querySelectorAll(".screen"), function (s) {
      s.hidden = s.id !== "screen-" + name;
    });
    current = name;
    var practicing = mgContext && !mgContext.inGame;
    var inGame = G.isPlaying() && (name === "game" || ((name === "minigame" || name === "result") && !practicing));
    $("hud").hidden = !inGame;
    document.body.classList.toggle("is-ingame", inGame);
    var st = G.get();
    $("levelChip").hidden = !inGame;
    if (st) $("levelChip").textContent = st.level.charAt(0).toUpperCase() + st.level.slice(1);
    window.scrollTo(0, 0);
    updateHud();
  }

  function skulls(n) { return new Array(n + 1).join("💀"); }

  /* =========================================================
     CHRONO + JAUGE (mis à jour 4 fois par seconde)
     ========================================================= */
  var hudCells = $("hudCells");
  for (var i = 1; i <= 10; i++) {
    var c = document.createElement("span");
    c.className = "hud__cell hud__cell--" + (i <= 2 ? "g" : i <= 4 ? "o" : "r");
    hudCells.appendChild(c);
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
    $("hudLabel").textContent = "INTRUSION " + st.gauge + "/10";
    Array.prototype.forEach.call(hudCells.children, function (cell, idx) {
      cell.classList.toggle("is-on", idx < st.gauge);
    });
    $("hudCount").textContent = st.attacks.length + "/" + G.ATTACKS_PER_GAME;
    var playing = G.isPlaying();
    document.body.classList.toggle("is-alert", playing && st.gauge >= 5);
    document.body.classList.toggle("is-final", playing && left <= 30);
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
    if (line) G.speak(line);
    if (G.remainingSeconds() <= 0) {
      G.checkEnd();
      // Un entraînement en cours n'est pas interrompu
      if (mgContext && !mgContext.inGame && (current === "minigame" || current === "result")) return;
      Minigames.abort();
      G.stopSpeaking();
      goToEnd();
    }
  }
  setInterval(tick, 250);

  /* =========================================================
     BARRE DU HAUT : langue + voix
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
    resetPad();
    G.speak(D.HACKER.start);
    show("game");
  });

  $("resumeBtn").addEventListener("click", function () { resetPad(); show("game"); });
  $("discardBtn").addEventListener("click", function () {
    G.clear();
    $("resumeBox").hidden = true;
    document.body.classList.remove("is-alert", "is-final");
  });

  /* ---------- Fiche des règles ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-open-rules]"), function (btn) {
    btn.addEventListener("click", function () {
      rulesReturn = current || "home";
      show("rules");
    });
  });
  $("rulesBack").addEventListener("click", function () {
    if (rulesReturn === "game" && G.isPlaying()) show("game");
    else showHome();
  });

  /* =========================================================
     PAVÉ DU MAÎTRE DU JEU
     ========================================================= */
  function resetPad() {
    typed = "";
    shownCard = null;
    $("padNumber").textContent = "—";
    $("padMsg").textContent = "";
    $("pad").hidden = false;
    $("cardPanel").hidden = true;
    $("qrPanel").hidden = true;
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
    if (current !== "game" || $("pad").hidden) return;
    if (/^[0-9]$/.test(e.key)) $("padKeys").querySelector("[data-key='" + e.key + "']").click();
    else if (e.key === "Backspace") $("padKeys").querySelector("[data-key='del']").click();
    else if (e.key === "Enter") { e.preventDefault(); openCard(); }
  });

  function openCard() {
    var n = parseInt(typed, 10);
    var card = n ? G.findCard(n) : null;
    if (!card) { padMessage(t("pad.invalid")); return; }
    if (G.cardPlayed(n)) { padMessage(t("pad.played", { n: n })); return; }
    shownCard = card;
    $("pad").hidden = true;

    if (card.qr) {
      var m = D.MINIGAMES[card.qr];
      $("qrName").textContent = "#" + n + " · " + m.name + " " + skulls(m.sev);
      $("qrPanel").hidden = false;
      $("qrOpen").focus();
      return;
    }

    var level = G.get().level;
    $("cpNum").textContent = "#" + card.n;
    $("cpFam").textContent = D.FAMILIES[card.fam];
    $("cpSev").textContent = skulls(card.sev);
    $("cpSev").setAttribute("aria-label", t("card.sev", { n: card.sev }));
    $("cpReal").hidden = !card.real;
    $("cpText").textContent = card.text;
    $("cpBest").textContent = G.bestFor(card, level);
    $("cpOk").textContent = card.ok ? D.defence(card.ok) : t("card.none");
    var expert = level === "expert" && card.expert;
    $("cpExpert").hidden = !expert;
    if (expert) $("cpExpert").textContent = t("card.expert");
    $("vAlmost").disabled = !G.almostAllowed(card, level);
    $("vWrongSub").textContent = t(card.real ? "v.wrong.subReal" : "v.wrong.sub");
    $("cardPanel").hidden = false;
    $("vRight").focus();
  }

  $("cpBack").addEventListener("click", resetPad);
  $("qrBack").addEventListener("click", resetPad);

  /* ---------- Verdict sur une carte à texte ---------- */
  function judge(verdict) {
    var card = shownCard;
    if (!card || !G.isPlaying()) return;
    mgContext = null;
    var falseAlarm = card.real && verdict === "wrong";
    var out = G.applyAttack({
      card: card.n,
      label: "#" + card.n + " " + D.FAMILIES[card.fam],
      fam: card.fam, sev: card.sev, verdict: verdict, falseAlarm: falseAlarm
    });
    showResult({
      verdict: verdict, falseAlarm: falseAlarm, sev: card.sev,
      summary: null,
      best: G.bestFor(card, G.get().level),
      why: card.why
    }, out, true);
  }
  $("vRight").addEventListener("click", function () { judge("right"); });
  $("vAlmost").addEventListener("click", function () { if (!this.disabled) judge("almost"); });
  $("vWrong").addEventListener("click", function () { judge("wrong"); });

  /* ---------- Carte QR ouverte depuis le pavé ---------- */
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
    show("minigame");
    Minigames.run(key, $("mgRoot"), onMinigameDone);
  }

  function onMinigameDone(r) {
    var meta = D.MINIGAMES[r.key];
    if (mgContext.inGame && G.isPlaying()) {
      var out = G.applyAttack({
        card: mgContext.card,
        label: (mgContext.card ? "#" + mgContext.card + " " : "QR · ") + meta.name,
        fam: r.fam, sev: r.sev, verdict: r.verdict, falseAlarm: r.falseAlarm
      });
      showResult({ verdict: r.verdict, falseAlarm: r.falseAlarm, sev: r.sev,
        summary: r.summary, best: null, why: r.why }, out, true);
    } else {
      // Entraînement, ou carte scannée sans partie en cours sur ce téléphone
      var p = G.penalty(r, 0, []);
      showResult({ verdict: r.verdict, falseAlarm: r.falseAlarm, sev: r.sev,
        summary: r.summary, best: null, why: r.why, practiceCost: p.total,
        note: mgContext.scannedWithoutGame ? t("res.noGame") : null }, null, false);
    }
  }

  /* =========================================================
     RÉSULTAT
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
    $("resTitle").textContent = t(v.key);
    $("resSummary").textContent = r.summary || "";
    $("resSummary").hidden = !r.summary;

    var calc = $("resCalc");
    calc.innerHTML = "";
    function line(text, cls) {
      var li = document.createElement("li");
      li.textContent = text;
      if (cls) li.className = cls;
      calc.appendChild(li);
    }

    if (inGame && out) {
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
      if (out.crossedAlert && G.markAlertSpoken()) {
        G.speak(D.HACKER.alert);
        flashAlert();
      }
    } else {
      line(t("calc.practice", { n: r.practiceCost || 0 }), "is-total");
      $("resGauge").hidden = true;
    }

    $("resBest").textContent = r.best ? t("res.best", { d: r.best }) : "";
    $("resBest").hidden = !r.best;
    $("resWhy").textContent = r.why || "";
    $("resNote").textContent = r.note || "";
    $("resNote").hidden = !r.note;

    lastResultEnded = inGame && !G.isPlaying();
    var next = $("resNext");
    if (!inGame) next.textContent = t(mgContext && mgContext.practice ? "res.backPractice" : "res.backHome");
    else next.textContent = t(lastResultEnded ? "res.toEnd" : "res.next");
    show("result");
    next.focus();
  }

  $("resNext").addEventListener("click", function () {
    if (lastResultEnded) return goToEnd();
    if (mgContext && !mgContext.inGame) {
      mgContext = null;
      if (practiceMode) show("practice"); else showHome();
      return;
    }
    resetPad();
    show(G.isPlaying() ? "game" : "home");
  });

  function flashAlert() {
    document.body.classList.remove("flash");
    void document.body.offsetWidth;
    document.body.classList.add("flash");
  }

  /* =========================================================
     FIN DE PARTIE
     ========================================================= */
  function goToEnd() {
    var st = G.get();
    if (!st || st.status === "playing") return showHome();
    var won = st.status === "won";
    if (!st.endSpoken) {
      st.endSpoken = true;
      G.save();
      G.speak(won ? D.HACKER.win : D.HACKER.lose);
    }
    document.body.classList.remove("is-alert", "is-final");
    $("endScreen").className = "end__screen " + (won ? "is-won" : "is-lost");
    $("endBig").textContent = t(won ? "end.wonBig" : "end.lostBig");
    $("endBig").setAttribute("data-text", $("endBig").textContent);
    $("endTitle").textContent = t(won ? "end.wonTitle" : "end.lostTitle");
    $("endScore").textContent = won
      ? t("end.score", { n: G.score() }) + (G.score() === 10 ? t("end.perfect") : "")
      : t(st.gauge >= 10 ? "end.gauge10" : "end.time");

    var recap = $("endRecap");
    recap.innerHTML = "";
    if (!st.attacks.length) {
      var empty = document.createElement("li");
      empty.textContent = t("end.none");
      recap.appendChild(empty);
    }
    st.attacks.forEach(function (a) {
      var li = document.createElement("li");
      li.className = "end__row end__row--" + (a.falseAlarm ? "wrong" : a.verdict);
      var name = document.createElement("span");
      name.className = "end__name";
      name.textContent = a.label;
      var verdict = document.createElement("span");
      verdict.className = "end__verdict";
      verdict.textContent = t(a.falseAlarm ? "end.v.false" : "end.v." + a.verdict);
      var cost = document.createElement("span");
      cost.className = "end__cost";
      cost.textContent = "+" + a.cost;
      li.appendChild(name); li.appendChild(verdict); li.appendChild(cost);
      recap.appendChild(li);
    });
    show("end");
  }

  $("newGameBtn").addEventListener("click", function () {
    G.clear();
    G.stopSpeaking();
    showHome();
  });

  /* =========================================================
     ENTRAÎNEMENT
     ========================================================= */
  QR_KEYS.forEach(function (key) {
    var m = D.MINIGAMES[key];
    var li = document.createElement("li");
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "practice__item";
    btn.innerHTML = "<span class='practice__cards'></span><span class='practice__name'></span><span class='practice__sev'></span>";
    btn.querySelector(".practice__cards").textContent = m.cards.map(function (n) { return "#" + n; }).join(" · ");
    btn.querySelector(".practice__name").textContent = m.name;
    btn.querySelector(".practice__sev").textContent = skulls(m.sev);
    btn.addEventListener("click", function () { startMinigame(key, { inGame: false, practice: true }); });
    li.appendChild(btn);
    $("practiceList").appendChild(li);
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

    if (st && st.status !== "playing") {
      if (c === "start") { G.clear(); showHome(); }
      else goToEnd();
      return;
    }
    if (G.isPlaying() && c !== "start") { resetPad(); show("game"); return; }
    showHome();
  }

  if (reduceMotion) document.body.classList.add("reduce-motion");
  init();
})();
