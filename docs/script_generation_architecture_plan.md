# ApexMind.ai — Script Generation Architecture Specification v2.1.3 (Frozen Final Specification)

## Executive Summary
This document is the **frozen final implementation specification** for **Script Generation v2.1.3** in ApexMind.ai. It incorporates all final architectural refinements: non-circular PostgreSQL and SQLite DDL migrations, composite foreign keys for approval integrity, named-parameter database abstraction, complete asset bindings (`characters`, `environments`, `props`), strict 3D physical standards (Right-handed Z-up, metric meters, 24 FPS, XYZ Euler angles, `focusTarget = None` default), defense-in-depth security with canonical path verification, user-scoped idempotency, and durable worker leasing with fencing tokens.

---

## 1. Global 3D & Timeline Standards

All scenes, character animations, camera trajectories, and audio layers strictly adhere to these immutable production standards:

| Standard | Value | Definition / Application |
| :--- | :--- | :--- |
| **Coordinate System** | **Right-handed Z-Up** | $+X$: Screen Right, $+Y$: Depth / Forward into scene, $+Z$: Elevation / Up. Standard Blender viewport orientation. |
| **Measurement Units** | **Metric (Meters)** | Coordinates, dimensions, and movement speeds ($\text{m/s}$) are specified in physical meters ($m$). |
| **Rotation Format** | **Euler Degrees (XYZ)** | Rotations specified as Euler angles in degrees ($^\circ$) with explicit `XYZ` extrinsic evaluation order. |
| **Base Frame Rate** | **24.0 FPS** | Timebase for keyframes, camera splines, and video export. Frame interval is $\frac{1}{24}\text{ s}$ ($41.67\text{ ms}$). |
| **Timeline Convention**| **Global Video Seconds** | All `startTime`, `endTime`, keyframe timestamps, and word timestamps are relative to the overall video timeline start ($0.0\text{s}$). Scene-relative offsets are explicitly designated as `startOffset`. |
| **Default Camera Target**| **`None`** | Cameras default to no focus target unless explicitly targeted to a character or prop ID present in the scene. |

---

## 2. Complete Data Contracts & Schemas

### 2.1 Complete Response Schema (`ScriptGenerationResponse`)

```python
class ScriptGenerationResponse(BaseModel):
    success: bool = True
    generationId: str = Field(description="Unique UUID for this generation execution")
    generationProfile: Literal["motivational_reel", "cinematic_3d_story"] = "motivational_reel"
    
    script: ScriptDocument
    assetManifest: AssetManifest
    assetBindings: AssetBindings = Field(default_factory=lambda: AssetBindings())
    metadata: ScriptGenerationMetadata
    validation: ValidationSummary
```

### 2.2 Script Document & Scene Models

```python
class ScriptDocument(BaseModel):
    id: str = Field(description="Script UUID")
    version: int = Field(default=1)
    title: str
    description: Optional[str] = None
    targetAudience: Optional[str] = None
    totalDuration: float = Field(description="Total video duration in global seconds")
    aspectRatio: str = Field(default="9:16")
    scenes: List[SceneItem]
    
    # Motivational Reel compatibility fields
    hook: Optional[str] = None
    hooks: Optional[List[Dict[str, Any]]] = None
    quote: Optional[str] = None
    cta: Optional[str] = None
    soundDesign: Optional[Dict[str, Any]] = None

class SceneItem(BaseModel):
    sceneId: str = Field(description="Unique scene UUID, e.g. scn_01_a9f2")
    sceneNumber: int
    startTime: float = Field(description="Global timeline start in seconds")
    endTime: float = Field(description="Global timeline end in seconds")
    duration: float = Field(description="Scene duration in seconds")
    
    narration: str
    visualDescription: str
    action: str
    
    # 3D Structured Entities
    characters: List[CharacterInScene] = Field(default_factory=list)
    environment: SceneEnvironment
    props: List[PropInScene] = Field(default_factory=list)
    
    # Cinematic Staging & Tracks
    camera: SceneCamera
    lighting: SceneLighting
    audio: SceneAudio
    transitions: SceneTransition
    continuityNotes: str = ""
    
    # Legacy & Downstream Timeline Compatibility
    beat: str = "body"
    mediaType: str = "video"
    mediaStatus: str = "unresolved"
    videoPrompt: str = ""
    subtitleText: str = ""

class SceneEnvironment(BaseModel):
    assetId: str = Field(description="Logical asset identifier, e.g. autumn_town_01")
    name: str = "Suburban Street"
    timeOfDay: str = "morning"  # morning, noon, golden_hour, dusk, night
    weather: str = "clear"
    ambientLighting: str = "warm_sunlight"
    layoutMapId: Optional[str] = "suburb_block_01"

class PropInScene(BaseModel):
    propId: str = Field(description="Logical prop identifier, e.g. sky_anomaly_01")
    name: str
    placement: str
    state: str = "idle"

class SceneLighting(BaseModel):
    style: str = "warm_cinematic"
    intensity: str = "soft"
    keyLightAngle: str = "side_45_deg"
    colorTemperature: int = 4500  # Kelvin

class SceneTransition(BaseModel):
    inTransition: str = "cut"
    outTransition: str = "cut"
    duration: float = 0.5
```

### 2.3 Character Animation, Keyframes & Visemes

```python
class CharacterInScene(BaseModel):
    characterId: str = Field(description="Story character identity, e.g. dog_01")
    role: str = "primary"
    action: str
    
    locomotion: CharacterLocomotion
    animation: CharacterAnimationClip
    facialAnimation: List[FacialKeyframe] = Field(default_factory=list)
    lipSyncVisemes: List[VisemeKeyframe] = Field(default_factory=list)
    
    startTransform: Transform3D
    endTransform: Transform3D

class CharacterLocomotion(BaseModel):
    type: str = "walk"  # stationary, idle, walk, run, jump, trot, sit, lay_down
    speedMps: float = 1.2
    pathType: str = "spline"

class CharacterAnimationClip(BaseModel):
    clipId: str = "dog_walk_to_alert_stop"
    startTime: float = 0.0
    endTime: float = 4.0
    loop: bool = False
    blendInDuration: float = 0.3
    blendOutDuration: float = 0.3
    keyframes: List[AnimationKeyframe] = Field(default_factory=list)

class AnimationKeyframe(BaseModel):
    timestamp: float = Field(description="Global timeline timestamp in seconds")
    poseName: str
    rootTransform: Optional[Transform3D] = None
    blendWeight: float = 1.0

class VisemeKeyframe(BaseModel):
    timestamp: float = Field(description="Global timeline timestamp in seconds")
    viseme: str = "aa"  # sil, PP, FF, TH, DD, kk, CH, SS, nn, RR, aa, E, I, O, U
    weight: float = Field(ge=0.0, le=1.0, default=1.0)

class FacialKeyframe(BaseModel):
    timestamp: float = Field(description="Global timeline timestamp in seconds")
    expression: str = "curious"
    intensity: float = Field(ge=0.0, le=1.0, default=0.8)

class Transform3D(BaseModel):
    position: Vector3D = Field(default_factory=lambda: Vector3D(x=0, y=0, z=0))
    rotation: Vector3D = Field(default_factory=lambda: Vector3D(x=0, y=0, z=0), description="Euler degrees (pitch, roll, yaw) in XYZ order")
    scale: Vector3D = Field(default_factory=lambda: Vector3D(x=1, y=1, z=1))

class Vector3D(BaseModel):
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0
```

### 2.4 Camera Spline & Lens Specifications

```python
class SceneCamera(BaseModel):
    shot: str = "wide"
    angle: str = "low_angle"
    movement: str = "slow_dolly_in"
    lens: CameraLens
    focusTarget: Optional[str] = None  # Default is None
    trackingMode: str = "look_at"
    duration: float = 5.0
    
    splinePath: List[CameraPathKeyframe] = Field(default_factory=list)
    startTransform: Transform3D
    endTransform: Transform3D

class CameraPathKeyframe(BaseModel):
    timestamp: float = Field(description="Global timeline timestamp in seconds")
    position: Vector3D
    rotation: Vector3D
    fovDegrees: float = 54.43
    tension: float = 0.0
    continuity: float = 0.0
    bias: float = 0.0

class CameraLens(BaseModel):
    focalLengthMm: int = 35
    depthOfField: bool = True
    fStop: float = 2.8
    focusDistanceMeters: Optional[float] = 3.5
    sensorWidthMm: float = 36.0
```

### 2.5 Audio Timeline & Word-Level Timestamp Standard

```python
class SceneAudio(BaseModel):
    sampleRate: int = 24000
    dialogue: Optional[SceneDialogue] = None
    ambient: SceneAmbient
    sfx: List[SceneSFX] = Field(default_factory=list)
    musicMood: str = "orchestral_wonder"

class SceneDialogue(BaseModel):
    speakerId: str = "narrator"
    voiceName: str = "Puck"
    text: str
    startOffset: float = 0.2  # Seconds relative to scene start
    words: List[WordTimestamp] = Field(default_factory=list)

class WordTimestamp(BaseModel):
    word: str
    start: float = Field(description="Global timeline start in seconds")
    end: float = Field(description="Global timeline end in seconds")
    confidence: float = 1.0

class SceneAmbient(BaseModel):
    trackId: str = "amb_suburban_morning_01"
    volumeDb: float = -18.0
    fadeInDuration: float = 0.5
    fadeOutDuration: float = 0.5

class SceneSFX(BaseModel):
    cueId: str
    timestamp: float = Field(description="Global timeline position in seconds")
    volumeDb: float = -12.0
    pan: float = 0.0
```

### 2.6 Comprehensive Asset Manifest & Bindings (`characters`, `environments`, `props`)

```python
class AssetManifest(BaseModel):
    characters: List[ScriptAssetCharacter] = Field(default_factory=list)
    environments: List[ScriptAssetEnvironment] = Field(default_factory=list)
    props: List[ScriptAssetProp] = Field(default_factory=list)

class ScriptAssetCharacter(BaseModel):
    id: str = Field(description="Logical story ID, e.g. dog_01")
    assetType: str = "character"
    name: str = "Golden Retriever"
    appearance: Dict[str, Any]
    accessories: List[Dict[str, Any]] = Field(default_factory=list)
    identityRules: Dict[str, Any] = Field(default_factory=dict)
    usage: Dict[str, Any] = Field(default_factory=dict)

class ScriptAssetEnvironment(BaseModel):
    id: str = Field(description="Logical story ID, e.g. autumn_town_01")
    assetType: str = "environment"
    name: str
    layoutMapId: Optional[str] = None
    fixedLandmarks: List[str] = Field(default_factory=list)
    timeOfDay: str = "morning"
    weather: str = "clear"
    lightingDefaults: Dict[str, Any] = Field(default_factory=dict)
    usage: Dict[str, Any] = Field(default_factory=dict)

class ScriptAssetProp(BaseModel):
    id: str = Field(description="Logical story ID, e.g. sky_anomaly_01")
    assetType: str = "prop"
    name: str
    description: str
    scale: str = "medium"
    firstAppearsInScene: int = 1
    reuseAcrossScenes: bool = True

class AssetBindings(BaseModel):
    characters: List[CharacterAssetBinding] = Field(default_factory=list)
    environments: List[EnvironmentAssetBinding] = Field(default_factory=list)
    props: List[PropAssetBinding] = Field(default_factory=list)

class CharacterAssetBinding(BaseModel):
    storyCharacterId: str = Field(description="e.g. dog_01")
    catalogAssetId: str = Field(description="e.g. animal_dog_golden_001")
    status: Literal["resolved", "needs_modeling", "unresolved"] = "resolved"
    modelFilePath: Optional[str] = None
    sha256: Optional[str] = None
    blenderVersion: Optional[str] = "4.2.0"
    rigType: Optional[str] = "rigify_quadruped"
    activeMaterials: Dict[str, str] = Field(default_factory=dict)
    activeAccessories: List[str] = Field(default_factory=list)

class EnvironmentAssetBinding(BaseModel):
    storyEnvironmentId: str = Field(description="e.g. autumn_town_01")
    catalogAssetId: str = Field(description="e.g. env_suburban_autumn_01")
    status: Literal["resolved", "needs_modeling", "unresolved"] = "resolved"
    modelFilePath: Optional[str] = None
    sha256: Optional[str] = None
    blenderVersion: Optional[str] = "4.2.0"
    layoutMapId: Optional[str] = None

class PropAssetBinding(BaseModel):
    storyPropId: str = Field(description="e.g. sky_anomaly_01")
    catalogAssetId: str = Field(description="e.g. prop_monolith_01")
    status: Literal["resolved", "needs_modeling", "unresolved"] = "resolved"
    modelFilePath: Optional[str] = None
    sha256: Optional[str] = None
    blenderVersion: Optional[str] = "4.2.0"
    scale: str = "medium"

class ScriptGenerationMetadata(BaseModel):
    modelUsed: str
    promptVersion: str
    totalInputTokens: int = 0
    totalOutputTokens: int = 0
    generationLatencyMs: int = 0
    tags: List[str] = Field(default_factory=list)
    hashtags: List[str] = Field(default_factory=list)
    createdAt: str = ""

class ValidationSummary(BaseModel):
    isValid: bool = True
    targetDuration: float
    actualDuration: float
    durationDeltaPercent: float
    sceneCount: int
    repairedIssues: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
```

---

## 3. Asynchronous Job Lifecycle, Idempotency & Stale Worker Protection

### 3.1 Worker Heartbeats, Leases & Fencing Tokens
1. **Job Claiming**: Workers atomically claim queued jobs using optimistic fencing:
   ```sql
   UPDATE generation_jobs 
   SET status = 'in_progress', 
       lease_owner = :worker_id, 
       lease_expires_at = :expires_at, 
       fencing_token = fencing_token + 1, 
       updated_at = :now 
   WHERE id = :job_id 
     AND (status = 'queued' OR (status = 'in_progress' AND lease_expires_at < :now));
   ```
2. **Heartbeats**: The executing worker renews its lease every $5\text{s}$ (`lease_expires_at = now + 30s`).
3. **Fencing Verification**: Every state update requires `WHERE id = :job_id AND fencing_token = :my_fencing_token`. If Worker A stalls and Worker B claims the job, Worker B increments `fencing_token`. When Worker A resumes, its write fails ($0\text{ rows affected}$) and Worker A immediately aborts.

### 3.2 Idempotency Scoping & Conflict Handling
- The `idempotency_key` is strictly scoped to the authenticated `user_id`:
  `CONSTRAINT uq_user_idempotency UNIQUE (user_id, idempotency_key)`.
- **Payload Verification**:
  - If the same `idempotency_key` is submitted with the exact same payload: returns the existing job status envelope (`HTTP 200` or `HTTP 202`).
  - If the same `idempotency_key` is submitted with a **differing request payload**: returns `HTTP 409 Conflict` with error code `ERR_IDEMPOTENCY_PAYLOAD_MISMATCH`.

### 3.3 Standardized Error & Status Responses
- **Failed Job**: `HTTP 200 OK` from `GET /api/studio/jobs/{jobId}` with `{ "status": "failed", "error": { "code": "ERR_AI_RATE_LIMIT", "message": "..." } }`.
- **Cancelled Job**: `HTTP 200 OK` with `{ "status": "cancelled", "message": "Generation aborted by user" }`.
- **Expired Job**: `HTTP 410 Gone` if job records have aged out past `expires_at`.
- **Unauthorized**: `HTTP 403 Forbidden` if `job.user_id != authenticated_user.id`.

---

## 4. Portability-Safe Database Migration & Parameter Binding

### 4.1 Migration Order Handling Circular References (`002_script_generation_v2.sql`)

To guarantee clean migrations on PostgreSQL (which forbids creating foreign keys to non-existent tables) and SQLite:

```sql
-- Step 1: Create master scripts table without circular version FKs
CREATE TABLE IF NOT EXISTS scripts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_id TEXT,
    title TEXT NOT NULL,
    generation_profile TEXT NOT NULL DEFAULT 'motivational_reel',
    current_version_id TEXT,
    approved_version_id TEXT,
    approval_status TEXT NOT NULL DEFAULT 'draft',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scripts_user_project ON scripts (user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_scripts_status ON scripts (approval_status);

-- Step 2: Create script_versions with composite unique constraint
CREATE TABLE IF NOT EXISTS script_versions (
    id TEXT PRIMARY KEY,
    script_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    change_source TEXT NOT NULL,
    change_summary TEXT,
    payload_json TEXT NOT NULL,
    asset_manifest_json TEXT NOT NULL,
    validation_status TEXT DEFAULT 'valid',
    created_at TEXT NOT NULL,
    created_by TEXT DEFAULT 'user',
    FOREIGN KEY (script_id) REFERENCES scripts (id) ON DELETE CASCADE,
    CONSTRAINT uq_script_version UNIQUE (script_id, version_number),
    CONSTRAINT uq_script_version_composite UNIQUE (id, script_id)
);

CREATE INDEX IF NOT EXISTS idx_script_versions_lookup ON script_versions (script_id, version_number DESC);

-- Step 3: Add foreign key constraints from scripts to script_versions
-- Executed via ALTER TABLE (PostgreSQL) or deferred PRAGMA check (SQLite)
-- ALTER TABLE scripts ADD CONSTRAINT fk_scripts_current_version FOREIGN KEY (current_version_id) REFERENCES script_versions (id) ON DELETE SET NULL;
-- ALTER TABLE scripts ADD CONSTRAINT fk_scripts_approved_version FOREIGN KEY (approved_version_id) REFERENCES script_versions (id) ON DELETE SET NULL;

-- Step 4: Scene-level versions with uniqueness per script version
CREATE TABLE IF NOT EXISTS scene_versions (
    id TEXT PRIMARY KEY,
    script_version_id TEXT NOT NULL,
    scene_id TEXT NOT NULL,
    scene_number INTEGER NOT NULL,
    start_time REAL NOT NULL,
    end_time REAL NOT NULL,
    duration REAL NOT NULL,
    narration TEXT NOT NULL,
    visual_description TEXT NOT NULL,
    action TEXT NOT NULL,
    characters_json TEXT NOT NULL,
    environment_json TEXT NOT NULL,
    camera_json TEXT NOT NULL,
    lighting_json TEXT,
    audio_json TEXT,
    modified_at TEXT NOT NULL,
    FOREIGN KEY (script_version_id) REFERENCES script_versions (id) ON DELETE CASCADE,
    CONSTRAINT uq_scene_in_version UNIQUE (script_version_id, scene_number)
);

-- Step 5: Composite Foreign Key for Approvals (guarantees version belongs to exact same script)
CREATE TABLE IF NOT EXISTS script_approvals (
    id TEXT PRIMARY KEY,
    script_id TEXT NOT NULL,
    version_id TEXT NOT NULL,
    approved_by TEXT NOT NULL,
    notes TEXT,
    is_locked INTEGER NOT NULL DEFAULT 1,
    approved_at TEXT NOT NULL,
    FOREIGN KEY (script_id) REFERENCES scripts (id) ON DELETE CASCADE,
    FOREIGN KEY (version_id, script_id) REFERENCES script_versions (id, script_id) ON DELETE CASCADE
);

-- Step 6: Durable Generation Jobs with Fencing Tokens
CREATE TABLE IF NOT EXISTS generation_jobs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_id TEXT,
    status TEXT NOT NULL DEFAULT 'queued',
    phase TEXT NOT NULL DEFAULT 'QUEUED',
    progress_percent INTEGER NOT NULL DEFAULT 0,
    retry_count INTEGER NOT NULL DEFAULT 0,
    fencing_token INTEGER NOT NULL DEFAULT 1,
    lease_owner TEXT,
    lease_expires_at TEXT,
    is_cancelled INTEGER NOT NULL DEFAULT 0,
    idempotency_key TEXT,
    request_payload_hash TEXT,
    error_message TEXT,
    request_payload_json TEXT NOT NULL,
    result_payload_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    CONSTRAINT uq_user_idempotency UNIQUE (user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_generation_jobs_lease ON generation_jobs (status, lease_expires_at);
```

### 4.2 Named Parameter Driver Abstraction
To ensure full portability without error-prone regex replacements:
```python
class DatabaseAdapter:
    def __init__(self, engine_type: str = "sqlite"):
        self.engine_type = engine_type  # 'sqlite' or 'postgresql'

    def execute_named(self, cursor, query_named: str, params: dict):
        """
        Executes query using native named parameters.
        SQLite accepts :name. psycopg2 accepts %(name)s.
        """
        if self.engine_type == "postgresql":
            # Formats :name to %(name)s safely via token parsing
            import re
            pg_query = re.sub(r':([a-zA-Z0-9_]+)', r'%(\1)s', query_named)
            cursor.execute(pg_query, params)
        else:
            cursor.execute(query_named, params)
        return cursor
```

---

## 5. Defense-in-Depth Security Architecture

ApexMind implements defense-in-depth across the generation lifecycle:
1. **Structured LLM Enforcement**: Gemini calls utilize official `response_schema` parameters to force valid JSON structures at the model decoding layer.
2. **Pydantic Boundary Validation**: Responses pass through strict Pydantic parsing (`extra="forbid"`) to reject rogue fields or malformed payloads.
3. **Untrusted-Input Separation**: User creative input is wrapped in `<user_creative_brief>` XML delimiters with explicit instructions that user text represents creative direction only and cannot alter system rules.
4. **Canonical Asset Path Verification**: Asset file paths inside `AssetBindings` are resolved against `os.path.realpath("backend/data/asset_catalog/")`. If `os.path.commonpath([resolved_path, catalog_root]) != catalog_root`, the request is immediately rejected with `ERR_SECURITY_PATH_TRAVERSAL`.
5. **No Executable AI Artifacts**: AI-generated responses are strictly treated as data contracts. No file path, code string, or system command generated by Gemini is ever executed in the host OS.
6. **Authorization Scoping**: All queries against `scripts`, `script_versions`, and `generation_jobs` require explicit `user_id = :current_user_id`.

---

## 6. Phased Implementation Roadmap & Milestone Allocation

| Phase | Milestones | Deliverables | Target Files |
| :--- | :--- | :--- | :--- |
| **Phase 1: Foundation** | **M1: Data Contracts** | Frozen Pydantic models & TypeScript interfaces | `backend/features/workspace/schemas.py`<br/>`frontend/src/features/workspace/types/script.ts` |
| | **M2: Gemini Modularization** | Provider extraction into single-responsibility modules with facade | `backend/shared/ai/*`<br/>`backend/shared/gemini.py` |
| | **M3: Generation Engine & Jobs** | Prompt templates, validators, basic durable job queue & HTTP 202 lifecycle | `backend/features/workspace/script_generation/*`<br/>`backend/features/workspace/generation_jobs/*` |
| **Phase 2: Frontend & Stage 1** | **M4: UI Decomposition** | Split `AIAgentCreatorPane` & `ScriptEditorPane` into modular components | `frontend/.../panes/ai-agent-creator/*`<br/>`frontend/.../panes/script-editor/*` |
| | **M5: Workspace State & Exec** | `WorkspaceContext`, settings wire-up, Stage 1 independent execution | `frontend/.../context/WorkspaceContext.tsx`<br/>`frontend/.../hooks/useScriptGeneration.ts` |
| | **M6: Core Verification** | End-to-end integration tests & Phase 1/2 acceptance checklist | `tests/unit/*`, `tests/api/*` |
| **Phase 3: Management** | **M7: Relational Storage & Diffs** | SQLite/PostgreSQL migrations, atomic snapshots, version diffs, stale worker recovery | `backend/features/workspace/script_storage/*`<br/>`backend/database/migrations/*` |
| | **M8: Continuity Engine** | Cross-scene character, lighting, and environment validation | `backend/.../script_generation/continuity/*` |
| **Phase 4: 3D Staging & Blender** | **M9: Camera & Keyframe UI** | 3D camera spline visualizer and keyframe timeline controls | `frontend/.../script-editor/components/CameraControls.tsx` |
| | **M10: Blender Asset Resolver** | Catalog matcher linking storyboard entities to physical `.blend` models | `backend/features/workspace/asset_resolution/*` |

---

## 7. Phased Definition of Done

### Phase 1 & 2 Acceptance Checklist (Milestones 1–6: Core Script Engine)
- [ ] **01. Contracts Frozen**: Pydantic models in Python and TypeScript interfaces in React match exactly with zero syntax or typing errors.
- [ ] **02. Asynchronous Job Lifecycle**: `POST /api/studio/generate-script` returns HTTP 202 Accepted with polling via `GET /api/studio/jobs/{jobId}`.
- [ ] **03. Unbroken Style Transmission**: `visualStyle`, `subtitleStyle`, and `musicMood` pass from UI to backend with verified telemetry.
- [ ] **04. Complete Scene Contract**: Response populates all scene attributes, camera lens parameters, and character actions without missing fields.
- [ ] **05. Timing Recalibration**: Generated scenes adhere to the $\pm 5\%$ final duration policy via automated scaling.
- [ ] **06. Modular Provider**: `gemini.py` callers operate seamlessly through the extracted `shared/ai/providers/gemini/` facade.
- [ ] **07. Stage 1 Independent Execution**: User can generate, review, and edit scripts without triggering TTS voiceover or video media stages.
- [ ] **08. Legacy Reel Support**: Existing short-form motivational video generation continues operating with zero regressions (`motivational_reel` default preserved).

### Phase 3 Acceptance Checklist (Milestones 7–8: Persistence & Continuity)
- [ ] **09. Atomic Version Snapshots**: Saving changes increments `version_number` within an atomic transaction.
- [ ] **10. Production Locking**: Approved scripts are locked to `approved_version_id`; edits fork a new draft.
- [ ] **11. Character Continuity**: Permanent asset IDs (`dog_01`, `autumn_town_01`) persist across all scene cuts with consistent attribute manifests.
- [ ] **12. Stale Worker Protection**: Fencing token prevents superseded workers from overwriting completed jobs.

### Phase 4 Acceptance Checklist (Milestones 9–10: 3D Staging & Blender)
- [ ] **13. Spline Camera UI**: Keyframe timeline renders camera positions and Bézier spline paths.
- [ ] **14. Blender Catalog Match**: Storyboard characters resolve to validated physical `.blend` asset models.
