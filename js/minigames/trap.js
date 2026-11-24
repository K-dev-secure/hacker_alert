/* =========================================================
   MINI-JEU : REPÈRE LE PIÈGE / SPOT THE TRAP (#1, #2)
   Un mail ou SMS. On touche ce qui est louche, on reste appuyé
   sur un lien pour voir sa vraie adresse, puis Signaler ou C'est sûr.
   ========================================================= */
Minigames.register("trap", function (root, ctx) {
  "use strict";

  var el = ctx.el;
  var t = ctx.t;
  var msg = ctx.pick(ctx.data.TRAP);
  var LONG_PRESS_MS = 550;
  var timers = [];
  var decided = false;

  /* Transforme une liste de morceaux en <span> touchables */
  function segments(parts) {
    return parts.map(function (p) {
      var seg = typeof p === "string" ? { t: p } : p;
      var span = el("span", {
        class: "trap__seg" + (seg.sus ? " is-sus" : ""),
        role: "button", tabindex: "0", text: seg.t
      });
      var toggle = function () {
        if (decided) return;
        span.classList.toggle("is-flagged");
      };
      span.addEventListener("click", toggle);
      span.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
      });
      return span;
    });
  }

  /* ---------- Lien : appui long = vraie adresse, clic = on clique vraiment ---------- */
  function buildLink(link) {
    var tip = el("span", { class: "trap__tip", role: "status", hidden: true });
    var btn = el("button", {
      class: "trap__link", type: "button",
      "aria-label": t("trap.linkAria", { label: link.label })
    }, [link.label]);
    var pressTimer = null;
    var longPressed = false;

    function showTip(prefix) {
      tip.textContent = prefix + link.href;
      tip.hidden = false;
    }
    btn.addEventListener("pointerdown", function () {
      longPressed = false;
      clearTimeout(pressTimer);
      pressTimer = setTimeout(function () {
        longPressed = true;
        showTip(t("trap.realAddr"));
        if (navigator.vibrate && NovaAudio.canPlay()) { try { navigator.vibrate(30); } catch (e) { /* rien */ } }
      }, LONG_PRESS_MS);
      timers.push(pressTimer);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach(function (type) {
      btn.addEventListener(type, function () { clearTimeout(pressTimer); });
    });
    btn.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    btn.addEventListener("click", function () {
      if (decided) return;
      if (longPressed) { longPressed = false; return; }
      if (link.scam) decide("clicked");
      else showTip(t("trap.safeLink"));
    });
    return el("span", { class: "trap__linkwrap" }, [btn, tip]);
  }

  /* ---------- Le message ---------- */
  var box;
  if (msg.kind === "sms") {
    box = el("article", { class: "trap__msg trap__msg--sms" }, [
      el("p", { class: "trap__smsfrom", text: msg.fromName }),
      el("p", { class: "trap__bubble" }, segments(msg.body).concat(msg.link ? [buildLink(msg.link)] : []))
    ]);
  } else {
    box = el("article", { class: "trap__msg trap__msg--email" }, [
      el("div", { class: "trap__header" }, [
        el("p", { class: "trap__from" }, [el("b", { text: msg.fromName }), " "]
          .concat(msg.from ? ["<"].concat(segments([msg.from])).concat([">"]) : [])),
        el("p", { class: "trap__subject" }, segments(msg.subject))
      ]),
      el("p", { class: "trap__text" }, segments(msg.body)),
      msg.link ? el("p", { class: "trap__cta" }, [buildLink(msg.link)]) : null
    ]);
  }

  var reportBtn = el("button", { class: "mg-btn mg-btn--danger", type: "button", text: t("trap.report") });
  var safeBtn = el("button", { class: "mg-btn mg-btn--safe", type: "button", text: t("trap.safe") });
  var after = el("div", { class: "mg-after", hidden: true });

  root.appendChild(el("p", { class: "mg-help", text: t("trap.help") }));
  root.appendChild(box);
  root.appendChild(el("div", { class: "mg-actions" }, [reportBtn, safeBtn]));
  root.appendChild(after);

  reportBtn.addEventListener("click", function () { decide("report"); });
  safeBtn.addEventListener("click", function () { decide("safe"); });

  /* ---------- Décision ---------- */
  function decide(choice) {
    if (decided) return;
    decided = true;
    box.classList.add("is-revealed");
    reportBtn.disabled = true;
    safeBtn.disabled = true;

    var sus = box.querySelectorAll(".trap__seg.is-sus");
    var found = box.querySelectorAll(".trap__seg.is-sus.is-flagged").length;

    var result;
    if (msg.scam) {
      if (choice === "report") result = { verdict: "right", summary: t("trap.s.reported") };
      else if (choice === "clicked") result = { verdict: "wrong", summary: t("trap.s.clicked") };
      else result = { verdict: "wrong", summary: t("trap.s.wasScam") };
    } else {
      result = choice === "safe"
        ? { verdict: "right", summary: t("trap.s.real") }
        : { verdict: "wrong", falseAlarm: true, summary: t("trap.s.false") };
    }
    result.fam = msg.fam;
    result.why = msg.why + (sus.length ? t("trap.spotted", { f: found, n: sus.length }) : "");

    after.hidden = false;
    after.appendChild(el("p", { class: "mg-after__text", text: result.summary + (sus.length ? t("trap.redNow") : "") }));
    after.appendChild(el("button", {
      class: "mg-btn mg-btn--next", type: "button", text: t("mg.seeResult"),
      onclick: function () { ctx.done(result); }
    }));
    after.querySelector("button").focus();
  }

  return function () { timers.forEach(clearTimeout); };
});
