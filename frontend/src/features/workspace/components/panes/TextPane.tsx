import React, { useState } from 'react';
import {
  Type,
  AlignLeft,
  Check,
  Plus,
  Zap,
} from 'lucide-react';

export interface TextPreset {
  id: string;
  name: string;
  previewText: string;
  className: string;
  color: string;
  styleDescription: string;
}

export interface TextPaneProps {
  onInsertText?: (text: string, type: 'heading' | 'subheading' | 'body') => void;
  onApplyPreset?: (preset: TextPreset) => void;
  onUpdateTitle?: (title: string) => void;
  onUpdateHook?: (hook: string) => void;
  onUpdateQuote?: (quote: string) => void;
}

const MOTIVATIONAL_PRESETS: TextPreset[] = [
  {
    id: 'impact-bold',
    name: 'Titan Impact',
    previewText: 'STAY IN SILENCE',
    color: '#FFFFFF',
    className: 'font-black tracking-tight text-white uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,1)]',
    styleDescription: 'High contrast TikTok/Shorts bold punchy style',
  },
  {
    id: 'neon-cyan',
    name: 'Cyber Cyan Bold',
    previewText: 'RELENTLESS MOMENTUM',
    color: '#06B6D4',
    className: 'font-black tracking-wider text-[#06B6D4] uppercase drop-shadow-[0_3px_8px_rgba(0,0,0,0.9)]',
    styleDescription: 'Crisp cyber style for tech & motivation',
  },
  {
    id: 'golden-legacy',
    name: 'Stoic Gold',
    previewText: 'FORGE YOUR DESTINY',
    color: '#F59E0B',
    className: 'font-extrabold tracking-wide text-amber-400 uppercase drop-shadow-[0_3px_8px_rgba(0,0,0,0.9)]',
    styleDescription: 'Warm luxury gold for philosophy and wealth',
  },
  {
    id: 'crimson-fury',
    name: 'Aggressive Crimson',
    previewText: 'NOBODY CARES. WORK HARDER.',
    color: '#EF4444',
    className: 'font-black tracking-tighter text-red-500 uppercase drop-shadow-[0_3px_8px_rgba(0,0,0,0.9)]',
    styleDescription: 'High adrenaline gym & grind energy',
  },
  {
    id: 'emerald-mindset',
    name: 'Emerald Discipline',
    previewText: 'CONSISTENCY BEATS TALENT',
    color: '#10B981',
    className: 'font-extrabold tracking-tight text-emerald-400 uppercase drop-shadow-[0_3px_8px_rgba(0,0,0,0.9)]',
    styleDescription: 'Discipline, financial habits, and growth',
  },
  {
    id: 'minimal-mono',
    name: 'Minimalist Terminal',
    previewText: '4:00 AM • THE STANDARD',
    color: '#E4E4E7',
    className: 'font-mono-studio font-bold tracking-[0.2em] text-zinc-200 uppercase',
    styleDescription: 'Clean documentary aesthetic with spaced tracking',
  },
];

const VIRAL_HOOK_TEMPLATES = [
  'Nobody is coming to save you.',
  'Rule #1: Never explain your goals.',
  'Your excuses are lying to you.',
  'In 6 months, you can be unrecognizable.',
  'Silence is your deadliest weapon.',
];

export const TextPane: React.FC<TextPaneProps> = ({
  onInsertText,
  onApplyPreset,
  onUpdateTitle,
  onUpdateHook,
  onUpdateQuote,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'blocks' | 'hooks'>('presets');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('impact-bold');
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);

  const triggerFeedback = (msg: string) => {
    setAppliedFeedback(msg);
    setTimeout(() => setAppliedFeedback(null), 2000);
  };

  const handleAddDefault = (type: 'heading' | 'subheading' | 'body') => {
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'text' }));
    if (type === 'heading') {
      const text = 'UNSTOPPABLE DISCIPLINE';
      if (onUpdateTitle) onUpdateTitle(text);
      if (onInsertText) onInsertText(text, 'heading');
      triggerFeedback('Heading updated!');
    } else if (type === 'subheading') {
      const text = 'Stop waiting for the perfect day.';
      if (onUpdateHook) onUpdateHook(text);
      if (onInsertText) onInsertText(text, 'subheading');
      triggerFeedback('Hook updated!');
    } else {
      const text = 'Work in silence. Let your compounding daily discipline make all the noise.';
      if (onUpdateQuote) onUpdateQuote(text);
      if (onInsertText) onInsertText(text, 'body');
      triggerFeedback('Monologue updated!');
    }
  };

  const handleApplyPreset = (preset: TextPreset) => {
    setSelectedPresetId(preset.id);
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'text' }));
    if (onApplyPreset) onApplyPreset(preset);
    triggerFeedback(`Applied "${preset.name}"!`);
  };

  const handleApplyHook = (hook: string) => {
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'text' }));
    if (onUpdateHook) onUpdateHook(hook);
    triggerFeedback('Hook applied!');
  };

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none overflow-hidden rounded-2xl border border-[#26262B]">
      {/* ── Top Header Bar (Matching Right Pane) ── */}
      <div className="relative px-3 py-2 bg-[#17171A] border-b border-[#26262B] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Type className="w-4 h-4 shrink-0 text-[#60A5FA]" />
          <span className="text-xs font-bold text-white truncate">
            Text &amp; Typography
          </span>
          <span className="text-[9px] font-mono-studio px-1.5 py-0.2 rounded bg-white/10 text-white/80 border border-white/15 shrink-0 uppercase font-bold">
            FONTS
          </span>
        </div>

        {appliedFeedback && (
          <span className="text-[10px] font-mono-studio px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            ✓ {appliedFeedback}
          </span>
        )}
      </div>

      {/* ── Subtabs Header Bar (Matching Right Pane) ── */}
      <div className="flex items-center gap-6 px-4 pt-2.5 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('presets')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'presets' ? 'text-white border-white' : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Preset Styles
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('blocks')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'blocks' ? 'text-white border-white' : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Text Blocks
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hooks')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'hooks' ? 'text-white border-white' : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Viral Hooks
        </button>
      </div>

      {/* ── Main Tab Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
        {activeTab === 'presets' && (
          <div className="flex flex-col gap-2.5">
            <label className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider block">
              Trending Reel Caption Fonts
            </label>

            <div className="grid grid-cols-1 gap-2.5">
              {MOTIVATIONAL_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'border-[#3B82F6] bg-[#3B82F6]/15 ring-1 ring-[#3B82F6]/40'
                        : 'border-[#2A2A30] bg-[#1C1C20] hover:border-[#3A3A42]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#A1A1AA]">{preset.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#60A5FA]" />}
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#121214] border border-[#26262B] text-center">
                      <span className={`text-sm ${preset.className}`}>{preset.previewText}</span>
                    </div>

                    <span className="text-[10px] text-[#71717A] leading-tight">
                      {preset.styleDescription}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'blocks' && (
          <div className="flex flex-col gap-2.5">
            <label className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider block">
              Insert Standard Text
            </label>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleAddDefault('heading')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-[#2A2A30] bg-[#1C1C20] hover:border-[#3B82F6]/50 transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#17171A] text-[#60A5FA] flex items-center justify-center font-bold text-xs border border-[#26262B]">
                    H1
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase">Add Cinematic Heading</p>
                    <p className="text-[10px] text-[#71717A]">Impact title for reel opening</p>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-[#71717A]" />
              </button>

              <button
                type="button"
                onClick={() => handleAddDefault('subheading')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-[#2A2A30] bg-[#1C1C20] hover:border-[#3B82F6]/50 transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#17171A] text-zinc-300 flex items-center justify-center font-bold text-xs border border-[#26262B]">
                    H2
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Add Subheading / Punchline</p>
                    <p className="text-[10px] text-[#71717A]">3–5 word secondary hook</p>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-[#71717A]" />
              </button>

              <button
                type="button"
                onClick={() => handleAddDefault('body')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-[#2A2A30] bg-[#1C1C20] hover:border-[#3B82F6]/50 transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#17171A] text-zinc-400 flex items-center justify-center text-xs border border-[#26262B]">
                    <AlignLeft className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Add Monologue Paragraph</p>
                    <p className="text-[10px] text-[#71717A]">Core motivational quote</p>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-[#71717A]" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'hooks' && (
          <div className="flex flex-col gap-2.5">
            <label className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider block">
              High Retention Opening Hooks
            </label>

            <div className="space-y-2">
              {VIRAL_HOOK_TEMPLATES.map((hook, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyHook(hook)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-[#2A2A30] bg-[#1C1C20] hover:border-[#3B82F6]/50 transition-all cursor-pointer text-left group"
                >
                  <span className="text-xs text-white group-hover:text-[#60A5FA] transition-colors font-medium">
                    "{hook}"
                  </span>
                  <Plus className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextPane;
