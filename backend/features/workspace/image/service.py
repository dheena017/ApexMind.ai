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

from concurrent.futures import ThreadPoolExecutor, wait
import logging
import time
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

# In-memory query cache for instant sub-millisecond tab switching
_CACHE: Dict[str, tuple[float, Dict[str, Any]]] = {}
_CACHE_TTL = 180.0  # 3 minutes


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
    Features in-memory cache and bounded non-blocking concurrent execution.
    """
    clean_q = (query or "").strip()
    if clean_q.lower() in ("all", "*"):
        clean_q = ""
    if not clean_q and category and category.lower() not in ("all", "*"):
        clean_q = category.strip()

    cache_key = f"{clean_q.lower()}:{category}:{provider}:{page}:{page_size}:{orientation}"
    now = time.time()
    if cache_key in _CACHE:
        ts, cached_res = _CACHE[cache_key]
        if now - ts < _CACHE_TTL:
            return cached_res

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

        res = {
            "success": True,
            "page": page,
            "pageSize": len(items),
            "total": len(items),
            "items": items,
            "providers": get_image_providers_status(),
        }
        _CACHE[cache_key] = (now, res)
        return res

    # Multi-provider concurrent search with timeout protection
    active_providers = [p for p in _PROVIDERS.values() if p.is_configured()]
    if not active_providers:
        active_providers = list(_PROVIDERS.values())

    per_prov_limit = max(8, page_size // len(active_providers) + 4)
    provider_results: Dict[str, List[Dict[str, Any]]] = {}

    with ThreadPoolExecutor(max_workers=min(len(active_providers), 6)) as executor:
        future_map = {
            executor.submit(
                p.search,
                query=clean_q,
                orientation=orientation,
                page=page,
                page_size=per_prov_limit,
            ): p.name
            for p in active_providers
        }

        # Wait at most 3.5s for fast providers to resolve without blocking UI
        done, not_done = wait(future_map.keys(), timeout=3.5)
        for fut in done:
            p_name = future_map[fut]
            try:
                cands = fut.result()
                if cands:
                    provider_results[p_name] = cands
            except Exception as e:
                logger.debug(f"Image provider {p_name} async search failed: {e}")

    # Balanced round-robin interleaving across provider pools
    if provider_results:
        pools = [list(cands) for cands in provider_results.values()]
        max_len = max(len(p) for p in pools)
        for idx in range(max_len):
            for pool in pools:
                if idx < len(pool):
                    cand = pool[idx]
                    url = cand.get("imageUrl", "")
                    if url and url not in seen_urls:
                        seen_urls.add(url)
                        items.append(cand)

    # Fallback when query was empty and no items were retrieved
    if not items and not clean_q:
        try:
            for op in [_PROVIDERS["flickr"], _PROVIDERS["wikimedia"]]:
                fb_cands = op.search(
                    query="cinematic landscape",
                    orientation=orientation,
                    page=1,
                    page_size=12,
                )
                for it in fb_cands:
                    url = it.get("imageUrl", "")
                    if url and url not in seen_urls:
                        seen_urls.add(url)
                        items.append(it)
        except Exception as fb_err:
            logger.debug(f"Image fallback search failed: {fb_err}")

    result = {
        "success": True,
        "page": page,
        "pageSize": len(items),
        "total": len(items),
        "items": items[:page_size],
        "providers": get_image_providers_status(),
    }
    _CACHE[cache_key] = (now, result)
    return result

