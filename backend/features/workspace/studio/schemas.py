"""
backend/features/workspace/studio/schemas.py
Unified Pydantic schemas and DTOs for the ApexMind Studio Production Pipeline:
- Stage 1: Script & Storyboard Generation (/api/studio/generate-script + Small APIs 1.1-1.5)
- Stage 2: Voiceover Synthesis (/api/studio/synthesize-voice + Small APIs 2.1-2.3)
- Stage 3: Media Resolution (/api/studio/resolve-media + Small APIs 3.1-3.4)
- Stage 4: Word-Timed Caption Generation (/api/studio/generate-captions + Small APIs 4.1-4.4)
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from backend.shared.ai_models import DEFAULT_SCRIPT_MODEL


# ══════════════════════════════════════════════════════════════════════════════
# STAGE 1: SCRIPT & STORYBOARD GENERATION
# ══════════════════════════════════════════════════════════════════════════════

# ── Main Orchestrator (POST /api/studio/generate-script) ───────────────────────

class StudioScriptRequest(BaseModel):
    genre: Optional[str] = Field(default="motivation", description="Selected content genre ('motivation', 'roblox_story', 'odd_one_out')")
    genrePreset: Optional[str] = Field(default=None, description="Specific sub-preset within the genre")
    suggested3DProvider: Optional[str] = Field(default=None, description="Preferred 3D visual provider")
    category: str = Field(default="Stoic Mindset & Discipline", description="Motivational theme/niche")
    topic: Optional[str] = Field(default=None, description="Specific topic focus")
    userPrompt: Optional[str] = Field(default=None, description="Free-text creative direction from the user")
    tone: Optional[str] = Field(default=None, description="Vocal delivery tone")
    length: Optional[str] = Field(default="30 seconds", description="Target video duration")
    model: Optional[str] = Field(default=DEFAULT_SCRIPT_MODEL, description="Gemini model to use")
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
    data: Dict[str, Any] = Field(description="Full script + storyboard data structure")
    memoryCount: int = 0
    generatedAt: str = ""


# ── Small API 1.1 — Script Content (POST /api/studio/script-content) ───────────

class StudioHookOption(BaseModel):
    id: str = Field(default="hook_1")
    angle: str = Field(default="Brutal Truth")
    text: str = Field(..., description="Hook line spoken in first 2-3 seconds")
    viralityScore: int = Field(default=95, ge=0, le=100)


class StudioScriptContentRequest(BaseModel):
    genre: Optional[str] = Field(default="motivation", description="Selected content genre ('motivation', 'roblox_story', 'odd_one_out')")
    genrePreset: Optional[str] = Field(default=None, description="Specific sub-preset within the genre")
    category: str = Field(default="Stoic Mindset & Discipline")
    topic: Optional[str] = Field(default=None)
    tone: Optional[str] = Field(default="aggressive")
    targetDurationSeconds: int = Field(default=30, ge=5, le=180)
    userPrompt: Optional[str] = Field(default=None)
    model: Optional[str] = Field(default=None)


class StudioScriptContentResponse(BaseModel):
    success: bool = True
    hookOptions: List[StudioHookOption] = Field(default_factory=list)
    selectedHook: str = ""
    monologue: str = ""
    cta: str = ""
    fullScript: str = ""
    totalWords: int = 0
    generatedAt: str = ""


# ── Small API 1.2 — Script Subtitles (POST /api/studio/script-subtitles) ───────

class StudioSubtitleItem(BaseModel):
    lineIndex: int
    text: str
    startTime: float
    endTime: float
    duration: float
    highlightWords: List[str] = Field(default_factory=list)


class StudioSubtitlesRequest(BaseModel):
    fullScript: str = Field(..., description="Full spoken script text")
    targetDurationSeconds: int = Field(default=30, ge=5, le=180)
    captionStylePreset: Optional[str] = Field(default="sub-hormozi")
    aspectRatio: Optional[str] = Field(default="9:16")
    model: Optional[str] = Field(default=None)


class StudioSubtitlesResponse(BaseModel):
    success: bool = True
    totalDurationSeconds: float = 30.0
    subtitles: List[StudioSubtitleItem] = Field(default_factory=list)


# ── Small API 1.3A — Video Scenes (POST /api/studio/storyboard-scenes-video) ───

class StudioVideoSceneItem(BaseModel):
    sceneNumber: int
    startTime: float
    duration: float
    mediaType: str = "video"
    subtitleText: Optional[str] = ""
    searchQuery: str
    fallbackQueries: List[str] = Field(default_factory=list)
    negativeTerms: List[str] = Field(default_factory=list)
    cameraMotion: Optional[str] = "slow push in"
    transition: Optional[str] = "glitch"
    mediaStatus: str = "unresolved"


class StudioVideoScenesRequest(BaseModel):
    subtitles: List[Dict[str, Any]] = Field(..., description="List of timed subtitle beats")
    visualTheme: Optional[str] = Field(default="Cinematic Dark Architecture")
    motionStyle: Optional[str] = Field(default="slow push in")
    aspectRatio: Optional[str] = Field(default="9:16")
    userVisualPrompt: Optional[str] = Field(default=None)
    model: Optional[str] = Field(default=None)


class StudioVideoScenesResponse(BaseModel):
    success: bool = True
    mode: str = "video"
    scenes: List[StudioVideoSceneItem] = Field(default_factory=list)


# ── Small API 1.3B — Image Scenes (POST /api/studio/storyboard-scenes-image) ───

class StudioImageFrameItem(BaseModel):
    frameNumber: int
    startTime: float
    duration: float
    mediaType: str = "image"
    subtitleText: Optional[str] = ""
    imagePrompt: str
    negativePrompt: Optional[str] = ""
    cameraShot: Optional[str] = "medium close-up"
    lightingStyle: Optional[str] = "dramatic chiaroscuro rim light"
    kenBurnsMotion: Optional[str] = "slow pan down"
    transition: Optional[str] = "fade"
    mediaStatus: str = "unresolved"


class StudioImageScenesRequest(BaseModel):
    subtitles: List[Dict[str, Any]] = Field(..., description="List of timed subtitle beats")
    artStyle: Optional[str] = Field(default="hyperrealistic cinematic photography")
    colorPalette: Optional[str] = Field(default="moody dark teal and orange")
    aspectRatio: Optional[str] = Field(default="9:16")
    userVisualPrompt: Optional[str] = Field(default=None)
    model: Optional[str] = Field(default=None)


class StudioImageScenesResponse(BaseModel):
    success: bool = True
    mode: str = "image"
    frames: List[StudioImageFrameItem] = Field(default_factory=list)


# ── Small API 1.4 — Sound Design (POST /api/studio/sound-design) ───────────────

class StudioSoundtrackCriteria(BaseModel):
    genre: str = Field(default="Drift Phonk")
    bpm: int = Field(default=132)
    energyLevel: str = Field(default="high")
    moodDescription: str = Field(default="")
    searchKeywords: List[str] = Field(default_factory=list)


class StudioSfxEvent(BaseModel):
    timeOffset: float
    type: str
    label: str
    volume: float = 0.85
    reason: Optional[str] = None


class StudioAudioDucking(BaseModel):
    active: bool = True
    voiceActiveVolume: float = 0.18
    pauseSwellVolume: float = 0.72
    attackMs: int = 140
    releaseMs: int = 280
    profile: Optional[str] = "aggressive-sidechain"


class StudioSoundDesignRequest(BaseModel):
    category: str = Field(default="Stoic Mindset & Discipline")
    tone: Optional[str] = Field(default="aggressive")
    audioMood: Optional[str] = Field(default="Dark Phonk / Intense")
    targetDurationSeconds: int = Field(default=30)
    sceneTimestamps: Optional[List[float]] = Field(default=None)
    model: Optional[str] = Field(default=None)


class StudioSoundDesignResponse(BaseModel):
    success: bool = True
    soundtrack: StudioSoundtrackCriteria
    sfxEvents: List[StudioSfxEvent] = Field(default_factory=list)
    ducking: StudioAudioDucking


# ── Small API 1.5 — Video Metadata (POST /api/studio/video-metadata) ───────────

class TitleIdeaItem(BaseModel):
    title: str
    angle: str = ""
    viralityScore: int = 90


class CategorizedHashtags(BaseModel):
    trending: List[str] = Field(default_factory=list)
    niche: List[str] = Field(default_factory=list)
    growth: List[str] = Field(default_factory=list)
    ai: List[str] = Field(default_factory=list)


class StudioMetadataRequest(BaseModel):
    category: str = Field(default="Stoic Mindset & Discipline", description="Content category or theme")
    topic: Optional[str] = Field(default=None, description="Topic or focus keywords")
    fullScript: Optional[str] = Field(default=None, description="Full spoken script text")
    title: Optional[str] = Field(default=None, description="Current or draft title")
    hook: Optional[str] = Field(default=None, description="Opening viral hook")
    quote: Optional[str] = Field(default=None, description="Core message or quote")
    cta: Optional[str] = Field(default=None, description="Call to action")
    model: Optional[str] = Field(default=None, description="Gemini model override")


class StudioMetadataResponse(BaseModel):
    success: bool = True
    titles: List[TitleIdeaItem] = Field(default_factory=list, description="Categorized title suggestions with virality score and angle")
    titleList: List[str] = Field(default_factory=list, description="Flat list of title strings for quick selection")
    description: str = Field(default="", description="High-converting YouTube video description with AI disclosure")
    hashtags: CategorizedHashtags = Field(default_factory=CategorizedHashtags, description="Categorized hashtag buckets")
    allHashtags: List[str] = Field(default_factory=list, description="Combined unique hashtag list")
    tags: List[str] = Field(default_factory=list, description="SEO tags and keywords")
    categoryNiche: Optional[str] = Field(default=None, description="Niche classification")


# ══════════════════════════════════════════════════════════════════════════════
# STAGE 2: VOICE SYNTHESIS
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
    fullScript: Optional[str] = Field(
        default=None,
        description="Direct full script text from Stage 1",
    )
    subtitles: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Subtitle cuts from Stage 1 for timeline synchronization",
    )
    scenes: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Visual scenes from Stage 1 for timeline synchronization",
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
    alignedSubtitles: Optional[List[Dict[str, Any]]] = None
    alignedScenes: Optional[List[Dict[str, Any]]] = None
    toneModulation: Optional[dict] = None
    message: Optional[str] = None
    generatedAt: str = ""


# ── Stage 2 Small API Schemas ──────────────────────────────────────────────────

class StudioVoiceTTSRequest(BaseModel):
    voiceName: str = Field(..., description="Voice profile name (e.g. 'Fenrir', 'Nova')")
    text: str = Field(..., description="Full spoken narration speech")
    speechStyle: Optional[str] = Field(default=None, description="Delivery style hint")
    targetDurationSeconds: Optional[float] = Field(default=None, description="Target duration hint")
    model: Optional[str] = Field(default=None, description="Gemini TTS model override")


class StudioVoiceTTSResponse(BaseModel):
    success: bool = True
    voiceName: str
    audioUrl: str = ""
    audioBase64: Optional[str] = None
    rawDurationSeconds: float = 0.0
    sampleRate: int = 24000
    channels: int = 1
    mimeType: str = "audio/wav"


class StudioVoiceTimestampsRequest(BaseModel):
    text: str = Field(..., description="Narration speech text")
    durationSeconds: Optional[float] = Field(default=None, description="Total speech duration in seconds")
    audioUrl: Optional[str] = Field(default=None, description="Audio file URL if available")


class StudioVoiceTimestampsResponse(BaseModel):
    success: bool = True
    totalWords: int
    wordTimestamps: List[StudioWordTimestamp] = Field(default_factory=list)


class StudioVoiceAlignRequest(BaseModel):
    subtitles: Optional[List[Dict[str, Any]]] = Field(default=None)
    scenes: Optional[List[Dict[str, Any]]] = Field(default=None)
    wordTimestamps: List[Dict[str, Any]] = Field(...)
    actualDurationSeconds: float = Field(..., gt=0.0)


class StudioVoiceAlignResponse(BaseModel):
    success: bool = True
    totalDurationSeconds: float
    alignedSubtitles: List[Dict[str, Any]] = Field(default_factory=list)
    alignedScenes: List[Dict[str, Any]] = Field(default_factory=list)


# ══════════════════════════════════════════════════════════════════════════════
# STAGE 3: MEDIA RESOLUTION
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
    scenes: List[StudioResolvedScene] = Field(default_factory=list)
    sfxEvents: List[StudioResolvedSfx] = Field(default_factory=list)
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


# ── Stage 3 Small API Schemas ──────────────────────────────────────────────────

class StudioMediaResolveVideoRequest(BaseModel):
    queries: List[Dict[str, Any]] = Field(..., description="List of scene query dicts with searchQuery and optional negativeTerms")
    aspectRatio: str = Field(default="9:16")


class StudioMediaResolveVideoResponse(BaseModel):
    success: bool = True
    results: List[StudioResolvedScene] = Field(default_factory=list)


class StudioMediaResolveImageRequest(BaseModel):
    queries: List[Dict[str, Any]] = Field(..., description="List of frame query dicts with imagePrompt/visualQuery")
    aspectRatio: str = Field(default="9:16")


class StudioMediaResolveImageResponse(BaseModel):
    success: bool = True
    results: List[StudioResolvedScene] = Field(default_factory=list)


class StudioMediaResolveSfxRequest(BaseModel):
    sfxEvents: List[StudioSfxEventInput] = Field(default_factory=list)


class StudioMediaResolveSfxResponse(BaseModel):
    success: bool = True
    resolvedEvents: List[StudioResolvedSfx] = Field(default_factory=list)


class StudioMediaResolveMusicRequest(BaseModel):
    genre: str = Field(default="Drift Phonk")
    bpm: int = Field(default=132)
    mood: str = Field(default="dark aggressive motivational")


class StudioMediaResolveMusicResponse(BaseModel):
    success: bool = True
    track: Optional[Dict[str, Any]] = None


# ══════════════════════════════════════════════════════════════════════════════
# STAGE 4: CAPTIONS GENERATION
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
    words: List[StudioCaptionWord] = Field(default_factory=list)
    captionPresetClass: str = "sub-hormozi"
    captionPresetColor: str = "#FACC15"


class StudioTimelineClip(BaseModel):
    """Ready-to-use clip shape for StudioTimelinePane LocalClips[]."""
    text: str
    start: float
    duration: float
    captionPresetClass: str = "sub-hormozi"
    captionPresetColor: str = "#FACC15"
    words: List[StudioCaptionWord] = Field(default_factory=list)


class StudioCaptionsData(BaseModel):
    durationSeconds: float
    totalWords: int
    stylePreset: str
    captionColor: str
    captionFontFamily: str
    segments: List[StudioCaptionSegment] = Field(default_factory=list)
    timelineClips: List[StudioTimelineClip] = Field(default_factory=list)
    srtExport: str = ""
    vttExport: str = ""


class StudioCaptionsResponse(BaseModel):
    success: bool = True
    stageId: str = "captions"
    data: StudioCaptionsData
    generatedAt: str = ""


# ── Stage 4 Small API Schemas ──────────────────────────────────────────────────

class StudioCaptionsChunkingRequest(BaseModel):
    wordTimestamps: List[Dict[str, Any]] = Field(..., description="List of word timestamps [{word, start, end, emphasis}]")
    maxWordsPerChunk: int = Field(default=4, ge=1, le=8)


class StudioCaptionsChunkingResponse(BaseModel):
    success: bool = True
    chunks: List[Dict[str, Any]] = Field(default_factory=list)


class StudioCaptionsHighlightingRequest(BaseModel):
    chunks: List[Dict[str, Any]] = Field(..., description="Word chunks from chunking step")
    stylePreset: str = Field(default="sub-hormozi")
    highlightColor: str = Field(default="#FACC15")


class StudioCaptionsHighlightingResponse(BaseModel):
    success: bool = True
    styledSegments: List[Dict[str, Any]] = Field(default_factory=list)


class StudioCaptionsExportSrtRequest(BaseModel):
    segments: List[Dict[str, Any]] = Field(..., description="List of timed caption segments")


class StudioCaptionsExportSrtResponse(BaseModel):
    success: bool = True
    format: str = "srt"
    content: str = ""


class StudioCaptionsExportVttRequest(BaseModel):
    segments: List[Dict[str, Any]] = Field(..., description="List of timed caption segments")


class StudioCaptionsExportVttResponse(BaseModel):
    success: bool = True
    format: str = "vtt"
    content: str = ""
