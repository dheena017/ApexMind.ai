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

export interface ClipContextMenuAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
  submenu?: ClipContextMenuAction[];
  onClick: () => void;
}

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
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Pre-calculate initial position to prevent any 1-frame position jump/clipping
  const [adjustedPos, setAdjustedPos] = useState(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;
    const estW = 210;
    const estH = 280;
    let initX = x;
    let initY = y;
    let flippedUp = false;
    let flippedLeft = false;

    if (y + estH > vh - 12) {
      if (y - estH >= 12) {
        initY = y - estH;
        flippedUp = true;
      } else {
        initY = Math.max(12, vh - estH - 12);
        flippedUp = initY < y;
      }
    }
    if (x + estW > vw - 12) {
      if (x - estW >= 12) {
        initX = x - estW;
        flippedLeft = true;
      } else {
        initX = Math.max(12, vw - estW - 12);
        flippedLeft = initX < x;
      }
    }
    return { x: initX, y: initY, flippedUp, flippedLeft };
  });

  // Measure synchronously before browser paint to guarantee 100% viewport fit
  useLayoutEffect(() => {
    if (!isVisible || !menuRef.current) return;
    const menu = menuRef.current;
    const width = menu.offsetWidth || 210;
    const height = menu.offsetHeight || 280;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let nx = x;
    let ny = y;
    let flippedUp = false;
    let flippedLeft = false;

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

    // Flip leftwards if extending beyond right window boundary
    if (x + width > vw - 12) {
      if (x - width >= 12) {
        nx = x - width;
        flippedLeft = true;
      } else {
        nx = Math.max(12, vw - width - 12);
        flippedLeft = nx < x;
      }
    }

    setAdjustedPos({ x: nx, y: ny, flippedUp, flippedLeft });
  }, [isVisible, x, y]);

  // Close on outside click, window resize, timeline scroll, or Escape key
  useEffect(() => {
    if (!isVisible) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleScroll = (e: Event) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    window.addEventListener('resize', onClose);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
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

  const submenuOpensLeft = typeof window !== 'undefined' && adjustedPos.x + 210 + 175 > window.innerWidth;
  const submenuOpensUp = typeof window !== 'undefined' && adjustedPos.y + 160 > window.innerHeight;

  const menuContent = (
    <div
      ref={menuRef}
      className="timeline-context-menu"
      style={{
        position: 'fixed',
        left: `${adjustedPos.x}px`,
        top: `${adjustedPos.y}px`,
        zIndex: 99999,
        transformOrigin: `${adjustedPos.flippedUp ? 'bottom' : 'top'} ${adjustedPos.flippedLeft ? 'right' : 'left'}`,
        maxHeight: 'calc(100vh - 24px)',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header / Track Badge */}
      <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2 rounded-t-[9px] bg-black/40">
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
        <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest select-none truncate">
          {trackLabel[trackType]}
        </span>
      </div>

      {/* Menu Items Container */}
      <div className="py-1 max-h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar rounded-b-[9px]">
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
          <div className="my-1 border-t border-white/5" />
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

        {/* ── Color Label Submenu ── */}
        {onColorLabel && (
          <div className="relative">
            <button
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-[11px] text-neutral-200 hover:bg-white/8 transition-colors rounded-sm group"
              onMouseEnter={() => setShowColorPicker(true)}
              onMouseLeave={() => setShowColorPicker(false)}
            >
              <Tag className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="flex-1 truncate">Color Label</span>
              <ChevronRight className="w-3 h-3 text-neutral-500 shrink-0" />
            </button>
            {showColorPicker && (
              <div
                className={`absolute ${submenuOpensLeft ? 'right-full mr-1' : 'left-full ml-1'} ${submenuOpensUp ? 'bottom-0' : 'top-0'} bg-[#1A1A1A] border border-white/10 rounded-lg p-2 shadow-2xl z-50`}
                style={{ minWidth: 160 }}
                onMouseEnter={() => setShowColorPicker(true)}
                onMouseLeave={() => setShowColorPicker(false)}
              >
                <p className="text-[9px] text-neutral-500 uppercase tracking-widest px-1 mb-1.5 select-none">
                  Label Color
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {COLOR_LABELS.map((c) => (
                    <button
                      key={c.value}
                      title={c.name}
                      className="w-6 h-6 rounded-full border-2 border-transparent hover:border-white/60 transition-all hover:scale-110"
                      style={{ background: c.value }}
                      onClick={() => {
                        onColorLabel(c.value);
                        onClose();
                      }}
                    />
                  ))}
                  <button
                    title="Clear label"
                    className="w-6 h-6 rounded-full border-2 border-neutral-600 hover:border-white/60 transition-all text-neutral-500 text-[9px] flex items-center justify-center hover:scale-110"
                    onClick={() => {
                      onColorLabel('');
                      onClose();
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Danger Zone Separator ── */}
        {onDelete && <div className="my-1 border-t border-white/5" />}

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
    disabled={disabled}
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-[11px] transition-colors rounded-sm
      ${disabled ? 'opacity-40 cursor-not-allowed text-neutral-500' : ''}
      ${danger && !disabled ? 'text-red-400 hover:bg-red-500/15' : ''}
      ${!danger && !disabled ? 'text-neutral-200 hover:bg-white/8' : ''}
    `}
  >
    <span className={`shrink-0 ${danger ? 'text-red-400' : 'text-neutral-400'}`}>{icon}</span>
    <span className="flex-1 truncate">{label}</span>
    {shortcut && (
      <span className="text-[9px] text-neutral-600 font-mono tabular-nums shrink-0">{shortcut}</span>
    )}
  </button>
);

export default TimelineClipContextMenu;
