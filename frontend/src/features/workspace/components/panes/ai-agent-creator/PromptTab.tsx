/**
 * frontend/src/features/workspace/components/panes/ai-agent-creator/PromptTab.tsx
 */

import React from 'react';
import { Sparkles, Brain, Smartphone, Monitor, Square } from 'lucide-react';
import { CustomSelect } from '@/src/shared/ui/CustomSelect';
import { DurationSelector } from './components/DurationSelector';
import { ModelSelector } from './components/ModelSelector';
import { GenerationProfileSelector } from './components/GenerationProfileSelector';
import { GenerationProfile } from '../../../types/script';

export const ASPECT_RATIO_OPTIONS = [
  { value: '9:16' as const, label: '9:16', desc: 'Shorts / Reels', res: '1080×1920', icon: Smartphone },
  { value: '16:9' as const, label: '16:9', desc: 'YouTube Landscape', res: '1920×1080', icon: Monitor },
  { value: '1:1' as const, label: '1:1', desc: 'Square Post', res: '1080×1080', icon: Square },
  { value: '4:5' as const, label: '4:5', desc: 'IG Portrait', res: '1080×1350', icon: Smartphone },
  { value: '21:9' as const, label: '21:9', desc: 'Cinematic Ultrawide', res: '2560×1080', icon: Monitor },
];

export const CATEGORY_OPTIONS = [
  { value: 'Nature & Stoic Solitude', label: '🌲 Nature & Stoic Solitude' },
  { value: 'Stoic Mindset & Discipline', label: '⛰️ Stoic Mindset & Mountain Peak' },
  { value: 'Deep Forest Flow & Silence', label: '🌿 Deep Forest Flow & Silence' },
  { value: 'Calm Waters & Inner Resilience', label: '🌊 Ocean Storm & Inner Resilience' },
  { value: 'Unstoppable Motivation', label: '⚡ Unstoppable Wild Motivation' },
  { value: 'Dark Psychology & Power', label: '🌑 Dark Psychology & Quiet Moves' },
  { value: 'High Finance & Wealth', label: '💎 High Finance & Generational Empire' },
];

export const PROMPT_IDEAS = [
  'A quiet autumn suburban town where an unusual object appears in the sky.',
  'Marcus Aurelius on conquering morning weakness before anyone wakes up.',
  'Why discipline will always defeat fleeting bursts of motivation.',
  'The ruthless psychology of staying calm when everyone around you panics.',
];

interface PromptTabProps {
  prompt: string;
  onPromptChange: (val: string) => void;
  category: string;
  onCategoryChange: (val: string) => void;
  targetLength: string;
  onTargetLengthChange: (val: string) => void;
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5' | '21:9';
  onAspectRatioChange: (val: '9:16' | '16:9' | '1:1' | '4:5' | '21:9') => void;
  selectedModel?: string;
  onModelChange?: (val: string) => void;
  generationProfile: GenerationProfile;
  onGenerationProfileChange: (profile: GenerationProfile) => void;
}

export const PromptTab: React.FC<PromptTabProps> = ({
  prompt,
  onPromptChange,
  category,
  onCategoryChange,
  targetLength,
  onTargetLengthChange,
  aspectRatio,
  onAspectRatioChange,
  selectedModel,
  onModelChange,
  generationProfile,
  onGenerationProfileChange,
}) => {
  return (
    <div className="space-y-4">
      {/* ── Generation Profile Switcher ── */}
      <div>
        <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5 block">
          Generation Profile
        </label>
        <GenerationProfileSelector
          value={generationProfile}
          onChange={onGenerationProfileChange}
        />
      </div>

      {/* ── Topic / Creative Direction ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
            Story Idea / Creative Direction
          </label>
          <span className="text-[10px] text-zinc-500 font-mono">{prompt.length}/4000</span>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder={
            generationProfile === 'cinematic_3d_story'
              ? 'Describe your story: e.g. An unusual object appears in the sky above a quiet suburban town. A dog notices it before anyone else.'
              : 'Enter a creative prompt, topic, or narrative direction...'
          }
          rows={3}
          maxLength={4000}
          className="w-full px-3 py-2.5 rounded-xl bg-[#141417] border border-[#27272A] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] text-xs text-white placeholder-zinc-500 resize-none outline-none transition-all"
        />

        {/* Quick prompt ideas */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PROMPT_IDEAS.map((idea, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onPromptChange(idea)}
              className="text-[10px] px-2 py-1 rounded-md bg-[#18181C] hover:bg-[#222228] border border-[#27272A] hover:border-[#3B82F6]/50 text-zinc-400 hover:text-white transition-all cursor-pointer truncate max-w-full"
            >
              💡 {idea}
            </button>
          ))}
        </div>
      </div>

      {/* ── Theme Category ── */}
      <div>
        <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5 block">
          Theme &amp; Category
        </label>
        <CustomSelect
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={onCategoryChange}
          variant="compact"
          className="w-full"
        />
      </div>

      {/* ── Duration Presets ── */}
      <div>
        <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5 block">
          Target Video Duration
        </label>
        <DurationSelector value={targetLength} onChange={onTargetLengthChange} />
      </div>

      {/* ── Aspect Ratio ── */}
      <div>
        <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5 block">
          Aspect Ratio
        </label>
        <div className="grid grid-cols-5 gap-1.5">
          {ASPECT_RATIO_OPTIONS.map((opt) => {
            const isSelected = aspectRatio === opt.value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onAspectRatioChange(opt.value)}
                className={`py-2 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#3B82F6] bg-[#3B82F6]/15 text-white font-bold'
                    : 'border-[#27272A] bg-[#141417] text-zinc-400 hover:border-[#3F3F46] hover:text-zinc-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 mx-auto mb-1 ${isSelected ? 'text-[#3B82F6]' : 'text-zinc-500'}`} />
                <div className="text-[11px]">{opt.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── AI Model ── */}
      <div>
        <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
          <Brain className="w-3.5 h-3.5 text-[#3B82F6]" />
          Gemini Generation Model
        </label>
        <ModelSelector value={selectedModel} onChange={onModelChange} />
      </div>
    </div>
  );
};

