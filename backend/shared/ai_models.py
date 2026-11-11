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

def get_model_rate_limits(model_id: str | None = None) -> dict[str, Any]:
    """
    Dynamically resolves rate limits specifically for the requested model.
    Different models have distinct rate limits based on architecture (Flash vs Pro vs Lite vs Embeddings).
    """
    from .google_quotas import fetch_live_gcp_gemini_quotas

    gcp_quota = fetch_live_gcp_gemini_quotas(model_id=model_id)
    mid = (model_id or "").lower()

    if "pro" in mid:
        base_rpm = 2
        base_tpm = 32000
        base_rpd = 20
        description = "Deep logical reasoning, advanced coding & mathematics"
    elif "lite" in mid:
        base_rpm = 15
        base_tpm = 500000
        base_rpd = 50
        description = "Extremely lightweight, ultra low-latency generation"
    elif "embed" in mid:
        base_rpm = 1500
        base_tpm = 1000000
        base_rpd = "Unlimited"
        description = "High-throughput vector embeddings and semantic search"
    else:  # Standard Flash models (e.g. Gemini 2.5 Flash)
        base_rpm = 5
        base_tpm = 250000
        base_rpd = 20
        description = "High speed, multimodal, cost-effective reasoning"

    # Use live GCP Cloud Quotas if connected, otherwise use the specific model profile
    rpm = gcp_quota["rpm"] if gcp_quota.get("connected") and gcp_quota.get("rpm") is not None else base_rpm
    tpm = gcp_quota["tpm"] if gcp_quota.get("connected") and gcp_quota.get("tpm") is not None else base_tpm
    rpd = gcp_quota["rpd"] if gcp_quota.get("connected") and gcp_quota.get("rpd") is not None else base_rpd

    return {
        "modelId": model_id,
        "free": {"rpm": rpm, "tpm": tpm, "rpd": rpd},
        "paid": {"rpm": 1000 if "pro" in mid else 2000, "tpm": 4000000, "rpd": "Unlimited"},
        "description": description,
        "source": gcp_quota.get("source", "model_profile"),
    }

_UNWANTED_MODEL_TERMS = (
    "antigravity",
    "deep-research",
    "research",
    "robotics",
    "computer-use",
    "computer_use",
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
)


def is_unwanted_model(model_id: str | None) -> bool:
    """Filter out non-text/specialized internal models while keeping all valid Gemini generations."""
    if not model_id:
        return True
    lowered = str(model_id).lower().strip()
    return any(term in lowered for term in _UNWANTED_MODEL_TERMS)


def _model_value(model: Any, field: str, default: Any = None) -> Any:
    if isinstance(model, dict):
        return model.get(field, default)
    return getattr(model, field, default)


def _script_model_sort_key(model: dict[str, Any]) -> tuple[int, int, str]:
    mid = model["id"].lower()
    is_default = 0 if (DEFAULT_SCRIPT_MODEL and mid == DEFAULT_SCRIPT_MODEL.lower()) else 1
    # Prefer flash over pro for faster, higher-quota default script workflows
    speed_priority = 0 if "flash" in mid else (1 if "pro" in mid else 2)
    return (is_default, speed_priority, model["name"].casefold())


def get_available_models(force_refresh: bool = False) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
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
        script_models: list[dict[str, Any]] = []
        tts_models: list[dict[str, Any]] = []

        # 100% Dynamic discovery directly from Google GenAI client
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

            input_token_limit = _model_value(model, "input_token_limit", None)
            output_token_limit = _model_value(model, "output_token_limit", None)
            description = _model_value(model, "description", "")
            category = "pro" if "pro" in lowered_id else "flash"
            quota_info = get_model_rate_limits(model_id)

            model_data = {
                "id": model_id,
                "name": display_name,
                "inputTokenLimit": input_token_limit,
                "outputTokenLimit": output_token_limit,
                "description": description,
                "category": category,
                "quota": quota_info,
            }

            if "tts" in lowered_id and supports_generation:
                tts_models.append(model_data)
            elif supports_generation and not any(term in lowered_id for term in _NON_SCRIPT_MODEL_TERMS):
                script_models.append(model_data)

        script_models.sort(key=_script_model_sort_key)
        tts_models.sort(key=lambda model: (model["id"] != DEFAULT_TTS_MODEL, model["name"].casefold()))
        _MODEL_CACHE = (now, script_models, tts_models)
        return script_models, tts_models


def get_cached_models() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    with _MODEL_CACHE_LOCK:
        if not _MODEL_CACHE:
            return [], []
        return _MODEL_CACHE[1], _MODEL_CACHE[2]


def get_default_script_model() -> str:
    models, _ = get_available_models()
    available_ids = {model["id"] for model in models}
    if DEFAULT_SCRIPT_MODEL and DEFAULT_SCRIPT_MODEL in available_ids and not is_unwanted_model(DEFAULT_SCRIPT_MODEL):
        return DEFAULT_SCRIPT_MODEL
    if not models:
        raise RuntimeError("Gemini returned no available text-generation models for this API key.")
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
    """Deprecated: Fallbacks disabled. Requests run exclusively on selected model."""
    return []


def get_tts_fallback_models(primary_model: str) -> list[str]:
    """Deprecated: Fallbacks disabled. Requests run exclusively on selected model."""
    return []


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
    if models:
        return models[0]["id"]
    raise RuntimeError("Gemini returned no available text-generation models for this API key.")


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
