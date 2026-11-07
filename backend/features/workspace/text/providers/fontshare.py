"""
backend/features/workspace/text/providers/fontshare.py
Live Fontshare (Indian Type Foundry) API provider.
Provides world-class modern fonts (Satoshi, Clash Display, Cabinet Grotesk, General Sans, Switzer, etc.).
100% dynamic live stream with zero hardcoded catalogs.
"""

import json
import logging
import urllib.parse
import urllib.request
from typing import Any, Dict, List

from .base import BaseFontProvider

logger = logging.getLogger("ApexMind.Text.Fontshare")


class FontshareProvider(BaseFontProvider):
    name = "fontshare"
    display_name = "Fontshare (ITF)"

    def __init__(self) -> None:
        self._cache: List[Dict[str, Any]] = []

    def is_configured(self) -> bool:
        return True

    def _ensure_loaded(self) -> List[Dict[str, Any]]:
        if self._cache:
            return self._cache

        try:
            url = "https://api.fontshare.com/v2/fonts"
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "ApexMindStudio/2.0 (LiveFontshare; https://apexmind.ai)",
                    "Accept": "application/json",
                },
            )
            with urllib.request.urlopen(req, timeout=6.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                fonts_list = data.get("fonts", []) if isinstance(data, dict) else (data if isinstance(data, list) else [])

                parsed: List[Dict[str, Any]] = []
                for item in fonts_list:
                    name = item.get("name")
                    slug = item.get("slug")
                    if not name or not slug:
                        continue

                    # Category handling (can be dict {"name": "..."} or string)
                    raw_cat = item.get("category")
                    if isinstance(raw_cat, dict):
                        cat_str = raw_cat.get("name") or "sans-serif"
                    else:
                        cat_str = str(raw_cat or "sans-serif")

                    cat_lower = cat_str.strip().lower().replace(" ", "-")

                    # Map clean generic CSS fallback
                    if "mono" in cat_lower:
                        css_fallback = "monospace"
                    elif "serif" in cat_lower and "sans" not in cat_lower:
                        css_fallback = "serif"
                    elif "handwriting" in cat_lower or "script" in cat_lower:
                        css_fallback = "cursive"
                    else:
                        css_fallback = "sans-serif"

                    css_family = f"'{name}', {css_fallback}"

                    # Weights and styles
                    styles = item.get("styles", [])
                    num_weights: List[int] = []
                    has_italic = False
                    for s in styles:
                        if isinstance(s, dict):
                            if s.get("is_italic"):
                                has_italic = True
                            w = s.get("weight")
                            if w and str(w).isdigit():
                                num_weights.append(int(w))

                    weights = sorted(list(set(num_weights))) or [400, 700]
                    default_weight = 700 if 700 in weights else (weights[-1] if weights else 400)

                    # Fontshare CSS endpoint format: https://api.fontshare.com/v2/css?f[]=slug@weights&display=swap
                    weights_param = ",".join(str(w) for w in weights)
                    fontshare_css = f"https://api.fontshare.com/v2/css?f[]={slug}@{weights_param}&display=swap"

                    designer = item.get("designer") or "Indian Type Foundry"

                    parsed.append({
                        "id": f"fontshare-{slug}",
                        "name": name,
                        "family": name,
                        "fontFamily": css_family,
                        "category": cat_str.title(),
                        "categoryKey": cat_lower,
                        "designer": designer,
                        "weights": weights,
                        "defaultWeight": default_weight,
                        "hasItalic": has_italic,
                        "stylesCount": len(styles) or len(weights),
                        "googleFontUrl": fontshare_css,
                        "provider": "fontshare",
                        "tags": ["fontshare", "itf", cat_lower, "live-api"],
                    })

                if parsed:
                    self._cache = parsed
                    logger.info(f"Loaded {len(self._cache)} live fonts from Fontshare API")
                    return self._cache
        except Exception as e:
            logger.warning(f"Fontshare live API load error: {e}")

        return self._cache

    def _filter(self, query: str = "", category: str = "all") -> List[Dict[str, Any]]:
        fonts = self._ensure_loaded()
        q = query.strip().lower()
        cat = category.strip().lower()

        filtered: List[Dict[str, Any]] = []
        for f in fonts:
            f_name = f["name"].lower()
            f_cat_key = f["categoryKey"]
            f_designer = f.get("designer", "").lower()

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
                if q not in f_name and q not in f_designer and q not in f_cat_key:
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
