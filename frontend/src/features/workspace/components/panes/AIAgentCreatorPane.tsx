import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
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
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Director
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

      {/* ── 3-Tab Segmented Control (UI/UX Upgrade) ── */}
      <div className="p-2.5 bg-[#121215] border-b border-[#24242A] shrink-0">
        <div className="grid grid-cols-3 gap-1 p-1 bg-[#18181C] rounded-xl border border-[#24242A]">
          <button
            type="button"
            onClick={() => setActiveTab('prompt')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none min-w-0 ${
              activeTab === 'prompt'
                ? 'bg-[#2563EB] text-white shadow-xs border border-[#60A5FA]/40 font-bold'
                : 'text-[#9CA3AF] hover:text-white hover:bg-[#202026] border border-transparent'
            }`}
          >
            <Wand2 className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'prompt' ? 'text-white' : 'text-zinc-500'}`} />
            <span className="truncate">Prompt</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('style')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none min-w-0 ${
              activeTab === 'style'
                ? 'bg-[#2563EB] text-white shadow-xs border border-[#60A5FA]/40 font-bold'
                : 'text-[#9CA3AF] hover:text-white hover:bg-[#202026] border border-transparent'
            }`}
          >
            <Film className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'style' ? 'text-white' : 'text-zinc-500'}`} />
            <span className="truncate">Style &amp; Audio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none min-w-0 ${
              activeTab === 'voice'
                ? 'bg-[#2563EB] text-white shadow-xs border border-[#60A5FA]/40 font-bold'
                : 'text-[#9CA3AF] hover:text-white hover:bg-[#202026] border border-transparent'
            }`}
          >
            <Mic className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'voice' ? 'text-white' : 'text-zinc-500'}`} />
            <span className="truncate">Voice</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono shrink-0 transition-colors ${
                activeTab === 'voice'
                  ? 'bg-white/20 text-white font-bold'
                  : 'bg-[#24242A] text-zinc-400'
              }`}
            >
              {liveVoices.length}
            </span>
          </button>
        </div>
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
            
            {/* Aspect Ratio Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono-studio">
                <label className="uppercase text-[#9CA3AF] flex items-center gap-1.5 font-semibold">
                  <Smartphone className="w-3 h-3 text-[#3B82F6]" />
                  <span>Video Aspect Ratio</span>
                </label>
                <span className="text-[#3B82F6] font-semibold">
                  {aspectRatio === '9:16'
                    ? '9:16 • 1080×1920 (Vertical)'
                    : aspectRatio === '16:9'
                    ? '16:9 • 1920×1080 (Landscape)'
                    : aspectRatio === '1:1'
                    ? '1:1 • 1080×1080 (Square)'
                    : aspectRatio === '4:5'
                    ? '4:5 • 1080×1350 (Portrait)'
                    : '21:9 • 2560×1080 (Cinematic)'}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {ASPECT_RATIO_OPTIONS.map((item) => {
                  const Icon = item.icon;
                  const isSelected = aspectRatio === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => onAspectRatioChange?.(item.value)}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#2563EB] border-[#60A5FA]/40 text-white shadow-xs font-bold'
                          : 'bg-[#18181C] border-[#24242A] text-zinc-400 hover:text-white hover:bg-[#202026] hover:border-[#383842]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 mb-1" />
                      <span className="text-[10px] font-bold leading-none">{item.label}</span>
                      <span className={`text-[8.5px] mt-0.5 truncate w-full text-center ${isSelected ? 'text-blue-100 font-medium' : 'text-zinc-500'}`}>
                        {item.desc.split('/')[0].trim()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category / Niche Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono-studio text-[#9CA3AF] tracking-wider font-semibold">
                Niche &amp; Philosophy Category
              </label>
              <CustomSelect
                options={CATEGORY_OPTIONS}
                value={category}
                onChange={onCategoryChange}
                className="w-full text-xs"
              />
            </div>

            {/* Prompt Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono-studio">
                <span className="text-[#9CA3AF] font-semibold tracking-wider">AI AGENT PROMPT</span>
                <span className="text-zinc-500 text-[10px]">Describe your video topic or concept</span>
              </div>

              <div className="relative">
                <textarea
                  value={agentPrompt}
                  onChange={(e) => onPromptChange(e.target.value)}
                  placeholder="Enter the core topic, message, or concept for this video..."
                  rows={4}
                  className="w-full bg-[#16161A] border border-[#27272A] rounded-xl p-3 text-xs text-white placeholder:text-[#52525B] outline-none focus:border-[#2563EB] transition-all resize-none leading-relaxed shadow-inner"
                />
                {agentPrompt.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => onPromptChange('')}
                    className="absolute top-2.5 right-2.5 p-1 rounded-md text-zinc-500 hover:text-white hover:bg-[#202026] transition-colors cursor-pointer"
                    title="Clear prompt"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono-studio px-0.5">
                <span>Enter core topic, hook angle, or key lesson</span>
                <span>{agentPrompt.length} chars</span>
              </div>
            </div>

            {/* ── Pacing & Model Configuration Card ── */}
            <div className="bg-[#141418] border border-[#24242A] rounded-2xl p-3.5 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-[#24242A]">
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span className="text-xs font-bold text-white tracking-wide">Pacing &amp; Model Engine</span>
                </div>
                <span className="text-[9px] font-mono-studio text-[#60A5FA] font-semibold bg-[#18181C] px-2 py-0.5 rounded-full border border-[#27272A]">
                  Ready
                </span>
              </div>

              {/* AI Model Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono-studio text-[#9CA3AF] flex items-center gap-1.5 font-semibold">
                  <Cpu className="w-3 h-3 text-[#3B82F6]" />
                  <span>Reasoning Engine</span>
                </label>
                <CustomSelect
                  options={scriptModels}
                  value={scriptModels.some((model) => model.value === currentModel) ? currentModel : defaultModel}
                  onChange={(val) => onModelChange?.(val)}
                  disabled={modelsLoading || scriptModels.length === 0}
                  className="w-full text-xs"
                />
                {!modelsLoading && !modelsError && scriptModels.length > 0 && !currentModel && (
                  <p className="mt-1 text-[10px] text-[#737373]">Default: {defaultModel || DEFAULT_SCRIPT_MODEL_LABEL}</p>
                )}
                {modelsLoading && <p className="mt-1 text-[10px] text-[#737373]">Loading models from Google…</p>}
                {modelsError && <p role="alert" className="mt-1 text-[10px] text-red-400">{modelsError}</p>}
              </div>

              {/* Target Duration */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono-studio">
                  <label className="uppercase text-[#9CA3AF] flex items-center gap-1.5 font-semibold">
                    <Gauge className="w-3 h-3 text-[#3B82F6]" />
                    <span>Target Video Duration</span>
                  </label>
                  <span className="text-[#3B82F6] font-semibold">
                    {targetLength ? targetLength.replace('seconds', 's').replace('second', 's').trim() : '30s'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {DURATION_PRESETS.map((opt) => {
                    const isSelected =
                      targetLength === opt.value ||
                      targetLength === opt.label ||
                      targetLength.startsWith(opt.label.replace('s', '')) ||
                      (opt.label === '30s' && (!targetLength || targetLength.includes('30'))) ||
                      (opt.label === '15s' && targetLength.includes('15')) ||
                      (opt.label === '45s' && targetLength.includes('45')) ||
                      (opt.label === '60s' && targetLength.includes('60'));
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onTargetLengthChange(opt.value)}
                        className={`py-2 px-1 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-[#2563EB] border-[#60A5FA]/40 text-white shadow-xs font-bold'
                            : 'bg-[#18181C] text-zinc-400 border-[#24242A] hover:text-white hover:bg-[#202026] hover:border-[#383842]'
                        }`}
                      >
                        <span className="text-xs font-bold leading-tight">{opt.label}</span>
                        <span className={`text-[8.5px] font-normal mt-0.5 ${isSelected ? 'text-blue-100 font-medium' : 'text-zinc-500'}`}>{opt.badge}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Tone */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono-studio text-[#9CA3AF] flex items-center gap-1.5 font-semibold">
                  <Volume2 className="w-3 h-3 text-[#3B82F6]" />
                  <span>Narration Delivery Tone</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {DELIVERY_TONES.map((tone) => {
                    const Icon = tone.icon;
                    const isSelected = speechTone === tone.id;
                    return (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => handleSelectTone(tone.id)}
                        className={`p-2.5 rounded-xl border transition-all text-left flex items-start gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#2563EB] text-white border-[#60A5FA]/40 shadow-xs font-bold'
                            : 'bg-[#18181C] text-zinc-400 border-[#24242A] hover:text-white hover:bg-[#202026] hover:border-[#383842]'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isSelected ? 'text-white' : 'text-zinc-400'}`} />
                        <div className="min-w-0">
                          <div className={`text-[11px] font-semibold leading-tight ${isSelected ? 'text-white' : 'text-[#D4D4D8]'}`}>
                            {tone.label}
                          </div>
                          <div className={`text-[9.5px] mt-0.5 truncate ${isSelected ? 'text-blue-100 font-medium' : 'text-zinc-500'}`}>
                            {tone.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
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
                  <span>Visual B-Roll Aesthetic</span>
                </span>
                <span className="text-zinc-500">Auto Match-Cuts</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {VISUAL_AESTHETICS.map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedAesthetic === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedAesthetic(item.id)}
                      className={`p-2.5 rounded-xl border transition-all text-left flex flex-col justify-between gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-[#2563EB] text-white border-[#60A5FA]/40 shadow-xs'
                          : 'bg-[#18181C] text-zinc-400 border-[#24242A] hover:text-white hover:bg-[#202026] hover:border-[#383842]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#3B82F6]'}`} />
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <div className={`text-[11px] font-bold ${isSelected ? 'text-white' : 'text-[#D4D4D8]'}`}>
                          {item.label}
                        </div>
                        <div className={`text-[9px] mt-0.5 line-clamp-1 ${isSelected ? 'text-blue-100' : 'text-zinc-500'}`}>
                          {item.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Kinetic Subtitles / Captions Preset */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono-studio text-[#9CA3AF]">
                <span className="font-semibold uppercase flex items-center gap-1.5">
                  <Type className="w-3 h-3 text-[#3B82F6]" />
                  <span>Kinetic Subtitles Preset</span>
                </span>
                <span className="text-[#60A5FA] font-semibold">High Retention</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SUBTITLE_PRESETS.map((sub) => {
                  const isSelected = selectedSubtitle === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSelectedSubtitle(sub.id)}
                      className={`p-2.5 rounded-xl border transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'bg-[#2563EB] text-white border-[#60A5FA]/40 shadow-xs'
                          : 'bg-[#18181C] text-zinc-400 border-[#24242A] hover:text-white hover:bg-[#202026] hover:border-[#383842]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-bold ${isSelected ? 'text-white' : 'text-[#D4D4D8]'}`}>
                          {sub.label}
                        </span>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <p className={`text-[9px] mt-0.5 line-clamp-1 ${isSelected ? 'text-blue-100' : 'text-zinc-500'}`}>
                        {sub.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Music Mood & Soundscape */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono-studio text-[#9CA3AF]">
                <span className="font-semibold uppercase flex items-center gap-1.5">
                  <Music className="w-3 h-3 text-[#EC4899]" />
                  <span>Background Soundscape Mood</span>
                </span>
                <span className="text-zinc-500">Auto Ducking</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {MUSIC_MOODS.map((mood) => {
                  const Icon = mood.icon;
                  const isSelected = selectedMusicMood === mood.id;
                  return (
                    <button
                      key={mood.id}
                      type="button"
                      onClick={() => setSelectedMusicMood(mood.id)}
                      className={`p-2.5 rounded-xl border transition-all text-left flex items-start gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-[#2563EB] text-white border-[#60A5FA]/40 shadow-xs'
                          : 'bg-[#18181C] text-zinc-400 border-[#24242A] hover:text-white hover:bg-[#202026] hover:border-[#383842]'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isSelected ? 'text-white' : 'text-[#EC4899]'}`} />
                      <div className="min-w-0">
                        <div className={`text-[11px] font-bold ${isSelected ? 'text-white' : 'text-[#D4D4D8]'}`}>
                          {mood.label}
                        </div>
                        <div className={`text-[9px] mt-0.5 truncate ${isSelected ? 'text-blue-100' : 'text-zinc-500'}`}>
                          {mood.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Syndication Platforms */}
            <div className="p-3.5 rounded-2xl bg-[#141418] border border-[#24242A] space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono-studio text-[#9CA3AF]">
                <span className="font-semibold uppercase flex items-center gap-1.5">
                  <Share2 className="w-3 h-3 text-[#3B82F6]" />
                  <span>Syndication Target Optimization</span>
                </span>
                <span className="text-zinc-500">Pre-Formatted</span>
              </div>
              <p className="text-[11px] text-[#8E8E93] leading-relaxed">
                Rendered video, hashtags, and metadata will be automatically optimized for selected destinations:
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
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
                      className={`p-2 rounded-xl border text-[11px] font-medium flex items-center justify-between transition-all cursor-pointer ${
                        active
                          ? 'bg-[#1A2234] border-[#3B82F6]/50 text-white'
                          : 'bg-[#18181C] border-[#24242A] text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <span>{item.label}</span>
                      {active ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#3B82F6]" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-zinc-600" />
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
              Select an AI voice narrator to voice your generated short-form video:
            </div>
            <div className="space-y-2">
              {liveVoices.map((v) => {
                const isSelected = selectedVoice === v.id || selectedVoice === v.name;
                const isTesting = testingVoiceId === v.id;

                return (
                  <div
                    key={v.id}
                    onClick={() => onVoiceChange?.(v.id || v.name)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#2563EB] text-white border-[#60A5FA]/40 shadow-xs'
                        : 'bg-[#18181C] border-[#24242A] hover:border-[#383842] hover:bg-[#202026]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-[#141418] text-zinc-400 border border-[#24242A]'
                        }`}
                      >
                        <Mic className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">{v.name}</span>
                          <span className="text-[9px] font-mono-studio px-1.5 py-0.2 rounded bg-black/25 text-zinc-300">
                            {v.gender}
                          </span>
                        </div>
                        <p className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-blue-100 font-medium' : 'text-zinc-400'}`}>{v.style}</p>
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
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isTesting
                              ? 'bg-[#3B82F6]/30 text-white border-[#3B82F6]/60'
                              : 'bg-[#18181C] hover:bg-[#26262E] text-zinc-300 hover:text-white border-[#27272A]'
                          }`}
                          title="Audition voice"
                        >
                          <Volume2 className={`w-3.5 h-3.5 ${isTesting ? 'animate-pulse text-[#60A5FA]' : ''}`} />
                        </button>
                      )}
                      {isSelected && (
                        <div className="p-1 rounded-full bg-white text-[#2563EB]">
                          <Check className="w-3 h-3 stroke-[3]" />
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
