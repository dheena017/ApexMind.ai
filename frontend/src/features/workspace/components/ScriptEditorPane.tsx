import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  FileText,
  ShieldCheck,
  MoreHorizontal,
  Volume2,
  Edit2,
  Bold,
  Italic,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/src/shared/ui/common';
import { GeneratedScript } from '../types';

interface ScriptEditorPaneProps {
  script: GeneratedScript;
  onUpdateScript: (updated: Partial<GeneratedScript>) => void;
  agentPrompt: string;
  onPromptChange: (val: string) => void;
  category: string;
  onCategoryChange: (cat: string) => void;
  memoryCount: number;
  loadingAgent: boolean;
  onRunAgent: () => void;
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

export const ScriptEditorPane: React.FC<ScriptEditorPaneProps> = ({
  script,
  onUpdateScript,
  agentPrompt,
  onPromptChange,
  category,
  onCategoryChange,
  memoryCount,
  loadingAgent,
  onRunAgent,
}) => {
  // Toggle between 'prompt' (AI Agent Creator) and 'editor' (Script & Subtitles) - Only ONE panel shown at a time!
  const [activeView, setActiveView] = useState<'prompt' | 'editor'>('prompt');

  const handleStartNewVideo = () => {
    setActiveView('prompt');
    onUpdateScript({
      title: 'New Motivation Short',
      hook: '',
      quote: '',
      cta: 'Subscribe for daily stoic wisdom.',
      subtitles: [],
      hashtags: ['#Shorts', '#Motivation', '#Discipline'],
    });
  };

  const handleCreateWithAgent = () => {
    onRunAgent();
    // After triggering 1-click creation, switch to the script editor view to preview generated content
    setActiveView('editor');
  };

  return (
    <div className="flex flex-col h-full font-sans-studio text-[#E5E5E5] space-y-3">
      {/* ── Top Header: Mode Switcher & Actions ───────────────────────── */}
      <div className="flex items-center justify-between pb-2 border-b border-[#2F2F2F] shrink-0">
        {/* Segmented View Switcher: Only ONE Panel Shown at a Time */}
        <div className="flex items-center p-0.5 rounded-xl bg-[#141414] border border-[#2A2A2A]">
          <button
            type="button"
            onClick={() => setActiveView('prompt')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'prompt'
                ? 'bg-[#3B82F6] text-white shadow-sm shadow-[#3B82F6]/50'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>AI Agent Creator</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('editor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'editor'
                ? 'bg-[#3B82F6] text-white shadow-sm shadow-[#3B82F6]/50'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Script & Subtitles</span>
          </button>
        </div>

        {/* Quick New Video & Memory Counter */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleStartNewVideo}
            className="text-[10px] px-2.5 py-1 rounded-lg bg-[#1A1A1A] border border-[#2F2F2F] text-white hover:border-[#3B82F6]/60 hover:text-[#60A5FA] transition-colors font-semibold cursor-pointer"
            title="Start new video"
          >
            + New Video
          </button>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            {memoryCount}
          </span>
        </div>
      </div>

      {/* ── PANEL 1 ONLY: AI Agent 1-Click Creator View ───────────────── */}
      {activeView === 'prompt' ? (
        <div className="flex-1 flex flex-col justify-between p-4 rounded-2xl bg-gradient-to-b from-[#182234] via-[#121824] to-[#0D1117] border border-[#3B82F6]/50 shadow-xl shadow-[#3B82F6]/10 space-y-4 animate-fade-in overflow-y-auto custom-scrollbar">
          <div className="space-y-3.5">
            {/* Header Badge */}
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
              <span className="text-[9px] font-mono-studio px-2 py-0.5 rounded-full bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/30 font-bold">
                GEMINI 2.5
              </span>
            </div>

            {/* Topic Input Box */}
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

            {/* Quick Inspiration Pills */}
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
                    className="text-[9.5px] px-2.5 py-1 rounded-lg bg-[#161B22] border border-[#30363D] text-[#8B949E] hover:text-[#58A6FF] hover:border-[#58A6FF]/50 transition-colors cursor-pointer"
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
                        : 'bg-[#121212] border-[#2A2A2A] text-[#9CA3AF] hover:text-white hover:border-[#3F3F3F]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 1-Click Action Button */}
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              className="w-full justify-center py-3 text-xs font-bold shadow-xl shadow-[#3B82F6]/30 cursor-pointer"
              disabled={loadingAgent}
              icon={<Wand2 className={`w-4 h-4 ${loadingAgent ? 'animate-spin' : ''}`} />}
              onClick={handleCreateWithAgent}
            >
              {loadingAgent ? 'AI Agent Creating Monologue, Voiceover & Subtitles...' : '⚡ 1-Click Create with AI Agent'}
            </Button>
          </div>
        </div>
      ) : (
        /* ── PANEL 2 ONLY: Script & Subtitles Editor View ────────────── */
        <div className="flex-1 flex flex-col space-y-3 overflow-y-auto custom-scrollbar animate-fade-in pr-0.5">
          {/* Script Segment 1: THE HOOK */}
          <div className="rounded-xl border border-[#2F2F2F] hover:border-[#3B82F6]/50 bg-[#181818] p-3 space-y-2 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                <span className="text-xs font-bold text-[#60A5FA] tracking-wider uppercase">THE HOOK</span>
              </div>
              <button className="text-[#6B7280] hover:text-white cursor-pointer">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>

            <textarea
              value={script.hook}
              onChange={(e) => onUpdateScript({ hook: e.target.value })}
              rows={2}
              className="w-full bg-[#0E0E0E] border border-[#262626] rounded-lg p-2 text-xs text-white outline-none focus:border-[#3B82F6] font-medium resize-none transition-colors"
              placeholder="Top 5 Habit Hacks! / The quietest people often fight the loudest battles."
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

          {/* Script Segment 2: THE QUOTE */}
          <div className="rounded-xl border border-[#2F2F2F] hover:border-[#3B82F6]/50 bg-[#181818] p-3 space-y-2 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#60A5FA]" />
                <span className="text-xs font-bold text-white tracking-wider uppercase">THE QUOTE</span>
              </div>
              <button className="text-[#6B7280] hover:text-white cursor-pointer">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>

            <textarea
              value={script.quote}
              onChange={(e) => onUpdateScript({ quote: e.target.value })}
              rows={3}
              className="w-full bg-[#0E0E0E] border border-[#262626] rounded-lg p-2 text-xs text-white outline-none focus:border-[#3B82F6] font-medium resize-none transition-colors leading-relaxed"
              placeholder="True power is never loud. It compounds in silence while nobody is watching..."
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
              <button
                type="button"
                onClick={() => setActiveView('prompt')}
                className="text-[11px] text-[#60A5FA] font-semibold hover:underline cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Re-generate with AI</span>
              </button>
            </div>
          </div>

          {/* Script Segment 3: SUBTITLES */}
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
                <button className="text-[#6B7280] hover:text-white cursor-pointer">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5 flex-1 overflow-y-auto max-h-48 pr-1 custom-scrollbar">
              {script.subtitles.length === 0 ? (
                <div className="py-6 text-center text-[11px] text-[#6B7280] italic">
                  No subtitles yet. Click 'AI Agent Creator' tab above to generate a full script.
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
      )}
    </div>
  );
};
