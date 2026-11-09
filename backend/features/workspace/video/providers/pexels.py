"""
backend/features/workspace/video/providers/pexels.py
Pexels API video provider. Queries official Pexels Videos API for high-definition vertical and landscape video clips.
"""

import os
import logging
from typing import Any, Dict, List
import requests

from .base import BaseVideoProvider

logger = logging.getLogger("ApexMind.Workspace.Video.Pexels")

PEXELS_VIDEOS_ENDPOINT: str = "https://api.pexels.com/videos/search"


class PexelsVideoProvider(BaseVideoProvider):
    name = "pexels"
    display_name = "Pexels Videos"

    def is_configured(self) -> bool:
        key = (os.getenv("PEXELS_API_KEY") or "").strip().strip('"').strip("'")
        return bool(key) and not key.startswith("your_")

    def search(
        self,
        query: str = "",
        aspect_ratio: str = "9:16",
        page: int = 1,
        page_size: int = 20,
    ) -> List[Dict[str, Any]]:
        api_key = (os.getenv("PEXELS_API_KEY") or "").strip().strip('"').strip("'")
        if not api_key:
            return []

        orientation = "portrait" if aspect_ratio in ["9:16", "4:5"] else ("square" if aspect_ratio == "1:1" else "landscape")
        clean_q = (query or "").strip().replace("#", "").strip() or "cinematic background"

        headers = {"Authorization": api_key}
        params = {
            "query": clean_q,
            "per_page": min(page_size, 30),
            "page": page,
            "orientation": orientation,
        }

        try:
            resp = requests.get(PEXELS_VIDEOS_ENDPOINT, headers=headers, params=params, timeout=6)
            if resp.status_code != 200:
                logger.warning(f"Pexels Video API error: {resp.status_code}")
                return []
            data = resp.json()
        except Exception as e:
            logger.warning(f"Pexels Video API request failed: {e}")
            return []

        results: List[Dict[str, Any]] = []
        videos = data.get("videos", [])

        for vid in videos:
            files = vid.get("video_files", [])
            if not files:
                continue

            target_files = [
                f for f in files
                if f.get("file_type") == "video/mp4" or (f.get("link", "").endswith(".mp4"))
            ]
            if not target_files:
                target_files = files

            # Prefer HD / 1080p if available
            chosen = None
            for f in target_files:
                if f.get("quality") == "hd" or (f.get("height") and f.get("height") >= 1080):
                    chosen = f
                    break
            if not chosen:
                chosen = max(target_files, key=lambda x: (x.get("width") or 0) * (x.get("height") or 0))

            video_url = chosen.get("link", "")
            if not video_url:
                continue

            preview_files = [f for f in target_files if f.get("quality") == "sd"]
            preview_url = preview_files[0].get("link") if preview_files else video_url

            w = chosen.get("width") or 1080
            h = chosen.get("height") or 1920
            res_str = f"{w}x{h}"

            pictures = vid.get("video_pictures", [])
            poster_url = pictures[0].get("picture", "") if pictures else vid.get("image", "")

            results.append(
                self.format_video(
                    id=f"pexels_v_{vid.get('id')}",
                    title=f"Pexels Video {vid.get('id')}",
                    video_url=video_url,
                    preview_url=preview_url,
                    poster_url=poster_url,
                    duration=float(vid.get("duration", 10.0)),
                    resolution=res_str,
                    aspect_ratio=aspect_ratio,
                    provider="pexels",
                    aesthetic_badges=["HD", "Curated"],
                    aesthetic_score=0.92,
                    tags=[t.get("name", "") for t in vid.get("tags", []) if isinstance(t, dict)],
                )
            )

        return results

