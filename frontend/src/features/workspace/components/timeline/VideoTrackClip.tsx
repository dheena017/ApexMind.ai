import React, { useState } from 'react';
import { formatTime, SelectedClip, TimelineMediaClip } from './timelineTypes';
import { FilmstripTrackBackground } from './FilmstripTrackBackground';
import { TimelineClipContextMenu } from './TimelineClipContextMenu';
import { MoreHorizontal } from 'lucide-react';

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
      className="border-b border-[#262626] p-1 relative flex items-center w-full transition-all"
      style={{ height: `${actualTrackHeight}px` }}
    >
      {effectiveClips.map((clip) => {
        const isSelected = selectedClip?.track === 'video' && (!selectedClip.clipId || selectedClip.clipId === clip.id);
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
            className={`timeline-clip-card rounded-lg flex items-center justify-between transition-all border group select-none cursor-grab active:cursor-grabbing absolute overflow-hidden ${
              isSelected
                ? 'border-amber-400 text-white z-20 shadow-[0_0_14px_rgba(245,158,11,0.3)] ring-1.5 ring-amber-400/80'
                : videoTrackVisible
                ? 'border-[#2D2D33] hover:border-amber-400/60 text-[#E5E5E5] z-10'
                : 'border-[#222226] text-[#6B7280] opacity-40 z-10'
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

            {/* Filmstrip Repeating Background with Sprockets */}
            <FilmstripTrackBackground
              imageUrl={clip.posterUrl || clip.thumbnailUrl || clip.url || mediaUrl || posterUrl}
              posterUrl={clip.posterUrl || clip.thumbnailUrl || posterUrl}
              videoUrl={clip.url || mediaUrl}
            />

            {/* Left Trim Handle */}
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                if (onPointerDownTrimLeftClip) onPointerDownTrimLeftClip(e, clip);
                else onPointerDownTrimLeft?.(e);
              }}
              className="timeline-trim-handle-left bg-gradient-to-r from-amber-500/50 via-amber-500/20 to-transparent hover:from-amber-400/80 opacity-0 group-hover:opacity-100 transition-opacity z-20"
              title="Drag to trim video start point"
            >
              <div className="w-1 h-3.5 bg-amber-200 rounded-full shadow-xs" />
            </div>

            {/* Unified Floating Duration & 3-Dot Options Pill (Indented safely from right trim handle) */}
            <div
              className="absolute bottom-1 right-3.5 flex items-center gap-1.5 z-20 bg-black/85 hover:bg-black/95 border border-white/10 hover:border-amber-400/50 rounded-full px-2 py-0.5 backdrop-blur-md shadow-lg transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-[9px] font-mono-studio font-bold text-amber-300 tracking-tight pointer-events-none select-none">
                {formatTime(clip.duration)}
              </span>

              <div className="w-px h-2.5 bg-white/20" />

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectClip) onSelectClip(clip.id);
                  else onSelect?.();
                  const rect = e.currentTarget.getBoundingClientRect();
                  setContextMenu({ x: rect.left, y: rect.bottom + 6, clipId: clip.id });
                }}
                className="text-amber-200/70 hover:text-white transition-colors cursor-pointer flex items-center justify-center p-0.5 -mr-0.5 rounded-full hover:bg-white/10"
                title="Clip options & actions (...)"
                aria-label="Clip options"
              >
                <MoreHorizontal className="w-3 h-3" />
              </button>
            </div>

            {/* Right Trim Handle */}
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                if (onPointerDownTrimRightClip) onPointerDownTrimRightClip(e, clip);
                else onPointerDownTrimRight?.(e);
              }}
              className="timeline-trim-handle-right bg-gradient-to-l from-amber-500/50 via-amber-500/20 to-transparent hover:from-amber-400/80 opacity-0 group-hover:opacity-100 transition-opacity z-20"
              title="Drag to trim video end point"
            >
              <div className="w-1 h-3.5 bg-amber-200 rounded-full shadow-xs" />
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
