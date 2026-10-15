import React, { useEffect, useRef } from 'react';
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
  ArrowUp,
  ArrowDown,
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
  onMoveAbove?: () => void;
  onMoveBelow?: () => void;
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
  onMoveAbove,
  onMoveBelow,
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
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [adjustedPos, setAdjustedPos] = React.useState({ x, y });

  // Adjust position so the menu doesn't go off-screen
  useEffect(() => {
    if (!isVisible || !menuRef.current) return;
    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let nx = x;
    let ny = y;
    if (x + rect.width > vw) nx = Math.max(0, vw - rect.width - 8);
    if (y + rect.height > vh) ny = Math.max(0, vh - rect.height - 8);
    setAdjustedPos({ x: nx, y: ny });
  }, [isVisible, x, y]);

  // Close on outside click or Escape
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
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

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

  return (
    <div
      ref={menuRef}
      className="timeline-context-menu"
      style={{
        position: 'fixed',
        left: adjustedPos.x,
        top: adjustedPos.y,
        zIndex: 9999,
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header / Track Badge */}
      <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
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
        <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest select-none">
          {trackLabel[trackType]}
        </span>
      </div>

      {/* Menu Items */}
      <div className="py-1">

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

        {/* ── Move Above / Below (Layer Stacking) ── */}
        {onMoveAbove && (
          <ContextMenuItem
            icon={<ArrowUp className="w-3.5 h-3.5" />}
            label="Move Above (Upper Layer)"
            shortcut="Alt+↑"
            onClick={() => handleAction(onMoveAbove)}
          />
        )}
        {onMoveBelow && (
          <ContextMenuItem
            icon={<ArrowDown className="w-3.5 h-3.5" />}
            label="Move Below (Lower Layer)"
            shortcut="Alt+↓"
            onClick={() => handleAction(onMoveBelow)}
          />
        )}

        {(onRename || onDuplicate || onSplit || onMoveAbove || onMoveBelow || onCopyTimings) && (
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
              <Tag className="w-3.5 h-3.5 text-neutral-400" />
              <span className="flex-1">Color Label</span>
              <ChevronRight className="w-3 h-3 text-neutral-500" />
            </button>
            {showColorPicker && (
              <div
                className="absolute left-full top-0 ml-1 bg-[#1A1A1A] border border-white/10 rounded-lg p-2 shadow-2xl"
                style={{ minWidth: 160 }}
                onMouseEnter={() => setShowColorPicker(true)}
                onMouseLeave={() => setShowColorPicker(false)}
              >
                <p className="text-[9px] text-neutral-500 uppercase tracking-widest px-1 mb-1.5">
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
    <span className={`${danger ? 'text-red-400' : 'text-neutral-400'}`}>{icon}</span>
    <span className="flex-1">{label}</span>
    {shortcut && (
      <span className="text-[9px] text-neutral-600 font-mono tabular-nums">{shortcut}</span>
    )}
  </button>
);

export default TimelineClipContextMenu;
