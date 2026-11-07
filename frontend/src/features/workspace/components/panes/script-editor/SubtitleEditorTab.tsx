/**
 * frontend/src/features/workspace/components/panes/script-editor/SubtitleEditorTab.tsx
 */

import React, { useState, useMemo } from 'react';
import { Type, Plus, Search, X, Download, Copy, Sparkles } from 'lucide-react';
import { ScriptSubtitle } from '../../../types';
import { SubtitleCueCard } from './SubtitleCueCard';
import { exportSRTFile, copyTranscriptToClipboard } from '../../../utils/srtExporter';
import { rebalanceSubtitleTimings, splitSubtitleCue, insertSubtitleCue } from '../../../utils/subtitleTiming';

interface SubtitleEditorTabProps {
  subtitles: ScriptSubtitle[];
  title?: string;
  timelineDuration: number;
  onUpdateSubtitles: (subs: ScriptSubtitle[]) => void;
  onGenerateCuesFromScript: () => void;
  onSeek?: (seconds: number) => void;
  onShowNotice: (msg: string) => void;
}

export const SubtitleEditorTab: React.FC<SubtitleEditorTabProps> = ({
  subtitles,
  title,
  timelineDuration,
  onUpdateSubtitles,
  onGenerateCuesFromScript,
  onSeek,
  onShowNotice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSubtitles = useMemo(() => {
    if (!searchQuery.trim()) return subtitles;
    const q = searchQuery.toLowerCase();
    return subtitles.filter((s) => s.text.toLowerCase().includes(q));
  }, [subtitles, searchQuery]);

  const handleUpdate = (origIdx: number, updated: Partial<ScriptSubtitle>) => {
    const next = [...subtitles];
    next[origIdx] = { ...next[origIdx], ...updated };
    onUpdateSubtitles(next);
  };

  const handleAdd = (afterIdx?: number) => {
    const next = insertSubtitleCue(subtitles, afterIdx);
    onUpdateSubtitles(next);
    onShowNotice('Added new subtitle cue');
  };

  const handleDelete = (origIdx: number) => {
    const next = subtitles.filter((_, i) => i !== origIdx);
    onUpdateSubtitles(next);
    onShowNotice('Deleted subtitle cue');
  };

  const handleSplit = (origIdx: number) => {
    const next = splitSubtitleCue(subtitles, origIdx);
    if (next) {
      onUpdateSubtitles(next);
      onShowNotice('Split into 2 cues');
    } else {
      onShowNotice('Cue too short to split');
    }
  };

  const handleRebalance = () => {
    const next = rebalanceSubtitleTimings(subtitles, Math.round(timelineDuration || 30));
    onUpdateSubtitles(next);
    onShowNotice(`Rebalanced cues evenly over ${Math.round(timelineDuration || 30)}s`);
  };

  const handleExport = () => {
    const ok = exportSRTFile(subtitles, title || 'video_subtitles');
    if (ok) {
      onShowNotice('Downloaded subtitles as .SRT');
    } else {
      onShowNotice('No subtitle cues to export');
    }
  };

  const handleCopy = async () => {
    const ok = await copyTranscriptToClipboard(subtitles);
    if (ok) {
      onShowNotice('Copied full transcript to clipboard');
    }
  };

  return (
    <div className="space-y-3.5">
      {/* ── Subtitle Control Bar ── */}
      <div className="p-3 rounded-2xl bg-[#141418] border border-[#24242A] space-y-3 shadow-sm">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Timeline Subtitles
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#18181C] text-[#60A5FA] border border-[#27272A]">
              {subtitles.length} Cues
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleRebalance}
              className="px-2.5 py-1 rounded-lg bg-[#18181C] hover:bg-[#202026] border border-[#27272A] hover:border-[#383842] text-[10px] font-medium text-zinc-300 hover:text-white transition-all cursor-pointer shadow-xs"
              title={`Evenly distribute timings over active video duration (${Math.round(timelineDuration || 30)}s)`}
            >
              <span>Auto-Fit {Math.round(timelineDuration || 30)}s</span>
            </button>

            <button
              type="button"
              onClick={() => handleAdd()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[10px] font-bold cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Add Cue</span>
            </button>
          </div>
        </div>

        {/* Search / Filter Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter or search subtitle cues..."
            className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-[#16161A] border border-[#27272A] text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#3B82F6] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-zinc-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Subtitle Cues List ── */}
      {filteredSubtitles.length === 0 ? (
        <div className="bg-[#141418] border border-dashed border-[#24242A] rounded-2xl p-8 text-center space-y-3">
          <Type className="w-8 h-8 text-zinc-600 mx-auto" />
          <div className="text-xs text-zinc-400">
            {searchQuery ? `No subtitle cues match "${searchQuery}"` : 'No subtitle cues generated yet.'}
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={onGenerateCuesFromScript}
              className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Cues from Script</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredSubtitles.map((sub, idx) => {
            const origIdx = subtitles.indexOf(sub);
            return (
              <SubtitleCueCard
                key={idx}
                cue={sub}
                originalIndex={origIdx >= 0 ? origIdx : idx}
                onUpdate={(upd) => handleUpdate(origIdx >= 0 ? origIdx : idx, upd)}
                onDelete={() => handleDelete(origIdx >= 0 ? origIdx : idx)}
                onSplit={() => handleSplit(origIdx >= 0 ? origIdx : idx)}
                onAddAfter={() => handleAdd(origIdx >= 0 ? origIdx : idx)}
                onSeek={onSeek}
              />
            );
          })}
        </div>
      )}

      {/* ── Subtitles Footer Utility Bar ── */}
      <div className="p-3 rounded-xl bg-[#141418] border border-[#24242A] flex items-center justify-between text-xs gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181C] hover:bg-[#202026] border border-[#27272A] hover:border-[#383842] text-[11px] font-medium text-zinc-200 hover:text-white transition-colors cursor-pointer shadow-xs"
            title="Download .SRT caption file"
          >
            <Download className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>Export .SRT</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181C] hover:bg-[#202026] border border-[#27272A] hover:border-[#383842] text-[11px] font-medium text-zinc-200 hover:text-white transition-colors cursor-pointer shadow-xs"
            title="Copy all subtitles as continuous text"
          >
            <Copy className="w-3.5 h-3.5 text-zinc-400" />
            <span>Copy Text</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm('Clear all subtitle cues?')) {
              onUpdateSubtitles([]);
              onShowNotice('Cleared all subtitles');
            }
          }}
          className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};
