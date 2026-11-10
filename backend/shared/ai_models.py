import os
import re
import threading
import time
import logging
from typing import Any

from .config import settings


DEFAULT_SCRIPT_MODEL = os.environ.get("DEFAULT_SCRIPT_MODEL", "").strip()
DEFAULT_TTS_MODEL = os.environ.get("DEFAULT_TTS_MODEL", "").strip()
_MODEL_CACHE_SECONDS = 300
_MODEL_CACHE_LOCK = threading.Lock()
_MODEL_CACHE: tuple[float, list[dict[str, str]], list[dict[str, str]]] | None = None
logger = logging.getLogger("ApexMind.AI.Models")

PREFERRED_SCRIPT_MODELS = (
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.6-flash",
    "gemini-3-flash",
    "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-3.1-pro",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
)

_UNWANTED_MODEL_TERMS = (
    "antigravity",
    "deep-research",
    "research",
)

_NON_SCRIPT_MODEL_TERMS = (
    "tts",
    "embedding",
    "embed",
    "image",
    "imagen",
    "live",
    "transcribe",
    "audio",
    "robotics",
    "computer-use",
    "computer_use",
)


def is_unwanted_model(model_id: str | None) -> bool:
    """Identify preview, internal, deep-research, or discontinued legacy Gemini models."""
    if not model_id:
        return True
    lowered = str(model_id).lower().strip()

    # 1. Internal preview or specialized agent models that do not support developer instructions or general text gen
    if any(term in lowered for term in _UNWANTED_MODEL_TERMS):
        return True

    # 2. Legacy / discontinued Gemini versions (Gemini 1.x and 2.x return 404 NOT_FOUND for new users)
    if lowered.startswith(("gemini-0", "gemini-1", "gemini-2")) or bool(re.search(r"gemini-[0-2]\.", lowered)):
        return True

    return False


def _model_value(model: Any, field: str, default: Any = None) -> Any:
    if isinstance(model, dict):
        return model.get(field, default)
    return getattr(model, field, default)


def _script_model_sort_key(model: dict[str, str]) -> tuple[int, int, str]:
    mid = model["id"].lower()
    is_default = 0 if (DEFAULT_SCRIPT_MODEL and mid == DEFAULT_SCRIPT_MODEL.lower()) else 1
    try:
        pref_idx = PREFERRED_SCRIPT_MODELS.index(mid)
    except ValueError:
        pref_idx = 999
    return (is_default, pref_idx, model["name"].casefold())


def get_available_models(force_refresh: bool = False) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    from google import genai

    global _MODEL_CACHE
    now = time.monotonic()
    with _MODEL_CACHE_LOCK:
        if (
            not force_refresh
            and _MODEL_CACHE
            and now - _MODEL_CACHE[0] < _MODEL_CACHE_SECONDS
        ):
            return _MODEL_CACHE[1], _MODEL_CACHE[2]

        api_key = settings.GEMINI_API_KEY
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured; available models cannot be loaded.")

        client = genai.Client(api_key=api_key)
        script_models: list[dict[str, str]] = []
        tts_models: list[dict[str, str]] = []
        for model in client.models.list():
            raw_name = _model_value(model, "name", "")
            model_id = str(raw_name).removeprefix("models/").strip()
            if not model_id or is_unwanted_model(model_id):
                continue

            display_name = str(_model_value(model, "display_name", "") or model_id)
            actions = _model_value(model, "supported_actions", []) or []
            normalized_actions = {str(action).replace("_", "").lower() for action in actions}
            supports_generation = "generatecontent" in normalized_actions
            lowered_id = model_id.lower()

            if "tts" in lowered_id and supports_generation:
                tts_models.append({"id": model_id, "name": display_name})
            elif supports_generation and not any(term in lowered_id for term in _NON_SCRIPT_MODEL_TERMS):
                script_models.append({"id": model_id, "name": display_name})

        if not script_models:
            logger.warning("No script models discovered after filtering unwanted models; using standard production defaults.")
            script_models = [
                {"id": "gemini-3.8-flash", "name": "Gemini 3.8 Flash"},
                {"id": "gemini-3.5-flash", "name": "Gemini 3.5 Flash"},
                {"id": "gemini-3.5-flash-lite", "name": "Gemini 3.5 Flash Lite"},
            ]

        script_models.sort(key=_script_model_sort_key)
        tts_models.sort(key=lambda model: (model["id"] != DEFAULT_TTS_MODEL, model["name"].casefold()))
        _MODEL_CACHE = (now, script_models, tts_models)
        return script_models, tts_models


def get_cached_models() -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    with _MODEL_CACHE_LOCK:
        if not _MODEL_CACHE:
            return [], []
        return _MODEL_CACHE[1], _MODEL_CACHE[2]


def get_default_script_model() -> str:
    models, _ = get_available_models()
    available_ids = {model["id"] for model in models}
    if DEFAULT_SCRIPT_MODEL and DEFAULT_SCRIPT_MODEL in available_ids and not is_unwanted_model(DEFAULT_SCRIPT_MODEL):
        return DEFAULT_SCRIPT_MODEL
    return models[0]["id"]


def get_default_tts_model() -> str:
    _, models = get_available_models()
    available_ids = {model["id"] for model in models}
    if DEFAULT_TTS_MODEL and DEFAULT_TTS_MODEL in available_ids and not is_unwanted_model(DEFAULT_TTS_MODEL):
        return DEFAULT_TTS_MODEL
    if not models:
        raise RuntimeError("Gemini returned no available text-to-speech models for this API key.")
    return models[0]["id"]


def get_script_fallback_models(primary_model: str) -> list[str]:
    models, _ = get_available_models()
    return [model["id"] for model in models if model["id"] != primary_model and not is_unwanted_model(model["id"])]


def get_tts_fallback_models(primary_model: str) -> list[str]:
    _, models = get_available_models()
    return [model["id"] for model in models if model["id"] != primary_model and not is_unwanted_model(model["id"])]


def resolve_script_model(model_name: str | None = None) -> str:
    models, _ = get_available_models()
    available_ids = {model["id"] for model in models}
    clean_name = (model_name or "").strip()
    if clean_name and clean_name in available_ids and not is_unwanted_model(clean_name):
        return clean_name
    if clean_name:
        logger.warning(
            "Requested Gemini script model '%s' is unavailable or unwanted; using the configured available default.",
            clean_name,
        )
    if DEFAULT_SCRIPT_MODEL and DEFAULT_SCRIPT_MODEL in available_ids and not is_unwanted_model(DEFAULT_SCRIPT_MODEL):
        return DEFAULT_SCRIPT_MODEL
    return models[0]["id"]


def resolve_tts_model(model_name: str | None = None) -> str:
    _, models = get_available_models()
    available_ids = {model["id"] for model in models}
    clean_name = (model_name or "").strip()
    if clean_name and clean_name in available_ids and not is_unwanted_model(clean_name):
        return clean_name
    if clean_name:
        logger.warning(
            "Requested Gemini TTS model '%s' is unavailable or unwanted; using the configured available default.",
            clean_name,
        )
    if DEFAULT_TTS_MODEL and DEFAULT_TTS_MODEL in available_ids and not is_unwanted_model(DEFAULT_TTS_MODEL):
        return DEFAULT_TTS_MODEL
    if models:
        return models[0]["id"]
    raise RuntimeError("Gemini returned no available text-to-speech models for this API key.")
