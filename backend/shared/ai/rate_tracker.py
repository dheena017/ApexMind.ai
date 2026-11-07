"""
backend/shared/ai/rate_tracker.py
Thread-safe real-time rate limit and RPM / RPD tracker for Gemini AI requests.
"""

import time
import threading
from typing import Any
from backend.shared.ai_models import DEFAULT_SCRIPT_MODEL, get_cached_models


class GeminiRateTracker:
    """Thread-safe real-time rate limit and RPM / RPD tracker for Gemini AI requests."""

    def __init__(self):
        self._lock = threading.Lock()
        self._requests: list[float] = []
        self._daily_requests: list[float] = []
        self._tokens_minute: list[tuple[float, int]] = []
        self._total_requests_all_time: int = 0
        self._last_request_time: float | None = None
        self._last_model_used: str = DEFAULT_SCRIPT_MODEL

    def record_request(self, model_name: str = DEFAULT_SCRIPT_MODEL, tokens: int = 0):
        now = time.time()
        with self._lock:
            self._requests.append(now)
            self._daily_requests.append(now)
            if tokens > 0:
                self._tokens_minute.append((now, tokens))
            self._total_requests_all_time += 1
            self._last_request_time = now
            self._last_model_used = model_name
            self._cleanup(now)

    def _cleanup(self, now: float):
        one_min_ago = now - 60.0
        one_day_ago = now - 86400.0
        self._requests = [t for t in self._requests if t > one_min_ago]
        self._daily_requests = [t for t in self._daily_requests if t > one_day_ago]
        self._tokens_minute = [(t, c) for t, c in self._tokens_minute if t > one_min_ago]

    def get_telemetry(self) -> dict[str, Any]:
        now = time.time()
        with self._lock:
            self._cleanup(now)
            current_rpm = len(self._requests)
            current_rpd = len(self._daily_requests)
            current_tpm = sum(c for _, c in self._tokens_minute)
            limit_rpm = None
            limit_rpd = None

            script_models, tts_models = get_cached_models()

            return {
                "current_rpm": current_rpm,
                "current_rpd": current_rpd,
                "current_tpm": current_tpm,
                "limit_rpm": limit_rpm,
                "limit_rpd": limit_rpd,
                "total_requests_all_time": self._total_requests_all_time,
                "last_request_time": self._last_request_time,
                "last_model_used": self._last_model_used,
                "tier": "Quota limits are managed by Google AI Studio",
                "models": [
                    {
                        "name": model["name"],
                        "id": model["id"],
                        "category": category,
                        "status": "Available",
                    }
                    for category, models in (("Script generation", script_models), ("Voice generation", tts_models))
                    for model in models
                ],
            }


rate_tracker = GeminiRateTracker()

