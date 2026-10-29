import React, { useState } from 'react';
import { formatTime, SelectedClip, TimelineMediaClip } from './timelineTypes';
import { ImageStripBackground } from './ImageStripBackground';
import { TimelineClipContextMenu } from './TimelineClipContextMenu';

export interface ImageTrackClipProps {
  clips?: (TimelineMediaClip & { lane?: number })[];
  trackHeight?: number;
  laneHeight?: number;
  laneGap?: number;
  maxLane?: number;
  imageStart?: number;
  imageDuration?: number;
  totalDuration: number;
  selectedClip?: SelectedClip | null;
  imageTrackVisible: boolean;
  imageUrl?: string;
  imageName?: string;
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
}

export const ImageTrackClip: React.FC<ImageTrackClipProps> = ({
  clips,
  trackHeight,
  laneHeight = 32,
  laneGap = 4,
  imageStart = 0,
  imageDuration = 8,
  totalDuration,
  selectedClip,
  imageTrackVisible,
  imageUrl,
  imageName,
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
        const isSelected = selectedClip?.track === 'image' && (!selectedClip.clipId || selectedClip.clipId === clip.id);
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
            className={`timeline-clip-card rounded-md px-2.5 flex items-center justify-between transition-all border group select-none cursor-grab active:cursor-grabbing absolute overflow-hidden ${
              isSelected
                ? 'bg-[#1E293B] border-[#3A3A3A] text-white z-20'
                : imageTrackVisible
                ? 'bg-[#1A1A1A]/85 border-[#2F2F2F] text-[#E5E5E5] hover:border-[#3A3A3A] z-10'
                : 'bg-[#181818] border-[#2F2F2F] text-[#6B7280] opacity-40 z-10'
            }`}
            style={{
              left: `${(clip.start / totalDuration) * 100}%`,
              width: `${Math.max(0.01, Math.min(100, (clip.duration / totalDuration) * 100))}%`,
              minWidth: '4px',
              top: `${topPos}px`,
              height: `${laneHeight}px`,
              ...(colorLabel ? { boxShadow: `inset 0 0 0 2px ${colorLabel}40, 0 0 0 1px ${colorLabel}` } : {}),
            }}
            title={`Image Clip: "${clip.name}" • Layer: ${clipLane + 1} • Start: ${(Number(clip.start) || 0).toFixed(1)}s, Dur: ${(Number(clip.duration) || 0).toFixed(1)}s. Drag anywhere to move, edge handles to trim.`}
          >
            {/* Color Label Strip */}
            {colorLabel && (
              <div
                className="absolute top-0 left-0 right-0 h-0.5 z-30 rounded-t-md"
                style={{ background: colorLabel }}
              />
            )}

            {/* Photo Filmstrip Background */}
            <ImageStripBackground imageUrl={clip.url || imageUrl} />

            {/* Left Trim Handle */}
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                if (onPointerDownTrimLeftClip) onPointerDownTrimLeftClip(e, clip);
                else onPointerDownTrimLeft?.(e);
              }}
              className="timeline-trim-handle-left bg-rose-500/40 hover:bg-rose-400 opacity-0 group-hover:opacity-100 transition-opacity z-20"
              title="Drag to trim image start point"
            >
              <div className="w-0.5 h-3 bg-rose-200 rounded-full" />
            </div>

            {/* Small Time Duration Badge (Bottom-Right Corner) */}
            <span className="absolute bottom-1 right-2 text-[8.5px] font-mono-studio text-rose-300 pointer-events-none px-1.5 py-0.2 font-bold z-10 bg-black/80 rounded border border-rose-500/30 backdrop-blur-xs shadow-xs">
              {formatTime(clip.duration)}
            </span>

            {/* Right Trim Handle */}
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                if (onPointerDownTrimRightClip) onPointerDownTrimRightClip(e, clip);
                else onPointerDownTrimRight?.(e);
              }}
              className="timeline-trim-handle-right bg-rose-500/40 hover:bg-rose-400 opacity-0 group-hover:opacity-100 transition-opacity z-20"
              title="Drag to trim image end point"
            >
              <div className="w-0.5 h-3 bg-rose-200 rounded-full" />
            </div>
          </div>
        );
      })}

      {/* Right-click Context Menu */}
      {contextMenu && (
        <TimelineClipContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          trackType="image"
          isVisible={true}
          isHidden={!imageTrackVisible}
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
        />
      )}
    </div>
  );
};

export default ImageTrackClip;
