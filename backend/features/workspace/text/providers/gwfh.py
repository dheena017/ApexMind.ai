"""
backend/features/workspace/text/providers/gwfh.py
Live Google Web Fonts Helper (GWFH / mranftl) open-source provider.
Queries https://gwfh.mranftl.com/api/fonts for 1,500+ curated open-source webfonts.
100% dynamic live API stream - zero hardcoded font arrays.
"""

import json
import logging
import urllib.parse
import urllib.request
from typing import Any, Dict, List

from .base import BaseFontProvider

logger = logging.getLogger("ApexMind.Text.GWFH")


class GWFHProvider(BaseFontProvider):
    name = "gwfh"
    display_name = "GWFH Open Fonts"

    def __init__(self) -> None:
        self._cache: List[Dict[str, Any]] = []

    def is_configured(self) -> bool:
        return True

    def _ensure_loaded(self) -> List[Dict[str, Any]]:
        if self._cache:
            return self._cache

        try:
            url = "https://gwfh.mranftl.com/api/fonts"
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "ApexMindStudio/2.0 (LiveGWFH; https://apexmind.ai)",
                    "Accept": "application/json",
                },
            )
            with urllib.request.urlopen(req, timeout=6.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if not isinstance(data, list):
                    return []

                parsed: List[Dict[str, Any]] = []
                for item in data:
                    if not isinstance(item, dict):
                        continue

                    family = item.get("family")
                    font_id = item.get("id") or (family.lower().replace(" ", "-") if family else "")
                    if not family or not font_id:
                        continue

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

                    # Variants and weights extraction
                    variants = item.get("variants", [])
                    weights: List[int] = []
                    has_italic = False
                    for v in variants:
                        v_str = str(v)
                        if "italic" in v_str:
                            has_italic = True
                        num_part = "".join(filter(str.isdigit, v_str))
                        if num_part and len(num_part) == 3:
                            w = int(num_part)
                            if w not in weights:
                                weights.append(w)
                    if not weights:
                        weights = [400, 700]
                    weights.sort()

                    default_weight = 700 if 700 in weights else (weights[-1] if weights else 400)
                    popularity = item.get("popularity", 9999)

                    # Build CSS URL loading all available font weights
                    encoded_family = urllib.parse.quote_plus(family)
                    valid_weights = sorted([w for w in weights if 100 <= w <= 900 and w % 100 == 0])
                    if not valid_weights:
                        valid_weights = [400, 700]
                    wght_str = ":wght@" + ";".join(str(w) for w in valid_weights)

                    css_url = f"https://fonts.googleapis.com/css2?family={encoded_family}{wght_str}&display=swap"

                    parsed.append({
                        "id": f"gwfh-{font_id}",
                        "name": family,
                        "family": family,
                        "fontFamily": css_family,
                        "category": raw_cat.title(),
                        "categoryKey": cat_lower,
                        "designer": "Open Source Contributor",
                        "popularity": popularity,
                        "weights": weights,
                        "defaultWeight": default_weight,
                        "hasItalic": has_italic,
                        "stylesCount": len(variants) or len(weights),
                        "googleFontUrl": css_url,
                        "provider": "gwfh",
                        "tags": ["gwfh", "open-source", cat_lower, f"rank-{popularity}"],
                    })

                if parsed:
                    parsed.sort(key=lambda x: x.get("popularity", 9999))
                    self._cache = parsed
                    logger.info(f"Loaded {len(self._cache)} live fonts from GWFH API")
                    return self._cache
        except Exception as e:
            logger.warning(f"GWFH live API load error: {e}")

        return self._cache

    def _filter(self, query: str = "", category: str = "all") -> List[Dict[str, Any]]:
        fonts = self._ensure_loaded()
        q = query.strip().lower()

        filtered = []
        for f in fonts:
            if not self.matches_category(f, category):
                continue
            if q:
                match_name = q in f.get("name", "").lower()
                match_cat = q in f.get("category", "").lower()
                match_tag = any(q in t.lower() for t in f.get("tags", []))
                if not (match_name or match_cat or match_tag):
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
        start = (page - 1) * page_size
        end = start + page_size
        return filtered[start:end]

