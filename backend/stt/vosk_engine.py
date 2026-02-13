import json
import wave
from vosk import Model, KaldiRecognizer

MODEL_PATH = "models/vosk-model-small-en-in-0.4"
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
