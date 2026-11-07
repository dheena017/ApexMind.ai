import os
import threading
import time
import logging
from typing import Any

from .config import settings


DEFAULT_SCRIPT_MODEL = os.environ.get("DEFAULT_SCRIPT_MODEL", "gemini-3.5-flash").strip() or "gemini-3.5-flash"
DEFAULT_TTS_MODEL = os.environ.get("DEFAULT_TTS_MODEL", "gemini-3.8-flash-tts").strip() or "gemini-3.8-flash-tts"
_MODEL_CACHE_SECONDS = 300
_MODEL_CACHE_LOCK = threading.Lock()
_MODEL_CACHE: tuple[float, list[dict[str, str]], list[dict[str, str]]] | None = None
logger = logging.getLogger("ApexMind.AI.Models")

_NON_SCRIPT_MODEL_TERMS = (
    "tts",
    "embedding",
    "image",
    "imagen",
    "veo",
    "live",
    "transcribe",
    "robotics",
    "computer-use",
    "computer_use",
    "deep-research",
    "research",
    "gemini-2.5",
    "antigravity-preview",
    "banana",
    "lyria",
    "argon",
    "omni",
    "pro",
    "gemma",
)

PREFERRED_SCRIPT_MODEL_ORDER = [
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3-flash-preview",
    "gemini-3.7-flash",
    "gemini-3.8-flash",
    "gemini-3.6-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
]


def _script_model_sort_key(model: dict[str, str]) -> tuple[int, str]:
    m_id = model["id"]
    if m_id == DEFAULT_SCRIPT_MODEL:
        return (-1, model["name"].casefold())
    if m_id in PREFERRED_SCRIPT_MODEL_ORDER:
        return (PREFERRED_SCRIPT_MODEL_ORDER.index(m_id), model["name"].casefold())
    return (len(PREFERRED_SCRIPT_MODEL_ORDER) + 1, model["name"].casefold())


def _model_value(model: Any, field: str, default: Any = None) -> Any:
    if isinstance(model, dict):
        return model.get(field, default)
    return getattr(model, field, default)


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
            if not model_id:
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
            raise RuntimeError("Gemini returned no available text-generation models for this API key.")

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
    if DEFAULT_SCRIPT_MODEL in available_ids:
        return DEFAULT_SCRIPT_MODEL
    return models[0]["id"]


def get_default_tts_model() -> str:
    _, models = get_available_models()
    available_ids = {model["id"] for model in models}
    if DEFAULT_TTS_MODEL in available_ids:
        return DEFAULT_TTS_MODEL
    if not models:
        raise RuntimeError("Gemini returned no available text-to-speech models for this API key.")
    return models[0]["id"]


def get_script_fallback_models(primary_model: str) -> list[str]:
    models, _ = get_available_models()
    return [model["id"] for model in models if model["id"] != primary_model]


def get_tts_fallback_models(primary_model: str) -> list[str]:
    _, models = get_available_models()
    return [model["id"] for model in models if model["id"] != primary_model]


def resolve_script_model(model_name: str | None = None) -> str:
    models, _ = get_available_models()
    available_ids = {model["id"] for model in models}
    if model_name and model_name.strip() in available_ids:
        return model_name.strip()
    if model_name:
        logger.warning("Requested Gemini script model '%s' is unavailable; using the configured available default.", model_name)
    return DEFAULT_SCRIPT_MODEL if DEFAULT_SCRIPT_MODEL in available_ids else models[0]["id"]


def resolve_tts_model(model_name: str | None = None) -> str:
    _, models = get_available_models()
    available_ids = {model["id"] for model in models}
    if model_name and model_name.strip() in available_ids:
        return model_name.strip()
    if model_name:
        logger.warning("Requested Gemini TTS model '%s' is unavailable; using the configured available default.", model_name)
    if DEFAULT_TTS_MODEL in available_ids:
        return DEFAULT_TTS_MODEL
    if models:
        return models[0]["id"]
    raise RuntimeError("Gemini returned no available text-to-speech models for this API key.")
