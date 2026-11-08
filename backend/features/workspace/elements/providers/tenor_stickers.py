"""
backend/features/workspace/elements/providers/tenor_stickers.py
Pure Live Tenor Animated Video Stickers Provider.
Live queries to Tenor Search API for viral animated sticker overlays.
Zero hardcoded arrays.
"""

import json
import logging
import urllib.parse
import urllib.request
from typing import Any, Dict, List
from .base import BaseElementProvider

logger = logging.getLogger("ApexMind.Elements.Tenor")


class TenorStickersElementProvider(BaseElementProvider):
    name = "tenor_stickers"
    display_name = "Tenor Stickers"
    category = "stickers"

    def __init__(self) -> None:
        self._cache: Dict[str, List[Dict[str, Any]]] = {}

    def is_configured(self) -> bool:
        return True

    def search_elements(
        self,
        query: str = "",
        category: str = "all",
        page: int = 1,
        page_size: int = 24,
    ) -> List[Dict[str, Any]]:
        clean_q = (query or "").strip().lower() or "sticker reaction wow"
        cache_key = f"tenor_{clean_q}_{page}_{page_size}"

        if cache_key in self._cache:
            return self._cache[cache_key]

        params = {
            "q": f"{clean_q} sticker",
            "key": "LIVDSRZULELA",  # Tenor public key
            "limit": str(min(page_size, 25)),
            "media_filter": "minimal",
        }
        url = f"https://g.tenor.com/v1/search?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "ApexMindStudio/2.0 (LiveTenorStickers; https://apexmind.ai)"},
        )

        try:
            with urllib.request.urlopen(req, timeout=5.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                items_raw = data.get("results", [])
                elements: List[Dict[str, Any]] = []

                for it in items_raw:
                    tid = str(it.get("id", ""))
                    title = it.get("title", "").replace("GIF", "").strip() or f"Tenor Overlay {tid}"
                    media_list = it.get("media", [{}])[0]
                    gif_obj = media_list.get("gif", {}) or media_list.get("tinygif", {})
                    gif_url = gif_obj.get("url", "")
                    preview_url = media_list.get("tinygif", {}).get("url", "") or gif_url

                    if not gif_url:
                        continue

                    elements.append(
                        self.format_element(
                            id=f"tenor-{tid}",
                            name=title[:40],
                            category="stickers",
                            provider=self.name,
                            element_type="sticker",
                            preview_url=preview_url,
                            svg_url=gif_url,
                            desc="Tenor Animated Sticker Overlay",
                            tags=["tenor", "meme", clean_q],
                        )
                    )

                self._cache[cache_key] = elements
                return elements

        except Exception as e:
            logger.warning(f"[TenorStickersProvider] Live query failed for '{clean_q}': {e}")
            return []

    def get_total_elements(self, query: str = "", category: str = "all") -> int:
        return 500000
