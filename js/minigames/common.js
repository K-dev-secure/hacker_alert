/* =========================================================
   MINI-JEUX — OUTILS COMMUNS
   Chaque mini-jeu s'enregistre avec Minigames.register(clé, fonction).
   La fonction reçoit (zone, ctx) et renvoie une fonction de nettoyage.
   Elle termine avec ctx.done({ verdict, falseAlarm, why, summary, fam? }).
   ========================================================= */
window.Minigames = (function () {
  "use strict";

  var D = window.NOVA_DATA;
  var t = window.NovaI18n.t;
  var registry = {};
  var cleanup = null;
  var finished = true;

  /* Crée un élément : el("p", { class: "x", text: "..." }, [enfants]) */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k === "html") node.innerHTML = v;
      else if (k.indexOf("on") === 0) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? "" : v);
    });
    (children || []).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function skulls(n) {
    return new Array(n + 1).join("💀");
  }

  /* Compte à rebours avec barre : renvoie { stop } */
  function countdown(seconds, barFill, label, onEnd) {
    var end = Date.now() + seconds * 1000;
    var stopped = false;
    function tick() {
      if (stopped) return;
      var left = Math.max(0, end - Date.now());
      if (barFill) barFill.style.transform = "scaleX(" + (left / (seconds * 1000)) + ")";
      if (label) label.textContent = Math.ceil(left / 1000) + " s";
      if (barFill && left <= 5000) barFill.parentNode.classList.add("is-low");
      if (left <= 0) { stopped = true; clearInterval(id); onEnd(); }
    }
    var id = setInterval(tick, 100);
    tick();
    return { stop: function () { stopped = true; clearInterval(id); } };
  }

  /* Barre de temps prête à l'emploi */
  function timerBar() {
    var fill = el("span", { class: "mg-timer__fill" });
    var label = el("span", { class: "mg-timer__label", text: "" });
    var wrap = el("div", { class: "mg-timer" }, [el("span", { class: "mg-timer__track" }, [fill]), label]);
    return { node: wrap, fill: fill, label: label };
  }

  function register(key, fn) {
    registry[key] = fn;
  }

  /* Lance un mini-jeu dans "root". onDone(résultat complet) à la fin. */
  function run(key, root, onDone) {
    abort();
    var meta = D.MINIGAMES[key];
    var fn = registry[key];
    if (!meta || !fn) return false;

    root.innerHTML = "";
    var head = el("header", { class: "mg-head" }, [
      el("p", { class: "mg-head__cards", text: t("mg.card", { list: meta.cards.map(function (n) { return "#" + n; }).join(" / ") }) }),
      el("h2", { class: "mg-head__name", text: meta.name }),
      el("p", { class: "mg-head__sev", "aria-label": t("mg.sev", { n: meta.sev }), text: skulls(meta.sev) })
    ]);
    var body = el("div", { class: "mg-body mg-body--" + key });
    root.appendChild(head);
    root.appendChild(body);

    finished = false;
    var ctx = {
      meta: meta, data: D, t: t, el: el, pick: pick, shuffle: shuffle, skulls: skulls,
      countdown: countdown, timerBar: timerBar,
      done: function (result) {
        if (finished) return;
        finished = true;
        if (cleanup) { try { cleanup(); } catch (e) { /* rien */ } }
        cleanup = null;
        result.key = key;
        result.title = meta.name;
        result.sev = meta.sev;
        result.fam = result.fam || meta.fam;
        result.falseAlarm = !!result.falseAlarm;
        onDone(result);
      }
    };
    cleanup = fn(body, ctx) || null;
    return true;
  }

  /* Arrête le mini-jeu en cours (fin du chrono, retour...) */
  function abort() {
    finished = true;
    if (cleanup) { try { cleanup(); } catch (e) { /* rien */ } }
    cleanup = null;
  }

  return { register: register, run: run, abort: abort, el: el, shuffle: shuffle, pick: pick };
})();
