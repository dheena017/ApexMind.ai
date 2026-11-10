import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ScrollableTabs, ScrollableTabContainer, TabItem } from '@/src/shared/ui/ScrollableTabs';
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
  ChevronDown,
  Film,
  Music,
  Type,
  Share2,
  Compass,
  CheckCircle2,
  Box,
  Boxes,
  Layers,
} from 'lucide-react';
import { Button } from '@/src/shared/ui/common';
import { CustomSelect } from '@/src/shared/ui/CustomSelect';
import { VoiceProfile } from '../../types';
import { workspaceApi } from '../../api/workspaceApi';
import { DEFAULT_SCRIPT_MODEL, DEFAULT_SCRIPT_MODEL_LABEL } from '@/src/shared/aiModels';
import { useAvailableScriptModels } from '@/src/shared/hooks/useAvailableScriptModels';
import {
  GenreConfig,
  getGenreConfig,
  getAllGenreConfigs,
  DEFAULT_GENRE_ID,
  RENDER_3D_ENGINES,
  ASSET_3D_PROVIDERS,
  HIDE_3D_VISUALS,
} from '../../genreConfigs';

export interface AIAgentCreatorPaneProps {
  selectedGenre?: string;
  onGenreChange?: (genreId: string) => void;
  selected3DEngine?: string;
  on3DEngineChange?: (engine: string) => void;
  selected3DProvider?: string;
  on3DProviderChange?: (provider: string) => void;
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
  { value: '5 seconds', label: '5s', badge: 'Micro / 5s Challenge' },
  { value: '15 seconds', label: '15s', badge: 'Fast Cut' },
  { value: '30 seconds', label: '30s', badge: 'Standard • Viral' },
  { value: '45 seconds', label: '45s', badge: 'Extended Story' },
  { value: '60 seconds', label: '60s (1m)', badge: 'Full Short' },
  { value: '90 seconds', label: '90s (1.5m)', badge: 'Reels / TikTok' },
  { value: '2 minutes', label: '2m', badge: 'Mini Episode' },
  { value: '3 minutes', label: '3m', badge: 'Deep Narrative' },
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
  selectedGenre = DEFAULT_GENRE_ID,
  onGenreChange,
  selected3DEngine,
  on3DEngineChange,
  selected3DProvider,
  on3DProviderChange,
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

  const allGenres = getAllGenreConfigs();
  const activeGenre = selectedGenre || DEFAULT_GENRE_ID;
  const activeGenreConfig = getGenreConfig(activeGenre);

  const [isGenreMenuOpen, setIsGenreMenuOpen] = useState(false);
  const genreDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isGenreMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(e.target as Node)) {
        setIsGenreMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsGenreMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isGenreMenuOpen]);

  const handleSelectGenre = (genreId: string) => {
    onGenreChange?.(genreId);
    const targetConfig = getGenreConfig(genreId);
    if (targetConfig.categories.length > 0) {
      onCategoryChange(targetConfig.categories[0].value);
    }
    if (targetConfig.tones.length > 0) {
      onToneChange?.(targetConfig.tones[0].value);
    }
    if (targetConfig.defaultVoice) {
      onVoiceChange?.(targetConfig.defaultVoice);
    }
    if (targetConfig.default3DEngine) {
      on3DEngineChange?.(targetConfig.default3DEngine);
    }
    if (targetConfig.default3DProvider) {
      on3DProviderChange?.(targetConfig.default3DProvider);
    }
  };

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
      
      {/* ── Top Bar: Active Mode Indicator & Header Genre Dropdown ── */}
      <div className="relative h-11 px-3 bg-[#141418] border-b border-[#24242A] flex items-center justify-between gap-2 z-10 shrink-0">
        {/* Left: Studio Title & Icon */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-6.5 h-6.5 rounded-lg bg-[#1E2538] border border-[#3B82F6]/30 flex items-center justify-center shadow-xs">
            <Wand2 className="w-3.5 h-3.5 text-[#3B82F6]" />
          </div>
          <span className="text-xs font-bold text-white tracking-tight">
            AI Script Studio
          </span>
        </div>

        {/* Right Actions: Header Genre Dropdown + Studio Mode Buttons */}
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Header Genre Selector Dropdown */}
          <div className="relative" ref={genreDropdownRef}>
            <button
              type="button"
              onClick={() => setIsGenreMenuOpen((prev) => !prev)}
              className={`h-7 px-2.5 rounded-lg bg-[#18181C] hover:bg-[#202026] border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs select-none ${
                isGenreMenuOpen
                  ? 'border-[#3B82F6] ring-1 ring-[#3B82F6]/40 text-white bg-[#1A1E2E]'
                  : 'border-[#27272A] hover:border-[#3B82F6]/60 text-zinc-200'
              }`}
              title="Switch AI Script Engine"
            >
              <span className="text-xs shrink-0">{activeGenreConfig.icon}</span>
              <span className="text-[11px] font-bold tracking-tight text-white truncate max-w-[110px] sm:max-w-[140px]">
                {activeGenreConfig.id === 'odd_one_out' ? 'Odd One Out' : activeGenreConfig.label.split(' ')[0]}
              </span>
              <ChevronDown
                className={`w-3 h-3 text-zinc-400 transition-transform duration-200 shrink-0 ${
                  isGenreMenuOpen ? 'rotate-180 text-[#3B82F6]' : ''
                }`}
              />
            </button>

            {/* Floating Dropdown Menu */}
            {isGenreMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-[350px] sm:w-[370px] rounded-2xl bg-[#141418] border border-[#27272A] shadow-2xl p-2 z-50 animate-in fade-in-0 zoom-in-95 duration-100 backdrop-blur-xl">
                <div className="px-2.5 py-1.5 border-b border-[#202026] mb-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-mono-studio uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#3B82F6]" />
                    <span>AI Script Engine</span>
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500">
                    {allGenres.length} presets
                  </span>
                </div>

                <div className="space-y-1.5">
                  {allGenres.map((g) => {
                    const isSelected = activeGenre === g.id;
                    const providerCleanName =
                      g.default3DProvider === 'roblox_creator_store'
                        ? 'Roblox Store'
                        : g.default3DProvider === 'poly_haven'
                        ? 'Poly Haven'
                        : '3D Models';

                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          handleSelectGenre(g.id);
                          setIsGenreMenuOpen(false);
                        }}
                        className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#182033] border border-[#3B82F6]/60 text-white shadow-xs'
                            : 'hover:bg-[#1A1A20] text-zinc-300 hover:text-white border border-transparent'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 mt-0.5 border ${
                            isSelected
                              ? 'bg-[#1E293B] border-[#3B82F6]/40 shadow-xs'
                              : 'bg-[#101014] border-[#24242A]'
                          }`}
                        >
                          {g.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-xs font-bold text-white tracking-tight">
                              {g.label}
                            </span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-snug mt-1">
                            {g.tagline}
                          </p>
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#101014] text-zinc-300 border border-[#27272A] whitespace-nowrap">
                              {g.badgeText}
                            </span>
                            {HIDE_3D_VISUALS ? (
                              <>
                                <span className="text-[9px] font-mono text-[#60A5FA] bg-[#101014] px-1.5 py-0.5 rounded border border-[#3B82F6]/30 whitespace-nowrap">
                                  🎙️ Voice: {g.defaultVoice}
                                </span>
                                <span className="text-[9px] font-mono text-zinc-400 bg-[#101014] px-1.5 py-0.5 rounded border border-[#27272A] whitespace-nowrap">
                                  {g.defaultTone}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-[9px] font-mono text-[#60A5FA] bg-[#101014] px-1.5 py-0.5 rounded border border-[#3B82F6]/30 whitespace-nowrap">
                                  Engine: {g.default3DEngine === 'blender_hybrid' ? 'Blender Hybrid' : g.default3DEngine === 'motion_loop' ? 'Motion Loop' : g.default3DEngine === 'blender_full' ? 'Blender CGI' : 'WebGL'}
                                </span>
                                <span className="text-[9px] font-mono text-zinc-400 bg-[#101014] px-1.5 py-0.5 rounded border border-[#27272A] whitespace-nowrap">
                                  Catalog: {providerCleanName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {onStartNewVideo && (
            <button
              type="button"
              onClick={onStartNewVideo}
              className="w-7 h-7 rounded-lg bg-[#18181C] hover:bg-[#202026] text-zinc-300 hover:text-white transition-colors cursor-pointer border border-[#27272A] flex items-center justify-center shadow-xs shrink-0"
              title="Start a new script from scratch"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-300" />
            </button>
          )}

          {/* Studio Mode Switcher Button */}
          {onSwitchToEditor && (
            <button
              type="button"
              onClick={onSwitchToEditor}
              className="h-7 flex items-center gap-1.5 px-2 rounded-lg bg-[#1E1E24] hover:bg-[#26262E] text-[11px] font-medium text-zinc-300 hover:text-white transition-all cursor-pointer border border-[#2A2A32] shadow-xs group shrink-0"
              title="Click to switch to Script Editor"
            >
              <Wand2 className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span className="truncate hidden xs:inline sm:inline">AI Prompt</span>
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
            {/* 1. Video Topic / Headline */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono-studio">
                <span className="text-[#9CA3AF] font-semibold tracking-wider uppercase">Topic / Headline</span>
                <span className="text-zinc-500 text-[10px]">Title concept or premise</span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => onTopicChange?.(e.target.value)}
                  placeholder={
                    activeGenre === 'roblox_story'
                      ? 'e.g. The Legend of the Abandoned Roblox Server'
                      : activeGenre === 'odd_one_out'
                      ? 'e.g. Spot the Fake Roblox Avatar in 5 Seconds'
                      : 'e.g. Why Most Men Die at 25 and Get Buried at 75'
                  }
                  className="w-full bg-[#16161A] border border-[#27272A] rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-[#52525B] outline-none focus:border-[#3B82F6] transition-all font-medium shadow-inner"
                />
                {topic.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => onTopicChange?.('')}
                    className="absolute top-2.5 right-2.5 p-1 rounded-md text-zinc-500 hover:text-white hover:bg-[#202026] transition-colors cursor-pointer"
                    title="Clear topic"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Viral Starters Chips in One Scrollable Row */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono-studio">
                <span className="text-[#9CA3AF] uppercase font-semibold flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-500" />
                  <span>Viral Starters ({activeGenreConfig.label})</span>
                </span>
                <span className="text-zinc-500 text-[9px]">Click to set topic</span>
              </div>

              <ScrollableTabContainer className="w-full">
                {activeGenreConfig.quickPromptChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onTopicChange?.(chip);
                      try {
                        confetti({ particleCount: 20, spread: 50, origin: { y: 0.8 } });
                      } catch {}
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#18181C] hover:bg-[#222228] border border-[#27272A] hover:border-[#3B82F6]/60 text-[11px] text-zinc-300 hover:text-white transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0 snap-start select-none"
                  >
                    {chip}
                  </button>
                ))}
              </ScrollableTabContainer>
            </div>

            {/* 2. Story & Plot Director Card (User Prompt) */}
            <div className="bg-[#141418] border border-[#24242A] rounded-2xl p-3.5 space-y-2.5 shadow-sm hover:border-[#3B82F6]/30 transition-all">
              <div className="flex items-center justify-between pb-2 border-b border-[#24242A]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span className="text-xs font-bold text-white tracking-wide">Story &amp; Plot Director</span>
                </div>
                <span className="text-[9px] font-mono-studio text-[#60A5FA] font-semibold bg-[#18181C] px-2 py-0.5 rounded-full border border-[#27272A]">
                  Explained by You
                </span>
              </div>

              {/* Full Sample Story Prompts Strip */}
              {activeGenreConfig.sampleStoryPrompts && activeGenreConfig.sampleStoryPrompts.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono-studio">
                    <span className="text-[#9CA3AF] uppercase font-semibold flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>Full Sample Stories ({activeGenreConfig.label.split(' ')[0]})</span>
                    </span>
                    <span className="text-zinc-500 text-[9px]">Click to load complete plot</span>
                  </div>

                  <ScrollableTabContainer className="w-full">
                    {activeGenreConfig.sampleStoryPrompts.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          onPromptChange(sample.prompt);
                          try {
                            confetti({ particleCount: 25, spread: 60, origin: { y: 0.8 } });
                          } catch {}
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#101013] hover:bg-[#182032] border border-[#26262C] hover:border-[#3B82F6]/60 text-[11px] text-zinc-300 hover:text-white transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0 snap-start flex items-center gap-1.5 select-none group"
                        title="Click to load this full sample story into your prompt"
                      >
                        <span className="text-white font-bold">{sample.title}</span>
                        <span className="text-[9px] font-mono text-[#60A5FA] px-1.5 py-0.2 rounded bg-[#18181C] border border-[#24242A]">
                          {sample.badge}
                        </span>
                      </button>
                    ))}
                  </ScrollableTabContainer>
                </div>
              )}

              <div className="relative rounded-xl border border-[#27272A] bg-[#101013] focus-within:border-[#3B82F6] focus-within:ring-1 focus-within:ring-[#3B82F6]/40 transition-all">
                <textarea
                  value={agentPrompt}
                  onChange={(e) => onPromptChange(e.target.value)}
                  placeholder={
                    activeGenre === 'roblox_story'
                      ? 'Explain your Roblox story in detail (e.g. My friend Alex and I joined an abandoned Brookhaven server at 3:00 AM. We saw a glitching avatar named "Null" standing outside the hospital window...)'
                      : activeGenre === 'odd_one_out'
                      ? 'Explain your puzzle challenge in detail (e.g. Show four Roblox avatars in a lineup with a 5-second countdown timer. Avatars 1, 2, and 4 have regular swords, but avatar 3 has a glitched red dark blade...)'
                      : 'Explain your message or story in detail (e.g. Focus on waking up early at 4 AM while everyone is asleep. Explain how 6 months of silent compounding discipline shocks everyone who doubted you...)'
                  }
                  rows={4}
                  className="w-full bg-transparent p-3 text-xs text-white placeholder:text-[#52525B] outline-none resize-none leading-relaxed"
                />
                {agentPrompt.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => onPromptChange('')}
                    className="absolute top-2.5 right-2.5 p-1 rounded-md text-zinc-400 hover:text-white hover:bg-[#202026] transition-colors cursor-pointer"
                    title="Clear prompt"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono-studio pt-0.5">
                <span className="flex items-center gap-1 text-zinc-400">
                  <CheckCircle2 className="w-3 h-3 text-[#3B82F6]" />
                  <span>Prioritized by AI Director</span>
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#101014] border border-[#202026] text-zinc-400 font-mono">
                  {agentPrompt.length} chars
                </span>
              </div>
            </div>

            {/* ── Creative Controls Card (Niche, Format, Length, Tone & Model) ── */}
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

              {/* 1. Category / Niche Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono-studio text-[#9CA3AF] flex items-center gap-1.5 font-semibold tracking-wide">
                  <Compass className="w-3 h-3 text-[#3B82F6]" />
                  <span>Niche ({activeGenreConfig.label})</span>
                </label>
                <CustomSelect
                  options={activeGenreConfig.categories}
                  value={category}
                  onChange={onCategoryChange}
                  className="w-full text-xs"
                  buttonClassName="bg-[#18181C] border-[#27272A] hover:border-[#60A5FA]/40"
                />
              </div>

              {/* 2. Format & Length (Paired in 2-Column Grid) */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Format / Aspect Ratio */}
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

                {/* Target Duration / Length */}
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
                      DURATION_PRESETS.find((opt) => {
                        if (targetLength === opt.value || targetLength === opt.label) return true;
                        const parseSec = (str: string) => {
                          const m = str.match(/(\d+)\s*(min|sec|s|m)?/i);
                          if (!m) return null;
                          const n = parseInt(m[1], 10);
                          return m[2]?.toLowerCase().startsWith('m') ? n * 60 : n;
                        };
                        const targetSec = parseSec(targetLength);
                        const optSec = parseSec(opt.value);
                        return targetSec !== null && optSec !== null && targetSec === optSec;
                      })?.value ?? '30 seconds'
                    }
                    onChange={(val) => onTargetLengthChange(val)}
                    className="w-full"
                    buttonClassName="bg-[#18181C] border-[#27272A] hover:border-[#60A5FA]/40"
                  />
                </div>
              </div>

              {/* 3. Delivery Tone */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono-studio text-[#9CA3AF] flex items-center gap-1.5 font-semibold tracking-wide">
                  <Volume2 className="w-3 h-3 text-[#3B82F6]" />
                  <span>Tone ({activeGenreConfig.label})</span>
                </label>
                <CustomSelect
                  options={activeGenreConfig.tones.map((t) => ({
                    value: t.value,
                    label: t.label,
                    description: t.desc,
                  }))}
                  value={propTone || activeGenreConfig.defaultTone}
                  onChange={(val) => handleSelectTone(val)}
                  className="w-full"
                  buttonClassName="bg-[#18181C] border-[#27272A] hover:border-[#60A5FA]/40"
                />
              </div>

              {/* 4. 3D Render Engine Selector (backend/features/workspace/visuals_3d/engines) */}
              {!HIDE_3D_VISUALS && (
                <>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono-studio">
                      <label className="text-[#9CA3AF] uppercase flex items-center gap-1.5 font-semibold tracking-wide">
                        <Boxes className="w-3 h-3 text-[#3B82F6]" />
                        <span>3D Render Engine</span>
                      </label>
                      <span className="text-[9px] text-[#60A5FA] font-mono bg-[#1E293B] px-1.5 py-0.5 rounded border border-[#3B82F6]/30">
                        Render Pipeline
                      </span>
                    </div>
                    <CustomSelect
                      options={RENDER_3D_ENGINES.map((eng) => ({
                        value: eng.value,
                        label: eng.label,
                        badge: eng.badge,
                        description: eng.description,
                      }))}
                      value={selected3DEngine || activeGenreConfig.default3DEngine}
                      onChange={(val) => on3DEngineChange?.(val)}
                      className="w-full text-xs"
                      buttonClassName="bg-[#18181C] border-[#27272A] hover:border-[#60A5FA]/40"
                    />
                  </div>

                  {/* 5. 3D Model Catalog / Asset Provider Selector (backend/features/workspace/visuals_3d/providers) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono-studio">
                      <label className="text-[#9CA3AF] uppercase flex items-center gap-1.5 font-semibold tracking-wide">
                        <Layers className="w-3 h-3 text-[#3B82F6]" />
                        <span>3D Model Catalog / Source</span>
                      </label>
                      <span className="text-[9px] text-[#A78BFA] font-mono bg-[#2E1065]/50 px-1.5 py-0.5 rounded border border-[#8B5CF6]/30">
                        Asset Source
                      </span>
                    </div>
                    <CustomSelect
                      options={ASSET_3D_PROVIDERS.map((prov) => ({
                        value: prov.value,
                        label: prov.label,
                        badge:
                          (activeGenre === 'roblox_story' || activeGenre === 'odd_one_out') && prov.value === 'roblox_creator_store'
                            ? 'Recommended'
                            : activeGenre === 'motivation' && prov.value === 'poly_haven'
                            ? 'Recommended'
                            : prov.badge,
                        description: prov.description,
                      }))}
                      value={selected3DProvider || activeGenreConfig.default3DProvider}
                      onChange={(val) => on3DProviderChange?.(val)}
                      className="w-full text-xs"
                      buttonClassName="bg-[#18181C] border-[#27272A] hover:border-[#60A5FA]/40"
                    />
                  </div>
                </>
              )}

              {/* 5. AI Model Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono-studio text-[#9CA3AF] flex items-center gap-1.5 font-semibold">
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
