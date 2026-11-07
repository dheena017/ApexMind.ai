"""
backend/features/workspace/visual_production/hybrid/hybrid_engine.py

Path C: Hybrid Compositing Production Engine for Stage 3.
Composites transparent 3D character/props layers rendered in Blender
over cinematic stock background plates with FFmpeg perspective and color harmonization.
"""

import hashlib
import logging
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

from backend.features.workspace.visual_production.config import visual_config
from backend.features.workspace.visual_production.media.media_engine import media_engine
from backend.features.workspace.visual_production.schemas import (
    AssetLicenseProvenance,
    LicenseType,
    ProductionMode,
)
from backend.features.workspace.visual_production.three_d.generators.three_d_engine import three_d_engine

logger = logging.getLogger("ApexMind.Visuals.HybridEngine")


class HybridEngine:
    """Coordinates multi-layer hybrid production (Media Background Plate + 3D Foreground)."""

    def __init__(self):
        self.config = visual_config
        self.hybrid_dir = self.config.temp_render_dir / "hybrid_cache"
        self.hybrid_dir.mkdir(parents=True, exist_ok=True)

    def produce_scene_hybrid(
        self,
        script_id: str,
        scene_id: str,
        scene_data: Dict[str, Any],
        target_duration: float,
        aspect_ratio: str = "9:16",
        style: str = "cinematic_3d_story",
    ) -> Tuple[bytes, bytes, AssetLicenseProvenance]:
        """
        Executes Path C production:
        1. Slices / downloads background plate via MediaEngine (Path A).
        2. Renders 3D transparent subject layer via ThreeDEngine (Path B) with render_alpha=True.
        3. Harmonizes color balance & perspective, compositing layers via FFmpeg overlay filtergraph.
        4. Extracts poster thumbnail.
        5. Returns: (video_bytes, thumb_bytes, provenance)
        """
        w, h = self.config.get_resolution(aspect_ratio)

        bg_path = self.hybrid_dir / f"{script_id}_{scene_id}_bg.mp4"
        fg_path = self.hybrid_dir / f"{script_id}_{scene_id}_fg.mp4"
        composite_path = self.hybrid_dir / f"{script_id}_{scene_id}_composite.mp4"
        thumb_path = self.hybrid_dir / f"{script_id}_{scene_id}_thumb.jpg"

        # 1. Background plate resolution
        bg_bytes, _, bg_prov = media_engine.resolve_and_produce_scene_media(
            script_id=script_id,
            scene_id=f"{scene_id}_bg",
            scene_data=scene_data,
            target_duration=target_duration,
            aspect_ratio=aspect_ratio,
        )
        bg_path.write_bytes(bg_bytes)

        # 2. Foreground 3D transparent layer resolution
        fg_bytes, _, fg_prov = three_d_engine.produce_scene_3d(
            script_id=script_id,
            scene_id=f"{scene_id}_fg",
            scene_data=scene_data,
            target_duration=target_duration,
            aspect_ratio=aspect_ratio,
            style=style,
            render_alpha=True,
        )
        fg_path.write_bytes(fg_bytes)

        # 3. Composite layers via FFmpeg
        success = self._composite_layers(
            bg_path=bg_path,
            fg_path=fg_path,
            out_path=composite_path,
            target_duration=target_duration,
            width=w,
            height=h,
        )

        if not success or not composite_path.exists():
            logger.warning(f"[HybridEngine] Compositing failed for {scene_id}; falling back to background plate.")
            composite_bytes = bg_bytes
        else:
            composite_bytes = composite_path.read_bytes()

        # 4. Extract poster thumbnail
        if composite_path.exists():
            self._extract_poster_thumbnail(composite_path, thumb_path)
        thumb_bytes = thumb_path.read_bytes() if thumb_path.exists() else b"\xff\xd8\xff\xe0\x00\x10JFIF"

        # Cleanup temp adaptation files
        for p in (bg_path, fg_path, composite_path, thumb_path):
            if p.exists():
                try:
                    p.unlink()
                except Exception:
                    pass

        sha256_hash = hashlib.sha256(composite_bytes).hexdigest()
        provenance = AssetLicenseProvenance(
            provider="hybrid_composite",
            licenseType=LicenseType.CUSTOM,
            commercialUseAllowed=True,
            attributionRequired=False,
            sourceUrl=f"hybrid://{bg_prov.provider}+{fg_prov.provider}/{scene_id}",
            assetId=f"hybrid_{scene_id}",
            sha256=sha256_hash,
            verifiedAt=datetime.now(timezone.utc).isoformat(),
        )

        return composite_bytes, thumb_bytes, provenance

    def _composite_layers(
        self,
        bg_path: Path,
        fg_path: Path,
        out_path: Path,
        target_duration: float,
        width: int,
        height: int,
    ) -> bool:
        """
        Composites background plate and 3D overlay with ambient contrast & color grading.
        Filtergraph: [0:v][1:v]overlay=0:0:format=auto,eq=contrast=1.04:saturation=1.05[v]
        """
        ffmpeg_bin = self.config.ffmpeg_path
        filter_complex = (
            f"[0:v]scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height}[bg];"
            f"[1:v]scale={width}:{height}[fg];"
            f"[bg][fg]overlay=0:0:format=auto,eq=contrast=1.04:saturation=1.05[v]"
        )

        cmd = [
            ffmpeg_bin,
            "-y",
            "-i", str(bg_path),
            "-i", str(fg_path),
            "-filter_complex", filter_complex,
            "-map", "[v]",
            "-t", f"{target_duration:.3f}",
            "-c:v", "libx264",
            "-preset", "fast",
            "-pix_fmt", "yuv420p",
            "-an",
            str(out_path),
        ]

        try:
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=40)
            return res.returncode == 0 and out_path.exists()
        except Exception as exc:
            logger.warning(f"[HybridEngine] Error in FFmpeg composite: {exc}")
            return False

    def _extract_poster_thumbnail(self, video_path: Path, thumb_path: Path):
        """Extracts JPEG poster thumbnail from video file."""
        ffmpeg_bin = self.config.ffmpeg_path
        cmd = [
            ffmpeg_bin,
            "-y",
            "-i", str(video_path),
            "-vframes", "1",
            "-q:v", "2",
            str(thumb_path),
        ]
        try:
            subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=15)
        except Exception:
            pass


# Singleton instance
hybrid_engine = HybridEngine()

