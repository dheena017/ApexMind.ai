import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  ChevronUp,
  Scissors,
  Plus,
  Trash2,
  Copy,
  Magnet,
} from 'lucide-react';
import { formatTime, SelectedClip, EnabledTracks } from './timelineTypes';
import { TimelineAddTrackMenu } from './TimelineAddTrackMenu';

export interface TimelineToolbarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeCompoundsCount?: number;
  selectedClip?: SelectedClip | null;
  captionsTrackLocked: boolean;
  onSplitClip: () => void;
  onDuplicateClip: () => void;
  onAddCaption: () => void;
  onDeleteClip: () => void;
  snapEnabled: boolean;
  onToggleSnap: () => void;
  addTrackMenuOpen: boolean;
  onToggleAddTrackMenu: () => void;
  onCloseAddTrackMenu: () => void;
  onEnableTrack: (trackKey: keyof EnabledTracks, selected: SelectedClip, compound: 'video' | 'text' | 'voice' | 'music' | 'overlay') => void;
  onSeek: (time: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  totalDuration: number;
  dragTooltip: string | null;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const TimelineToolbar: React.FC<TimelineToolbarProps> = ({
  isCollapsed,
  onToggleCollapse,
  activeCompoundsCount = 0,
  selectedClip,
  captionsTrackLocked,
  onSplitClip,
  onDuplicateClip,
  onAddCaption,
  onDeleteClip,
  snapEnabled,
  onToggleSnap,
  addTrackMenuOpen,
  onToggleAddTrackMenu,
  onCloseAddTrackMenu,
  onEnableTrack,
  onSeek,
  isPlaying,
  onTogglePlay,
  currentTime,
  totalDuration,
  dragTooltip,
  zoomLevel,
  onZoomIn,
  onZoomOut,
}) => {
  return (
    <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#171717] border-b border-[#262626]">
      {/* Left: Title, Track Indicators & Editing Tools */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1 rounded text-[#9CA3AF] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand Timeline' : 'Collapse Timeline'}
        >
          {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white tracking-wider uppercase flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#3B82F6]" />
            Studio Multi-Track Timeline
          </span>
          <span className="text-[10px] font-mono-studio text-[#60A5FA] bg-[#3B82F6]/15 px-1.5 py-0.2 rounded border border-[#3B82F6]/25">
            {activeCompoundsCount} Moveable Compounds
          </span>
        </div>
      </div>

      {/* Center: Playback & Scrub Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSeek(0)}
          className="p-1 rounded text-[#9CA3AF] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          title="Jump to Start (00:00)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onTogglePlay}
          className="w-7 h-7 rounded-full bg-[#3B82F6] hover:bg-[#2563EB] text-white flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
          title={isPlaying ? 'Pause Timeline (Space)' : 'Play Timeline (Space)'}
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-white" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
          )}
        </button>

        {/* Time Readout */}
        <div className="px-2.5 py-0.5 rounded-md bg-[#0F0F0F] border border-[#2F2F2F] text-[11px] font-mono-studio text-white">
          <span className="text-[#60A5FA] font-bold">{formatTime(currentTime)}</span>
          <span className="text-[#6B7280] mx-1">/</span>
          <span className="text-[#9CA3AF]">{formatTime(totalDuration)}</span>
        </div>

        {/* Live Dragging Tooltip */}
        {dragTooltip && (
          <span className="text-[10px] font-mono-studio bg-amber-500 text-black font-bold px-2 py-0.5 rounded shadow-lg animate-pulse">
            {dragTooltip}
          </span>
        )}
      </div>

      {/* Right: Zoom Level Controls */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center bg-[#0F0F0F] border border-[#2F2F2F] rounded-lg p-0.5 text-[#9CA3AF]">
          <button
            type="button"
            onClick={onZoomOut}
            disabled={zoomLevel <= 1}
            className="p-1 hover:text-white disabled:opacity-30 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="text-[10px] font-mono-studio px-1 text-white">{zoomLevel}x</span>
          <button
            type="button"
            onClick={onZoomIn}
            disabled={zoomLevel >= 3}
            className="p-1 hover:text-white disabled:opacity-30 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimelineToolbar;
