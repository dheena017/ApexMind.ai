import React from 'react';
import { Sparkles, Wand2, ShieldCheck, FileText, Plus } from 'lucide-react';
import { Button } from '@/src/shared/ui/common';

interface AIAgentCreatorPaneProps {
  agentPrompt: string;
  onPromptChange: (val: string) => void;
  category: string;
  onCategoryChange: (cat: string) => void;
  memoryCount: number;
  loadingAgent: boolean;
  onRunAgent: () => void;
  onSwitchToEditor?: () => void;
  onStartNewVideo?: () => void;
}

const CATEGORIES = [
  'Stoic Mindset & Discipline',
  'Morning Energy & Grit',
  'Fitness & Power',
  'Financial Freedom',
];

const QUICK_TOPICS = [
  '5 AM Silent Discipline',
  'Overcoming Fear of Failure',
  'Relentless Compounding',
  'Stoic Mental Toughness',
];

export const AIAgentCreatorPane: React.FC<AIAgentCreatorPaneProps> = ({
  agentPrompt,
  onPromptChange,
  category,
  onCategoryChange,
  memoryCount,
  loadingAgent,
  onRunAgent,
  onSwitchToEditor,
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
          <h2 className="text-sm font-bold text-white tracking-tight">AI Agent Creator</h2>
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

          {onSwitchToEditor && (
            <button
              type="button"
              onClick={onSwitchToEditor}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-[#1E1E1E] border border-[#2F2F2F] text-[#9CA3AF] hover:text-white hover:border-[#3B82F6]/50 transition-colors font-semibold cursor-pointer flex items-center gap-1"
              title="Switch to Script & Subtitles"
            >
              <FileText className="w-3 h-3" />
              <span>Script Editor</span>
            </button>
          )}
        </div>
      </div>

      {/* ── AI Agent 1-Click Creator Main Container (Website Theme) ── */}
      <div className="flex-1 flex flex-col justify-between p-4 rounded-2xl bg-[#141414] border border-[#2F2F2F] shadow-xl space-y-4 animate-fade-in overflow-y-auto custom-scrollbar">
        <div className="space-y-3.5">
          {/* Header Title & Gemini Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#3B82F6] to-[#2563EB] flex items-center justify-center text-white shadow-md shadow-[#3B82F6]/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white tracking-wide uppercase">AI Agent Video Creator</h3>
                <p className="text-[10px] text-[#9CA3AF]">Zero Hallucination • Unique Quote Memory</p>
              </div>
            </div>
            <span className="text-[9px] font-mono-studio px-2 py-0.5 rounded-full bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/30 font-bold">
              GEMINI 2.5
            </span>
          </div>

          {/* Topic / Motivation Prompt Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-[#9CA3AF] uppercase tracking-wider block">
              Video Topic or Motivation Prompt
            </label>
            <textarea
              value={agentPrompt}
              onChange={(e) => onPromptChange(e.target.value)}
              rows={3}
              className="w-full bg-[#0A0A0A] border border-[#2F2F2F] text-xs text-white rounded-xl p-3 outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/50 transition-all resize-none placeholder:text-[#525252] leading-relaxed"
              placeholder="e.g. Monologue about silent discipline, early mornings, and relentless consistency..."
            />
          </div>

          {/* Quick Inspiration Presets */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider block">
              Quick Inspiration Presets:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => onPromptChange(topic)}
                  className="text-[9.5px] px-2.5 py-1 rounded-lg bg-[#181818] border border-[#2A2A2A] text-[#9CA3AF] hover:text-[#60A5FA] hover:border-[#3B82F6]/50 transition-colors cursor-pointer"
                >
                  ⚡ {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Niche Categories */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-[#9CA3AF] uppercase tracking-wider block">
              Niche Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onCategoryChange(cat)}
                  className={`text-[10px] px-3 py-1 rounded-lg border transition-all cursor-pointer font-medium ${
                    category === cat
                      ? 'bg-[#3B82F6] border-[#3B82F6] text-white shadow-sm shadow-[#3B82F6]/50'
                      : 'bg-[#181818] border-[#2A2A2A] text-[#9CA3AF] hover:text-white hover:border-[#3B82F6]/40'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 1-Click Create Action Button */}
        <div className="pt-2">
          <Button
            variant="primary"
            size="sm"
            className="w-full justify-center py-3 text-xs font-bold shadow-xl shadow-[#3B82F6]/30 cursor-pointer"
            disabled={loadingAgent}
            icon={<Wand2 className={`w-4 h-4 ${loadingAgent ? 'animate-spin' : ''}`} />}
            onClick={onRunAgent}
          >
            {loadingAgent ? 'AI Agent Creating Monologue, Voiceover & Subtitles...' : '⚡ 1-Click Create with AI Agent'}
          </Button>
        </div>
      </div>
    </div>
  );
};
