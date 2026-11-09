"""
backend/features/workspace/image/providers/pixabay.py
Pixabay API stock photos provider. Queries official Pixabay Images API.
"""

import os
import logging
from typing import Any, Dict, List
import requests

from .base import BaseImageProvider

logger = logging.getLogger("ApexMind.Workspace.Image.Pixabay")

PIXABAY_IMAGES_ENDPOINT: str = "https://pixabay.com/api/"


class PixabayImageProvider(BaseImageProvider):
    name = "pixabay"
    display_name = "Pixabay Photography"

    def is_configured(self) -> bool:
        key = (os.getenv("PIXABAY_API_KEY") or "").strip().strip('"').strip("'")
        return bool(key) and not key.startswith("your_")

    def search(
        self,
        query: str = "",
        orientation: str = "portrait",
        page: int = 1,
        page_size: int = 24,
    ) -> List[Dict[str, Any]]:
        api_key = (os.getenv("PIXABAY_API_KEY") or "").strip().strip('"').strip("'")
        if not api_key:
            return []

        clean_q = (query or "").strip().replace("#", "").strip() or "cinematic"
        orient_param = "vertical" if orientation in ["portrait", "9:16", "4:5"] else "horizontal"

        params = {
            "key": api_key,
            "q": clean_q,
            "image_type": "photo",
            "orientation": orient_param,
            "per_page": max(3, min(page_size, 50)),
            "page": page,
            "safesearch": "true",
        }

        try:
            resp = requests.get(PIXABAY_IMAGES_ENDPOINT, params=params, timeout=6)
            if resp.status_code != 200:
                logger.warning(f"Pixabay Image API error: {resp.status_code}")
                return []
            data = resp.json()
        except Exception as e:
            logger.warning(f"Pixabay Image API request failed: {e}")
            return []

        results: List[Dict[str, Any]] = []
        hits = data.get("hits", [])
        ar_str = "9:16" if orient_param == "vertical" else "16:9"

        for hit in hits:
            img_url = hit.get("largeImageURL") or hit.get("webformatURL")
            if not img_url:
                continue

            thumb_url = hit.get("previewURL") or hit.get("webformatURL") or img_url
            author = hit.get("user", "Pixabay Photographer")
            tags = [t.strip() for t in hit.get("tags", "").split(",") if t.strip()]
            title = tags[0].capitalize() if tags else f"Photo by {author}"

            results.append(
                self.format_image(
                    id=f"pixabay_img_{hit.get('id')}",
                    title=title,
                    image_url=img_url,
                    preview_url=hit.get("webformatURL") or img_url,
                    thumbnail_url=thumb_url,
                    author=author,
                    aspect_ratio=ar_str,
                    provider="pixabay",
                    tags=tags,
                    width=hit.get("imageWidth"),
                    height=hit.get("imageHeight"),
                )
            )

        return results

