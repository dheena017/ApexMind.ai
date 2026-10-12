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
}

export interface VoiceProfile {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  style: string;
  speed: string;
}
