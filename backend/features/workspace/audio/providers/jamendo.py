"""
backend/features/workspace/audio/providers/jamendo.py
Live Jamendo Music API provider for 500,000+ Creative Commons & royalty-free soundtracks.
Pure live stream querying https://api.jamendo.com/v3.0/tracks/
Zero hardcoded audio arrays.
"""

import json
import logging
import os
import urllib.parse
import urllib.request
from typing import Any, Dict, List

from .base import BaseAudioProvider

logger = logging.getLogger("ApexMind.Audio.Jamendo")

DEFAULT_CLIENT_ID = "56d30c95"


class JamendoAudioProvider(BaseAudioProvider):
    name = "jamendo"
    display_name = "Jamendo Royalty-Free Music"

    def __init__(self) -> None:
        self._cached_tracks: Dict[str, List[Dict[str, Any]]] = {}

    def is_configured(self) -> bool:
        return True

    def _get_client_id(self) -> str:
        return os.getenv("JAMENDO_CLIENT_ID", "").strip() or DEFAULT_CLIENT_ID

    def search_tracks(
        self,
        query: str = "",
        genre: str = "all",
        page: int = 1,
        page_size: int = 24,
    ) -> List[Dict[str, Any]]:
        client_id = self._get_client_id()
        clean_q = (query or "").strip().replace("#", "").strip()

        params = {
            "client_id": client_id,
            "format": "json",
            "limit": str(min(page_size * 2, 50)),
            "offset": str((page - 1) * page_size),
            "order": "popularity_total",
            "include": "musicinfo",
            "audioformat": "mp32",
        }

        if clean_q:
            params["namesearch"] = clean_q
        elif genre and genre.lower() != "all":
            params["tags"] = genre.lower()
        else:
            params["tags"] = "cinematic,motivational"

        cache_key = f"{clean_q}_{genre}_{page}_{page_size}"
        if cache_key in self._cached_tracks:
            return self._cached_tracks[cache_key]

        url = f"https://api.jamendo.com/v3.0/tracks/?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "ApexMindStudio/2.0 (LiveJamendo; https://apexmind.ai)"},
        )

        try:
            with urllib.request.urlopen(req, timeout=6.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                results = data.get("results", [])

                parsed: List[Dict[str, Any]] = []
                for it in results:
                    audio_url = it.get("audio") or it.get("audiodownload")
                    if not audio_url or not audio_url.startswith("http"):
                        continue

                    duration_sec = float(it.get("duration", 120))
                    musicinfo = it.get("musicinfo", {})
                    tags = musicinfo.get("tags", {})
                    genres_list = tags.get("genres", [])
                    genre_val = genres_list[0].title() if genres_list else "Cinematic"

                    parsed.append({
                        "id": f"jamendo-{it.get('id')}",
                        "title": it.get("name") or "Soundtrack",
                        "artist": it.get("artist_name") or "Jamendo Artist",
                        "genre": genre_val,
                        "mood": genre_val,
                        "duration": int(duration_sec),
                        "durationFormatted": self.format_duration(duration_sec),
                        "bpm": int(musicinfo.get("speed", 90) or 90),
                        "audioUrl": audio_url,
                        "provider": "jamendo",
                        "type": "soundtrack",
                        "tags": ["jamendo", "royalty-free"] + genres_list,
                    })

                self._cached_tracks[cache_key] = parsed
                return parsed[:page_size]
        except Exception as e:
            logger.warning(f"Jamendo live API load error: {e}")
            return []

    def search_sfx(
        self,
        query: str = "",
        category: str = "all",
        page: int = 1,
        page_size: int = 24,
    ) -> List[Dict[str, Any]]:
        # Jamendo specializes in full musical tracks; defer SFX to Wikimedia/Freesound
        return []

    def get_total_tracks(self, query: str = "", genre: str = "all") -> int:
        return 500000

