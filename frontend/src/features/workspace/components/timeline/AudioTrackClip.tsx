import React from 'react';
import { Mic, Music, Sparkles } from 'lucide-react';
import { formatTime, SelectedClip } from './timelineTypes';
import { TimelineWaveform } from './TimelineWaveform';

export interface AudioTrackClipProps {
  type: 'voice' | 'music' | 'sfx';
  start: number;
  duration: number;
  totalDuration: number;
  selectedClip?: SelectedClip | null;
  isMuted?: boolean;
  label: string;
  subLabel?: string;
  onSelect: () => void;
  onPointerDownMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerDownTrimLeft: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerDownTrimRight: (e: React.PointerEvent<HTMLDivElement>) => void;
}

export const AudioTrackClip: React.FC<AudioTrackClipProps> = ({
  type,
  start,
  duration,
  totalDuration,
  selectedClip,
  isMuted = false,
  label,
  subLabel,
  onSelect,
  onPointerDownMove,
  onPointerDownTrimLeft,
  onPointerDownTrimRight,
}) => {
  const isSelected = selectedClip?.track === type;

  // Visual Theme configuration
  const theme = {
    voice: {
      color: 'bg-emerald-400',
      text: 'text-emerald-300',
      selectedRing: 'timeline-clip-selected-emerald bg-emerald-950/60 border-emerald-400 text-emerald-100 ring-2 ring-emerald-400/80 shadow-lg',
      normal: 'bg-emerald-950/35 border-emerald-500/35 text-emerald-200 hover:border-emerald-400',
      handle: 'bg-emerald-500/40 hover:bg-emerald-400',
      handlePip: 'bg-emerald-200',
      icon: <Mic className="w-3 h-3 text-emerald-400 shrink-0" />,
    },
    music: {
      color: 'bg-purple-400',
      text: 'text-purple-300',
      selectedRing: 'timeline-clip-selected-purple bg-purple-950/60 border-purple-400 text-purple-100 ring-2 ring-purple-400/80 shadow-lg',
      normal: 'bg-purple-950/35 border-purple-500/35 text-purple-200 hover:border-purple-400',
      handle: 'bg-purple-500/40 hover:bg-purple-400',
      handlePip: 'bg-purple-200',
      icon: <Music className="w-3 h-3 text-purple-400 shrink-0" />,
    },
    sfx: {
      color: 'bg-amber-400',
      text: 'text-amber-300',
      selectedRing: 'bg-amber-950/70 border-amber-400 text-amber-100 ring-2 ring-amber-400/80 shadow-lg',
      normal: 'bg-amber-950/35 border-amber-500/35 text-amber-200 hover:border-amber-400',
      handle: 'bg-amber-500/40 hover:bg-amber-400',
      handlePip: 'bg-amber-200',
      icon: <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />,
    },
  }[type];

  return (
    <div
      onClick={onSelect}
      onPointerDown={onPointerDownMove}
      className={`h-full rounded-md px-2 flex items-center justify-between border cursor-grab active:cursor-grabbing select-none group transition-colors relative overflow-hidden ${
        isSelected
          ? theme.selectedRing
          : isMuted
          ? 'bg-[#181818] border-[#2F2F2F] text-[#6B7280] opacity-40 z-10'
          : `${theme.normal} z-10`
      }`}
      style={{
        left: `${(start / totalDuration) * 100}%`,
        width: `${Math.min(100, (duration / totalDuration) * 100)}%`,
      }}
      title={`${type.toUpperCase()} Track: Drag to reposition timing. Drag handles to trim duration.`}
    >
      {/* Full-Width Procedural Audio Waveform Display */}
      <TimelineWaveform type={type} color={theme.color} />

      {/* Left Trim Handle */}
      <div
        onPointerDown={onPointerDownTrimLeft}
        className={`timeline-trim-handle-left ${theme.handle} opacity-0 group-hover:opacity-100 transition-opacity z-20`}
        title={`Drag to trim ${type} start offset`}
      >
        <div className={`w-0.5 h-3 ${theme.handlePip} rounded-full`} />
      </div>

      {/* Track Label Pill */}
      <div className="flex items-center gap-1.5 truncate pointer-events-none pl-1 z-10 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs">
        {theme.icon}
        <span className="text-[10px] font-mono-studio font-medium truncate">
          {label}
        </span>
      </div>

      {/* Duration or Sublabel Readout */}
      <span className={`text-[9px] font-mono-studio ${theme.text} pointer-events-none pr-1 font-bold z-10 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs`}>
        {subLabel || formatTime(duration)}
      </span>

      {/* Right Trim Handle */}
      <div
        onPointerDown={onPointerDownTrimRight}
        className={`timeline-trim-handle-right ${theme.handle} opacity-0 group-hover:opacity-100 transition-opacity z-20`}
        title={`Drag to trim ${type} duration`}
      >
        <div className={`w-0.5 h-3 ${theme.handlePip} rounded-full`} />
      </div>
    </div>
  );
};

export default AudioTrackClip;
