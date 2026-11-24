/* =========================================================
   MINI-JEU : BUREAU EN DÉSORDRE / MESSY DESK (#13)
   Un bureau dessiné en SVG, 40 secondes pour toucher les erreurs.
   Parfois il n'y en a aucune. Toucher un objet normal = fausse alerte.
   Right  = toutes trouvées et au plus 1 fausse alerte
   Almost = 1 oubli, ou toutes trouvées avec 2 fausses alertes ou plus
   Wrong  = 2 oublis ou plus
   ========================================================= */
Minigames.register("desk", function (root, ctx) {
  "use strict";

  var el = ctx.el;
  var t = ctx.t;
  var DESK = ctx.data.DESK;
  var ALL = Object.keys(DESK.errors);           // postit, usb, session, badge, code, doc
  var count = ctx.pick(DESK.errorCounts);
  var errors = ctx.shuffle(ALL).slice(0, count);
  function has(id) { return errors.indexOf(id) >= 0; }

  var found = [];
  var falseAlarms = 0;
  var decided = false;

  /* ---------- Le dessin ----------
     Chaque objet touchable : <g class="desk__item" data-id="..."> avec un cadre .desk__hit */
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/'/g, "&#39;").replace(/</g, "&lt;");
  }
  function item(id, label, hit, inner) {
    return "<g class='desk__item' data-id='" + id + "' role='button' tabindex='0' aria-label='" + esc(label) + "'>" +
      inner + "<rect class='desk__hit' x='" + hit[0] + "' y='" + hit[1] + "' width='" + hit[2] + "' height='" + hit[3] + "' rx='6'/></g>";
  }

  var svg = "" +
    "<svg class='desk__svg' viewBox='0 0 400 300' xmlns='http://www.w3.org/2000/svg'>" +
    /* mur, fenêtre, bureau */
    "<rect width='400' height='175' fill='#17223A'/>" +
    "<rect x='18' y='18' width='86' height='64' rx='4' fill='#0E1626' stroke='#2C3B57' stroke-width='3'/>" +
    "<path d='M61 18v64M18 50h86' stroke='#2C3B57' stroke-width='3'/>" +
    "<circle cx='88' cy='34' r='6' fill='#F2E7B8' opacity='.8'/>" +
    "<rect y='170' width='400' height='130' fill='#4A3A2C'/>" +
    "<rect y='170' width='400' height='8' fill='#5E4A38'/>" +

    /* plante (leurre) */
    item("plant", t("desk.a.plant"), [20, 98, 54, 82],
      "<ellipse cx='36' cy='122' rx='10' ry='22' fill='#3E8E52' transform='rotate(-25 36 122)'/>" +
      "<ellipse cx='58' cy='118' rx='10' ry='24' fill='#4FA864' transform='rotate(20 58 118)'/>" +
      "<ellipse cx='47' cy='112' rx='8' ry='24' fill='#5DB870'/>" +
      "<path d='M30 145h34l-5 32H35z' fill='#B0623A'/>") +

    /* écran : session ouverte (erreur) ou verrouillé */
    item("session", t(has("session") ? "desk.a.screenOn" : "desk.a.screenLocked"), [118, 36, 164, 130],
      "<rect x='190' y='142' width='20' height='26' fill='#5A6B85'/><rect x='170' y='164' width='60' height='8' rx='3' fill='#5A6B85'/>" +
      "<rect x='120' y='38' width='160' height='106' rx='6' fill='#0B111C' stroke='#5A6B85' stroke-width='4'/>" +
      (has("session")
        ? "<rect x='126' y='44' width='148' height='14' fill='#1F6FB2'/>" +
          "<text x='130' y='54' font-size='9' fill='#fff' font-family='Arial, sans-serif'>" + t("desk.svg.session") + "</text>" +
          "<path d='M128 66h140M128 78h140M128 90h140M128 102h140M128 114h140M128 126h140M168 62v72M218 62v72' stroke='#2F4566' stroke-width='1.5'/>" +
          "<rect x='130' y='68' width='30' height='6' fill='#5DB870'/><rect x='172' y='80' width='40' height='6' fill='#F28C28'/><rect x='222' y='92' width='36' height='6' fill='#A9B4C4'/>"
        : "<rect x='186' y='76' width='28' height='22' rx='3' fill='none' stroke='#A9B4C4' stroke-width='3'/>" +
          "<path d='M192 76v-7a8 8 0 0 1 16 0v7' fill='none' stroke='#A9B4C4' stroke-width='3'/>" +
          "<text x='200' y='118' font-size='11' fill='#A9B4C4' text-anchor='middle' font-family='Arial, sans-serif'>" + t("desk.svg.locked") + "</text>")) +

    /* post-it (erreur seulement) */
    (has("postit") ? item("postit", t("desk.a.postit"), [252, 36, 50, 52],
      "<g transform='rotate(8 277 62)'><rect x='256' y='40' width='42' height='42' fill='#FFD84D'/>" +
      "<text x='261' y='56' font-size='9' fill='#3A2F00' font-family='Arial, sans-serif'>" + t("desk.svg.pwd") + "</text>" +
      "<text x='261' y='70' font-size='9' fill='#3A2F00' font-family='Arial, sans-serif' font-weight='bold'>Nova2026!</text></g>") : "") +

    /* box / routeur sur l'étagère : mot de passe Wi-Fi collé dessus (erreur) ou rien */
    "<rect x='306' y='84' width='90' height='5' fill='#5E4A38'/>" +
    item("router", t(has("router") ? "desk.a.routerPwd" : "desk.a.router"), [306, 28, 90, 58],
      "<path d='M326 64l-6-26M372 64l6-26' stroke='#A9B4C4' stroke-width='3' stroke-linecap='round'/>" +
      "<rect x='314' y='62' width='72' height='22' rx='5' fill='#E6EAF0'/>" +
      "<circle cx='324' cy='73' r='2.5' fill='#5DB870'/><circle cx='333' cy='73' r='2.5' fill='#5DB870'/><circle cx='342' cy='73' r='2.5' fill='#F28C28'/>" +
      "<text x='366' y='76' font-size='7' fill='#1D2A3D' text-anchor='middle' font-weight='bold' font-family='Arial, sans-serif'>NovaBox</text>" +
      (has("router")
        ? "<g transform='rotate(-6 360 50)'><rect x='334' y='38' width='54' height='22' fill='#FFD84D'/>" +
          "<text x='361' y='47' font-size='6.5' fill='#3A2F00' text-anchor='middle' font-family='Arial, sans-serif'>Wi-Fi :</text>" +
          "<text x='361' y='56' font-size='7' fill='#3A2F00' text-anchor='middle' font-weight='bold' font-family='Arial, sans-serif'>Nova1234</text></g>"
        : "")) +

    /* imprimante + document confidentiel (erreur) */
    item("doc", t(has("doc") ? "desk.a.printerDoc" : "desk.a.printer"), [318, 96, 78, 80],
      (has("doc")
        ? "<rect x='330' y='100' width='52' height='34' fill='#fff' transform='rotate(-4 356 117)'/>" +
          "<text x='356' y='116' font-size='7.5' fill='#C8161D' text-anchor='middle' font-weight='bold' font-family='Arial, sans-serif' transform='rotate(-4 356 117)'>" + t("desk.svg.conf") + "</text>" +
          "<path d='M336 122h40M336 128h30' stroke='#B8C0CC' stroke-width='2' transform='rotate(-4 356 117)'/>"
        : "") +
      "<rect x='322' y='126' width='70' height='44' rx='5' fill='#9AA4B2'/><rect x='330' y='134' width='54' height='6' rx='2' fill='#5A6474'/>" +
      "<circle cx='382' cy='158' r='3' fill='#5DB870'/>") +

    /* clavier (leurre) */
    item("keyboard", t("desk.a.keyboard"), [128, 196, 146, 42],
      "<rect x='132' y='200' width='138' height='34' rx='5' fill='#C9D1DC'/>" +
      "<path d='M140 210h122M140 218h122M140 226h122' stroke='#9AA4B2' stroke-width='3' stroke-dasharray='8 3'/>") +

    /* tasse (leurre) */
    item("mug", t("desk.a.mug"), [286, 186, 46, 50],
      "<rect x='292' y='192' width='28' height='36' rx='4' fill='#EDEFF3'/>" +
      "<path d='M320 200h6a6 6 0 0 1 0 14h-6' fill='none' stroke='#EDEFF3' stroke-width='4'/>" +
      "<text x='306' y='214' font-size='7' fill='#1D2A3D' text-anchor='middle' font-weight='bold' font-family='Arial, sans-serif'>NOVA</text>") +

    /* téléphone : code 2FA visible (erreur) ou écran normal */
    item("code", t(has("code") ? "desk.a.phoneCode" : "desk.a.phone"), [54, 200, 46, 66],
      "<rect x='58' y='204' width='38' height='58' rx='6' fill='#0B0F17' stroke='#5A6B85' stroke-width='2'/>" +
      (has("code")
        ? "<rect x='62' y='214' width='30' height='30' rx='3' fill='#1D2A3D'/>" +
          "<text x='77' y='225' font-size='6' fill='#A9B4C4' text-anchor='middle' font-family='Arial, sans-serif'>" + t("desk.svg.code") + "</text>" +
          "<text x='77' y='237' font-size='8' fill='#5DB870' text-anchor='middle' font-weight='bold' font-family='Arial, sans-serif'>482 913</text>"
        : "<text x='77' y='236' font-size='10' fill='#5A6B85' text-anchor='middle' font-family='Arial, sans-serif'>18:30</text>")) +

    /* clé USB (erreur seulement) */
    (has("usb") ? item("usb", t("desk.a.usb"), [214, 244, 64, 30],
      "<rect x='220' y='252' width='42' height='15' rx='3' fill='#D71920'/><rect x='262' y='255' width='12' height='9' fill='#B8C0CC'/>" +
      "<text x='241' y='263' font-size='8' fill='#fff' text-anchor='middle' font-weight='bold' font-family='Arial, sans-serif'>FREE</text>") : "") +

    /* badge (erreur seulement) */
    (has("badge") ? item("badge", t("desk.a.badge"), [318, 234, 64, 50],
      "<path d='M330 238c10 -14 30 -14 40 0' fill='none' stroke='#1F6FB2' stroke-width='3'/>" +
      "<rect x='324' y='240' width='52' height='38' rx='4' fill='#fff'/><rect x='324' y='240' width='52' height='10' rx='3' fill='#1F6FB2'/>" +
      "<circle cx='336' cy='262' r='6' fill='#A9B4C4'/>" +
      "<text x='358' y='260' font-size='6.5' fill='#1D2A3D' text-anchor='middle' font-family='Arial, sans-serif'>NovaCorp</text>" +
      "<text x='358' y='270' font-size='6' fill='#5A6474' text-anchor='middle' font-family='Arial, sans-serif'>J. Doe</text>") : "") +
    "</svg>";

  var bar = ctx.timerBar();
  var counter = el("p", { class: "desk__counter", "aria-live": "polite", text: t("desk.counter", { f: 0, a: 0 }) });
  var drawing = el("div", { class: "desk", html: svg });
  var doneBtn = el("button", { class: "mg-btn mg-btn--next", type: "button", text: t("desk.done") });

  root.appendChild(el("p", { class: "mg-help", text: t("desk.help") }));
  root.appendChild(el("p", { class: "desk__title", text: DESK.title }));
  root.appendChild(bar.node);
  root.appendChild(drawing);
  root.appendChild(counter);
  root.appendChild(el("div", { class: "mg-actions" }, [doneBtn]));

  /* ---------- Toucher un objet ---------- */
  function tap(g) {
    if (decided) return;
    var id = g.getAttribute("data-id");
    if (has(id)) {
      if (found.indexOf(id) < 0) {
        found.push(id);
        g.classList.add("is-found");
      }
    } else if (!g.classList.contains("is-false")) {
      falseAlarms++;
      g.classList.add("is-false");
    }
    counter.textContent = t("desk.counter", { f: found.length, a: falseAlarms });
  }

  Array.prototype.forEach.call(drawing.querySelectorAll(".desk__item"), function (g) {
    g.addEventListener("click", function () { tap(g); });
    g.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap(g); }
    });
  });

  var timer = ctx.countdown(DESK.seconds, bar.fill, bar.label, finish);
  doneBtn.addEventListener("click", finish);

  /* ---------- Fin ---------- */
  function finish() {
    if (decided) return;
    decided = true;
    timer.stop();
    var missed = errors.filter(function (id) { return found.indexOf(id) < 0; });
    missed.forEach(function (id) {
      var g = drawing.querySelector(".desk__item[data-id='" + id + "']");
      if (g) g.classList.add("is-missed");
    });

    var result;
    if (missed.length >= 2) result = { verdict: "wrong", summary: t("desk.s.wrong", { n: missed.length }) };
    else if (missed.length === 1) result = { verdict: "almost", summary: t("desk.s.almost1") };
    else if (falseAlarms >= 2) result = { verdict: "almost", summary: t("desk.s.almostFA", { n: falseAlarms }) };
    else result = { verdict: "right", summary: t(errors.length ? "desk.s.right" : "desk.s.safe") };

    function names(ids) { return ids.map(function (id) { return DESK.errors[id]; }).join(" ; "); }
    var why = errors.length ? t("desk.why.list", { l: names(errors) }) : t("desk.why.none");
    if (missed.length) why += t("desk.why.missed", { l: names(missed) });
    why += t("desk.why.tip");
    result.why = why;

    doneBtn.textContent = t("mg.seeResult");
    doneBtn.onclick = function () { ctx.done(result); };
    doneBtn.removeEventListener("click", finish);
    counter.textContent = result.summary + (missed.length ? t("desk.missedRed") : "");
  }

  return function () { timer.stop(); };
});
