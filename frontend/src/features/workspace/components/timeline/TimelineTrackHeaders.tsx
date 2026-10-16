import React, { useState } from 'react';
import {
  Video,
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
  videoTrackLocked?: boolean;
  onToggleVideoTrackLocked?: () => void;

  imageTrackVisible: boolean;
  onToggleImageTrackVisible: () => void;
  imageTrackHeight?: number;
  imageMaxLane?: number;
  imageTrackLocked?: boolean;
  onToggleImageTrackLocked?: () => void;

  overlayTrackVisible: boolean;
  onToggleOverlayTrackVisible: () => void;
  overlayTrackHeight?: number;
  overlayMaxLane?: number;
  overlayTrackLocked?: boolean;
  onToggleOverlayTrackLocked?: () => void;

  captionsTrackLocked: boolean;
  onToggleCaptionsTrackLocked: () => void;
  captionTrackHeight: number;
  captionMaxLane: number;
  captionsTrackVisible?: boolean;
  onToggleCaptionsTrackVisible?: () => void;

  titleTrackLocked: boolean;
  onToggleTitleTrackLocked: () => void;
  titleTrackVisible?: boolean;
  onToggleTitleTrackVisible?: () => void;

  voiceTrackMuted: boolean;
  onToggleVoiceTrackMuted: () => void;
  voiceTrackHeight?: number;
  voiceMaxLane?: number;
  voiceSolo?: boolean;
  onToggleVoiceSolo?: () => void;
  voiceTrackLocked?: boolean;
  onToggleVoiceTrackLocked?: () => void;

  musicTrackMuted: boolean;
  onToggleMusicTrackMuted: () => void;
  musicTrackHeight?: number;
  musicMaxLane?: number;
  musicSolo?: boolean;
  onToggleMusicSolo?: () => void;
  musicTrackLocked?: boolean;
  onToggleMusicTrackLocked?: () => void;

  sfxTrackMuted: boolean;
  onToggleSfxTrackMuted: () => void;
  sfxTrackHeight?: number;
  sfxMaxLane?: number;
  sfxSolo?: boolean;
  onToggleSfxSolo?: () => void;
  sfxTrackLocked?: boolean;
  onToggleSfxTrackLocked?: () => void;

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
  videoTrackLocked = false,
  onToggleVideoTrackLocked,

  imageTrackVisible,
  onToggleImageTrackVisible,
  imageTrackHeight = 40,
  imageMaxLane = 0,
  imageTrackLocked = false,
  onToggleImageTrackLocked,

  overlayTrackVisible,
  onToggleOverlayTrackVisible,
  overlayTrackHeight = 40,
  overlayMaxLane = 0,
  overlayTrackLocked = false,
  onToggleOverlayTrackLocked,

  captionsTrackLocked,
  onToggleCaptionsTrackLocked,
  captionTrackHeight,
  captionMaxLane,
  captionsTrackVisible = true,
  onToggleCaptionsTrackVisible,

  titleTrackLocked,
  onToggleTitleTrackLocked,
  titleTrackVisible = true,
  onToggleTitleTrackVisible,

  voiceTrackMuted,
  onToggleVoiceTrackMuted,
  voiceTrackHeight = 40,
  voiceMaxLane = 0,
  voiceSolo = false,
  onToggleVoiceSolo,
  voiceTrackLocked = false,
  onToggleVoiceTrackLocked,

  musicTrackMuted,
  onToggleMusicTrackMuted,
  musicTrackHeight = 40,
  musicMaxLane = 0,
  musicSolo = false,
  onToggleMusicSolo,
  musicTrackLocked = false,
  onToggleMusicTrackLocked,

  sfxTrackMuted,
  onToggleSfxTrackMuted,
  sfxTrackHeight = 40,
  sfxMaxLane = 0,
  sfxSolo = false,
  onToggleSfxSolo,
  sfxTrackLocked = false,
  onToggleSfxTrackLocked,

  scrollRef,
  onWheel,
  onScroll,
  showCornerHeader = true,
  width,
}) => {
  // Local fallback states for tracks whose lock/solo isn't bound to parent
  const [localVideoLocked, setLocalVideoLocked] = useState(false);
  const [localImageLocked, setLocalImageLocked] = useState(false);
  const [localOverlayLocked, setLocalOverlayLocked] = useState(false);
  const [localCaptionsVisible, setLocalCaptionsVisible] = useState(true);
  const [localVoiceSolo, setLocalVoiceSolo] = useState(false);
  const [localMusicSolo, setLocalMusicSolo] = useState(false);
  const [localSfxSolo, setLocalSfxSolo] = useState(false);

  // Active track count for header indicator
  const activeTrackCount = Object.values(enabledTracks).filter(Boolean).length;

  // ── Render standard Visibility Button (Eye) ──────────────────────────
  const renderEyeButton = (isVisible: boolean, onToggle: () => void, label: string) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label={isVisible ? `Hide ${label} track` : `Show ${label} track`}
      title={isVisible ? `Hide ${label} track` : `Show ${label} track`}
      className={`w-6 h-6 rounded flex items-center justify-center transition-all cursor-pointer shrink-0 ${
        isVisible
          ? 'text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95'
          : 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
      }`}
    >
      {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
    </button>
  );

  // ── Render standard Lock Button ──────────────────────────────────────
  const renderLockButton = (isLocked: boolean, onToggle: () => void, label: string) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label={isLocked ? `Unlock ${label} track` : `Lock ${label} track`}
      title={isLocked ? `Unlock ${label} track` : `Lock ${label} track`}
      className={`w-6 h-6 rounded flex items-center justify-center transition-all cursor-pointer shrink-0 ${
        isLocked
          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
          : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/10 active:scale-95'
      }`}
    >
      {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
    </button>
  );

  // ── Render standard Mute Button (Audio) ──────────────────────────────
  const renderMuteButton = (isMuted: boolean, onToggle: () => void, label: string) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label={isMuted ? `Unmute ${label}` : `Mute ${label}`}
      title={isMuted ? `Unmute ${label}` : `Mute ${label}`}
      className={`w-6 h-6 rounded flex items-center justify-center transition-all cursor-pointer shrink-0 ${
        isMuted
          ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
          : 'text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95'
      }`}
    >
      {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
    </button>
  );

  // ── Render Solo Button (Audio) ───────────────────────────────────────
  const renderSoloButton = (isSolo: boolean, onToggle: () => void, label: string) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label={isSolo ? `Unsolo ${label}` : `Solo ${label}`}
      title={isSolo ? `Unsolo ${label}` : `Solo ${label}`}
      className={`w-5 h-6 rounded flex items-center justify-center text-[9px] font-mono-studio font-bold transition-all cursor-pointer shrink-0 ${
        isSolo
          ? 'bg-amber-400 text-black font-black shadow-xs'
          : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/10 active:scale-95'
      }`}
    >
      S
    </button>
  );

  return (
    <div
      ref={scrollRef}
      onWheel={onWheel}
      onScroll={onScroll}
      style={{ width: width ? `${width}px` : undefined }}
      className={`${width ? '' : 'w-48'} w-full h-full min-h-full shrink-0 border-r border-[#262626] bg-[#141416] flex flex-col z-20 select-none`}
    >
      {/* ── Ruler Corner Header - Sticky at top ────────────────────── */}
      {showCornerHeader && (
        <div className="h-6 border-b border-[#262626] bg-[#111113] flex items-center justify-between px-2.5 text-[9px] font-mono-studio text-[#8E8E93] uppercase tracking-wider shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-1.5 font-bold text-white tracking-widest">
            <span>TRACKS</span>
            <span className="text-[8px] px-1 py-0.2 rounded bg-white/10 text-zinc-300 font-mono-studio font-normal">
              {activeTrackCount}
            </span>
          </div>
        </div>
      )}

      {/* ── Track 1: V1 Video Backdrop ──────────────────────────────── */}
      {enabledTracks.video && (
        <div
          onClick={() => onSelectClip({ track: 'video' }, 'video')}
          style={{ height: `${videoTrackHeight}px` }}
          className={`group relative border-b border-[#242426] flex items-center justify-between px-2 text-xs text-white cursor-pointer transition-all ${
            selectedClip?.track === 'video'
              ? 'bg-[#1C1C20] shadow-[inset_3px_0_0_#F59E0B]'
              : 'hover:bg-white/[0.03] border-l-2 border-l-[#F59E0B]/50'
          }`}
          title="V1 Video Track • Click to inspect & adjust"
        >
          <div className="flex items-center gap-1.5 min-w-0 pr-1">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-studio font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
              V1
            </span>
            <Video className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] font-medium text-zinc-200 group-hover:text-white truncate">
              Video
            </span>
            {videoMaxLane > 0 && (
              <span className="text-[8px] font-mono-studio text-amber-300 bg-amber-500/20 px-1 py-0.2 rounded shrink-0 font-bold">
                {videoMaxLane + 1}L
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {renderEyeButton(videoTrackVisible, onToggleVideoTrackVisible, 'Video')}
            {renderLockButton(
              onToggleVideoTrackLocked ? videoTrackLocked : localVideoLocked,
              () => (onToggleVideoTrackLocked ? onToggleVideoTrackLocked() : setLocalVideoLocked((p) => !p)),
              'Video'
            )}
          </div>
        </div>
      )}

      {/* ── Track 2: V2 Image Graphic ───────────────────────────────── */}
      {enabledTracks.image && (
        <div
          onClick={() => onSelectClip({ track: 'image' }, 'video')}
          style={{ height: `${imageTrackHeight}px` }}
          className={`group relative border-b border-[#242426] flex items-center justify-between px-2 text-xs text-white cursor-pointer transition-all ${
            selectedClip?.track === 'image'
              ? 'bg-[#1C1C20] shadow-[inset_3px_0_0_#F43F5E]'
              : 'hover:bg-white/[0.03] border-l-2 border-l-[#F43F5E]/50'
          }`}
          title="V2 Image Track • Click to inspect & adjust"
        >
          <div className="flex items-center gap-1.5 min-w-0 pr-1">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-studio font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 shrink-0">
              V2
            </span>
            <ImageIcon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="text-[11px] font-medium text-zinc-200 group-hover:text-white truncate">
              Image
            </span>
            {imageMaxLane > 0 && (
              <span className="text-[8px] font-mono-studio text-rose-300 bg-rose-500/20 px-1 py-0.2 rounded shrink-0 font-bold">
                {imageMaxLane + 1}L
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {renderEyeButton(imageTrackVisible, onToggleImageTrackVisible, 'Image')}
            {renderLockButton(
              onToggleImageTrackLocked ? imageTrackLocked : localImageLocked,
              () => (onToggleImageTrackLocked ? onToggleImageTrackLocked() : setLocalImageLocked((p) => !p)),
              'Image'
            )}
          </div>
        </div>
      )}

      {/* ── Track 3: O1 Overlays / Elements ─────────────────────────── */}
      {enabledTracks.overlay && (
        <div
          onClick={() => onSelectClip({ track: 'overlay' }, 'overlay')}
          style={{ height: `${overlayTrackHeight}px` }}
          className={`group relative border-b border-[#242426] flex items-center justify-between px-2 text-xs text-white cursor-pointer transition-all ${
            selectedClip?.track === 'overlay'
              ? 'bg-[#1C1C20] shadow-[inset_3px_0_0_#8B5CF6]'
              : 'hover:bg-white/[0.03] border-l-2 border-l-[#8B5CF6]/50'
          }`}
          title="O1 Overlays Track • Stickers, motion graphics, and watermarks"
        >
          <div className="flex items-center gap-1.5 min-w-0 pr-1">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-studio font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 shrink-0">
              O1
            </span>
            <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-[11px] font-medium text-zinc-200 group-hover:text-white truncate">
              Overlays
            </span>
            {overlayMaxLane > 0 && (
              <span className="text-[8px] font-mono-studio text-purple-300 bg-purple-500/20 px-1 py-0.2 rounded shrink-0 font-bold">
                {overlayMaxLane + 1}L
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {renderEyeButton(overlayTrackVisible, onToggleOverlayTrackVisible, 'Overlays')}
            {renderLockButton(
              onToggleOverlayTrackLocked ? overlayTrackLocked : localOverlayLocked,
              () => (onToggleOverlayTrackLocked ? onToggleOverlayTrackLocked() : setLocalOverlayLocked((p) => !p)),
              'Overlays'
            )}
          </div>
        </div>
      )}

      {/* ── Track 4: T1 Subtitles & Captions ─────────────────────────── */}
      {enabledTracks.captions && (
        <div
          onClick={() => onSelectClip({ track: 'caption', index: 0 }, 'text')}
          style={{ height: `${captionTrackHeight}px` }}
          className={`group relative border-b border-[#242426] flex items-center justify-between px-2 text-xs text-white cursor-pointer transition-all ${
            selectedClip?.track === 'caption'
              ? 'bg-[#1C1C20] shadow-[inset_3px_0_0_#06B6D4]'
              : 'hover:bg-white/[0.03] border-l-2 border-l-[#06B6D4]/50'
          }`}
          title="T1 Captions Track • Synced typography and dynamic subtitles"
        >
          <div className="flex items-center gap-1.5 min-w-0 pr-1">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-studio font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shrink-0">
              T1
            </span>
            <Type className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-[11px] font-medium text-zinc-200 group-hover:text-white truncate">
              Captions
            </span>
            {captionMaxLane > 0 && (
              <span className="text-[8px] font-mono-studio text-cyan-300 bg-cyan-500/20 px-1 py-0.2 rounded shrink-0 font-bold">
                {captionMaxLane + 1}L
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {renderEyeButton(
              onToggleCaptionsTrackVisible ? captionsTrackVisible : localCaptionsVisible,
              () =>
                onToggleCaptionsTrackVisible
                  ? onToggleCaptionsTrackVisible()
                  : setLocalCaptionsVisible((p) => !p),
              'Captions'
            )}
            {renderLockButton(captionsTrackLocked, onToggleCaptionsTrackLocked, 'Captions')}
          </div>
        </div>
      )}

      {/* ── Track 5: T2 Titles Overlay ───────────────────────────────── */}
      {enabledTracks.title && (
        <div
          onClick={() => onSelectClip({ track: 'title' }, 'text')}
          className={`group relative h-10 border-b border-[#242426] flex items-center justify-between px-2 text-xs text-white cursor-pointer transition-all ${
            selectedClip?.track === 'title'
              ? 'bg-[#1C1C20] shadow-[inset_3px_0_0_#38BDF8]'
              : 'hover:bg-white/[0.03] border-l-2 border-l-[#38BDF8]/50'
          }`}
          title="T2 Titles Track • Main video headlines & hook titles"
        >
          <div className="flex items-center gap-1.5 min-w-0 pr-1">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-studio font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 shrink-0">
              T2
            </span>
            <Type className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="text-[11px] font-medium text-zinc-200 group-hover:text-white truncate">
              Titles
            </span>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {renderEyeButton(
              titleTrackVisible,
              () => onToggleTitleTrackVisible?.(),
              'Titles'
            )}
            {renderLockButton(titleTrackLocked, onToggleTitleTrackLocked, 'Titles')}
          </div>
        </div>
      )}

      {/* ── Track 6: A1 Voiceover Audio ─────────────────────────────── */}
      {enabledTracks.voice && (
        <div
          onClick={() => onSelectClip({ track: 'voice' }, 'voice')}
          style={{ height: `${voiceTrackHeight}px` }}
          className={`group relative border-b border-[#242426] flex items-center justify-between px-2 text-xs text-white cursor-pointer transition-all ${
            selectedClip?.track === 'voice'
              ? 'bg-[#1C1C20] shadow-[inset_3px_0_0_#10B981]'
              : 'hover:bg-white/[0.03] border-l-2 border-l-[#10B981]/50'
          }`}
          title="A1 Voiceover Track • 24kHz studio voice narration"
        >
          <div className="flex items-center gap-1.5 min-w-0 pr-1">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-studio font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
              A1
            </span>
            <Mic className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[11px] font-medium text-zinc-200 group-hover:text-white truncate">
              Voice
            </span>
            {voiceMaxLane > 0 && (
              <span className="text-[8px] font-mono-studio text-emerald-300 bg-emerald-500/20 px-1 py-0.2 rounded shrink-0 font-bold">
                {voiceMaxLane + 1}L
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {renderSoloButton(
              onToggleVoiceSolo ? voiceSolo : localVoiceSolo,
              () => (onToggleVoiceSolo ? onToggleVoiceSolo() : setLocalVoiceSolo((p) => !p)),
              'Voice'
            )}
            {renderMuteButton(voiceTrackMuted, onToggleVoiceTrackMuted, 'Voiceover')}
            {renderLockButton(
              voiceTrackLocked,
              () => onToggleVoiceTrackLocked?.(),
              'Voiceover'
            )}
          </div>
        </div>
      )}

      {/* ── Track 7: A2 Background Music ─────────────────────────────── */}
      {enabledTracks.music && (
        <div
          onClick={() => onSelectClip({ track: 'music' }, 'music')}
          style={{ height: `${musicTrackHeight}px` }}
          className={`group relative ${
            enabledTracks.sfx ? 'border-b border-[#242426]' : ''
          } flex items-center justify-between px-2 text-xs text-white cursor-pointer transition-all ${
            selectedClip?.track === 'music'
              ? 'bg-[#1C1C20] shadow-[inset_3px_0_0_#D946EF]'
              : 'hover:bg-white/[0.03] border-l-2 border-l-[#D946EF]/50'
          }`}
          title="A2 Music Track • Background soundtrack & beat ducking"
        >
          <div className="flex items-center gap-1.5 min-w-0 pr-1">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-studio font-bold bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30 shrink-0">
              A2
            </span>
            <Music className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
            <span className="text-[11px] font-medium text-zinc-200 group-hover:text-white truncate">
              Music
            </span>
            {musicMaxLane > 0 && (
              <span className="text-[8px] font-mono-studio text-fuchsia-300 bg-fuchsia-500/20 px-1 py-0.2 rounded shrink-0 font-bold">
                {musicMaxLane + 1}L
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {renderSoloButton(
              onToggleMusicSolo ? musicSolo : localMusicSolo,
              () => (onToggleMusicSolo ? onToggleMusicSolo() : setLocalMusicSolo((p) => !p)),
              'Music'
            )}
            {renderMuteButton(musicTrackMuted, onToggleMusicTrackMuted, 'Music')}
            {renderLockButton(
              musicTrackLocked,
              () => onToggleMusicTrackLocked?.(),
              'Music'
            )}
          </div>
        </div>
      )}

      {/* ── Track 8: A3 Sound Effects ────────────────────────────────── */}
      {enabledTracks.sfx && (
        <div
          onClick={() => onSelectClip({ track: 'sfx' }, 'music')}
          style={{ height: `${sfxTrackHeight}px` }}
          className={`group relative flex items-center justify-between px-2 text-xs text-white cursor-pointer transition-all ${
            selectedClip?.track === 'sfx'
              ? 'bg-[#1C1C20] shadow-[inset_3px_0_0_#F97316]'
              : 'hover:bg-white/[0.03] border-l-2 border-l-[#F97316]/50'
          }`}
          title="A3 Sound FX Track • Transition whooshes, impacts, and risers"
        >
          <div className="flex items-center gap-1.5 min-w-0 pr-1">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-studio font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30 shrink-0">
              A3
            </span>
            <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span className="text-[11px] font-medium text-zinc-200 group-hover:text-white truncate">
              Sound FX
            </span>
            {sfxMaxLane > 0 && (
              <span className="text-[8px] font-mono-studio text-orange-300 bg-orange-500/20 px-1 py-0.2 rounded shrink-0 font-bold">
                {sfxMaxLane + 1}L
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {renderSoloButton(
              onToggleSfxSolo ? sfxSolo : localSfxSolo,
              () => (onToggleSfxSolo ? onToggleSfxSolo() : setLocalSfxSolo((p) => !p)),
              'Sound FX'
            )}
            {renderMuteButton(sfxTrackMuted, onToggleSfxTrackMuted, 'Sound FX')}
            {renderLockButton(
              sfxTrackLocked,
              () => onToggleSfxTrackLocked?.(),
              'Sound FX'
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineTrackHeaders;
