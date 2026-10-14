"""
backend/features/youtube/youtube_live_service.py
Real Google OAuth 2.0 & YouTube Data API v3 Live Upload Engine for ApexMind Studio.

Features:
- Google OAuth 2.0 flow requesting 'https://www.googleapis.com/auth/youtube.upload'
- Token refresh management using client_id and client_secret
- Vertical 9:16 Short video rendering pipeline using moviepy
- Resumable video upload to YouTube Data API v3 (videos.insert)
- Live YouTube Shorts URL generation
"""

import os
import logging
import urllib.parse
import urllib.request
import json
import time
from pathlib import Path
from typing import Dict, Any, Optional, List

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google.auth.transport.requests import Request

from backend.database.repository import (
    save_channel_oauth,
    get_oauth_channel,
    add_notification,
)

logger = logging.getLogger("ApexMind.YouTubeLive")

# Scopes required for YouTube Studio operations
YOUTUBE_SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/userinfo.profile",
]

def get_google_oauth_config() -> Dict[str, str]:
    client_id = os.getenv("GOOGLE_CLIENT_ID") or os.getenv("VITE_GOOGLE_CLIENT_ID") or ""
    client_secret = os.getenv("GOOGLE_SECRET") or ""
    return {
        "client_id": client_id,
        "client_secret": client_secret,
    }


def generate_youtube_auth_url(redirect_uri: str) -> str:
    """Generates the Google OAuth 2.0 Authorization URL requesting youtube.upload."""
    cfg = get_google_oauth_config()
    if not cfg["client_id"]:
        raise ValueError("GOOGLE_CLIENT_ID is not configured in .env")

    params = {
        "client_id": cfg["client_id"],
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(YOUTUBE_SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "include_granted_scopes": "true",
    }
    return f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"


def exchange_code_for_tokens(code: str, redirect_uri: str) -> Dict[str, Any]:
    """Exchanges the authorization code for access & refresh tokens with Google."""
    cfg = get_google_oauth_config()
    token_url = "https://oauth2.googleapis.com/token"

    data = urllib.parse.urlencode({
        "code": code,
        "client_id": cfg["client_id"],
        "client_secret": cfg["client_secret"],
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }).encode("utf-8")

    req = urllib.request.Request(token_url, data=data, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")

    with urllib.request.urlopen(req, timeout=10) as resp:
        if resp.status != 200:
            raise RuntimeError(f"Token exchange failed with status {resp.status}")
        return json.loads(resp.read().decode("utf-8"))


def fetch_authenticated_channel_details(access_token: str) -> Dict[str, Any]:
    """Retrieves live channel details (name, handle, subscribers, avatar) from YouTube Data API."""
    url = "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true"
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {access_token}")

    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        items = data.get("items", [])
        if not items:
            raise ValueError("No YouTube channel found for the authenticated Google account.")
        item = items[0]
        snippet = item.get("snippet", {})
        stats = item.get("statistics", {})

        custom_url = snippet.get("customUrl", "")
        handle = custom_url if custom_url.startswith("@") else f"@{custom_url}" if custom_url else f"@{snippet.get('title', 'channel').lower().replace(' ', '')}"
        thumbnails = snippet.get("thumbnails", {})
        avatar = thumbnails.get("high", {}).get("url") or thumbnails.get("default", {}).get("url")

        return {
            "channel_id": item.get("id"),
            "title": snippet.get("title", "Authorized Channel"),
            "handle": handle,
            "avatar_url": avatar,
            "subscribers": int(stats.get("subscriberCount", 0)),
        }


def handle_oauth_callback(code: str, redirect_uri: str) -> Dict[str, Any]:
    """Completes the OAuth flow, registers the channel in DB, and saves tokens."""
    tokens = exchange_code_for_tokens(code, redirect_uri)
    access_token = tokens.get("access_token")
    refresh_token = tokens.get("refresh_token")
    expires_in = tokens.get("expires_in", 3600)
    token_expiry = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() + expires_in))

    channel_info = fetch_authenticated_channel_details(access_token)
    saved = save_channel_oauth(
        channel_id=channel_info["channel_id"],
        name=channel_info["title"],
        handle=channel_info["handle"],
        avatar_url=channel_info["avatar_url"],
        subscribers=channel_info["subscribers"],
        refresh_token=refresh_token or "",
        access_token=access_token,
        token_expiry=token_expiry,
    )

    try:
        add_notification(
            title="YouTube Channel Authorized Live",
            message=f"Live upload access granted for '{channel_info['title']}' ({channel_info['handle']}).",
            type="success",
            category="youtube",
            action_url="/youtube",
            priority="high",
        )
    except Exception as e:
        logger.warning(f"Could not dispatch authorization notification: {e}")

    return {
        "success": True,
        "channel": saved,
        "liveAuthorized": True,
    }


def get_authenticated_youtube_client() -> Optional[Any]:
    """Builds an authorized YouTube Data API v3 resource using saved OAuth refresh token."""
    ch = get_oauth_channel()
    if not ch or not ch.get("refresh_token"):
        return None

    cfg = get_google_oauth_config()
    creds = Credentials(
        token=ch.get("access_token"),
        refresh_token=ch.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=cfg["client_id"],
        client_secret=cfg["client_secret"],
        scopes=YOUTUBE_SCOPES,
    )

    # Automatically refresh token if expired
    if not creds.valid:
        try:
            creds.refresh(Request())
        except Exception as e:
            logger.error(f"Failed to refresh YouTube OAuth credentials: {e}")
            return None

    return build("youtube", "v3", credentials=creds, cache_discovery=False)


def render_vertical_short(
    title: str,
    quote: str,
    cover_image_url: Optional[str] = None,
    audio_path: Optional[str] = None,
    duration_seconds: int = 15,
) -> str:
    """Renders a vertical 9:16 (1080x1920) MP4 video ready for YouTube Shorts upload."""
    import moviepy.editor as mp
    import urllib.request
    from pathlib import Path

    output_dir = Path("backend/data/rendered_shorts")
    output_dir.mkdir(parents=True, exist_ok=True)
    out_file = output_dir / f"short_{int(time.time() * 1000)}.mp4"

    # 1. Download or use image backdrop
    local_img_path = output_dir / f"bg_{int(time.time() * 1000)}.jpg"
    img_url = cover_image_url or "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1080&q=85"
    try:
        req = urllib.request.Request(img_url, headers={"User-Agent": "ApexMindStudio/2.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            with open(local_img_path, "wb") as f:
                f.write(resp.read())
        clip = mp.ImageClip(str(local_img_path)).set_duration(duration_seconds).resize((1080, 1920))
    except Exception as e:
        logger.warning(f"Could not load custom backdrop ({e}), creating color canvas.")
        clip = mp.ColorClip(size=(1080, 1920), color=(15, 18, 25), duration=duration_seconds)

    # 2. Attach voiceover audio if available
    if audio_path and os.path.exists(audio_path):
        try:
            audio_clip = mp.AudioFileClip(audio_path)
            clip = clip.set_audio(audio_clip)
            clip = clip.set_duration(min(audio_clip.duration, duration_seconds))
        except Exception as e:
            logger.warning(f"Could not attach audio track: {e}")

    # 3. Write video file with H.264 video codec and AAC audio codec
    try:
        clip.write_videofile(
            str(out_file),
            fps=24,
            codec="libx264",
            audio_codec="aac",
            preset="ultrafast",
            threads=2,
            logger=None,
        )
    finally:
        try:
            clip.close()
            if local_img_path.exists():
                local_img_path.unlink()
        except Exception:
            pass

    return str(out_file)


def upload_video_to_live_youtube(
    video_path: str,
    title: str,
    quote: str,
    category: str = "Motivation",
    tags: Optional[List[str]] = None,
    privacy_status: str = "public",
) -> Dict[str, Any]:
    """Uploads an MP4 file directly to YouTube using YouTube Data API v3 (videos.insert)."""
    youtube = get_authenticated_youtube_client()
    if not youtube:
        raise RuntimeError("No Google OAuth authorized YouTube channel found. Please authorize your channel first.")

    # YouTube Shorts optimal title formatting
    clean_title = f"{title[:90]} #Shorts"
    clean_desc = f"{quote}\n\nCreated with ApexMind AI Studio.\n#Shorts #{category.replace(' ', '')}"
    tag_list = tags or ["#Shorts", "#Motivation", "#ApexMind", "#Inspiration"]

    body = {
        "snippet": {
            "title": clean_title,
            "description": clean_desc,
            "tags": tag_list,
            "categoryId": "22", # People & Blogs (or 27 Education)
        },
        "status": {
            "privacyStatus": privacy_status, # "public" or "unlisted"
            "selfDeclaredMadeForKids": False,
        },
    }

    media = MediaFileUpload(
        video_path,
        chunksize=-1,
        resumable=True,
        mimetype="video/mp4",
    )

    request = youtube.videos().insert(
        part="snippet,status",
        body=body,
        media_body=media,
    )

    response = request.execute()
    real_video_id = response.get("id")
    real_shorts_url = f"https://youtube.com/shorts/{real_video_id}"

    logger.info(f"Successfully published live Short to YouTube! ID: {real_video_id} -> {real_shorts_url}")
    return {
        "id": real_video_id,
        "videoUrl": real_shorts_url,
        "title": clean_title,
        "status": "published",
        "liveUploaded": True,
    }
