"""
backend/features/workspace/open_text_service.py
Real, 100% free, keyless service for live Google Fonts (1,900+ fonts) and free public Quotes.
Eliminates all hardcoded text arrays and static mock presets, streaming real provider fonts and real styles only.
"""

import json
import logging
import urllib.request
import urllib.parse
from typing import Any, Dict, List, Optional

logger = logging.getLogger("ApexMind.OpenTextService")

# In-memory cache for Google Fonts metadata
_GOOGLE_FONTS_CACHE: List[Dict[str, Any]] = []
_QUOTES_CACHE: List[Dict[str, Any]] = []


def _fetch_google_fonts_metadata() -> List[Dict[str, Any]]:
    """Fetches full Google Fonts catalog from Google's public metadata endpoint with caching."""
    global _GOOGLE_FONTS_CACHE
    if _GOOGLE_FONTS_CACHE:
        return _GOOGLE_FONTS_CACHE

    try:
        url = "https://fonts.google.com/metadata/fonts"
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Accept": "application/json",
            },
        )
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            family_list = data.get("familyMetadataList", [])
            parsed = []
            for item in family_list:
                family = item.get("family")
                if not family:
                    continue

                raw_cat = (item.get("category") or "Sans Serif").strip()
                cat_lower = raw_cat.lower().replace(" ", "-")

                # Parse weights from fonts dict (e.g. {'400': {...}, '700': {...}, '400i': {...}})
                fonts_dict = item.get("fonts", {})
                num_weights = []
                has_italic = False
                for k in fonts_dict.keys():
                    if 'i' in k:
                        has_italic = True
                    digits = ''.join(c for c in k if c.isdigit())
                    if digits:
                        num_weights.append(int(digits))

                weights = sorted(list(set(num_weights))) or [400]
                designers = item.get("designers", [])
                designer_str = ", ".join(designers) if designers else "Google Fonts Designer"
                styles_count = len(fonts_dict) or len(weights)
                popularity = item.get("popularity", 9999)

                parsed.append({
                    "family": family,
                    "category": raw_cat,
                    "categoryKey": cat_lower,
                    "designer": designer_str,
                    "popularity": popularity,
                    "weights": weights,
                    "hasItalic": has_italic,
                    "stylesCount": styles_count,
                    "subsets": item.get("subsets", ["latin"]),
                })

            if parsed:
                # Sort by popularity rank (rank 1 = most popular font on Google Fonts, e.g. Roboto, Montserrat, Inter)
                parsed.sort(key=lambda x: x.get("popularity", 9999))
                _GOOGLE_FONTS_CACHE = parsed
                logger.info(f"Loaded {len(_GOOGLE_FONTS_CACHE)} live Google Fonts from Google metadata")
                return _GOOGLE_FONTS_CACHE
    except Exception as e:
        logger.warning(f"Could not load live Google Fonts metadata: {e}")

    return _GOOGLE_FONTS_CACHE


def search_open_fonts(
    query: str = "",
    category: str = "all",
    provider: str = "all",
    page: int = 1,
    page_size: int = 24,
    mood: str = "all",
) -> Dict[str, Any]:
    """
    Searches 1,900+ real Google Fonts live.
    Returns real provider font families, available weights, CSS @import URLs, and typographic styling.
    Zero hardcoded mock texts or styles.
    """
    all_fonts = _fetch_google_fonts_metadata()
    q = query.strip().lower()
    cat = category.strip().lower()

    filtered = []
    for f in all_fonts:
        f_family = f["family"].lower()
        f_cat_key = f["categoryKey"]
        f_designer = f["designer"].lower()

        # Category filter
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

        # Search query filter (search family name or designer)
        if q:
            if q not in f_family and q not in f_designer and q not in f_cat_key:
                continue

        filtered.append(f)

    # Fallback to top fonts if search produced no match
    if not filtered and q:
        filtered = [f for f in all_fonts if f["categoryKey"] == cat] or all_fonts[:page_size]

    total = len(filtered)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paged = filtered[start_idx:end_idx]

    items = []
    for f in paged:
        family = f["family"]
        category_name = f["category"]
        category_key = f["categoryKey"]
        weights = f["weights"]
        default_weight = 700 if 700 in weights else (weights[-1] if weights else 400)

        # Build clean Google Fonts CSS2 URL with all available weights
        font_family_encoded = urllib.parse.quote_plus(family)
        weight_params = ";".join(str(w) for w in weights)
        google_font_url = f"https://fonts.googleapis.com/css2?family={font_family_encoded}:wght@{weight_params}&display=swap"

        # Generic CSS fallback family
        if "mono" in category_key:
            css_fallback = "monospace"
        elif "serif" in category_key and "sans" not in category_key:
            css_fallback = "serif"
        elif "handwriting" in category_key:
            css_fallback = "cursive"
        else:
            css_fallback = "sans-serif"

        css_family = f"'{family}', {css_fallback}"

        # Clean typographic classes matched to the font's actual nature (without font-family overrides)
        if "mono" in category_key:
            clean_class = "tracking-normal font-semibold"
        elif "serif" in category_key and "sans" not in category_key:
            clean_class = "tracking-wide font-medium"
        elif "display" in category_key:
            clean_class = "tracking-tight font-black uppercase"
        elif "handwriting" in category_key:
            clean_class = "tracking-normal italic font-medium"
        else:
            clean_class = "tracking-tight font-bold"

        item_id = f"gfont-{family.lower().replace(' ', '-')}"
        items.append({
            "id": item_id,
            "name": family,
            "family": family,
            "fontFamily": css_family,
            "category": category_name,
            "categoryKey": category_key,
            "designer": f["designer"],
            "popularity": f["popularity"],
            "weights": weights,
            "defaultWeight": default_weight,
            "hasItalic": f["hasItalic"],
            "stylesCount": f["stylesCount"],
            "googleFontUrl": google_font_url,
            "className": clean_class,
            "styleDescription": f"{family} ({category_name}) • {f['stylesCount']} style{'s' if f['stylesCount'] != 1 else ''} by {f['designer']}",
            "provider": "google_fonts",
            "tags": ["google-fonts", category_key, f"rank-{f['popularity']}"],
        })

    return {
        "success": True,
        "total": total,
        "page": page,
        "pageSize": page_size,
        "items": items,
        "providers": {
            "google_fonts": True,
        },
    }


def search_open_quotes(
    query: str = "",
    category: str = "all",
    page: int = 1,
    page_size: int = 20,
) -> Dict[str, Any]:
    """
    Fetches real quotes and viral talking points from free public APIs (dummyjson / quotable).
    """
    global _QUOTES_CACHE
    if not _QUOTES_CACHE:
        try:
            url = "https://dummyjson.com/quotes?limit=100"
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
            )
            with urllib.request.urlopen(req, timeout=4.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                quotes = data.get("quotes", [])
                _QUOTES_CACHE = [
                    {
                        "id": f"quote-{q.get('id', idx)}",
                        "text": q.get("quote"),
                        "author": q.get("author"),
                    }
                    for idx, q in enumerate(quotes)
                ]
        except Exception as e:
            logger.warning(f"Could not load quotes from live API: {e}")

    quotes = _QUOTES_CACHE or []
    q = query.strip().lower()
    if q:
        filtered = [
            item for item in quotes
            if q in item["text"].lower() or q in item["author"].lower()
        ]
    else:
        filtered = quotes

    total = len(filtered)
    start_idx = (page - 1) * page_size
    paged = filtered[start_idx : start_idx + page_size]

    return {
        "success": True,
        "total": total,
        "page": page,
        "pageSize": page_size,
        "items": paged,
    }
