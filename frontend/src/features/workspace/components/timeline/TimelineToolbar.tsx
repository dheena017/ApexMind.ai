import React, { useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Sliders,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Scissors,
  Plus,
  Trash2,
  Copy,
  Magnet,
  Keyboard,
} from 'lucide-react';
import { formatTime, SelectedClip, EnabledTracks, MIN_TIMELINE_ZOOM, MAX_TIMELINE_ZOOM } from './timelineTypes';
import { TimelineAddTrackMenu } from './TimelineAddTrackMenu';

export interface TimelineToolbarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeTracksCount?: number;
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
  onZoomFit: () => void;
}

export const TimelineToolbar: React.FC<TimelineToolbarProps> = ({
  isCollapsed,
  onToggleCollapse,
  activeTracksCount = 0,
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
  onZoomFit,
}) => {
  const hasSelection = Boolean(selectedClip);
  const addTrackAnchorRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-wrap items-center justify-between px-2.5 py-1 bg-[#171717] border-b border-[#262626] gap-1.5">
      {/* Left: Title, Track Indicators & Editing Tools */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1 rounded text-[#9CA3AF] hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand Timeline' : 'Collapse Timeline'}
          aria-label={isCollapsed ? 'Expand timeline' : 'Collapse timeline'}
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <div className="flex items-center gap-1.5 mr-1">
          <span className="text-xs font-bold text-white tracking-wider uppercase flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#3B82F6]" />
            Timeline
          </span>
          <span
            className="hidden sm:inline-block text-[10px] font-mono-studio text-[#9CA3AF] bg-[#222222] px-1.5 py-0.5 rounded"
            title="Tracks containing content"
          >
            {activeTracksCount} Tracks
          </span>
        </div>

        <div className="h-4 w-px bg-[#333333] mx-1" />

        {/* ── Action Tools: Split, Duplicate, Delete ── */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onSplitClip}
            disabled={!hasSelection}
            className={`h-5 w-5 inline-flex items-center justify-center rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#60A5FA] ${
              hasSelection
                ? 'text-[#B8B8C0] hover:text-white hover:bg-white/8'
                : 'text-[#52525B] opacity-40 cursor-not-allowed'
            }`}
            title={hasSelection ? 'Split selected clip at playhead position (S or Ctrl+B)' : 'Select a clip to split'}
            aria-label="Split selected clip at playhead"
          >
            <Scissors className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={onDuplicateClip}
            disabled={!hasSelection}
            className={`h-5 w-5 inline-flex items-center justify-center rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#60A5FA] ${
              hasSelection
                ? 'text-[#B8B8C0] hover:text-white hover:bg-white/8'
                : 'text-[#52525B] opacity-40 cursor-not-allowed'
            }`}
            title={hasSelection ? 'Duplicate selected clip (Ctrl+D)' : 'Select a clip to duplicate'}
            aria-label="Duplicate selected clip"
          >
            <Copy className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={onDeleteClip}
            disabled={!hasSelection}
            className={`h-5 w-5 inline-flex items-center justify-center rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400 ${
              hasSelection
                ? 'text-[#D28A8A] hover:text-red-200 hover:bg-red-950/40'
                : 'text-[#52525B] opacity-40 cursor-not-allowed'
            }`}
            title={hasSelection ? 'Delete selected clip (Delete or Backspace)' : 'Select a clip to delete'}
            aria-label="Delete selected clip"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        <div className="h-4 w-px bg-[#333333] mx-1" />

        {/* ── Add Track & Add Subtitle Cue ── */}
        <div className="flex items-center gap-1 relative">
          <div ref={addTrackAnchorRef} className="relative">
            <button
              type="button"
              onClick={onToggleAddTrackMenu}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[#D4D4D8] hover:text-white hover:bg-white/[0.04] border border-[#3A3A3A] transition-colors cursor-pointer"
              title="Add track from Left Panel categories"
              aria-label="Add track"
              aria-expanded={addTrackMenuOpen}
            >
              <Plus className="w-3 h-3 text-[#D4D4D8]" />
              <span className="text-[10px] font-mono-studio">Add Track</span>
            </button>
            <TimelineAddTrackMenu
              isOpen={addTrackMenuOpen}
              onClose={onCloseAddTrackMenu}
              anchorRef={addTrackAnchorRef}
              onEnableTrack={onEnableTrack}
            />
          </div>

          <button
            type="button"
            onClick={onAddCaption}
            disabled={captionsTrackLocked}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs text-[#D4D4D8] hover:text-white hover:bg-white/[0.04] border border-[#3A3A3A] transition-colors cursor-pointer disabled:opacity-40"
            title="Add subtitle cue at current playhead (+)"
            aria-label="Add subtitle cue at playhead"
          >
            <Plus className="w-3 h-3 text-[#D4D4D8]" />
            <span className="text-[10px] font-mono-studio">Cue</span>
          </button>

          {/* Magnetic Snapping Toggle */}
          <button
            type="button"
            onClick={onToggleSnap}
            className={`p-0.5 rounded transition-colors cursor-pointer ml-0.5 ${
              snapEnabled
                ? 'text-white bg-white/[0.05] border border-[#3A3A3A]'
                : 'text-[#6B7280] hover:text-[#9CA3AF] hover:bg-white/[0.04] border border-transparent'
            }`}
            title={snapEnabled ? 'Magnetic snapping ON' : 'Magnetic snapping OFF'}
            aria-label={snapEnabled ? 'Disable magnetic snapping' : 'Enable magnetic snapping'}
            aria-pressed={snapEnabled}
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
          aria-label="Jump to start"
        >
          <RotateCcw className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={onTogglePlay}
          className="w-6 h-6 rounded-full bg-[#3B82F6] hover:bg-[#2563EB] text-white flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
          title={isPlaying ? 'Pause Timeline (Space)' : 'Play Timeline (Space)'}
          aria-label={isPlaying ? 'Pause timeline' : 'Play timeline'}
        >
          {isPlaying ? (
            <Pause className="w-3 h-3 fill-white" />
          ) : (
            <Play className="w-3 h-3 fill-white ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onSeek(totalDuration)}
          className="p-1 rounded text-[#9CA3AF] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          title="Jump to End"
          aria-label="Jump to end"
        >
          <SkipForward className="w-3 h-3" />
        </button>

        {/* Time Readout */}
        <div className="whitespace-nowrap tabular-nums px-2 py-0.5 rounded-md bg-[#0F0F0F] border border-[#2F2F2F] text-[10px] font-mono-studio text-white" aria-label={`Current time ${formatTime(currentTime)} of ${formatTime(totalDuration)}`}>
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
      <div className="flex items-center gap-1">
        <div className="flex items-center bg-[#0F0F0F] border border-[#2F2F2F] rounded-lg p-0.5 text-[#9CA3AF]">
          <button
            type="button"
            onClick={onZoomFit}
            disabled={zoomLevel === 1}
            className="p-0.5 hover:text-white disabled:opacity-30 cursor-pointer"
            title="Fit full project in timeline"
            aria-label="Fit timeline to project"
          >
            <Maximize2 className="w-2.5 h-2.5" />
          </button>
          <button
            type="button"
            onClick={onZoomOut}
            disabled={zoomLevel <= MIN_TIMELINE_ZOOM}
            className="p-0.5 hover:text-white disabled:opacity-30 cursor-pointer"
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-2.5 h-2.5" />
          </button>
          <span className="whitespace-nowrap text-[9px] font-mono-studio px-0.5 text-white" aria-label={`Zoom level ${zoomLevel}x`}>{zoomLevel}x</span>
          <button
            type="button"
            onClick={onZoomIn}
            disabled={zoomLevel >= MAX_TIMELINE_ZOOM}
            className="p-0.5 hover:text-white disabled:opacity-30 cursor-pointer"
            title="Zoom In"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-2.5 h-2.5" />
          </button>
        </div>
        <button
          type="button"
          popoverTarget="timeline-shortcuts"
          className="p-1 rounded text-[#9CA3AF] hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
          title="Keyboard shortcuts"
          aria-label="Show keyboard shortcuts"
        >
          <Keyboard className="w-3 h-3" />
        </button>
        <div
          id="timeline-shortcuts"
          popover="auto"
          role="dialog"
          aria-labelledby="timeline-shortcuts-title"
          className="fixed bottom-4 right-4 m-0 w-56 rounded-lg border border-[#343434] bg-[#171717] p-3 text-[#E5E5E5] shadow-2xl"
        >
          <h3 id="timeline-shortcuts-title" className="mb-2 text-[11px] font-semibold text-white">
            Keyboard Shortcuts
          </h3>
          <div className="space-y-1.5 text-[10px]">
            {[
              ['Play / pause', 'Space'],
              ['Seek', '\u2190 / \u2192'],
              ['Split', 'S / Ctrl+B'],
              ['Duplicate', 'Ctrl+D'],
              ['Delete clip', 'Del / Backspace'],
              ['Deselect / close menus', 'Esc'],
            ].map(([action, shortcut]) => (
              <div key={action} className="flex items-center justify-between gap-3">
                <span className="text-[#A1A1AA]">{action}</span>
                <kbd className="whitespace-nowrap rounded border border-[#3A3A3A] bg-[#0F0F0F] px-1.5 py-0.5 font-mono-studio text-[#E5E5E5]">
                  {shortcut}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineToolbar;
