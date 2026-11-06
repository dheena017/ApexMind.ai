from importlib import import_module
from typing import Any

from .config import settings

__all__ = [
    "settings",
    "gemini_client",
    "generate_gemini_script",
    "generate_gemini_voiceover",
]


def __getattr__(name: str) -> Any:
    if name in {"gemini_client", "generate_gemini_script", "generate_gemini_voiceover"}:
        gemini = import_module(".gemini", __name__)
        return getattr(gemini, name)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
