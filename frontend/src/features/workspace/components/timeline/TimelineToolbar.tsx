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
  const hasSelection = Boolean(selectedClip);

  return (
    <div className="flex flex-wrap items-center justify-between px-3.5 py-1.5 bg-[#171717] border-b border-[#262626] gap-2">
      {/* Left: Title, Track Indicators & Editing Tools */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1 rounded text-[#9CA3AF] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand Timeline' : 'Collapse Timeline'}
        >
          {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <div className="flex items-center gap-1.5 mr-1">
          <span className="text-xs font-bold text-white tracking-wider uppercase flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#3B82F6]" />
            Timeline
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono-studio text-[#9CA3AF] bg-[#222222] px-1.5 py-0.5 rounded">
            {activeCompoundsCount} Clips
          </span>
        </div>

        <div className="h-4 w-px bg-[#333333] mx-1" />

        {/* ── Action Tools: Split, Duplicate, Delete ── */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onSplitClip}
            disabled={!hasSelection}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
              hasSelection
                ? 'text-[#E5E5E5] hover:text-white hover:bg-white/[0.04] border border-[#3A3A3A]'
                : 'text-[#52525B] opacity-40 cursor-not-allowed border border-transparent'
            }`}
            title="Split selected clip at playhead position (S or Ctrl+B)"
          >
            <Scissors className="w-3 h-3 text-[#D4D4D8]" />
            <span className="text-[11px] font-mono-studio">Split</span>
          </button>

          <button
            type="button"
            onClick={onDuplicateClip}
            disabled={!hasSelection}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
              hasSelection
                ? 'text-[#E5E5E5] hover:text-white hover:bg-white/[0.04] border border-[#3A3A3A]'
                : 'text-[#52525B] opacity-40 cursor-not-allowed border border-transparent'
            }`}
            title="Duplicate selected clip (Ctrl+D)"
          >
            <Copy className="w-3 h-3 text-[#D4D4D8]" />
            <span className="text-[11px] font-mono-studio">Duplicate</span>
          </button>

          <button
            type="button"
            onClick={onDeleteClip}
            disabled={!hasSelection}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
              hasSelection
                ? 'text-[#F5F5F5] hover:text-white hover:bg-[#2A1A1A] border border-[#4A2A2A]'
                : 'text-[#52525B] opacity-40 cursor-not-allowed border border-transparent'
            }`}
            title="Delete selected clip (Delete or Backspace)"
          >
            <Trash2 className="w-3 h-3 text-[#F5A5A5]" />
            <span className="text-[11px] font-mono-studio">Delete</span>
          </button>
        </div>

        <div className="h-4 w-px bg-[#333333] mx-1" />

        {/* ── Add Track & Add Subtitle Cue ── */}
        <div className="flex items-center gap-1 relative">
          <div className="relative">
            <button
              type="button"
              onClick={onToggleAddTrackMenu}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[#D4D4D8] hover:text-white hover:bg-white/[0.04] border border-[#3A3A3A] transition-colors cursor-pointer"
              title="Add track from Left Panel categories"
            >
              <Plus className="w-3 h-3 text-[#D4D4D8]" />
              <span className="text-[11px] font-mono-studio">Track</span>
            </button>
            <TimelineAddTrackMenu
              isOpen={addTrackMenuOpen}
              onClose={onCloseAddTrackMenu}
              onEnableTrack={onEnableTrack}
            />
          </div>

          <button
            type="button"
            onClick={onAddCaption}
            disabled={captionsTrackLocked}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[#D4D4D8] hover:text-white hover:bg-white/[0.04] border border-[#3A3A3A] transition-colors cursor-pointer disabled:opacity-40"
            title="Add subtitle cue at current playhead (+)"
          >
            <Plus className="w-3 h-3 text-[#D4D4D8]" />
            <span className="text-[11px] font-mono-studio">Cue</span>
          </button>

          {/* Magnetic Snapping Toggle */}
          <button
            type="button"
            onClick={onToggleSnap}
            className={`p-1 rounded transition-colors cursor-pointer ml-0.5 ${
              snapEnabled
                ? 'text-white bg-white/[0.05] border border-[#3A3A3A]'
                : 'text-[#6B7280] hover:text-[#9CA3AF] hover:bg-white/[0.04] border border-transparent'
            }`}
            title={snapEnabled ? 'Magnetic snapping ON' : 'Magnetic snapping OFF'}
          >
            <Magnet className="w-3.5 h-3.5" />
          </button>
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
