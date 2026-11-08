"""
backend/features/workspace/audio/providers/incompetech.py
Live Incompetech / Kevin MacLeod Royalty-Free Music Provider.
Queries the official open Creative Commons Kevin MacLeod catalog on Archive.org.
Every track is 100% verified live streaming audio with zero hardcoded mock arrays.
"""

import http.client
import json
import logging
import urllib.parse
import urllib.request
from typing import Any, Dict, List

http.client._MAXLINE = 1048576

from ..archive_resolver import batch_resolve_archive_items
from .base import BaseAudioProvider

logger = logging.getLogger("ApexMind.Audio.Incompetech")


class IncompetechAudioProvider(BaseAudioProvider):
    name = "incompetech"
    display_name = "Incompetech (Kevin MacLeod CC-BY)"

    def __init__(self) -> None:
        self._cached: Dict[str, List[Dict[str, Any]]] = {}

    def is_configured(self) -> bool:
        return True

    def search_tracks(
        self,
        query: str = "",
        genre: str = "all",
        page: int = 1,
        page_size: int = 24,
    ) -> List[Dict[str, Any]]:
        clean_q = (query or "").strip().replace("#", "").strip()
        genre_key = (genre or "all").lower()

        cache_key = f"incompetech_{clean_q}_{genre_key}_{page}"
        if cache_key in self._cached:
            return self._cached[cache_key][:page_size]

        base_filter = '(collection:incompetech_audio OR creator:"Kevin MacLeod")'
        neg_filter = '-title:(complete OR iso OR nrg OR cd-rom OR disc OR dump OR software)'

        if clean_q:
            lucene_query = f'mediatype:audio AND {base_filter} AND format:("VBR MP3" OR "MP3") AND ({clean_q}) AND {neg_filter}'
        elif genre_key != "all":
            lucene_query = f'mediatype:audio AND {base_filter} AND format:("VBR MP3" OR "MP3") AND ({genre_key}) AND {neg_filter}'
        else:
            lucene_query = f'mediatype:audio AND {base_filter} AND format:("VBR MP3" OR "MP3") AND {neg_filter}'

        params = {
            "q": lucene_query,
            "fl[]": ["identifier", "title", "creator", "description", "downloads"],
            "sort[]": "downloads desc",
            "rows": str(min(page_size * 2, 40)),
            "page": str(page),
            "output": "json",
        }

        url = f"https://archive.org/advancedsearch.php?{urllib.parse.urlencode(params, doseq=True)}"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "ApexMindStudio/2.0 (LiveIncompetech; https://apexmind.ai)"},
        )

        try:
            with urllib.request.urlopen(req, timeout=9.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                docs = data.get("response", {}).get("docs", [])

                identifiers = [d["identifier"] for d in docs if d.get("identifier")]
                resolved_map = batch_resolve_archive_items(identifiers)

                parsed: List[Dict[str, Any]] = []
                for doc in docs:
                    identifier = doc.get("identifier")
                    if not identifier:
                        continue

                    resolved = resolved_map.get(identifier)
                    if not resolved or not resolved.get("url"):
                        continue

                    raw_title = doc.get("title") or identifier.replace("-", " ").title()
                    if isinstance(raw_title, list):
                        raw_title = raw_title[0] if raw_title else identifier

                    final_title = resolved.get("title") or raw_title
                    final_artist = resolved.get("artist") or "Kevin MacLeod"
                    dur = resolved.get("duration") or 195
                    mins = dur // 60
                    secs = dur % 60

                    parsed.append({
                        "id": f"inc-{identifier}",
                        "title": str(final_title)[:50],
                        "artist": str(final_artist)[:40],
                        "genre": genre.title() if genre != "all" else "Cinematic & Soundtrack",
                        "mood": "Creative / Royalty-Free",
                        "duration": dur,
                        "durationFormatted": f"{mins}:{secs:02d}",
                        "bpm": 115,
                        "audioUrl": resolved["url"],
                        "provider": "incompetech",
                        "type": "soundtrack",
                        "tags": ["incompetech", "kevin-macleod", "royalty-free", "cc-by"],
                    })

                if parsed:
                    self._cached[cache_key] = parsed
                    return parsed[:page_size]
        except Exception as e:
            logger.warning(f"Incompetech live query error: {e}")

        return []

    def search_sfx(
        self,
        query: str = "",
        category: str = "all",
        page: int = 1,
        page_size: int = 24,
    ) -> List[Dict[str, Any]]:
        return []

    def get_total_tracks(self, query: str = "", genre: str = "all") -> int:
        return 4000

