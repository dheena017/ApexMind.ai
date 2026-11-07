/**
 * frontend/src/features/workspace/components/panes/script-editor/components/ScriptToolbar.tsx
 */

import React from 'react';
import { FileText, Plus, ArrowLeftRight } from 'lucide-react';

interface ScriptToolbarProps {
  onStartNewVideo?: () => void;
  onSwitchToAgent?: () => void;
}

export const ScriptToolbar: React.FC<ScriptToolbarProps> = ({
  onStartNewVideo,
  onSwitchToAgent,
}) => {
  return (
    <div className="relative h-11 px-3.5 bg-[#141418] border-b border-[#24242A] flex items-center justify-between z-20 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <FileText className="w-4 h-4 shrink-0 text-[#3B82F6]" />
        <span className="text-xs font-bold text-white tracking-tight truncate">
          Script &amp; Subtitles
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onStartNewVideo && (
          <button
            type="button"
            onClick={onStartNewVideo}
            className="h-7 px-2.5 rounded-lg bg-[#18181C] hover:bg-[#202026] text-[11px] font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer border border-[#27272A] flex items-center gap-1 shadow-xs"
            title="Start a new script from scratch"
          >
            <Plus className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span className="hidden sm:inline">New</span>
          </button>
        )}

        {onSwitchToAgent && (
          <button
            type="button"
            onClick={onSwitchToAgent}
            className="h-7 flex items-center gap-1.5 px-2.5 rounded-lg bg-[#1E1E24] hover:bg-[#26262E] text-[11px] font-medium text-zinc-300 hover:text-white transition-all cursor-pointer border border-[#2A2A32] shadow-xs group"
            title="Click to switch to AI Prompt Studio"
          >
            <FileText className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span className="truncate">Script Editor</span>
            <ArrowLeftRight className="w-3 h-3 text-zinc-500 group-hover:text-white transition-colors" />
          </button>
        )}
      </div>
    </div>
  );
};

