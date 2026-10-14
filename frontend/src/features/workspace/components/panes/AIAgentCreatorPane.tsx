import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  RefreshCw,
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
  { value: 'Stoic Mindset & Discipline', label: 'Stoic Mindset & Discipline' },
  { value: 'Fitness & Iron Will', label: 'Fitness & Iron Will' },
  { value: 'Deep Focus & Flow', label: 'Deep Focus & Flow' },
  { value: 'Calm & Resilience', label: 'Calm & Resilience' },
  { value: 'Unstoppable Motivation', label: 'Unstoppable Motivation' },
  { value: 'Dark Psychology & Power', label: 'Dark Psychology & Power' },
  { value: 'High Finance & Wealth', label: 'High Finance & Wealth' },
];

const PROMPT_INSPIRATION_SEEDS = [
  {
    title: 'The Solitary Standard',
    tag: 'Stoic',
    icon: Shield,
    prompt: 'Create an intense stoic reel about suffering in silence and letting your unstoppable results speak for themselves.',
  },
  {
    title: 'Iron Gym Discipline',
    tag: 'Fitness',
    icon: Flame,
    prompt: 'A raw, aggressive fitness script explaining why your excuses are lies and why the barbell never lies.',
  },
  {
    title: 'Dark Psychology: Quiet Moves',
    tag: 'Mindset',
    icon: Brain,
    prompt: 'Explain why telling people your goals kills dopamine and why true kings move in complete silence.',
  },
  {
    title: 'Building The Empire',
    tag: 'Wealth',
    icon: Coins,
    prompt: 'A punchy wealth reel about ignoring temporary pleasure to build generational freedom in the shadows.',
  },
];

export const AIAgentCreatorPane: React.FC<AIAgentCreatorPaneProps> = ({
  agentPrompt,
  onPromptChange,
  category,
  onCategoryChange,
  targetLength,
  onTargetLengthChange,
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
  const [activeTab, setActiveTab] = useState<'prompt' | 'pacing' | 'voice'>('prompt');
  const [liveVoices, setLiveVoices] = useState<VoiceProfile[]>(voices.length > 0 ? voices : DEFAULT_FALLBACK_VOICES);
  const [speechPace, setSpeechPace] = useState<'0.9x' | '1.0x' | '1.15x' | '1.25x'>('1.0x');
  const [speechTone, setSpeechTone] = useState<'authoritative' | 'aggressive' | 'calm' | 'cinematic'>('authoritative');
  const [menuOpen, setMenuOpen] = useState(false);

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

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none overflow-hidden rounded-2xl border border-[#26262B]">
      {/* ── Top Bar: Active Mode Indicator & Switcher Dropdown ── */}
      <div className="relative px-3 py-2 bg-[#17171A] border-b border-[#26262B] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Wand2 className="w-4 h-4 shrink-0 text-[#60A5FA]" />
          <span className="text-xs font-bold text-white truncate">
            AI Script Studio
          </span>
          <span className="text-[9px] font-mono-studio px-1.5 py-0.2 rounded bg-white/10 text-white/80 border border-white/15 shrink-0 uppercase font-bold">
            AGENT
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onStartNewVideo && (
            <button
              type="button"
              onClick={onStartNewVideo}
              className="px-2 py-1 rounded-md bg-[#222226] hover:bg-[#2C2C32] text-[11px] font-medium text-white transition-colors cursor-pointer border border-[#323238] flex items-center gap-1"
              title="Start a new script from scratch"
            >
              <Plus className="w-3 h-3 text-[#60A5FA]" />
              <span className="hidden sm:inline">New</span>
            </button>
          )}

          {/* Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#26262B] hover:bg-[#303036] text-[11px] font-semibold text-white transition-colors cursor-pointer border border-[#36363D]"
            >
              <span className="truncate">AI Prompt</span>
              <ChevronDown className="w-3 h-3 text-[#A1A1AA]" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-[#1C1C20] border border-[#2A2A30] shadow-xl p-1 z-40 flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white bg-[#3B82F6]/15 text-[#60A5FA]"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    AI Prompt
                  </button>
                  {onSwitchToEditor && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onSwitchToEditor();
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#A1A1AA] hover:text-white hover:bg-[#26262B] transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Script &amp; Subtitles
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Subtabs Header Bar ── */}
      <div className="flex items-center gap-6 px-4 pt-2.5 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar shrink-0">
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
          AI Voice Actor ({liveVoices.length})
        </button>
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
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

            {/* Prompt Textarea */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono-studio">
                <span className="text-[#71717A]">AI AGENT PROMPT</span>
                <span className="text-[#60A5FA]">VIRAL HOOK GENERATOR</span>
              </div>
              <textarea
                value={agentPrompt}
                onChange={(e) => onPromptChange(e.target.value)}
                placeholder="What core truth or motivational message should this reel deliver? (e.g., The power of silence and daily non-negotiable standards)..."
                rows={4}
                className="w-full bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-3 text-xs text-white placeholder:text-[#52525B] outline-none focus:border-[#3B82F6] transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* Quick Prompt Enhancers */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => enhancePrompt('Make the hook brutally honest and unforgettable.')}
                className="px-2 py-1 rounded-lg bg-[#1C1C20] hover:bg-[#26262B] text-[10px] text-zinc-300 border border-[#2A2A30] transition-colors"
              >
                + Brutal Hook
              </button>
              <button
                type="button"
                onClick={() => enhancePrompt('Add an unexpected twist ending that demands comments.')}
                className="px-2 py-1 rounded-lg bg-[#1C1C20] hover:bg-[#26262B] text-[10px] text-zinc-300 border border-[#2A2A30] transition-colors"
              >
                + Viral Twist
              </button>
              <button
                type="button"
                onClick={() => enhancePrompt('Keep sentences under 6 words for fast caption pacing.')}
                className="px-2 py-1 rounded-lg bg-[#1C1C20] hover:bg-[#26262B] text-[10px] text-zinc-300 border border-[#2A2A30] transition-colors"
              >
                + Short Sentences
              </button>
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
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onPromptChange(seed.prompt)}
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
                    </button>
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
        )}
      </div>

      {/* ── Bottom Action Footer ── */}
      <div className="p-4 border-t border-[#26262B] bg-[#17171A] shrink-0">
        <Button
          onClick={onRunAgent}
          disabled={loadingAgent}
          className="w-full bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-[#3B82F6]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {loadingAgent ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Generating Script &amp; Directing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Viral Reel Script</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AIAgentCreatorPane;
