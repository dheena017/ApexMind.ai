"""
backend/features/workspace/visual_production/schemas.py

Pydantic V2 contracts for Stage 3: Visual Production.
Enforces typed representations for production modes, asset provenance,
3-category Quality Gate metrics, and per-scene visual lifecycle outputs.
"""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


# ==============================================================================
# Enumerations
# ==============================================================================

class ProductionMode(str, Enum):
    """Supported production paths for scene generation."""
    MEDIA = "media"          # Path A: Stock B-roll and curated image assets (Default)
    THREE_D = "three_d"      # Path B: Headless Blender 5.2 LTS procedural 3D animation
    HYBRID = "hybrid"        # Path C: Blender 3D character/props composited over media plate
    AUTOMATIC = "automatic"  # Intelligent path selection per scene based on content complexity

    @classmethod
    def _missing_(cls, value: Any):
        if isinstance(value, str):
            val_clean = value.strip().lower()
            if val_clean in ("3d", "threed", "three-d"):
                return cls.THREE_D
            if val_clean in ("auto", "smart"):
                return cls.AUTOMATIC
            for member in cls:
                if member.value == val_clean:
                    return member
        return None


class SceneVisualStatus(str, Enum):
    """Lifecycle status of a visual scene within the preview & approval loop (Stage 3 v1.1.0)."""
    PENDING = "pending"
    ANALYZING = "analyzing"
    GENERATING = "generating"
    VALIDATING = "validating"
    NEEDS_REVIEW = "needs_review"
    PREVIEW_READY = "preview_ready"  # Backward-compatible alias for needs_review
    APPROVED = "approved"
    REJECTED = "rejected"
    FAILED = "failed"
    CANCELLED = "cancelled"
    DRAFT = "draft"  # Initial draft alias


class LicensePermissionState(str, Enum):
    """Explicit legal permission state: allowed, denied, or unknown."""
    ALLOWED = "allowed"
    DENIED = "denied"
    UNKNOWN = "unknown"


class VisualQualityTier(str, Enum):
    """Quality target tiers."""
    CINEMATIC = "cinematic"  # Target: 60 FPS / High-bitrate 1080p / Full color grading
    BROADCAST = "broadcast"  # Standard broadcast 30 FPS / 1080p
    DRAFT = "draft"          # Fast preview tier


class BlenderRenderEngine(str, Enum):
    """Supported Blender headless render engines."""
    BLENDER_EEVEE_NEXT = "BLENDER_EEVEE_NEXT"
    CYCLES = "CYCLES"


class LicenseType(str, Enum):
    """Asset copyright and license provenance classifications."""
    CC0 = "CC0"
    PEXELS = "Pexels"
    PIXABAY = "Pixabay"
    WIKIMEDIA = "Wikimedia"
    UNSPLASH = "Unsplash"
    PROPRIETARY = "Proprietary"
    PROCEDURAL = "Procedural"
    CUSTOM = "Custom"


# ==============================================================================
# Asset License & Provenance Models
# ==============================================================================

class AssetLicenseProvenance(BaseModel):
    """
    Immutable audit trail for every video, image, or 3D asset utilized.
    Verifies commercial compliance, attribution terms, and content integrity.
    """
    model_config = ConfigDict(extra="ignore")

    provider: str = Field(..., description="Asset provider (pexels, pixabay, unsplash, blender, etc.)")
    licenseType: LicenseType = Field(default=LicenseType.CC0, description="License classification")
    commercialPermission: LicensePermissionState = Field(
        default=LicensePermissionState.UNKNOWN,
        description="Explicit commercial permission state (allowed, denied, unknown)",
    )
    commercialUseAllowed: bool = Field(default=False, description="Whether commercial use is permitted")
    attributionRequired: bool = Field(default=False, description="Whether attribution is mandatory")
    attributionText: Optional[str] = Field(None, description="Formatted attribution or credit string")
    sourceUrl: Optional[str] = Field(None, description="Original asset URL or repository identifier")
    assetId: Optional[str] = Field(None, description="Unique asset ID from the source provider")
    sha256: Optional[str] = Field(None, description="SHA-256 hash of the downloaded or rendered asset file")
    verifiedAt: str = Field(..., description="ISO 8601 timestamp when compliance was validated")


# ==============================================================================
# Quality Gate Metric Models (3-Category Evaluation)
# ==============================================================================

class TechnicalQualityMetrics(BaseModel):
    """Category 1: Hard technical video specifications evaluated via FFprobe."""
    model_config = ConfigDict(extra="ignore")

    resolution: str = Field(default="1080x1920", description="Frame dimensions (width x height)")
    width: int = Field(default=1080, ge=1)
    height: int = Field(default=1920, ge=1)
    fps: float = Field(default=30.0, ge=1.0, description="Measured frames per second")
    targetDuration: float = Field(..., ge=0.0, description="Target duration aligned to spoken voice narration")
    actualDuration: float = Field(..., ge=0.0, description="Actual rendered video stream duration")
    durationDriftSeconds: float = Field(default=0.0, description="Absolute difference between target and actual")
    codec: str = Field(default="h264", description="Video compression codec")
    bitrateKbps: Optional[int] = Field(None, description="Video bitrate in kilobits per second")
    hasCorruptedFrames: bool = Field(default=False, description="Whether decode errors were detected")
    passed: bool = Field(default=True, description="Category 1 overall pass status")


class AestheticQualityMetrics(BaseModel):
    """Category 2: Visual and aesthetic benchmarks evaluated via heuristics or vision AI."""
    model_config = ConfigDict(extra="ignore")

    aspectRatioAdherence: bool = Field(default=True, description="Strict adherence to 9:16 or 16:9 framing")
    framingScore: float = Field(default=0.88, ge=0.0, le=1.0, description="Rule-of-thirds and subject framing score")
    motionDynamicsScore: float = Field(default=0.85, ge=0.0, le=1.0, description="Camera and subject movement score")
    characterContinuityScore: float = Field(default=1.0, ge=0.0, le=1.0, description="Character visual invariance score")
    visualAestheticScore: float = Field(default=0.86, ge=0.0, le=1.0, description="Color grade and visual fidelity score")
    passed: bool = Field(default=True, description="Category 2 overall pass status")


class ComplianceMetrics(BaseModel):
    """Category 3: Content safety, copyright, and platform compliance."""
    model_config = ConfigDict(extra="ignore")

    commercialLicensingPassed: bool = Field(default=True, description="Verified license for commercial release")
    watermarkDetected: bool = Field(default=False, description="Zero third-party logos or watermark overlays")
    safetyContentPassed: bool = Field(default=True, description="NSFW / prohibited content filter check")
    passed: bool = Field(default=True, description="Category 3 overall pass status")


class QualityGateResult(BaseModel):
    """Consolidated 3-category Quality Gate verification result."""
    model_config = ConfigDict(extra="ignore")

    passed: bool = Field(default=True, description="True if all three categories passed requirements")
    overallScore: float = Field(default=0.90, ge=0.0, le=1.0, description="Composite weighted quality score")
    tier: VisualQualityTier = Field(default=VisualQualityTier.CINEMATIC)
    category1Technical: TechnicalQualityMetrics
    category2Aesthetic: AestheticQualityMetrics
    category3Compliance: ComplianceMetrics
    failures: List[str] = Field(default_factory=list, description="Specific failing criteria messages")
    warnings: List[str] = Field(default_factory=list, description="Non-blocking aesthetic recommendations")


# ==============================================================================
# Scene Visual Output & Lifecycle
# ==============================================================================

class SceneVisualOutput(BaseModel):
    """Output representation of a single storyboard scene's visual asset."""
    model_config = ConfigDict(extra="ignore")

    sceneId: str = Field(..., description="Unique scene identifier from Stage 1 storyboard")
    sceneNumber: int = Field(..., ge=1, description="Sequential 1-based scene index")
    status: SceneVisualStatus = Field(default=SceneVisualStatus.PREVIEW_READY)
    modeRequested: ProductionMode = Field(default=ProductionMode.MEDIA)
    modeUsed: ProductionMode = Field(..., description="Actual resolved production path used (media, three_d, hybrid)")
    version: int = Field(default=1, ge=1, description="Monotonically increasing version counter")
    videoPath: Optional[str] = Field(None, description="Local disk path to rendered MP4")
    videoUrl: Optional[str] = Field(None, description="HTTP serving URL for video stream")
    thumbnailPath: Optional[str] = Field(None, description="Local disk path to poster thumbnail")
    thumbnailUrl: Optional[str] = Field(None, description="HTTP serving URL for poster image")
    previewUrl: Optional[str] = Field(None, description="Optimized low-bitrate preview URL for UI playback")
    duration: float = Field(..., ge=0.0, description="Effective scene duration in seconds")
    timelineStart: float = Field(..., ge=0.0, description="Cumulative start offset on video master timeline")
    timelineEnd: float = Field(..., ge=0.0, description="Cumulative end offset on video master timeline")
    provenance: Optional[AssetLicenseProvenance] = None
    quality: Optional[QualityGateResult] = None
    productionMetadata: Dict[str, Any] = Field(default_factory=dict, description="Diagnostics, Blender render times, etc.")
    errorMessage: Optional[str] = Field(None, description="Error detail if generation failed")
    updatedAt: str = Field(..., description="ISO 8601 timestamp of last state transition")


# ==============================================================================
# Request & Response Contracts
# ==============================================================================

class VisualProductionRequest(BaseModel):
    """Payload for Stage 3 batch visual production."""
    model_config = ConfigDict(extra="ignore")

    scriptId: str = Field(..., description="ID of the approved Stage 1 storyboard")
    projectMode: ProductionMode = Field(default=ProductionMode.MEDIA, description="Default production mode for project")
    scenes: Optional[List[Dict[str, Any]]] = Field(None, description="Optional scene override list")
    aspectRatio: str = Field(default="9:16", description="Target video aspect ratio ('9:16' or '16:9')")
    stylePreference: Optional[str] = Field(default="cinematic_3d_story", description="Visual styling profile")
    renderEngine: Optional[BlenderRenderEngine] = Field(default=BlenderRenderEngine.BLENDER_EEVEE_NEXT)
    autoRoute: bool = Field(default=False, description="Enable automatic scene-by-scene path optimization")


class SceneRegenerateRequest(BaseModel):
    """Payload to selectively regenerate visuals for a single scene."""
    model_config = ConfigDict(extra="ignore")

    modeOverride: Optional[ProductionMode] = Field(None, description="Change production mode for this scene")
    promptOverride: Optional[str] = Field(None, description="Custom visual prompt or search keyword override")
    stylePreference: Optional[str] = Field(None, description="Style preset override")
    aspectRatio: Optional[str] = Field(default="9:16")


class SceneApprovalRequest(BaseModel):
    """Payload to approve or reject a scene preview."""
    model_config = ConfigDict(extra="ignore")

    approved: bool = Field(..., description="True to approve scene visual, False to reject")
    rejectionReason: Optional[str] = Field(None, description="User note or reason for rejection")


class VisualProductionResponse(BaseModel):
    """Standardized Stage 3 envelope response."""
    model_config = ConfigDict(extra="ignore")

    success: bool = True
    stageId: str = "visuals"
    scriptId: str
    projectMode: ProductionMode
    scenes: List[SceneVisualOutput]
    totalScenes: int
    approvedCount: int = 0
    pendingApprovalCount: int = 0
    rejectedCount: int = 0
    overallQualityScore: float = 0.0
    masterPreviewUrl: Optional[str] = None
    generatedAt: str
    metadata: Dict[str, Any] = Field(default_factory=dict)

