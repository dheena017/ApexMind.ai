import logging
from typing import Dict, Any, Optional
from .repository import (
    fetch_channels,
    create_channel,
    fetch_videos,
    insert_video,
    fetch_automations,
    toggle_automation_job,
)

logger = logging.getLogger("ApexMind.YouTube")


def list_channels_and_videos() -> Dict[str, Any]:
    return {
        "success": True,
        "channels": fetch_channels(),
        "videos": fetch_videos(),
    }

def connect_youtube_channel(name: str, handle: str, niche: str) -> Dict[str, Any]:
    channel = create_channel(name=name, handle=handle, niche=niche)
    return {
        "success": True,
        "channel": channel,
    }

def publish_video_to_shorts(title: str, quote: str, voice: str, category: str, channel_id: Optional[str]) -> Dict[str, Any]:
    video = insert_video(
        title=title,
        quote=quote,
        voice=voice,
        category=category,
        channel_id=channel_id,
    )
    return {
        "success": True,
        "video": video,
    }

def list_automations() -> Dict[str, Any]:
    return {
        "success": True,
        "automations": fetch_automations(),
    }

def toggle_automation(job_id: str) -> Dict[str, Any]:
    return {
        "success": True,
        "automations": toggle_automation_job(job_id),
    }
