import logging
from typing import Dict, Any, Optional, List
from .repository import (
    fetch_channels,
    fetch_channel_by_id,
    create_channel,
    update_channel_data,
    remove_channel,
    fetch_videos,
    insert_video,
    fetch_automations,
    toggle_automation_job,
)
from .youtube_service import (
    lookup_channel,
    fetch_channel_shorts,
    correct_and_sync_channel,
)

logger = logging.getLogger("ApexMind.YouTube")


def list_channels_and_videos() -> Dict[str, Any]:
    return {
        "success": True,
        "channels": fetch_channels(),
        "videos": fetch_videos(),
    }


def lookup_youtube_channel(query: str) -> Dict[str, Any]:
    """Resolves and verifies channel details live from YouTube."""
    data = lookup_channel(query)
    return {
        "success": True,
        "channel": data,
    }


def connect_youtube_channel(
    name: Optional[str] = None,
    handle: Optional[str] = None,
    niche: Optional[str] = "Motivational Quotes",
    avatar_url: Optional[str] = None,
    subscribers: Optional[int] = 0,
    videos_uploaded: Optional[int] = 0,
    auto_resolve: bool = True,
) -> Dict[str, Any]:
    """
    Connects a YouTube channel.
    If auto_resolve is True and a handle or name is provided, queries live YouTube
    to verify and fill real metrics (subscribers, video count, avatar).
    """
    query = (handle or name or "").strip()
    resolved_info = None

    if auto_resolve and query:
        try:
            resolved_info = lookup_channel(query)
            name = resolved_info.get("name") or name
            handle = resolved_info.get("handle") or handle
            avatar_url = resolved_info.get("avatarUrl") or avatar_url
            subscribers = resolved_info.get("subscribers", subscribers or 0)
            videos_uploaded = resolved_info.get("videosUploaded", videos_uploaded or 0)
            logger.info(f"Verified live YouTube channel details for '{name}' ({handle})")
        except Exception as e:
            logger.warning(f"Could not auto-resolve YouTube live details for '{query}': {e}. Using provided fields.")

    final_name = name or (handle.replace("@", "") if handle else "YouTube Creator")
    final_handle = handle or f"@{final_name.lower().replace(' ', '')}"

    channel = create_channel(
        name=final_name,
        handle=final_handle,
        niche=niche or "Motivational Quotes",
        avatar_url=avatar_url,
        subscribers=subscribers or 0,
        videos_uploaded=videos_uploaded or 0,
    )
    return {
        "success": True,
        "channel": channel,
        "liveVerified": resolved_info is not None,
    }


def sync_or_correct_channel(channel_id: str, new_query: Optional[str] = None) -> Dict[str, Any]:
    """
    Syncs or corrects an existing connected channel with live YouTube stats.
    """
    result = correct_and_sync_channel(channel_id, new_handle_or_query=new_query)
    return {
        "success": True,
        "channel": result["channel"],
        "message": result["message"],
    }


def get_live_channel_shorts(channel_id: str, limit: int = 12) -> Dict[str, Any]:
    """
    Fetches real published YouTube Shorts from the specified channel.
    """
    ch = fetch_channel_by_id(channel_id)
    if not ch:
        # Check if channel_id is already a handle
        handle_to_use = channel_id if channel_id.startswith("@") else f"@{channel_id}"
    else:
        handle_to_use = ch.get("handle") or ch.get("name")

    shorts = fetch_channel_shorts(handle_to_use, limit=limit)
    return {
        "success": True,
        "shorts": shorts,
    }


def delete_youtube_channel_route(channel_id: str) -> Dict[str, Any]:
    deleted = remove_channel(channel_id)
    return {
        "success": deleted,
        "message": f"Channel {channel_id} removed.",
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
