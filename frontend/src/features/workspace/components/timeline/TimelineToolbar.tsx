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
  Sparkles,
} from 'lucide-react';
import { formatTime, SelectedClip, EnabledTracks, MIN_TIMELINE_ZOOM, MAX_TIMELINE_ZOOM } from './timelineTypes';
import { TimelineAddTrackMenu } from './TimelineAddTrackMenu';

export interface TimelineToolbarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
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
  isCollapsed,
  onToggleCollapse,
  isExpandedHeight = false,
  onToggleExpandedHeight,
  activeTracksCount = 0,
  selectedClip,
  captionsTrackLocked,
  onSplitClip,
  onDuplicateClip,
  onAddCaption,
  onDeleteClip,
  snapEnabled,
  onToggleSnap,
  onSyncAudioAndCC,
  hasAudioMismatch = false,
  voiceDuration = 0,
  captionsEnd = 0,
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
  onDurationChange,
}) => {
  const hasSelection = Boolean(selectedClip);
  const displayDuration = projectDuration && projectDuration > 0 ? projectDuration : totalDuration;
  const addTrackAnchorRef = useRef<HTMLDivElement>(null);

  return (
    <div className="workspace-timeline-toolbar flex flex-nowrap items-center justify-between px-3 py-1.5 bg-[#121212] border-b border-[#242424] gap-3 overflow-x-auto select-none min-w-0">
      {/* Left: Title, Track Indicators, Editing Tools & Hero Playback Cluster */}
      <div className="workspace-timeline-toolbar-main flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1 rounded-md text-[#9CA3AF] hover:text-white hover:bg-[#26262C] transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand Timeline' : 'Collapse Timeline'}
          aria-label={isCollapsed ? 'Expand timeline' : 'Collapse timeline'}
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF]" />}
        </button>

        <div className="workspace-timeline-toolbar-heading flex items-center gap-1.5">
          <span className="text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5 text-white">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            Timeline
          </span>
          <span
            className="text-[9.5px] font-mono-studio text-slate-400 bg-[#1A1A1A] border border-[#2A2A2A] px-2 py-0.5 rounded-full"
            title="Tracks containing content"
          >
            {activeTracksCount} Tracks
          </span>
        </div>

        <div className="workspace-timeline-toolbar-divider h-4 w-px bg-[#262626] mx-0.5" />

        {/* ── Action Tools: Split, Duplicate, Delete ── */}
        <div className="workspace-timeline-toolbar-actions flex items-center gap-1">
          <button
            type="button"
            onClick={onSplitClip}
            disabled={!hasSelection}
            className={`h-7 w-7 inline-flex items-center justify-center rounded-lg border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 ${hasSelection
                ? 'border-[#2A2A2A] bg-[#181818] text-[#D4D4D8] hover:bg-[#222222] hover:text-white hover:border-[#383838] shadow-sm'
                : 'border-transparent text-[#52525B] opacity-35 cursor-not-allowed'
              }`}
            title={hasSelection ? 'Split clip at playhead (S or Ctrl+B)' : 'Select a clip to split'}
            aria-label="Split selected clip at playhead"
          >
            <Scissors className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onDuplicateClip}
            disabled={!hasSelection}
            className={`h-7 w-7 inline-flex items-center justify-center rounded-lg border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 ${hasSelection
                ? 'border-[#2A2A2A] bg-[#181818] text-[#D4D4D8] hover:bg-[#222222] hover:text-white hover:border-[#383838] shadow-sm'
                : 'border-transparent text-[#52525B] opacity-35 cursor-not-allowed'
              }`}
            title={hasSelection ? 'Duplicate clip (Ctrl+D)' : 'Select a clip to duplicate'}
            aria-label="Duplicate selected clip"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onDeleteClip}
            disabled={!hasSelection}
            className={`h-7 w-7 inline-flex items-center justify-center rounded-lg border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400 ${hasSelection
                ? 'border-red-900/40 bg-red-950/20 text-red-300 hover:bg-red-950/40 hover:border-red-700/60 shadow-sm'
                : 'border-transparent text-[#52525B] opacity-35 cursor-not-allowed'
              }`}
            title={hasSelection ? 'Delete clip (Delete or Backspace)' : 'Select a clip to delete'}
            aria-label="Delete selected clip"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'transitions' }));
            }}
            className="h-7 px-2.5 inline-flex items-center gap-1.5 rounded-lg border border-[#2A2A2A] bg-[#181818] text-[#D4D4D8] hover:bg-[#222222] hover:text-white hover:border-amber-400/50 shadow-sm transition-all cursor-pointer text-[10.5px] font-semibold"
            title="Open Transitions Studio"
            aria-label="Open Transitions Studio"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Transitions</span>
          </button>
        </div>

        <div className="workspace-timeline-toolbar-divider h-4 w-px bg-[#262626] mx-0.5" />

        {/* ── Playback Controls: Jump to Start, Hero Play/Pause Pill, Jump to End & Timecode ── */}
        <div className="workspace-timeline-toolbar-playback flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onSeek(0)}
            className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#26262C] transition-colors cursor-pointer shrink-0"
            title="Jump to Start (00:00)"
            aria-label="Jump to start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Primary Hero Play / Pause Pill Button */}
          <button
            type="button"
            onClick={onTogglePlay}
            className="h-7 px-4 rounded-full bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 border border-[#60A5FA]/40"
            title={isPlaying ? 'Pause Timeline (Space)' : 'Play Timeline (Space)'}
            aria-label={isPlaying ? 'Pause timeline' : 'Play timeline'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-white shrink-0" />
                <span className="text-[10.5px] font-bold font-sans-studio tracking-wider uppercase">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white ml-0.5 shrink-0" />
                <span className="text-[10.5px] font-bold font-sans-studio tracking-wider uppercase">Play</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSeek(displayDuration)}
            className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#26262C] transition-colors cursor-pointer shrink-0"
            title={`Jump to End (${formatTime(displayDuration)})`}
            aria-label="Jump to end"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Time Readout: Playhead / Media Duration */}
          <div
            className="h-7 whitespace-nowrap tabular-nums px-2.5 rounded-lg bg-[#0A0A0A] border border-[#242424] text-[10.5px] font-mono-studio text-white flex items-center gap-1.5 shadow-inner select-none shrink-0"
            title={`Playhead: ${formatTime(currentTime)} | Duration: ${formatTime(displayDuration)}`}
            aria-label={`Current time ${formatTime(currentTime)} of ${formatTime(displayDuration)}`}
          >
            <span className="text-white font-bold" title="Current Playhead Time">{formatTime(currentTime)}</span>
            <span className="text-[#52525B]">/</span>
            <span className="text-[#60A5FA] font-medium" title="Project Duration">{formatTime(displayDuration)}</span>
          </div>
        </div>
      </div>

      {/* Right: Add Track, Snapping, Zoom Level Controls & Shortcuts */}
      <div className="workspace-timeline-toolbar-secondary flex items-center gap-2 shrink-0">
        {/* ── Add Track ── */}
        <div ref={addTrackAnchorRef} className="relative">
          <button
            type="button"
            onClick={onToggleAddTrackMenu}
            className="h-7 flex items-center gap-1.5 px-2.5 rounded-lg text-[10.5px] font-sans-studio font-medium text-[#E4E4E7] bg-[#181818] border border-[#242424] hover:bg-[#26262C] hover:border-white/10 hover:text-white transition-all cursor-pointer shadow-sm"
            title="Add a new track from media categories"
            aria-label="Add track"
            aria-expanded={addTrackMenuOpen}
          >
            <Plus className="w-3 h-3 text-slate-400" />
            <span>Add Track</span>
          </button>
          <TimelineAddTrackMenu
            isOpen={addTrackMenuOpen}
            onClose={onCloseAddTrackMenu}
            anchorRef={addTrackAnchorRef}
            onEnableTrack={onEnableTrack}
            enabledTracks={enabledTracks}
          />
        </div>

        <div className="workspace-timeline-toolbar-divider h-4 w-px bg-[#262626] mx-0.5" />

        {/* ── Zoom Controls & Shortcuts ── */}
        <div className="flex items-center h-7 bg-[#161616] border border-[#262626] rounded-lg p-0.5 text-[#9CA3AF]">
          <button
            type="button"
            onClick={onZoomFit}
            disabled={zoomLevel === 1}
            className="h-6 w-6 inline-flex items-center justify-center rounded hover:text-white hover:bg-[#26262C] disabled:opacity-30 cursor-pointer transition-colors"
            title="Fit full project in timeline"
            aria-label="Fit timeline to project"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onZoomOut}
            disabled={zoomLevel <= MIN_TIMELINE_ZOOM}
            className="h-6 w-6 inline-flex items-center justify-center rounded hover:text-white hover:bg-[#26262C] disabled:opacity-30 cursor-pointer transition-colors"
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="whitespace-nowrap text-[9px] font-mono-studio px-1.5 text-white font-medium" aria-label={`Zoom level ${zoomLevel}x`}>
            {zoomLevel}x
          </span>
          <button
            type="button"
            onClick={onZoomIn}
            disabled={zoomLevel >= MAX_TIMELINE_ZOOM}
            className="h-6 w-6 inline-flex items-center justify-center rounded hover:text-white hover:bg-[#26262C] disabled:opacity-30 cursor-pointer transition-colors"
            title="Zoom In"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default TimelineToolbar;
