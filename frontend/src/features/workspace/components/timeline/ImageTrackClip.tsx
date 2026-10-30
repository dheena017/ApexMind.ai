import React, { useState, useEffect } from 'react';
import { formatTime, SelectedClip, TimelineMediaClip } from './timelineTypes';
import { ImageStripBackground } from './ImageStripBackground';
import { TimelineClipContextMenu } from './TimelineClipContextMenu';
import { TimelineTransitionButton } from './TimelineTransitionButton';
import { Image as ImageIcon } from 'lucide-react';

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
  onOpenTransition?: (clip: TimelineMediaClip, nextClip?: TimelineMediaClip, mode?: 'transition' | 'in' | 'out') => void;
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
  onOpenTransition,
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
  const [transitionOverrides, setTransitionOverrides] = useState<Record<string, {
    transition?: string;
    transitionDuration?: number;
    animationIn?: string;
    animationInDuration?: number;
    animationOut?: string;
    animationOutDuration?: number;
  }>>({});

  // Sync transition updates from workspace events
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.track !== 'image') return;
      if (detail.clipId) {
        setTransitionOverrides((prev) => ({
          ...prev,
          [detail.clipId]: {
            ...prev[detail.clipId],
            transition: detail.transition,
            transitionDuration: detail.transitionDuration,
            animationIn: detail.animationIn,
            animationInDuration: detail.animationInDuration,
            animationOut: detail.animationOut,
            animationOutDuration: detail.animationOutDuration,
          },
        }));
      }
      if (detail.applyToAll && detail.transition) {
        setTransitionOverrides((prev) => {
          const updated = { ...prev };
          effectiveClips.forEach((c) => {
            updated[c.id] = {
              ...updated[c.id],
              transition: detail.transition,
              transitionDuration: detail.transitionDuration ?? 0.5,
            };
          });
          return updated;
        });
      }
    };

    window.addEventListener('workspace:update-clip-props', handleUpdate);
    return () => window.removeEventListener('workspace:update-clip-props', handleUpdate);
  }, [effectiveClips]);

  const actualTrackHeight = trackHeight ?? 64;

  return (
    <div
      className="box-border border-b border-[#242426] p-1 relative flex items-center w-full transition-all"
      style={{ height: `${actualTrackHeight}px` }}
    >
      {effectiveClips.map((clip, idx) => {
        const isAllSelected = selectedClip?.track === 'image' && Boolean(selectedClip.all);
        const isSingleSelected = selectedClip?.track === 'image' && !selectedClip.all && (selectedClip.clipId === clip.id || (!selectedClip.clipId && effectiveClips.length === 1));
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
            className={`timeline-clip-card rounded-md flex items-center justify-between transition-all group select-none cursor-grab active:cursor-grabbing absolute overflow-hidden ${
              isSelected
                ? 'bg-[#380E21] border-[1.5px] border-rose-400 text-white z-20 shadow-md ring-1 ring-rose-400/20'
                : imageTrackVisible
                ? 'bg-[#240A14]/90 hover:bg-[#310E1D] border border-rose-500/30 text-rose-100 hover:border-rose-400/70 z-10'
                : 'bg-[#181818] border border-[#2F2F2F] text-[#6B7280] opacity-40 z-10'
            }`}
            style={{
              left: `${(clip.start / totalDuration) * 100}%`,
              width: `${Math.max(0.01, Math.min(100, (clip.duration / totalDuration) * 100))}%`,
              minWidth: '4px',
              top: `${topPos}px`,
              height: `${laneHeight}px`,
            }}
            title={`Image Clip: "${clip.name}" • Layer: ${clipLane + 1} • Start: ${(Number(clip.start) || 0).toFixed(1)}s, Dur: ${(Number(clip.duration) || 0).toFixed(1)}s.`}
          >
            {/* Optional Thumbnail Strip Background */}
            <ImageStripBackground
              imageUrl={clip.posterUrl || clip.thumbnailUrl || clip.url || imageUrl}
            />

            {/* ── Left Trim Handle (Clean, Native Website Theme) ── */}
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                if (onPointerDownTrimLeftClip) onPointerDownTrimLeftClip(e, clip);
                else onPointerDownTrimLeft?.(e);
              }}
              className="absolute left-0 top-0 bottom-0 w-2.5 hover:w-3 flex items-center justify-center cursor-ew-resize z-25 group/handle select-none transition-all"
              title="Drag to trim image start point"
            >
              <div className={`w-[2px] h-3.5 rounded-full transition-colors ${
                isSelected ? 'bg-rose-300' : 'bg-white/60 group-hover:bg-rose-300'
              }`} />
            </div>

            {/* Clean Box Content: Icon + Title */}
            <div className="flex items-center gap-1.5 w-full min-w-0 overflow-hidden px-1.5 ml-3 mr-3 select-none z-10">
              <ImageIcon className="w-3 h-3 text-rose-300/90 shrink-0 pointer-events-none" />
              <span className="text-[10px] font-bold text-rose-100 truncate tracking-tight flex-1 min-w-0 pointer-events-none">
                {clip.name || imageName || 'Image Clip'}
              </span>
            </div>

            {/* ── Right Trim Handle (Clean, Native Website Theme) ── */}
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                if (onPointerDownTrimRightClip) onPointerDownTrimRightClip(e, clip);
                else onPointerDownTrimRight?.(e);
              }}
              className="absolute right-0 top-0 bottom-0 w-2.5 hover:w-3 flex items-center justify-center cursor-ew-resize z-25 group/handle select-none transition-all"
              title="Drag to trim image end point"
            >
              <div className={`w-[2px] h-3.5 rounded-full transition-colors ${
                isSelected ? 'bg-rose-300' : 'bg-white/60 group-hover:bg-rose-300'
              }`} />
            </div>
          </div>
        );
      })}

      {/* ── Transition Seam Buttons Between Consecutive Clips ── */}
      {effectiveClips.map((clip, idx) => {
        const nextClip = effectiveClips[idx + 1];
        if (!nextClip) return null;
        const clipLane = clip.lane ?? 0;
        const topCenter = 4 + clipLane * (laneHeight + laneGap) + laneHeight / 2;
        const seamLeft = (nextClip.start / totalDuration) * 100;

        const overrides = transitionOverrides[clip.id] || {};
        const activeTransition = overrides.transition !== undefined ? overrides.transition : clip.transition;
        const activeDuration = overrides.transitionDuration !== undefined ? overrides.transitionDuration : (clip.transitionDuration || 0.5);

        return (
          <TimelineTransitionButton
            key={`trans-seam-${clip.id}-${nextClip.id}`}
            leftPercent={seamLeft}
            topPx={topCenter}
            activeTransition={activeTransition}
            duration={activeDuration}
            variant="seam"
            onClick={() => {
              if (onSelectClip) onSelectClip(clip.id); else onSelect?.();
              window.dispatchEvent(new CustomEvent('workspace:open-inspector-tab', { detail: { compound: 'video', subTab: 'transitions', clipId: clip.id } }));
              onOpenTransition?.(clip, nextClip, 'transition');
            }}
          />
        );
      })}

      {/* Right-click Context Menu */}
      {contextMenu && (() => {
        const targetClip = effectiveClips.find((c) => c.id === contextMenu.clipId);
        return (
          <TimelineClipContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            trackType="image"
            isVisible={true}
            isHidden={!imageTrackVisible}
            clipName={targetClip?.name || imageName || 'Image Clip'}
            startTime={Number(targetClip?.start) || 0}
            duration={Number(targetClip?.duration) || imageDuration}
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
              if (targetClip) {
                const text = `Start: ${(Number(targetClip.start) || 0).toFixed(2)}s | Duration: ${(Number(targetClip.duration) || 0).toFixed(2)}s | End: ${((Number(targetClip.start) || 0) + (Number(targetClip.duration) || 0)).toFixed(2)}s`;
                navigator.clipboard.writeText(text).catch(() => {});
              }
              onCopyTimings?.();
            }}
          />
        );
      })()}
    </div>
  );
};

export default ImageTrackClip;
