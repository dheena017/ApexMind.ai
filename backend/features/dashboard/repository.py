"""
backend/features/dashboard/repository.py
SQLite metrics calculations and aggregations for the dashboard.
"""

from typing import Dict, Any
from backend.database.connection import get_connection

def calculate_dashboard_metrics() -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*), COALESCE(SUM(views), 0), COALESCE(SUM(likes), 0) FROM published_videos")
    vid_count, total_views, total_likes = cursor.fetchone()

    cursor.execute("SELECT COUNT(*) FROM youtube_channels WHERE is_oauth_authenticated = 1 OR (refresh_token IS NOT NULL AND refresh_token != '')")
    channel_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM quotes_memory")
    quotes_count = cursor.fetchone()[0]

    cursor.execute("SELECT id, name, handle, subscribers, avatar_url FROM youtube_channels WHERE is_oauth_authenticated = 1 OR (refresh_token IS NOT NULL AND refresh_token != '') ORDER BY connected_at DESC LIMIT 1")
    primary_channel_row = cursor.fetchone()
    primary_channel = dict(primary_channel_row) if primary_channel_row else None

    conn.close()

    return {
        "totalShortsGenerated": vid_count,
        "totalViews": total_views,
        "totalLikes": total_likes,
        "activeChannelsCount": channel_count,
        "totalQuotesGenerated": quotes_count,
        "primaryChannel": primary_channel,
    }
