import { GeneratedScript, VisualBackdrop, ScriptSubtitle, VoiceProfile, MusicTrack } from '../../types';

export const MIN_TIMELINE_ZOOM = 1;
export const MAX_TIMELINE_ZOOM = 4;
export const TIMELINE_ZOOM_STEP = 0.5;

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
  timelineDuration?: number;
  timelineHeight?: number;
  onTimelineHeightChange?: (height: number) => void;
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

export type LaneClip<T> = T & { origIndex: number; lane: number };

export function computeClipLanes<T extends { id?: string; start: number; duration?: number; laneOffset?: number }>(
  clips: T[]
): { lanes: LaneClip<T>[]; maxLane: number } {
  if (!clips || clips.length === 0) return { lanes: [], maxLane: 0 };
  const indexed = clips.map((c, i) => ({ ...c, origIndex: i, lane: 0 }));
  const sorted = [...indexed].sort((a, b) => a.start - b.start);

  const laneEndTimes: number[] = [];
  const result: LaneClip<T>[] = [];

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

    if (typeof item.laneOffset === 'number' && item.laneOffset !== 0) {
      assignedLane = Math.max(0, assignedLane + item.laneOffset);
    }

    result.push({ ...item, lane: assignedLane });
  }

  const byOrigIndex: LaneClip<T>[] = [];
  let highestLane = 0;
  for (const r of result) {
    byOrigIndex[r.origIndex] = r;
    if (r.lane > highestLane) highestLane = r.lane;
  }

  return {
    lanes: byOrigIndex,
    maxLane: highestLane,
  };
}

export interface TimelineMediaClip {
  id: string;
  type: 'image' | 'video';
  url: string;
  name: string;
  start: number;
  duration: number;
  laneOffset?: number;
}

export interface TimelineAudioClip {
  id: string;
  type: 'voice' | 'music' | 'sfx';
  url: string;
  name: string;
  start: number;
  duration: number;
  laneOffset?: number;
}

export interface TimelineOverlayClip {
  id: string;
  type: string;
  value: string;
  label?: string;
  name: string;
  start: number;
  duration: number;
  laneOffset?: number;
}

export type SelectedClip =
  | { track: 'video'; clipId?: string }
  | { track: 'image'; clipId?: string }
  | { track: 'caption'; index: number }
  | { track: 'title' }
  | { track: 'overlay'; clipId?: string }
  | { track: 'voice'; clipId?: string }
  | { track: 'music'; clipId?: string }
  | { track: 'sfx'; clipId?: string }
  | null;

export type DragAction =
  | { kind: 'subtitle'; index: number; mode: 'move' | 'trim-left' | 'trim-right'; startX: number; origStart: number; origDuration: number }
  | { kind: 'video'; clipId?: string; mode: 'move' | 'trim-left' | 'trim-right'; startX: number; origStart: number; origDuration: number }
  | { kind: 'image'; clipId?: string; mode: 'move' | 'trim-left' | 'trim-right'; startX: number; origStart: number; origDuration: number }
  | { kind: 'overlay'; clipId?: string; mode: 'move' | 'trim-left' | 'trim-right'; startX: number; origStart: number; origDuration: number }
  | { kind: 'title'; mode: 'move' | 'trim-left' | 'trim-right'; startX: number; origStart: number; origDuration: number }
  | { kind: 'voice'; clipId?: string; mode: 'move' | 'trim-left' | 'trim-right'; startX: number; origStart: number; origDuration: number }
  | { kind: 'music'; clipId?: string; mode: 'move' | 'trim-left' | 'trim-right'; startX: number; origStart: number; origDuration: number }
  | { kind: 'sfx'; clipId?: string; mode: 'move' | 'trim-left' | 'trim-right'; startX: number; origStart: number; origDuration: number }
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
