"""
backend/features/media/providers/audio_jamendo.py
Jamendo API audio provider adapter for royalty-free background soundtracks.
"""

import os
import math
import logging
from typing import List, Dict, Any, Optional
import requests

from backend.features.media.schemas import AudioTrackAsset

logger = logging.getLogger("ApexMind.media.jamendo")


class JamendoAudioProvider:
    name: str = "jamendo"

    def is_configured(self) -> bool:
        return bool(os.getenv("JAMENDO_CLIENT_ID", "56d30c95"))

    def search(
        self,
        query: str = "",
        genre: str = "",
        limit: int = 15,
        **kwargs,
    ) -> List[AudioTrackAsset]:
        client_id = os.getenv("JAMENDO_CLIENT_ID", "56d30c95")  # public developer sandbox ID
        clean_q = (query or "").strip().replace("#", "").strip() or "cinematic motivational"

        url = "https://api.jamendo.com/v3.0/tracks/"
        params = {
            "client_id": client_id,
            "format": "json",
            "limit": min(limit, 30),
            "search": clean_q,
            "order": "popularity_total",
            "include": "musicinfo",
        }
        if genre and genre.lower() != "all":
            params["tags"] = genre.lower()

        try:
            resp = requests.get(url, params=params, timeout=5)
            if resp.status_code != 200:
                logger.warning(f"Jamendo API returned {resp.status_code}")
                return []
            data = resp.json()
        except Exception as e:
            logger.warning(f"Jamendo API request failed: {e}")
            return []

        results: List[AudioTrackAsset] = []
        for it in data.get("results", []):
            audio_url = it.get("audio", "")
            if audio_url and audio_url.startswith("http"):
                # Generate deterministic 50-point waveform peaks for instant studio visualizer
                track_id_hash = sum(ord(c) for c in str(it.get("id", "0")))
                peaks = [
                    round(0.15 + 0.75 * abs(math.sin((i + track_id_hash) * 0.45)), 2)
                    for i in range(50)
                ]

                results.append(
                    AudioTrackAsset(
                        id=f"jamendo_{it.get('id')}",
                        title=it.get("name", "Cinematic Track"),
                        artist=it.get("artist_name", "Jamendo Artist"),
                        audioUrl=audio_url,
                        duration=float(it.get("duration", 120.0)),
                        bpm=it.get("musicinfo", {}).get("bpm") or 92,
                        genre=genre or "Cinematic",
                        mood=it.get("musicinfo", {}).get("vocalinstrumental") or "Motivational",
                        provider="jamendo",
                        waveformPeaks=peaks,
                    )
                )

        return results
