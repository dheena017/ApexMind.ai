import React, { useState, useEffect } from 'react';
import { formatTime, SelectedClip, TimelineMediaClip } from './timelineTypes';
import { FilmstripTrackBackground } from './FilmstripTrackBackground';
import { TimelineClipContextMenu } from './TimelineClipContextMenu';
import { TimelineTransitionButton } from './TimelineTransitionButton';
import { Film } from 'lucide-react';

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
  onDetach,
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
      if (!detail || detail.track !== 'video') return;
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

  const handleApplyTransition = (params: {
    clipId: string;
    transition?: string;
    transitionDuration?: number;
    animationIn?: string;
    animationInDuration?: number;
    animationOut?: string;
    animationOutDuration?: number;
    applyToAll?: boolean;
  }) => {
    setTransitionOverrides((prev) => {
      if (params.applyToAll && params.transition) {
        const nextState = { ...prev };
        effectiveClips.forEach((c) => {
          nextState[c.id] = {
            ...nextState[c.id],
            transition: params.transition,
            transitionDuration: params.transitionDuration ?? 0.5,
          };
        });
        return nextState;
      }
      return {
        ...prev,
        [params.clipId]: {
          ...prev[params.clipId],
          ...params,
        },
      };
    });

    window.dispatchEvent(
      new CustomEvent('workspace:update-clip-props', {
        detail: {
          track: 'video',
          ...params,
        },
      })
    );
  };

  const actualTrackHeight = trackHeight ?? 64;

  return (
    <div
      className="box-border border-b border-[#242426] p-1 relative flex items-center w-full transition-all"
      style={{ height: `${actualTrackHeight}px` }}
    >
      {effectiveClips.map((clip, idx) => {
        const isAllSelected = selectedClip?.track === 'video' && Boolean(selectedClip.all);
        const isSingleSelected = selectedClip?.track === 'video' && !selectedClip.all && (selectedClip.clipId === clip.id || (!selectedClip.clipId && effectiveClips.length === 1));
        const isSelected = isAllSelected || isSingleSelected;
        const colorLabel = clip.colorLabel || colorLabels[clip.id] || '';
        const clipLane = clip.lane ?? 0;
        const topPos = 4 + clipLane * (laneHeight + laneGap);

        const overrides = transitionOverrides[clip.id] || {};
        const activeTransition = overrides.transition !== undefined ? overrides.transition : clip.transition;
        const activeTransitionDuration = overrides.transitionDuration !== undefined ? overrides.transitionDuration : (clip.transitionDuration || 0.6);
        const activeAnimationIn = overrides.animationIn !== undefined ? overrides.animationIn : clip.animationIn;
        const activeAnimationInDuration = overrides.animationInDuration !== undefined ? overrides.animationInDuration : (clip.animationInDuration || 0.6);

        const prevClip = effectiveClips[idx - 1];
        const prevOverrides = prevClip ? (transitionOverrides[prevClip.id] || {}) : {};
        const prevTransition = prevOverrides.transition !== undefined ? prevOverrides.transition : prevClip?.transition;
        const prevTransitionDuration = prevOverrides.transitionDuration !== undefined ? prevOverrides.transitionDuration : (prevClip?.transitionDuration || 0.6);

        const nextClip = effectiveClips[idx + 1];

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
            className={`timeline-clip-card rounded-[7px] flex items-center justify-between transition-all group select-none cursor-grab active:cursor-grabbing absolute overflow-hidden ${
              isSelected
                ? 'bg-[#38260A] border-[2px] border-[#FACC15] text-white z-20 shadow-lg'
                : isAllSelected
                ? 'bg-[#38260A] border-[2px] border-amber-400 text-white z-20'
                : videoTrackVisible
                ? 'bg-[#241A08] hover:bg-[#30220A] border border-amber-500/30 text-amber-100 z-10'
                : 'bg-[#181818] border border-[#222226] text-[#6B7280] opacity-40 z-10'
            }`}
            style={{
              left: `${(clip.start / totalDuration) * 100}%`,
              width: `${Math.max(0.01, Math.min(100, (clip.duration / totalDuration) * 100))}%`,
              minWidth: '4px',
              top: `${topPos}px`,
              height: `${laneHeight}px`,
            }}
            title={`Video Clip: "${clip.name}" • Layer: ${clipLane + 1} • Start: ${(Number(clip.start) || 0).toFixed(1)}s, Dur: ${(Number(clip.duration) || 0).toFixed(1)}s.`}
          >
            {/* Frame-by-frame Video Filmstrip across the box */}
            <FilmstripTrackBackground
              imageUrl={clip.posterUrl || clip.thumbnailUrl || clip.url || mediaUrl || posterUrl}
              posterUrl={clip.posterUrl || clip.thumbnailUrl || posterUrl}
              videoUrl={clip.url || mediaUrl}
              count={Math.max(4, Math.min(14, Math.round((clip.duration || 3) * 2)))}
            />

            {/* ── 1. In-Animation / Entrance Highlight Zone (Exact Match to Image 2!) ── */}
            {activeAnimationIn && activeAnimationIn !== 'none' && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectClip) onSelectClip(clip.id); else onSelect?.();
                  window.dispatchEvent(new CustomEvent('workspace:open-inspector-tab', { detail: { compound: 'video', subTab: 'transitions', clipId: clip.id } }));
                  onOpenTransition?.(clip, undefined, 'in');
                }}
                style={{
                  width: `${Math.min(42, Math.max(14, (activeAnimationInDuration / (clip.duration || 1)) * 100))}%`,
                }}
                className="absolute left-0 top-0 bottom-0 z-15 bg-gradient-to-r from-amber-400/50 via-amber-400/35 to-amber-400/20 border-r border-amber-300/80 flex items-center pl-3.5 cursor-pointer hover:brightness-110 transition-all select-none"
                title={`Entrance In-Animation: ${activeAnimationIn} (${activeAnimationInDuration.toFixed(1)}s) • Click to edit`}
              >
                {/* Stepped gradient progression matching Image 2 */}
                <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-amber-400/20 pointer-events-none" />
              </div>
            )}

            {/* ── 2. Incoming Transition Overlap Wash from Preceding Clip (Exact Match to Image 1!) ── */}
            {prevClip && prevTransition && prevTransition !== 'none' && (
              <div
                style={{
                  width: `${Math.min(42, Math.max(14, (prevTransitionDuration / (clip.duration || 1)) * 100))}%`,
                }}
                className="absolute left-0 top-0 bottom-0 z-15 bg-amber-400/35 border-r border-amber-300/60 pointer-events-none transition-all select-none"
                title={`Incoming ${prevTransition} transition from ${prevClip.name}`}
              />
            )}

            {/* ── 3. Out-Transition Overlap Zone (Exact Match to Image 1!) ── */}
            {activeTransition && activeTransition !== 'none' && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectClip) onSelectClip(clip.id); else onSelect?.();
                  window.dispatchEvent(new CustomEvent('workspace:open-inspector-tab', { detail: { compound: 'video', subTab: 'transitions', clipId: clip.id } }));
                  onOpenTransition?.(clip, nextClip, 'transition');
                }}
                style={{
                  width: `${Math.min(45, Math.max(15, (activeTransitionDuration / (clip.duration || 1)) * 100))}%`,
                }}
                className="absolute right-0 top-0 bottom-0 z-15 bg-amber-400/45 border-l border-amber-300/80 flex items-center justify-end pr-3.5 cursor-pointer hover:brightness-110 transition-all select-none"
                title={`Scene Transition: ${activeTransition} (${activeTransitionDuration.toFixed(1)}s) • Click to edit`}
              >
                {/* Diagonal ramp notch at bottom-left corner matching Image 1 */}
                <div
                  className="absolute left-0 bottom-0 w-3 h-3 border-b-[2.5px] border-amber-300/90 pointer-events-none"
                  style={{ transform: 'rotate(-45deg) translate(-2px, 3px)' }}
                />
              </div>
            )}

            {/* ── 4. Left Trim Handle (Exact Match to Image 2!) ── */}
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                if (onPointerDownTrimLeftClip) onPointerDownTrimLeftClip(e, clip);
                else onPointerDownTrimLeft?.(e);
              }}
              className={`absolute left-0 top-0 bottom-0 w-3 flex items-center justify-center cursor-ew-resize rounded-l-[5px] z-30 select-none transition-all ${
                isSelected
                  ? 'bg-[#FACC15] shadow-sm opacity-100'
                  : 'bg-[#FACC15]/90 hover:bg-[#FACC15] opacity-0 group-hover:opacity-100'
              }`}
              title="Drag to trim video start point"
            >
              {/* Dark centered capsule slot matching Image 2 */}
              <div className="w-[2.5px] h-3.5 bg-[#18181B] rounded-full shrink-0" />
            </div>

            {/* Minimalist Floating Film Icon Badge */}
            <div className="z-20 ml-4 flex items-center justify-center p-1 rounded-sm bg-black/75 border border-white/15 backdrop-blur-xs pointer-events-none select-none shadow-xs">
              <Film className="w-2.5 h-2.5 text-amber-300" />
            </div>

            {/* ── 5. Right Trim Handle (Exact Match to Image 2!) ── */}
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                if (onPointerDownTrimRightClip) onPointerDownTrimRightClip(e, clip);
                else onPointerDownTrimRight?.(e);
              }}
              className={`absolute right-0 top-0 bottom-0 w-3 flex items-center justify-center cursor-ew-resize rounded-r-[5px] z-30 select-none transition-all ${
                isSelected
                  ? 'bg-[#FACC15] shadow-sm opacity-100'
                  : 'bg-[#FACC15]/90 hover:bg-[#FACC15] opacity-0 group-hover:opacity-100'
              }`}
              title="Drag to trim video end point"
            >
              {/* Dark centered capsule slot matching Image 2 */}
              <div className="w-[2.5px] h-3.5 bg-[#18181B] rounded-full shrink-0" />
            </div>
          </div>
        );
      })}

      {/* ── 6. Transition Seam Buttons Between Consecutive Clips (Exact Match to Image 1 & Image 2!) ── */}
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
            trackType="video"
            isVisible={true}
            isHidden={!videoTrackVisible}
            clipName={targetClip?.name || backdropName}
            startTime={Number(targetClip?.start) || 0}
            duration={Number(targetClip?.duration) || videoDuration}
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
            onDetach={onDetach}
          />
        );
      })()}
    </div>
  );
};

export default VideoTrackClip;
