/* =========================================================
   MINI-JEU : VRAI OU FAUX SITE ? / SAFE OR FAKE LINK? (#25, #26)
   Une adresse (vraie 45 % du temps), 15 secondes pour décider.
   Temps écoulé = Mauvaise (+1 seulement si c'était la vraie).
   ========================================================= */
Minigames.register("link", function (root, ctx) {
  "use strict";

  var el = ctx.el;
  var t = ctx.t;
  var SECONDS = 15;
  var set = ctx.pick(ctx.data.LINKS);
  var isReal = Math.random() < 0.45;
  var fake = isReal ? null : ctx.pick(set.fakes);
  var url = isReal ? set.real : fake.url;
  var decided = false;

  var bar = ctx.timerBar();
  var fakeBtn = el("button", { class: "mg-btn mg-btn--danger", type: "button", text: t("link.fake") });
  var realBtn = el("button", { class: "mg-btn mg-btn--safe", type: "button", text: t("link.real") });

  root.appendChild(el("p", { class: "mg-help", text: t("link.help") }));
  root.appendChild(bar.node);
  root.appendChild(el("div", { class: "link__browser" }, [
    el("div", { class: "link__dots", "aria-hidden": "true" }, [el("i"), el("i"), el("i")]),
    el("p", { class: "link__url", text: url })
  ]));
  root.appendChild(el("div", { class: "mg-actions" }, [fakeBtn, realBtn]));

  var timer = ctx.countdown(SECONDS, bar.fill, bar.label, function () { decide(null); });

  function decide(saysFake) {
    if (decided) return;
    decided = true;
    timer.stop();
    var realTip = t("link.realTip", { u: set.real });
    var result;
    if (saysFake === null) {
      result = isReal
        ? { verdict: "wrong", falseAlarm: true, summary: t("link.s.timeReal"), why: t("link.wasReal") + realTip }
        : { verdict: "wrong", summary: t("link.s.timeFake"), why: fake.tip + " " + realTip };
    } else if (isReal) {
      result = saysFake
        ? { verdict: "wrong", falseAlarm: true, summary: t("link.s.falseReal"), why: t("link.wasReal") + realTip }
        : { verdict: "right", summary: t("link.s.right"), why: realTip + t("link.readEnd") };
    } else {
      result = saysFake
        ? { verdict: "right", summary: t("link.s.spotted"), why: fake.tip + " " + realTip }
        : { verdict: "wrong", summary: t("link.s.fooled"), why: fake.tip + " " + realTip };
    }
    ctx.done(result);
  }

  fakeBtn.addEventListener("click", function () { decide(true); });
  realBtn.addEventListener("click", function () { decide(false); });

  return function () { timer.stop(); };
});
