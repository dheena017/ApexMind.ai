"""
backend/features/workspace/script_ai/providers/base.py
Abstract base class and contract for AI script & storyboard generation providers.
"""

import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

logger = logging.getLogger("ApexMind.Workspace.ScriptAI.Base")


class BaseScriptProvider(ABC):
    """Abstract contract for AI script and metadata generators."""

    name: str = "base"
    display_name: str = "Base Script Provider"

    @abstractmethod
    def is_configured(self) -> bool:
        """Returns True if the AI provider credentials/keys are ready."""
        pass

    @abstractmethod
    def generate_script(
        self,
        category: str,
        topic: str,
        tone: str = "",
        length: str = "",
        model: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Generates structured script and storyboard scenes."""
        pass

    def generate_script_content(
        self,
        category: str,
        topic: str,
        tone: str = "aggressive",
        target_duration_seconds: int = 30,
        user_prompt: Optional[str] = None,
        model: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Generates viral hooks, main monologue, closing CTA, and fullScript."""
        raise NotImplementedError

    def generate_script_subtitles(
        self,
        full_script: str,
        target_duration_seconds: int = 30,
        caption_style_preset: str = "sub-hormozi",
        aspect_ratio: str = "9:16",
        model: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Slices fullScript into timed subtitle cuts."""
        raise NotImplementedError

    def generate_video_scenes(
        self,
        subtitles: list,
        visual_theme: str = "Cinematic Dark Architecture",
        motion_style: str = "slow push in",
        aspect_ratio: str = "9:16",
        user_visual_prompt: Optional[str] = None,
        model: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Generates 100% faceless stock video search queries and camera motion."""
        raise NotImplementedError

    def generate_image_scenes(
        self,
        subtitles: list,
        art_style: str = "hyperrealistic cinematic photography",
        color_palette: str = "moody dark teal and orange",
        aspect_ratio: str = "9:16",
        user_visual_prompt: Optional[str] = None,
        model: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Generates frame-by-frame AI image diffusion prompts and Ken Burns motion directions."""
        raise NotImplementedError

    def plan_sound_design(
        self,
        category: str,
        tone: str = "aggressive",
        audio_mood: str = "Dark Phonk / Intense",
        target_duration_seconds: int = 30,
        scene_timestamps: Optional[list] = None,
        model: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Plans soundtrack criteria, SFX triggers, and dynamic ducking."""
        raise NotImplementedError

    def generate_video_metadata(
        self,
        category: str,
        topic: str,
        full_script: str,
        model: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Generates viral titles, social descriptions, hashtags, and tags."""
        raise NotImplementedError

