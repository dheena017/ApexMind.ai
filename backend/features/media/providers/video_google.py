"""
backend/features/media/providers/video_google.py
Google Custom Search Engine (CSE) provider adapter for genuine vertical/cinematic stock videos.
Extracts direct MP4 stream links via schema.org VideoObject and OpenGraph metadata.
"""

import os
import time
import urllib.parse
import logging
from typing import List, Dict, Any, Optional
import requests

from backend.features.media.base import BaseMediaProvider, MediaAsset

logger = logging.getLogger("ApexMind.media.google")


class GoogleVideoProvider(BaseMediaProvider):
    _cooldown_until: float = 0.0

    @property
    def name(self) -> str:
        return "google_cse"

    @property
    def supported_types(self) -> List[str]:
        return ["video"]

    def is_configured(self) -> bool:
        if GoogleVideoProvider._cooldown_until and time.time() < GoogleVideoProvider._cooldown_until:
            return False
        api_key = os.getenv("GOOGLE_SEARCH_API_KEY") or os.getenv("GEMINI_API_KEY")
        cse_id = os.getenv("GOOGLE_CSE_ID")
        return bool(api_key and cse_id)

    def search(
        self,
        query: str,
        media_type: str = "video",
        limit: int = 10,
        aspect_ratio: str = "9:16",
        page: int = 1,
        **kwargs,
    ) -> List[MediaAsset]:
        api_key = os.getenv("GOOGLE_SEARCH_API_KEY") or os.getenv("GEMINI_API_KEY")
        cse_id = os.getenv("GOOGLE_CSE_ID")
        if not api_key or not cse_id:
            return []

        clean_q = (query or "").strip().replace("#", "").strip()
        if not clean_q or clean_q.lower() in ["all", "cinematic", "stock", "cinematic stock video background loop"]:
            clean_q = "cinematic nature landscape vertical loop"

        orient_tag = "vertical 9:16 short" if aspect_ratio in ["9:16", "4:5"] else "cinematic 16:9 loop"
        domains = "(site:pexels.com/video OR site:pixabay.com/videos OR site:coverr.co OR site:mixkit.co OR site:videvo.net)"
        search_query = f"{clean_q} {orient_tag} {domains}"
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

        try:
            resp = requests.get(url, timeout=6)
            if resp.status_code != 200:
                if resp.status_code in (403, 429):
                    GoogleVideoProvider._cooldown_until = time.time() + 3600  # 1 hour cooldown
                    err_reason = "quota exceeded (429)" if resp.status_code == 429 else "access forbidden (403)"
                    logger.debug(f"Google CSE returned {err_reason}. Cooling down for 60m; falling back to Pexels/Pixabay/Wikimedia.")
                else:
                    logger.warning(f"Google CSE search returned {resp.status_code}: {resp.text[:120]}")
                return []
            data = resp.json()
        except Exception as e:
            logger.warning(f"Google CSE request failed: {e}")
            return []

        items = data.get("items", [])
        videos: List[MediaAsset] = []

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
                or meta_tags.get("og:video:secure_url")
                or meta_tags.get("twitter:player:stream")
            )

            poster_url = (
                (video_objs[0].get("thumbnailurl") if video_objs else None)
                or meta_tags.get("og:image")
                or cse_images.get("src")
                or ""
            )

            if direct_video and direct_video.startswith("http") and not direct_video.endswith(".html"):
                videos.append(
                    MediaAsset(
                        id=f"gcse_{it.get('cacheId') or idx+1}",
                        mediaType="video",
                        title=title,
                        url=direct_video,
                        previewUrl=poster_url or direct_video,
                        thumbnailUrl=poster_url or direct_video,
                        duration=12.0,
                        resolution="1080x1920" if aspect_ratio in ["9:16", "4:5"] else "1920x1080",
                        aspectRatio=aspect_ratio,
                        provider="google_cse",
                        extraMetadata={"sourceUrl": it.get("link", "")},
                    )
                )

        return videos
