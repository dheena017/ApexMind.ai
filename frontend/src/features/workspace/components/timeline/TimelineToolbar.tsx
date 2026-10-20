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
  Wand2,
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
  captionsTrackLocked: boolean;
  onSplitClip: () => void;
  onDuplicateClip: () => void;
  onAddCaption: () => void;
  onDeleteClip: () => void;
  snapEnabled: boolean;
  onToggleSnap: () => void;
  onSyncAudioAndCC?: () => void;
  hasAudioMismatch?: boolean;
  voiceDuration?: number;
  captionsEnd?: number;
  addTrackMenuOpen: boolean;
  onToggleAddTrackMenu: () => void;
  onCloseAddTrackMenu: () => void;
  onEnableTrack: (trackKey: keyof EnabledTracks, selected: SelectedClip, compound: 'video' | 'text' | 'voice' | 'music' | 'overlay') => void;
  onSeek: (time: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  totalDuration: number;
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
  onEnableTrack,
  onSeek,
  isPlaying,
  onTogglePlay,
  currentTime,
  totalDuration,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onDurationChange,
}) => {
  const hasSelection = Boolean(selectedClip);
  const addTrackAnchorRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-nowrap items-center justify-between px-3 py-1.5 bg-[#0D0D11] border-b border-[#222228] gap-3 overflow-x-auto select-none min-w-0">
      {/* Left: Title, Track Indicators, Editing Tools & Hero Playback Cluster */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1 rounded-md text-[#9CA3AF] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand Timeline' : 'Collapse Timeline'}
          aria-label={isCollapsed ? 'Expand timeline' : 'Collapse timeline'}
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF]" />}
        </button>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5 text-white">
            <Sliders className="w-3.5 h-3.5 text-[#A1A1AA]" />
            Timeline
          </span>
          <span
            className="text-[9.5px] font-mono-studio text-[#A1A1AA] bg-[#1A1A22] border border-[#2B2B36] px-2 py-0.5 rounded-full"
            title="Tracks containing content"
          >
            {activeTracksCount} Tracks
          </span>
        </div>

        <div className="h-4 w-px bg-[#262630] mx-0.5" />

        {/* ── Action Tools: Split, Duplicate, Delete ── */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onSplitClip}
            disabled={!hasSelection}
            className={`h-7 w-7 inline-flex items-center justify-center rounded-lg border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 ${hasSelection
                ? 'border-[#333340] bg-[#16161E] text-[#D4D4D8] hover:bg-[#22222D] hover:text-white hover:border-[#4B4B5C] shadow-sm'
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
                ? 'border-[#333340] bg-[#16161E] text-[#D4D4D8] hover:bg-[#22222D] hover:text-white hover:border-[#4B4B5C] shadow-sm'
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
        </div>

        <div className="h-4 w-px bg-[#262630] mx-0.5" />

        {/* ── Playback Controls: Jump to Start, Hero Play/Pause Pill, Jump to End & Timecode ── */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onSeek(0)}
            className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-[#9CA3AF] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
            title="Jump to Start (00:00)"
            aria-label="Jump to start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Primary Hero Play / Pause Pill Button */}
          <button
            type="button"
            onClick={onTogglePlay}
            className="h-7 px-4 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 border border-[#60A5FA]/40"
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
            onClick={() => onSeek(totalDuration)}
            className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-[#9CA3AF] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
            title="Jump to End"
            aria-label="Jump to end"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Time Readout: Clean Non-Editable Display */}
          <div
            className="h-7 whitespace-nowrap tabular-nums px-2.5 rounded-lg bg-[#08080A] border border-[#262630] text-[10px] font-mono-studio text-white flex items-center gap-1.5 shadow-inner select-none shrink-0"
            aria-label={`Current time ${formatTime(currentTime)} of ${formatTime(totalDuration)}`}
          >
            <span className="text-white font-bold" title="Current Playhead Time">{formatTime(currentTime)}</span>
            <span className="text-[#52525B]">/</span>
            <span className="text-[#A1A1AA]" title="Total Project Duration">{formatTime(totalDuration)}</span>
          </div>
        </div>
      </div>

      {/* Right: Add Track, Snapping, Zoom Level Controls & Shortcuts */}
      <div className="flex items-center gap-2 shrink-0">
        {/* ── Add Track & Add Subtitle Cue ── */}
        <div className="flex items-center gap-1.5 relative">
          <div ref={addTrackAnchorRef} className="relative">
            <button
              type="button"
              onClick={onToggleAddTrackMenu}
              className="h-7 flex items-center gap-1.5 px-2.5 rounded-lg text-[10.5px] font-sans-studio font-medium text-[#E4E4E7] bg-[#16161E] border border-[#333340] hover:bg-[#22222D] hover:border-[#4B4B5C] hover:text-white transition-all cursor-pointer shadow-sm"
              title="Add a new track from media categories"
              aria-label="Add track"
              aria-expanded={addTrackMenuOpen}
            >
              <Plus className="w-3 h-3 text-[#A1A1AA]" />
              <span>Add Track</span>
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
            className="h-7 flex items-center gap-1.5 px-2.5 rounded-lg text-[10.5px] font-sans-studio font-medium text-[#E4E4E7] bg-[#16161E] border border-[#333340] hover:bg-[#22222D] hover:border-[#4B4B5C] hover:text-white transition-all cursor-pointer shadow-sm disabled:opacity-35"
            title="Add subtitle cue at current playhead (+)"
            aria-label="Add subtitle cue at playhead"
          >
            <Plus className="w-3 h-3 text-[#A1A1AA]" />
            <span>Cue</span>
          </button>

          {/* Magnetic Snapping Toggle */}
          <button
            type="button"
            onClick={onToggleSnap}
            className={`h-7 px-2 inline-flex items-center gap-1.5 rounded-lg border transition-all cursor-pointer select-none ${snapEnabled
                ? 'border-white/30 bg-white/10 text-white font-semibold'
                : 'border-[#2D2D38] bg-[#16161E] text-[#71717A] hover:text-[#D4D4D8] hover:border-[#3E3E4C]'
              }`}
            title={snapEnabled ? 'Magnetic Snapping: ON (Press N to toggle) — Clips and playhead snap to cuts' : 'Magnetic Snapping: OFF (Press N to toggle)'}
            aria-label={snapEnabled ? 'Disable magnetic snapping' : 'Enable magnetic snapping'}
            aria-pressed={snapEnabled}
          >
            <Magnet className={`w-3.5 h-3.5 ${snapEnabled ? 'text-white' : ''}`} />
            <span className="text-[11px] font-mono-studio">
              {snapEnabled ? 'Snap ON' : 'Snap'}
            </span>
          </button>

          {/* Sync Audio & CC (Closed Captions) Button */}
          {onSyncAudioAndCC && (
            <button
              type="button"
              onClick={onSyncAudioAndCC}
              className={`h-7 px-2.5 inline-flex items-center gap-1.5 rounded-lg border transition-all cursor-pointer select-none text-[10.5px] font-sans-studio ${
                hasAudioMismatch
                  ? 'border-amber-500/50 bg-amber-500/15 text-amber-300 font-semibold hover:bg-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/30'
                  : 'border-[#2D2D38] bg-[#16161E] text-[#9CA3AF] hover:text-white hover:border-[#424250]'
              }`}
              title={
                hasAudioMismatch
                  ? `Audio & CC Mismatch (${voiceDuration.toFixed(1)}s voice vs ${captionsEnd.toFixed(1)}s CC) • Click to sync!`
                  : 'Sync CC & Audio • Align captions and video cuts to match voice audio length'
              }
              aria-label="Synchronize audio and closed captions"
            >
              <Wand2 className={`w-3.5 h-3.5 ${hasAudioMismatch ? 'text-amber-400 animate-pulse' : 'text-cyan-400'}`} />
              <span className="font-medium">
                {hasAudioMismatch ? 'Match Audio & CC' : 'Sync CC & Audio'}
              </span>
              {hasAudioMismatch && (
                <span className="px-1 py-0.2 rounded text-[9px] font-mono-studio font-bold bg-amber-400/20 text-amber-300 shrink-0">
                  !
                </span>
              )}
            </button>
          )}
        </div>

        <div className="h-4 w-px bg-[#262630] mx-0.5" />

        {/* ── Zoom Controls & Shortcuts ── */}
        <div className="flex items-center h-7 bg-[#14141C] border border-[#272733] rounded-lg p-0.5 text-[#9CA3AF]">
          <button
            type="button"
            onClick={onZoomFit}
            disabled={zoomLevel === 1}
            className="h-6 w-6 inline-flex items-center justify-center rounded hover:text-white hover:bg-white/[0.08] disabled:opacity-30 cursor-pointer transition-colors"
            title="Fit full project in timeline"
            aria-label="Fit timeline to project"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onZoomOut}
            disabled={zoomLevel <= MIN_TIMELINE_ZOOM}
            className="h-6 w-6 inline-flex items-center justify-center rounded hover:text-white hover:bg-white/[0.08] disabled:opacity-30 cursor-pointer transition-colors"
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
            className="h-6 w-6 inline-flex items-center justify-center rounded hover:text-white hover:bg-white/[0.08] disabled:opacity-30 cursor-pointer transition-colors"
            title="Zoom In"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>

        <button
          type="button"
          popoverTarget="timeline-shortcuts"
          className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-[#272733] bg-[#14141C] text-[#9CA3AF] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          title="Keyboard shortcuts"
          aria-label="Show keyboard shortcuts"
        >
          <Keyboard className="w-3.5 h-3.5" />
        </button>

        <div
          id="timeline-shortcuts"
          popover="auto"
          role="dialog"
          aria-labelledby="timeline-shortcuts-title"
          className="fixed bottom-4 right-4 m-0 w-60 rounded-xl border border-[#33333E] bg-[#121218] p-3.5 text-[#E5E5E5] shadow-2xl backdrop-blur-xl"
        >
          <h3 id="timeline-shortcuts-title" className="mb-2.5 text-[11px] font-bold text-white flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5 text-[#A1A1AA]" />
            Keyboard Shortcuts
          </h3>
          <div className="space-y-1.5 text-[10px]">
            {[
              ['Play / pause', 'Space'],
              ['Seek', '\u2190 / \u2192'],
              ['Split', 'S / Ctrl+B'],
              ['Duplicate', 'Ctrl+D'],
              ['Toggle snap', 'N'],
              ['Delete clip', 'Del / Backspace'],
              ['Deselect / close menus', 'Esc'],
            ].map(([action, shortcut]) => (
              <div key={action} className="flex items-center justify-between gap-3 py-0.5">
                <span className="text-[#A1A1AA]">{action}</span>
                <kbd className="whitespace-nowrap rounded-md border border-[#333340] bg-[#0A0A0E] px-1.5 py-0.5 font-mono-studio text-[9px] text-[#E5E5E5]">
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
