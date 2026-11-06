import json
import logging
import re
import time
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from .connection import get_connection

logger = logging.getLogger("ApexMind.Database")


def get_channels() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM youtube_channels WHERE is_oauth_authenticated = 1 OR (refresh_token IS NOT NULL AND refresh_token != '') ORDER BY connected_at DESC")
    rows = cursor.fetchall()
    conn.close()
    logger.debug(f"Queried YouTube channels -> Found {len(rows)} connected channel(s)")
    return [
        {
            "id": r["id"],
            "name": r["name"],
            "handle": r["handle"],
            "subscribers": r["subscribers"],
            "videosUploaded": r["videos_uploaded"],
            "avatarUrl": r["avatar_url"],
            "bannerUrl": r["banner_url"] if "banner_url" in r.keys() else None,
            "isAutoUploadEnabled": bool(r["is_auto_upload_enabled"]),
            "scheduleCron": r["schedule_cron"],
            "connectedAt": r["connected_at"],
            "niche": r["niche"],
            "isOAuthAuthenticated": bool(r["is_oauth_authenticated"]) if "is_oauth_authenticated" in r.keys() else False,
            "hasRefreshToken": bool(r["refresh_token"]) if "refresh_token" in r.keys() and r["refresh_token"] else False,
        }
        for r in rows
    ]

def get_channel_by_id(channel_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM youtube_channels WHERE id = ?", (channel_id,))
    r = cursor.fetchone()
    conn.close()
    if not r:
        return None
    return {
        "id": r["id"],
        "name": r["name"],
        "handle": r["handle"],
        "subscribers": r["subscribers"],
        "videosUploaded": r["videos_uploaded"],
        "avatarUrl": r["avatar_url"],
        "bannerUrl": r["banner_url"] if "banner_url" in r.keys() else None,
        "isAutoUploadEnabled": bool(r["is_auto_upload_enabled"]),
        "scheduleCron": r["schedule_cron"],
        "connectedAt": r["connected_at"],
        "niche": r["niche"],
        "isOAuthAuthenticated": bool(r["is_oauth_authenticated"]) if "is_oauth_authenticated" in r.keys() else False,
        "hasRefreshToken": bool(r["refresh_token"]) if "refresh_token" in r.keys() and r["refresh_token"] else False,
    }

def save_channel_oauth(
    channel_id: str,
    name: str,
    handle: str,
    avatar_url: Optional[str],
    subscribers: int,
    refresh_token: str,
    access_token: Optional[str] = None,
    token_expiry: Optional[str] = None,
    videos_uploaded: int = 0,
    user_id: Optional[str] = None,
) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    timestamp = datetime.now(timezone.utc).isoformat()
    clean_handle = handle if handle.startswith("@") else f"@{handle}"

    effective_refresh = (refresh_token or "").strip()
    if not effective_refresh:
        cursor.execute("SELECT refresh_token FROM youtube_channels WHERE id = ? AND refresh_token IS NOT NULL AND refresh_token != ''", (channel_id,))
        existing_row = cursor.fetchone()
        if existing_row and existing_row["refresh_token"]:
            effective_refresh = str(existing_row["refresh_token"]).strip()

    # Multi-channel preservation: only remove the specific channel being re-authenticated
    cursor.execute("DELETE FROM youtube_channels WHERE id = ?", (channel_id,))
    cursor.execute("""
    INSERT INTO youtube_channels (
        id, user_id, name, handle, subscribers, videos_uploaded, avatar_url,
        is_auto_upload_enabled, schedule_cron, connected_at, niche,
        refresh_token, access_token, token_expiry, is_oauth_authenticated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'Daily at 08:00 AM EST', ?, 'Motivational Quotes', ?, ?, ?, 1)
    """, (channel_id, user_id, name, clean_handle, subscribers, videos_uploaded, avatar_url, timestamp, effective_refresh, access_token, token_expiry))

    # Also mirror into universal social_accounts table for omnichannel support
    if user_id:
        cursor.execute("""
        INSERT OR REPLACE INTO social_accounts (
            id, user_id, platform, platform_account_id, name, handle,
            avatar_url, followers_count, posts_count, is_active,
            connected_at, updated_at, access_token, refresh_token, token_expiry
        ) VALUES (?, ?, 'youtube', ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
        """, (
            f"sa_yt_{channel_id}",
            user_id,
            channel_id,
            name,
            clean_handle,
            avatar_url,
            subscribers,
            videos_uploaded,
            timestamp,
            timestamp,
            access_token,
            effective_refresh,
            token_expiry,
        ))

        # Set as active channel if user has none
        cursor.execute("SELECT active_channel_id FROM users WHERE id = ?", (user_id,))
        user_row = cursor.fetchone()
        if user_row and not user_row["active_channel_id"]:
            cursor.execute("UPDATE users SET active_channel_id = ? WHERE id = ?", (channel_id, user_id))

    conn.commit()
    conn.close()
    logger.info(f"Saved OAuth-authorized YouTube channel (multi-channel enabled): '{name}' ({clean_handle}) (ID: {channel_id}, User: {user_id or 'global'})")
    return get_channel_by_id(channel_id) or {}

save_oauth_channel = save_channel_oauth

def update_channel_access_token(channel_id: str, access_token: str, token_expiry: Optional[str] = None) -> None:
    """Updates access token for an OAuth-connected YouTube channel."""
    conn = get_connection()
    cursor = conn.cursor()
    if token_expiry:
        cursor.execute("UPDATE youtube_channels SET access_token = ?, token_expiry = ? WHERE id = ?", (access_token, token_expiry, channel_id))
    else:
        cursor.execute("UPDATE youtube_channels SET access_token = ? WHERE id = ?", (access_token, channel_id))
    conn.commit()
    conn.close()

def get_oauth_channel(user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    import sqlite3
    conn = get_connection()
    cursor = conn.cursor()
    try:
        query = "SELECT * FROM youtube_channels WHERE (is_oauth_authenticated = 1 OR (refresh_token IS NOT NULL AND refresh_token != ''))"
        params: tuple = ()
        if user_id:
            query += " AND user_id = ?"
            params = (user_id,)
        query += " ORDER BY connected_at DESC LIMIT 1"
        cursor.execute(query, params)
        r = cursor.fetchone()
        conn.close()
        if not r:
            return None
        res = dict(r)
        # Normalise to camelCase for the frontend
        res["videosUploaded"] = r["videos_uploaded"]
        res["avatarUrl"]      = r["avatar_url"]
        res["bannerUrl"]      = r["banner_url"] if "banner_url" in r.keys() else None
        handle = r["handle"] or ""
        res["channelUrl"]     = f"https://www.youtube.com/{handle}" if handle else "https://www.youtube.com/@mindsetforge-v3q"
        # Ensure name & handle always present with Mindset Forge as fallback
        res["name"]   = r["name"]   or "Mindset Forge"
        res["handle"] = handle      or "@mindsetforge-v3q"
        return res
    except sqlite3.OperationalError:
        conn.close()
        from backend.database.schema import init_db
        init_db()
        conn = get_connection()
        cursor = conn.cursor()
        query = "SELECT * FROM youtube_channels WHERE (is_oauth_authenticated = 1 OR (refresh_token IS NOT NULL AND refresh_token != ''))"
        params = ()
        if user_id:
            query += " AND user_id = ?"
            params = (user_id,)
        query += " ORDER BY connected_at DESC LIMIT 1"
        cursor.execute(query, params)
        r = cursor.fetchone()
        conn.close()
        if not r:
            return None
        res = dict(r)
        res["videosUploaded"] = r["videos_uploaded"]
        res["avatarUrl"]      = r["avatar_url"]
        res["bannerUrl"]      = r["banner_url"] if "banner_url" in r.keys() else None
        handle = r["handle"] or ""
        res["channelUrl"]     = f"https://www.youtube.com/{handle}" if handle else "https://www.youtube.com/@mindsetforge-v3q"
        res["name"]   = r["name"]   or "Mindset Forge"
        res["handle"] = handle      or "@mindsetforge-v3q"
        return res


def disconnect_youtube_channels(user_id: str) -> int:
    """Disconnect only YouTube channels owned by the specified user."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM youtube_channels WHERE user_id = ?", (user_id,))
    deleted = cursor.rowcount
    cursor.execute(
        "DELETE FROM social_accounts WHERE user_id = ? AND platform = 'youtube'",
        (user_id,),
    )
    conn.commit()
    conn.close()
    return deleted

def add_channel(
    name: str,
    handle: str,
    niche: str = "Motivational Quotes",
    avatar_url: Optional[str] = None,
    subscribers: int = 0,
    videos_uploaded: int = 0,
    custom_id: Optional[str] = None,
    banner_url: Optional[str] = None,
) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    ch_id = custom_id or f"ch_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    clean_handle = handle.strip() if handle else f"@{name.lower().replace(' ', '')}"
    if not clean_handle.startswith("@"):
        clean_handle = f"@{clean_handle}"
    avatar = avatar_url or f"https://api.dicebear.com/7.x/initials/svg?seed={name}"
    timestamp = datetime.now(timezone.utc).isoformat()

    # Enforce strictly ONE channel in the system at any given time
    cursor.execute("DELETE FROM youtube_channels")

    # Check if banner_url column exists in table
    cursor.execute("PRAGMA table_info(youtube_channels)")
    existing_cols = {col[1] for col in cursor.fetchall()}

    if "banner_url" in existing_cols:
        cursor.execute("""
        INSERT INTO youtube_channels (id, name, handle, subscribers, videos_uploaded, avatar_url, banner_url, is_auto_upload_enabled, schedule_cron, connected_at, niche)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (ch_id, name, clean_handle, subscribers, videos_uploaded, avatar, banner_url, 1, "Daily at 08:00 AM EST", timestamp, niche or "Motivational Quotes"))
    else:
        cursor.execute("""
        INSERT INTO youtube_channels (id, name, handle, subscribers, videos_uploaded, avatar_url, is_auto_upload_enabled, schedule_cron, connected_at, niche)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (ch_id, name, clean_handle, subscribers, videos_uploaded, avatar, 1, "Daily at 08:00 AM EST", timestamp, niche or "Motivational Quotes"))

    conn.commit()
    conn.close()

    logger.info(f"Registered YouTube channel: '{name}' ({clean_handle}) [Subs: {subscribers}, Videos: {videos_uploaded}] (ID: {ch_id})")

    return {
        "id": ch_id,
        "name": name,
        "handle": clean_handle,
        "subscribers": subscribers,
        "videosUploaded": videos_uploaded,
        "avatarUrl": avatar,
        "bannerUrl": banner_url,
        "isAutoUploadEnabled": True,
        "scheduleCron": "Daily at 08:00 AM EST",
        "connectedAt": timestamp,
        "niche": niche or "Motivational Quotes"
    }

def update_channel(channel_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()

    field_map = {
        "name": "name",
        "handle": "handle",
        "subscribers": "subscribers",
        "videosUploaded": "videos_uploaded",
        "avatarUrl": "avatar_url",
        "bannerUrl": "banner_url",
        "niche": "niche",
        "isAutoUploadEnabled": "is_auto_upload_enabled",
        "scheduleCron": "schedule_cron",
    }

    set_clauses = []
    values = []
    for k, v in updates.items():
        if k in field_map:
            set_clauses.append(f"{field_map[k]} = ?")
            values.append(v)

    if not set_clauses:
        conn.close()
        return get_channel_by_id(channel_id)

    values.append(channel_id)
    query = f"UPDATE youtube_channels SET {', '.join(set_clauses)} WHERE id = ?"
    cursor.execute(query, tuple(values))
    conn.commit()
    conn.close()

    logger.info(f"Updated YouTube channel (ID: {channel_id}) with fields: {list(updates.keys())}")
    return get_channel_by_id(channel_id)

def delete_channel(channel_id: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM youtube_channels WHERE id = ?", (channel_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    logger.info(f"Deleted YouTube channel (ID: {channel_id}): {deleted}")
    return deleted


def get_videos() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM published_videos ORDER BY published_at DESC")
    rows = cursor.fetchall()
    conn.close()
    logger.debug(f"Queried published Shorts catalog -> Found {len(rows)} video(s)")
    result = []
    for r in rows:
        raw_url = r["video_url"] or ""
        is_fake_url = "youtube.com/shorts/" in raw_url and raw_url.rstrip("/").split("/")[-1].isdigit()
        clean_url = "" if is_fake_url else raw_url
        result.append({
            "id": r["id"],
            "title": r["title"],
            "quote": r["quote"],
            "views": r["views"],
            "likes": r["likes"],
            "publishedAt": r["published_at"],
            "status": "draft" if is_fake_url else r["status"],
            "duration": r["duration"],
            "channelId": r["channel_id"],
            "videoUrl": clean_url,
            "category": r["category"],
            "voice": r["voice"],
        })
    return result

def publish_video(
    title: str,
    quote: str,
    voice: str,
    category: str,
    channel_id: Optional[str] = None,
    video_url: Optional[str] = None,
    custom_id: Optional[str] = None,
    views: int = 0,
    likes: int = 0,
    duration: str = "00:30",
    **kwargs,
) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    # Strip broken ANSI formatting codes from title
    clean_title = re.sub(r'(\x1b\[[0-9;]*[a-zA-Z]|[0-9]{1,2}m)', '', str(title)).strip() or "Untitled Short"
    vid_id = custom_id or f"yt_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    timestamp = datetime.now(timezone.utc).isoformat()
    # Do not generate fake 404 YouTube links when video is stored locally in Studio
    final_video_url = video_url if (video_url and not ("youtube.com/shorts/" in video_url and video_url.rstrip("/").split("/")[-1].isdigit())) else ""
    status_label = "published" if final_video_url else "draft"

    target_channel_id = channel_id
    if target_channel_id:
        cursor.execute("SELECT id FROM youtube_channels WHERE id = ?", (target_channel_id,))
        if not cursor.fetchone():
            target_channel_id = None

    if not target_channel_id:
        cursor.execute("SELECT id FROM youtube_channels ORDER BY connected_at DESC LIMIT 1")
        channel_row = cursor.fetchone()
        target_channel_id = channel_row["id"] if channel_row else None

    cursor.execute("""
    INSERT INTO published_videos (id, title, quote, views, likes, published_at, status, duration, channel_id, video_url, category, voice)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (vid_id, clean_title, quote, views, likes, timestamp, status_label, duration, target_channel_id, final_video_url, category, voice))

    # Increment video count on the channel if channel exists
    if target_channel_id:
        cursor.execute("UPDATE youtube_channels SET videos_uploaded = videos_uploaded + 1 WHERE id = ?", (target_channel_id,))

    # Add real notification
    notif_id = f"notif_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    iso_now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
    INSERT INTO notifications (id, title, message, timestamp, read, type, category, action_url, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (notif_id, "Short Published", f"'{clean_title}' was uploaded to YouTube Shorts.", iso_now, 0, "success", "youtube", "/youtube", "high"))

    conn.commit()
    conn.close()

    logger.info(f"Published Short to YouTube: '{clean_title}' [Voice: {voice}, Channel: {target_channel_id}] -> URL: {final_video_url}")

    return {
        "id": vid_id,
        "title": clean_title,
        "quote": quote,
        "views": views,
        "likes": likes,
        "publishedAt": timestamp,
        "status": "published",
        "duration": duration,
        "channelId": target_channel_id or "",
        "videoUrl": final_video_url,
        "category": category,
        "voice": voice,
    }

def add_notification(
    title: str,
    message: str,
    type: str = "info",
    category: str = "system",
    action_url: Optional[str] = None,
    priority: str = "normal",
    notif_id: Optional[str] = None,
) -> Dict[str, Any]:
    nid = notif_id or f"notif_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    iso_now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO notifications (id, title, message, timestamp, read, type, category, action_url, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (nid, title, message, iso_now, 0, type, category, action_url, priority))
    conn.commit()
    conn.close()
    logger.info(f"Created notification [{category}/{type}]: '{title}' ({nid})")
    return {
        "id": nid,
        "title": title,
        "message": message,
        "timestamp": iso_now,
        "read": False,
        "type": type,
        "category": category,
        "action_url": action_url,
        "priority": priority,
    }

def get_notifications(
    category: Optional[str] = None,
    unread_only: bool = False,
    limit: Optional[int] = None,
) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM notifications"
    clauses = []
    params: List[Any] = []

    if category and category.lower() != "all":
        clauses.append("category = ?")
        params.append(category.lower())

    if unread_only:
        clauses.append("read = 0")

    if clauses:
        query += " WHERE " + " AND ".join(clauses)

    query += " ORDER BY timestamp DESC"

    if limit and limit > 0:
        query += " LIMIT ?"
        params.append(limit)

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "id": r["id"],
            "title": r["title"],
            "message": r["message"],
            "timestamp": r["timestamp"],
            "read": bool(r["read"]),
            "type": r["type"],
            "category": r["category"] if "category" in r.keys() and r["category"] else "system",
            "action_url": r["action_url"] if "action_url" in r.keys() else None,
            "priority": r["priority"] if "priority" in r.keys() and r["priority"] else "normal",
        }
        for r in rows
    ]

def get_unread_notification_count(category: Optional[str] = None) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT COUNT(*) FROM notifications WHERE read = 0"
    params: List[Any] = []
    if category and category.lower() != "all":
        query += " AND category = ?"
        params.append(category.lower())
    cursor.execute(query, params)
    row = cursor.fetchone()
    count = row[0] if row else 0
    conn.close()
    return count

def mark_notification_read(notif_id: str, read_state: bool = True) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE notifications SET read = ? WHERE id = ?", (1 if read_state else 0, notif_id))
    count = cursor.rowcount
    conn.commit()
    conn.close()
    logger.info(f"Marked notification '{notif_id}' read={read_state} ({count} updated)")
    return count > 0

def delete_notification(notif_id: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM notifications WHERE id = ?", (notif_id,))
    count = cursor.rowcount
    conn.commit()
    conn.close()
    logger.info(f"Deleted notification '{notif_id}' ({count} deleted)")
    return count > 0

def mark_notifications_read(category: Optional[str] = None) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    if category and category.lower() != "all":
        cursor.execute("UPDATE notifications SET read = 1 WHERE category = ?", (category.lower(),))
    else:
        cursor.execute("UPDATE notifications SET read = 1")
    count = cursor.rowcount
    conn.commit()
    conn.close()
    logger.info(f"Marked notifications as read ({count} updated)")
    return count

def clear_notifications(category: Optional[str] = None) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    if category and category.lower() != "all":
        cursor.execute("DELETE FROM notifications WHERE category = ?", (category.lower(),))
    else:
        cursor.execute("DELETE FROM notifications")
    count = cursor.rowcount
    conn.commit()
    conn.close()
    logger.info(f"Cleared notifications from database ({count} deleted)")
    return count

def get_automations(
    user_id: Optional[str] = None,
    *,
    include_stale_running: bool = False,
    include_all: bool = False,
) -> List[Dict[str, Any]]:
    if not user_id and not include_all:
        return []

    conn = get_connection()
    cursor = conn.cursor()
    if include_all:
        cursor.execute("SELECT * FROM automation_jobs WHERE user_id IS NOT NULL ORDER BY active DESC, next_run ASC")
    else:
        cursor.execute("SELECT * FROM automation_jobs WHERE user_id = ? ORDER BY active DESC, next_run ASC", (user_id,))
    rows = cursor.fetchall()
    conn.close()

    try:
        from backend.features.youtube.automation_service import _RUNNING_JOB_IDS, _JOB_LOCK
        with _JOB_LOCK:
            running_set = set(_RUNNING_JOB_IDS)
    except Exception:
        running_set = set()

    result = []
    for r in rows:
        st = r["last_status"] if "last_status" in r.keys() else "idle"
        # If DB says running, but the backend process is not actually executing it, treat as idle
        if st == "running" and r["id"] not in running_set and not include_stale_running:
            st = "idle"
        result.append({
            "id": r["id"],
            "userId": r["user_id"] if "user_id" in r.keys() else None,
            "theme": r["theme"],
            "schedule": r["schedule"],
            "voice": r["voice"],
            "musicTrack": r["music_track"],
            "active": bool(r["active"]),
            "nextRun": r["next_run"],
            "channelId": r["channel_id"] if "channel_id" in r.keys() else None,
            "privacyStatus": r["privacy_status"] if "privacy_status" in r.keys() else "public",
            "publishTime": r["publish_time"] if "publish_time" in r.keys() else "08:00",
            "lastRun": r["last_run"] if "last_run" in r.keys() else None,
            "lastStatus": st,
            "lastVideoTitle": r["last_video_title"] if "last_video_title" in r.keys() else None,
            "lastVideoUrl": r["last_video_url"] if "last_video_url" in r.keys() else None,
            "lastRunMessage": r["last_run_message"] if "last_run_message" in r.keys() else None,
            "lastIsLive": bool(r["last_is_live"]) if "last_is_live" in r.keys() and r["last_is_live"] is not None else False,
            "aiModel": r["ai_model"] if "ai_model" in r.keys() and r["ai_model"] else "gemini-2.5-flash",
            "aspectRatio": r["aspect_ratio"] if "aspect_ratio" in r.keys() and r["aspect_ratio"] else "9:16",
            "length": r["length"] if "length" in r.keys() and r["length"] else "30 seconds",
        })
    return result

def get_automation_by_id(job_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM automation_jobs WHERE id = ?", (job_id,))
    r = cursor.fetchone()
    conn.close()
    if not r:
        return None
    return {
        "id": r["id"],
        "userId": r["user_id"] if "user_id" in r.keys() else None,
        "theme": r["theme"],
        "schedule": r["schedule"],
        "voice": r["voice"],
        "musicTrack": r["music_track"],
        "active": bool(r["active"]),
        "nextRun": r["next_run"],
        "channelId": r["channel_id"] if "channel_id" in r.keys() else None,
        "privacyStatus": r["privacy_status"] if "privacy_status" in r.keys() else "public",
        "publishTime": r["publish_time"] if "publish_time" in r.keys() else "08:00",
        "lastRun": r["last_run"] if "last_run" in r.keys() else None,
        "lastStatus": r["last_status"] if "last_status" in r.keys() else "idle",
        "lastVideoTitle": r["last_video_title"] if "last_video_title" in r.keys() else None,
        "lastVideoUrl": r["last_video_url"] if "last_video_url" in r.keys() else None,
        "lastRunMessage": r["last_run_message"] if "last_run_message" in r.keys() else None,
        "lastIsLive": bool(r["last_is_live"]) if "last_is_live" in r.keys() and r["last_is_live"] is not None else False,
        "aiModel": r["ai_model"] if "ai_model" in r.keys() and r["ai_model"] else "gemini-2.5-flash",
        "aspectRatio": r["aspect_ratio"] if "aspect_ratio" in r.keys() and r["aspect_ratio"] else "9:16",
        "length": r["length"] if "length" in r.keys() and r["length"] else "30 seconds",
    }

def create_automation_job(
    theme: str,
    schedule: str,
    voice: str = "Fenrir",
    music_track: str = "Epic Cinematic",
    channel_id: Optional[str] = None,
    privacy_status: str = "public",
    publish_time: str = "08:00",
    active: bool = True,
    ai_model: str = "gemini-2.5-flash",
    aspect_ratio: str = "9:16",
    length: str = "30 seconds",
    user_id: Optional[str] = None,
) -> Dict[str, Any]:
    if not user_id:
        raise ValueError("A user ID is required to create an automation job.")

    conn = get_connection()
    cursor = conn.cursor()
    job_id = f"job_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    now_utc = datetime.now(timezone.utc)
    try:
        from backend.features.youtube.automation_service import calculate_next_run_iso
        next_run = calculate_next_run_iso(publish_time=publish_time, schedule=schedule)
    except Exception:
        next_run = (now_utc + timedelta(days=1)).isoformat()

    cursor.execute("""
    INSERT INTO automation_jobs (id, user_id, theme, schedule, voice, music_track, active, next_run, channel_id, privacy_status, publish_time, last_status, ai_model, aspect_ratio, length, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'idle', ?, ?, ?, ?)
    """, (job_id, user_id, theme, schedule, voice, music_track, 1 if active else 0, next_run, channel_id, privacy_status, publish_time, ai_model, aspect_ratio, length, now_utc.isoformat()))
    conn.commit()
    conn.close()
    logger.info(f"Created automation job '{job_id}' (User: '{user_id}', Theme: '{theme}', Schedule: '{schedule}')")
    return get_automation_by_id(job_id) or {"id": job_id, "userId": user_id, "theme": theme}

def delete_automation_job(job_id: str, user_id: Optional[str] = None) -> bool:
    if not user_id:
        return False

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM automation_history WHERE job_id = ? AND EXISTS "
        "(SELECT 1 FROM automation_jobs WHERE id = ? AND user_id = ?)",
        (job_id, job_id, user_id),
    )
    cursor.execute("DELETE FROM automation_jobs WHERE id = ? AND user_id = ?", (job_id, user_id))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    logger.info(f"Deleted automation job '{job_id}' and its history: {deleted}")
    return deleted

def add_automation_history(
    job_id: str,
    status: str,
    video_title: Optional[str] = None,
    video_url: Optional[str] = None,
    youtube_url: Optional[str] = None,
    is_live: bool = False,
    duration_seconds: float = 0.0,
    message: Optional[str] = None,
    project_data: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = None,
) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    effective_user_id = user_id
    if not effective_user_id:
        try:
            cursor.execute("SELECT user_id FROM automation_jobs WHERE id = ?", (job_id,))
            j_row = cursor.fetchone()
            if j_row and "user_id" in j_row.keys():
                effective_user_id = j_row["user_id"]
        except Exception:
            pass

    run_id = f"run_{int(time.time() * 1000)}"
    now_str = datetime.now(timezone.utc).isoformat()
    project_data_json = json.dumps(project_data) if project_data else None
    cursor.execute("""
    INSERT INTO automation_history (id, user_id, job_id, status, video_title, video_url, youtube_url, is_live, duration_seconds, message, executed_at, project_data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        run_id,
        effective_user_id,
        job_id,
        status,
        video_title,
        video_url,
        youtube_url,
        1 if is_live else 0,
        float(duration_seconds),
        message,
        now_str,
        project_data_json,
    ))
    conn.commit()
    conn.close()
    return {
        "id": run_id,
        "userId": effective_user_id,
        "jobId": job_id,
        "status": status,
        "videoTitle": video_title,
        "videoUrl": video_url,
        "youtubeUrl": youtube_url,
        "isLive": is_live,
        "durationSeconds": duration_seconds,
        "message": message,
        "executedAt": now_str,
        "projectData": project_data,
    }

def get_automation_history(job_id: str, limit: int = 50, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    if not user_id:
        return []

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT history.id, history.user_id, history.job_id, history.status, history.video_title, history.video_url, history.youtube_url, history.is_live, history.duration_seconds, history.message, history.executed_at, history.project_data
        FROM automation_history AS history
        JOIN automation_jobs AS job ON job.id = history.job_id
        WHERE history.job_id = ? AND job.user_id = ? AND (history.user_id = ? OR history.user_id IS NULL)
        ORDER BY history.executed_at DESC
        LIMIT ?
        """, (job_id, user_id, user_id, limit))
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        proj_data = None
        if "project_data" in r.keys() and r["project_data"]:
            try:
                proj_data = json.loads(r["project_data"])
            except Exception:
                proj_data = None
        if not proj_data and (r["video_url"] or r["video_title"]):
            proj_data = {
                "title": r["video_title"] or "Autonomous Studio Video",
                "videoUrl": r["video_url"],
                "duration": float(r["duration_seconds"] or 15.0),
            }
        result.append({
            "id": r["id"],
            "userId": r["user_id"] if "user_id" in r.keys() else None,
            "jobId": r["job_id"],
            "status": r["status"],
            "videoTitle": r["video_title"],
            "videoUrl": r["video_url"],
            "youtubeUrl": r["youtube_url"],
            "isLive": bool(r["is_live"]),
            "durationSeconds": float(r["duration_seconds"] or 0),
            "message": r["message"],
            "executedAt": r["executed_at"],
            "projectData": proj_data,
        })
    return result

def clear_automation_history(job_id: str, user_id: Optional[str] = None) -> bool:
    if not user_id:
        return False

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM automation_history WHERE job_id = ? AND EXISTS "
        "(SELECT 1 FROM automation_jobs WHERE id = ? AND user_id = ?)",
        (job_id, job_id, user_id),
    )
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def update_automation_run_state(
    job_id: str,
    last_status: str,
    next_run: Optional[str] = None,
    last_video_title: Optional[str] = None,
    last_video_url: Optional[str] = None,
    last_run_message: Optional[str] = None,
    last_is_live: Optional[bool] = None,
):
    conn = get_connection()
    cursor = conn.cursor()
    now_str = datetime.now(timezone.utc).isoformat()
    
    # Build dynamic update statement based on provided outcome fields
    updates = ["last_run = ?", "last_status = ?"]
    params: List[Any] = [now_str, last_status]
    
    if next_run is not None:
        updates.append("next_run = ?")
        params.append(next_run)
    if last_video_title is not None:
        updates.append("last_video_title = ?")
        params.append(last_video_title)
    if last_video_url is not None:
        updates.append("last_video_url = ?")
        params.append(last_video_url)
    if last_run_message is not None:
        updates.append("last_run_message = ?")
        params.append(last_run_message)
    if last_is_live is not None:
        updates.append("last_is_live = ?")
        params.append(1 if last_is_live else 0)
        
    params.append(job_id)
    sql = f"UPDATE automation_jobs SET {', '.join(updates)} WHERE id = ?"
    cursor.execute(sql, tuple(params))
    conn.commit()
    conn.close()

def toggle_automation(job_id: str, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    if not user_id:
        return []

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT active, publish_time, schedule FROM automation_jobs WHERE id = ? AND user_id = ?",
        (job_id, user_id),
    )
    row = cursor.fetchone()
    if row:
        new_active = 0 if row["active"] == 1 else 1
        if new_active == 1:
            try:
                from backend.features.youtube.automation_service import calculate_next_run_iso
                next_run = calculate_next_run_iso(row["publish_time"], row["schedule"])
            except Exception:
                next_run = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
            cursor.execute(
                "UPDATE automation_jobs SET active = 1, next_run = ?, last_status = 'idle' WHERE id = ? AND user_id = ?",
                (next_run, job_id, user_id),
            )
        else:
            cursor.execute(
                "UPDATE automation_jobs SET active = 0, last_status = 'idle' WHERE id = ? AND user_id = ?",
                (job_id, user_id),
            )
        conn.commit()
    conn.close()
    logger.info(f"Toggled automation job status (Job ID: {job_id})")
    return get_automations(user_id=user_id)

def get_media_library() -> Dict[str, Any]:
    return {
        "musicTracks": [],
        "visualBackdrops": [
            {
                "id": "vb-dark-aurora",
                "name": "Dark Aurora",
                "category": "Cinematic",
                "aspectRatio": "9:16",
                "previewColor": "#0a0a14",
                "textColor": "#ffffff",
                "particleEffect": "subtle-glow",
                "videoUrl": "https://cdn.pixabay.com/video/2020/04/18/36423-411516053_tiny.mp4",
                "imageUrl": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=720&q=80",
            },
            {
                "id": "vb-stoic-grit",
                "name": "Stoic Mist",
                "category": "Atmospheric",
                "aspectRatio": "9:16",
                "previewColor": "#0d0d0d",
                "textColor": "#f3f4f6",
                "particleEffect": "fog-drift",
                "videoUrl": "https://cdn.pixabay.com/video/2021/08/13/84970-588390119_tiny.mp4",
                "imageUrl": "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=720&q=80",
            },
        ],
        "stockVideos": [],
        "textPresets": [],
        "voiceProfiles": [
            {"id": "Kore", "name": "Kore", "gender": "Female", "style": "Clear, Inspiring, Authoritative", "speed": "1.0x"},
            {"id": "Fenrir", "name": "Fenrir", "gender": "Male", "style": "Deep, Powerful, Stoic Leader", "speed": "1.0x"},
            {"id": "Puck", "name": "Puck", "gender": "Male", "style": "Energetic, High-Octane Motivational", "speed": "1.0x"},
            {"id": "Zephyr", "name": "Zephyr", "gender": "Female", "style": "Smooth, Calming Wisdom and Meditation", "speed": "1.0x"},
            {"id": "Charon", "name": "Charon", "gender": "Male", "style": "Grit and Relentless Focus", "speed": "1.0x"},
        ],
        "soundEffects": [],
    }


def upsert_user(
    email: str,
    name: str,
    avatar_url: Optional[str] = None,
    google_id: Optional[str] = None,
    provider: str = "google",
) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    existing = cursor.fetchone()

    timestamp = datetime.now(timezone.utc).isoformat()
    avatar = avatar_url or f"https://api.dicebear.com/7.x/initials/svg?seed={name}"

    if existing:
        user_id = existing["id"]
        cursor.execute("""
        UPDATE users
        SET name = ?, avatar_url = COALESCE(?, avatar_url), google_id = COALESCE(?, google_id),
            last_login_at = ?, provider = ?
        WHERE id = ?
        """, (name, avatar, google_id, timestamp, provider, user_id))
    else:
        user_id = f"usr_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
        cursor.execute("""
        INSERT INTO users (id, email, name, avatar_url, provider, google_id, created_at, last_login_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, email, name, avatar, provider, google_id, timestamp, timestamp))

    conn.commit()
    conn.close()

    logger.info(f"Upserted user profile: '{name}' ({email}) [Provider: {provider}, ID: {user_id}]")
    return {
        "id": user_id,
        "email": email,
        "name": name,
        "avatarUrl": avatar,
        "provider": provider,
        "googleId": google_id,
        "lastLoginAt": timestamp,
    }


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    keys = row.keys()
    return {
        "id": row["id"],
        "email": row["email"],
        "name": row["name"],
        "avatarUrl": row["avatar_url"],
        "provider": row["provider"],
        "googleId": row["google_id"],
        "passwordHash": row["password_hash"] if "password_hash" in keys else None,
        "salt": row["salt"] if "salt" in keys else None,
        "isActive": bool(row["is_active"]) if "is_active" in keys and row["is_active"] is not None else True,
        "activeChannelId": row["active_channel_id"] if "active_channel_id" in keys else None,
        "createdAt": row["created_at"],
        "lastLoginAt": row["last_login_at"],
    }


def create_user_with_password(
    email: str,
    name: str,
    password_hash: str,
    salt: str,
    avatar_url: Optional[str] = None,
) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    timestamp = datetime.now(timezone.utc).isoformat()
    user_id = f"usr_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    avatar = avatar_url or f"https://api.dicebear.com/7.x/initials/svg?seed={name}"

    cursor.execute("""
    INSERT INTO users (id, email, name, avatar_url, provider, password_hash, salt, is_active, created_at, last_login_at)
    VALUES (?, ?, ?, ?, 'email', ?, ?, 1, ?, ?)
    """, (user_id, email.lower().strip(), name.strip(), avatar, password_hash, salt, timestamp, timestamp))
    conn.commit()
    conn.close()
    logger.info(f"Registered new email user: '{name}' ({email}) [ID: {user_id}]")
    return {
        "id": user_id,
        "email": email.lower().strip(),
        "name": name.strip(),
        "avatarUrl": avatar,
        "provider": "email",
        "createdAt": timestamp,
        "lastLoginAt": timestamp,
    }


def set_user_active_channel(user_id: str, channel_id: str) -> None:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET active_channel_id = ? WHERE id = ?", (channel_id, user_id))
    conn.commit()
    conn.close()
    logger.info(f"Updated active channel for user {user_id} -> {channel_id}")


def get_channels_by_user(user_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM youtube_channels
    WHERE user_id = ? AND (is_oauth_authenticated = 1 OR (refresh_token IS NOT NULL AND refresh_token != ''))
    ORDER BY connected_at DESC
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": r["id"],
            "userId": r["user_id"] if "user_id" in r.keys() else None,
            "name": r["name"],
            "handle": r["handle"],
            "subscribers": r["subscribers"],
            "videosUploaded": r["videos_uploaded"],
            "avatarUrl": r["avatar_url"],
            "bannerUrl": r["banner_url"] if "banner_url" in r.keys() else None,
            "isAutoUploadEnabled": bool(r["is_auto_upload_enabled"]),
            "scheduleCron": r["schedule_cron"],
            "connectedAt": r["connected_at"],
            "niche": r["niche"],
            "isOAuthAuthenticated": bool(r["is_oauth_authenticated"]) if "is_oauth_authenticated" in r.keys() else False,
            "hasRefreshToken": bool(r["refresh_token"]) if "refresh_token" in r.keys() and r["refresh_token"] else False,
        }
        for r in rows
    ]


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return {
        "id": row["id"],
        "email": row["email"],
        "name": row["name"],
        "avatarUrl": row["avatar_url"],
        "provider": row["provider"],
        "googleId": row["google_id"],
        "createdAt": row["created_at"],
        "lastLoginAt": row["last_login_at"],
    }


def get_latest_user() -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users ORDER BY last_login_at DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return {
        "id": row["id"],
        "email": row["email"],
        "name": row["name"],
        "avatarUrl": row["avatar_url"],
        "provider": row["provider"],
        "googleId": row["google_id"],
        "createdAt": row["created_at"],
        "lastLoginAt": row["last_login_at"],
    }


def get_community_posts(channel_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS community_posts (
        id TEXT PRIMARY KEY,
        channel_id TEXT,
        author TEXT NOT NULL,
        handle TEXT NOT NULL,
        avatar_url TEXT,
        content TEXT NOT NULL,
        likes INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        published_at TEXT NOT NULL
    )
    """)
    if channel_id:
        cursor.execute("SELECT * FROM community_posts WHERE channel_id = ? ORDER BY published_at DESC", (channel_id,))
    else:
        cursor.execute("SELECT * FROM community_posts ORDER BY published_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": r["id"],
            "channelId": r["channel_id"],
            "author": r["author"],
            "handle": r["handle"],
            "avatarUrl": r["avatar_url"],
            "content": r["content"],
            "likes": r["likes"],
            "comments": r["comments"],
            "publishedAt": r["published_at"],
        }
        for r in rows
    ]


def add_community_post(
    content: str,
    channel_id: Optional[str] = None,
    author: Optional[str] = None,
    handle: Optional[str] = None,
    avatar_url: Optional[str] = None,
) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS community_posts (
        id TEXT PRIMARY KEY,
        channel_id TEXT,
        author TEXT NOT NULL,
        handle TEXT NOT NULL,
        avatar_url TEXT,
        content TEXT NOT NULL,
        likes INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        published_at TEXT NOT NULL
    )
    """)
    post_id = f"cp_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    timestamp = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
    INSERT INTO community_posts (id, channel_id, author, handle, avatar_url, content, likes, comments, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        post_id,
        channel_id,
        author or "Channel Creator",
        handle or "@channel",
        avatar_url,
        content,
        0,
        0,
        timestamp,
    ))
    conn.commit()
    conn.close()
    return {
        "id": post_id,
        "channelId": channel_id,
        "author": author or "Channel Creator",
        "handle": handle or "@channel",
        "avatarUrl": avatar_url,
        "content": content,
        "likes": 0,
        "comments": 0,
        "publishedAt": timestamp,
    }

# =============================================================================
# Website Studio Videos (Website-created videos with cover images)
# =============================================================================

def _resolve_companion_cover(cover_image_url: Optional[str], video_url: Optional[str]) -> str:
    """Resiliently resolve video cover thumbnail to companion _thumb.jpg or high-res backdrop."""
    import urllib.parse
    from pathlib import Path

    if cover_image_url and isinstance(cover_image_url, str):
        trimmed = cover_image_url.strip()
        if trimmed.startswith("http://") or trimmed.startswith("https://"):
            return trimmed
        if trimmed.startswith("/api/videos/") or trimmed.startswith("/api/media/"):
            fname = urllib.parse.unquote(trimmed.split("/")[-1])
            for d in ["backend/data/rendered_shorts", "backend/data/media", "backend/data"]:
                if (Path(d) / fname).exists():
                    return trimmed

    if video_url and isinstance(video_url, str) and video_url.endswith(".mp4"):
        raw_name = urllib.parse.unquote(video_url.split("/")[-1])
        base_stem = raw_name[:-4]
        candidate_thumb = f"{base_stem}_thumb.jpg"
        for d in ["backend/data/rendered_shorts", "backend/data/media", "backend/data"]:
            if (Path(d) / candidate_thumb).exists():
                return f"/api/videos/{candidate_thumb}"

    if cover_image_url and not cover_image_url.startswith("data:"):
        return cover_image_url

    return "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"


def get_website_videos(category: Optional[str] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM website_videos WHERE 1=1"
    params: List[Any] = []

    if category and category.lower() != 'all':
        query += " AND LOWER(category) LIKE ?"
        params.append(f"%{category.lower()}%")

    if search and search.strip():
        query += " AND (LOWER(title) LIKE ? OR LOWER(quote) LIKE ? OR LOWER(voice) LIKE ?)"
        s = f"%{search.strip().lower()}%"
        params.extend([s, s, s])

    query += " ORDER BY created_at DESC"
    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    conn.close()

    result: List[Dict[str, Any]] = []
    for r in rows:
        resolved_cover = _resolve_companion_cover(r["cover_image_url"], r["video_url"])
        result.append({
            "id": r["id"],
            "title": r["title"],
            "quote": r["quote"],
            "hook": r["hook"] or "",
            "cta": r["cta"] or "",
            "category": r["category"],
            "coverImageUrl": resolved_cover,
            "videoUrl": r["video_url"] or "",
            "audioUrl": r["audio_url"] or "",
            "voice": r["voice"],
            "aspectRatio": r["aspect_ratio"] or "9:16",
            "duration": r["duration"] or "00:30",
            "visualTheme": r["visual_theme"] or "v1",
            "subtitles": r["subtitles"] or "[]",
            "tags": r["tags"] or "[]",
            "status": r["status"] or "ready",
            "createdAt": r["created_at"],
        })
    logger.debug(f"Queried website studio videos -> Found {len(result)} video(s)")
    return result


def get_website_video_by_id(video_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM website_videos WHERE id = ?", (video_id,))
    r = cursor.fetchone()
    conn.close()
    if not r:
        return None
    resolved_cover = _resolve_companion_cover(r["cover_image_url"], r["video_url"])
    return {
        "id": r["id"],
        "title": r["title"],
        "quote": r["quote"],
        "hook": r["hook"] or "",
        "cta": r["cta"] or "",
        "category": r["category"],
        "coverImageUrl": resolved_cover,
        "videoUrl": r["video_url"] or "",
        "audioUrl": r["audio_url"] or "",
        "voice": r["voice"],
        "aspectRatio": r["aspect_ratio"] or "9:16",
        "duration": r["duration"] or "00:30",
        "visualTheme": r["visual_theme"] or "v1",
        "subtitles": r["subtitles"] or "[]",
        "tags": r["tags"] or "[]",
        "status": r["status"] or "ready",
        "createdAt": r["created_at"],
    }


def add_website_video(data: Dict[str, Any]) -> Dict[str, Any]:
    vid_id = data.get("id") or f"vid_web_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    timestamp = data.get("createdAt") or datetime.now(timezone.utc).isoformat()
    subtitles_raw = data.get("subtitles")
    subtitles_str = json.dumps(subtitles_raw) if isinstance(subtitles_raw, list) else (subtitles_raw or "[]")
    tags_raw = data.get("tags")
    tags_str = json.dumps(tags_raw) if isinstance(tags_raw, list) else (tags_raw or "[]")

    audio_raw = data.get("audioUrl", "") or ""
    if isinstance(audio_raw, str) and audio_raw.startswith("data:audio"):
        try:
            import base64
            from pathlib import Path
            audio_dir = Path("backend/data/audio")
            audio_dir.mkdir(parents=True, exist_ok=True)
            parts = audio_raw.split(",", 1)
            if len(parts) == 2:
                audio_bytes = base64.b64decode(parts[1])
                audio_file = audio_dir / f"{vid_id}.wav"
                with open(audio_file, "wb") as f:
                    f.write(audio_bytes)
                audio_raw = f"/api/audio/{vid_id}.wav"
        except Exception as e:
            logger.warning(f"Could not write audio file: {e}")
    cover_raw = data.get("coverImageUrl", "") or ""
    if isinstance(cover_raw, str) and cover_raw.startswith("data:image"):
        try:
            import base64
            from pathlib import Path
            img_dir = Path("backend/data/media")
            img_dir.mkdir(parents=True, exist_ok=True)
            parts = cover_raw.split(",", 1)
            if len(parts) == 2:
                img_bytes = base64.b64decode(parts[1])
                img_file = img_dir / f"cover_{vid_id}.jpg"
                with open(img_file, "wb") as f:
                    f.write(img_bytes)
                cover_raw = f"/api/media/cover_{vid_id}.jpg"
        except Exception as e:
            logger.warning(f"Could not write cover image file: {e}")

    cover_img = cover_raw or ""

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO website_videos (
        id, title, quote, hook, cta, category, cover_image_url, video_url, audio_url,
        voice, aspect_ratio, duration, visual_theme, subtitles, tags, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        vid_id,
        data.get("title", "Untitled AI Short"),
        data.get("quote", ""),
        data.get("hook", ""),
        data.get("cta", ""),
        data.get("category", "Stoic Mindset & Discipline"),
        cover_img,
        data.get("videoUrl", ""),
        audio_raw,
        data.get("voice", "Fenrir"),
        data.get("aspectRatio", "9:16"),
        data.get("duration", "00:30"),
        data.get("visualTheme", "v1"),
        subtitles_str,
        tags_str,
        data.get("status", "ready"),
        timestamp,
    ))

    # Add notification that a website video was created
    try:
        notif_id = f"notif_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
        iso_now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute("""
        INSERT INTO notifications (id, title, message, timestamp, read, type, category, action_url, priority)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            notif_id,
            "Website Video Created",
            f"'{data.get('title', 'Untitled Short')}' is ready in your Video Library.",
            iso_now,
            0,
            "success",
            "studio",
            "/videos",
            "normal"
        ))
    except Exception as e:
        logger.warning(f"Could not create notification for website video: {e}")

    conn.commit()
    conn.close()

    logger.info(f"Added website video: '{data.get('title')}' (ID: {vid_id})")
    return {
        "id": vid_id,
        "title": data.get("title", "Untitled AI Short"),
        "quote": data.get("quote", ""),
        "hook": data.get("hook", ""),
        "cta": data.get("cta", ""),
        "category": data.get("category", "Stoic Mindset & Discipline"),
        "coverImageUrl": cover_img,
        "videoUrl": data.get("videoUrl", ""),
        "audioUrl": data.get("audioUrl", ""),
        "voice": data.get("voice", "Fenrir"),
        "aspectRatio": data.get("aspectRatio", "9:16"),
        "duration": data.get("duration", "00:30"),
        "visualTheme": data.get("visualTheme", "v1"),
        "subtitles": subtitles_str,
        "tags": tags_str,
        "status": data.get("status", "ready"),
        "createdAt": timestamp,
    }


def delete_website_video(video_id: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM website_videos WHERE id = ?", (video_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    logger.info(f"Deleted website video {video_id}: {deleted}")
    return deleted


def update_website_video(video_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    allowed_fields = {
        "title": "title",
        "quote": "quote",
        "hook": "hook",
        "cta": "cta",
        "category": "category",
        "coverImageUrl": "cover_image_url",
        "videoUrl": "video_url",
        "audioUrl": "audio_url",
        "voice": "voice",
        "aspectRatio": "aspect_ratio",
        "duration": "duration",
        "visualTheme": "visual_theme",
        "status": "status",
    }
    set_clauses = []
    params = []
    for k, v in updates.items():
        if k in allowed_fields:
            set_clauses.append(f"{allowed_fields[k]} = ?")
            params.append(v)
    if not set_clauses:
        conn.close()
        return get_website_video_by_id(video_id)
    params.append(video_id)
    sql = f"UPDATE website_videos SET {', '.join(set_clauses)} WHERE id = ?"
    cursor.execute(sql, tuple(params))
    conn.commit()
    conn.close()
    return get_website_video_by_id(video_id)








# =============================================================================
# Omnichannel Social Accounts & Published Posts Repository Methods
# =============================================================================

def get_social_accounts(
    user_id: Optional[str] = None,
    platform: Optional[str] = None,
    active_only: bool = True
) -> List[Dict[str, Any]]:
    """Retrieves connected social fleet accounts for a user or across all users."""
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM social_accounts WHERE 1=1"
    params = []

    if user_id:
        query += " AND user_id = ?"
        params.append(user_id)
    if platform:
        query += " AND platform = ?"
        params.append(platform)
    if active_only:
        query += " AND is_active = 1"

    query += " ORDER BY connected_at DESC"
    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    conn.close()

    accounts = []
    for r in rows:
        metadata_val = None
        if "metadata" in r.keys() and r["metadata"]:
            try:
                metadata_val = json.loads(r["metadata"])
            except Exception:
                metadata_val = r["metadata"]

        accounts.append({
            "id": r["id"],
            "userId": r["user_id"],
            "platform": r["platform"],
            "platformAccountId": r["platform_account_id"],
            "name": r["name"],
            "handle": r["handle"],
            "avatarUrl": r["avatar_url"],
            "bannerUrl": r["banner_url"] if "banner_url" in r.keys() else None,
            "followersCount": r["followers_count"],
            "postsCount": r["posts_count"],
            "isActive": bool(r["is_active"]),
            "isAutoUploadEnabled": bool(r["is_auto_upload_enabled"]),
            "scheduleCron": r["schedule_cron"],
            "niche": r["niche"],
            "connectedAt": r["connected_at"],
            "updatedAt": r["updated_at"],
            "hasAccessToken": bool(r["access_token"]),
            "hasRefreshToken": bool(r["refresh_token"]),
            "tokenExpiry": r["token_expiry"],
            "metadata": metadata_val,
        })
    return accounts


def get_social_account_by_id(account_id: str) -> Optional[Dict[str, Any]]:
    """Fetches a single social account by internal ID."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM social_accounts WHERE id = ?", (account_id,))
    r = cursor.fetchone()
    conn.close()
    if not r:
        return None

    metadata_val = None
    if "metadata" in r.keys() and r["metadata"]:
        try:
            metadata_val = json.loads(r["metadata"])
        except Exception:
            metadata_val = r["metadata"]

    return {
        "id": r["id"],
        "userId": r["user_id"],
        "platform": r["platform"],
        "platformAccountId": r["platform_account_id"],
        "name": r["name"],
        "handle": r["handle"],
        "avatarUrl": r["avatar_url"],
        "bannerUrl": r["banner_url"] if "banner_url" in r.keys() else None,
        "followersCount": r["followers_count"],
        "postsCount": r["posts_count"],
        "isActive": bool(r["is_active"]),
        "isAutoUploadEnabled": bool(r["is_auto_upload_enabled"]),
        "scheduleCron": r["schedule_cron"],
        "niche": r["niche"],
        "connectedAt": r["connected_at"],
        "updatedAt": r["updated_at"],
        "accessToken": r["access_token"],
        "refreshToken": r["refresh_token"],
        "tokenExpiry": r["token_expiry"],
        "tokenSecret": r["token_secret"] if "token_secret" in r.keys() else None,
        "metadata": metadata_val,
    }


def upsert_social_account(
    user_id: str,
    platform: str,
    platform_account_id: str,
    name: str,
    handle: str,
    avatar_url: Optional[str] = None,
    banner_url: Optional[str] = None,
    followers_count: int = 0,
    posts_count: int = 0,
    access_token: Optional[str] = None,
    refresh_token: Optional[str] = None,
    token_expiry: Optional[str] = None,
    token_secret: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    niche: str = "Motivation",
    schedule_cron: str = "Daily at 08:00 AM EST",
    account_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Inserts or updates a connected platform channel/page in the social fleet."""
    conn = get_connection()
    cursor = conn.cursor()
    timestamp = datetime.now(timezone.utc).isoformat()
    meta_json = json.dumps(metadata) if metadata else None

    # Check for existing account by platform and platform_account_id or given ID
    existing = None
    if account_id:
        cursor.execute("SELECT id FROM social_accounts WHERE id = ?", (account_id,))
        existing = cursor.fetchone()
    if not existing:
        cursor.execute(
            "SELECT id FROM social_accounts WHERE user_id = ? AND platform = ? AND platform_account_id = ?",
            (user_id, platform, platform_account_id)
        )
        existing = cursor.fetchone()

    target_id = existing["id"] if existing else (account_id or f"acc_{platform[:2]}_{int(datetime.now(timezone.utc).timestamp() * 1000)}")

    cursor.execute("""
    INSERT OR REPLACE INTO social_accounts (
        id, user_id, platform, platform_account_id, name, handle,
        avatar_url, banner_url, followers_count, posts_count, is_active,
        is_auto_upload_enabled, schedule_cron, niche, access_token,
        refresh_token, token_expiry, token_secret, connected_at, updated_at, metadata
    ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, 1,
        1, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
    )
    """, (
        target_id, user_id, platform, platform_account_id, name, handle,
        avatar_url, banner_url, followers_count, posts_count,
        schedule_cron, niche, access_token,
        refresh_token, token_expiry, token_secret, timestamp, timestamp, meta_json
    ))

    conn.commit()
    conn.close()
    logger.info(f"Upserted {platform.upper()} social account: '{name}' ({handle}) [ID: {target_id}]")
    return get_social_account_by_id(target_id) or {}


def delete_social_account(account_id: str, user_id: Optional[str] = None) -> bool:
    """Disconnects a social account and removes its legacy YouTube mirror."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT platform, platform_account_id, user_id FROM social_accounts WHERE id = ?", (account_id,))
    account = cursor.fetchone()
    if not account:
        conn.close()
        return False

    if user_id:
        cursor.execute("DELETE FROM social_accounts WHERE id = ? AND user_id = ?", (account_id, user_id))
    else:
        cursor.execute("DELETE FROM social_accounts WHERE id = ?", (account_id,))
    deleted = cursor.rowcount > 0

    if deleted and account["platform"] == "youtube":
        cursor.execute(
            "DELETE FROM youtube_channels WHERE id = ? AND (user_id = ? OR user_id IS NULL)",
            (account["platform_account_id"], account["user_id"]),
        )

    conn.commit()
    conn.close()
    logger.info(f"Deleted social account {account_id}: {deleted}")
    return deleted


def record_published_post(
    user_id: str,
    social_account_id: str,
    platform: str,
    title: str,
    caption: Optional[str] = None,
    video_id_or_url: Optional[str] = None,
    status: str = "published",
    error_message: Optional[str] = None,
    views: int = 0,
    likes: int = 0,
    comments_count: int = 0,
) -> Dict[str, Any]:
    """Records an omnichannel publication event in published_posts."""
    conn = get_connection()
    cursor = conn.cursor()
    post_id = f"post_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    timestamp = datetime.now(timezone.utc).isoformat()

    cursor.execute("""
    INSERT INTO published_posts (
        id, user_id, social_account_id, platform, video_id_or_url,
        title, caption, status, views, likes, comments_count, error_message, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        post_id, user_id, social_account_id, platform, video_id_or_url,
        title, caption, status, views, likes, comments_count, error_message, timestamp
    ))

    # Also update posts_count in social_accounts
    if status == "published":
        cursor.execute("UPDATE social_accounts SET posts_count = posts_count + 1 WHERE id = ?", (social_account_id,))

    conn.commit()
    conn.close()
    logger.info(f"Recorded published post on {platform.upper()} [{post_id}]: '{title}' ({status})")
    return {
        "id": post_id,
        "userId": user_id,
        "socialAccountId": social_account_id,
        "platform": platform,
        "videoIdOrUrl": video_id_or_url,
        "title": title,
        "caption": caption,
        "status": status,
        "views": views,
        "likes": likes,
        "commentsCount": comments_count,
        "errorMessage": error_message,
        "publishedAt": timestamp,
    }


def get_published_posts(
    user_id: Optional[str] = None,
    platform: Optional[str] = None,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """Retrieves multi-platform published posts."""
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM published_posts WHERE 1=1"
    params = []
    if user_id:
        query += " AND user_id = ?"
        params.append(user_id)
    if platform:
        query += " AND platform = ?"
        params.append(platform)
    query += " ORDER BY published_at DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": r["id"],
            "userId": r["user_id"],
            "socialAccountId": r["social_account_id"],
            "platform": r["platform"],
            "videoIdOrUrl": r["video_id_or_url"],
            "title": r["title"],
            "caption": r["caption"],
            "status": r["status"],
            "views": r["views"],
            "likes": r["likes"],
            "commentsCount": r["comments_count"],
            "errorMessage": r["error_message"],
            "publishedAt": r["published_at"],
        }
        for r in rows
    ]
