import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  ArrowRight,
  Flame,
  Check,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/src/shared/ui/common';
import { TrendingPromptIdea } from '../types';
import { buildRouteUrl } from '@/src/app/routes';

interface QuickPromptSparkProps {
  categories: string[];
  trendingPrompts: TrendingPromptIdea[];
  onNavigate: (page: string) => void;
}

export const QuickPromptSpark: React.FC<QuickPromptSparkProps> = ({
  categories,
  trendingPrompts,
  onNavigate,
}) => {
  const [selectedPrompt, setSelectedPrompt] = useState<TrendingPromptIdea | null>(
    trendingPrompts.length > 0 ? trendingPrompts[0] : null
  );
  const [customTopic, setCustomTopic] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(
    categories[0] || 'Stoic Mindset & Discipline'
  );

  const handleLaunch = () => {
    const topicToUse = customTopic.trim() || selectedPrompt?.topic || 'Stoic morning discipline and relentless execution';
    const categoryToUse = selectedPrompt?.category || selectedCategory;

    // Save prompt to session storage so Workspace can pick it up immediately
    try {
      sessionStorage.setItem('apexmind_initial_prompt_topic', topicToUse);
      sessionStorage.setItem('apexmind_initial_prompt_category', categoryToUse);
      if (selectedPrompt?.hook) {
        sessionStorage.setItem('apexmind_initial_prompt_hook', selectedPrompt.hook);
      }
    } catch (e) {
      // Storage unavailable fallback
    }

    // Navigate directly to Workspace Studio Prompt Creator with deep-linked topic & category
    onNavigate(buildRouteUrl('workspace-prompt', { topic: topicToUse, category: categoryToUse }));
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-[#141414] border border-[#2B2B2B] p-5 sm:p-6 shadow-xl relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-extrabold text-white tracking-tight">
              AI Idea Spark & Quick Studio Launcher
            </h2>
          </div>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Pick a trending concept or type your custom theme to jump straight into the AI script generation engine.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Wand2 className="w-4 h-4" />}
          onClick={handleLaunch}
          className="shadow-md shadow-[#3B82F6]/20 font-bold shrink-0"
        >
          Generate in Studio
        </Button>
      </div>

      {/* Trending Topic Selector Chips */}
      <div className="space-y-3">
        <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider block">
          Viral Trending Angles (Click to select)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {trendingPrompts.slice(0, 3).map((prompt) => {
            const isSelected = selectedPrompt?.id === prompt.id && !customTopic.trim();
            return (
              <button
                key={prompt.id}
                type="button"
                onClick={() => {
                  setSelectedPrompt(prompt);
                  setSelectedCategory(prompt.category);
                  setCustomTopic('');
                }}
                className={`text-left p-3 rounded-xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-[#1D2E4D] border-[#3B82F6] text-white shadow-md'
                    : 'bg-[#181818] border-[#2A2A2A] text-[#B0B0B0] hover:text-white hover:bg-[#1E1E1E] hover:border-[#383838]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-bold text-[#60A5FA] uppercase tracking-wider">
                    {prompt.category}
                  </span>
                  <span className="text-[10px] text-[#737373]">{prompt.estimatedDuration}</span>
                </div>
                <div className="text-xs font-bold text-white line-clamp-1">{prompt.title}</div>
                <div className="text-[11px] text-[#9CA3AF] line-clamp-2 mt-1 italic">
                  "{prompt.hook}"
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Theme Input */}
      <div className="mt-4 pt-4 border-t border-[#242424] flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={customTopic}
            onChange={(e) => {
              setCustomTopic(e.target.value);
              if (selectedPrompt) setSelectedPrompt(null);
            }}
            placeholder="Or type a custom topic: e.g. How to stay calm when everything is falling apart..."
            className="w-full bg-[#111111] border border-[#2B2B2B] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30 text-white placeholder-[#5A5A5A] text-xs sm:text-sm rounded-xl px-4 py-2.5 outline-none transition-all"
          />
        </div>

        <button
          type="button"
          onClick={handleLaunch}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95 shrink-0"
        >
          <span>Launch AI Studio</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
