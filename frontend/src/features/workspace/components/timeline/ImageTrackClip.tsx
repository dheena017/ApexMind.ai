import React, { useState, useCallback } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { formatTime, SelectedClip } from './timelineTypes';
import { ImageStripBackground } from './ImageStripBackground';
import { TimelineClipContextMenu } from './TimelineClipContextMenu';

export interface ImageTrackClipProps {
  imageStart: number;
  imageDuration: number;
  totalDuration: number;
  selectedClip?: SelectedClip | null;
  imageTrackVisible: boolean;
  imageUrl?: string;
  imageName?: string;
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

export const ImageTrackClip: React.FC<ImageTrackClipProps> = ({
  imageStart,
  imageDuration,
  totalDuration,
  selectedClip,
  imageTrackVisible,
  imageUrl,
  imageName,
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
  const isSelected = selectedClip?.track === 'image';
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
    const text = `Start: ${imageStart.toFixed(2)}s | Duration: ${imageDuration.toFixed(2)}s | End: ${(imageStart + imageDuration).toFixed(2)}s`;
    navigator.clipboard.writeText(text).catch(() => {});
    onCopyTimings?.();
  }, [imageStart, imageDuration, onCopyTimings]);

  return (
    <div className="h-10 border-b border-[#262626] p-1 relative flex items-center">
      <div
        onClick={onSelect}
        onPointerDown={onPointerDownMove}
        onContextMenu={handleContextMenu}
        className={`h-full rounded-md px-2.5 flex items-center justify-between transition-colors border group select-none cursor-grab active:cursor-grabbing relative overflow-hidden ${
          isSelected
            ? 'bg-[#1A1A1A] border-[#3A3A3A] text-white z-20 outline outline-1 outline-[#3A3A3A]'
            : imageTrackVisible
            ? 'bg-[#1A1A1A]/80 border-[#2F2F2F] text-[#E5E5E5] hover:border-[#3A3A3A] z-10'
            : 'bg-[#181818] border-[#2F2F2F] text-[#6B7280] opacity-40 z-10'
        }`}
        style={{
          left: `${(imageStart / totalDuration) * 100}%`,
          width: `${Math.min(100, (imageDuration / totalDuration) * 100)}%`,
          ...(colorLabel ? { boxShadow: `inset 0 0 0 2px ${colorLabel}40, 0 0 0 1px ${colorLabel}` } : {}),
        }}
        title="Image Track: Displays photo backdrop with frame strip. Right-click for options."
      >
        {/* Color Label Strip */}
        {colorLabel && (
          <div
            className="absolute top-0 left-0 right-0 h-0.5 z-30 rounded-t-md"
            style={{ background: colorLabel }}
          />
        )}

        {/* Photo Filmstrip Background */}
        <ImageStripBackground imageUrl={imageUrl} />

        {/* Left Trim Handle */}
        <div
          onPointerDown={onPointerDownTrimLeft}
          className="timeline-trim-handle-left bg-rose-500/40 hover:bg-rose-400 opacity-0 group-hover:opacity-100 transition-opacity z-20"
        >
          <div className="w-0.5 h-3 bg-rose-200 rounded-full" />
        </div>

        <div className="flex items-center gap-1.5 z-10 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs">
          <ImageIcon className="w-3 h-3 text-rose-400 shrink-0" />
          <span className="text-[10px] font-mono-studio truncate font-medium pointer-events-none">
            {imageName || 'Image Frame'} (Still Graphic)
          </span>
        </div>

        <span className="text-[9px] font-mono-studio text-rose-300 pointer-events-none pr-1.5 font-bold z-10 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs">
          {formatTime(imageDuration)}
        </span>

        {/* Right Trim Handle */}
        <div
          onPointerDown={onPointerDownTrimRight}
          className="timeline-trim-handle-right bg-rose-500/40 hover:bg-rose-400 opacity-0 group-hover:opacity-100 transition-opacity z-20"
        >
          <div className="w-0.5 h-3 bg-rose-200 rounded-full" />
        </div>
      </div>

      {/* Right-click Context Menu */}
      <TimelineClipContextMenu
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        trackType="image"
        isVisible={contextMenu !== null}
        isHidden={!imageTrackVisible}
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

export default ImageTrackClip;
