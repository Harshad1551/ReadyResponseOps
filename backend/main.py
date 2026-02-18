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
class IncidentExtractionRequest(BaseModel):
    transcription: str

@app.post("/ai/extract-incident")
def extract_incident(req: IncidentExtractionRequest):
    prompt = f"""
You are a STRICT emergency incident classifier.

Your job:
Classify the transcript into ONE type and ONE severity.

You MUST follow the rules exactly.
You are NOT allowed to invent new categories.

----------------------------------------------------
ALLOWED TYPES:
["Fire", "Flooding", "Medical", "Power Outage",
 "Gas Leak", "Traffic Accident", "Building Collapse",
 "Hazardous Material", "Civil Unrest",
 "Natural Disaster", "Other"]

ALLOWED SEVERITY:
["High", "Medium", "Low"]

----------------------------------------------------
CLASSIFICATION LOGIC (MANDATORY):

1) If transcript contains ANY of these words:
   fire, smoke, burning, explosion, gas leak,
   collapse, building down
   → type = "Fire" or appropriate disaster
   → severity = "High"

2) If transcript contains:
   accident, injured, crash, collision,
   blocked road, fallen tree, outage
   → type = "Traffic Accident" or closest match
   → severity = "Medium"

3) If transcript contains:
   pain, unconscious, medical emergency,
   bleeding, heart problem
   → type = "Medical"
   → severity = "High"

4) If none match:
   → type = "Other"
   → severity = "Low"

If multiple rules apply, choose the HIGHEST severity.

----------------------------------------------------
Return ONLY valid JSON in this format:

{{
  "type": "One from allowed list",
  "severity": "High | Medium | Low",
  "description": "Cleaned transcript"
}}

Transcript:
\"\"\"{req.transcription}\"\"\"
"""

    try:
        response = gemini_model.generate_content(prompt)

        if not response or not response.text:
            raise RuntimeError("Empty response from Gemini")

        raw_text = response.text.strip()
        print("🔹 Gemini raw response:", raw_text)

        cleaned = raw_text.replace("```json", "").replace("```", "").strip()

        result = json.loads(cleaned)

        # Normalize
        result["type"] = result.get("type", "Other").strip().title()
        result["severity"] = result.get("severity", "Medium").strip().title()
        result["location"] = result.get("location", "").strip()
        result["description"] = result.get("description", req.transcription).strip()

        return result

    except Exception as e:
        print("❌ Gemini extraction failed:", str(e))

        return {
            "type": "Other",
            "severity": "Medium",
            "description": req.transcription
        }
