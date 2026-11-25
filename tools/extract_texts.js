// Lit les textes de la voix (hacker + appels) dans js/cards.js et js/cards-fr.js, pour les 2 langues
const fs = require("fs");
const path = require("path");
const root = process.argv[2];
const out = {};
// Phrases du téléphone maître du jeu (voix du hacker), une par fichier guide-*
function guide(D) {
  const T = D.HACKER.turn, g = {};
  g["guide-draw"] = T.draw;
  g["guide-choose"] = T.choose;
  g["guide-choose2"] = T.choose2;
  for (let n = 0; n <= D.DEFENCES.length; n++) {
    const name = n === 0 ? "It's safe!" : D.DEFENCES[n - 1];
    g["guide-card-" + n] = T.card.replace("{n}", n);   // seulement le numéro : le nom est sur la carte papier
  }
  g["guide-blocked"] = T.blocked;
  for (let n = 1; n <= 10; n++) g["guide-pawn-" + n] = T.pawn.replace("{n}", n);
  g["guide-flip"] = T.flip;
  g["guide-flip2"] = T.flip2;
  g["guide-next"] = T.next;
  g["guide-or"] = T.or;
  g["guide-question"] = T.question;
  g["guide-correct"] = T.correct;
  g["guide-wrong"] = T.wrong;
  return g;
}
for (const lang of ["en"]) {   // la voix parle toujours anglais (English Game)
  const ctx = { window: {}, console };
  ctx.window.NovaI18n = { lang };
  const run = (file) => new Function("window", fs.readFileSync(path.join(root, "js", file), "utf8"))(ctx.window);
  run("cards.js");
  run("cards-fr.js");
  const D = ctx.window.NOVA_DATA;
  out[lang] = {
    hacker: {
      "hacker-start": D.HACKER.start,
      "hacker-timed-0": D.HACKER.timed[0],
      "hacker-timed-1": D.HACKER.timed[1],
      "hacker-timed-2": D.HACKER.timed[2],
      "hacker-timed-3": D.HACKER.timed[3],
      "hacker-alert": D.HACKER.alert,
      "hacker-win": D.HACKER.win,
      "hacker-lose": D.HACKER.lose
    },
    calls: D.CALLS.map((c, i) => ({ key: "call-" + i, name: c.name, text: c.text })),
    guide: guide(D)
  };
}
process.stdout.write(JSON.stringify(out, null, 1));
