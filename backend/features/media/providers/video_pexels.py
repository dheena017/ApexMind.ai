"""
backend/features/media/providers/video_pexels.py
Pexels API video provider adapter. Queries official Pexels Videos API for vertical or landscape HD clips.
"""

import os
import logging
from typing import List, Dict, Any
import requests

from backend.features.media.base import BaseMediaProvider, MediaAsset

logger = logging.getLogger("ApexMind.media.pexels")


class PexelsVideoProvider(BaseMediaProvider):
    @property
    def name(self) -> str:
        return "pexels"

    @property
    def supported_types(self) -> List[str]:
        return ["video", "image"]

    def is_configured(self) -> bool:
        return bool(os.getenv("PEXELS_API_KEY"))

    def search(
        self,
        query: str,
        media_type: str = "video",
        limit: int = 10,
        aspect_ratio: str = "9:16",
        page: int = 1,
        **kwargs,
    ) -> List[MediaAsset]:
        api_key = os.getenv("PEXELS_API_KEY")
        if not api_key:
            return []

        orientation = "portrait" if aspect_ratio in ["9:16", "4:5"] else ("square" if aspect_ratio == "1:1" else "landscape")
        clean_q = (query or "").strip().replace("#", "").strip() or "cinematic nature"

        headers = {"Authorization": api_key}

        # Handle Image Search vs Video Search according to Pexels official API
        if media_type == "image":
            url = "https://api.pexels.com/v1/search"
            params = {
                "query": clean_q,
                "per_page": min(limit, 20),
                "page": page,
                "orientation": orientation,
            }
            try:
                resp = requests.get(url, headers=headers, params=params, timeout=6)
                if resp.status_code != 200:
                    logger.warning(f"Pexels photo API returned status {resp.status_code}")
                    return []
                data = resp.json()
            except Exception as e:
                logger.warning(f"Pexels photo API request failed: {e}")
                return []

            images: List[MediaAsset] = []
            for it in data.get("photos", []):
                src = it.get("src", {})
                img_url = src.get("large2x") or src.get("large") or src.get("original")
                if not img_url:
                    continue
                w = it.get("width", 1080)
                h = it.get("height", 1920)
                images.append(
                    MediaAsset(
                        id=f"pexels_img_{it.get('id')}",
                        mediaType="image",
                        title=it.get("alt") or it.get("photographer", "Pexels Photo"),
                        url=img_url,
                        previewUrl=src.get("medium") or src.get("small") or img_url,
                        thumbnailUrl=src.get("tiny") or src.get("small") or img_url,
                        duration=8.0,
                        resolution=f"{w}x{h}",
                        aspectRatio=aspect_ratio,
                        provider="pexels",
                        extraMetadata={
                            "author": it.get("photographer"),
                            "sourceUrl": it.get("url"),
                            "photographerUrl": it.get("photographer_url"),
                        },
                    )
                )
            return images

        # Video Search using official modern v1 endpoint
        url = "https://api.pexels.com/v1/videos/search"
        params = {
            "query": clean_q,
            "per_page": min(limit, 20),
            "page": page,
            "orientation": orientation,
        }

        try:
            resp = requests.get(url, headers=headers, params=params, timeout=6)
            if resp.status_code == 401:
                logger.warning("Pexels API returned 401 Unauthorized. Please verify PEXELS_API_KEY in .env.")
                return []
            elif resp.status_code != 200:
                logger.warning(f"Pexels video API returned status {resp.status_code}")
                return []
            data = resp.json()
        except Exception as e:
            logger.warning(f"Pexels video API request failed: {e}")
            return []

        videos: List[MediaAsset] = []
        for it in data.get("videos", []):
            video_files = it.get("video_files", [])
            matched_file = None
            mp4_files = [
                vf for vf in video_files
                if str(vf.get("link", "")).startswith("http") and vf.get("file_type") == "video/mp4"
            ]

            # Prioritize crisp Full HD 1080p/720p matching orientation, avoiding bloated 4K files
            for vf in sorted(mp4_files, key=lambda x: (x.get("width", 0) * x.get("height", 0)), reverse=True):
                w = vf.get("width", 0)
                h = vf.get("height", 0)
                if max(w, h) > 2560:
                    continue
                if orientation == "portrait" and h > w:
                    matched_file = vf
                    break
                elif orientation == "landscape" and w >= h:
                    matched_file = vf
                    break

            # Secondary fallback: any crisp 720p - 1080p file
            if not matched_file:
                for vf in sorted(mp4_files, key=lambda x: (x.get("width", 0) * x.get("height", 0)), reverse=True):
                    w = vf.get("width", 0)
                    h = vf.get("height", 0)
                    if 720 <= max(w, h) <= 2560:
                        matched_file = vf
                        break

            if not matched_file and mp4_files:
                matched_file = sorted(mp4_files, key=lambda x: (x.get("width", 0) * x.get("height", 0)), reverse=True)[0]

            if matched_file and matched_file.get("link"):
                v_link = matched_file["link"]
                v_width = matched_file.get("width", 1080)
                v_height = matched_file.get("height", 1920)
                v_fps = matched_file.get("fps") or 0.0
                raw_slug = (it.get("url") or "").rstrip("/").split("/")[-1].replace("-", " ")
                clean_tags = it.get("tags") or [w for w in raw_slug.split() if not w.isdigit()]
                video_title = raw_slug.title() if raw_slug and len(raw_slug) > 3 else (it.get("user", {}).get("name") or "Pexels Video")
                videos.append(
                    MediaAsset(
                        id=f"pexels_vid_{it.get('id')}",
                        mediaType="video",
                        title=video_title,
                        url=v_link,
                        previewUrl=it.get("image") or it.get("video_pictures", [{}])[0].get("picture") or "",
                        thumbnailUrl=it.get("image") or "",
                        duration=float(it.get("duration", 10.0)),
                        resolution=f"{v_width}x{v_height}",
                        aspectRatio=aspect_ratio,
                        provider="pexels",
                        extraMetadata={
                            "author": it.get("user", {}).get("name"),
                            "sourceUrl": it.get("url"),
                            "fps": float(v_fps),
                            "tags": clean_tags,
                            "slug": raw_slug,
                        },
                    )
                )

        return videos
