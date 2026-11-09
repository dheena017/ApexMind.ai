"""
backend/features/workspace/image/providers/pexels.py
Pexels API stock photography provider. Queries official Pexels Photos API.
"""

import os
import logging
from typing import Any, Dict, List
import requests

from .base import BaseImageProvider

logger = logging.getLogger("ApexMind.Workspace.Image.Pexels")

PEXELS_PHOTOS_ENDPOINT: str = "https://api.pexels.com/v1/search"


class PexelsImageProvider(BaseImageProvider):
    name = "pexels"
    display_name = "Pexels Photos"

    def is_configured(self) -> bool:
        key = (os.getenv("PEXELS_API_KEY") or "").strip().strip('"').strip("'")
        return bool(key) and not key.startswith("your_")

    def search(
        self,
        query: str = "",
        orientation: str = "portrait",
        page: int = 1,
        page_size: int = 24,
    ) -> List[Dict[str, Any]]:
        api_key = (os.getenv("PEXELS_API_KEY") or "").strip().strip('"').strip("'")
        if not api_key:
            return []

        clean_q = (query or "").strip().replace("#", "").strip() or "aesthetic"
        orient_param = "portrait"
        if orientation in ["squarish", "1:1", "square"]:
            orient_param = "square"
        elif orientation in ["landscape", "16:9"]:
            orient_param = "landscape"

        headers = {"Authorization": api_key}
        params = {
            "query": clean_q,
            "per_page": min(page_size, 30),
            "page": page,
            "orientation": orient_param,
        }

        try:
            resp = requests.get(PEXELS_PHOTOS_ENDPOINT, headers=headers, params=params, timeout=6)
            if resp.status_code != 200:
                logger.warning(f"Pexels Photo API error: {resp.status_code}")
                return []
            data = resp.json()
        except Exception as e:
            logger.warning(f"Pexels Photo API request failed: {e}")
            return []

        results: List[Dict[str, Any]] = []
        photos = data.get("photos", [])
        ar_str = "9:16" if orient_param == "portrait" else ("1:1" if orient_param == "square" else "16:9")

        for p in photos:
            src = p.get("src", {})
            img_url = src.get("large2x") or src.get("large") or src.get("original") or ""
            if not img_url:
                continue

            thumb_url = src.get("medium") or src.get("small") or img_url
            author = p.get("photographer", "Pexels Photographer")
            title = p.get("alt") or f"Photo by {author}"

            results.append(
                self.format_image(
                    id=f"pexels_img_{p.get('id')}",
                    title=title.capitalize(),
                    image_url=img_url,
                    preview_url=src.get("medium") or img_url,
                    thumbnail_url=thumb_url,
                    author=author,
                    aspect_ratio=ar_str,
                    provider="pexels",
                    width=p.get("width"),
                    height=p.get("height"),
                )
            )

        return results

