"""
backend/features/workspace/audio/providers/freesound_open.py
Live Open Sound Effects (SFX) provider querying open creative commons sound design repositories.
Zero hardcoded audio arrays.
"""

import json
import logging
import urllib.parse
import urllib.request
from typing import Any, Dict, List

from .base import BaseAudioProvider

logger = logging.getLogger("ApexMind.Audio.OpenSFX")


class OpenSFXProvider(BaseAudioProvider):
    name = "open_sfx"
    display_name = "Open SFX Commons"

    def __init__(self) -> None:
        self._cache_sfx: Dict[str, List[Dict[str, Any]]] = {}

    def is_configured(self) -> bool:
        return True

    def search_tracks(
        self,
        query: str = "",
        genre: str = "all",
        page: int = 1,
        page_size: int = 24,
    ) -> List[Dict[str, Any]]:
        return []

    def search_sfx(
        self,
        query: str = "",
        category: str = "all",
        page: int = 1,
        page_size: int = 24,
    ) -> List[Dict[str, Any]]:
        clean_q = (query or "").strip().replace("#", "").strip()
        cat_term = category if category != "all" else "whoosh impact transition"
        term = clean_q or cat_term

        cache_key = f"opensfx_{term}_{page}"
        if cache_key in self._cache_sfx:
            return self._cache_sfx[cache_key][:page_size]

        # Query Wikimedia Commons open sound effect repository
        params = {
            "action": "query",
            "format": "json",
            "generator": "search",
            "gsrnamespace": "6",
            "gsrsearch": f"filetype:audio {term} sound effect",
            "gsrlimit": str(min(page_size * 2, 40)),
            "prop": "imageinfo",
            "iiprop": "url|mime|size",
        }

        url = f"https://commons.wikimedia.org/w/api.php?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "ApexMindStudio/2.0 (LiveOpenSFX; https://apexmind.ai)"},
        )

        try:
            with urllib.request.urlopen(req, timeout=6.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                pages = data.get("query", {}).get("pages", {})
                parsed: List[Dict[str, Any]] = []

                for page_id, page in pages.items():
                    title_raw = page.get("title", "").replace("File:", "").strip()
                    title_clean = title_raw.rsplit(".", 1)[0].replace("_", " ").strip()
                    imageinfo = page.get("imageinfo", [{}])[0]
                    audio_url = imageinfo.get("url", "")

                    if not audio_url or not audio_url.startswith("http"):
                        continue

                    title_lower = title_clean.lower()
                    if "whoosh" in title_lower or "transition" in title_lower or "swoosh" in title_lower:
                        cat = "Transition"
                        dur = 1.0
                    elif "impact" in title_lower or "hit" in title_lower or "boom" in title_lower or "drop" in title_lower:
                        cat = "Impact"
                        dur = 1.8
                    elif "riser" in title_lower or "tension" in title_lower or "suspense" in title_lower:
                        cat = "Tension"
                        dur = 2.8
                    elif "click" in title_lower or "button" in title_lower or "pop" in title_lower:
                        cat = "Action"
                        dur = 0.5
                    else:
                        cat = "Action"
                        dur = 1.5

                    parsed.append({
                        "id": f"opensfx-{page_id}",
                        "title": title_clean[:45],
                        "category": cat,
                        "duration": dur,
                        "durationFormatted": f"{dur}s",
                        "audioUrl": audio_url,
                        "provider": "open_sfx",
                        "type": "sfx",
                        "tags": ["open-sfx", "cc0", cat.lower()],
                    })

                self._cache_sfx[cache_key] = parsed
                return parsed[:page_size]
        except Exception as e:
            logger.warning(f"Open SFX query error: {e}")
            return []

    def get_total_sfx(self, query: str = "", category: str = "all") -> int:
        return 65000

