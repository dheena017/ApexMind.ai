import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
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
  clipId?: string;
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
  clipId,
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

    if (y + height > vh - 12) {
      ny = Math.max(12, y - height);
      flippedUp = true;
    } else {
      ny = Math.max(12, y);
    }

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

  // ── Clipboard & Core Edit Handlers ──
  const handleCopy = () => {
    if (onCopy) {
      onCopy();
    } else {
      const clipData = {
        track: trackType,
        clipId,
        clipName,
        startTime,
        duration,
        speed: currentSpeed,
      };
      try {
        localStorage.setItem('apexmind_clip_clipboard', JSON.stringify(clipData));
      } catch {}
      const summary = `[${trackLabel[trackType]}] ${clipName || ''} | Start: ${(startTime ?? 0).toFixed(2)}s | Dur: ${(duration ?? 0).toFixed(2)}s`;
      navigator.clipboard?.writeText(summary).catch(() => {});
    }
    toast.success('Copied clip to clipboard');
    onClose();
  };

  const handleCut = () => {
    handleCopy();
    if (onCut) {
      onCut();
    } else if (onDelete) {
      onDelete();
    } else {
      window.dispatchEvent(
        new CustomEvent('workspace:delete-clip', {
          detail: { track: trackType, clipId },
        })
      );
    }
    toast.success('Cut clip to clipboard');
    onClose();
  };

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate();
    } else {
      window.dispatchEvent(
        new CustomEvent('workspace:duplicate-clip', {
          detail: { track: trackType, clipId },
        })
      );
    }
    toast.success('Duplicated clip');
    onClose();
  };

  const handleSplit = () => {
    if (onSplit) {
      onSplit();
    } else {
      window.dispatchEvent(
        new CustomEvent('workspace:split-clip', {
          detail: { track: trackType, clipId },
        })
      );
    }
    toast.success('Split clip at playhead');
    onClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    } else {
      window.dispatchEvent(
        new CustomEvent('workspace:delete-clip', {
          detail: { track: trackType, clipId },
        })
      );
    }
    toast.success('Deleted clip');
    onClose();
  };

  const handleRippleDelete = () => {
    if (onRippleDelete) {
      onRippleDelete();
    } else {
      handleDelete();
    }
  };

  // ── Visual Transform Handlers ──
  const handleScaleToFit = () => {
    if (onScaleToFit) {
      onScaleToFit();
    } else {
      window.dispatchEvent(
        new CustomEvent('workspace:backdrop-transform', {
          detail: { fitMode: 'fit', scale: 1, posX: 0, posY: 0 },
        })
      );
      window.dispatchEvent(
        new CustomEvent('workspace:update-clip-properties', {
          detail: { track: trackType, clipId, transform: { fitMode: 'fit', scale: 1, x: 0, y: 0 } },
        })
      );
    }
    toast.success('Fitted to screen');
    onClose();
  };

  const handleScaleToFill = () => {
    if (onScaleToFill) {
      onScaleToFill();
    } else {
      window.dispatchEvent(
        new CustomEvent('workspace:backdrop-transform', {
          detail: { fitMode: 'fill', scale: 1.25 },
        })
      );
      window.dispatchEvent(
        new CustomEvent('workspace:update-clip-properties', {
          detail: { track: trackType, clipId, transform: { fitMode: 'fill', scale: 1.25 } },
        })
      );
    }
    toast.success('Filled screen (crop)');
    onClose();
  };

  const handleFlipHorizontal = () => {
    if (onFlipHorizontal) {
      onFlipHorizontal();
    } else {
      window.dispatchEvent(
        new CustomEvent('workspace:backdrop-transform', {
          detail: { flipH: true },
        })
      );
      window.dispatchEvent(
        new CustomEvent('workspace:update-clip-properties', {
          detail: { track: trackType, clipId, transform: { flipH: true } },
        })
      );
    }
    toast.success('Flipped horizontally');
    onClose();
  };

  const handleFlipVertical = () => {
    if (onFlipVertical) {
      onFlipVertical();
    } else {
      window.dispatchEvent(
        new CustomEvent('workspace:backdrop-transform', {
          detail: { flipV: true },
        })
      );
      window.dispatchEvent(
        new CustomEvent('workspace:update-clip-properties', {
          detail: { track: trackType, clipId, transform: { flipV: true } },
        })
      );
    }
    toast.success('Flipped vertically');
    onClose();
  };

  const handleResetTransform = () => {
    if (onResetTransform) {
      onResetTransform();
    } else {
      window.dispatchEvent(
        new CustomEvent('workspace:backdrop-transform', {
          detail: { fitMode: 'contain', scale: 1, posX: 0, posY: 0, rotation: 0, flipH: false, flipV: false },
        })
      );
      window.dispatchEvent(
        new CustomEvent('workspace:update-clip-properties', {
          detail: {
            track: trackType,
            clipId,
            transform: { fitMode: 'contain', scale: 1, x: 0, y: 0, rotation: 0, flipH: false, flipV: false },
          },
        })
      );
    }
    toast.success('Reset transform');
    onClose();
  };

  // ── Speed & Retime Handlers ──
  const handleSetSpeed = (s: number) => {
    if (onSetSpeed) {
      onSetSpeed(s);
    } else {
      window.dispatchEvent(
        new CustomEvent('workspace:playback-rate-change', {
          detail: { speed: s, clipId },
        })
      );
      window.dispatchEvent(
        new CustomEvent('workspace:update-clip-properties', {
          detail: { track: trackType, clipId, speed: s },
        })
      );
    }
    toast.success(`Speed set to ${s}x`);
    onClose();
  };

  const handleReverse = () => {
    if (onReverse) {
      onReverse();
    } else {
      window.dispatchEvent(
        new CustomEvent('workspace:update-clip-properties', {
          detail: { track: trackType, clipId, reversed: true },
        })
      );
    }
    toast.success('Reversed clip playback');
    onClose();
  };

  const handleFreezeFrame = () => {
    if (onFreezeFrame) {
      onFreezeFrame();
    } else {
      window.dispatchEvent(
        new CustomEvent('workspace:freeze-frame', {
          detail: { clipId, startTime },
        })
      );
    }
    toast.success('Freeze frame created at playhead');
    onClose();
  };

  // ── Audio Enhancements Handlers ──
  const handleAudioGain = () => {
    if (onAudioGain) {
      onAudioGain();
    } else {
      window.dispatchEvent(
        new CustomEvent('workspace:select-compound', {
          detail: { compound: 'voice', openInspector: true, clipId },
        })
      );
      window.dispatchEvent(
        new CustomEvent('workspace:open-inspector-tab', {
          detail: { tab: 'audio' },
        })
      );
    }
    toast.success('Opened Audio Gain Inspector');
    onClose();
  };

  const handleFadeIn = () => {
    if (onFadeIn) {
      onFadeIn();
    } else {
      window.dispatchEvent(
        new CustomEvent('workspace:update-clip-properties', {
          detail: { track: trackType, clipId, audioFadeIn: 1.0 },
        })
      );
    }
    toast.success('Applied 1.0s Audio Fade In');
    onClose();
  };

  const handleFadeOut = () => {
    if (onFadeOut) {
      onFadeOut();
    } else {
      window.dispatchEvent(
        new CustomEvent('workspace:update-clip-properties', {
          detail: { track: trackType, clipId, audioFadeOut: 1.0 },
        })
      );
    }
    toast.success('Applied 1.0s Audio Fade Out');
    onClose();
  };

  const handleNormalizeAudio = () => {
    if (onNormalizeAudio) {
      onNormalizeAudio();
    } else {
      window.dispatchEvent(
        new CustomEvent('workspace:update-clip-properties', {
          detail: { track: trackType, clipId, normalizeAudio: true, volume: 90 },
        })
      );
    }
    toast.success('Normalized audio loudness to -14 LUFS');
    onClose();
  };

  const handleNoiseReduction = () => {
    if (onNoiseReduction) {
      onNoiseReduction();
    } else {
      window.dispatchEvent(
        new CustomEvent('workspace:update-clip-properties', {
          detail: { track: trackType, clipId, denoise: true },
        })
      );
    }
    toast.success('Applied Voice Clarity & Denoise');
    onClose();
  };

  const handleDetach = () => {
    if (onDetach) {
      onDetach();
    } else {
      window.dispatchEvent(
        new CustomEvent('workspace:detach-audio', {
          detail: { clipId, startTime, duration },
        })
      );
    }
    toast.success('Detached audio to separate track');
    onClose();
  };

  // ── Arrange & Layer Handlers ──
  const handleMoveUp = () => {
    if (onMoveLaneUp) {
      onMoveLaneUp();
    } else {
      window.dispatchEvent(
        new CustomEvent('workspace:arrange-clip', {
          detail: { track: trackType, clipId, direction: 'up' },
        })
      );
    }
    toast.success('Moved layer up');
    onClose();
  };

  const handleMoveDown = () => {
    if (onMoveLaneDown) {
      onMoveLaneDown();
    } else {
      window.dispatchEvent(
        new CustomEvent('workspace:arrange-clip', {
          detail: { track: trackType, clipId, direction: 'down' },
        })
      );
    }
    toast.success('Moved layer down');
    onClose();
  };

  const handleBringToFront = () => {
    if (onBringToFront) {
      onBringToFront();
    } else {
      window.dispatchEvent(
        new CustomEvent('workspace:arrange-clip', {
          detail: { track: trackType, clipId, direction: 'front' },
        })
      );
    }
    toast.success('Brought clip to front');
    onClose();
  };

  const handleSendToBack = () => {
    if (onSendToBack) {
      onSendToBack();
    } else {
      window.dispatchEvent(
        new CustomEvent('workspace:arrange-clip', {
          detail: { track: trackType, clipId, direction: 'back' },
        })
      );
    }
    toast.success('Sent clip to back');
    onClose();
  };

  // ── AI Magic Tools Handlers ──
  const handleAiAutoAnimate = () => {
    window.dispatchEvent(
      new CustomEvent('workspace:preview-clip-animation', {
        detail: { type: 'zoom-in', direction: 'in', duration: 0.5 },
      })
    );
    window.dispatchEvent(
      new CustomEvent('workspace:update-clip-props', {
        detail: {
          track: trackType === 'image' ? 'image' : 'video',
          clipId,
          animationIn: 'zoom-in',
          animationInDuration: 0.5,
          animationOut: 'slide-fade',
          animationOutDuration: 0.4,
        },
      })
    );
    toast.success('✨ AI Auto-Animate: Motion choreography applied');
    onClose();
  };

  const handleAiCutSync = () => {
    window.dispatchEvent(new CustomEvent('workspace:ai-cut-sync'));
    toast.success('🎬 AI Cut Sync: Aligning scene cuts to voice pauses & music beat');
    onClose();
  };

  const handleAiSmartTransition = () => {
    window.dispatchEvent(
      new CustomEvent('workspace:ai-smart-transitions', {
        detail: { mood: 'viral', track: trackType === 'image' ? 'image' : 'video' },
      })
    );
    toast.success('✨ AI Smart Transitions: Matched dynamic cut');
    onClose();
  };

  const handleAiEnhance = () => {
    if (onAiEnhance) {
      onAiEnhance();
    } else {
      window.dispatchEvent(
        new CustomEvent('workspace:ai-enhance', {
          detail: { track: trackType, clipId },
        })
      );
    }
    toast.success('✨ AI Upscale & Enhance: 4K detail synthesis queued');
    onClose();
  };

  const handleGenerateCaptions = () => {
    if (onGenerateCaptions) {
      onGenerateCaptions();
    } else {
      window.dispatchEvent(
        new CustomEvent('workspace:select-compound', {
          detail: { compound: 'text', openInspector: true },
        })
      );
    }
    toast.success('Opened Subtitle & Kinetic Caption Studio');
    onClose();
  };

  // ── View, Metadata & Properties Handlers ──
  const handleColorLabel = (color: string) => {
    if (onColorLabel) {
      onColorLabel(color);
    } else {
      window.dispatchEvent(
        new CustomEvent('workspace:update-clip-properties', {
          detail: { track: trackType, clipId, colorLabel: color },
        })
      );
    }
    toast.success(color ? 'Color label updated' : 'Cleared color label');
    onClose();
  };

  const handleZoomToFit = () => {
    if (onZoomToClip) {
      onZoomToClip();
    } else {
      window.dispatchEvent(
        new CustomEvent('workspace:zoom-to-clip', {
          detail: { startTime, duration },
        })
      );
    }
    toast.success('Zoomed timeline to fit clip');
    onClose();
  };

  const handleCopyTimings = () => {
    if (onCopyTimings) {
      onCopyTimings();
    } else {
      const text = `Start: ${(startTime ?? 0).toFixed(2)}s | Duration: ${(duration ?? 0).toFixed(2)}s | End: ${((startTime ?? 0) + (duration ?? 0)).toFixed(2)}s`;
      navigator.clipboard?.writeText(text).catch(() => {});
    }
    toast.success('Copied clip timings');
    onClose();
  };

  const handleOpenProperties = () => {
    if (onProperties) {
      onProperties();
    } else {
      const compound = isVisualTrack
        ? (isVideoTrack ? 'video' : 'image')
        : (isAudioTrack ? 'voice' : 'text');
      window.dispatchEvent(
        new CustomEvent('workspace:select-compound', {
          detail: {
            compound,
            openInspector: true,
            selectedClip: { track: trackType, clipId },
          },
        })
      );
      window.dispatchEvent(
        new CustomEvent('workspace:open-inspector-tab', {
          detail: { tab: 'transform' },
        })
      );
    }
    toast.success('Opened Clip Properties Inspector');
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
          <span className="text-[10px] font-mono text-neutral-400 bg-white/5 px-1.5 py-0.5 rounded shrink-0">
            {formatSeconds(duration)}
          </span>
        )}
      </div>

      {/* Clip Name Subtitle */}
      {clipName && (
        <div className="px-3 py-1 bg-white/[0.02] border-b border-white/[0.06] text-[10px] text-neutral-400 truncate font-sans">
          {clipName}
        </div>
      )}

      {/* Menu Actions */}
      <div className="p-1 space-y-0.5">
        {/* Primary Clipboard Operations */}
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

        <ContextMenuItem
          icon={<Copy className="w-3.5 h-3.5 text-amber-400/90" />}
          label="Duplicate Clip"
          shortcut="Ctrl+D"
          onClick={handleDuplicate}
        />

        <ContextMenuItem
          icon={<Split className="w-3.5 h-3.5 text-sky-400/90" />}
          label="Split at Playhead"
          shortcut="Ctrl+B"
          onClick={handleSplit}
        />

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
        <ContextMenuItem
          icon={<ZoomIn className="w-3.5 h-3.5" />}
          label="Zoom to Fit Clip"
          shortcut="Shift+Z"
          onClick={handleZoomToFit}
        />

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
          onClick={handleOpenProperties}
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

        {!isAudioTrack && (
          <ContextMenuItem
            icon={isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            label={isHidden ? 'Show Track' : 'Hide Track'}
            onClick={() => {
              if (onHide) {
                handleAction(onHide);
              } else {
                window.dispatchEvent(
                  new CustomEvent('workspace:toggle-track-visibility', {
                    detail: { track: trackType },
                  })
                );
                onClose();
              }
            }}
          />
        )}

        {isAudioTrack && (
          <ContextMenuItem
            icon={isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            label={isMuted ? 'Unmute Track' : 'Mute Track'}
            onClick={() => {
              if (onMute) {
                handleAction(onMute);
              } else {
                window.dispatchEvent(
                  new CustomEvent('workspace:toggle-track-visibility', {
                    detail: { track: trackType },
                  })
                );
                onClose();
              }
            }}
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
        <div className="my-1 border-t border-white/[0.08]" />

        {onRippleDelete && (
          <ContextMenuItem
            icon={<Trash2 className="w-3.5 h-3.5" />}
            label="Ripple Delete"
            shortcut="Shift+Del"
            danger
            onClick={handleRippleDelete}
          />
        )}

        <ContextMenuItem
          icon={<Trash2 className="w-3.5 h-3.5" />}
          label="Delete Clip"
          shortcut="Del"
          danger
          onClick={handleDelete}
        />
      </div>

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
                    onClick={() => handleColorLabel(c.value)}
                  />
                ))}
                <button
                  type="button"
                  title="Clear label"
                  className="w-7 h-7 rounded-lg border border-neutral-700 hover:border-neutral-400 bg-white/5 hover:bg-white/10 transition-all text-neutral-400 hover:text-white text-xs flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95"
                  onClick={() => handleColorLabel('')}
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
                onClick={handleScaleToFit}
              />
              <ContextMenuItem
                icon={<Crop className="w-3.5 h-3.5" />}
                label="Fill Screen (Crop)"
                onClick={handleScaleToFill}
              />
              <ContextMenuItem
                icon={<FlipHorizontal className="w-3.5 h-3.5" />}
                label="Flip Horizontal"
                onClick={handleFlipHorizontal}
              />
              <ContextMenuItem
                icon={<FlipVertical className="w-3.5 h-3.5" />}
                label="Flip Vertical"
                onClick={handleFlipVertical}
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
                onClick={handleResetTransform}
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
                      onClick={() => handleSetSpeed(s)}
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
              <ContextMenuItem
                icon={<RotateCcw className="w-3.5 h-3.5" />}
                label="Reverse Clip"
                onClick={handleReverse}
              />
              {isVideoTrack && (
                <ContextMenuItem
                  icon={<Clock className="w-3.5 h-3.5" />}
                  label="Freeze Frame at Playhead"
                  onClick={handleFreezeFrame}
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
              <ContextMenuItem
                icon={<Sliders className="w-3.5 h-3.5 text-emerald-400" />}
                label="Audio Gain / Volume..."
                onClick={handleAudioGain}
              />
              <ContextMenuItem
                icon={<Waves className="w-3.5 h-3.5 text-sky-400" />}
                label="Fade In (1.0s)"
                onClick={handleFadeIn}
              />
              <ContextMenuItem
                icon={<Waves className="w-3.5 h-3.5 text-sky-400" />}
                label="Fade Out (1.0s)"
                onClick={handleFadeOut}
              />
              <ContextMenuItem
                icon={<Sliders className="w-3.5 h-3.5 text-amber-400" />}
                label="Normalize Loudness"
                onClick={handleNormalizeAudio}
              />
              <ContextMenuItem
                icon={<Wand2 className="w-3.5 h-3.5 text-fuchsia-400" />}
                label="Voice Clarity & Denoise"
                onClick={handleNoiseReduction}
              />
              {isVideoTrack && (
                <>
                  <div className="my-1 border-t border-white/[0.08]" />
                  <ContextMenuItem
                    icon={<VolumeX className="w-3.5 h-3.5 text-orange-400" />}
                    label="Detach Audio to Track"
                    onClick={handleDetach}
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
                onClick={handleMoveUp}
              />
              <ContextMenuItem
                icon={<ArrowDown className="w-3.5 h-3.5 text-indigo-400" />}
                label="Move Layer Down"
                shortcut="Alt+Down"
                onClick={handleMoveDown}
              />
              <div className="my-1 border-t border-white/[0.08]" />
              <ContextMenuItem
                icon={<ArrowUp className="w-3.5 h-3.5 text-emerald-400" />}
                label="Bring to Front"
                onClick={handleBringToFront}
              />
              <ContextMenuItem
                icon={<ArrowDown className="w-3.5 h-3.5 text-amber-400" />}
                label="Send to Back"
                onClick={handleSendToBack}
              />
            </div>
          )}

          {/* 6. AI Magic Tools Submenu */}
          {activeSubmenu === 'ai' && (
            <div className="py-1 flex flex-col">
              <div className="px-3 py-1.5 border-b border-white/10 text-[9px] font-mono text-neutral-400 uppercase tracking-wider font-bold">
                AI Magic Tools
              </div>
              {isVisualTrack && (
                <ContextMenuItem
                  icon={<Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                  label="⚡ AI Audio-Visual Cut Sync"
                  onClick={handleAiCutSync}
                />
              )}
              {isVisualTrack && (
                <ContextMenuItem
                  icon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                  label="AI Auto-Animate Clip"
                  onClick={handleAiAutoAnimate}
                />
              )}
              {isVisualTrack && (
                <ContextMenuItem
                  icon={<Wand2 className="w-3.5 h-3.5 text-sky-400" />}
                  label="AI Smart Transition"
                  onClick={handleAiSmartTransition}
                />
              )}
              {isVisualTrack && (
                <ContextMenuItem
                  icon={<Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                  label="AI Enhance / Upscale"
                  onClick={handleAiEnhance}
                />
              )}
              {(hasAudioTrack || isCaptionTrack) && (
                <ContextMenuItem
                  icon={<Type className="w-3.5 h-3.5 text-blue-400" />}
                  label="Generate Subtitles from Audio"
                  onClick={handleGenerateCaptions}
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

              <button
                type="button"
                onClick={handleOpenProperties}
                className="mt-1 w-full py-1 rounded bg-white/10 hover:bg-white/15 text-white text-[10px] font-medium transition-colors cursor-pointer"
              >
                Open Full Inspector
              </button>
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
  onClick?: () => void;
}

const ContextMenuSubmenuTrigger: React.FC<ContextMenuSubmenuTriggerProps> = ({
  icon,
  label,
  badge,
  shortcut,
  isActive,
  onMouseEnter,
  onMouseLeave,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
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
