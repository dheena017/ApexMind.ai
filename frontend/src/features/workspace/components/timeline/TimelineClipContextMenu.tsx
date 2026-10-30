import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Copy,
  Scissors,
  Trash2,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Tag,
  ZoomIn,
  AlignLeft,
  Pencil,
  ChevronRight,
  Maximize2,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Crop,
  Gauge,
  Clock,
  Timer,
  ArrowUp,
  ArrowDown,
  Layers,
  Film,
  Image as ImageIcon,
  Mic,
  Music,
  Sparkles,
  Type,
  Heading,
  Info,
  Wand2,
  ArrowRightToLine,
  ArrowLeftToLine,
  Pin,
  Split,
  Sliders,
  Waves,
  Check,
} from 'lucide-react';

export type ContextMenuTrackType =
  | 'video'
  | 'image'
  | 'overlay'
  | 'voice'
  | 'music'
  | 'sfx'
  | 'caption'
  | 'title';

export interface TimelineClipContextMenuProps {
  x: number;
  y: number;
  trackType: ContextMenuTrackType;
  isVisible: boolean;
  isMuted?: boolean;
  isLocked?: boolean;
  isHidden?: boolean;
  isDisabled?: boolean;
  clipName?: string;
  startTime?: number;
  duration?: number;
  currentSpeed?: number;
  onClose: () => void;

  // Primary Edit & Clipboard
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onPasteAttributes?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onRippleDelete?: () => void;
  onRename?: () => void;

  // Trim & Alignment
  onSplit?: () => void;
  onTrimStartToPlayhead?: () => void;
  onTrimEndToPlayhead?: () => void;
  onAlignToPlayhead?: () => void;
  onResetDuration?: () => void;

  // Track & Clip States
  onToggleDisable?: () => void;
  onLock?: () => void;
  onMute?: () => void;
  onHide?: () => void;

  // Speed & Retime
  onSpeedDuration?: () => void;
  onSetSpeed?: (speed: number) => void;
  onReverse?: () => void;
  onFreezeFrame?: () => void;

  // Audio Operations
  onAudioGain?: () => void;
  onFadeIn?: () => void;
  onFadeOut?: () => void;
  onNormalizeAudio?: () => void;
  onNoiseReduction?: () => void;
  onDetach?: () => void;

  // Visual & Transform
  onScaleToFit?: () => void;
  onScaleToFill?: () => void;
  onFlipHorizontal?: () => void;
  onFlipVertical?: () => void;
  onResetTransform?: () => void;
  onCrop?: () => void;

  // Layer & Arrange
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onMoveLaneUp?: () => void;
  onMoveLaneDown?: () => void;

  // AI & Smart Tools
  onAiEnhance?: () => void;
  onGenerateCaptions?: () => void;

  // View, Inspection & Metadata
  onZoomToClip?: () => void;
  onColorLabel?: (color: string) => void;
  onCopyTimings?: () => void;
  onProperties?: () => void;
}

const COLOR_LABELS = [
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Pink', value: '#EC4899' },
];

const SPEED_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

const formatSeconds = (sec?: number): string => {
  if (sec === undefined || Number.isNaN(sec)) return '00:00.0';
  const mins = Math.floor(sec / 60);
  const remainingSec = (sec % 60).toFixed(1);
  const paddedSec = Number(remainingSec) < 10 ? `0${remainingSec}` : remainingSec;
  return `${mins.toString().padStart(2, '0')}:${paddedSec}`;
};

type SubmenuType = 'color' | 'transform' | 'speed' | 'audio' | 'layer' | 'ai' | 'properties' | null;

export const TimelineClipContextMenu: React.FC<TimelineClipContextMenuProps> = ({
  x,
  y,
  trackType,
  isVisible,
  isMuted = false,
  isLocked = false,
  isHidden = false,
  isDisabled = false,
  clipName,
  startTime,
  duration,
  currentSpeed = 1.0,
  onClose,
  onCut,
  onCopy,
  onPaste,
  onPasteAttributes,
  onDuplicate,
  onDelete,
  onRippleDelete,
  onRename,
  onSplit,
  onTrimStartToPlayhead,
  onTrimEndToPlayhead,
  onAlignToPlayhead,
  onResetDuration,
  onToggleDisable,
  onLock,
  onMute,
  onHide,
  onSpeedDuration,
  onSetSpeed,
  onReverse,
  onFreezeFrame,
  onAudioGain,
  onFadeIn,
  onFadeOut,
  onNormalizeAudio,
  onNoiseReduction,
  onDetach,
  onScaleToFit,
  onScaleToFill,
  onFlipHorizontal,
  onFlipVertical,
  onResetTransform,
  onCrop,
  onBringToFront,
  onSendToBack,
  onMoveLaneUp,
  onMoveLaneDown,
  onAiEnhance,
  onGenerateCaptions,
  onZoomToClip,
  onColorLabel,
  onCopyTimings,
  onProperties,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<SubmenuType>(null);
  const [submenuPos, setSubmenuPos] = useState<{ x: number; y: number } | null>(null);
  const submenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 1800);
  };

  // Measure synchronously before browser paint to guarantee 100% viewport fit
  const [adjustedPos, setAdjustedPos] = useState(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;
    const estW = 236;
    const estH = 380;
    const initX = Math.max(12, Math.min(x, vw - estW - 12));
    const initY = Math.max(12, y + estH > vh - 12 ? Math.max(12, y - estH) : y);
    return { x: initX, y: initY, flippedUp: y + estH > vh - 12 };
  });

  useLayoutEffect(() => {
    if (!isVisible || !menuRef.current) return;
    const menu = menuRef.current;
    const width = menu.offsetWidth || 236;
    const height = menu.offsetHeight || 380;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let nx = x;
    let ny = y;
    let flippedUp = false;

    // Flip upwards if extending below viewport boundary
    if (y + height > vh - 12) {
      if (y - height >= 12) {
        ny = y - height;
        flippedUp = true;
      } else {
        ny = Math.max(12, vh - height - 12);
        flippedUp = ny < y;
      }
    }

    // Keep within horizontal boundaries
    if (x + width > vw - 12) {
      nx = Math.max(12, vw - width - 12);
    } else {
      nx = Math.max(12, x);
    }

    setAdjustedPos({ x: nx, y: ny, flippedUp });
  }, [isVisible, x, y]);

  // Submenu Positioning & Hover Logic
  const openSubmenu = (type: SubmenuType, targetEl: HTMLElement) => {
    if (submenuTimeoutRef.current) clearTimeout(submenuTimeoutRef.current);
    const rect = targetEl.getBoundingClientRect();
    const subMenuW = type === 'color' ? 184 : type === 'properties' ? 240 : 204;
    const subMenuH = type === 'color' ? 124 : type === 'properties' ? 190 : 220;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const openLeft = rect.right + subMenuW > vw - 12;
    const openX = openLeft
      ? Math.max(12, rect.left - subMenuW - 4)
      : Math.min(vw - subMenuW - 12, rect.right + 4);
    const openY = Math.max(12, Math.min(rect.top - 4, vh - subMenuH - 12));

    setSubmenuPos({ x: openX, y: openY });
    setActiveSubmenu(type);
  };

  const handleSubmenuTriggerLeave = () => {
    submenuTimeoutRef.current = setTimeout(() => {
      setActiveSubmenu(null);
    }, 180);
  };

  const handleSubmenuEnter = () => {
    if (submenuTimeoutRef.current) clearTimeout(submenuTimeoutRef.current);
  };

  const handleSubmenuLeave = () => {
    setActiveSubmenu(null);
  };

  // Close on outside click, window resize, timeline scroll, or Escape key
  useEffect(() => {
    if (!isVisible) return;
    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement)?.closest?.('.timeline-submenu-portal')
      ) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleScroll = (e: Event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement)?.closest?.('.timeline-submenu-portal')
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    window.addEventListener('resize', onClose);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      if (submenuTimeoutRef.current) clearTimeout(submenuTimeoutRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', onClose);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isVisible, onClose]);

  if (!isVisible || typeof document === 'undefined') return null;

  const isAudioTrack = trackType === 'voice' || trackType === 'music' || trackType === 'sfx';
  const isVideoTrack = trackType === 'video';
  const isImageTrack = trackType === 'image';
  const isVisualTrack = isVideoTrack || isImageTrack || trackType === 'overlay' || trackType === 'title';
  const hasAudioTrack = isAudioTrack || isVideoTrack;
  const isCaptionTrack = trackType === 'caption';

  const trackLabel: Record<ContextMenuTrackType, string> = {
    video: 'Video Clip',
    image: 'Image Clip',
    overlay: 'Overlay Clip',
    voice: 'Voiceover Clip',
    music: 'Music Clip',
    sfx: 'SFX Clip',
    caption: 'Caption Cue',
    title: 'Title Clip',
  };

  const trackThemeColor: Record<ContextMenuTrackType, string> = {
    video: '#F59E0B',
    image: '#10B981',
    overlay: '#6366F1',
    voice: '#22C55E',
    music: '#A855F7',
    sfx: '#F59E0B',
    caption: '#3B82F6',
    title: '#8B5CF6',
  };

  const getTrackIcon = () => {
    switch (trackType) {
      case 'video':
        return <Film className="w-3.5 h-3.5 text-amber-400" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />;
      case 'overlay':
        return <Layers className="w-3.5 h-3.5 text-indigo-400" />;
      case 'voice':
        return <Mic className="w-3.5 h-3.5 text-green-400" />;
      case 'music':
        return <Music className="w-3.5 h-3.5 text-purple-400" />;
      case 'sfx':
        return <Sparkles className="w-3.5 h-3.5 text-amber-300" />;
      case 'caption':
        return <Type className="w-3.5 h-3.5 text-blue-400" />;
      case 'title':
        return <Heading className="w-3.5 h-3.5 text-violet-400" />;
      default:
        return <Film className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const handleAction = (fn?: () => void) => {
    setActiveSubmenu(null);
    fn?.();
    onClose();
  };

  // Clipboard & default handlers
  const handleCopy = () => {
    if (onCopy) {
      onCopy();
    } else {
      const summary = `[${trackLabel[trackType]}] ${clipName || ''} | Start: ${(startTime ?? 0).toFixed(2)}s | Dur: ${(duration ?? 0).toFixed(2)}s`;
      navigator.clipboard?.writeText(summary).catch(() => {});
      showToast('Copied clip summary');
    }
    onClose();
  };

  const handleCut = () => {
    if (onCut) {
      onCut();
    } else {
      handleCopy();
      onDelete?.();
    }
    onClose();
  };

  const handleCopyTimings = () => {
    if (onCopyTimings) {
      onCopyTimings();
    } else {
      const text = `Start: ${(startTime ?? 0).toFixed(2)}s | Duration: ${(duration ?? 0).toFixed(2)}s | End: {((startTime ?? 0) + (duration ?? 0)).toFixed(2)}s`;
      navigator.clipboard?.writeText(text).catch(() => {});
      showToast('Timings copied');
    }
    onClose();
  };

  const handleRippleDelete = () => {
    if (onRippleDelete) {
      onRippleDelete();
    } else {
      onDelete?.();
    }
    onClose();
  };

  const menuContent = (
    <div
      ref={menuRef}
      className="timeline-context-menu"
      style={{
        position: 'fixed',
        left: `${adjustedPos.x}px`,
        top: `${adjustedPos.y}px`,
        zIndex: 99999,
        transformOrigin: adjustedPos.flippedUp ? 'bottom left' : 'top left',
        maxHeight: 'calc(100vh - 24px)',
        overflowY: 'auto',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header / Track Badge with clip name and timing */}
      <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between rounded-t-[11px] bg-black/40 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-2 h-2 rounded-full shrink-0 shadow-sm"
            style={{ background: trackThemeColor[trackType] }}
          />
          {getTrackIcon()}
          <span className="text-[10px] font-mono text-neutral-300 uppercase tracking-widest select-none truncate font-bold">
            {trackLabel[trackType]}
          </span>
        </div>
        {duration !== undefined && (
          <span className="text-[9px] font-mono text-neutral-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded shrink-0 tabular-nums">
            {duration.toFixed(1)}s
          </span>
        )}
      </div>

      {/* Optional Clip Name Banner */}
      {clipName && (
        <div className="px-3 py-1 bg-white/[0.03] border-b border-white/[0.05] text-[10px] text-neutral-400 truncate select-none">
          {clipName}
        </div>
      )}

      {/* Menu Items Container */}
      <div className="py-1 flex flex-col">
        {/* ── Primary Edit Actions ── */}
        {onRename && (
          <ContextMenuItem
            icon={<Pencil className="w-3.5 h-3.5" />}
            label="Rename Clip"
            shortcut="F2"
            onClick={() => handleAction(onRename)}
          />
        )}

        <ContextMenuItem
          icon={<Scissors className="w-3.5 h-3.5" />}
          label="Cut Clip"
          shortcut="Ctrl+X"
          onClick={handleCut}
        />

        <ContextMenuItem
          icon={<Copy className="w-3.5 h-3.5" />}
          label="Copy Clip"
          shortcut="Ctrl+C"
          onClick={handleCopy}
        />

        {onPaste && (
          <ContextMenuItem
            icon={<Copy className="w-3.5 h-3.5" />}
            label="Paste"
            shortcut="Ctrl+V"
            onClick={() => handleAction(onPaste)}
          />
        )}

        {onDuplicate && (
          <ContextMenuItem
            icon={<Copy className="w-3.5 h-3.5 text-amber-400/90" />}
            label="Duplicate Clip"
            shortcut="Ctrl+D"
            onClick={() => handleAction(onDuplicate)}
          />
        )}

        {/* ── Precision Trimming & Snapping ── */}
        {onSplit && (
          <ContextMenuItem
            icon={<Split className="w-3.5 h-3.5 text-sky-400/90" />}
            label="Split at Playhead"
            shortcut="Ctrl+B"
            onClick={() => handleAction(onSplit)}
          />
        )}

        {onTrimStartToPlayhead && (
          <ContextMenuItem
            icon={<ArrowRightToLine className="w-3.5 h-3.5 text-emerald-400/90" />}
            label="Trim Start to Playhead"
            shortcut="Q"
            onClick={() => handleAction(onTrimStartToPlayhead)}
          />
        )}

        {onTrimEndToPlayhead && (
          <ContextMenuItem
            icon={<ArrowLeftToLine className="w-3.5 h-3.5 text-emerald-400/90" />}
            label="Trim End to Playhead"
            shortcut="W"
            onClick={() => handleAction(onTrimEndToPlayhead)}
          />
        )}

        {onAlignToPlayhead && (
          <ContextMenuItem
            icon={<Pin className="w-3.5 h-3.5 text-purple-400/90" />}
            label="Snap to Playhead"
            shortcut="Ctrl+P"
            onClick={() => handleAction(onAlignToPlayhead)}
          />
        )}

        <div className="my-1 border-t border-white/[0.08]" />

        {/* ── Visual Transform Submenu (Video / Image / Overlay / Title) ── */}
        {isVisualTrack && (
          <ContextMenuSubmenuTrigger
            icon={<Maximize2 className="w-3.5 h-3.5 text-cyan-400" />}
            label="Transform & Fit"
            isActive={activeSubmenu === 'transform'}
            onMouseEnter={(el) => openSubmenu('transform', el)}
            onMouseLeave={handleSubmenuTriggerLeave}
          />
        )}

        {/* ── Speed & Retime Submenu ── */}
        {(isVideoTrack || isAudioTrack || isImageTrack) && (
          <ContextMenuSubmenuTrigger
            icon={<Gauge className="w-3.5 h-3.5 text-amber-400" />}
            label="Speed & Retime"
            badge={currentSpeed && currentSpeed !== 1 ? `${currentSpeed}x` : undefined}
            isActive={activeSubmenu === 'speed'}
            onMouseEnter={(el) => openSubmenu('speed', el)}
            onMouseLeave={handleSubmenuTriggerLeave}
          />
        )}

        {/* ── Audio Tools Submenu ── */}
        {hasAudioTrack && (
          <ContextMenuSubmenuTrigger
            icon={<Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            label="Audio Enhancements"
            isActive={activeSubmenu === 'audio'}
            onMouseEnter={(el) => openSubmenu('audio', el)}
            onMouseLeave={handleSubmenuTriggerLeave}
          />
        )}

        {/* ── Layer / Arrange Submenu ── */}
        {(isVisualTrack || isCaptionTrack) && (
          <ContextMenuSubmenuTrigger
            icon={<Layers className="w-3.5 h-3.5 text-indigo-400" />}
            label="Arrange & Layer"
            isActive={activeSubmenu === 'layer'}
            onMouseEnter={(el) => openSubmenu('layer', el)}
            onMouseLeave={handleSubmenuTriggerLeave}
          />
        )}

        {/* ── AI Tools Submenu ── */}
        {(hasAudioTrack || isVisualTrack) && (
          <ContextMenuSubmenuTrigger
            icon={<Wand2 className="w-3.5 h-3.5 text-fuchsia-400" />}
            label="AI Magic Tools"
            isActive={activeSubmenu === 'ai'}
            onMouseEnter={(el) => openSubmenu('ai', el)}
            onMouseLeave={handleSubmenuTriggerLeave}
          />
        )}

        {/* ── Color Label Trigger ── */}
        <ContextMenuSubmenuTrigger
          icon={<Tag className="w-3.5 h-3.5 text-pink-400" />}
          label="Color Label"
          isActive={activeSubmenu === 'color'}
          onMouseEnter={(el) => openSubmenu('color', el)}
          onMouseLeave={handleSubmenuTriggerLeave}
        />

        <div className="my-1 border-t border-white/[0.08]" />

        {/* ── View & Timings ── */}
        {onZoomToClip && (
          <ContextMenuItem
            icon={<ZoomIn className="w-3.5 h-3.5" />}
            label="Zoom to Fit Clip"
            shortcut="Shift+Z"
            onClick={() => handleAction(onZoomToClip)}
          />
        )}

        <ContextMenuItem
          icon={<AlignLeft className="w-3.5 h-3.5" />}
          label="Copy Timings"
          shortcut="Ctrl+Shift+C"
          onClick={handleCopyTimings}
        />

        {/* ── Clip Properties Popover Trigger ── */}
        <ContextMenuSubmenuTrigger
          icon={<Info className="w-3.5 h-3.5 text-blue-400" />}
          label="Clip Properties"
          shortcut="Alt+Enter"
          isActive={activeSubmenu === 'properties'}
          onMouseEnter={(el) => openSubmenu('properties', el)}
          onMouseLeave={handleSubmenuTriggerLeave}
        />

        <div className="my-1 border-t border-white/[0.08]" />

        {/* ── State Toggles (Enable, Mute, Lock, Hide) ── */}
        {onToggleDisable && (
          <ContextMenuItem
            icon={isDisabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            label={isDisabled ? 'Enable Clip' : 'Disable Clip'}
            shortcut="D"
            onClick={() => handleAction(onToggleDisable)}
          />
        )}

        {onHide && !isAudioTrack && (
          <ContextMenuItem
            icon={isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            label={isHidden ? 'Show Track' : 'Hide Track'}
            onClick={() => handleAction(onHide)}
          />
        )}

        {onMute && isAudioTrack && (
          <ContextMenuItem
            icon={isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            label={isMuted ? 'Unmute Track' : 'Mute Track'}
            onClick={() => handleAction(onMute)}
          />
        )}

        {onLock && (
          <ContextMenuItem
            icon={isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            label={isLocked ? 'Unlock Track' : 'Lock Track'}
            onClick={() => handleAction(onLock)}
          />
        )}

        {/* ── Danger Zone Separator ── */}
        {(onRippleDelete || onDelete) && <div className="my-1 border-t border-white/[0.08]" />}

        {onRippleDelete && (
          <ContextMenuItem
            icon={<Trash2 className="w-3.5 h-3.5" />}
            label="Ripple Delete"
            shortcut="Shift+Del"
            danger
            onClick={handleRippleDelete}
          />
        )}

        {onDelete && (
          <ContextMenuItem
            icon={<Trash2 className="w-3.5 h-3.5" />}
            label="Delete Clip"
            shortcut="Del"
            danger
            onClick={() => handleAction(onDelete)}
          />
        )}
      </div>

      {/* Floating Toast inside Context Menu */}
      {toastMessage && (
        <div className="px-3 py-1.5 bg-emerald-500/20 border-t border-emerald-500/30 text-[10px] text-emerald-300 flex items-center justify-center gap-1.5 rounded-b-[11px] animate-fade-in font-medium">
          <Check className="w-3 h-3 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Portaled Flyout Submenus ── */}
      {activeSubmenu && submenuPos && (
        <SubmenuPortal
          x={submenuPos.x}
          y={submenuPos.y}
          minWidth={activeSubmenu === 'color' ? 180 : activeSubmenu === 'properties' ? 240 : 204}
          onMouseEnter={handleSubmenuEnter}
          onMouseLeave={handleSubmenuLeave}
        >
          {/* 1. Color Picker Submenu */}
          {activeSubmenu === 'color' && (
            <div className="p-2.5">
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider font-bold">
                  Color Label
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {COLOR_LABELS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.name}
                    className="w-7 h-7 rounded-lg border border-white/20 hover:border-white hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer"
                    style={{ background: c.value }}
                    onClick={() => {
                      onColorLabel?.(c.value);
                      handleAction();
                    }}
                  />
                ))}
                <button
                  type="button"
                  title="Clear label"
                  className="w-7 h-7 rounded-lg border border-neutral-700 hover:border-neutral-400 bg-white/5 hover:bg-white/10 transition-all text-neutral-400 hover:text-white text-xs flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95"
                  onClick={() => {
                    onColorLabel?.('');
                    handleAction();
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* 2. Transform Submenu */}
          {activeSubmenu === 'transform' && (
            <div className="py-1 flex flex-col">
              <div className="px-3 py-1.5 border-b border-white/10 text-[9px] font-mono text-neutral-400 uppercase tracking-wider font-bold">
                Framing & Transform
              </div>
              <ContextMenuItem
                icon={<Maximize2 className="w-3.5 h-3.5" />}
                label="Fit to Screen"
                onClick={() => handleAction(onScaleToFit)}
              />
              <ContextMenuItem
                icon={<Crop className="w-3.5 h-3.5" />}
                label="Fill Screen (Crop)"
                onClick={() => handleAction(onScaleToFill)}
              />
              <ContextMenuItem
                icon={<FlipHorizontal className="w-3.5 h-3.5" />}
                label="Flip Horizontal"
                onClick={() => handleAction(onFlipHorizontal)}
              />
              <ContextMenuItem
                icon={<FlipVertical className="w-3.5 h-3.5" />}
                label="Flip Vertical"
                onClick={() => handleAction(onFlipVertical)}
              />
              {onCrop && (
                <ContextMenuItem
                  icon={<Crop className="w-3.5 h-3.5" />}
                  label="Crop & Reframe..."
                  onClick={() => handleAction(onCrop)}
                />
              )}
              <div className="my-1 border-t border-white/[0.08]" />
              <ContextMenuItem
                icon={<RotateCcw className="w-3.5 h-3.5 text-amber-400" />}
                label="Reset Transform"
                onClick={() => handleAction(onResetTransform)}
              />
            </div>
          )}

          {/* 3. Speed & Retime Submenu */}
          {activeSubmenu === 'speed' && (
            <div className="py-1 flex flex-col">
              <div className="px-3 py-1.5 border-b border-white/10 text-[9px] font-mono text-neutral-400 uppercase tracking-wider font-bold">
                Playback Speed
              </div>
              <div className="grid grid-cols-3 gap-1 p-2 border-b border-white/[0.08]">
                {SPEED_PRESETS.map((s) => {
                  const isCurrent = Math.abs(currentSpeed - s) < 0.05;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        onSetSpeed?.(s);
                        handleAction();
                      }}
                      className={`px-2 py-1 text-[11px] rounded font-mono transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-500 text-black font-bold shadow-sm'
                          : 'bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white'
                      }`}
                    >
                      {s}x
                    </button>
                  );
                })}
              </div>
              {onSpeedDuration && (
                <ContextMenuItem
                  icon={<Timer className="w-3.5 h-3.5" />}
                  label="Speed & Duration..."
                  shortcut="Ctrl+R"
                  onClick={() => handleAction(onSpeedDuration)}
                />
              )}
              {onReverse && (
                <ContextMenuItem
                  icon={<RotateCcw className="w-3.5 h-3.5" />}
                  label="Reverse Clip"
                  onClick={() => handleAction(onReverse)}
                />
              )}
              {onFreezeFrame && isVideoTrack && (
                <ContextMenuItem
                  icon={<Clock className="w-3.5 h-3.5" />}
                  label="Freeze Frame at Playhead"
                  onClick={() => handleAction(onFreezeFrame)}
                />
              )}
            </div>
          )}

          {/* 4. Audio Enhancements Submenu */}
          {activeSubmenu === 'audio' && (
            <div className="py-1 flex flex-col">
              <div className="px-3 py-1.5 border-b border-white/10 text-[9px] font-mono text-neutral-400 uppercase tracking-wider font-bold">
                Audio Processing
              </div>
              {onAudioGain && (
                <ContextMenuItem
                  icon={<Sliders className="w-3.5 h-3.5 text-emerald-400" />}
                  label="Audio Gain / Volume..."
                  onClick={() => handleAction(onAudioGain)}
                />
              )}
              {onFadeIn && (
                <ContextMenuItem
                  icon={<Waves className="w-3.5 h-3.5 text-sky-400" />}
                  label="Fade In (1.0s)"
                  onClick={() => handleAction(onFadeIn)}
                />
              )}
              {onFadeOut && (
                <ContextMenuItem
                  icon={<Waves className="w-3.5 h-3.5 text-sky-400" />}
                  label="Fade Out (1.0s)"
                  onClick={() => handleAction(onFadeOut)}
                />
              )}
              {onNormalizeAudio && (
                <ContextMenuItem
                  icon={<Sliders className="w-3.5 h-3.5 text-amber-400" />}
                  label="Normalize Loudness"
                  onClick={() => handleAction(onNormalizeAudio)}
                />
              )}
              {onNoiseReduction && (
                <ContextMenuItem
                  icon={<Wand2 className="w-3.5 h-3.5 text-fuchsia-400" />}
                  label="Voice Clarity & Denoise"
                  onClick={() => handleAction(onNoiseReduction)}
                />
              )}
              {onDetach && isVideoTrack && (
                <>
                  <div className="my-1 border-t border-white/[0.08]" />
                  <ContextMenuItem
                    icon={<VolumeX className="w-3.5 h-3.5 text-orange-400" />}
                    label="Detach Audio to Track"
                    onClick={() => handleAction(onDetach)}
                  />
                </>
              )}
            </div>
          )}

          {/* 5. Arrange / Layer Submenu */}
          {activeSubmenu === 'layer' && (
            <div className="py-1 flex flex-col">
              <div className="px-3 py-1.5 border-b border-white/10 text-[9px] font-mono text-neutral-400 uppercase tracking-wider font-bold">
                Layer Arrangement
              </div>
              <ContextMenuItem
                icon={<ArrowUp className="w-3.5 h-3.5 text-indigo-400" />}
                label="Move Layer Up"
                shortcut="Alt+Up"
                onClick={() => handleAction(onMoveLaneUp || onBringToFront)}
              />
              <ContextMenuItem
                icon={<ArrowDown className="w-3.5 h-3.5 text-indigo-400" />}
                label="Move Layer Down"
                shortcut="Alt+Down"
                onClick={() => handleAction(onMoveLaneDown || onSendToBack)}
              />
              <div className="my-1 border-t border-white/[0.08]" />
              <ContextMenuItem
                icon={<ArrowUp className="w-3.5 h-3.5 text-emerald-400" />}
                label="Bring to Front"
                onClick={() => handleAction(onBringToFront)}
              />
              <ContextMenuItem
                icon={<ArrowDown className="w-3.5 h-3.5 text-amber-400" />}
                label="Send to Back"
                onClick={() => handleAction(onSendToBack)}
              />
            </div>
          )}

          {/* 6. AI Magic Tools Submenu */}
          {activeSubmenu === 'ai' && (
            <div className="py-1 flex flex-col">
              <div className="px-3 py-1.5 border-b border-white/10 text-[9px] font-mono text-neutral-400 uppercase tracking-wider font-bold">
                AI Magic Tools
              </div>
              {(hasAudioTrack || isCaptionTrack) && (
                <ContextMenuItem
                  icon={<Type className="w-3.5 h-3.5 text-blue-400" />}
                  label="Generate Subtitles from Audio"
                  onClick={() => handleAction(onGenerateCaptions)}
                />
              )}
              {isVisualTrack && (
                <ContextMenuItem
                  icon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                  label="AI Enhance / Upscale"
                  onClick={() => handleAction(onAiEnhance)}
                />
              )}
            </div>
          )}

          {/* 7. Clip Properties Inspector Popover */}
          {activeSubmenu === 'properties' && (
            <div className="p-3 text-[11px] flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 font-bold">
                  Clip Inspector
                </span>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: trackThemeColor[trackType] }}
                />
              </div>

              <div className="space-y-1.5 text-neutral-300 font-mono text-[10px]">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Track:</span>
                  <span className="text-neutral-200 capitalize">{trackLabel[trackType]}</span>
                </div>
                {clipName && (
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">Name:</span>
                    <span className="text-white truncate max-w-[130px] font-sans font-medium" title={clipName}>
                      {clipName}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Start:</span>
                  <span className="text-amber-300">{formatSeconds(startTime)} ({startTime?.toFixed(2) ?? '0.00'}s)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Duration:</span>
                  <span className="text-emerald-300">{formatSeconds(duration)} ({duration?.toFixed(2) ?? '0.00'}s)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">End:</span>
                  <span className="text-cyan-300">{formatSeconds((startTime ?? 0) + (duration ?? 0))} ({((startTime ?? 0) + (duration ?? 0)).toFixed(2)}s)</span>
                </div>
                {currentSpeed !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">Speed:</span>
                    <span className="text-neutral-200">{currentSpeed}x</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Status:</span>
                  <span className={isDisabled ? 'text-red-400' : isLocked ? 'text-amber-400' : 'text-emerald-400'}>
                    {isDisabled ? 'Disabled' : isLocked ? 'Locked' : 'Active'}
                  </span>
                </div>
              </div>

              {onProperties && (
                <button
                  type="button"
                  onClick={() => handleAction(onProperties)}
                  className="mt-1 w-full py-1 rounded bg-white/10 hover:bg-white/15 text-white text-[10px] font-medium transition-colors"
                >
                  Open Full Inspector
                </button>
              )}
            </div>
          )}
        </SubmenuPortal>
      )}
    </div>
  );

  return createPortal(menuContent, document.body);
};

// ── Sub-component: individual menu item ──────────────────────────
interface ContextMenuItemProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const ContextMenuItem: React.FC<ContextMenuItemProps> = ({
  icon,
  label,
  shortcut,
  danger,
  disabled,
  onClick,
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-[11px] transition-colors rounded-sm cursor-pointer select-none group
      ${disabled ? 'opacity-40 cursor-not-allowed text-neutral-500' : ''}
      ${danger && !disabled ? 'text-red-400 hover:bg-red-500/15 hover:text-red-300' : ''}
      ${!danger && !disabled ? 'text-neutral-200 hover:bg-white/10 hover:text-white' : ''}
    `}
  >
    <span className={`shrink-0 ${danger ? 'text-red-400' : 'text-neutral-400 group-hover:text-white'}`}>
      {icon}
    </span>
    <span className="flex-1 truncate font-medium">{label}</span>
    {shortcut && (
      <span className="text-[10px] text-neutral-500 group-hover:text-neutral-400 font-mono tabular-nums shrink-0 ml-auto pl-2">
        {shortcut}
      </span>
    )}
  </button>
);

// ── Sub-component: submenu trigger ──────────────────────────────
interface ContextMenuSubmenuTriggerProps {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  shortcut?: string;
  isActive: boolean;
  onMouseEnter: (el: HTMLElement) => void;
  onMouseLeave: () => void;
}

const ContextMenuSubmenuTrigger: React.FC<ContextMenuSubmenuTriggerProps> = ({
  icon,
  label,
  badge,
  shortcut,
  isActive,
  onMouseEnter,
  onMouseLeave,
}) => (
  <button
    type="button"
    onMouseEnter={(e) => onMouseEnter(e.currentTarget)}
    onMouseLeave={onMouseLeave}
    className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-[11px] transition-colors rounded-sm cursor-pointer select-none group ${
      isActive ? 'bg-white/15 text-white' : 'text-neutral-200 hover:bg-white/10 hover:text-white'
    }`}
  >
    <span className="shrink-0 text-neutral-400 group-hover:text-white">{icon}</span>
    <span className="flex-1 truncate font-medium">{label}</span>
    {badge && (
      <span className="text-[9px] font-mono px-1 py-0.2 bg-white/10 text-neutral-300 rounded shrink-0">
        {badge}
      </span>
    )}
    {shortcut && (
      <span className="text-[10px] text-neutral-500 group-hover:text-neutral-400 font-mono tabular-nums shrink-0 pl-1">
        {shortcut}
      </span>
    )}
    <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${
      isActive ? 'text-white translate-x-0.5' : 'text-neutral-500 group-hover:text-neutral-300'
    }`} />
  </button>
);

// ── Sub-component: portaled submenu floating window ──────────────
interface SubmenuPortalProps {
  x: number;
  y: number;
  minWidth?: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  children: React.ReactNode;
}

const SubmenuPortal: React.FC<SubmenuPortalProps> = ({
  x,
  y,
  minWidth = 200,
  onMouseEnter,
  onMouseLeave,
  children,
}) => {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        zIndex: 100000,
        minWidth: `${minWidth}px`,
      }}
      className="timeline-submenu-portal p-1 select-none"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>,
    document.body
  );
};

export default TimelineClipContextMenu;
