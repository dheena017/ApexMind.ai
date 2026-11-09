"""
backend/features/workspace/video/providers/mixkit.py
Mixkit Live Free Video Provider.
Fetches stock video loops dynamically from Mixkit's live search service with zero hardcoded lists.
"""

import json
import logging
import re
from typing import Any, Dict, List
import requests

from .base import BaseVideoProvider

logger = logging.getLogger("ApexMind.Workspace.Video.Mixkit")


class MixkitVideoProvider(BaseVideoProvider):
    name = "mixkit"
    display_name = "Mixkit Free Videos"

    def is_configured(self) -> bool:
        return True  # 100% Free and public

    def search(
        self,
        query: str = "",
        aspect_ratio: str = "9:16",
        page: int = 1,
        page_size: int = 20,
    ) -> List[Dict[str, Any]]:
        clean_q = (query or "").lower().strip().replace("#", "").strip()
        slug = clean_q.replace(" ", "-") if clean_q else "cinematic"

        results: List[Dict[str, Any]] = []
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }

        search_urls = [
            f"https://mixkit.co/free-stock-video/{slug}/?page={page}",
            f"https://mixkit.co/free-stock-video/?q={clean_q}&page={page}",
        ]

        for url in search_urls:
            try:
                resp = requests.get(url, headers=headers, timeout=5)
                if resp.status_code != 200:
                    continue

                html = resp.text

                # 1. Attempt Next.js / JSON state extraction
                next_data_match = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
                if next_data_match:
                    try:
                        next_json = json.loads(next_data_match.group(1))
                        props = next_json.get("props", {}).get("pageProps", {})
                        items = props.get("items") or props.get("videos") or props.get("results") or []
                        for it in items:
                            v_url = it.get("video_url") or it.get("download_url") or it.get("preview_url")
                            if v_url:
                                results.append(
                                    self.format_video(
                                        id=f"mixkit_{it.get('id', len(results))}",
                                        title=it.get("title", "Mixkit Video"),
                                        video_url=v_url,
                                        preview_url=v_url,
                                        poster_url=it.get("thumbnail_url") or it.get("poster_url") or "",
                                        duration=float(it.get("duration", 10.0)),
                                        resolution="1920x1080 HD",
                                        aspect_ratio=aspect_ratio,
                                        provider="mixkit",
                                        aesthetic_badges=["Mixkit Free License", "Motion"],
                                        aesthetic_score=0.85,
                                        tags=it.get("tags", []),
                                    )
                                )
                    except Exception as e:
                        logger.debug(f"Mixkit next.js parse failed: {e}")

                # 2. Fallback to HTML regex matching for video preview elements
                if not results:
                    video_matches = re.findall(
                        r'<video[^>]+src=["\'](https://assets\.mixkit\.co/videos/preview/[^"\']+\.mp4)["\']',
                        html,
                        re.IGNORECASE,
                    )
                    for idx, v_url in enumerate(video_matches[:page_size]):
                        results.append(
                            self.format_video(
                                id=f"mixkit_html_{page}_{idx}",
                                title=f"Mixkit Clip {idx + 1}",
                                video_url=v_url,
                                preview_url=v_url,
                                poster_url=v_url.replace(".mp4", ".jpg"),
                                duration=12.0,
                                resolution="1920x1080 HD",
                                aspect_ratio=aspect_ratio,
                                provider="mixkit",
                                aesthetic_badges=["Free License", "Clean Loop"],
                                aesthetic_score=0.82,
                                tags=["cinematic", "mixkit"],
                            )
                        )

                if results:
                    break

            except Exception as ex:
                logger.debug(f"Mixkit fetch error for {url}: {ex}")

        return results[:page_size]

