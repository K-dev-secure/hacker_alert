/* =========================================================
   MINI-JEU : ÉCRAN BIZARRE / STRANGE SCREEN (#14)
   Ransomware (55 %) ou vrai message NovaCorp.
   Si ransomware : remettre les 4 actions dans l'ordre.
   ========================================================= */
Minigames.register("ransom", function (root, ctx) {
  "use strict";

  var el = ctx.el;
  var t = ctx.t;
  var R = ctx.data.RANSOM;
  var isAttack = Math.random() < R.attackChance;
  // Parmi les attaques : fausse alerte virus (faux support) ou ransomware
  var isSupport = isAttack && R.support && Math.random() < R.supportChance;
  var timers = [];
  var decided = false;

  /* ---------- L'écran qui apparaît ---------- */
  var screen;
  if (isSupport) {
    screen = el("div", { class: "ransom__screen ransom__screen--support" }, [
      el("p", { class: "ransom__ptitle", text: R.support.title }),
      el("p", { class: "ransom__text", text: R.support.text }),
      el("p", { class: "ransom__phone", text: "☎ +44 20 7946 0999" })
    ]);
  } else if (isAttack) {
    var clock = el("p", { class: "ransom__clock", text: "47:59:59" });
    screen = el("div", { class: "ransom__screen ransom__screen--attack" }, [
      el("p", { class: "ransom__skull", "aria-hidden": "true", text: "☠" }),
      el("p", { class: "ransom__title", text: t("ransom.title") }),
      el("p", { class: "ransom__text", text: t("ransom.text", { a: ctx.pick(R.amounts) }) }),
      clock,
      el("p", { class: "ransom__small", text: t("ransom.small") })
    ]);
    var left = 47 * 3600 + 59 * 60 + 59;
    timers.push(setInterval(function () {
      left = Math.max(0, left - 1);
      var h = Math.floor(left / 3600), m = Math.floor(left / 60) % 60, s = left % 60;
      clock.textContent = h + ":" + (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
    }, 1000));
  } else {
    var normal = ctx.pick(R.normals);
    var fill = el("span", { class: "ransom__progress-fill" });
    var pct = el("span", { class: "ransom__pct", text: "0 %" });
    screen = el("div", { class: "ransom__screen ransom__screen--normal" }, [
      el("p", { class: "ransom__wtitle", text: normal.title }),
      el("p", { class: "ransom__text", text: normal.text }),
      el("div", { class: "ransom__progress" }, [fill]),
      pct
    ]);
    var p = 0;
    timers.push(setInterval(function () {
      p = p >= 100 ? 0 : p + 1;
      fill.style.transform = "scaleX(" + (p / 100) + ")";
      pct.textContent = p + " %";
    }, 120));
  }

  var attackBtn = el("button", { class: "mg-btn mg-btn--danger", type: "button", text: t("ransom.attack") });
  var normalBtn = el("button", { class: "mg-btn mg-btn--safe", type: "button", text: t("ransom.normal") });
  var actions = el("div", { class: "mg-actions" }, [attackBtn, normalBtn]);

  root.appendChild(el("p", { class: "mg-help", text: t("ransom.help") }));
  root.appendChild(screen);
  root.appendChild(actions);

  attackBtn.addEventListener("click", function () {
    if (decided) return;
    if (!isAttack) {
      decided = true;
      ctx.done({ verdict: "wrong", falseAlarm: true, summary: t("ransom.s.false"), why: t("ransom.why.false") });
      return;
    }
    if (isSupport) {
      decided = true;
      ctx.done({ verdict: "right", summary: t("ransom.s.support"), why: R.support.why });
      return;
    }
    showOrder();
  });

  normalBtn.addEventListener("click", function () {
    if (decided) return;
    decided = true;
    if (isSupport) {
      ctx.done({ verdict: "wrong", summary: t("ransom.s.supportMissed"), why: R.support.why });
    } else if (isAttack) {
      var steps = R.steps.map(function (s) { return s.charAt(0).toLowerCase() + s.slice(1); }).join(", ");
      ctx.done({ verdict: "wrong", summary: t("ransom.s.missed"), why: t("ransom.why.missed", { steps: steps }) });
    } else {
      ctx.done({ verdict: "right", summary: t("ransom.s.right"), why: t("ransom.why.right") });
    }
  });

  /* ---------- Remettre les 4 actions dans l'ordre ---------- */
  function showOrder() {
    actions.remove();
    var chosen = [];
    var list = el("ol", { class: "order__list", "aria-live": "polite" });
    var choices = el("div", { class: "order__choices" });
    var checkBtn = el("button", { class: "mg-btn mg-btn--next", type: "button", text: t("order.check"), disabled: true });
    var resetBtn = el("button", { class: "mg-btn mg-btn--ghost", type: "button", text: t("order.reset") });

    function render() {
      list.innerHTML = "";
      chosen.forEach(function (step) { list.appendChild(el("li", { text: step })); });
      for (var i = chosen.length; i < R.steps.length; i++) list.appendChild(el("li", { class: "is-empty", text: "..." }));
      Array.prototype.forEach.call(choices.children, function (b) { b.disabled = chosen.indexOf(b.textContent) >= 0; });
      checkBtn.disabled = chosen.length !== R.steps.length;
    }

    ctx.shuffle(R.steps).forEach(function (step) {
      choices.appendChild(el("button", {
        class: "order__choice", type: "button", text: step,
        onclick: function () { if (chosen.length < R.steps.length) { chosen.push(step); render(); } }
      }));
    });
    resetBtn.addEventListener("click", function () { chosen = []; render(); });

    root.appendChild(el("div", { class: "order" }, [
      el("p", { class: "order__title", text: t("order.title") }),
      el("p", { class: "mg-help", text: t("order.help") }),
      choices,
      list,
      el("div", { class: "mg-actions" }, [resetBtn, checkBtn])
    ]));
    render();

    checkBtn.addEventListener("click", function () {
      if (decided) return;
      decided = true;
      var good = chosen.filter(function (s, i) { return s === R.steps[i]; }).length;
      var order = R.steps.map(function (s, i) { return (i + 1) + ". " + s; }).join(" · ");
      var result;
      if (good === 4) result = { verdict: "right", summary: t("order.s.perfect") };
      else if (good >= 2) result = { verdict: "almost", summary: t("order.s.almost", { n: good }) };
      else result = { verdict: "wrong", summary: t("order.s.wrong", { n: good }) };
      result.why = t("order.why", { o: order });
      ctx.done(result);
    });
  }

  return function () { timers.forEach(function (id) { clearInterval(id); }); };
});
