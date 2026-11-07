"""
backend/features/workspace/voice_generation/providers/base.py
Abstract base class and contract definitions for Voice Providers.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ProviderCapabilities(BaseModel):
    supportsPitch: bool = False
    supportsSpeed: bool = True
    supportsEmotion: bool = False
    supportsWordTimestamps: bool = False
    isOffline: bool = True
    licenseCategory: str = "open"


class VoiceDescriptor(BaseModel):
    voiceId: str
    name: str
    gender: str = "neutral"
    language: str = "en-US"
    provider: str
    sampleRate: int = 24000
    capabilities: ProviderCapabilities = Field(default_factory=ProviderCapabilities)
    previewUrl: Optional[str] = None


class SynthesisResult(BaseModel):
    audioBytes: bytes
    format: str = "wav"
    sampleRate: int = 24000
    channels: int = 1
    durationSeconds: float
    wordTimestamps: List[Dict[str, Any]] = Field(default_factory=list)


class BaseVoiceProvider(ABC):
    @property
    @abstractmethod
    def provider_id(self) -> str:
        """Unique key identifying the provider (e.g. 'edge_tts', 'piper', 'pyttsx3')."""
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable provider label."""
        pass

    @property
    @abstractmethod
    def capabilities(self) -> ProviderCapabilities:
        """Capabilities of the underlying speech engine."""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Checks if provider dependencies and model assets are satisfied."""
        pass

    @abstractmethod
    def list_voices(self) -> List[VoiceDescriptor]:
        """Returns catalog of supported voices."""
        pass

    @abstractmethod
    async def synthesize(
        self,
        text: str,
        voice_id: str,
        speed: float = 1.0,
        pitch: float = 0.0,
        settings: Optional[Dict[str, Any]] = None,
    ) -> SynthesisResult:
        """Synthesizes speech audio from preprocessed text."""
        pass

