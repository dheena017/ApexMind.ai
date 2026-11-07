"""
backend/features/media/providers/image_unsplash.py
Unsplash photos provider adapter.
"""

import os
import logging
from typing import List
import requests

from backend.features.media.base import BaseMediaProvider, MediaAsset

logger = logging.getLogger("ApexMind.media.unsplash")


class UnsplashImageProvider(BaseMediaProvider):
    @property
    def name(self) -> str:
        return "unsplash"

    @property
    def supported_types(self) -> List[str]:
        return ["image"]

    def is_configured(self) -> bool:
        key = (os.getenv("UNSPLASH_ACCESS_KEY") or "").strip().strip('"').strip("'")
        return bool(key) and not key.startswith("your_") and key != "..."

    def search(
        self,
        query: str,
        media_type: str = "image",
        limit: int = 15,
        aspect_ratio: str = "9:16",
        page: int = 1,
        **kwargs,
    ) -> List[MediaAsset]:
        access_key = (os.getenv("UNSPLASH_ACCESS_KEY") or "").strip().strip('"').strip("'")
        if not access_key:
            return []

        clean_q = (query or "").strip().replace("#", "").strip()
        if aspect_ratio in ["9:16", "4:5", "portrait"]:
            orientation = "portrait"
        elif aspect_ratio in ["1:1", "square", "squarish"]:
            orientation = "squarish"
        else:
            orientation = "landscape"

        headers = {"Authorization": f"Client-ID {access_key}"}
        params = {
            "per_page": min(limit, 30),
            "page": page,
        }
        if clean_q:
            url = "https://api.unsplash.com/search/photos"
            params["query"] = clean_q
            params["orientation"] = orientation
        else:
            url = "https://api.unsplash.com/photos"

        try:
            resp = requests.get(url, headers=headers, params=params, timeout=5)
            if resp.status_code != 200:
                return []
            data = resp.json()
        except Exception as e:
            logger.warning(f"Unsplash API request failed: {e}")
            return []

        images: List[MediaAsset] = []
        raw_list = data.get("results") if isinstance(data, dict) else (data if isinstance(data, list) else [])
        for it in raw_list:
            urls = it.get("urls", {})
            img_url = urls.get("regular") or urls.get("full") or urls.get("small")
            if img_url:
                images.append(
                    MediaAsset(
                        id=f"unsplash_img_{it.get('id')}",
                        mediaType="image",
                        title=it.get("alt_description") or "Unsplash Photo",
                        url=img_url,
                        previewUrl=urls.get("small") or img_url,
                        thumbnailUrl=urls.get("thumb") or img_url,
                        aspectRatio=aspect_ratio,
                        provider="unsplash",
                        extraMetadata={
                            "author": it.get("user", {}).get("name"),
                            "sourceUrl": it.get("links", {}).get("html"),
                        },
                    )
                )

        return images
