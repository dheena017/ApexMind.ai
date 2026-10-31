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
  { value: '9:16' as const, label: '9:16', desc: 'Shorts / Reels / TikTok', res: '1080×1920', icon: Smartphone },
  { value: '16:9' as const, label: '16:9', desc: 'YouTube Landscape', res: '1920×1080', icon: Monitor },
  { value: '1:1' as const, label: '1:1', desc: 'Square Post', res: '1080×1080', icon: Square },
  { value: '4:5' as const, label: '4:5', desc: 'IG Portrait', res: '1080×1350', icon: Smartphone },
  { value: '21:9' as const, label: '21:9', desc: 'Cinematic Ultrawide', res: '2560×1080', icon: Monitor },
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
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Ultra Fast & Adaptive)' },
  { value: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (Latest Performance)' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Deep Reasoning & Hooks)' },
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
  const [activeTab, setActiveTab] = useState<'prompt' | 'voice'>('prompt');
  const [liveVoices, setLiveVoices] = useState<VoiceProfile[]>(voices.length > 0 ? voices : DEFAULT_FALLBACK_VOICES);
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

  const currentModel = propModel || 'gemini-2.5-flash';

  const enhancePrompt = (modifier: string) => {
    const base = agentPrompt.trim();
    if (!base) {
      onPromptChange(modifier);
    } else {
      onPromptChange(`${base} ${modifier}`);
    }
  };


  const activeCategoryShort = category ? category.split('&')[0].trim() : 'AI Video';

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
      <div className="flex items-center gap-2 px-3.5 pt-2 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar shrink-0 bg-[#141417]">
        <button
          type="button"
          onClick={() => setActiveTab('prompt')}
          className={`flex items-center gap-1.5 pb-2.5 px-1.5 capitalize transition-all cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'prompt'
              ? 'text-white border-[#3B82F6]'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          <Wand2 className={`w-3.5 h-3.5 ${activeTab === 'prompt' ? 'text-[#60A5FA]' : 'text-[#71717A]'}`} />
          <span>Prompt &amp; Concept</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('voice')}
          className={`flex items-center gap-1.5 pb-2.5 px-1.5 capitalize transition-all cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'voice'
              ? 'text-white border-[#3B82F6]'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          <Mic className={`w-3.5 h-3.5 ${activeTab === 'voice' ? 'text-[#60A5FA]' : 'text-[#71717A]'}`} />
          <span>Voice Actor</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#26262B] text-zinc-400 font-mono-studio">
            {liveVoices.length}
          </span>
        </button>
      </div>

      {/* ── Prominent Error Banner (Pinned) ── */}
      {agentError && (
        <div className="mx-3.5 mt-2.5 p-3 rounded-xl bg-red-950/90 border border-red-500/60 text-red-200 text-xs flex items-start gap-2.5 shadow-xl shadow-red-950/70 shrink-0 animate-in fade-in slide-in-from-top-1">
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
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 flex flex-col gap-3.5">

        {/* ── Tab 1: Prompt & Concept ── */}
        {activeTab === 'prompt' && (
          <div className="flex flex-col gap-3.5">
            {/* Category Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-mono-studio text-[#71717A] tracking-wider">
                Niche &amp; Philosophy Category
              </label>
              <CustomSelect
                options={CATEGORY_OPTIONS}
                value={category}
                onChange={onCategoryChange}
                className="w-full text-xs"
              />
            </div>

            {/* Video Aspect Ratio Selector */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono-studio">
                <label className="uppercase text-[#71717A] flex items-center gap-1.5 tracking-wider">
                  <Smartphone className="w-3.5 h-3.5 text-[#38BDF8]" />
                  Video Aspect Ratio
                </label>
                <span className="text-[#38BDF8] font-bold">
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
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
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
                          ? 'bg-[#1E293B] border-[#38BDF8] text-[#38BDF8] shadow-sm shadow-[#38BDF8]/20 ring-1 ring-[#38BDF8]/40'
                          : 'bg-[#141417] border-[#2A2A30] text-[#71717A] hover:text-[#D4D4D8] hover:border-[#3A3A42]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 mb-1" />
                      <span className="text-[10px] font-bold leading-none">{item.label}</span>
                      <span className="text-[8px] opacity-70 mt-0.5 truncate w-full text-center">{item.desc.split('/')[0].trim()}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prompt Textarea */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono-studio">
                <span className="text-[#71717A] tracking-wider">AI AGENT PROMPT</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  ✨ {activeCategoryShort} Director
                </span>
              </div>
              <div className="relative">
                <textarea
                  value={agentPrompt}
                  onChange={(e) => onPromptChange(e.target.value)}
                  placeholder="What core truth or motivational message should this reel deliver? (e.g., The power of silence and daily non-negotiable standards)..."
                  rows={4}
                  className="w-full bg-[#18181B] border border-[#2A2A30] rounded-xl p-3 text-xs text-white placeholder:text-[#52525B] outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/40 transition-all resize-none leading-relaxed"
                />
                {agentPrompt.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => onPromptChange('')}
                    className="absolute top-2.5 right-2.5 p-1 rounded-md text-[#71717A] hover:text-white hover:bg-[#26262B] transition-colors"
                    title="Clear prompt"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#71717A] font-mono-studio px-0.5">
                <span>Enter core topic, hook angle, or key lesson</span>
                <span>{agentPrompt.length} chars</span>
              </div>
            </div>

            {/* ── Pacing & Model Configuration Card ── */}
            <div className="bg-[#18181B] border border-[#2A2A30] rounded-xl p-3.5 flex flex-col gap-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#26262B]">
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-[#60A5FA]" />
                  <span className="text-xs font-bold text-white tracking-wide">Pacing &amp; Model Engine</span>
                </div>
                <span className="text-[10px] font-mono-studio text-[#60A5FA] bg-[#3B82F6]/10 px-2 py-0.5 rounded-md border border-[#3B82F6]/20">
                  AI Script Tuning
                </span>
              </div>

              {/* AI Model Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono-studio text-[#71717A] flex items-center gap-1.5 tracking-wider">
                  <Cpu className="w-3 h-3 text-[#60A5FA]" />
                  Reasoning Engine
                </label>
                <CustomSelect
                  options={AI_MODELS}
                  value={currentModel}
                  onChange={(val) => onModelChange?.(val)}
                  className="w-full text-xs"
                />
              </div>

              {/* Target Duration */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono-studio">
                  <label className="uppercase text-[#71717A] flex items-center gap-1.5 tracking-wider">
                    <Gauge className="w-3 h-3 text-[#38BDF8]" />
                    Target Video Duration
                  </label>
                  <span className="text-[#38BDF8] font-bold">
                    {targetLength ? targetLength.replace('seconds', 's').replace('second', 's').trim() : '30s'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
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
                            ? 'bg-[#1E293B] border-[#38BDF8] text-[#38BDF8] shadow-sm shadow-[#38BDF8]/20 ring-1 ring-[#38BDF8]/40'
                            : 'bg-[#141417] text-[#A1A1AA] border-[#2A2A30] hover:text-white hover:border-[#3A3A42]'
                        }`}
                      >
                        <span className="text-xs font-bold leading-tight">{opt.label}</span>
                        <span className="text-[8px] font-normal opacity-70 mt-0.5">{opt.badge}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Tone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono-studio text-[#71717A] flex items-center gap-1.5 tracking-wider">
                  <Volume2 className="w-3 h-3 text-[#A78BFA]" />
                  Narration Delivery Tone
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
                            ? 'bg-[#1E2330] text-white border-[#3B82F6] ring-1 ring-[#3B82F6]/50 shadow-sm shadow-[#3B82F6]/20'
                            : 'bg-[#141417] text-[#A1A1AA] border-[#2A2A30] hover:text-white hover:border-[#3A3A42]'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isSelected ? 'text-[#60A5FA]' : 'text-[#71717A]'}`} />
                        <div className="min-w-0">
                          <div className={`text-[11px] font-semibold leading-tight ${isSelected ? 'text-white' : 'text-[#D4D4D8]'}`}>
                            {tone.label}
                          </div>
                          <div className="text-[9px] text-[#71717A] mt-0.5 truncate">
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

        {/* ── Tab 2: AI Voice Actors ── */}
        {activeTab === 'voice' && (
          <div className="flex flex-col gap-2.5">
            <div className="text-[11px] text-[#71717A] px-0.5 pb-0.5">
              Select an AI voice narrator to voice your generated video reel:
            </div>
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
                        ? 'bg-[#1E2330] border-[#3B82F6] ring-1 ring-[#3B82F6]/50 shadow-sm shadow-[#3B82F6]/20'
                        : 'bg-[#18181B] border-[#2A2A30] hover:border-[#3A3A42] hover:bg-[#1E1E24]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-[#3B82F6] text-white' : 'bg-[#26262B] text-[#60A5FA]'
                        }`}
                      >
                        <Mic className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">{v.name}</span>
                          <span className="text-[9px] font-mono-studio px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                            {v.gender}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#A1A1AA] truncate mt-0.5">{v.style}</p>
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
                              ? 'bg-[#3B82F6]/20 text-[#60A5FA] border-[#3B82F6]/50'
                              : 'bg-[#26262B] hover:bg-[#34343E] text-zinc-300 hover:text-white border-[#323238]'
                          }`}
                          title="Audition voice"
                        >
                          <Volume2 className={`w-3.5 h-3.5 ${isTesting ? 'animate-pulse text-[#60A5FA]' : ''}`} />
                        </button>
                      )}
                      {isSelected && (
                        <div className="p-1 rounded-full bg-[#3B82F6] text-white">
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
      <div className="px-3.5 py-2.5 border-t border-[#26262B] bg-[#17171A] shrink-0 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium px-0.5">
          <span className="flex items-center gap-1 text-sky-400">
            <Sparkles className="w-3 h-3 text-sky-400" />
            AI Motion & Transitions Included
          </span>
          <span className="text-[9px] bg-sky-950/60 border border-sky-500/30 text-sky-300 px-1.5 py-0.2 rounded font-mono">
            AUTO-DIRECTED
          </span>
        </div>
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
          className="w-full bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white font-bold rounded-lg shadow-lg shadow-[#3B82F6]/25 transition-all py-2 text-xs"
        >
          {loadingAgent ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{pipelineLabel || 'Generating Script & Directing...'}</span>
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
