"""
backend/features/workspace/audio/providers/freesound_open.py
Live Open Sound Effects (SFX) provider querying open creative commons sound design repositories.
Zero hardcoded audio arrays.
"""

import http.client
import json
import logging
import urllib.parse
import urllib.request
from typing import Any, Dict, List

http.client._MAXLINE = 1048576

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
            "all": "whoosh OR impact OR transition",
            "impact": "impact OR boom OR slam OR crash",
            "transition": "whoosh OR swoosh OR transition OR swish",
            "tension": "riser OR tension OR suspense OR drone",
            "scifi": "laser OR scifi OR cyber OR glitch",
            "ui": "click OR button OR pop OR chime OR bell",
            "gaming": "arcade OR 8bit OR coin OR jump OR retro",
            "foley": "footstep OR door OR walk OR glass",
            "vehicle": "engine OR car OR drift OR motor",
            "nature": "rain OR thunder OR wind OR storm",
            "horror": "horror OR scream OR creak OR scary",
            "cartoon": "cartoon OR boing OR whistle OR comic",
            "cinematic": "cinematic OR braam OR trailer OR horn",
            "bassdrop": "bass OR subdrop OR 808 OR rumble",
            "action": "action OR punch OR fight OR kick",
        }
        term = clean_q or cat_search_terms.get(category.lower(), "whoosh OR impact")

        cache_key = f"opensfx_{term}_{page}"
        if cache_key in self._cache_sfx:
            return self._cache_sfx[cache_key][:page_size]

        # Query Wikimedia Commons open audio repository
        params = {
            "action": "query",
            "format": "json",
            "generator": "search",
            "gsrnamespace": "6",
            "gsrsearch": f"filetype:audio {term}",
            "gsrlimit": str(min(page_size * 2, 40)),
            "prop": "imageinfo",
            "iiprop": "url|mime|size",
        }

        url = f"https://commons.wikimedia.org/w/api.php?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "ApexMindStudio/2.0 (LiveOpenSFX; https://apexmind.ai)",
                "Accept": "application/json",
            },
        )

        try:
            with urllib.request.urlopen(req, timeout=7.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                pages = data.get("query", {}).get("pages", {})
                parsed: List[Dict[str, Any]] = []

                for page_id, page in pages.items():
                    title_raw = page.get("title", "").replace("File:", "").strip()
                    title_clean = title_raw.rsplit(".", 1)[0].replace("_", " ").strip()
                    imageinfo = page.get("imageinfo", [{}])[0]
                    audio_url = imageinfo.get("url", "")
                    mime = imageinfo.get("mime", "")

                    clean_path = audio_url.split("?")[0].lower()
                    if not audio_url or not (
                        "audio" in mime
                        or "ogg" in mime
                        or clean_path.endswith((".mp3", ".ogg", ".oga", ".wav", ".opus", ".m4a", ".flac"))
                    ):
                        continue

                    if audio_url.startswith("http://"):
                        audio_url = "https://" + audio_url[7:]

                    title_lower = title_clean.lower()
                    if any(w in title_lower for w in ["whoosh", "swoosh", "transition"]):
                        cat = "Transition"
                    elif any(w in title_lower for w in ["impact", "hit", "boom", "crash", "strike"]):
                        cat = "Impact"
                    elif any(w in title_lower for w in ["riser", "tension", "creak", "alarm"]):
                        cat = "Tension"
                    elif any(w in title_lower for w in ["laser", "plasma", "cyber"]):
                        cat = "Sci-Fi"
                    elif any(w in title_lower for w in ["click", "button", "pop", "ui"]):
                        cat = "UI & Tech"
                    else:
                        cat = category.title() if category != "all" else "Action"

                    parsed.append({
                        "id": f"sfx-{page_id}",
                        "title": title_clean[:45],
                        "name": title_clean[:45],
                        "category": cat,
                        "duration": 1.5,
                        "durationFormatted": "1.5s",
                        "audioUrl": audio_url,
                        "provider": "open_sfx",
                        "type": "sfx",
                        "tags": ["sfx", cat.lower(), "creative-commons"],
                    })

                if parsed:
                    self._cache_sfx[cache_key] = parsed
                    return parsed[:page_size]
        except Exception as e:
            logger.warning(f"OpenSFX query error: {e}")

        return []

    def get_total_tracks(self, query: str = "", genre: str = "all") -> int:
        return 0

    def get_total_sfx(self, query: str = "", category: str = "all") -> int:
        return 65000
