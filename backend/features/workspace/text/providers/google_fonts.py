"""
backend/features/workspace/text/providers/google_fonts.py
Live Google Fonts provider (1,959 free open-source fonts).
Diversified interleaving so cards showcase radically different typography styles:
Display -> Serif -> Sans-Serif -> Handwriting -> Monospace.
100% dynamic live stream - zero hardcoded font arrays.
"""

import json
import logging
import urllib.parse
import urllib.request
from typing import Any, Dict, List

from .base import BaseFontProvider

logger = logging.getLogger("ApexMind.Text.GoogleFonts")


class GoogleFontsProvider(BaseFontProvider):
    name = "google_fonts"
    display_name = "Google Fonts"

    def __init__(self) -> None:
        self._cache: List[Dict[str, Any]] = []

    def is_configured(self) -> bool:
        return True

    def _ensure_loaded(self) -> List[Dict[str, Any]]:
        if self._cache:
            return self._cache

        try:
            url = "https://fonts.google.com/metadata/fonts"
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                    "Accept": "application/json",
                },
            )
            with urllib.request.urlopen(req, timeout=6.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                family_list = data.get("familyMetadataList", [])
                parsed = []
                for item in family_list:
                    family = item.get("family")
                    if not family:
                        continue

                    raw_cat = (item.get("category") or "Sans Serif").strip()
                    cat_lower = raw_cat.lower().replace(" ", "-")

                    fonts_dict = item.get("fonts", {})
                    num_weights = []
                    has_italic = False
                    for k in fonts_dict.keys():
                        if "i" in k:
                            has_italic = True
                        digits = "".join(c for c in k if c.isdigit())
                        if digits:
                            num_weights.append(int(digits))

                    weights = sorted(list(set(num_weights))) or [400]
                    designers = item.get("designers", [])
                    designer_str = ", ".join(designers) if designers else "Google Fonts Designer"
                    styles_count = len(fonts_dict) or len(weights)
                    popularity = item.get("popularity", 9999)

                    # Build clean generic CSS fallback family
                    if "mono" in cat_lower:
                        css_fallback = "monospace"
                    elif "serif" in cat_lower and "sans" not in cat_lower:
                        css_fallback = "serif"
                    elif "handwriting" in cat_lower or "script" in cat_lower:
                        css_fallback = "cursive"
                    else:
                        css_fallback = "sans-serif"

                    css_family = f"'{family}', {css_fallback}"
                    font_family_encoded = urllib.parse.quote_plus(family)

                    # Bulletproof Google Fonts CSS2 URL (guaranteed 200 OK across all Google Fonts)
                    if 400 in weights and 700 in weights:
                        wght_query = ":wght@400;700"
                    elif 400 in weights:
                        wght_query = ":wght@400"
                    elif weights:
                        wght_query = f":wght@{weights[0]}"
                    else:
                        wght_query = ""

                    google_font_url = f"https://fonts.googleapis.com/css2?family={font_family_encoded}{wght_query}&display=swap"

                    parsed.append({
                        "id": f"gfont-{family.lower().replace(' ', '-')}",
                        "name": family,
                        "family": family,
                        "fontFamily": css_family,
                        "category": raw_cat,
                        "categoryKey": cat_lower,
                        "designer": designer_str,
                        "popularity": popularity,
                        "weights": weights,
                        "defaultWeight": 700 if 700 in weights else (weights[-1] if weights else 400),
                        "hasItalic": has_italic,
                        "stylesCount": styles_count,
                        "googleFontUrl": google_font_url,
                        "provider": "google_fonts",
                        "tags": ["google-fonts", cat_lower, f"rank-{popularity}"],
                    })

                if parsed:
                    # Group by primary category and sort each category by popularity
                    by_cat: Dict[str, List[Dict[str, Any]]] = {
                        "display": [],
                        "serif": [],
                        "sans-serif": [],
                        "handwriting": [],
                        "monospace": [],
                    }
                    for f in parsed:
                        ck = f.get("categoryKey", "sans-serif")
                        if "mono" in ck:
                            by_cat["monospace"].append(f)
                        elif "serif" in ck and "sans" not in ck:
                            by_cat["serif"].append(f)
                        elif "display" in ck:
                            by_cat["display"].append(f)
                        elif "handwriting" in ck or "script" in ck:
                            by_cat["handwriting"].append(f)
                        else:
                            by_cat["sans-serif"].append(f)

                    for k in by_cat:
                        by_cat[k].sort(key=lambda x: x.get("popularity", 9999))

                    # Interleave across categories for maximum visual variety in the showcase
                    interleaved: List[Dict[str, Any]] = []
                    order = ["display", "serif", "sans-serif", "handwriting", "monospace"]
                    max_len = max(len(lst) for lst in by_cat.values())
                    for i in range(max_len):
                        for c in order:
                            if i < len(by_cat[c]):
                                interleaved.append(by_cat[c][i])

                    self._cache = interleaved
                    logger.info(f"Loaded {len(self._cache)} Google Fonts in GoogleFontsProvider (diversified)")
                    return self._cache
        except Exception as e:
            logger.warning(f"GoogleFontsProvider error: {e}")

        return self._cache

    def _filter(self, query: str = "", category: str = "all") -> List[Dict[str, Any]]:
        fonts = self._ensure_loaded()
        q = query.strip().lower()

        filtered = []
        for f in fonts:
            if not self.matches_category(f, category):
                continue

            if q:
                f_family = f["family"].lower()
                f_designer = f["designer"].lower()
                f_cat_key = f["categoryKey"]
                if q not in f_family and q not in f_designer and q not in f_cat_key:
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
