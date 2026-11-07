"""
backend/features/workspace/text/service.py
Central typography and font service coordinating real live modular providers.
Zero hardcoded presets - only live open-source font services.
"""

import logging
from typing import Any, Dict, List

from .providers import (
    BaseFontProvider,
    FontsourceProvider,
    GoogleFontsProvider,
)

logger = logging.getLogger("ApexMind.Text.Service")

_PROVIDERS: Dict[str, BaseFontProvider] = {
    "google_fonts": GoogleFontsProvider(),
    "fontsource": FontsourceProvider(),
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
    Search fonts across real live modular providers.
    Supports single provider search ('google_fonts', 'fontsource')
    or aggregated live search ('all').
    """
    target_prov = provider.strip().lower()

    if target_prov in _PROVIDERS:
        prov = _PROVIDERS[target_prov]
        total = prov.get_total(query, category)
        items = prov.search(query, category, page, page_size)
    else:
        # Default 'all': Query Google Fonts primary (1,950+ live fonts), supplemented by live Fontsource
        g_prov = _PROVIDERS["google_fonts"]
        fs_prov = _PROVIDERS["fontsource"]

        # Aggregate total across live services
        g_total = g_prov.get_total(query, category)
        fs_total = fs_prov.get_total(query, category)
        total = g_total + fs_total

        # Primary live search on Google Fonts
        items = g_prov.search(query, category, page, page_size)

        # If on first page and query was empty or page space available, augment with live fontsource
        if page == 1 and len(items) < page_size:
            extra = fs_prov.search(query, category, 1, page_size - len(items))
            items.extend(extra)

    return {
        "success": True,
        "total": total,
        "page": page,
        "pageSize": page_size,
        "items": items,
        "providers": get_font_providers_status(),
    }
