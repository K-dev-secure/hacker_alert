/* =========================================================
   HACKER ALERT — TEXTES EN FRANÇAIS
   ---------------------------------------------------------
   On part des données anglaises (js/cards.js) et on remplace
   seulement les textes. Les gravités, les bonnes réponses,
   les adresses web et les numéros restent ceux de cards.js.
   En anglais (bouton EN), ce fichier ne change rien.
   ========================================================= */
(function () {
  "use strict";

  var EN = window.NOVA_DATA;
  window.NOVA_DATA_EN = EN;
  if (window.NovaI18n.lang !== "fr") return;

  var FR = JSON.parse(JSON.stringify(EN));

  /* ---------- Familles ---------- */
  FR.FAMILIES = {
    phishing: "Phishing",
    passwords: "Mots de passe",
    devices: "Appareils",
    humans: "Faux humains",
    network: "Réseau"
  };

  /* ---------- Défenses : nom français (nom imprimé sur la carte verte) ---------- */
  var DEF = {
    "Check the sender": "Vérifier l'expéditeur",
    "Don't click": "Ne pas cliquer",
    "Strong password": "Mot de passe solide",
    "Password manager": "Gestionnaire de mots de passe",
    "Two-factor (2FA)": "Double authentification",
    "Update": "Mise à jour",
    "Backup": "Sauvegarde",
    "Lock your screen": "Verrouiller l'écran",
    "Call back to check": "Rappeler pour vérifier",
    "Avoid public Wi-Fi": "Éviter le Wi-Fi public",
    "Antivirus scan": "Analyse antivirus",
    "Alert IT": "Prévenir l'informatique",
    "It's safe!": "C'est un vrai message"
  };
  FR.defence = function (name) {
    if (!DEF[name]) return name;
    // "Two-factor (2FA)" a déjà des parenthèses : on sépare avec un tiret
    return name.indexOf("(") >= 0 ? DEF[name] + " – " + name : DEF[name] + " (" + name + ")";
  };

  /* ---------- Cartes rouges : situation + explication ---------- */
  var CARDS = {
    3: ["Un mail dit que tu as gagné un smartphone gratuit. Clique sur le lien pour le récupérer avant ce soir.",
        "Personne ne t'offre un téléphone pour rien. Le lien vole tes identifiants ou installe un virus. Ne clique pas, supprime le mail."],
    4: ["Un mail de « NovaCorp IT » contient une pièce jointe nommée invoice.pdf.exe.",
        "« .exe » à la fin veut dire que c'est un programme, pas un PDF. L'ouvrir peut installer un virus. Ne l'ouvre pas et laisse l'informatique le vérifier."],
    5: ["Un mail de hr@novacorp.com te rappelle de saisir tes dates de congés sur l'intranet avant vendredi.",
        "Celui-ci est vrai : la bonne adresse, un lien vers l'intranet que tu connais, aucun mot de passe demandé, aucune pression."],
    6: ["Un SMS : « Bluestone Bank : votre carte est bloquée. Appelez ce numéro maintenant. »",
        "Les banques ne bloquent pas les cartes par SMS. N'appelle jamais le numéro du message : appelle le numéro au dos de ta carte."],
    9: ["Le mot de passe du comptable est « NovaCorp2026 ».",
        "Nom de l'entreprise + année : c'est une des premières choses qu'un hacker essaie. Utilise un mot de passe long, par exemple 4 mots au hasard."],
    10: ["Un collègue utilise le même mot de passe pour sa messagerie, sa banque et Netflix.",
         "Si un seul site se fait voler ses données, le hacker entre partout. Un gestionnaire de mots de passe donne à chaque compte son propre mot de passe."],
    11: ["Le mot de passe de la patronne a été volé dans une fuite de données. Quelqu'un essaie de se connecter à son compte en ce moment.",
         "Avec la double authentification, un mot de passe volé ne suffit pas : le hacker a aussi besoin du code envoyé sur le téléphone de la patronne. Ensuite, on change le mot de passe."],
    12: ["Le nouveau stagiaire a écrit son mot de passe sur un post-it sous son clavier.",
         "N'importe qui en passant peut le lire. Un gestionnaire de mots de passe les retient pour toi : plus besoin de post-it."],
    15: ["Une clé USB marquée « Salaires 2026 » est trouvée sur le parking. Un collègue veut la brancher pour savoir à qui elle appartient.",
         "Les hackers laissent exprès des clés USB piégées : la curiosité fait le reste. Ne la branche jamais, donne-la à l'informatique."],
    16: ["Une fenêtre sur un site dit : « Votre lecteur vidéo n'est pas à jour. Téléchargez la mise à jour ici. »",
         "Les vraies mises à jour viennent des réglages de ton ordinateur, pas d'une fenêtre sur un site. Cette « mise à jour » est un virus."],
    17: ["Tu pars déjeuner. Ton ordinateur est resté ouvert sur le fichier des salaires.",
         "N'importe qui peut lire ou copier le fichier pendant ton absence. Verrouille ton écran à chaque fois que tu pars (Windows + L)."],
    18: ["Ton ordinateur portable n'a pas été mis à jour depuis 6 mois. Des hackers utilisent une faille connue.",
         "Les mises à jour réparent les trous qu'utilisent les hackers. Installe-les dès que ton ordinateur le demande."],
    21: ["Le comptable reçoit une facture urgente d'un nouveau fournisseur, avec de nouvelles coordonnées bancaires.",
         "Les fausses factures sont une arnaque classique. Appelle le fournisseur sur un numéro que tu connais déjà avant de payer quoi que ce soit."],
    22: ["Un homme en tenue de livreur te demande de lui tenir la porte de la salle des serveurs.",
         "Les hackers entrent aussi à pied. Personne n'entre dans la salle des serveurs sans badge : ne tiens pas la porte, appelle l'informatique ou la sécurité."],
    23: ["Ta responsable appelle depuis son numéro de bureau habituel pour déplacer la réunion de demain à 10 h.",
         "Celui-ci est vrai : un numéro que tu connais, une demande normale, rien de secret ni d'urgent, ni argent ni code."],
    24: ["Un « journaliste » appelle pour demander les noms et les mails de toute l'équipe RH.",
         "Des noms et des mails aident les hackers à écrire de faux mails crédibles. Ne donne rien et transmets la demande à l'informatique."],
    27: ["Tu envoies un fichier client depuis le Wi-Fi gratuit de la gare.",
         "Sur un Wi-Fi gratuit, quelqu'un peut espionner ce que tu envoies. Attends un réseau sûr ou utilise la connexion de ton téléphone."],
    28: ["Un site te demande ton numéro de carte, mais l'adresse commence par http:// et il n'y a pas de cadenas.",
         "Sans « https » ni cadenas, ce que tu tapes n'est pas protégé. Ne tape jamais tes coordonnées bancaires sur ce genre de page."],
    29: ["L'informatique annonce par mail (it@novacorp.com) une mise à jour de sécurité ce soir à 20 h. Tu n'as rien à faire.",
         "Celui-ci est vrai : la bonne adresse, aucun lien, aucune demande. Les vraies mises à jour sont annoncées comme ça."],
    30: ["Ransomware sur le serveur de fichiers : tous les fichiers partagés sont bloqués.",
         "Avec une sauvegarde récente, on peut restaurer les fichiers sans payer. Préviens l'informatique tout de suite pour qu'elle arrête l'attaque."]
  };
  FR.CARDS.forEach(function (c) {
    if (CARDS[c.n]) { c.text = CARDS[c.n][0]; c.why = CARDS[c.n][1]; }
  });

  /* ---------- Noms des mini-jeux ---------- */
  FR.MINIGAMES.trap.name = "Repère le piège";
  FR.MINIGAMES.password.name = "Demande de mot de passe";
  FR.MINIGAMES.desk.name = "Bureau en désordre";
  FR.MINIGAMES.ransom.name = "Écran bizarre";
  FR.MINIGAMES.call.name = "Appel entrant";
  FR.MINIGAMES.link.name = "Vrai ou faux site ?";

  /* ---------- Repère le piège (#1, #2) ---------- */
  var T = FR.TRAP;
  T[0].subject = [{ t: "URGENT", sus: true }, " Votre compte va être fermé"];
  T[0].body = ["Nous avons détecté ", { t: "une activité inhabituelle", sus: true }, " sur votre compte. Vous devez confirmer votre identité ",
               { t: "sous 1 heure", sus: true }, " ou votre compte sera fermé."];
  T[0].link.label = "Confirmer mon compte";
  T[0].why = "Une vraie banque ne demande jamais de confirmer ton identité par mail, et jamais en 1 heure. L'adresse n'est pas bluestonebank.com.";

  T[1].body = ["ParcelGo : votre colis est ", { t: "en attente", sus: true }, ". Payez les ", { t: "frais de 1,99 €", sus: true }, " ",
               { t: "aujourd'hui", sus: true }, " pour le recevoir : "];
  T[1].why = "De petits frais, un colis « en attente » et un site bizarre : c'est un faux SMS de livraison classique. Vérifie sur l'appli ou le vrai site de ParcelGo.";

  T[2].fromName = "Laura Martin (PDG)";
  T[2].subject = ["Petit service"];
  T[2].body = ["Je suis en réunion et ", { t: "je ne peux pas parler", sus: true }, ". J'ai besoin que tu achètes ", { t: "5 cartes cadeaux", sus: true },
               " de 100 € pour un client. ", { t: "Garde ça confidentiel", sus: true }, " et envoie-moi les codes ", { t: "au plus vite", sus: true }, "."];
  T[2].why = "La « patronne » écrit depuis une adresse gratuite, demande des cartes cadeaux et veut que ce soit secret et rapide. Appelle ta patronne sur un numéro que tu connais.";

  T[3].fromName = "NovaCorp RH";
  T[3].subject = ["Déjeuner d'équipe jeudi"];
  T[3].body = ["Petit rappel : notre déjeuner d'équipe a lieu jeudi à 12 h 30 à la cafétéria. Le menu est sur l'intranet. "];
  T[3].link.label = "Voir le menu";
  T[3].why = "Celui-ci est vrai : la bonne adresse, un lien vers l'intranet de NovaCorp, ni mot de passe, ni argent, ni pression.";

  T[4].fromName = "Informatique NovaCorp";
  T[4].subject = ["Maintenance samedi"];
  T[4].body = ["Les serveurs seront mis à jour samedi de 8 h à 10 h. Vous n'avez rien à faire. Rappel : l'informatique ne vous demandera jamais votre mot de passe."];
  T[4].why = "Celui-ci est vrai : la bonne adresse, aucun lien, rien à faire. Les vrais messages de l'informatique ressemblent à ça.";

  /* ---------- Demande de mot de passe (#7, #8) ---------- */
  var P = FR.PASSWORD;
  P[0].fromName = "Informatique NovaCorp";
  P[0].subject = "Votre mot de passe expire dans 3 jours";
  P[0].text = "Votre mot de passe NovaCorp expire dans 3 jours. Merci de le changer sur l'intranet quand vous aurez le temps. Nous ne vous demanderons jamais votre mot de passe actuel par mail.";
  P[0].why = "Celui-ci est vrai : la bonne adresse, pas de pression, et il rappelle que l'informatique ne demande jamais ton mot de passe.";
  P[1].fromName = "Support informatique";
  P[1].subject = "Votre mot de passe expire AUJOURD'HUI";
  P[1].text = "Votre mot de passe expire aujourd'hui. Pour garder votre accès, répondez avec votre mot de passe actuel sous 2 heures, sinon votre compte sera supprimé.";
  P[1].why = "N'envoie jamais ton mot de passe, à personne. L'adresse n'est pas novacorp.com et le délai est là pour te faire peur.";
  P[2].fromName = "Sécurité NovaMail";
  P[2].subject = "Boîte mail pleine à 99 %";
  P[2].text = "Votre boîte mail est pleine à 99 % et va cesser de fonctionner. Confirmez votre mot de passe ci-dessous pour obtenir 10 Go de plus gratuitement.";
  P[2].why = "De l'espace gratuit en échange de ton mot de passe, c'est un piège. L'adresse n'est pas novacorp.com : signale-le.";

  /* ---------- Appel entrant (#19, #20) ---------- */
  var C = FR.CALLS;
  C[0].name = "Support informatique NovaCorp";
  C[0].text = "Bonjour, c'est Kevin du support informatique. Nous mettons votre compte à jour en ce moment et il y a un problème. Vous venez de recevoir un code à six chiffres sur votre téléphone. Pouvez-vous me le lire, s'il vous plaît ? C'est urgent, sinon votre compte sera bloqué.";
  C[0].why = "Personne n'a besoin de ton code de double authentification, même pas l'informatique. Un code lu au téléphone ouvre ton compte au hacker.";
  C[1].name = "Numéro inconnu";
  C[1].text = "Bonjour, c'est Sarah, du service sécurité. Un hacker essaie de se connecter à votre messagerie. Pour vous protéger, j'ai besoin du code qu'on vient de vous envoyer par SMS. Vite, s'il vous plaît !";
  C[1].why = "Le « service sécurité » qui appelle d'un numéro inconnu et demande ton code, c'est le hacker. Raccroche et appelle toi-même l'informatique.";
  C[2].name = "Numéro inconnu";
  C[2].text = "Bonjour, j'appelle de la part du bureau du PDG. Le patron a besoin d'un virement de vingt mille euros vers un nouveau partenaire aujourd'hui. C'est confidentiel, n'en parlez à personne. Je vous envoie les coordonnées bancaires tout de suite.";
  C[2].why = "Urgent, secret et une histoire d'argent : c'est l'arnaque au faux patron. Vérifie toujours en appelant le patron sur un numéro que tu connais.";
  C[3].name = "Tom · Informatique NovaCorp";
  C[3].number = "Poste interne 2014";
  C[3].text = "Salut, c'est Tom de l'informatique. Juste pour te dire que l'imprimante de ton étage est réparée. Tu peux t'en servir à nouveau. Bonne journée !";
  C[3].why = "Celui-ci est vrai : un numéro interne, un message normal, rien n'est demandé.";
  C[4].name = "Accueil NovaCorp";
  C[4].number = "Poste interne 1000";
  C[4].text = "Bonjour, ici l'accueil. Votre visiteur, M. Lopez, est arrivé pour votre réunion de dix heures. Il vous attend dans le hall.";
  C[4].why = "Celui-ci est vrai : le numéro interne de l'accueil, et rien de secret ni d'urgent n'est demandé.";

  /* ---------- Vrai ou faux site ? (#25, #26) : les adresses ne changent pas ---------- */
  var LT = [
    ["Regarde bien : « novac0rp » utilise un zéro au lieu de la lettre o.",
     "Le vrai site, c'est la fin de l'adresse : ici hr-portal.net, pas novacorp.com.",
     "« hr-novacorp.com » est un autre site, et il utilise http sans le s."],
    ["« bluest0nebank » utilise un zéro au lieu de la lettre o.",
     "Le vrai site, c'est la fin de l'adresse : secure-login.info, pas bluestonebank.com.",
     "« bluestone-bank.com » a un tiret : c'est un autre site. Et http n'a pas de s."],
    ["« .co » n'est pas « .com » : une lettre en moins, un autre site.",
     "« cloud-novacorp.com » avec un tiret n'est pas novacorp.com.",
     "« novaccorp » a deux c : une copie du vrai nom."]
  ];
  FR.LINKS.forEach(function (set, i) {
    set.fakes.forEach(function (f, j) { f.tip = LT[i][j]; });
  });

  /* ---------- Bureau en désordre (#13) ---------- */
  FR.DESK.title = "NovaCorp · Open space, 18 h 30";
  FR.DESK.errors = {
    postit: "un post-it avec un mot de passe sur l'écran",
    usb: "une clé USB inconnue « FREE »",
    session: "une session restée ouverte (« Comptabilité — connecté »)",
    badge: "un badge laissé sur le bureau",
    code: "un code de double authentification visible sur un téléphone",
    doc: "un document « CONFIDENTIEL » oublié sur l'imprimante"
  };

  /* ---------- Écran bizarre (#14) ---------- */
  FR.RANSOM.amounts = ["2 bitcoins", "50 000 €", "3 bitcoins"];
  FR.RANSOM.normals = [
    { title: "Informatique NovaCorp · Mise à jour de sécurité",
      text: "Installation de la mise à jour de sécurité annoncée par mail lundi. Votre ordinateur redémarrera à la fin. Une question ? Appelez l'informatique au poste 2000." },
    { title: "Sauvegarde NovaCorp",
      text: "Sauvegarde hebdomadaire de vos fichiers en cours. Vous pouvez continuer à travailler." }
  ];
  FR.RANSOM.steps = [
    "Débrancher l'ordinateur du réseau",
    "Prévenir l'équipe informatique",
    "Ne pas payer la rançon",
    "Restaurer les fichiers depuis la sauvegarde"
  ];

  /* ---------- Voix du hacker ---------- */
  FR.HACKER = {
    start: "Bonjour NovaCorp. Je suis dans votre réseau. Vous avez dix minutes.",
    timed: [
      "Tic tac... Je suis dans votre réseau.",
      "Trop lents ! Vos mots de passe sentent le café et les anniversaires.",
      "Plus que quatre minutes. Je vois déjà vos fichiers...",
      "Plus que deux minutes. Merci pour toutes ces données !"
    ],
    alert: "Alerte rouge ! Je suis dans votre réseau.",
    win: "Non ! Vous m'avez arrêté... cette fois.",
    lose: "Le hacker est entré. Partie terminée."
  };

  window.NOVA_DATA = FR;
})();
