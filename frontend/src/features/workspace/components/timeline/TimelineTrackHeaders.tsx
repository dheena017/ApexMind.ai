import React, { useEffect, useState } from 'react';
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
  GripVertical,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { EnabledTracks, SelectedClip, TrackId, DEFAULT_TRACK_ORDER } from './timelineTypes';

export interface TimelineTrackHeadersProps {
  trackOrder?: TrackId[];
  onMoveTrack?: (trackId: TrackId, direction: 'up' | 'down') => void;
  onReorderTracks?: (newOrder: TrackId[]) => void;
  enabledTracks: EnabledTracks;
  selectedClip?: SelectedClip | null;
  onSelectClip: (clip: SelectedClip, compound?: 'video' | 'text' | 'voice' | 'music' | 'overlay') => void;
  onSyncAudioAndCC?: () => void;
  hasVoiceMismatch?: boolean;
  videoTrackVisible: boolean;
  onToggleVideoTrackVisible: () => void;
  videoTrackHeight?: number;
  videoMaxLane?: number;
  videoTrackLocked?: boolean;
  onToggleVideoTrackLocked?: () => void;
  videoTrackMuted?: boolean;
  onToggleVideoTrackMuted?: () => void;

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
  titleTrackHeight?: number;
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
  trackOrder,
  onMoveTrack,
  onReorderTracks,
  enabledTracks,
  selectedClip,
  onSelectClip,
  onSyncAudioAndCC,
  hasVoiceMismatch = false,
  videoTrackVisible,
  onToggleVideoTrackVisible,
  videoTrackHeight = 40,
  videoMaxLane = 0,
  videoTrackLocked = false,
  onToggleVideoTrackLocked,
  videoTrackMuted,
  onToggleVideoTrackMuted,

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
  titleTrackHeight = 40,
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
  const [localVideoMuted, setLocalVideoMuted] = useState(false);

  useEffect(() => {
    const handleAudioEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail?.volume === 'number') {
        setLocalVideoMuted(detail.volume === 0);
      }
    };
    window.addEventListener('workspace:backdrop-audio', handleAudioEvent);
    return () => window.removeEventListener('workspace:backdrop-audio', handleAudioEvent);
  }, []);

  const isVideoMuted = videoTrackMuted !== undefined ? videoTrackMuted : localVideoMuted;
  const handleToggleVideoMute = () => {
    if (onToggleVideoTrackMuted) {
      onToggleVideoTrackMuted();
    } else {
      const nextMuted = !localVideoMuted;
      setLocalVideoMuted(nextMuted);
      window.dispatchEvent(
        new CustomEvent('workspace:backdrop-audio', {
          detail: { volume: nextMuted ? 0 : 100 },
        })
      );
    }
  };

  // Local fallback track ordering
  const [internalOrder, setInternalOrder] = useState<TrackId[]>(DEFAULT_TRACK_ORDER);
  const activeOrder = trackOrder || internalOrder;

  // Drag and drop reordering states
  const [draggedTrackId, setDraggedTrackId] = useState<TrackId | null>(null);
  const [dragOverTrackId, setDragOverTrackId] = useState<TrackId | null>(null);

  // Active track count for header indicator
  const activeTrackCount = Object.values(enabledTracks).filter(Boolean).length;
  const visibleEnabledTracks = activeOrder.filter((t) => enabledTracks[t]);

  const handleMove = (trackId: TrackId, direction: 'up' | 'down') => {
    if (onMoveTrack) {
      onMoveTrack(trackId, direction);
      return;
    }
    const currIdx = visibleEnabledTracks.indexOf(trackId);
    if (currIdx === -1) return;
    const targetIdx = direction === 'up' ? currIdx - 1 : currIdx + 1;
    if (targetIdx < 0 || targetIdx >= visibleEnabledTracks.length) return;
    const targetTrackId = visibleEnabledTracks[targetIdx];
    const newOrder = [...activeOrder];
    const fromIdx = newOrder.indexOf(trackId);
    const toIdx = newOrder.indexOf(targetTrackId);
    if (fromIdx === -1 || toIdx === -1) return;
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, trackId);
    setInternalOrder(newOrder);
    onReorderTracks?.(newOrder);
  };

  const handleDrop = (targetTrackId: TrackId) => {
    const sourceId = draggedTrackId;
    if (!sourceId || sourceId === targetTrackId) {
      setDraggedTrackId(null);
      setDragOverTrackId(null);
      return;
    }
    if (onReorderTracks) {
      const newOrder = [...activeOrder];
      const fromIdx = newOrder.indexOf(sourceId);
      const toIdx = newOrder.indexOf(targetTrackId);
      if (fromIdx !== -1 && toIdx !== -1) {
        newOrder.splice(fromIdx, 1);
        newOrder.splice(toIdx, 0, sourceId);
        onReorderTracks(newOrder);
      }
    } else {
      const newOrder = [...activeOrder];
      const fromIdx = newOrder.indexOf(sourceId);
      const toIdx = newOrder.indexOf(targetTrackId);
      if (fromIdx !== -1 && toIdx !== -1) {
        newOrder.splice(fromIdx, 1);
        newOrder.splice(toIdx, 0, sourceId);
        setInternalOrder(newOrder);
      }
    }
    setDraggedTrackId(null);
    setDragOverTrackId(null);
  };

  const getDropProps = (trackId: TrackId) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragOverTrackId !== trackId) {
        setDragOverTrackId(trackId);
      }
    },
    onDragLeave: () => {
      if (dragOverTrackId === trackId) {
        setDragOverTrackId(null);
      }
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      handleDrop(trackId);
    },
  });

  // ── Render Move Controls (Drag Handle + Up / Down Arrows) ─────────────
  const renderMoveControls = (trackId: TrackId) => {
    const isFirst = visibleEnabledTracks[0] === trackId;
    const isLast = visibleEnabledTracks[visibleEnabledTracks.length - 1] === trackId;

    return (
      <div className="flex items-center gap-0.5 shrink-0 -ml-0.5 mr-0.5">
        {/* Drag Reorder Handle */}
        <div
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            e.dataTransfer.setData('text/plain', trackId);
            e.dataTransfer.effectAllowed = 'move';
            setDraggedTrackId(trackId);
          }}
          onDragEnd={() => {
            setDraggedTrackId(null);
            setDragOverTrackId(null);
          }}
          className="text-zinc-500 hover:text-white cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-white/10 transition-colors"
          title="Drag up or down to reorder track"
          aria-label={`Drag to reorder ${trackId} track`}
        >
          <GripVertical className="w-3 h-3" />
        </div>

        {/* Move Up / Down Buttons */}
        <div className="flex flex-col items-center justify-center -space-y-1">
          <button
            type="button"
            disabled={isFirst}
            onClick={(e) => {
              e.stopPropagation();
              handleMove(trackId, 'up');
            }}
            title={isFirst ? 'Already at top' : 'Move track up'}
            aria-label={`Move ${trackId} track up`}
            className={`p-0.2 rounded transition-colors ${
              isFirst
                ? 'opacity-20 cursor-not-allowed text-zinc-600'
                : 'text-zinc-400 hover:text-white hover:bg-white/15 cursor-pointer active:scale-90'
            }`}
          >
            <ChevronUp className="w-2.5 h-2.5" />
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={(e) => {
              e.stopPropagation();
              handleMove(trackId, 'down');
            }}
            title={isLast ? 'Already at bottom' : 'Move track down'}
            aria-label={`Move ${trackId} track down`}
            className={`p-0.2 rounded transition-colors ${
              isLast
                ? 'opacity-20 cursor-not-allowed text-zinc-600'
                : 'text-zinc-400 hover:text-white hover:bg-white/15 cursor-pointer active:scale-90'
            }`}
          >
            <ChevronDown className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    );
  };

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

  // ── Track Header Renderers ───────────────────────────────────────────
  const renderVideoHeader = () => (
    <div
      key="track-header-video"
      {...getDropProps('video')}
      onClick={() => onSelectClip({ track: 'video', all: true }, 'video')}
      style={{ height: `${videoTrackHeight}px` }}
      className={`group relative box-border border-b border-[#242426] flex items-center justify-between px-2 text-xs text-white cursor-pointer transition-all ${
        dragOverTrackId === 'video' ? 'bg-amber-500/15 border-t-2 border-t-amber-400' : ''
      } ${draggedTrackId === 'video' ? 'opacity-40' : ''} ${
        selectedClip?.track === 'video'
          ? 'bg-[#1C1C20] shadow-[inset_3px_0_0_#F59E0B]'
          : 'hover:bg-white/[0.03] border-l-2 border-l-[#F59E0B]/50'
      }`}
      title="V1 Video Track • Click to inspect & adjust (Drag or click arrows to move up/down)"
    >
      <div className="flex items-center gap-1 min-w-0 pr-1">
        {renderMoveControls('video')}
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
        {renderMuteButton(isVideoMuted, handleToggleVideoMute, 'Video Sound')}
        {renderLockButton(
          onToggleVideoTrackLocked ? videoTrackLocked : localVideoLocked,
          () => (onToggleVideoTrackLocked ? onToggleVideoTrackLocked() : setLocalVideoLocked((p) => !p)),
          'Video'
        )}
      </div>
    </div>
  );

  const renderImageHeader = () => (
    <div
      key="track-header-image"
      {...getDropProps('image')}
      onClick={() => onSelectClip({ track: 'image', all: true }, 'video')}
      style={{ height: `${imageTrackHeight}px` }}
      className={`group relative box-border border-b border-[#242426] flex items-center justify-between px-2 text-xs text-white cursor-pointer transition-all ${
        dragOverTrackId === 'image' ? 'bg-amber-500/15 border-t-2 border-t-amber-400' : ''
      } ${draggedTrackId === 'image' ? 'opacity-40' : ''} ${
        selectedClip?.track === 'image'
          ? 'bg-[#1C1C20] shadow-[inset_3px_0_0_#F43F5E]'
          : 'hover:bg-white/[0.03] border-l-2 border-l-[#F43F5E]/50'
      }`}
      title="V2 Image Track • Click to inspect & adjust (Drag or click arrows to move up/down)"
    >
      <div className="flex items-center gap-1 min-w-0 pr-1">
        {renderMoveControls('image')}
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
  );

  const renderOverlayHeader = () => (
    <div
      key="track-header-overlay"
      {...getDropProps('overlay')}
      onClick={() => onSelectClip({ track: 'overlay', all: true }, 'overlay')}
      style={{ height: `${overlayTrackHeight}px` }}
      className={`group relative box-border border-b border-[#242426] flex items-center justify-between px-2 text-xs text-white cursor-pointer transition-all ${
        dragOverTrackId === 'overlay' ? 'bg-amber-500/15 border-t-2 border-t-amber-400' : ''
      } ${draggedTrackId === 'overlay' ? 'opacity-40' : ''} ${
        selectedClip?.track === 'overlay'
          ? 'bg-[#1C1C20] shadow-[inset_3px_0_0_#8B5CF6]'
          : 'hover:bg-white/[0.03] border-l-2 border-l-[#8B5CF6]/50'
      }`}
      title="O1 Overlays Track • Stickers, motion graphics, and watermarks (Drag or click arrows to move up/down)"
    >
      <div className="flex items-center gap-1 min-w-0 pr-1">
        {renderMoveControls('overlay')}
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-studio font-bold bg-purple-500/15 text-blue-400 border border-blue-500/30 shrink-0">
          O1
        </span>
        <Layers className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span className="text-[11px] font-medium text-zinc-200 group-hover:text-white truncate">
          Overlays
        </span>
        {overlayMaxLane > 0 && (
          <span className="text-[8px] font-mono-studio text-blue-300 bg-blue-500/10 px-1 py-0.2 rounded shrink-0 font-bold">
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
  );

  const renderCaptionsHeader = () => (
    <div
      key="track-header-captions"
      {...getDropProps('captions')}
      onClick={() => onSelectClip({ track: 'caption', all: true }, 'text')}
      style={{ height: `${captionTrackHeight}px` }}
      className={`group relative box-border border-b border-[#242426] flex items-center justify-between px-2 text-xs text-white cursor-pointer transition-all ${
        dragOverTrackId === 'captions' ? 'bg-amber-500/15 border-t-2 border-t-amber-400' : ''
      } ${draggedTrackId === 'captions' ? 'opacity-40' : ''} ${
        selectedClip?.track === 'caption'
          ? 'bg-[#1C1C20] shadow-[inset_3px_0_0_#06B6D4]'
          : 'hover:bg-white/[0.03] border-l-2 border-l-[#06B6D4]/50'
      }`}
      title="T1 Captions Track • Synced typography and dynamic subtitles (Drag or click arrows to move up/down)"
    >
      <div className="flex items-center gap-1 min-w-0 pr-1">
        {renderMoveControls('captions')}
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
  );

  const renderTitleHeader = () => (
    <div
      key="track-header-title"
      {...getDropProps('title')}
      onClick={() => onSelectClip({ track: 'title', all: true }, 'text')}
      style={{ height: `${titleTrackHeight}px` }}
      className={`group relative box-border border-b border-[#242426] flex items-center justify-between px-2 text-xs text-white cursor-pointer transition-all ${
        dragOverTrackId === 'title' ? 'bg-amber-500/15 border-t-2 border-t-amber-400' : ''
      } ${draggedTrackId === 'title' ? 'opacity-40' : ''} ${
        selectedClip?.track === 'title'
          ? 'bg-[#1C1C20] shadow-[inset_3px_0_0_#38BDF8]'
          : 'hover:bg-white/[0.03] border-l-2 border-l-[#38BDF8]/50'
      }`}
      title="T2 Titles Track • Main video headlines & hook titles (Drag or click arrows to move up/down)"
    >
      <div className="flex items-center gap-1 min-w-0 pr-1">
        {renderMoveControls('title')}
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
  );

  const renderVoiceHeader = () => (
    <div
      key="track-header-voice"
      {...getDropProps('voice')}
      onClick={() => onSelectClip({ track: 'voice', all: true }, 'voice')}
      style={{ height: `${voiceTrackHeight}px` }}
      className={`group relative box-border border-b border-[#242426] flex items-center justify-between px-2 text-xs text-white cursor-pointer transition-all ${
        dragOverTrackId === 'voice' ? 'bg-amber-500/15 border-t-2 border-t-amber-400' : ''
      } ${draggedTrackId === 'voice' ? 'opacity-40' : ''} ${
        selectedClip?.track === 'voice'
          ? 'bg-[#1C1C20] shadow-[inset_3px_0_0_#10B981]'
          : 'hover:bg-white/[0.03] border-l-2 border-l-[#10B981]/50'
      }`}
      title="A1 Voiceover Track • 24kHz studio voice narration (Drag or click arrows to move up/down)"
    >
      <div className="flex items-center gap-1 min-w-0 pr-1">
        {renderMoveControls('voice')}
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
        {renderMuteButton(voiceTrackMuted, onToggleVoiceTrackMuted, 'Voiceover')}
        {renderLockButton(
          voiceTrackLocked,
          () => onToggleVoiceTrackLocked?.(),
          'Voiceover'
        )}
      </div>
    </div>
  );

  const renderMusicHeader = () => (
    <div
      key="track-header-music"
      {...getDropProps('music')}
      onClick={() => onSelectClip({ track: 'music', all: true }, 'music')}
      style={{ height: `${musicTrackHeight}px` }}
      className={`group relative box-border border-b border-[#242426] flex items-center justify-between px-2 text-xs text-white cursor-pointer transition-all ${
        dragOverTrackId === 'music' ? 'bg-amber-500/15 border-t-2 border-t-amber-400' : ''
      } ${draggedTrackId === 'music' ? 'opacity-40' : ''} ${
        selectedClip?.track === 'music'
          ? 'bg-[#1C1C20] shadow-[inset_3px_0_0_#D946EF]'
          : 'hover:bg-white/[0.03] border-l-2 border-l-[#D946EF]/50'
      }`}
      title="A2 Music Track • Background soundtrack & beat ducking (Drag or click arrows to move up/down)"
    >
      <div className="flex items-center gap-1 min-w-0 pr-1">
        {renderMoveControls('music')}
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
        {renderMuteButton(musicTrackMuted, onToggleMusicTrackMuted, 'Music')}
        {renderLockButton(
          musicTrackLocked,
          () => onToggleMusicTrackLocked?.(),
          'Music'
        )}
      </div>
    </div>
  );

  const renderSfxHeader = () => (
    <div
      key="track-header-sfx"
      {...getDropProps('sfx')}
      onClick={() => onSelectClip({ track: 'sfx', all: true }, 'music')}
      style={{ height: `${sfxTrackHeight}px` }}
      className={`group relative box-border border-b border-[#242426] flex items-center justify-between px-2 text-xs text-white cursor-pointer transition-all ${
        dragOverTrackId === 'sfx' ? 'bg-amber-500/15 border-t-2 border-t-amber-400' : ''
      } ${draggedTrackId === 'sfx' ? 'opacity-40' : ''} ${
        selectedClip?.track === 'sfx'
          ? 'bg-[#1C1C20] shadow-[inset_3px_0_0_#F97316]'
          : 'hover:bg-white/[0.03] border-l-2 border-l-[#F97316]/50'
      }`}
      title="A3 Sound FX Track • Transition whooshes, impacts, and risers (Drag or click arrows to move up/down)"
    >
      <div className="flex items-center gap-1 min-w-0 pr-1">
        {renderMoveControls('sfx')}
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-studio font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30 shrink-0">
          A3
        </span>
        <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" />
        <span className="text-[11px] font-bold text-zinc-200 group-hover:text-white truncate">
          SFX
        </span>
        {sfxMaxLane > 0 && (
          <span className="text-[8px] font-mono-studio text-orange-300 bg-orange-500/20 px-1 py-0.2 rounded shrink-0 font-bold">
            {sfxMaxLane + 1}L
          </span>
        )}
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        {renderMuteButton(sfxTrackMuted, onToggleSfxTrackMuted, 'Sound FX')}
        {renderLockButton(
          sfxTrackLocked,
          () => onToggleSfxTrackLocked?.(),
          'Sound FX'
        )}
      </div>
    </div>
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

      {/* ── Dynamic Order Track Headers ────────────────────────────── */}
      {activeOrder.map((trackId) => {
        if (!enabledTracks[trackId]) return null;
        switch (trackId) {
          case 'video':
            return renderVideoHeader();
          case 'image':
            return renderImageHeader();
          case 'overlay':
            return renderOverlayHeader();
          case 'captions':
            return renderCaptionsHeader();
          case 'title':
            return renderTitleHeader();
          case 'voice':
            return renderVoiceHeader();
          case 'music':
            return renderMusicHeader();
          case 'sfx':
            return renderSfxHeader();
          default:
            return null;
        }
      })}
    </div>
  );
};

export default TimelineTrackHeaders;
