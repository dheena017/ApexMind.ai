"""
backend/features/youtube/repository.py
SQLite persistence for channels, videos, and automations.
"""

from typing import List, Dict, Any, Optional
from backend.database.repository import (
    get_channels,
    add_channel,
    get_videos,
    publish_video,
    get_automations,
    toggle_automation,
)

def fetch_channels() -> List[Dict[str, Any]]:
    return get_channels()

def create_channel(name: str, handle: str, niche: str) -> Dict[str, Any]:
    return add_channel(name=name, handle=handle, niche=niche)

def fetch_videos() -> List[Dict[str, Any]]:
    return get_videos()

def insert_video(title: str, quote: str, voice: str, category: str, channel_id: Optional[str] = None) -> Dict[str, Any]:
    return publish_video(
        title=title,
        quote=quote,
        voice=voice,
        category=category,
        channel_id=channel_id,
    )

def fetch_automations() -> List[Dict[str, Any]]:
    return get_automations()

def toggle_automation_job(job_id: str) -> List[Dict[str, Any]]:
    return toggle_automation(job_id)
