"""
backend/features/media/providers/video_wikimedia.py
Wikimedia Commons keyless video provider adapter. Queries public domain video media with zero API keys required.
"""

import logging
from typing import List, Dict, Any
import requests

from backend.features.media.base import BaseMediaProvider, MediaAsset

logger = logging.getLogger("ApexMind.media.wikimedia")


class WikimediaVideoProvider(BaseMediaProvider):
    @property
    def name(self) -> str:
        return "wikimedia"

    @property
    def supported_types(self) -> List[str]:
        return ["video", "image"]

    def is_configured(self) -> bool:
        return True  # Keyless public domain access

    def search(
        self,
        query: str,
        media_type: str = "video",
        limit: int = 10,
        aspect_ratio: str = "9:16",
        page: int = 1,
        **kwargs,
    ) -> List[MediaAsset]:
        clean_q = (query or "").strip().replace("#", "").strip() or "cinematic nature"
        endpoint = "https://commons.wikimedia.org/w/api.php"
        is_image_mode = (media_type == "image")
        search_term = f"{clean_q} filetype:bitmap" if is_image_mode else f"{clean_q} filetype:video"

        gsr_limit = min(limit, 20)
        params = {
            "action": "query",
            "generator": "search",
            "gsrsearch": search_term,
            "gsrnamespace": "6",
            "gsrlimit": gsr_limit,
            "prop": "imageinfo",
            "iiprop": "url|size|mime|extmetadata",
            "format": "json",
        }
        if page > 1:
            params["gsroffset"] = (page - 1) * gsr_limit
        headers = {"User-Agent": "ApexMindStudio/2.0 (MediaDiscovery; contact@apexmind.ai)"}

        try:
            resp = requests.get(endpoint, params=params, headers=headers, timeout=6)
            if resp.status_code != 200:
                return []
            data = resp.json()
        except Exception as e:
            logger.debug(f"Wikimedia API error: {e}")
            return []

        pages = data.get("query", {}).get("pages", {})
        results: List[MediaAsset] = []

        for page_id, page_data in pages.items():
            imageinfo = page_data.get("imageinfo", [])
            if not imageinfo:
                continue
            info = imageinfo[0]
            v_url = info.get("url", "")
            mime = info.get("mime", "")

            if is_image_mode:
                if v_url and ("image" in mime or v_url.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))):
                    raw_title = page_data.get("title", "Wikimedia Photo").replace("File:", "")
                    for ext in [".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG"]:
                        raw_title = raw_title.replace(ext, "")
                    results.append(
                        MediaAsset(
                            id=f"wiki_img_{page_id}",
                            mediaType="image",
                            title=raw_title.strip(),
                            url=v_url,
                            previewUrl=info.get("thumburl") or v_url,
                            thumbnailUrl=info.get("thumburl") or v_url,
                            duration=8.0,
                            resolution=f"{info.get('width', 1080)}x{info.get('height', 1920)}",
                            aspectRatio=aspect_ratio,
                            provider="wikimedia",
                            extraMetadata={"sourceUrl": info.get("descriptionurl", "")},
                        )
                    )
            else:
                if v_url and ("video" in mime or v_url.endswith((".webm", ".ogv", ".mp4"))):
                    raw_title = page_data.get("title", "Wikimedia Video").replace("File:", "").replace(".webm", "").replace(".ogv", "").replace(".mp4", "")
                    results.append(
                        MediaAsset(
                            id=f"wiki_vid_{page_id}",
                            mediaType="video",
                            title=raw_title.strip(),
                            url=v_url,
                            previewUrl=info.get("thumburl") or v_url,
                            thumbnailUrl=info.get("thumburl") or v_url,
                            duration=10.0,
                            resolution=f"{info.get('width', 1080)}x{info.get('height', 1920)}",
                            aspectRatio=aspect_ratio,
                            provider="wikimedia",
                            extraMetadata={"sourceUrl": info.get("descriptionurl", "")},
                        )
                    )

        return results
