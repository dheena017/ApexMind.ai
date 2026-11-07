/**
 * frontend/src/features/workspace/components/panes/ai-agent-creator/VoiceTab.tsx
 */

import React, { useState } from 'react';
import { Mic, Check, Volume2, Sliders, Sparkles, HardDrive, Wifi, Cpu, Loader2 } from 'lucide-react';

export interface VoiceOption {
  id: string;
  name: string;
  gender: string;
  style: string;
  provider?: string;
  language?: string;
  isOffline?: boolean;
}

export interface VoiceTabProps {
  voices: VoiceOption[];
  selectedVoice: string;
  onVoiceChange?: (voiceId: string) => void;
  testingVoiceId?: string | null;
  onTestVoice?: (voiceId: string) => void;
  selectedProvider?: string;
  onProviderChange?: (providerId: string) => void;
  selectedPreset?: string;
  onPresetChange?: (preset: string) => void;
  speed?: number;
  onSpeedChange?: (speed: number) => void;
  pitch?: number;
  onPitchChange?: (pitch: number) => void;
  jobProgress?: {
    phase: string;
    progressPercent: number;
    message?: string;
  } | null;
}

const DELIVERY_PRESETS = [
  { id: 'cinematic_narrator', label: 'Cinematic Narrator', desc: 'Resonant, steady, cinematic pacing' },
  { id: 'motivational', label: 'Motivational', desc: 'Inspiring, punchy, confident tone' },
  { id: 'calm', label: 'Calm & Reflective', desc: 'Soft, meditative, natural breath' },
  { id: 'dramatic', label: 'Dramatic & Intense', desc: 'Deep pauses, emotive gravity' },
  { id: 'energetic', label: 'High Energy', desc: 'Fast-paced, vibrant, viral style' },
];

export const VoiceTab: React.FC<VoiceTabProps> = ({
  voices,
  selectedVoice,
  onVoiceChange,
  testingVoiceId,
  onTestVoice,
  selectedProvider = 'all',
  onProviderChange,
  selectedPreset = 'cinematic_narrator',
  onPresetChange,
  speed = 1.0,
  onSpeedChange,
  pitch = 0.0,
  onPitchChange,
  jobProgress,
}) => {
  const [internalProvider, setInternalProvider] = useState<string>(selectedProvider);
  const [internalPreset, setInternalPreset] = useState<string>(selectedPreset);
  const [internalSpeed, setInternalSpeed] = useState<number>(speed);
  const [internalPitch, setInternalPitch] = useState<number>(pitch);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const activeProvider = onProviderChange ? selectedProvider : internalProvider;
  const activePreset = onPresetChange ? selectedPreset : internalPreset;
  const activeSpeed = onSpeedChange ? speed : internalSpeed;
  const activePitch = onPitchChange ? pitch : internalPitch;

  const handleProviderSelect = (p: string) => {
    if (onProviderChange) onProviderChange(p);
    setInternalProvider(p);
  };

  const handlePresetSelect = (presetId: string) => {
    if (onPresetChange) onPresetChange(presetId);
    setInternalPreset(presetId);
  };

  const handleSpeedChange = (val: number) => {
    if (onSpeedChange) onSpeedChange(val);
    setInternalSpeed(val);
  };

  const handlePitchChange = (val: number) => {
    if (onPitchChange) onPitchChange(val);
    setInternalPitch(val);
  };

  const filteredVoices = voices.filter((v) => {
    if (activeProvider === 'all') return true;
    if (activeProvider === 'piper') return v.provider === 'piper' || v.isOffline;
    if (activeProvider === 'edge_tts') return v.provider === 'edge_tts' || (!v.isOffline && v.provider !== 'pyttsx3');
    if (activeProvider === 'pyttsx3') return v.provider === 'pyttsx3';
    return true;
  });

  return (
    <div className="space-y-3.5">
      {/* Job Progress Strip (if active) */}
      {jobProgress && (
        <div className="p-3 rounded-xl bg-[#141C2E] border border-[#2563EB]/40 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#93C5FD]">
            <div className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#3B82F6]" />
              <span>Voice Generation in Progress ({jobProgress.phase})</span>
            </div>
            <span className="font-mono text-white">{jobProgress.progressPercent}%</span>
          </div>
          <div className="w-full bg-[#18233C] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#3B82F6] h-full transition-all duration-300 rounded-full"
              style={{ width: `${Math.max(5, jobProgress.progressPercent)}%` }}
            />
          </div>
          {jobProgress.message && (
            <p className="text-[10px] text-zinc-300 truncate">{jobProgress.message}</p>
          )}
        </div>
      )}

      {/* Provider Filter Tabs */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-[#9CA3AF] px-0.5">
          <span>Voice Provider & Engine</span>
        </div>
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#141418] border border-[#24242A]">
          {[
            { id: 'all', label: 'All', icon: Sparkles },
            { id: 'piper', label: 'Piper (Offline)', icon: HardDrive },
            { id: 'edge_tts', label: 'Edge-TTS', icon: Wifi },
            { id: 'pyttsx3', label: 'System OS', icon: Cpu },
          ].map((item) => {
            const isSelected = activeProvider === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleProviderSelect(item.id)}
                className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white hover:bg-[#1E1E24]'
                }`}
              >
                <Icon className="w-3 h-3 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Delivery Presets Selection */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-[#9CA3AF] px-0.5">
          <span>Delivery Preset</span>
          <span className="text-[9px] font-mono-studio text-zinc-500 uppercase">Stage 2 Profile</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {DELIVERY_PRESETS.map((p) => {
            const isSelected = activePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetSelect(p.id)}
                className={`p-2 rounded-xl border text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#1A2234] border-[#3B82F6]/50'
                    : 'bg-[#18181C] border-[#24242A] hover:border-[#383842] hover:bg-[#202026]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                    {p.label}
                  </span>
                  {isSelected && <Check className="w-3 h-3 text-[#60A5FA]" />}
                </div>
                <p className={`text-[9px] truncate mt-0.5 ${isSelected ? 'text-[#C4D8FF]' : 'text-zinc-500'}`}>
                  {p.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Speed & Pitch Drawer Toggle */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full p-2 rounded-xl bg-[#141418] border border-[#24242A] hover:border-[#383842] text-[11px] text-zinc-300 hover:text-white transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>Speed & Pitch Fine-Tuning</span>
          </div>
          <span className="font-mono text-[10px] text-[#60A5FA]">
            {activeSpeed.toFixed(2)}x / {activePitch >= 0 ? `+${activePitch}%` : `${activePitch}%`}
          </span>
        </button>

        {showAdvanced && (
          <div className="p-3 rounded-xl bg-[#16161A] border border-[#27272A] space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span>Speaking Rate (Speed)</span>
                <span className="font-mono text-white font-bold">{activeSpeed.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.50"
                step="0.05"
                value={activeSpeed}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                className="w-full accent-[#3B82F6] h-1.5 bg-[#24242A] rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span>Voice Pitch</span>
                <span className="font-mono text-white font-bold">
                  {activePitch >= 0 ? `+${activePitch}%` : `${activePitch}%`}
                </span>
              </div>
              <input
                type="range"
                min="-20"
                max="20"
                step="2"
                value={activePitch}
                onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
                className="w-full accent-[#3B82F6] h-1.5 bg-[#24242A] rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Voice List */}
      <div className="space-y-2">
        <div className="text-[11px] text-[#9CA3AF] px-0.5">
          Select Narrator Voice ({filteredVoices.length} available)
        </div>
        <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
          {filteredVoices.map((v) => {
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
                      {v.isOffline && (
                        <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-[#102A18] text-[#4ADE80] border border-[#22C55E]/30">
                          Offline
                        </span>
                      )}
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
    </div>
  );
};

