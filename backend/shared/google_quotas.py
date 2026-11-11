"""
backend/shared/google_quotas.py
Automated live Google Cloud Quotas API client for Gemini (Generative Language API).
Fetches exact project-level RPM, TPM, and RPD limits from serviceusage.googleapis.com.
"""

import os
import time
import logging
import threading
from typing import Dict, Any, Optional

from .config import settings

logger = logging.getLogger("ApexMind.GoogleCloud.Quotas")

_QUOTA_CACHE_LOCK = threading.Lock()
_QUOTA_CACHE: Optional[tuple[float, Dict[str, Any]]] = None
_QUOTA_CACHE_TTL = 3600  # 1 hour cache


def get_gcp_credentials_path() -> Optional[str]:
    """Resolves service account JSON path from environment or default locations."""
    configured = settings.GOOGLE_APPLICATION_CREDENTIALS
    if configured and os.path.isfile(configured):
        return configured

    candidates = [
        os.path.join(os.getcwd(), "gcp_credentials.json"),
        os.path.join(os.getcwd(), "backend", "data", "gcp_credentials.json"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "gcp_credentials.json"),
    ]
    for path in candidates:
        if os.path.isfile(path):
            return path
    return None


def fetch_live_gcp_gemini_quotas(model_id: str | None = None, force_refresh: bool = False) -> Dict[str, Any]:
    """
    Connects to Google Cloud Service Usage API and returns actual live RPM, TPM, and RPD.
    Falls back gracefully if credentials or project ID are not yet configured.
    """
    global _QUOTA_CACHE
    now = time.monotonic()

    with _QUOTA_CACHE_LOCK:
        if not force_refresh and _QUOTA_CACHE and now - _QUOTA_CACHE[0] < _QUOTA_CACHE_TTL:
            return _QUOTA_CACHE[1]

        project_id = settings.GCP_PROJECT_ID
        creds_path = get_gcp_credentials_path()

        # Fallback if GCP credentials are not yet configured
        fallback_result = {
            "source": "per_model_profile",
            "rpm": None,
            "tpm": None,
            "rpd": None,
            "connected": False,
        }

        if not project_id or not creds_path:
            _QUOTA_CACHE = (now, fallback_result)
            return fallback_result

        try:
            from google.oauth2 import service_account
            from googleapiclient.discovery import build

            credentials = service_account.Credentials.from_service_account_file(
                creds_path,
                scopes=["https://www.googleapis.com/auth/cloud-platform"]
            )
            service = build("serviceusage", "v1", credentials=credentials, cache_discovery=False)

            parent = f"projects/{project_id}/services/generativelanguage.googleapis.com"
            request = service.services().consumerQuotaMetrics().list(
                parent=parent,
                view="FULL"
            )
            response = request.execute()

            rpm = None
            tpm = None
            rpd = None

            for metric in response.get("metrics", []):
                metric_name = (metric.get("displayName") or metric.get("metric") or "").lower()
                for limit in metric.get("consumerQuotaLimits", []):
                    for bucket in limit.get("quotaBuckets", []):
                        val = bucket.get("effectiveLimit")
                        if val is not None:
                            try:
                                val_int = int(val)
                                if "minute" in metric_name and "token" in metric_name:
                                    tpm = val_int
                                elif "minute" in metric_name and ("request" in metric_name or "generate" in metric_name):
                                    rpm = val_int
                                elif "day" in metric_name:
                                    rpd = val_int
                            except (ValueError, TypeError):
                                pass

            live_result = {
                "source": "google_cloud_quotas_api",
                "rpm": rpm,
                "tpm": tpm,
                "rpd": rpd,
                "connected": True,
                "projectId": project_id,
            }
            logger.info(f"Live Google Cloud Quotas retrieved for {project_id}: RPM={live_result['rpm']}, TPM={live_result['tpm']}, RPD={live_result['rpd']}")
            _QUOTA_CACHE = (now, live_result)
            return live_result

        except Exception as exc:
            logger.warning(f"Failed to query Google Cloud Quotas API ({exc}). Using configured quotas.")
            _QUOTA_CACHE = (now, fallback_result)
            return fallback_result

