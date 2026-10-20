import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wand2,
  Sparkles,
  Plus,
  Cpu,
  Compass,
  FileText,
  Mic,
  Volume2,
  Radio,
  Sliders,
  Zap,
  Flame,
  Shield,
  Coins,
  Brain,
  RefreshCw,
  ArrowLeftRight,
  Hash,
  Gauge,
  Smartphone,
  Monitor,
  Square,
  Maximize2,
  AlertCircle,
  X,
} from 'lucide-react';
import { Button } from '@/src/shared/ui/common';
import { CustomSelect } from '@/src/shared/ui/CustomSelect';
import { VoiceProfile } from '../../types';
import { workspaceApi } from '../../api/workspaceApi';

export interface AIAgentCreatorPaneProps {
  agentPrompt: string;
  onPromptChange: (val: string) => void;
  category: string;
  onCategoryChange: (cat: string) => void;
  targetLength: string;
  onTargetLengthChange: (length: string) => void;
  aspectRatio?: '9:16' | '16:9' | '1:1' | '4:5' | '21:9';
  onAspectRatioChange?: (ratio: '9:16' | '16:9' | '1:1' | '4:5' | '21:9') => void;
  agentError?: string | null;
  onClearError?: () => void;
  selectedVoice?: string;
  onVoiceChange?: (voiceId: string) => void;
  voices?: VoiceProfile[];
  onTestVoice?: (voiceId: string) => void;
  testingVoiceId?: string | null;
  loadingAgent: boolean;
  onRunAgent: () => void;
  onSwitchToEditor?: () => void;
  onStartNewVideo?: () => void;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
}

export const ASPECT_RATIO_OPTIONS = [
  { value: '9:16', label: '9:16 Vertical (Shorts, Reels, TikTok)' },
  { value: '16:9', label: '16:9 Landscape (YouTube, Full HD)' },
  { value: '1:1', label: '1:1 Square (Instagram Feed & Posts)' },
  { value: '4:5', label: '4:5 Portrait (Instagram Feed Portrait)' },
  { value: '21:9', label: '21:9 Ultrawide (Cinematic Film)' },
];

const DEFAULT_FALLBACK_VOICES: VoiceProfile[] = [
  { id: 'Fenrir', name: 'Fenrir', gender: 'Male', style: 'Deep, Powerful, Stoic Leader', speed: '1.0x' },
  { id: 'Aura', name: 'Aura', gender: 'Female', style: 'Calm, Resilient, Inspiring', speed: '1.0x' },
  { id: 'Kratos', name: 'Kratos', gender: 'Male', style: 'Gravelly, Intense, Raw Power', speed: '1.0x' },
  { id: 'Nova', name: 'Nova', gender: 'Female', style: 'Direct, Energetic, Unapologetic', speed: '1.0x' },
  { id: 'Marcus', name: 'Marcus', gender: 'Male', style: 'Philosophical, Measured, Timeless', speed: '0.95x' },
  { id: 'Valkyrie', name: 'Valkyrie', gender: 'Female', style: 'Commanding, High Impact, Fierce', speed: '1.05x' },
];

const AI_MODELS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Ultra Fast 60fps)' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Deep Reasoning & Hooks)' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Standard)' },
];

const CATEGORY_OPTIONS = [
  { value: 'Nature & Stoic Solitude', label: '🌲 Nature & Stoic Solitude' },
  { value: 'Stoic Mindset & Discipline', label: '⛰️ Stoic Mindset & Mountain Peak' },
  { value: 'Deep Forest Flow & Silence', label: '🌿 Deep Forest Flow & Silence' },
  { value: 'Calm Waters & Inner Resilience', label: '🌊 Ocean Storm & Inner Resilience' },
  { value: 'Unstoppable Motivation', label: '⚡ Unstoppable Wild Motivation' },
  { value: 'Dark Psychology & Power', label: '🌑 Dark Psychology & Quiet Moves' },
  { value: 'High Finance & Wealth', label: '💎 High Finance & Generational Empire' },
];

const HOOK_FORMULAS = [
  {
    name: 'Curiosity Gap',
    template: 'Start with: "This 1 mindset habit changed everything, but 99% ignore it..."',
  },
  {
    name: 'Contrarian Truth',
    template: 'Start with: "Everything they told you about motivation is completely false..."',
  },
  {
    name: 'Direct Challenge',
    template: 'Start with: "If you cannot handle the cold truth, scroll away right now..."',
  },
  {
    name: 'Rule #1 Protocol',
    template: 'Start with: "Rule #1 of high performance: Never explain yourself..."',
  },
];

const PROMPT_INSPIRATION_SEEDS = [
  {
    title: 'The Solitary Mountain',
    tag: 'Mountain',
    icon: Shield,
    prompt: 'A gripping stoic reel on standing alone like an unmovable mountain peak while storms rage below. Let your silent discipline speak.',
  },
  {
    title: 'The Deep Forest',
    tag: 'Forest',
    icon: Flame,
    prompt: 'A deep reflection on quiet root growth, silence in the wilderness, and why giants grow in complete isolation.',
  },
  {
    title: 'Ocean Storm Breakers',
    tag: 'Ocean',
    icon: Brain,
    prompt: 'An intense motivational speech about relentless compounding grit: break through every obstacle like crashing ocean waves on granite cliffs.',
  },
  {
    title: 'Glacial Dawn Stillness',
    tag: 'Alpine',
    icon: Coins,
    prompt: 'A calming philosophical meditation on inner stillness and absolute focus like a mirror-clear alpine glacial lake at dawn.',
  },
];

export const AIAgentCreatorPane: React.FC<AIAgentCreatorPaneProps> = ({
  agentPrompt,
  onPromptChange,
  category,
  onCategoryChange,
  targetLength,
  onTargetLengthChange,
  aspectRatio = '9:16',
  onAspectRatioChange,
  agentError,
  onClearError,
  selectedVoice = 'Fenrir',
  onVoiceChange,
  voices = DEFAULT_FALLBACK_VOICES,
  onTestVoice,
  testingVoiceId,
  loadingAgent,
  onRunAgent,
  onSwitchToEditor,
  onStartNewVideo,
  selectedModel: propModel,
  onModelChange,
}) => {
  const [activeTab, setActiveTab] = useState<'prompt' | 'pacing' | 'voice' | 'seo'>('prompt');
  const [liveVoices, setLiveVoices] = useState<VoiceProfile[]>(voices.length > 0 ? voices : DEFAULT_FALLBACK_VOICES);
  const [speechPace, setSpeechPace] = useState<'0.9x' | '1.0x' | '1.15x' | '1.25x'>('1.0x');
  const [speechTone, setSpeechTone] = useState<'authoritative' | 'aggressive' | 'calm' | 'cinematic'>('authoritative');
  const [voicePitch, setVoicePitch] = useState<number>(0);
  const [targetPlatform, setTargetPlatform] = useState<'tiktok' | 'reels' | 'shorts'>('tiktok');

  // Sync or fetch voices from media library
  useEffect(() => {
    let isMounted = true;
    const fetchVoices = async () => {
      try {
        const data = await workspaceApi.getMediaLibrary();
        if (isMounted && data?.voiceProfiles?.length) {
          setLiveVoices(data.voiceProfiles);
        }
      } catch {}
    };
    if (!voices || voices.length === 0) {
      fetchVoices();
    } else {
      setLiveVoices(voices);
    }
    return () => {
      isMounted = false;
    };
  }, [voices]);

  const currentModel = propModel || 'gemini-2.5-flash';

  const enhancePrompt = (modifier: string) => {
    const base = agentPrompt.trim();
    if (!base) {
      onPromptChange(modifier);
    } else {
      onPromptChange(`${base} ${modifier}`);
    }
  };

  const getTrendingTags = () => {
    if (category.includes('Fitness')) return ['#gymmotivation', '#discipline', '#bodybuilding', '#mindset', '#workout'];
    if (category.includes('Finance') || category.includes('Wealth')) return ['#wealth', '#money', '#investing', '#success', '#grind'];
    if (category.includes('Dark')) return ['#darkpsychology', '#power', '#stoic', '#manipulation', '#machiavelli'];
    return ['#stoicism', '#discipline', '#marcusAurelius', '#selfimprovement', '#mindset'];
  };

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none overflow-hidden rounded-2xl border border-[#26262B]">
      {/* ── Top Bar: Active Mode Indicator & Switcher Dropdown ── */}
      <div className="relative h-11 px-3.5 bg-[#17171A] border-b border-[#26262B] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Wand2 className="w-4 h-4 shrink-0 text-[#60A5FA]" />
          <span className="text-xs font-bold text-white truncate">
            AI Script Studio
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {onStartNewVideo && (
            <button
              type="button"
              onClick={onStartNewVideo}
              className="h-7 px-2.5 rounded-md bg-[#222226] hover:bg-[#2C2C32] text-[11px] font-medium text-white transition-colors cursor-pointer border border-[#323238] flex items-center gap-1"
              title="Start a new script from scratch"
            >
              <Plus className="w-3.5 h-3.5 text-[#60A5FA]" />
              <span className="hidden sm:inline">New</span>
            </button>
          )}

          {/* Studio Mode Switcher Button */}
          {onSwitchToEditor && (
            <button
              type="button"
              onClick={onSwitchToEditor}
              className="h-7 flex items-center gap-1.5 px-2.5 rounded-md bg-[#26262B] hover:bg-[#303036] hover:border-[#42424A] text-[11px] font-semibold text-white transition-all cursor-pointer border border-[#36363D] shadow-xs group"
              title="Click to switch to Script Editor"
            >
              <Wand2 className="w-3.5 h-3.5 text-[#60A5FA]" />
              <span className="truncate">AI Prompt</span>
              <ArrowLeftRight className="w-3 h-3 text-[#A1A1AA] group-hover:text-white transition-colors" />
            </button>
          )}

        </div>
      </div>

      {/* ── Subtabs Header Bar ── */}
      <div className="flex items-center gap-4 sm:gap-5 px-3.5 pt-2 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar shrink-0 bg-[#141417]">
        <button
          type="button"
          onClick={() => setActiveTab('prompt')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'prompt'
              ? 'text-white border-white'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Prompt &amp; Concept
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pacing')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'pacing'
              ? 'text-white border-white'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Pacing &amp; Model
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('voice')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'voice'
              ? 'text-white border-white'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Voice Actor ({liveVoices.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 flex items-center gap-1 ${
            activeTab === 'seo'
              ? 'text-white border-white'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          <Hash className="w-3 h-3 text-[#60A5FA]" />
          Hashtags
        </button>
      </div>

      {/* ── Prominent Error Banner (Always Pinned) ── */}
      {agentError && (
        <div className="mx-3.5 mt-2.5 p-3.5 rounded-xl bg-red-950/90 border border-red-500/60 text-red-200 text-xs flex items-start gap-2.5 shadow-xl shadow-red-950/70 shrink-0 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-red-300 text-xs">Generation Error &mdash; Zero Fallbacks</p>
            <p className="text-[11px] text-red-200/90 mt-0.5 leading-relaxed break-words">{agentError}</p>
          </div>
          {onClearError && (
            <button
              type="button"
              onClick={onClearError}
              className="text-red-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer shrink-0"
              title="Dismiss error"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* ── Main Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">

        {/* ── Tab: SEO & Trending Hashtags ── */}
        {activeTab === 'seo' && (
          <div className="flex flex-col gap-3">
            <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-3.5 flex flex-col gap-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-[#60A5FA]" />
                Auto-Detected Viral Tags &amp; Topics
              </span>
              <p className="text-[11px] text-[#A1A1AA]">
                Optimized for YouTube Shorts and Instagram algorithmic distribution.
              </p>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {getTrendingTags().map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => enhancePrompt(`Tags to optimize for: ${tag}`)}
                    className="px-2.5 py-1 rounded-lg bg-[#141417] hover:bg-[#3B82F6] hover:text-white text-[#60A5FA] border border-[#2A2A30] text-xs font-mono transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Algorithm Preset */}
            <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-3.5 flex flex-col gap-2.5">
              <span className="text-xs font-bold text-white">Target Algorithm Style</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'tiktok', label: 'TikTok (Hyper Punchy)' },
                  { id: 'shorts', label: 'YouTube (High Retention)' },
                  { id: 'reels', label: 'Reels (Aesthetic Quote)' },
                ].map((plat) => (
                  <button
                    key={plat.id}
                    type="button"
                    onClick={() => setTargetPlatform(plat.id as any)}
                    className={`p-2 rounded-lg text-xs font-semibold border transition-all text-left ${
                      targetPlatform === plat.id
                        ? 'bg-[#1E2330] text-white border-[#3B82F6]'
                        : 'bg-[#141417] text-[#A1A1AA] border-[#2A2A30]'
                    }`}
                  >
                    {plat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 1: Prompt & Seeds ── */}
        {activeTab === 'prompt' && (
          <div className="flex flex-col gap-3">
            {/* Category Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-mono-studio text-[#71717A]">
                Niche &amp; Philosophy Category
              </label>
              <CustomSelect
                options={CATEGORY_OPTIONS}
                value={category}
                onChange={onCategoryChange}
                className="w-full text-xs"
              />
            </div>

            {/* Video Aspect Ratio Dropdown & Presets */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono-studio">
                <label className="uppercase text-[#71717A] flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-[#38BDF8]" />
                  Video Aspect Ratio (AI Video Target)
                </label>
                <span className="text-[#38BDF8] font-bold">
                  {aspectRatio === '9:16'
                    ? '9:16 • 1080×1920 (Shorts/Reels)'
                    : aspectRatio === '16:9'
                    ? '16:9 • 1920×1080 (YouTube/HD)'
                    : aspectRatio === '1:1'
                    ? '1:1 • 1080×1080 (Square Feed)'
                    : aspectRatio === '4:5'
                    ? '4:5 • 1080×1350 (IG Portrait)'
                    : '21:9 • 2560×1080 (Cinematic)'}
                </span>
              </div>
              <CustomSelect
                options={ASPECT_RATIO_OPTIONS}
                value={aspectRatio}
                onChange={(val) => onAspectRatioChange?.(val as '9:16' | '16:9' | '1:1' | '4:5' | '21:9')}
                className="w-full text-xs"
              />
              <div className="grid grid-cols-4 gap-1.5 mt-0.5">
                {[
                  { id: '9:16' as const, label: '9:16', desc: 'Shorts/TikTok', icon: Smartphone },
                  { id: '16:9' as const, label: '16:9', desc: 'Landscape', icon: Monitor },
                  { id: '1:1' as const, label: '1:1', desc: 'Square', icon: Square },
                  { id: '4:5' as const, label: '4:5', desc: 'Portrait', icon: Maximize2 },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = aspectRatio === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onAspectRatioChange?.(item.id)}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#1E293B] border-[#38BDF8] text-[#38BDF8] shadow-sm shadow-[#38BDF8]/20'
                          : 'bg-[#141417] border-[#2A2A30] text-[#71717A] hover:text-[#D4D4D8] hover:border-[#3A3A42]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 mb-1" />
                      <span className="text-[10px] font-bold leading-none">{item.label}</span>
                      <span className="text-[8px] opacity-70 mt-0.5">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prompt Textarea */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono-studio">
                <span className="text-[#71717A]">AI AGENT PROMPT</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">🌲 100% NATURE VIDEO DIRECTOR</span>
              </div>
              <textarea
                value={agentPrompt}
                onChange={(e) => onPromptChange(e.target.value)}
                placeholder="What core truth or motivational message should this reel deliver? (e.g., The power of silence and daily non-negotiable standards)..."
                rows={4}
                className="w-full bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-3 text-xs text-white placeholder:text-[#52525B] outline-none focus:border-[#3B82F6] transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* Hook Formulas */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-mono-studio text-[#71717A] uppercase">
                Hook Architecture Formulas
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {HOOK_FORMULAS.map((form) => (
                  <button
                    key={form.name}
                    type="button"
                    onClick={() => enhancePrompt(form.template)}
                    className="p-2 rounded-lg bg-[#141417] hover:bg-[#202026] border border-[#2A2A30] text-left text-[10px] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <p className="font-bold text-[#60A5FA]">{form.name}</p>
                    <p className="text-[9px] text-[#A1A1AA] truncate">{form.template}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Inspiration Seeds */}
            <div className="flex flex-col gap-2 pt-1">
              <span className="text-[10px] font-mono-studio text-[#71717A] uppercase">
                Instant Concept Seeds
              </span>
              <div className="grid grid-cols-2 gap-2">
                {PROMPT_INSPIRATION_SEEDS.map((seed, idx) => {
                  const Icon = seed.icon;
                  return (
                    <motion.button
                      key={idx}
                      type="button"
                      whileHover={{ scale: 1.025, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      onClick={() => {
                        onPromptChange(seed.prompt);
                        try {
                          confetti({ particleCount: 20, spread: 40, origin: { y: 0.6 } });
                        } catch {}
                      }}
                      className="p-2.5 rounded-xl border border-[#2A2A30] bg-[#1C1C20] hover:border-[#3A3A42] hover:bg-[#222228] transition-all text-left flex flex-col gap-1 cursor-pointer group"
                    >
                      <div className="flex items-center gap-1.5 text-[#60A5FA]">
                        <Icon className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold text-white group-hover:text-[#60A5FA] transition-colors truncate">
                          {seed.title}
                        </span>
                      </div>
                      <span className="text-[9px] text-[#A1A1AA] line-clamp-2">
                        {seed.prompt}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 2: Pacing & Model ── */}
        {activeTab === 'pacing' && (
          <div className="flex flex-col gap-3.5">
            {/* AI Model Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-mono-studio text-[#71717A]">
                Reasoning Engine
              </label>
              <CustomSelect
                options={AI_MODELS}
                value={currentModel}
                onChange={(val) => onModelChange?.(val)}
                className="w-full text-xs"
              />
            </div>

            {/* Video Aspect Ratio */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono-studio">
                <label className="uppercase text-[#71717A] flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-[#38BDF8]" />
                  Video Aspect Ratio
                </label>
                <span className="text-[#38BDF8] font-bold">{aspectRatio}</span>
              </div>
              <CustomSelect
                options={ASPECT_RATIO_OPTIONS}
                value={aspectRatio}
                onChange={(val) => onAspectRatioChange?.(val as '9:16' | '16:9' | '1:1' | '4:5' | '21:9')}
                className="w-full text-xs"
              />
            </div>

            {/* Target Duration */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-mono-studio text-[#71717A]">
                Target Video Duration
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['15s', '30s', '45s', '60s'].map((len) => (
                  <button
                    key={len}
                    type="button"
                    onClick={() => onTargetLengthChange(len)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      targetLength === len
                        ? 'bg-[#3B82F6] text-white border-[#3B82F6] shadow-md shadow-[#3B82F6]/20'
                        : 'bg-[#1C1C20] text-[#A1A1AA] border-[#2A2A30] hover:text-white'
                    }`}
                  >
                    {len}
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery Tone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-mono-studio text-[#71717A]">
                Narration Delivery Tone
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'authoritative', label: 'Authoritative & Heavy' },
                  { id: 'aggressive', label: 'Aggressive & Raw' },
                  { id: 'calm', label: 'Calm & Philosophical' },
                  { id: 'cinematic', label: 'Epic Trailer Narration' },
                ].map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => setSpeechTone(tone.id as any)}
                    className={`p-2.5 rounded-xl text-[11px] font-semibold border transition-all text-left ${
                      speechTone === tone.id
                        ? 'bg-[#1E2330] text-white border-[#3B82F6] ring-1 ring-[#3B82F6]/50'
                        : 'bg-[#1C1C20] text-[#A1A1AA] border-[#2A2A30] hover:text-white'
                    }`}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 3: AI Voice Actors ── */}
        {activeTab === 'voice' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              {liveVoices.map((v) => {
                const isSelected = selectedVoice === v.id || selectedVoice === v.name;
                const isTesting = testingVoiceId === v.id;

                return (
                  <div
                    key={v.id}
                    onClick={() => onVoiceChange?.(v.id || v.name)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#1E2330] border-[#3B82F6] ring-1 ring-[#3B82F6]/50'
                        : 'bg-[#1C1C20] border-[#2A2A30] hover:border-[#3A3A42] hover:bg-[#222228]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#3B82F6] text-white' : 'bg-[#2A2A32] text-[#60A5FA]'
                        }`}
                      >
                        <Mic className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">{v.name}</span>
                          <span className="text-[9px] font-mono-studio px-1 rounded bg-zinc-800 text-zinc-300">
                            {v.gender}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#A1A1AA] truncate">{v.style}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {onTestVoice && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTestVoice(v.id);
                          }}
                          className="p-1.5 rounded-lg bg-[#2A2A32] hover:bg-[#34343E] text-white transition-colors"
                          title="Audition voice"
                        >
                          <Volume2 className={`w-3.5 h-3.5 ${isTesting ? 'text-[#60A5FA] animate-pulse' : ''}`} />
                        </button>
                      )}
                      {isSelected && (
                        <div className="p-1 rounded-full bg-[#3B82F6] text-white">
                          <Zap className="w-3 h-3 fill-current" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Action Footer ── */}
      <div className="px-3 py-2.5 border-t border-[#26262B] bg-[#17171A] shrink-0">
        <Button
          size="sm"
          onClick={() => {
            try {
              confetti({
                particleCount: 45,
                spread: 60,
                origin: { y: 0.8 },
              });
            } catch {}
            onRunAgent();
          }}
          disabled={loadingAgent}
          className="w-full bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white font-bold rounded-lg shadow-lg shadow-[#3B82F6]/25 transition-all"
        >
          {loadingAgent ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Generating Script &amp; Directing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Viral Reel Script</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AIAgentCreatorPane;
