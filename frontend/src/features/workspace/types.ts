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
  color?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  isStrikethrough?: boolean;
  stroke?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  dropShadow?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  neonGlow?: boolean;
  glowColor?: string;
  background?: string;
  bgRadius?: number;
  bgPadding?: number;
  opacity?: number;
  posY?: number;
  animation?: string;
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
  posterUrl?: string;
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
  speechRate?: number;
  tone?: string;
  emotion?: string;
}

export interface GeneratedScript {
  title: string;
  description?: string;
  titleIdeas?: { title: string; angle: string; viralityScore: number }[];
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

export const DEFAULT_VISUAL_BACKDROPS: VisualBackdrop[] = [
  {
    id: 'vb-dark-aurora',
    name: 'Dark Aurora',
    category: 'Cinematic',
    aspectRatio: '9:16',
    previewColor: '#0a0a14',
    textColor: '#ffffff',
    particleEffect: 'subtle-glow',
    videoUrl: 'https://cdn.pixabay.com/video/2020/04/18/36423-411516053_tiny.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=720&q=80',
  },
  {
    id: 'vb-stoic-grit',
    name: 'Stoic Mist',
    category: 'Atmospheric',
    aspectRatio: '9:16',
    previewColor: '#0d0d0d',
    textColor: '#f3f4f6',
    particleEffect: 'fog-drift',
    videoUrl: 'https://cdn.pixabay.com/video/2021/08/13/84970-588390119_tiny.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=720&q=80',
  },
  {
    id: 'vb-golden-hour',
    name: 'Golden Hour Ridge',
    category: 'Warm Cinematic',
    aspectRatio: '9:16',
    previewColor: '#1c1004',
    textColor: '#fef08a',
    particleEffect: 'dust-motes',
    videoUrl: 'https://cdn.pixabay.com/video/2020/04/18/36423-411516053_tiny.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=720&q=80',
  },
  {
    id: 'vb-deep-space',
    name: 'Cosmic Nebula',
    category: 'Sci-Fi',
    aspectRatio: '9:16',
    previewColor: '#050212',
    textColor: '#c084fc',
    particleEffect: 'star-field',
    videoUrl: 'https://cdn.pixabay.com/video/2021/08/13/84970-588390119_tiny.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=720&q=80',
  },
  {
    id: 'vb-cyber-neon',
    name: 'Cyberpunk Metropolis',
    category: 'Cyber',
    aspectRatio: '9:16',
    previewColor: '#090918',
    textColor: '#38bdf8',
    particleEffect: 'subtle-glow',
    videoUrl: 'https://cdn.pixabay.com/video/2020/04/18/36423-411516053_tiny.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=720&q=80',
  },
  {
    id: 'vb-ocean-abyss',
    name: 'Abyssal Surge',
    category: 'Dramatic',
    aspectRatio: '9:16',
    previewColor: '#020b14',
    textColor: '#a5f3fc',
    particleEffect: 'fog-drift',
    videoUrl: 'https://cdn.pixabay.com/video/2021/08/13/84970-588390119_tiny.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=720&q=80',
  },
];

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
