import React, { useState, useEffect } from 'react';
import { Volume2, Mic, Music } from 'lucide-react';
import { VoiceProfile, MusicTrack } from '../../types';
import { CustomSelect } from '@/src/shared/ui/CustomSelect';

export interface AudioCompoundInspectorProps {
  audioType: 'voice' | 'music';
  voices: VoiceProfile[];
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  onTestVoice: (voiceId: string) => void;
  testingVoiceId: string | null;

  musicTracks: MusicTrack[];
  selectedMusic: string;
  onSelectMusic: (musicId: string) => void;

  volume: number;
  onVolumeChange?: (volume: number) => void;
  playbackRate?: number;
  onPlaybackRateChange?: (rate: number) => void;
  duration?: number;
}

export const AudioCompoundInspector: React.FC<AudioCompoundInspectorProps> = ({
  audioType,
  voices,
  selectedVoice,
  onSelectVoice,
  onTestVoice,
  testingVoiceId,
  musicTracks,
  selectedMusic,
  onSelectMusic,
  volume = 1,
  onVolumeChange,
  playbackRate = 1,
  onPlaybackRateChange,
  duration = 12.1,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'audio' | 'speed' | 'time'>('audio');

  // Audio Tab States (Image 5)
  const [localVolume, setLocalVolume] = useState(Math.round(volume * 100));

  // Sync localVolume when parent volume prop changes (e.g. from VideoPreviewPane controls)
  useEffect(() => {
    setLocalVolume(Math.round(volume * 100));
  }, [volume]);

  const [fadeIn, setFadeIn] = useState(0.0);
  const [fadeOut, setFadeOut] = useState(0.0);
  const [noiseReduction, setNoiseReduction] = useState(false);

  // Format mm:ss.ms
  const formatTimeDigital = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none">
      {/* ── Subtabs Header Bar (Exactly matching Image 5) ── */}
      <div className="flex items-center gap-6 px-4 pt-2.5 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar">
        {(['audio', 'speed', 'time'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveSubTab(tab)}
            className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
              activeSubTab === tab
                ? 'text-white border-white'
                : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {/* TAB 1: Audio (Image 5) */}
        {activeSubTab === 'audio' && (
          <div className="flex flex-col gap-6 pt-1">
            {/* Audio Profile Selector */}
            {audioType === 'voice' ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">
                  Neural TTS Voice Profile
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <CustomSelect
                      value={selectedVoice}
                      onChange={onSelectVoice}
                      options={voices.map((v) => ({
                        value: v.id,
                        label: `${v.name} (${v.gender} • ${v.style})`,
                        description: `${v.gender} • ${v.style}`,
                        badge: v.speed || '1.0x',
                      }))}
                      icon={<Mic className="w-3.5 h-3.5 text-[#60A5FA]" />}
                      placeholder="Select voice profile..."
                      buttonClassName="bg-[#1C1C20] border-[#2A2A30] hover:border-[#3B82F6]/50"
                      menuClassName="bg-[#1C1C20] border-[#2A2A30]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onTestVoice(selectedVoice)}
                    disabled={testingVoiceId === selectedVoice}
                    className="p-2.5 rounded-xl bg-[#25252C] hover:bg-[#30303A] text-white border border-[#3E3E48] cursor-pointer shrink-0"
                    title="Preview voice clip"
                  >
                    <Volume2 className="w-4 h-4 text-[#3B82F6]" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <CustomSelect
                  label="Soundtrack Audio Bed"
                  labelClassName="text-[10px] text-[#71717A] uppercase font-bold tracking-wider mb-1.5 block"
                  value={selectedMusic}
                  onChange={onSelectMusic}
                  options={musicTracks.map((m) => ({
                    value: m.id,
                    label: `${m.title} (${m.genre})`,
                    description: m.genre,
                    badge: m.duration,
                  }))}
                  icon={<Music className="w-3.5 h-3.5 text-[#A855F7]" />}
                  placeholder="Select soundtrack..."
                  buttonClassName="bg-[#1C1C20] border-[#2A2A30] hover:border-[#3B82F6]/50"
                  menuClassName="bg-[#1C1C20] border-[#2A2A30]"
                />
              </div>
            )}

            {/* Volume Slider (Image 5) */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#A1A1AA]">Volume</span>
                <span className="font-mono-studio text-white font-medium">{localVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={localVolume}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setLocalVolume(val);
                  onVolumeChange?.(val / 100);
                }}
                className="w-full accent-[#3B82F6] cursor-pointer"
              />
            </div>

            {/* Fade In Slider (Image 5) */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#A1A1AA]">Fade In</span>
                <span className="font-mono-studio text-white font-medium">{fadeIn.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={fadeIn}
                onChange={(e) => setFadeIn(Number(e.target.value))}
                className="w-full accent-[#3B82F6] cursor-pointer"
              />
            </div>

            {/* Fade Out Slider (Image 5) */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#A1A1AA]">Fade Out</span>
                <span className="font-mono-studio text-white font-medium">{fadeOut.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={fadeOut}
                onChange={(e) => setFadeOut(Number(e.target.value))}
                className="w-full accent-[#3B82F6] cursor-pointer"
              />
            </div>

            {/* Noise Reduction Toggle (Image 5) */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-[#A1A1AA]">Noise reduction</span>
              <button
                type="button"
                onClick={() => setNoiseReduction(!noiseReduction)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                  noiseReduction ? 'bg-[#3B82F6]' : 'bg-[#2A2A32]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    noiseReduction ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Speed */}
        {activeSubTab === 'speed' && (
          <div className="flex flex-col gap-3 pt-1">
            <span className="text-xs text-[#71717A]">Playback Speed Multiplier</span>
            <div className="grid grid-cols-3 gap-2">
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => onPlaybackRateChange?.(rate)}
                  className={`py-2 rounded-xl text-xs font-mono-studio transition-all cursor-pointer border ${
                    playbackRate === rate
                      ? 'bg-[#3B82F6] text-white border-transparent font-bold'
                      : 'bg-[#1C1C20] border-[#2A2A30] text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Time */}
        {activeSubTab === 'time' && (
          <div className="flex flex-col items-center gap-3 pt-1">
            <span className="text-xs text-[#71717A]">Audio Track Length</span>
            <div className="px-5 py-2.5 rounded-xl bg-[#1C1C20] border border-[#2A2A30] font-mono-studio text-white font-bold">
              {formatTimeDigital(duration > 0 ? duration : 12.1)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioCompoundInspector;
