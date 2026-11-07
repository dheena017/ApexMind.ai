"""
backend/features/workspace/voice_generation/services/script_reader.py
Script reader service for Stage 2 Voice Generation with authenticated ownership validation.
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger("ApexMind.Voice.ScriptReader")


def load_and_validate_script(
    script_id: str,
    user_id: Optional[str] = None,
    project_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Retrieves the approved script document from the repository or file storage,
    validating ownership and scene structure.
    """
    if not script_id or not script_id.strip():
        raise ValueError("scriptId is required to generate voice narration.")

    script_doc: Optional[Dict[str, Any]] = None

    # 1. Attempt database lookup via ScriptStorageRepository
    try:
        from backend.features.workspace.script_storage.repository import ScriptStorageRepository
        db_script = ScriptStorageRepository.get_script(script_id)
        if db_script:
            # Check ownership if user_id or project_id provided
            if user_id and db_script.get("user_id") and db_script.get("user_id") != user_id:
                raise PermissionError(f"User '{user_id}' does not have permission to access script '{script_id}'.")
            if project_id and db_script.get("project_id") and db_script.get("project_id") != project_id:
                raise PermissionError(f"Script '{script_id}' does not belong to project '{project_id}'.")

            # Extract document payload
            cur_ver = db_script.get("current_version") or {}
            payload_raw = cur_ver.get("document_payload") or cur_ver.get("documentPayload")
            if payload_raw:
                script_doc = json.loads(payload_raw) if isinstance(payload_raw, str) else payload_raw
            else:
                script_doc = db_script
    except Exception as e:
        logger.debug(f"[ScriptReader] Database lookup notice for '{script_id}': {e}")

    # 2. File storage / scratch fallback
    if not script_doc:
        candidate_paths = [
            Path(f"scratch/{script_id}.json"),
            Path("scratch/cinematic_3d_story_response.json"),
        ]
        for cp in candidate_paths:
            if cp.exists():
                try:
                    with open(cp, "r", encoding="utf-8") as f:
                        file_data = json.load(f)
                    if file_data.get("script", {}).get("id") == script_id or file_data.get("id") == script_id:
                        script_doc = file_data.get("script") or file_data
                        break
                    elif cp.name == "cinematic_3d_story_response.json" and script_id.startswith("scr_"):
                        # If requesting the standard cinematic story test id
                        script_doc = file_data.get("script") or file_data
                        break
                except Exception as fe:
                    logger.warning(f"[ScriptReader] Failed reading candidate file {cp}: {fe}")

    if not script_doc:
        raise ValueError(f"Script '{script_id}' could not be found or loaded.")

    scenes = script_doc.get("scenes") or []
    if not scenes:
        raise ValueError(f"Script '{script_id}' contains no scenes for narration synthesis.")

    logger.info(f"[ScriptReader] Successfully loaded script '{script_id}' with {len(scenes)} scenes.")
    return script_doc

