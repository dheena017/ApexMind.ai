"""
backend/features/workspace/image/service.py
Central stock photo service orchestrating 6 modular live image providers:
- Unsplash High-Resolution Photography (`unsplash`)
- Pexels Curated Photography (`pexels`)
- Pixabay Global Stock Images (`pixabay`)
- Openverse 700M+ CC0 Cultural Photos (`openverse`)
- Flickr Real-World Public Stream (`flickr`)
- Wikimedia Commons Public Domain Imagery (`wikimedia`)

Zero hardcoded arrays - 100% dynamic multi-provider image discovery and streaming.
"""

from concurrent.futures import ThreadPoolExecutor, as_completed
import logging
from typing import Any, Dict, List, Set

from .providers import (
    BaseImageProvider,
    FlickrImageProvider,
    OpenverseImageProvider,
    PexelsImageProvider,
    PixabayImageProvider,
    UnsplashImageProvider,
    WikimediaImageProvider,
)

logger = logging.getLogger("ApexMind.Workspace.ImageService")

_PROVIDERS: Dict[str, BaseImageProvider] = {
    "unsplash": UnsplashImageProvider(),
    "pexels": PexelsImageProvider(),
    "pixabay": PixabayImageProvider(),
    "openverse": OpenverseImageProvider(),
    "flickr": FlickrImageProvider(),
    "wikimedia": WikimediaImageProvider(),
}


def get_image_providers_status() -> Dict[str, bool]:
    """Returns active connectivity status for all 6 stock image providers."""
    return {
        key: provider.is_configured()
        for key, provider in _PROVIDERS.items()
    }


def search_images(
    query: str = "",
    category: str = "all",
    provider: str = "all",
    page: int = 1,
    page_size: int = 24,
    orientation: str = "portrait",
) -> Dict[str, Any]:
    """
    Search stock photos and images across modular live providers.
    Supports single provider queries or concurrent multi-provider search ('all').
    """
    has_user_query = bool((query or "").strip() and (query or "").strip().lower() not in ("all", "*"))
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
        if not prov_instance.is_configured():
            candidates = []
            for fallback_p in [p for p in _PROVIDERS.values() if p.is_configured()]:
                try:
                    cands = fallback_p.search(
                        query=clean_q,
                        orientation=orientation,
                        page=page,
                        page_size=max(page_size // 2, 8),
                    )
                    candidates.extend(cands)
                except Exception:
                    pass
        else:
            try:
                candidates = prov_instance.search(
                    query=clean_q,
                    orientation=orientation,
                    page=page,
                    page_size=page_size,
                )
            except Exception as e:
                logger.warning(f"Error querying image provider {provider}: {e}")
                candidates = []

        for it in candidates:
            url = it.get("imageUrl", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                items.append(it)

        return {
            "success": True,
            "page": page,
            "pageSize": len(items),
            "total": len(items),
            "items": items,
            "providers": get_image_providers_status(),
        }

    # Multi-provider concurrent search
    active_providers = [p for p in _PROVIDERS.values() if p.is_configured()]
    if not active_providers:
        active_providers = list(_PROVIDERS.values())

    per_prov_limit = max(4, page_size // len(active_providers) + 2)

    with ThreadPoolExecutor(max_workers=min(len(active_providers), 6)) as executor:
        futures = {
            executor.submit(
                p.search,
                query=clean_q,
                orientation=orientation,
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
                    url = it.get("imageUrl", "")
                    if url and url not in seen_urls:
                        seen_urls.add(url)
                        items.append(it)
            except Exception as e:
                logger.debug(f"Image provider {p_name} async search failed: {e}")

    # Fallback ONLY when query was empty and no items were retrieved
    if not items and not has_user_query:
        try:
            open_provs = [_PROVIDERS["openverse"], _PROVIDERS["wikimedia"], _PROVIDERS["flickr"]]
            for op in open_provs:
                fb_cands = op.search(
                    query="aesthetic landscape photography",
                    orientation=orientation,
                    page=1,
                    page_size=page_size // 3,
                )
                for it in fb_cands:
                    url = it.get("imageUrl", "")
                    if url and url not in seen_urls:
                        seen_urls.add(url)
                        items.append(it)
        except Exception as fb_err:
            logger.debug(f"Image fallback search failed: {fb_err}")

    return {
        "success": True,
        "page": page,
        "pageSize": len(items),
        "total": len(items),
        "items": items[:page_size],
        "providers": get_image_providers_status(),
    }

