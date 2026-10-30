import React, { useLayoutEffect, useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Film,
  Type,
  Mic,
  Music,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Check,
  Plus,
} from 'lucide-react';
import { EnabledTracks, SelectedClip } from './timelineTypes';

export interface TimelineAddTrackMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: { current: HTMLElement | null };
  onEnableTrack: (
    trackKey: keyof EnabledTracks,
    selected: SelectedClip,
    compound: 'video' | 'text' | 'voice' | 'music' | 'overlay'
  ) => void;
  enabledTracks?: EnabledTracks;
}

interface TrackMenuItem {
  key: keyof EnabledTracks;
  label: string;
  badge: string;
  compound: 'video' | 'text' | 'voice' | 'music' | 'overlay';
  selectedClip: SelectedClip;
  icon: React.ReactNode;
  colorClass: string;
  bgHover: string;
  borderHover: string;
}

const ALL_EIGHT_TRACKS: TrackMenuItem[] = [
  {
    key: 'video',
    label: 'Video Track',
    badge: 'V1',
    compound: 'video',
    selectedClip: { track: 'video' },
    icon: <Film className="w-3.5 h-3.5 text-amber-400" />,
    colorClass: 'text-amber-200',
    bgHover: 'hover:bg-amber-500/15',
    borderHover: 'hover:border-amber-500/30',
  },
  {
    key: 'image',
    label: 'Image Track',
    badge: 'V2',
    compound: 'video',
    selectedClip: { track: 'image' },
    icon: <ImageIcon className="w-3.5 h-3.5 text-rose-400" />,
    colorClass: 'text-rose-200',
    bgHover: 'hover:bg-rose-500/15',
    borderHover: 'hover:border-rose-500/30',
  },
  {
    key: 'overlay',
    label: 'Elements / Overlay',
    badge: 'O1',
    compound: 'overlay',
    selectedClip: { track: 'overlay' },
    icon: <Layers className="w-3.5 h-3.5 text-indigo-400" />,
    colorClass: 'text-indigo-200',
    bgHover: 'hover:bg-indigo-500/15',
    borderHover: 'hover:border-indigo-500/30',
  },
  {
    key: 'captions',
    label: 'Captions Track',
    badge: 'T1',
    compound: 'text',
    selectedClip: { track: 'caption', index: 0 },
    icon: <Type className="w-3.5 h-3.5 text-teal-400" />,
    colorClass: 'text-teal-200',
    bgHover: 'hover:bg-teal-500/15',
    borderHover: 'hover:border-teal-500/30',
  },
  {
    key: 'title',
    label: 'Title & Hook Track',
    badge: 'T2',
    compound: 'text',
    selectedClip: { track: 'title' },
    icon: <Type className="w-3.5 h-3.5 text-sky-400" />,
    colorClass: 'text-sky-200',
    bgHover: 'hover:bg-sky-500/15',
    borderHover: 'hover:border-sky-500/30',
  },
  {
    key: 'voice',
    label: 'Voiceover Audio',
    badge: 'A1',
    compound: 'voice',
    selectedClip: { track: 'voice' },
    icon: <Mic className="w-3.5 h-3.5 text-emerald-400" />,
    colorClass: 'text-emerald-200',
    bgHover: 'hover:bg-emerald-500/15',
    borderHover: 'hover:border-emerald-500/30',
  },
  {
    key: 'music',
    label: 'Soundtrack Music',
    badge: 'A2',
    compound: 'music',
    selectedClip: { track: 'music' },
    icon: <Music className="w-3.5 h-3.5 text-purple-400" />,
    colorClass: 'text-purple-200',
    bgHover: 'hover:bg-purple-500/15',
    borderHover: 'hover:border-purple-500/30',
  },
  {
    key: 'sfx',
    label: 'Sound FX Track',
    badge: 'A3',
    compound: 'music',
    selectedClip: { track: 'sfx' },
    icon: <Sparkles className="w-3.5 h-3.5 text-orange-400" />,
    colorClass: 'text-orange-200',
    bgHover: 'hover:bg-orange-500/15',
    borderHover: 'hover:border-orange-500/30',
  },
];

export const TimelineAddTrackMenu: React.FC<TimelineAddTrackMenuProps> = ({
  isOpen,
  onClose,
  anchorRef,
  onEnableTrack,
  enabledTracks,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, maxHeight: 440, openAbove: true });

  useLayoutEffect(() => {
    if (!isOpen) return;
    const anchor = anchorRef.current;
    if (!anchor) return;

    const updatePosition = () => {
      const rect = anchor.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;
      const requiredHeight = 410;
      // Because timeline is docked near the bottom, open above whenever upper space is available
      const openAbove = spaceBelow < requiredHeight && spaceAbove >= spaceBelow;
      const maxHeight = Math.min(460, openAbove ? spaceAbove : spaceBelow);
      const measuredHeight = menuRef.current?.offsetHeight || requiredHeight;
      const menuHeight = Math.min(measuredHeight, maxHeight);

      setPosition({
        top: openAbove ? Math.max(12, rect.top - menuHeight - 6) : rect.bottom + 6,
        left: Math.max(12, Math.min(rect.left, window.innerWidth - 264)),
        maxHeight,
        openAbove,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorRef, isOpen]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
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
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={menuRef}
      className="fixed w-64 overflow-y-auto bg-[#16161B] border border-[#2B2B36] shadow-2xl p-2 z-[99999] flex flex-col gap-1 rounded-xl select-none"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        maxHeight: `${position.maxHeight}px`,
      }}
    >
      {/* Header showing total 8 tracks */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-[#2B2B36] mb-1">
        <span className="text-[10px] font-mono-studio text-white font-bold uppercase tracking-wider">
          Add Track
        </span>
        <span className="text-[9px] font-mono-studio text-[#A1A1AA] bg-white/10 px-2 py-0.5 rounded-full font-bold">
          8 Tracks
        </span>
      </div>

      {/* All 8 Tracks */}
      <div className="flex flex-col gap-0.5">
        {ALL_EIGHT_TRACKS.map((track) => {
          const isEnabled = enabledTracks ? Boolean(enabledTracks[track.key]) : false;
          return (
            <button
              key={track.key}
              type="button"
              onClick={() => {
                onEnableTrack(track.key, track.selectedClip, track.compound);
                onClose();
              }}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left border border-transparent transition-all cursor-pointer ${track.bgHover} ${track.borderHover} ${
                isEnabled ? 'bg-white/[0.04]' : 'bg-transparent'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0">{track.icon}</span>
                <span className={`font-medium truncate ${track.colorClass}`}>
                  {track.label}
                </span>
                <span className="text-[9px] font-mono-studio text-[#71717A] bg-black/40 px-1 py-0.2 rounded border border-white/5 shrink-0">
                  {track.badge}
                </span>
              </div>

              {/* Status Badge */}
              {isEnabled ? (
                <span className="text-[9px] font-mono-studio text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                  <Check className="w-2.5 h-2.5" />
                  <span>Active</span>
                </span>
              ) : (
                <span className="text-[9px] font-mono-studio text-[#9CA3AF] bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0">
                  <Plus className="w-2.5 h-2.5" />
                  <span>Add</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  );
};

export default TimelineAddTrackMenu;
