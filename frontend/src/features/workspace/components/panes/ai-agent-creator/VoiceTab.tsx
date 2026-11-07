/**
 * frontend/src/features/workspace/components/panes/ai-agent-creator/VoiceTab.tsx
 */

import React from 'react';
import { Mic, Check, Volume2 } from 'lucide-react';

export interface VoiceOption {
  id: string;
  name: string;
  gender: string;
  style: string;
}

interface VoiceTabProps {
  voices: VoiceOption[];
  selectedVoice: string;
  onVoiceChange?: (voiceId: string) => void;
  testingVoiceId?: string | null;
  onTestVoice?: (voiceId: string) => void;
}

export const VoiceTab: React.FC<VoiceTabProps> = ({
  voices,
  selectedVoice,
  onVoiceChange,
  testingVoiceId,
  onTestVoice,
}) => {
  return (
    <div className="space-y-2.5">
      <div className="text-[11px] text-[#9CA3AF] px-0.5">
        Choose a narrator and preview the voice before generating.
      </div>
      <div className="space-y-2">
        {voices.map((v) => {
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
                  <p className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-[#C4D8FF]' : 'text-zinc-400'}`}>
                    {v.style}
                  </p>
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
  );
};

