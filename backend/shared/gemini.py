import logging
import json
import time
from typing import Dict, Any, List
from .config import settings


logger = logging.getLogger("ApexMind.Gemini")

gemini_client = None

try:
    from google import genai
    from google.genai import types
    if settings.GEMINI_API_KEY:
        gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
        logger.info("Google GenAI client initialized successfully.")
    else:
        logger.warning("GEMINI_API_KEY is not set.")
except Exception as e:
    logger.error(f"Failed to load google.genai: {e}")

def generate_gemini_script(
    category: str,
    topic: str,
    tone: str,
    length: str,
    memory_quotes: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Generates viral motivational quote scripts via Gemini with memory deduplication."""
    memory_snippets = "\n".join([
        f"- [Title: {q.get('title')}] Quote: {q.get('quote')}"
        for q in memory_quotes[-15:]
    ]) if memory_quotes else "No previous quotes recorded yet."

    prompt = f"""You are an elite YouTube Shorts motivational writer and virality strategist.
Produce an inspiring, punchy, retention-optimized motivational quote script.

THEME: {category or 'Stoic Discipline & Relentless Focus'}
TOPIC: {topic or 'Winning quiet battles, silence over excuses, compounding grit'}
TONE: {tone or 'Authoritative, calm, stoic, profound'}
TARGET LENGTH: {length or '30 seconds'}

CRITICAL MEMORY & UNIQUENESS CONSTRAINT:
Your script MUST NOT repeat, paraphrase, or borrow metaphors from any of these previously saved quotes:
{memory_snippets}

Output MUST be a single raw JSON object with exactly these keys:
{{
  "title": "A viral Shorts title with punch under 60 chars",
  "hook": "Unforgettable 3 to 5 word opening line spoken in first 2 seconds",
  "quote": "A powerful 2-3 sentence motivational monologue",
  "cta": "A sharp 1-sentence closing call-to-action",
  "speechStyle": "Short description of vocal cadence (e.g. Calm, grounded, stoic)",
  "visualTheme": "Dark Mountain Dawn",
  "recommendedVoice": "Fenrir",
  "tags": ["motivation", "discipline", "mindset", "shorts", "stoic"],
  "hashtags": ["#Shorts", "#Motivation", "#Grit"],
  "subtitles": [
    {{"text": "Opening hook phrase", "start": 0.0, "duration": 2.2}},
    {{"text": "First quote sentence", "start": 2.2, "duration": 5.5}},
    {{"text": "Second quote sentence", "start": 7.7, "duration": 6.0}},
    {{"text": "Final call to action", "start": 13.7, "duration": 3.0}}
  ]
}}
"""

    if not gemini_client:
        logger.warning("Gemini script requested but GEMINI_API_KEY is not configured.")
        raise ValueError("GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in your environment to generate dynamic AI scripts.")

    logger.info(f"Initiating Gemini script generation | Theme: '{category}' | Topic: '{topic}' | Tone: '{tone}' | Target Length: '{length}' | Prior Quotes Deduplicated: {len(memory_quotes)}")
    start_t = time.perf_counter()

    try:
        from google.genai import types
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        raw = response.text or "{}"
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        elif "```" in raw:
            raw = raw.split("```")[1].split("```")[0].strip()
        result = json.loads(raw)
        elapsed = time.perf_counter() - start_t
        logger.info(f"Gemini 2.5 Flash generated script in {elapsed:.2f}s | Title: '{result.get('title')}' | Hook: '{result.get('hook')}'")
        return result
    except Exception as e:
        elapsed = time.perf_counter() - start_t
        logger.error(f"Gemini API generation error after {elapsed:.2f}s: {e}")
        raise RuntimeError(f"Gemini script generation failed: {e}")

def generate_gemini_voiceover(text: str, voice_name: str = "Fenrir") -> Dict[str, Any]:
    """Generates audio voiceover via Gemini."""
    if not gemini_client:
        logger.warning(f"Voiceover requested for '{voice_name}' but GEMINI_API_KEY is not configured.")
        raise ValueError("GEMINI_API_KEY is not configured for voiceover generation.")

    logger.info(f"Requesting Gemini TTS voiceover synthesis | Voice Persona: '{voice_name}' | Text Length: {len(text)} chars")
    start_t = time.perf_counter()

    try:
        from google.genai import types
        tts_res = gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=f"Read this motivational script with a stoic, powerful voice: {text}",
            config=types.GenerateContentConfig(response_modalities=["AUDIO"])
        )
        candidates = getattr(tts_res, "candidates", [])
        if candidates and candidates[0].content.parts:
            for part in candidates[0].content.parts:
                inline = getattr(part, "inline_data", None)
                if inline and getattr(inline, "data", None):
                    elapsed = time.perf_counter() - start_t
                    logger.info(f"Gemini TTS synthesized 24kHz audio in {elapsed:.2f}s for voice '{voice_name}'")
                    return {
                        "success": True,
                        "voiceName": voice_name,
                        "mimeType": "audio/wav",
                        "audioBase64": inline.data
                    }
        raise RuntimeError("No audio data returned by Gemini TTS.")
    except Exception as e:
        elapsed = time.perf_counter() - start_t
        logger.error(f"Gemini audio generation error after {elapsed:.2f}s: {e}")
        raise RuntimeError(f"Voiceover synthesis failed: {e}")


