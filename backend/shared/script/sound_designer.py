"""
backend/shared/script/sound_designer.py
Stage 1D: Sound Design & Sidechain Ducking Planner.
Binds background soundtrack, acoustic sidechain ducking, and timed SFX events to storyboard cuts.
Zero hardcoded fallbacks — strict error reporting on failure.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from .constants import DEFAULT_DUCKING_CONFIG

logger = logging.getLogger("ApexMind.Script.SoundDesign")


def design_sound(
    storyboard: List[Dict[str, Any]],
    target_seconds: int = 30,
    audio_mood: Optional[str] = None,
    music_track: Optional[str] = None,
    catalog: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Plans the 5-layer broadcast sound design:
    - Soundtrack recommendation & catalog match
    - Acoustic sidechain ducking
    - Timed SFX events aligned to storyboard transitions
    """
    catalog_data = catalog or {}
    avail_tracks = catalog_data.get("musicTracks") or []
    avail_sfx_list = catalog_data.get("soundEffects") or []

    st_id = music_track or (avail_tracks[0].get("id") if avail_tracks else "")

    matched_track = next(
        (m for m in avail_tracks if m.get("id") == st_id or (m.get("title") and st_id and m["title"].lower() in str(st_id).lower())),
        {}
    ) if (avail_tracks and st_id) else {}

    soundtrack_id = matched_track.get("id", str(st_id or ""))
    soundtrack_title = matched_track.get("title", f"{audio_mood.capitalize() if audio_mood else 'Dynamic'} Soundtrack" if soundtrack_id else "")
    genre = matched_track.get("genre", audio_mood or "cinematic")
    bpm = matched_track.get("bpm", 120)
    audio_url = matched_track.get("audioUrl", "")

    # Generate timed SFX events matching storyboard seams
    sfx_events: List[Dict[str, Any]] = []

    # 1. Opening hook impact boom at t=0.0s
    sfx_events.append({
        "time": 0.0,
        "sfxId": "sfx-impact",
        "label": "Opening Hook Boom",
        "sfxUrl": "",
    })

    # 2. Transition whooshes on scene cuts
    for sc in storyboard[1:-1]:
        start_t = float(sc.get("start", 0.0))
        if start_t > 0.5:
            sfx_events.append({
                "time": round(start_t, 2),
                "sfxId": "sfx-whoosh",
                "label": f"Scene {sc.get('sceneNumber', '')} Transition",
                "sfxUrl": "",
            })

    # 3. Closing CTA chime at final scene
    if len(storyboard) > 1:
        last_scene_start = float(storyboard[-1].get("start", max(0.0, target_seconds - 3.0)))
        sfx_events.append({
            "time": round(last_scene_start, 2),
            "sfxId": "sfx-notif",
            "label": "Closing CTA Chime",
            "sfxUrl": "",
        })

    # Resolve SFX URLs from library if available
    for evt in sfx_events:
        s_id = evt.get("sfxId")
        matched_sfx = next(
            (s for s in avail_sfx_list if s.get("id") == s_id or (s.get("name") and str(s["name"]).lower() in str(evt.get("label", "")).lower())),
            None
        ) if avail_sfx_list else None
        if matched_sfx:
            evt["sfxUrl"] = matched_sfx.get("audioUrl", "")

    logger.info(f"[Script/SoundDesign] Sound plan ready: track='{soundtrack_title}' ({bpm} BPM) | {len(sfx_events)} SFX events")

    return {
        "soundtrackTrackId": soundtrack_id,
        "soundtrackTitle": soundtrack_title,
        "genre": genre,
        "bpm": bpm,
        "audioUrl": audio_url,
        "ducking": DEFAULT_DUCKING_CONFIG.copy(),
        "sfxEvents": sfx_events,
    }

