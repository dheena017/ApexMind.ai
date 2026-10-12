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

    cursor.execute("SELECT COUNT(*) FROM youtube_channels")
    channel_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM quotes_memory")
    quotes_count = cursor.fetchone()[0]

    cursor.execute("SELECT id, name, handle, subscribers, avatar_url FROM youtube_channels ORDER BY connected_at DESC LIMIT 1")
    primary_channel_row = cursor.fetchone()
    primary_channel = dict(primary_channel_row) if primary_channel_row else None

    conn.close()

    # Dynamic token usage based on quotes and videos created
    estimated_tokens_used = (quotes_count * 450) + (vid_count * 520)
    monthly_token_quota = 1_000_000

    return {
        "totalShortsGenerated": vid_count,
        "totalViews": total_views,
        "totalLikes": total_likes,
        "activeChannelsCount": channel_count,
        "totalQuotesGenerated": quotes_count,
        "tokensUsed": estimated_tokens_used,
        "tokenQuota": monthly_token_quota,
        "primaryChannel": primary_channel,
    }

