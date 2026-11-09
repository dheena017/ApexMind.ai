"""
backend/features/workspace/script_ai/providers/metadata.py
Gemini AI Metadata & Viral Content Generator.
Generates high-CTR video titles, SEO descriptions, hashtags, and quotes.
"""

import logging
from typing import Any, Dict, List, Optional

from backend.shared.ai_models import resolve_script_model
from backend.shared.gemini import get_gemini_client
from .gemini import _generate_script_with_fallback

logger = logging.getLogger("ApexMind.Workspace.ScriptAI.Metadata")


class GeminiMetadataProvider:
    name = "gemini_metadata"
    display_name = "Gemini Metadata Engine"

    def is_configured(self) -> bool:
        client = get_gemini_client()
        return client is not None

    def generate_metadata(
        self,
        category: str = "",
        topic: str = "",
        title: str = "",
        hook: str = "",
        quote: str = "",
        cta: str = "",
        full_script: str = "",
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate YouTube metadata with Gemini; fail explicitly if AI generation fails."""
        target_model = resolve_script_model(model)
        clean_cat = (category or "").strip()
        clean_topic = (topic or "").strip()
        clean_hook = (hook or "").strip()
        clean_quote = (quote or "").strip()
        clean_cta = (cta or "").strip()
        clean_title = (title or "").strip()
        clean_script = (full_script or "").strip()

        if clean_script and not clean_quote:
            clean_quote = clean_script[:500]
        if not clean_topic:
            clean_topic = clean_cat or "Stoic Mindset & Discipline"

        if not any((clean_topic, clean_title, clean_hook, clean_quote, clean_script)):
            raise ValueError("Provide a video title, topic, or script before generating metadata.")

        prompt = f"""You are an elite short-form video virality strategist for YouTube Shorts, Instagram Reels, and Facebook Reels.
Generate title variations, an engaging description, and categorized hashtags using only the supplied video details. Do not invent people, quotes, events, or factual claims.

CATEGORY/THEME: {clean_cat or 'Not provided'}
TOPIC: {clean_topic or 'Not provided'}
CURRENT TITLE: {clean_title or 'Not provided'}
OPENING HOOK: {clean_hook or 'Not provided'}
CORE MONOLOGUE: {clean_quote or clean_script[:400] or 'Not provided'}
CALL TO ACTION: {clean_cta or 'Not provided'}

CRITICAL MANDATE:
1. TITLES: Generate exactly 5 high-CTR titles (under 60 characters) with different psychological angles:
   - Curiosity Gap
   - Brutal Truth
   - Direct Challenge
   - Stoic Principle
   - Action Question
2. DESCRIPTION: Write a description grounded in the supplied details. Do not add a CTA or key takeaway that was not provided or supported by them. Include the AI disclosure statement ("🤖 AI Disclosure: This video and audio were created with AI (ApexMind AI Studio).").
3. HASHTAGS: Suggest relevant, categorized hashtags based on the provided video. Do not use generic or unrelated tags to fill a category.

Output strictly a single raw JSON object matching:
{{
  "titles": [
    {{ "title": "Title string under 60 chars", "angle": "Angle Name", "viralityScore": 96 }}
  ],
  "description": "Formatted description string including AI disclosure statement",
  "hashtags": {{
    "trending": ["#Shorts", "#ViralShorts", "#AI", "#AIGenerated"],
    "niche": ["#Stoicism", "#Discipline", "#ApexMindAI"],
    "growth": ["#Motivation", "#Mindset", "#AIVideo"],
    "ai": ["#AI", "#AIGenerated", "#AICreation", "#ApexMindAI"]
  }}
}}
"""

        try:
            raw_res, used_model = _generate_script_with_fallback(
                prompt=prompt,
                target_model=target_model,
                system_instruction="You are a specialized viral YouTube metadata optimizer. Respond strictly in valid JSON.",
            )
            if not isinstance(raw_res, dict):
                raise RuntimeError(f"Gemini did not return metadata: {used_model}")

            raw_titles = raw_res.get("titles")
            if not isinstance(raw_titles, list):
                raise ValueError("Gemini returned metadata without a title list.")
            titles = []
            for item in raw_titles:
                if not isinstance(item, dict) or not isinstance(item.get("title"), str):
                    continue
                score = item.get("viralityScore", 0)
                try:
                    score = max(0, min(100, int(score)))
                except (TypeError, ValueError):
                    score = 0
                titles.append({
                    "title": item["title"].strip(),
                    "angle": item.get("angle", "") if isinstance(item.get("angle"), str) else "",
                    "viralityScore": score,
                })
            titles = [item for item in titles if item["title"]]
            if not titles:
                raise ValueError("Gemini returned no usable title ideas.")

            description = raw_res.get("description")
            if not isinstance(description, str) or not description.strip():
                raise ValueError("Gemini returned no usable description.")
            if "created with ai" not in description.lower() and "ai disclosure" not in description.lower():
                description = f"{description.strip()}\n\n🤖 AI Disclosure: This video and audio were created with AI (ApexMind AI Studio)."

            raw_tags = raw_res.get("hashtags")
            if not isinstance(raw_tags, dict):
                raise ValueError("Gemini returned no categorized hashtags.")

            def clean_tags(key: str) -> List[str]:
                values = raw_tags.get(key, [])
                if not isinstance(values, list):
                    return []
                return list(dict.fromkeys(
                    value.strip() for value in values
                    if isinstance(value, str) and value.strip()
                ))

            hashtags = {
                "trending": clean_tags("trending"),
                "niche": clean_tags("niche"),
                "growth": clean_tags("growth"),
                "ai": clean_tags("ai"),
            }
            all_tags = list(dict.fromkeys(
                tag for group in hashtags.values() for tag in group
            ))

            title_list = [item["title"] for item in titles]
            return {
                "success": True,
                "titles": titles,
                "titleList": title_list,
                "description": description,
                "hashtags": hashtags,
                "allHashtags": all_tags,
                "tags": all_tags,
                "categoryNiche": clean_cat or "Self-Improvement & Philosophy",
            }
        except Exception:
            logger.exception("[ScriptAI/Metadata] Gemini metadata generation failed.")
            raise
