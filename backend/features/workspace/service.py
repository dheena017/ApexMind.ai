import logging
from typing import Dict, Any
from .repository import fetch_quote_memory, save_quote, delete_all_quotes, fetch_media_library
from backend.shared.gemini import generate_gemini_script, generate_gemini_voiceover
from backend.database.repository import add_notification

logger = logging.getLogger("ApexMind.Workspace")

def get_memory_list(limit: int = 50) -> Dict[str, Any]:
    quotes = fetch_quote_memory(limit=limit)
    logger.info(f"Loaded {len(quotes)} past quotes from workspace memory store.")
    return {
        "success": True,
        "totalQuotesSaved": len(quotes),
        "uniquenessScore": 100,
        "memoryStore": quotes,
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
    memory = fetch_quote_memory(limit=20)
    
    # Dynamically fetch real videos and photos from the internet matching topic and category
    from .open_media_service import fetch_dynamic_internet_media_for_prompt
    dynamic_media = fetch_dynamic_internet_media_for_prompt(
        topic=topic,
        category=category,
        limit_videos=8,
        limit_images=12
    )
    merged_assets = dict(available_assets or {})
    if dynamic_media.get("videos"):
        merged_assets["stockVideos"] = dynamic_media["videos"] + merged_assets.get("stockVideos", [])
    if dynamic_media.get("images"):
        merged_assets["backdrops"] = dynamic_media["images"] + merged_assets.get("backdrops", [])

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

def clear_memory() -> Dict[str, Any]:
    deleted = delete_all_quotes()
    return {"success": True, "message": f"Cleared {deleted} quotes from memory."}

def synthesize_voiceover(text: str, voice_name: str | None, model: str | None = None) -> Dict[str, Any]:
    if not voice_name or not str(voice_name).strip():
        raise ValueError("Voice name is required. Please select a workspace voice before generating audio.")
    result = generate_gemini_voiceover(text=text, voice_name=voice_name, model=model)
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
    return {"success": True, "data": catalog}

