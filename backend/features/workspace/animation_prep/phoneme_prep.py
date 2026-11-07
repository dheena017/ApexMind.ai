"""
backend/features/workspace/animation_prep/phoneme_prep.py

Viseme and phoneme track generator from speech word timestamps (Milestone 9).
Maps standard Preston Blair and Oculus LipSync visemes for facial rigs.
"""

from typing import Any, Dict, List

# Basic English vowel/consonant viseme mapping
CHAR_TO_VISEME = {
    "a": "aa", "e": "ee", "i": "ih", "o": "oh", "u": "ou",
    "m": "mbp", "b": "mbp", "p": "mbp",
    "f": "fv", "v": "fv",
    "w": "w", "r": "w",
    "l": "nn", "n": "nn", "d": "nn", "t": "nn",
    "s": "ss", "z": "ss", "c": "ss",
}


def generate_viseme_track_from_words(
    words: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Translates word-level timestamps into timed viseme keyframes.
    """
    visemes: List[Dict[str, Any]] = []

    for w in words:
        text = str(w.get("word", "")).lower().strip(".,!?:;\"'")
        start = float(w.get("start", 0.0))
        end = float(w.get("end", start + 0.3))
        duration = max(0.1, end - start)

        if not text:
            continue

        # Distribute visemes across characters of word
        char_duration = duration / len(text)
        for idx, char in enumerate(text):
            viseme_name = CHAR_TO_VISEME.get(char, "silence")
            if viseme_name != "silence":
                t = round(start + idx * char_duration, 2)
                visemes.append({
                    "time": t,
                    "viseme": viseme_name,
                    "weight": 0.85 if char in "aeiou" else 0.65,
                })

    return visemes

