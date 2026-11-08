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
  Scissors,
  Plus,
  Trash2,
  Copy,
  Sparkles,
} from 'lucide-react';
import { formatTime, SelectedClip, EnabledTracks, MIN_TIMELINE_ZOOM, MAX_TIMELINE_ZOOM } from './timelineTypes';
import { TimelineAddTrackMenu } from './TimelineAddTrackMenu';

export interface TimelineToolbarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isExpandedHeight?: boolean;
  onToggleExpandedHeight?: () => void;
  activeTracksCount?: number;
  selectedClip?: SelectedClip | null;
  captionsTrackLocked?: boolean;
  onSplitClip: () => void;
  onDuplicateClip: () => void;
  onAddCaption?: () => void;
  onDeleteClip: () => void;
  snapEnabled?: boolean;
  onToggleSnap?: () => void;
  onSyncAudioAndCC?: () => void;
  hasAudioMismatch?: boolean;
  voiceDuration?: number;
  captionsEnd?: number;
  addTrackMenuOpen: boolean;
  onToggleAddTrackMenu: () => void;
  onCloseAddTrackMenu: () => void;
  enabledTracks?: EnabledTracks;
  onEnableTrack: (trackKey: keyof EnabledTracks, selected: SelectedClip, compound: 'video' | 'text' | 'voice' | 'music' | 'overlay') => void;
  onSeek: (time: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  totalDuration: number;
  projectDuration?: number;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onDurationChange?: (duration: number) => void;
}

export const TimelineToolbar: React.FC<TimelineToolbarProps> = ({
  activeTracksCount = 0,
  selectedClip,
  onSplitClip,
  onDuplicateClip,
  onDeleteClip,
  addTrackMenuOpen,
  onToggleAddTrackMenu,
  onCloseAddTrackMenu,
  enabledTracks,
  onEnableTrack,
  onSeek,
  isPlaying,
  onTogglePlay,
  currentTime,
  totalDuration,
  projectDuration,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomFit,
}) => {
  const hasSelection = Boolean(selectedClip);
  const displayDuration = projectDuration && projectDuration > 0 ? projectDuration : totalDuration;
  const anchorDesktopRef = useRef<HTMLDivElement>(null);
  const anchorMobileRef = useRef<HTMLDivElement>(null);

  const currentAnchorRef = {
    get current() {
      if (anchorMobileRef.current && anchorMobileRef.current.offsetParent !== null) {
        return anchorMobileRef.current;
      }
      return anchorDesktopRef.current;
    },
  };

  return (
    <div className="workspace-timeline-toolbar flex flex-col md:flex-row md:items-center md:justify-between px-2.5 sm:px-3 py-1.5 md:py-0 md:h-10 bg-[#121215] border-b border-[#222228] select-none min-w-0 w-full shrink-0 relative z-20 gap-1.5 md:gap-2">
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── DESKTOP VIEWPORT (Single Elegant Row with Centered Transport) ── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex items-center justify-between w-full h-full min-w-0">
        {/* 1. Desktop Left: Title & Editing Tools */}
        <div className="workspace-timeline-toolbar-main flex items-center gap-1.5 min-w-0 shrink-0">
          <div className="workspace-timeline-toolbar-heading flex items-center gap-1.5 mr-1 shrink-0">
            <span className="text-[11px] font-bold tracking-wider uppercase flex items-center gap-1 text-zinc-200">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>Timeline</span>
            </span>
            <span
              className="text-[9.5px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded-full"
              title="Tracks containing content"
            >
              {activeTracksCount} {activeTracksCount === 1 ? 'Track' : 'Tracks'}
            </span>
          </div>

          <div className="workspace-timeline-toolbar-divider h-3.5 w-px bg-zinc-800 mx-1 shrink-0" />

          {/* Action Tools: Split, Duplicate, Delete, Transitions */}
          <div className="workspace-timeline-toolbar-actions flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onSplitClip}
              disabled={!hasSelection}
              className={`h-7 w-7 inline-flex items-center justify-center rounded-lg border transition-all cursor-pointer shrink-0 ${
                hasSelection
                  ? 'border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 hover:text-white shadow-sm'
                  : 'border-transparent text-zinc-600 opacity-40 cursor-not-allowed'
              }`}
              title={hasSelection ? 'Split clip at playhead (S)' : 'Select a clip to split'}
              aria-label="Split selected clip at playhead"
            >
              <Scissors className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onDuplicateClip}
              disabled={!hasSelection}
              className={`h-7 w-7 inline-flex items-center justify-center rounded-lg border transition-all cursor-pointer shrink-0 ${
                hasSelection
                  ? 'border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 hover:text-white shadow-sm'
                  : 'border-transparent text-zinc-600 opacity-40 cursor-not-allowed'
              }`}
              title={hasSelection ? 'Duplicate clip' : 'Select a clip to duplicate'}
              aria-label="Duplicate selected clip"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onDeleteClip}
              disabled={!hasSelection}
              className={`h-7 w-7 inline-flex items-center justify-center rounded-lg border transition-all cursor-pointer shrink-0 ${
                hasSelection
                  ? 'border-red-900/50 bg-red-950/30 text-red-400 hover:bg-red-900/40 hover:border-red-700/60 shadow-sm'
                  : 'border-transparent text-zinc-600 opacity-40 cursor-not-allowed'
              }`}
              title={hasSelection ? 'Delete clip' : 'Select a clip to delete'}
              aria-label="Delete selected clip"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'transitions' }));
              }}
              className="h-7 px-2.5 inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:text-white hover:border-amber-500/40 hover:bg-zinc-800 shadow-sm transition-all cursor-pointer text-[10.5px] font-medium shrink-0"
              title="Open Transitions Studio"
              aria-label="Open Transitions Studio"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Transitions</span>
            </button>
          </div>
        </div>

        {/* 2. Desktop Center: Dedicated Transport Controls & Timecode Display */}
        <div className="workspace-timeline-toolbar-playback flex items-center gap-2 shrink-0 absolute left-1/2 -translate-x-1/2">
          <button
            type="button"
            onClick={() => onSeek(0)}
            className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            title="Jump to Start (00:00)"
            aria-label="Jump to start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Primary Hero Play / Pause Pill Button */}
          <button
            type="button"
            onClick={onTogglePlay}
            className="h-7 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/25 active:scale-95 transition-all cursor-pointer font-semibold text-[11px] shrink-0"
            title={isPlaying ? 'Pause Timeline (Space)' : 'Play Timeline (Space)'}
            aria-label={isPlaying ? 'Pause timeline' : 'Play timeline'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3 fill-current shrink-0" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current ml-0.5 shrink-0" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSeek(displayDuration)}
            className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            title={`Jump to End (${formatTime(displayDuration)})`}
            aria-label="Jump to end"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Time Readout: Playhead / Media Duration */}
          <div
            className="h-7 whitespace-nowrap tabular-nums px-2.5 rounded-lg bg-black/60 border border-zinc-800/80 font-mono text-[11px] text-zinc-200 flex items-center gap-1.5 shadow-inner select-none shrink-0"
            title={`Playhead: ${formatTime(currentTime)} | Duration: ${formatTime(displayDuration)}`}
            aria-label={`Current time ${formatTime(currentTime)} of ${formatTime(displayDuration)}`}
          >
            <span className="text-white font-bold">{formatTime(currentTime)}</span>
            <span className="text-zinc-600">/</span>
            <span className="text-blue-400 font-medium">{formatTime(displayDuration)}</span>
          </div>
        </div>

        {/* 3. Desktop Right: Add Track & Zoom Controls */}
        <div className="workspace-timeline-toolbar-secondary flex items-center gap-2 shrink-0 min-w-0">
          <div ref={anchorDesktopRef} className="relative shrink-0">
            <button
              type="button"
              onClick={onToggleAddTrackMenu}
              className="h-7 flex items-center gap-1.5 px-2.5 rounded-lg text-[10.5px] font-medium text-zinc-300 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer shadow-sm shrink-0"
              title="Add a new track from media categories"
              aria-label="Add track"
              aria-expanded={addTrackMenuOpen}
            >
              <Plus className="w-3 h-3 text-zinc-400" />
              <span>Add Track</span>
            </button>
          </div>

          <div className="workspace-timeline-toolbar-divider h-3.5 w-px bg-zinc-800 mx-0.5 shrink-0" />

          {/* Zoom Controls */}
          <div className="flex items-center h-7 bg-zinc-900/90 border border-zinc-800 rounded-lg p-0.5 text-zinc-400 shrink-0">
            <button
              type="button"
              onClick={onZoomFit}
              disabled={zoomLevel === 1}
              className="h-6 w-6 inline-flex items-center justify-center rounded hover:text-white hover:bg-zinc-800 disabled:opacity-30 cursor-pointer transition-colors"
              title="Fit full project in timeline"
              aria-label="Fit timeline to project"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={onZoomOut}
              disabled={zoomLevel <= MIN_TIMELINE_ZOOM}
              className="h-6 w-6 inline-flex items-center justify-center rounded hover:text-white hover:bg-zinc-800 disabled:opacity-30 cursor-pointer transition-colors"
              title="Zoom Out"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="whitespace-nowrap text-[9px] font-mono px-1.5 text-zinc-200 font-medium" aria-label={`Zoom level ${zoomLevel}x`}>
              {zoomLevel}x
            </span>
            <button
              type="button"
              onClick={onZoomIn}
              disabled={zoomLevel >= MAX_TIMELINE_ZOOM}
              className="h-6 w-6 inline-flex items-center justify-center rounded hover:text-white hover:bg-zinc-800 disabled:opacity-30 cursor-pointer transition-colors"
              title="Zoom In"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── MOBILE / NARROW VIEWPORT (Clean 2-Row Responsive Layout) ─────── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <div className="flex md:hidden flex-col w-full gap-2 min-w-0">
        {/* Mobile Row 1: Status & Strictly-Centered Transport & Timecode */}
        <div className="relative flex items-center justify-between w-full h-7.5 min-w-0">
          {/* Left: Heading & Track Count */}
          <div className="flex items-center gap-1.5 shrink-0 z-10">
            <span className="text-[11px] font-bold tracking-wider uppercase flex items-center gap-1 text-zinc-200">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>Timeline</span>
            </span>
            <span
              className="text-[9.5px] font-mono text-zinc-400 bg-[#18181B] border border-[#27272A] px-1.5 py-0.5 rounded-full"
              title="Tracks containing content"
            >
              {activeTracksCount} {activeTracksCount === 1 ? 'Track' : 'Tracks'}
            </span>
          </div>

          {/* Center: Playback Controls (Strictly Centered via absolute positioning) */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 shrink-0 z-20">
            <button
              type="button"
              onClick={() => onSeek(0)}
              className="h-7 w-7 inline-flex items-center justify-center rounded-lg bg-[#18181B] border border-[#27272A] hover:border-zinc-600 text-zinc-400 hover:text-white transition-colors cursor-pointer shadow-xs"
              title="Jump to Start (00:00)"
              aria-label="Jump to start"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onTogglePlay}
              className="h-7 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 active:scale-95 transition-all cursor-pointer font-semibold text-xs shrink-0"
              title={isPlaying ? 'Pause Timeline' : 'Play Timeline'}
              aria-label={isPlaying ? 'Pause timeline' : 'Play timeline'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3 h-3 fill-current shrink-0" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current ml-0.5 shrink-0" />
                  <span>Play</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onSeek(displayDuration)}
              className="h-7 w-7 inline-flex items-center justify-center rounded-lg bg-[#18181B] border border-[#27272A] hover:border-zinc-600 text-zinc-400 hover:text-white transition-colors cursor-pointer shadow-xs"
              title={`Jump to End (${formatTime(displayDuration)})`}
              aria-label="Jump to end"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: Timecode Readout */}
          <div
            className="h-7 whitespace-nowrap tabular-nums px-2.5 rounded-lg bg-[#18181B] border border-[#27272A] font-mono text-[10.5px] text-zinc-200 flex items-center gap-1.5 shadow-xs select-none shrink-0 z-10"
            title={`Playhead: ${formatTime(currentTime)} | Duration: ${formatTime(displayDuration)}`}
            aria-label={`Current time ${formatTime(currentTime)} of ${formatTime(displayDuration)}`}
          >
            <span className="text-white font-bold">{formatTime(currentTime)}</span>
            <span className="text-zinc-600">/</span>
            <span className="text-blue-400 font-medium">{formatTime(displayDuration)}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-[#1F1F24]" />

        {/* Mobile Row 2: Clip Tools & Track Management & Zoom */}
        <div className="flex items-center justify-between w-full h-7.5 min-w-0">
          {/* Left: Action Tools (Split, Duplicate, Delete, Transitions) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center bg-[#18181B] border border-[#27272A] rounded-lg p-0.5 shadow-xs">
              <button
                type="button"
                onClick={onSplitClip}
                disabled={!hasSelection}
                className={`h-6 w-6 inline-flex items-center justify-center rounded transition-all cursor-pointer ${
                  hasSelection
                    ? 'text-zinc-200 hover:text-white hover:bg-zinc-800'
                    : 'text-zinc-600 opacity-30 cursor-not-allowed'
                }`}
                title={hasSelection ? 'Split clip at playhead (S)' : 'Select a clip to split'}
                aria-label="Split selected clip at playhead"
              >
                <Scissors className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onDuplicateClip}
                disabled={!hasSelection}
                className={`h-6 w-6 inline-flex items-center justify-center rounded transition-all cursor-pointer ${
                  hasSelection
                    ? 'text-zinc-200 hover:text-white hover:bg-zinc-800'
                    : 'text-zinc-600 opacity-30 cursor-not-allowed'
                }`}
                title={hasSelection ? 'Duplicate clip' : 'Select a clip to duplicate'}
                aria-label="Duplicate selected clip"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onDeleteClip}
                disabled={!hasSelection}
                className={`h-6 w-6 inline-flex items-center justify-center rounded transition-all cursor-pointer ${
                  hasSelection
                    ? 'text-red-400 hover:text-red-300 hover:bg-red-950/60'
                    : 'text-zinc-600 opacity-30 cursor-not-allowed'
                }`}
                title={hasSelection ? 'Delete clip' : 'Select a clip to delete'}
                aria-label="Delete selected clip"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'transitions' }));
              }}
              className="h-7 px-2.5 inline-flex items-center gap-1.5 rounded-lg border border-[#27272A] bg-[#18181B] hover:border-amber-500/40 hover:bg-[#222226] text-zinc-300 hover:text-white shadow-xs transition-all cursor-pointer text-[10.5px] font-medium shrink-0"
              title="Open Transitions Studio"
              aria-label="Open Transitions Studio"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Transitions</span>
            </button>
          </div>

          {/* Right: Add Track + Zoom Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div ref={anchorMobileRef} className="relative shrink-0">
              <button
                type="button"
                onClick={onToggleAddTrackMenu}
                className="h-7 flex items-center gap-1.5 px-2.5 rounded-lg text-[10.5px] font-medium text-zinc-300 bg-[#18181B] border border-[#27272A] hover:bg-[#222226] hover:text-white hover:border-zinc-600 transition-all cursor-pointer shadow-xs shrink-0"
                title="Add a new track from media categories"
                aria-label="Add track"
                aria-expanded={addTrackMenuOpen}
              >
                <Plus className="w-3 h-3 text-zinc-400" />
                <span>Track</span>
              </button>
            </div>

            <div className="flex items-center h-7 bg-[#18181B] border border-[#27272A] rounded-lg p-0.5 text-zinc-400 shadow-xs shrink-0">
              <button
                type="button"
                onClick={onZoomFit}
                disabled={zoomLevel === 1}
                className="h-6 w-6 inline-flex items-center justify-center rounded hover:text-white hover:bg-zinc-800 disabled:opacity-30 cursor-pointer transition-colors"
                title="Fit full project in timeline"
                aria-label="Fit timeline to project"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={onZoomOut}
                disabled={zoomLevel <= MIN_TIMELINE_ZOOM}
                className="h-6 w-6 inline-flex items-center justify-center rounded hover:text-white hover:bg-zinc-800 disabled:opacity-30 cursor-pointer transition-colors"
                title="Zoom Out"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="whitespace-nowrap text-[9px] font-mono px-1.5 text-zinc-200 font-medium" aria-label={`Zoom level ${zoomLevel}x`}>
                {zoomLevel}x
              </span>
              <button
                type="button"
                onClick={onZoomIn}
                disabled={zoomLevel >= MAX_TIMELINE_ZOOM}
                className="h-6 w-6 inline-flex items-center justify-center rounded hover:text-white hover:bg-zinc-800 disabled:opacity-30 cursor-pointer transition-colors"
                title="Zoom In"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Shared Portal Dropdown for Add Track (automatically binds to active viewport button) */}
      <TimelineAddTrackMenu
        isOpen={addTrackMenuOpen}
        onClose={onCloseAddTrackMenu}
        anchorRef={currentAnchorRef}
        onEnableTrack={onEnableTrack}
        enabledTracks={enabledTracks}
      />
    </div>
  );
};

export default TimelineToolbar;
