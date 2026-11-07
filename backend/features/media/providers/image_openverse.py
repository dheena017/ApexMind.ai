"""
backend/features/media/providers/image_openverse.py
Openverse (WordPress / Creative Commons) keyless stock photo provider.
Provides instant access to 700M+ royalty-free, CC0, and public domain cultural & contemporary images.
Requires zero API keys.
"""

import logging
from typing import List
import requests
from backend.features.media.base import BaseMediaProvider, MediaAsset

logger = logging.getLogger("ApexMind.media.openverse")


class OpenverseImageProvider(BaseMediaProvider):
    """
    Openverse public stock photo provider.
    Searches 700+ million open-licensed photos across global cultural and modern collections.
    """

    @property
    def name(self) -> str:
        return "openverse"

    @property
    def supported_types(self) -> List[str]:
        return ["image"]

    def is_configured(self) -> bool:
        return True  # 100% Free and public API

    def search(
        self,
        query: str,
        media_type: str = "image",
        limit: int = 15,
        aspect_ratio: str = "9:16",
        page: int = 1,
        **kwargs,
    ) -> List[MediaAsset]:
        clean_q = (query or "").strip().replace("#", "").strip()
        endpoint = "https://api.openverse.org/v1/images/"

        # Map aspect ratios to Openverse API format
        ar_param = "tall"
        if aspect_ratio in ["16:9", "landscape"]:
            ar_param = "wide"
        elif aspect_ratio in ["1:1", "square", "squarish"]:
            ar_param = "square"

        # Search photographs in modern image formats (exclude SVG shields/coats of arms/icons)
        search_query = clean_q or ("portrait aesthetic" if ar_param == "tall" else "cinematic photography")

        params = {
            "q": search_query,
            "category": "photograph",
            "extension": "jpg,png,webp",
            "page": page,
            "page_size": min(limit, 30),
            "aspect_ratio": ar_param,
        }
        headers = {
            "User-Agent": "ApexMindStudio/2.0 (OpenStockMedia; https://apexmind.ai)"
        }

        try:
            resp = requests.get(endpoint, params=params, headers=headers, timeout=5)
            if resp.status_code != 200:
                logger.debug(f"Openverse API status code: {resp.status_code}")
                return []
            data = resp.json()
        except Exception as e:
            logger.debug(f"Openverse search request error: {e}")
            return []

        results: List[MediaAsset] = []
        raw_results = data.get("results", [])

        for it in raw_results:
            img_url = it.get("url", "")
            thumb_url = it.get("thumbnail") or img_url
            if not img_url:
                continue

            # Reject vector graphics, coats of arms, and non-displayable formats
            filetype = (it.get("filetype") or "").lower()
            if filetype == "svg" or img_url.lower().endswith((".svg", ".tif", ".tiff")):
                continue

            title = it.get("title") or "Stock Photo"
            creator = it.get("creator") or "Open Creator"
            license_code = it.get("license", "CC0").upper()
            width = it.get("width", 1080)
            height = it.get("height", 1920)

            results.append(
                MediaAsset(
                    id=f"openverse_{it.get('id', len(results))}",
                    mediaType="image",
                    title=title,
                    url=img_url,
                    previewUrl=thumb_url,
                    thumbnailUrl=thumb_url,
                    resolution=f"{width}x{height}",
                    aspectRatio=aspect_ratio,
                    provider="openverse",
                    extraMetadata={
                        "author": creator,
                        "license": license_code,
                        "sourceUrl": it.get("foreign_landing_url", ""),
                        "tags": [t.get("name", "") for t in it.get("tags", []) if isinstance(t, dict)],
                    },
                )
            )

        return results

