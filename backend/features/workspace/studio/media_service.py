"""
backend/features/workspace/studio/media_service.py
Stage 3 of the ApexMind Studio Production Pipeline.
Batch-resolves real stock video/image URLs for every storyboard scene,
resolves SFX audio URLs for sound events, and returns background metadata.
Delegates directly to modular workspace video, image, and audio engines.
"""

from datetime import datetime, timezone
import logging
import time
from typing import Any, Dict, List, Optional

from backend.features.workspace.audio import search_sound_effects
from backend.features.workspace.image import search_images
from backend.features.workspace.video import search_videos

STAGE_ID: str = "media"
DEFAULT_ASPECT_RATIO: str = "9:16"
DEFAULT_SFX_QUERY: str = "whoosh impact"
DEFAULT_SFX_DURATION: float = 1.5
DEFAULT_VISUAL_QUERY: str = "cinematic landscape"

logger = logging.getLogger("ApexMind.Studio.Media")


def _resolve_sfx_events(sfx_events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Attempt to resolve SFX audio URLs using modular audio SFX providers.
    Falls back gracefully if no URL is found.
    """
    resolved = []
    for event in sfx_events:
        query = event.get("searchQuery") or event.get("label") or DEFAULT_SFX_QUERY
        try:
            result = search_sound_effects(query=query, page_size=3)
            items = result.get("items", [])
            item = items[0] if items else None
            if item and item.get("audioUrl"):
                resolved.append({
                    "time": event.get("time", 0.0),
                    "sfxId": event.get("sfxId", ""),
                    "label": event.get("label", ""),
                    "status": "resolved",
                    "sfxUrl": item.get("audioUrl"),
                    "durationSeconds": float(item.get("duration") or DEFAULT_SFX_DURATION),
                    "provider": item.get("provider", "sfx"),
                })
            else:
                resolved.append({**event, "status": "unresolved", "sfxUrl": None, "provider": None})
        except Exception as exc:
            logger.warning(f"[Studio/Media] SFX resolution failed for '{query}': {exc}")
            resolved.append({**event, "status": "unresolved", "sfxUrl": None, "provider": None})

    return resolved


def run_studio_media(
    scenes: List[Dict[str, Any]],
    aspect_ratio: str = DEFAULT_ASPECT_RATIO,
    sfx_events: Optional[List[Dict[str, Any]]] = None,
    backdrop_id: Optional[str] = None,
    resolve_background: bool = True,
    resolve_images: bool = False,
) -> Dict[str, Any]:
    """
    Studio pipeline Stage 3: Resolve media for all storyboard scenes.
    """
    if not scenes:
        return {
            "success": True,
            "stageId": STAGE_ID,
            "data": {
                "scenes": [],
                "sfxEvents": [],
                "background": {"backdropId": backdrop_id, "status": "none"},
                "resolvedCount": 0,
                "failedCount": 0,
                "totalScenes": 0,
            },
            "generatedAt": datetime.now(timezone.utc).isoformat(),
        }

    logger.info(
        f"--> [API SENT] Workspace Media Engines | Resolving stock B-Roll for {len(scenes)} scenes (Aspect: {aspect_ratio})"
    )
    t0 = time.perf_counter()

    resolved_scenes = []
    resolved_count = 0
    failed_count = 0

    for idx, s in enumerate(scenes):
        visual_query = (
            s.get("visualQuery")
            or s.get("subtitleText")
            or s.get("googleSearchQuery")
            or DEFAULT_VISUAL_QUERY
        )
        media_type = s.get("mediaType") or "video"

        if media_type == "image":
            orient = "portrait" if aspect_ratio in ["9:16", "4:5"] else ("square" if aspect_ratio == "1:1" else "landscape")
            try:
                res = search_images(query=visual_query, orientation=orient, page=1, page_size=5)
                items = res.get("items", [])
            except Exception as e:
                logger.debug(f"[Studio/Media] Image search failed: {e}")
                items = []

            if items:
                chosen = items[0]
                media_dict = {
                    "id": chosen.get("id"),
                    "url": chosen.get("imageUrl") or chosen.get("url"),
                    "previewUrl": chosen.get("previewUrl") or chosen.get("imageUrl"),
                    "thumbnailUrl": chosen.get("thumbnailUrl") or chosen.get("thumbnail"),
                    "title": chosen.get("title", ""),
                    "width": chosen.get("width") or (1080 if orient == "portrait" else 1920),
                    "height": chosen.get("height") or (1920 if orient == "portrait" else 1080),
                    "duration": None,
                    "provider": chosen.get("provider", "image"),
                    "license": "CC0 / Stock",
                    "aestheticScore": 0.90,
                    "aestheticBadges": ["HD", "Stock"],
                    "positiveMatches": [visual_query],
                }
                resolved_count += 1
                resolved_scenes.append({
                    "sceneNumber": s.get("sceneNumber", idx + 1),
                    "status": "resolved",
                    "mediaType": "image",
                    "provider": chosen.get("provider", "image"),
                    "media": media_dict,
                    "message": "Resolved successfully",
                })
            else:
                failed_count += 1
                resolved_scenes.append({
                    "sceneNumber": s.get("sceneNumber", idx + 1),
                    "status": "failed",
                    "mediaType": "image",
                    "provider": None,
                    "media": None,
                    "message": "No matching images found",
                })
        else:
            try:
                res = search_videos(query=visual_query, aspect_ratio=aspect_ratio, page=1, page_size=5)
                items = res.get("items", [])
            except Exception as e:
                logger.debug(f"[Studio/Media] Video search failed: {e}")
                items = []

            if items:
                chosen = items[0]
                media_dict = {
                    "id": chosen.get("id"),
                    "url": chosen.get("videoUrl"),
                    "previewUrl": chosen.get("previewUrl") or chosen.get("videoUrl"),
                    "thumbnailUrl": chosen.get("posterUrl") or chosen.get("previewUrl"),
                    "title": chosen.get("title", ""),
                    "width": 1080 if aspect_ratio in ["9:16", "4:5"] else 1920,
                    "height": 1920 if aspect_ratio in ["9:16", "4:5"] else 1080,
                    "duration": float(chosen.get("duration", 10.0)),
                    "provider": chosen.get("provider", "video"),
                    "license": "Stock Free License",
                    "aestheticScore": float(chosen.get("aestheticScore", 0.88)),
                    "aestheticBadges": chosen.get("aestheticBadges", ["HD"]),
                    "positiveMatches": [visual_query],
                }
                resolved_count += 1
                resolved_scenes.append({
                    "sceneNumber": s.get("sceneNumber", idx + 1),
                    "status": "resolved",
                    "mediaType": "video",
                    "provider": chosen.get("provider", "video"),
                    "media": media_dict,
                    "message": "Resolved successfully",
                })
            else:
                failed_count += 1
                resolved_scenes.append({
                    "sceneNumber": s.get("sceneNumber", idx + 1),
                    "status": "failed",
                    "mediaType": "video",
                    "provider": None,
                    "media": None,
                    "message": "No matching videos found",
                })

    # Resolve SFX events
    resolved_sfx = _resolve_sfx_events(sfx_events or [])

    # Background / backdrop metadata
    background_info: Dict[str, Any] = {
        "backdropId": backdrop_id,
        "status": "catalog" if backdrop_id else "none",
        "backgroundUrl": None,
        "particleEffect": None,
        "previewColor": None,
    }

    elapsed_ms = int((time.perf_counter() - t0) * 1000)
    logger.info(
        f"<-- [API COMING] Stock Media API | Resolved {resolved_count}/{len(scenes)} clips in {elapsed_ms}ms (sfx={len(resolved_sfx)})"
    )

    return {
        "success": True,
        "stageId": STAGE_ID,
        "data": {
            "scenes": resolved_scenes,
            "sfxEvents": resolved_sfx,
            "background": background_info,
            "resolvedCount": resolved_count,
            "failedCount": failed_count,
            "totalScenes": len(scenes),
        },
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }

