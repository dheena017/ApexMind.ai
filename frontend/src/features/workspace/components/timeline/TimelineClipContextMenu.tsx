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
} from 'lucide-react';

export type ContextMenuTrackType = 'video' | 'image' | 'overlay' | 'voice' | 'music' | 'sfx' | 'caption' | 'title';

export interface TimelineClipContextMenuProps {
  x: number;
  y: number;
  trackType: ContextMenuTrackType;
  isVisible: boolean;
  isMuted?: boolean;
  isLocked?: boolean;
  isHidden?: boolean;
  onClose: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onSplit?: () => void;
  onMute?: () => void;
  onHide?: () => void;
  onLock?: () => void;
  onRename?: () => void;
  onZoomToClip?: () => void;
  onColorLabel?: (color: string) => void;
  onCopyTimings?: () => void;
  onDetach?: () => void;
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

export const TimelineClipContextMenu: React.FC<TimelineClipContextMenuProps> = ({
  x,
  y,
  trackType,
  isVisible,
  isMuted = false,
  isLocked = false,
  isHidden = false,
  onClose,
  onDelete,
  onDuplicate,
  onSplit,
  onMute,
  onHide,
  onLock,
  onRename,
  onZoomToClip,
  onColorLabel,
  onCopyTimings,
  onDetach,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const colorLabelButtonRef = useRef<HTMLButtonElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPos, setColorPickerPos] = useState<{ x: number; y: number } | null>(null);
  const colorPickerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Measure synchronously before browser paint to guarantee 100% viewport fit
  const [adjustedPos, setAdjustedPos] = useState(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;
    const estW = 224;
    const estH = 260;
    const initX = Math.max(12, Math.min(x, vw - estW - 12));
    const initY = Math.max(12, y + estH > vh - 12 ? Math.max(12, y - estH) : y);
    return { x: initX, y: initY, flippedUp: y + estH > vh - 12 };
  });

  useLayoutEffect(() => {
    if (!isVisible || !menuRef.current) return;
    const menu = menuRef.current;
    const width = menu.offsetWidth || 224;
    const height = menu.offsetHeight || 260;
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

  // Handle color label hover
  const handleColorLabelMouseEnter = () => {
    if (colorPickerTimeoutRef.current) clearTimeout(colorPickerTimeoutRef.current);
    if (!colorLabelButtonRef.current) return;
    const rect = colorLabelButtonRef.current.getBoundingClientRect();
    const pickerW = 180;
    const pickerH = 120;
    const openLeft = rect.right + pickerW > window.innerWidth - 12;
    const openX = openLeft ? Math.max(12, rect.left - pickerW - 4) : Math.min(window.innerWidth - pickerW - 12, rect.right + 4);
    const openY = Math.max(12, Math.min(rect.top - 4, window.innerHeight - pickerH - 12));
    setColorPickerPos({ x: openX, y: openY });
    setShowColorPicker(true);
  };

  const handleColorLabelMouseLeave = () => {
    colorPickerTimeoutRef.current = setTimeout(() => {
      setShowColorPicker(false);
    }, 150);
  };

  const handlePickerMouseEnter = () => {
    if (colorPickerTimeoutRef.current) clearTimeout(colorPickerTimeoutRef.current);
  };

  const handlePickerMouseLeave = () => {
    setShowColorPicker(false);
  };

  // Close on outside click, window resize, timeline scroll, or Escape key
  useEffect(() => {
    if (!isVisible) return;
    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement)?.closest?.('.timeline-color-picker-portal')
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
        !(e.target as HTMLElement)?.closest?.('.timeline-color-picker-portal')
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    window.addEventListener('resize', onClose);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      if (colorPickerTimeoutRef.current) clearTimeout(colorPickerTimeoutRef.current);
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', onClose);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isVisible, onClose]);

  if (!isVisible || typeof document === 'undefined') return null;

  const isAudioTrack = trackType === 'voice' || trackType === 'music' || trackType === 'sfx';
  const isVideoTrack = trackType === 'video' || trackType === 'image';

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

  const handleAction = (fn?: () => void) => {
    fn?.();
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
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header / Track Badge */}
      <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2 rounded-t-[11px] bg-black/40">
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{
            background:
              trackType === 'video' ? '#F59E0B'
                : trackType === 'image' ? '#10B981'
                  : trackType === 'overlay' ? '#6366F1'
                    : trackType === 'voice' ? '#22C55E'
                      : trackType === 'music' ? '#A855F7'
                        : trackType === 'sfx' ? '#F59E0B'
                          : trackType === 'caption' ? '#3B82F6'
                            : '#6366F1',
          }}
        />
        <span className="text-[10px] font-mono text-neutral-300 uppercase tracking-widest select-none truncate font-bold">
          {trackLabel[trackType]}
        </span>
      </div>

      {/* Menu Items Container - No Scrollbars, No Overflow Clipping */}
      <div className="py-1 flex flex-col">
        {/* ── Edit / Rename ── */}
        {onRename && (
          <ContextMenuItem
            icon={<Pencil className="w-3.5 h-3.5" />}
            label="Rename Clip"
            shortcut="F2"
            onClick={() => handleAction(onRename)}
          />
        )}

        {/* ── Copy Timings ── */}
        {onCopyTimings && (
          <ContextMenuItem
            icon={<AlignLeft className="w-3.5 h-3.5" />}
            label="Copy Timings"
            shortcut="Ctrl+Shift+C"
            onClick={() => handleAction(onCopyTimings)}
          />
        )}

        {/* ── Duplicate ── */}
        {onDuplicate && (
          <ContextMenuItem
            icon={<Copy className="w-3.5 h-3.5" />}
            label="Duplicate Clip"
            shortcut="Ctrl+D"
            onClick={() => handleAction(onDuplicate)}
          />
        )}

        {/* ── Split ── */}
        {onSplit && (
          <ContextMenuItem
            icon={<Scissors className="w-3.5 h-3.5" />}
            label="Split at Playhead"
            shortcut="Ctrl+B"
            onClick={() => handleAction(onSplit)}
          />
        )}

        {(onRename || onDuplicate || onSplit || onCopyTimings) && (
          <div className="my-1 border-t border-white/[0.08]" />
        )}

        {/* ── Visibility (Video/Image/Overlay) ── */}
        {onHide && !isAudioTrack && (
          <ContextMenuItem
            icon={isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            label={isHidden ? 'Show Track' : 'Hide Track'}
            onClick={() => handleAction(onHide)}
          />
        )}

        {/* ── Mute (Audio) ── */}
        {onMute && isAudioTrack && (
          <ContextMenuItem
            icon={isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            label={isMuted ? 'Unmute Track' : 'Mute Track'}
            onClick={() => handleAction(onMute)}
          />
        )}

        {/* ── Lock (Captions/Title) ── */}
        {onLock && (
          <ContextMenuItem
            icon={isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            label={isLocked ? 'Unlock Track' : 'Lock Track'}
            onClick={() => handleAction(onLock)}
          />
        )}

        {/* ── Detach Audio (Video only) ── */}
        {onDetach && isVideoTrack && (
          <ContextMenuItem
            icon={<VolumeX className="w-3.5 h-3.5" />}
            label="Detach Audio"
            onClick={() => handleAction(onDetach)}
          />
        )}

        {/* ── Zoom to Clip ── */}
        {onZoomToClip && (
          <ContextMenuItem
            icon={<ZoomIn className="w-3.5 h-3.5" />}
            label="Zoom to Fit Clip"
            shortcut="Shift+Z"
            onClick={() => handleAction(onZoomToClip)}
          />
        )}

        {/* ── Color Label Item (Portaled Submenu) ── */}
        {onColorLabel && (
          <button
            ref={colorLabelButtonRef}
            type="button"
            onMouseEnter={handleColorLabelMouseEnter}
            onMouseLeave={handleColorLabelMouseLeave}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-[11px] text-neutral-200 hover:bg-white/10 hover:text-white transition-colors cursor-pointer select-none rounded-sm group"
          >
            <Tag className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-400 shrink-0" />
            <span className="flex-1 truncate font-medium">Color Label</span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-300 shrink-0" />
          </button>
        )}

        {/* ── Danger Zone Separator ── */}
        {onDelete && <div className="my-1 border-t border-white/[0.08]" />}

        {/* ── Delete ── */}
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

      {/* Portaled Color Label Submenu - Floating freely outside parent */}
      {showColorPicker && colorPickerPos && createPortal(
        <div
          style={{
            position: 'fixed',
            left: `${colorPickerPos.x}px`,
            top: `${colorPickerPos.y}px`,
            zIndex: 100000,
            minWidth: 176,
          }}
          className="timeline-color-picker-portal bg-[#18181D] border border-[#33333F] rounded-xl p-2.5 shadow-2xl backdrop-blur-xl animate-fade-in select-none"
          onMouseEnter={handlePickerMouseEnter}
          onMouseLeave={handlePickerMouseLeave}
        >
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
                  setShowColorPicker(false);
                  onClose();
                }}
              />
            ))}
            <button
              type="button"
              title="Clear label"
              className="w-7 h-7 rounded-lg border border-neutral-700 hover:border-neutral-400 bg-white/5 hover:bg-white/10 transition-all text-neutral-400 hover:text-white text-xs flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95"
              onClick={() => {
                onColorLabel?.('');
                setShowColorPicker(false);
                onClose();
              }}
            >
              ✕
            </button>
          </div>
        </div>,
        document.body
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
    <span className={`shrink-0 ${danger ? 'text-red-400' : 'text-neutral-400 group-hover:text-white'}`}>{icon}</span>
    <span className="flex-1 truncate font-medium">{label}</span>
    {shortcut && (
      <span className="text-[10px] text-neutral-500 group-hover:text-neutral-400 font-mono tabular-nums shrink-0 ml-auto pl-2">{shortcut}</span>
    )}
  </button>
);

export default TimelineClipContextMenu;
