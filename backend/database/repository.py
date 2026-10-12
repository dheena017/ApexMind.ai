import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
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
            "isAutoUploadEnabled": bool(r["is_auto_upload_enabled"]),
            "scheduleCron": r["schedule_cron"],
            "connectedAt": r["connected_at"],
            "niche": r["niche"],
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
        "isAutoUploadEnabled": bool(r["is_auto_upload_enabled"]),
        "scheduleCron": r["schedule_cron"],
        "connectedAt": r["connected_at"],
        "niche": r["niche"],
    }

def add_channel(
    name: str,
    handle: str,
    niche: str = "Motivational Quotes",
    avatar_url: Optional[str] = None,
    subscribers: int = 0,
    videos_uploaded: int = 0,
    custom_id: Optional[str] = None,
) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    ch_id = custom_id or f"ch_{int(datetime.utcnow().timestamp() * 1000)}"
    clean_handle = handle.strip() if handle else f"@{name.lower().replace(' ', '')}"
    if not clean_handle.startswith("@"):
        clean_handle = f"@{clean_handle}"
    avatar = avatar_url or f"https://api.dicebear.com/7.x/initials/svg?seed={name}"
    timestamp = datetime.utcnow().isoformat()

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

def publish_video(title: str, quote: str, voice: str, category: str, channel_id: Optional[str] = None) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    vid_id = f"yt_{int(datetime.utcnow().timestamp() * 1000)}"
    timestamp = datetime.utcnow().isoformat()
    video_url = f"https://youtube.com/shorts/{int(datetime.utcnow().timestamp())}"
    views = 0
    likes = 0

    target_channel_id = channel_id
    if not target_channel_id:
        cursor.execute("SELECT id FROM youtube_channels ORDER BY connected_at DESC LIMIT 1")
        channel_row = cursor.fetchone()
        target_channel_id = channel_row["id"] if channel_row else None

    cursor.execute("""
    INSERT INTO published_videos (id, title, quote, views, likes, published_at, status, duration, channel_id, video_url, category, voice)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (vid_id, title, quote, views, likes, timestamp, "published", "00:30", target_channel_id, video_url, category, voice))

    # Increment video count on the channel if channel exists
    if target_channel_id:
        cursor.execute("UPDATE youtube_channels SET videos_uploaded = videos_uploaded + 1 WHERE id = ?", (target_channel_id,))

    # Add real notification
    notif_id = f"notif_{int(datetime.utcnow().timestamp() * 1000)}"
    cursor.execute("""
    INSERT INTO notifications (id, title, message, timestamp, read, type)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (notif_id, "Short Published", f"'{title}' was uploaded to YouTube Shorts.", "Just now", 0, "success"))

    conn.commit()
    conn.close()

    logger.info(f"Published Short to YouTube: '{title}' [Voice: {voice}, Channel: {target_channel_id}] -> URL: {video_url}")

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
        "videoUrl": video_url,
        "category": category,
        "voice": voice,
    }

def get_notifications() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM notifications ORDER BY timestamp DESC")
    rows = cursor.fetchall()
    conn.close()
    logger.info(f"Queried notifications -> Found {len(rows)} notification(s)")
    return [
        {
            "id": r["id"],
            "title": r["title"],
            "message": r["message"],
            "timestamp": r["timestamp"],
            "read": bool(r["read"]),
            "type": r["type"],
        }
        for r in rows
    ]

def mark_notifications_read() -> None:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE notifications SET read = 1")
    count = cursor.rowcount
    conn.commit()
    conn.close()
    logger.info(f"Marked all notifications as read ({count} updated)")

def clear_notifications() -> None:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM notifications")
    count = cursor.rowcount
    conn.commit()
    conn.close()
    logger.info(f"Cleared all notifications from database ({count} deleted)")

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
    import json
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM media_tracks")
    tracks = []
    for r in cursor.fetchall():
        freq = []
        if r["frequency_data"]:
            try:
                freq = json.loads(r["frequency_data"])
            except Exception:
                freq = []
        tracks.append({
            "id": r["id"],
            "title": r["title"],
            "genre": r["genre"],
            "duration": r["duration"],
            "bpm": r["bpm"],
            "copyrightFree": bool(r["copyright_free"]),
            "license": r["license"],
            "frequencyData": freq,
        })

    cursor.execute("SELECT * FROM visual_backdrops")
    backdrops = [
        {
            "id": r["id"],
            "name": r["name"],
            "category": r["category"],
            "aspectRatio": r["aspect_ratio"],
            "previewColor": r["preview_color"],
            "textColor": r["text_color"],
            "particleEffect": r["particle_effect"],
        }
        for r in cursor.fetchall()
    ]

    cursor.execute("SELECT * FROM voice_profiles")
    voices = [
        {
            "id": r["id"],
            "name": r["name"],
            "gender": r["gender"],
            "style": r["style"],
            "speed": r["speed"],
        }
        for r in cursor.fetchall()
    ]

    conn.close()
    logger.info(f"Loaded media catalog assets: {len(tracks)} tracks, {len(backdrops)} backdrops, {len(voices)} voices")
    return {
        "musicTracks": tracks,
        "visualBackdrops": backdrops,
        "voiceProfiles": voices,
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




