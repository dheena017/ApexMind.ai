import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Type,
  Heading1,
  Heading2,
  AlignLeft,
  Sparkles,
  Palette,
  Check,
  Plus,
  Zap,
  Flame,
  Award,
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
      triggerFeedback('Heading title updated!');
    } else if (type === 'subheading') {
      const text = 'Stop waiting for the perfect day.';
      if (onUpdateHook) onUpdateHook(text);
      if (onInsertText) onInsertText(text, 'subheading');
      triggerFeedback('Subheading hook updated!');
    } else {
      const text = 'Work in silence. Let your compounding daily discipline make all the noise.';
      if (onUpdateQuote) onUpdateQuote(text);
      if (onInsertText) onInsertText(text, 'body');
      triggerFeedback('Body quote updated!');
    }
  };

  const handleApplyPreset = (preset: TextPreset) => {
    setSelectedPresetId(preset.id);
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'text' }));
    if (onApplyPreset) onApplyPreset(preset);
    triggerFeedback(`Applied "${preset.name}" style!`);
  };

  const handleApplyHook = (hook: string) => {
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'text' }));
    if (onUpdateHook) onUpdateHook(hook);
    triggerFeedback('Hook updated in script!');
  };

  return (
    <div className="flex flex-col font-sans-studio text-[#E5E5E5] space-y-4">
      {/* ── Top Header Bar ────────────────────────────────────────────── */}
      <div className="flex w-full items-center justify-between gap-2 rounded-xl border border-[#2F2F2F] bg-[#121212]/90 px-3 py-2.5 shadow-[0_1px_0_rgba(255,255,255,0.02)] backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/30">
            <Type className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Text & Typography</h2>
            <p className="text-[10px] text-[#9CA3AF]">motion/react • Dynamic Typography Engine</p>
          </div>
        </div>

        {appliedFeedback && (
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-[10px] font-mono-studio px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
          >
            ✓ {appliedFeedback}
          </motion.span>
        )}
      </div>

      {/* ── Standard Text Block Inserters ─────────────────────────────── */}
      <div className="space-y-2">
        <span className="text-[10px] font-extrabold text-[#9CA3AF] uppercase tracking-wider block px-1">
          Add Standard Text Box
        </span>
        <div className="space-y-2">
          {/* Add Heading */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="button"
            onClick={() => handleAddDefault('heading')}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-[#262626] bg-[#141414] hover:bg-[#181818] hover:border-[#3B82F6]/60 transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#1F1F1F] text-[#60A5FA] flex items-center justify-center font-bold text-xs">
                H1
              </div>
              <div>
                <p className="text-sm font-black text-white group-hover:text-[#60A5FA] transition-colors uppercase">
                  Add a Cinematic Heading
                </p>
                <p className="text-[10px] text-[#71717A]">Impact title for reel opening</p>
              </div>
            </div>
            <Plus className="w-4 h-4 text-[#71717A] group-hover:text-white transition-colors" />
          </motion.button>

          {/* Add Subheading */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="button"
            onClick={() => handleAddDefault('subheading')}
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-[#262626] bg-[#141414] hover:bg-[#181818] hover:border-[#3B82F6]/60 transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#1F1F1F] text-zinc-300 flex items-center justify-center font-bold text-xs">
                H2
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-[#60A5FA] transition-colors">
                  Add Subheading / Punchline
                </p>
                <p className="text-[10px] text-[#71717A]">3-5 word secondary hook</p>
              </div>
            </div>
            <Plus className="w-4 h-4 text-[#71717A] group-hover:text-white transition-colors" />
          </motion.button>

          {/* Add Body Monologue */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="button"
            onClick={() => handleAddDefault('body')}
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-[#262626] bg-[#141414] hover:bg-[#181818] hover:border-[#3B82F6]/60 transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#1F1F1F] text-zinc-400 flex items-center justify-center text-xs">
                <AlignLeft className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white group-hover:text-[#60A5FA] transition-colors">
                  Add Monologue Quote Paragraph
                </p>
                <p className="text-[10px] text-[#71717A]">Motivational speech body</p>
              </div>
            </div>
            <Plus className="w-4 h-4 text-[#71717A] group-hover:text-white transition-colors" />
          </motion.button>
        </div>
      </div>

      {/* ── Viral Preset Text Styles ─────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-extrabold text-[#9CA3AF] uppercase tracking-wider block">
            Viral Typography Presets
          </span>
          <span className="text-[10px] text-[#60A5FA] font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> 6 Styles
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {MOTIVATIONAL_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <motion.div
                key={preset.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleApplyPreset(preset)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'border-[#3B82F6] bg-[#3B82F6]/10 ring-1 ring-[#3B82F6]/40'
                    : 'border-[#262626] bg-[#141414] hover:border-[#404040] hover:bg-[#181818]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: preset.color }}
                    />
                    {preset.name}
                  </span>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-[#3B82F6] text-white flex items-center justify-center text-[10px]">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>

                {/* Live Preview Display */}
                <div className="p-2.5 rounded-lg bg-[#0A0A0A] border border-[#222222] text-center overflow-hidden">
                  <p className={`text-sm ${preset.className}`}>
                    {preset.previewText}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#71717A]">
                  <span>{preset.styleDescription}</span>
                  <span className="text-[#60A5FA] font-semibold">Apply to Video Canvas →</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Quick Viral Hooks ────────────────────────────────────────── */}
      <div className="space-y-2">
        <span className="text-[10px] font-extrabold text-[#9CA3AF] uppercase tracking-wider block px-1">
          Instant Viral Opening Hooks
        </span>
        <div className="space-y-1.5">
          {VIRAL_HOOK_TEMPLATES.map((hook, i) => (
            <motion.button
              key={i}
              whileHover={{ x: 2 }}
              type="button"
              onClick={() => handleApplyHook(hook)}
              className="w-full p-2 rounded-lg border border-[#262626] bg-[#101010] hover:bg-[#1C1C1C] hover:border-[#3B82F6]/50 text-left text-[11px] text-[#D4D4D8] hover:text-white transition-all cursor-pointer flex items-center justify-between"
            >
              <span className="truncate">"{hook}"</span>
              <span className="text-[9px] font-mono-studio text-[#60A5FA] shrink-0 ml-2">Use</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};
