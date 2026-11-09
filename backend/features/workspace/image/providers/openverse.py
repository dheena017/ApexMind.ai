"""
backend/features/workspace/image/providers/openverse.py
Openverse (WordPress / Creative Commons) keyless stock photo provider.
Provides instant access to 700M+ royalty-free, CC0, and public domain cultural & contemporary images.
Requires zero API keys.
"""

import logging
from typing import Any, Dict, List
import requests

from .base import BaseImageProvider

logger = logging.getLogger("ApexMind.Workspace.Image.Openverse")

OPENVERSE_IMAGES_ENDPOINT: str = "https://api.openverse.org/v1/images/"


class OpenverseImageProvider(BaseImageProvider):
    name = "openverse"
    display_name = "Openverse CC0 Photos"

    def is_configured(self) -> bool:
        return True  # 100% Free and public API

    def search(
        self,
        query: str = "",
        orientation: str = "portrait",
        page: int = 1,
        page_size: int = 24,
    ) -> List[Dict[str, Any]]:
        clean_q = (query or "").strip().replace("#", "").strip()

        ar_param = "tall"
        if orientation in ["16:9", "landscape"]:
            ar_param = "wide"
        elif orientation in ["1:1", "square", "squarish"]:
            ar_param = "square"

        search_query = clean_q or ("portrait aesthetic" if ar_param == "tall" else "cinematic photography")

        params = {
            "q": search_query,
            "category": "photograph",
            "page": page,
            "page_size": min(page_size, 30),
        }
        headers = {
            "User-Agent": "ApexMindStudio/2.0 (OpenStockMedia; https://apexmind.ai)",
            "Accept": "application/json",
        }

        try:
            resp = requests.get(OPENVERSE_IMAGES_ENDPOINT, params=params, headers=headers, timeout=5)
            if resp.status_code != 200:
                logger.debug(f"Openverse API status code: {resp.status_code}")
                return []
            data = resp.json()
        except Exception as e:
            logger.debug(f"Openverse search request error: {e}")
            return []

        results: List[Dict[str, Any]] = []
        raw_results = data.get("results", [])
        ar_str = "9:16" if ar_param == "tall" else ("1:1" if ar_param == "square" else "16:9")

        for it in raw_results:
            img_url = it.get("url", "")
            thumb_url = it.get("thumbnail") or img_url
            if not img_url:
                continue

            # Reject vector graphics, coats of arms, shields, and non-displayable formats
            filetype = (it.get("filetype") or "").lower()
            title = (it.get("title") or "Stock Photo").strip()
            title_lower = title.lower()

            if (
                filetype == "svg"
                or any(bad in title_lower for bad in ["coat of arms", "shield", "crest", "flag of", "insignia", "emblem"])
                or not img_url.startswith("http")
            ):
                continue

            author = it.get("creator") or "Openverse Contributor"
            results.append(
                self.format_image(
                    id=f"openverse_{it.get('id')}",
                    title=title,
                    image_url=img_url,
                    preview_url=thumb_url,
                    thumbnail_url=thumb_url,
                    author=author,
                    aspect_ratio=ar_str,
                    provider="openverse",
                    tags=[t.get("name", "") for t in it.get("tags", []) if isinstance(t, dict)],
                    width=it.get("width"),
                    height=it.get("height"),
                )
            )

        return results

