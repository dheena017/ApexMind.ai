import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ScrollableTabs, TabItem } from '@/src/shared/ui/ScrollableTabs';
import {
  Wand2,
  Sparkles,
  Plus,
  Cpu,
  Mic,
  Volume2,
  Sliders,
  Zap,
  Flame,
  Shield,
  Brain,
  RefreshCw,
  ArrowLeftRight,
  Gauge,
  Smartphone,
  Monitor,
  Square,
  AlertCircle,
  X,
  Check,
  Film,
  Music,
  Type,
  Share2,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/src/shared/ui/common';
import { CustomSelect } from '@/src/shared/ui/CustomSelect';
import { VoiceProfile } from '../../types';
import { workspaceApi } from '../../api/workspaceApi';
import { DEFAULT_SCRIPT_MODEL, DEFAULT_SCRIPT_MODEL_LABEL } from '@/src/shared/aiModels';
import { useAvailableScriptModels } from '@/src/shared/hooks/useAvailableScriptModels';

export interface AIAgentCreatorPaneProps {
  topic?: string;
  onTopicChange?: (val: string) => void;
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
  pipelineStage?: string;
  pipelinePercent?: number;
  pipelineLabel?: string;
  onRunAgent: () => void;
  tone?: string;
  onToneChange?: (tone: string) => void;
  onSwitchToEditor?: () => void;
  onStartNewVideo?: () => void;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
}

export const ASPECT_RATIO_OPTIONS = [
  { value: '9:16' as const, label: '9:16', desc: 'Shorts / Reels', res: '1080×1920', icon: Smartphone },
  { value: '16:9' as const, label: '16:9', desc: 'YouTube Landscape', res: '1920×1080', icon: Monitor },
  { value: '1:1' as const, label: '1:1', desc: 'Square Post', res: '1080×1080', icon: Square },
  { value: '4:5' as const, label: '4:5', desc: 'IG Portrait', res: '1080×1350', icon: Smartphone },
  { value: '21:9' as const, label: '21:9', desc: 'Cinematic Ultrawide', res: '2560×1080', icon: Monitor },
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

const DURATION_PRESETS = [
  { value: '15 seconds', label: '15s', badge: 'Fast Cut' },
  { value: '30 seconds', label: '30s', badge: 'Standard' },
  { value: '45 seconds', label: '45s', badge: 'Extended' },
  { value: '60 seconds', label: '60s', badge: 'Deep Dive' },
];

const DELIVERY_TONES = [
  { id: 'authoritative', label: 'Authoritative', desc: 'Heavy & Grounded', icon: Shield },
  { id: 'aggressive', label: 'Aggressive', desc: 'Raw & High Intensity', icon: Flame },
  { id: 'calm', label: 'Philosophical', desc: 'Calm & Measured', icon: Brain },
  { id: 'cinematic', label: 'Cinematic', desc: 'Epic Movie Trailer', icon: Sparkles },
] as const;


// Visual B-Roll Aesthetics
const VISUAL_AESTHETICS = [
  { id: 'dark_cinematic', label: 'Dark Cinematic', desc: 'High contrast, 35mm film grain, moody shadows', icon: Film },
  { id: 'epic_nature', label: 'Epic Drone Nature', desc: 'Mountain summits, misty pines, crashing oceans', icon: Compass },
  { id: 'classical_marble', label: 'Stoic Marble', desc: 'Ancient Greco-Roman sculptures, museum lighting', icon: Shield },
  { id: 'urban_noir', label: 'Urban Cyber Noir', desc: 'Reflective rain streets, neon glow, nocturnal pace', icon: Zap },
];

// Subtitle & Caption Presets
const SUBTITLE_PRESETS = [
  { id: 'hormozi', label: 'Hormozi Pop', desc: 'Bold uppercase • Yellow keyword highlight' },
  { id: 'clean', label: 'Clean Minimal', desc: 'Subtle white typography • Translucent pill' },
  { id: 'viral_punch', label: 'Viral Punch', desc: 'Dynamic scale bounce • Red power words' },
  { id: 'neon_glow', label: 'Neon Cyber', desc: 'Soft purple glow • Rounded modern font' },
];

// Background Music Moods
const MUSIC_MOODS = [
  { id: 'orchestral', label: 'Dark Orchestral', desc: 'Deep brass & cello swells', icon: Music },
  { id: 'phonk', label: 'Heavy Bass Drive', desc: 'High intensity motivation', icon: Flame },
  { id: 'piano', label: 'Reflective Piano', desc: 'Introspective, calm wisdom', icon: Brain },
  { id: 'ambient', label: 'Ambient Lo-Fi', desc: 'Subtle atmospheric focus', icon: Sparkles },
];

export const AIAgentCreatorPane: React.FC<AIAgentCreatorPaneProps> = ({
  topic = '',
  onTopicChange,
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
  voices = [],
  onTestVoice,
  testingVoiceId,
  loadingAgent,
  pipelineStage,
  pipelinePercent,
  pipelineLabel,
  onRunAgent,
  tone: propTone,
  onToneChange,
  onSwitchToEditor,
  onStartNewVideo,
  selectedModel: propModel,
  onModelChange,
}) => {
  const [activeTab, setActiveTab] = useState<'prompt' | 'style' | 'voice'>('prompt');
  const [liveVoices, setLiveVoices] = useState<VoiceProfile[]>(voices);
  const [selectedAesthetic, setSelectedAesthetic] = useState<string>('dark_cinematic');
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('hormozi');
  const [selectedMusicMood, setSelectedMusicMood] = useState<string>('orchestral');
  const [enabledPlatforms, setEnabledPlatforms] = useState<Record<string, boolean>>({
    youtube: true,
    instagram: true,
    facebook: true,
  });

  const speechTone = (propTone as any) || 'authoritative';
  const handleSelectTone = (newTone: string) => {
    onToneChange?.(newTone);
  };

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

  const currentModel = propModel || DEFAULT_SCRIPT_MODEL;
  const { models: scriptModels, defaultModel, loading: modelsLoading, error: modelsError } =
    useAvailableScriptModels();

  useEffect(() => {
    if (!scriptModels.length) return;
    if (!scriptModels.some((model) => model.value === currentModel)) {
      onModelChange?.(defaultModel);
    }
  }, [scriptModels, defaultModel, currentModel, onModelChange]);
  const activeCategoryShort = category ? category.split('&')[0].trim() : 'AI Video';

  const togglePlatform = (p: string) => {
    setEnabledPlatforms((prev) => ({ ...prev, [p]: !prev[p] }));
  };

  return (
    <div className="flex flex-col h-full bg-[#121215] text-[#E5E5E5] font-sans-studio select-none overflow-hidden rounded-none border-0">
      
      {/* ── Top Bar: Active Mode Indicator & Switcher ── */}
      <div className="relative h-11 px-3.5 bg-[#141418] border-b border-[#24242A] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Wand2 className="w-4 h-4 shrink-0 text-[#3B82F6]" />
          <span className="text-xs font-bold text-white tracking-tight truncate">
            AI Script Studio
          </span>
        </div>

        {/* Right Actions */}
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

          {/* Studio Mode Switcher Button */}
          {onSwitchToEditor && (
            <button
              type="button"
              onClick={onSwitchToEditor}
              className="h-7 flex items-center gap-1.5 px-2.5 rounded-lg bg-[#1E1E24] hover:bg-[#26262E] text-[11px] font-medium text-zinc-300 hover:text-white transition-all cursor-pointer border border-[#2A2A32] shadow-xs group"
              title="Click to switch to Script Editor"
            >
              <Wand2 className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span className="truncate">AI Prompt</span>
              <ArrowLeftRight className="w-3 h-3 text-zinc-500 group-hover:text-white transition-colors" />
            </button>
          )}
        </div>
      </div>

      {/* ── 3-Tab Segmented Control (UI/UX Upgrade with ScrollableTabs) ── */}
      <div className="p-2.5 bg-[#121215] border-b border-[#24242A] shrink-0">
        <ScrollableTabs
          tabs={[
            { id: 'prompt', label: 'Prompt', icon: Wand2 },
            { id: 'style', label: 'Style & Audio', icon: Film },
            { id: 'voice', label: 'Voice', icon: Mic, badge: liveVoices.length },
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab)}
          containerBgClassName="bg-[#18181C]"
        />
      </div>

      {/* ── Error Banner ── */}
      {agentError && (
        <div className="mx-3.5 mt-2.5 p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5 shadow-md shrink-0">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-red-300 text-xs">Generation Notice</p>
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

      {/* ── Main Scrollable Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-4">

        {/*
            TAB 1: PROMPT & CONCEPT
        */}
        {activeTab === 'prompt' && (
          <div className="space-y-4">
            {/* Topic Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono-studio">
                <span className="text-[#9CA3AF] font-semibold tracking-wider">TOPIC</span>
                <span className="text-zinc-500 text-[10px]">What should this video be about?</span>
              </div>

              <div className="relative">
                <textarea
                  value={topic}
                  onChange={(e) => onTopicChange?.(e.target.value)}
                  placeholder="Enter the core idea, message, or story for this video..."
                  rows={2}
                  className="w-full bg-[#16161A] border border-[#27272A] rounded-lg px-2.5 py-1.5 pr-7 text-xs text-white placeholder:text-[#52525B] outline-none focus:border-[#2563EB] transition-all resize-none leading-normal shadow-inner"
                />
                {topic.trim().length > 0 && onTopicChange && (
                  <button
                    type="button"
                    onClick={() => onTopicChange('')}
                    className="absolute top-1.5 right-1.5 p-1 rounded-md text-zinc-500 hover:text-white hover:bg-[#202026] transition-colors cursor-pointer"
                    title="Clear topic"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* User Prompt (What things does it need) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono-studio">
                <span className="text-[#9CA3AF] font-semibold tracking-wider">USER PROMPT</span>
                <span className="text-zinc-500 text-[10px]">What things does it need?</span>
              </div>

              <div className="relative">
                <textarea
                  value={agentPrompt}
                  onChange={(e) => onPromptChange(e.target.value)}
                  placeholder="Specify what things you need (e.g. key points, specific hook, quotes, scenes, or things to include/avoid)..."
                  rows={2}
                  className="w-full bg-[#16161A] border border-[#27272A] rounded-lg px-2.5 py-1.5 pr-7 text-xs text-white placeholder:text-[#52525B] outline-none focus:border-[#2563EB] transition-all resize-none leading-normal shadow-inner"
                />
                {agentPrompt.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => onPromptChange('')}
                    className="absolute top-1.5 right-1.5 p-1 rounded-md text-zinc-500 hover:text-white hover:bg-[#202026] transition-colors cursor-pointer"
                    title="Clear user prompt"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono-studio px-0.5">
                <span>Include specific instructions, talking points, or must-haves</span>
                <span>{agentPrompt.length} chars</span>
              </div>
            </div>

            {/* ── Pacing & Model Configuration Card (Creative Controls) ── */}
            <div className="bg-[#141418] border border-[#24242A] rounded-2xl p-3.5 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-[#24242A]">
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span className="text-xs font-bold text-white tracking-wide">Creative Controls</span>
                </div>
                <span className="text-[9px] font-mono-studio text-[#60A5FA] font-semibold bg-[#18181C] px-2 py-0.5 rounded-full border border-[#27272A]">
                  Ready
                </span>
              </div>

              {/* Aspect Ratio Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono-studio text-[#9CA3AF] flex items-center gap-1.5 font-semibold tracking-wide">
                  <Smartphone className="w-3 h-3 text-[#3B82F6]" />
                  <span>Format</span>
                </label>
                <CustomSelect
                  options={ASPECT_RATIO_OPTIONS.map((item) => ({
                    value: item.value,
                    label: item.label,
                    description: item.res,
                    badge: item.desc.split('/')[0].trim(),
                    icon: <item.icon className="w-3.5 h-3.5" />,
                  }))}
                  value={aspectRatio}
                  onChange={(val) => onAspectRatioChange?.(val as '9:16' | '16:9' | '1:1' | '4:5' | '21:9')}
                  className="w-full"
                  buttonClassName="bg-[#18181C] border-[#27272A] hover:border-[#60A5FA]/40"
                />
              </div>

              {/* Category / Niche Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono-studio text-[#9CA3AF] flex items-center gap-1.5 font-semibold tracking-wide">
                  <Compass className="w-3 h-3 text-[#3B82F6]" />
                  <span>Niche</span>
                </label>
                <CustomSelect
                  options={CATEGORY_OPTIONS}
                  value={category}
                  onChange={onCategoryChange}
                  className="w-full text-xs"
                  buttonClassName="bg-[#18181C] border-[#27272A] hover:border-[#60A5FA]/40"
                />
              </div>

              {/* AI Model Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono-studio text-[#9CA3AF] flex items-center gap-1.5 font-semibold tracking-wide">
                  <Cpu className="w-3 h-3 text-[#3B82F6]" />
                  <span>Model</span>
                </label>
                <CustomSelect
                  options={scriptModels}
                  value={scriptModels.some((model) => model.value === currentModel) ? currentModel : defaultModel}
                  onChange={(val) => onModelChange?.(val)}
                  disabled={modelsLoading || scriptModels.length === 0}
                  className="w-full text-xs"
                  buttonClassName="bg-[#18181C] border-[#27272A] hover:border-[#60A5FA]/40"
                />
                {!modelsLoading && !modelsError && scriptModels.length > 0 && !currentModel && (
                  <p className="mt-1 text-[10px] text-[#737373]">Default: {defaultModel || DEFAULT_SCRIPT_MODEL_LABEL}</p>
                )}
                {modelsLoading && <p className="mt-1 text-[10px] text-[#737373]">Loading models from Google…</p>}
                {modelsError && <p role="alert" className="mt-1 text-[10px] text-red-400">{modelsError}</p>}
              </div>

              {/* Target Duration */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono-studio text-[#9CA3AF] flex items-center gap-1.5 font-semibold tracking-wide">
                  <Gauge className="w-3 h-3 text-[#3B82F6]" />
                  <span>Length</span>
                </label>
                <CustomSelect
                  options={DURATION_PRESETS.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                    description: opt.badge,
                    badge: opt.badge,
                  }))}
                  value={
                    DURATION_PRESETS.find((opt) =>
                      targetLength === opt.value ||
                      targetLength === opt.label ||
                      targetLength.toLowerCase().includes(opt.label.toLowerCase().replace('s', ''))
                    )?.value ?? '30 seconds'
                  }
                  onChange={(val) => onTargetLengthChange(val)}
                  className="w-full"
                  buttonClassName="bg-[#18181C] border-[#27272A] hover:border-[#60A5FA]/40"
                />
              </div>

              {/* Delivery Tone */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono-studio text-[#9CA3AF] flex items-center gap-1.5 font-semibold tracking-wide">
                  <Volume2 className="w-3 h-3 text-[#3B82F6]" />
                  <span>Tone</span>
                </label>
                <CustomSelect
                  options={DELIVERY_TONES.map((tone) => ({
                    value: tone.id,
                    label: tone.label,
                    description: tone.desc,
                    icon: <tone.icon className="w-3.5 h-3.5" />,
                  }))}
                  value={speechTone}
                  onChange={(val) => handleSelectTone(val)}
                  className="w-full"
                  buttonClassName="bg-[#18181C] border-[#27272A] hover:border-[#60A5FA]/40"
                />
              </div>
            </div>
          </div>
        )}

        {/*
            TAB 2: STYLE & AUDIO (NEW CREATIVE PRODUCTION HUB)
        */}
        {activeTab === 'style' && (
          <div className="space-y-4">
            
            {/* Visual Cinematic B-Roll Aesthetic */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono-studio text-[#9CA3AF]">
                <span className="font-semibold uppercase flex items-center gap-1.5">
                  <Film className="w-3 h-3 text-[#3B82F6]" />
                  <span>Visual Style</span>
                </span>
                <span className="text-zinc-500">Auto-match</span>
              </div>
              <CustomSelect
                options={VISUAL_AESTHETICS.map((item) => ({
                  value: item.id,
                  label: item.label,
                  description: item.desc,
                  icon: <item.icon className="w-3.5 h-3.5" />,
                }))}
                value={selectedAesthetic}
                onChange={(value) => setSelectedAesthetic(value)}
                variant="compact"
                className="w-full"
                buttonClassName="w-full h-[44px] bg-[#18181C] border-[#27272A] hover:border-[#60A5FA]/40"
                menuClassName="max-w-[320px]"
              />
            </div>

            {/* Kinetic Subtitles / Captions Preset */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono-studio text-[#9CA3AF]">
                <span className="font-semibold uppercase flex items-center gap-1.5">
                  <Type className="w-3 h-3 text-[#3B82F6]" />
                  <span>Subtitle Style</span>
                </span>
                <span className="text-[#60A5FA] font-semibold">High retention</span>
              </div>
              <CustomSelect
                options={SUBTITLE_PRESETS.map((sub) => ({
                  value: sub.id,
                  label: sub.label,
                  description: sub.desc,
                }))}
                value={selectedSubtitle}
                onChange={(value) => setSelectedSubtitle(value)}
                variant="compact"
                className="w-full"
                buttonClassName="w-full h-[44px] bg-[#18181C] border-[#27272A] hover:border-[#60A5FA]/40"
                menuClassName="max-w-[320px]"
              />
            </div>

            {/* Music Mood & Soundscape */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono-studio text-[#9CA3AF]">
                <span className="font-semibold uppercase flex items-center gap-1.5">
                  <Music className="w-3 h-3 text-[#3B82F6]" />
                  <span>Music</span>
                </span>
                <span className="text-zinc-500">Auto mix</span>
              </div>
              <CustomSelect
                options={MUSIC_MOODS.map((mood) => ({
                  value: mood.id,
                  label: mood.label,
                  description: mood.desc,
                  icon: <mood.icon className="w-3.5 h-3.5" />,
                }))}
                value={selectedMusicMood}
                onChange={(value) => setSelectedMusicMood(value)}
                variant="compact"
                className="w-full"
                buttonClassName="w-full h-[44px] bg-[#18181C] border-[#27272A] hover:border-[#60A5FA]/40"
                menuClassName="max-w-[320px]"
              />
            </div>

            {/* Target Syndication Platforms */}
            <div className="space-y-2.5 border-t border-[#24242A] pt-3">
              <div className="text-[10px] font-mono-studio text-[#9CA3AF]">
                <span className="font-semibold uppercase flex items-center gap-1.5">
                  <Share2 className="w-3 h-3 text-[#3B82F6]" />
                  <span>Publishing</span>
                </span>
              </div>
              <p className="text-[11px] text-[#8E8E93] leading-relaxed">
                Choose channels to prepare for publishing.
              </p>
              <div className="space-y-1.5">
                {[
                  { id: 'youtube', label: 'YouTube Shorts' },
                  { id: 'instagram', label: 'Instagram Reels' },
                  { id: 'facebook', label: 'Facebook Reels' },
                ].map((item) => {
                  const active = enabledPlatforms[item.id];
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => togglePlatform(item.id)}
                      aria-pressed={active}
                      className={`w-full min-h-10 px-3 rounded-lg border text-[11px] font-medium flex items-center justify-between transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/60 ${
                        active
                          ? 'bg-[#1A2234] border-[#3B82F6]/50 text-white'
                          : 'bg-[#18181C] border-[#24242A] text-[#A1A1AA] hover:text-white hover:bg-[#1A2234]/60 hover:border-[#3B82F6]/40'
                      }`}
                    >
                      <span>{item.label}</span>
                      {active ? (
                        <CheckCircle2 className="w-4 h-4 text-[#60A5FA]" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-[#52525B]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/*
            TAB 3: VOICE PERSONA
        */}
        {activeTab === 'voice' && (
          <div className="space-y-2.5">
            <div className="text-[11px] text-[#9CA3AF] px-0.5">
              Choose a narrator and preview the voice before generating.
            </div>
            <div className="space-y-2">
              {liveVoices.map((v) => {
                const isSelected = selectedVoice === v.id || selectedVoice === v.name;
                const isTesting = testingVoiceId === v.id;

                return (
                  <div
                    key={v.id}
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-colors ${
                      isSelected
                        ? 'bg-[#1A2234] border-[#3B82F6]/50'
                        : 'bg-[#18181C] border-[#24242A] hover:border-[#383842] hover:bg-[#202026]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onVoiceChange?.(v.id || v.name)}
                      aria-pressed={isSelected}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/70"
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-[#2563EB]/25 text-[#93C5FD]' : 'bg-[#141418] text-zinc-400 border border-[#24242A]'
                        }`}
                      >
                        <Mic className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">{v.name}</span>
                          <span className="text-[9px] font-mono-studio px-1.5 py-0.2 rounded bg-[#24242A] text-zinc-300">
                            {v.gender}
                          </span>
                        </div>
                        <p className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-[#C4D8FF]' : 'text-zinc-400'}`}>{v.style}</p>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 shrink-0 text-[#60A5FA]" />
                      )}
                    </button>
                    {onTestVoice && (
                      <button
                        type="button"
                        onClick={() => onTestVoice(v.id)}
                        aria-label={`${isTesting ? 'Stop preview of' : 'Preview'} ${v.name} voice`}
                        title={`${isTesting ? 'Stop preview' : 'Preview'} ${v.name}`}
                        className={`w-9 h-9 shrink-0 rounded-lg border flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/70 ${
                          isTesting
                            ? 'bg-[#2563EB] text-white border-[#60A5FA]/50'
                            : 'bg-[#18181C] hover:bg-[#202026] text-zinc-300 hover:text-white border-[#27272A]'
                        }`}
                      >
                        <Volume2 className={`w-4 h-4 ${isTesting ? 'animate-pulse' : ''}`} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Action Footer ── */}
      <div className="px-3.5 py-2.5 border-t border-[#24242A] bg-[#141418] shrink-0 flex flex-col gap-1.5">
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
          className="w-full h-10 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-bold rounded-xl shadow-md active:scale-[0.99] transition-all py-2 text-xs flex items-center justify-center gap-2 cursor-pointer border border-[#60A5FA]/40"
        >
          {loadingAgent ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{pipelineLabel || 'Generating Script & Directing...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Viral Reel Script &amp; Direct</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AIAgentCreatorPane;
