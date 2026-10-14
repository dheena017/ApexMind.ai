"""
backend/features/workspace/open_media_service.py
Open-Source & Public API Media Aggregator for ApexMind Studio:
- Wikimedia Commons Public API (Creative Commons & Public Domain live search)
- Openverse Image API
- Curated High-Definition 9:16 Stock Images
- Royalty-Free Soundtrack and SFX search
"""

import logging
from typing import Dict, Any, List, Optional
import urllib.parse
import urllib.request
import json

logger = logging.getLogger("ApexMind.OpenMediaService")

# Wikimedia Commons Open API (No API Key Required, 100% Free Creative Commons)
WIKIMEDIA_API_URL = "https://commons.wikimedia.org/w/api.php"
OPENVERSE_API_URL = "https://api.openverse.org/v1/images/"

def search_wikimedia_images(query: str, limit: int = 24) -> List[Dict[str, Any]]:
    """Live search Wikimedia Commons for Creative Commons media assets."""
    try:
        search_term = query.strip() if query else "mountain landscape"
        params = {
            "action": "query",
            "generator": "search",
            "gsrsearch": f"{search_term} filetype:bitmap",
            "gsrnamespace": "6", # File namespace
            "gsrlimit": str(min(limit, 40)),
            "prop": "imageinfo",
            "iiprop": "url|thumburl|size|mime",
            "iiurlwidth": "450", # 9:16 / mobile friendly width
            "format": "json",
        }
        url = f"{WIKIMEDIA_API_URL}?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "ApexMindStudio/2.0 (studio@apexmind.ai)"}
        )
        with urllib.request.urlopen(req, timeout=4) as response:
            if response.status == 200:
                raw_data = json.loads(response.read().decode("utf-8"))
                pages = raw_data.get("query", {}).get("pages", {})
                results = []
                for p_id, page in pages.items():
                    info_list = page.get("imageinfo", [])
                    if not info_list:
                        continue
                    info = info_list[0]
                    title_clean = page.get("title", "").replace("File:", "").rsplit(".", 1)[0]
                    thumb = info.get("thumburl") or info.get("url")
                    full_url = info.get("url")
                    if full_url:
                        results.append({
                            "id": f"wm_{p_id}",
                            "title": title_clean or "Creative Commons Image",
                            "url": full_url,
                            "thumbnail": thumb,
                            "author": "Wikimedia Commons",
                            "license": "Creative Commons / Public Domain",
                            "resolution": f"{info.get('width', 1080)}x{info.get('height', 1920)}",
                            "source": "wikimedia_commons",
                            "tags": [t.lower() for t in search_term.split() if len(t) > 2],
                        })
                return results
    except Exception as e:
        logger.warning(f"Wikimedia API query failed ({e})")
    return []


def search_openverse_images(query: str, page: int = 1, page_size: int = 24) -> List[Dict[str, Any]]:
    """Live search Openverse API."""
    try:
        params = {
            "q": query or "dark architecture",
            "page": page,
            "page_size": page_size,
        }
        url = f"{OPENVERSE_API_URL}?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "ApexMindStudio/2.0"}
        )
        with urllib.request.urlopen(req, timeout=3) as response:
            if response.status == 200:
                raw = json.loads(response.read().decode("utf-8"))
                results = []
                for item in raw.get("results", []):
                    results.append({
                        "id": f"ov_{item.get('id')}",
                        "title": item.get("title") or "Openverse Creative Asset",
                        "url": item.get("url"),
                        "thumbnail": item.get("thumbnail") or item.get("url"),
                        "author": item.get("creator") or "Openverse Creator",
                        "license": item.get("license", "CC0").upper(),
                        "resolution": f"{item.get('width', 1080)}x{item.get('height', 1920)}",
                        "source": "openverse",
                        "tags": item.get("tags", [])[:5] if isinstance(item.get("tags"), list) else [],
                    })
                return results
    except Exception as e:
        logger.debug(f"Openverse API note: {e}")
    return []


def search_open_images(query: str, page: int = 1, page_size: int = 24, license_type: str = "cc0,pdm") -> Dict[str, Any]:
    """Search live open APIs (Wikimedia / Openverse) with curated high-definition 9:16 fallback."""
    # 1. Try Wikimedia Commons live search
    if query:
        wm_results = search_wikimedia_images(query, limit=page_size)
        if wm_results:
            return {
                "success": True,
                "source": "wikimedia_commons",
                "total": len(wm_results),
                "items": wm_results[:page_size],
            }

    # 2. Try Openverse live search
    ov_results = search_openverse_images(query, page=page, page_size=page_size)
    if ov_results:
        return {
            "success": True,
            "source": "openverse",
            "total": len(ov_results),
            "items": ov_results[:page_size],
        }

    # 3. Fallback to curated catalog
    from backend.shared.media_catalog import CURATED_STOCK_IMAGES
    q = (query or "").lower().strip()
    filtered = [
        img for img in CURATED_STOCK_IMAGES
        if not q or q in img.get("title", "").lower() or q in img.get("category", "").lower() or any(q in t for t in img.get("tags", []))
    ]
    # If no specific keyword match, return all available curated images
    fallback_items = filtered if filtered else CURATED_STOCK_IMAGES
    return {
        "success": True,
        "source": "curated_fallback",
        "total": len(fallback_items),
        "items": fallback_items[:page_size],
    }


def search_open_tracks(query: str = "", genre: str = "", limit: int = 20) -> Dict[str, Any]:
    """Search soundtracks: returns rich royalty-free audio tracks with waveforms and metadata."""
    from backend.shared.media_catalog import MEDIA_TRACKS
    q = (query or genre or "").lower().strip()
    filtered = [
        t for t in MEDIA_TRACKS
        if not q or q in t.get("title", "").lower() or q in t.get("genre", "").lower()
    ]
    tracks = filtered if filtered else MEDIA_TRACKS
    return {
        "success": True,
        "source": "curated_catalog",
        "total": len(tracks),
        "items": tracks[:limit],
    }


def search_open_sfx(query: str = "whoosh", limit: int = 20) -> Dict[str, Any]:
    """Search sound effects catalog with audio playback URLs."""
    from backend.shared.media_catalog import CURATED_SFX
    q = (query or "").lower().strip()
    filtered = [
        sfx for sfx in CURATED_SFX
        if not q or q in sfx.get("name", "").lower() or q in sfx.get("category", "").lower()
    ]
    items = filtered if filtered else CURATED_SFX
    return {
        "success": True,
        "source": "curated_sfx",
        "total": len(items),
        "items": items[:limit],
    }
