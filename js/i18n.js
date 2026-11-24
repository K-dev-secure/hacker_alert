/* =========================================================
   HACKER ALERT — LANGUES (français par défaut, anglais en option)
   Tous les textes de l'interface sont ici.
   t("clé", { variable: valeur }) renvoie le texte dans la langue choisie.
   ========================================================= */
window.NovaI18n = (function () {
  "use strict";

  var KEY = "novacorp-lang";
  var saved = null;
  try { saved = window.localStorage.getItem(KEY); } catch (e) { saved = null; }
  var lang = saved === "en" ? "en" : "fr";

  var S = {
    /* =================== FRANÇAIS =================== */
    fr: {
      "fake": "Jeu d'entraînement. Tout est faux : ne tape jamais de vraie information.",
      "lang.switch": "EN",
      "lang.aria": "Switch to English",
      "voice.on": "Voix du hacker : activée",
      "voice.off": "Voix du hacker : coupée",
      "hud.time": "Temps restant",
      "hud.attack": "Attaque",

      "home.intro": "NovaCorp est attaquée. Vous êtes l'équipe de sécurité. Vous avez 10 minutes pour bloquer 6 attaques.",
      "home.resume": "Une partie est en cours sur ce téléphone.",
      "home.continue": "Continuer la partie",
      "home.new": "Nouvelle partie",
      "home.level": "Choisis ton niveau",
      "lvl.junior": "Les cartes vertes se réutilisent. Pour une première partie.",
      "lvl.pro": "Chaque carte verte ne sert qu'une fois. Partie normale.",
      "lvl.expert": "Une seule utilisation, et certaines attaques demandent 2 cartes vertes.",
      "home.start": "Commencer",
      "home.rules": "📋 La fiche des règles",
      "home.practice": "Mode entraînement : les mini-jeux, sans chrono ni jauge",
      "confirm.newGame": "Une partie est en cours. En commencer une nouvelle ?",

      "pad.help": "Maître du jeu : tape le numéro de la carte rouge.",
      "pad.delete": "Effacer",
      "pad.invalid": "Tape un numéro de carte rouge entre 1 et 30.",
      "pad.played": "La carte #{n} a déjà été jouée.",
      "card.real": "Carte « vrai message »",
      "card.best": "Meilleure",
      "card.ok": "Acceptable",
      "card.none": "aucune",
      "card.sev": "Gravité {n}",
      "card.expert": "Expert : les 2 cartes = Bonne · une seule des 2 = Presque · aucune = Mauvaise.",
      "v.right": "✅ Bonne défense",
      "v.right.sub": "la meilleure défense",
      "v.almost": "🟠 Presque",
      "v.almost.sub": "la défense acceptable",
      "v.wrong": "❌ Mauvaise défense",
      "v.wrong.sub": "une autre carte",
      "v.wrong.subReal": "l'équipe l'a signalé comme une arnaque",
      "card.back": "Mauvais numéro ? Retour",
      "qr.tag": "Message entrant ! Carte QR",
      "qr.text": "Toute l'équipe joue le mini-jeu ensemble. Aucune carte verte n'est jouée ni usée. L'appli applique la sanction.",
      "qr.open": "Ouvrir",
      "game.rules": "📋 Fiche des règles",
      "game.abandon": "Abandonner la partie",
      "confirm.abandon": "Abandonner cette partie ? La jauge et le chrono seront perdus.",

      "res.right": "Hacker bloqué !",
      "res.almost": "Presque",
      "res.wrong": "Mauvaise défense",
      "res.false": "Fausse alerte",
      "calc.right": "Bonne défense : +0",
      "calc.false": "Fausse alerte : +1",
      "calc.almost": "Presque : +1",
      "calc.wrong": "Mauvaise défense {sk} : +{n}",
      "calc.alert": "Bonus alerte rouge (jauge à 5 ou plus) : +1",
      "calc.family": "Même erreur deux fois, « le hacker connaît ta faiblesse » : +1",
      "calc.total": "Total : +{n}",
      "calc.gauge": "Jauge d'intrusion : {a} → {b}/10",
      "calc.practice": "En vraie partie : +{n} (sans les bonus du hacker)",
      "res.best": "Meilleure défense : {d}",
      "res.noGame": "Aucune partie en cours sur ce téléphone : ce résultat ne compte pas. Conseil : le maître du jeu tape le numéro de la carte QR dans le téléphone de la partie, puis appuie sur Ouvrir.",
      "res.next": "Attaque suivante",
      "res.toEnd": "Voir la fin de la partie",
      "res.backPractice": "Retour à l'entraînement",
      "res.backHome": "Retour à l'accueil",

      "end.wonBig": "NOVACORP SAUVÉE !",
      "end.lostBig": "GAME OVER",
      "end.wonTitle": "Entreprise sauvée !",
      "end.lostTitle": "Le hacker est entré !",
      "end.score": "Score : {n}/10",
      "end.perfect": " (parfait !)",
      "end.gauge10": "La jauge d'intrusion a atteint 10.",
      "end.time": "Temps écoulé avant la fin des 6 attaques.",
      "end.recap": "Attaques jouées",
      "end.none": "Aucune attaque jouée.",
      "end.v.right": "Bonne",
      "end.v.almost": "Presque",
      "end.v.wrong": "Mauvaise",
      "end.v.false": "Fausse alerte",
      "end.new": "Nouvelle partie",

      "pr.title": "Mode entraînement",
      "pr.intro": "Ni chrono ni jauge : essaie les 6 mini-jeux autant de fois que tu veux.",
      "back.home": "Retour à l'accueil",
      "back": "Retour",

      "rules.title": "La fiche des règles",
      "rules.full": "Toutes les règles détaillées",
      "rules.html":
        "<h3>Le but</h3>" +
        "<p>Bloquer <strong>6 attaques</strong> en <strong>10 minutes</strong>, sans que la jauge d'intrusion atteigne <strong>10</strong>.</p>" +
        "<h3>Un tour</h3>" +
        "<ol><li>Un joueur retourne une carte rouge et la lit à voix haute.</li>" +
        "<li>L'équipe discute et choisit <strong>UNE</strong> carte verte.</li>" +
        "<li>On pose la carte verte sur la carte rouge.</li>" +
        "<li>Le maître du jeu tape le numéro de la carte rouge et lit la réponse.</li>" +
        "<li>Il appuie sur Bonne, Presque ou Mauvaise : l'appli calcule la sanction.</li>" +
        "<li>La carte verte jouée est retournée (sauf « It's safe! » et sauf au niveau Junior).</li></ol>" +
        "<h3>Combien avance la jauge</h3>" +
        "<ul><li>✅ Bonne défense : <strong>0</strong></li>" +
        "<li>🟠 Presque (la défense acceptable) : <strong>+1</strong></li>" +
        "<li>❌ Mauvaise défense : <strong>+1 à +4</strong> selon la gravité (💀 à 💀💀💀💀)</li>" +
        "<li>Vrai message signalé comme une arnaque (fausse alerte) : <strong>+1</strong></li></ul>" +
        "<h3>Les deux bonus du hacker</h3>" +
        "<ul><li><strong>Alerte rouge</strong> : à partir de 5/10, chaque réponse qui n'est pas bonne coûte +1 de plus.</li>" +
        "<li><strong>Même erreur deux fois</strong> : rater une 2e attaque de la même famille coûte +1 de plus (jamais pour une fausse alerte).</li></ul>" +
        "<h3>Les cartes QR</h3>" +
        "<p>Le maître du jeu tape le numéro de la carte puis appuie sur Ouvrir. L'équipe joue le mini-jeu ensemble : aucune carte verte n'est jouée.</p>" +
        "<h3>La fin</h3>" +
        "<ul><li><strong>Gagné</strong> : les 6 attaques sont jouées, la jauge est sous 10 et le chrono n'est pas à zéro. Score = 10 − jauge.</li>" +
        "<li><strong>Perdu</strong> : la jauge atteint 10, ou le chrono tombe à zéro.</li></ul>" +
        "<h3>Les niveaux</h3>" +
        "<ul><li>🟢 <strong>Junior</strong> : les cartes vertes se réutilisent.</li>" +
        "<li>🟠 <strong>Pro</strong> : chaque carte verte ne sert qu'une fois.</li>" +
        "<li>🔴 <strong>Expert</strong> : une seule fois, et les cartes #11, #21 et #30 demandent 2 cartes vertes.</li></ul>",

      "mg.card": "Carte {list}",
      "mg.sev": "Gravité {n}",
      "mg.seeResult": "Voir le résultat",

      "trap.help": "Touche ce qui te semble louche. Reste appuyé sur un lien pour voir sa vraie adresse. Puis décide.",
      "trap.report": "Signaler",
      "trap.safe": "C'est sûr",
      "trap.linkAria": "{label} (reste appuyé pour voir la vraie adresse)",
      "trap.realAddr": "Vraie adresse : ",
      "trap.safeLink": "Lien sûr : ",
      "trap.s.reported": "Piège signalé. Hacker bloqué !",
      "trap.s.clicked": "Tu as cliqué sur le lien d'une arnaque !",
      "trap.s.wasScam": "C'était une arnaque, pas un message sûr.",
      "trap.s.real": "Bien vu : ce message était vrai.",
      "trap.s.false": "Fausse alerte : ce message était vrai.",
      "trap.spotted": " Tu as repéré {f} signe(s) d'alerte sur {n}.",
      "trap.redNow": " Les signes d'alerte sont maintenant en rouge.",

      "pw.help": "Un nouveau mail à propos de ton mot de passe. Lis-le bien.",
      "pw.report": "Signaler",
      "pw.change": "Changer mon mot de passe",
      "pw.s.false": "Fausse alerte : ce mail était vrai.",
      "pw.s.reported": "Phishing signalé. Hacker bloqué !",
      "pw.s.fake": "C'était un faux mail : une fausse page aurait volé ton mot de passe.",
      "pw.warn": "Invente un FAUX mot de passe. N'en tape jamais un vrai !",
      "pw.label": "Nouveau mot de passe",
      "pw.placeholder": "ex : tigre-violet-nuage-42",
      "pw.meter": "Temps pour le casser : {t}",
      "pw.goal": "Objectif : au moins 100 ans face à un ordinateur qui teste 10 milliards de mots de passe par seconde.",
      "pw.save": "Enregistrer mon nouveau mot de passe",
      "pw.tip": " Astuce : 4 mots au hasard, ou 14 caractères ou plus qui mélangent lettres, chiffres et symboles.",
      "pw.s.strong": "Mot de passe solide ! Hacker bloqué.",
      "pw.why.strong": " Il faudrait {t} pour casser ton nouveau mot de passe.",
      "pw.s.medium": "Pas mal, mais pas assez solide.",
      "pw.why.medium": "Il faudrait {t} pour casser ton nouveau mot de passe : moins de 100 ans.",
      "pw.s.weak": "Trop faible : un hacker le trouve {t}.",
      "pw.why.weak": "Un mot de passe faible est cassé {t}.",
      "dur.instant": "immédiatement",
      "dur.in": "en {t}",
      "dur.second": "seconde", "dur.minute": "minute", "dur.hour": "heure", "dur.day": "jour", "dur.year": "an",
      "dur.plural": "s",
      "dur.thousands": "des milliers d'années",
      "dur.millions": "des millions d'années",
      "dur.billions": "des milliards d'années",

      "call.help": "Le téléphone sonne. Décroche, écoute, puis décide.",
      "call.incoming": "Appel entrant...",
      "call.answer": "Décrocher",
      "call.answerAria": "Décrocher l'appel",
      "call.on": "En ligne · {t}",
      "call.report": "Raccrocher et signaler",
      "call.safe": "C'est sûr, on continue",
      "call.s.blocked": "Tu as raccroché au nez du hacker. Hacker bloqué !",
      "call.s.fooled": "C'était un faux appel : le hacker a obtenu ce qu'il voulait.",
      "call.s.false": "Fausse alerte : c'était un vrai collègue.",
      "call.s.right": "Bien vu : c'était un vrai collègue.",

      "link.help": "Lis l'adresse lettre par lettre. Vrai site ou fausse copie ?",
      "link.fake": "Faux site",
      "link.real": "Vrai site",
      "link.realTip": "La vraie adresse est {u}.",
      "link.wasReal": "Celui-ci était vrai. ",
      "link.readEnd": " Lis toujours la fin de l'adresse avant le premier « / ».",
      "link.s.timeReal": "Temps écoulé ! C'était le vrai site.",
      "link.s.timeFake": "Temps écoulé ! C'était un faux site.",
      "link.s.falseReal": "Fausse alerte : c'était le vrai site.",
      "link.s.right": "Bien vu : c'était le vrai site.",
      "link.s.spotted": "Faux site repéré. Hacker bloqué !",
      "link.s.fooled": "C'était un faux site !",

      "desk.help": "Touche chaque erreur de sécurité sur ce bureau. Attention : parfois il n'y en a aucune !",
      "desk.counter": "Trouvées : {f} · Fausses alertes : {a}",
      "desk.done": "J'ai fini",
      "desk.s.wrong": "{n} erreurs oubliées.",
      "desk.s.almost1": "Une seule erreur oubliée.",
      "desk.s.almostFA": "Tout trouvé, mais {n} fausses alertes.",
      "desk.s.right": "Toutes les erreurs trouvées. Hacker bloqué !",
      "desk.s.safe": "Bien vu : ce bureau était sûr.",
      "desk.why.list": "Erreurs sur ce bureau : {l}.",
      "desk.why.none": "Il n'y avait aucune erreur sur ce bureau cette fois.",
      "desk.why.missed": " Oubliées : {l}.",
      "desk.why.tip": " Verrouille ton écran, cache tes mots de passe et tes codes, ne branche jamais une clé USB inconnue.",
      "desk.missedRed": " Les erreurs oubliées sont maintenant en rouge.",
      "desk.svg.session": "Comptabilité — connecté",
      "desk.svg.locked": "Verrouillé",
      "desk.svg.pwd": "mdp :",
      "desk.svg.conf": "CONFIDENTIEL",
      "desk.svg.code": "Code",
      "desk.a.plant": "Plante",
      "desk.a.screenOn": "Écran d'ordinateur, session ouverte",
      "desk.a.screenLocked": "Écran d'ordinateur, verrouillé",
      "desk.a.postit": "Post-it",
      "desk.a.printerDoc": "Imprimante avec un document",
      "desk.a.printer": "Imprimante",
      "desk.a.keyboard": "Clavier",
      "desk.a.mug": "Tasse de café",
      "desk.a.phoneCode": "Téléphone qui affiche un code",
      "desk.a.phone": "Téléphone",
      "desk.a.usb": "Clé USB",
      "desk.a.badge": "Badge",

      "ransom.help": "Ceci apparaît sur ton ordinateur. Attaque ou normal ?",
      "ransom.title": "VOS FICHIERS SONT BLOQUÉS",
      "ransom.text": "Tous les fichiers de NovaCorp ont été chiffrés. Payez {a} pour les récupérer.",
      "ransom.small": "Passé ce délai, vos fichiers seront supprimés pour toujours.",
      "ransom.attack": "Attaque ! On réagit",
      "ransom.normal": "Normal, on continue",
      "ransom.s.false": "Fausse alerte : c'était un vrai message de NovaCorp.",
      "ransom.why.false": "Cet écran était un message normal de NovaCorp : il donne un numéro que tu connais et ne demande pas d'argent.",
      "ransom.s.missed": "C'était un ransomware ! Tu as continué à travailler pendant que les fichiers étaient bloqués.",
      "ransom.why.missed": "Un écran qui demande de l'argent pour débloquer tes fichiers, c'est un ransomware. Réagis tout de suite : {steps}.",
      "ransom.s.right": "Bien vu : c'était un vrai message de NovaCorp.",
      "ransom.why.right": "Les vrais messages de l'informatique expliquent ce qui se passe et donnent un numéro interne. Pas d'argent, pas de menace.",
      "order.title": "Ransomware ! Remets les 4 actions dans le bon ordre.",
      "order.help": "Touche les actions une par une, de la première à la dernière.",
      "order.check": "Vérifier mon ordre",
      "order.reset": "Recommencer",
      "order.s.perfect": "Réaction parfaite ! Hacker bloqué.",
      "order.s.almost": "{n} actions sur 4 à la bonne place.",
      "order.s.wrong": "Seulement {n} action(s) sur 4 à la bonne place.",
      "order.why": "Le bon ordre : {o}. On coupe d'abord le réseau pour que le virus ne se propage pas, et on ne paie jamais."
    },

    /* =================== ENGLISH =================== */
    en: {
      "fake": "Training game. Everything here is fake: never type real information.",
      "lang.switch": "FR",
      "lang.aria": "Passer en français",
      "voice.on": "Hacker voice: on",
      "voice.off": "Hacker voice: off",
      "hud.time": "Time left",
      "hud.attack": "Attack",

      "home.intro": "NovaCorp is under attack. You are the security team. You have 10 minutes to block 6 attacks.",
      "home.resume": "A game is in progress on this phone.",
      "home.continue": "Continue the game",
      "home.new": "New game",
      "home.level": "Choose your level",
      "lvl.junior": "Green cards can be used again. For a first game.",
      "lvl.pro": "Each green card can be used only once. Normal game.",
      "lvl.expert": "Used only once, and some attacks need 2 green cards.",
      "home.start": "Start",
      "home.rules": "📋 Rules sheet",
      "home.practice": "Practice mode: the mini-games, without timer or gauge",
      "confirm.newGame": "A game is in progress. Start a new one?",

      "pad.help": "Game master: type the number of the red card.",
      "pad.delete": "Delete",
      "pad.invalid": "Type a red card number between 1 and 30.",
      "pad.played": "Card #{n} has already been played.",
      "card.real": "Real message card",
      "card.best": "Best",
      "card.ok": "Acceptable",
      "card.none": "none",
      "card.sev": "Severity {n}",
      "card.expert": "Expert: the 2 cards = Right · only one of the 2 = Almost · none = Wrong.",
      "v.right": "✅ Right defence",
      "v.right.sub": "best defence",
      "v.almost": "🟠 Almost right",
      "v.almost.sub": "acceptable defence",
      "v.wrong": "❌ Wrong defence",
      "v.wrong.sub": "another card",
      "v.wrong.subReal": "the team reported it",
      "card.back": "Wrong number? Back",
      "qr.tag": "Incoming message! QR card",
      "qr.text": "The whole team plays the mini-game together. No green card is played or used. The app applies the penalty.",
      "qr.open": "Open",
      "game.rules": "📋 Rules sheet",
      "game.abandon": "Abandon the game",
      "confirm.abandon": "Abandon this game? The gauge and the timer will be lost.",

      "res.right": "Hacker blocked!",
      "res.almost": "Almost right",
      "res.wrong": "Wrong defence",
      "res.false": "False alarm",
      "calc.right": "Right defence: +0",
      "calc.false": "False alarm: +1",
      "calc.almost": "Almost right: +1",
      "calc.wrong": "Wrong defence {sk}: +{n}",
      "calc.alert": "Red alert bonus (gauge at 5 or more): +1",
      "calc.family": "Same mistake twice, \"The hacker knows your weakness\": +1",
      "calc.total": "Total: +{n}",
      "calc.gauge": "Intrusion gauge: {a} → {b}/10",
      "calc.practice": "In a real game: +{n} (without the hacker's bonuses)",
      "res.best": "Best defence: {d}",
      "res.noGame": "No game in progress on this phone: this result is not counted. Tip: the game master types the QR card number in the game phone, then presses Open.",
      "res.next": "Next attack",
      "res.toEnd": "See the end of the game",
      "res.backPractice": "Back to practice",
      "res.backHome": "Back to the home screen",

      "end.wonBig": "COMPANY SAVED!",
      "end.lostBig": "GAME OVER",
      "end.wonTitle": "Company saved!",
      "end.lostTitle": "The hacker is in!",
      "end.score": "Score: {n}/10",
      "end.perfect": " (perfect!)",
      "end.gauge10": "The intrusion gauge reached 10.",
      "end.time": "Time's up before the end of the 6 attacks.",
      "end.recap": "Attacks played",
      "end.none": "No attack played.",
      "end.v.right": "Right",
      "end.v.almost": "Almost",
      "end.v.wrong": "Wrong",
      "end.v.false": "False alarm",
      "end.new": "New game",

      "pr.title": "Practice mode",
      "pr.intro": "No timer, no gauge: try the 6 mini-games as many times as you want.",
      "back.home": "Back to the home screen",
      "back": "Back",

      "rules.title": "Rules sheet",
      "rules.full": "All the detailed rules (in French)",
      "rules.html":
        "<h3>The goal</h3>" +
        "<p>Block <strong>6 attacks</strong> in <strong>10 minutes</strong>, before the intrusion gauge reaches <strong>10</strong>.</p>" +
        "<h3>One turn</h3>" +
        "<ol><li>A player turns over a red card and reads it aloud.</li>" +
        "<li>The team talks and agrees on <strong>ONE</strong> green card.</li>" +
        "<li>Put the green card on the red card.</li>" +
        "<li>The game master types the red card number and reads the answer.</li>" +
        "<li>They press Right, Almost or Wrong: the app calculates the penalty.</li>" +
        "<li>The green card played is turned face down (except \"It's safe!\" and except in Junior).</li></ol>" +
        "<h3>How much the gauge goes up</h3>" +
        "<ul><li>✅ Right defence: <strong>0</strong></li>" +
        "<li>🟠 Almost right (acceptable defence): <strong>+1</strong></li>" +
        "<li>❌ Wrong defence: <strong>+1 to +4</strong> depending on severity (💀 to 💀💀💀💀)</li>" +
        "<li>A real message reported as a scam (false alarm): <strong>+1</strong></li></ul>" +
        "<h3>The hacker's two bonuses</h3>" +
        "<ul><li><strong>Red alert</strong>: from 5/10, each answer that is not Right costs +1 more.</li>" +
        "<li><strong>Same mistake twice</strong>: missing a 2nd attack of the same family costs +1 more (never for a false alarm).</li></ul>" +
        "<h3>QR cards</h3>" +
        "<p>The game master types the card number then presses Open. The team plays the mini-game together: no green card is played.</p>" +
        "<h3>The end</h3>" +
        "<ul><li><strong>Won</strong>: the 6 attacks are played, the gauge is under 10 and the timer is not at zero. Score = 10 − gauge.</li>" +
        "<li><strong>Lost</strong>: the gauge reaches 10, or the timer reaches zero.</li></ul>" +
        "<h3>Levels</h3>" +
        "<ul><li>🟢 <strong>Junior</strong>: green cards can be used again.</li>" +
        "<li>🟠 <strong>Pro</strong>: each green card is used only once.</li>" +
        "<li>🔴 <strong>Expert</strong>: only once, and cards #11, #21 and #30 need 2 green cards.</li></ul>",

      "mg.card": "Card {list}",
      "mg.sev": "Severity {n}",
      "mg.seeResult": "See the result",

      "trap.help": "Tap what looks suspicious. Press and hold a link to see its real address. Then decide.",
      "trap.report": "Report",
      "trap.safe": "It's safe",
      "trap.linkAria": "{label} (press and hold to see the real address)",
      "trap.realAddr": "Real address: ",
      "trap.safeLink": "Safe link: ",
      "trap.s.reported": "Trap reported. Hacker blocked!",
      "trap.s.clicked": "You clicked the link of a scam!",
      "trap.s.wasScam": "It was a scam, not a safe message.",
      "trap.s.real": "Correct: this message was real.",
      "trap.s.false": "False alarm: this message was real.",
      "trap.spotted": " You spotted {f} of {n} warning signs.",
      "trap.redNow": " The warning signs are now in red.",

      "pw.help": "A new email about your password. Read it carefully.",
      "pw.report": "Report",
      "pw.change": "Change my password",
      "pw.s.false": "False alarm: this email was real.",
      "pw.s.reported": "Phishing reported. Hacker blocked!",
      "pw.s.fake": "It was a fake email: a fake page would have stolen your password.",
      "pw.warn": "Invent a FAKE password. Never type a real one!",
      "pw.label": "New password",
      "pw.placeholder": "e.g. purple-tiger-cloud-42",
      "pw.meter": "Time to crack it: {t}",
      "pw.goal": "Goal: at least 100 years against a computer trying 10 billion passwords per second.",
      "pw.save": "Save my new password",
      "pw.tip": " Tip: 4 random words, or 14+ characters mixing letters, numbers and symbols.",
      "pw.s.strong": "Strong password! Hacker blocked.",
      "pw.why.strong": " Your new password would take {t} to crack.",
      "pw.s.medium": "Not bad, but not strong enough.",
      "pw.why.medium": "Your new password would take {t} to crack: less than 100 years.",
      "pw.s.weak": "Too weak: a hacker finds it {t}.",
      "pw.why.weak": "A weak password is cracked {t}.",
      "dur.instant": "instantly",
      "dur.in": "in {t}",
      "dur.second": "second", "dur.minute": "minute", "dur.hour": "hour", "dur.day": "day", "dur.year": "year",
      "dur.plural": "s",
      "dur.thousands": "thousands of years",
      "dur.millions": "millions of years",
      "dur.billions": "billions of years",

      "call.help": "The phone is ringing. Answer, listen, then decide.",
      "call.incoming": "Incoming call...",
      "call.answer": "Answer",
      "call.answerAria": "Answer the call",
      "call.on": "On call · {t}",
      "call.report": "Hang up and report",
      "call.safe": "It's safe, continue",
      "call.s.blocked": "You hung up on the hacker. Hacker blocked!",
      "call.s.fooled": "It was a fake call: the hacker got what he wanted.",
      "call.s.false": "False alarm: it was a real colleague.",
      "call.s.right": "Correct: it was a real colleague.",

      "link.help": "Read the address letter by letter. Real website or fake copy?",
      "link.fake": "Fake website",
      "link.real": "Real website",
      "link.realTip": "The real address is {u}.",
      "link.wasReal": "This one was real. ",
      "link.readEnd": " Always read the end of the address before the first \"/\".",
      "link.s.timeReal": "Time's up! It was the real website.",
      "link.s.timeFake": "Time's up! It was a fake website.",
      "link.s.falseReal": "False alarm: it was the real website.",
      "link.s.right": "Correct: it was the real website.",
      "link.s.spotted": "Fake website spotted. Hacker blocked!",
      "link.s.fooled": "It was a fake website!",

      "desk.help": "Tap every security mistake on this desk. Careful: sometimes there is none!",
      "desk.counter": "Found: {f} · False alarms: {a}",
      "desk.done": "I'm done",
      "desk.s.wrong": "{n} mistakes missed.",
      "desk.s.almost1": "Only 1 mistake missed.",
      "desk.s.almostFA": "Everything found, but {n} false alarms.",
      "desk.s.right": "All the mistakes found. Hacker blocked!",
      "desk.s.safe": "Correct: this desk was safe.",
      "desk.why.list": "Mistakes on this desk: {l}.",
      "desk.why.none": "There was no mistake on this desk this time.",
      "desk.why.missed": " Missed: {l}.",
      "desk.why.tip": " Lock your screen, keep passwords and codes hidden, never plug in unknown USB keys.",
      "desk.missedRed": " Missed mistakes are now in red.",
      "desk.svg.session": "Accounting — logged in",
      "desk.svg.locked": "Locked",
      "desk.svg.pwd": "pwd:",
      "desk.svg.conf": "CONFIDENTIAL",
      "desk.svg.code": "Code",
      "desk.a.plant": "Plant",
      "desk.a.screenOn": "Computer screen, logged in",
      "desk.a.screenLocked": "Computer screen, locked",
      "desk.a.postit": "Post-it note",
      "desk.a.printerDoc": "Printer with a document",
      "desk.a.printer": "Printer",
      "desk.a.keyboard": "Keyboard",
      "desk.a.mug": "Coffee mug",
      "desk.a.phoneCode": "Phone showing a code",
      "desk.a.phone": "Phone",
      "desk.a.usb": "USB key",
      "desk.a.badge": "Badge",

      "ransom.help": "This appears on your computer. Attack or normal?",
      "ransom.title": "YOUR FILES ARE LOCKED",
      "ransom.text": "All NovaCorp files have been encrypted. Pay {a} to get them back.",
      "ransom.small": "After this time, your files will be deleted forever.",
      "ransom.attack": "Attack! React now",
      "ransom.normal": "Normal, keep working",
      "ransom.s.false": "False alarm: it was a real NovaCorp message.",
      "ransom.why.false": "This screen was a normal NovaCorp message: it gives a phone number you know, and asks for no money.",
      "ransom.s.missed": "It was ransomware! You kept working while the files were locked.",
      "ransom.why.missed": "A screen asking for money to unlock your files is ransomware. React at once: {steps}.",
      "ransom.s.right": "Correct: it was a real NovaCorp message.",
      "ransom.why.right": "Real IT messages explain what happens and give an internal number. No money, no threat.",
      "order.title": "Ransomware! Put the 4 actions in the right order.",
      "order.help": "Tap the actions one by one, from first to last.",
      "order.check": "Check my order",
      "order.reset": "Start again",
      "order.s.perfect": "Perfect reaction! Hacker blocked.",
      "order.s.almost": "{n} of 4 actions in the right place.",
      "order.s.wrong": "Only {n} of 4 actions in the right place.",
      "order.why": "The right order: {o}. Cut the network first so the virus stops spreading, and never pay."
    }
  };

  function t(key, vars) {
    var s = S[lang][key];
    if (s == null) s = S.en[key];
    if (s == null) return key;
    if (vars) {
      s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
    }
    return s;
  }

  function setLang(l) {
    try { window.localStorage.setItem(KEY, l === "en" ? "en" : "fr"); } catch (e) { /* rien */ }
  }

  /* Traduit le HTML : data-i18n (texte), data-i18n-html (HTML), data-i18n-aria (aria-label) */
  function apply(root) {
    root = root || document;
    Array.prototype.forEach.call(root.querySelectorAll("[data-i18n]"), function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    Array.prototype.forEach.call(root.querySelectorAll("[data-i18n-html]"), function (el) {
      el.innerHTML = t(el.getAttribute("data-i18n-html"));
    });
    Array.prototype.forEach.call(root.querySelectorAll("[data-i18n-aria]"), function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });
  }

  document.documentElement.lang = lang;

  return { lang: lang, t: t, setLang: setLang, apply: apply };
})();
window.t = window.NovaI18n.t;
