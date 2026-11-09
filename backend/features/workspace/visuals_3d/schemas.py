"""
backend/features/workspace/visuals_3d/schemas.py
Unified Pydantic schemas and DTOs for the ApexMind 3D Visuals & CGI Studio Engine:
- Group 1: 3D Asset Discovery & Catalog (APIs 1.1 - 1.4)
- Group 2: ApexMind 3D Neural Brain Engine (APIs 2.1 - 2.3)
- Group 3: AI 3D Scene Director (APIs 3.1 - 3.2)
- Group 4: 3D Render & Building Engines (APIs 4.1 - 4.4)
- Group 5: Jobs, Streaming & Master Assembly (APIs 5.1 - 5.4)
"""

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


# ══════════════════════════════════════════════════════════════════════════════
# GROUP 1: 3D ASSET DISCOVERY & CATALOG SCHEMAS
# ══════════════════════════════════════════════════════════════════════════════

class ProviderHealthItem(BaseModel):
    name: str
    displayName: str
    type: Literal["asset", "engine"]
    status: Literal["healthy", "degraded", "offline"]
    isConfigured: bool
    requiresKey: bool = False
    latencyMs: Optional[float] = None
    description: str = ""
    attribution: Optional[str] = None


class Studio3DProvidersResponse(BaseModel):
    success: bool = True
    assetProviders: List[ProviderHealthItem] = Field(default_factory=list)
    renderEngines: List[ProviderHealthItem] = Field(default_factory=list)
    defaultAssetProvider: str = "all"
    defaultRenderEngine: str = "motion_loop"


class Visual3DItem(BaseModel):
    id: str
    title: str
    category: str = "props"
    provider: str  # "poly_haven", "pixabay_3d", "sketchfab", "roblox_creator_store", "sloyd_ai", "meshy_ai", "wikimedia_3d", "poly_pizza"
    assetUrl: str
    previewUrl: Optional[str] = None
    thumbnailUrl: Optional[str] = None
    format: str = "glb"  # "glb", "gltf", "mp4", "webm", "blend", "rbxm", "stl", "fbx", "obj"
    isVideo: bool = False
    duration: Optional[float] = None  # in seconds if video loop
    resolution: Optional[str] = "1080p"
    aspectRatio: str = "9:16"
    triangles: Optional[int] = None
    fileSizeMb: Optional[float] = None
    license: str = "CC0"
    author: Optional[str] = None
    sourceUrl: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    aestheticBadges: List[str] = Field(default_factory=list)
    isCached: bool = False
    createdAt: Optional[str] = None


class Search3DAssetsRequest(BaseModel):
    query: str = Field(default="", description="Search keywords for 3D assets")
    category: str = Field(default="all", description="'all' | 'brain' | 'characters' | 'environments' | 'loops' | 'props'")
    provider: str = Field(default="all", description="'all' | 'poly_haven' | 'pixabay_3d' | 'poly_pizza' | 'wikimedia_3d' | 'apexmind_brain'")
    aspectRatio: str = Field(default="9:16")
    page: int = Field(default=1, ge=1)
    pageSize: int = Field(default=20, ge=1, le=100)


class Search3DAssetsResponse(BaseModel):
    success: bool = True
    query: str
    category: str
    provider: str
    totalHits: int
    page: int
    pageSize: int
    items: List[Visual3DItem] = Field(default_factory=list)
    hasMore: bool = False


class Download3DAssetRequest(BaseModel):
    assetId: str
    provider: str
    assetUrl: str
    category: str = "props"
    title: Optional[str] = None
    format: str = "glb"


class Download3DAssetResponse(BaseModel):
    success: bool = True
    assetId: str
    localFilePath: str
    fileSizeBytes: int
    isCached: bool = True
    sha256: str = ""
    message: str = "Asset cached successfully"


class Local3DAssetsListResponse(BaseModel):
    success: bool = True
    totalAssets: int
    items: List[Visual3DItem] = Field(default_factory=list)


# ══════════════════════════════════════════════════════════════════════════════
# GROUP 2: APEXMIND 3D NEURAL BRAIN SCHEMAS
# ══════════════════════════════════════════════════════════════════════════════

class BrainColorway(BaseModel):
    cortexColor: str = "#1e0b36"       # Deep Cosmic Violet
    synapseColor: str = "#00f0ff"      # Electric Cyan
    pulseGlowColor: str = "#ffcc00"    # Luminescent Gold
    particleColor: str = "#a855f7"     # Radiant Purple


class BrainConfig(BaseModel):
    id: Optional[str] = "brain_default"
    name: str = "ApexMind Neural Core"
    hemisphereSpacing: float = Field(default=0.08, ge=0.0, le=0.5)
    sulciDepth: float = Field(default=0.45, ge=0.1, le=1.0)
    synapseDensity: int = Field(default=140, ge=30, le=500)
    pulseSpeedHz: float = Field(default=1.5, ge=0.2, le=5.0)
    particleCount: int = Field(default=200, ge=0, le=1000)
    colorway: BrainColorway = Field(default_factory=BrainColorway)
    shadingStyle: Literal["hologram", "clay", "nebula", "gold", "cel"] = "nebula"
    wireframeOverlay: bool = True
    exportGlb: bool = True


class BrainPresetItem(BaseModel):
    id: str
    name: str
    tagline: str
    description: str
    thumbnailUrl: str
    config: BrainConfig


class BrainPresetsResponse(BaseModel):
    success: bool = True
    presets: List[BrainPresetItem] = Field(default_factory=list)


class GenerateBrainMeshResponse(BaseModel):
    success: bool = True
    brainId: str
    glbUrl: str
    localGlbPath: str
    previewImageUrl: str
    triangles: int
    generationTimeMs: float
    message: str = "3D Neural Brain mesh generated successfully"


class BrainAudioModulationRequest(BaseModel):
    audioUrl: str
    bpm: float = 120.0
    intensityFactor: float = 1.0


class BrainAudioModulationResponse(BaseModel):
    success: bool = True
    durationSeconds: float
    keyframePulses: List[Dict[str, Any]] = Field(default_factory=list)
    averageIntensity: float
    detectedBpm: float


# ══════════════════════════════════════════════════════════════════════════════
# GROUP 3: AI 3D SCENE DIRECTOR SCHEMAS
# ══════════════════════════════════════════════════════════════════════════════

class CameraRigConfig(BaseModel):
    shotType: Literal["close_up", "low_angle_hero", "orbital_360", "vertigo_zoom", "drift", "wide_establishing"] = "low_angle_hero"
    focalLengthMm: float = 35.0
    fieldOfViewDeg: float = 60.0
    depthOfField: bool = True
    fStop: float = 2.8
    startLocation: List[float] = Field(default_factory=lambda: [0.0, -5.0, 1.5])
    endLocation: List[float] = Field(default_factory=lambda: [0.0, -3.5, 2.0])
    rotationEulerDeg: List[float] = Field(default_factory=lambda: [75.0, 0.0, 0.0])


class CameraPresetItem(BaseModel):
    id: str
    name: str
    description: str
    motionType: str
    recommendedFor: str
    rig: CameraRigConfig


class CameraPresetsResponse(BaseModel):
    success: bool = True
    presets: List[CameraPresetItem] = Field(default_factory=list)


class Compile3DSceneRequest(BaseModel):
    prompt: str = Field(..., description="Creative direction text for the 3D scene")
    category: str = "Stoic Mindset & Discipline"
    tone: Optional[str] = "cinematic"
    aspectRatio: str = "9:16"
    targetDurationSeconds: float = 3.0


class Compile3DSceneResponse(BaseModel):
    success: bool = True
    prompt: str
    sceneDescription: str
    recommendedEngine: Literal["motion_loop", "blender_hybrid", "webgl", "blender_full"] = "blender_hybrid"
    shadingStyle: str = "nebula"
    selectedAssets: Dict[str, Any] = Field(default_factory=dict)
    cameraRig: CameraRigConfig
    lightingMood: str = "dramatic_volumetric"
    colorPalette: List[str] = Field(default_factory=list)


# ══════════════════════════════════════════════════════════════════════════════
# GROUP 4: 3D RENDER & BUILDING ENGINE SCHEMAS
# ══════════════════════════════════════════════════════════════════════════════

class SubtitleBurnConfig(BaseModel):
    enabled: bool = True
    text: str = ""
    fontName: str = "Impact"
    fontSize: int = 74
    primaryColorHex: str = "#FACC15"
    outlineColorHex: str = "#000000"
    alignment: int = 2  # bottom-center


class RenderMotionLoopRequest(BaseModel):
    query: str
    durationSeconds: float = 3.0
    aspectRatio: str = "9:16"
    subtitles: Optional[SubtitleBurnConfig] = None
    audioTrackUrl: Optional[str] = None


class RenderBlenderHybridRequest(BaseModel):
    sceneId: str = "scene_01"
    characterAssetId: Optional[str] = None
    environmentAssetId: Optional[str] = None
    propAssetIds: List[str] = Field(default_factory=list)
    brainConfig: Optional[BrainConfig] = None
    cameraRig: Optional[CameraRigConfig] = None
    durationSeconds: float = 3.0
    aspectRatio: str = "9:16"
    shadingStyle: Literal["hologram", "clay", "nebula", "gold", "cel"] = "nebula"
    subtitles: Optional[SubtitleBurnConfig] = None
    audioTrackUrl: Optional[str] = None


class RenderBlenderFullRequest(BaseModel):
    sceneId: str = "scene_01"
    characterAssetId: Optional[str] = None
    environmentAssetId: Optional[str] = None
    propAssetIds: List[str] = Field(default_factory=list)
    brainConfig: Optional[BrainConfig] = None
    cameraRig: Optional[CameraRigConfig] = None
    durationSeconds: float = 3.0
    fps: int = 30
    aspectRatio: str = "9:16"
    shadingStyle: str = "nebula"


class RenderSceneResultResponse(BaseModel):
    success: bool = True
    sceneId: str
    videoUrl: str
    localVideoPath: str
    thumbnailUrl: str
    durationSeconds: float
    resolution: str = "1080x1920"
    aspectRatio: str = "9:16"
    engineUsed: str
    renderTimeSeconds: float
    fileSizeBytes: int


class RenderJobCreatedResponse(BaseModel):
    success: bool = True
    jobId: str
    sceneId: str
    engine: str
    totalFrames: int
    status: str = "queued"
    streamUrl: str


class SaveWebGLStreamResponse(BaseModel):
    success: bool = True
    clipId: str
    videoUrl: str
    durationSeconds: float
    fileSizeBytes: int


# ══════════════════════════════════════════════════════════════════════════════
# GROUP 5: JOBS, STREAMING & MASTER ASSEMBLY SCHEMAS
# ══════════════════════════════════════════════════════════════════════════════

class JobProgressEvent(BaseModel):
    jobId: str
    status: Literal["queued", "modeling", "lighting", "rendering", "stitching", "completed", "failed"]
    currentFrame: int = 0
    totalFrames: int = 0
    percentComplete: float = 0.0
    elapsedSeconds: float = 0.0
    estimatedRemainingSeconds: float = 0.0
    previewFrameUrl: Optional[str] = None
    message: str = ""


class RenderJobStatusResponse(BaseModel):
    success: bool = True
    jobId: str
    status: Literal["queued", "rendering", "stitching", "completed", "failed", "cancelled"]
    currentFrame: int
    totalFrames: int
    percentComplete: float
    outputVideoUrl: Optional[str] = None
    error: Optional[str] = None


class CancelJobResponse(BaseModel):
    success: bool = True
    jobId: str
    message: str = "Render job cancelled successfully"


class SceneAudioAssemblyConfig(BaseModel):
    narrationAudioUrl: Optional[str] = None
    soundtrackUrl: Optional[str] = None
    musicVolume: float = 0.65
    voiceVolume: float = 1.0


class Assemble3DShortRequest(BaseModel):
    title: str = "apexmind_3d_short"
    sceneVideoUrls: List[str] = Field(..., description="Ordered list of rendered 3D scene MP4 URLs")
    audioConfig: Optional[SceneAudioAssemblyConfig] = None
    aspectRatio: str = "9:16"


class Assemble3DShortResponse(BaseModel):
    success: bool = True
    title: str
    masterVideoUrl: str
    localMasterPath: str
    totalDurationSeconds: float
    totalScenes: int
    fileSizeBytes: int
    resolution: str = "1080x1920"

