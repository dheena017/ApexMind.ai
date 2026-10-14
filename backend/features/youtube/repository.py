"""
backend/features/youtube/repository.py
SQLite persistence for channels, videos, and automations.
"""

from typing import List, Dict, Any, Optional
from backend.database.repository import (
    get_channels,
    add_channel,
    get_channel_by_id,
    update_channel,
    delete_channel,
    get_videos,
    publish_video,
    get_automations,
    toggle_automation,
)

def fetch_channels() -> List[Dict[str, Any]]:
    return get_channels()

def fetch_channel_by_id(channel_id: str) -> Optional[Dict[str, Any]]:
    return get_channel_by_id(channel_id)

def create_channel(
    name: str,
    handle: str,
    niche: str,
    avatar_url: Optional[str] = None,
    subscribers: int = 0,
    videos_uploaded: int = 0,
    custom_id: Optional[str] = None,
    banner_url: Optional[str] = None,
) -> Dict[str, Any]:
    return add_channel(
        name=name,
        handle=handle,
        niche=niche,
        avatar_url=avatar_url,
        subscribers=subscribers,
        videos_uploaded=videos_uploaded,
        custom_id=custom_id,
        banner_url=banner_url,
    )

def update_channel_data(channel_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    return update_channel(channel_id, updates)

def remove_channel(channel_id: str) -> bool:
    return delete_channel(channel_id)

def fetch_videos() -> List[Dict[str, Any]]:
    return get_videos()

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

def fetch_automations() -> List[Dict[str, Any]]:
    return get_automations()

def toggle_automation_job(job_id: str) -> List[Dict[str, Any]]:
    return toggle_automation(job_id)

