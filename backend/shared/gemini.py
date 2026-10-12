import logging
import json
import time
import base64
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
        # As recommended by Google GenAI SDK: use Chat.send_message for AFC and content generation
        chat = gemini_client.chats.create(
            model="gemini-2.5-flash",
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        response = chat.send_message(prompt)
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
            model="gemini-2.5-flash-preview-tts",
            contents=f"Read this motivational script with a powerful, stoic, cinematic voice: {text}",
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name=voice_name,
                        )
                    )
                ),
            )
        )
        candidates = getattr(tts_res, "candidates", [])
        if candidates and candidates[0].content.parts:
            for part in candidates[0].content.parts:
                inline = getattr(part, "inline_data", None)
                if inline and getattr(inline, "data", None):
                    elapsed = time.perf_counter() - start_t
                    raw_audio = inline.data
                    mime = getattr(inline, "mime_type", "audio/wav") or "audio/wav"
                    
                    # Convert raw L16 PCM to standard 24kHz 16-bit mono WAV so browsers can play it directly
                    if "pcm" in mime.lower() or "l16" in mime.lower():
                        import struct
                        sample_rate = 24000
                        if "rate=" in mime:
                            try:
                                sample_rate = int(mime.split("rate=")[1].split(";")[0])
                            except Exception:
                                sample_rate = 24000
                        
                        byte_rate = sample_rate * 2
                        data_size = len(raw_audio) if isinstance(raw_audio, bytes) else len(base64.b64decode(raw_audio))
                        pcm_bytes = raw_audio if isinstance(raw_audio, bytes) else base64.b64decode(raw_audio)
                        wav_header = struct.pack(
                            '<4sI4s4sIHHIIHH4sI',
                            b'RIFF',
                            36 + data_size,
                            b'WAVE',
                            b'fmt ',
                            16,
                            1,
                            1,
                            sample_rate,
                            byte_rate,
                            2,
                            16,
                            b'data',
                            data_size
                        )
                        raw_audio = wav_header + pcm_bytes
                        mime = "audio/wav"

                    # Encode bytes to base64 string for JSON transport
                    if isinstance(raw_audio, bytes):
                        audio_b64 = base64.b64encode(raw_audio).decode("utf-8")
                    else:
                        audio_b64 = raw_audio  # already a string
                    
                    logger.info(f"Gemini TTS synthesized audio in {elapsed:.2f}s for voice '{voice_name}' | mime={mime} | b64_len={len(audio_b64)}")
                    return {
                        "success": True,
                        "voiceName": voice_name,
                        "mimeType": mime,
                        "audioBase64": audio_b64,
                        "audioUrl": f"data:{mime};base64,{audio_b64}",
                    }
        raise RuntimeError("No audio data returned by Gemini TTS.")
    except Exception as e:
        elapsed = time.perf_counter() - start_t
        logger.error(f"Gemini audio generation error after {elapsed:.2f}s: {e}")
        raise RuntimeError(f"Voiceover synthesis failed: {e}")


