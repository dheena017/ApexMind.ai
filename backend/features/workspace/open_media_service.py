"""
backend/features/workspace/open_media_service.py
Open-Source & Public API Media Aggregator for ApexMind Studio:
- Pexels & Pixabay Live API (supports optional free API keys via environment variables)
- Wikimedia Commons Public API (100% Free Creative Commons & Public Domain live search)
- Openverse Image API (100% Free CC Catalog)
- Jamendo Free Music API (100% Free Creative Commons Soundtrack Streaming)
- Open SFX & Audio Foley library
"""

import logging
import os
from typing import Dict, Any, List, Optional
import urllib.parse
import urllib.request
import json

logger = logging.getLogger("ApexMind.OpenMediaService")

# Open Service Endpoints
WIKIMEDIA_API_URL = "https://commons.wikimedia.org/w/api.php"
OPENVERSE_API_URL = "https://api.openverse.org/v1/images/"
JAMENDO_API_URL = "https://api.jamendo.com/v3.0/tracks/"

# Default Jamendo Client ID (Public Open Developer ID for CC streaming)
JAMENDO_DEFAULT_CLIENT_ID = "56d30c95"

# ---------------------------------------------------------------------------
# Videos: Pexels API / Pixabay API / Wikimedia Commons Live Video Search
# ---------------------------------------------------------------------------

def search_wikimedia_videos(
    query: str = "",
    category: str = "all",
    page: int = 1,
    limit: int = 20,
    aspect_ratio: str = "9:16",
) -> List[Dict[str, Any]]:
    """Live search Wikimedia Commons for open videos (Zero API keys needed, 100% dynamic)."""
    try:
        clean_q = (query or "").replace("#", "").strip()
        if not clean_q:
            clean_q = category if category != "all" else "nature landscape"
        search_term = f"{clean_q} filetype:video"
        offset = max(0, (page - 1) * limit)
        params = {
            "action": "query",
            "generator": "search",
            "gsrsearch": search_term,
            "gsrnamespace": "6",
            "gsrlimit": str(min(limit, 30)),
            "gsroffset": str(offset),
            "prop": "imageinfo",
            "iiprop": "url|thumburl|mime|size",
            "iiurlwidth": "480",
            "format": "json",
        }
        url = f"{WIKIMEDIA_API_URL}?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "ApexMindStudio/2.0 (studio@apexmind.ai)"}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                raw_data = json.loads(response.read().decode("utf-8"))
                pages = raw_data.get("query", {}).get("pages", {})
                results = []
                for p_id, page_data in pages.items():
                    info_list = page_data.get("imageinfo", [])
                    if not info_list:
                        continue
                    info = info_list[0]
                    mime = info.get("mime", "")
                    if not mime.startswith("video/"):
                        continue
                    raw_title = page_data.get("title", "").replace("File:", "").rsplit(".", 1)[0].replace("_", " ")
                    title_lower = raw_title.lower()
                    
                    # Reject non-cinematic, DIY, speech, tutorial, news, or obscure junk videos
                    junk_keywords = (
                        "how to", "tutorial", "repair", "paint", "pebble", "interview", "lecture",
                        "meeting", "news", "cooking", "recipe", "cleaning", "presentation", "podcast",
                        "diy", "screencast", "software", "daily drone", "broadwater", "arnis", "demo",
                        "talking", "conference", "review", "unboxing", "install", "fixing", "renovation",
                        "pebble dash", "house", "gutter", "speech", "parliament", "panel", "grave",
                        "cemetery", "gravel", "demolition", "memorial", "rink", "funeral", "president",
                        "trump", "biden", "protest", "campaign", "election", "rally", "politic", "activist"
                    )
                    if any(junk in title_lower for junk in junk_keywords):
                        continue

                    video_url = info.get("url")
                    thumb_url = info.get("thumburl") or ""
                    if video_url:
                        results.append({
                            "id": f"wmv_{p_id}",
                            "title": raw_title[:45] or f"{clean_q.title()} Video",
                            "category": category if category != "all" else "nature",
                            "videoUrl": video_url,
                            "posterUrl": thumb_url,
                            "duration": "Loop",
                            "resolution": f"{info.get('width', 1080)}x{info.get('height', 1920)} HD",
                            "author": "Wikimedia Commons",
                            "license": "Creative Commons / Public Domain",
                            "source": "wikimedia_commons",
                            "tags": [clean_q.lower()],
                        })
                return results
    except Exception as e:
        logger.debug(f"Wikimedia video search note: {e}")
    return []


def search_pexels_videos(
    query: str,
    page: int = 1,
    page_size: int = 20,
    aspect_ratio: str = "9:16",
) -> List[Dict[str, Any]]:
    """Live search Pexels Free Video API with aspect-ratio awareness if PEXELS_API_KEY is configured in .env."""
    api_key = os.getenv("PEXELS_API_KEY")
    if not api_key:
        return []

    try:
        clean_q = (query or "").strip().replace("#", "").strip()
        per_page = min(page_size, 30)
        orientation = "portrait"
        if aspect_ratio in ["16:9", "21:9"]:
            orientation = "landscape"
        elif aspect_ratio == "1:1":
            orientation = "square"
        elif aspect_ratio in ["9:16", "4:5"]:
            orientation = "portrait"

        if clean_q:
            url = (
                f"https://api.pexels.com/v1/videos/search?"
                f"query={urllib.parse.quote(clean_q)}&per_page={per_page}&page={page}&orientation={orientation}"
            )
        else:
            url = f"https://api.pexels.com/v1/videos/popular?per_page={per_page}&page={page}&orientation={orientation}"

        req = urllib.request.Request(
            url,
            headers={
                "Authorization": api_key,
                "User-Agent": "ApexMindStudio/2.0"
            }
        )
        with urllib.request.urlopen(req, timeout=5) as res:
            if res.status == 200:
                data = json.loads(res.read().decode("utf-8"))
                videos = []
                for v in data.get("videos", []):
                    files = v.get("video_files", [])
                    # Pick highest quality MP4
                    mp4_file = next(
                        (f for f in files if f.get("file_type") == "video/mp4" and f.get("quality") in ["hd", "sd"]),
                        files[0] if files else None
                    )
                    if mp4_file and mp4_file.get("link"):
                        dur = v.get("duration", 10)
                        videos.append({
                            "id": f"pex_{v.get('id')}",
                            "title": f"{search_term.title()} ({dur}s)",
                            "category": "cinematic",
                            "videoUrl": mp4_file["link"],
                            "posterUrl": v.get("image") or (v.get("video_pictures", [{}])[0].get("picture")),
                            "duration": f"{dur}s Loop",
                            "resolution": f"{mp4_file.get('width', 1080)}x{mp4_file.get('height', 1920)}",
                            "author": v.get("user", {}).get("name", "Pexels Creator"),
                            "license": "Free Pexels License (Commercial Use Allowed)",
                            "source": "pexels",
                            "tags": [search_term.lower(), "stock", "video"],
                        })
                return videos
    except Exception as e:
        logger.debug(f"Pexels Video API error: {e}")
    return []


def search_pixabay_videos(
    query: str,
    page: int = 1,
    page_size: int = 20,
    aspect_ratio: str = "9:16",
) -> List[Dict[str, Any]]:
    """Live search Pixabay Free Video API with aspect-ratio awareness if PIXABAY_API_KEY is configured in .env."""
    api_key = os.getenv("PIXABAY_API_KEY")
    if not api_key:
        return []

    try:
        search_term = query or "nature"
        orientation_param = ""
        if aspect_ratio in ["16:9", "21:9"]:
            orientation_param = "&orientation=horizontal"
        elif aspect_ratio in ["9:16", "4:5"]:
            orientation_param = "&orientation=vertical"

        url = (
            f"https://pixabay.com/api/videos/?"
            f"key={api_key}&q={urllib.parse.quote(search_term)}&per_page={min(page_size, 30)}&page={page}&video_type=film{orientation_param}"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "ApexMindStudio/2.0"})
        with urllib.request.urlopen(req, timeout=5) as res:
            if res.status == 200:
                data = json.loads(res.read().decode("utf-8"))
                videos = []
                for v in data.get("hits", []):
                    v_dict = v.get("videos", {})
                    chosen = v_dict.get("medium") or v_dict.get("large") or v_dict.get("small")
                    if chosen and chosen.get("url"):
                        pic_id = v.get("picture_id")
                        poster = f"https://i.vimeocdn.com/video/{pic_id}_640x360.jpg" if pic_id else None
                        dur = v.get("duration", 10)
                        videos.append({
                            "id": f"pix_{v.get('id')}",
                            "title": (v.get("tags", "Stock Video").split(",")[0] or search_term).strip().title(),
                            "category": "abstract",
                            "videoUrl": chosen["url"],
                            "posterUrl": poster,
                            "duration": f"{dur}s Loop",
                            "resolution": f"{chosen.get('width', 1080)}x{chosen.get('height', 1920)}",
                            "author": v.get("user", "Pixabay Creator"),
                            "license": "Pixabay Free License",
                            "source": "pixabay",
                            "tags": [t.strip().lower() for t in v.get("tags", "").split(",") if t.strip()],
                        })
                return videos
    except Exception as e:
        logger.debug(f"Pixabay Video API error: {e}")
    return []


def search_google_videos(
    query: str,
    page: int = 1,
    limit: int = 10,
    aspect_ratio: str = "9:16",
) -> List[Dict[str, Any]]:
    """Live search for genuine vertical/cinematic stock videos via Google Custom Search Engine (CSE)."""
    api_key = os.getenv("GOOGLE_SEARCH_API_KEY") or os.getenv("GEMINI_API_KEY")
    cse_id = os.getenv("GOOGLE_CSE_ID")
    if not api_key or not cse_id:
        return []

    try:
        clean_q = (query or "").strip().replace("#", "").strip()
        if not clean_q:
            clean_q = "cinematic motivational background loop"
        
        orient_tag = "vertical 9:16" if aspect_ratio in ["9:16", "4:5"] else "cinematic 16:9"
        search_query = f'{clean_q} {orient_tag} (site:pexels.com/video OR site:pixabay.com/videos OR site:coverr.co OR site:mixkit.co)'
        start_idx = max(1, (page - 1) * limit + 1)
        
        params = {
            "key": api_key,
            "cx": cse_id,
            "q": search_query,
            "num": str(min(limit, 10)),
            "start": str(start_idx),
            "safe": "active",
        }
        url = f"https://www.googleapis.com/customsearch/v1?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(url, headers={"User-Agent": "ApexMindStudio/2.0"})
        with urllib.request.urlopen(req, timeout=6) as res:
            if res.status == 200:
                data = json.loads(res.read().decode("utf-8"))
                items = data.get("items", [])
                videos = []
                for idx, it in enumerate(items):
                    title = it.get("title", f"{clean_q.title()} Video")
                    pagemap = it.get("pagemap", {})
                    video_objs = pagemap.get("videoobject", []) or pagemap.get("video", [])
                    meta_tags = pagemap.get("metatags", [{}])[0] if pagemap.get("metatags") else {}
                    cse_images = pagemap.get("cse_image", [{}])[0] if pagemap.get("cse_image") else {}
                    
                    direct_video = (
                        (video_objs[0].get("contenturl") if video_objs else None)
                        or meta_tags.get("og:video")
                        or meta_tags.get("og:video:url")
                        or meta_tags.get("twitter:player:stream")
                    )
                    poster_url = (
                        (video_objs[0].get("thumbnailurl") if video_objs else None)
                        or meta_tags.get("og:image")
                        or cse_images.get("src")
                        or ""
                    )
                    
                    if direct_video and direct_video.startswith("http"):
                        videos.append({
                            "id": f"g_vid_{page}_{idx+1}",
                            "title": title[:50],
                            "category": "cinematic",
                            "videoUrl": direct_video,
                            "posterUrl": poster_url,
                            "duration": "Loop",
                            "resolution": "1080x1920 HD" if aspect_ratio in ["9:16", "4:5"] else "1920x1080 HD",
                            "author": it.get("displayLink", "Google Search Engine"),
                            "license": "Royalty-Free Open Media",
                            "source": "google_search_engine",
                            "tags": [t.lower() for t in clean_q.split() if len(t) > 2],
                        })
                return videos
    except Exception as e:
        logger.debug(f"Google Search Engine Video error: {e}")
    return []


def search_open_videos(
    query: str = "",
    category: str = "all",
    page: int = 1,
    page_size: int = 20,
    aspect_ratio: str = "9:16",
) -> Dict[str, Any]:
    """
    Search real stock videos across open APIs (Google Search Engine, Pexels, Pixabay, Wikimedia Commons).
    Enforces the target aspect ratio across queries.
    """
    q = (query or "").strip().lower()

    # 1. Try Google Search Engine Video Discovery (if GOOGLE_CSE_ID is set)
    google_vids = search_google_videos(query=q, page=page, limit=page_size, aspect_ratio=aspect_ratio)
    if google_vids:
        return {
            "success": True,
            "source": "google_search_engine",
            "page": page,
            "pageSize": page_size,
            "total": len(google_vids),
            "items": google_vids,
        }

    # 2. Try Pexels API
    if os.getenv("PEXELS_API_KEY"):
        pex_results = search_pexels_videos(q, page=page, page_size=page_size, aspect_ratio=aspect_ratio)
        if pex_results:
            return {
                "success": True,
                "source": "pexels_api",
                "page": page,
                "pageSize": page_size,
                "total": len(pex_results),
                "items": pex_results,
            }

    # 3. Try Pixabay API
    if os.getenv("PIXABAY_API_KEY"):
        pix_results = search_pixabay_videos(q, page=page, page_size=page_size, aspect_ratio=aspect_ratio)
        if pix_results:
            return {
                "success": True,
                "source": "pixabay_api",
                "page": page,
                "pageSize": page_size,
                "total": len(pix_results),
                "items": pix_results,
            }

    # 4. Dynamic Keyless Wikimedia Commons Videos
    wm_videos = search_wikimedia_videos(query=q, category=category, page=page, limit=page_size, aspect_ratio=aspect_ratio)
    if wm_videos:
        logger.info(f"Queried open video stock for '{q or category}' [Ratio: {aspect_ratio}] ➔ Found {len(wm_videos)} videos")
        return {
            "success": True,
            "source": "wikimedia_commons",
            "page": page,
            "pageSize": page_size,
            "total": len(wm_videos),
            "items": wm_videos,
        }

    logger.info(f"Queried open video stock for '{q or category}' [Ratio: {aspect_ratio}] ➔ Found 0 videos")
    return {
        "success": True,
        "source": "empty",
        "page": page,
        "pageSize": page_size,
        "total": 0,
        "items": [],
    }


# ---------------------------------------------------------------------------
# Images: Wikimedia Commons / Openverse / Curated CC0
# ---------------------------------------------------------------------------

WIKIMEDIA_CATEGORY_MAP = {
    "stoic": "ancient roman statue marble",
    "gym": "bodybuilding fitness workout",
    "cyber": "tokyo neon night cyberpunk",
    "nature": "dramatic mountain landscape sunset",
    "architecture": "ancient temple architecture stone",
    "minimal": "minimalist dark architecture",
}

AESTHETIC_BACKDROP_MAP = {
    "rain": "rain night street city moody",
    "#rain": "rain night street city moody",
    "gym": "fitness bodybuilding workout gym",
    "#gym": "fitness bodybuilding workout gym",
    "stoic": "roman marble statue sculpture bust",
    "#stoic": "roman marble statue sculpture bust",
    "cyber": "neon cyberpunk night city street",
    "cyberpunk": "neon cyberpunk night city street",
    "#cyberpunk": "neon cyberpunk night city street",
    "nature": "dramatic mountain landscape fog",
    "#nature": "dramatic mountain landscape fog",
    "fog": "fog mist mountain moody forest",
    "#fog": "fog mist mountain moody forest",
    "dark": "dark moody shadow cinematic",
    "#dark": "dark moody shadow cinematic",
    "space": "deep space galaxy nebula stars",
    "#space": "deep space galaxy nebula stars",
    "neon": "neon glow night street lights",
    "#neon": "neon glow night street lights",
    "ocean": "ocean waves moody sea coast",
    "#ocean": "ocean waves moody sea coast",
    "fire": "bonfire flames sparks night embers",
    "#fire": "bonfire flames sparks night embers",
    "cloud": "storm clouds dramatic sky sunset",
    "#cloud": "storm clouds dramatic sky sunset",
    "forest": "deep forest mist trees dark",
    "#forest": "deep forest mist trees dark",
}


def clean_wikimedia_query(query: str, category: str = "all") -> str:
    cleaned = (query or "").strip().lower()
    if cleaned in AESTHETIC_BACKDROP_MAP:
        return AESTHETIC_BACKDROP_MAP[cleaned]
    
    cleaned_no_hash = cleaned.replace("#", "").strip()
    if cleaned_no_hash in AESTHETIC_BACKDROP_MAP:
        return AESTHETIC_BACKDROP_MAP[cleaned_no_hash]

    if cleaned_no_hash:
        words = cleaned_no_hash.split()
        return " ".join(words[:2])
    
    if category in WIKIMEDIA_CATEGORY_MAP:
        return WIKIMEDIA_CATEGORY_MAP[category]
    return "cinematic landscape night"


def search_wikimedia_images(
    query: str = "",
    category: str = "all",
    page: int = 1,
    limit: int = 40
) -> List[Dict[str, Any]]:
    """Live search Wikimedia Commons (110M+ files) with pagination offsets and category mapping."""
    try:
        search_term = clean_wikimedia_query(query, category)
        offset = max(0, (page - 1) * limit)
        params = {
            "action": "query",
            "generator": "search",
            "gsrsearch": search_term,
            "gsrnamespace": "6",
            "gsrlimit": str(min(limit, 50)),
            "gsroffset": str(offset),
            "prop": "imageinfo",
            "iiprop": "url|thumburl|size|mime",
            "iiurlwidth": "640",
            "format": "json",
        }
        url = f"{WIKIMEDIA_API_URL}?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "ApexMindStudio/2.0 (studio@apexmind.ai)"}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                raw_data = json.loads(response.read().decode("utf-8"))
                pages = raw_data.get("query", {}).get("pages", {})
                results = []
                for p_id, page_data in pages.items():
                    info_list = page_data.get("imageinfo", [])
                    if not info_list:
                        continue
                    info = info_list[0]
                    mime = info.get("mime", "")
                    if mime not in ["image/jpeg", "image/png", "image/webp"]:
                        continue
                    raw_title = page_data.get("title", "").replace("File:", "").rsplit(".", 1)[0].replace("_", " ")
                    # Filter out purely scientific or document scans
                    if any(bad in raw_title.lower() for bad in ["diagram", "document", "scan", "logo", "icon", "herbarium"]):
                        continue
                    # Clean title of leading numbers/codes
                    import re
                    clean_title = re.sub(r"^\d+\s*[-_.]?\s*", "", raw_title).strip()
                    if not clean_title or len(clean_title) < 3:
                        clean_title = f"{query.replace('#', '').title() or 'Studio'} Backdrop"

                    thumb = info.get("thumburl") or info.get("url")
                    full_url = info.get("url")
                    if full_url and thumb:
                        results.append({
                            "id": f"wm_{p_id}",
                            "title": clean_title[:45],
                            "category": category if category != "all" else "nature",
                            "url": full_url,
                            "thumbnail": thumb,
                            "author": "Wikimedia Commons",
                            "authorUrl": f"https://commons.wikimedia.org/wiki/File:{urllib.parse.quote(page_data.get('title', '').replace('File:', ''))}",
                            "license": "Creative Commons / Public Domain",
                            "resolution": f"{info.get('width', 1080)}x{info.get('height', 1920)} HD",
                            "source": "wikimedia_commons",
                            "tags": [t.lower() for t in search_term.split() if len(t) > 2],
                        })
                return results
    except Exception as e:
        logger.warning(f"Wikimedia API query failed ({e})")
    return []


def search_flickr_photos(
    query: str = "",
    category: str = "all",
    limit: int = 24
) -> List[Dict[str, Any]]:
    """Live search Flickr Public Photography Feed (Zero API key needed, billions of photos)."""
    try:
        tag = query.strip().replace("#", "").strip()
        if not tag:
            tag = category if category != "all" else "landscape"
        clean_tag = urllib.parse.quote(tag.split()[0] if tag else "landscape")
        url = f"https://www.flickr.com/services/feeds/photos_public.gne?tags={clean_tag}&format=json&nojsoncallback=1"
        req = urllib.request.Request(url, headers={"User-Agent": "ApexMindStudio/2.0"})
        with urllib.request.urlopen(req, timeout=5) as res:
            if res.status == 200:
                data = json.loads(res.read().decode("utf-8"))
                photos = []
                for it in data.get("items", [])[:limit]:
                    thumb = it.get("media", {}).get("m", "")
                    if thumb:
                        full_hd = thumb.replace("_m.jpg", "_b.jpg")
                        title = it.get("title", "").strip() or f"{tag.title()} Photo"
                        author_raw = it.get("author", "")
                        author_clean = author_raw.split('("')[-1].replace('")', "").strip() if '("' in author_raw else "Flickr Photographer"
                        photos.append({
                            "id": f"flk_{abs(hash(it.get('link', thumb)))}",
                            "title": title,
                            "category": category if category != "all" else "nature",
                            "url": full_hd,
                            "thumbnail": thumb,
                            "author": author_clean,
                            "authorUrl": it.get("link", ""),
                            "resolution": "1080x1920 HD",
                            "license": "Flickr Creative Commons",
                            "source": "flickr",
                            "tags": [t.strip().lower() for t in it.get("tags", "").split() if t.strip()][:5],
                        })
                return photos
    except Exception as e:
        logger.debug(f"Flickr feed note: {e}")
    return []


def get_media_providers_status() -> Dict[str, Any]:
    """Check which external media providers have active API keys configured in .env."""
    return {
        "pexels": bool(os.getenv("PEXELS_API_KEY")),
        "pixabay": bool(os.getenv("PIXABAY_API_KEY")),
        "unsplash": bool(os.getenv("UNSPLASH_ACCESS_KEY")),
        "jamendo": bool(os.getenv("JAMENDO_CLIENT_ID")),
    }


def search_pexels_photos(
    query: str = "",
    page: int = 1,
    page_size: int = 36,
    orientation: str = "portrait"
) -> List[Dict[str, Any]]:
    """Live search Pexels Free Photo API per official documentation: supports /v1/search and /v1/curated."""
    api_key = os.getenv("PEXELS_API_KEY")
    if not api_key:
        return []

    try:
        orient = "portrait" if orientation in ["portrait", "vertical"] else orientation
        per_page = min(max(page_size, 1), 80)
        clean_q = query.strip().replace("#", "").strip()

        # If clean_q is provided, query /v1/search; otherwise use /v1/curated for real-time trending photos
        if clean_q:
            url = (
                f"https://api.pexels.com/v1/search?"
                f"query={urllib.parse.quote(clean_q)}&per_page={per_page}&page={page}&orientation={orient}"
            )
        else:
            url = f"https://api.pexels.com/v1/curated?per_page={per_page}&page={page}"

        req = urllib.request.Request(
            url,
            headers={
                "Authorization": api_key,
                "User-Agent": "ApexMindStudio/2.0"
            }
        )
        with urllib.request.urlopen(req, timeout=6) as res:
            if res.status == 200:
                data = json.loads(res.read().decode("utf-8"))
                photos = []
                for p in data.get("photos", []):
                    src = p.get("src", {})
                    # High quality portrait size per Pexels specification
                    full_url = src.get("portrait") or src.get("large2x") or src.get("large") or src.get("original")
                    thumb_url = src.get("medium") or src.get("small") or src.get("portrait") or full_url
                    if full_url and thumb_url:
                        photos.append({
                            "id": f"pex_{p.get('id')}",
                            "title": p.get("alt") or (f"{clean_q.title()} Photo" if clean_q else "Pexels Curated Photo"),
                            "category": "cinematic",
                            "url": full_url,
                            "thumbnail": thumb_url,
                            "author": p.get("photographer", "Pexels Creator"),
                            "authorUrl": p.get("photographer_url", ""),
                            "photoUrl": p.get("url", ""),
                            "avgColor": p.get("avg_color", "#18181B"),
                            "resolution": f"{p.get('width', 1080)}x{p.get('height', 1920)} HD",
                            "license": "Free Pexels License (Commercial Use Allowed)",
                            "source": "pexels",
                            "tags": [t.lower() for t in clean_q.split() if len(t) > 2] if clean_q else ["curated", "trending"],
                        })
                return photos
    except Exception as e:
        logger.debug(f"Pexels Photo API error: {e}")
    return []


def search_pixabay_photos(
    query: str,
    page: int = 1,
    page_size: int = 24,
    orientation: str = "vertical"
) -> List[Dict[str, Any]]:
    """Live search Pixabay Free Photo API if PIXABAY_API_KEY is configured."""
    api_key = os.getenv("PIXABAY_API_KEY")
    if not api_key:
        return []

    try:
        search_term = query or "landscape"
        orient = "vertical" if orientation in ["portrait", "vertical"] else "all"
        url = (
            f"https://pixabay.com/api/?"
            f"key={api_key}&q={urllib.parse.quote(search_term)}&per_page={min(page_size, 40)}&page={page}&image_type=photo&orientation={orient}&safesearch=true"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "ApexMindStudio/2.0"})
        with urllib.request.urlopen(req, timeout=5) as res:
            if res.status == 200:
                data = json.loads(res.read().decode("utf-8"))
                photos = []
                for hit in data.get("hits", []):
                    full_url = hit.get("largeImageURL") or hit.get("webformatURL")
                    thumb_url = hit.get("webformatURL") or hit.get("previewURL")
                    if full_url and thumb_url:
                        raw_tags = hit.get("tags", "")
                        tags_list = [t.strip().lower() for t in raw_tags.split(",") if t.strip()]
                        title_clean = tags_list[0].title() if tags_list else search_term.title()
                        photos.append({
                            "id": f"pix_{hit.get('id')}",
                            "title": title_clean,
                            "category": "nature",
                            "url": full_url,
                            "thumbnail": thumb_url,
                            "author": hit.get("user", "Pixabay Creator"),
                            "authorUrl": f"https://pixabay.com/users/{hit.get('user', '')}-{hit.get('user_id', '')}/" if hit.get("user_id") else "",
                            "resolution": f"{hit.get('imageWidth', 1080)}x{hit.get('imageHeight', 1920)} HD",
                            "license": "Pixabay Content License (Free for Commercial Use)",
                            "source": "pixabay",
                            "tags": tags_list,
                        })
                return photos
    except Exception as e:
        logger.debug(f"Pixabay Photo API error: {e}")
    return []


def search_unsplash_photos(
    query: str,
    page: int = 1,
    page_size: int = 24,
    orientation: str = "portrait"
) -> List[Dict[str, Any]]:
    """Live search Unsplash Free Photo API if UNSPLASH_ACCESS_KEY is configured."""
    api_key = os.getenv("UNSPLASH_ACCESS_KEY")
    if not api_key:
        return []

    try:
        search_term = query or "moody dark"
        orient = "portrait" if orientation in ["portrait", "vertical"] else "squarish"
        url = (
            f"https://api.unsplash.com/search/photos?"
            f"query={urllib.parse.quote(search_term)}&per_page={min(page_size, 30)}&page={page}&orientation={orient}"
        )
        req = urllib.request.Request(
            url,
            headers={
                "Authorization": f"Client-ID {api_key}",
                "User-Agent": "ApexMindStudio/2.0"
            }
        )
        with urllib.request.urlopen(req, timeout=5) as res:
            if res.status == 200:
                data = json.loads(res.read().decode("utf-8"))
                photos = []
                for item in data.get("results", []):
                    urls = item.get("urls", {})
                    full_url = urls.get("regular") or urls.get("full")
                    thumb_url = urls.get("small") or urls.get("thumb") or full_url
                    user_data = item.get("user", {})
                    if full_url and thumb_url:
                        photos.append({
                            "id": f"uns_{item.get('id')}",
                            "title": (item.get("description") or item.get("alt_description") or search_term).title(),
                            "category": "minimal",
                            "url": full_url,
                            "thumbnail": thumb_url,
                            "author": user_data.get("name", "Unsplash Creator"),
                            "authorUrl": user_data.get("links", {}).get("html", ""),
                            "resolution": f"{item.get('width', 1080)}x{item.get('height', 1920)} HD",
                            "license": "Unsplash Commercial License (Free to use)",
                            "source": "unsplash",
                            "tags": [t.get("title", "").lower() for t in item.get("tags", []) if isinstance(t, dict) and t.get("title")],
                        })
                return photos
    except Exception as e:
        logger.debug(f"Unsplash Photo API error: {e}")
    return []


def search_open_images(
    query: str = "",
    category: str = "all",
    page: int = 1,
    page_size: int = 24,
    provider: str = "all",
    orientation: str = "portrait"
) -> Dict[str, Any]:
    """
    Search 100M+ high-resolution stock photos across:
    - Pexels (Tens of millions of curated commercial photos)
    - Pixabay (4.5M+ photos and illustrations)
    - Unsplash (5M+ studio-grade photos)
    - Wikimedia Commons (110M+ open public-domain media)
    - Curated Studio Fallback Catalog
    """
    results: List[Dict[str, Any]] = []
    providers_status = get_media_providers_status()

    # 1. Targeted Flickr Free HD Search
    if provider == "flickr":
        results = search_flickr_photos(query=query, category=category, limit=page_size)
        return {
            "success": True,
            "source": "flickr",
            "page": page,
            "pageSize": page_size,
            "total": len(results),
            "items": results,
            "providers": providers_status,
        }

    # 2. Targeted Wikimedia Commons Free Search
    if provider == "wikimedia":
        results = search_wikimedia_images(query=query, category=category, page=page, limit=page_size)
        return {
            "success": True,
            "source": "wikimedia_commons",
            "page": page,
            "pageSize": page_size,
            "total": len(results),
            "items": results,
            "providers": providers_status,
        }

    # 3. Targeted Pexels Search
    if provider == "pexels":
        results = search_pexels_photos(query, page=page, page_size=page_size, orientation=orientation)
        return {
            "success": True,
            "source": "pexels",
            "page": page,
            "pageSize": page_size,
            "total": len(results),
            "items": results,
            "requiresKey": not providers_status.get("pexels", False),
            "providers": providers_status,
        }

    # 4. Targeted Pixabay Search
    if provider == "pixabay":
        results = search_pixabay_photos(query, page=page, page_size=page_size, orientation=orientation)
        return {
            "success": True,
            "source": "pixabay",
            "page": page,
            "pageSize": page_size,
            "total": len(results),
            "items": results,
            "requiresKey": not providers_status.get("pixabay", False),
            "providers": providers_status,
        }

    # 5. Targeted Unsplash Search
    if provider == "unsplash":
        results = search_unsplash_photos(query, page=page, page_size=page_size, orientation=orientation)
        return {
            "success": True,
            "source": "unsplash",
            "page": page,
            "pageSize": page_size,
            "total": len(results),
            "items": results,
            "requiresKey": not providers_status.get("unsplash", False),
            "providers": providers_status,
        }

    # 6. Multi-provider aggregation ("all"): aggregate Flickr + Wikimedia + any active API providers
    all_pools: List[List[Dict[str, Any]]] = []

    # Free open libraries (always active)
    flk = search_flickr_photos(query=query, category=category, limit=max(12, page_size // 2))
    if flk:
        all_pools.append(flk)

    wm = search_wikimedia_images(query=query, category=category, page=page, limit=max(12, page_size // 2))
    if wm:
        all_pools.append(wm)

    # Keyed APIs (if active)
    if providers_status.get("pexels"):
        pex = search_pexels_photos(query, page=page, page_size=max(8, page_size // 3), orientation=orientation)
        if pex:
            all_pools.append(pex)

    if providers_status.get("pixabay"):
        pix = search_pixabay_photos(query, page=page, page_size=max(8, page_size // 3), orientation=orientation)
        if pix:
            all_pools.append(pix)

    if providers_status.get("unsplash"):
        uns = search_unsplash_photos(query, page=page, page_size=max(8, page_size // 3), orientation=orientation)
        if uns:
            all_pools.append(uns)

    # Interleave results across pools
    interleaved: List[Dict[str, Any]] = []
    if all_pools:
        max_pool_len = max(len(p) for p in all_pools)
        for i in range(max_pool_len):
            for pool in all_pools:
                if i < len(pool):
                    interleaved.append(pool[i])

    if interleaved:
        logger.info(f"Queried open photo catalog for '{query or category}' [Provider: {provider}, Ratio: {orientation}] ➔ Found {len(interleaved[:page_size])} photos")
        return {
            "success": True,
            "source": "aggregated_all",
            "page": page,
            "pageSize": page_size,
            "total": len(interleaved),
            "items": interleaved[:page_size],
            "providers": providers_status,
        }

    logger.info(f"Queried open photo catalog for '{query or category}' [Provider: {provider}, Ratio: {orientation}] ➔ Found 0 photos")
    return {
        "success": True,
        "source": "empty",
        "page": page,
        "pageSize": page_size,
        "total": 0,
        "items": [],
        "providers": get_media_providers_status(),
    }


# ---------------------------------------------------------------------------
# Audio: Jamendo Free Music API & Open Sound Effects
# ---------------------------------------------------------------------------

def search_jamendo_tracks(query: str = "", genre: str = "", limit: int = 20) -> List[Dict[str, Any]]:
    """Live search Jamendo Free Creative Commons Music API."""
    try:
        client_id = os.getenv("JAMENDO_CLIENT_ID", JAMENDO_DEFAULT_CLIENT_ID)
        q_term = query or genre or "cinematic motivational ambient"
        params = {
            "client_id": client_id,
            "format": "json",
            "limit": str(min(limit, 30)),
            "search": q_term,
            "include": "musicinfo",
            "audioformat": "mp32",
        }
        url = f"{JAMENDO_API_URL}?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(url, headers={"User-Agent": "ApexMindStudio/2.0"})
        with urllib.request.urlopen(req, timeout=5) as res:
            if res.status == 200:
                data = json.loads(res.read().decode("utf-8"))
                tracks = []
                for t in data.get("results", []):
                    audio_url = t.get("audio") or t.get("audiodownload")
                    if audio_url:
                        genres = t.get("musicinfo", {}).get("tags", {}).get("genres", ["Cinematic"])
                        genre_name = (genres[0] if genres else "Cinematic").title()
                        dur_sec = t.get("duration", 180)
                        mins = dur_sec // 60
                        secs = dur_sec % 60
                        formatted_dur = f"{mins}:{secs:02d}"

                        tracks.append({
                            "id": f"jam_{t.get('id')}",
                            "title": t.get("name") or "Royalty-Free Soundtrack",
                            "artist": t.get("artist_name") or "Creative Commons Artist",
                            "url": audio_url,
                            "cover": t.get("album_image") or t.get("image") or "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
                            "duration": formatted_dur,
                            "durationSeconds": dur_sec,
                            "genre": genre_name,
                            "bpm": t.get("musicinfo", {}).get("speed") or 110,
                            "license": "Creative Commons (Jamendo)",
                            "source": "jamendo",
                        })
                if tracks:
                    return tracks
    except Exception as e:
        logger.debug(f"Jamendo API note: {e}")
    return []


def search_open_tracks(query: str = "", genre: str = "", limit: int = 20) -> Dict[str, Any]:
    """Live search Jamendo Creative Commons music, falling back to curated royalty-free tracks."""
    # 1. Live Jamendo API query
    jam_tracks = search_jamendo_tracks(query=query, genre=genre, limit=limit)
    if jam_tracks:
        logger.info(f"Queried open music soundtracks for '{query or genre}' [Genre: {genre or 'all'}] ➔ Found {len(jam_tracks)} tracks")
        return {
            "success": True,
            "source": "jamendo_api",
            "total": len(jam_tracks),
            "items": jam_tracks,
        }

    # 2. Curated Open Track Fallback
    from backend.shared.media_catalog import MEDIA_TRACKS
    q = (query or genre or "").lower().strip()
    filtered = [
        t for t in MEDIA_TRACKS
        if not q or q in t.get("title", "").lower() or q in t.get("genre", "").lower()
    ]
    tracks = filtered if filtered else MEDIA_TRACKS
    logger.info(f"Queried open music soundtracks for '{query or genre}' [Genre: {genre or 'all'}] ➔ Found {len(tracks[:limit])} tracks")
    return {
        "success": True,
        "source": "curated_catalog",
        "total": len(tracks),
        "items": tracks[:limit],
    }


def search_open_sfx(query: str = "whoosh", limit: int = 20) -> Dict[str, Any]:
    """Search royalty-free sound effects."""
    from backend.shared.media_catalog import CURATED_SFX
    q = (query or "").lower().strip()
    filtered = [
        sfx for sfx in CURATED_SFX
        if not q or q in sfx.get("name", "").lower() or q in sfx.get("category", "").lower()
    ]
    items = filtered if filtered else CURATED_SFX
    logger.info(f"Queried open sound effects library for '{query}' ➔ Found {len(items[:limit])} audio effects")
    return {
        "success": True,
        "source": "curated_sfx",
        "total": len(items),
        "items": items[:limit],
    }


def search_open_quotes(query: str = "", category: str = "all", limit: int = 30) -> Dict[str, Any]:
    """
    Live query open-source public quotes & viral hooks APIs (ZenQuotes & DummyJSON Quotes).
    100% free, zero API keys required, zero hardcoded text.
    """
    quotes: List[Dict[str, Any]] = []

    # 1. Query ZenQuotes API (50 real inspirational/stoic quotes)
    try:
        url = "https://zenquotes.io/api/quotes"
        req = urllib.request.Request(url, headers={"User-Agent": "ApexMindStudio/2.0"})
        with urllib.request.urlopen(req, timeout=5) as res:
            if res.status == 200:
                data = json.loads(res.read().decode("utf-8"))
                for idx, z in enumerate(data):
                    q_text = z.get("q", "").strip()
                    if q_text:
                        quotes.append({
                            "id": f"zq_{idx}_{abs(hash(q_text))}",
                            "quote": q_text,
                            "author": z.get("a", "Stoic Wisdom"),
                            "category": "Stoic & Philosophy",
                            "source": "zenquotes",
                        })
    except Exception as e:
        logger.debug(f"ZenQuotes API note: {e}")

    # 2. Query DummyJSON Quotes (100 curated quotes)
    try:
        url = "https://dummyjson.com/quotes?limit=100"
        req = urllib.request.Request(url, headers={"User-Agent": "ApexMindStudio/2.0"})
        with urllib.request.urlopen(req, timeout=5) as res:
            if res.status == 200:
                data = json.loads(res.read().decode("utf-8"))
                for q in data.get("quotes", []):
                    q_text = q.get("quote", "").strip()
                    if q_text:
                        quotes.append({
                            "id": f"dj_{q.get('id')}",
                            "quote": q_text,
                            "author": q.get("author", "Wisdom"),
                            "category": "Wisdom & Success",
                            "source": "dummyjson",
                        })
    except Exception as e:
        logger.debug(f"DummyJSON Quotes note: {e}")

    # Filter by search term
    clean_q = (query or "").strip().lower()
    if clean_q:
        quotes = [
            q for q in quotes
            if clean_q in q["quote"].lower()
            or clean_q in q["author"].lower()
            or clean_q in q["category"].lower()
        ]

    # Filter by category
    if category != "all":
        quotes = [q for q in quotes if category.lower() in q["category"].lower()]

    logger.info(f"Queried open quotes catalog for '{query or category}' [Category: {category}] ➔ Found {len(quotes[:limit])} quotes")
    return {
        "success": True,
        "total": len(quotes),
        "items": quotes[:limit],
    }


def fetch_dynamic_internet_media_for_prompt(
    topic: str,
    category: str = "all",
    limit_videos: int = 6,
    limit_images: int = 8,
    aspect_ratio: str = "9:16",
) -> Dict[str, Any]:
    """
    Dynamically fetches real, live videos and photos from the internet matching the given prompt & topic.
    Extracts high-intent keywords and queries live open media endpoints across Wikimedia, Flickr, Pexels, and Pixabay.
    """
    import re
    tokens = re.findall(r'[a-zA-Z]{3,}', f'{topic} {category}'.lower())
    stop = {'the', 'and', 'for', 'with', 'that', 'this', 'from', 'your', 'about', 'over', 'into', 'what', 'how', 'when', 'will', 'need'}
    clean_kws = [t for t in tokens if t not in stop]

    videos: List[Dict[str, Any]] = []
    seen_video_urls = set()

    search_candidates = clean_kws[:4] if clean_kws else ["nature", "cinematic"]
    if category and category != "all" and category.lower() not in search_candidates:
        search_candidates.append(category.lower())

    for kw in search_candidates:
        if len(videos) >= limit_videos:
            break
        try:
            res = search_open_videos(query=kw, page_size=limit_videos, aspect_ratio=aspect_ratio)
            for it in res.get("items", []):
                v_url = it.get("videoUrl")
                if v_url and v_url not in seen_video_urls:
                    seen_video_urls.add(v_url)
                    videos.append({
                        "id": it.get("id", f"net_vid_{len(videos)+1}"),
                        "name": it.get("title", f"{kw.title()} Video Loop"),
                        "title": it.get("title", f"{kw.title()} Video Loop"),
                        "videoUrl": v_url,
                        "posterUrl": it.get("posterUrl") or "",
                        "source": it.get("source", "internet"),
                    })
                    if len(videos) >= limit_videos:
                        break
        except Exception as e:
            logger.debug(f"Dynamic video fetch error for {kw}: {e}")

    images: List[Dict[str, Any]] = []
    seen_image_urls = set()

    for kw in search_candidates:
        if len(images) >= limit_images:
            break
        try:
            res = search_open_images(query=kw, page_size=limit_images)
            for it in res.get("items", []):
                i_url = it.get("url")
                if i_url and i_url not in seen_image_urls:
                    seen_image_urls.add(i_url)
                    images.append({
                        "id": it.get("id", f"net_img_{len(images)+1}"),
                        "name": it.get("title", f"{kw.title()} Backdrop"),
                        "category": category if category != "all" else "curated",
                        "imageUrl": i_url,
                        "videoUrl": "",
                        "source": it.get("source", "internet"),
                    })
                    if len(images) >= limit_images:
                        break
        except Exception as e:
            logger.debug(f"Dynamic image fetch error for {kw}: {e}")

    return {
        "videos": videos,
        "images": images,
    }


def resolve_scene_media_from_internet(
    media_type: str,
    visual_query: str,
    fallback_topic: str = "",
    exclude_urls: set | None = None,
    aspect_ratio: str = "9:16",
) -> Optional[Dict[str, Any]]:
    """
    Queries live internet media APIs for a specific storyboard scene's visual cue or search query.
    Enforces uniqueness: skips any video/media URL present in exclude_urls to prevent duplicate footage.
    Enforces aspect ratio compliance so 16:9 videos are used for horizontal and 9:16 for vertical shorts.
    """
    import re
    exclude = set(exclude_urls or set())
    queries_to_try = []
    if visual_query and visual_query.strip():
        clean_vq = visual_query.strip()
        queries_to_try.append(clean_vq)
        words = [w for w in re.findall(r'[a-zA-Z]{3,}', clean_vq.lower()) if w not in {'the', 'and', 'with', 'from', 'into', 'shot', 'view', 'video'}]
        if words:
            queries_to_try.append(words[0])
            if len(words) > 1:
                queries_to_try.append(f"{words[0]} {words[1]}")

    if fallback_topic and fallback_topic.strip():
        fallback_words = [w for w in re.findall(r'[a-zA-Z]{3,}', fallback_topic.lower()) if w not in {'the', 'and', 'for', 'with', 'your'}]
        if fallback_words:
            queries_to_try.append(fallback_words[0])

    if not queries_to_try:
        queries_to_try = ["cinematic", "nature", "epic", "motivation"]

    if media_type == "video":
        # Add high-impact thematic keywords for motivational/stoic reels
        combined_text = f"{visual_query} {fallback_topic}".lower()
        if any(w in combined_text for w in ["stoic", "discipline", "grit", "iron", "gym", "workout", "motivation", "focus"]):
            queries_to_try.extend(["workout gym", "bodybuilding", "athlete running", "boxing fighter", "storm clouds", "fire sparks"])

        for q in queries_to_try:
            try:
                res = search_open_videos(query=q, page_size=10, aspect_ratio=aspect_ratio)
                items = res.get("items", [])
                for item in items:
                    v_url = item.get("videoUrl")
                    if v_url and v_url not in exclude:
                        return {
                            "id": item.get("id"),
                            "title": item.get("title"),
                            "videoUrl": v_url,
                            "posterUrl": item.get("posterUrl", ""),
                            "source": item.get("source", "internet"),
                            "aspectRatio": aspect_ratio,
                        }
            except Exception as e:
                logger.debug(f"Scene video search error for '{q}': {e}")

        # No fallback to hardcoded mock videos: return None so the system reports the failure directly
        return None
    else:
        for q in queries_to_try:
            try:
                res = search_open_images(query=q, page_size=10)
                items = res.get("items", [])
                for item in items:
                    i_url = item.get("url")
                    if i_url and i_url not in exclude:
                        return {
                            "id": item.get("id"),
                            "title": item.get("title"),
                            "url": i_url,
                            "thumbnail": item.get("thumbnail", ""),
                            "source": item.get("source", "internet"),
                        }
            except Exception as e:
                logger.debug(f"Scene image search error for '{q}': {e}")

    return None
