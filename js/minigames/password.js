/* =========================================================
   MINI-JEU : DEMANDE DE MOT DE PASSE / PASSWORD REQUEST (#7, #8)
   Un mail sur le mot de passe, vrai ou faux : Signaler ou Changer.
   Mail vrai → on invente un FAUX mot de passe qui doit tenir 100 ans.
   Le mot de passe tapé n'est jamais enregistré.
   ========================================================= */
Minigames.register("password", function (root, ctx) {
  "use strict";

  var el = ctx.el;
  var t = ctx.t;
  var D = ctx.data;
  var mail = ctx.pick(D.PASSWORD);
  var GUESSES_PER_SECOND = 1e10;   // 10 milliards d'essais par seconde
  var YEAR = 31557600;

  /* ---------- Temps pour casser un mot de passe (en secondes) ---------- */
  function crackSeconds(pw) {
    if (!pw) return 0;
    var lower = pw.toLowerCase();
    var letters = lower.replace(/[^a-z]/g, "");
    var isCommon = D.COMMON_PASSWORDS.indexOf(lower) >= 0 || D.COMMON_PASSWORDS.indexOf(letters) >= 0;
    var isRepeat = /^(.)\1+$/.test(pw);
    var isSequence = "0123456789abcdefghijklmnopqrstuvwxyz".indexOf(lower) >= 0 || "azertyuiopqwertyuiop".indexOf(lower) >= 0;
    if (pw.length < 12 && (isCommon || isRepeat || isSequence)) return 0;

    var pool = 0;
    if (/[a-z]/.test(pw)) pool += 26;
    if (/[A-Z]/.test(pw)) pool += 26;
    if (/[0-9]/.test(pw)) pool += 10;
    if (/[^a-zA-Z0-9]/.test(pw)) pool += 33;
    return Math.pow(pool, pw.length) / GUESSES_PER_SECOND;
  }

  /* Durée lisible : "3 jours", "des millions d'années"... */
  function duration(s) {
    function unit(v, key) { v = Math.floor(v); return v + " " + t(key) + (v > 1 ? t("dur.plural") : ""); }
    if (s < 60) return unit(Math.max(1, s), "dur.second");
    if (s < 3600) return unit(s / 60, "dur.minute");
    if (s < 86400) return unit(s / 3600, "dur.hour");
    if (s < YEAR) return unit(s / 86400, "dur.day");
    var y = s / YEAR;
    if (y < 1000) return unit(y, "dur.year");
    if (y < 1e6) return t("dur.thousands");
    if (y < 1e9) return t("dur.millions");
    return t("dur.billions");
  }
  /* "immédiatement" ou "en 3 jours" */
  function inTime(s) { return s < 1 ? t("dur.instant") : t("dur.in", { t: duration(s) }); }
  /* "immédiatement" ou "3 jours" */
  function plainTime(s) { return s < 1 ? t("dur.instant") : duration(s); }

  /* ---------- Le mail ---------- */
  var box = el("article", { class: "pw__mail" }, [
    el("p", { class: "pw__from" }, [el("b", { text: mail.fromName }), " <" + mail.from + ">"]),
    el("p", { class: "pw__subject", text: mail.subject }),
    el("p", { class: "pw__text", text: mail.text })
  ]);
  var reportBtn = el("button", { class: "mg-btn mg-btn--danger", type: "button", text: t("pw.report") });
  var changeBtn = el("button", { class: "mg-btn mg-btn--safe", type: "button", text: t("pw.change") });
  var actions = el("div", { class: "mg-actions" }, [reportBtn, changeBtn]);

  root.appendChild(el("p", { class: "mg-help", text: t("pw.help") }));
  root.appendChild(box);
  root.appendChild(actions);

  reportBtn.addEventListener("click", function () {
    if (mail.real) ctx.done({ verdict: "wrong", falseAlarm: true, summary: t("pw.s.false"), why: mail.why });
    else ctx.done({ verdict: "right", summary: t("pw.s.reported"), why: mail.why });
  });

  changeBtn.addEventListener("click", function () {
    if (!mail.real) {
      ctx.done({ verdict: "wrong", summary: t("pw.s.fake"), why: mail.why });
      return;
    }
    showBuilder();
  });

  /* ---------- Créer un faux mot de passe solide ---------- */
  function showBuilder() {
    actions.remove();
    box.classList.add("is-done");

    var input = el("input", {
      class: "pw__input", id: "pwInput", type: "text", autocomplete: "off", autocapitalize: "off",
      autocorrect: "off", spellcheck: "false", maxlength: "64", placeholder: t("pw.placeholder")
    });
    var meter = el("p", { class: "pw__meter", "aria-live": "polite", text: t("pw.meter", { t: plainTime(0) }) });
    var saveBtn = el("button", { class: "mg-btn mg-btn--next", type: "button", text: t("pw.save") });

    root.appendChild(el("div", { class: "pw__builder" }, [
      el("p", { class: "pw__warn", text: t("pw.warn") }),
      el("label", { class: "pw__label", for: "pwInput", text: t("pw.label") }),
      input,
      meter,
      el("p", { class: "pw__goal", text: t("pw.goal") }),
      saveBtn
    ]));
    input.focus();

    input.addEventListener("input", function () {
      var s = crackSeconds(input.value);
      meter.textContent = t("pw.meter", { t: plainTime(s) });
      meter.className = "pw__meter " + (s >= 100 * YEAR ? "is-strong" : s >= YEAR ? "is-medium" : "is-weak");
    });

    saveBtn.addEventListener("click", function () {
      var s = crackSeconds(input.value);
      // On oublie tout de suite le mot de passe
      input.value = "";
      var years = s / YEAR;
      if (years >= 100) {
        ctx.done({ verdict: "right", summary: t("pw.s.strong"), why: mail.why + t("pw.why.strong", { t: plainTime(s) }) });
      } else if (years >= 1) {
        ctx.done({ verdict: "almost", summary: t("pw.s.medium"), why: t("pw.why.medium", { t: plainTime(s) }) + t("pw.tip") });
      } else {
        ctx.done({ verdict: "wrong", summary: t("pw.s.weak", { t: inTime(s) }), why: t("pw.why.weak", { t: inTime(s) }) + t("pw.tip") });
      }
    });
  }

  return null;
});
