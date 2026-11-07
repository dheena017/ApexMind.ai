"""
backend/features/workspace/schemas.py
Pydantic schemas and DTOs for the Workspace feature (Scripting, Voiceover, Memory, Media Library).
"""

from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field
from backend.shared.ai_models import DEFAULT_SCRIPT_MODEL

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
    description: Optional[str] = None
    titleIdeas: Optional[List[Dict[str, Any]]] = None
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
    speed: Optional[str] = "1.0x"

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
# SCRIPT GENERATION v2.1.2 — 3D Cinematic & Animation Contract Schemas
# ══════════════════════════════════════════════════════════════════════════════

class Vector3D(BaseModel):
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0

class Transform3D(BaseModel):
    position: Vector3D = Field(default_factory=Vector3D)
    rotation: Vector3D = Field(default_factory=Vector3D, description="Euler degrees (pitch, roll, yaw)")
    scale: Vector3D = Field(default_factory=lambda: Vector3D(x=1.0, y=1.0, z=1.0))

class CameraLens(BaseModel):
    focalLengthMm: int = 35
    depthOfField: bool = True
    fStop: float = 2.8
    focusDistanceMeters: Optional[float] = 3.5
    sensorWidthMm: float = 36.0

class CameraPathKeyframe(BaseModel):
    timestamp: float = Field(default=0.0, description="Seconds relative to global video timeline")
    position: Vector3D = Field(default_factory=Vector3D)
    rotation: Vector3D = Field(default_factory=Vector3D)
    fovDegrees: float = 54.43
    tension: float = 0.0
    continuity: float = 0.0
    bias: float = 0.0

class SceneCamera(BaseModel):
    shot: str = "wide"
    angle: str = "low_angle"
    movement: str = "slow_dolly_in"
    lens: CameraLens = Field(default_factory=CameraLens)
    focusTarget: Optional[str] = None
    trackingMode: str = "look_at"
    duration: float = 5.0
    splinePath: List[CameraPathKeyframe] = Field(default_factory=list)
    startTransform: Transform3D = Field(default_factory=Transform3D)
    endTransform: Transform3D = Field(default_factory=Transform3D)

class SceneLighting(BaseModel):
    style: str = "warm_cinematic"
    intensity: str = "soft"
    keyLightAngle: str = "side_45_deg"
    colorTemperature: int = 4500

class SceneTransition(BaseModel):
    inTransition: str = "cut"
    outTransition: str = "cut"
    duration: float = 0.5

class SceneEnvironment(BaseModel):
    assetId: str = "default_environment"
    name: str = "Suburban Street"
    timeOfDay: str = "morning"
    weather: str = "clear"
    ambientLighting: str = "warm_sunlight"
    layoutMapId: Optional[str] = None

class PropInScene(BaseModel):
    propId: str = ""
    name: str = ""
    placement: str = "ground"
    state: str = "idle"

class CharacterLocomotion(BaseModel):
    type: str = "walk"
    speedMps: float = 1.2
    pathType: str = "spline"

class AnimationKeyframe(BaseModel):
    timestamp: float = 0.0
    poseName: str = "idle"
    rootTransform: Optional[Transform3D] = None
    blendWeight: float = 1.0

class CharacterAnimationClip(BaseModel):
    clipId: str = "idle"
    startTime: float = 0.0
    endTime: float = 4.0
    loop: bool = False
    blendInDuration: float = 0.3
    blendOutDuration: float = 0.3
    keyframes: List[AnimationKeyframe] = Field(default_factory=list)

class VisemeKeyframe(BaseModel):
    timestamp: float = 0.0
    viseme: str = "aa"
    weight: float = Field(default=1.0, ge=0.0, le=1.0)

class FacialKeyframe(BaseModel):
    timestamp: float = 0.0
    expression: str = "curious"
    intensity: float = Field(default=0.8, ge=0.0, le=1.0)

class CharacterInScene(BaseModel):
    characterId: str = ""
    role: str = "primary"
    action: str = ""
    locomotion: CharacterLocomotion = Field(default_factory=CharacterLocomotion)
    animation: CharacterAnimationClip = Field(default_factory=CharacterAnimationClip)
    facialAnimation: List[FacialKeyframe] = Field(default_factory=list)
    lipSyncVisemes: List[VisemeKeyframe] = Field(default_factory=list)
    startTransform: Transform3D = Field(default_factory=Transform3D)
    endTransform: Transform3D = Field(default_factory=Transform3D)

class WordTimestamp(BaseModel):
    word: str = ""
    start: float = 0.0
    end: float = 0.0
    confidence: float = 1.0

class SceneDialogue(BaseModel):
    speakerId: str = "narrator"
    voiceName: str = "Puck"
    text: str = ""
    startOffset: float = 0.2
    words: List[WordTimestamp] = Field(default_factory=list)

class SceneAmbient(BaseModel):
    trackId: str = "ambient_default"
    volumeDb: float = -18.0
    fadeInDuration: float = 0.5
    fadeOutDuration: float = 0.5

class SceneSFX(BaseModel):
    cueId: str = "sfx_cue"
    timestamp: float = 0.0
    volumeDb: float = -12.0
    pan: float = 0.0

class SceneAudio(BaseModel):
    sampleRate: int = 24000
    dialogue: Optional[SceneDialogue] = None
    ambient: SceneAmbient = Field(default_factory=SceneAmbient)
    sfx: List[SceneSFX] = Field(default_factory=list)
    musicMood: str = "orchestral_wonder"

class SceneItem(BaseModel):
    sceneId: str = ""
    sceneNumber: int = 1
    startTime: float = 0.0
    endTime: float = 5.0
    duration: float = 5.0
    narration: str = ""
    visualDescription: str = ""
    action: str = ""
    characters: List[CharacterInScene] = Field(default_factory=list)
    environment: SceneEnvironment = Field(default_factory=SceneEnvironment)
    props: List[PropInScene] = Field(default_factory=list)
    camera: SceneCamera = Field(default_factory=SceneCamera)
    lighting: SceneLighting = Field(default_factory=SceneLighting)
    audio: SceneAudio = Field(default_factory=SceneAudio)
    transitions: SceneTransition = Field(default_factory=SceneTransition)
    continuityNotes: str = ""
    beat: str = "body"
    mediaType: str = "video"
    mediaStatus: str = "unresolved"
    videoPrompt: str = ""
    subtitleText: str = ""

class ScriptAssetCharacter(BaseModel):
    id: str = ""
    assetType: str = "character"
    name: str = ""
    appearance: Dict[str, Any] = Field(default_factory=dict)
    accessories: List[Dict[str, Any]] = Field(default_factory=list)
    identityRules: Dict[str, Any] = Field(default_factory=dict)
    usage: Dict[str, Any] = Field(default_factory=dict)

class ScriptAssetEnvironment(BaseModel):
    id: str = ""
    assetType: str = "environment"
    name: str = ""
    layoutMapId: Optional[str] = None
    fixedLandmarks: List[str] = Field(default_factory=list)
    timeOfDay: str = "morning"
    weather: str = "clear"
    lightingDefaults: Dict[str, Any] = Field(default_factory=dict)
    usage: Dict[str, Any] = Field(default_factory=dict)

class ScriptAssetProp(BaseModel):
    id: str = ""
    assetType: str = "prop"
    name: str = ""
    description: str = ""
    scale: str = "medium"
    firstAppearsInScene: int = 1
    reuseAcrossScenes: bool = True

class AssetManifest(BaseModel):
    characters: List[ScriptAssetCharacter] = Field(default_factory=list)
    environments: List[ScriptAssetEnvironment] = Field(default_factory=list)
    props: List[ScriptAssetProp] = Field(default_factory=list)

class AssetBinding(BaseModel):
    assetType: Literal[
        "character", "animal", "environment", "house",
        "prop", "material", "texture", "animation", "camera"
    ] = "character"
    storyAssetId: str = ""
    catalogAssetId: str = ""
    category: Literal[
        "characters", "animals", "environments", "houses",
        "props", "materials", "textures", "animations", "cameras"
    ] = "characters"
    status: Literal[
        "resolved", "needs_modeling", "needs_generation", "unresolved", "incompatible"
    ] = "unresolved"
    modelFilePath: Optional[str] = None
    sha256: Optional[str] = None
    blenderVersion: Optional[str] = "4.2.0"
    rigType: Optional[str] = None
    activeMaterials: Dict[str, str] = Field(default_factory=dict)
    activeAccessories: List[str] = Field(default_factory=list)
    isGenericBackground: bool = False
    classification: Literal["hero", "secondary", "background_generic"] = "hero"
    notes: Optional[str] = None
    # Backward compatibility
    storyCharacterId: Optional[str] = None

    def model_post_init(self, __context: Any) -> None:
        if not self.storyCharacterId and self.storyAssetId:
            self.storyCharacterId = self.storyAssetId
        elif not self.storyAssetId and self.storyCharacterId:
            self.storyAssetId = self.storyCharacterId

CharacterAssetBinding = AssetBinding

class ScriptDocument(BaseModel):
    id: str = ""
    version: int = 1
    title: str = ""
    description: Optional[str] = None
    targetAudience: Optional[str] = None
    totalDuration: float = 30.0
    aspectRatio: str = "9:16"
    scenes: List[SceneItem] = Field(default_factory=list)
    hook: Optional[str] = None
    hooks: Optional[List[Dict[str, Any]]] = None
    quote: Optional[str] = None
    cta: Optional[str] = None
    soundDesign: Optional[Dict[str, Any]] = None

class ScriptGenerationMetadata(BaseModel):
    modelUsed: str = ""
    promptVersion: str = "v2.1.2"
    totalInputTokens: int = 0
    totalOutputTokens: int = 0
    generationLatencyMs: int = 0
    tags: List[str] = Field(default_factory=list)
    hashtags: List[str] = Field(default_factory=list)
    createdAt: str = ""

class PromptAdherenceCheck(BaseModel):
    criterion: str
    passed: bool
    severity: Literal["info", "warning", "error"] = "info"
    details: str = ""

class ValidationSummary(BaseModel):
    isValid: bool = True
    targetDuration: float = 30.0
    actualDuration: float = 30.0
    durationDeltaPercent: float = 0.0
    sceneCount: int = 0
    repairedIssues: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    adherenceChecks: List[PromptAdherenceCheck] = Field(default_factory=list)
    adherenceScorePercent: float = 100.0

class ScriptGenerationResponse(BaseModel):
    success: bool = True
    generationId: str = ""
    generationProfile: Literal["motivational_reel", "cinematic_3d_story"] = "motivational_reel"
    script: ScriptDocument = Field(default_factory=ScriptDocument)
    assetManifest: AssetManifest = Field(default_factory=AssetManifest)
    assetBindings: List[AssetBinding] = Field(default_factory=list)
    metadata: ScriptGenerationMetadata = Field(default_factory=ScriptGenerationMetadata)
    validation: ValidationSummary = Field(default_factory=ValidationSummary)

class ScriptJobResponse(BaseModel):
    success: bool = True
    jobId: str
    status: Literal["queued", "in_progress", "completed", "failed", "cancelled"] = "queued"
    phase: str = "QUEUED"
    progressPercent: int = 0
    createdAt: str = ""
    pollUrl: str = ""
    cancelUrl: str = ""

class JobStatusResponse(BaseModel):
    jobId: str
    jobType: Optional[str] = "script"
    status: Literal["queued", "in_progress", "processing", "completed", "partially_completed", "failed", "cancelled"] = "queued"
    phase: str = "QUEUED"
    progressPercent: int = 0
    completedScenes: Optional[int] = 0
    totalScenes: Optional[int] = 0
    message: Optional[str] = None
    elapsedSeconds: float = 0.0
    error: Optional[str] = None
    result: Optional[Any] = None


# ══════════════════════════════════════════════════════════════════════════════
# STUDIO PIPELINE v2 — Stage 1: Script Generation
# POST /api/studio/generate-script
# ══════════════════════════════════════════════════════════════════════════════

class StudioScriptRequest(BaseModel):
    category: str = Field(default="Stoic Mindset & Discipline", description="Motivational theme/niche")
    topic: Optional[str] = Field(default=None, description="Specific topic focus")
    userPrompt: Optional[str] = Field(default=None, description="Free-text creative direction from the user")
    generationProfile: Literal["motivational_reel", "cinematic_3d_story"] = Field(default="motivational_reel", description="Generation profile: motivational_reel or cinematic_3d_story")
    tone: Optional[str] = Field(default=None, description="Vocal delivery tone (raw, aggressive, calm, etc.)")
    length: Optional[str] = Field(default="30 seconds", description="Target video duration")
    model: Optional[str] = Field(default=DEFAULT_SCRIPT_MODEL, description="Gemini model to use")
    aspectRatio: Optional[str] = Field(default="9:16", description="Video aspect ratio")
    voiceName: Optional[str] = Field(default=None, description="Selected voice profile ID")
    visualStyle: Optional[str] = Field(default="dark_cinematic", description="Visual aesthetic preset")
    subtitleStyle: Optional[str] = Field(default="hormozi", description="Subtitle animation preset")
    musicMood: Optional[str] = Field(default="orchestral", description="Audio music mood")
    projectId: Optional[str] = Field(default=None, description="Associated project ID")
    userId: Optional[str] = Field(default=None, description="Requesting user ID")
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
    generationId: Optional[str] = None
    generationProfile: Optional[str] = "motivational_reel"
    script: Optional[ScriptDocument] = None
    assetManifest: Optional[AssetManifest] = None
    assetBindings: Optional[List[CharacterAssetBinding]] = None
    metadata: Optional[ScriptGenerationMetadata] = None
    validation: Optional[ValidationSummary] = None


# ══════════════════════════════════════════════════════════════════════════════
# STUDIO PIPELINE v2 — Stage 2: Voice Generation
# POST /api/studio/generate-voice (legacy alias: /api/studio/synthesize-voice)
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


class GenerateMetadataRequest(BaseModel):
    category: Optional[str] = None
    topic: Optional[str] = None
    title: Optional[str] = None
    hook: Optional[str] = None
    quote: Optional[str] = None
    cta: Optional[str] = None
    model: Optional[str] = None


class TitleIdeaItem(BaseModel):
    title: str
    angle: str
    viralityScore: int


class CategorizedHashtags(BaseModel):
    trending: List[str] = []
    niche: List[str] = []
    growth: List[str] = []
    ai: List[str] = []


class GenerateMetadataResponse(BaseModel):
    success: bool = True
    titles: List[TitleIdeaItem] = []
    description: str = ""
    hashtags: CategorizedHashtags = CategorizedHashtags()
    allHashtags: List[str] = []
