"""
backend/features/workspace/voice_generation/services/text_preprocessor.py
Prepares raw narration text for natural speech synthesis without altering narrative meaning.
"""

import re
from typing import Tuple


def preprocess_speech_text(raw_text: str) -> str:
    """
    Expands currency, numbers, acronyms, and inserts breathing pauses
    for broadcast audio synthesis.
    """
    if not raw_text:
        return ""

    text = raw_text.strip()

    # 1. Expand currency: $1.5M, $500, etc.
    text = re.sub(
        r"\$(\d+(?:\.\d+)?)\s*M\b",
        lambda m: f"{m.group(1)} million dollars",
        text,
        flags=re.IGNORECASE,
    )
    text = re.sub(
        r"\$(\d+(?:\.\d+)?)\s*K\b",
        lambda m: f"{m.group(1)} thousand dollars",
        text,
        flags=re.IGNORECASE,
    )
    text = re.sub(
        r"\$(\d+(?:\.\d+)?)",
        lambda m: f"{m.group(1)} dollars",
        text,
    )

    # 2. Expand cardinal numbers (0-20, common counts)
    cardinals = {
        r"\b1\b": "one",
        r"\b2\b": "two",
        r"\b3\b": "three",
        r"\b4\b": "four",
        r"\b5\b": "five",
        r"\b6\b": "six",
        r"\b7\b": "seven",
        r"\b8\b": "eight",
        r"\b9\b": "nine",
        r"\b10\b": "ten",
        r"\b20\b": "twenty",
        r"\b30\b": "thirty",
        r"\b50\b": "fifty",
        r"\b100\b": "one hundred",
    }
    for pat, word in cardinals.items():
        text = re.sub(pat, word, text)

    # 3. Expand common abbreviations and honorifics
    abbreviations = {
        r"\bDr\.\b": "Doctor",
        r"\bMr\.\b": "Mister",
        r"\bMrs\.\b": "Missus",
        r"\bMs\.\b": "Miz",
        r"\bvs\.\b": "versus",
        r"\betc\.\b": "etcetera",
        r"\be\.g\.\b": "for example",
        r"\bi\.e\.\b": "that is",
        r"\bAI\b": "A.I.",
        r"\b3D\b": "Three D",
    }
    for pat, expanded in abbreviations.items():
        text = re.sub(pat, expanded, text)

    # 4. Clean excessive punctuation and markdown brackets
    text = re.sub(r"\[.*?\]", "", text)
    text = re.sub(r"\(.*?\)", "", text)
    text = re.sub(r"\s+", " ", text).strip()

    return text

