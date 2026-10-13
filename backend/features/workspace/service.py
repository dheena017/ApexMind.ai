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


def generate_script(category: str, topic: str, tone: str, length: str, model: str = "gemini-2.5-flash") -> Dict[str, Any]:
    memory = fetch_quote_memory(limit=20)
    data = generate_gemini_script(
        category=category,
        topic=topic,
        tone=tone,
        length=length,
        memory_quotes=memory,
        model=model,
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

def synthesize_voiceover(text: str, voice_name: str, model: str = "gemini-2.5-flash-preview-tts") -> Dict[str, Any]:
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

