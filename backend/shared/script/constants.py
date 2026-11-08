"""
backend/shared/script/constants.py
Production constants, ducking parameters, and duration utilities for script generation.
"""

from __future__ import annotations

import re
from typing import Any

SCRIPT_SYSTEM_INSTRUCTION: str = (
    "You are an elite Autonomous AI Video Director, Virality Strategist, and Master Sound Designer "
    "for viral YouTube Shorts, Instagram Reels, and Facebook Reels. Produce high-retention motivational "
    "and inspirational short video plans with diverse cinematic footage queries "
    "tailored to the theme (nature, urban, technology, fitness, space, luxury, architecture, lifestyle, abstract). "
    "Strictly output only valid JSON matching the exact schema."
)

DEFAULT_DUCKING_CONFIG: dict[str, Any] = {
    "active": True,
    "voiceActiveVolume": 0.18,
    "pauseSwellVolume": 0.72,
    "attackMs": 150,
    "releaseMs": 300,
    "threshold": 0.045,
    "ratio": 4.5,
}

DEFAULT_TONE_MODULATION: dict[str, Any] = {
    "active": True,
    "hook": {"speechRate": 1.05, "tone": "urgent", "emotion": "Fast, urgent delivery"},
    "quote": {"speechRate": 0.90, "tone": "reverent", "emotion": "Slower, heavier cadence"},
    "cta": {"speechRate": 1.00, "tone": "decisive", "emotion": "Firm, decisive pace"},
}

CTA_EXCLUSION_TERMS: set[str] = {
    "subscribe", "follow", "cta", "button", "bell", "comment", "share", "channel", "clipart", "lower third"
}


def parse_target_seconds(length_str: str | None) -> int:
    """Parse target duration in seconds from user selection (e.g. '60 seconds', '60s', '45s', '15s')."""
    if not length_str:
        return 30
    s = str(length_str).lower().strip()
    match = re.search(r"(\d+)", s)
    if match:
        val = int(match.group(1))
        if "min" in s:
            return val * 60
        return val
    return 30

