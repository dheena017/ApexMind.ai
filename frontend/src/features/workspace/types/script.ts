/**
 * frontend/src/features/workspace/types/script.ts
 *
 * Comprehensive TypeScript data contracts for ApexMind Script Generation v2.1.2.
 * Covers 2D motivational reels, 3D cinematic stories, animation keyframes,
 * camera splines, asset manifests, and asynchronous generation job statuses.
 */

export type GenerationProfile = 'motivational_reel' | 'cinematic_3d_story';

export type ApprovalStatus = 'draft' | 'in_review' | 'approved_locked' | 'production_started' | 'archived';

export type JobPhase =
  | 'QUEUED'
  | 'BUILDING_PROMPT'
  | 'CALLING_AI'
  | 'PARSING_RESPONSE'
  | 'VALIDATING_SCENES'
  | 'PLANNING_ASSETS'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

// ── 3D Mathematics & Transforms ─────────────────────────────────────────────

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Transform3D {
  position: Vector3D;
  rotation: Vector3D; // Euler degrees (pitch, roll, yaw)
  scale: Vector3D;
}

// ── Camera Specifications ───────────────────────────────────────────────────

export interface CameraLens {
  focalLengthMm: number; // e.g. 24, 35, 50, 85 mm
  depthOfField: boolean;
  fStop: number; // e.g. 1.8, 2.8, 4.0
  focusDistanceMeters?: number;
  sensorWidthMm: number; // 36.0 for full-frame 35mm standard
}

export interface CameraPathKeyframe {
  timestamp: number; // Seconds relative to global video timeline
  position: Vector3D;
  rotation: Vector3D;
  fovDegrees: number;
  tension: number;
  continuity: number;
  bias: number;
}

export interface SceneCamera {
  shot: 'extreme_wide' | 'wide' | 'medium' | 'close_up' | 'extreme_close_up' | string;
  angle: 'low_angle' | 'eye_level' | 'high_angle' | 'bird_eye' | 'dutch' | string;
  movement: 'static' | 'slow_dolly_in' | 'dolly_out' | 'pan_left' | 'pan_right' | 'tilt_up' | 'crane_down' | 'orbit' | string;
  lens: CameraLens;
  focusTarget?: string; // Target characterId or propId
  trackingMode: 'static' | 'look_at' | 'follow_path' | string;
  duration: number;
  splinePath?: CameraPathKeyframe[];
  startTransform: Transform3D;
  endTransform: Transform3D;
}

// ── Staging, Lighting & Transitions ─────────────────────────────────────────

export interface SceneLighting {
  style: string;
  intensity: 'soft' | 'dramatic' | 'harsh' | 'ambient' | string;
  keyLightAngle: string;
  colorTemperature: number; // Kelvin
}

export interface SceneTransition {
  inTransition: 'cut' | 'fade_in' | 'dissolve' | 'wipe' | string;
  outTransition: 'cut' | 'fade_out' | 'dissolve' | 'wipe' | string;
  duration: number;
}

export interface SceneEnvironment {
  assetId: string; // e.g. "autumn_town_01"
  name: string;
  timeOfDay: 'morning' | 'noon' | 'golden_hour' | 'dusk' | 'night' | string;
  weather: 'clear' | 'overcast' | 'rainy' | 'foggy' | string;
  ambientLighting: string;
  layoutMapId?: string;
}

export interface PropInScene {
  propId: string;
  name: string;
  placement: string;
  state: 'idle' | 'floating' | 'rotating' | 'active' | string;
}

// ── Character Animation & Lip Sync ──────────────────────────────────────────

export interface CharacterLocomotion {
  type: 'stationary' | 'idle' | 'walk' | 'run' | 'jump' | 'trot' | 'sit' | 'lay_down' | string;
  speedMps: number;
  pathType: 'linear' | 'spline' | 'curved' | string;
}

export interface AnimationKeyframe {
  timestamp: number; // Seconds relative to global video timeline
  poseName: string;
  rootTransform?: Transform3D;
  blendWeight: number;
}

export interface CharacterAnimationClip {
  clipId: string;
  startTime: number;
  endTime: number;
  loop: boolean;
  blendInDuration: number;
  blendOutDuration: number;
  keyframes: AnimationKeyframe[];
}

export interface VisemeKeyframe {
  timestamp: number; // Seconds relative to global video timeline
  viseme: 'sil' | 'PP' | 'FF' | 'TH' | 'DD' | 'kk' | 'CH' | 'SS' | 'nn' | 'RR' | 'aa' | 'E' | 'I' | 'O' | 'U' | string;
  weight: number; // 0.0 to 1.0
}

export interface FacialKeyframe {
  timestamp: number; // Seconds relative to global video timeline
  expression: 'neutral' | 'alert' | 'curious' | 'scared' | 'happy' | 'aggressive' | string;
  intensity: number; // 0.0 to 1.0
}

export interface CharacterInScene {
  characterId: string; // References assetManifest.characters[].id
  role: 'primary' | 'supporting' | 'background' | string;
  action: string;
  locomotion: CharacterLocomotion;
  animation: CharacterAnimationClip;
  facialAnimation?: FacialKeyframe[];
  lipSyncVisemes?: VisemeKeyframe[];
  startTransform: Transform3D;
  endTransform: Transform3D;
}

// ── Audio & Subtitles ───────────────────────────────────────────────────────

export interface WordTimestamp {
  word: string;
  start: number; // Global timeline seconds
  end: number; // Global timeline seconds
  confidence: number;
}

export interface SceneDialogue {
  speakerId: string;
  voiceName: string;
  text: string;
  startOffset: number; // Seconds relative to scene start
  words?: WordTimestamp[];
}

export interface SceneAmbient {
  trackId: string;
  volumeDb: number;
  fadeInDuration: number;
  fadeOutDuration: number;
}

export interface SceneSFX {
  cueId: string;
  timestamp: number; // Global timeline seconds
  volumeDb: number;
  pan: number; // -1.0 to 1.0
}

export interface SceneAudio {
  sampleRate: number; // 24000 or 48000
  dialogue?: SceneDialogue;
  ambient: SceneAmbient;
  sfx: SceneSFX[];
  musicMood: string;
}

// ── Unified Scene Item ──────────────────────────────────────────────────────

export interface SceneItem {
  sceneId: string; // e.g. "scn_01_a9f2"
  sceneNumber: number;
  startTime: number; // Global timeline seconds
  endTime: number; // Global timeline seconds
  duration: number; // Duration in seconds

  narration: string;
  visualDescription: string;
  action: string;

  // 3D Structured Entities
  characters: CharacterInScene[];
  environment: SceneEnvironment;
  props: PropInScene[];

  // Cinematic Staging
  camera: SceneCamera;
  lighting: SceneLighting;
  audio: SceneAudio;
  transitions: SceneTransition;
  continuityNotes: string;

  // Legacy & 2D Timeline Compatibility Fields
  beat: 'hook' | 'build' | 'climax' | 'payoff' | 'cta' | string;
  mediaType: 'video' | 'image' | string;
  mediaStatus: 'unresolved' | 'resolved' | string;
  videoPrompt: string;
  subtitleText: string;
}

// ── Asset Manifest & Catalog Bindings ───────────────────────────────────────

export interface ScriptAssetCharacter {
  id: string; // e.g. "dog_01"
  assetType: 'character' | 'animal' | string;
  name: string;
  appearance: {
    species?: string;
    breed?: string;
    furColor?: string;
    eyeColor?: string;
    build?: string;
    distinctiveMarks?: string[];
    [key: string]: unknown;
  };
  accessories: Array<{
    id: string;
    type: string;
    color?: string;
    material?: string;
  }>;
  identityRules: {
    preserveAppearance?: boolean;
    preserveAccessories?: boolean;
    reuseAcrossScenes?: boolean;
    immutableAttributes?: string[];
  };
  usage: {
    firstScene?: number;
    lastScene?: number;
    sceneAppearances?: number[];
  };
}

export interface ScriptAssetEnvironment {
  id: string; // e.g. "autumn_town_01"
  assetType: 'environment' | string;
  name: string;
  layoutMapId?: string;
  fixedLandmarks: string[];
  timeOfDay: string;
  weather: string;
  lightingDefaults: Record<string, unknown>;
  usage: {
    sceneAppearances?: number[];
  };
}

export interface ScriptAssetProp {
  id: string; // e.g. "sky_anomaly_01"
  assetType: 'prop' | string;
  name: string;
  description: string;
  scale: 'small' | 'medium' | 'large' | 'colossal' | string;
  firstAppearsInScene: number;
  reuseAcrossScenes: boolean;
}

export interface AssetManifest {
  characters: ScriptAssetCharacter[];
  environments: ScriptAssetEnvironment[];
  props: ScriptAssetProp[];
}

export type AssetCategory =
  | 'characters'
  | 'animals'
  | 'environments'
  | 'houses'
  | 'props'
  | 'materials'
  | 'textures'
  | 'animations'
  | 'cameras';

export type AssetBindingStatus =
  | 'resolved'
  | 'needs_modeling'
  | 'needs_generation'
  | 'unresolved'
  | 'incompatible';

export type AssetClassification = 'hero' | 'secondary' | 'background_generic';

export interface AssetBinding {
  assetType: 'character' | 'animal' | 'environment' | 'house' | 'prop' | 'material' | 'texture' | 'animation' | 'camera' | string;
  storyAssetId: string;
  catalogAssetId: string;
  category: AssetCategory | string;
  status: AssetBindingStatus;
  modelFilePath?: string | null;
  sha256?: string | null;
  blenderVersion?: string;
  rigType?: string | null;
  activeMaterials?: Record<string, string>;
  activeAccessories?: string[];
  isGenericBackground?: boolean;
  classification?: AssetClassification;
  notes?: string | null;
  storyCharacterId?: string; // Backward compatibility
}

export type CharacterAssetBinding = AssetBinding;

// ── Script Document ─────────────────────────────────────────────────────────

export interface ScriptDocument {
  id: string;
  version: number;
  title: string;
  description?: string;
  targetAudience?: string;
  totalDuration: number;
  aspectRatio: string;
  scenes: SceneItem[];

  // Motivational Reel compatibility fields
  hook?: string;
  hooks?: Array<{
    id: string;
    angle: string;
    text: string;
    viralityScore: number;
  }>;
  quote?: string;
  cta?: string;
  soundDesign?: Record<string, unknown>;
}

export interface ScriptGenerationMetadata {
  modelUsed: string;
  promptVersion: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  generationLatencyMs: number;
  tags: string[];
  hashtags: string[];
  createdAt: string;
}

export interface PromptAdherenceCheck {
  criterion: string;
  passed: boolean;
  severity: 'info' | 'warning' | 'error';
  details: string;
}

export interface ValidationSummary {
  isValid: boolean;
  targetDuration: number;
  actualDuration: number;
  durationDeltaPercent: number;
  sceneCount: number;
  repairedIssues: string[];
  errors: string[];
  warnings: string[];
  adherenceChecks?: PromptAdherenceCheck[];
  adherenceScorePercent?: number;
}

// ── Response & Request Envelopes ────────────────────────────────────────────

export interface ScriptGenerationResponse {
  success: boolean;
  generationId: string;
  generationProfile: GenerationProfile;
  script: ScriptDocument;
  assetManifest: AssetManifest;
  assetBindings: AssetBinding[];
  metadata: ScriptGenerationMetadata;
  validation: ValidationSummary;
}

export interface ScriptGenerationSettings {
  generationProfile: GenerationProfile;
  prompt: string;
  category: string;
  duration?: string;
  targetLength?: string;
  aspectRatio: string;
  model: string;
  tone: string;
  voiceName?: string;
  voice?: string;
  visualStyle: string;
  subtitleStyle: string;
  musicMood: string;
  projectId?: string;
}

export interface ScriptJobResponse {
  success: boolean;
  jobId: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  phase: JobPhase;
  progressPercent: number;
  createdAt: string;
  pollUrl: string;
  cancelUrl: string;
}

export interface JobStatusResponse {
  jobId: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  phase: JobPhase;
  progressPercent: number;
  message?: string;
  currentStageMessage?: string;
  elapsedSeconds: number;
  error?: string | null;
  errorMessage?: string | null;
  result?: any;
}
