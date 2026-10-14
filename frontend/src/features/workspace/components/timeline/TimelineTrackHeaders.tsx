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
  imageTrackVisible: boolean;
  onToggleImageTrackVisible: () => void;
  overlayTrackVisible: boolean;
  onToggleOverlayTrackVisible: () => void;
  captionsTrackLocked: boolean;
  onToggleCaptionsTrackLocked: () => void;
  captionTrackHeight: number;
  captionMaxLane: number;
  titleTrackLocked: boolean;
  onToggleTitleTrackLocked: () => void;
  voiceTrackMuted: boolean;
  onToggleVoiceTrackMuted: () => void;
  musicTrackMuted: boolean;
  onToggleMusicTrackMuted: () => void;
  sfxTrackMuted: boolean;
  onToggleSfxTrackMuted: () => void;
}

export const TimelineTrackHeaders: React.FC<TimelineTrackHeadersProps> = ({
  enabledTracks,
  selectedClip,
  onSelectClip,
  videoTrackVisible,
  onToggleVideoTrackVisible,
  imageTrackVisible,
  onToggleImageTrackVisible,
  overlayTrackVisible,
  onToggleOverlayTrackVisible,
  captionsTrackLocked,
  onToggleCaptionsTrackLocked,
  captionTrackHeight,
  captionMaxLane,
  titleTrackLocked,
  onToggleTitleTrackLocked,
  voiceTrackMuted,
  onToggleVoiceTrackMuted,
  musicTrackMuted,
  onToggleMusicTrackMuted,
  sfxTrackMuted,
  onToggleSfxTrackMuted,
}) => {
  return (
    <div className="w-48 shrink-0 border-r border-[#262626] bg-[#141414] flex flex-col z-20">
      {/* Ruler Corner Header */}
      <div className="h-6 border-b border-[#262626] flex items-center px-2.5 text-[9px] font-mono-studio text-[#6B7280] uppercase tracking-wider">
        Track Labels
      </div>

      {/* Track 1: Video Backdrop Header */}
      {enabledTracks.video && (
        <div
          onClick={() => onSelectClip({ track: 'video' }, 'video')}
          className={`h-10 border-b border-[#262626] flex items-center justify-between px-2.5 text-xs text-white cursor-pointer transition-colors ${
            selectedClip?.track === 'video' ? 'bg-[#1B1B1B]' : 'hover:bg-white/[0.02]'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <Film className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] font-medium truncate">V1 Video</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleVideoTrackVisible();
            }}
            className="p-1 text-[#9CA3AF] hover:text-white cursor-pointer"
            title={videoTrackVisible ? 'Hide video track' : 'Show video track'}
          >
            {videoTrackVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-red-400" />}
          </button>
        </div>
      )}

      {/* Track 2: Image Backdrop Header */}
      {enabledTracks.image && (
        <div
          onClick={() => onSelectClip({ track: 'image' }, 'video')}
          className={`h-10 border-b border-[#262626] flex items-center justify-between px-2.5 text-xs text-white cursor-pointer transition-colors ${
            selectedClip?.track === 'image' ? 'bg-[#1B1B1B]' : 'hover:bg-white/[0.02]'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <ImageIcon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="text-[11px] font-medium truncate">V2 Image</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleImageTrackVisible();
            }}
            className="p-1 text-[#9CA3AF] hover:text-white cursor-pointer"
            title={imageTrackVisible ? 'Hide image track' : 'Show image track'}
          >
            {imageTrackVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-red-400" />}
          </button>
        </div>
      )}

      {/* Track 3: Overlays / Elements Header */}
      {enabledTracks.overlay && (
        <div
          onClick={() => onSelectClip({ track: 'overlay' }, 'overlay')}
          className={`h-10 border-b border-[#262626] flex items-center justify-between px-2.5 text-xs text-white cursor-pointer transition-colors ${
            selectedClip?.track === 'overlay' ? 'bg-[#1B1B1B]' : 'hover:bg-white/[0.02]'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-[11px] font-medium truncate">O1 Overlays</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleOverlayTrackVisible();
            }}
            className="p-1 text-[#9CA3AF] hover:text-white cursor-pointer"
            title={overlayTrackVisible ? 'Hide overlay track' : 'Show overlay track'}
          >
            {overlayTrackVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-red-400" />}
          </button>
        </div>
      )}

      {/* Track 4: Subtitles & Captions Header */}
      {enabledTracks.captions && (
        <div
          onClick={() => onSelectClip({ track: 'caption', index: 0 }, 'text')}
          style={{ height: `${captionTrackHeight}px` }}
          className={`border-b border-[#262626] flex items-center justify-between px-2.5 text-xs text-white cursor-pointer transition-all ${
            selectedClip?.track === 'caption' ? 'bg-blue-950/20' : 'hover:bg-white/[0.02]'
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
          className={`h-10 border-b border-[#262626] flex items-center justify-between px-2.5 text-xs text-white cursor-pointer transition-colors ${
            selectedClip?.track === 'title' ? 'bg-sky-950/20' : 'hover:bg-white/[0.02]'
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
          className={`h-10 border-b border-[#262626] flex items-center justify-between px-2.5 text-xs text-white cursor-pointer transition-colors ${
            selectedClip?.track === 'voice' ? 'bg-emerald-950/20' : 'hover:bg-white/[0.02]'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <Mic className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[11px] font-medium truncate">A1 Voiceover</span>
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
          className={`h-10 ${enabledTracks.sfx ? 'border-b border-[#262626]' : ''} flex items-center justify-between px-2.5 text-xs text-white cursor-pointer transition-colors ${
            selectedClip?.track === 'music' ? 'bg-purple-950/20' : 'hover:bg-white/[0.02]'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <Music className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-[11px] font-medium truncate">A2 Music</span>
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
          className={`h-10 flex items-center justify-between px-2.5 text-xs text-white cursor-pointer transition-colors ${
            selectedClip?.track === 'sfx' ? 'bg-amber-950/20' : 'hover:bg-white/[0.02]'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] font-medium truncate">A3 Sound FX</span>
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
