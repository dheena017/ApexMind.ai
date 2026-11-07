"""
backend/features/workspace/text/providers/open_font_library.py
Live Open Font Library (OFL / fontlibrary.org) provider.
Provides independent, community-crafted, SIL Open Font License typography
(experimental, historical, gothic, calligraphic, and display fonts).
100% dynamic live API stream - zero hardcoded font arrays.
"""

import json
import logging
import urllib.parse
import urllib.request
from typing import Any, Dict, List

from .base import BaseFontProvider

logger = logging.getLogger("ApexMind.Text.OpenFontLibrary")


class OpenFontLibraryProvider(BaseFontProvider):
    name = "open_font_library"
    display_name = "Open Font Library"

    def __init__(self) -> None:
        self._cache: List[Dict[str, Any]] = []

    def is_configured(self) -> bool:
        return True

    def _ensure_loaded(self) -> List[Dict[str, Any]]:
        if self._cache:
            return self._cache

        try:
            url = "https://fontlibrary.org/api/fonts"
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "ApexMindStudio/2.0 (LiveOFL; https://apexmind.ai)",
                    "Accept": "application/json",
                },
            )
            with urllib.request.urlopen(req, timeout=6.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                font_list = data.get("fonts", []) if isinstance(data, dict) else (data if isinstance(data, list) else [])

                parsed: List[Dict[str, Any]] = []
                for item in font_list:
                    if not isinstance(item, dict):
                        continue

                    name = item.get("name") or item.get("family")
                    if not name:
                        continue

                    family = item.get("family") or name
                    slug = item.get("slug") or family.lower().replace(" ", "-")

                    raw_cat = (item.get("classification") or item.get("category") or "display").strip()
                    cat_lower = raw_cat.lower().replace(" ", "-")

                    if "mono" in cat_lower:
                        css_fallback = "monospace"
                    elif "serif" in cat_lower and "sans" not in cat_lower:
                        css_fallback = "serif"
                    elif "handwriting" in cat_lower or "script" in cat_lower or "calligra" in cat_lower:
                        css_fallback = "cursive"
                    else:
                        css_fallback = "sans-serif"

                    css_family = f"'{family}', {css_fallback}"

                    # OFL native CSS stylesheet link or Fontsource CDN fallback
                    css_url = item.get("css") or f"https://fontlibrary.org//face/{slug}"
                    author = item.get("author") or item.get("designer") or "Open Font Contributor"
                    styles_count = int(item.get("styles_count", 1))

                    parsed.append({
                        "id": f"ofl-{slug}",
                        "name": name,
                        "family": family,
                        "fontFamily": css_family,
                        "category": raw_cat.title(),
                        "categoryKey": cat_lower,
                        "designer": author,
                        "weights": [400, 700],
                        "defaultWeight": 700,
                        "hasItalic": False,
                        "stylesCount": styles_count,
                        "googleFontUrl": css_url,
                        "provider": "open_font_library",
                        "tags": ["open-font-library", "ofl", cat_lower, "live-api"],
                    })

                if parsed:
                    self._cache = parsed
                    logger.info(f"Loaded {len(self._cache)} live fonts from Open Font Library API")
                    return self._cache
        except Exception as e:
            logger.warning(f"Open Font Library live API load error: {e}")

        return self._cache

    def _filter(self, query: str = "", category: str = "all") -> List[Dict[str, Any]]:
        fonts = self._ensure_loaded()
        q = query.strip().lower()

        filtered: List[Dict[str, Any]] = []
        for f in fonts:
            if not self.matches_category(f, category):
                continue

            if q:
                f_name = f["name"].lower()
                f_family = f["family"].lower()
                f_designer = f.get("designer", "").lower()
                f_cat_key = f["categoryKey"]
                if q not in f_name and q not in f_family and q not in f_designer and q not in f_cat_key:
                    continue

            filtered.append(f)

        return filtered

    def get_total(self, query: str = "", category: str = "all") -> int:
        return len(self._filter(query, category))

    def search(
        self,
        query: str = "",
        category: str = "all",
        page: int = 1,
        page_size: int = 24,
    ) -> List[Dict[str, Any]]:
        filtered = self._filter(query, category)
        start_idx = (page - 1) * page_size
        return filtered[start_idx : start_idx + page_size]
