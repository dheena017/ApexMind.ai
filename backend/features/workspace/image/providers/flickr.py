"""
backend/features/workspace/image/providers/flickr.py
Flickr Open Public Feed Image Provider.
Queries Flickr's public image feed without API key requirement for real-world high-resolution photography.
"""

import logging
import re
from typing import Any, Dict, List
import requests

from .base import BaseImageProvider

logger = logging.getLogger("ApexMind.Workspace.Image.Flickr")

FLICKR_FEED_ENDPOINT: str = "https://www.flickr.com/services/feeds/photos_public.gne"


class FlickrImageProvider(BaseImageProvider):
    name = "flickr"
    display_name = "Flickr Public Stream"

    def is_configured(self) -> bool:
        return True  # 100% Free and public

    def search(
        self,
        query: str = "",
        orientation: str = "portrait",
        page: int = 1,
        page_size: int = 24,
    ) -> List[Dict[str, Any]]:
        clean_q = (query or "").strip().replace("#", "").replace(" ", ",").strip()
        params = {
            "format": "json",
            "nojsoncallback": "1",
        }
        if clean_q:
            params["tags"] = clean_q
        headers = {
            "User-Agent": "ApexMindStudio/2.0 (PublicStock; https://apexmind.ai)"
        }

        try:
            resp = requests.get(FLICKR_FEED_ENDPOINT, params=params, headers=headers, timeout=5)
            if resp.status_code != 200:
                return []
            data = resp.json()
        except Exception as e:
            logger.debug(f"Flickr public feed error: {e}")
            return []

        items = data.get("items", [])
        results: List[Dict[str, Any]] = []
        ar_str = "9:16" if orientation in ["portrait", "9:16"] else "16:9"

        for idx, item in enumerate(items[:page_size]):
            media = item.get("media", {})
            m_url = media.get("m", "")
            if not m_url:
                continue

            highres_url = m_url.replace("_m.jpg", "_b.jpg")
            thumb_url = m_url.replace("_m.jpg", "_n.jpg")

            raw_author = item.get("author", "Flickr Photographer")
            author_match = re.search(r'\("(.*?)"\)', raw_author)
            clean_author = author_match.group(1) if author_match else raw_author
            title = item.get("title", "").strip() or f"Flickr Photo {idx+1}"

            results.append(
                self.format_image(
                    id=f"flickr_{idx}_{hash(m_url) % 100000}",
                    title=title,
                    image_url=highres_url,
                    preview_url=m_url,
                    thumbnail_url=thumb_url,
                    author=clean_author,
                    aspect_ratio=ar_str,
                    provider="flickr",
                    tags=[t.strip() for t in item.get("tags", "").split() if t.strip()],
                )
            )

        return results

