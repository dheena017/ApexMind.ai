import logging
from typing import Dict, Any, Optional, List
from backend.database.repository import add_notification
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
    name: str,
    handle: str,
    niche: str,
    avatar_url: Optional[str] = None,
    subscribers: Optional[int] = 0,
    videos_uploaded: Optional[int] = 0,
    banner_url: Optional[str] = None,
    auto_resolve: bool = True,
) -> Dict[str, Any]:
    """
    Connects a YouTube channel.
    If auto_resolve is True (the default), attempts to verify with YouTube Data API.
    """
    final_name = name
    final_handle = handle if handle.startswith("@") else f"@{handle}"
    resolved_info = None

    if auto_resolve:
        search_query = handle if handle else name
        resolved = lookup_channel(search_query)
        if resolved.get("verified"):
            resolved_info = resolved
            final_name = resolved.get("name") or final_name
            final_handle = resolved.get("handle") or final_handle
            avatar_url = resolved.get("avatarUrl") or avatar_url
            subscribers = resolved.get("subscribers", subscribers)
            videos_uploaded = resolved.get("videosUploaded", videos_uploaded)
            banner_url = resolved.get("bannerUrl") or banner_url

    channel = create_channel(
        name=final_name,
        handle=final_handle,
        niche=niche,
        avatar_url=avatar_url,
        subscribers=subscribers or 0,
        videos_uploaded=videos_uploaded or 0,
        banner_url=banner_url,
    )
    try:
        add_notification(
            title="YouTube Channel Connected",
            message=f"Connected channel '{final_name}' ({final_handle}) with {subscribers:,} subscribers.",
            type="success",
            category="youtube",
            action_url="/youtube",
        )
    except Exception as e:
        logger.warning(f"Could not dispatch connect channel notification: {e}")

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
    try:
        add_notification(
            title="YouTube Channel Synced",
            message=f"Synced metrics for channel '{result['channel'].get('name', channel_id)}'.",
            type="info",
            category="youtube",
            action_url="/youtube",
        )
    except Exception as e:
        logger.warning(f"Could not dispatch sync channel notification: {e}")

    return {
        "success": True,
        "channel": result["channel"],
        "updated": result["updated"],
        "source": result.get("source", "youtube_api"),
    }


def get_channel_shorts(channel_id: str, limit: int = 15) -> Dict[str, Any]:
    """Fetches YouTube Shorts uploaded to a specific connected channel."""
    channel = fetch_channel_by_id(channel_id)
    if not channel:
        return {
            "success": False,
            "error": f"Channel '{channel_id}' not found",
            "shorts": [],
        }

    shorts = fetch_channel_shorts(channel_id, channel_handle=channel.get("handle"), max_results=limit)
    return {
        "success": True,
        "channel": channel,
        "shorts": shorts,
        "total": len(shorts),
    }


def update_channel(channel_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    updated = update_channel_data(channel_id, data)
    return {
        "success": True,
        "channel": updated,
    }


def disconnect_channel(channel_id: str) -> Dict[str, Any]:
    remove_channel(channel_id)
    return {
        "success": True,
        "channelId": channel_id,
    }


def publish_video_record(video_data: Dict[str, Any]) -> Dict[str, Any]:
    created = insert_video(video_data)
    return {
        "success": True,
        "video": created,
    }


def toggle_automation(job_id: str) -> Dict[str, Any]:
    updated_jobs = toggle_automation_job(job_id)
    job = next((j for j in updated_jobs if j.get("id") == job_id), None)
    status_str = "Enabled" if job and job.get("active") else "Paused"
    try:
        add_notification(
            title="Automation Schedule Updated",
            message=f"Autonomous Shorts scheduler '{job.get('theme', job_id) if job else job_id}' is now {status_str}.",
            type="info",
            category="youtube",
            action_url="/youtube",
        )
    except Exception as e:
        logger.warning(f"Could not dispatch automation notification: {e}")

    return {
        "success": True,
        "automations": updated_jobs,
    }


get_live_channel_shorts = get_channel_shorts
delete_youtube_channel_route = disconnect_channel


def publish_video_to_shorts(title: str, quote: str, voice: str = "Fenrir", category: str = "Motivation", channel_id: Optional[str] = None) -> Dict[str, Any]:
    return publish_video_record({
        "title": title,
        "quote": quote,
        "voice": voice,
        "category": category,
        "channel_id": channel_id,
    })


def list_automations() -> Dict[str, Any]:
    return {
        "success": True,
        "automations": fetch_automations(),
    }

