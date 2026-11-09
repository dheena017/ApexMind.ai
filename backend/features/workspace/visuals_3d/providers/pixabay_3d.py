"""
backend/features/workspace/visuals_3d/providers/pixabay_3d.py
Live client for Pixabay 3D Animation Video API.
Strictly filters for 100% genuine 3D CGI renders, volumetric simulations,
raytraced geometry, and 3D motion loops.
Explicitly rejects 2D whiteboard drawings, flat cartoons, and 2D sketches.
Zero hardcoded data: queries live 3D CGI video loops over Pixabay's REST API.
"""

import json
import logging
import os
import re
from typing import Any, Dict, List, Optional
import urllib.parse
import urllib.request

from .base import BaseVisual3DProvider

logger = logging.getLogger("ApexMind.Workspace.Visuals3D.Pixabay")

# Positive 3D CGI markers: Asset must contain at least one of these
STRICT_3D_KEYWORDS = {
    "3d",
    "3-d",
    "cgi",
    "render",
    "rendering",
    "3d render",
    "3d animation",
    "blender",
    "cinema 4d",
    "c4d",
    "unreal",
    "octane",
    "vray",
    "volumetric",
    "mesh",
    "wireframe",
    "polygon",
    "polygons",
    "low poly",
    "lowpoly",
    "raytracing",
    "pbr",
    "simulation",
    "particle",
    "particles",
    "fractal",
    "abstract 3d",
    "geometry",
}

# Negative 2D blacklist: Explicitly excludes flat cartoons, whiteboard drawings, and 2D sketches
BLACKLIST_2D_TERMS = [
    "2d",
    "cartoon",
    "whiteboard",
    "hand drawn",
    "hand-drawn",
    "sketch",
    "doodle",
    "flat design",
    "infographic",
    "illustration",
    "vector",
    "line art",
    "comic",
    "storyboard",
]

BLACKLIST_2D_PATTERNS = [
    re.compile(r"\b" + re.escape(term) + r"\b", re.IGNORECASE)
    for term in BLACKLIST_2D_TERMS
]


def is_strictly_3d_video(tags_str: str) -> bool:
    """
    Validates that a video clip features genuine 3D CGI graphics or simulations
    and is NOT a flat 2D cartoon, whiteboard animation, or line drawing.
    """
    text = tags_str.lower()

    # Must contain at least one explicit 3D / CGI marker
    has_3d = any(k in text for k in STRICT_3D_KEYWORDS)
    if not has_3d:
        return False

    # Check for 2D blacklist terms
    for pat in BLACKLIST_2D_PATTERNS:
        if pat.search(text):
            # If it's explicitly marked as "3d render", "3d cgi", or "3d model", allow it despite cartoon styling
            if "3d render" not in text and "3d cgi" not in text and "3d animation" not in text:
                return False

    return True


class Pixabay3DProvider(BaseVisual3DProvider):
    name: str = "pixabay_3d"
    display_name: str = "Pixabay (3D CGI Loops)"
    provider_type: str = "loop"
    requires_key: bool = True

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("PIXABAY_API_KEY", "")

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    def search(
        self,
        query: str = "",
        category: str = "all",
        page: int = 1,
        page_size: int = 20,
    ) -> List[Dict[str, Any]]:
        if not self.is_configured():
            logger.debug("[Pixabay3D] API key is missing.")
            return []

        raw_q = (query or "").strip()
        cat_lower = (category or "").lower().strip()

        # Build search query targeting strictly 3D CGI renders
        if raw_q:
            if "3d" in raw_q.lower() or "cgi" in raw_q.lower():
                search_term = f"{raw_q} render"
            else:
                search_term = f"{raw_q} 3d render cgi"
        elif cat_lower == "space":
            search_term = "space cosmos 3d cgi render"
        elif cat_lower == "portal":
            search_term = "portal tunnel 3d cgi loop"
        elif cat_lower == "cyberpunk":
            search_term = "cyberpunk neon 3d cgi render"
        elif cat_lower == "loops":
            search_term = "abstract 3d cgi motion loop"
        elif cat_lower == "characters":
            search_term = "3d robot character cgi"
        else:
            search_term = "3d cgi motion loop render"

        params = {
            "key": self.api_key,
            "q": search_term,
            "video_type": "animation",
            "page": max(1, page),
            "per_page": min(max(page_size * 2, 20), 50),  # Request more so strict 3D filtering yields desired count
            "safesearch": "true",
        }

        url = f"https://pixabay.com/api/videos/?{urllib.parse.urlencode(params)}"

        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "ApexMindStudio/2.0 (Pixabay3DClient; contact@apexmind.ai)"},
            )
            with urllib.request.urlopen(req, timeout=8.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            hits = data.get("hits", [])
            results = []

            for h in hits:
                tags_str = h.get("tags", "")

                # Strictly require 3D CGI graphics and exclude 2D cartoons/drawings
                if not is_strictly_3d_video(tags_str):
                    continue

                vid_data = h.get("videos", {})
                best_vid = vid_data.get("large") or vid_data.get("medium") or vid_data.get("small") or {}
                video_url = best_vid.get("url")
                if not video_url:
                    continue

                duration = float(h.get("duration", 10.0))
                tags_list = [t.strip() for t in tags_str.split(",") if t.strip()]

                # Pick descriptive 3D title
                clean_tags = [t for t in tags_list if t.lower() not in ["animation", "video", "loop"]]
                title = f"3D {clean_tags[0].title()}" if clean_tags else "3D CGI Motion Loop"

                badges = ["3D CGI Render", f"{int(duration)}s", "Pixabay Free"]
                if best_vid.get("width", 0) >= 1920:
                    badges.append("Full HD 3D")

                # Resolve reliable high-definition thumbnail image across video tiers
                thumb_url = (
                    best_vid.get("thumbnail")
                    or vid_data.get("large", {}).get("thumbnail")
                    or vid_data.get("medium", {}).get("thumbnail")
                    or vid_data.get("small", {}).get("thumbnail")
                    or vid_data.get("tiny", {}).get("thumbnail")
                    or f"https://i.vimeocdn.com/video/{h.get('picture_id', '')}_640x360.jpg"
                )

                results.append(
                    self.format_asset(
                        id=f"pixabay_{h.get('id')}",
                        title=title,
                        asset_url=video_url,
                        category="loops",
                        provider=self.name,
                        preview_url=video_url,
                        thumbnail_url=thumb_url,
                        format="mp4",
                        is_video=True,
                        duration=duration,
                        resolution=f"{best_vid.get('width', 1920)}x{best_vid.get('height', 1080)}",
                        aspect_ratio="9:16",
                        license="Pixabay Free License",
                        author=h.get("user", "Pixabay 3D Artist"),
                        source_url=h.get("pageURL"),
                        tags=tags_list,
                        aesthetic_badges=badges,
                    )
                )

                if len(results) >= page_size:
                    break

            return results

        except Exception as e:
            logger.warning(f"[Pixabay3D] Error querying live 3D videos: {e}")
            return []
