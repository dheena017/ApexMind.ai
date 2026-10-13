import React from 'react';
import { Film } from 'lucide-react';
import { formatTime, SelectedClip } from './timelineTypes';
import { FilmstripTrackBackground } from './FilmstripTrackBackground';

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
}) => {
  const isSelected = selectedClip?.track === 'video';

  return (
    <div className="h-10 border-b border-[#262626] p-1 relative flex items-center">
      <div
        onClick={onSelect}
        onPointerDown={onPointerDownMove}
        className={`h-full rounded-md px-2.5 flex items-center justify-between transition-colors border group select-none cursor-grab active:cursor-grabbing relative overflow-hidden ${
          isSelected
            ? 'timeline-clip-selected-amber bg-amber-950/70 border-amber-500 text-amber-100 z-20 ring-2 ring-amber-500/80 shadow-lg'
            : videoTrackVisible
            ? 'bg-amber-950/40 border-amber-600/40 text-amber-200 hover:border-amber-500 z-10'
            : 'bg-[#181818] border-[#2F2F2F] text-[#6B7280] opacity-40 z-10'
        }`}
        style={{
          left: `${(videoStart / totalDuration) * 100}%`,
          width: `${Math.min(100, (videoDuration / totalDuration) * 100)}%`,
        }}
        title="Video Track: Drag to reposition video clip. Drag left/right handles to trim."
      >
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
            {backdropName || 'Dark Mountain Dawn'} (9:16 Video Filmstrip)
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
    </div>
  );
};

export default VideoTrackClip;
