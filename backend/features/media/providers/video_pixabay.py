"""
backend/features/media/providers/video_pixabay.py
Pixabay API video provider adapter. Queries Pixabay Video API for royalty-free stock loops.
"""

import os
import logging
from typing import List, Dict, Any
import requests

from backend.features.media.base import BaseMediaProvider, MediaAsset

logger = logging.getLogger("ApexMind.media.pixabay")


class PixabayVideoProvider(BaseMediaProvider):
    @property
    def name(self) -> str:
        return "pixabay"

    @property
    def supported_types(self) -> List[str]:
        return ["video", "image"]

    def is_configured(self) -> bool:
        return bool(os.getenv("PIXABAY_API_KEY"))

    def search(
        self,
        query: str,
        media_type: str = "video",
        limit: int = 10,
        aspect_ratio: str = "9:16",
        page: int = 1,
        **kwargs,
    ) -> List[MediaAsset]:
        api_key = os.getenv("PIXABAY_API_KEY")
        if not api_key:
            return []

        clean_q = (query or "").strip().replace("#", "").strip() or "cinematic nature"

        # Handle Pixabay Photos/Images search
        if media_type == "image":
            url = "https://pixabay.com/api/"
            orientation = "vertical" if aspect_ratio in ["9:16", "4:5"] else "horizontal"
            params = {
                "key": api_key,
                "q": clean_q,
                "image_type": "photo",
                "orientation": orientation,
                "per_page": max(3, min(limit, 20)),
                "page": page,
                "safesearch": "true",
            }
            try:
                resp = requests.get(url, params=params, timeout=6)
                if resp.status_code != 200:
                    logger.warning(f"Pixabay photo API returned status {resp.status_code}")
                    return []
                data = resp.json()
            except Exception as e:
                logger.warning(f"Pixabay photo API request failed: {e}")
                return []

            images: List[MediaAsset] = []
            for hit in data.get("hits", []):
                img_url = hit.get("largeImageURL") or hit.get("webformatURL")
                if not img_url:
                    continue
                w = hit.get("imageWidth", 1080)
                h = hit.get("imageHeight", 1920)
                images.append(
                    MediaAsset(
                        id=f"pixabay_img_{hit.get('id')}",
                        mediaType="image",
                        title=hit.get("tags") or "Pixabay Photo",
                        url=img_url,
                        previewUrl=hit.get("webformatURL") or hit.get("previewURL") or img_url,
                        thumbnailUrl=hit.get("previewURL") or img_url,
                        duration=8.0,
                        resolution=f"{w}x{h}",
                        aspectRatio=aspect_ratio,
                        provider="pixabay",
                        extraMetadata={
                            "author": hit.get("user"),
                            "sourceUrl": hit.get("pageURL"),
                            "views": hit.get("views"),
                            "likes": hit.get("likes"),
                        },
                    )
                )
            return images

        # Handle Pixabay Videos search (minimum per_page is 3 per Pixabay API spec)
        url = "https://pixabay.com/api/videos/"
        params = {
            "key": api_key,
            "q": clean_q,
            "per_page": max(3, min(limit, 20)),
            "page": page,
            "safesearch": "true",
            "video_type": "film",
        }

        try:
            resp = requests.get(url, params=params, timeout=6)
            if resp.status_code != 200:
                logger.warning(f"Pixabay video API returned status {resp.status_code}: {resp.text[:120]}")
                return []
            data = resp.json()
        except Exception as e:
            logger.warning(f"Pixabay video API request failed: {e}")
            return []

        videos: List[MediaAsset] = []
        for hit in data.get("hits", []):
            videos_obj = hit.get("videos", {})
            # Prioritize crisp Full HD 1080p/720p for fast streaming and studio render
            # Avoid 100MB 4K files that stall web playback and cause browser buffering
            chosen = None
            for key in ["small", "medium", "tiny", "large"]:
                cand = videos_obj.get(key)
                if cand and cand.get("url") and str(cand["url"]).startswith("http"):
                    w = cand.get("width", 0)
                    h = cand.get("height", 0)
                    if 720 <= min(w, h) <= 1440 or 1080 <= max(w, h) <= 1920:
                        chosen = cand
                        break
            if not chosen:
                chosen = (
                    videos_obj.get("small")
                    or videos_obj.get("medium")
                    or videos_obj.get("tiny")
                    or videos_obj.get("large")
                    or {}
                )
            v_url = chosen.get("url", "")
            if v_url and v_url.startswith("http"):
                # Use high-quality thumbnail directly from Pixabay video object
                poster_url = chosen.get("thumbnail") or (
                    videos_obj.get("medium", {}).get("thumbnail")
                    or videos_obj.get("small", {}).get("thumbnail")
                    or ""
                )
                w = chosen.get("width", 1080)
                h = chosen.get("height", 1920)

                videos.append(
                    MediaAsset(
                        id=f"pixabay_vid_{hit.get('id')}",
                        mediaType="video",
                        title=hit.get("tags") or "Pixabay Nature Video",
                        url=v_url,
                        previewUrl=poster_url or v_url,
                        thumbnailUrl=poster_url or v_url,
                        duration=float(hit.get("duration", 10.0)),
                        resolution=f"{w}x{h}",
                        aspectRatio=aspect_ratio,
                        provider="pixabay",
                        extraMetadata={
                            "author": hit.get("user"),
                            "sourceUrl": hit.get("pageURL"),
                            "views": hit.get("views"),
                            "likes": hit.get("likes"),
                        },
                    )
                )

        return videos
