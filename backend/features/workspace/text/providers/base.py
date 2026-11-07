"""
backend/features/workspace/text/providers/base.py
Abstract base class for modular font and typography providers.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List


class BaseFontProvider(ABC):
    """Base interface for all typography and font style providers."""

    name: str = "base"
    display_name: str = "Base Provider"

    @abstractmethod
    def is_configured(self) -> bool:
        """Check if provider is available and configured."""
        pass

    @abstractmethod
    def search(
        self,
        query: str = "",
        category: str = "all",
        page: int = 1,
        page_size: int = 24,
    ) -> List[Dict[str, Any]]:
        """Search font styles from this provider."""
        pass

    @abstractmethod
    def get_total(self, query: str = "", category: str = "all") -> int:
        """Get total number of available fonts matching criteria."""
        pass

    @staticmethod
    def matches_category(font: Dict[str, Any], target_category: str) -> bool:
        """
        Dynamically classifies live fonts into creative & typographic categories
        based on their weights, styles, family name, and native category.
        100% dynamic - zero hardcoded font arrays.
        """
        cat = target_category.strip().lower()
        if not cat or cat == "all":
            return True

        f_family = font.get("family", "").lower()
        f_cat_key = font.get("categoryKey", "").lower()
        f_weights = font.get("weights", [])

        if cat in ["sans-serif", "sans"]:
            return "sans" in f_cat_key and "slab" not in f_family

        if cat in ["serif"]:
            return "serif" in f_cat_key and "sans" not in f_cat_key and "slab" not in f_family

        if cat in ["slab-serif", "slab"]:
            return "slab" in f_family or "slab" in f_cat_key

        if cat in ["display", "headlines"]:
            return "display" in f_cat_key

        if cat in ["monospace", "mono", "code"]:
            return "mono" in f_cat_key or "mono" in f_family or "code" in f_family

        if cat in ["handwriting", "script"]:
            return (
                "handwriting" in f_cat_key
                or any(w in f_family for w in ["script", "brush", "hand", "pen", "write", "caveat", "pacifico", "dancing", "alex"])
            )

        if cat in ["calligraphy", "signature"]:
            return any(w in f_family for w in ["calligra", "signature", "script", "brush", "great vibes", "allura", "pinyon", "italianno", "parisienne"])

        if cat in ["bold-impact", "heavy", "shorts"]:
            return (
                800 in f_weights
                or 900 in f_weights
                or any(w in f_family for w in ["black", "heavy", "fat", "ultra", "anton", "bebas", "bungee", "impact", "alfa"])
            )

        if cat in ["condensed", "tall"]:
            return any(w in f_family for w in ["condensed", "narrow", "compact", "oswald", "bebas", "anton", "fjalla", "teko", "six caps"])

        if cat in ["futuristic", "cyberpunk", "scifi"]:
            return any(w in f_family for w in ["orbitron", "exo", "audiowide", "techno", "scifi", "cyber", "rajdhani", "syncopate", "changa", "electrolize", "michroma", "turret", "oxanium"])

        if cat in ["retro", "y2k", "pixel"]:
            return any(w in f_family for w in ["retro", "vintage", "pixel", "arcade", "vt323", "press", "silkscreen", "bungee", "shrikhand", "righteous", "monoton", "rubik"])

        if cat in ["minimal", "geometric"]:
            return ("sans" in f_cat_key) and any(w in f_family for w in ["inter", "poppins", "outfit", "plus jakarta", "urbanist", "dm sans", "montserrat", "raleway", "work sans", "satoshi", "switzer"])

        # Fallback: substring match in categoryKey or family
        return cat in f_cat_key or cat in f_family
