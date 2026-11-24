"""Génère les fichiers MP3 de la voix (Piper, gratuit et libre) dans audio/fr et audio/en."""
import json, os, sys, subprocess
import numpy as np, lameenc
from piper import PiperVoice, SynthesisConfig

HERE = os.path.dirname(os.path.abspath(__file__))
VOICES = os.path.join(HERE, "voices")   # modèles Piper téléchargés (non envoyés sur GitHub)
PROJECT = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(HERE)
texts = json.loads(subprocess.check_output(["node", os.path.join(HERE, "extract_texts.js"), PROJECT]).decode("utf-8"))

# Voix : (modèle, locuteur, vitesse) — length_scale < 1 = un peu plus rapide
V = {
  "fr": {
    "hacker": ("fr_FR-mls-medium", "8582", 0.72),
    "m1": ("fr_FR-mls-medium", "10065", 0.78), "m2": ("fr_FR-mls-medium", "13177", 0.78), "m3": ("fr_FR-mls-medium", "5525", 0.8),
    "f1": ("fr_FR-siwis-medium", None, 0.95), "f2": ("fr_FR-mls-medium", "1474", 0.75),
  },
  "en": {
    "hacker": ("en_GB-vctk-medium", "p254", 1.0),
    "m1": ("en_GB-vctk-medium", "p226", 1.0), "m2": ("en_GB-vctk-medium", "p232", 1.0), "m3": ("en_GB-vctk-medium", "p360", 1.0),
    "f1": ("en_GB-jenny_dioco-medium", None, 1.0), "f2": ("en_GB-vctk-medium", "p228", 1.0),
  }
}
# Qui parle dans chaque appel (même ordre que CALLS dans js/cards.js)
CALL_VOICES = ["m1",  # 0 Kevin, faux support
               "f1",  # 1 Sarah, fausse sécurité
               "m2",  # 2 bureau du PDG
               "m3",  # 3 Tom, informatique
               "f2",  # 4 accueil
               "m1",  # 5 technicien NovaBox
               "f2",  # 6 faux conseiller bancaire
               "f1"]  # 7 Léa, informatique

loaded = {}
def voice(model):
    if model not in loaded:
        loaded[model] = PiperVoice.load(os.path.join(VOICES, model + ".onnx"))
    return loaded[model]

def synth(lang, role, text, dest):
    model, speaker, speed = V[lang][role]
    v = voice(model)
    sid = v.config.speaker_id_map[speaker] if speaker else None
    chunks = list(v.synthesize(text, SynthesisConfig(speaker_id=sid, length_scale=speed)))
    gap = np.zeros(int(v.config.sample_rate * 0.25), dtype=np.int16)   # petite pause entre les phrases
    parts = []
    for c in chunks:
        parts.append(c.audio_int16_array); parts.append(gap)
    pcm = np.concatenate(parts)
    enc = lameenc.Encoder()
    enc.set_bit_rate(48); enc.set_in_sample_rate(v.config.sample_rate); enc.set_channels(1); enc.set_quality(2)
    data = enc.encode(pcm.tobytes()) + enc.flush()
    open(dest, "wb").write(data)
    return len(data), len(pcm) / v.config.sample_rate

total = 0
for lang in ["fr", "en"]:
    folder = os.path.join(PROJECT, "audio", lang)
    os.makedirs(folder, exist_ok=True)
    for key, text in texts[lang]["hacker"].items():
        size, dur = synth(lang, "hacker", text, os.path.join(folder, key + ".mp3"))
        total += size; print(lang, key, f"{dur:.1f}s", f"{size//1024} Ko")
    for i, c in enumerate(texts[lang]["calls"]):
        size, dur = synth(lang, CALL_VOICES[i], c["text"], os.path.join(folder, c["key"] + ".mp3"))
        total += size; print(lang, c["key"], c["name"], f"{dur:.1f}s", f"{size//1024} Ko")
print(f"TOTAL {total//1024} Ko")
