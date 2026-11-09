"""
backend/features/workspace/schemas.py
Unified, cleanly structured Pydantic DTOs for the Workspace module:
- Section 1: Presets & Media Library Schemas
- Section 2: Studio Pipeline Schemas (Stages 1, 2, 3, 4 imported from .studio.schemas - Single Source of Truth)
- Section 3: Visual Elements & Overlays Schemas
- Section 4: Content Tools & SEO Metadata Schemas
- Section 5: Legacy Voiceover DTOs (Backward Compatibility)
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 1: PRESETS & MEDIA LIBRARY SCHEMAS
# ══════════════════════════════════════════════════════════════════════════════

class MusicTrackItem(BaseModel):
    id: str
    title: str
    genre: str
    duration: str
    bpm: int
    copyrightFree: bool
    license: str
    frequencyData: List[int] = Field(default_factory=list)


class VisualBackdropItem(BaseModel):
    id: str
    name: str
    category: str
    aspectRatio: str
    previewColor: str
    textColor: str
    particleEffect: str


class VoiceProfileItem(BaseModel):
    id: str
    name: str
    gender: str
    style: str
    speed: Optional[str] = "1.0x"


class MediaLibraryData(BaseModel):
    musicTracks: List[MusicTrackItem] = Field(default_factory=list)
    visualBackdrops: List[VisualBackdropItem] = Field(default_factory=list)
    voiceProfiles: List[VoiceProfileItem] = Field(default_factory=list)


class MediaLibraryResponse(BaseModel):
    success: bool = True
    data: MediaLibraryData


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 2: STUDIO PIPELINE SCHEMAS (Stages 1, 2, 3, 4 - Single Source of Truth)
# ══════════════════════════════════════════════════════════════════════════════

from .studio.schemas import (
    # Stage 1: Script & Storyboard
    StudioHookOption,
    StudioImageFrameItem,
    StudioImageScenesRequest,
    StudioImageScenesResponse,
    StudioMetadataRequest,
    StudioMetadataResponse,
    TitleIdeaItem,
    CategorizedHashtags,
    StudioScriptContentRequest,
    StudioScriptContentResponse,
    StudioScriptRequest,
    StudioScriptResponse,
    StudioSoundDesignRequest,
    StudioSoundDesignResponse,
    StudioSoundtrackCriteria,
    StudioSfxEvent,
    StudioAudioDucking,
    StudioSubtitleItem,
    StudioSubtitlesRequest,
    StudioSubtitlesResponse,
    StudioVideoSceneItem,
    StudioVideoScenesRequest,
    StudioVideoScenesResponse,
    # Stage 2: Voice Synthesis
    StudioVoiceAlignRequest,
    StudioVoiceAlignResponse,
    StudioVoiceRequest,
    StudioVoiceResponse,
    StudioVoiceSceneItem,
    StudioVoiceTimestampsRequest,
    StudioVoiceTimestampsResponse,
    StudioVoiceTTSRequest,
    StudioVoiceTTSResponse,
    StudioWordTimestamp,
    # Stage 3: Media Resolution
    StudioBackgroundInfo,
    StudioMediaData,
    StudioMediaRequest,
    StudioMediaResolveImageRequest,
    StudioMediaResolveImageResponse,
    StudioMediaResolveMusicRequest,
    StudioMediaResolveMusicResponse,
    StudioMediaResolveSfxRequest,
    StudioMediaResolveSfxResponse,
    StudioMediaResolveVideoRequest,
    StudioMediaResolveVideoResponse,
    StudioMediaResponse,
    StudioResolvedMedia,
    StudioResolvedScene,
    StudioResolvedSfx,
    StudioSceneInput,
    StudioSfxEventInput,
    # Stage 4: Captions Generation
    StudioCaptionSceneInput,
    StudioCaptionSegment,
    StudioCaptionsChunkingRequest,
    StudioCaptionsChunkingResponse,
    StudioCaptionsData,
    StudioCaptionsExportSrtRequest,
    StudioCaptionsExportSrtResponse,
    StudioCaptionsExportVttRequest,
    StudioCaptionsExportVttResponse,
    StudioCaptionsHighlightingRequest,
    StudioCaptionsHighlightingResponse,
    StudioCaptionsRequest,
    StudioCaptionsResponse,
    StudioCaptionWord,
    StudioTimelineClip,
)


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 3: VISUAL ELEMENTS & OVERLAYS SCHEMAS
# ══════════════════════════════════════════════════════════════════════════════

class VisualElementItem(BaseModel):
    id: str
    name: str
    category: str
    provider: Optional[str] = "studio"
    previewUrl: Optional[str] = None
    svgUrl: Optional[str] = None
    label: Optional[str] = None
    desc: Optional[str] = None
    color: Optional[str] = None
    iconName: Optional[str] = None
    symbol: Optional[str] = None
    type: str = "badge"
    tags: List[str] = Field(default_factory=list)
    aspectRatio: Optional[str] = "1:1"


class ElementsCatalogResponse(BaseModel):
    success: bool = True
    error: Optional[str] = None
    page: int = 1
    pageSize: int = 24
    total: int = 0
    provider: str = "all"
    category: str = "all"
    categories: List[Dict[str, Any]] = Field(default_factory=list)
    providers: Dict[str, bool] = Field(default_factory=dict)
    elements: List[VisualElementItem] = Field(default_factory=list)


class RecommendedElementsRequest(BaseModel):
    category: str
    topic: Optional[str] = None
    tone: Optional[str] = None


class RecommendedElementsResponse(BaseModel):
    success: bool = True
    category: str
    recommended: List[VisualElementItem] = Field(default_factory=list)


class CreateCustomBadgeRequest(BaseModel):
    text: str
    gradient: Optional[str] = None
    icon: Optional[str] = None


class CreateCustomBadgeResponse(BaseModel):
    success: bool = True
    element: VisualElementItem


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 4: CONTENT TOOLS & SEO METADATA SCHEMAS (Aliases to Small API 1.5)
# ══════════════════════════════════════════════════════════════════════════════

GenerateMetadataRequest = StudioMetadataRequest
GenerateMetadataResponse = StudioMetadataResponse


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 5: LEGACY VOICEOVER DTOs (Backward Compatibility)
# ══════════════════════════════════════════════════════════════════════════════

class GenerateVoiceoverRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Script text to synthesize")
    voiceName: Optional[str] = Field(default=None, description="Selected workspace voice profile identifier")
    model: Optional[str] = Field(default=None, description="TTS Audio Model")


class VoiceoverResponse(BaseModel):
    success: bool = True
    voiceName: str
    mimeType: str = "audio/wav"
    audioBase64: Optional[str] = None
    audioUrl: Optional[str] = None
    duration: Optional[float] = None
    durationFormatted: Optional[str] = None
    toneModulation: Optional[dict] = None
    message: Optional[str] = None
