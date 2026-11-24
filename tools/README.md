# Régénérer les voix (gratuit)

Les fichiers `audio/fr/*.mp3` et `audio/en/*.mp3` (hacker + appels) sont fabriqués
avec **Piper**, une synthèse vocale gratuite et libre qui tourne sur l'ordinateur.
À refaire seulement si vous changez un texte de la voix dans `js/cards.js` ou `js/cards-fr.js`.

```
pip install piper-tts lameenc numpy
cd tools
python -m piper.download_voices --data-dir voices fr_FR-mls-medium fr_FR-siwis-medium en_GB-vctk-medium en_GB-jenny_dioco-medium
python make_audio.py
```

Il faut aussi Node.js (le script lit les textes dans les fichiers `js/`).
Le dossier `tools/voices/` (environ 250 Mo) n'est pas envoyé sur GitHub.
