import React, { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/src/shared/ui/common';
import { CustomSelect } from '@/src/shared/ui/CustomSelect';
import { VoiceProfile } from '../../types';

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

const DEFAULT_VOICES: VoiceProfile[] = [
  { id: 'Fenrir', name: 'Fenrir', gender: 'Male', style: 'Deep, Powerful, Stoic Leader', speed: '1.0x' },
  { id: 'Aura', name: 'Aura', gender: 'Female', style: 'Calm, Resilient, Inspiring', speed: '1.0x' },
  { id: 'Kratos', name: 'Kratos', gender: 'Male', style: 'Gravelly, Intense, Raw Power', speed: '1.0x' },
  { id: 'Nova', name: 'Nova', gender: 'Female', style: 'Direct, Energetic, Unapologetic', speed: '1.0x' },
];

const AI_MODELS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Ultra Fast)' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Deep Reasoning)' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Standard)' },
];

const CATEGORY_OPTIONS = [
  { value: 'Stoic Mindset & Discipline', label: 'Stoic Mindset & Discipline' },
  { value: 'Fitness & Iron Will', label: 'Fitness & Iron Will' },
  { value: 'Deep Focus & Flow', label: 'Deep Focus & Flow' },
  { value: 'Calm & Resilience', label: 'Calm & Resilience' },
  { value: 'Unstoppable Motivation', label: 'Unstoppable Motivation' },
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
  voices = DEFAULT_VOICES,
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
  const [voiceVolume, setVoiceVolume] = useState(100);

  const currentModel = propModel || 'gemini-2.5-flash';
  const voiceList = voices && voices.length > 0 ? voices : DEFAULT_VOICES;
  const voiceOptions = voiceList.map((v) => ({
    value: v.id || v.name,
    label: `${v.name} · ${v.style}`,
  }));

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none overflow-hidden rounded-2xl">
      {/* ── Top Bar: Active Mode Indicator, New Button & Switcher Dropdown (Matching Right Pane) ── */}
      <div className="relative px-3 py-2 bg-[#17171A] border-b border-[#26262B] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Wand2 className="w-4 h-4 shrink-0 text-[#60A5FA]" />
          <span className="text-xs font-bold text-white truncate">
            AI Script Studio
          </span>
        </div>

        {/* Right Actions: New Button & Switcher Dropdown */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onStartNewVideo && (
            <button
              type="button"
              onClick={onStartNewVideo}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer border bg-[#222228] hover:bg-[#2C2C34] text-[#D4D4D8] hover:text-white border-[#32323C]"
              title="Start a fresh empty project"
            >
              <Plus className="w-3.5 h-3.5 text-sky-400" />
              <span>New</span>
            </button>
          )}

          {onSwitchToEditor && (
            <button
              type="button"
              onClick={onSwitchToEditor}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#222228] hover:bg-[#2C2C34] text-[10px] text-[#A1A1AA] hover:text-white transition-colors cursor-pointer border border-[#32323C]"
              title="Open Script & Subtitles"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Script</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Subtabs Header Bar (Exactly matching Right Pane Image 5) ── */}
      <div className="flex items-center gap-6 px-4 pt-2.5 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('prompt')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'prompt' ? 'text-white border-white' : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Prompt &amp; Niche
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pacing')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'pacing' ? 'text-white border-white' : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Pacing
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('voice')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'voice' ? 'text-white border-white' : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Voice
        </button>
      </div>

      {/* ── Main Tab Content Area (Clean, Seamless bg-[#121214]) ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-5">
        {activeTab === 'prompt' && (
          <div className="flex flex-col gap-4">
            {/* Topic / Motivation Prompt Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">
                Video Topic or Motivation Prompt
              </label>
              <div className="overflow-hidden rounded-xl border border-[#2A2A30] bg-[#1C1C20] transition-colors focus-within:border-[#3B82F6]/60 focus-within:ring-1 focus-within:ring-[#3B82F6]/20">
                <textarea
                  value={agentPrompt}
                  onChange={(e) => onPromptChange(e.target.value)}
                  rows={4}
                  className="w-full resize-none bg-transparent p-3 text-xs leading-relaxed text-white outline-none placeholder:text-[#525252]"
                  placeholder="e.g. Monologue about silent discipline, early mornings, and relentless consistency..."
                />
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#26262B] bg-[#17171A] px-3 py-2">
                  <span className="flex items-center gap-1.5 text-[10px] text-[#71717A]">
                    <Cpu className="h-3.5 w-3.5 text-[#60A5FA]" aria-hidden="true" />
                    Generate with
                  </span>
                  <CustomSelect
                    variant="compact"
                    align="right"
                    options={AI_MODELS}
                    value={currentModel}
                    onChange={(modelId) => onModelChange?.(modelId)}
                    title="Select AI Model"
                    buttonClassName="bg-[#1C1C20] border-[#2A2A30] text-xs text-white"
                    menuClassName="bg-[#1C1C20] border-[#2A2A30]"
                  />
                </div>
              </div>
            </div>

            {/* Niche Category Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">
                Niche Category
              </label>
              <CustomSelect
                value={category}
                onChange={onCategoryChange}
                options={CATEGORY_OPTIONS}
                icon={<Compass className="w-3.5 h-3.5 text-[#60A5FA]" />}
                buttonClassName="bg-[#1C1C20] border-[#2A2A30] hover:border-[#3B82F6]/50 text-xs text-white"
                menuClassName="bg-[#1C1C20] border-[#2A2A30]"
              />
            </div>

            {/* AI Voice Persona Dropdown */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">
                  AI Voiceover Persona
                </label>
                {onTestVoice && selectedVoice && (
                  <button
                    type="button"
                    onClick={() => onTestVoice(selectedVoice)}
                    className="text-[10px] text-[#60A5FA] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                    title="Preview voice sample audio"
                  >
                    {testingVoiceId === selectedVoice ? (
                      <>
                        <Radio className="w-3 h-3 animate-spin text-white" />
                        <span className="text-white font-medium">Playing...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3" />
                        <span className="hover:underline font-medium">Test Voice</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <CustomSelect
                value={selectedVoice}
                onChange={(val) => onVoiceChange?.(val)}
                options={voiceOptions}
                icon={<Mic className="w-3.5 h-3.5 text-[#60A5FA]" />}
                buttonClassName="bg-[#1C1C20] border-[#2A2A30] hover:border-[#3B82F6]/50 text-xs text-white"
                menuClassName="bg-[#1C1C20] border-[#2A2A30]"
              />
            </div>

            {/* Pacing Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">
                Pacing &amp; Reel Target Length
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '15s Viral', desc: 'Fast Hook', value: '15 seconds' },
                  { label: '30s Impact', desc: 'High Energy', value: '30 seconds' },
                  { label: '60s Cinema', desc: 'Deep Monologue', value: '60 seconds' },
                ].map((pace) => {
                  const isActive = targetLength === pace.value;
                  return (
                    <button
                      type="button"
                      key={pace.value}
                      onClick={() => onTargetLengthChange(pace.value)}
                      aria-pressed={isActive}
                      className={`rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                        isActive
                          ? 'border-[#3B82F6] bg-[#3B82F6]/15 text-white shadow-xs'
                          : 'border-[#2A2A30] bg-[#1C1C20] text-[#9CA3AF] hover:border-[#3A3A42] hover:text-white'
                      }`}
                    >
                      <div className={`text-xs font-bold ${isActive ? 'text-[#60A5FA]' : 'text-white'}`}>
                        {pace.label}
                      </div>
                      <div className="text-[9px] text-[#71717A] mt-0.5">{pace.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 1-Click Action Button */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                className="w-full justify-center py-2.5 text-xs font-bold cursor-pointer rounded-xl"
                disabled={loadingAgent}
                icon={<Wand2 className={`w-4 h-4 ${loadingAgent ? 'animate-spin' : ''}`} />}
                onClick={onRunAgent}
              >
                {loadingAgent ? 'AI Agent Synthesizing Monologue...' : '⚡ 1-Click Create with AI Agent'}
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'pacing' && (
          <div className="flex flex-col gap-5 pt-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">
                Video Duration &amp; Reel Target
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  {
                    label: '15 Seconds (Viral Hook)',
                    desc: 'Optimized for instant swipe retention and rapid punchlines',
                    value: '15 seconds',
                    badge: 'Shorts & TikTok',
                  },
                  {
                    label: '30 Seconds (Impact Monologue)',
                    desc: 'Balanced narrative: Hook, emotional buildup, and strong CTA',
                    value: '30 seconds',
                    badge: 'Recommended',
                  },
                  {
                    label: '60 Seconds (Cinematic Deep Focus)',
                    desc: 'Full cinematic arc with deep stoic reflections and orchestral peak',
                    value: '60 seconds',
                    badge: 'High Watch Time',
                  },
                ].map((item) => {
                  const isSelected = targetLength === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => onTargetLengthChange(item.value)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                        isSelected
                          ? 'border-[#3B82F6] bg-[#3B82F6]/15 text-white'
                          : 'border-[#2A2A30] bg-[#1C1C20] text-[#9CA3AF] hover:border-[#3A3A42] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isSelected ? 'text-[#60A5FA]' : 'text-white'}`}>
                          {item.label}
                        </span>
                        <span className="text-[9px] font-mono-studio px-1.5 py-0.5 rounded bg-white/10 text-white/80 border border-white/15">
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#71717A] leading-relaxed">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Words Estimate */}
            <div className="p-3 rounded-xl bg-[#1C1C20] border border-[#2A2A30] flex items-center justify-between">
              <span className="text-xs text-[#9CA3AF]">Estimated Word Count</span>
              <span className="text-xs font-mono font-bold text-white">
                {targetLength.startsWith('15') ? '35–45 words' : targetLength.startsWith('30') ? '70–90 words' : '140–180 words'}
              </span>
            </div>
          </div>
        )}

        {activeTab === 'voice' && (
          <div className="flex flex-col gap-5 pt-1">
            {/* Voice Profile Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">
                Neural TTS Voice Profile
              </label>
              <CustomSelect
                value={selectedVoice}
                onChange={(val) => onVoiceChange?.(val)}
                options={voiceOptions}
                icon={<Mic className="w-3.5 h-3.5 text-[#60A5FA]" />}
                buttonClassName="bg-[#1C1C20] border-[#2A2A30] hover:border-[#3B82F6]/50 text-xs text-white"
                menuClassName="bg-[#1C1C20] border-[#2A2A30]"
              />
            </div>

            {/* Test Voice Button */}
            {onTestVoice && selectedVoice && (
              <button
                type="button"
                onClick={() => onTestVoice(selectedVoice)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#1C1C20] hover:bg-[#26262C] border border-[#2A2A30] hover:border-[#3B82F6]/50 text-xs font-semibold text-white transition-all cursor-pointer"
              >
                {testingVoiceId === selectedVoice ? (
                  <>
                    <Radio className="w-4 h-4 animate-spin text-[#60A5FA]" />
                    <span>Synthesizing Sample...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-[#60A5FA]" />
                    <span>Test Voice Sample</span>
                  </>
                )}
              </button>
            )}

            {/* Voice Level Slider (Matching Right Pane Sliders) */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[#26262B]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A1A1AA]">Voice Gain</span>
                <span className="font-mono text-white font-semibold">{voiceVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={voiceVolume}
                onChange={(e) => setVoiceVolume(Number(e.target.value))}
                className="w-full h-1 bg-[#26262B] rounded-lg appearance-none cursor-pointer accent-[#3B82F6]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAgentCreatorPane;
