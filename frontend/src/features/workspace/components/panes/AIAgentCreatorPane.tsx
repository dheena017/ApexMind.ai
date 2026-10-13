import React from 'react';
import { Wand2, FileText, Plus, Cpu, Compass, Mic, Volume2, Radio } from 'lucide-react';
import { Button, CustomSelect } from '@/src/shared/ui/common';
import { VoiceProfile } from '../../types';

export const AI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Ultra Fast)' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Cinematic Scripting)' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite (Lightweight)' },
  { id: 'gemini-flash-latest', name: 'Gemini Flash Latest' },
  { id: 'gemini-pro-latest', name: 'Gemini Pro Latest' },
];

export const CATEGORY_OPTIONS = [
  { value: 'Stoic Mindset & Discipline', label: 'Stoic Mindset & Discipline' },
  { value: 'Morning Energy & Grit', label: 'Morning Energy & Grit' },
  { value: 'Fitness & Power', label: 'Fitness & Power' },
  { value: 'Financial Freedom', label: 'Financial Freedom' },
  { value: 'Dark Psychology & Focus', label: 'Dark Psychology & Focus' },
  { value: 'Warrior Mentality & Resilience', label: 'Warrior Mentality & Resilience' },
];

export const DEFAULT_VOICES: VoiceProfile[] = [
  { id: 'Fenrir', name: 'Fenrir', gender: 'Male', style: 'Deep, Powerful, Stoic Leader', speed: '0.95x' },
  { id: 'Kore', name: 'Kore', gender: 'Female', style: 'Clear, Inspiring, Authoritative', speed: '1.0x' },
  { id: 'Puck', name: 'Puck', gender: 'Male', style: 'Energetic, High-Octane Motivational', speed: '1.05x' },
  { id: 'Zephyr', name: 'Zephyr', gender: 'Female', style: 'Smooth, Calming Wisdom & Meditation', speed: '0.9x' },
  { id: 'Charon', name: 'Charon', gender: 'Male', style: 'Grit & Relentless Focus', speed: '1.0x' },
];

export interface AIAgentCreatorPaneProps {
  agentPrompt: string;
  onPromptChange: (val: string) => void;
  category: string;
  onCategoryChange: (cat: string) => void;
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

export const AIAgentCreatorPane: React.FC<AIAgentCreatorPaneProps> = ({
  agentPrompt,
  onPromptChange,
  category,
  onCategoryChange,
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
  const currentModel = propModel || 'gemini-2.5-flash';
  const voiceList = voices && voices.length > 0 ? voices : DEFAULT_VOICES;
  const voiceOptions = voiceList.map((v) => ({
    value: v.id || v.name,
    label: `${v.name} · ${v.style}`,
  }));

  return (
    <div className="flex flex-col font-sans-studio text-[#E5E5E5] space-y-3">
      {/* ── Top Header Bar ────────────────────────────────────────────── */}
      <div className="flex w-full items-center justify-between gap-2 rounded-xl border border-[#2F2F2F] bg-[#121212]/90 px-3 py-2.5 shadow-[0_1px_0_rgba(255,255,255,0.02)] backdrop-blur-sm shrink-0">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-sm font-bold text-white tracking-tight">AI Agent Creator</h2>
        </div>

        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          {onStartNewVideo && (
            <button
              type="button"
              onClick={onStartNewVideo}
              className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#1E1E1E] transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-transparent hover:border-[#2F2F2F]"
              title="Start a fresh empty project"
            >
              <Plus className="w-4 h-4 text-[#60A5FA]" />
              <span className="hidden sm:inline">New</span>
            </button>
          )}

          {onSwitchToEditor && (
            <button
              type="button"
              onClick={onSwitchToEditor}
              className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#1E1E1E] transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-transparent hover:border-[#2F2F2F]"
              title="Switch to Script & Subtitles"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Script Editor</span>
            </button>
          )}
        </div>
      </div>

      {/* ── AI Agent 1-Click Creator Main Container (Website Theme) ── */}
      <div className="flex flex-col p-4 rounded-2xl bg-[#141414] border border-[#2F2F2F] space-y-4 animate-fade-in">
        <div className="space-y-3.5">
          {/* Topic / Motivation Prompt Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-[#9CA3AF] uppercase tracking-wider block">
              Video Topic or Motivation Prompt
            </label>
            <div className="overflow-visible rounded-xl border border-[#2F2F2F] bg-[#0A0A0A] transition-colors focus-within:border-[#3B82F6]/60 focus-within:ring-1 focus-within:ring-[#3B82F6]/20">
              <textarea
                value={agentPrompt}
                onChange={(e) => onPromptChange(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-t-xl bg-transparent p-3 text-xs leading-relaxed text-white outline-none placeholder:text-[#525252]"
                placeholder="e.g. Monologue about silent discipline, early mornings, and relentless consistency..."
              />
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#2F2F2F] px-2.5 py-2">
                <span className="flex items-center gap-1.5 text-[10px] text-[#737373]">
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
                  buttonClassName="max-w-full"
                />
              </div>
            </div>
          </div>

          {/* Niche Category Dropdown */}
          <div className="space-y-1.5">
            <CustomSelect
              label="Niche Category"
              labelClassName="text-[10px] font-extrabold text-[#9CA3AF] uppercase tracking-wider block"
              value={category}
              onChange={onCategoryChange}
              options={CATEGORY_OPTIONS}
              icon={<Compass className="w-3.5 h-3.5 text-[#60A5FA]" />}
            />
          </div>

          {/* AI Voice Persona Dropdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-[#9CA3AF] uppercase tracking-wider block">
                AI Voiceover Persona
              </span>
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
            />
          </div>

          {/* Script Pacing & Target Duration */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold text-[#9CA3AF] uppercase tracking-wider block">
              Pacing & Reel Target Length
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '15s Viral', desc: 'Fast Hook' },
                { label: '30s Impact', desc: 'High Energy' },
                { label: '60s Cinema', desc: 'Deep Monologue' },
              ].map((pace, idx) => (
                <div
                  key={pace.label}
                  className={`rounded-xl border p-2 text-center cursor-pointer transition-all ${
                    idx === 1
                      ? 'border-[#3B82F6]/60 bg-[#3B82F6]/10 text-white shadow-xs'
                      : 'border-[#262626] bg-[#0E0E0E] text-[#9CA3AF] hover:border-[#404040] hover:text-white'
                  }`}
                >
                  <div className="text-[11px] font-bold">{pace.label}</div>
                  <div className="text-[9px] text-[#6B7280]">{pace.desc}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* 1-Click Create Action Button */}
        <div className="pt-2">
          <Button
            variant="primary"
            size="sm"
            className="w-full justify-center py-3 text-xs font-bold cursor-pointer"
            disabled={loadingAgent}
            icon={<Wand2 className={`w-4 h-4 ${loadingAgent ? 'animate-spin' : ''}`} />}
            onClick={onRunAgent}
          >
            {loadingAgent ? 'AI Agent Creating Monologue, Voiceover & Subtitles...' : '⚡ 1-Click Create with AI Agent'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIAgentCreatorPane;
