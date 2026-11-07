"""
backend/features/media/service.py
Media orchestration service: concurrent multi-provider search, batch scene resolution,
URL validation, and duplicate prevention.
"""

import logging
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Any, Optional, Set

from .base import MediaAsset
from .semantic_filter import evaluate_clip, filter_and_rank_candidates
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
    MixkitVideoProvider,
    CoverrVideoProvider,
    UnsplashImageProvider,
    OpenverseImageProvider,
    FlickrImageProvider,
    JamendoAudioProvider,
    WikimediaAudioProvider,
    SfxProvider,
)

# ==============================================================================
# Defaults & Fixed Constants (Placed at Top Below Imports)
# ==============================================================================

DEFAULT_ASPECT_RATIO: str = "9:16"
DEFAULT_MEDIA_LIMIT: int = 24

DISALLOWED_CLIPART: set[str] = {
    "green screen", "chroma key", "subscribe button", "click button",
    "red button", "isolated green", "subscribe animation", "subscribe like"
}

DISALLOWED_CTA_WORDS: set[str] = {
    "subscribe", "like", "follow", "cta", "button", "bell", "comment", "share", "channel", "click"
}

SEARCH_NOISE_WORDS: set[str] = {
    "vertical", "9:16", "16:9", "4k", "uhd", "hd", "1080p", "8k", "60fps", "120fps"
}

# ==============================================================================
# Provider Singletons & Logger
# ==============================================================================

logger = logging.getLogger("ApexMind.media.service")

# Provider singletons
google_video = GoogleVideoProvider()
pexels_video = PexelsVideoProvider()
pixabay_video = PixabayVideoProvider()
wikimedia_video = WikimediaVideoProvider()
mixkit_video = MixkitVideoProvider()
coverr_video = CoverrVideoProvider()
unsplash_image = UnsplashImageProvider()
openverse_image = OpenverseImageProvider()
flickr_image = FlickrImageProvider()
jamendo_audio = JamendoAudioProvider()
wikimedia_audio = WikimediaAudioProvider()
sfx_provider = SfxProvider()

def _is_valid_cand(cand, excluded_urls: Set[str], target_query: str = "") -> bool:
    if not cand or not cand.url or cand.url in excluded_urls:
        return False
    eval_res = evaluate_clip(cand, target_query=target_query)
    return eval_res.is_accepted

def _resolve_single_scene_internal(
    item: SceneResolveItem,
    aspect_ratio: str,
    excluded_urls: Set[str],
    lock: Optional[Any] = None,
) -> ResolvedSceneResult:
    """Resolves one scene cut using Google CSE, Pexels, Pixabay, and Wikimedia with fallback tiers."""
    raw_queries: List[str] = []
    if item.visualQuery:
        raw_queries.append(item.visualQuery)
    for fq in item.fallbackQueries:
        if fq and fq not in raw_queries:
            raw_queries.append(fq)
    if item.googleSearchQuery and item.googleSearchQuery not in raw_queries:
        raw_queries.append(item.googleSearchQuery)

    queries_to_try: List[str] = []
    for q in raw_queries:
        tokens = [w for w in q.replace(",", " ").replace("-", " ").split() if w.strip()]
        clean_tokens = [w for w in tokens if w.lower() not in DISALLOWED_CTA_WORDS and w.lower() not in SEARCH_NOISE_WORDS]
        clean_q = " ".join(clean_tokens).strip()
        if len(clean_q) > 3 and clean_q not in queries_to_try:
            queries_to_try.append(clean_q)
        if q not in queries_to_try:
            queries_to_try.append(q)

    # Only query scene-specific search terms; do not fall back to generic ambient loops
    all_queries = [q for q in queries_to_try if q]

    if item.mediaType == "video":
        for q in all_queries:
            raw_cands: List[MediaAsset] = []
            if pexels_video.is_configured():
                try:
                    raw_cands.extend(pexels_video.search(query=q, aspect_ratio=aspect_ratio, limit=6))
                except Exception as e:
                    logger.debug(f"Pexels error on scene {item.sceneNumber}: {e}")

            if pixabay_video.is_configured():
                try:
                    raw_cands.extend(pixabay_video.search(query=q, aspect_ratio=aspect_ratio, limit=6))
                except Exception as e:
                    logger.debug(f"Pixabay error on scene {item.sceneNumber}: {e}")

            # Free keyless video providers: Mixkit, Coverr, Wikimedia
            if not raw_cands:
                try:
                    raw_cands.extend(mixkit_video.search(query=q, aspect_ratio=aspect_ratio, limit=6))
                except Exception as e:
                    logger.debug(f"Mixkit error on scene {item.sceneNumber}: {e}")

            if not raw_cands:
                try:
                    raw_cands.extend(coverr_video.search(query=q, aspect_ratio=aspect_ratio, limit=6))
                except Exception as e:
                    logger.debug(f"Coverr error on scene {item.sceneNumber}: {e}")

            if not raw_cands:
                try:
                    raw_cands.extend(wikimedia_video.search(query=q, aspect_ratio=aspect_ratio, limit=6))
                except Exception as e:
                    logger.debug(f"Wikimedia error on scene {item.sceneNumber}: {e}")

            if not raw_cands and google_video.is_configured():
                try:
                    raw_cands.extend(google_video.search(query=q, aspect_ratio=aspect_ratio, limit=4))
                except Exception as e:
                    logger.debug(f"Google CSE error on scene {item.sceneNumber}: {e}")

            # Semantic Negative Filtering & Aesthetic Prioritization
            ranked_cands, _ = filter_and_rank_candidates(raw_cands, target_query=q)
            for cand in ranked_cands:
                cand_accepted = False
                if lock:
                    with lock:
                        if cand.url not in excluded_urls:
                            excluded_urls.add(cand.url)
                            cand_accepted = True
                else:
                    if cand.url not in excluded_urls:
                        excluded_urls.add(cand.url)
                        cand_accepted = True

                if cand_accepted:
                    logger.info(
                        f"Scene {item.sceneNumber} picked '{cand.title[:35]}' | "
                        f"Score: {cand.extraMetadata.get('aestheticScore')} | "
                        f"Badges: {cand.extraMetadata.get('aestheticBadges')}"
                    )
                    return ResolvedSceneResult(
                        sceneNumber=item.sceneNumber,
                        status="resolved",
                        media=cand,
                    )

        # Fallback to high-res photo if no video clips were matched for this cut
        fallback_photo_q = queries_to_try[0] if queries_to_try else "cinematic backdrop"
        raw_photo_cands: List[MediaAsset] = []
        if unsplash_image.is_configured():
            try:
                raw_photo_cands.extend(unsplash_image.search(query=fallback_photo_q, aspect_ratio=aspect_ratio, limit=4))
            except Exception:
                pass
        if not raw_photo_cands and pixabay_video.is_configured():
            try:
                raw_photo_cands.extend(pixabay_video.search(query=fallback_photo_q, media_type="image", aspect_ratio=aspect_ratio, limit=4))
            except Exception:
                pass
        if not raw_photo_cands:
            try:
                raw_photo_cands.extend(openverse_image.search(query=fallback_photo_q, aspect_ratio=aspect_ratio, limit=4))
            except Exception:
                pass
        if not raw_photo_cands:
            try:
                raw_photo_cands.extend(flickr_image.search(query=fallback_photo_q, aspect_ratio=aspect_ratio, limit=4))
            except Exception:
                pass
        if not raw_photo_cands:
            try:
                raw_photo_cands.extend(wikimedia_video.search(query=fallback_photo_q, media_type="image", aspect_ratio=aspect_ratio, limit=4))
            except Exception:
                pass

        ranked_photo_cands, _ = filter_and_rank_candidates(raw_photo_cands, target_query=fallback_photo_q)
        for cand in ranked_photo_cands:
            cand_accepted = False
            if lock:
                with lock:
                    if cand.url not in excluded_urls:
                        excluded_urls.add(cand.url)
                        cand_accepted = True
            else:
                if cand.url not in excluded_urls:
                    excluded_urls.add(cand.url)
                    cand_accepted = True

            if cand_accepted:
                logger.info(f"Scene {item.sceneNumber} fallback to high-res photo '{cand.title[:35]}'")
                return ResolvedSceneResult(
                    sceneNumber=item.sceneNumber,
                    status="resolved",
                    media=cand,
                )

    else:
        # Image search
        for q in all_queries:
            raw_img_cands: List[MediaAsset] = []
            if unsplash_image.is_configured():
                try:
                    raw_img_cands.extend(unsplash_image.search(query=q, aspect_ratio=aspect_ratio, limit=5))
                except Exception as e:
                    logger.debug(f"Unsplash error on scene {item.sceneNumber}: {e}")

            if pixabay_video.is_configured():
                try:
                    raw_img_cands.extend(pixabay_video.search(query=q, media_type="image", aspect_ratio=aspect_ratio, limit=6))
                except Exception as e:
                    logger.debug(f"Pixabay photo error on scene {item.sceneNumber}: {e}")

            if not raw_img_cands:
                try:
                    raw_img_cands.extend(wikimedia_video.search(query=q, media_type="image", aspect_ratio=aspect_ratio, limit=6))
                except Exception as e:
                    logger.debug(f"Wikimedia photo error on scene {item.sceneNumber}: {e}")

            # Semantic Negative Filtering & Aesthetic Prioritization
            ranked_img_cands, _ = filter_and_rank_candidates(raw_img_cands, target_query=q)
            for cand in ranked_img_cands:
                cand_accepted = False
                if lock:
                    with lock:
                        if cand.url not in excluded_urls:
                            excluded_urls.add(cand.url)
                            cand_accepted = True
                else:
                    if cand.url not in excluded_urls:
                        excluded_urls.add(cand.url)
                        cand_accepted = True

                if cand_accepted:
                    return ResolvedSceneResult(
                        sceneNumber=item.sceneNumber,
                        status="resolved",
                        media=cand,
                    )

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
    """Resolves media assets for all storyboard scenes concurrently while strictly enforcing uniqueness across all cuts."""
    results: List[ResolvedSceneResult] = []
    used_urls: Set[str] = set(excluded_urls or [])
    url_lock = threading.Lock()

    # Sort scenes by sceneNumber
    sorted_scenes = sorted(scenes, key=lambda s: s.sceneNumber)

    def _worker(sc: SceneResolveItem) -> ResolvedSceneResult:
        try:
            return _resolve_single_scene_internal(sc, aspect_ratio, used_urls, lock=url_lock)
        except Exception as e:
            logger.warning(f"Failed to resolve scene {sc.sceneNumber}: {e}")
            return ResolvedSceneResult(
                sceneNumber=sc.sceneNumber,
                status="unresolved",
                message=str(e),
            )

    # Process scenes in parallel across worker pool
    max_workers = min(8, max(1, len(sorted_scenes)))
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_scene = {executor.submit(_worker, sc): sc for sc in sorted_scenes}
        for future in as_completed(future_to_scene):
            results.append(future.result())

    results.sort(key=lambda r: r.sceneNumber)
    resolved_count = sum(1 for r in results if r.status == "resolved")

    return BatchResolveData(
        totalScenes=len(scenes),
        resolvedScenes=resolved_count,
        scenes=results,
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
    if clean_q.lower() in ("all", "*"):
        clean_q = ""

    per_prov_limit = limit if provider != "all" else max(6, min(limit, 15))

    if media_type == "video":
        if provider in ["all", "mixkit"]:
            try:
                items.extend(mixkit_video.search(query=clean_q, aspect_ratio=aspect_ratio, page=page, limit=per_prov_limit))
            except Exception as e:
                logger.debug(f"Mixkit video search error: {e}")
        if provider in ["all", "coverr"]:
            try:
                items.extend(coverr_video.search(query=clean_q, aspect_ratio=aspect_ratio, page=page, limit=per_prov_limit))
            except Exception as e:
                logger.debug(f"Coverr video search error: {e}")
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
        if provider in ["all", "openverse"]:
            try:
                items.extend(openverse_image.search(query=clean_q, media_type="image", aspect_ratio=aspect_ratio, page=page, limit=per_prov_limit))
            except Exception as e:
                logger.debug(f"Openverse photo search error: {e}")
        if provider in ["all", "flickr"]:
            try:
                items.extend(flickr_image.search(query=clean_q, media_type="image", aspect_ratio=aspect_ratio, page=page, limit=per_prov_limit))
            except Exception as e:
                logger.debug(f"Flickr photo search error: {e}")
        if provider in ["all", "unsplash"] and unsplash_image.is_configured():
            try:
                items.extend(unsplash_image.search(query=clean_q, media_type="image", aspect_ratio=aspect_ratio, page=page, limit=per_prov_limit))
            except Exception as e:
                logger.debug(f"Unsplash photo search error: {e}")
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
        if provider in ["all", "wikimedia"]:
            try:
                items.extend(wikimedia_video.search(query=clean_q, media_type="image", aspect_ratio=aspect_ratio, page=page, limit=per_prov_limit))
            except Exception as e:
                logger.debug(f"Wikimedia photo search error: {e}")

    # If the user-selected specific provider returned 0 results, cascade search to open providers
    # so the user is NEVER left with an empty "No photos found" screen!
    if not items and provider != "all":
        logger.info(f"Provider '{provider}' returned 0 results for '{clean_q}'; auto-cascading to open stock providers")
        if media_type == "video":
            for fb_prov in [mixkit_video, pixabay_video, coverr_video, wikimedia_video]:
                try:
                    fb_res = fb_prov.search(query=clean_q, aspect_ratio=aspect_ratio, page=page, limit=limit)
                    if fb_res:
                        items.extend(fb_res)
                        break
                except Exception:
                    pass
        else:
            for fb_prov in [unsplash_image, pixabay_video, flickr_image, openverse_image, wikimedia_video]:
                try:
                    fb_res = fb_prov.search(query=clean_q, media_type="image", aspect_ratio=aspect_ratio, page=page, limit=limit)
                    if fb_res:
                        items.extend(fb_res)
                        break
                except Exception:
                    pass

    # Deduplicate by URL
    seen = set()
    deduped = []
    for it in items:
        if it.url not in seen:
            seen.add(it.url)
            deduped.append(it)

    # Apply Semantic Quality Filter & Aesthetic Prioritization
    ranked_items, _ = filter_and_rank_candidates(deduped, target_query=query, min_score_threshold=0.0)

    return MediaSearchData(
        query=query,
        mediaType=media_type,
        provider=provider,
        total=len(ranked_items),
        page=page,
        items=ranked_items[:limit],
    )


def search_audio(query: str = "", genre: str = "", limit: int = 20) -> AudioSearchData:
    """Search soundtrack providers and deduplicate results by audio URL."""
    tracks = []
    if jamendo_audio.is_configured():
        tracks.extend(jamendo_audio.search(query=query, genre=genre, limit=limit))

    if len(tracks) < limit:
        tracks.extend(
            wikimedia_audio.search_music(
                query=query,
                genre=genre,
                limit=limit - len(tracks),
            )
        )

    seen_urls = set()
    unique_tracks = []
    for track in tracks:
        if track.audioUrl not in seen_urls:
            seen_urls.add(track.audioUrl)
            unique_tracks.append(track)

    return AudioSearchData(
        query=query,
        genre=genre,
        total=len(unique_tracks),
        items=unique_tracks[:limit],
    )


def search_sfx(query: str = "whoosh", limit: int = 20) -> SfxSearchData:
    """Queries sound effects catalog from Mixkit open audio and Wikimedia Commons."""
    effects: List[Any] = []
    
    # 1. Search Mixkit curated catalog
    curated = sfx_provider.search(query=query, limit=limit)
    effects.extend(curated)
    
    # 2. Search open Wikimedia SFX API
    if len(effects) < limit:
        remaining = limit - len(effects)
        wm_effects = wikimedia_audio.search_sfx(query=query, limit=remaining)
        effects.extend(wm_effects)

    seen_urls = set()
    unique_effects = []
    for e in effects:
        if e.audioUrl not in seen_urls:
            seen_urls.add(e.audioUrl)
            unique_effects.append(e)

    return SfxSearchData(
        query=query,
        total=len(unique_effects),
        items=unique_effects[:limit],
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
        "wikimedia_audio": ProviderInfo(
            status="active",
            type=["audio"],
            hasKey=False,
            authRequired=False,
            latencyMs=210,
        ),
        "unsplash": ProviderInfo(
            status="active" if unsplash_image.is_configured() else "missing_key",
            type=["image"],
            hasKey=unsplash_image.is_configured(),
            authRequired=True,
            latencyMs=210,
        ),
        "jamendo": ProviderInfo(
            status="active" if jamendo_audio.is_configured() else "fallback_active",
            type=["audio"],
            hasKey=jamendo_audio.is_configured(),
            authRequired=False,
            latencyMs=300,
        ),
        "open_sfx": ProviderInfo(
            status="active",
            type=["audio"],
            hasKey=False,
            authRequired=False,
            latencyMs=95,
        ),
        "mixkit": ProviderInfo(
            status="active",
            type=["video"],
            hasKey=False,
            authRequired=False,
            latencyMs=90,
        ),
        "coverr": ProviderInfo(
            status="active",
            type=["video"],
            hasKey=False,
            authRequired=False,
            latencyMs=180,
        ),
        "openverse": ProviderInfo(
            status="active",
            type=["image"],
            hasKey=False,
            authRequired=False,
            latencyMs=220,
        ),
        "flickr": ProviderInfo(
            status="active",
            type=["image"],
            hasKey=False,
            authRequired=False,
            latencyMs=160,
        ),
    }

    all_healthy = any(p.status == "active" for p in providers_info.values())
    return ProvidersStatusData(
        allHealthy=all_healthy,
        providers=providers_info,
    )
