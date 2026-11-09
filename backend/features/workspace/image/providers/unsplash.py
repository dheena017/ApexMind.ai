"""
backend/features/workspace/image/providers/unsplash.py
Unsplash photos provider. Queries official Unsplash API for high-resolution stock photography.
"""

import os
import logging
from typing import Any, Dict, List
import requests

from .base import BaseImageProvider

logger = logging.getLogger("ApexMind.Workspace.Image.Unsplash")


class UnsplashImageProvider(BaseImageProvider):
    name = "unsplash"
    display_name = "Unsplash Photography"

    def is_configured(self) -> bool:
        key = (os.getenv("UNSPLASH_ACCESS_KEY") or "").strip().strip('"').strip("'")
        return bool(key) and not key.startswith("your_") and key != "..."

    def search(
        self,
        query: str = "",
        orientation: str = "portrait",
        page: int = 1,
        page_size: int = 24,
    ) -> List[Dict[str, Any]]:
        access_key = (os.getenv("UNSPLASH_ACCESS_KEY") or "").strip().strip('"').strip("'")
        if not access_key:
            return []

        clean_q = (query or "").strip().replace("#", "").strip()
        orient_param = "portrait"
        if orientation in ["squarish", "1:1", "square"]:
            orient_param = "squarish"
        elif orientation in ["landscape", "16:9"]:
            orient_param = "landscape"

        headers = {"Authorization": f"Client-ID {access_key}"}
        params = {
            "per_page": min(page_size, 30),
            "page": page,
        }

        if clean_q:
            url = "https://api.unsplash.com/search/photos"
            params["query"] = clean_q
            params["orientation"] = orient_param
        else:
            url = "https://api.unsplash.com/photos"

        try:
            resp = requests.get(url, headers=headers, params=params, timeout=5)
            if resp.status_code != 200:
                logger.warning(f"Unsplash API returned {resp.status_code}")
                return []
            data = resp.json()
        except Exception as e:
            logger.warning(f"Unsplash API request failed: {e}")
            return []

        raw_items = data.get("results") if isinstance(data, dict) and "results" in data else data
        if not isinstance(raw_items, list):
            return []

        results: List[Dict[str, Any]] = []
        ar_str = "9:16" if orient_param == "portrait" else ("1:1" if orient_param == "squarish" else "16:9")

        for it in raw_items:
            urls = it.get("urls", {})
            img_url = urls.get("regular") or urls.get("full") or urls.get("small")
            if not img_url:
                continue

            thumb_url = urls.get("thumb") or urls.get("small") or img_url
            user = it.get("user") or {}
            author = user.get("name") or user.get("username") or "Unsplash Photographer"
            title = it.get("alt_description") or it.get("description") or f"Photo by {author}"

            results.append(
                self.format_image(
                    id=f"unsplash_{it.get('id')}",
                    title=title.capitalize(),
                    image_url=img_url,
                    preview_url=urls.get("small") or img_url,
                    thumbnail_url=thumb_url,
                    author=author,
                    aspect_ratio=ar_str,
                    provider="unsplash",
                    tags=[t.get("title", "") for t in it.get("tags", []) if isinstance(t, dict)],
                    width=it.get("width"),
                    height=it.get("height"),
                )
            )

        return results

