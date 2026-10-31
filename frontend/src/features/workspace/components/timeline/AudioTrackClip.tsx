import React, { useState, useCallback } from 'react';
import { Mic, Music, Sparkles, Move, MoreVertical } from 'lucide-react';
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

const normalizeAudioLabel = (name: string, type: string) => {
  if (!name) return type === 'sfx' ? 'Whoosh' : `${type.toUpperCase()} Track`;
  if (type !== 'sfx') return name;

  // Clean verbose AI labels into punchy studio SFX names
  const lower = name.toLowerCase();
  if (lower.includes('whoosh') || lower.includes('swoosh') || lower.includes('transition')) return 'Whoosh';
  if (lower.includes('impact') || lower.includes('hit') || lower.includes('slam') || lower.includes('boom')) return 'Impact';
  if (lower.includes('riser') || lower.includes('rise') || lower.includes('buildup')) return 'Riser';
  if (lower.includes('cash') || lower.includes('kaching') || lower.includes('money') || lower.includes('chime')) return 'Chime';
  if (lower.includes('drop') || lower.includes('bass') || lower.includes('sub')) return 'Sub Drop';
  if (lower.includes('trailer') || lower.includes('cinematic')) return 'Impact';

  const cleaned = name
    .replace(/^sfx[-_:\s]*/i, '')
    .replace(/^(Fast|Cinematic|Scene\s*\d*|Trailer)\s*/i, '')
    .replace(/\s*(Transition|Effect|Hit|Drop|Sound|Track)$/i, '')
    .trim();

  return cleaned || 'Whoosh';
};

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
      text: 'text-emerald-100',
      accent: 'text-emerald-300',
      box: 'bg-[#0A241A]/90 hover:bg-[#0E3123] border-emerald-500/35',
      selectedRing: 'bg-[#0E3827] border-emerald-300 text-white z-20',
      handle: 'bg-emerald-400/40 hover:bg-emerald-400',
      handlePip: 'bg-white',
      icon: <Mic className="w-3 h-3 text-emerald-300/90 shrink-0 pointer-events-none" />,
    },
    music: {
      color: 'bg-purple-400',
      text: 'text-purple-100',
      accent: 'text-purple-300',
      box: 'bg-[#1A0A24]/90 hover:bg-[#230E31] border-purple-500/35',
      selectedRing: 'bg-[#280E38] border-purple-300 text-white z-20',
      handle: 'bg-purple-400/40 hover:bg-purple-400',
      handlePip: 'bg-white',
      icon: <Music className="w-3 h-3 text-purple-300/90 shrink-0 pointer-events-none" />,
    },
    sfx: {
      color: 'bg-amber-400',
      text: 'text-amber-100',
      accent: 'text-amber-300',
      box: 'bg-[#24170A]/90 hover:bg-[#311E0E] border-amber-500/35',
      selectedRing: 'bg-[#38220E] border-amber-300 text-white z-20',
      handle: 'bg-amber-400/40 hover:bg-amber-400',
      handlePip: 'bg-white',
      icon: <Sparkles className="w-3 h-3 text-amber-300/90 shrink-0 pointer-events-none" />,
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
      className="box-border border-b border-[#242426] relative w-full transition-all"
      style={{ height: `${actualTrackHeight}px` }}
    >
      {effectiveClips.map((clip) => {
        const isAllSelected = selectedClip?.track === type && Boolean(selectedClip.all);
        const isSingleSelected = selectedClip?.track === type && !selectedClip.all && (selectedClip.clipId === clip.id || (!selectedClip.clipId && effectiveClips.length === 1));
        const isSelected = isAllSelected || isSingleSelected;
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
            className={`timeline-clip-card rounded-md px-1.5 flex items-center justify-between border cursor-grab active:cursor-grabbing select-none group transition-all absolute overflow-hidden shadow-xs ${
              isSelected
                ? theme.selectedRing
                : isMuted
                ? 'bg-[#181818] border-[#2F2F2F] text-[#6B7280] opacity-40 z-10'
                : `${theme.box} ${theme.text} z-10`
            }`}
            style={{
              left: `${(clip.start / totalDuration) * 100}%`,
              width: `${Math.max(0.01, Math.min(100, (clip.duration / totalDuration) * 100))}%`,
              minWidth: '28px',
              top: `${topPos}px`,
              height: `${laneHeight}px`,
            }}
            title={`${type.toUpperCase()} Clip: "${clip.name}" • Layer: ${clipLane + 1} • Start: ${(Number(clip.start) || 0).toFixed(1)}s, Dur: ${(Number(clip.duration) || 0).toFixed(1)}s. Drag anywhere to move, edge handles to trim.`}
          >
            {/* Full-Width Procedural Audio Waveform Display (Subtle background) */}
            <div className="opacity-15 pointer-events-none absolute inset-0">
              <TimelineWaveform type={type} color={theme.color} />
            </div>

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

            {/* Clean Box Content: Icon + Title */}
            <div className="flex items-center gap-1.5 w-full min-w-0 overflow-hidden px-1.5 select-none z-10">
              {theme.icon}
              <span className={`text-[10px] font-bold ${theme.text} truncate tracking-tight flex-1 min-w-0 pointer-events-none`}>
                {normalizeAudioLabel(clip.name || label || '', type)}
              </span>
            </div>

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
          clipId={contextMenu.clipId}
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
