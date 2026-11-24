/* =========================================================
   HACKER ALERT — L'APPLI (écrans, pavé, jugement, débrief)
   Adresses des QR codes (déjà imprimées, ne pas changer) :
   ?c=start · ?c=trap · ?c=password · ?c=desk · ?c=ransom
   ?c=call · ?c=link · ?c=practice

   C'est l'appli qui juge : l'équipe touche la carte verte posée,
   l'appli compare avec la bonne réponse. Personne ne peut
   "appuyer sur Bonne" à la place du jeu.
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
    G.speakLine("hacker-start", D.HACKER.start);
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
    if (card.qr) {
      shownCard = card;
      $("pad").hidden = true;
      var m = D.MINIGAMES[card.qr];
      $("qrName").textContent = "#" + n + " · " + m.name + " " + skulls(m.sev);
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
    picks = [];
    $("pad").hidden = true;
    $("qrPanel").hidden = true;
    $("gameLinks").hidden = cardPractice;   // pas de "Abandonner la partie" pendant un entraînement
    $("cpNum").textContent = "#" + card.n;
    $("cpFam").textContent = D.FAMILIES[card.fam];
    $("cpSev").textContent = skulls(card.sev);
    $("cpSev").setAttribute("aria-label", t("card.sev", { n: card.sev }));
    $("cpText").textContent = card.text;

    // Indice : seulement au niveau Junior et en entraînement
    var hintAllowed = level === "junior" || cardPractice;
    $("cpHintBtn").hidden = !hintAllowed;
    $("cpHint").hidden = true;
    $("cpHint").textContent = "💡 " + D.FAMILY_INFO[card.fam].hint;

    var need = G.picksNeeded(card, level);
    $("pickTitle").textContent = t(need === 2 ? "pick.title2" : "pick.title");
    buildPicker(need);
    $("cardPanel").hidden = false;
  }

  $("cpHintBtn").addEventListener("click", function () {
    $("cpHint").hidden = false;
    this.hidden = true;
  });

  function buildPicker(need) {
    var grid = $("picker");
    grid.innerHTML = "";
    D.DEFENCES.forEach(function (name) {
      var used = cardPractice ? false : G.greenUsed(name);
      var b = makeEl("button", "pick" + (name === "It's safe!" ? " pick--safe" : ""));
      b.type = "button";
      b.setAttribute("aria-pressed", "false");
      b.setAttribute("data-name", name);
      var fr = D.defence(name);
      // En français : nom FR en grand, nom imprimé sur la carte en petit
      var main = fr.split(" – ")[0];
      if (main === fr && fr.indexOf(" (") > 0) main = fr.slice(0, fr.indexOf(" ("));
      b.appendChild(makeEl("span", "pick__main", main));
      if (main !== name) b.appendChild(makeEl("span", "pick__en", name));
      if (used) {
        b.disabled = true;
        b.appendChild(makeEl("span", "pick__used", t("pick.used")));
      }
      b.addEventListener("click", function () {
        var k = picks.indexOf(name);
        if (k >= 0) picks.splice(k, 1);
        else {
          if (picks.length >= need) picks.shift();   // on remplace le plus ancien choix
          picks.push(name);
        }
        Array.prototype.forEach.call(grid.children, function (btn) {
          btn.setAttribute("aria-pressed", picks.indexOf(btn.getAttribute("data-name")) >= 0 ? "true" : "false");
        });
        $("pickValidate").disabled = picks.length === 0;
        $("pickValidate").textContent = picks.length
          ? t("pick.validateWith", { c: picks.map(function (p) { return D.defence(p).split(" (")[0].split(" – ")[0]; }).join(" + ") })
          : t("pick.validate");
      });
      grid.appendChild(b);
    });
    $("pickValidate").disabled = true;
    $("pickValidate").textContent = t("pick.validate");
  }

  $("pickValidate").addEventListener("click", function () {
    if (!shownCard || !picks.length) return;
    judge();
  });

  /* ---------- L'appli juge ---------- */
  function judge() {
    var card = shownCard;
    var level = cardPractice ? "pro" : G.get().level;
    var res = G.judgeCard(card, level, picks);
    var played = picks.slice();
    var playedText = played.map(D.defence).join(" + ");
    var info = {
      verdict: res.verdict, falseAlarm: res.falseAlarm, sev: card.sev, fam: card.fam,
      played: playedText,
      best: G.bestFor(card, level),
      acceptable: card.ok && !(level === "expert" && card.expert) ? D.defence(card.ok) : null,
      why: card.why
    };

    if (cardPractice || !G.isPlaying()) {
      info.practiceCost = G.penalty({ verdict: res.verdict, falseAlarm: res.falseAlarm, sev: card.sev, fam: card.fam }, 0, []).total;
      showResult(info, null, false);
      return;
    }
    mgContext = null;
    var out = G.applyAttack({
      card: card.n,
      label: "#" + card.n + " " + D.FAMILIES[card.fam],
      fam: card.fam, sev: card.sev, verdict: res.verdict, falseAlarm: res.falseAlarm,
      played: played, best: info.best, lesson: card.why
    });
    showResult(info, out, true);
  }

  $("cpBack").addEventListener("click", function () {
    if (cardPractice) { cardPractice = false; show("practice"); return; }
    resetPad();
  });
  $("qrBack").addEventListener("click", resetPad);

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
    cardPractice = false;
    show("minigame");
    Minigames.run(key, $("mgRoot"), onMinigameDone);
  }

  function onMinigameDone(r) {
    var meta = D.MINIGAMES[r.key];
    var info = { verdict: r.verdict, falseAlarm: r.falseAlarm, sev: r.sev, fam: r.fam,
      summary: r.summary, best: null, why: r.why };
    if (mgContext.inGame && G.isPlaying()) {
      var out = G.applyAttack({
        card: mgContext.card,
        label: (mgContext.card ? "#" + mgContext.card + " " : "QR · ") + meta.name,
        fam: r.fam, sev: r.sev, verdict: r.verdict, falseAlarm: r.falseAlarm,
        lesson: r.why
      });
      showResult(info, out, true);
    } else {
      // Entraînement, ou carte scannée sans partie en cours sur ce téléphone
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
    $("resTitle").textContent = t(v.key);
    var summary = r.summary || (r.played ? t("res.played", { c: r.played }) : "");
    $("resSummary").textContent = summary;
    $("resSummary").hidden = !summary;

    var calc = $("resCalc");
    calc.innerHTML = "";
    function line(text, cls) { calc.appendChild(makeEl("li", cls || "", text)); }

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
        G.speakLine("hacker-alert", D.HACKER.alert);
        flashAlert();
      }
    } else {
      line(t("calc.practice", { n: r.practiceCost || 0 }), "is-total");
      $("resGauge").hidden = true;
    }

    var best = r.best ? t("res.best", { d: r.best }) : "";
    if (r.best && r.acceptable) best += " · " + t("res.acceptable", { d: r.acceptable });
    $("resBest").textContent = best;
    $("resBest").hidden = !best;
    $("resWhy").textContent = r.why || "";
    var info = D.FAMILY_INFO[r.fam];
    $("resRule").textContent = info ? info.rule : "";
    $("resRuleBox").hidden = !info;
    $("resNote").textContent = r.note || "";
    $("resNote").hidden = !r.note;

    lastResultEnded = inGame && !G.isPlaying();
    var next = $("resNext");
    if (!inGame) next.textContent = t((mgContext && mgContext.practice) || cardPractice ? "res.backPractice" : "res.backHome");
    else next.textContent = t(lastResultEnded ? "res.toEnd" : "res.next");
    show("result");
    next.focus();
  }

  $("resNext").addEventListener("click", function () {
    if (lastResultEnded) return goToEnd();
    if (cardPractice) { cardPractice = false; show("practice"); return; }
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
     FIN DE PARTIE + DÉBRIEF PÉDAGOGIQUE
     ========================================================= */
  function goToEnd() {
    var st = G.get();
    if (!st || st.status === "playing") return showHome();
    var won = st.status === "won";
    if (!st.endSpoken) {
      st.endSpoken = true;
      G.save();
      G.speakLine(won ? "hacker-win" : "hacker-lose", won ? D.HACKER.win : D.HACKER.lose);
    }
    document.body.classList.remove("is-alert", "is-final");
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
    show("game");
    showCardPanel(card, "junior");
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
