import React from 'react';
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
  onEnableTrack: (trackKey: keyof EnabledTracks, selected: SelectedClip, compound: 'video' | 'text' | 'voice' | 'music' | 'overlay') => void;
}

export const TimelineAddTrackMenu: React.FC<TimelineAddTrackMenuProps> = ({
  isOpen,
  onClose,
  onEnableTrack,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-0 mt-1 w-52 bg-[#18181B] border border-[#27272A] rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1">
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
    </div>
  );
};

export default TimelineAddTrackMenu;
