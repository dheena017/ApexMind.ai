"""
backend/shared/ai/providers/gemini/response_parser.py
Resilient JSON parsing and cleaning utilities for Gemini responses.
"""

import json
import logging
import re
from typing import Any, Dict

logger = logging.getLogger("ApexMind.AI.Parser")


def parse_gemini_json_response(raw_text: str) -> Dict[str, Any]:
    """
    Parses structured JSON from Gemini LLM output with fence removal,
    regex extraction, and whitespace sanitization.
    """
    if not raw_text or not raw_text.strip():
        raise ValueError("Received empty response from Gemini.")

    text = raw_text.strip()

    # 1. Strip markdown code fences if present (```json ... ``` or ``` ...)
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z0-9_-]*\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        text = text.strip()

    # 2. Direct JSON decode attempt
    try:
        return json.loads(text)
    except json.JSONDecodeError as err:
        logger.debug(f"Direct JSON parse failed: {err}. Attempting regex block extraction.")

    # 3. Regex extraction of outermost JSON object { ... }
    json_match = re.search(r"(\{[\s\S]*\})", text)
    if json_match:
        candidate = json_match.group(1).strip()
        try:
            return json.loads(candidate)
        except json.JSONDecodeError as err:
            logger.warning(f"Extracted JSON block decode failed: {err}")

    # 4. Repair trailing commas and unclosed brackets
    cleaned = re.sub(r",\s*([\}\]])", r"\1", text)
    try:
        return json.loads(cleaned)
    except Exception as exc:
        raise ValueError(f"Could not parse valid JSON from Gemini output: {exc}\nRaw Text snippet: {raw_text[:200]}") from exc

