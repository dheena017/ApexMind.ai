"""
backend/features/workspace/elements/providers/base.py
Abstract base class for modular live visual elements and overlay providers.
Zero hardcoded data - pure live API queries and dynamic generation only.
"""

import base64
import json
import logging
import urllib.request
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

logger = logging.getLogger("ApexMind.Elements.Base")


class BaseElementProvider(ABC):
    """Abstract contract for live element and overlay providers."""

    name: str = "base"
    display_name: str = "Base Element Provider"
    category: str = "general"

    @abstractmethod
    def is_configured(self) -> bool:
        """Returns True if provider is ready and reachable."""
        pass

    @abstractmethod
    def search_elements(
        self,
        query: str = "",
        category: str = "all",
        page: int = 1,
        page_size: int = 24,
    ) -> List[Dict[str, Any]]:
        """
        Search visual elements, stickers, icons, or badges from the live provider.
        Must return a list of standard element dictionaries.
        """
        pass

    def get_total_elements(self, query: str = "", category: str = "all") -> int:
        """Returns total or estimated matching elements for pagination."""
        return 0

    @staticmethod
    def format_element(
        id: str,
        name: str,
        category: str,
        provider: str,
        element_type: str = "svg",
        preview_url: Optional[str] = None,
        svg_url: Optional[str] = None,
        label: Optional[str] = None,
        desc: Optional[str] = None,
        color: Optional[str] = None,
        symbol: Optional[str] = None,
        tags: Optional[List[str]] = None,
        aspect_ratio: str = "1:1",
    ) -> Dict[str, Any]:
        """Standardizes element dictionary structure across all providers."""
        return {
            "id": id,
            "name": name,
            "category": category,
            "provider": provider,
            "type": element_type,
            "previewUrl": preview_url or svg_url or "",
            "svgUrl": svg_url or preview_url or "",
            "label": label or name,
            "desc": desc or f"{provider.capitalize()} {category} element",
            "color": color,
            "symbol": symbol,
            "tags": tags or [name.lower()],
            "aspectRatio": aspect_ratio,
        }


class IconifyCollectionProvider(BaseElementProvider):
    """
    Modular live provider for any Iconify / NPM icon collection.
    Loads real icons dynamically via jsDelivr CDN and Iconify API.
    Zero static mock arrays. Full in-memory caching and pagination.
    """

    prefix: str = ""
    element_type: str = "svg"
    tag_name: str = "vector"

    def __init__(self) -> None:
        self._all_icons: Optional[List[str]] = None
        self._icons_data: Dict[str, Any] = {}
        self._default_width: int = 24
        self._default_height: int = 24

    def is_configured(self) -> bool:
        return bool(self.prefix)

    def _load_icons(self) -> List[str]:
        if self._all_icons is not None:
            return self._all_icons

        # 1. Primary: jsdelivr npm CDN
        try:
            req = urllib.request.Request(
                f"https://cdn.jsdelivr.net/npm/@iconify-json/{self.prefix}/icons.json",
                headers={"User-Agent": "ApexMindStudio/2.0 (LiveElements; https://apexmind.ai)"},
            )
            with urllib.request.urlopen(req, timeout=4.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                icons_dict = data.get("icons", {})
                if icons_dict:
                    self._icons_data = icons_dict
                    self._default_width = data.get("width", 24)
                    self._default_height = data.get("height", 24)
                    self._all_icons = list(icons_dict.keys())
                    return self._all_icons
        except Exception as e:
            logger.debug(f"[{self.name}] jsdelivr fetch failed, trying iconify API: {e}")

        # 2. Fallback: api.iconify.design/collection
        try:
            req = urllib.request.Request(
                f"https://api.iconify.design/collection?prefix={self.prefix}",
                headers={"User-Agent": "ApexMindStudio/2.0 (LiveElements; https://apexmind.ai)"},
            )
            with urllib.request.urlopen(req, timeout=4.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                icons: List[str] = []
                for cat_icons in data.get("categories", {}).values():
                    if isinstance(cat_icons, list):
                        icons.extend(cat_icons)
                uncat = data.get("uncategorized", [])
                if isinstance(uncat, list):
                    icons.extend(uncat)
                if icons:
                    self._all_icons = icons
                    return self._all_icons
        except Exception as e:
            logger.warning(f"[{self.name}] iconify collection fetch failed: {e}")
            raise RuntimeError(f"Unable to connect to live API for {self.display_name}: {e}")

        if not self._all_icons:
            raise RuntimeError(f"Live API for {self.display_name} ({self.prefix}) returned 0 assets")
        return self._all_icons

    def search_elements(
        self,
        query: str = "",
        category: str = "all",
        page: int = 1,
        page_size: int = 24,
    ) -> List[Dict[str, Any]]:
        raw_q = (query or "").strip().lower()
        all_icons = self._load_icons()

        if not raw_q:
            start = max(0, (page - 1) * page_size)
            end = start + page_size
            matched_names = all_icons[start:end]
        else:
            terms = raw_q.split()
            matched = [
                i for i in all_icons
                if all(term in i.lower().replace("-", " ") for term in terms)
            ]
            if not matched:
                matched = [
                    i for i in all_icons
                    if any(term in i.lower().replace("-", " ") for term in terms)
                ]

            start = max(0, (page - 1) * page_size)
            end = start + page_size
            matched_names = matched[start:end]

        elements: List[Dict[str, Any]] = []
        for icon_name in matched_names:
            clean_name = icon_name.replace("-", " ").title()
            icon_info = self._icons_data.get(icon_name, {}) if self._icons_data else {}
            body = icon_info.get("body", "")

            if body:
                w = icon_info.get("width", self._default_width)
                h = icon_info.get("height", self._default_height)
                svg_markup = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}">{body}</svg>'
                b64 = base64.b64encode(svg_markup.encode("utf-8")).decode("utf-8")
                svg_url = f"data:image/svg+xml;base64,{b64}"
            else:
                svg_url = f"https://api.iconify.design/{self.prefix}/{icon_name}.svg"

            elements.append(
                self.format_element(
                    id=f"{self.prefix}-{icon_name}",
                    name=clean_name[:40],
                    category=self.category,
                    provider=self.name,
                    element_type=self.element_type,
                    preview_url=svg_url,
                    svg_url=svg_url,
                    desc=f"{self.display_name} - {clean_name}",
                    tags=[self.prefix, self.tag_name, icon_name],
                )
            )
        return elements

    def get_total_elements(self, query: str = "", category: str = "all") -> int:
        raw_q = (query or "").strip().lower()
        all_icons = self._load_icons()
        if not raw_q:
            return len(all_icons) if all_icons else 3000
        terms = raw_q.split()
        matched = [
            i for i in all_icons
            if any(term in i.lower().replace("-", " ") for term in terms)
        ]
        return len(matched)


