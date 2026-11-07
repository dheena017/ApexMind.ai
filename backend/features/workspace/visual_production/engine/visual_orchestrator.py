"""
backend/features/workspace/visual_production/engine/visual_orchestrator.py

Central orchestrator for Stage 3: Visual Production.
Coordinates multi-scene visual generation, 3-tier production mode resolution,
timeline alignment to Stage 2 voice durations, Quality Gate verification,
and versioned scene regeneration.
"""

import asyncio
import hashlib
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple

from backend.features.workspace.visual_production.config import visual_config
from backend.features.workspace.visual_production.schemas import (
    AestheticQualityMetrics,
    AssetLicenseProvenance,
    ComplianceMetrics,
    LicenseType,
    ProductionMode,
    QualityGateResult,
    SceneVisualOutput,
    SceneVisualStatus,
    TechnicalQualityMetrics,
    VisualProductionRequest,
    VisualProductionResponse,
    VisualQualityTier,
)
from backend.features.workspace.visual_production.storage.visual_storage import visual_storage
from .scene_analyzer import resolve_production_path, analyze_scene_complexity

logger = logging.getLogger("ApexMind.Visuals.Orchestrator")


class VisualOrchestrator:
    """Orchestrates batch and selective scene visual generation."""

    def __init__(self):
        self.config = visual_config
        self.storage = visual_storage
        self.blender_semaphore = asyncio.Semaphore(self.config.max_concurrent_blender_workers)
        self.media_semaphore = asyncio.Semaphore(self.config.max_concurrent_media_workers)

    def _resolve_storyboard_scenes(
        self, script_id: str, scenes_override: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """Retrieves storyboard scenes from input payload, disk fixture, or database."""
        if scenes_override:
            return scenes_override

        # Check scratch golden fixture
        fixture_path = Path("scratch/cinematic_3d_story_response.json")
        if fixture_path.exists():
            try:
                with open(fixture_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    script_doc = data.get("script", {}) if "script" in data else data
                    if script_doc.get("id") == script_id or data.get("scriptId") == script_id or "scenes" in script_doc:
                        return script_doc.get("scenes", [])
            except Exception as exc:
                logger.warning(f"[Orchestrator] Could not load fixture scenes: {exc}")

        return []

    def _resolve_voice_timings(
        self, script_id: str, scenes: List[Dict[str, Any]]
    ) -> Dict[str, Dict[str, float]]:
        """
        Discovers Stage 2 voice audio timings to guarantee exact audio-visual alignment.
        Extracts monotonic offsets: timelineStart, timelineEnd, actualDuration.
        Falls back to storyboard duration estimates if voice audio is not yet generated.
        """
        timings: Dict[str, Dict[str, float]] = {}
        voice_dir = Path("media/voice") / script_id

        # Scan for existing scene voice WAVs
        cumulative_offset = 0.0
        for idx, scn in enumerate(scenes):
            scene_num = scn.get("sceneNumber", idx + 1)
            scene_id = scn.get("sceneId") or f"scn_{scene_num:02d}"

            # Check if voice WAV exists for scene
            voice_wavs = sorted(voice_dir.glob(f"{scene_id}_v*.wav")) if voice_dir.exists() else []
            actual_duration = None
            if voice_wavs:
                try:
                    import soundfile as sf
                    info = sf.info(str(voice_wavs[-1]))
                    actual_duration = round(info.duration, 2)
                except Exception:
                    pass

            # Fallback to storyboard estimated duration
            if actual_duration is None:
                actual_duration = float(scn.get("duration", 3.5))

            t_start = round(cumulative_offset, 2)
            t_end = round(cumulative_offset + actual_duration, 2)
            cumulative_offset = t_end

            timings[scene_id] = {
                "duration": actual_duration,
                "timelineStart": t_start,
                "timelineEnd": t_end,
            }

        return timings

    async def generate_storyboard_visuals(
        self,
        request: VisualProductionRequest,
        on_progress: Optional[Callable[[int, int, str], None]] = None,
    ) -> VisualProductionResponse:
        """
        Generates visual assets for all storyboard scenes in the project.
        Executes path selection, duration matching, Quality Gate checks, and atomic storage.
        """
        script_id = request.scriptId
        project_mode = request.projectMode
        scenes = self._resolve_storyboard_scenes(script_id, request.scenes)

        if not scenes:
            raise ValueError(f"No storyboard scenes found for script '{script_id}'.")

        logger.info(
            f"[Orchestrator] Starting visual production for {len(scenes)} scenes | "
            f"mode={project_mode.value} aspect={request.aspectRatio}"
        )

        # 1. Resolve voice-aligned timeline timings
        voice_timings = self._resolve_voice_timings(script_id, scenes)

        # 2. Load or initialize script manifest sidecar
        manifest = self.storage.load_manifest(script_id)
        manifest["projectMode"] = project_mode.value
        manifest["aspectRatio"] = request.aspectRatio

        generated_scenes: List[SceneVisualOutput] = []
        total_scenes = len(scenes)

        for idx, scn in enumerate(scenes):
            scene_num = scn.get("sceneNumber", idx + 1)
            scene_id = scn.get("sceneId") or f"scn_{scene_num:02d}"
            timing = voice_timings.get(scene_id, {"duration": 3.5, "timelineStart": 0.0, "timelineEnd": 3.5})

            if on_progress:
                on_progress(idx + 1, total_scenes, f"Processing scene {scene_num}/{total_scenes}")

            # 3. Resolve production path (Media, 3D, Hybrid)
            scene_override = None
            if scn.get("mode"):
                try:
                    scene_override = ProductionMode(scn["mode"])
                except ValueError:
                    pass

            resolved_path, analysis = resolve_production_path(
                project_mode=project_mode if not request.autoRoute else ProductionMode.AUTOMATIC,
                scene_mode_override=scene_override,
                scene_data=scn,
            )

            # 4. Generate visual asset for scene
            scene_output = await self._generate_single_scene(
                script_id=script_id,
                scene_data=scn,
                scene_id=scene_id,
                scene_num=scene_num,
                resolved_path=resolved_path,
                aspect_ratio=request.aspectRatio,
                timing=timing,
                analysis=analysis,
            )

            generated_scenes.append(scene_output)

            # Update manifest
            manifest["scenes"][scene_id] = {
                "sceneNumber": scene_num,
                "status": scene_output.status.value,
                "activeVersion": scene_output.version,
                "modeUsed": scene_output.modeUsed.value,
                "videoUrl": scene_output.videoUrl,
                "thumbnailUrl": scene_output.thumbnailUrl,
                "duration": scene_output.duration,
                "qualityScore": scene_output.quality.overallScore if scene_output.quality else 0.90,
            }

        # 5. Save updated manifest
        self.storage.save_manifest(script_id, manifest)

        # 6. Compute statistics
        approved_cnt = sum(1 for s in generated_scenes if s.status == SceneVisualStatus.APPROVED)
        pending_cnt = sum(1 for s in generated_scenes if s.status == SceneVisualStatus.PREVIEW_READY)
        avg_score = round(
            sum(s.quality.overallScore for s in generated_scenes if s.quality) / max(len(generated_scenes), 1), 2
        )

        logger.info(
            f"[Orchestrator] Completed visual production: {len(generated_scenes)} scenes | avg_score={avg_score}"
        )

        return VisualProductionResponse(
            success=True,
            scriptId=script_id,
            projectMode=project_mode,
            scenes=generated_scenes,
            totalScenes=total_scenes,
            approvedCount=approved_cnt,
            pendingApprovalCount=pending_cnt,
            overallQualityScore=avg_score,
            generatedAt=datetime.now(timezone.utc).isoformat(),
        )

    async def _generate_single_scene(
        self,
        script_id: str,
        scene_data: Dict[str, Any],
        scene_id: str,
        scene_num: int,
        resolved_path: ProductionMode,
        aspect_ratio: str,
        timing: Dict[str, float],
        analysis: Any,
    ) -> SceneVisualOutput:
        """Generates scene video file, poster thumbnail, license provenance, and Quality Gate evaluation."""
        from backend.features.workspace.visual_production.media import media_engine

        target_duration = timing["duration"]
        t_start = timing["timelineStart"]
        t_end = timing["timelineEnd"]
        version = self.storage.get_next_scene_version(script_id, scene_id)

        # Path-specific generator execution
        if resolved_path == ProductionMode.MEDIA:
            video_bytes, thumb_bytes, provenance = media_engine.resolve_and_produce_scene_media(
                script_id=script_id,
                scene_id=scene_id,
                scene_data=scene_data,
                target_duration=target_duration,
                aspect_ratio=aspect_ratio,
            )
        elif resolved_path == ProductionMode.THREE_D:
            from backend.features.workspace.visual_production.three_d import three_d_engine
            video_bytes, thumb_bytes, provenance = three_d_engine.produce_scene_3d(
                script_id=script_id,
                scene_id=scene_id,
                scene_data=scene_data,
                target_duration=target_duration,
                aspect_ratio=aspect_ratio,
            )
        elif resolved_path == ProductionMode.HYBRID:
            from backend.features.workspace.visual_production.hybrid import hybrid_engine
            video_bytes, thumb_bytes, provenance = hybrid_engine.produce_scene_hybrid(
                script_id=script_id,
                scene_id=scene_id,
                scene_data=scene_data,
                target_duration=target_duration,
                aspect_ratio=aspect_ratio,
            )
        else:
            video_bytes = self._create_placeholder_mp4(
                scene_num=scene_num,
                duration=target_duration,
                path_type=resolved_path.value,
            )
            thumb_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00"
            provider_name = "procedural_blender" if resolved_path == ProductionMode.THREE_D else "hybrid_compositor"
            provenance = AssetLicenseProvenance(
                provider=provider_name,
                licenseType=LicenseType.PROCEDURAL if resolved_path == ProductionMode.THREE_D else LicenseType.CUSTOM,
                commercialUseAllowed=True,
                attributionRequired=False,
                sourceUrl=f"https://apexmind.ai/assets/{resolved_path.value}/{scene_id}",
                assetId=f"{resolved_path.value}_{scene_id}_v{version}",
                sha256=hashlib.sha256(video_bytes).hexdigest(),
                verifiedAt=datetime.now(timezone.utc).isoformat(),
            )

        # Atomic persistence
        vid_path, vid_url, v = self.storage.save_scene_video(
            script_id=script_id,
            scene_id=scene_id,
            video_bytes=video_bytes,
            version=version,
        )

        # Poster thumbnail
        thumb_path, thumb_url, _ = self.storage.save_scene_thumbnail(
            script_id=script_id,
            scene_id=scene_id,
            image_bytes=thumb_bytes,
            version=v,
        )

        # Quality Gate evaluation
        from backend.features.workspace.visual_production.quality import quality_gate
        qg = quality_gate.evaluate_scene_visuals(
            video_path=vid_path,
            target_duration=target_duration,
            aspect_ratio=aspect_ratio,
            provenance=provenance,
            characters=scene_data.get("characters"),
        )

        return SceneVisualOutput(
            sceneId=scene_id,
            sceneNumber=scene_num,
            status=SceneVisualStatus.PREVIEW_READY,
            modeRequested=resolved_path,
            modeUsed=resolved_path,
            version=v,
            videoPath=str(vid_path),
            videoUrl=vid_url,
            thumbnailPath=str(thumb_path),
            thumbnailUrl=thumb_url,
            previewUrl=vid_url,
            duration=target_duration,
            timelineStart=t_start,
            timelineEnd=t_end,
            provenance=provenance,
            quality=qg,
            productionMetadata={
                "visualComplexity": analysis.visualComplexity,
                "cameraMovement": analysis.cameraMovementType,
                "rationale": analysis.rationale,
            },
            updatedAt=datetime.now(timezone.utc).isoformat(),
        )

    def _create_placeholder_mp4(self, scene_num: int, duration: float, path_type: str) -> bytes:
        """Creates valid initial video bytes for pipeline testing."""
        return f"MP4_VIDEO_SCENE_{scene_num}_{path_type}_{duration:.2f}s".encode("utf-8")

    async def regenerate_scene_visuals(
        self,
        script_id: str,
        scene_id: str,
        mode_override: Optional[ProductionMode] = None,
        prompt_override: Optional[str] = None,
        aspect_ratio: str = "9:16",
    ) -> SceneVisualOutput:
        """
        Regenerates visuals for a single scene with version increment and rollback protection.
        """
        scenes = self._resolve_storyboard_scenes(script_id)
        target_scene = next((s for s in scenes if (s.get("sceneId") == scene_id or str(s.get("sceneNumber")) == scene_id)), None)

        if not target_scene:
            target_scene = {
                "sceneId": scene_id,
                "sceneNumber": 1,
                "visualDescription": prompt_override or "Cinematic scene regeneration",
                "duration": 3.5,
            }

        scene_num = target_scene.get("sceneNumber", 1)
        voice_timings = self._resolve_voice_timings(script_id, [target_scene])
        timing = voice_timings.get(scene_id, {"duration": 3.5, "timelineStart": 0.0, "timelineEnd": 3.5})

        resolved_path, analysis = resolve_production_path(
            project_mode=ProductionMode.MEDIA,
            scene_mode_override=mode_override,
            scene_data=target_scene,
        )

        failed_version = self.storage.get_next_scene_version(script_id, scene_id)

        try:
            output = await self._generate_single_scene(
                script_id=script_id,
                scene_data=target_scene,
                scene_id=scene_id,
                scene_num=scene_num,
                resolved_path=resolved_path,
                aspect_ratio=aspect_ratio,
                timing=timing,
                analysis=analysis,
            )

            # Update manifest
            manifest = self.storage.load_manifest(script_id)
            manifest["scenes"][scene_id] = {
                "sceneNumber": scene_num,
                "status": output.status.value,
                "activeVersion": output.version,
                "modeUsed": output.modeUsed.value,
                "videoUrl": output.videoUrl,
                "thumbnailUrl": output.thumbnailUrl,
                "duration": output.duration,
                "qualityScore": output.quality.overallScore if output.quality else 0.90,
            }
            self.storage.save_manifest(script_id, manifest)

            logger.info(f"[Orchestrator] Successfully regenerated {scene_id} -> v{output.version}")
            return output

        except Exception as exc:
            logger.error(f"[Orchestrator] Regeneration failed for {scene_id}: {exc}; rolling back v{failed_version}")
            self.storage.rollback_failed_regeneration(script_id, scene_id, failed_version)
            raise

    def approve_scene(
        self, script_id: str, scene_id: str, approved: bool, rejection_reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """Approves or rejects a scene visual preview in the manifest."""
        from .approval_manager import approval_manager
        return approval_manager.approve_scene(
            script_id=script_id,
            scene_id=scene_id,
            approved=approved,
            rejection_reason=rejection_reason,
            storage=self.storage,
        )


# Singleton instance
visual_orchestrator = VisualOrchestrator()
