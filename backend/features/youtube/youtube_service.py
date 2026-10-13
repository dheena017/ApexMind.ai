"""
backend/features/youtube/youtube_service.py
Service for resolving, fetching, verifying, and correcting live YouTube channel
and video data via YouTube Data API v3 or real-time live YouTube resolution.
"""

import os
import re
import json
import logging
from typing import Dict, Any, List, Optional
import requests
from backend.database.repository import (
    get_channel_by_id,
    update_channel,
    add_channel,
)

logger = logging.getLogger("ApexMind.YouTubeService")

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

def parse_count_metric(s: str) -> int:
    """Parses strings like '7.94M subscribers', '250K views', '537 videos' into integers."""
    if not s:
        return 0
    clean = (
        s.lower()
        .replace("subscribers", "")
        .replace("subscriber", "")
        .replace("videos", "")
        .replace("video", "")
        .replace("views", "")
        .replace("view", "")
        .replace(",", "")
        .strip()
    )
    try:
        if "m" in clean:
            return int(float(clean.replace("m", "").strip()) * 1_000_000)
        if "k" in clean:
            return int(float(clean.replace("k", "").strip()) * 1_000)
        m = re.search(r"\d+", clean)
        return int(m.group(0)) if m else 0
    except Exception:
        return 0


def normalize_channel_identifier(query: str) -> str:
    """Normalizes URL, handle, or channel ID into YouTube path query."""
    q = query.strip()
    if not q:
        return "@"

    # Full URLs
    if "youtube.com/" in q:
        parts = q.split("youtube.com/")[-1].strip("/")
        # Might have /shorts or /videos or extra query params
        parts = parts.split("?")[0].split("/")[0]
        return parts

    # Handle without @
    if not q.startswith("@") and not q.startswith("UC"):
        return f"@{q}"

    return q


def resolve_channel_with_api_key(query: str, api_key: str) -> Optional[Dict[str, Any]]:
    """Tries resolving YouTube channel via official YouTube Data API v3 if key is configured."""
    try:
        from googleapiclient.discovery import build
        yt = build("youtube", "v3", developerKey=api_key)

        clean = normalize_channel_identifier(query)
        if clean.startswith("@"):
            res = yt.channels().list(part="snippet,statistics", forHandle=clean[1:]).execute()
        elif clean.startswith("UC"):
            res = yt.channels().list(part="snippet,statistics", id=clean).execute()
        else:
            res = yt.search().list(part="snippet", q=clean, type="channel", maxResults=1).execute()
            items = res.get("items", [])
            if not items:
                return None
            ch_id = items[0]["snippet"]["channelId"]
            res = yt.channels().list(part="snippet,statistics", id=ch_id).execute()

        items = res.get("items", [])
        if not items:
            return None

        item = items[0]
        snippet = item.get("snippet", {})
        stats = item.get("statistics", {})

        subs = int(stats.get("subscriberCount", 0))
        vids = int(stats.get("videoCount", 0))
        handle = snippet.get("customUrl", clean if clean.startswith("@") else f"@{clean}")
        if not handle.startswith("@"):
            handle = f"@{handle}"

        return {
            "channelId": item.get("id"),
            "name": snippet.get("title", clean),
            "handle": handle,
            "avatarUrl": snippet.get("thumbnails", {}).get("high", {}).get("url") or snippet.get("thumbnails", {}).get("default", {}).get("url"),
            "subscribers": subs,
            "videosUploaded": vids,
            "description": snippet.get("description", ""),
            "verified": True,
            "channelUrl": f"https://www.youtube.com/{handle}",
            "source": "youtube-data-api-v3",
        }
    except Exception as e:
        logger.warning(f"YouTube Data API v3 key lookup did not succeed: {e}. Falling back to live resolver.")
        return None


def resolve_channel_live(query: str) -> Dict[str, Any]:
    """
    Live YouTube channel resolver. Scrapes live ytInitialData metadata.
    Extracts high-resolution avatar, real subscriber count, video count, verified status.
    """
    clean = normalize_channel_identifier(query)
    target_url = f"https://www.youtube.com/{clean}" if not clean.startswith("http") else clean

    headers = {"User-Agent": USER_AGENT, "Accept-Language": "en-US,en;q=0.9"}
    resp = requests.get(target_url, headers=headers, timeout=10)
    if resp.status_code != 200:
        raise ValueError(f"YouTube channel '{query}' not found (HTTP {resp.status_code})")

    # Extract ytInitialData json
    match = re.search(r"var ytInitialData = (\{.*?\});</script>", resp.text)
    if not match:
        raise ValueError(f"Could not parse YouTube metadata for '{query}'.")

    data = json.loads(match.group(1))
    header = data.get("header", {})
    phr = header.get("pageHeaderRenderer", {})
    metadata = data.get("metadata", {}).get("channelMetadataRenderer", {})

    name = phr.get("pageTitle") or metadata.get("title") or clean.replace("@", "")

    # Avatar
    avatar_url = ""
    thumbnails = metadata.get("avatar", {}).get("thumbnails", [])
    if thumbnails:
        avatar_url = thumbnails[-1].get("url", "")
    if not avatar_url:
        avatar_url = f"https://api.dicebear.com/7.x/initials/svg?seed={name}"

    # Banner
    banner_url = ""
    banner_vm = phr.get("content", {}).get("pageHeaderViewModel", {}).get("banner", {})
    if not banner_vm:
        banner_vm = header.get("c4TabbedHeaderRenderer", {}).get("banner", {})
    banner_sources = banner_vm.get("imageBannerViewModel", {}).get("image", {}).get("sources", [])
    if banner_sources:
        banner_url = banner_sources[-1].get("url", "")
    elif "thumbnails" in banner_vm:
        banner_url = banner_vm.get("thumbnails", [])[-1].get("url", "")

    # Handle & Channel ID
    channel_url = metadata.get("channelUrl", "")
    channel_id = ""
    if "/channel/" in channel_url:
        channel_id = channel_url.split("/channel/")[-1].split("?")[0]

    # Parse metadata rows from pageHeaderViewModel
    phvm = phr.get("content", {}).get("pageHeaderViewModel", {})
    meta_rows = phvm.get("metadata", {}).get("contentMetadataViewModel", {}).get("metadataRows", [])

    real_handle = clean if clean.startswith("@") else f"@{clean}"
    subscribers = 0
    videos_uploaded = 0

    for row in meta_rows:
        parts = row.get("metadataParts", [])
        for p in parts:
            text_content = p.get("text", {}).get("content", "")
            if text_content.startswith("@"):
                real_handle = text_content
            elif "subscriber" in text_content.lower():
                subscribers = parse_count_metric(text_content)
            elif "video" in text_content.lower():
                videos_uploaded = parse_count_metric(text_content)

    # Verification badge
    badge_found = False
    badge_list = phr.get("content", {}).get("pageHeaderViewModel", {}).get("badgeRows", [])
    if badge_list or "BADGE_STYLE_TYPE_VERIFIED" in resp.text:
        badge_found = True

    description = metadata.get("description", "")

    return {
        "channelId": channel_id or f"yt_{clean.replace('@', '')}",
        "name": name,
        "handle": real_handle,
        "avatarUrl": avatar_url,
        "bannerUrl": banner_url,
        "subscribers": subscribers,
        "videosUploaded": videos_uploaded,
        "description": description[:300] if description else "",
        "verified": badge_found,
        "channelUrl": f"https://www.youtube.com/{real_handle}",
        "source": "youtube-live-resolver",
    }


def lookup_channel(query: str) -> Dict[str, Any]:
    """
    Public lookup function: Checks API key first if configured, else uses live resolver.
    """
    api_key = os.getenv("YOUTUBE_API_KEY")
    if api_key:
        api_res = resolve_channel_with_api_key(query, api_key)
        if api_res:
            return api_res

    return resolve_channel_live(query)


def fetch_channel_shorts(channel_handle_or_query: str, limit: int = 15) -> List[Dict[str, Any]]:
    """
    Fetches latest live YouTube Shorts published on the specified channel.
    """
    clean = normalize_channel_identifier(channel_handle_or_query)
    target_url = f"https://www.youtube.com/{clean}/shorts"

    headers = {"User-Agent": USER_AGENT, "Accept-Language": "en-US,en;q=0.9"}
    try:
        resp = requests.get(target_url, headers=headers, timeout=10)
        if resp.status_code != 200:
            return []

        match = re.search(r"var ytInitialData = (\{.*?\});</script>", resp.text)
        if not match:
            return []

        data = json.loads(match.group(1))
        tabs = data.get("contents", {}).get("twoColumnBrowseResultsRenderer", {}).get("tabs", [])
        tab = next((t for t in tabs if "tabRenderer" in t and t["tabRenderer"].get("selected")), None)
        if not tab:
            return []

        contents = tab.get("tabRenderer", {}).get("content", {}).get("richGridRenderer", {}).get("contents", [])
        shorts_list = []

        for item in contents[:limit]:
            content = item.get("richItemRenderer", {}).get("content", {})
            lockup = content.get("shortsLockupViewModel", {}) or content.get("lockupViewModel", {})
            if not lockup:
                continue
            entity_id = lockup.get("entityId", "") or lockup.get("contentId", "")
            vid_id = entity_id.split("shorts-shelf-item-")[-1]

            title = "YouTube Short"
            views_text = "1 view"
            overlay = lockup.get("overlayMetadata", {})
            if overlay:
                title = overlay.get("primaryText", {}).get("content", title)
                views_text = overlay.get("secondaryText", {}).get("content", views_text)
            else:
                meta = lockup.get("metadata", {}).get("lockupMetadataViewModel", {})
                title = meta.get("title", {}).get("content", title)

            thumb_vm = lockup.get("thumbnail", {}) or lockup.get("contentImage", {}).get("thumbnailViewModel", {})
            sources = thumb_vm.get("sources", []) or thumb_vm.get("image", {}).get("sources", [])
            thumb = sources[-1].get("url") if sources else f"https://i.ytimg.com/vi/{vid_id}/hqdefault.jpg"

            shorts_list.append({
                "id": vid_id,
                "title": title,
                "views": views_text,
                "thumbnailUrl": thumb,
                "videoUrl": f"https://www.youtube.com/shorts/{vid_id}",
                "published": "Recently on YouTube",
            })

        return shorts_list
    except Exception as e:
        logger.error(f"Error fetching channel shorts for '{clean}': {e}")
        return []


def fetch_channel_videos(channel_handle_or_query: str, limit: int = 25) -> List[Dict[str, Any]]:
    """
    Fetches real long-form/widescreen 16:9 videos from the channel's /videos tab.
    """
    clean = normalize_channel_identifier(channel_handle_or_query)
    target_url = f"https://www.youtube.com/{clean}/videos"

    headers = {"User-Agent": USER_AGENT, "Accept-Language": "en-US,en;q=0.9"}
    try:
        resp = requests.get(target_url, headers=headers, timeout=10)
        if resp.status_code != 200:
            return []

        match = re.search(r"var ytInitialData = (\{.*?\});</script>", resp.text)
        if not match:
            return []

        data = json.loads(match.group(1))
        tabs = data.get("contents", {}).get("twoColumnBrowseResultsRenderer", {}).get("tabs", [])
        tab = next((t for t in tabs if "tabRenderer" in t and t["tabRenderer"].get("selected")), None)
        if not tab:
            return []

        contents = tab.get("tabRenderer", {}).get("content", {}).get("richGridRenderer", {}).get("contents", [])
        videos_list = []

        for item in contents[:limit]:
            content = item.get("richItemRenderer", {}).get("content", {})
            lockup = content.get("lockupViewModel", {})
            if not lockup:
                continue

            content_id = lockup.get("contentId", "")
            metadata = lockup.get("metadata", {}).get("lockupMetadataViewModel", {})
            title = metadata.get("title", {}).get("content", "Video")

            thumb_vm = lockup.get("contentImage", {}).get("thumbnailViewModel", {})
            badges = thumb_vm.get("overlays", [])
            duration = "3:36"
            for b in badges:
                runs = b.get("thumbnailOverlayTimeStatusRenderer", {}).get("text", {}).get("runs", [])
                if runs:
                    duration = runs[0].get("text", duration)

            sources = thumb_vm.get("image", {}).get("sources", [])
            thumb_url = sources[-1].get("url") if sources else f"https://i.ytimg.com/vi/{content_id}/hqdefault.jpg"

            lines = metadata.get("metadata", {}).get("contentMetadataViewModel", {}).get("metadataRows", [])
            views = "0 views"
            published = ""
            if lines:
                parts = lines[0].get("metadataParts", [])
                if len(parts) > 0:
                    views = parts[0].get("text", {}).get("content", "")
                if len(parts) > 1:
                    published = parts[1].get("text", {}).get("content", "")

            videos_list.append({
                "id": content_id,
                "title": title,
                "duration": duration,
                "views": views,
                "published": published,
                "thumbnailUrl": thumb_url,
                "videoUrl": f"https://www.youtube.com/watch?v={content_id}",
                "category": "Brain Teaser & Quiz" if "Brain" in title or "Emoji" in title else "Channel Upload",
            })

        return videos_list
    except Exception as e:
        logger.error(f"Error fetching channel videos for '{clean}': {e}")
        return []


def get_channel_live_feed(channel_handle_or_id: str) -> Dict[str, Any]:
    """
    Fetches live comprehensive channel feed: real channel info, real videos, real shorts, and for-you recommendations.
    """
    handle = channel_handle_or_id
    if not handle.startswith("@") and not handle.startswith("http") and not handle.startswith("UC"):
        # Could be database ID
        ch = get_channel_by_id(channel_handle_or_id)
        if ch:
            handle = ch.get("handle") or ch.get("name")

    channel_meta = lookup_channel(handle)
    videos = fetch_channel_videos(handle)
    shorts = fetch_channel_shorts(handle)

    # For you: mix top shorts and popular/recent videos matching real YouTube For You shelf
    for_you = []
    if shorts:
        for s in shorts[:2]:
            for_you.append({
                "id": s["id"],
                "title": s["title"],
                "views": s["views"],
                "thumbnailUrl": s["thumbnailUrl"],
                "videoUrl": s["videoUrl"],
                "isShort": True,
            })
    for v in videos[:4]:
        for_you.append({
            "id": v["id"],
            "title": v["title"],
            "views": v["views"],
            "published": v.get("published", ""),
            "duration": v.get("duration", ""),
            "thumbnailUrl": v["thumbnailUrl"],
            "videoUrl": v["videoUrl"],
            "isShort": False,
        })

    return {
        "channel": channel_meta,
        "videos": videos,
        "shorts": shorts,
        "forYou": for_you,
    }


def correct_and_sync_channel(channel_id: str, new_handle_or_query: Optional[str] = None) -> Dict[str, Any]:
    """
    Corrects and syncs an existing channel from live YouTube.
    Updates the database with fresh live subscriber counts, avatars, and video counts.
    """
    ch = get_channel_by_id(channel_id)
    if not ch:
        raise ValueError(f"Channel with ID '{channel_id}' not found in database.")

    query_to_use = new_handle_or_query or ch.get("handle") or ch.get("name")
    resolved = lookup_channel(query_to_use)

    updates = {
        "name": resolved["name"],
        "handle": resolved["handle"],
        "subscribers": resolved["subscribers"],
        "videosUploaded": resolved["videosUploaded"],
        "avatarUrl": resolved["avatarUrl"],
        "bannerUrl": resolved.get("bannerUrl"),
    }

    updated = update_channel(channel_id, updates)
    if not updated:
        raise RuntimeError("Failed to update channel in database.")

    return {
        "channel": updated,
        "resolved": resolved,
        "message": f"Successfully corrected and synced '{resolved['name']}' ({resolved['handle']}) with live YouTube metrics.",
    }
