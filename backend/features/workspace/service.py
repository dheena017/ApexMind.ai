import logging
from typing import Dict, Any
from .repository import fetch_quote_memory, save_quote, delete_all_quotes, fetch_media_library
from backend.shared.gemini import generate_gemini_script, generate_gemini_voiceover

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


def generate_script(category: str, topic: str, tone: str, length: str) -> Dict[str, Any]:
    memory = fetch_quote_memory(limit=20)
    data = generate_gemini_script(
        category=category,
        topic=topic,
        tone=tone,
        length=length,
        memory_quotes=memory,
    )
    if data.get("title") and data.get("quote"):
        save_quote(
            title=data.get("title"),
            hook=data.get("hook", ""),
            quote=data.get("quote"),
            category=category or "General Motivation",
        )
    current_memory = fetch_quote_memory()
    return {
        "success": True,
        "data": data,
        "memoryCount": len(current_memory),
    }

def clear_memory() -> Dict[str, Any]:
    deleted = delete_all_quotes()
    return {"success": True, "message": f"Cleared {deleted} quotes from memory."}

def synthesize_voiceover(text: str, voice_name: str) -> Dict[str, Any]:
    return generate_gemini_voiceover(text=text, voice_name=voice_name)

def get_media_library() -> Dict[str, Any]:
    catalog = fetch_media_library()
    return {"success": True, "data": catalog}

