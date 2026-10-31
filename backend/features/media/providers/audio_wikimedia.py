"""
backend/features/media/providers/audio_wikimedia.py
Wikimedia Commons API audio provider for public domain & Creative Commons music and sound effects.
High-speed worldwide Wikimedia CDN with zero API key requirement.
"""

import math
import logging
from typing import List, Dict, Any, Optional
import requests

from backend.features.media.schemas import AudioTrackAsset, SfxAsset

logger = logging.getLogger("ApexMind.media.wikimedia_audio")


class WikimediaAudioProvider:
    name: str = "wikimedia_audio"

    def is_configured(self) -> bool:
        return True

    def search_music(
        self,
        query: str = "cinematic",
        genre: str = "",
        limit: int = 15,
        **kwargs,
    ) -> List[AudioTrackAsset]:
        clean_q = (query or genre or "cinematic").strip().replace("#", "").strip()
        search_term = f"filetype:audio {clean_q}"

        url = "https://commons.wikimedia.org/w/api.php"
        params = {
            "action": "query",
            "format": "json",
            "generator": "search",
            "gsrnamespace": "6",
            "gsrsearch": search_term,
            "gsrlimit": min(limit * 2, 30),
            "prop": "imageinfo",
            "iiprop": "url|mime|size",
        }
        headers = {"User-Agent": "ApexMindStudio/2.0 (contact@apexmind.ai)"}

        try:
            resp = requests.get(url, params=params, headers=headers, timeout=8)
            if resp.status_code != 200:
                logger.warning(f"Wikimedia Audio API returned {resp.status_code}")
                return []
            data = resp.json()
        except Exception as e:
            logger.warning(f"Wikimedia Audio API request failed: {e}")
            return []

        pages = data.get("query", {}).get("pages", {})
        results: List[AudioTrackAsset] = []

        for page_id, page in pages.items():
            title_raw = page.get("title", "").replace("File:", "").strip()
            # Skip massive audio or spoken wikipedia articles
            if any(skip in title_raw.lower() for skip in ["spoken wikipedia", "chapter", "podcast", "episode", "speech"]):
                continue

            img_info = page.get("imageinfo", [])
            if not img_info:
                continue
            info = img_info[0]
            audio_url = info.get("url")
            mime = info.get("mime", "")
            duration = float(info.get("duration", 90.0) or 90.0)
            size = info.get("size", 0)

            # Keep tracks between 15 seconds and 10 minutes
            if not audio_url or duration < 12.0 or duration > 600.0 or size > 25 * 1024 * 1024:
                continue

            clean_title = title_raw.rsplit(".", 1)[0].replace("_", " ")[:60]
            track_id_hash = sum(ord(c) for c in clean_title)
            peaks = [
                round(0.18 + 0.72 * abs(math.sin((i + track_id_hash) * 0.4)), 2)
                for i in range(50)
            ]

            results.append(
                AudioTrackAsset(
                    id=f"wm_audio_{page_id}",
                    title=clean_title,
                    artist="Wikimedia Commons (CC/Public Domain)",
                    audioUrl=audio_url,
                    duration=duration,
                    bpm=90 + (track_id_hash % 50),
                    genre=genre or "Cinematic",
                    mood="Inspiring",
                    provider=self.name,
                    waveformPeaks=peaks,
                )
            )
            if len(results) >= limit:
                break

        return results

    def search_sfx(self, query: str = "whoosh", limit: int = 15) -> List[SfxAsset]:
        clean_q = (query or "whoosh").strip().replace("#", "").strip()
        search_term = f"filetype:audio {clean_q}"

        url = "https://commons.wikimedia.org/w/api.php"
        params = {
            "action": "query",
            "format": "json",
            "generator": "search",
            "gsrnamespace": "6",
            "gsrsearch": search_term,
            "gsrlimit": min(limit * 2, 25),
            "prop": "imageinfo",
            "iiprop": "url|mime|size",
        }
        headers = {"User-Agent": "ApexMindStudio/2.0 (contact@apexmind.ai)"}

        try:
            resp = requests.get(url, params=params, headers=headers, timeout=8)
            if resp.status_code != 200:
                return []
            data = resp.json()
        except Exception as e:
            logger.warning(f"Wikimedia SFX API request failed: {e}")
            return []

        pages = data.get("query", {}).get("pages", {})
        results: List[SfxAsset] = []

        for page_id, page in pages.items():
            title_raw = page.get("title", "").replace("File:", "").strip()
            img_info = page.get("imageinfo", [])
            if not img_info:
                continue
            info = img_info[0]
            audio_url = info.get("url")
            duration = float(info.get("duration", 2.0) or 2.0)
            size = info.get("size", 0)

            # SFX should be short (< 15 seconds) and small (< 5MB)
            if not audio_url or duration > 15.0 or size > 5 * 1024 * 1024:
                continue

            clean_title = title_raw.rsplit(".", 1)[0].replace("_", " ")[:45]
            results.append(
                SfxAsset(
                    id=f"wm_sfx_{page_id}",
                    title=clean_title,
                    audioUrl=audio_url,
                    duration=duration,
                    category=clean_q,
                    provider=self.name,
                )
            )
            if len(results) >= limit:
                break

        return results

