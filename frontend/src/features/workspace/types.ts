export interface ScriptSubtitle {
  text: string;
  start: number;
  duration: number;
}

export interface GeneratedScript {
  title: string;
  hook: string;
  quote: string;
  cta: string;
  speechStyle: string;
  visualTheme: string;
  recommendedVoice: string;
  tags: string[];
  hashtags: string[];
  subtitles: ScriptSubtitle[];
}

export interface MusicTrack {
  id: string;
  title: string;
  genre: string;
  duration: string;
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
}

export interface BackdropFilterSettings {
  brightness: number;
  contrast: number;
  saturate: number;
  vignette: number;
  customImageUrl?: string;
  customVideoUrl?: string;
  grain: boolean;
  activeOverlay?: 'none' | 'equalizer' | 'particles' | 'badge';
}
