"""
backend/features/workspace/voice_generation/schemas.py
Pydantic contracts for Stage 2: Voice Generation (ApexMind.ai v1.1.0).
"""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class VoiceGenerationMode(str, Enum):
    ALL = "all"
    SELECTED_SCENES = "selected_scenes"


class VoiceConfig(BaseModel):
    provider: str = Field(default="edge_tts", description="TTS provider: 'piper', 'edge_tts', 'pyttsx3', 'gemini'")
    voiceId: str = Field(default="en-US-ChristopherNeural", description="Engine voice identifier")
    speed: float = Field(default=1.0, ge=0.5, le=2.0, description="Playback speed multiplier")
    pitch: float = Field(default=0.0, ge=-20.0, le=20.0, description="Pitch adjustment in semitones / Hz")
    language: str = Field(default="en-US", description="Language tag")


class LoudnessProfile(BaseModel):
    name: str = Field(default="social_short", description="Profile name: 'social_short' or 'broadcast'")
    targetLufs: float = Field(default=-16.0, description="Target integrated loudness in LUFS (-16.0 for streaming, -23.0 for EBU R128)")
    truePeakLimitDbtp: float = Field(default=-1.0, description="Maximum ceiling in decibels True Peak (dBTP)")


class GenerateVoiceRequest(BaseModel):
    scriptId: str = Field(..., description="ID of the approved Stage 1 script")
    projectId: Optional[str] = Field(default=None, description="Project ID scope")
    mode: VoiceGenerationMode = Field(default=VoiceGenerationMode.ALL, description="'all' or 'selected_scenes'")
    sceneIds: Optional[List[str]] = Field(default=None, description="Specific scene IDs to generate when mode is 'selected_scenes'")
    forceRegenerate: bool = Field(default=False, description="Whether to bypass audio cache and re-synthesize")
    voiceConfig: VoiceConfig = Field(default_factory=VoiceConfig)
    loudnessProfile: LoudnessProfile = Field(default_factory=LoudnessProfile)
    asyncExecution: bool = Field(default=False, description="Whether to run asynchronously via durable worker jobs")


class WordTimestamp(BaseModel):
    word: str
    start: float
    end: float


class SceneAudioMetadata(BaseModel):
    sceneNumber: int
    sceneId: str
    version: int = 1
    audioUrl: str
    originalText: str
    normalizedText: str
    actualDuration: float
    timelineStart: float
    timelineEnd: float
    wordTimestamps: List[WordTimestamp] = Field(default_factory=list)


class ScriptVoiceResponse(BaseModel):
    success: bool = True
    schemaVersion: str = "2.0"
    scriptId: str
    provider: str
    voiceId: str
    masterAudioUrl: str
    masterDuration: float
    loudnessLufs: float
    truePeakDbtp: float
    scenes: List[SceneAudioMetadata] = Field(default_factory=list)
    totalScenes: int = 0
    completedScenes: int = 0
    failedScenes: int = 0


class VoiceCapabilitySchema(BaseModel):
    supportsPitch: bool = False
    supportsSpeed: bool = True
    supportsEmotion: bool = False
    supportsWordTimestamps: bool = False
    isOffline: bool = True


class VoiceInfoSchema(BaseModel):
    voiceId: str
    name: str
    gender: str = "neutral"
    language: str = "en-US"
    capabilities: VoiceCapabilitySchema = Field(default_factory=VoiceCapabilitySchema)
    previewUrl: Optional[str] = None


class ProviderVoicesResponse(BaseModel):
    providerId: str
    name: str
    isOffline: bool
    voices: List[VoiceInfoSchema]


class ListVoicesResponse(BaseModel):
    success: bool = True
    defaultProvider: str = "edge_tts"
    providers: List[ProviderVoicesResponse] = Field(default_factory=list)

