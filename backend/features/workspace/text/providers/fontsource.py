"""
backend/features/workspace/text/providers/fontsource.py
Live Fontsource API provider (1,600+ open-source fonts via official Fontsource API).
Zero hardcoded lists - 100% dynamic live stream.
"""

import json
import logging
import urllib.parse
import urllib.request
from typing import Any, Dict, List

from .base import BaseFontProvider

logger = logging.getLogger("ApexMind.Text.Fontsource")


class FontsourceProvider(BaseFontProvider):
    name = "fontsource"
    display_name = "Fontsource CDN"

    def __init__(self) -> None:
        self._cache: List[Dict[str, Any]] = []

    def is_configured(self) -> bool:
        return True

    def _ensure_loaded(self) -> List[Dict[str, Any]]:
        if self._cache:
            return self._cache

        try:
            url = "https://api.fontsource.org/v1/fonts"
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "ApexMindStudio/2.0 (LiveFontSource; https://apexmind.ai)",
                    "Accept": "application/json",
                },
            )
            with urllib.request.urlopen(req, timeout=6.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if not isinstance(data, list):
                    return []

                parsed: List[Dict[str, Any]] = []
                for item in data:
                    font_id = item.get("id")
                    family = item.get("family")
                    if not font_id or not family:
                        continue

                    raw_cat = (item.get("category") or "sans-serif").strip()
                    cat_lower = raw_cat.lower().replace(" ", "-")

                    # Map generic CSS fallbacks
                    if "mono" in cat_lower:
                        css_fallback = "monospace"
                    elif "serif" in cat_lower and "sans" not in cat_lower:
                        css_fallback = "serif"
                    elif "handwriting" in cat_lower:
                        css_fallback = "cursive"
                    else:
                        css_fallback = "sans-serif"

                    css_family = f"'{family}', {css_fallback}"
                    weights = item.get("weights", [400])
                    if not isinstance(weights, list) or not weights:
                        weights = [400]
                    weights = sorted(list(set(int(w) for w in weights if str(w).isdigit()))) or [400]

                    styles = item.get("styles", [])
                    has_italic = "italic" in styles
                    default_weight = 700 if 700 in weights else (weights[-1] if weights else 400)

                    # Dynamic CDN stylesheet URL
                    encoded_family = urllib.parse.quote_plus(family)
                    weight_params = ";".join(str(w) for w in weights)
                    font_url = f"https://fonts.googleapis.com/css2?family={encoded_family}:wght@{weight_params}&display=swap"

                    parsed.append({
                        "id": f"fontsource-{font_id}",
                        "name": family,
                        "family": family,
                        "fontFamily": css_family,
                        "category": raw_cat.title(),
                        "categoryKey": cat_lower,
                        "designer": "Fontsource Open Contributor",
                        "weights": weights,
                        "defaultWeight": default_weight,
                        "hasItalic": has_italic,
                        "stylesCount": len(weights) * (2 if has_italic else 1),
                        "googleFontUrl": font_url,
                        "provider": "fontsource",
                        "tags": ["fontsource", cat_lower, "live-api"],
                    })

                if parsed:
                    self._cache = parsed
                    logger.info(f"Loaded {len(self._cache)} live fonts from Fontsource API")
                    return self._cache
        except Exception as e:
            logger.warning(f"Fontsource live API load error: {e}")

        return self._cache

    def _filter(self, query: str = "", category: str = "all") -> List[Dict[str, Any]]:
        fonts = self._ensure_loaded()
        q = query.strip().lower()

        filtered: List[Dict[str, Any]] = []
        for f in fonts:
            if not self.matches_category(f, category):
                continue

            if q:
                f_family = f["family"].lower()
                f_cat_key = f["categoryKey"]
                if q not in f_family and q not in f_cat_key:
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
