export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  emphasis?: boolean;
  highlightColor?: string;
}

export interface HookOption {
  id: string;
  angle: string;
  text: string;
  viralityScore: number;
  spokenDuration?: number;
}

export interface AudioDuckingProfile {
  active: boolean;
  voiceActiveVolume: number;
  pauseSwellVolume: number;
  attackMs: number;
  releaseMs: number;
}

export interface SfxEvent {
  time: number;
  sfxId: string;
  label: string;
  sfxUrl?: string;
}

export interface SoundDesign {
  soundtrackTrackId?: string;
  soundtrackTitle?: string;
  genre?: string;
  bpm?: number;
  audioUrl?: string;
  ducking?: AudioDuckingProfile;
  ambientBed?: {
    foleyId?: string;
    volume?: number;
    loop?: boolean;
  };
  sfxEvents?: SfxEvent[];
}

export interface ScriptSubtitle {
  text: string;
  start: number;
  duration: number;
  textStyleId?: string;
  captionPresetClass?: string;
  captionPresetColor?: string;
  words?: WordTimestamp[];
}

export interface StoryboardScene {
  sceneNumber: number;
  beat: 'hook' | 'escalation' | 'quote' | 'cta' | string;
  start: number;
  duration: number;
  mediaType: 'video' | 'image';
  mediaId: string;
  mediaUrl?: string;
  mediaName?: string;
  textStyleId?: string;
  textStyleName?: string;
  captionPresetClass?: string;
  captionPresetColor?: string;
  captionPresetFontFamily?: string;
  transition?: string;
  cameraMotion?: string;
  sfx?: string;
  sfxUrl?: string;
  subtitleText?: string;
  aspectRatio?: string;
  googleSearchQuery?: string;
  visualQuery?: string;
  fallbackQueries?: string[];
  negativeTerms?: string[];
  words?: WordTimestamp[];
}

export interface GeneratedScript {
  title: string;
  hook: string;
  quote: string;
  cta: string;
  speechStyle: string;
  visualTheme: string;
  recommendedVoice: string;
  category?: string;
  tags: string[];
  hashtags: string[];
  subtitles: ScriptSubtitle[];
  storyboard?: StoryboardScene[];
  hooks?: HookOption[];
  soundDesign?: SoundDesign;
  audioMood?: string;
  backgroundStyle?: string;
  textStyle?: string;
  videoStyle?: string;
  voiceName?: string;
  aspectRatio?: string;
  musicTrack?: string;
  captionStyle?: string;
  motionStyle?: string;
  outputFormat?: string;
  shotPacing?: string;
  transitionStyle?: string;
  subtitleMotion?: string;
  textAnimation?: string;
  cameraMovement?: string;
  sceneStructure?: {
    hookPlacement?: string;
    ctaTiming?: string;
    emphasisPoints?: string[];
    shotPlan?: string;
    subtitlePriority?: string;
  };
}

export interface MusicTrack {
  id: string;
  title: string;
  name?: string;
  genre: string;
  duration: string;
  mood?: string;
  audioUrl?: string;
  bpm: number;
  copyrightFree: boolean;
  license: string;
  frequencyData: number[];
}

export const DEFAULT_SOUNDTRACK_AUDIO_URL =
  'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=cinematic-time-lapse-115672.mp3';

export interface VisualBackdrop {
  id: string;
  name: string;
  category: string;
  aspectRatio: string;
  previewColor: string;
  textColor: string;
  particleEffect: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface VoiceProfile {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  style: string;
  speed: string;
  previewUrl?: string;
}

export interface BackdropFilterSettings {
  brightness: number;
  contrast: number;
  saturate: number;
  vignette: number;
  hue?: number;
  blur?: number;
  grain: boolean;
  activeOverlay?: 'none' | 'equalizer' | 'particles' | 'badge';
  lut?: string;
  lutIntensity?: number;
  presetFilter?: string;
  customImageUrl?: string;
  customVideoUrl?: string;
}

export type WorkspaceNotificationType = 'info' | 'success' | 'warning' | 'error' | 'render' | 'ai';
export type WorkspaceNotificationCategory = 'script' | 'voice' | 'media' | 'timeline' | 'export' | 'autosave' | 'general';

export interface WorkspaceNotification {
  id: string;
  title: string;
  message: string;
  category: WorkspaceNotificationCategory;
  type: WorkspaceNotificationType;
  timestamp: string;
  read: boolean;
  targetPane?: string;
  actionLabel?: string;
  progress?: number;
}
