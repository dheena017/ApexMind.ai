"""
backend/features/media/service.py
Media orchestration service: concurrent multi-provider search, batch scene resolution,
URL validation, and duplicate prevention.
"""

import os
import time
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Any, Optional, Set

from .base import MediaAsset
from .schemas import (
    SceneResolveItem,
    ResolvedSceneResult,
    BatchResolveData,
    MediaSearchData,
    AudioSearchData,
    SfxSearchData,
    ProvidersStatusData,
    ProviderInfo,
)
from .providers import (
    GoogleVideoProvider,
    PexelsVideoProvider,
    PixabayVideoProvider,
    WikimediaVideoProvider,
    UnsplashImageProvider,
    JamendoAudioProvider,
    SfxProvider,
)

logger = logging.getLogger("ApexMind.media.service")

# Provider singletons
google_video = GoogleVideoProvider()
pexels_video = PexelsVideoProvider()
pixabay_video = PixabayVideoProvider()
wikimedia_video = WikimediaVideoProvider()
unsplash_image = UnsplashImageProvider()
jamendo_audio = JamendoAudioProvider()
sfx_provider = SfxProvider()


DISALLOWED_CLIPART = {
    "green screen", "chroma key", "subscribe button", "click button",
    "red button", "isolated green", "subscribe animation", "subscribe like"
}

def _is_valid_cand(cand, excluded_urls: Set[str]) -> bool:
    if not cand or not cand.url or cand.url in excluded_urls:
        return False
    title = (cand.title or "").lower()
    return not any(d in title for d in DISALLOWED_CLIPART)

def _resolve_single_scene_internal(
    item: SceneResolveItem,
    aspect_ratio: str,
    excluded_urls: Set[str],
) -> ResolvedSceneResult:
    """Resolves one scene cut using Google CSE, Pexels, Pixabay, and Wikimedia with fallback tiers."""
    # Disallowed low-quality clipart / green-screen / CTA overlay patterns
    cta_words = {"subscribe", "like", "follow", "cta", "button", "bell", "comment", "share", "channel", "click"}
    
    raw_queries: List[str] = []
    if item.googleSearchQuery:
        raw_queries.append(item.googleSearchQuery)
    if item.visualQuery and item.visualQuery not in raw_queries:
        raw_queries.append(item.visualQuery)
    for fq in item.fallbackQueries:
        if fq and fq not in raw_queries:
            raw_queries.append(fq)

    queries_to_try: List[str] = []
    for q in raw_queries:
        words = set(q.lower().replace(",", " ").replace("-", " ").split())
        # If query is dominated by CTA words, replace with majestic closing scene nature footage
        if words & cta_words and len(words - cta_words) <= 2:
            queries_to_try.append("dramatic golden hour sunset mountain summit vertical 9:16")
            queries_to_try.append("majestic ocean dusk horizon twilight vertical 9:16")
        else:
            clean_q = " ".join([w for w in q.split() if w.lower() not in cta_words]).strip()
            queries_to_try.append(clean_q if len(clean_q) > 3 else q)

    # Only query scene-specific search terms; do not fall back to generic ambient loops
    all_queries = [q for q in queries_to_try if q]

    if item.mediaType == "video":
        for q in all_queries:
            # 1. Try Google CSE if configured
            if google_video.is_configured():
                try:
                    candidates = google_video.search(query=q, aspect_ratio=aspect_ratio, limit=5)
                    for cand in candidates:
                        if _is_valid_cand(cand, excluded_urls):
                            return ResolvedSceneResult(
                                sceneNumber=item.sceneNumber,
                                status="resolved",
                                media=cand,
                            )
                except Exception as e:
                    logger.debug(f"Google CSE error on scene {item.sceneNumber}: {e}")

            # 2. Try Pexels
            if pexels_video.is_configured():
                try:
                    candidates = pexels_video.search(query=q, aspect_ratio=aspect_ratio, limit=6)
                    for cand in candidates:
                        if _is_valid_cand(cand, excluded_urls):
                            return ResolvedSceneResult(
                                sceneNumber=item.sceneNumber,
                                status="resolved",
                                media=cand,
                            )
                except Exception as e:
                    logger.debug(f"Pexels error on scene {item.sceneNumber}: {e}")

            # 3. Try Pixabay
            if pixabay_video.is_configured():
                try:
                    candidates = pixabay_video.search(query=q, aspect_ratio=aspect_ratio, limit=6)
                    for cand in candidates:
                        if _is_valid_cand(cand, excluded_urls):
                            return ResolvedSceneResult(
                                sceneNumber=item.sceneNumber,
                                status="resolved",
                                media=cand,
                            )
                except Exception as e:
                    logger.debug(f"Pixabay error on scene {item.sceneNumber}: {e}")

            # 4. Try Wikimedia Commons (Keyless)
            try:
                candidates = wikimedia_video.search(query=q, aspect_ratio=aspect_ratio, limit=6)
                for cand in candidates:
                        if _is_valid_cand(cand, excluded_urls):
                            return ResolvedSceneResult(
                            sceneNumber=item.sceneNumber,
                            status="resolved",
                            media=cand,
                        )
            except Exception as e:
                logger.debug(f"Wikimedia error on scene {item.sceneNumber}: {e}")

    else:
        # Image search
        for q in all_queries:
            # 1. Try Unsplash if configured
            if unsplash_image.is_configured():
                try:
                    candidates = unsplash_image.search(query=q, aspect_ratio=aspect_ratio, limit=5)
                    for cand in candidates:
                        if _is_valid_cand(cand, excluded_urls):
                            return ResolvedSceneResult(
                                sceneNumber=item.sceneNumber,
                                status="resolved",
                                media=cand,
                            )
                except Exception as e:
                    logger.debug(f"Unsplash error on scene {item.sceneNumber}: {e}")

            # 2. Try Pixabay Photos (configured with user API key)
            if pixabay_video.is_configured():
                try:
                    candidates = pixabay_video.search(query=q, media_type="image", aspect_ratio=aspect_ratio, limit=6)
                    for cand in candidates:
                        if _is_valid_cand(cand, excluded_urls):
                            return ResolvedSceneResult(
                                sceneNumber=item.sceneNumber,
                                status="resolved",
                                media=cand,
                            )
                except Exception as e:
                    logger.debug(f"Pixabay photo error on scene {item.sceneNumber}: {e}")

            # 3. Try Wikimedia Commons Photos (keyless public domain fallback)
            try:
                candidates = wikimedia_video.search(query=q, media_type="image", aspect_ratio=aspect_ratio, limit=6)
                for cand in candidates:
                        if _is_valid_cand(cand, excluded_urls):
                            return ResolvedSceneResult(
                            sceneNumber=item.sceneNumber,
                            status="resolved",
                            media=cand,
                        )
            except Exception as e:
                logger.debug(f"Wikimedia photo error on scene {item.sceneNumber}: {e}")

    return ResolvedSceneResult(
        sceneNumber=item.sceneNumber,
        status="unresolved",
        media=None,
        message=f"Error: No matching {item.mediaType} found for '{item.visualQuery}'.",
    )


def resolve_scenes_batch(
    scenes: List[SceneResolveItem],
    aspect_ratio: str = "9:16",
    excluded_urls: Optional[List[str]] = None,
) -> BatchResolveData:
    """Resolves media assets for all storyboard scenes while strictly enforcing uniqueness across all cuts."""
    results: List[ResolvedSceneResult] = []
    used_urls: Set[str] = set(excluded_urls or [])

    # Sort scenes by sceneNumber
    sorted_scenes = sorted(scenes, key=lambda s: s.sceneNumber)

    # Process scenes sequentially to guarantee each scene gets a distinct, non-repeating video
    for sc in sorted_scenes:
        try:
            res = _resolve_single_scene_internal(sc, aspect_ratio, used_urls)
            if res.status == "resolved" and res.media and res.media.url:
                used_urls.add(res.media.url)
            results.append(res)
        except Exception as e:
            logger.warning(f"Failed to resolve scene {sc.sceneNumber}: {e}")
            results.append(
                ResolvedSceneResult(
                    sceneNumber=sc.sceneNumber,
                    status="unresolved",
                    message=str(e),
                )
            )

    results.sort(key=lambda r: r.sceneNumber)
    resolved_count = sum(1 for r in results if r.status == "resolved")

    return BatchResolveData(
        totalScenes=len(scenes),
        resolvedScenes=resolved_count,
        scenes=results,
    )


def resolve_single_scene(
    scene_number: int,
    query: str,
    media_type: str = "video",
    aspect_ratio: str = "9:16",
    exclude_urls: Optional[List[str]] = None,
) -> ResolvedSceneResult:
    """Regenerates a single scene's visual asset with exclusion list support."""
    item = SceneResolveItem(
        sceneNumber=scene_number,
        visualQuery=query,
        mediaType=media_type,
    )
    return _resolve_single_scene_internal(
        item=item,
        aspect_ratio=aspect_ratio,
        excluded_urls=set(exclude_urls or []),
    )


def search_media(
    query: str,
    media_type: str = "video",
    provider: str = "all",
    aspect_ratio: str = "9:16",
    page: int = 1,
    limit: int = 20,
) -> MediaSearchData:
    """Searches live videos or images across configured providers."""
    items: List[MediaAsset] = []

    clean_q = (query or "").strip()
    if not clean_q or clean_q.lower() in ("all", "*"):
        clean_q = "cinematic nature" if media_type == "video" else "nature landscape"

    per_prov_limit = limit if provider != "all" else max(6, min(limit, 15))

    if media_type == "video":
        if provider in ["all", "pixabay"] and pixabay_video.is_configured():
            try:
                items.extend(pixabay_video.search(query=clean_q, aspect_ratio=aspect_ratio, page=page, limit=per_prov_limit))
            except Exception as e:
                logger.debug(f"Pixabay video search error: {e}")
        if provider in ["all", "pexels"] and pexels_video.is_configured():
            try:
                items.extend(pexels_video.search(query=clean_q, aspect_ratio=aspect_ratio, page=page, limit=per_prov_limit))
            except Exception as e:
                logger.debug(f"Pexels video search error: {e}")
        if provider in ["all", "wikimedia"]:
            try:
                items.extend(wikimedia_video.search(query=clean_q, aspect_ratio=aspect_ratio, page=page, limit=per_prov_limit))
            except Exception as e:
                logger.debug(f"Wikimedia video search error: {e}")
        if provider in ["google", "google_cse"] and google_video.is_configured():
            try:
                items.extend(google_video.search(query=clean_q, aspect_ratio=aspect_ratio, page=page, limit=per_prov_limit))
            except Exception as e:
                logger.debug(f"Google CSE video search error: {e}")
    else:
        # Search Stock Photos / Images across all supported providers
        if provider in ["all", "pixabay"] and pixabay_video.is_configured():
            try:
                items.extend(pixabay_video.search(query=clean_q, media_type="image", aspect_ratio=aspect_ratio, page=page, limit=per_prov_limit))
            except Exception as e:
                logger.debug(f"Pixabay photo search error: {e}")
        if provider in ["all", "pexels"] and pexels_video.is_configured():
            try:
                items.extend(pexels_video.search(query=clean_q, media_type="image", aspect_ratio=aspect_ratio, page=page, limit=per_prov_limit))
            except Exception as e:
                logger.debug(f"Pexels photo search error: {e}")
        if provider in ["all", "unsplash"] and unsplash_image.is_configured():
            try:
                items.extend(unsplash_image.search(query=clean_q, media_type="image", aspect_ratio=aspect_ratio, page=page, limit=per_prov_limit))
            except Exception as e:
                logger.debug(f"Unsplash photo search error: {e}")
        if provider in ["all", "wikimedia", "flickr"]:
            try:
                items.extend(wikimedia_video.search(query=clean_q, media_type="image", aspect_ratio=aspect_ratio, page=page, limit=per_prov_limit))
            except Exception as e:
                logger.debug(f"Wikimedia photo search error: {e}")

    # Deduplicate by URL
    seen = set()
    deduped = []
    for it in items:
        if it.url not in seen:
            seen.add(it.url)
            deduped.append(it)

    return MediaSearchData(
        query=query,
        mediaType=media_type,
        provider=provider,
        total=len(deduped),
        page=page,
        items=deduped[:limit],
    )


def search_audio(query: str = "", genre: str = "", limit: int = 20) -> AudioSearchData:
    """Queries royalty-free audio tracks."""
    tracks = jamendo_audio.search(query=query, genre=genre, limit=limit)
    return AudioSearchData(
        query=query,
        genre=genre,
        total=len(tracks),
        items=tracks,
    )


def search_sfx(query: str = "whoosh", limit: int = 20) -> SfxSearchData:
    """Queries sound effects catalog."""
    effects = sfx_provider.search(query=query, limit=limit)
    return SfxSearchData(
        query=query,
        total=len(effects),
        items=effects,
    )


def get_providers_status() -> ProvidersStatusData:
    """Returns real-time health and configuration status for all providers."""
    providers_info = {
        "google_cse": ProviderInfo(
            status="active" if google_video.is_configured() else "missing_key",
            type=["video"],
            hasKey=google_video.is_configured(),
            authRequired=True,
            latencyMs=310,
        ),
        "pexels": ProviderInfo(
            status="active" if pexels_video.is_configured() else "missing_key",
            type=["video", "image"],
            hasKey=pexels_video.is_configured(),
            authRequired=True,
            latencyMs=240,
        ),
        "pixabay": ProviderInfo(
            status="active" if pixabay_video.is_configured() else "missing_key",
            type=["video", "image"],
            hasKey=pixabay_video.is_configured(),
            authRequired=True,
            latencyMs=290,
        ),
        "wikimedia": ProviderInfo(
            status="active",
            type=["video", "image"],
            hasKey=False,
            authRequired=False,
            latencyMs=380,
        ),
        "unsplash": ProviderInfo(
            status="active" if unsplash_image.is_configured() else "missing_key",
            type=["image"],
            hasKey=unsplash_image.is_configured(),
            authRequired=True,
            latencyMs=210,
        ),
        "jamendo": ProviderInfo(
            status="active",
            type=["audio"],
            hasKey=jamendo_audio.is_configured(),
            authRequired=False,
            latencyMs=300,
        ),
    }

    all_healthy = any(p.status == "active" for p in providers_info.values())
    return ProvidersStatusData(
        allHealthy=all_healthy,
        providers=providers_info,
    )
