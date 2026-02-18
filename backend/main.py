from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
import uuid
import psycopg2
import tempfile
import os
import json
import wave
import numpy as np
import soundfile as sf
from scipy.signal import resample
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai

from db import get_connection
from stt.vosk_engine import transcribe_wav

# ------------------------------------------------------------------
# Setup
# ------------------------------------------------------------------
load_dotenv()

genai.configure(api_key=os.getenv("API_KEY"))
gemini_model = genai.GenerativeModel("gemini-1.5-flash")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "https://readyresponseops-front.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------
# Utility: Force 16kHz Mono WAV (VERY IMPORTANT)
# ------------------------------------------------------------------

def ensure_16k_mono(path: str):
    data, samplerate = sf.read(path)

    # Convert stereo → mono
    if len(data.shape) > 1:
        data = np.mean(data, axis=1)

    # Resample if not 16kHz
    if samplerate != 16000:
        num_samples = round(len(data) * 16000 / samplerate)
        data = resample(data, num_samples)

    # Write back properly formatted wav
    sf.write(path, data, 16000)

# ------------------------------------------------------------------
# SPEECH → TEXT
# ------------------------------------------------------------------

@app.post("/speech-to-text")
async def speech_to_text(audio: UploadFile = File(...)):
    audio_bytes = await audio.read()

    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        temp_path = tmp.name
        tmp.write(audio_bytes)

    try:
        # 🔥 FORCE CORRECT AUDIO FORMAT
        ensure_16k_mono(temp_path)

        # Optional debug
        with wave.open(temp_path, "rb") as wf:
            print("Channels:", wf.getnchannels())
            print("Sample Width:", wf.getsampwidth())
            print("Frame Rate:", wf.getframerate())

        transcript = transcribe_wav(temp_path)

        print("========== RAW TRANSCRIPT ==========")
        print(transcript)
        print("=====================================")

        # Store in DB
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO voice_recordings (id, audio, content_type)
            VALUES (%s, %s, %s)
            """,
            (
                str(uuid.uuid4()),
                psycopg2.Binary(audio_bytes),
                "audio/wav"
            )
        )

        conn.commit()
        cursor.close()
        conn.close()

        return {"text": transcript}

    except Exception as e:
        print("❌ STT failed:", str(e))
        return {"text": ""}

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
