"""
backend/features/workspace/text/providers/bunny_fonts.py
Live Bunny Fonts provider.
High-speed privacy-first open-source font CDN mirroring modern fonts.
100% dynamic live stream with zero hardcoded catalogs.
"""

import json
import logging
import urllib.parse
import urllib.request
from typing import Any, Dict, List

from .base import BaseFontProvider

logger = logging.getLogger("ApexMind.Text.BunnyFonts")


class BunnyFontsProvider(BaseFontProvider):
    name = "bunny"
    display_name = "Bunny Fonts"

    def __init__(self) -> None:
        self._cache: List[Dict[str, Any]] = []

    def is_configured(self) -> bool:
        return True

    def _ensure_loaded(self) -> List[Dict[str, Any]]:
        if self._cache:
            return self._cache

        try:
            url = "https://fonts.bunny.net/list"
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "ApexMindStudio/2.0 (LiveBunnyFonts; https://apexmind.ai)",
                    "Accept": "application/json",
                },
            )
            with urllib.request.urlopen(req, timeout=6.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if not isinstance(data, dict):
                    return []

                parsed: List[Dict[str, Any]] = []
                for slug, item in data.items():
                    if not isinstance(item, dict):
                        continue

                    family = item.get("family") or slug.replace("-", " ").title()
                    raw_cat = (item.get("category") or "sans-serif").strip()
                    cat_lower = raw_cat.lower().replace(" ", "-")

                    if "mono" in cat_lower:
                        css_fallback = "monospace"
                    elif "serif" in cat_lower and "sans" not in cat_lower:
                        css_fallback = "serif"
                    elif "handwriting" in cat_lower or "script" in cat_lower:
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

                    # Bunny Fonts CSS format: https://fonts.bunny.net/css?family=inter:400,600,700
                    weight_params = ",".join(str(w) for w in weights)
                    bunny_css = f"https://fonts.bunny.net/css?family={slug}:{weight_params}&display=swap"

                    parsed.append({
                        "id": f"bunny-{slug}",
                        "name": family,
                        "family": family,
                        "fontFamily": css_family,
                        "category": raw_cat.title(),
                        "categoryKey": cat_lower,
                        "designer": "Bunny Fonts Contributor",
                        "weights": weights,
                        "defaultWeight": default_weight,
                        "hasItalic": has_italic,
                        "stylesCount": len(weights) * (2 if has_italic else 1),
                        "googleFontUrl": bunny_css,
                        "provider": "bunny",
                        "tags": ["bunny", cat_lower, "live-api"],
                    })

                if parsed:
                    self._cache = parsed
                    logger.info(f"Loaded {len(self._cache)} live fonts from Bunny Fonts API")
                    return self._cache
        except Exception as e:
            logger.warning(f"Bunny Fonts live API load error: {e}")

        return self._cache

    def _filter(self, query: str = "", category: str = "all") -> List[Dict[str, Any]]:
        fonts = self._ensure_loaded()
        q = query.strip().lower()
        cat = category.strip().lower()

        filtered: List[Dict[str, Any]] = []
        for f in fonts:
            f_family = f["family"].lower()
            f_cat_key = f["categoryKey"]

            if cat != "all":
                if cat in ["sans-serif", "sans"] and "sans" not in f_cat_key:
                    continue
                elif cat in ["serif"] and ("sans" in f_cat_key or "serif" not in f_cat_key):
                    continue
                elif cat in ["display"] and "display" not in f_cat_key:
                    continue
                elif cat in ["monospace", "mono"] and "mono" not in f_cat_key:
                    continue
                elif cat in ["handwriting", "script"] and "handwriting" not in f_cat_key:
                    continue

            if q:
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
