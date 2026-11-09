"""
backend/features/workspace/video/providers/pixabay.py
Pixabay API video provider. Queries Pixabay Video API for royalty-free stock loops and motion clips.
"""

import os
import logging
from typing import Any, Dict, List
import requests

from .base import BaseVideoProvider

logger = logging.getLogger("ApexMind.Workspace.Video.Pixabay")

PIXABAY_VIDEOS_ENDPOINT: str = "https://pixabay.com/api/videos/"


class PixabayVideoProvider(BaseVideoProvider):
    name = "pixabay"
    display_name = "Pixabay Videos"

    def is_configured(self) -> bool:
        key = (os.getenv("PIXABAY_API_KEY") or "").strip().strip('"').strip("'")
        return bool(key) and not key.startswith("your_")

    def search(
        self,
        query: str = "",
        aspect_ratio: str = "9:16",
        page: int = 1,
        page_size: int = 20,
    ) -> List[Dict[str, Any]]:
        api_key = (os.getenv("PIXABAY_API_KEY") or "").strip().strip('"').strip("'")
        if not api_key:
            return []

        clean_q = (query or "").strip().replace("#", "").strip() or "cinematic"
        params = {
            "key": api_key,
            "q": clean_q,
            "video_type": "film",
            "per_page": min(page_size, 30),
            "page": page,
            "safesearch": "true",
        }

        try:
            resp = requests.get(PIXABAY_VIDEOS_ENDPOINT, params=params, timeout=6)
            if resp.status_code != 200:
                logger.warning(f"Pixabay Video API error: {resp.status_code}")
                return []
            data = resp.json()
        except Exception as e:
            logger.warning(f"Pixabay Video API request failed: {e}")
            return []

        results: List[Dict[str, Any]] = []
        hits = data.get("hits", [])

        for hit in hits:
            videos = hit.get("videos", {})
            chosen = videos.get("large") or videos.get("medium") or videos.get("small") or {}
            video_url = chosen.get("url")
            if not video_url:
                continue

            preview_obj = videos.get("tiny") or videos.get("small") or chosen
            preview_url = preview_obj.get("url") or video_url

            poster_url = hit.get("userImageURL") or ""
            thumb_match = hit.get("picture_id")
            if thumb_match:
                poster_url = f"https://i.vimeocdn.com/video/{thumb_match}_640x360.jpg"

            w = chosen.get("width") or 1920
            h = chosen.get("height") or 1080
            res_str = f"{w}x{h}"

            results.append(
                self.format_video(
                    id=f"pixabay_v_{hit.get('id')}",
                    title=f"Pixabay Video {hit.get('id')}",
                    video_url=video_url,
                    preview_url=preview_url,
                    poster_url=poster_url,
                    duration=float(hit.get("duration", 10.0)),
                    resolution=res_str,
                    aspect_ratio=aspect_ratio,
                    provider="pixabay",
                    aesthetic_badges=["HD", "Free License"],
                    aesthetic_score=0.88,
                    tags=[t.strip() for t in hit.get("tags", "").split(",") if t.strip()],
                )
            )

        return results

