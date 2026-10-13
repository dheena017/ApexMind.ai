import React from 'react';
import { Zap } from 'lucide-react';
import { formatTime, SelectedClip } from './timelineTypes';

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
}) => {
  const isSelected = selectedClip?.track === 'overlay';

  return (
    <div className="h-10 border-b border-[#262626] p-1 relative flex items-center">
      <div
        onClick={onSelect}
        onPointerDown={onPointerDownMove}
        className={`h-full rounded-md px-2.5 flex items-center justify-between transition-colors border group select-none cursor-grab active:cursor-grabbing relative overflow-hidden ${
          isSelected
            ? 'bg-indigo-950/70 border-indigo-500 text-indigo-100 z-20 ring-2 ring-indigo-500/80 shadow-lg'
            : overlayTrackVisible
            ? 'bg-indigo-950/40 border-indigo-600/40 text-indigo-200 hover:border-indigo-500 z-10'
            : 'bg-[#181818] border-[#2F2F2F] text-[#6B7280] opacity-40 z-10'
        }`}
        style={{
          left: `${(overlayStart / totalDuration) * 100}%`,
          width: `${Math.min(100, (overlayDuration / totalDuration) * 100)}%`,
        }}
        title="Elements & Overlays Track: Badges, stickers, callouts"
      >
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
    </div>
  );
};

export default OverlayTrackClip;
