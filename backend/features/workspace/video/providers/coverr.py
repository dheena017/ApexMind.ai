"""
backend/features/workspace/video/providers/coverr.py
Coverr Free Video Provider. Queries Coverr's live keyless stock video API for commercial-free video loops.
"""

import logging
from typing import Any, Dict, List
import requests

from .base import BaseVideoProvider

logger = logging.getLogger("ApexMind.Workspace.Video.Coverr")


class CoverrVideoProvider(BaseVideoProvider):
    name = "coverr"
    display_name = "Coverr Free Loops"

    def is_configured(self) -> bool:
        return True  # 100% Free and open public service

    def search(
        self,
        query: str = "",
        aspect_ratio: str = "9:16",
        page: int = 1,
        page_size: int = 20,
    ) -> List[Dict[str, Any]]:
        clean_q = (query or "").lower().strip().replace("#", "").strip()
        results: List[Dict[str, Any]] = []

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json",
        }

        endpoints = [
            ("https://api.coverr.co/videos", {"query": clean_q, "page": page, "page_size": min(page_size, 24)}),
            ("https://coverr.co/api/videos", {"query": clean_q, "page": page, "page_size": min(page_size, 24)}),
        ]

        for url, params in endpoints:
            if not clean_q:
                params.pop("query", None)
            try:
                resp = requests.get(url, params=params, headers=headers, timeout=5)
                if resp.status_code == 200:
                    data = resp.json()
                    hits = data.get("hits") or data.get("videos") or data.get("results") or []
                    if isinstance(hits, list) and hits:
                        for idx, hit in enumerate(hits):
                            v_urls = hit.get("urls") or {}
                            v_url = (
                                v_urls.get("mp4")
                                or v_urls.get("mp4_download")
                                or hit.get("video_url")
                                or hit.get("url")
                                or ""
                            )
                            thumb = hit.get("poster") or hit.get("thumbnail") or ""
                            if not v_url:
                                continue

                            results.append(
                                self.format_video(
                                    id=f"coverr_{hit.get('id', idx)}_{page}",
                                    title=hit.get("title", f"Coverr Video {idx+1}"),
                                    video_url=v_url,
                                    preview_url=v_url,
                                    poster_url=thumb,
                                    duration=float(hit.get("duration", 10.0)),
                                    resolution="1080p HD",
                                    aspect_ratio=aspect_ratio,
                                    provider="coverr",
                                    aesthetic_badges=["Coverr Free License", "Cinematic"],
                                    aesthetic_score=0.86,
                                    tags=hit.get("tags") or ["coverr", "free-stock"],
                                )
                            )
                    if results:
                        break
            except Exception as e:
                logger.debug(f"Coverr search request error: {e}")

        return results[:page_size]

