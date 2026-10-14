import { GeneratedScript, VisualBackdrop, ScriptSubtitle, VoiceProfile, MusicTrack } from '../../types';

export const MIN_TIMELINE_ZOOM = 0.25;
export const MAX_TIMELINE_ZOOM = 3;
export const TIMELINE_ZOOM_STEP = 0.25;

export interface TimelineSoundEffect {
  id: string;
  name: string;
  audioUrl: string;
  duration: number;
  start: number;
}

export interface StudioTimelinePaneProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onTimelineDurationChange?: (duration: number) => void;
  selectedSfx?: TimelineSoundEffect | null;
  onRemoveSfx?: () => void;
  script: GeneratedScript;
  onUpdateSubtitles?: (subtitles: ScriptSubtitle[]) => void;
  activeBackdrop?: VisualBackdrop | null;
  selectedVoice: string;
  selectedMusic: string;
  audioUrl?: string | null;
  volume: number;
  isMuted: boolean;
  onToggleMute: () => void;
  customImageUrl?: string;
  customVideoUrl?: string;
  activeElementOverlay?: { id?: string; name?: string; type: string; value: string; label?: string } | null;
  onSelectCompound?: (compound: 'video' | 'text' | 'voice' | 'music' | 'overlay') => void;
  voices?: VoiceProfile[];
  musicTracks?: MusicTrack[];
}

export const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00.0';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
};

export interface LaneSubtitle extends ScriptSubtitle {
  origIndex: number;
  lane: number;
}

export const computeCaptionLanes = (clips: ScriptSubtitle[]): { lanes: LaneSubtitle[]; maxLane: number } => {
  if (!clips || clips.length === 0) return { lanes: [], maxLane: 0 };
  const indexed = clips.map((c, i) => ({ ...c, origIndex: i, lane: 0 }));
  const sorted = [...indexed].sort((a, b) => a.start - b.start);

  const laneEndTimes: number[] = [];
  const result: LaneSubtitle[] = [];

  for (const item of sorted) {
    const itemEnd = item.start + (item.duration || 3);
    let assignedLane = -1;

    for (let l = 0; l < laneEndTimes.length; l++) {
      if (item.start >= laneEndTimes[l] - 0.05) {
        assignedLane = l;
        laneEndTimes[l] = itemEnd;
        break;
      }
    }

    if (assignedLane === -1) {
      assignedLane = laneEndTimes.length;
      laneEndTimes.push(itemEnd);
    }

    result.push({ ...item, lane: assignedLane });
  }

  // Preserve order by original index
  const byOrigIndex: LaneSubtitle[] = [];
  for (const r of result) {
    byOrigIndex[r.origIndex] = r;
  }

  return {
    lanes: byOrigIndex,
    maxLane: Math.max(0, laneEndTimes.length - 1),
  };
};

export type SelectedClip =
  | { track: 'video' }
  | { track: 'image' }
  | { track: 'caption'; index: number }
  | { track: 'title' }
  | { track: 'overlay' }
  | { track: 'voice' }
  | { track: 'music' }
  | { track: 'sfx' }
  | null;

export type DragAction =
  | { kind: 'subtitle'; index: number; mode: 'move' | 'trim-left' | 'trim-right'; startX: number; origStart: number; origDuration: number }
  | { kind: 'video'; mode: 'move' | 'trim-left' | 'trim-right'; startX: number; origStart: number; origDuration: number }
  | { kind: 'image'; mode: 'move' | 'trim-left' | 'trim-right'; startX: number; origStart: number; origDuration: number }
  | { kind: 'overlay'; mode: 'move' | 'trim-left' | 'trim-right'; startX: number; origStart: number; origDuration: number }
  | { kind: 'title'; mode: 'move' | 'trim-left' | 'trim-right'; startX: number; origStart: number; origDuration: number }
  | { kind: 'voice'; mode: 'move' | 'trim-left' | 'trim-right'; startX: number; origStart: number; origDuration: number }
  | { kind: 'music'; mode: 'move' | 'trim-left' | 'trim-right'; startX: number; origStart: number; origDuration: number }
  | { kind: 'sfx'; mode: 'move' | 'trim-left' | 'trim-right'; startX: number; origStart: number; origDuration: number }
  | null;

export interface EnabledTracks {
  video: boolean;
  image: boolean;
  overlay: boolean;
  captions: boolean;
  title: boolean;
  voice: boolean;
  music: boolean;
  sfx: boolean;
}
