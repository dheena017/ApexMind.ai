import time
import logging
from pathlib import Path
from typing import Dict, Any, List

from backend.database.repository import (
    get_website_videos,
    get_quote_memory,
    get_channels,
    get_notifications,
    get_unread_notification_count,
)
from backend.shared.config import settings

logger = logging.getLogger("ApexMind.features.dashboard")

DASHBOARD_CATEGORIES = [
    "Stoic Mindset & Discipline",
    "Fitness & Iron Will",
    "Deep Focus & Flow",
    "Calm & Resilience",
    "Unstoppable Motivation",
]

DEFAULT_TRENDING_PROMPTS = [
    {
        "id": "tp_1",
        "title": "The Stoic Warrior Protocol",
        "category": "Stoic Mindset & Discipline",
        "hook": "Marcus Aurelius didn't conquer empires by sleeping in. He conquered his morning first.",
        "topic": "Stoic morning discipline and the art of voluntary hardship",
        "estimatedDuration": "30s",
    },
    {
        "id": "tp_2",
        "title": "Iron Will: The 40% Rule",
        "category": "Fitness & Iron Will",
        "hook": "When your brain tells you that you are completely exhausted, you are only at 40% capacity.",
        "topic": "Pushing past physical boundaries with mental grit and relentless repetition",
        "estimatedDuration": "45s",
    },
    {
        "id": "tp_3",
        "title": "Dopamine Detox & Deep Focus",
        "category": "Deep Focus & Flow",
        "hook": "In an age of endless cheap distraction, focus is no longer a skill—it is a superpower.",
        "topic": "Eliminating cheap dopamine spikes to enter uninterrupted 4-hour deep flow",
        "estimatedDuration": "30s",
    },
    {
        "id": "tp_4",
        "title": "The Unshakeable Citadel",
        "category": "Calm & Resilience",
        "hook": "External chaos cannot touch you unless your own perception gives it permission.",
        "topic": "Inner peace through radical emotional detachment and mental composure",
        "estimatedDuration": "35s",
    },
    {
        "id": "tp_5",
        "title": "Quiet Obsession: Win in Silence",
        "category": "Unstoppable Motivation",
        "hook": "Don't announce your goals to the world. Let the results create the thunder.",
        "topic": "Silent execution, relentless work ethic, and devastating consistency",
        "estimatedDuration": "30s",
    },
]

def get_dashboard_summary(server_start_time: float) -> Dict[str, Any]:
    """Compile aggregated data and metrics for the Creator Dashboard."""
    logger.debug("Fetching complete dashboard summary metrics")

    # 1. Fetch website videos
    videos = get_website_videos()
    total_videos = len(videos)
    total_views = sum(v.get("views", 0) for v in videos)
    total_likes = sum(v.get("likes", 0) for v in videos)

    # 2. Fetch scripts memory
    scripts = get_quote_memory(limit=10)
    total_scripts = len(scripts)

    # 3. Channels info
    channels = get_channels()
    connected_channels_count = len(channels)
    active_channel = channels[0] if channels else None

    # 4. Unread notifications & recent feed
    unread_count = get_unread_notification_count()
    recent_notifications = get_notifications(limit=5)

    # 5. Audio synthesis cache
    audio_dir = Path("backend/data/audio")
    cached_audio = len(list(audio_dir.glob("*.wav"))) if audio_dir.exists() else 0

    # 6. Uptime
    uptime_sec = max(0.0, time.time() - server_start_time)
    hours = int(uptime_sec // 3600)
    minutes = int((uptime_sec % 3600) // 60)
    seconds = int(uptime_sec % 60)
    uptime_str = f"{hours}h {minutes}m {seconds}s"

    gemini_ready = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())

    return {
        "success": True,
        "metrics": {
            "totalVideos": total_videos,
            "totalScripts": total_scripts,
            "totalViews": total_views,
            "totalLikes": total_likes,
            "connectedChannelsCount": connected_channels_count,
            "unreadNotificationsCount": unread_count,
        },
        "recentVideos": videos[:6],
        "recentScripts": scripts[:5],
        "activeChannel": active_channel,
        "systemStatus": {
            "database": "connected",
            "geminiAi": "ready" if gemini_ready else "unconfigured",
            "cachedAudioCount": cached_audio,
            "serverUptimeFormatted": uptime_str,
        },
        "categories": DASHBOARD_CATEGORIES,
        "trendingPrompts": DEFAULT_TRENDING_PROMPTS,
        "recentNotifications": recent_notifications,
    }
