import json
import wave
from vosk import Model, KaldiRecognizer

import os

# Construct absolute path to the model directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "vosk-model-small-en-0.4")
model = Model(MODEL_PATH)

def transcribe_wav(wav_path: str) -> str:
    wf = wave.open(wav_path, "rb")
    rec = KaldiRecognizer(model, wf.getframerate())
    rec.SetWords(False)

    result = []

    while True:
        data = wf.readframes(4000)
        if len(data) == 0:
            break
        if rec.AcceptWaveform(data):
            result.append(json.loads(rec.Result()).get("text", ""))

    result.append(json.loads(rec.FinalResult()).get("text", ""))
    return " ".join(result).strip()
