import React, { useState, useCallback } from 'react';
import { Film } from 'lucide-react';
import { formatTime, SelectedClip } from './timelineTypes';
import { FilmstripTrackBackground } from './FilmstripTrackBackground';
import { TimelineClipContextMenu } from './TimelineClipContextMenu';

export interface VideoTrackClipProps {
  videoStart: number;
  videoDuration: number;
  totalDuration: number;
  selectedClip?: SelectedClip | null;
  videoTrackVisible: boolean;
  backdropName: string;
  mediaUrl?: string;
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
  onDetach?: () => void;
}

export const VideoTrackClip: React.FC<VideoTrackClipProps> = ({
  videoStart,
  videoDuration,
  totalDuration,
  selectedClip,
  videoTrackVisible,
  backdropName,
  mediaUrl,
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
  const isSelected = selectedClip?.track === 'video';
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
    const text = `Start: ${videoStart.toFixed(2)}s | Duration: ${videoDuration.toFixed(2)}s | End: ${(videoStart + videoDuration).toFixed(2)}s`;
    navigator.clipboard.writeText(text).catch(() => {});
    onCopyTimings?.();
  }, [videoStart, videoDuration, onCopyTimings]);

  return (
    <div className="h-10 border-b border-[#262626] p-1 relative flex items-center">
      <div
        onClick={onSelect}
        onPointerDown={onPointerDownMove}
        onContextMenu={handleContextMenu}
        className={`h-full rounded-md px-2.5 flex items-center justify-between transition-colors border group select-none cursor-grab active:cursor-grabbing relative overflow-hidden ${
          isSelected
            ? 'bg-[#1A1A1A] border-[#3A3A3A] text-white z-20 outline outline-1 outline-[#3A3A3A]'
            : videoTrackVisible
            ? 'bg-[#1A1A1A]/80 border-[#2F2F2F] text-[#E5E5E5] hover:border-[#3A3A3A] z-10'
            : 'bg-[#181818] border-[#2F2F2F] text-[#6B7280] opacity-40 z-10'
        }`}
        style={{
          left: `${(videoStart / totalDuration) * 100}%`,
          width: `${Math.min(100, (videoDuration / totalDuration) * 100)}%`,
          ...(colorLabel ? { boxShadow: `inset 0 0 0 2px ${colorLabel}40, 0 0 0 1px ${colorLabel}` } : {}),
        }}
        title="Video Track: Drag to reposition video clip. Drag left/right handles to trim. Right-click for options."
      >
        {/* Color Label Strip (top edge) */}
        {colorLabel && (
          <div
            className="absolute top-0 left-0 right-0 h-0.5 z-30 rounded-t-md"
            style={{ background: colorLabel }}
          />
        )}

        {/* Filmstrip Repeating Background with Sprockets */}
        <FilmstripTrackBackground imageUrl={mediaUrl} />

        {/* Left Trim Handle */}
        <div
          onPointerDown={onPointerDownTrimLeft}
          className="timeline-trim-handle-left bg-amber-500/40 hover:bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity z-20"
          title="Drag to trim video start point"
        >
          <div className="w-0.5 h-3 bg-amber-200 rounded-full" />
        </div>

        {/* Video Clip Label Overlay */}
        <div className="flex items-center gap-1.5 z-10 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs">
          <Film className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="text-[10px] font-mono-studio truncate font-medium pointer-events-none">
            {backdropName ? `${backdropName} (Video Track)` : (mediaUrl ? 'Custom Video Clip' : 'Video Clip')}
          </span>
        </div>

        <span className="text-[9px] font-mono-studio text-amber-300 pointer-events-none pr-1.5 font-bold z-10 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs">
          {formatTime(videoDuration)}
        </span>

        {/* Right Trim Handle */}
        <div
          onPointerDown={onPointerDownTrimRight}
          className="timeline-trim-handle-right bg-amber-500/40 hover:bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity z-20"
          title="Drag to trim video end point"
        >
          <div className="w-0.5 h-3 bg-amber-200 rounded-full" />
        </div>
      </div>

      {/* Right-click Context Menu */}
      <TimelineClipContextMenu
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        trackType="video"
        isVisible={contextMenu !== null}
        isHidden={!videoTrackVisible}
        onClose={() => setContextMenu(null)}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onSplit={onSplit}
        onHide={onHide}
        onZoomToClip={onZoomToClip}
        onColorLabel={handleColorLabel}
        onCopyTimings={handleCopyTimings}
        onDetach={onDetach}
      />
    </div>
  );
};

export default VideoTrackClip;
