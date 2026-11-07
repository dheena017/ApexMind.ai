"""
backend/features/media/providers/video_mixkit.py
Mixkit Live Free Video Provider adapter.
Fetches stock video loops dynamically from Mixkit's live search service.
Zero hardcoded lists: all clips are queried and resolved dynamically over HTTP.
"""

import logging
import json
import re
from typing import List
import requests
from backend.features.media.base import BaseMediaProvider, MediaAsset

logger = logging.getLogger("ApexMind.media.mixkit")


class MixkitVideoProvider(BaseMediaProvider):
    """
    Mixkit keyless live video provider.
    Searches Mixkit's free stock video engine dynamically without hardcoded data.
    """

    @property
    def name(self) -> str:
        return "mixkit"

    @property
    def supported_types(self) -> List[str]:
        return ["video"]

    def is_configured(self) -> bool:
        return True  # 100% Free and public

    def search(
        self,
        query: str,
        media_type: str = "video",
        limit: int = 10,
        aspect_ratio: str = "9:16",
        page: int = 1,
        **kwargs,
    ) -> List[MediaAsset]:
        clean_q = (query or "").lower().strip().replace("#", "").strip()
        slug = clean_q.replace(" ", "-") if clean_q else "cinematic"

        results: List[MediaAsset] = []
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
                                    MediaAsset(
                                        id=f"mixkit_{it.get('id', len(results))}",
                                        mediaType="video",
                                        title=it.get("title", "Mixkit Video"),
                                        url=v_url,
                                        previewUrl=v_url,
                                        thumbnailUrl=it.get("thumbnail_url") or it.get("poster_url"),
                                        duration=float(it.get("duration", 10.0)),
                                        resolution="1920x1080 HD",
                                        aspectRatio=aspect_ratio,
                                        provider="mixkit",
                                        extraMetadata={"tags": it.get("tags", []), "license": "Mixkit Free License"},
                                    )
                                )
                        if results:
                            break
                    except Exception as json_err:
                        logger.debug(f"Mixkit NEXT_DATA parse error: {json_err}")

                # 2. Dynamic HTML video card regex extraction
                # Extract preview video MP4 and poster pairs directly from Mixkit DOM
                video_matches = re.findall(
                    r'(https://assets\.mixkit\.co/videos/preview/[a-zA-Z0-9_\-\.]+large\.mp4)',
                    html,
                )
                poster_matches = re.findall(
                    r'(https://assets\.mixkit\.co/videos/preview/[a-zA-Z0-9_\-\.]+0\.jpg)',
                    html,
                )

                if video_matches:
                    seen_urls = set()
                    for idx, v_url in enumerate(video_matches):
                        if v_url in seen_urls:
                            continue
                        seen_urls.add(v_url)

                        poster = poster_matches[idx] if idx < len(poster_matches) else ""
                        # Infer clean title from the asset URL
                        filename = v_url.split("/")[-1].replace(".mp4", "").replace("-large", "").replace("mixkit-", "")
                        clean_title = " ".join(filename.split("-")[:-1]).title() or "Mixkit Stock Footage"

                        results.append(
                            MediaAsset(
                                id=f"mixkit_live_{page}_{idx}",
                                mediaType="video",
                                title=clean_title,
                                url=v_url,
                                previewUrl=v_url,
                                thumbnailUrl=poster,
                                duration=10.0,
                                resolution="1920x1080 HD",
                                aspectRatio=aspect_ratio,
                                provider="mixkit",
                                extraMetadata={"license": "Mixkit Stock Video Free License"},
                            )
                        )
                    if results:
                        break
            except Exception as e:
                logger.debug(f"Mixkit live search error on {url}: {e}")

        return results[:limit]
