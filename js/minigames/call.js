/* =========================================================
   MINI-JEU : APPEL ENTRANT / INCOMING CALL (#19, #20)
   Le téléphone sonne, on décroche, une voix parle (avec sous-titres).
   Raccrocher et signaler / C'est sûr, on continue.
   ========================================================= */
Minigames.register("call", function (root, ctx) {
  "use strict";

  var el = ctx.el;
  var t = ctx.t;
  var call = ctx.pick(ctx.data.CALLS);
  var timers = [];
  var ringing = true;
  var decided = false;

  /* Pendant tout l'appel, le hacker se tait (sa voix couperait celle de l'appel) */
  NovaAudio.setCallActive(true);

  /* ---------- Sonnerie : gérée par js/audio.js, jamais empilée ---------- */
  function ring() {
    if (!ringing) return;
    if (NovaAudio.ring()) soundHint.hidden = true;
  }

  /* ---------- Écran d'appel ---------- */
  var initials = call.name.replace(/[^A-Za-zÀ-ÿ ]/g, "").split(" ").filter(Boolean).slice(0, 2)
    .map(function (w) { return w[0]; }).join("").toUpperCase() || "?";

  var status = el("p", { class: "call__status", text: t("call.incoming") });
  // Carte scannée : le téléphone bloque le son tant que personne n'a touché l'écran
  var soundHint = el("p", { class: "call__hint", text: t("call.tapSound"), hidden: NovaAudio.canPlay() });
  var transcript = el("p", { class: "call__transcript", "aria-live": "polite" });
  var answerBtn = el("button", { class: "call__answer", type: "button", "aria-label": t("call.answerAria") }, [
    el("span", { "aria-hidden": "true", html: "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2.1z'/></svg>" }),
    t("call.answer")
  ]);

  var phone = el("div", { class: "call is-ringing" }, [
    el("div", { class: "call__avatar", "aria-hidden": "true", text: initials }),
    el("p", { class: "call__name", text: call.name }),
    el("p", { class: "call__number", text: call.number }),
    status,
    soundHint,
    transcript,
    answerBtn
  ]);

  var reportBtn = el("button", { class: "mg-btn mg-btn--danger", type: "button", text: t("call.report"), disabled: true });
  var safeBtn = el("button", { class: "mg-btn mg-btn--safe", type: "button", text: t("call.safe"), disabled: true });

  root.appendChild(el("p", { class: "mg-help", text: t("call.help") }));
  root.appendChild(phone);
  root.appendChild(el("div", { class: "mg-actions" }, [reportBtn, safeBtn]));

  ring();
  var ringTimer = setInterval(ring, 2200);
  timers.push(ringTimer);
  // Premier toucher pendant la sonnerie : on fait sonner tout de suite
  function ringOnTouch() { setTimeout(ring, 50); }
  root.addEventListener("pointerdown", ringOnTouch, { once: true });

  /* ---------- Décrocher ---------- */
  answerBtn.addEventListener("click", function () {
    ringing = false;
    clearInterval(ringTimer);
    NovaAudio.stopRing();
    soundHint.hidden = true;
    phone.classList.remove("is-ringing");
    phone.classList.add("is-talking");
    answerBtn.remove();
    reportBtn.disabled = false;
    safeBtn.disabled = false;

    var start = Date.now();
    function clockText() {
      var s = Math.min(59, Math.floor((Date.now() - start) / 1000));
      return t("call.on", { t: "00:" + (s < 10 ? "0" : "") + s });
    }
    status.textContent = clockText();
    timers.push(setInterval(function () { status.textContent = clockText(); }, 500));

    // Sous-titres mot par mot
    var words = call.text.split(" ");
    var q = window.NovaI18n.lang === "fr" ? ["« ", " »"] : ["“", "”"];
    var i = 0;
    var typer = setInterval(function () {
      i++;
      transcript.textContent = q[0] + words.slice(0, i).join(" ") + (i >= words.length ? q[1] : "");
      if (i >= words.length) clearInterval(typer);
    }, 300);
    timers.push(typer);

    NovaGame.speak(call.text, { speaker: call.name, pitch: call.voice.pitch, rate: 0.95, noSubtitle: true, channel: "call" });
  });

  /* ---------- Décision ---------- */
  function decide(report) {
    if (decided) return;
    decided = true;
    NovaGame.stopSpeaking();
    var result;
    if (call.scam) {
      result = report
        ? { verdict: "right", summary: t("call.s.blocked") }
        : { verdict: "wrong", summary: t("call.s.fooled") };
    } else {
      result = report
        ? { verdict: "wrong", falseAlarm: true, summary: t("call.s.false") }
        : { verdict: "right", summary: t("call.s.right") };
    }
    result.fam = call.fam;
    result.why = call.why;
    ctx.done(result);
  }
  reportBtn.addEventListener("click", function () { decide(true); });
  safeBtn.addEventListener("click", function () { decide(false); });

  return function () {
    ringing = false;
    timers.forEach(function (id) { clearInterval(id); });
    root.removeEventListener("pointerdown", ringOnTouch);
    NovaAudio.stopRing();
    NovaGame.stopSpeaking();
    NovaAudio.setCallActive(false);
  };
});
