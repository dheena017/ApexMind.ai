import React, { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Film,
  Type,
  Mic,
  Music,
  Image as ImageIcon,
  Layers,
  Sparkles,
} from 'lucide-react';
import { EnabledTracks, SelectedClip } from './timelineTypes';

export interface TimelineAddTrackMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: { current: HTMLElement | null };
  onEnableTrack: (trackKey: keyof EnabledTracks, selected: SelectedClip, compound: 'video' | 'text' | 'voice' | 'music' | 'overlay') => void;
}

export const TimelineAddTrackMenu: React.FC<TimelineAddTrackMenuProps> = ({
  isOpen,
  onClose,
  anchorRef,
  onEnableTrack,
}) => {
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, maxHeight: 300, openAbove: false });

  useLayoutEffect(() => {
    if (!isOpen) return;
    const anchor = anchorRef.current;
    if (!anchor) return;

    const updatePosition = () => {
      const rect = anchor.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      const openAbove = spaceBelow < 280 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(120, Math.min(300, openAbove ? spaceAbove : spaceBelow));
      const menuHeight = Math.min((menuRef.current?.scrollHeight || 257) + 2, maxHeight);
      setPosition({
        top: openAbove ? rect.top - menuHeight : rect.bottom,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 216)),
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

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={menuRef}
      className={`fixed w-52 overflow-y-auto bg-[#18181B] border border-[#27272A] shadow-2xl p-1.5 z-[1000] flex flex-col gap-1 ${position.openAbove ? 'rounded-t-xl rounded-b-none' : 'rounded-t-none rounded-b-xl'}`}
      style={{ top: position.top, left: position.left, maxHeight: position.maxHeight }}
    >
      <span className="text-[9px] font-mono-studio text-[#71717A] px-2 py-1 uppercase tracking-wider">
        Left Panel Track Categories
      </span>
      <button
        type="button"
        onClick={() => {
          onEnableTrack('video', { track: 'video' }, 'video');
          onClose();
        }}
        className="flex items-center gap-2 px-2 py-1 rounded text-xs text-left text-amber-200 hover:bg-amber-950/40 cursor-pointer"
      >
        <Film className="w-3.5 h-3.5 text-amber-400" />
        <span>Video Track (V1)</span>
      </button>
      <button
        type="button"
        onClick={() => {
          onEnableTrack('image', { track: 'image' }, 'video');
          onClose();
        }}
        className="flex items-center gap-2 px-2 py-1 rounded text-xs text-left text-rose-200 hover:bg-rose-950/40 cursor-pointer"
      >
        <ImageIcon className="w-3.5 h-3.5 text-rose-400" />
        <span>Image Track (V2)</span>
      </button>
      <button
        type="button"
        onClick={() => {
          onEnableTrack('overlay', { track: 'overlay' }, 'overlay');
          onClose();
        }}
        className="flex items-center gap-2 px-2 py-1 rounded text-xs text-left text-indigo-200 hover:bg-indigo-950/40 cursor-pointer"
      >
        <Layers className="w-3.5 h-3.5 text-indigo-400" />
        <span>Elements / Overlay (O1)</span>
      </button>
      <button
        type="button"
        onClick={() => {
          onEnableTrack('captions', { track: 'caption', index: 0 }, 'text');
          onClose();
        }}
        className="flex items-center gap-2 px-2 py-1 rounded text-xs text-left text-blue-200 hover:bg-blue-950/40 cursor-pointer"
      >
        <Type className="w-3.5 h-3.5 text-blue-400" />
        <span>Captions Track (T1)</span>
      </button>
      <button
        type="button"
        onClick={() => {
          onEnableTrack('title', { track: 'title' }, 'text');
          onClose();
        }}
        className="flex items-center gap-2 px-2 py-1 rounded text-xs text-left text-sky-200 hover:bg-sky-950/40 cursor-pointer"
      >
        <Type className="w-3.5 h-3.5 text-sky-400" />
        <span>Title & Hook Track (T2)</span>
      </button>
      <button
        type="button"
        onClick={() => {
          onEnableTrack('voice', { track: 'voice' }, 'voice');
          onClose();
        }}
        className="flex items-center gap-2 px-2 py-1 rounded text-xs text-left text-emerald-200 hover:bg-emerald-950/40 cursor-pointer"
      >
        <Mic className="w-3.5 h-3.5 text-emerald-400" />
        <span>Voiceover Audio (A1)</span>
      </button>
      <button
        type="button"
        onClick={() => {
          onEnableTrack('music', { track: 'music' }, 'music');
          onClose();
        }}
        className="flex items-center gap-2 px-2 py-1 rounded text-xs text-left text-purple-200 hover:bg-purple-950/40 cursor-pointer"
      >
        <Music className="w-3.5 h-3.5 text-purple-400" />
        <span>Soundtrack Music (A2)</span>
      </button>
      <button
        type="button"
        onClick={() => {
          onEnableTrack('sfx', { track: 'sfx' }, 'music');
          onClose();
        }}
        className="flex items-center gap-2 px-2 py-1 rounded text-xs text-left text-amber-200 hover:bg-amber-950/40 cursor-pointer"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Sound FX Track (A3)</span>
      </button>
    </div>,
    document.body
  );
};

export default TimelineAddTrackMenu;
