/**
 * frontend/src/features/workspace/components/panes/script-editor/SubtitleCueCard.tsx
 */

import React from 'react';
import { Play, Scissors, Plus, Trash2, Minus } from 'lucide-react';
import { ScriptSubtitle } from '../../../types';
import { formatTimecode } from '../../../utils/subtitleTiming';

interface SubtitleCueCardProps {
  cue: ScriptSubtitle;
  originalIndex: number;
  onUpdate: (updated: Partial<ScriptSubtitle>) => void;
  onDelete: () => void;
  onSplit: () => void;
  onAddAfter: () => void;
  onSeek?: (seconds: number) => void;
}

export const SubtitleCueCard: React.FC<SubtitleCueCardProps> = ({
  cue,
  originalIndex,
  onUpdate,
  onDelete,
  onSplit,
  onAddAfter,
  onSeek,
}) => {
  const wordCount = cue.text.trim().split(/\s+/).filter(Boolean).length;
  const endTime = Number((cue.start + cue.duration).toFixed(1));

  return (
    <div className="group p-3 rounded-xl transition-colors border bg-[#141418] border-[#24242A] hover:border-[#383842]">
      {/* Top Bar of Cue Card */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#18181C] text-[#60A5FA] border border-[#27272A]">
            #{originalIndex + 1}
          </span>
          <span className="text-[11px] font-mono text-zinc-300">
            {formatTimecode(cue.start)} → {formatTimecode(endTime)}
          </span>
        </div>

        {/* Cue Actions */}
        <div className="flex items-center gap-1">
          {onSeek && (
            <button
              type="button"
              onClick={() => onSeek(cue.start)}
              aria-label={`Seek to subtitle cue ${originalIndex + 1}`}
              className="w-8 h-8 rounded-lg bg-[#18181C] hover:bg-[#222228] text-zinc-400 hover:text-white transition-colors cursor-pointer border border-[#27272A] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/60"
              title="Seek playhead to this cue"
            >
              <Play className="w-3.5 h-3.5 text-[#3B82F6]" />
            </button>
          )}

          <button
            type="button"
            onClick={onSplit}
            aria-label={`Split subtitle cue ${originalIndex + 1}`}
            className="w-8 h-8 rounded-lg bg-[#18181C] hover:bg-[#222228] text-zinc-400 hover:text-white transition-colors cursor-pointer border border-[#27272A] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/60"
            title="Split cue in half"
          >
            <Scissors className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          <button
            type="button"
            onClick={onAddAfter}
            aria-label={`Insert cue after subtitle ${originalIndex + 1}`}
            className="w-8 h-8 rounded-lg bg-[#18181C] hover:bg-[#222228] text-zinc-400 hover:text-white transition-colors cursor-pointer border border-[#27272A] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/60"
            title="Insert cue after this"
          >
            <Plus className="w-3.5 h-3.5 text-[#3B82F6]" />
          </button>

          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete subtitle cue ${originalIndex + 1}`}
            className="w-8 h-8 rounded-lg bg-[#18181C] hover:bg-red-950/40 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer border border-[#27272A] hover:border-red-900/50 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
            title="Delete this cue"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subtitle Cue Text Input */}
      <input
        type="text"
        value={cue.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        aria-label={`Text for subtitle cue ${originalIndex + 1}`}
        className="w-full bg-[#18181C] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 transition-all font-medium"
        placeholder="Subtitle cue line..."
      />

      {/* Bottom Micro-Adjusters & Word Count */}
      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-[#24242A]/60 text-[10px] font-mono">
        <div className="flex items-center gap-2">
          {/* Start Time Stepper */}
          <div className="flex items-center gap-1">
            <span className="text-[#9CA3AF]">Start:</span>
            <button
              type="button"
              onClick={() => onUpdate({ start: Math.max(0, Number((cue.start - 0.1).toFixed(1))) })}
              aria-label={`Move subtitle cue ${originalIndex + 1} start earlier by 0.1 seconds`}
              className="w-7 h-7 rounded-lg bg-[#18181C] hover:bg-[#202026] text-zinc-300 cursor-pointer border border-[#27272A] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/60"
              title="-0.1s"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-white font-bold w-9 text-center">{cue.start.toFixed(1)}s</span>
            <button
              type="button"
              onClick={() => onUpdate({ start: Number((cue.start + 0.1).toFixed(1)) })}
              aria-label={`Move subtitle cue ${originalIndex + 1} start later by 0.1 seconds`}
              className="w-7 h-7 rounded-lg bg-[#18181C] hover:bg-[#202026] text-zinc-300 cursor-pointer border border-[#27272A] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/60"
              title="+0.1s"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Duration Stepper */}
          <div className="flex items-center gap-1">
            <span className="text-[#9CA3AF]">Dur:</span>
            <button
              type="button"
              onClick={() => onUpdate({ duration: Math.max(0.5, Number((cue.duration - 0.1).toFixed(1))) })}
              aria-label={`Shorten subtitle cue ${originalIndex + 1} by 0.1 seconds`}
              className="w-7 h-7 rounded-lg bg-[#18181C] hover:bg-[#202026] text-zinc-300 cursor-pointer border border-[#27272A] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/60"
              title="-0.1s"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-white font-bold w-9 text-center">{cue.duration.toFixed(1)}s</span>
            <button
              type="button"
              onClick={() => onUpdate({ duration: Number((cue.duration + 0.1).toFixed(1)) })}
              aria-label={`Lengthen subtitle cue ${originalIndex + 1} by 0.1 seconds`}
              className="w-7 h-7 rounded-lg bg-[#18181C] hover:bg-[#202026] text-zinc-300 cursor-pointer border border-[#27272A] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/60"
              title="+0.1s"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="text-[9px] text-zinc-500">
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </div>
      </div>
    </div>
  );
};
