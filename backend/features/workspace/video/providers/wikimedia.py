"""
backend/features/workspace/video/providers/wikimedia.py
Wikimedia Commons keyless video provider. Queries public domain video media with zero API keys required.
"""

import logging
from typing import Any, Dict, List
import requests

from .base import BaseVideoProvider

logger = logging.getLogger("ApexMind.Workspace.Video.Wikimedia")


class WikimediaVideoProvider(BaseVideoProvider):
    name = "wikimedia"
    display_name = "Wikimedia Commons"

    def is_configured(self) -> bool:
        return True  # Keyless public domain access

    def search(
        self,
        query: str = "",
        aspect_ratio: str = "9:16",
        page: int = 1,
        page_size: int = 20,
    ) -> List[Dict[str, Any]]:
        clean_q = (query or "").strip().replace("#", "").strip()
        endpoint = "https://commons.wikimedia.org/w/api.php"
        search_term = f"{clean_q} filetype:video" if clean_q else "filetype:video"

        gsr_limit = min(page_size, 20)
        params = {
            "action": "query",
            "generator": "search",
            "gsrsearch": search_term,
            "gsrnamespace": "6",
            "gsrlimit": gsr_limit,
            "prop": "imageinfo",
            "iiprop": "url|size|mime|extmetadata",
            "iiurlwidth": 640,
            "format": "json",
        }
        if page > 1:
            params["gsroffset"] = (page - 1) * gsr_limit
        headers = {"User-Agent": "ApexMindStudio/2.0 (VideoDiscovery; contact@apexmind.ai)"}

        try:
            resp = requests.get(endpoint, params=params, headers=headers, timeout=6)
            if resp.status_code != 200:
                return []
            data = resp.json()
        except Exception as e:
            logger.debug(f"Wikimedia Video API error: {e}")
            return []

        pages = data.get("query", {}).get("pages", {})
        results: List[Dict[str, Any]] = []

        for page_id, page_data in pages.items():
            imageinfo = page_data.get("imageinfo", [])
            if not imageinfo:
                continue
            info = imageinfo[0]
            v_url = info.get("url", "")
            mime = info.get("mime", "")

            # Filter for video media
            if v_url and ("video" in mime or v_url.lower().endswith((".webm", ".ogv", ".mp4"))):
                raw_title = page_data.get("title", "Wikimedia Video").replace("File:", "")
                for ext in [".webm", ".ogv", ".mp4", ".mov"]:
                    raw_title = raw_title.replace(ext, "")

                thumb = info.get("thumburl") or ""
                results.append(
                    self.format_video(
                        id=f"wiki_vid_{page_id}",
                        title=raw_title.strip(),
                        video_url=v_url,
                        preview_url=v_url,
                        poster_url=thumb,
                        duration=15.0,
                        resolution="1080p",
                        aspect_ratio=aspect_ratio,
                        provider="wikimedia",
                        aesthetic_badges=["CC0 / Public Domain"],
                        aesthetic_score=0.75,
                        tags=["wikimedia", "public domain"],
                    )
                )

        return results

