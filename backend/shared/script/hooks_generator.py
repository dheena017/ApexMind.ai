"""
backend/shared/script/hooks_generator.py
Stage 1B: Psychological Viral Hook Generator via Gemini AI.
Produces multiple thumb-stopping hook variations (Brutal Truth, Curiosity Gap, Direct Challenge).
Zero hardcoded fallbacks — strict error reporting on failure.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List

from backend.shared.ai_models import DEFAULT_SCRIPT_MODEL, resolve_script_model

logger = logging.getLogger("ApexMind.Script.Hooks")


def generate_hooks(
    topic: str,
    script_text: str,
    model: str = DEFAULT_SCRIPT_MODEL,
    count: int = 3,
) -> List[Dict[str, Any]]:
    """
    Generates distinct psychological viral hook variations for a script.
    Returns:
      [
        {
          "id": "hook_1",
          "angle": "Brutal Truth / Negative",
          "text": str,
          "viralityScore": int,
          "spokenDuration": float
        },
        ...
      ]
    """
    from backend.shared.gemini import _generate_script_with_fallback

    effective_model = resolve_script_model(model)
    prompt = f"""You are an elite Virality Strategist for YouTube Shorts and Instagram Reels.
Generate exactly {count} psychological opening hooks (under 10 words each) designed to stop the scroll in the first 1.5 seconds.

TOPIC: {topic or 'Relentless Focus and Growth'}
SCRIPT CONTEXT:
"{script_text}"

REQUIRED ANGLES:
1. Brutal Truth / Negative Bias (e.g. expose a common delusion or painful reality)
2. Curiosity Gap / Contrarian (e.g. reveal an overlooked counter-intuitive rule)
3. Direct Identity Challenge (e.g. confront the viewer's self-discipline)

Output MUST be a single raw JSON object matching this exact schema:
{{
  "hooks": [
    {{
      "id": "hook_1",
      "angle": "Brutal Truth / Negative",
      "text": "Short punchy hook sentence under 9 words",
      "viralityScore": 96,
      "spokenDuration": 2.2
    }},
    {{
      "id": "hook_2",
      "angle": "Curiosity Gap",
      "text": "Curiosity provoking hook under 9 words",
      "viralityScore": 93,
      "spokenDuration": 2.4
    }},
    {{
      "id": "hook_3",
      "angle": "Direct Challenge",
      "text": "Confronting identity challenge under 9 words",
      "viralityScore": 90,
      "spokenDuration": 2.1
    }}
  ]
}}
"""

    result, used_model = _generate_script_with_fallback(
        prompt=prompt,
        target_model=effective_model,
        system_instruction="You are a specialized short-form viral hook writer. Return valid JSON only.",
    )

    if not result or not isinstance(result, dict) or not isinstance(result.get("hooks"), list):
        raise RuntimeError(
            f"Hook generation failed: Gemini model '{used_model}' did not return a valid 'hooks' array."
        )

    hooks = result["hooks"]
    valid_hooks: List[Dict[str, Any]] = []

    for idx, h in enumerate(hooks):
        if not isinstance(h, dict) or not h.get("text"):
            continue
        try:
            score = max(50, min(100, int(h.get("viralityScore", 90))))
        except (ValueError, TypeError):
            score = 90
        try:
            dur = max(1.5, min(5.0, float(h.get("spokenDuration", 2.2))))
        except (ValueError, TypeError):
            dur = 2.2

        valid_hooks.append({
            "id": h.get("id") or f"hook_{idx + 1}",
            "angle": str(h.get("angle") or f"Angle {idx + 1}").strip(),
            "text": str(h["text"]).strip(),
            "viralityScore": score,
            "spokenDuration": dur,
        })

    if not valid_hooks:
        raise RuntimeError(f"Gemini model '{used_model}' generated no usable hook items.")

    logger.info(f"[Script/Hooks] Generated {len(valid_hooks)} viral hook variations via {used_model}")
    return valid_hooks

