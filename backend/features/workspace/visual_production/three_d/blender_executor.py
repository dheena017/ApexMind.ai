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
import time
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

from backend.features.workspace.visual_production.config import visual_config

logger = logging.getLogger("ApexMind.Visuals.BlenderExecutor")

# Hardware safety lock: single-worker execution to prevent Windows OOM crashes
_BLENDER_PROCESS_LOCK = threading.Lock()


class BlenderExecutor:
    """Manages headless invocation of Blender 5.2 LTS with GPU detection and CPU retry."""

    def __init__(self):
        self.config = visual_config
        self.blender_path = self.config.blender_path
        self._version_cache: Optional[str] = None
        self._gpu_cache: Optional[Dict[str, Any]] = None

    def is_available(self) -> bool:
        """Returns True if Blender executable is installed and reachable."""
        return bool(self.blender_path and Path(self.blender_path).is_file())

    def get_blender_version(self) -> Optional[str]:
        """Runs blender --version and returns version string."""
        if self._version_cache:
            return self._version_cache
        if not self.is_available():
            return None
        try:
            cmd = [str(self.blender_path), "--version"]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=10, text=True)
            if res.returncode == 0:
                first_line = res.stdout.strip().split("\n")[0]
                self._version_cache = first_line
                return first_line
        except Exception as exc:
            logger.warning(f"[BlenderExecutor] Could not probe blender version: {exc}")
        return None

    def verify_compatibility(self) -> Dict[str, Any]:
        """Validates Blender version and supported render engine compatibility."""
        ver = self.get_blender_version() or "Unknown"
        is_compat = "5." in ver or "4.2" in ver or "4.3" in ver or "4." in ver
        engines = ["BLENDER_EEVEE_NEXT", "BLENDER_EEVEE", "CYCLES"]
        return {
            "blenderPath": str(self.blender_path),
            "version": ver,
            "compatible": is_compat,
            "supportedEngines": engines,
        }

    def detect_gpu_support(self) -> Dict[str, Any]:
        """Detects whether CUDA/OptiX hardware compute is available for Cycles/EEVEE."""
        if self._gpu_cache is not None:
            return self._gpu_cache

        gpu_info = {
            "has_gpu": False,
            "device_name": None,
            "compute_type": "CPU",
        }

        try:
            # Query nvidia-smi
            nvsmi = subprocess.run(
                ["nvidia-smi", "--query-gpu=name", "--format=csv,noheader"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=5,
                text=True,
            )
            if nvsmi.returncode == 0 and nvsmi.stdout.strip():
                dev_name = nvsmi.stdout.strip().split("\n")[0]
                gpu_info = {
                    "has_gpu": True,
                    "device_name": dev_name,
                    "compute_type": "CUDA",
                }
        except Exception:
            pass

        self._gpu_cache = gpu_info
        return gpu_info

    def execute_script(
        self,
        script_path: Path,
        payload: Dict[str, Any],
        timeout_seconds: Optional[int] = None,
        allow_cpu_retry: bool = True,
    ) -> Tuple[int, str, str]:
        """
        Executes a Blender Python script in headless background mode:
        blender.exe -b -P <script_path> -- <payload_json_file>
        Enforces a serialized hardware execution lock, timeout, and CPU retry fallback.
        """
        if not self.is_available():
            raise RuntimeError(
                f"Blender executable not found at '{self.blender_path}'. Please install Blender 5.2+."
            )

        timeout = timeout_seconds or self.config.blender_timeout_seconds
        start_time = time.perf_counter()
        retries = 0

        code, stdout, stderr = self._run_single_execution(script_path, payload, timeout)

        # If GPU was requested or default failed, attempt CPU compute retry
        if code != 0 and allow_cpu_retry:
            logger.warning(
                f"[BlenderExecutor] Initial execution failed (code {code}); retrying with fallback CPU compute..."
            )
            retries += 1
            cpu_payload = dict(payload)
            cpu_payload["device"] = "CPU"
            cpu_payload["engine"] = "BLENDER_EEVEE"
            code, stdout, stderr = self._run_single_execution(script_path, cpu_payload, timeout)

        elapsed = round(time.perf_counter() - start_time, 2)
        logger.info(f"[BlenderExecutor] Render completed in {elapsed}s (retries={retries}, code={code})")
        return code, stdout, stderr

    def _run_single_execution(
        self,
        script_path: Path,
        payload: Dict[str, Any],
        timeout: int,
    ) -> Tuple[int, str, str]:
        """Runs a single headless Blender process within the serialization lock."""
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

