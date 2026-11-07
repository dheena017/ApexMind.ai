/**
 * frontend/src/features/workspace/components/panes/AIAgentCreatorPane.tsx
 *
 * Modular AI Script Studio Pane (Milestone 4).
 * Decomposed into PromptTab, StyleTab, VoiceTab, and Publishing controls.
 */

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Wand2,
  Sparkles,
  Plus,
  Mic,
  Film,
  RefreshCw,
  ArrowLeftRight,
  AlertCircle,
  X,
  Share2,
} from 'lucide-react';
import { Button } from '@/src/shared/ui/common';
import { VoiceProfile } from '../../types';
import { workspaceApi } from '../../api/workspaceApi';
import { GenerationProfile } from '../../types/script';
import { PromptTab } from './ai-agent-creator/PromptTab';
import { StyleTab } from './ai-agent-creator/StyleTab';
import { VoiceTab } from './ai-agent-creator/VoiceTab';
import { VisualsTab } from './ai-agent-creator/VisualsTab';
import { PublishingTab } from './ai-agent-creator/PublishingTab';

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
  // Extended for Script Generation v2
  generationProfile?: GenerationProfile;
  onGenerationProfileChange?: (profile: GenerationProfile) => void;
  selectedAesthetic?: string;
  onAestheticChange?: (val: string) => void;
  selectedSubtitle?: string;
  onSubtitleChange?: (val: string) => void;
  selectedMusicMood?: string;
  onMusicMoodChange?: (val: string) => void;
  scriptId?: string;
  scenes?: any[];
}

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
  pipelineLabel,
  onRunAgent,
  tone: _propTone,
  onToneChange: _onToneChange,
  onSwitchToEditor,
  onStartNewVideo,
  selectedModel,
  onModelChange,
  generationProfile = 'motivational_reel',
  onGenerationProfileChange,
  selectedAesthetic: propAesthetic,
  onAestheticChange: propOnAestheticChange,
  selectedSubtitle: propSubtitle,
  onSubtitleChange: propOnSubtitleChange,
  selectedMusicMood: propMusicMood,
  onMusicMoodChange: propOnMusicMoodChange,
  scriptId,
  scenes,
}) => {
  const [activeTab, setActiveTab] = useState<'prompt' | 'style' | 'voice' | 'visuals' | 'publish'>('prompt');
  const [liveVoices, setLiveVoices] = useState<VoiceProfile[]>(voices);
  const [internalProfile, setInternalProfile] = useState<GenerationProfile>(generationProfile);
  const [internalAesthetic, setInternalAesthetic] = useState<string>('dark_cinematic');
  const [internalSubtitle, setInternalSubtitle] = useState<string>('hormozi');
  const [internalMusicMood, setInternalMusicMood] = useState<string>('orchestral');
  const [enabledPlatforms, setEnabledPlatforms] = useState<Record<string, boolean>>({
    youtube: true,
    instagram: true,
    facebook: true,
  });

  const currentProfile = onGenerationProfileChange ? generationProfile : internalProfile;
  const handleProfileChange = (p: GenerationProfile) => {
    if (onGenerationProfileChange) {
      onGenerationProfileChange(p);
    } else {
      setInternalProfile(p);
    }
  };

  const currentAesthetic = propAesthetic ?? internalAesthetic;
  const handleAestheticChange = (val: string) => {
    if (propOnAestheticChange) propOnAestheticChange(val);
    setInternalAesthetic(val);
  };

  const currentSubtitle = propSubtitle ?? internalSubtitle;
  const handleSubtitleChange = (val: string) => {
    if (propOnSubtitleChange) propOnSubtitleChange(val);
    setInternalSubtitle(val);
  };

  const currentMusicMood = propMusicMood ?? internalMusicMood;
  const handleMusicMoodChange = (val: string) => {
    if (propOnMusicMoodChange) propOnMusicMoodChange(val);
    setInternalMusicMood(val);
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

      {/* ── Tab Segmented Control ── */}
      <div className="p-2.5 bg-[#121215] border-b border-[#24242A] shrink-0">
        <div className="grid grid-cols-5 gap-1 p-1 bg-[#18181C] rounded-xl border border-[#24242A]">
          <button
            type="button"
            onClick={() => setActiveTab('prompt')}
            className={`flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none min-w-0 ${
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
            className={`flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none min-w-0 ${
              activeTab === 'style'
                ? 'bg-[#2563EB] text-white shadow-xs border border-[#60A5FA]/40 font-bold'
                : 'text-[#9CA3AF] hover:text-white hover:bg-[#202026] border border-transparent'
            }`}
          >
            <Film className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'style' ? 'text-white' : 'text-zinc-500'}`} />
            <span className="truncate">Style</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none min-w-0 ${
              activeTab === 'voice'
                ? 'bg-[#2563EB] text-white shadow-xs border border-[#60A5FA]/40 font-bold'
                : 'text-[#9CA3AF] hover:text-white hover:bg-[#202026] border border-transparent'
            }`}
          >
            <Mic className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'voice' ? 'text-white' : 'text-zinc-500'}`} />
            <span className="truncate">Voice</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('visuals')}
            className={`flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none min-w-0 ${
              activeTab === 'visuals'
                ? 'bg-[#2563EB] text-white shadow-xs border border-[#60A5FA]/40 font-bold'
                : 'text-[#9CA3AF] hover:text-white hover:bg-[#202026] border border-transparent'
            }`}
          >
            <Film className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'visuals' ? 'text-white' : 'text-zinc-500'}`} />
            <span className="truncate">Visuals</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('publish')}
            className={`flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none min-w-0 ${
              activeTab === 'publish'
                ? 'bg-[#2563EB] text-white shadow-xs border border-[#60A5FA]/40 font-bold'
                : 'text-[#9CA3AF] hover:text-white hover:bg-[#202026] border border-transparent'
            }`}
          >
            <Share2 className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'publish' ? 'text-white' : 'text-zinc-500'}`} />
            <span className="truncate">Channels</span>
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
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5">
        {activeTab === 'prompt' && (
          <PromptTab
            prompt={agentPrompt}
            onPromptChange={onPromptChange}
            category={category}
            onCategoryChange={onCategoryChange}
            targetLength={targetLength}
            onTargetLengthChange={onTargetLengthChange}
            aspectRatio={aspectRatio}
            onAspectRatioChange={(r) => onAspectRatioChange?.(r)}
            selectedModel={selectedModel}
            onModelChange={onModelChange}
            generationProfile={currentProfile}
            onGenerationProfileChange={handleProfileChange}
          />
        )}

        {activeTab === 'style' && (
          <StyleTab
            selectedAesthetic={currentAesthetic}
            onAestheticChange={handleAestheticChange}
            selectedSubtitle={currentSubtitle}
            onSubtitleChange={handleSubtitleChange}
            selectedMusicMood={currentMusicMood}
            onMusicMoodChange={handleMusicMoodChange}
          />
        )}

        {activeTab === 'voice' && (
          <VoiceTab
            voices={liveVoices}
            selectedVoice={selectedVoice}
            onVoiceChange={onVoiceChange}
            testingVoiceId={testingVoiceId}
            onTestVoice={onTestVoice}
          />
        )}

        {activeTab === 'visuals' && (
          <VisualsTab
            scriptId={scriptId}
            scenes={scenes}
            aspectRatio={aspectRatio}
          />
        )}

        {activeTab === 'publish' && (
          <PublishingTab
            enabledPlatforms={enabledPlatforms}
            onTogglePlatform={togglePlatform}
          />
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
              <span>
                {currentProfile === 'cinematic_3d_story'
                  ? 'Generate Cinematic 3D Script'
                  : 'Generate Viral Reel Script & Direct'}
              </span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AIAgentCreatorPane;
