import React, { useState } from 'react';
import { formatTime, SelectedClip, TimelineMediaClip } from './timelineTypes';
import { FilmstripTrackBackground } from './FilmstripTrackBackground';
import { TimelineClipContextMenu } from './TimelineClipContextMenu';
import { Film, MoreVertical } from 'lucide-react';

export interface VideoTrackClipProps {
  clips?: (TimelineMediaClip & { lane?: number })[];
  trackHeight?: number;
  laneHeight?: number;
  laneGap?: number;
  maxLane?: number;
  videoStart?: number;
  videoDuration?: number;
  totalDuration: number;
  selectedClip?: SelectedClip | null;
  videoTrackVisible: boolean;
  backdropName: string;
  mediaUrl?: string;
  posterUrl?: string;
  onSelectClip?: (clipId: string) => void;
  onPointerDownMoveClip?: (e: React.PointerEvent<HTMLDivElement>, clip: TimelineMediaClip) => void;
  onPointerDownTrimLeftClip?: (e: React.PointerEvent<HTMLDivElement>, clip: TimelineMediaClip) => void;
  onPointerDownTrimRightClip?: (e: React.PointerEvent<HTMLDivElement>, clip: TimelineMediaClip) => void;
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
  onDetach?: () => void;
}

export const VideoTrackClip: React.FC<VideoTrackClipProps> = ({
  clips,
  trackHeight,
  laneHeight = 32,
  laneGap = 4,
  videoStart = 0,
  videoDuration = 10,
  totalDuration,
  selectedClip,
  videoTrackVisible,
  backdropName,
  mediaUrl,
  posterUrl,
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
  onDetach,
}) => {
  const effectiveClips: (TimelineMediaClip & { lane?: number })[] = (clips && clips.length > 0)
    ? clips
    : [];

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; clipId: string } | null>(null);
  const [colorLabels, setColorLabels] = useState<Record<string, string>>({});

  const actualTrackHeight = trackHeight ?? 64;

  return (
    <div
      className="box-border border-b border-[#242426] p-1 relative flex items-center w-full transition-all"
      style={{ height: `${actualTrackHeight}px` }}
    >
      {effectiveClips.map((clip) => {
        const isAllSelected = selectedClip?.track === 'video' && Boolean(selectedClip.all);
        const isSingleSelected = selectedClip?.track === 'video' && !selectedClip.all && (selectedClip.clipId === clip.id || (!selectedClip.clipId && effectiveClips.length === 1));
        const isSelected = isAllSelected || isSingleSelected;
        const colorLabel = clip.colorLabel || colorLabels[clip.id] || '';
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
              isSingleSelected
                ? 'bg-[#38260A] border-amber-300 text-white z-20 ring-2 ring-amber-300/80 shadow-lg'
                : isAllSelected
                ? 'bg-[#38260A] border-amber-400/90 text-white z-20 ring-1 ring-amber-400/70 shadow-md'
                : videoTrackVisible
                ? 'bg-[#241A08]/90 hover:bg-[#30220A] border-amber-500/35 text-amber-100 hover:border-amber-400/70 z-10'
                : 'bg-[#181818] border-[#222226] text-[#6B7280] opacity-40 z-10'
            }`}
            style={{
              left: `${(clip.start / totalDuration) * 100}%`,
              width: `${Math.max(0.01, Math.min(100, (clip.duration / totalDuration) * 100))}%`,
              minWidth: '4px',
              top: `${topPos}px`,
              height: `${laneHeight}px`,
              ...(colorLabel ? { boxShadow: `inset 0 0 0 2px ${colorLabel}40, 0 0 0 1px ${colorLabel}` } : {}),
            }}
            title={`Video Clip: "${clip.name}" • Layer: ${clipLane + 1} • Start: ${(Number(clip.start) || 0).toFixed(1)}s, Dur: ${(Number(clip.duration) || 0).toFixed(1)}s. Drag anywhere to move, edge handles to trim.`}
          >
            {/* Color Label Strip (top edge) */}
            {colorLabel && (
              <div
                className="absolute top-0 left-0 right-0 h-0.5 z-30 rounded-t-md"
                style={{ background: colorLabel }}
              />
            )}



            {/* Frame-by-frame Video Filmstrip across the box */}
            <FilmstripTrackBackground
              imageUrl={clip.posterUrl || clip.thumbnailUrl || clip.url || mediaUrl || posterUrl}
              posterUrl={clip.posterUrl || clip.thumbnailUrl || posterUrl}
              videoUrl={clip.url || mediaUrl}
              count={Math.max(4, Math.min(14, Math.round((clip.duration || 3) * 2)))}
            />

            {/* Left Trim Handle */}
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                if (onPointerDownTrimLeftClip) onPointerDownTrimLeftClip(e, clip);
                else onPointerDownTrimLeft?.(e);
              }}
              className="timeline-trim-handle-left bg-amber-400/40 hover:bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity z-20"
              title="Drag to trim video start point"
            >
              <div className="w-0.5 h-3 bg-white rounded-full" />
            </div>

            {/* Floating Left: Minimalist Film Icon Badge (No words!) */}
            <div className="z-10 ml-1.5 flex items-center justify-center p-1 rounded-sm bg-black/75 border border-white/15 backdrop-blur-xs pointer-events-none select-none shadow-xs">
              <Film className="w-2.5 h-2.5 text-amber-300" />
            </div>



            {/* Right Trim Handle */}
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                if (onPointerDownTrimRightClip) onPointerDownTrimRightClip(e, clip);
                else onPointerDownTrimRight?.(e);
              }}
              className="timeline-trim-handle-right bg-amber-400/40 hover:bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity z-20"
              title="Drag to trim video end point"
            >
              <div className="w-0.5 h-3 bg-white rounded-full" />
            </div>
          </div>
        );
      })}

      {/* Right-click Context Menu */}
      {contextMenu && (
        <TimelineClipContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          trackType="video"
          isVisible={true}
          isHidden={!videoTrackVisible}
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
          onColorLabel={(color) => {
            setColorLabels((prev) => ({ ...prev, [contextMenu.clipId]: color }));
            onColorLabel?.(color);
          }}
          onCopyTimings={() => {
            const clip = effectiveClips.find((c) => c.id === contextMenu.clipId);
            if (clip) {
              const text = `Start: ${(Number(clip.start) || 0).toFixed(2)}s | Duration: ${(Number(clip.duration) || 0).toFixed(2)}s | End: {((Number(clip.start) || 0) + (Number(clip.duration) || 0)).toFixed(2)}s`;
              navigator.clipboard.writeText(text).catch(() => {});
            }
            onCopyTimings?.();
          }}
          onDetach={onDetach}
        />
      )}
    </div>
  );
};

export default VideoTrackClip;
