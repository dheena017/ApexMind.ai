import React, { useState } from 'react';
import { formatTime, SelectedClip, TimelineMediaClip } from './timelineTypes';
import { FilmstripTrackBackground } from './FilmstripTrackBackground';
import { TimelineClipContextMenu } from './TimelineClipContextMenu';

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
  const [hoveredClip, setHoveredClip] = useState<{ id: string; x: number; y: number; clip: TimelineMediaClip } | null>(null);

  const actualTrackHeight = trackHeight ?? 40;

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
            onPointerEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setHoveredClip({ id: clip.id, x: rect.left + rect.width / 2, y: rect.top, clip });
            }}
            onPointerLeave={() => setHoveredClip(null)}
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
            className={`timeline-clip-card rounded-md px-2.5 flex items-center justify-between transition-all border group select-none cursor-grab active:cursor-grabbing absolute overflow-hidden ${
              isSelected
                ? 'bg-[#1E293B]/80 border-amber-400 text-white z-20 shadow-md ring-1 ring-amber-400/50'
                : videoTrackVisible
                ? 'bg-[#111111]/75 border-[#333333] text-[#E5E5E5] hover:border-amber-500/70 z-10'
                : 'bg-[#181818] border-[#2F2F2F] text-[#6B7280] opacity-40 z-10'
            }`}
            style={{
              left: `${(clip.start / totalDuration) * 100}%`,
              width: `${Math.max(1.5, Math.min(100, (clip.duration / totalDuration) * 100))}%`,
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
            <FilmstripTrackBackground imageUrl={clip.url || mediaUrl} />

            {/* Left Trim Handle */}
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                if (onPointerDownTrimLeftClip) onPointerDownTrimLeftClip(e, clip);
                else onPointerDownTrimLeft?.(e);
              }}
              className="timeline-trim-handle-left bg-amber-500/40 hover:bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity z-20"
              title="Drag to trim video start point"
            >
              <div className="w-0.5 h-3 bg-amber-200 rounded-full" />
            </div>

            {/* Time Duration Badge Only */}
            <span className="ml-auto text-[9.5px] font-mono-studio text-amber-300 pointer-events-none px-1.5 py-0.5 font-bold z-10 bg-black/85 rounded-md backdrop-blur-xs shrink-0 border border-amber-500/30 shadow-md">
              {formatTime(clip.duration)}
            </span>

            {/* Right Trim Handle */}
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                if (onPointerDownTrimRightClip) onPointerDownTrimRightClip(e, clip);
                else onPointerDownTrimRight?.(e);
              }}
              className="timeline-trim-handle-right bg-amber-500/40 hover:bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity z-20"
              title="Drag to trim video end point"
            >
              <div className="w-0.5 h-3 bg-amber-200 rounded-full" />
            </div>
          </div>
        );
      })}

      {/* Floating Live Video Preview Tooltip on Timeline Clip Hover */}
      {hoveredClip && hoveredClip.clip.url && (
        <div
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full mb-3 bg-[#0A0A0A]/95 border border-amber-500/50 rounded-xl p-2 shadow-2xl backdrop-blur-md animate-fade-in w-52 flex flex-col gap-1.5"
          style={{ left: `${hoveredClip.x}px`, top: `${hoveredClip.y - 6}px` }}
        >
          <div className="w-full aspect-video rounded-lg overflow-hidden bg-black border border-white/10 relative shadow-inner">
            <video
              src={hoveredClip.clip.url}
              autoPlay
              muted
              loop
              playsInline
              crossOrigin="anonymous"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-1 left-1 bg-black/80 px-1.5 py-0.5 rounded text-[8px] font-mono-studio text-amber-300 font-extrabold flex items-center gap-1 border border-amber-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              TIMELINE PREVIEW
            </div>
            <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.2 rounded text-[8px] font-mono-studio text-white/90">
              {(Number(hoveredClip.clip.duration) || 0).toFixed(1)}s
            </div>
          </div>
          <div className="flex flex-col px-0.5">
            <span className="text-[11px] font-bold text-white truncate leading-tight">
              {hoveredClip.clip.name || 'Video Scene Cut'}
            </span>
            <div className="flex items-center justify-between mt-0.5 text-[9px] font-mono-studio text-zinc-400">
              <span>{formatTime(hoveredClip.clip.start)} → {formatTime(hoveredClip.clip.start + hoveredClip.clip.duration)}</span>
              <span className="text-amber-400/90 font-medium capitalize">{hoveredClip.clip.type || 'video'}</span>
            </div>
          </div>
        </div>
      )}

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
