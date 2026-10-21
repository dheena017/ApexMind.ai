"""
backend/features/media/providers/video_pixabay.py
Pixabay API video provider adapter. Queries Pixabay Video API for royalty-free stock loops.
"""

import os
import logging
from typing import List, Dict, Any
import requests

from backend.features.media.base import BaseMediaProvider, MediaAsset

logger = logging.getLogger("ApexMind.media.pixabay")


class PixabayVideoProvider(BaseMediaProvider):
    @property
    def name(self) -> str:
        return "pixabay"

    @property
    def supported_types(self) -> List[str]:
        return ["video", "image"]

    def is_configured(self) -> bool:
        return bool(os.getenv("PIXABAY_API_KEY"))

    def search(
        self,
        query: str,
        media_type: str = "video",
        limit: int = 10,
        aspect_ratio: str = "9:16",
        page: int = 1,
        **kwargs,
    ) -> List[MediaAsset]:
        api_key = os.getenv("PIXABAY_API_KEY")
        if not api_key:
            return []

        clean_q = (query or "").strip().replace("#", "").strip() or "cinematic nature"
        url = "https://pixabay.com/api/videos/"
        params = {
            "key": api_key,
            "q": clean_q,
            "per_page": min(limit, 20),
            "page": page,
            "safesearch": "true",
            "video_type": "film",
        }

        try:
            resp = requests.get(url, params=params, timeout=5)
            if resp.status_code != 200:
                logger.warning(f"Pixabay video API returned {resp.status_code}")
                return []
            data = resp.json()
        except Exception as e:
            logger.warning(f"Pixabay video API request failed: {e}")
            return []

        videos: List[MediaAsset] = []
        for hit in data.get("hits", []):
            videos_obj = hit.get("videos", {})
            chosen = (
                videos_obj.get("large")
                or videos_obj.get("medium")
                or videos_obj.get("small")
                or {}
            )
            v_url = chosen.get("url", "")
            if v_url and v_url.startswith("http"):
                picture_id = hit.get("picture_id", "")
                poster_url = (
                    f"https://i.vimeocdn.com/video/{picture_id}_640x360.jpg"
                    if picture_id
                    else ""
                )
                w = chosen.get("width", 1080)
                h = chosen.get("height", 1920)

                videos.append(
                    MediaAsset(
                        id=f"pixabay_vid_{hit.get('id')}",
                        mediaType="video",
                        title=hit.get("tags") or "Pixabay Nature Video",
                        url=v_url,
                        previewUrl=poster_url or v_url,
                        thumbnailUrl=poster_url or v_url,
                        duration=float(hit.get("duration", 10.0)),
                        resolution=f"{w}x{h}",
                        aspectRatio=aspect_ratio,
                        provider="pixabay",
                        extraMetadata={
                            "author": hit.get("user"),
                            "sourceUrl": hit.get("pageURL"),
                        },
                    )
                )

        return videos
