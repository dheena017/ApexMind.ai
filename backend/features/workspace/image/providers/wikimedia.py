"""
backend/features/workspace/image/providers/wikimedia.py
Wikimedia Commons keyless photo provider. Queries public domain cultural and modern photography with zero API keys.
"""

import logging
from typing import Any, Dict, List
import requests

from .base import BaseImageProvider

logger = logging.getLogger("ApexMind.Workspace.Image.Wikimedia")

WIKIMEDIA_ENDPOINT: str = "https://commons.wikimedia.org/w/api.php"


class WikimediaImageProvider(BaseImageProvider):
    name = "wikimedia"
    display_name = "Wikimedia Commons"

    def is_configured(self) -> bool:
        return True  # Keyless public domain access

    def search(
        self,
        query: str = "",
        orientation: str = "portrait",
        page: int = 1,
        page_size: int = 24,
    ) -> List[Dict[str, Any]]:
        clean_q = (query or "").strip().replace("#", "").strip()
        search_term = f"{clean_q} filetype:bitmap" if clean_q else "filetype:bitmap"

        gsr_limit = min(page_size, 30)
        params = {
            "action": "query",
            "generator": "search",
            "gsrsearch": search_term,
            "gsrnamespace": "6",
            "gsrlimit": gsr_limit,
            "prop": "imageinfo",
            "iiprop": "url|size|mime|extmetadata",
            "iiurlwidth": 800,
            "format": "json",
        }
        if page > 1:
            params["gsroffset"] = (page - 1) * gsr_limit
        headers = {"User-Agent": "ApexMindStudio/2.0 (ImageDiscovery; contact@apexmind.ai)"}

        try:
            resp = requests.get(WIKIMEDIA_ENDPOINT, params=params, headers=headers, timeout=6)
            if resp.status_code != 200:
                return []
            data = resp.json()
        except Exception as e:
            logger.debug(f"Wikimedia Image API error: {e}")
            return []

        pages = data.get("query", {}).get("pages", {})
        results: List[Dict[str, Any]] = []
        ar_str = "9:16" if orientation in ["portrait", "9:16"] else "16:9"

        for page_id, page_data in pages.items():
            imageinfo = page_data.get("imageinfo", [])
            if not imageinfo:
                continue
            info = imageinfo[0]
            img_url = info.get("url", "")
            mime = info.get("mime", "")

            if img_url and ("image" in mime or img_url.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))):
                raw_title = page_data.get("title", "Wikimedia Photo").replace("File:", "")
                for ext in [".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG"]:
                    raw_title = raw_title.replace(ext, "")

                thumb_url = info.get("thumburl") or img_url
                results.append(
                    self.format_image(
                        id=f"wiki_img_{page_id}",
                        title=raw_title.strip(),
                        image_url=img_url,
                        preview_url=thumb_url,
                        thumbnail_url=thumb_url,
                        author="Wikimedia Commons",
                        aspect_ratio=ar_str,
                        provider="wikimedia",
                        tags=["wikimedia", "public domain"],
                        width=info.get("width"),
                        height=info.get("height"),
                    )
                )

        return results

