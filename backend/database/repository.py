import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from backend.shared.media_catalog import get_static_media_catalog
from .connection import get_connection

logger = logging.getLogger("ApexMind.Database")

def get_quote_memory(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, title, hook, quote, category, generated_at FROM quotes_memory ORDER BY generated_at DESC LIMIT ?",
        (limit,)
    )
    rows = cursor.fetchall()
    conn.close()
    logger.info(f"Queried quotes memory (limit: {limit}) -> Found {len(rows)} recorded quotes")
    return [dict(r) for r in rows]

def add_quote_to_memory(title: str, hook: str, quote: str, category: str) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    record_id = f"mem_{int(datetime.utcnow().timestamp() * 1000)}"
    timestamp = datetime.utcnow().isoformat()
    cursor.execute("""
    INSERT INTO quotes_memory (id, title, hook, quote, category, generated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (record_id, title, hook, quote, category, timestamp))
    conn.commit()
    conn.close()
    logger.info(f"Saved quote to memory: '{title}' [{category}] (ID: {record_id})")
    return {
        "id": record_id,
        "title": title,
        "hook": hook,
        "quote": quote,
        "category": category,
        "generated_at": timestamp
    }

def clear_quote_memory() -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM quotes_memory")
    deleted = cursor.rowcount
    conn.commit()
    conn.close()
    logger.info(f"Cleared all quotes from memory ({deleted} records removed)")
    return deleted


def get_channels() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM youtube_channels ORDER BY connected_at DESC")
    rows = cursor.fetchall()
    conn.close()
    logger.info(f"Queried YouTube channels -> Found {len(rows)} connected channel(s)")
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
) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    timestamp = datetime.utcnow().isoformat()
    clean_handle = handle if handle.startswith("@") else f"@{handle}"

    cursor.execute("DELETE FROM youtube_channels")
    cursor.execute("""
    INSERT INTO youtube_channels (
        id, name, handle, subscribers, videos_uploaded, avatar_url,
        is_auto_upload_enabled, schedule_cron, connected_at, niche,
        refresh_token, access_token, token_expiry, is_oauth_authenticated
    ) VALUES (?, ?, ?, ?, ?, ?, 1, 'Daily at 08:00 AM EST', ?, 'Motivational Quotes', ?, ?, ?, 1)
    """, (channel_id, name, clean_handle, subscribers, 0, avatar_url, timestamp, refresh_token, access_token, token_expiry))
    conn.commit()
    conn.close()
    logger.info(f"Saved OAuth-authorized YouTube channel: '{name}' ({clean_handle}) (ID: {channel_id})")
    return get_channel_by_id(channel_id) or {}

def get_oauth_channel() -> Optional[Dict[str, Any]]:
    import sqlite3
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM youtube_channels WHERE is_oauth_authenticated = 1 OR (refresh_token IS NOT NULL AND refresh_token != '') ORDER BY connected_at DESC LIMIT 1")
        r = cursor.fetchone()
        conn.close()
        if not r:
            return None
        return dict(r)
    except sqlite3.OperationalError:
        conn.close()
        from backend.database.schema import init_db
        init_db()
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM youtube_channels WHERE is_oauth_authenticated = 1 OR (refresh_token IS NOT NULL AND refresh_token != '') ORDER BY connected_at DESC LIMIT 1")
        r = cursor.fetchone()
        conn.close()
        return dict(r) if r else None

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
    ch_id = custom_id or f"ch_{int(datetime.utcnow().timestamp() * 1000)}"
    clean_handle = handle.strip() if handle else f"@{name.lower().replace(' ', '')}"
    if not clean_handle.startswith("@"):
        clean_handle = f"@{clean_handle}"
    avatar = avatar_url or f"https://api.dicebear.com/7.x/initials/svg?seed={name}"
    timestamp = datetime.utcnow().isoformat()

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
    logger.info(f"Queried published Shorts catalog -> Found {len(rows)} video(s)")
    return [
        {
            "id": r["id"],
            "title": r["title"],
            "quote": r["quote"],
            "views": r["views"],
            "likes": r["likes"],
            "publishedAt": r["published_at"],
            "status": r["status"],
            "duration": r["duration"],
            "channelId": r["channel_id"],
            "videoUrl": r["video_url"],
            "category": r["category"],
            "voice": r["voice"],
        }
        for r in rows
    ]

def publish_video(
    title: str,
    quote: str,
    voice: str,
    category: str,
    channel_id: Optional[str] = None,
    video_url: Optional[str] = None,
    custom_id: Optional[str] = None,
) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    vid_id = custom_id or f"yt_{int(datetime.utcnow().timestamp() * 1000)}"
    timestamp = datetime.utcnow().isoformat()
    final_video_url = video_url or f"https://youtube.com/shorts/{int(datetime.utcnow().timestamp())}"
    views = 0
    likes = 0

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
    """, (vid_id, title, quote, views, likes, timestamp, "published", "00:30", target_channel_id, final_video_url, category, voice))

    # Increment video count on the channel if channel exists
    if target_channel_id:
        cursor.execute("UPDATE youtube_channels SET videos_uploaded = videos_uploaded + 1 WHERE id = ?", (target_channel_id,))

    # Add real notification
    notif_id = f"notif_{int(datetime.utcnow().timestamp() * 1000)}"
    iso_now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
    INSERT INTO notifications (id, title, message, timestamp, read, type, category, action_url, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (notif_id, "Short Published", f"'{title}' was uploaded to YouTube Shorts.", iso_now, 0, "success", "youtube", "/youtube", "high"))

    conn.commit()
    conn.close()

    logger.info(f"Published Short to YouTube: '{title}' [Voice: {voice}, Channel: {target_channel_id}] -> URL: {final_video_url}")

    return {
        "id": vid_id,
        "title": title,
        "quote": quote,
        "views": views,
        "likes": likes,
        "publishedAt": timestamp,
        "status": "published",
        "duration": "00:30",
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
    nid = notif_id or f"notif_{int(datetime.utcnow().timestamp() * 1000)}"
    iso_now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
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

def get_automations() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM automation_jobs")
    rows = cursor.fetchall()
    conn.close()
    logger.info(f"Queried automation schedules -> Found {len(rows)} job(s)")
    return [
        {
            "id": r["id"],
            "theme": r["theme"],
            "schedule": r["schedule"],
            "voice": r["voice"],
            "musicTrack": r["music_track"],
            "active": bool(r["active"]),
            "nextRun": r["next_run"],
        }
        for r in rows
    ]

def toggle_automation(job_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE automation_jobs SET active = CASE WHEN active = 1 THEN 0 ELSE 1 END WHERE id = ?", (job_id,))
    conn.commit()
    conn.close()
    logger.info(f"Toggled automation job status (Job ID: {job_id})")
    return get_automations()

def get_media_library() -> Dict[str, Any]:
    return get_static_media_catalog()


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

    timestamp = datetime.utcnow().isoformat()
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
        user_id = f"usr_{int(datetime.utcnow().timestamp() * 1000)}"
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
    post_id = f"cp_{int(datetime.utcnow().timestamp() * 1000)}"
    timestamp = datetime.utcnow().isoformat()
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
        result.append({
            "id": r["id"],
            "title": r["title"],
            "quote": r["quote"],
            "hook": r["hook"] or "",
            "cta": r["cta"] or "",
            "category": r["category"],
            "coverImageUrl": r["cover_image_url"],
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
    logger.info(f"Queried website studio videos -> Found {len(result)} video(s)")
    return result


def get_website_video_by_id(video_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM website_videos WHERE id = ?", (video_id,))
    r = cursor.fetchone()
    conn.close()
    if not r:
        return None
    return {
        "id": r["id"],
        "title": r["title"],
        "quote": r["quote"],
        "hook": r["hook"] or "",
        "cta": r["cta"] or "",
        "category": r["category"],
        "coverImageUrl": r["cover_image_url"],
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
    vid_id = data.get("id") or f"vid_web_{int(datetime.utcnow().timestamp() * 1000)}"
    timestamp = data.get("createdAt") or datetime.utcnow().isoformat()
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
            logger.warning(f"Could not write voiceover audio file: {e}")

    cover_img = data.get("coverImageUrl") or "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1080&q=85"

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
        notif_id = f"notif_{int(datetime.utcnow().timestamp() * 1000)}"
        iso_now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
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






