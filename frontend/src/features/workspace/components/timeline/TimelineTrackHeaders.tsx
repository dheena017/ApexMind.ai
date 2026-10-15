import React from 'react';
import {
  Film,
  Type,
  Mic,
  Music,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Lock,
  Unlock,
} from 'lucide-react';
import { EnabledTracks, SelectedClip } from './timelineTypes';

export interface TimelineTrackHeadersProps {
  enabledTracks: EnabledTracks;
  selectedClip?: SelectedClip | null;
  onSelectClip: (clip: SelectedClip, compound?: 'video' | 'text' | 'voice' | 'music' | 'overlay') => void;
  videoTrackVisible: boolean;
  onToggleVideoTrackVisible: () => void;
  videoTrackHeight?: number;
  videoMaxLane?: number;
  imageTrackVisible: boolean;
  onToggleImageTrackVisible: () => void;
  imageTrackHeight?: number;
  imageMaxLane?: number;
  overlayTrackVisible: boolean;
  onToggleOverlayTrackVisible: () => void;
  overlayTrackHeight?: number;
  overlayMaxLane?: number;
  captionsTrackLocked: boolean;
  onToggleCaptionsTrackLocked: () => void;
  captionTrackHeight: number;
  captionMaxLane: number;
  titleTrackLocked: boolean;
  onToggleTitleTrackLocked: () => void;
  voiceTrackMuted: boolean;
  onToggleVoiceTrackMuted: () => void;
  voiceTrackHeight?: number;
  voiceMaxLane?: number;
  musicTrackMuted: boolean;
  onToggleMusicTrackMuted: () => void;
  musicTrackHeight?: number;
  musicMaxLane?: number;
  sfxTrackMuted: boolean;
  onToggleSfxTrackMuted: () => void;
  sfxTrackHeight?: number;
  sfxMaxLane?: number;
  scrollRef?: React.Ref<HTMLDivElement>;
  onWheel?: React.WheelEventHandler<HTMLDivElement>;
  onScroll?: React.UIEventHandler<HTMLDivElement>;
  maxHeightClass?: string;
  showCornerHeader?: boolean;
  width?: number;
}

export const TimelineTrackHeaders: React.FC<TimelineTrackHeadersProps> = ({
  enabledTracks,
  selectedClip,
  onSelectClip,
  videoTrackVisible,
  onToggleVideoTrackVisible,
  videoTrackHeight = 40,
  videoMaxLane = 0,
  imageTrackVisible,
  onToggleImageTrackVisible,
  imageTrackHeight = 40,
  imageMaxLane = 0,
  overlayTrackVisible,
  onToggleOverlayTrackVisible,
  overlayTrackHeight = 40,
  overlayMaxLane = 0,
  captionsTrackLocked,
  onToggleCaptionsTrackLocked,
  captionTrackHeight,
  captionMaxLane,
  titleTrackLocked,
  onToggleTitleTrackLocked,
  voiceTrackMuted,
  onToggleVoiceTrackMuted,
  voiceTrackHeight = 40,
  voiceMaxLane = 0,
  musicTrackMuted,
  onToggleMusicTrackMuted,
  musicTrackHeight = 40,
  musicMaxLane = 0,
  sfxTrackMuted,
  onToggleSfxTrackMuted,
  sfxTrackHeight = 40,
  sfxMaxLane = 0,
  scrollRef,
  onWheel,
  onScroll,
  maxHeightClass = 'max-h-[170px]',
  showCornerHeader = true,
  width,
}) => {
  const renderVisibilityToggle = (
    isVisible: boolean,
    onToggle: () => void,
    label: string,
    accentClass: string,
  ) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label={isVisible ? `Hide ${label} track` : `Show ${label} track`}
      aria-pressed={isVisible}
      title={isVisible ? `Hide ${label} track` : `Show ${label} track`}
      className={[
        'relative flex h-7 w-7 items-center justify-center rounded-md border transition-all duration-200 ease-out',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141414]',
        isVisible
          ? `border-emerald-500/40 bg-emerald-500/12 text-emerald-300 hover:bg-emerald-500/18 hover:text-emerald-200 ${accentClass}`
          : 'border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/16 hover:text-red-200',
      ].join(' ')}
    >
      <span className="sr-only">{isVisible ? `Hide ${label} track` : `Show ${label} track`}</span>
      {isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
    </button>
  );

  return (
    <div
      ref={scrollRef}
      onWheel={onWheel}
      onScroll={onScroll}
      style={{ width: width ? `${width}px` : undefined }}
      className={`${width ? '' : 'w-48'} shrink-0 border-r border-[#262626] bg-[#141414] flex flex-col z-20 select-none`}
    >
      {/* Ruler Corner Header - Sticky at top */}
      {showCornerHeader && (
        <div className="h-6 border-b border-[#262626] bg-[#141414] flex items-center px-2.5 text-[9px] font-mono-studio text-[#6B7280] uppercase tracking-wider shrink-0 sticky top-0 z-30">
          Track Labels
        </div>
      )}

      {/* Track 1: Video Backdrop Header */}
      {enabledTracks.video && (
        <div
          onClick={() => onSelectClip({ track: 'video' }, 'video')}
          style={{ height: `${videoTrackHeight}px` }}
          className={`border-b border-[#262626] flex items-center justify-between px-2.5 text-xs text-white cursor-pointer transition-all ${selectedClip?.track === 'video' ? 'bg-[#1B1B1B]' : 'hover:bg-white/[0.02]'
            }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <Film className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] font-medium truncate">V1 Video</span>
            {videoMaxLane > 0 && (
              <span className="text-[8px] font-mono-studio text-amber-300 bg-amber-500/20 px-1 py-0.2 rounded border border-amber-500/30 shrink-0 font-bold">
                {videoMaxLane + 1} Rows
              </span>
            )}
          </div>
          {renderVisibilityToggle(videoTrackVisible, onToggleVideoTrackVisible, 'video', 'shadow-[0_0_0_1px_rgba(16,185,129,0.18)]')}
        </div>
      )}

      {/* Track 2: Image Backdrop Header */}
      {enabledTracks.image && (
        <div
          onClick={() => onSelectClip({ track: 'image' }, 'video')}
          style={{ height: `${imageTrackHeight}px` }}
          className={`border-b border-[#262626] flex items-center justify-between px-2.5 text-xs text-white cursor-pointer transition-all ${selectedClip?.track === 'image' ? 'bg-[#1B1B1B]' : 'hover:bg-white/[0.02]'
            }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <ImageIcon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="text-[11px] font-medium truncate">V2 Image</span>
            {imageMaxLane > 0 && (
              <span className="text-[8px] font-mono-studio text-rose-300 bg-rose-500/20 px-1 py-0.2 rounded border border-rose-500/30 shrink-0 font-bold">
                {imageMaxLane + 1} Rows
              </span>
            )}
          </div>
          {renderVisibilityToggle(imageTrackVisible, onToggleImageTrackVisible, 'image', 'shadow-[0_0_0_1px_rgba(244,114,182,0.12)]')}
        </div>
      )}

      {/* Track 3: Overlays / Elements Header */}
      {enabledTracks.overlay && (
        <div
          onClick={() => onSelectClip({ track: 'overlay' }, 'overlay')}
          style={{ height: `${overlayTrackHeight}px` }}
          className={`border-b border-[#262626] flex items-center justify-between px-2.5 text-xs text-white cursor-pointer transition-all ${selectedClip?.track === 'overlay' ? 'bg-[#1B1B1B]' : 'hover:bg-white/[0.02]'
            }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-[11px] font-medium truncate">O1 Overlays</span>
            {overlayMaxLane > 0 && (
              <span className="text-[8px] font-mono-studio text-indigo-300 bg-indigo-500/20 px-1 py-0.2 rounded border border-indigo-500/30 shrink-0 font-bold">
                {overlayMaxLane + 1} Rows
              </span>
            )}
          </div>
          {renderVisibilityToggle(overlayTrackVisible, onToggleOverlayTrackVisible, 'overlay', 'shadow-[0_0_0_1px_rgba(99,102,241,0.18)]')}
        </div>
      )}

      {/* Track 4: Subtitles & Captions Header */}
      {enabledTracks.captions && (
        <div
          onClick={() => onSelectClip({ track: 'caption', index: 0 }, 'text')}
          style={{ height: `${captionTrackHeight}px` }}
          className={`border-b border-[#262626] flex items-center justify-between px-2.5 text-xs text-white cursor-pointer transition-all ${selectedClip?.track === 'caption' ? 'bg-blue-950/20' : 'hover:bg-white/[0.02]'
            }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <Type className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-[11px] font-medium truncate">T1 Captions</span>
            {captionMaxLane > 0 && (
              <span className="text-[8px] font-mono-studio text-blue-300 bg-blue-500/20 px-1 py-0.2 rounded border border-blue-500/30 shrink-0 font-bold">
                {captionMaxLane + 1} Rows
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCaptionsTrackLocked();
            }}
            className="p-1 text-[#9CA3AF] hover:text-white cursor-pointer"
            title={captionsTrackLocked ? 'Unlock captions' : 'Lock captions'}
          >
            {captionsTrackLocked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
          </button>
        </div>
      )}

      {/* Track 5: Title / Hook Overlay Header */}
      {enabledTracks.title && (
        <div
          onClick={() => onSelectClip({ track: 'title' }, 'text')}
          className={`h-10 border-b border-[#262626] flex items-center justify-between px-2.5 text-xs text-white cursor-pointer transition-colors ${selectedClip?.track === 'title' ? 'bg-sky-950/20' : 'hover:bg-white/[0.02]'
            }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <Type className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="text-[11px] font-medium truncate">T2 Titles</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleTitleTrackLocked();
            }}
            className="p-1 text-[#9CA3AF] hover:text-white cursor-pointer"
          >
            {titleTrackLocked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
          </button>
        </div>
      )}

      {/* Track 6: Voiceover Audio Header */}
      {enabledTracks.voice && (
        <div
          onClick={() => onSelectClip({ track: 'voice' }, 'voice')}
          style={{ height: `${voiceTrackHeight}px` }}
          className={`border-b border-[#262626] flex items-center justify-between px-2.5 text-xs text-white cursor-pointer transition-all ${selectedClip?.track === 'voice' ? 'bg-emerald-950/20' : 'hover:bg-white/[0.02]'
            }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <Mic className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[11px] font-medium truncate">A1 Voiceover</span>
            {voiceMaxLane > 0 && (
              <span className="text-[8px] font-mono-studio text-emerald-300 bg-emerald-500/20 px-1 py-0.2 rounded border border-emerald-500/30 shrink-0 font-bold">
                {voiceMaxLane + 1} Rows
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleVoiceTrackMuted();
            }}
            className="p-1 text-[#9CA3AF] hover:text-white cursor-pointer"
            title={voiceTrackMuted ? 'Unmute voice' : 'Mute voice'}
          >
            {voiceTrackMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3" />}
          </button>
        </div>
      )}

      {/* Track 7: Background Music Header */}
      {enabledTracks.music && (
        <div
          onClick={() => onSelectClip({ track: 'music' }, 'music')}
          style={{ height: `${musicTrackHeight}px` }}
          className={`${enabledTracks.sfx ? 'border-b border-[#262626]' : ''} flex items-center justify-between px-2.5 text-xs text-white cursor-pointer transition-all ${selectedClip?.track === 'music' ? 'bg-purple-950/20' : 'hover:bg-white/[0.02]'
            }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <Music className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-[11px] font-medium truncate">A2 Music</span>
            {musicMaxLane > 0 && (
              <span className="text-[8px] font-mono-studio text-purple-300 bg-purple-500/20 px-1 py-0.2 rounded border border-purple-500/30 shrink-0 font-bold">
                {musicMaxLane + 1} Rows
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMusicTrackMuted();
            }}
            className="p-1 text-[#9CA3AF] hover:text-white cursor-pointer"
            title={musicTrackMuted ? 'Unmute music' : 'Mute music'}
          >
            {musicTrackMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3" />}
          </button>
        </div>
      )}

      {/* Track 8: Sound FX Header */}
      {enabledTracks.sfx && (
        <div
          onClick={() => onSelectClip({ track: 'sfx' }, 'music')}
          style={{ height: `${sfxTrackHeight}px` }}
          className={`flex items-center justify-between px-2.5 text-xs text-white cursor-pointer transition-all ${selectedClip?.track === 'sfx' ? 'bg-amber-950/20' : 'hover:bg-white/[0.02]'
            }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] font-medium truncate">A3 Sound FX</span>
            {sfxMaxLane > 0 && (
              <span className="text-[8px] font-mono-studio text-amber-300 bg-amber-500/20 px-1 py-0.2 rounded border border-amber-500/30 shrink-0 font-bold">
                {sfxMaxLane + 1} Rows
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSfxTrackMuted();
            }}
            className="p-1 text-[#9CA3AF] hover:text-white cursor-pointer"
          >
            {sfxTrackMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3" />}
          </button>
        </div>
      )}

    </div>
  );
};

export default TimelineTrackHeaders;
