import React, { useState, useEffect } from 'react';
import { formatTime, SelectedClip, TimelineMediaClip } from './timelineTypes';
import { FilmstripTrackBackground } from './FilmstripTrackBackground';
import { TimelineClipContextMenu } from './TimelineClipContextMenu';
import { TimelineTransitionButton, getTransitionConfig } from './TimelineTransitionButton';
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

const getTransitionWingStyle = (transId?: string) => {
  const cfg = getTransitionConfig(transId);
  return { bg: cfg.wingBg, border: cfg.wingBorder };
};

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
    animation?: string;
    animationIn?: string;
    animationInDuration?: number;
    animationOut?: string;
    animationOutDuration?: number;
  }>>({});

  // Sync transition and animation updates from workspace events
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.track !== 'video') return;
      if (detail.clipId) {
        setTransitionOverrides((prev) => ({
          ...prev,
          [detail.clipId]: {
            ...prev[detail.clipId],
            transition: detail.transition !== undefined ? detail.transition : prev[detail.clipId]?.transition,
            transitionDuration: detail.transitionDuration !== undefined ? detail.transitionDuration : prev[detail.clipId]?.transitionDuration,
            animationIn: detail.animationIn !== undefined ? detail.animationIn : prev[detail.clipId]?.animationIn,
            animationInDuration: detail.animationInDuration !== undefined ? detail.animationInDuration : prev[detail.clipId]?.animationInDuration,
            animationOut: detail.animationOut !== undefined ? detail.animationOut : prev[detail.clipId]?.animationOut,
            animationOutDuration: detail.animationOutDuration !== undefined ? detail.animationOutDuration : prev[detail.clipId]?.animationOutDuration,
          },
        }));
      } else {
        setTransitionOverrides((prev) => {
          const updated = { ...prev };
          effectiveClips.forEach((c) => {
            updated[c.id] = {
              ...updated[c.id],
              transition: detail.transition !== undefined ? detail.transition : updated[c.id]?.transition,
              transitionDuration: detail.transitionDuration !== undefined ? detail.transitionDuration : updated[c.id]?.transitionDuration,
              animationIn: detail.animationIn !== undefined ? detail.animationIn : updated[c.id]?.animationIn,
              animationInDuration: detail.animationInDuration !== undefined ? detail.animationInDuration : updated[c.id]?.animationInDuration,
              animationOut: detail.animationOut !== undefined ? detail.animationOut : updated[c.id]?.animationOut,
              animationOutDuration: detail.animationOutDuration !== undefined ? detail.animationOutDuration : updated[c.id]?.animationOutDuration,
            };
          });
          return updated;
        });
      }
    };

    const handlePreviewAnim = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || !detail.type) return;
      const targetClipId = (selectedClip && 'clipId' in selectedClip && selectedClip.clipId) ? selectedClip.clipId : effectiveClips[0]?.id;
      if (!targetClipId) return;

      setTransitionOverrides((prev) => ({
        ...prev,
        [targetClipId]: {
          ...prev[targetClipId],
          ...(detail.direction === 'in'
            ? { animationIn: detail.type, animationInDuration: detail.duration ?? 0.5 }
            : { animationOut: detail.type, animationOutDuration: detail.duration ?? 0.5 }),
        },
      }));
    };

    window.addEventListener('workspace:update-clip-props', handleUpdate);
    window.addEventListener('workspace:preview-clip-animation', handlePreviewAnim);
    return () => {
      window.removeEventListener('workspace:update-clip-props', handleUpdate);
      window.removeEventListener('workspace:preview-clip-animation', handlePreviewAnim);
    };
  }, [effectiveClips, selectedClip]);

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
        const clipLane = clip.lane ?? 0;
        const topPos = 4 + clipLane * (laneHeight + laneGap);

        // Outgoing transition to next clip (right side of this clip)
        const overrides = transitionOverrides[clip.id] || {};
        const activeTransition = overrides.transition !== undefined ? overrides.transition : clip.transition;
        const activeDuration = overrides.transitionDuration !== undefined ? overrides.transitionDuration : (clip.transitionDuration || 0.5);
        const nextClip = effectiveClips[idx + 1];
        const hasOutgoingTrans = Boolean(nextClip && activeTransition && activeTransition !== 'none');
        const outgoingWidth = hasOutgoingTrans ? Math.min(45, Math.max(8, ((activeDuration / 2) / (clip.duration || 1)) * 100)) : 0;
        const outgoingStyle = hasOutgoingTrans ? getTransitionWingStyle(activeTransition) : null;

        // Incoming transition from prev clip (left side of this clip)
        const prevClip = idx > 0 ? effectiveClips[idx - 1] : undefined;
        const prevOverrides = prevClip ? (transitionOverrides[prevClip.id] || {}) : {};
        const prevTransition = prevClip ? (prevOverrides.transition !== undefined ? prevOverrides.transition : prevClip.transition) : undefined;
        const prevDuration = prevClip ? (prevOverrides.transitionDuration !== undefined ? prevOverrides.transitionDuration : (prevClip.transitionDuration || 0.5)) : 0.5;
        const hasIncomingTrans = Boolean(prevClip && prevTransition && prevTransition !== 'none');
        const incomingWidth = hasIncomingTrans ? Math.min(45, Math.max(8, ((prevDuration / 2) / (clip.duration || 1)) * 100)) : 0;
        const incomingStyle = hasIncomingTrans ? getTransitionWingStyle(prevTransition) : null;

        // ── Animation In / Out / Combo Overlays (CapCut Style Visual Indicators) ──
        const animInType = overrides.animationIn !== undefined ? overrides.animationIn : clip.animationIn;
        const animInDuration = overrides.animationInDuration !== undefined ? overrides.animationInDuration : (clip.animationInDuration ?? 0.5);
        const hasAnimIn = Boolean(animInType && animInType !== 'none');
        const animInWidth = hasAnimIn ? Math.min(100, Math.max(1, (Number(animInDuration) / (Number(clip.duration) || 1)) * 100)) : 0;

        const animOutType = overrides.animationOut !== undefined ? overrides.animationOut : clip.animationOut;
        const animOutDuration = overrides.animationOutDuration !== undefined ? overrides.animationOutDuration : (clip.animationOutDuration ?? 0.5);
        const hasAnimOut = Boolean(animOutType && animOutType !== 'none');
        const animOutWidth = hasAnimOut ? Math.min(100, Math.max(1, (Number(animOutDuration) / (Number(clip.duration) || 1)) * 100)) : 0;

        const animComboType = overrides.animation !== undefined ? overrides.animation : clip.animation;
        const hasAnimCombo = Boolean(animComboType && animComboType !== 'none' && !hasAnimIn && !hasAnimOut);
        const activeColorLabel = colorLabels[clip.id] || (clip as any).colorLabel;

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
                ? 'bg-[#38260A] border-2 border-yellow-400 text-white z-20 shadow-lg ring-1 ring-yellow-400/30'
                : isAllSelected
                ? 'bg-[#38260A] border-[1.5px] border-amber-400/80 text-white z-20'
                : videoTrackVisible
                ? 'bg-[#241A08] hover:bg-[#30220A] border border-amber-500/25 text-amber-100 z-10'
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
            {/* Visual Color Label Top Accent Bar */}
            {activeColorLabel && (
              <div
                className="absolute top-0 left-0 right-0 h-1.5 z-25 pointer-events-none shadow-sm"
                style={{ backgroundColor: activeColorLabel }}
              />
            )}

            {/* Frame-by-frame Video Filmstrip across the box */}
            <FilmstripTrackBackground
              imageUrl={clip.posterUrl || clip.thumbnailUrl || clip.url || mediaUrl || posterUrl}
              posterUrl={clip.posterUrl || clip.thumbnailUrl || posterUrl}
              videoUrl={clip.url || mediaUrl}
              count={Math.max(4, Math.min(14, Math.round((clip.duration || 3) * 2)))}
            />

            {/* ── Transition Incoming Wing (Head of Right Clip) ── */}
            {hasIncomingTrans && incomingStyle && (
              <div
                style={{ width: `${incomingWidth}%` }}
                className={`absolute left-0 top-0 bottom-0 pointer-events-none select-none z-10 ${incomingStyle.bg} border-r ${incomingStyle.border} flex items-center overflow-hidden transition-all`}
              >
                <div className="absolute right-0 top-0 bottom-0 w-[1.5px] bg-white/40" />
                <svg className="absolute bottom-0 left-0 w-full h-[5px] opacity-35 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 10">
                  <line x1="0" y1="0" x2="100" y2="10" stroke="white" strokeWidth="1.5" />
                </svg>
              </div>
            )}

            {/* ── Transition Outgoing Wing (Tail of Left Clip) ── */}
            {hasOutgoingTrans && outgoingStyle && (
              <div
                style={{ width: `${outgoingWidth}%` }}
                className={`absolute right-0 top-0 bottom-0 pointer-events-none select-none z-10 ${outgoingStyle.bg} border-l ${outgoingStyle.border} flex items-center justify-end overflow-hidden transition-all`}
              >
                <div className="absolute left-0 top-0 bottom-0 w-[1.5px] bg-white/40" />
                <svg className="absolute bottom-0 left-0 w-full h-[5px] opacity-35 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 10">
                  <line x1="0" y1="10" x2="100" y2="0" stroke="white" strokeWidth="1.5" />
                </svg>
              </div>
            )}

{/* ── Animation In Indicator (Amber/Yellow Highlight Band from Left) ── */}
            {hasAnimIn && (
              <div
                style={{ width: `${animInWidth}%` }}
                className="absolute left-0 top-0 bottom-0 pointer-events-none select-none z-12 bg-amber-500/40 border-r border-amber-300/80 flex items-center overflow-hidden transition-all backdrop-brightness-110"
                title={`In Animation: ${animInType} (${Number(animInDuration).toFixed(1)}s)`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 via-amber-400/30 to-amber-500/40" />
                <div className="absolute right-0 top-0 bottom-0 w-[1.5px] bg-amber-300 shadow-[0_0_4px_rgba(251,191,36,0.8)]" />
              </div>
            )}

            {/* ── Animation Out Indicator (Amber/Yellow Highlight Band from Right) ── */}
            {hasAnimOut && (
              <div
                style={{ width: `${animOutWidth}%` }}
                className="absolute right-0 top-0 bottom-0 pointer-events-none select-none z-12 bg-amber-500/40 border-l border-amber-300/80 flex items-center justify-end overflow-hidden transition-all backdrop-brightness-110"
                title={`Out Animation: ${animOutType} (${Number(animOutDuration).toFixed(1)}s)`}
              >
                <div className="absolute inset-0 bg-gradient-to-l from-amber-400/20 via-amber-400/30 to-amber-500/40" />
                <div className="absolute right-0 top-0 bottom-0 w-[1.5px] bg-amber-300 shadow-[0_0_4px_rgba(251,191,36,0.8)]" />
              </div>
            )}

            {/* ── Combo Animation Indicator (Amber/Yellow Full Clip Overlay) ── */}
            {hasAnimCombo && (
              <div
                className="absolute inset-0 pointer-events-none select-none z-12 bg-amber-500/25 border-x border-amber-300/60 overflow-hidden transition-all backdrop-brightness-105"
                title={`Animation: ${animComboType}`}
              />
            )}

            {/* ── Left Trim Handle (Capsule handle with center notch when selected) ── */}
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                if (onPointerDownTrimLeftClip) onPointerDownTrimLeftClip(e, clip);
                else onPointerDownTrimLeft?.(e);
              }}
              className="absolute left-0 top-0 bottom-0 w-3 hover:w-3.5 flex items-center justify-center cursor-ew-resize z-25 group/handle select-none transition-all"
              title="Drag to trim video start point"
            >
              {isSelected ? (
                <div className="w-1.5 h-6 rounded-full bg-slate-100 border border-black/30 shadow-md flex items-center justify-center">
                  <div className="w-[1px] h-2.5 bg-slate-500 rounded-full" />
                </div>
              ) : (
                <div className="w-[2px] h-3.5 rounded-full bg-white/60 group-hover:bg-amber-300 transition-colors" />
              )}
            </div>

            {/* Minimalist Floating Film Icon Badge */}
            <div className="z-15 ml-5 flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-black/65 border border-white/10 backdrop-blur-xs pointer-events-none select-none shadow-xs">
              {activeColorLabel ? (
                <div className="w-2 h-2 rounded-full shrink-0 shadow-xs ring-1 ring-white/30" style={{ backgroundColor: activeColorLabel }} />
              ) : (
                <Film className="w-2.5 h-2.5 text-amber-300 shrink-0" />
              )}
              {typeof clip.aestheticScore === 'number' && clip.aestheticScore > 0 && (
                <span className="text-[8px] font-bold font-mono text-emerald-300">
                  ★{Math.round(clip.aestheticScore)}
                </span>
              )}
              {clip.aestheticBadges && clip.aestheticBadges.length > 0 && (
                <span className="text-[7.5px] font-bold text-amber-300/90 hidden sm:inline">
                  {clip.aestheticBadges[0]}
                </span>
              )}
            </div>

{/* ── Right Trim Handle (Capsule handle with center notch when selected) ── */}
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                if (onPointerDownTrimRightClip) onPointerDownTrimRightClip(e, clip);
                else onPointerDownTrimRight?.(e);
              }}
              className="absolute right-0 top-0 bottom-0 w-3 hover:w-3.5 flex items-center justify-center cursor-ew-resize z-25 group/handle select-none transition-all"
              title="Drag to trim video end point"
            >
              {isSelected ? (
                <div className="w-1.5 h-6 rounded-full bg-slate-100 border border-black/30 shadow-md flex items-center justify-center">
                  <div className="w-[1px] h-2.5 bg-slate-500 rounded-full" />
                </div>
              ) : (
                <div className="w-[2px] h-3.5 rounded-full bg-white/60 group-hover:bg-amber-300 transition-colors" />
              )}
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
            trackType="video"
            clipId={contextMenu.clipId}
            targetClip={targetClip}
            currentSpeed={targetClip?.speed || 1.0}
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
              window.dispatchEvent(
                new CustomEvent('workspace:update-clip-properties', {
                  detail: { track: 'video', clipId: contextMenu.clipId, colorLabel: color },
                })
              );
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
