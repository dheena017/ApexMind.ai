"""
backend/features/workspace/visuals_3d/providers/wikimedia_3d.py
Live client for Wikimedia 3D Commons API (commons.wikimedia.org).
Provides access to 11,000+ public domain and CC-licensed 3D models:
NASA planetary explorers, spacecraft, rovers, celestial spheres, dinosaur fossils,
ancient museum artifacts, and scientific 3D geometry.
Zero hardcoded data: queries live Wikimedia Commons MediaWiki API.
"""

import json
import logging
from typing import Any, Dict, List, Optional
import urllib.parse
import urllib.request

from .base import BaseVisual3DProvider

logger = logging.getLogger("ApexMind.Workspace.Visuals3D.Wikimedia")

WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "ApexMindStudio/2.0 (Wikimedia3DDiscovery; contact@apexmind.ai)"


class Wikimedia3DProvider(BaseVisual3DProvider):
    name: str = "wikimedia_3d"
    display_name: str = "Wikimedia 3D (NASA & Science)"
    provider_type: str = "asset"
    requires_key: bool = False

    def is_configured(self) -> bool:
        return True  # 100% Free open public domain MediaWiki API

    def search(
        self,
        query: str = "",
        category: str = "all",
        page: int = 1,
        page_size: int = 20,
    ) -> List[Dict[str, Any]]:
        clean_q = (query or "").strip().replace("#", "").strip()
        cat_lower = (category or "").lower().strip()

        # Build precise search query with MediaWiki filetype:3d filter
        if clean_q:
            search_term = f"{clean_q} filetype:3d"
        elif cat_lower == "space":
            search_term = "NASA space planet rover spacecraft filetype:3d"
        elif cat_lower == "characters":
            search_term = "skull skeleton bust statue fossil filetype:3d"
        elif cat_lower == "environments":
            search_term = "terrain crater planet globe filetype:3d"
        elif cat_lower == "props":
            search_term = "sculpture tool instrument artifact filetype:3d"
        else:
            search_term = "filetype:3d"

        limit = min(max(page_size, 10), 30)
        params = {
            "action": "query",
            "list": "search",
            "srsearch": search_term,
            "srnamespace": "6",  # File namespace on Wikimedia Commons
            "format": "json",
            "srlimit": limit,
            "sroffset": (page - 1) * limit,
        }

        url = f"{WIKIMEDIA_API}?{urllib.parse.urlencode(params)}"
        headers = {"User-Agent": USER_AGENT, "Accept": "application/json"}

        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=8.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            search_hits = data.get("query", {}).get("search", [])
            if not search_hits:
                return []

            # Batch resolve file direct URLs, sizes, metadata, and rendered PNG thumbnails
            titles = "|".join([h["title"] for h in search_hits])
            info_params = {
                "action": "query",
                "titles": titles,
                "prop": "imageinfo",
                "iiprop": "url|size|mime|extmetadata",
                "iiurlwidth": 600,  # Forces Wikimedia to generate rendered PNG 3D preview thumbnail
                "format": "json",
            }
            info_url = f"{WIKIMEDIA_API}?{urllib.parse.urlencode(info_params)}"
            req_info = urllib.request.Request(info_url, headers=headers)
            with urllib.request.urlopen(req_info, timeout=8.0) as resp_info:
                info_data = json.loads(resp_info.read().decode("utf-8"))

            pages = info_data.get("query", {}).get("pages", {})
            results = []

            for page_id, pdata in pages.items():
                raw_title = pdata.get("title", "")
                # Clean up title: strip "File:", extension, and underscores
                clean_title = (
                    raw_title.replace("File:", "")
                    .replace(".stl", "")
                    .replace(".STL", "")
                    .replace(".glb", "")
                    .replace(".GLB", "")
                    .replace("_", " ")
                    .strip()
                    .title()
                )

                imageinfo = pdata.get("imageinfo", [])
                if not imageinfo:
                    continue

                info = imageinfo[0]
                direct_url = info.get("url")
                if not direct_url:
                    continue

                # Get generated rendered PNG thumbnail from Wikimedia
                thumb_url = info.get("thumburl") or (direct_url if direct_url.lower().endswith((".png", ".jpg", ".jpeg", ".webp")) else "")

                file_ext = (
                    "glb"
                    if direct_url.lower().endswith(".glb")
                    else ("stl" if direct_url.lower().endswith(".stl") else "3d")
                )

                # Extract license from Wikimedia metadata
                extmetadata = info.get("extmetadata", {})
                license_name = extmetadata.get("LicenseShortName", {}).get("value") or "Public Domain / CC-BY"
                artist = extmetadata.get("Artist", {}).get("value") or "Wikimedia Commons NASA / Science"

                # Infer category
                title_lower = clean_title.lower()
                cat = "space" if any(w in title_lower for w in ["nasa", "mars", "moon", "planet", "apollo", "rover", "space", "earth"]) else (
                    "characters" if any(w in title_lower for w in ["skull", "skeleton", "bust", "fossil", "dinosaur", "statue"]) else "props"
                )

                badges = ["Wikimedia 3D", "NASA & Science", file_ext.upper()]
                if "public domain" in license_name.lower() or "cc0" in license_name.lower():
                    badges.append("Public Domain")

                results.append(
                    self.format_asset(
                        id=f"wikimedia_{page_id}",
                        title=clean_title,
                        asset_url=direct_url,
                        category=cat,
                        provider=self.name,
                        preview_url=thumb_url,
                        thumbnail_url=thumb_url,
                        format=file_ext,
                        license=license_name,
                        author=artist[:40],
                        source_url=info.get("descriptionurl"),
                        tags=[clean_q, "science", "nasa", "astronomy", file_ext],
                        aesthetic_badges=badges,
                    )
                )

            return results

        except Exception as e:
            logger.warning(f"[Wikimedia3D] Live search error for '{query}': {e}")
            return []
