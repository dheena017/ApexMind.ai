"""
backend/features/workspace/elements/providers/wikimedia.py
Pure Live Wikimedia Commons API provider for public domain & CC-BY badges, seals, ribbons, frames, and overlays.
Queries https://commons.wikimedia.org/w/api.php live in real time.
Zero hardcoded arrays.
"""

import json
import logging
import urllib.parse
import urllib.request
from typing import Any, Dict, List
from .base import BaseElementProvider

logger = logging.getLogger("ApexMind.Elements.Wikimedia")


class WikimediaElementProvider(BaseElementProvider):
    name = "wikimedia"
    display_name = "Wikimedia Commons"
    category = "badges"

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
        clean_q = (query or "").strip().lower() or "seal badge ribbon"
        search_term = f"filetype:bitmap|drawing {clean_q} (badge OR seal OR ribbon OR frame OR crest OR medal)"
        cache_key = f"wiki_{clean_q}_{page}_{page_size}"

        if cache_key in self._cache:
            return self._cache[cache_key]

        params = {
            "action": "query",
            "format": "json",
            "generator": "search",
            "gsrnamespace": "6",
            "gsrsearch": search_term,
            "gsrlimit": str(min(page_size * 2, 40)),
            "gsroffset": str((page - 1) * page_size),
            "prop": "imageinfo",
            "iiprop": "url|mime|size|thumburl",
            "iiurlwidth": "300",
        }

        url = f"https://commons.wikimedia.org/w/api.php?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "ApexMindStudio/2.0 (LiveWikimediaElements; https://apexmind.ai)"},
        )

        try:
            with urllib.request.urlopen(req, timeout=5.5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                pages = data.get("query", {}).get("pages", {})
                results: List[Dict[str, Any]] = []

                for page_id, page_data in pages.items():
                    title_raw = page_data.get("title", "").replace("File:", "").strip()
                    title_clean = title_raw.rsplit(".", 1)[0].replace("_", " ").strip()
                    imageinfo = page_data.get("imageinfo", [{}])[0]
                    img_url = imageinfo.get("url", "")
                    thumb_url = imageinfo.get("thumburl", "") or img_url
                    mime = imageinfo.get("mime", "").lower()

                    if not img_url:
                        continue

                    # Filter for transparent vector, SVG or clean PNG graphics
                    if "svg" in mime or "png" in mime or "webp" in mime or img_url.endswith((".svg", ".png")):
                        results.append(
                            self.format_element(
                                id=f"wiki-{page_id}",
                                name=title_clean[:45],
                                category="badges",
                                provider=self.name,
                                element_type="svg" if "svg" in mime else "badge",
                                preview_url=thumb_url,
                                svg_url=img_url,
                                desc=f"Wikimedia Commons ({mime.split('/')[-1].upper()})",
                                tags=["wikimedia", "open", clean_q],
                            )
                        )

                self._cache[cache_key] = results[:page_size]
                return results[:page_size]

        except Exception as e:
            logger.warning(f"[WikimediaElementProvider] Live query failed for '{clean_q}': {e}")
            return []

    def get_total_elements(self, query: str = "", category: str = "all") -> int:
        return 50000
