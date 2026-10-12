import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  MoreHorizontal,
  Volume2,
  Edit2,
  Bold,
  Italic,
  Trash2,
  RefreshCw,
  Wand2,
  Plus,
} from 'lucide-react';
import { GeneratedScript } from '../types';

interface ScriptEditorPaneProps {
  script: GeneratedScript;
  onUpdateScript: (updated: Partial<GeneratedScript>) => void;
  memoryCount: number;
  onSwitchToAgent?: () => void;
  onStartNewVideo?: () => void;
}

export const ScriptEditorPane: React.FC<ScriptEditorPaneProps> = ({
  script,
  onUpdateScript,
  memoryCount,
  onSwitchToAgent,
  onStartNewVideo,
}) => {
  return (
    <div className="flex flex-col h-full font-sans-studio text-[#E5E5E5] space-y-3">
      {/* ── Top Header Bar ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-2 border-b border-[#2F2F2F] shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-[#3B82F6]/10 text-[#60A5FA]">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-white tracking-tight">Script & Subtitles</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            {memoryCount} Memory
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onStartNewVideo && (
            <button
              type="button"
              onClick={onStartNewVideo}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-[#181818] border border-[#2F2F2F] text-white hover:border-[#3B82F6]/60 hover:text-[#60A5FA] transition-colors font-semibold cursor-pointer flex items-center gap-1"
              title="Start a fresh empty project"
            >
              <Plus className="w-3 h-3 text-[#60A5FA]" />
              <span>New</span>
            </button>
          )}

          {onSwitchToAgent && (
            <button
              type="button"
              onClick={onSwitchToAgent}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-[#1E1E1E] border border-[#2F2F2F] text-[#60A5FA] hover:text-white hover:border-[#3B82F6]/60 transition-colors font-semibold cursor-pointer flex items-center gap-1"
              title="Open AI Prompt Generator"
            >
              <Wand2 className="w-3 h-3" />
              <span>AI Agent Prompt</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Script Segments Editor (Full-Height View) ─────────────────── */}
      <div className="flex-1 flex flex-col space-y-3 overflow-y-auto custom-scrollbar animate-fade-in pr-0.5">
        {/* Segment 1: THE HOOK */}
        <div className="rounded-xl border border-[#2F2F2F] hover:border-[#3B82F6]/50 bg-[#181818] p-3 space-y-2 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
              <span className="text-xs font-bold text-[#60A5FA] tracking-wider uppercase">THE HOOK</span>
            </div>
            <button className="text-[#6B7280] hover:text-white cursor-pointer" title="Options">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          <textarea
            value={script.hook}
            onChange={(e) => onUpdateScript({ hook: e.target.value })}
            rows={2}
            className="w-full bg-[#0E0E0E] border border-[#262626] rounded-lg p-2 text-xs text-white outline-none focus:border-[#3B82F6] font-medium resize-none transition-colors"
            placeholder="Enter an attention-grabbing 3-5 word hook spoken in the first 2 seconds..."
          />

          <div className="flex items-center justify-between text-[10px] text-[#6B7280] pt-0.5">
            <span className="text-[#9CA3AF]">Length</span>
            <div className="flex-1 mx-3 h-1 bg-[#262626] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#3B82F6] rounded-full transition-all"
                style={{
                  width: `${Math.min(100, ((script.hook?.trim().split(/\s+/).length || 0) / 12) * 100)}%`,
                }}
              />
            </div>
            <span className="font-mono-studio text-[#60A5FA]">
              {script.hook ? script.hook.trim().split(/\s+/).length : 0} words
            </span>
          </div>
        </div>

        {/* Segment 2: THE QUOTE */}
        <div className="rounded-xl border border-[#2F2F2F] hover:border-[#3B82F6]/50 bg-[#181818] p-3 space-y-2 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#60A5FA]" />
              <span className="text-xs font-bold text-white tracking-wider uppercase">THE QUOTE</span>
            </div>
            <button className="text-[#6B7280] hover:text-white cursor-pointer" title="Options">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          <textarea
            value={script.quote}
            onChange={(e) => onUpdateScript({ quote: e.target.value })}
            rows={3}
            className="w-full bg-[#0E0E0E] border border-[#262626] rounded-lg p-2 text-xs text-white outline-none focus:border-[#3B82F6] font-medium resize-none transition-colors leading-relaxed"
            placeholder="Enter the motivational monologue / quote body..."
          />

          <div className="flex items-center justify-between pt-1 border-t border-[#262626] text-[11px] text-[#9CA3AF]">
            <div className="flex items-center gap-2.5">
              <button className="hover:text-white font-bold cursor-pointer" title="Bold">
                <Bold className="w-3 h-3" />
              </button>
              <button className="hover:text-white italic cursor-pointer" title="Italic">
                <Italic className="w-3 h-3" />
              </button>
              <button className="hover:text-white cursor-pointer" title="Edit formatting">
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => onUpdateScript({ quote: '' })}
                className="hover:text-red-400 cursor-pointer"
                title="Clear"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            {onSwitchToAgent && (
              <button
                type="button"
                onClick={onSwitchToAgent}
                className="text-[11px] text-[#60A5FA] font-semibold hover:underline cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Re-generate with AI</span>
              </button>
            )}
          </div>
        </div>

        {/* Segment 3: SUBTITLES */}
        <div className="rounded-xl border border-[#2F2F2F] hover:border-[#3B82F6]/50 bg-[#181818] p-3 space-y-2 transition-all flex-1 min-h-[140px] flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
              <span className="text-xs font-bold text-[#60A5FA] tracking-wider uppercase">SUBTITLES</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-[11px] text-[#60A5FA] font-semibold flex items-center gap-1 hover:underline cursor-pointer">
                <Edit2 className="w-3 h-3" />
                Edit
              </button>
              <button className="text-[#6B7280] hover:text-white cursor-pointer" title="Options">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-1.5 flex-1 overflow-y-auto max-h-48 pr-1 custom-scrollbar">
            {script.subtitles.length === 0 ? (
              <div className="py-6 text-center text-[11px] text-[#6B7280] italic">
                No subtitles yet. Click 'AI Agent Prompt' above to generate with AI.
              </div>
            ) : (
              script.subtitles.map((sub, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-[#0E0E0E] border border-[#262626] text-[11px] group hover:border-[#3B82F6]/40 transition-colors"
                >
                  <span className="text-[10px] font-mono-studio text-[#60A5FA] shrink-0 px-1 py-0.2 rounded bg-[#1A1A1A]">
                    {`00:${Math.floor(sub.start).toString().padStart(2, '0')}`}
                  </span>
                  <input
                    value={sub.text}
                    onChange={(e) => {
                      const next = [...script.subtitles];
                      next[idx] = { ...sub, text: e.target.value };
                      onUpdateScript({ subtitles: next });
                    }}
                    className="flex-1 bg-transparent border-none outline-none text-white text-[11px] truncate"
                  />
                  <div className="flex items-center gap-1.5 text-[#6B7280] group-hover:text-[#9CA3AF]">
                    <Edit2 className="w-3 h-3 hover:text-white cursor-pointer" />
                    <Volume2 className="w-3 h-3 hover:text-[#60A5FA] cursor-pointer" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
