"""
backend/features/workspace/voice_generation/storage/audio_storage.py
Versioned audio file persistence and cache manager for Stage 2 Voice Generation.
"""

import hashlib
import json
import logging
import os
import shutil
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

logger = logging.getLogger("ApexMind.Voice.Storage")


class AudioStorageManager:
    def __init__(self, base_media_dir: Optional[str] = None):
        self.base_dir = Path(base_media_dir or os.environ.get("MEDIA_DIR", "media")) / "voice"
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self._cache_index_path = self.base_dir / "cache_index.json"
        self._cache_index = self._load_cache_index()

    def _load_cache_index(self) -> Dict[str, str]:
        if self._cache_index_path.exists():
            try:
                with open(self._cache_index_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"[Storage] Could not load cache index: {e}")
        return {}

    def _save_cache_index(self):
        try:
            with open(self._cache_index_path, "w", encoding="utf-8") as f:
                json.dump(self._cache_index, f, indent=2)
        except Exception as e:
            logger.warning(f"[Storage] Could not write cache index: {e}")

    def compute_cache_key(
        self,
        provider_id: str,
        voice_id: str,
        normalized_text: str,
        speed: float = 1.0,
        pitch: float = 0.0,
        target_lufs: float = -16.0,
        audio_format: str = "wav",
        version: str = "v1.1.0",
    ) -> str:
        """
        Calculates a composite SHA-256 cache key including all generative audio parameters.
        """
        raw = f"{provider_id}|{voice_id}|{speed:.2f}|{pitch:.2f}|{target_lufs:.1f}|{audio_format}|{version}|{normalized_text}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def get_script_dir(self, script_id: str) -> Path:
        s_dir = self.base_dir / script_id
        s_dir.mkdir(parents=True, exist_ok=True)
        return s_dir

    def get_cached_scene_audio(self, cache_key: str) -> Optional[bytes]:
        cached_rel_path = self._cache_index.get(cache_key)
        if cached_rel_path:
            full_path = self.base_dir / cached_rel_path
            if full_path.exists():
                try:
                    with open(full_path, "rb") as f:
                        return f.read()
                except Exception:
                    pass
        return None

    def get_next_scene_version(self, script_id: str, scene_id: str) -> int:
        s_dir = self.get_script_dir(script_id)
        existing = list(s_dir.glob(f"{scene_id}_v*.wav"))
        if not existing:
            return 1
        versions = []
        for p in existing:
            try:
                v_part = p.stem.split("_v")[-1]
                versions.append(int(v_part))
            except ValueError:
                pass
        return max(versions) + 1 if versions else 1

    def save_scene_audio(
        self,
        script_id: str,
        scene_id: str,
        wav_bytes: bytes,
        version: Optional[int] = None,
        cache_key: Optional[str] = None,
    ) -> Tuple[Path, str, int]:
        """
        Saves versioned scene audio file.
        Returns: (file_path, public_url, version)
        """
        s_dir = self.get_script_dir(script_id)
        v = version if version is not None else self.get_next_scene_version(script_id, scene_id)
        filename = f"{scene_id}_v{v}.wav"
        file_path = s_dir / filename

        # Atomic write via temp file
        temp_path = s_dir / f".tmp_{filename}"
        with open(temp_path, "wb") as f:
            f.write(wav_bytes)

        shutil.move(str(temp_path), str(file_path))

        rel_path = f"{script_id}/{filename}"
        public_url = f"/media/voice/{rel_path}"

        if cache_key:
            self._cache_index[cache_key] = rel_path
            self._save_cache_index()

        logger.info(f"[Storage] Saved scene audio: {file_path} (version {v})")
        return file_path, public_url, v

    def save_master_audio(
        self,
        script_id: str,
        wav_bytes: bytes,
        version: Optional[int] = None,
    ) -> Tuple[Path, str, int]:
        """
        Atomically saves and promotes narration_master_vN.wav.
        """
        s_dir = self.get_script_dir(script_id)
        existing_masters = list(s_dir.glob("narration_master_v*.wav"))
        v_list = []
        for p in existing_masters:
            try:
                v_list.append(int(p.stem.split("_v")[-1]))
            except ValueError:
                pass
        v = version if version is not None else ((max(v_list) + 1) if v_list else 1)

        versioned_filename = f"narration_master_v{v}.wav"
        versioned_path = s_dir / versioned_filename
        active_master_path = s_dir / "narration_master.wav"

        # Atomic write
        temp_path = s_dir / f".tmp_{versioned_filename}"
        with open(temp_path, "wb") as f:
            f.write(wav_bytes)

        shutil.move(str(temp_path), str(versioned_path))
        # Copy to canonical narration_master.wav
        shutil.copyfile(str(versioned_path), str(active_master_path))

        public_url = f"/media/voice/{script_id}/narration_master.wav"
        logger.info(f"[Storage] Promoted master audio: {active_master_path} (version {v})")
        return active_master_path, public_url, v


# Global storage manager singleton
audio_storage = AudioStorageManager()

