"""
backend/features/workspace/open_media_service.py
Backward-compatibility facade delegating video, image, audio, and SFX operations directly
to the centralized modular media package (backend.features.media) to eliminate code duplication.
Also houses the live open-source quotes search (ZenQuotes & DummyJSON).
"""

import os
import re
import json
import logging
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Dict, List, Optional, Set

from backend.features.media import (
    search_media,
    search_audio,
    search_sfx,
    get_providers_status as media_get_providers_status,
    resolve_single_scene,
)

logger = logging.getLogger("ApexMind.OpenMediaService")


def _http_get_json(url: str, headers: Optional[Dict[str, str]] = None, timeout: int = 5) -> Optional[Any]:
    req = urllib.request.Request(url, headers=headers or {"User-Agent": "ApexMindStudio/2.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as e:
        logger.debug(f"HTTP GET error for {url}: {e}")
        return None


def get_media_providers_status() -> Dict[str, Any]:
    """Returns active connection status for media providers, delegating to media service."""
    status_data = media_get_providers_status()
    provs = status_data.providers
    return {
        "pexels": provs.get("pexels", {}).status == "active",
        "pixabay": provs.get("pixabay", {}).status == "active",
        "unsplash": provs.get("unsplash", {}).status == "active",
        "jamendo": True,
        "wikimedia": True,
        "google_cse": provs.get("google_cse", {}).status == "active",
    }


def search_open_videos(
    query: str = "",
    category: str = "all",
    provider: str = "all",
    page: int = 1,
    page_size: int = 20,
    aspect_ratio: str = "9:16",
) -> Dict[str, Any]:
    """Search royalty-free videos, delegating directly to backend.features.media."""
    q = query or (category if category != "all" else "")
    res = search_media(
        query=q,
        media_type="video",
        provider=provider,
        aspect_ratio=aspect_ratio,
        page=page,
        limit=page_size,
    )
    items = [
        {
            "id": it.id,
            "title": it.title,
            "videoUrl": it.url,
            "previewUrl": it.previewUrl or it.url,
            "posterUrl": it.thumbnailUrl or it.previewUrl or "",
            "duration": it.duration or 10.0,
            "resolution": it.resolution or ("1080x1920" if aspect_ratio in ["9:16", "4:5"] else "1920x1080"),
            "aspectRatio": it.aspectRatio,
            "source": it.provider,
            "provider": it.provider,
        }
        for it in res.items
    ]
    return {
        "success": True,
        "page": page,
        "pageSize": len(items),
        "total": res.total,
        "items": items,
        "providers": get_media_providers_status(),
    }


def search_open_images(
    query: str = "",
    category: str = "all",
    provider: str = "all",
    page: int = 1,
    page_size: int = 24,
    orientation: str = "portrait",
) -> Dict[str, Any]:
    """Search stock images, delegating directly to backend.features.media."""
    clean_query = (query or "").strip()
    clean_cat = (category or "").strip()
    if clean_query and clean_query.lower() not in ("all", "*"):
        q = clean_query
    elif clean_cat and clean_cat.lower() not in ("all", "*"):
        q = clean_cat
    else:
        q = "nature landscape"
    ratio = "9:16" if orientation == "portrait" else "16:9"
    res = search_media(
        query=q,
        media_type="image",
        provider=provider,
        aspect_ratio=ratio,
        page=page,
        limit=page_size,
    )
    items = [
        {
            "id": it.id,
            "title": it.title,
            "name": it.title,
            "imageUrl": it.url,
            "url": it.url,
            "previewUrl": it.previewUrl or it.url,
            "thumbnail": it.thumbnailUrl or it.previewUrl or it.url,
            "aspectRatio": it.aspectRatio,
            "source": it.provider,
            "provider": it.provider,
        }
        for it in res.items
    ]
    return {
        "success": True,
        "page": page,
        "pageSize": len(items),
        "total": res.total,
        "items": items,
        "providers": get_media_providers_status(),
    }


def search_open_tracks(query: str = "", genre: str = "", limit: int = 20) -> Dict[str, Any]:
    """Search background music soundtracks, delegating directly to backend.features.media."""
    res = search_audio(query=query, genre=genre, limit=limit)
    items = [
        {
            "id": it.id,
            "title": it.title,
            "artist": it.artist,
            "url": it.audioUrl,
            "audioUrl": it.audioUrl,
            "duration": f"{int(it.duration or 120)//60}:{int(it.duration or 120)%60:02d}",
            "durationSeconds": it.duration,
            "genre": it.genre,
            "bpm": it.bpm,
            "license": "Creative Commons (Jamendo)",
            "source": it.provider,
            "waveformPeaks": it.waveformPeaks,
        }
        for it in res.items
    ]
    return {
        "success": True,
        "total": res.total,
        "items": items,
    }


def search_open_sfx(query: str = "whoosh", limit: int = 20) -> Dict[str, Any]:
    """Search royalty-free sound effects, delegating directly to backend.features.media."""
    res = search_sfx(query=query, limit=limit)
    items = [
        {
            "id": it.id,
            "title": it.title,
            "name": it.title,
            "audioUrl": it.audioUrl,
            "url": it.audioUrl,
            "duration": it.duration,
            "category": it.category,
            "source": it.provider,
        }
        for it in res.items
    ]
    return {
        "success": True,
        "total": res.total,
        "items": items,
    }


def resolve_scene_media_from_internet(
    media_type: str,
    visual_query: str,
    fallback_topic: str = "",
    exclude_urls: Optional[Set[str]] = None,
    aspect_ratio: str = "9:16",
) -> Optional[Dict[str, Any]]:
    """Resolves live media cut for a scene, delegating directly to backend.features.media."""
    query = visual_query or fallback_topic or "cinematic nature"
    res = resolve_single_scene(
        scene_number=1,
        query=query,
        media_type=media_type,
        aspect_ratio=aspect_ratio,
        exclude_urls=list(exclude_urls or []),
    )
    if res.status == "resolved" and res.media:
        return {
            "id": res.media.id,
            "title": res.media.title,
            "videoUrl": res.media.url if media_type == "video" else "",
            "imageUrl": res.media.url if media_type == "image" else "",
            "previewUrl": res.media.previewUrl or res.media.url,
            "posterUrl": res.media.thumbnailUrl or res.media.previewUrl or "",
            "duration": res.media.duration or "Loop",
            "resolution": res.media.resolution or "1080x1920",
            "source": res.media.provider,
            "aspectRatio": res.media.aspectRatio,
        }
    return None


# ===========================================================================
# Viral Quotes & Hooks Providers (Live ZenQuotes + DummyJSON APIs)
# ===========================================================================


def _categorize_quote(text: str, author: str) -> str:
    combined = f"{text} {author}".lower()
    if any(a in combined for a in {"marcus aurelius", "seneca", "epictetus", "socrates", "nietzsche"}):
        return "Stoic & Philosophy"
    if any(t in combined for t in {"discipline", "pain", "sweat", "grind", "hard", "work", "suffer", "strong", "iron"}):
        return "Discipline & Grit"
    if any(t in combined for t in {"money", "wealth", "business", "goal", "win", "leader", "success"}):
        return "Success & Wealth"
    return "Wisdom & Philosophy"


def _generate_video_hook(text: str) -> str:
    clean = text.strip().rstrip(".")
    if len(clean) <= 60:
        return f"Remember this: {clean}"
    first_clause = clean.split(",")[0].split(";")[0].split("—")[0].strip()
    return f"The brutal truth: {first_clause}..."


def search_open_quotes(
    query: str = "",
    category: str = "all",
    author: str = "",
    page: int = 1,
    limit: int = 30,
) -> Dict[str, Any]:
    """Live query open-source public quotes & viral video hooks."""
    raw_pools: List[Dict[str, Any]] = []

    def _fetch_zenquotes() -> List[Dict[str, Any]]:
        zq_data = _http_get_json("https://zenquotes.io/api/quotes", timeout=4)
        out = []
        if zq_data and isinstance(zq_data, list):
            for idx, z in enumerate(zq_data):
                q_text = z.get("q", "").strip()
                if q_text:
                    out.append({
                        "quote": q_text,
                        "author": z.get("a", "Stoic Wisdom").strip(),
                        "source": "zenquotes",
                    })
        return out

    def _fetch_dummyjson() -> List[Dict[str, Any]]:
        dj_data = _http_get_json("https://dummyjson.com/quotes?limit=50", timeout=4)
        out = []
        if dj_data and isinstance(dj_data, dict):
            for q in dj_data.get("quotes", []):
                q_text = q.get("quote", "").strip()
                if q_text:
                    out.append({
                        "quote": q_text,
                        "author": q.get("author", "Wisdom").strip(),
                        "source": "dummyjson",
                    })
        return out

    with ThreadPoolExecutor(max_workers=2) as executor:
        f_zq = executor.submit(_fetch_zenquotes)
        f_dj = executor.submit(_fetch_dummyjson)
        try:
            raw_pools.extend(f_zq.result() or [])
        except Exception:
            pass
        try:
            raw_pools.extend(f_dj.result() or [])
        except Exception:
            pass

    seen_normalized: Set[str] = set()
    unified_quotes: List[Dict[str, Any]] = []

    for item in raw_pools:
        q_text = item["quote"].strip()
        norm_key = re.sub(r"[^a-z0-9]", "", q_text.lower())
        if not norm_key or norm_key in seen_normalized:
            continue
        seen_normalized.add(norm_key)

        author_name = item.get("author") or "Wisdom"
        cat = item.get("forced_category") or _categorize_quote(q_text, author_name)
        char_len = len(q_text)

        unified_quotes.append({
            "id": f"quote_{abs(hash(norm_key))}",
            "quote": q_text,
            "author": author_name,
            "category": cat,
            "hook": _generate_video_hook(q_text),
            "characterCount": char_len,
            "length": "Short" if char_len <= 65 else ("Medium" if char_len <= 130 else "Long"),
            "estimatedSpeechSec": round(max(1.0, len(q_text.split()) / 2.5), 1),
            "source": item.get("source", "open_media"),
        })

    # Search & Category Filtering
    clean_q = (query or "").strip().lower()
    if clean_q:
        unified_quotes = [q for q in unified_quotes if clean_q in q["quote"].lower() or clean_q in q["author"].lower()]

    clean_cat = (category or "").strip().lower()
    if clean_cat and clean_cat != "all":
        unified_quotes = [q for q in unified_quotes if clean_cat in q["category"].lower()]

    if author and author.strip():
        unified_quotes = [q for q in unified_quotes if author.strip().lower() in q["author"].lower()]

    total_found = len(unified_quotes)
    start_idx = max(0, (page - 1) * limit)
    paged = unified_quotes[start_idx : start_idx + limit]

    return {
        "success": True,
        "page": page,
        "limit": limit,
        "total": total_found,
        "totalPages": max(1, (total_found + limit - 1) // limit),
        "category": category,
        "quotes": paged,
        "items": paged,
    }


__all__ = [
    "get_media_providers_status",
    "search_open_videos",
    "search_open_images",
    "search_open_tracks",
    "search_open_sfx",
    "search_open_quotes",
    "resolve_scene_media_from_internet",
]
