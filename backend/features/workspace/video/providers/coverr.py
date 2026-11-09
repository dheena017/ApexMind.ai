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

        # coverr.co/api/videos is the public unauthenticated catalog endpoint
        params: Dict[str, Any] = {"page": page - 1 if page > 0 else 0, "page_size": min(page_size, 30)}
        if clean_q:
            params["query"] = clean_q

        try:
            resp = requests.get("https://coverr.co/api/videos", params=params, headers=headers, timeout=6)
            if resp.status_code == 200:
                data = resp.json()
                hits = data.get("hits") or data.get("videos") or data.get("results") or []
                for idx, hit in enumerate(hits):
                    base_fn = hit.get("base_filename") or ""
                    v_urls = hit.get("urls") or {}
                    v_url = (
                        (f"https://cdn.coverr.co/videos/{base_fn}/1080p.mp4" if base_fn else "")
                        or v_urls.get("mp4")
                        or v_urls.get("mp4_download")
                        or hit.get("video_url")
                        or hit.get("url")
                        or ""
                    )
                    if not v_url:
                        continue

                    thumb = (
                        hit.get("thumbnail")
                        or hit.get("poster")
                        or (f"https://cdn.coverr.co/videos/{base_fn}/thumbnail?width=1280" if base_fn else "")
                    )

                    dur = float(hit.get("duration") or 15.0)
                    is_vert = bool(hit.get("is_vertical"))
                    detected_aspect = "9:16" if is_vert else "16:9"

                    results.append(
                        self.format_video(
                            id=f"coverr_{hit.get('id', idx)}_{page}",
                            title=hit.get("title", f"Coverr Video {idx+1}"),
                            video_url=v_url,
                            preview_url=v_url,
                            poster_url=thumb,
                            duration=dur,
                            resolution="1080p FHD",
                            aspect_ratio=detected_aspect,
                            provider="coverr",
                            aesthetic_badges=["Coverr Free License", "Cinematic"],
                            aesthetic_score=0.86,
                            tags=hit.get("tags") or ["coverr", "free-stock"],
                        )
                    )
        except Exception as e:
            logger.debug(f"Coverr search request error: {e}")

        return results[:page_size]

