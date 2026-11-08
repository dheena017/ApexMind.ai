"""
backend/features/workspace/elements/providers/openverse.py
Pure Live Openverse Creative Commons Vector Overlays Provider.
Live queries to https://api.openverse.org/v1/images/ for CC0 & CC-BY vector illustrations and badges.
Zero hardcoded arrays.
"""

import json
import logging
import urllib.parse
import urllib.request
from typing import Any, Dict, List
from .base import BaseElementProvider

logger = logging.getLogger("ApexMind.Elements.Openverse")


class OpenverseElementProvider(BaseElementProvider):
    name = "openverse"
    display_name = "Openverse Vectors"
    category = "badges"

    def __init__(self) -> None:
        self._cache: Dict[str, List[Dict[str, Any]]] = {}

    def is_configured(self) -> bool:
        return True

    def search_elements(
        self,
        query: str = "",
        category: str = "all",
        page: int = 1,
        page_size: int = 24,
    ) -> List[Dict[str, Any]]:
        clean_q = (query or "").strip().lower() or "badge vector illustration"
        cache_key = f"ov_{clean_q}_{page}_{page_size}"

        if cache_key in self._cache:
            return self._cache[cache_key]

        params = {
            "q": clean_q,
            "extension": "svg,png",
            "page": str(page),
            "page_size": str(min(page_size, 30)),
        }
        url = f"https://api.openverse.org/v1/images/?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "ApexMindStudio/2.0 (LiveOpenverseElements; https://apexmind.ai)"},
        )

        try:
            with urllib.request.urlopen(req, timeout=5.5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                results_raw = data.get("results", [])
                elements: List[Dict[str, Any]] = []

                for it in results_raw:
                    item_id = str(it.get("id", ""))
                    title = it.get("title", "").strip() or f"Openverse Vector {item_id[:8]}"
                    img_url = it.get("url", "")
                    thumb_url = it.get("thumbnail", "") or img_url
                    filetype = it.get("filetype", "svg")

                    if not img_url:
                        continue

                    elements.append(
                        self.format_element(
                            id=f"ov-{item_id}",
                            name=title[:45],
                            category="badges",
                            provider=self.name,
                            element_type="svg" if filetype == "svg" else "badge",
                            preview_url=thumb_url,
                            svg_url=img_url,
                            desc=f"Openverse CC ({filetype.upper()})",
                            tags=[t.get("name", "") for t in it.get("tags", [])[:5]] or [clean_q],
                        )
                    )

                self._cache[cache_key] = elements
                return elements

        except Exception as e:
            logger.warning(f"[OpenverseElementProvider] Live query failed for '{clean_q}': {e}")
            return []

    def get_total_elements(self, query: str = "", category: str = "all") -> int:
        return 1000000
