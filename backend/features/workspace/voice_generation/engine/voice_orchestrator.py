"""
backend/features/workspace/voice_generation/engine/voice_orchestrator.py
Multi-scene voice generation and versioned regeneration orchestrator.
"""

import asyncio
import logging
from typing import Any, Callable, Dict, List, Optional

from .voice_engine import voice_engine
from ..profiles.delivery_presets import resolve_voice_and_delivery
from ..providers import voice_registry
from ..schemas import (
    GenerateVoiceRequest,
    LoudnessProfile,
    SceneAudioMetadata,
    ScriptVoiceResponse,
    VoiceConfig,
    VoiceGenerationMode,
)
from ..services.audio_assembler import assemble_master_narration
from ..storage.audio_storage import audio_storage

logger = logging.getLogger("ApexMind.Voice.Orchestrator")


class VoiceOrchestrator:
    def __init__(self, max_concurrency: int = 4):
        self.max_concurrency = max_concurrency

    async def generate_script_voice(
        self,
        script_document: Dict[str, Any],
        voice_config: Optional[VoiceConfig] = None,
        loudness_profile: Optional[LoudnessProfile] = None,
        mode: VoiceGenerationMode = VoiceGenerationMode.ALL,
        selected_scene_ids: Optional[List[str]] = None,
        force_regenerate: bool = False,
        delivery_preset: Optional[str] = None,
        on_progress: Optional[Callable[[int, int, str], None]] = None,
    ) -> ScriptVoiceResponse:
        """
        Orchestrates multi-scene voice synthesis, atomic versioning, and master track assembly.
        """
        semaphore = asyncio.Semaphore(self.max_concurrency)
        cfg = voice_config or VoiceConfig()
        loudness = loudness_profile or LoudnessProfile()

        script_id = script_document.get("id") or script_document.get("scriptId", "scr_default")
        scenes = script_document.get("scenes", [])
        if not scenes:
            raise ValueError(f"Script '{script_id}' contains no scenes.")

        # Sort scenes by sceneNumber
        sorted_scenes = sorted(scenes, key=lambda s: s.get("sceneNumber", 0))
        total_scenes = len(sorted_scenes)

        # Resolve provider and delivery settings
        provider = voice_registry.get_provider(cfg.provider)
        caps = provider.capabilities if provider else None
        resolved_delivery = resolve_voice_and_delivery(
            voice_id=cfg.voiceId,
            provider_id=cfg.provider,
            preset_name=delivery_preset,
            requested_speed=cfg.speed,
            requested_pitch=cfg.pitch,
            capabilities=caps,
        )

        effective_speed = resolved_delivery["speed"]
        effective_pitch = resolved_delivery["pitch"]

        target_scene_ids = set(selected_scene_ids or []) if mode == VoiceGenerationMode.SELECTED_SCENES else None

        scene_artifacts: List[Dict[str, Any]] = []

        async def _process_single_scene(index: int, scene_data: Dict[str, Any]) -> Dict[str, Any]:
            async with semaphore:
                scene_num = scene_data.get("sceneNumber", index + 1)
                scene_id = scene_data.get("sceneId") or f"scene_{scene_num:02d}"

                # Extract narration
                raw_text = (
                    scene_data.get("narration")
                    or scene_data.get("narratorLine")
                    or scene_data.get("dialogue")
                    or scene_data.get("captionText")
                    or scene_data.get("subtitleText")
                    or ""
                ).strip()

                if not raw_text:
                    logger.warning(f"[Orchestrator] Scene {scene_num} has empty dialogue/narration; inserting pause marker.")
                    raw_text = "..."

                # Timing references from Stage 1
                sb_start = float(scene_data.get("startTime", 0.0))
                sb_dur = float(scene_data.get("duration", 3.0))
                dialogue_meta = scene_data.get("dialogueMeta") or {}
                speech_offset = float(dialogue_meta.get("startOffset", 0.0))

                # Check if this scene should be regenerated
                if target_scene_ids is not None and scene_id not in target_scene_ids:
                    # Untouched scene: load existing latest version from disk
                    s_dir = audio_storage.get_script_dir(script_id)
                    existing_files = sorted(s_dir.glob(f"{scene_id}_v*.wav"))
                    if existing_files:
                        latest_file = existing_files[-1]
                        v = int(latest_file.stem.split("_v")[-1])
                        wav_bytes = latest_file.read_bytes()
                        public_url = f"/media/voice/{script_id}/{latest_file.name}"
                        logger.info(f"[Orchestrator] Preserving untouched scene {scene_num} ({scene_id}_v{v})")
                        return {
                            "sceneNumber": scene_num,
                            "sceneId": scene_id,
                            "version": v,
                            "audioUrl": public_url,
                            "originalText": raw_text,
                            "normalizedText": raw_text,
                            "wavBytes": wav_bytes,
                            "storyboardStartTime": sb_start,
                            "storyboardDuration": sb_dur,
                            "speechStartOffset": speech_offset,
                            "wordTimestamps": [],
                        }

                cache_key = audio_storage.compute_cache_key(
                    provider_id=cfg.provider,
                    voice_id=cfg.voiceId,
                    normalized_text=raw_text,
                    speed=effective_speed,
                    pitch=effective_pitch,
                    target_lufs=loudness.targetLufs,
                )

                cached_bytes = audio_storage.get_cached_scene_audio(cache_key) if not force_regenerate else None

                wav_bytes: bytes
                normalized_text: str = raw_text
                word_timestamps: list = []

                if cached_bytes and not force_regenerate:
                    wav_bytes = cached_bytes
                    logger.info(f"[Orchestrator] Reusing cached audio for scene {scene_num} ({scene_id})")
                else:
                    # Synthesize via VoiceEngine
                    synth_res, norm_txt = await voice_engine.synthesize_scene(
                        raw_text=raw_text,
                        voice_id=cfg.voiceId,
                        provider_id=cfg.provider,
                        speed=effective_speed,
                        pitch=effective_pitch,
                        target_lufs=loudness.targetLufs,
                        true_peak_dbtp=loudness.truePeakLimitDbtp,
                    )
                    wav_bytes = synth_res.audioBytes
                    normalized_text = norm_txt
                    word_timestamps = synth_res.wordTimestamps

                # Save versioned scene audio
                _, public_url, version = audio_storage.save_scene_audio(
                    script_id=script_id,
                    scene_id=scene_id,
                    wav_bytes=wav_bytes,
                    cache_key=cache_key,
                )

                if on_progress:
                    on_progress(index + 1, total_scenes, scene_id)

                return {
                    "sceneNumber": scene_num,
                    "sceneId": scene_id,
                    "version": version,
                    "audioUrl": public_url,
                    "originalText": raw_text,
                    "normalizedText": normalized_text,
                    "wavBytes": wav_bytes,
                    "storyboardStartTime": sb_start,
                    "storyboardDuration": sb_dur,
                    "speechStartOffset": speech_offset,
                    "wordTimestamps": word_timestamps,
                }

        # Run concurrent generation tasks across all scenes
        tasks = [
            _process_single_scene(idx, scn)
            for idx, scn in enumerate(sorted_scenes)
        ]
        scene_artifacts = await asyncio.gather(*tasks)

        # Assemble Master Narration track
        logger.info(f"[Orchestrator] Assembling master narration for script '{script_id}'...")
        assembly_result = assemble_master_narration(
            scene_items=scene_artifacts,
            inter_scene_padding_ms=120,
            target_lufs=loudness.targetLufs,
            true_peak_dbtp=loudness.truePeakLimitDbtp,
            sample_rate=24000,
        )

        # Atomically save and promote master narration audio
        _, master_public_url, master_version = audio_storage.save_master_audio(
            script_id=script_id,
            wav_bytes=assembly_result.masterWavBytes,
        )

        # Formulate output metadata
        scene_metas = [
            SceneAudioMetadata(
                sceneNumber=item.sceneNumber,
                sceneId=item.sceneId,
                version=item.version,
                audioUrl=item.audioUrl,
                originalText=item.originalText,
                normalizedText=item.normalizedText,
                actualDuration=item.actualDuration,
                timelineStart=item.videoTimelineStart,
                timelineEnd=item.videoTimelineEnd,
                wordTimestamps=[
                    {"word": wt["word"], "start": wt["start"], "end": wt["end"]}
                    for wt in item.wordTimestamps
                ],
            )
            for item in assembly_result.sceneOffsets
        ]

        logger.info(
            f"[Orchestrator] Completed Stage 2 Voice Generation for '{script_id}' | "
            f"scenes={len(scene_metas)} masterDur={assembly_result.totalMasterDuration:.2f}s"
        )

        return ScriptVoiceResponse(
            success=True,
            schemaVersion="2.0",
            scriptId=script_id,
            provider=cfg.provider,
            voiceId=cfg.voiceId,
            masterAudioUrl=master_public_url,
            masterDuration=assembly_result.totalMasterDuration,
            loudnessLufs=loudness.targetLufs,
            truePeakDbtp=loudness.truePeakLimitDbtp,
            scenes=scene_metas,
            totalScenes=total_scenes,
            completedScenes=len(scene_metas),
            failedScenes=0,
        )


# Global orchestrator singleton
voice_orchestrator = VoiceOrchestrator(max_concurrency=4)

