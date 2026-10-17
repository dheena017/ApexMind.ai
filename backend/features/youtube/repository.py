"""
backend/features/youtube/repository.py
Persistence helpers for YouTube short publications.
"""

from typing import Dict, Any, Optional
from backend.database.repository import publish_video


def insert_video(
    title: Any,
    quote: str = "",
    voice: str = "Fenrir",
    category: str = "Motivation",
    channel_id: Optional[str] = None,
    video_url: Optional[str] = None,
    custom_id: Optional[str] = None,
) -> Dict[str, Any]:
    if isinstance(title, dict):
        return publish_video(
            title=title.get("title", "Untitled Short"),
            quote=title.get("quote", ""),
            voice=title.get("voice", "Fenrir"),
            category=title.get("category", "Motivation"),
            channel_id=title.get("channel_id") or title.get("channelId"),
            video_url=title.get("video_url") or title.get("videoUrl") or video_url,
            custom_id=title.get("custom_id") or title.get("customId") or custom_id,
        )
    return publish_video(
        title=title,
        quote=quote,
        voice=voice,
        category=category,
        channel_id=channel_id,
        video_url=video_url,
        custom_id=custom_id,
    )
