import React, { useState, useCallback } from 'react';
import { Layers, Zap, Move, MoreVertical } from 'lucide-react';
import { formatTime, SelectedClip, TimelineOverlayClip } from './timelineTypes';
import { TimelineClipContextMenu } from './TimelineClipContextMenu';

export interface OverlayTrackClipProps {
  clips?: (TimelineOverlayClip & { lane?: number })[];
  trackHeight?: number;
  laneHeight?: number;
  laneGap?: number;
  maxLane?: number;
  overlayStart?: number;
  overlayDuration?: number;
  totalDuration: number;
  selectedClip?: SelectedClip | null;
  overlayTrackVisible: boolean;
  label?: string;
  onSelectClip?: (clipId: string) => void;
  onPointerDownMoveClip?: (e: React.PointerEvent<HTMLDivElement>, clip: TimelineOverlayClip) => void;
  onPointerDownTrimLeftClip?: (e: React.PointerEvent<HTMLDivElement>, clip: TimelineOverlayClip) => void;
  onPointerDownTrimRightClip?: (e: React.PointerEvent<HTMLDivElement>, clip: TimelineOverlayClip) => void;
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
  onHide?: () => void;
  onZoomToClip?: () => void;
  onColorLabel?: (color: string) => void;
  onCopyTimings?: () => void;
}

export const OverlayTrackClip: React.FC<OverlayTrackClipProps> = ({
  clips,
  trackHeight,
  laneHeight = 32,
  laneGap = 4,
  overlayStart = 0,
  overlayDuration = 6,
  totalDuration,
  selectedClip,
  overlayTrackVisible,
  label = 'Overlay Element',
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
  onHide,
  onZoomToClip,
  onColorLabel,
  onCopyTimings,
}) => {
  const effectiveClips: (TimelineOverlayClip & { lane?: number })[] = (clips && clips.length > 0)
    ? clips
    : (overlayDuration > 0 || label ? [{
        id: 'overlay-default',
        type: 'badge',
        value: label,
        label: label,
        name: label,
        start: overlayStart,
        duration: overlayDuration,
        lane: 0,
      }] : []);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; clipId: string } | null>(null);
  const [colorLabels, setColorLabels] = useState<Record<string, string>>({});

  const actualTrackHeight = trackHeight ?? 40;

  const handleColorLabel = useCallback((clipId: string, color: string) => {
    setColorLabels((prev) => ({ ...prev, [clipId]: color }));
    onColorLabel?.(color);
  }, [onColorLabel]);

  const handleCopyTimings = useCallback((clip: TimelineOverlayClip) => {
    const text = `Start: ${clip.start.toFixed(2)}s | Duration: ${clip.duration.toFixed(2)}s | End: ${(clip.start + clip.duration).toFixed(2)}s`;
    navigator.clipboard.writeText(text).catch(() => {});
    onCopyTimings?.();
  }, [onCopyTimings]);

  return (
    <div
      className="box-border border-b border-[#242426] p-1 relative flex items-center w-full transition-all"
      style={{ height: `${actualTrackHeight}px` }}
    >
      {effectiveClips.map((clip) => {
        const isAllSelected = selectedClip?.track === 'overlay' && Boolean(selectedClip.all);
        const isSingleSelected = selectedClip?.track === 'overlay' && !selectedClip.all && (selectedClip.clipId === clip.id || (!selectedClip.clipId && effectiveClips.length === 1));
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
            className={`timeline-clip-card rounded-md px-1.5 flex items-center justify-between transition-all border group select-none cursor-grab active:cursor-grabbing absolute overflow-hidden shadow-xs ${
              isSelected
                ? 'bg-[#0E2038] border-indigo-300 text-white z-20 ring-2 ring-indigo-300/80 shadow-lg'
                : overlayTrackVisible
                ? 'bg-[#0A1424]/90 hover:bg-[#0E1B31] border-indigo-500/35 text-indigo-100 hover:border-indigo-400/70 z-10'
                : 'bg-[#181818] border-[#2F2F2F] text-[#6B7280] opacity-40 z-10'
            }`}
            style={{
              left: `${(clip.start / totalDuration) * 100}%`,
              width: `${Math.max(0.01, Math.min(100, (clip.duration / totalDuration) * 100))}%`,
              minWidth: '4px',
              top: `${topPos}px`,
              height: `${laneHeight}px`,
            }}
            title={`Overlay Clip: "${clip.name || clip.label}" • Layer: ${clipLane + 1} • Start: ${(Number(clip.start) || 0).toFixed(1)}s, Dur: ${(Number(clip.duration) || 0).toFixed(1)}s. Drag anywhere to move, edge handles to trim.`}
          >
            {/* Left Trim Handle */}
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                if (onPointerDownTrimLeftClip) onPointerDownTrimLeftClip(e, clip);
                else onPointerDownTrimLeft?.(e);
              }}
              className="timeline-trim-handle-left bg-indigo-500/40 hover:bg-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity z-20"
              title="Drag to trim overlay start"
            >
              <div className="w-0.5 h-3 bg-indigo-200 rounded-full" />
            </div>

            {/* Clean Box Content: Icon + Title */}
            <div className="flex items-center gap-1.5 w-full min-w-0 overflow-hidden px-1.5 select-none z-10">
              <Layers className="w-3 h-3 text-indigo-300/90 shrink-0 pointer-events-none" />
              <span className="text-[10px] font-bold text-indigo-100 truncate tracking-tight flex-1 min-w-0 pointer-events-none">
                {clip.label || clip.name || 'Overlay Element'}
              </span>
            </div>

            {/* Right Trim Handle */}
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                if (onPointerDownTrimRightClip) onPointerDownTrimRightClip(e, clip);
                else onPointerDownTrimRight?.(e);
              }}
              className="timeline-trim-handle-right bg-indigo-500/40 hover:bg-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity z-20"
              title="Drag to trim overlay duration"
            >
              <div className="w-0.5 h-3 bg-indigo-200 rounded-full" />
            </div>
          </div>
        );
      })}

      {/* Right-click Context Menu */}
      {contextMenu && (
        <TimelineClipContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          trackType="overlay"
          isVisible={true}
          isHidden={!overlayTrackVisible}
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
          onHide={onHide}
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

export default OverlayTrackClip;
