import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { formatTime, SelectedClip } from './timelineTypes';
import { ImageStripBackground } from './ImageStripBackground';

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
}) => {
  const isSelected = selectedClip?.track === 'image';

  return (
    <div className="h-10 border-b border-[#262626] p-1 relative flex items-center">
      <div
        onClick={onSelect}
        onPointerDown={onPointerDownMove}
        className={`h-full rounded-md px-2.5 flex items-center justify-between transition-colors border group select-none cursor-grab active:cursor-grabbing relative overflow-hidden ${
          isSelected
            ? 'bg-rose-950/70 border-rose-500 text-rose-100 z-20 ring-2 ring-rose-500/80 shadow-lg'
            : imageTrackVisible
            ? 'bg-rose-950/40 border-rose-600/40 text-rose-200 hover:border-rose-500 z-10'
            : 'bg-[#181818] border-[#2F2F2F] text-[#6B7280] opacity-40 z-10'
        }`}
        style={{
          left: `${(imageStart / totalDuration) * 100}%`,
          width: `${Math.min(100, (imageDuration / totalDuration) * 100)}%`,
        }}
        title="Image Track: Displays photo backdrop with frame strip"
      >
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
    </div>
  );
};

export default ImageTrackClip;
