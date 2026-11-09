"""
backend/features/workspace/studio/schemas.py
Pydantic schemas and DTOs for the ApexMind Studio Production Pipeline:
- Stage 2: Voiceover Synthesis (/api/studio/synthesize-voice)
- Stage 3: Media Resolution (/api/studio/resolve-media)
- Stage 4: Word-Timed Caption Generation (/api/studio/generate-captions)
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ── STAGE 2: VOICE SYNTHESIS ───────────────────────────────────────────────────

class StudioVoiceSceneItem(BaseModel):
    sceneNumber: int
    subtitleText: str
    start: float = 0.0
    duration: float = 3.0


class StudioVoiceRequest(BaseModel):
    voiceName: str = Field(..., description="Voice profile ID (e.g. 'Fenrir', 'Nova')")
    model: Optional[str] = Field(default=None, description="Gemini TTS model")
    storyboard: Optional[List[StudioVoiceSceneItem]] = Field(
        default=None,
        description="Storyboard scenes — narration assembled from subtitleText in scene order",
    )
    fullNarrationText: Optional[str] = Field(
        default=None,
        description="Direct full narration text (used when storyboard is not provided)",
    )
    speechStyle: Optional[str] = Field(default=None, description="Delivery style hint")
    targetDurationSeconds: Optional[float] = Field(default=None, description="Target audio duration hint")


class StudioWordTimestamp(BaseModel):
    word: str
    start: float
    end: float
    emphasis: bool = False
    highlightColor: Optional[str] = None


class StudioVoiceResponse(BaseModel):
    success: bool = True
    stageId: str = "voice"
    voiceName: str
    mimeType: str = "audio/wav"
    audioUrl: str = ""
    audioBase64: Optional[str] = None
    durationSeconds: float = 0.0
    sampleRate: int = 24000
    channels: int = 1
    wordTimestamps: List[StudioWordTimestamp] = []
    alignedStoryboard: Optional[List[Dict[str, Any]]] = None
    toneModulation: Optional[dict] = None
    message: Optional[str] = None
    generatedAt: str = ""


# ── STAGE 3: MEDIA RESOLUTION ──────────────────────────────────────────────────

class StudioSceneInput(BaseModel):
    sceneNumber: int = Field(..., description="1-indexed scene number")
    mediaType: str = Field(default="video", description="'video' | 'image'")
    visualQuery: str = Field(..., description="Primary semantic search query")
    googleSearchQuery: Optional[str] = Field(default=None)
    fallbackQueries: List[str] = Field(default_factory=list)
    negativeTerms: List[str] = Field(default_factory=list)
    preferredProvider: str = Field(default="all")
    durationSeconds: float = Field(default=3.0)


class StudioSfxEventInput(BaseModel):
    time: float = 0.0
    sfxId: str = ""
    label: str = ""
    searchQuery: Optional[str] = None


class StudioMediaRequest(BaseModel):
    scenes: List[StudioSceneInput] = Field(..., description="All storyboard scenes to resolve media for")
    aspectRatio: str = Field(default="9:16")
    sfxEvents: Optional[List[StudioSfxEventInput]] = Field(default=None)
    backdropId: Optional[str] = Field(default=None)
    resolveBackground: bool = Field(default=True)
    resolveImages: bool = Field(default=False)


class StudioResolvedMedia(BaseModel):
    id: Optional[str] = None
    url: str
    previewUrl: Optional[str] = None
    thumbnailUrl: Optional[str] = None
    title: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    duration: Optional[float] = None
    provider: Optional[str] = None
    license: Optional[str] = "CC0"


class StudioResolvedScene(BaseModel):
    sceneNumber: int
    status: str  # "resolved" | "unresolved"
    mediaType: str = "video"
    provider: Optional[str] = None
    media: Optional[StudioResolvedMedia] = None
    message: Optional[str] = None


class StudioResolvedSfx(BaseModel):
    time: float
    sfxId: str
    label: str
    status: str
    sfxUrl: Optional[str] = None
    durationSeconds: Optional[float] = None
    provider: Optional[str] = None


class StudioBackgroundInfo(BaseModel):
    backdropId: Optional[str] = None
    status: str = "none"
    backgroundUrl: Optional[str] = None
    particleEffect: Optional[str] = None
    previewColor: Optional[str] = None


class StudioMediaData(BaseModel):
    scenes: List[StudioResolvedScene] = []
    sfxEvents: List[StudioResolvedSfx] = []
    background: StudioBackgroundInfo = Field(default_factory=StudioBackgroundInfo)
    resolvedCount: int = 0
    failedCount: int = 0
    totalScenes: int = 0


class StudioMediaResponse(BaseModel):
    success: bool = True
    stageId: str = "media"
    data: StudioMediaData
    metadata: Dict[str, Any] = Field(default_factory=dict)
    generatedAt: str = ""


# ── STAGE 4: CAPTIONS GENERATION ───────────────────────────────────────────────

class StudioCaptionSceneInput(BaseModel):
    sceneNumber: int
    subtitleText: str
    start: float = 0.0
    duration: float = 3.0
    captionPresetClass: Optional[str] = None
    captionPresetColor: Optional[str] = None
    words: Optional[List[Dict[str, Any]]] = None


class StudioCaptionsRequest(BaseModel):
    storyboardScenes: Optional[List[StudioCaptionSceneInput]] = Field(default=None)
    fullNarrationText: Optional[str] = Field(default=None)
    durationSeconds: float = Field(default=10.0, ge=0.5)
    stylePreset: str = Field(default="sub-hormozi")
    maxWordsPerSegment: int = Field(default=4, ge=1, le=8)
    aspectRatio: str = Field(default="9:16")
    captionColor: str = Field(default="#FACC15")
    captionFontFamily: str = Field(default="Impact, sans-serif")


class StudioCaptionWord(BaseModel):
    word: str
    start: float
    end: float
    emphasis: bool = False


class StudioCaptionSegment(BaseModel):
    segmentIndex: int
    sceneNumber: Optional[int] = None
    start: float
    end: float
    duration: float
    text: str
    words: List[StudioCaptionWord] = []
    captionPresetClass: str = "sub-hormozi"
    captionPresetColor: str = "#FACC15"


class StudioTimelineClip(BaseModel):
    """Ready-to-use clip shape for StudioTimelinePane LocalClips[]."""
    text: str
    start: float
    duration: float
    captionPresetClass: str = "sub-hormozi"
    captionPresetColor: str = "#FACC15"
    words: List[StudioCaptionWord] = []


class StudioCaptionsData(BaseModel):
    durationSeconds: float
    totalWords: int
    stylePreset: str
    captionColor: str
    captionFontFamily: str
    segments: List[StudioCaptionSegment] = []
    timelineClips: List[StudioTimelineClip] = []
    srtExport: str = ""
    vttExport: str = ""


class StudioCaptionsResponse(BaseModel):
    success: bool = True
    stageId: str = "captions"
    data: StudioCaptionsData
    generatedAt: str = ""

