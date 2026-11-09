"""
backend/features/workspace/video/providers/google.py
Google Custom Search Engine (CSE) provider for curated vertical and cinematic stock videos.
Extracts direct MP4 stream links via schema.org VideoObject and OpenGraph metadata.
"""

import os
import time
import urllib.parse
import logging
from typing import Any, Dict, List
import requests

from .base import BaseVideoProvider

logger = logging.getLogger("ApexMind.Workspace.Video.Google")

GOOGLE_SEARCH_API_ENDPOINT: str = "https://www.googleapis.com/customsearch/v1"


class GoogleVideoProvider(BaseVideoProvider):
    name = "google_cse"
    display_name = "Google CSE Video Engine"
    _cooldown_until: float = 0.0

    def is_configured(self) -> bool:
        if GoogleVideoProvider._cooldown_until and time.time() < GoogleVideoProvider._cooldown_until:
            return False
        api_key = os.getenv("GOOGLE_SEARCH_API_KEY") or os.getenv("GEMINI_API_KEY")
        cse_id = os.getenv("GOOGLE_CSE_ID")
        return bool(api_key and cse_id)

    def search(
        self,
        query: str = "",
        aspect_ratio: str = "9:16",
        page: int = 1,
        page_size: int = 20,
    ) -> List[Dict[str, Any]]:
        api_key = os.getenv("GOOGLE_SEARCH_API_KEY") or os.getenv("GEMINI_API_KEY")
        cse_id = os.getenv("GOOGLE_CSE_ID")
        if not api_key or not cse_id:
            return []

        clean_q = (query or "").strip().replace("#", "").strip()
        if not clean_q or clean_q.lower() in ["all", "cinematic", "stock", "cinematic stock video background loop"]:
            clean_q = "cinematic vertical 9:16"

        orient_tag = "vertical 9:16 short" if aspect_ratio in ["9:16", "4:5"] else "cinematic 16:9 loop"
        domains = "(site:pexels.com/video OR site:pixabay.com/videos OR site:coverr.co OR site:mixkit.co OR site:videvo.net)"
        search_query = f"{clean_q} {orient_tag} {domains}"
        start_idx = max(1, (page - 1) * page_size + 1)

        params = {
            "key": api_key,
            "cx": cse_id,
            "q": search_query,
            "num": str(min(page_size, 10)),
            "start": str(start_idx),
            "safe": "active",
        }
        url = f"{GOOGLE_SEARCH_API_ENDPOINT}?{urllib.parse.urlencode(params)}"

        try:
            resp = requests.get(url, timeout=6)
            if resp.status_code != 200:
                if resp.status_code in (403, 429):
                    GoogleVideoProvider._cooldown_until = time.time() + 3600
                return []
            data = resp.json()
        except Exception as e:
            logger.warning(f"Google CSE error: {e}")
            return []

        results: List[Dict[str, Any]] = []
        items = data.get("items", [])

        for idx, it in enumerate(items):
            pagemap = it.get("pagemap", {})
            v_obj = pagemap.get("videoobject", [])
            cse_img = pagemap.get("cse_image", [])
            metatags = pagemap.get("metatags", [{}])[0] if pagemap.get("metatags") else {}

            video_url = ""
            if v_obj:
                video_url = v_obj[0].get("contenturl") or v_obj[0].get("url") or ""
            if not video_url:
                video_url = metatags.get("og:video") or metatags.get("og:video:url") or ""

            if not video_url or not video_url.startswith("http"):
                continue

            thumb_url = ""
            if cse_img:
                thumb_url = cse_img[0].get("src", "")
            if not thumb_url:
                thumb_url = metatags.get("og:image", "")

            title = it.get("title", f"Curated Video {idx+1}")
            results.append(
                self.format_video(
                    id=f"google_v_{idx}_{hash(video_url) % 100000}",
                    title=title,
                    video_url=video_url,
                    preview_url=video_url,
                    poster_url=thumb_url,
                    duration=15.0,
                    resolution="1080p HD",
                    aspect_ratio=aspect_ratio,
                    provider="google_cse",
                    aesthetic_badges=["Google CSE Curated", "HD"],
                    aesthetic_score=0.90,
                    tags=["google_cse", "web_curated"],
                )
            )

        return results

