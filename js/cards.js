/* =========================================================
   HACKER ALERT — DONNÉES DE L'APPLI "NOVACORP SECURITY"
   ---------------------------------------------------------
   Tout le contenu modifiable est ici : cartes rouges,
   défenses, scénarios des mini-jeux, phrases du hacker.
   Tout est fictif.
   ========================================================= */
window.NOVA_DATA = (function () {
  "use strict";

  /* ---------- Familles (affichées en anglais dans l'appli) ---------- */
  var FAMILIES = {
    phishing: "Phishing",
    passwords: "Passwords",
    devices: "Devices",
    humans: "Social engineering",
    network: "Network"
  };

  /* ---------- Les 12 défenses + It's safe! ---------- */
  var DEFENCES = [
    "Check the sender", "Don't click", "Strong password", "Password manager",
    "Two-factor (2FA)", "Update", "Backup", "Lock your screen",
    "Call back to check", "Avoid public Wi-Fi", "Antivirus scan", "Alert IT",
    "It's safe!"
  ];

  /* ---------- Les 30 cartes rouges (identiques aux cartes imprimées) ----------
     n      : numéro imprimé
     title  : titre imprimé
     fam    : famille
     sev    : gravité (1 à 4 crânes)
     real   : true = vrai message (bonne réponse "It's safe!")
     text   : situation (EN)
     best   : meilleure défense
     ok     : défense acceptable (null = aucune → bouton Almost grisé)
     expert : 2 défenses demandées au niveau Expert
     why    : explication courte (EN)
     qr     : carte mini-jeu (pas de QR imprimé : on tape son numéro, l'appli ouvre ce mini-jeu) */
  var CARDS = [
    { n: 1, fam: "phishing", sev: 2, title: "Spot the trap",
      text: "Incoming message! Type this card's number in the app.", qr: "trap" },
    { n: 2, fam: "phishing", sev: 2, title: "Spot the trap",
      text: "Incoming message! Type this card's number in the app.", qr: "trap" },
    { n: 3, fam: "phishing", sev: 2, title: "Free smartphone", real: false,
      text: "An email says you won a free smartphone. Click the link to claim it before tonight.",
      best: "Don't click", ok: "Check the sender",
      why: "Nobody gives you a phone for nothing. The link steals your login or installs a virus. Don't click, delete the email." },
    { n: 4, fam: "phishing", sev: 3, title: "Strange attachment", real: false,
      text: "An email from \"NovaCorp IT\" has an attachment called invoice.pdf.exe.",
      best: "Don't click", ok: "Antivirus scan",
      why: "\".exe\" at the end means it is a program, not a PDF. Opening it can install a virus. Don't open it and let IT check it." },
    { n: 5, fam: "phishing", sev: 1, title: "Holiday dates", real: true,
      text: "An email from hr@novacorp.com reminds you to enter your holiday dates on the intranet before Friday.",
      best: "It's safe!", ok: null,
      why: "This one is real: the right address, a link to the intranet you know, no password asked, no pressure." },
    { n: 6, fam: "phishing", sev: 2, title: "Card blocked", real: false,
      text: "A text message: \"Bluestone Bank: your card is blocked. Call this number now.\"",
      best: "Call back to check", ok: "Don't click",
      why: "Banks don't block cards by text. Never call the number in the message: call the number on the back of your card." },

    { n: 7, fam: "passwords", sev: 3, title: "Password request",
      text: "Incoming message! Type this card's number in the app.", qr: "password" },
    { n: 8, fam: "passwords", sev: 3, title: "Password request",
      text: "Incoming message! Type this card's number in the app.", qr: "password" },
    { n: 9, fam: "passwords", sev: 1, title: "Easy password", real: false,
      text: "The accountant's password is \"NovaCorp2026\".",
      best: "Strong password", ok: "Password manager",
      why: "Company name + year is one of the first things a hacker tries. Use a long password, like 4 random words." },
    { n: 10, fam: "passwords", sev: 2, title: "Same password everywhere", real: false,
      text: "A colleague uses the same password for his mailbox, his bank and Netflix.",
      best: "Password manager", ok: "Strong password",
      why: "If one website leaks, the hacker gets into everything. A password manager gives every account its own password." },
    { n: 11, fam: "passwords", sev: 4, title: "Stolen password", real: false,
      text: "The boss's password was stolen in a data leak. Someone is trying to log in to her account right now.",
      best: "Two-factor (2FA)", ok: "Strong password", expert: ["Two-factor (2FA)", "Strong password"],
      why: "With two-factor authentication, a stolen password is not enough: the hacker also needs the code sent to the boss's phone. Then change the password." },
    { n: 12, fam: "passwords", sev: 2, title: "Post-it password", real: false,
      text: "The new intern wrote his password on a post-it under his keyboard.",
      best: "Password manager", ok: "Strong password",
      why: "Anyone who walks past can read it. A password manager remembers passwords for you, so you don't need post-its." },

    { n: 13, fam: "devices", sev: 2, title: "Messy desk",
      text: "Incoming message! Type this card's number in the app.", qr: "desk" },
    { n: 14, fam: "devices", sev: 3, title: "Strange screen",
      text: "Incoming message! Type this card's number in the app.", qr: "ransom" },
    { n: 15, fam: "devices", sev: 3, title: "USB key in the car park", real: false,
      text: "A USB key labelled \"Salaries 2026\" is found in the car park. A colleague wants to plug it in to see who it belongs to.",
      best: "Alert IT", ok: "Antivirus scan",
      why: "Hackers leave infected USB keys on purpose: curiosity does the rest. Never plug it in, give it to IT." },
    { n: 16, fam: "devices", sev: 2, title: "Video player update", real: false,
      text: "A pop-up on a website says: \"Your video player is out of date. Download the update here.\"",
      best: "Don't click", ok: "Antivirus scan",
      why: "Real updates come from your computer's settings, not from a pop-up on a website. This \"update\" is a virus." },
    { n: 17, fam: "devices", sev: 2, title: "Lunch break", real: false,
      text: "You go to lunch. Your computer is still open on the payroll file.",
      best: "Lock your screen", ok: null,
      why: "Anyone can read or copy the file while you are away. Lock your screen every time you leave (Windows + L)." },
    { n: 18, fam: "devices", sev: 2, title: "Old laptop", real: false,
      text: "Your laptop has not been updated for 6 months. Hackers are using a known security flaw.",
      best: "Update", ok: null,
      why: "Updates repair the holes that hackers use. Install them as soon as your computer asks." },

    { n: 19, fam: "humans", sev: 4, title: "Incoming call",
      text: "Incoming message! Type this card's number in the app.", qr: "call" },
    { n: 20, fam: "humans", sev: 4, title: "Incoming call",
      text: "Incoming message! Type this card's number in the app.", qr: "call" },
    { n: 21, fam: "humans", sev: 3, title: "Urgent invoice", real: false,
      text: "The accountant receives an urgent invoice from a new supplier, with new bank details.",
      best: "Call back to check", ok: "Check the sender", expert: ["Call back to check", "Alert IT"],
      why: "Fake invoices are a classic scam. Call the supplier on a number you already know before paying anything." },
    { n: 22, fam: "humans", sev: 3, title: "Delivery man", real: false,
      text: "A man in a delivery uniform asks you to hold the door of the server room for him.",
      best: "Alert IT", ok: null,
      why: "Hackers also walk in. Nobody enters the server room without a badge: don't hold the door, call IT or security." },
    { n: 23, fam: "humans", sev: 1, title: "Meeting moved", real: true,
      text: "Your manager calls from her usual office number to move tomorrow's meeting to 10 am.",
      best: "It's safe!", ok: null,
      why: "This one is real: a number you know, a normal request, nothing secret or urgent, no money and no code." },
    { n: 24, fam: "humans", sev: 2, title: "Curious journalist", real: false,
      text: "A \"journalist\" calls to ask for the names and emails of everyone in the HR team.",
      best: "Alert IT", ok: "Call back to check",
      why: "Names and emails help hackers write believable fake emails. Give nothing and pass the request to IT." },

    { n: 25, fam: "network", sev: 2, title: "Safe or fake link?",
      text: "Incoming message! Type this card's number in the app.", qr: "link" },
    { n: 26, fam: "network", sev: 2, title: "Safe or fake link?",
      text: "Incoming message! Type this card's number in the app.", qr: "link" },
    { n: 27, fam: "network", sev: 2, title: "Station Wi-Fi", real: false,
      text: "You send a client file from the free Wi-Fi of the train station.",
      best: "Avoid public Wi-Fi", ok: null,
      why: "On a free Wi-Fi, someone can spy on what you send. Wait for a safe network or use your phone's connection." },
    { n: 28, fam: "network", sev: 3, title: "No padlock", real: false,
      text: "A website asks for your card number, but the address starts with http:// and there is no padlock.",
      best: "Don't click", ok: null,
      why: "Without \"https\" and a padlock, what you type is not protected. Never type card details on that kind of page." },
    { n: 29, fam: "network", sev: 1, title: "Update tonight", real: true,
      text: "IT announces by email (it@novacorp.com) a security update tonight at 8 pm. You have nothing to do.",
      best: "It's safe!", ok: null,
      why: "This one is real: the right address, no link, no request. Real updates are announced like this." },
    { n: 30, fam: "network", sev: 4, title: "Ransomware!", real: false,
      text: "Ransomware on the file server: all the shared files are locked.",
      best: "Backup", ok: "Alert IT", expert: ["Backup", "Alert IT"],
      why: "With a recent backup, you can restore the files without paying. Alert IT at once so they can stop the attack." }
  ];

  /* ---------- Mini-jeux : nom, gravité, famille, cartes ---------- */
  var MINIGAMES = {
    trap:     { name: "Spot the trap",      sev: 2, fam: "phishing",  cards: [1, 2] },
    password: { name: "Password request",   sev: 3, fam: "passwords", cards: [7, 8] },
    desk:     { name: "Messy desk",         sev: 2, fam: "devices",   cards: [13] },
    ransom:   { name: "Strange screen",     sev: 3, fam: "devices",   cards: [14] },
    call:     { name: "Incoming call",      sev: 4, fam: "humans",    cards: [19, 20] },
    link:     { name: "Safe or fake link?", sev: 2, fam: "network",   cards: [25, 26] }
  };

  /* ---------- Spot the trap (#1, #2) ----------
     body : morceaux de texte ; { t: "...", sus: true } = élément louche
     link : { label, href, scam } */
  var TRAP = [
    { kind: "email", scam: true, fam: "phishing",
      fromName: "Bluestone Bank", from: { t: "security@bluestone-bank-secure.co", sus: true },
      subject: [{ t: "URGENT", sus: true }, " Your account will be closed"],
      body: ["We detected ", { t: "unusual activity", sus: true }, " on your account. You must confirm your identity ",
             { t: "within 1 hour", sus: true }, " or your account will be closed."],
      link: { label: "Confirm my account", href: "http://bluestone-bank-secure.co/login-verify", scam: true },
      why: "A real bank never asks you to confirm your identity by email, and never in 1 hour. The address is not bluestonebank.com." },
    { kind: "sms", scam: true, fam: "phishing",
      fromName: "+44 7700 900461", from: null, subject: null,
      body: ["ParcelGo: your parcel is ", { t: "on hold", sus: true }, ". Pay the ", { t: "1.99 € fees", sus: true }, " ",
             { t: "today", sus: true }, " to get it: "],
      link: { label: "parcelgo-delivery.info/pay", href: "https://parcelgo-delivery.info/pay?id=88213", scam: true },
      why: "Small fees, a parcel \"on hold\" and a strange website: this is a classic fake delivery text. Check on the real ParcelGo app or website." },
    { kind: "email", scam: true, fam: "humans",
      fromName: "Laura Martin (CEO)", from: { t: "laura.martin.ceo@freemail.example", sus: true },
      subject: ["Quick favour"],
      body: ["I'm in a meeting and ", { t: "I can't talk", sus: true }, ". I need you to buy ", { t: "5 gift cards", sus: true },
             " of 100 € for a client. ", { t: "Keep it confidential", sus: true }, " and send me the codes ", { t: "ASAP", sus: true }, "."],
      link: null,
      why: "The \"boss\" writes from a free email address, asks for gift cards and wants it secret and fast. Call your boss on a number you know." },
    { kind: "email", scam: false, fam: "phishing",
      fromName: "NovaCorp HR", from: { t: "hr@novacorp.com" },
      subject: ["Team lunch on Thursday"],
      body: ["Reminder: our team lunch is on Thursday at 12:30 in the cafeteria. The menu is on the intranet. "],
      link: { label: "See the menu", href: "https://intranet.novacorp.com/lunch", scam: false },
      why: "This one is real: the right address, a link to the NovaCorp intranet, no password, no money, no pressure." },
    { kind: "email", scam: false, fam: "phishing",
      fromName: "NovaCorp IT", from: { t: "it@novacorp.com" },
      subject: ["Maintenance on Saturday"],
      body: ["The servers will be updated on Saturday from 8 to 10 am. You don't need to do anything. Reminder: IT will never ask for your password."],
      link: null,
      why: "This one is real: the right address, no link, nothing to do. Real IT messages look like this." },
    /* Nouveau : faux mail du fournisseur internet (box / routeur) */
    { kind: "email", scam: true, fam: "phishing",
      fromName: "NovaBox Support", from: { t: "support@novabox-assistance.net", sus: true },
      subject: [{ t: "Last warning", sus: true }, ": your internet will be cut"],
      body: ["Your router has a security problem. ", { t: "Your connection will be cut tonight", sus: true }, ". To avoid this, ",
             { t: "enter your Wi-Fi password and your card number", sus: true }, " on our page."],
      link: { label: "Fix my router", href: "http://novabox-assistance.net/fix", scam: true },
      why: "Your internet provider never asks for your Wi-Fi password or your card number by email. Go to your real customer account yourself." },
    /* Nouveau : appli à installer hors du store officiel */
    { kind: "sms", scam: true, fam: "phishing",
      fromName: "+44 7700 900318", from: null, subject: null,
      body: ["ParcelGo: your parcel cannot be tracked. ", { t: "Install our new app", sus: true }, " ", { t: "(not on the store)", sus: true }, " to follow it: "],
      link: { label: "parcelgo-tracker.apk", href: "https://parcelgo-tracker.info/parcelgo-tracker.apk", scam: true },
      why: "Only install apps from the official store (Google Play, App Store). An app sent by text message can spy on your phone." },
    /* Nouveau : chantage à la fausse vidéo (arnaque de masse, texte tout public) */
    { kind: "email", scam: true, fam: "phishing",
      fromName: "Anonymous", from: { t: "hacker-anonymous@freemail.example", sus: true },
      subject: [{ t: "I know your password", sus: true }],
      body: ["I took control of your webcam and ", { t: "filmed you at your desk", sus: true }, ". ",
             { t: "Pay 500 € in bitcoin within 48 hours", sus: true }, " or I send the video to all your colleagues."],
      link: null,
      why: "This is a mass scam sent to thousands of people: there is no video. Don't answer, don't pay, report it (in France: signal-spam.fr)." },
    /* Nouveau : quiz qui récupère les réponses aux questions secrètes (vie privée) */
    { kind: "email", scam: true, fam: "humans",
      fromName: "FunQuiz", from: { t: "quiz@funquiz-games.example", sus: true },
      subject: ["What is your hacker name? 😎"],
      body: ["Find your hacker name in 10 seconds! Just give us ", { t: "your date of birth", sus: true }, ", ",
             { t: "your pet's name", sus: true }, " and ", { t: "your mother's maiden name", sus: true }, "."],
      link: { label: "Play now", href: "https://funquiz-games.example/hacker-name", scam: true },
      why: "These answers are often the secret questions used to reset your passwords. Never share them in a quiz or on social networks." },
    /* Nouveau : vrai message de la banque */
    { kind: "email", scam: false, fam: "phishing",
      fromName: "Bluestone Bank", from: { t: "info@bluestonebank.com" },
      subject: ["Your monthly statement is ready"],
      body: ["Your statement for March is available in your Bluestone Bank app. Reminder: we will never ask for your password or your codes by email or phone."],
      link: null,
      why: "This one is real: the real bank address, no link, nothing to type, and it reminds you of the right reflex." }
  ];

  /* ---------- Password request (#7, #8) ---------- */
  var PASSWORD = [
    { real: true, fromName: "NovaCorp IT", from: "it@novacorp.com", subject: "Your password expires in 3 days",
      text: "Your NovaCorp password expires in 3 days. Please change it on the intranet when you have time. We will never ask you for your current password by email.",
      why: "This one is real: the right address, no deadline pressure, and it reminds you that IT never asks for your password." },
    { real: false, fromName: "IT Support", from: "it-support@novacorp-helpdesk.com", subject: "Password expires TODAY",
      text: "Your password expires today. To keep your access, reply with your current password within 2 hours, or your account will be deleted.",
      why: "Never send your password, to anyone. The address is not novacorp.com and the deadline is there to scare you." },
    { real: false, fromName: "NovaMail Security", from: "admin@novamail-security.net", subject: "Mailbox 99% full",
      text: "Your mailbox is 99% full and will stop working. Confirm your password below to get 10 GB more for free.",
      why: "Free storage in exchange for your password is a trap. The address is not novacorp.com: report it." },
    /* Nouveau : vrai mail, changer le mot de passe d'usine du routeur */
    { real: true, fromName: "NovaCorp IT", from: "it@novacorp.com", subject: "Router password: please change it",
      text: "The office router still uses its factory password (admin). Please choose a new strong password for it today. There is no link: open the router settings with the IT team.",
      why: "This one is real: the right address, no link, and changing a factory password is a very good reflex. Do the same with your box at home." },
    /* Nouveau : faux mail qui demande le mot de passe du routeur */
    { real: false, fromName: "NovaBox", from: "admin@novabox-router.net", subject: "Router check",
      text: "We are checking all routers today. Reply with your router admin password so we can update it for you.",
      why: "Nobody needs your router password. A real provider updates the router without asking for it." }
  ];

  /* Mots de passe très courants (moins de 12 caractères = cassés tout de suite) */
  var COMMON_PASSWORDS = [
    "password", "motdepasse", "azerty", "qwerty", "123456", "12345678", "123456789", "111111", "000000",
    "abc123", "letmein", "welcome", "admin", "iloveyou", "soleil", "bonjour", "football", "monkey",
    "dragon", "sunshine", "princess", "novacorp", "hacker", "secret", "master", "chocolat", "loulou",
    "doudou", "marseille", "paris", "london", "summer", "winter", "hello", "freedom", "starwars", "pokemon"
  ];

  /* ---------- Incoming call (#19, #20) ---------- */
  var CALLS = [
    { scam: true, fam: "humans", name: "NovaCorp IT Support", number: "+44 20 7946 0321", voice: { pitch: 0.9 },
      text: "Hello, this is Kevin from the IT support team. We are updating your account right now and there is a problem. You just received a six digit code on your phone. Can you read it to me, please? It's urgent, or your account will be blocked.",
      why: "Nobody needs your 2FA code, not even IT. A code read over the phone lets the hacker into your account." },
    { scam: true, fam: "humans", name: "Unknown number", number: "+44 7700 900127", voice: { pitch: 1.2 },
      text: "Hi, this is Sarah, from the security department. A hacker is trying to log into your mailbox. To protect you, I need the code we just sent you by text message. Quickly, please!",
      why: "The \"security department\" calling from an unknown number and asking for your code is the hacker. Hang up and call IT yourself." },
    { scam: true, fam: "humans", name: "Unknown number", number: "+44 20 7946 0958", voice: { pitch: 0.8 },
      text: "Hello, I'm calling from the CEO's office. The boss needs a bank transfer of twenty thousand euros to a new partner today. It's confidential, don't talk about it to anyone. I'll send you the bank details now.",
      why: "Urgent, secret and about money: this is the fake boss scam. Always check by calling the boss on a number you know." },
    { scam: false, fam: "humans", name: "Tom · NovaCorp IT", number: "Internal ext. 2014", voice: { pitch: 1 },
      text: "Hi, it's Tom from IT. Just to tell you the printer on your floor is repaired. You can use it again. Have a nice day!",
      why: "This one is real: an internal number, a normal message, nothing asked." },
    { scam: false, fam: "humans", name: "NovaCorp Reception", number: "Internal ext. 1000", voice: { pitch: 1.3 },
      text: "Hello, this is the reception desk. Your visitor, Mr Lopez, has arrived for your ten o'clock meeting. He is waiting for you in the hall.",
      why: "This one is real: the reception's internal number, and nothing secret or urgent is asked." },
    /* Nouveau : faux technicien de la box */
    { scam: true, fam: "humans", name: "NovaBox Technician", number: "+44 20 7946 0412", voice: { pitch: 1 },
      text: "Hello, I'm a technician from NovaBox, your internet provider. Your router is sending viruses on the network. I need your router password so I can fix it from here. It will only take a minute.",
      why: "Your provider never asks for your router password on the phone. Hang up and call the number on your real contract." },
    /* Nouveau : faux conseiller bancaire (le nom affiché peut être imité) */
    { scam: true, fam: "humans", name: "Bluestone Bank", number: "+44 20 7946 0777", voice: { pitch: 0.95 },
      text: "Hello, this is the fraud department of Bluestone Bank. Someone is trying to use your card right now. To cancel the payment, please read me the code you just received by text message.",
      why: "This is the fake bank advisor scam: the code they want is the one that confirms THEIR payment. The name on the screen can be faked. A bank never asks for your codes: hang up and call the number on your card." },
    /* Nouveau : vrai collègue, simple information */
    { scam: false, fam: "humans", name: "Lea · NovaCorp IT", number: "Internal ext. 2031", voice: { pitch: 1.15 },
      text: "Hi, it's Lea from IT. Just so you know, we will restart the office router at six pm for an update. The internet will be cut for five minutes. You have nothing to do.",
      why: "This one is real: an internal number, information only, nothing asked." }
  ];

  /* ---------- Safe or fake link? (#25, #26) ---------- */
  /* kind : "site" (adresse web), "qr" (adresse ouverte par un QR code), "wifi" (nom de réseau)
     context : phrase affichée au-dessus · extra : conseil ajouté à l'explication */
  var LINKS = [
    { kind: "site", real: "https://hr.novacorp.com/payslip",
      fakes: [
        { url: "https://hr.novac0rp.com/payslip", tip: "Look closely: \"novac0rp\" uses a zero instead of the letter o." },
        { url: "https://novacorp.com.hr-portal.net/payslip", tip: "The real website is the end of the address: here it is hr-portal.net, not novacorp.com." },
        { url: "http://hr-novacorp.com/payslip", tip: "\"hr-novacorp.com\" is a different website, and it uses http without the s." }
      ] },
    { kind: "site", real: "https://www.bluestonebank.com/login",
      fakes: [
        { url: "https://www.bluest0nebank.com/login", tip: "\"bluest0nebank\" uses a zero instead of the letter o." },
        { url: "https://bluestonebank.com.secure-login.info", tip: "The real website is the end of the address: secure-login.info, not bluestonebank.com." },
        { url: "http://www.bluestone-bank.com/login", tip: "\"bluestone-bank.com\" has a dash: it is another website. And http has no s." }
      ] },
    { kind: "site", real: "https://cloud.novacorp.com/share/q3-report",
      fakes: [
        { url: "https://cloud.novacorp.co/share/q3-report", tip: "\".co\" is not \".com\": one missing letter, a different website." },
        { url: "https://cloud-novacorp.com/share/q3-report", tip: "\"cloud-novacorp.com\" with a dash is not novacorp.com." },
        { url: "https://cloud.novaccorp.com/share/q3-report", tip: "\"novaccorp\" has two c's: a copy of the real name." }
      ] },
    /* Nouveau : QR code piégé collé sur un horodateur ("quishing") */
    { kind: "qr", real: "https://pay.novacity-parking.com/zone-12",
      context: "You scanned a QR code stuck on a parking meter. It opens this address:",
      extra: "A fake QR code can be a sticker stuck on top of the real one: always read the address before you pay.",
      fakes: [
        { url: "https://pay-novacity-parking.com/zone-12", tip: "\"pay-novacity-parking.com\" with a dash is another website." },
        { url: "https://novacity-parking.pay-now.info/zone-12", tip: "The real website is the end of the address: pay-now.info, not novacity-parking.com." },
        { url: "http://pay.novacity-parklng.com/zone-12", tip: "\"parklng\" uses an l instead of an i, and http has no s." }
      ] },
    /* Nouveau : faux réseau Wi-Fi "jumeau" */
    { kind: "wifi", real: "NovaCorp-Guest",
      context: "At the NovaCorp office, you want to use the guest Wi-Fi. Is this the right network?",
      extra: "Ask reception for the exact name of the guest network and its password. A real guest network always has a password.",
      fakes: [
        { url: "NovaCorp-Guest-FREE", tip: "A company never adds \"FREE\" to its network name: it is a trap network created by someone nearby." },
        { url: "N0vaCorp-Guest", tip: "\"N0vaCorp\" uses a zero instead of the letter o." },
        { url: "NovaCorp Guest (open)", tip: "An open network has no password: anyone can spy on it. The real guest network asks for a password." }
      ] }
  ];

  /* ---------- Messy desk (#13) ---------- */
  var DESK = {
    title: "NovaCorp · Open space, 6:30 pm",
    seconds: 40,
    errorCounts: [0, 0, 2, 3, 4],
    errors: {
      postit:  "A post-it with a password on the screen",
      usb:     "An unknown USB key \"FREE\"",
      session: "A session left open: \"Accounting — logged in\"",
      badge:   "A badge left on the desk",
      code:    "A 2FA code visible on a phone",
      doc:     "A \"CONFIDENTIAL\" document left on the printer",
      router:  "The Wi-Fi password stuck on the router"
    }
  };

  /* ---------- Strange screen (#14) ---------- */
  var RANSOM = {
    attackChance: 0.55,
    supportChance: 0.4,   /* parmi les attaques : fausse alerte virus (sinon ransomware) */
    support: {
      title: "⚠ SECURITY ALERT",
      text: "Your computer is infected with 5 viruses! Do not turn it off. Call the support now on +44 20 7946 0999 to remove them.",
      why: "Fake virus alerts want you to call them and give them access to your computer. Never call the number: close the page (or restart) and alert IT."
    },
    amounts: ["2 bitcoins", "50,000 €", "3 bitcoins"],
    normals: [
      { title: "NovaCorp IT · Security update",
        text: "Installing the security update announced by email on Monday. Your computer will restart at the end. Questions? Call IT on ext. 2000." },
      { title: "NovaCorp Backup",
        text: "Weekly backup of your files in progress. You can keep working." },
      { title: "NovaCorp IT · Router update",
        text: "The office router is being updated. The internet may be slow for 5 minutes. You have nothing to do." }
    ],
    steps: [
      "Unplug the computer from the network",
      "Alert the IT team",
      "Don't pay the ransom",
      "Restore the files from the backup"
    ]
  };

  /* ---------- Voix du hacker ---------- */
  var HACKER = {
    start: "Hello NovaCorp. I am in your network. You have ten minutes.",
    timed: [
      "Tick tock... I'm inside your network.",
      "Too slow! Your passwords smell like coffee and birthdays.",
      "Four minutes left. I can already see your files...",
      "Two minutes left. Thank you for all the data!"
    ],
    alert: "Red alert! I am inside your network.",
    win: "No! You stopped me... this time.",
    lose: "The hacker is in. Game over.",
    /* Le téléphone mène la partie : phrases de chaque tour (voix enregistrées guide-*) */
    turn: {
      draw: "Attack incoming! Draw a red card.",
      choose: "Choose your defence:",
      choose2: "Choose two defences:",
      card: "Card {n}: {d}.",
      blocked: "Hacker blocked! Don't move the pawn.",
      pawn: "Move the pawn to space {n}.",
      flip: "Turn the green card face down.",
      flip2: "Turn the green cards face down.",
      next: "Next attack!"
    }
  };

  /* =========================================================
     PÉDAGOGIE : règle d'or, "et chez toi ?" et indice par famille
     ========================================================= */
  var FAMILY_INFO = {
    phishing: {
      rule: "Before you click, check who is writing and what they want. Urgent + link + request = trap.",
      home: "At home: same reflex for your personal emails and texts. Never pay or type a code from a link you did not ask for.",
      hint: "Look at the sender's address and at what the message asks you to do."
    },
    passwords: {
      rule: "One account = one long password, and two-factor authentication wherever you can.",
      home: "At home: change the factory password of your box, use a password manager and turn on 2FA on your email.",
      hint: "Think about how a hacker could guess, read or reuse this password."
    },
    devices: {
      rule: "Lock it, update it, back it up, and never plug in something you don't know.",
      home: "At home: turn on automatic updates, lock your phone with a code and keep a copy of your photos somewhere else.",
      hint: "Think about what someone could do with this device if you are not there."
    },
    humans: {
      rule: "Urgent, secret, money or codes: stop, and check with a number you already know.",
      home: "At home: fake bank advisors call too. Hang up and call the number on the back of your card yourself.",
      hint: "Who is really asking? How could you check without using their own phone number or link?"
    },
    network: {
      rule: "Check the address and the network before you type anything. No padlock, no personal data.",
      home: "At home: protect your Wi-Fi with a strong password (WPA2 or WPA3) and give visitors a guest network.",
      hint: "Look carefully at the address or the network name: is it really the official one?"
    }
  };

  /* ---------- Glossaire anglais / français ---------- */
  var GLOSSARY = [
    { en: "Phishing", fr: "Hameçonnage", def: "A fake message (email, text, website) that tries to steal your passwords, codes or money." },
    { en: "Smishing", fr: "Hameçonnage par SMS", def: "Phishing by text message (SMS)." },
    { en: "Vishing", fr: "Arnaque par téléphone", def: "Phishing by phone call: a fake advisor, technician or boss." },
    { en: "Quishing", fr: "Arnaque par QR code", def: "A fake QR code that opens a trap website." },
    { en: "Scam", fr: "Arnaque", def: "A trick to steal money or information." },
    { en: "Sender", fr: "Expéditeur", def: "The person or address that sends a message." },
    { en: "Attachment", fr: "Pièce jointe", def: "A file sent with an email. A \".exe\" file is a program." },
    { en: "Link", fr: "Lien", def: "Text you click to open a website. Press and hold it to see the real address." },
    { en: "Password", fr: "Mot de passe", def: "A secret word to open an account. Long is better than complicated." },
    { en: "Password manager", fr: "Gestionnaire de mots de passe", def: "A safe app that remembers all your passwords for you." },
    { en: "Two-factor authentication (2FA)", fr: "Double authentification", def: "A second lock: a code on your phone, in addition to the password." },
    { en: "Data leak", fr: "Fuite de données", def: "When stolen information (emails, passwords) ends up online." },
    { en: "Update", fr: "Mise à jour", def: "A new version that repairs security holes." },
    { en: "Backup", fr: "Sauvegarde", def: "A copy of your files, kept somewhere else." },
    { en: "Ransomware", fr: "Rançongiciel", def: "A virus that locks your files and asks for money." },
    { en: "Malware", fr: "Logiciel malveillant", def: "Any program made to harm: virus, spyware, ransomware..." },
    { en: "Antivirus", fr: "Antivirus", def: "A program that finds and removes malware." },
    { en: "Router / box", fr: "Routeur / box", def: "The device that gives internet and Wi-Fi to your home or office." },
    { en: "Wi-Fi network", fr: "Réseau Wi-Fi", def: "A wireless connection. An open network (no password) is not safe." },
    { en: "Guest network", fr: "Réseau invité", def: "A separate Wi-Fi for visitors, so they can't see your devices." },
    { en: "Firewall", fr: "Pare-feu", def: "A filter that blocks unwanted connections." },
    { en: "Padlock / HTTPS", fr: "Cadenas / HTTPS", def: "Shows that the connection to a website is encrypted (protected)." },
    { en: "Encrypted", fr: "Chiffré", def: "Turned into a secret code that only the right person can read." },
    { en: "Social engineering", fr: "Ingénierie sociale", def: "Tricking people (not computers): fake boss, fake support, pressure, flattery..." },
    { en: "Lock your screen", fr: "Verrouiller l'écran", def: "Close your session when you leave: Windows + L." },
    { en: "Hacker", fr: "Pirate informatique", def: "Someone who gets into systems without permission." },
    { en: "To report", fr: "Signaler", def: "To tell IT or an official website about a scam." },
    { en: "Fake / Real", fr: "Faux / Vrai", def: "The key question of the whole game!" }
  ];

  /* ---------- Où signaler, en France ---------- */
  var REPORT = [
    { name: "17cyber.gouv.fr", url: "https://17cyber.gouv.fr", what: "Official help if you are a victim of a cyberattack (France)." },
    { name: "cybermalveillance.gouv.fr", url: "https://www.cybermalveillance.gouv.fr", what: "Advice and help for victims, guides to protect yourself." },
    { name: "33700", url: null, what: "Forward a scam text message or call for free (France)." },
    { name: "signal-spam.fr", url: "https://www.signal-spam.fr", what: "Report a scam email." },
    { name: "haveibeenpwned.com", url: "https://haveibeenpwned.com", what: "Check if your email address appeared in a data leak." },
    { name: "Your bank", url: null, what: "Card stolen or fake payment: call the number on the back of your card at once." }
  ];

  /* ---------- Questions pour le débrief ---------- */
  var DISCUSS = [
    "Which attack surprised you the most? Why?",
    "Have you ever received a message or a call like this? What did you do?",
    "Which reflex will you use from tonight, at home?"
  ];

  return {
    FAMILY_INFO: FAMILY_INFO, GLOSSARY: GLOSSARY, REPORT: REPORT, DISCUSS: DISCUSS,
    /* Nom d'une défense à afficher (en français : nom FR + nom imprimé sur la carte) */
    defence: function (name) { return name; },
    /* Nom d'une défense dit par la voix (en français : le nom français seul) */
    defenceVoice: function (name) { return name.replace(/!$/, "").replace(" (2FA)", ", 2FA"); },
    FAMILIES: FAMILIES, DEFENCES: DEFENCES, CARDS: CARDS, MINIGAMES: MINIGAMES,
    TRAP: TRAP, PASSWORD: PASSWORD, COMMON_PASSWORDS: COMMON_PASSWORDS,
    CALLS: CALLS, LINKS: LINKS, DESK: DESK, RANSOM: RANSOM, HACKER: HACKER
  };
})();
