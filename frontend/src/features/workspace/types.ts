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

export const DEFAULT_VISUAL_BACKDROPS: VisualBackdrop[] = [
  {
    id: 'v1',
    name: 'Dark Mountain Dawn',
    category: 'Nature & Solitude',
    aspectRatio: '9:16',
    previewColor: 'from-slate-900 via-indigo-950 to-purple-950',
    textColor: '#FFFFFF',
    particleEffect: 'glowing-dust',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=720&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
  {
    id: 'v2',
    name: 'Cyberpunk Workspace',
    category: 'Futuristic Studio',
    aspectRatio: '9:16',
    previewColor: 'from-slate-950 via-purple-950 to-cyan-950',
    textColor: '#38BDF8',
    particleEffect: 'neon-grid',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=720&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
  },
  {
    id: 'v3',
    name: 'Dramatic Gym Shadows',
    category: 'Fitness & Power',
    aspectRatio: '9:16',
    previewColor: 'from-neutral-950 via-stone-900 to-amber-950',
    textColor: '#F59E0B',
    particleEffect: 'smoke-sparks',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=720&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  },
  {
    id: 'v4',
    name: 'Deep Ocean Mindset',
    category: 'Calm & Resilience',
    aspectRatio: '9:16',
    previewColor: 'from-slate-950 via-blue-950 to-teal-950',
    textColor: '#2DD4BF',
    particleEffect: 'water-ripples',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=720&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  },
  {
    id: 'v5',
    name: 'Golden Hour Hustle',
    category: 'Ambition & Momentum',
    aspectRatio: '9:16',
    previewColor: 'from-amber-950 via-orange-950 to-rose-950',
    textColor: '#FBBF24',
    particleEffect: 'sunflare-glow',
    imageUrl: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=720&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  },
  {
    id: 'v6',
    name: 'Midnight Pulse',
    category: 'Future Focus',
    aspectRatio: '9:16',
    previewColor: 'from-violet-950 via-fuchsia-950 to-sky-950',
    textColor: '#A78BFA',
    particleEffect: 'neon-pulse',
    imageUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=720&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  },
  {
    id: 'v7',
    name: 'Silent Summit',
    category: 'Peak Performance',
    aspectRatio: '9:16',
    previewColor: 'from-slate-900 via-zinc-900 to-stone-900',
    textColor: '#F5F5F4',
    particleEffect: 'alpine-glow',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=720&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  },
  {
    id: 'v8',
    name: 'Emerald Fire',
    category: 'Discipline & Growth',
    aspectRatio: '9:16',
    previewColor: 'from-emerald-950 via-lime-950 to-teal-950',
    textColor: '#34D399',
    particleEffect: 'ember-ripple',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=720&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
  },
  {
    id: 'v9',
    name: 'Glass City Echo',
    category: 'Creative Runway',
    aspectRatio: '9:16',
    previewColor: 'from-slate-950 via-cyan-950 to-blue-950',
    textColor: '#67E8F9',
    particleEffect: 'city-shimmer',
    imageUrl: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=720&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  },
  {
    id: 'v10',
    name: 'Velvet Studio Lights',
    category: 'Luxury & Confidence',
    aspectRatio: '9:16',
    previewColor: 'from-stone-950 via-rose-950 to-fuchsia-950',
    textColor: '#F9A8D4',
    particleEffect: 'soft-lux',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=720&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
  {
    id: 'v11',
    name: 'Signal Overdrive',
    category: 'Creator Energy',
    aspectRatio: '9:16',
    previewColor: 'from-sky-950 via-indigo-950 to-violet-950',
    textColor: '#60A5FA',
    particleEffect: 'signal-wave',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=720&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
  },
  {
    id: 'v12',
    name: 'Still Water Depth',
    category: 'Calm & Resolve',
    aspectRatio: '9:16',
    previewColor: 'from-cyan-950 via-sky-950 to-slate-950',
    textColor: '#7DD3FC',
    particleEffect: 'water-hush',
    imageUrl: 'https://images.unsplash.com/photo-1439853941329-a99ce049f08c?auto=format&fit=crop&w=720&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
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
