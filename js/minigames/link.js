/* =========================================================
   MINI-JEU : VRAI OU FAUX ? / SAFE OR FAKE LINK? (#25, #26)
   Une adresse de site, une adresse ouverte par un QR code,
   ou un nom de réseau Wi-Fi. Vrai 45 % du temps, 15 secondes.
   Temps écoulé = Mauvaise (+1 seulement si c'était le vrai).
   ========================================================= */
Minigames.register("link", function (root, ctx) {
  "use strict";

  var el = ctx.el;
  var t = ctx.t;
  var SECONDS = 15;
  var set = ctx.pick(ctx.data.LINKS);
  var kind = set.kind === "wifi" ? "wifi" : "site";   // un QR code ouvre un site
  var isReal = Math.random() < 0.45;
  var fake = isReal ? null : ctx.pick(set.fakes);
  var url = isReal ? set.real : fake.url;
  var x = t("link.thing." + kind);                    // "site" ou "réseau"
  var decided = false;

  var bar = ctx.timerBar();
  var fakeBtn = el("button", { class: "mg-btn mg-btn--danger", type: "button", text: t("link.fake." + kind) });
  var realBtn = el("button", { class: "mg-btn mg-btn--safe", type: "button", text: t("link.real." + kind) });

  root.appendChild(el("p", { class: "mg-help", text: t("link.help." + kind) }));
  root.appendChild(bar.node);
  if (set.context) root.appendChild(el("p", { class: "link__context", text: set.context }));
  root.appendChild(el("div", { class: "link__browser link__browser--" + set.kind }, [
    el("div", { class: "link__dots", "aria-hidden": "true" }, kind === "wifi"
      ? [el("span", { class: "link__wifi", text: "📶 Wi-Fi" })]
      : [el("i"), el("i"), el("i")]),
    el("p", { class: "link__url", text: url })
  ]));
  root.appendChild(el("div", { class: "mg-actions" }, [fakeBtn, realBtn]));

  var timer = ctx.countdown(SECONDS, bar.fill, bar.label, function () { decide(null); });

  function decide(saysFake) {
    if (decided) return;
    decided = true;
    timer.stop();
    var realTip = t("link.realTip." + kind, { u: set.real }) + (set.extra ? " " + set.extra : "");
    var result;
    if (saysFake === null) {
      result = isReal
        ? { verdict: "wrong", falseAlarm: true, summary: t("link.s.timeReal", { x: x }), why: t("link.wasReal") + realTip }
        : { verdict: "wrong", summary: t("link.s.timeFake", { x: x }), why: fake.tip + " " + realTip };
    } else if (isReal) {
      result = saysFake
        ? { verdict: "wrong", falseAlarm: true, summary: t("link.s.falseReal", { x: x }), why: t("link.wasReal") + realTip }
        : { verdict: "right", summary: t("link.s.right", { x: x }), why: realTip + (kind === "site" ? t("link.readEnd") : "") };
    } else {
      result = saysFake
        ? { verdict: "right", summary: t("link.s.spotted", { x: x }), why: fake.tip + " " + realTip }
        : { verdict: "wrong", summary: t("link.s.fooled", { x: x }), why: fake.tip + " " + realTip };
    }
    ctx.done(result);
  }

  fakeBtn.addEventListener("click", function () { decide(true); });
  realBtn.addEventListener("click", function () { decide(false); });

  return function () { timer.stop(); };
});
