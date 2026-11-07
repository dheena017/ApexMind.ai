"""
backend/features/workspace/visual_production/three_d/blender_executor.py

Subprocess execution harness for headless Blender 5.2 LTS rendering.
Enforces single-worker hardware concurrency guardrails, stdout streaming,
and execution timeouts.
"""

import json
import logging
import os
import subprocess
import tempfile
import threading
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

from backend.features.workspace.visual_production.config import visual_config

logger = logging.getLogger("ApexMind.Visuals.BlenderExecutor")

# Hardware safety lock: single-worker execution to prevent Windows OOM crashes
_BLENDER_PROCESS_LOCK = threading.Lock()


class BlenderExecutor:
    """Manages headless invocation of Blender 5.2 LTS."""

    def __init__(self):
        self.config = visual_config
        self.blender_path = self.config.blender_path

    def is_available(self) -> bool:
        """Returns True if Blender executable is installed and reachable."""
        return bool(self.blender_path and Path(self.blender_path).is_file())

    def execute_script(
        self,
        script_path: Path,
        payload: Dict[str, Any],
        timeout_seconds: Optional[int] = None,
    ) -> Tuple[int, str, str]:
        """
        Executes a Blender Python script in headless background mode:
        blender.exe -b -P <script_path> -- <payload_json_file>
        Enforces a serialized hardware execution lock and timeout.
        """
        if not self.is_available():
            raise RuntimeError(
                f"Blender executable not found at '{self.blender_path}'. Please install Blender 5.2+."
            )

        timeout = timeout_seconds or self.config.blender_timeout_seconds

        # Write payload to temporary JSON file passed to Blender
        temp_payload_file = tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False, encoding="utf-8"
        )
        try:
            json.dump(payload, temp_payload_file, indent=2)
            temp_payload_file.close()

            cmd = [
                str(self.blender_path),
                "-b",  # Background headless mode
                "--factory-startup",
                "-P", str(script_path),
                "--",
                temp_payload_file.name,
            ]

            logger.info(f"[BlenderExecutor] Launching headless render (timeout={timeout}s): {' '.join(cmd[:4])} ...")

            with _BLENDER_PROCESS_LOCK:
                proc = subprocess.run(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=timeout,
                    text=True,
                )

            logger.info(f"[BlenderExecutor] Blender exited with code {proc.returncode}")
            return proc.returncode, proc.stdout, proc.stderr

        except subprocess.TimeoutExpired:
            logger.error(f"[BlenderExecutor] Blender execution timed out after {timeout} seconds.")
            return -1, "", f"Execution timed out after {timeout}s"
        except Exception as exc:
            logger.error(f"[BlenderExecutor] Blender execution failed: {exc}")
            return -1, "", str(exc)
        finally:
            if os.path.exists(temp_payload_file.name):
                try:
                    os.unlink(temp_payload_file.name)
                except Exception:
                    pass


# Singleton instance
blender_executor = BlenderExecutor()

