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

