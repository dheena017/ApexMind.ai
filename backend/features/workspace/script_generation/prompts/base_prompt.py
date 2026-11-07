"""
backend/features/workspace/script_generation/prompts/base_prompt.py
Base prompt assembly utilities and security boundary wrappers.
"""

import re


def sanitize_user_input(text: str | None, max_length: int = 4000) -> str:
    """Sanitize user input to remove control characters and enforce maximum length."""
    if not text:
        return ""
    # Strip non-printable / control characters (preserve basic newlines and tabs)
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", str(text))
    return cleaned.strip()[:max_length]


def format_creative_brief(
    category: str,
    topic: str,
    user_prompt: str | None = None,
    tone: str | None = None,
    length: str = "30 seconds",
    aspect_ratio: str = "9:16",
    visual_style: str | None = None,
    subtitle_style: str | None = None,
    music_mood: str | None = None,
) -> str:
    """Wraps user creative direction inside strict security boundary markers."""
    clean_cat = sanitize_user_input(category, 120) or "General"
    clean_top = sanitize_user_input(topic, 120) or clean_cat
    clean_prompt = sanitize_user_input(user_prompt, 4000)
    clean_tone = sanitize_user_input(tone, 80) or "Cinematic & Engaging"
    clean_style = sanitize_user_input(visual_style, 80) or "dark_cinematic"
    clean_subtitle = sanitize_user_input(subtitle_style, 80) or "hormozi"
    clean_mood = sanitize_user_input(music_mood, 80) or "orchestral"

    return f"""<user_creative_brief>
CATEGORY: {clean_cat}
TOPIC: {clean_top}
CREATIVE_DIRECTION: {clean_prompt or 'None provided. Generate an original, compelling concept for the topic.'}
TONE: {clean_tone}
TARGET_DURATION: {length}
ASPECT_RATIO: {aspect_ratio}
VISUAL_STYLE: {clean_style}
SUBTITLE_STYLE: {clean_subtitle}
MUSIC_MOOD: {clean_mood}
</user_creative_brief>"""

