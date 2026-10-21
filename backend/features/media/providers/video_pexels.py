"""
backend/features/media/providers/video_pexels.py
Pexels API video provider adapter. Queries official Pexels Videos API for vertical or landscape HD clips.
"""

import os
import logging
from typing import List, Dict, Any
import requests

from backend.features.media.base import BaseMediaProvider, MediaAsset

logger = logging.getLogger("ApexMind.media.pexels")


class PexelsVideoProvider(BaseMediaProvider):
    @property
    def name(self) -> str:
        return "pexels"

    @property
    def supported_types(self) -> List[str]:
        return ["video", "image"]

    def is_configured(self) -> bool:
        return bool(os.getenv("PEXELS_API_KEY"))

    def search(
        self,
        query: str,
        media_type: str = "video",
        limit: int = 10,
        aspect_ratio: str = "9:16",
        page: int = 1,
        **kwargs,
    ) -> List[MediaAsset]:
        api_key = os.getenv("PEXELS_API_KEY")
        if not api_key:
            return []

        orientation = "portrait" if aspect_ratio in ["9:16", "4:5"] else "landscape"
        clean_q = (query or "").strip().replace("#", "").strip() or "cinematic nature vertical"

        url = "https://api.pexels.com/videos/search"
        headers = {"Authorization": api_key}
        params = {
            "query": clean_q,
            "per_page": min(limit, 20),
            "page": page,
            "orientation": orientation,
        }

        try:
            resp = requests.get(url, headers=headers, params=params, timeout=5)
            if resp.status_code != 200:
                logger.warning(f"Pexels video API returned {resp.status_code}")
                return []
            data = resp.json()
        except Exception as e:
            logger.warning(f"Pexels video API request failed: {e}")
            return []

        videos: List[MediaAsset] = []
        for it in data.get("videos", []):
            video_files = it.get("video_files", [])
            # Prioritize HD 1080p or 720p matching orientation
            matched_file = None
            for vf in sorted(video_files, key=lambda x: (x.get("width", 0) * x.get("height", 0)), reverse=True):
                vf_link = vf.get("link", "")
                if vf_link.startswith("http") and vf.get("file_type") == "video/mp4":
                    w = vf.get("width", 0)
                    h = vf.get("height", 0)
                    if orientation == "portrait" and h > w:
                        matched_file = vf
                        break
                    elif orientation == "landscape" and w >= h:
                        matched_file = vf
                        break

            if not matched_file and video_files:
                matched_file = video_files[0]

            if matched_file and matched_file.get("link"):
                v_link = matched_file["link"]
                v_width = matched_file.get("width", 1080)
                v_height = matched_file.get("height", 1920)
                videos.append(
                    MediaAsset(
                        id=f"pexels_vid_{it.get('id')}",
                        mediaType="video",
                        title=it.get("user", {}).get("name", "Pexels Video"),
                        url=v_link,
                        previewUrl=it.get("image") or it.get("video_pictures", [{}])[0].get("picture") or "",
                        thumbnailUrl=it.get("image") or "",
                        duration=float(it.get("duration", 10.0)),
                        resolution=f"{v_width}x{v_height}",
                        aspectRatio=aspect_ratio,
                        provider="pexels",
                        extraMetadata={
                            "author": it.get("user", {}).get("name"),
                            "sourceUrl": it.get("url"),
                        },
                    )
                )

        return videos
