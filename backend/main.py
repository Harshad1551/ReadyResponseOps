from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
import uuid
import psycopg2
import tempfile
import os
import json
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai

from db import get_connection
from stt.vosk_engine import transcribe_wav

# ------------------------------------------------------------------
# Setup
# ------------------------------------------------------------------
API_KEY = AIzaSyA6KBmCbFh7jQSAUFuTTZ-UGZ6GgJIlmU8
load_dotenv()

genai.configure(api_key=os.getenv("API_KEY"))
gemini_model = genai.GenerativeModel("gemini-1.5-flash")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",  # your frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------
# SPEECH → TEXT (UNCHANGED CORE LOGIC)
# ------------------------------------------------------------------

@app.post("/speech-to-text")
async def speech_to_text(audio: UploadFile = File(...)):
    audio_bytes = await audio.read()

    # Windows-safe temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        temp_path = tmp.name
        tmp.write(audio_bytes)

    try:
        transcript = transcribe_wav(temp_path)

        # Store WAV in PostgreSQL (optional but kept as-is)
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

        return { "text": transcript }

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

# ------------------------------------------------------------------
# GEMINI AI: TRANSCRIPTION → INCIDENT FIELDS
# ------------------------------------------------------------------

class IncidentExtractionRequest(BaseModel):
    transcription: str

@app.post("/ai/extract-incident")
def extract_incident(req: IncidentExtractionRequest):
    prompt = f"""
You are an emergency incident analysis system.

Rules (STRICT):
- You MUST always return a value for "type" and "severity"
- You MUST choose ONLY from the allowed values
- NEVER leave fields empty

Allowed values:
type = ["Fire", "Flooding", "Medical", "Power Outage", "Gas Leak",
        "Traffic Accident", "Building Collapse", "Hazardous Material",
        "Civil Unrest", "Natural Disaster", "Other"]

severity = ["High", "Medium", "Low"]

Severity classification rules (STRICT, MUST FOLLOW):

You MUST always choose exactly ONE severity value.
You are NOT allowed to leave severity empty.
You are NOT allowed to say "unknown" or "unclear".

Severity meanings:
- High:
  Immediate danger to people or property.
  Examples: fire, smoke, gas leak, explosion, building collapse,
  traffic accident with injuries, flooding inside buildings.

- Medium:
  Potential danger but not immediately life-threatening.
  Examples: power outage, minor accident, medical issue without loss of consciousness,
  flooding on roads, fallen trees, blocked access.

- Low:
  Minor issue, informational, or no immediate risk.
  Examples: noise complaint, small malfunction, non-urgent request.

Decision process (MANDATORY):
1. If transcript mentions fire, smoke, gas, explosion, collapse → severity = High
2. Else if transcript mentions injury, accident, outage, obstruction → severity = Medium
3. Else → severity = Low

If unsure between two levels, ALWAYS choose the higher severity.

Return JSON ONLY in this format:
{{
  "type": "",
  "severity": "",
  "description": ""
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

