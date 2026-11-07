"""
backend/features/media/providers/sfx_freesound.py
Live sound effects provider adapter querying high-impact transitions, whooshes, and sub-drops.
Powered by modular live open audio APIs with zero static hardcoded arrays.
"""

from typing import List
from backend.features.media.schemas import SfxAsset
from backend.features.workspace.audio.providers.freesound_open import OpenSFXProvider


class SfxProvider:
    name: str = "open_sfx"

    def __init__(self) -> None:
        self._provider = OpenSFXProvider()

    def search(self, query: str = "whoosh", limit: int = 20) -> List[SfxAsset]:
        raw_items = self._provider.search_sfx(query=query, page_size=limit)
        return [
            SfxAsset(
                id=it["id"],
                title=it["title"],
                audioUrl=it["audioUrl"],
                duration=it.get("duration", 1.5),
                category=it.get("category", "Impact").lower(),
                provider=it.get("provider", self.name),
            )
            for it in raw_items
        ]
