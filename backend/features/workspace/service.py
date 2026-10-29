import logging
from typing import Dict, Any, Optional
from .repository import (
    fetch_quote_memory,
    count_quotes,
    get_quote_categories_breakdown,
    save_quote,
    delete_quote_by_id,
    delete_all_quotes,
    fetch_media_library,
)
from backend.shared.gemini import generate_gemini_script, generate_gemini_voiceover
from backend.database.repository import add_notification

logger = logging.getLogger("ApexMind.Workspace")

def get_memory_list(
    limit: int = 50,
    offset: int = 0,
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort: str = "newest",
) -> Dict[str, Any]:
    quotes = fetch_quote_memory(
        limit=limit,
        offset=offset,
        category=category,
        search=search,
        sort=sort,
    )
    total_saved = count_quotes()
    filtered_count = count_quotes(category=category, search=search)
    categories = get_quote_categories_breakdown()
    recent_themes = list(categories.keys())[:5]

    # Calculate real vocabulary uniqueness score across stored quotes
    if not quotes:
        uniqueness_score = 100
    else:
        all_words = []
        for q in quotes:
            text = f"{q.get('title', '')} {q.get('hook', '')} {q.get('quote', '')}".lower()
            tokens = [w.strip(".,!?:;\"'()[]{}") for w in text.split() if len(w.strip()) > 3]
            all_words.extend(tokens)
        if all_words:
            unique_words = set(all_words)
            uniqueness_score = max(70, min(100, int((len(unique_words) / len(all_words)) * 100)))
        else:
            uniqueness_score = 100

    logger.info(
        f"Loaded {len(quotes)} past quotes (Total: {total_saved}, Filtered: {filtered_count}, Uniqueness: {uniqueness_score}%)"
    )
    return {
        "success": True,
        "totalQuotesSaved": total_saved,
        "filteredCount": filtered_count,
        "uniquenessScore": uniqueness_score,
        "categories": categories,
        "recentThemes": recent_themes,
        "quotes": [q["quote"] for q in quotes if q.get("quote")],
        "memoryStore": quotes,
    }


def add_manual_quote(
    title: str,
    quote: str,
    hook: Optional[str] = None,
    category: Optional[str] = None,
) -> Dict[str, Any]:
    saved = save_quote(
        title=title.strip(),
        hook=(hook or "").strip(),
        quote=quote.strip(),
        category=(category or "Stoic Mindset & Discipline").strip(),
    )
    total_saved = count_quotes()
    logger.info(f"Manually added quote '{title}' to memory store. Total now: {total_saved}")
    return {
        "success": True,
        "message": f"Quote '{title}' registered in uniqueness memory.",
        "quote": saved,
        "totalQuotesSaved": total_saved,
    }


def remove_quote(quote_id: Optional[str] = None) -> Dict[str, Any]:
    if quote_id:
        deleted = delete_quote_by_id(quote_id)
        if not deleted:
            raise ValueError(f"Quote with ID '{quote_id}' not found.")
        total_remaining = count_quotes()
        return {
            "success": True,
            "deletedCount": 1,
            "message": f"Quote '{quote_id}' removed from memory store ({total_remaining} remaining).",
        }
    else:
        deleted = delete_all_quotes()
        return {
            "success": True,
            "deletedCount": deleted,
            "message": f"Cleared {deleted} quotes from memory store.",
        }


def generate_script(
    category: str,
    topic: str,
    tone: str = "",
    length: str = "",
    model: str = "gemini-2.5-flash",
    audio_mood: str | None = None,
    background_style: str | None = None,
    text_style: str | None = None,
    video_style: str | None = None,
    voice_name: str | None = None,
    aspect_ratio: str | None = None,
    music_track: str | None = None,
    caption_style: str | None = None,
    visual_theme: str | None = None,
    motion_style: str | None = None,
    output_format: str | None = None,
    creative_context: dict | None = None,
    available_assets: dict | None = None,
) -> Dict[str, Any]:
    aspect_ratio = aspect_ratio or "9:16"
    logger.debug(f"Crafting AI script & storyboard | Theme: '{category}' | Topic: '{topic}' | Voice: '{voice_name or 'Default'}' | Model: {model}")
    memory = fetch_quote_memory(limit=20)
    merged_assets = dict(available_assets or {})

    data = generate_gemini_script(
        category=category,
        topic=topic,
        tone=tone,
        length=length,
        memory_quotes=memory,
        model=model,
        audio_mood=audio_mood,
        background_style=background_style,
        text_style=text_style,
        video_style=video_style,
        voice_name=voice_name,
        aspect_ratio=aspect_ratio,
        music_track=music_track,
        caption_style=caption_style,
        visual_theme=visual_theme,
        motion_style=motion_style,
        output_format=output_format,
        creative_context=creative_context,
        available_assets=merged_assets,
    )
    if data.get("title") and data.get("quote"):
        save_quote(
            title=data.get("title"),
            hook=data.get("hook", ""),
            quote=data.get("quote"),
            category=category or "General Motivation",
        )
        scenes_count = len(data.get("storyboard") or data.get("scenes") or [])
        logger.debug(f"Generated AI script: '{data.get('title')}' ({scenes_count} scenes, {data.get('estimatedDuration', '30s')})")
        try:
            add_notification(
                title="AI Script Crafted",
                message=f"Generated script: '{data.get('title')}' in {category or 'General Motivation'}",
                type="info",
                category="studio",
                action_url="/workspace",
            )
        except Exception as e:
            logger.warning(f"Could not dispatch script notification: {e}")

    current_memory = fetch_quote_memory()
    return {
        "success": True,
        "data": data,
        "memoryCount": len(current_memory),
    }

def clear_memory(quote_id: Optional[str] = None) -> Dict[str, Any]:
    return remove_quote(quote_id)

def synthesize_voiceover(text: str, voice_name: str | None, model: str | None = None) -> Dict[str, Any]:
    if not voice_name or not str(voice_name).strip():
        raise ValueError("Voice name is required. Please select a workspace voice before generating audio.")
    logger.debug(f"Synthesizing voiceover audio for voice '{voice_name}' | Length: {len(text)} characters | Model: {model or 'gemini'}")
    result = generate_gemini_voiceover(text=text, voice_name=voice_name, model=model)
    dur_display = result.get("durationFormatted") or (f"{result['duration']}s" if result.get("duration") else "0s")
    logger.debug(f"Voiceover audio ready: voice '{voice_name}' | Duration: {dur_display}")
    try:
        add_notification(
            title="Voiceover Synthesized",
            message=f"Voice track rendered using voice '{voice_name}'",
            type="success",
            category="studio",
            action_url="/workspace",
        )
    except Exception as e:
        logger.warning(f"Could not dispatch voiceover notification: {e}")
    return result

def get_media_library() -> Dict[str, Any]:
    catalog = fetch_media_library()
    logger.debug(f"Retrieved media library catalog: {len(catalog.get('audioTracks', []))} tracks | {len(catalog.get('backdrops', []))} backdrops | {len(catalog.get('voices', []))} voice presets")
    return {"success": True, "data": catalog}

