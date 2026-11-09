"""
backend/features/workspace/visuals_3d/providers/poly_haven.py
Live client for Poly Haven API (https://api.polyhaven.com).
100% Free public domain (CC0) 3D models and 360° celestial HDRIs.
Zero hardcoded data: queries live assets dynamically.
"""

import logging
from typing import Any, Dict, List, Optional
import urllib.parse
import urllib.request
import json

from .base import BaseVisual3DProvider

logger = logging.getLogger("ApexMind.Workspace.Visuals3D.PolyHaven")

POLY_HAVEN_BASE = "https://api.polyhaven.com"
USER_AGENT = "ApexMindStudio/1.0 (contact@apexmind.ai)"


class PolyHaven3DProvider(BaseVisual3DProvider):
    name: str = "poly_haven"
    display_name: str = "Poly Haven (100% Free CC0)"
    provider_type: str = "asset"
    requires_key: bool = False

    def is_configured(self) -> bool:
        return True  # Public keyless open API

    def search(
        self,
        query: str = "",
        category: str = "all",
        page: int = 1,
        page_size: int = 20,
    ) -> List[Dict[str, Any]]:
        clean_q = (query or "").lower().strip()
        asset_type = "models" if category in ["characters", "props", "all"] else ("hdris" if category == "environments" else "models")

        try:
            req = urllib.request.Request(
                f"{POLY_HAVEN_BASE}/assets?t={asset_type}",
                headers={"User-Agent": USER_AGENT},
            )
            with urllib.request.urlopen(req, timeout=8.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            if not isinstance(data, dict):
                return []

            matched_slugs = []
            for slug, meta in data.items():
                name = meta.get("name", slug)
                tags = meta.get("tags", [])
                categories = meta.get("categories", [])
                text_blob = f"{name} {' '.join(tags)} {' '.join(categories)} {slug}".lower()

                if not clean_q or clean_q in text_blob:
                    matched_slugs.append((slug, meta))

            # Pagination
            start = (page - 1) * page_size
            page_slice = matched_slugs[start : start + page_size]

            results = []
            for slug, meta in page_slice:
                title = meta.get("name", slug.replace("_", " ").title())
                # Resolve files endpoint for GLTF/GLB download link
                asset_url = f"https://dl.polyhaven.org/file/ph-assets/3d/{slug}/gltf/{slug}.glb"
                thumbnail_url = f"https://cdn.polyhaven.com/asset_img/primary/{slug}.png?width=720&height=1280"

                badges = ["CC0 Public Domain", "PBR Shaded", "Poly Haven"]
                if asset_type == "hdris":
                    badges.append("360° Environment")

                results.append(
                    self.format_asset(
                        id=f"poly_haven_{slug}",
                        title=title,
                        asset_url=asset_url,
                        category="environments" if asset_type == "hdris" else "props",
                        provider=self.name,
                        preview_url=thumbnail_url,
                        thumbnail_url=thumbnail_url,
                        format="glb" if asset_type == "models" else "gltf",
                        license="CC0",
                        author=meta.get("authors", {}).get("0", "Poly Haven Community"),
                        source_url=f"https://polyhaven.com/a/{slug}",
                        tags=meta.get("tags", []),
                        aesthetic_badges=badges,
                    )
                )

            return results

        except Exception as e:
            logger.warning(f"[PolyHaven3D] Live search error for query '{query}': {e}")
            return []

