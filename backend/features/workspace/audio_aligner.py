"""
backend/features/workspace/audio_aligner.py
High-Precision Dynamic Audio-Word Alignment Engine for ApexMind AI.
Aligns storyboard scenes and word-level karaoke subtitle timestamps
to synthesized voiceover audio (Fenrir, Edge-TTS, Gemini TTS, ElevenLabs)
using speech transcription, audio energy envelope detection,
and syllable-weighted phonetic cadence models.
"""

import io
import json
import logging
import math
import re
import struct
import wave
from typing import Any, Dict, List, Optional, Tuple
from pydantic import BaseModel

logger = logging.getLogger("ApexMind.Studio.AudioAligner")

# Common English grammatical particles and unstressed function words
FUNCTION_WORDS = {
    "a", "an", "the", "and", "or", "but", "if", "then", "else", "when", "at",
    "by", "for", "from", "in", "into", "of", "off", "on", "onto", "out", "over",
    "to", "up", "with", "as", "is", "am", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "can", "could", "may",
    "might", "must", "shall", "should", "will", "would", "it", "its", "it's",
    "he", "she", "we", "they", "me", "him", "her", "us", "them", "my", "your",
    "his", "our", "their", "this", "that", "these", "those", "so", "than", "too",
}


class WordTimestampItem(BaseModel):
    word: str
    start: float
    end: float
    emphasis: bool = False


class TranscriptAlignment(BaseModel):
    words: List[WordTimestampItem]


def estimate_syllables(word: str) -> int:
    """
    Estimates the number of spoken syllables in an English word using
    vowel cluster analysis and phonotactic edge rules.
    """
    cleaned = re.sub(r"[^a-zA-Z]", "", word).lower()
    if not cleaned:
        return 1
    if len(cleaned) <= 3:
        return 1

    irregulars = {
        "relentless": 3,
        "discipline": 3,
        "unstoppable": 4,
        "uncompromising": 5,
        "perseverance": 4,
        "conquer": 2,
        "warrior": 2,
        "champion": 2,
        "monologue": 3,
        "every": 2,
        "different": 2,
        "business": 2,
    }
    if cleaned in irregulars:
        return irregulars[cleaned]

    count = len(re.findall(r"[aeiouy]+", cleaned))

    if cleaned.endswith("e") and not cleaned.endswith("le") and count > 1:
        count -= 1
    elif cleaned.endswith("ed") and count > 1 and not (cleaned.endswith("ted") or cleaned.endswith("ded")):
        count -= 1

    return max(1, count)


def compute_word_weight(word: str, is_first: bool = False, is_last: bool = False) -> float:
    """
    Computes a relative spoken duration weight for a word.
    """
    raw = word.strip()
    clean = re.sub(r"[^\w]", "", raw).lower()
    syllables = estimate_syllables(clean)

    weight = max(1.0, float(syllables) * 2.2)

    if clean in FUNCTION_WORDS:
        weight *= 0.62
    elif len(clean) >= 7 or syllables >= 3:
        weight *= 1.25

    if is_first:
        weight *= 1.10

    if any(p in raw for p in [".", "!", "?"]):
        weight += 3.8
    elif any(p in raw for p in [",", ";", ":", "—", "-"]):
        weight += 2.0

    if is_last:
        weight *= 1.18

    return max(0.8, weight)


def is_power_word(word: str) -> bool:
    """Identifies words that carry emotional punch for karaoke emphasis & highlights."""
    clean = re.sub(r"[^\w]", "", word).upper()
    if not clean:
        return False
    power_keywords = {
        "STOP", "NEVER", "ALWAYS", "FOCUS", "WIN", "RISE", "NOW", "CONQUER",
        "BUILD", "FIGHT", "GRIT", "POWER", "RELENTLESS", "DISCIPLINE",
        "WARRIOR", "STRONG", "STAND", "PUSH", "CHAMPION", "TRUTH", "KILL",
        "DESTINY", "UNSTOPPABLE", "FEARLESS", "SACRIFICE", "SUCCESS", "UNYIELDING"
    }
    return (
        clean in power_keywords
        or word.isupper()
        or (len(clean) >= 4 and estimate_syllables(clean) >= 3)
    )


def extract_pcm_energy_profile(audio_bytes: bytes, frame_ms: int = 30) -> Optional[Tuple[List[float], float]]:
    """
    Extracts the root-mean-square (RMS) energy envelope from WAV audio bytes.
    Returns (energy_frames, frame_duration_sec).
    """
    try:
        with wave.open(io.BytesIO(audio_bytes), "rb") as wf:
            channels = wf.getnchannels()
            sample_width = wf.getsampwidth()
            framerate = wf.getframerate()
            num_frames = wf.getnframes()
            if framerate <= 0 or num_frames <= 0 or sample_width != 2:
                return None

            raw_data = wf.readframes(num_frames)
            samples_per_frame = int(framerate * (frame_ms / 1000.0))
            bytes_per_sample = sample_width * channels
            chunk_bytes = samples_per_frame * bytes_per_sample

            total_chunks = len(raw_data) // chunk_bytes
            if total_chunks < 5:
                return None

            energy_profile: List[float] = []
            for i in range(total_chunks):
                start_byte = i * chunk_bytes
                chunk = raw_data[start_byte : start_byte + chunk_bytes]
                num_shorts = len(chunk) // 2
                shorts = struct.unpack(f"<{num_shorts}h", chunk[: num_shorts * 2])
                if not shorts:
                    energy_profile.append(0.0)
                    continue

                mean_sq = sum(s * s for s in shorts) / len(shorts)
                rms = math.sqrt(mean_sq)
                energy_profile.append(rms)

            frame_dur = frame_ms / 1000.0
            return energy_profile, frame_dur
    except Exception:
        return None


def snap_to_musical_beat(candidate_cut: float, bpm: float = 140.0, sfx_drops: Optional[List[float]] = None) -> float:
    """
    Snaps a candidate voice-pause cut to the closest musical beat or drop.
    """
    if sfx_drops:
        for drop in sfx_drops:
            if abs(drop - candidate_cut) <= 0.45:
                return round(drop, 2)
    beat_interval = 60.0 / max(60.0, min(220.0, bpm))
    nearest_beat = round(candidate_cut / beat_interval) * beat_interval
    if abs(nearest_beat - candidate_cut) <= 0.35:
        return round(nearest_beat, 2)
    half_beat = beat_interval / 2.0
    nearest_half = round(candidate_cut / half_beat) * half_beat
    if abs(nearest_half - candidate_cut) <= 0.20:
        return round(nearest_half, 2)
    return round(candidate_cut, 2)


def detect_sentence_boundaries(
    energy_profile: List[float],
    frame_dur: float,
    num_scenes: int,
    expected_cuts: List[float],
) -> List[float]:
    """
    Detects the true silence valleys in the audio energy profile closest to the
    expected scene transitions, locking cuts to natural speech pauses.
    """
    if num_scenes <= 1 or not energy_profile:
        return []

    max_energy = max(energy_profile) or 1.0
    normalized_energy = [e / max_energy for e in energy_profile]
    total_frames = len(normalized_energy)

    actual_cuts: List[float] = []
    window_frames = int(1.2 / frame_dur)

    for exp_cut in expected_cuts:
        target_frame = int(exp_cut / frame_dur)
        low_bound = max(1, target_frame - window_frames)
        high_bound = min(total_frames - 2, target_frame + window_frames)

        if low_bound >= high_bound:
            actual_cuts.append(exp_cut)
            continue

        best_frame = target_frame
        min_val = 999.0
        for f in range(low_bound, high_bound):
            val = normalized_energy[f]
            dist_penalty = abs(f - target_frame) * 0.002
            score = val + dist_penalty
            if score < min_val:
                min_val = score
                best_frame = f

        snapped_time = round(best_frame * frame_dur, 2)
        actual_cuts.append(snapped_time)

    return actual_cuts


def extract_actual_speech_word_timestamps(
    audio_bytes: bytes,
    mime_type: str = "audio/wav",
    narration_text: str = "",
) -> Optional[List[Dict[str, Any]]]:
    """
    Direct Audio-to-Word Alignment:
    Sends the synthesized audio file to Gemini multimodal audio model
    to extract actual speech word timestamps directly from the waveform.
    """
    if not audio_bytes or not narration_text:
        return None

    try:
        from backend.shared.gemini import gemini_client
        if not gemini_client:
            return None

        from google.genai import types

        audio_part = types.Part.from_bytes(data=audio_bytes, mime_type=mime_type)
        prompt = (
            "You are an acoustic speech alignment engine. Listen to this synthesized audio track and align it to the exact script words provided below. "
            "Output the precise start timestamp and end timestamp in seconds for every single spoken word. "
            "Ensure timestamps reflect the actual audio playback sound start and finish. "
            f"Script words to align: {narration_text}"
        )

        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[audio_part, prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=TranscriptAlignment,
                temperature=0.1,
            ),
        )

        if response and response.text:
            data = json.loads(response.text)
            words = data.get("words", [])
            if words and len(words) >= len(narration_text.split()) * 0.7:
                logger.info(f"[AudioAligner] Successfully extracted {len(words)} actual speech word timestamps via Gemini Multimodal Audio")
                return words
    except Exception as e:
        logger.debug(f"[AudioAligner] Multimodal audio alignment notice ({e}), using acoustic energy model")

    return None


def align_storyboard_to_audio(
    storyboard: List[Dict[str, Any]],
    audio_bytes: Optional[bytes] = None,
    mime_type: str = "audio/wav",
    total_duration_seconds: float = 30.0,
    highlight_color: str = "#FACC15",
    bpm: float = 140.0,
    sfx_drops: Optional[List[float]] = None,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Performs dynamic audio-word alignment across the entire storyboard:
    1. Tries multimodal acoustic alignment directly from the synthesized audio waveform.
    2. Uses speech energy envelope detection to identify pause troughs between scenes.
    3. Synthesizes syllable-weighted, cadence-perfect karaoke word timestamps.
    4. Marks power words with visual emphasis and highlight colors.

    Returns:
      (aligned_storyboard, flat_word_timestamps)
    """
    if not storyboard:
        return [], []

    valid_scenes = sorted(storyboard, key=lambda s: s.get("sceneNumber", 0))
    num_scenes = len(valid_scenes)

    # Assemble full text for reference
    all_scene_texts = [(sc.get("subtitleText") or "").strip() for sc in valid_scenes]
    full_narration = " ".join(t for t in all_scene_texts if t)

    # ── Attempt 1: Direct speech waveform word extraction ──
    actual_words: Optional[List[Dict[str, Any]]] = None
    if audio_bytes and full_narration:
        actual_words = extract_actual_speech_word_timestamps(
            audio_bytes=audio_bytes,
            mime_type=mime_type,
            narration_text=full_narration,
        )

    # If actual speech word timestamps were extracted directly from the audio file:
    if actual_words and len(actual_words) > 0:
        word_idx = 0
        aligned_scenes: List[Dict[str, Any]] = []
        all_words_result: List[Dict[str, Any]] = []

        for idx, sc in enumerate(valid_scenes):
            scene_text = (sc.get("subtitleText") or "").strip()
            tokens = scene_text.split()
            scene_word_objs: List[Dict[str, Any]] = []

            for _ in tokens:
                if word_idx < len(actual_words):
                    w_item = actual_words[word_idx]
                    w_obj = {
                        "word": w_item.get("word") if isinstance(w_item, dict) else w_item.word,
                        "start": round(float(w_item.get("start") if isinstance(w_item, dict) else w_item.start), 3),
                        "end": round(float(w_item.get("end") if isinstance(w_item, dict) else w_item.end), 3),
                        "emphasis": is_power_word(w_item.get("word") if isinstance(w_item, dict) else w_item.word),
                        "highlightColor": highlight_color if is_power_word(w_item.get("word") if isinstance(w_item, dict) else w_item.word) else None,
                    }
                    w_obj["duration"] = round(w_obj["end"] - w_obj["start"], 3)
                    scene_word_objs.append(w_obj)
                    all_words_result.append({**w_obj, "sceneNumber": sc.get("sceneNumber", idx + 1)})
                    word_idx += 1

            sc_start = scene_word_objs[0]["start"] if scene_word_objs else (idx * 3.0)
            sc_end = scene_word_objs[-1]["end"] if scene_word_objs else (sc_start + 3.0)
            sc_dur = round(max(0.4, sc_end - sc_start), 3)

            aligned_scenes.append({
                **sc,
                "start": round(sc_start, 2),
                "duration": sc_dur,
                "words": scene_word_objs,
            })

        if aligned_scenes:
            return aligned_scenes, all_words_result

    # ── Attempt 2: Acoustic Speech Energy Envelope + Syllable Cadence Alignment ──
    scene_weights: List[float] = []
    for sc in valid_scenes:
        text = (sc.get("subtitleText") or "").strip()
        words = text.split()
        if not words:
            scene_weights.append(1.0)
            continue
        sc_weight = sum(
            compute_word_weight(w, is_first=(i == 0), is_last=(i == len(words) - 1))
            for i, w in enumerate(words)
        )
        scene_weights.append(max(1.0, sc_weight))

    total_weight = sum(scene_weights) or 1.0
    effective_dur = max(1.0, total_duration_seconds)

    expected_cuts: List[float] = []
    running_t = 0.0
    for i in range(num_scenes - 1):
        dur = (scene_weights[i] / total_weight) * effective_dur
        running_t += dur
        expected_cuts.append(round(running_t, 2))

    snapped_cuts = expected_cuts
    if audio_bytes and ("wav" in mime_type.lower() or audio_bytes.startswith(b"RIFF")):
        pcm_result = extract_pcm_energy_profile(audio_bytes, frame_ms=30)
        if pcm_result:
            profile, frame_dur = pcm_result
            detected = detect_sentence_boundaries(profile, frame_dur, num_scenes, expected_cuts)
            if detected and len(detected) == len(expected_cuts):
                valid_snapped: List[float] = []
                prev = 0.0
                for c in detected:
                    c_snapped = snap_to_musical_beat(c, bpm=bpm, sfx_drops=sfx_drops)
                    c_clamped = max(prev + 1.2, min(c_snapped, effective_dur - (num_scenes - len(valid_snapped)) * 1.0))
                    valid_snapped.append(round(c_clamped, 2))
                    prev = c_clamped
                snapped_cuts = valid_snapped

    cut_points = [0.0] + snapped_cuts + [round(effective_dur, 2)]
    aligned_scenes: List[Dict[str, Any]] = []
    all_words: List[Dict[str, Any]] = []

    for idx, sc in enumerate(valid_scenes):
        sc_start = cut_points[idx]
        sc_end = cut_points[idx + 1]
        sc_duration = round(max(0.4, sc_end - sc_start), 3)

        raw_text = (sc.get("subtitleText") or "").strip()
        tokens = [w for w in raw_text.split() if w.strip()]

        scene_words: List[Dict[str, Any]] = []
        if tokens:
            word_weights = [
                compute_word_weight(w, is_first=(i == 0), is_last=(i == len(tokens) - 1))
                for i, w in enumerate(tokens)
            ]
            sum_w = sum(word_weights) or 1.0

            pause_reserve = 0.18 if idx < num_scenes - 1 else 0.05
            active_spoken_window = max(0.2, sc_duration - pause_reserve)

            w_cursor = sc_start
            for i, tok in enumerate(tokens):
                w_dur = (word_weights[i] / sum_w) * active_spoken_window
                w_end = round(w_cursor + w_dur, 3)
                emphasis = is_power_word(tok)

                word_obj = {
                    "word": tok,
                    "start": round(w_cursor, 3),
                    "end": w_end,
                    "duration": round(w_dur, 3),
                    "emphasis": emphasis,
                    "highlightColor": highlight_color if emphasis else None,
                }
                scene_words.append(word_obj)
                all_words.append({**word_obj, "sceneNumber": sc.get("sceneNumber", idx + 1)})
                w_cursor = w_end

            if scene_words:
                scene_words[-1]["end"] = round(sc_start + sc_duration, 3)
                scene_words[-1]["duration"] = round(scene_words[-1]["end"] - scene_words[-1]["start"], 3)

        aligned_scene = {
            **sc,
            "start": round(sc_start, 2),
            "duration": sc_duration,
            "words": scene_words,
        }
        aligned_scenes.append(aligned_scene)

    return aligned_scenes, all_words
