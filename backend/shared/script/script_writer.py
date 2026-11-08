"""
backend/shared/script/script_writer.py
Stage 1A: Core Script Text Writer via Gemini AI.
Focuses strictly on narrative substance, philosophical depth, opening hooks, and closing CTA.
Zero hardcoded fallbacks — strict error reporting on failure.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from backend.shared.ai_models import DEFAULT_SCRIPT_MODEL, resolve_script_model
from .constants import parse_target_seconds

logger = logging.getLogger("ApexMind.Script.Writer")


def write_script(
    category: str,
    topic: str,
    tone: str = "",
    length: str = "30 seconds",
    model: str = DEFAULT_SCRIPT_MODEL,
    user_prompt: Optional[str] = None,
    memory_quotes: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Generates the core spoken text (Title, Hook, Monologue Quote, CTA) via Gemini.
    Returns:
      {
        "title": str,
        "hook": str,
        "quote": str,
        "cta": str,
        "targetDurationSeconds": int,
        "wordCount": int
      }
    """
    from backend.shared.gemini import _generate_script_with_fallback

    target_seconds = parse_target_seconds(length)
    target_words = round(target_seconds * 2.45)
    min_words = round(target_seconds * 2.25)
    max_words = round(target_seconds * 2.65)

    effective_model = resolve_script_model(model)
    user_prompt_clean = (user_prompt or "").strip()

    user_prompt_section = ""
    if user_prompt_clean:
        user_prompt_section = f"""
================================================================================
USER'S SPECIFIC CREATIVE DIRECTION (HIGHEST PRIORITY):
================================================================================
"{user_prompt_clean}"
Mandate: Weave the user's exact instructions, narrative concepts, and metaphors into the script!
"""

    memory_section = ""
    if memory_quotes:
        past_snippets = "\n".join([
            f"- [Title: {q.get('title')}] Quote: {q.get('quote')}"
            for q in memory_quotes[-15:]
        ])
        memory_section = f"""
================================================================================
ZERO-REPETITION QUOTE MEMORY (DO NOT REPEAT):
================================================================================
Avoid repeating or copying any of these past quotes:
{past_snippets}
"""

    prompt = f"""You are an elite Motivational Screenwriter and Virality Strategist for YouTube Shorts and Instagram Reels.
Write an authentic, punchy, high-retention motivational script for a {target_seconds}-second video.
{user_prompt_section}
{memory_section}

THEME: {category or 'General Motivation'}
TOPIC: {topic or 'Relentless Focus and Growth'}
TONE: {tone or 'Focused, stoic, inspiring'}
TARGET DURATION: {target_seconds} SECONDS

WORD COUNT PACING REQUIREMENTS:
- Target Spoken Word Count: EXACTLY {min_words} to {max_words} words total across the monologue.
- Monologue ("quote"): Must have genuine substance and philosophical depth (approx. {target_words - 18} words) to fill {target_seconds} seconds when spoken naturally.
- Opening Hook ("hook"): 4 to 8 words. Pattern-interrupt thumb stopper.
- Call to Action ("cta"): 6 to 12 words. Decisive, crisp closing command.

Output MUST be a single raw JSON object matching this exact schema:
{{
  "title": "A viral Shorts title with punch under 60 chars",
  "hook": "Unforgettable opening hook spoken in the first 2-3 seconds",
  "quote": "Profound, rhythmic motivational monologue containing {min_words - 15} to {max_words - 15} words",
  "cta": "A sharp 1-sentence closing call-to-action"
}}
"""

    result, used_model = _generate_script_with_fallback(
        prompt=prompt,
        target_model=effective_model,
        system_instruction="You are a specialized viral reel screenwriter. Return valid JSON only.",
    )

    if not result or not isinstance(result, dict):
        raise RuntimeError(
            f"Script writing failed: Gemini model '{used_model}' returned empty or invalid data. "
            "Please verify your GEMINI_API_KEY and model quota."
        )

    title = str(result.get("title") or "").strip()
    hook = str(result.get("hook") or "").strip()
    quote = str(result.get("quote") or "").strip()
    cta = str(result.get("cta") or "").strip()

    if not title:
        raise RuntimeError(f"Gemini model '{used_model}' did not generate a valid 'title'.")
    if not quote and not hook:
        raise RuntimeError(f"Gemini model '{used_model}' did not generate script narration ('quote' or 'hook').")

    full_text = f"{hook} {quote} {cta}".strip()
    word_count = len(full_text.split())

    logger.info(f"[Script/Writer] Script crafted: '{title}' ({word_count} words for {target_seconds}s)")

    return {
        "title": title,
        "hook": hook,
        "quote": quote,
        "cta": cta,
        "targetDurationSeconds": target_seconds,
        "wordCount": word_count,
        "usedModel": used_model,
    }

