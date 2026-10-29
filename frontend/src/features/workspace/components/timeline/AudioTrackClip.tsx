import React, { useState, useCallback } from 'react';
import { Mic, Music, Sparkles, Move } from 'lucide-react';
import { formatTime, SelectedClip, TimelineAudioClip } from './timelineTypes';
import { TimelineWaveform } from './TimelineWaveform';
import { TimelineClipContextMenu } from './TimelineClipContextMenu';

export interface AudioTrackClipProps {
  type: 'voice' | 'music' | 'sfx';
  clips?: (TimelineAudioClip & { lane?: number })[];
  trackHeight?: number;
  laneHeight?: number;
  laneGap?: number;
  maxLane?: number;
  start?: number;
  duration?: number;
  totalDuration: number;
  selectedClip?: SelectedClip | null;
  isMuted?: boolean;
  label?: string;
  subLabel?: string;
  onSelectClip?: (clipId: string) => void;
  onPointerDownMoveClip?: (e: React.PointerEvent<HTMLDivElement>, clip: TimelineAudioClip) => void;
  onPointerDownTrimLeftClip?: (e: React.PointerEvent<HTMLDivElement>, clip: TimelineAudioClip) => void;
  onPointerDownTrimRightClip?: (e: React.PointerEvent<HTMLDivElement>, clip: TimelineAudioClip) => void;
  onDeleteClip?: (clipId: string) => void;
  onDuplicateClip?: (clipId: string) => void;
  onSplitClip?: (clipId: string) => void;
  // Legacy single-clip fallback handlers
  onSelect?: () => void;
  onPointerDownMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerDownTrimLeft?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerDownTrimRight?: (e: React.PointerEvent<HTMLDivElement>) => void;
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
  clips,
  trackHeight,
  laneHeight = 32,
  laneGap = 4,
  start = 0,
  duration = 0,
  totalDuration,
  selectedClip,
  isMuted = false,
  label = '',
  subLabel,
  onSelectClip,
  onPointerDownMoveClip,
  onPointerDownTrimLeftClip,
  onPointerDownTrimRightClip,
  onDeleteClip,
  onDuplicateClip,
  onSplitClip,
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
  const effectiveClips: (TimelineAudioClip & { lane?: number })[] = (clips && clips.length > 0)
    ? clips
    : (duration > 0 || label ? [{
        id: `${type}-default`,
        type,
        url: '',
        name: label || `${type.toUpperCase()} Track`,
        start: start,
        duration: duration,
        lane: 0,
      }] : []);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; clipId: string } | null>(null);
  const [colorLabels, setColorLabels] = useState<Record<string, string>>({});

  const actualTrackHeight = trackHeight ?? 40;

  // Visual Theme configuration
  const theme = {
    voice: {
      color: 'bg-emerald-400',
      text: 'text-emerald-300',
      selectedRing: 'bg-[#0D2E24] border-emerald-400 ring-1 ring-emerald-400/60 text-white z-20 shadow-md',
      normal: 'bg-[#1A1A1A]/85 border-[#2F2F2F] text-[#E5E5E5] hover:border-[#3A3A3A] z-10',
      handle: 'bg-[#3A3A3A]/80 hover:bg-[#4A4A4A]',
      handlePip: 'bg-[#D1D5DB]',
      icon: <Mic className="w-3 h-3 text-emerald-400 shrink-0" />,
    },
    music: {
      color: 'bg-purple-400',
      text: 'text-purple-300',
      selectedRing: 'bg-[#25143A] border-purple-400 ring-1 ring-purple-400/60 text-white z-20 shadow-md',
      normal: 'bg-[#1A1A1A]/85 border-[#2F2F2F] text-[#E5E5E5] hover:border-[#3A3A3A] z-10',
      handle: 'bg-[#3A3A3A]/80 hover:bg-[#4A4A4A]',
      handlePip: 'bg-[#D1D5DB]',
      icon: <Music className="w-3 h-3 text-purple-400 shrink-0" />,
    },
    sfx: {
      color: 'bg-amber-400',
      text: 'text-amber-300',
      selectedRing: 'bg-[#2D2109] border-amber-400 ring-1 ring-amber-400/60 text-white z-20 shadow-md',
      normal: 'bg-[#1A1A1A]/85 border-[#2F2F2F] text-[#E5E5E5] hover:border-[#3A3A3A] z-10',
      handle: 'bg-[#3A3A3A]/80 hover:bg-[#4A4A4A]',
      handlePip: 'bg-[#D1D5DB]',
      icon: <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />,
    },
  }[type];

  const handleColorLabel = useCallback((clipId: string, color: string) => {
    setColorLabels((prev) => ({ ...prev, [clipId]: color }));
    onColorLabel?.(color);
  }, [onColorLabel]);

  const handleCopyTimings = useCallback((clip: TimelineAudioClip) => {
    const text = `Start: ${(Number(clip.start) || 0).toFixed(2)}s | Duration: ${(Number(clip.duration) || 0).toFixed(2)}s | End: {((Number(clip.start) || 0) + (Number(clip.duration) || 0)).toFixed(2)}s`;
    navigator.clipboard.writeText(text).catch(() => {});
    onCopyTimings?.();
  }, [onCopyTimings]);

  return (
    <div
      className="border-b border-[#262626] p-1 relative flex items-center w-full transition-all"
      style={{ height: `${actualTrackHeight}px` }}
    >
      {effectiveClips.map((clip) => {
        const isSelected = selectedClip?.track === type && (!selectedClip.clipId || selectedClip.clipId === clip.id);
        const colorLabel = colorLabels[clip.id] || '';
        const clipLane = clip.lane ?? 0;
        const topPos = 4 + clipLane * (laneHeight + laneGap);

        return (
          <div
            key={clip.id}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectClip) onSelectClip(clip.id);
              else onSelect?.();
            }}
            onPointerDown={(e) => {
              if (onPointerDownMoveClip) onPointerDownMoveClip(e, clip);
              else onPointerDownMove?.(e);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onSelectClip) onSelectClip(clip.id);
              else onSelect?.();
              setContextMenu({ x: e.clientX, y: e.clientY, clipId: clip.id });
            }}
            className={`timeline-clip-card rounded-md px-2 flex items-center justify-between border cursor-grab active:cursor-grabbing select-none group transition-all absolute overflow-hidden ${
              isSelected
                ? theme.selectedRing
                : isMuted
                ? 'bg-[#181818] border-[#2F2F2F] text-[#6B7280] opacity-40 z-10'
                : `${theme.normal} z-10`
            }`}
            style={{
              left: `${(clip.start / totalDuration) * 100}%`,
              width: `${Math.max(0.01, Math.min(100, (clip.duration / totalDuration) * 100))}%`,
              minWidth: '4px',
              top: `${topPos}px`,
              height: `${laneHeight}px`,
              ...(colorLabel ? { boxShadow: `inset 0 0 0 2px ${colorLabel}40, 0 0 0 1px ${colorLabel}` } : {}),
            }}
            title={`${type.toUpperCase()} Clip: "${clip.name}" • Layer: ${clipLane + 1} • Start: ${(Number(clip.start) || 0).toFixed(1)}s, Dur: ${(Number(clip.duration) || 0).toFixed(1)}s. Drag anywhere to move, edge handles to trim.`}
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
              onPointerDown={(e) => {
                e.stopPropagation();
                if (onPointerDownTrimLeftClip) onPointerDownTrimLeftClip(e, clip);
                else onPointerDownTrimLeft?.(e);
              }}
              className={`timeline-trim-handle-left ${theme.handle} opacity-0 group-hover:opacity-100 transition-opacity z-20`}
              title={`Drag to trim ${type} start offset`}
            >
              <div className={`w-0.5 h-3 ${theme.handlePip} rounded-full`} />
            </div>

            {/* Clean Audio Clip Label & Duration */}
            <span className="text-[10px] font-mono-studio truncate leading-tight pointer-events-none pl-1.5 text-white/90 z-10 font-medium">
              {clip.name || label || `${type.toUpperCase()} Track`}
            </span>
            <span className={`text-[8.5px] font-mono-studio ${theme.text} shrink-0 ml-auto pointer-events-none pr-1.5 font-bold z-10`}>
              {(Number(clip.duration) || 0).toFixed(1)}s
            </span>

            {/* Right Trim Handle */}
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                if (onPointerDownTrimRightClip) onPointerDownTrimRightClip(e, clip);
                else onPointerDownTrimRight?.(e);
              }}
              className={`timeline-trim-handle-right ${theme.handle} opacity-0 group-hover:opacity-100 transition-opacity z-20`}
              title={`Drag to trim ${type} duration`}
            >
              <div className={`w-0.5 h-3 ${theme.handlePip} rounded-full`} />
            </div>
          </div>
        );
      })}

      {/* Right-click Context Menu */}
      {contextMenu && (
        <TimelineClipContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          trackType={type}
          isVisible={true}
          isMuted={isMuted}
          onClose={() => setContextMenu(null)}
          onDelete={() => {
            if (onDeleteClip) onDeleteClip(contextMenu.clipId);
            else onDelete?.();
            setContextMenu(null);
          }}
          onDuplicate={() => {
            if (onDuplicateClip) onDuplicateClip(contextMenu.clipId);
            else onDuplicate?.();
            setContextMenu(null);
          }}
          onSplit={() => {
            if (onSplitClip) onSplitClip(contextMenu.clipId);
            else onSplit?.();
            setContextMenu(null);
          }}
          onMute={onMute}
          onZoomToClip={onZoomToClip}
          onColorLabel={(c) => handleColorLabel(contextMenu.clipId, c)}
          onCopyTimings={() => {
            const target = effectiveClips.find((c) => c.id === contextMenu.clipId);
            if (target) handleCopyTimings(target);
          }}
        />
      )}
    </div>
  );
};

export default AudioTrackClip;
