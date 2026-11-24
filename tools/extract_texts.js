// Lit les textes de la voix (hacker + appels) dans js/cards.js et js/cards-fr.js, pour les 2 langues
const fs = require("fs");
const path = require("path");
const root = process.argv[2];
const out = {};
for (const lang of ["fr", "en"]) {
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
    calls: D.CALLS.map((c, i) => ({ key: "call-" + i, name: c.name, text: c.text }))
  };
}
process.stdout.write(JSON.stringify(out, null, 1));
