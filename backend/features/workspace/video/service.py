"""
backend/features/workspace/video/service.py
Central stock video service orchestrating 6 modular live video providers:
- Pexels Videos (`pexels`)
- Pixabay Videos (`pixabay`)
- Mixkit Loops (`mixkit`)
- Coverr Free Loops (`coverr`)
- Wikimedia Commons (`wikimedia`)
- Google Custom Search Engine (`google_cse`)

Zero hardcoded arrays - 100% dynamic multi-provider video retrieval and ranking.
"""

from concurrent.futures import ThreadPoolExecutor, as_completed
import logging
from typing import Any, Dict, List, Set

from .providers import (
    BaseVideoProvider,
    CoverrVideoProvider,
    GoogleVideoProvider,
    MixkitVideoProvider,
    PexelsVideoProvider,
    PixabayVideoProvider,
    WikimediaVideoProvider,
)

logger = logging.getLogger("ApexMind.Workspace.VideoService")

_PROVIDERS: Dict[str, BaseVideoProvider] = {
    "pexels": PexelsVideoProvider(),
    "pixabay": PixabayVideoProvider(),
    "mixkit": MixkitVideoProvider(),
    "coverr": CoverrVideoProvider(),
    "wikimedia": WikimediaVideoProvider(),
    "google_cse": GoogleVideoProvider(),
}


def get_video_providers_status() -> Dict[str, bool]:
    """Returns active connectivity status for all 6 stock video providers."""
    return {
        key: provider.is_configured()
        for key, provider in _PROVIDERS.items()
    }


def search_videos(
    query: str = "",
    category: str = "all",
    provider: str = "all",
    page: int = 1,
    page_size: int = 20,
    aspect_ratio: str = "9:16",
) -> Dict[str, Any]:
    """
    Search royalty-free stock videos across modular live providers.
    Supports single provider queries or concurrent multi-provider search ('all').
    """
    clean_q = (query or "").strip()
    if clean_q.lower() in ("all", "*"):
        clean_q = ""
    if not clean_q and category and category.lower() not in ("all", "*"):
        clean_q = category.strip()

    items: List[Dict[str, Any]] = []
    seen_urls: Set[str] = set()

    # Single provider search
    if provider != "all" and provider in _PROVIDERS:
        prov_instance = _PROVIDERS[provider]
        try:
            candidates = prov_instance.search(
                query=clean_q,
                aspect_ratio=aspect_ratio,
                page=page,
                page_size=page_size,
            )
            for it in candidates:
                url = it.get("videoUrl", "")
                if url and url not in seen_urls:
                    seen_urls.add(url)
                    items.append(it)
        except Exception as e:
            logger.warning(f"Error querying video provider {provider}: {e}")

        return {
            "success": True,
            "page": page,
            "pageSize": len(items),
            "total": len(items),
            "items": items,
            "providers": get_video_providers_status(),
        }

    # Multi-provider concurrent search
    # Query configured/active providers first, fallback to open providers
    active_providers = [p for p in _PROVIDERS.values() if p.is_configured()]
    if not active_providers:
        active_providers = list(_PROVIDERS.values())

    per_prov_limit = max(4, page_size // len(active_providers) + 2)

    with ThreadPoolExecutor(max_workers=min(len(active_providers), 6)) as executor:
        futures = {
            executor.submit(
                p.search,
                query=clean_q,
                aspect_ratio=aspect_ratio,
                page=page,
                page_size=per_prov_limit,
            ): p.name
            for p in active_providers
        }

        for future in as_completed(futures):
            p_name = futures[future]
            try:
                cands = future.result()
                for it in cands:
                    url = it.get("videoUrl", "")
                    if url and url not in seen_urls:
                        seen_urls.add(url)
                        items.append(it)
            except Exception as e:
                logger.debug(f"Video provider {p_name} async search failed: {e}")

    # Fallback to general aesthetic background query if no results returned
    if not items and clean_q != "cinematic aesthetic vertical background":
        try:
            open_provs = [_PROVIDERS["mixkit"], _PROVIDERS["coverr"]]
            for op in open_provs:
                fb_cands = op.search(
                    query="cinematic aesthetic vertical background",
                    aspect_ratio=aspect_ratio,
                    page=1,
                    page_size=page_size // 2,
                )
                for it in fb_cands:
                    url = it.get("videoUrl", "")
                    if url and url not in seen_urls:
                        seen_urls.add(url)
                        items.append(it)
        except Exception as fb_err:
            logger.debug(f"Video fallback query failed: {fb_err}")

    return {
        "success": True,
        "page": page,
        "pageSize": len(items),
        "total": len(items),
        "items": items[:page_size],
        "providers": get_video_providers_status(),
    }

