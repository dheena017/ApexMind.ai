"""
backend/features/workspace/schemas.py
Pydantic schemas and DTOs for the Workspace feature (Scripting, Voiceover, Memory, Media Library).
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# ── 1. Request Models ─────────────────────────────────────────────────────────

class GenerateScriptRequest(BaseModel):
    category: Optional[str] = Field(default="Stoic Mindset & Discipline", description="Motivational theme/category")
    topic: Optional[str] = Field(default="Overcoming laziness, building daily grit", description="Topic focus")
    tone: Optional[str] = Field(default=None, description="Vocal delivery tone")
    length: Optional[str] = Field(default=None, description="Target video duration")
    model: Optional[str] = Field(default=None, description="AI Model selected by user")
    audioMood: Optional[str] = Field(default=None, description="Audio mood for the generated reel")
    backgroundStyle: Optional[str] = Field(default=None, description="Background treatment")
    textStyle: Optional[str] = Field(default=None, description="On-screen text styling")
    videoStyle: Optional[str] = Field(default=None, description="Video composition and pacing style")
    voiceName: Optional[str] = Field(default=None, description="Preferred voice profile")
    aspectRatio: Optional[str] = Field(default=None, description="Video aspect ratio")
    musicTrack: Optional[str] = Field(default=None, description="Music track style")
    captionStyle: Optional[str] = Field(default=None, description="Caption styling")
    visualTheme: Optional[str] = Field(default=None, description="Scene visual style")
    motionStyle: Optional[str] = Field(default=None, description="Camera movement and transitions")
    outputFormat: Optional[str] = Field(default=None, description="Output video format")
    creativeContext: Optional[dict] = Field(default=None, description="Full current workspace creative state for automatic agent reasoning")
    availableAssets: Optional[dict] = Field(default=None, description="Catalog of images, videos, text styles, music, and sfx from the website")

class GenerateVoiceoverRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Script text to synthesize")
    voiceName: Optional[str] = Field(default=None, description="Selected workspace voice profile identifier")
    model: Optional[str] = Field(default=None, description="TTS Audio Model")

# ── 2. Response DTOs ──────────────────────────────────────────────────────────

class HookOptionItem(BaseModel):
    id: str
    angle: str  # e.g. "Brutal Truth / Negative", "Curiosity Gap", "Direct Challenge"
    text: str
    viralityScore: int = 90
    spokenDuration: Optional[float] = 2.5

class WordTimestampItem(BaseModel):
    word: str
    start: float
    end: float
    emphasis: bool = False
    highlightColor: Optional[str] = None

class AudioDuckingProfile(BaseModel):
    active: bool = True
    voiceActiveVolume: float = 0.18
    pauseSwellVolume: float = 0.72
    attackMs: int = 150
    releaseMs: int = 300

class SfxEventItem(BaseModel):
    time: float
    sfxId: str
    label: str
    sfxUrl: Optional[str] = None

class SoundDesignData(BaseModel):
    soundtrackTrackId: Optional[str] = None
    soundtrackTitle: Optional[str] = None
    genre: Optional[str] = None
    bpm: Optional[int] = None
    audioUrl: Optional[str] = None
    ducking: Optional[AudioDuckingProfile] = None
    ambientBed: Optional[dict] = None
    sfxEvents: List[SfxEventItem] = []

class SubtitleItem(BaseModel):
    text: str
    start: float
    duration: float
    textStyleId: Optional[str] = None
    captionPresetClass: Optional[str] = None
    captionPresetColor: Optional[str] = None
    words: Optional[List[WordTimestampItem]] = None

class StoryboardSceneItem(BaseModel):
    sceneNumber: int = 1
    beat: str = "hook"
    start: float = 0.0
    duration: float = 3.0
    mediaType: str = "video"  # "video" or "image"
    mediaId: Optional[str] = None
    mediaUrl: Optional[str] = None
    mediaName: Optional[str] = None
    textStyleId: Optional[str] = None
    textStyleName: Optional[str] = None
    captionPresetClass: Optional[str] = None
    captionPresetColor: Optional[str] = None
    captionPresetFontFamily: Optional[str] = None
    transition: Optional[str] = None
    cameraMotion: Optional[str] = None
    sfx: Optional[str] = None
    sfxUrl: Optional[str] = None
    subtitleText: Optional[str] = None
    aspectRatio: Optional[str] = None
    googleSearchQuery: Optional[str] = None
    visualQuery: Optional[str] = None
    fallbackQueries: Optional[List[str]] = None
    negativeTerms: Optional[List[str]] = None
    words: Optional[List[WordTimestampItem]] = None
    speechRate: Optional[float] = 1.0
    tone: Optional[str] = None
    emotion: Optional[str] = None

class GeneratedScriptData(BaseModel):
    title: str
    hook: str
    quote: str
    cta: str
    hooks: Optional[List[HookOptionItem]] = None
    soundDesign: Optional[SoundDesignData] = None
    retentionStrategy: Optional[dict] = None
    socialSEO: Optional[dict] = None
    speechStyle: Optional[str] = None
    visualTheme: Optional[str] = None
    recommendedVoice: Optional[str] = None
    audioMood: Optional[str] = None
    backgroundStyle: Optional[str] = None
    textStyle: Optional[str] = None
    videoStyle: Optional[str] = None
    aspectRatio: Optional[str] = None
    musicTrack: Optional[str] = None
    captionStyle: Optional[str] = None
    motionStyle: Optional[str] = None
    outputFormat: Optional[str] = None
    shotPacing: Optional[str] = None
    transitionStyle: Optional[str] = None
    subtitleMotion: Optional[str] = None
    textAnimation: Optional[str] = None
    cameraMovement: Optional[str] = None
    sceneStructure: Optional[dict] = None
    tags: List[str] = []
    hashtags: List[str] = []
    subtitles: List[SubtitleItem] = []
    storyboard: List[StoryboardSceneItem] = []

class GenerateScriptResponse(BaseModel):
    success: bool
    data: GeneratedScriptData
    memoryCount: int

class VoiceoverResponse(BaseModel):
    success: bool
    voiceName: str
    mimeType: str
    audioBase64: Optional[str] = None
    audioUrl: Optional[str] = None
    duration: Optional[float] = None
    durationFormatted: Optional[str] = None
    toneModulation: Optional[dict] = None
    message: Optional[str] = None

class QuoteMemoryItem(BaseModel):
    id: str
    title: str
    hook: Optional[str] = None
    quote: str
    category: Optional[str] = None
    generated_at: str


class CreateQuoteMemoryRequest(BaseModel):
    title: str = Field(..., min_length=1, description="Title or topic of the quote")
    quote: str = Field(..., min_length=1, description="The quote body text")
    hook: Optional[str] = Field(default=None, description="Opening viral hook")
    category: Optional[str] = Field(default="Stoic Mindset & Discipline", description="Category or theme")


class CreateQuoteMemoryResponse(BaseModel):
    success: bool
    message: str
    quote: QuoteMemoryItem
    totalQuotesSaved: int


class DeleteQuoteMemoryResponse(BaseModel):
    success: bool
    deletedCount: int
    message: str


class QuoteMemoryListResponse(BaseModel):
    success: bool
    totalQuotesSaved: int
    filteredCount: int
    uniquenessScore: int = 100
    categories: Dict[str, int] = {}
    recentThemes: List[str] = []
    quotes: List[str] = []
    memoryStore: List[QuoteMemoryItem]

class MusicTrackItem(BaseModel):
    id: str
    title: str
    genre: str
    duration: str
    bpm: int
    copyrightFree: bool
    license: str
    frequencyData: List[int]

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
    speed: str

class MediaLibraryData(BaseModel):
    musicTracks: List[MusicTrackItem]
    visualBackdrops: List[VisualBackdropItem]
    voiceProfiles: List[VoiceProfileItem]

class MediaLibraryResponse(BaseModel):
    success: bool
    data: MediaLibraryData


class GenerateCaptionsRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Narration text to create timed subtitles for")
    durationSeconds: float = Field(default=5.0, ge=0.5, description="Audio track duration in seconds")
    stylePreset: str = Field(default="sub-hormozi", description="Subtitle visual styling preset")
    maxWordsPerSegment: int = Field(default=4, ge=1, le=8, description="Max words per line for 9:16 vertical viewports")


class CaptionWordItem(BaseModel):
    word: str
    start: float
    end: float


class CaptionSegmentItem(BaseModel):
    segmentIndex: int
    start: float
    end: float
    text: str
    words: List[CaptionWordItem]


class CaptionsData(BaseModel):
    durationSeconds: float
    totalWords: int
    stylePreset: str
    segments: List[CaptionSegmentItem]
    srtExport: str
    vttExport: str


class GenerateCaptionsResponse(BaseModel):
    success: bool = True
    data: CaptionsData
    metadata: Dict[str, Any] = Field(default_factory=dict)



# ══════════════════════════════════════════════════════════════════════════════
# STUDIO PIPELINE v2 — Stage 1: Script Generation
# POST /api/studio/generate-script
# ══════════════════════════════════════════════════════════════════════════════

class StudioScriptRequest(BaseModel):
    category: str = Field(default="Stoic Mindset & Discipline", description="Motivational theme/niche")
    topic: Optional[str] = Field(default=None, description="Specific topic focus")
    userPrompt: Optional[str] = Field(default=None, description="Free-text creative direction from the user")
    tone: Optional[str] = Field(default=None, description="Vocal delivery tone (raw, aggressive, calm, etc.)")
    length: Optional[str] = Field(default="30 seconds", description="Target video duration")
    model: Optional[str] = Field(default="gemini-2.5-flash", description="Gemini model to use")
    aspectRatio: Optional[str] = Field(default="9:16", description="Video aspect ratio")
    voiceName: Optional[str] = Field(default=None, description="Selected voice profile ID")
    musicTrackId: Optional[str] = Field(default=None, description="Selected music track ID from media library")
    captionStylePreset: Optional[str] = Field(default=None, description="Caption visual preset class")
    backdropId: Optional[str] = Field(default=None, description="Selected backdrop/visual theme ID")
    audioMood: Optional[str] = Field(default=None, description="Emotional audio mood")
    backgroundStyle: Optional[str] = Field(default=None, description="Background visual treatment")
    textStyle: Optional[str] = Field(default=None, description="On-screen text styling")
    videoStyle: Optional[str] = Field(default=None, description="Video composition and pacing style")
    visualTheme: Optional[str] = Field(default=None, description="Scene visual style")
    motionStyle: Optional[str] = Field(default=None, description="Camera movement and transitions")
    outputFormat: Optional[str] = Field(default=None, description="Output format hint")
    creativeContext: Optional[Dict[str, Any]] = Field(default=None, description="Full workspace creative state")
    availableAssets: Optional[Dict[str, Any]] = Field(default=None, description="Available media assets catalog")


class StudioScriptResponse(BaseModel):
    success: bool = True
    stageId: str = "script"
    data: Dict[str, Any] = Field(description="Full script + storyboard (title, hook, storyboard[], soundDesign, etc.)")
    memoryCount: int = 0
    generatedAt: str = ""


# ══════════════════════════════════════════════════════════════════════════════
# STUDIO PIPELINE v2 — Stage 2: Voice Synthesis
# POST /api/studio/synthesize-voice
# ══════════════════════════════════════════════════════════════════════════════

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
    toneModulation: Optional[dict] = None
    message: Optional[str] = None
    generatedAt: str = ""


# ══════════════════════════════════════════════════════════════════════════════
# STUDIO PIPELINE v2 — Stage 3: Media Resolution
# POST /api/studio/resolve-media
# ══════════════════════════════════════════════════════════════════════════════

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


# ══════════════════════════════════════════════════════════════════════════════
# STUDIO PIPELINE v2 — Stage 4: Caption Generation
# POST /api/studio/generate-captions
# ══════════════════════════════════════════════════════════════════════════════

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


# ══════════════════════════════════════════════════════════════════════════════
# Visual Elements & Overlays
# ══════════════════════════════════════════════════════════════════════════════

class VisualElementItem(BaseModel):
    id: str
    name: str
    category: str
    label: Optional[str] = None
    desc: Optional[str] = None
    color: Optional[str] = None
    iconName: Optional[str] = None
    symbol: Optional[str] = None
    type: str = "badge"
    tags: List[str] = []


class ElementsCatalogResponse(BaseModel):
    success: bool = True
    total: int = 0
    category: str = "all"
    categories: List[Dict[str, Any]] = []
    elements: List[VisualElementItem] = []


class RecommendedElementsRequest(BaseModel):
    category: str
    topic: Optional[str] = None
    tone: Optional[str] = None


class RecommendedElementsResponse(BaseModel):
    success: bool = True
    category: str
    recommended: List[VisualElementItem] = []


class CreateCustomBadgeRequest(BaseModel):
    text: str
    gradient: Optional[str] = None
    icon: Optional[str] = None


class CreateCustomBadgeResponse(BaseModel):
    success: bool = True
    element: VisualElementItem
