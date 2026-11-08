"""
backend/features/workspace/elements/service.py
Central elements service orchestrating 16 modular live providers:
- Apex Studio Native (`studio`)
- Iconify Vector Engine (`iconify`)
- SVG Repo Engine (`svgrepo`)
- Game & Stoic Icons (`game_icons`)
- OpenMoji Color Emojis (`openmoji`)
- Twemoji Viral Reactions (`twemoji`)
- Google Noto Emojis (`noto_emoji`)
- Giphy Live Stickers (`giphy_stickers`)
- Tenor Video Stickers (`tenor_stickers`)
- Wikimedia Commons Badges (`wikimedia`)
- Openverse Vector Emblems (`openverse`)
- Reshot Minimalist Graphics (`reshot`)
- FreeSVG & Shapes (`svg_shapes`)
- SimpleIcons Brand Logos (`brand_logos`)
- CryptoLogos & Finance (`cryptologos`)
- FlagCDN World Flags (`flags_iso`)

Zero hardcoded arrays - 100% dynamic multi-provider media streaming.
"""

import logging
from typing import Any, Dict, List, Optional

from .providers import (
    BaseElementProvider,
    BrandLogosElementProvider,
    CryptoLogosElementProvider,
    GameIconsElementProvider,
    GiphyStickersElementProvider,
    IconifyElementProvider,
    NotoEmojiElementProvider,
    OpenMojiElementProvider,
    OpenverseElementProvider,
    ReshotElementProvider,
    StudioElementProvider,
    SVGShapesElementProvider,
    SVGRepoElementProvider,
    TenorStickersElementProvider,
    TwemojiElementProvider,
    WikimediaElementProvider,
    WorldFlagsElementProvider,
)

logger = logging.getLogger("ApexMind.Workspace.ElementsService")

_PROVIDERS: Dict[str, BaseElementProvider] = {
    "studio": StudioElementProvider(),
    "iconify": IconifyElementProvider(),
    "svgrepo": SVGRepoElementProvider(),
    "game_icons": GameIconsElementProvider(),
    "openmoji": OpenMojiElementProvider(),
    "twemoji": TwemojiElementProvider(),
    "noto_emoji": NotoEmojiElementProvider(),
    "giphy_stickers": GiphyStickersElementProvider(),
    "tenor_stickers": TenorStickersElementProvider(),
    "wikimedia": WikimediaElementProvider(),
    "openverse": OpenverseElementProvider(),
    "reshot": ReshotElementProvider(),
    "svg_shapes": SVGShapesElementProvider(),
    "brand_logos": BrandLogosElementProvider(),
    "cryptologos": CryptoLogosElementProvider(),
    "flags_iso": WorldFlagsElementProvider(),
}

ELEMENT_CATEGORIES = [
    {"id": "all", "label": "✨ All Elements"},
    {"id": "badges", "label": "🏅 Badges & Seals"},
    {"id": "icons", "label": "🎨 Vector Icons"},
    {"id": "emojis", "label": "🌟 Emojis & Reactions"},
    {"id": "stickers", "label": "🎬 Animated Stickers"},
    {"id": "shapes", "label": "💬 Callouts & Shapes"},
    {"id": "brands", "label": "🏷️ Brands & Finance"},
    {"id": "progress", "label": "⏱️ Progress Scrubbers"},
    {"id": "social", "label": "📱 Social CTA Pills"},
    {"id": "frames", "label": "🔲 Frames & Letterbox"},
]


def get_element_providers_status() -> Dict[str, bool]:
    """Returns active connectivity status for all 16 live element providers."""
    return {
        key: provider.is_configured()
        for key, provider in _PROVIDERS.items()
    }


def search_elements(
    query: str = "",
    category: str = "all",
    provider: str = "all",
    page: int = 1,
    page_size: int = 24,
) -> Dict[str, Any]:
    """
    Search visual elements across 16 modular live providers.
    Supports single provider queries or aggregated multi-provider search ('all').
    """
    target_prov = (provider or "all").strip().lower()
    clean_cat = (category or "all").strip().lower()
    clean_q = (query or "").strip().lower()

    # 1. Single Provider Target
    if target_prov in _PROVIDERS:
        prov = _PROVIDERS[target_prov]
        try:
            items = prov.search_elements(
                query=clean_q,
                category=clean_cat,
                page=page,
                page_size=page_size,
            )
            total = prov.get_total_elements(query=clean_q, category=clean_cat)
            return {
                "success": True,
                "error": None,
                "page": page,
                "pageSize": page_size,
                "total": total or len(items),
                "provider": target_prov,
                "category": clean_cat,
                "categories": ELEMENT_CATEGORIES,
                "providers": get_element_providers_status(),
                "elements": items,
            }
        except Exception as e:
            logger.error(f"[ElementsService] Provider '{target_prov}' error: {e}")
            return {
                "success": False,
                "error": f"Live provider '{prov.display_name}' error: {str(e)}",
                "page": page,
                "pageSize": page_size,
                "total": 0,
                "provider": target_prov,
                "category": clean_cat,
                "categories": ELEMENT_CATEGORIES,
                "providers": get_element_providers_status(),
                "elements": [],
            }

    # 2. Aggregated Multi-Provider Search ('all')
    aggregated: List[Dict[str, Any]] = []
    seen_ids = set()

    # Distribute query across appropriate providers
    active_providers = list(_PROVIDERS.values())

    # Provider prioritization based on requested category
    if clean_cat == "icons":
        active_providers = [_PROVIDERS["iconify"], _PROVIDERS["svgrepo"], _PROVIDERS["game_icons"]]
    elif clean_cat == "emojis":
        active_providers = [_PROVIDERS["openmoji"], _PROVIDERS["twemoji"], _PROVIDERS["noto_emoji"]]
    elif clean_cat == "stickers":
        active_providers = [_PROVIDERS["giphy_stickers"], _PROVIDERS["tenor_stickers"], _PROVIDERS["reshot"]]
    elif clean_cat in ["badges", "progress", "social", "frames"]:
        active_providers = [_PROVIDERS["studio"], _PROVIDERS["wikimedia"], _PROVIDERS["openverse"]]
    elif clean_cat == "brands":
        active_providers = [_PROVIDERS["brand_logos"], _PROVIDERS["cryptologos"], _PROVIDERS["flags_iso"]]
    elif clean_cat == "shapes":
        active_providers = [_PROVIDERS["svg_shapes"], _PROVIDERS["reshot"]]

    # Query providers in parallel or sequence
    per_provider_limit = max(8, (page_size * 2) // max(len(active_providers), 1) + 2)

    for prov in active_providers:
        try:
            prov_items = prov.search_elements(
                query=clean_q,
                category=clean_cat,
                page=page,
                page_size=per_provider_limit,
            )
            for it in prov_items:
                if it["id"] not in seen_ids:
                    seen_ids.add(it["id"])
                    aggregated.append(it)
        except Exception as e:
            logger.warning(f"[ElementsService] Error querying provider '{prov.name}': {e}")

    # Paginate combined results
    start = (page - 1) * page_size
    paged_items = aggregated[start : start + page_size] if len(aggregated) > page_size else aggregated

    total_est = sum(p.get_total_elements(clean_q, clean_cat) for p in active_providers)

    return {
        "success": True,
        "page": page,
        "pageSize": page_size,
        "total": max(total_est, len(aggregated)),
        "provider": "all",
        "category": clean_cat,
        "categories": ELEMENT_CATEGORIES,
        "providers": get_element_providers_status(),
        "elements": paged_items,
    }


def create_custom_badge(
    text: str,
    gradient: Optional[str] = None,
    icon: Optional[str] = None,
) -> Dict[str, Any]:
    """Generates a custom badge via the studio provider."""
    studio_prov = _PROVIDERS["studio"]
    element = studio_prov.create_custom_badge(text=text, gradient=gradient, icon=icon)
    return {
        "success": True,
        "element": element,
    }


def get_recommended_elements(
    category: str,
    topic: Optional[str] = None,
    tone: Optional[str] = None,
) -> Dict[str, Any]:
    """Dynamically recommends elements based on context."""
    search_res = search_elements(query=f"{topic or ''} {tone or ''}".strip(), category=category, page_size=6)
    return {
        "success": True,
        "category": category,
        "recommended": search_res.get("elements", [])[:6],
    }

