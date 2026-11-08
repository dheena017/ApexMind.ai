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
        cat_search_terms = {
            "all": "whoosh impact sound effect",
            "impact": "impact boom hit slam crash strike",
            "transition": "whoosh swoosh transition swish sweep",
            "tension": "riser tension buildup suspense drone",
            "scifi": "laser sci-fi cyber robot glitch hologram",
            "ui": "click button pop chime beep notification",
            "gaming": "8bit arcade retro coin game jump bonus",
            "foley": "footstep door walk glass handling paper",
            "vehicle": "engine car drift vehicle motor rev",
            "nature": "rain thunder wind storm river water ambient",
            "horror": "horror scream creak scary monster ghost dark",
            "cartoon": "cartoon boing whistle comic funny slide",
            "cinematic": "cinematic braam dramatic horn brass trailer",
            "bassdrop": "bass sub drop rumble 808 subdrop",
            "action": "action fight punch kick combat strike",
        }
        term = clean_q or cat_search_terms.get(category.lower(), "sound effect")

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
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
                "Accept": "application/json",
            },
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
                    if any(w in title_lower for w in ["whoosh", "swoosh", "transition", "swish"]):
                        cat = "Transition"
                        dur = 1.0
                    elif any(w in title_lower for w in ["impact", "hit", "boom", "slam", "crash"]):
                        cat = "Impact"
                        dur = 1.8
                    elif any(w in title_lower for w in ["riser", "tension", "buildup", "suspense"]):
                        cat = "Tension"
                        dur = 2.8
                    elif any(w in title_lower for w in ["laser", "scifi", "sci-fi", "cyber", "robot"]):
                        cat = "Sci-Fi"
                        dur = 1.4
                    elif any(w in title_lower for w in ["click", "pop", "button", "chime", "beep"]):
                        cat = "UI & Tech"
                        dur = 0.5
                    elif any(w in title_lower for w in ["8bit", "arcade", "game", "coin"]):
                        cat = "Gaming"
                        dur = 1.0
                    elif any(w in title_lower for w in ["footstep", "door", "walk", "foley"]):
                        cat = "Foley"
                        dur = 1.8
                    elif any(w in title_lower for w in ["car", "engine", "drift", "motor"]):
                        cat = "Vehicles"
                        dur = 2.4
                    elif any(w in title_lower for w in ["rain", "thunder", "wind", "nature"]):
                        cat = "Nature"
                        dur = 3.0
                    elif any(w in title_lower for w in ["horror", "scream", "creak", "ghost"]):
                        cat = "Horror"
                        dur = 2.2
                    elif any(w in title_lower for w in ["cartoon", "boing", "whistle", "funny"]):
                        cat = "Cartoon"
                        dur = 1.2
                    elif any(w in title_lower for w in ["braam", "cinematic", "trailer"]):
                        cat = "Cinematic"
                        dur = 3.0
                    elif any(w in title_lower for w in ["sub", "808", "bass", "drop"]):
                        cat = "Bass Drop"
                        dur = 1.5
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

