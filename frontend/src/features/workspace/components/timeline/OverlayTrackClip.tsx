import React, { useState, useCallback } from 'react';
import { Zap } from 'lucide-react';
import { formatTime, SelectedClip } from './timelineTypes';
import { TimelineClipContextMenu } from './TimelineClipContextMenu';

export interface OverlayTrackClipProps {
  overlayStart: number;
  overlayDuration: number;
  totalDuration: number;
  selectedClip?: SelectedClip | null;
  overlayTrackVisible: boolean;
  label?: string;
  onSelect: () => void;
  onPointerDownMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerDownTrimLeft: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerDownTrimRight: (e: React.PointerEvent<HTMLDivElement>) => void;
  // Context menu actions
  onDelete?: () => void;
  onDuplicate?: () => void;
  onSplit?: () => void;
  onHide?: () => void;
  onZoomToClip?: () => void;
  onColorLabel?: (color: string) => void;
  onCopyTimings?: () => void;
}

export const OverlayTrackClip: React.FC<OverlayTrackClipProps> = ({
  overlayStart,
  overlayDuration,
  totalDuration,
  selectedClip,
  overlayTrackVisible,
  label,
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
  const isSelected = selectedClip?.track === 'overlay';
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [colorLabel, setColorLabel] = useState<string>('');

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, [onSelect]);

  const handleColorLabel = useCallback((color: string) => {
    setColorLabel(color);
    onColorLabel?.(color);
  }, [onColorLabel]);

  const handleCopyTimings = useCallback(() => {
    const text = `Start: ${overlayStart.toFixed(2)}s | Duration: ${overlayDuration.toFixed(2)}s | End: ${(overlayStart + overlayDuration).toFixed(2)}s`;
    navigator.clipboard.writeText(text).catch(() => {});
    onCopyTimings?.();
  }, [overlayStart, overlayDuration, onCopyTimings]);

  return (
    <div className="h-10 border-b border-[#262626] p-1 relative flex items-center">
      <div
        onClick={onSelect}
        onPointerDown={onPointerDownMove}
        onContextMenu={handleContextMenu}
        className={`h-full rounded-md px-2.5 flex items-center justify-between transition-colors border group select-none cursor-grab active:cursor-grabbing relative overflow-hidden ${
          isSelected
            ? 'bg-[#1A1A1A] border-[#3A3A3A] text-white z-20 outline outline-1 outline-[#3A3A3A]'
            : overlayTrackVisible
            ? 'bg-[#1A1A1A]/80 border-[#2F2F2F] text-[#E5E5E5] hover:border-[#3A3A3A] z-10'
            : 'bg-[#181818] border-[#2F2F2F] text-[#6B7280] opacity-40 z-10'
        }`}
        style={{
          left: `${(overlayStart / totalDuration) * 100}%`,
          width: `${Math.min(100, (overlayDuration / totalDuration) * 100)}%`,
          ...(colorLabel ? { boxShadow: `inset 0 0 0 2px ${colorLabel}40, 0 0 0 1px ${colorLabel}` } : {}),
        }}
        title="Elements & Overlays Track: Badges, stickers, callouts. Right-click for options."
      >
        {/* Color Label Strip */}
        {colorLabel && (
          <div
            className="absolute top-0 left-0 right-0 h-0.5 z-30 rounded-t-md"
            style={{ background: colorLabel }}
          />
        )}

        {/* Left Trim Handle */}
        <div
          onPointerDown={onPointerDownTrimLeft}
          className="timeline-trim-handle-left bg-indigo-500/40 hover:bg-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity z-20"
        >
          <div className="w-0.5 h-3 bg-indigo-200 rounded-full" />
        </div>

        <div className="flex items-center gap-1.5 z-10">
          <Zap className="w-3 h-3 text-indigo-400 shrink-0" />
          <span className="text-[10px] font-mono-studio truncate font-medium pointer-events-none">
            {label || '⚡ RULE #1: Core Principle'}
          </span>
          <span className="text-[8px] font-mono-studio bg-indigo-500/20 text-indigo-300 px-1 py-0.2 rounded border border-indigo-500/30">
            [Element]
          </span>
        </div>

        <span className="text-[9px] font-mono-studio text-indigo-300 pointer-events-none pr-1.5 font-bold z-10">
          {formatTime(overlayDuration)}
        </span>

        {/* Right Trim Handle */}
        <div
          onPointerDown={onPointerDownTrimRight}
          className="timeline-trim-handle-right bg-indigo-500/40 hover:bg-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity z-20"
        >
          <div className="w-0.5 h-3 bg-indigo-200 rounded-full" />
        </div>
      </div>

      {/* Right-click Context Menu */}
      <TimelineClipContextMenu
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        trackType="overlay"
        isVisible={contextMenu !== null}
        isHidden={!overlayTrackVisible}
        onClose={() => setContextMenu(null)}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onSplit={onSplit}
        onHide={onHide}
        onZoomToClip={onZoomToClip}
        onColorLabel={handleColorLabel}
        onCopyTimings={handleCopyTimings}
      />
    </div>
  );
};

export default OverlayTrackClip;
