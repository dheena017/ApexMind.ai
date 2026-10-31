"""
backend/features/media/providers/sfx_freesound.py
Sound effects provider adapter querying high-impact transitions, whooshes, and sub-drops.
Powered by Mixkit open audio CDN with zero authentication requirements.
"""

from typing import List, Dict, Any
from backend.features.media.schemas import SfxAsset


OPEN_SFX_CATALOG = [
    {
        "id": "sfx_whoosh_fast_01",
        "title": "Cinematic Air Whoosh Fast",
        "category": "whoosh",
        "duration": 0.85,
        "audioUrl": "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
    },
    {
        "id": "sfx_whoosh_heavy_02",
        "title": "Deep Sub Swoosh Transition",
        "category": "whoosh",
        "duration": 1.2,
        "audioUrl": "https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3",
    },
    {
        "id": "sfx_sub_drop_01",
        "title": "Deep Cinematic Sub Bass Drop",
        "category": "sub_drop",
        "duration": 2.4,
        "audioUrl": "https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3",
    },
    {
        "id": "sfx_riser_tension_01",
        "title": "Dark Tension String Riser",
        "category": "riser",
        "duration": 3.1,
        "audioUrl": "https://assets.mixkit.co/active_storage/sfx/2875/2875-preview.mp3",
    },
    {
        "id": "sfx_impact_boom_01",
        "title": "Cinematic Trailer Hit Impact",
        "category": "impact",
        "duration": 1.8,
        "audioUrl": "https://assets.mixkit.co/active_storage/sfx/2871/2871-preview.mp3",
    },
    {
        "id": "sfx_impact_boom_02",
        "title": "Sub Heavy Cinematic Boom",
        "category": "impact",
        "duration": 2.1,
        "audioUrl": "https://assets.mixkit.co/active_storage/sfx/2873/2873-preview.mp3",
    },
    {
        "id": "sfx_impact_metal_01",
        "title": "Heavy Steel Metal Hit",
        "category": "impact",
        "duration": 1.4,
        "audioUrl": "https://assets.mixkit.co/active_storage/sfx/2872/2872-preview.mp3",
    },
    {
        "id": "sfx_glitch_digital_01",
        "title": "Quick Digital HUD Glitch",
        "category": "glitch",
        "duration": 0.6,
        "audioUrl": "https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3",
    },
    {
        "id": "sfx_camera_shutter_01",
        "title": "Camera Shutter Click Snap",
        "category": "click",
        "duration": 0.4,
        "audioUrl": "https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3",
    },
    {
        "id": "sfx_bell_chime_01",
        "title": "Success Notification Bell Chime",
        "category": "notification",
        "duration": 1.1,
        "audioUrl": "https://assets.mixkit.co/active_storage/sfx/2432/2432-preview.mp3",
    },
]


class SfxProvider:
    name: str = "open_sfx"

    def search(self, query: str = "whoosh", limit: int = 20) -> List[SfxAsset]:
        clean_q = (query or "").lower().strip()
        matched: List[SfxAsset] = []

        for item in OPEN_SFX_CATALOG:
            if not clean_q or clean_q in item["title"].lower() or clean_q in item["category"].lower():
                matched.append(
                    SfxAsset(
                        id=item["id"],
                        title=item["title"],
                        audioUrl=item["audioUrl"],
                        duration=item["duration"],
                        category=item["category"],
                        provider=self.name,
                    )
                )

        if not matched:
            matched = [
                SfxAsset(
                    id=it["id"],
                    title=it["title"],
                    audioUrl=it["audioUrl"],
                    duration=it["duration"],
                    category=it["category"],
                    provider=self.name,
                )
                for it in OPEN_SFX_CATALOG[:limit]
            ]

        return matched[:limit]
