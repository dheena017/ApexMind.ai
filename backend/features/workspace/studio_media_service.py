"""
backend/features/workspace/studio_media_service.py
Stage 3 of the ApexMind Studio Pipeline.
Batch-resolves real stock video/image URLs for every storyboard scene,
resolves SFX audio URLs for sound events, and returns background metadata.
Delegates to the existing backend.features.media engine.
"""

import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger("ApexMind.Studio.Media")


def _resolve_sfx_events(sfx_events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Attempt to resolve SFX audio URLs using the SFX provider.
    Falls back gracefully if no URL is found.
    """
    try:
        from backend.features.media import search_sfx
    except ImportError:
        logger.warning("[Studio/Media] SFX provider not available; skipping SFX resolution.")
        return [
            {**e, "status": "unresolved", "sfxUrl": None, "provider": None}
            for e in sfx_events
        ]

    resolved = []
    for event in sfx_events:
        query = event.get("searchQuery") or event.get("label") or "whoosh impact"
        try:
            result = search_sfx(query=query, limit=3)
            item = result.items[0] if result and result.items else None
            if item and item.audioUrl:
                resolved.append({
                    "time": event.get("time", 0.0),
                    "sfxId": event.get("sfxId", ""),
                    "label": event.get("label", ""),
                    "status": "resolved",
                    "sfxUrl": item.audioUrl,
                    "durationSeconds": item.duration or 1.5,
                    "provider": item.provider,
                })
            else:
                resolved.append({**event, "status": "unresolved", "sfxUrl": None, "provider": None})
        except Exception as exc:
            logger.warning(f"[Studio/Media] SFX resolution failed for '{query}': {exc}")
            resolved.append({**event, "status": "unresolved", "sfxUrl": None, "provider": None})

    return resolved


def _build_scene_resolve_items(scenes: List[Dict[str, Any]]):
    """Convert raw scene dicts into SceneResolveItem objects."""
    from backend.features.media.schemas import SceneResolveItem
    items = []
    for s in scenes:
        items.append(SceneResolveItem(
            sceneNumber=s.get("sceneNumber", 1),
            visualQuery=s.get("visualQuery") or s.get("subtitleText") or "cinematic landscape",
            googleSearchQuery=s.get("googleSearchQuery"),
            fallbackQueries=s.get("fallbackQueries") or [],
            mediaType=s.get("mediaType") or "video",
        ))
    return items


def run_studio_media(
    scenes: List[Dict[str, Any]],
    aspect_ratio: str = "9:16",
    sfx_events: Optional[List[Dict[str, Any]]] = None,
    backdrop_id: Optional[str] = None,
    resolve_background: bool = True,
    resolve_images: bool = False,
) -> Dict[str, Any]:
    """
    Studio pipeline Stage 3: Resolve media for all storyboard scenes.

    Returns a pipeline-ready envelope with:
      - stageId: "media"
      - data.scenes[]: {sceneNumber, status, mediaType, provider, media{url, thumbnailUrl, ...}}
      - data.sfxEvents[]: {time, sfxUrl, status, provider}
      - data.background: {backdropId, status}
      - data.resolvedCount / failedCount / totalScenes
    """
    if not scenes:
        return {
            "success": True,
            "stageId": "media",
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
        f"[Studio/Media] Starting Stage 3 | scenes={len(scenes)} "
        f"sfxEvents={len(sfx_events or [])} aspect={aspect_ratio}"
    )
    t0 = time.perf_counter()

    # ── Resolve scene media via existing batch engine ──────────────────────────
    try:
        from backend.features.media.service import resolve_scenes_batch
        scene_items = _build_scene_resolve_items(scenes)
        batch_data = resolve_scenes_batch(scenes=scene_items, aspect_ratio=aspect_ratio)
        raw_scenes = batch_data.scenes
    except Exception as exc:
        logger.error(f"[Studio/Media] Batch scene resolution error: {exc}")
        raw_scenes = []

    # Normalise resolved scene results into plain dicts
    resolved_scenes = []
    resolved_count = 0
    failed_count = 0
    for r in raw_scenes:
        media_dict = None
        if r.status == "resolved" and r.media:
            m = r.media
            media_dict = {
                "id": m.id,
                "url": m.url,
                "previewUrl": getattr(m, "previewUrl", None) or m.url,
                "thumbnailUrl": getattr(m, "thumbnailUrl", None) or getattr(m, "previewUrl", None),
                "title": m.title,
                "width": getattr(m, "width", None),
                "height": getattr(m, "height", None),
                "duration": getattr(m, "duration", None),
                "provider": m.provider,
                "license": getattr(m, "license", "CC0"),
            }
            resolved_count += 1
        else:
            failed_count += 1

        resolved_scenes.append({
            "sceneNumber": r.sceneNumber,
            "status": r.status,
            "mediaType": next(
                (s.get("mediaType", "video") for s in scenes if s.get("sceneNumber") == r.sceneNumber),
                "video",
            ),
            "provider": r.media.provider if r.media else None,
            "media": media_dict,
            "message": r.message,
        })

    # ── Resolve SFX events ─────────────────────────────────────────────────────
    resolved_sfx = _resolve_sfx_events(sfx_events or [])

    # ── Background / backdrop metadata ────────────────────────────────────────
    background_info: Dict[str, Any] = {
        "backdropId": backdrop_id,
        "status": "catalog" if backdrop_id else "none",
        "backgroundUrl": None,
        "particleEffect": None,
        "previewColor": None,
    }
    if backdrop_id and resolve_background:
        try:
            from backend.shared.media_catalog import VISUAL_BACKDROPS
            match = next((b for b in VISUAL_BACKDROPS if b.get("id") == backdrop_id), None)
            if match:
                background_info.update({
                    "backgroundUrl": match.get("videoUrl") or match.get("imageUrl"),
                    "particleEffect": match.get("particleEffect"),
                    "previewColor": match.get("previewColor"),
                })
        except Exception:
            pass  # Backdrop catalog not critical; silently skip

    elapsed_ms = int((time.perf_counter() - t0) * 1000)
    logger.info(
        f"[Studio/Media] Stage 3 complete | resolved={resolved_count}/{len(scenes)} "
        f"sfx={len(resolved_sfx)} elapsed={elapsed_ms}ms"
    )

    return {
        "success": True,
        "stageId": "media",
        "data": {
            "scenes": resolved_scenes,
            "sfxEvents": resolved_sfx,
            "background": background_info,
            "resolvedCount": resolved_count,
            "failedCount": failed_count,
            "totalScenes": len(scenes),
        },
        "metadata": {"executionTimeMs": elapsed_ms},
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }

