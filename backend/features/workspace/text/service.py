"""
backend/features/workspace/text/service.py
Central typography and font service coordinating purely live API providers:
- Google Fonts (1,959+ live fonts via official metadata API)
- Fontshare by Indian Type Foundry (100+ live fonts via official v2 REST API)
- Fontsource CDN (1,600+ live open-source fonts via official v1 REST API)
- Bunny Fonts CDN (1,900+ live open-source fonts via official CDN API)

Zero hardcoded font lists - 100% dynamic live stream.
"""

import logging
from typing import Any, Dict, List

from .providers import (
    BaseFontProvider,
    BunnyFontsProvider,
    FontshareProvider,
    FontsourceProvider,
    GoogleFontsProvider,
)

logger = logging.getLogger("ApexMind.Text.Service")

_PROVIDERS: Dict[str, BaseFontProvider] = {
    "google_fonts": GoogleFontsProvider(),
    "fontshare": FontshareProvider(),
    "fontsource": FontsourceProvider(),
    "bunny": BunnyFontsProvider(),
}


def get_font_providers_status() -> Dict[str, bool]:
    """Returns availability status for all real live typography providers."""
    return {
        key: provider.is_configured()
        for key, provider in _PROVIDERS.items()
    }


def search_fonts(
    query: str = "",
    category: str = "all",
    provider: str = "all",
    page: int = 1,
    page_size: int = 24,
) -> Dict[str, Any]:
    """
    Search fonts across purely live modular providers.
    Supports single provider search ('google_fonts', 'fontshare', 'fontsource', 'bunny')
    or aggregated live search ('all').
    """
    target_prov = provider.strip().lower()

    if target_prov in _PROVIDERS:
        prov = _PROVIDERS[target_prov]
        total = prov.get_total(query, category)
        items = prov.search(query, category, page, page_size)
    else:
        # Aggregated search across live services:
        g_prov = _PROVIDERS["google_fonts"]
        fsh_prov = _PROVIDERS["fontshare"]
        fs_prov = _PROVIDERS["fontsource"]
        b_prov = _PROVIDERS["bunny"]

        total = (
            g_prov.get_total(query, category)
            + fsh_prov.get_total(query, category)
            + fs_prov.get_total(query, category)
            + b_prov.get_total(query, category)
        )

        # Primary live search on Google Fonts
        items = g_prov.search(query, category, page, page_size)

        # On the first page, interleave standout live Fontshare fonts (Satoshi, Clash Display, etc.)
        if page == 1:
            standouts = fsh_prov.search(query, category, 1, 6)
            if standouts:
                seen_families = {s.get("family") for s in standouts}
                items = standouts + [it for it in items if it.get("family") not in seen_families]
                items = items[:page_size]

        # If page space still available, augment with live fontsource & bunny
        if len(items) < page_size:
            extra = fs_prov.search(query, category, page, page_size - len(items))
            items.extend(extra)
            if len(items) < page_size:
                extra_b = b_prov.search(query, category, page, page_size - len(items))
                items.extend(extra_b)

    return {
        "success": True,
        "total": total,
        "page": page,
        "pageSize": page_size,
        "items": items,
        "providers": get_font_providers_status(),
    }
