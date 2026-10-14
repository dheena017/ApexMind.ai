import React, { useState, useCallback } from 'react';
import { Mic, Music, Sparkles } from 'lucide-react';
import { formatTime, SelectedClip } from './timelineTypes';
import { TimelineWaveform } from './TimelineWaveform';
import { TimelineClipContextMenu } from './TimelineClipContextMenu';

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
  // Context menu actions
  onDelete?: () => void;
  onDuplicate?: () => void;
  onSplit?: () => void;
  onMute?: () => void;
  onZoomToClip?: () => void;
  onColorLabel?: (color: string) => void;
  onCopyTimings?: () => void;
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
  onDelete,
  onDuplicate,
  onSplit,
  onMute,
  onZoomToClip,
  onColorLabel,
  onCopyTimings,
}) => {
  const isSelected = selectedClip?.track === type;
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [colorLabel, setColorLabel] = useState<string>('');

  // Visual Theme configuration
  const theme = {
    voice: {
      color: 'bg-emerald-400',
      text: 'text-emerald-300',
      selectedRing: 'bg-[#1A1A1A] border-[#3A3A3A] text-white outline outline-1 outline-[#3A3A3A]',
      normal: 'bg-[#1A1A1A]/80 border-[#2F2F2F] text-[#E5E5E5] hover:border-[#3A3A3A]',
      handle: 'bg-[#3A3A3A]/80 hover:bg-[#4A4A4A]',
      handlePip: 'bg-[#D1D5DB]',
      icon: <Mic className="w-3 h-3 text-emerald-400 shrink-0" />,
    },
    music: {
      color: 'bg-purple-400',
      text: 'text-purple-300',
      selectedRing: 'bg-[#1A1A1A] border-[#3A3A3A] text-white outline outline-1 outline-[#3A3A3A]',
      normal: 'bg-[#1A1A1A]/80 border-[#2F2F2F] text-[#E5E5E5] hover:border-[#3A3A3A]',
      handle: 'bg-[#3A3A3A]/80 hover:bg-[#4A4A4A]',
      handlePip: 'bg-[#D1D5DB]',
      icon: <Music className="w-3 h-3 text-purple-400 shrink-0" />,
    },
    sfx: {
      color: 'bg-amber-400',
      text: 'text-amber-300',
      selectedRing: 'bg-[#1A1A1A] border-[#3A3A3A] text-white outline outline-1 outline-[#3A3A3A]',
      normal: 'bg-[#1A1A1A]/80 border-[#2F2F2F] text-[#E5E5E5] hover:border-[#3A3A3A]',
      handle: 'bg-[#3A3A3A]/80 hover:bg-[#4A4A4A]',
      handlePip: 'bg-[#D1D5DB]',
      icon: <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />,
    },
  }[type];

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, [onSelect]);

  const handleColorLabel = useCallback((color: string) => {
    setColorLabel(color);
    onColorLabel?.(color);
  }, [onColorLabel]);

  const handleCopyTimings = useCallback(() => {
    const text = `Start: ${start.toFixed(2)}s | Duration: ${duration.toFixed(2)}s | End: ${(start + duration).toFixed(2)}s`;
    navigator.clipboard.writeText(text).catch(() => {});
    onCopyTimings?.();
  }, [start, duration, onCopyTimings]);

  return (
    <>
      <div
        onClick={onSelect}
        onPointerDown={onPointerDownMove}
        onContextMenu={handleContextMenu}
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
          ...(colorLabel ? { boxShadow: `inset 0 0 0 2px ${colorLabel}40, 0 0 0 1px ${colorLabel}` } : {}),
        }}
        title={`${type.toUpperCase()} Track: Drag to reposition timing. Drag handles to trim duration. Right-click for options.`}
      >
        {/* Color Label Strip (top edge) */}
        {colorLabel && (
          <div
            className="absolute top-0 left-0 right-0 h-0.5 z-30 rounded-t-md"
            style={{ background: colorLabel }}
          />
        )}

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

      {/* Right-click Context Menu */}
      <TimelineClipContextMenu
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        trackType={type}
        isVisible={contextMenu !== null}
        isMuted={isMuted}
        onClose={() => setContextMenu(null)}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onSplit={onSplit}
        onMute={onMute}
        onZoomToClip={onZoomToClip}
        onColorLabel={handleColorLabel}
        onCopyTimings={handleCopyTimings}
      />
    </>
  );
};

export default AudioTrackClip;
