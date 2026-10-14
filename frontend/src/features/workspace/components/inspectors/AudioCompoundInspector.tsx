import React, { useState, useEffect } from 'react';
import {
  Volume2, Mic, Music, Headphones, Sliders, Radio,
  Play, Square, Download, Zap, RefreshCw,
  VolumeX, Volume1, ArrowRight, BarChart2, Clock,
  Scissors, Layers, SkipBack, SkipForward, Check,
} from 'lucide-react';
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

  volume?: number;
  onVolumeChange?: (volume: number) => void;
  playbackRate?: number;
  onPlaybackRateChange?: (rate: number) => void;
  duration?: number;
}

const REVERB_PRESETS = [
  { id: 'dry', label: 'Dry / Studio', desc: 'Zero artificial acoustic reflection' },
  { id: 'room', label: 'Warm Studio Room', desc: 'Subtle acoustic warmth & intimacy' },
  { id: 'hall', label: 'Concert Hall', desc: 'Expansive epic depth' },
  { id: 'cathedral', label: 'Cathedral', desc: 'Long dramatic reverberation tail' },
  { id: 'space', label: 'Cosmic Space', desc: 'Infinite ethereal atmosphere' },
];

const EQ_PRESETS = [
  { id: 'flat', label: 'Flat EQ', bass: 0, mid: 0, treble: 0, desc: 'Uncolored natural balance' },
  { id: 'vocal', label: 'Vocal Clarity', bass: -2, mid: 4, treble: 2, desc: 'Crisp speech articulation' },
  { id: 'podcast', label: 'Warm Podcast', bass: 3, mid: 2, treble: 1, desc: 'Rich broadcast warmth' },
  { id: 'bass', label: 'Bass Pumping', bass: 6, mid: 0, treble: -1, desc: 'Deep low-end rumble' },
  { id: 'bright', label: 'Air & Sparkle', bass: -1, mid: 1, treble: 5, desc: 'High frequency shimmer' },
  { id: 'lofi', label: 'Radio Lo-Fi', bass: -6, mid: 5, treble: -4, desc: 'Vintage telephone effect' },
];

const SFX_ITEMS = [
  { id: 'whoosh', name: 'Whoosh Hit', desc: 'Fast cinematic transition', audioUrl: 'https://cdn.freesound.org/previews/387/387232_1474204-lq.mp3' },
  { id: 'riser', name: 'Bass Drop', desc: 'Deep sub impact', audioUrl: 'https://cdn.freesound.org/previews/442/442943_5121236-lq.mp3' },
  { id: 'bell', name: 'Chime Ding', desc: 'Positive attention bell', audioUrl: 'https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3' },
  { id: 'pop', name: 'Bubble Pop', desc: 'Light interface pop', audioUrl: 'https://cdn.freesound.org/previews/242/242501_4414128-lq.mp3' },
];

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

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
  duration = 15,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'audio' | 'eq' | 'effects' | 'sfx' | 'time'>('audio');

  // Volume & Dynamics
  const [localVolume, setLocalVolume] = useState(Math.round(volume * 100));
  const [isMuted, setIsMuted] = useState(false);
  const [voicePitch, setVoicePitch] = useState(0); // -12 to +12 semitones
  const [speakingRate, setSpeakingRate] = useState(playbackRate || 1);

  // Equalizer
  const [activeEQ, setActiveEQ] = useState('flat');
  const [bass, setBass] = useState(0);
  const [mid, setMid] = useState(0);
  const [treble, setTreble] = useState(0);

  // Effects & Spatialization
  const [reverb, setReverb] = useState('dry');
  const [reverbMix, setReverbMix] = useState(25);
  const [fadeIn, setFadeIn] = useState(0.0);
  const [fadeOut, setFadeOut] = useState(0.0);
  const [pan, setPan] = useState(0); // -100 to +100
  const [stereoWidth, setStereoWidth] = useState(100);
  const [noiseReduction, setNoiseReduction] = useState(false);
  const [noiseReductionLevel, setNoiseReductionLevel] = useState(60);
  const [ducking, setDucking] = useState(false);
  const [duckingLevel, setDuckingLevel] = useState(40);
  const [compression, setCompression] = useState(false);

  // Time & Trimming
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(duration > 0 ? duration : 15);
  const [loopAudio, setLoopAudio] = useState(true);

  // SFX preview audio state
  const [previewingSfx, setPreviewingSfx] = useState<string | null>(null);

  useEffect(() => {
    setLocalVolume(Math.round(volume * 100));
  }, [volume]);

  useEffect(() => {
    if (duration > 0) setTrimEnd(duration);
  }, [duration]);

  // Broadcast audio effects and filter parameters to workspace audio graph
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('workspace:audio-effects-change', {
        detail: {
          audioType,
          volume: isMuted ? 0 : localVolume / 100,
          fadeIn,
          fadeOut,
          noiseReduction,
          noiseReductionLevel,
          reverb,
          reverbMix,
          compression,
          stereoWidth,
          pan,
          ducking,
          duckingLevel,
          bass,
          mid,
          treble,
        },
      })
    );
  }, [
    audioType, isMuted, localVolume, fadeIn, fadeOut, noiseReduction, noiseReductionLevel,
    reverb, reverbMix, compression, stereoWidth, pan, ducking, duckingLevel, bass, mid, treble,
  ]);

  const handleApplyVolume = (newVol: number) => {
    const val = Math.max(0, Math.min(200, newVol));
    setLocalVolume(val);
    onVolumeChange?.(val / 100);
    if (val > 0 && isMuted) setIsMuted(false);
  };

  const handleApplyEQ = (preset: typeof EQ_PRESETS[0]) => {
    setActiveEQ(preset.id);
    setBass(preset.bass);
    setMid(preset.mid);
    setTreble(preset.treble);
  };

  const handlePlaySfxPreview = (sfx: typeof SFX_ITEMS[0]) => {
    setPreviewingSfx(sfx.id);
    const audio = new Audio(sfx.audioUrl);
    audio.volume = 0.8;
    audio.play().catch(() => {});
    audio.onended = () => setPreviewingSfx(null);
  };

  const tabs = ['audio', 'eq', 'effects', 'sfx', 'time'] as const;

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none">
      {/* ── Subtabs Header Bar ── */}
      <div className="flex items-center gap-2.5 px-3 pt-2.5 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveSubTab(tab)}
            className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
              activeSubTab === tab
                ? 'text-white border-[#3B82F6]'
                : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
            }`}
          >
            {tab === 'audio' ? 'Mix & Channel' : tab === 'sfx' ? 'SFX Board' : tab}
          </button>
        ))}
      </div>

      {/* ── Tab Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">

        {/* ── AUDIO MIX & CHANNEL TAB ── */}
        {activeSubTab === 'audio' && (
          <div className="flex flex-col gap-3.5 pt-0.5">
            {/* Real-time Spectrum Bar Visualizer */}
            <div className="p-3 rounded-xl bg-[#0D0D10] border border-[#2A2A30] flex flex-col gap-2">
              <div className="flex items-center justify-between text-[10px] font-mono-studio text-[#71717A] uppercase font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {audioType === 'voice' ? 'Voice Track (A1)' : 'Soundtrack (A2)'} Spectrum
                </span>
                <span className="text-emerald-400 font-bold">{isMuted ? 'Muted' : `${localVolume}%`}</span>
              </div>
              <div className="h-10 flex items-end gap-1 px-1 bg-[#141418] rounded-lg p-1.5">
                {[18, 35, 62, 85, 45, 92, 70, 48, 80, 60, 95, 40, 75, 55, 30, 65, 88, 42, 70, 35].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-xs transition-all duration-150"
                    style={{
                      height: isMuted ? '4%' : `${Math.max(6, Math.min(100, Math.round(h * (localVolume / 100))))}%`,
                      background: isMuted
                        ? '#3F3F46'
                        : i % 2 === 0 ? 'linear-gradient(180deg, #3B82F6, #1D4ED8)' : 'linear-gradient(180deg, #10B981, #059669)',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Volume Gain Slider with Gain Boost (0-200%) */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A1A1AA] flex items-center gap-1.5 font-medium">
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                  Master Gain Boost
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={isMuted ? 0 : localVolume}
                    onChange={(e) => handleApplyVolume(Number(e.target.value))}
                    className="w-12 bg-[#121215] border border-[#2A2A30] rounded px-1.5 py-0.5 text-right font-mono-studio text-xs text-white outline-none"
                  />
                  <span className="text-[10px] text-[#71717A]">%</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={isMuted ? 0 : localVolume}
                onChange={(e) => handleApplyVolume(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    isMuted ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-[#141417] border-[#2A2A30] text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  {isMuted ? 'Unmute' : 'Mute Track'}
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyVolume(100)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#141417] border border-[#2A2A30] text-[#A1A1AA] hover:text-white cursor-pointer"
                >
                  100% (Unity)
                </button>
              </div>
            </div>

            {/* Voice / Music Selection Pickers */}
            {audioType === 'voice' ? (
              <div className="flex flex-col gap-2">
                <CustomSelect
                  label="Active Voice Profile"
                  labelClassName="text-[10px] text-[#71717A] uppercase font-bold tracking-wider mb-1 block"
                  value={selectedVoice}
                  onChange={(voiceId) => onSelectVoice(voiceId)}
                  options={voices.map((v) => ({
                    value: v.id,
                    label: `${v.name} (${v.gender} • ${v.style})`,
                    description: `${v.gender} • ${v.style}`,
                    badge: '24kHz',
                  }))}
                  icon={<Mic className="w-3.5 h-3.5 text-emerald-400" />}
                  placeholder="Select speech voice..."
                  buttonClassName="bg-[#1C1C20] border-[#2A2A30] hover:border-emerald-500/50"
                  menuClassName="bg-[#1C1C20] border-[#2A2A30]"
                />
                <button
                  type="button"
                  onClick={() => onTestVoice(selectedVoice)}
                  disabled={Boolean(testingVoiceId)}
                  className="w-full py-2 rounded-xl bg-[#1C1C20] hover:bg-[#25252C] border border-[#2A2A30] text-xs font-semibold text-[#D4D4D8] hover:text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Headphones className="w-3.5 h-3.5 text-emerald-400" />
                  {testingVoiceId === selectedVoice ? 'Auditioning Voice...' : 'Audition Sample Audio'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <CustomSelect
                  label="Soundtrack Music Track"
                  labelClassName="text-[10px] text-[#71717A] uppercase font-bold tracking-wider mb-1 block"
                  value={selectedMusic}
                  onChange={(trackId) => onSelectMusic(trackId)}
                  options={musicTracks.map((m) => ({
                    value: m.id,
                    label: `${m.title} (${m.genre})`,
                    description: m.genre,
                    badge: `${m.bpm} BPM`,
                  }))}
                  icon={<Music className="w-3.5 h-3.5 text-purple-400" />}
                  placeholder="Choose background track..."
                  buttonClassName="bg-[#1C1C20] border-[#2A2A30] hover:border-purple-500/50"
                  menuClassName="bg-[#1C1C20] border-[#2A2A30]"
                />
              </div>
            )}

            {/* Speaking Rate / Speed Multiplier */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#A1A1AA]">Audio Speed Velocity</span>
                <span className="font-mono-studio text-white font-bold">{playbackRate}x</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[0.75, 1, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => onPlaybackRateChange?.(rate)}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      playbackRate === rate
                        ? 'bg-[#3B82F6] border-transparent text-white'
                        : 'bg-[#141417] border-[#2A2A30] text-[#71717A] hover:text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── EQUALIZER (EQ) TAB ── */}
        {activeSubTab === 'eq' && (
          <div className="flex flex-col gap-3.5 pt-0.5">
            {/* EQ Presets */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">EQ Sound Profiles</span>
              <div className="grid grid-cols-2 gap-1.5">
                {EQ_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyEQ(preset)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      activeEQ === preset.id
                        ? 'bg-[#1E2A3A] border-[#3B82F6] text-white shadow-sm'
                        : 'bg-[#18181C] border-[#282830] text-[#A1A1AA] hover:bg-[#202026] hover:text-white'
                    }`}
                  >
                    <p className="text-xs font-bold text-white mb-0.5">{preset.label}</p>
                    <p className="text-[9px] text-[#71717A]">{preset.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 3-Band Parametric Sliders with Direct Numeric Inputs */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-3">
              <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">3-Band Frequency Equalizer</span>
              {[
                { label: 'Bass (Low 100Hz)', value: bass, setter: setBass, color: 'accent-amber-500' },
                { label: 'Mid (Vocals 1kHz)', value: mid, setter: setMid, color: 'accent-blue-500' },
                { label: 'Treble (Air 10kHz)', value: treble, setter: setTreble, color: 'accent-emerald-500' },
              ].map((band) => (
                <div key={band.label} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#A1A1AA]">{band.label}</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="-12"
                        max="12"
                        value={band.value}
                        onChange={(e) => {
                          band.setter(Math.max(-12, Math.min(12, Number(e.target.value) || 0)));
                          setActiveEQ('custom');
                        }}
                        className="w-11 bg-[#121215] border border-[#2A2A30] rounded px-1 py-0.5 text-right font-mono-studio text-xs text-white outline-none"
                      />
                      <span className="text-[10px] text-[#71717A]">dB</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    value={band.value}
                    onChange={(e) => {
                      band.setter(Number(e.target.value));
                      setActiveEQ('custom');
                    }}
                    className={`w-full ${band.color} cursor-pointer`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── EFFECTS & SPATIAL TAB ── */}
        {activeSubTab === 'effects' && (
          <div className="flex flex-col gap-3.5 pt-0.5">
            {/* Reverb System */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Acoustic Reverb Space</span>
              <div className="flex flex-col gap-1">
                {REVERB_PRESETS.map((rev) => (
                  <button
                    key={rev.id}
                    type="button"
                    onClick={() => setReverb(rev.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-left cursor-pointer transition-colors ${
                      reverb === rev.id
                        ? 'bg-[#1E2A3A] border-[#3B82F6] text-white'
                        : 'bg-[#141417] border-[#2A2A30] text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-semibold text-white block">{rev.label}</span>
                      <span className="text-[9px] text-[#71717A]">{rev.desc}</span>
                    </div>
                    {reverb === rev.id && <Check className="w-3.5 h-3.5 text-[#3B82F6]" />}
                  </button>
                ))}
              </div>

              {reverb !== 'dry' && (
                <div className="flex flex-col gap-1 pt-2 border-t border-[#25252A]">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#A1A1AA]">Wet/Dry Reverb Mix</span>
                    <span className="font-mono-studio text-white">{reverbMix}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={reverbMix}
                    onChange={(e) => setReverbMix(Number(e.target.value))}
                    className="w-full accent-[#3B82F6] cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Fade In & Fade Out */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2.5">
              <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Envelope Fades</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#A1A1AA]">Fade In</span>
                    <span className="font-mono-studio text-white">{fadeIn}s</span>
                  </div>
                  <input
                    type="range"
                    step="0.1"
                    min="0"
                    max="5"
                    value={fadeIn}
                    onChange={(e) => setFadeIn(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#A1A1AA]">Fade Out</span>
                    <span className="font-mono-studio text-white">{fadeOut}s</span>
                  </div>
                  <input
                    type="range"
                    step="0.1"
                    min="0"
                    max="5"
                    value={fadeOut}
                    onChange={(e) => setFadeOut(parseFloat(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Stereo Pan & Width */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2.5">
              <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Stereo Spatialization</span>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs items-center">
                  <span className="text-[#A1A1AA]">Stereo Pan Balance</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono-studio text-white text-[11px]">{pan === 0 ? 'Center' : pan < 0 ? `${Math.abs(pan)}% L` : `${pan}% R`}</span>
                    {pan !== 0 && (
                      <button type="button" onClick={() => setPan(0)} className="text-[10px] text-[#3B82F6] hover:underline cursor-pointer">Reset</button>
                    )}
                  </div>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={pan}
                  onChange={(e) => setPan(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1 pt-1 border-t border-[#25252A]">
                <div className="flex justify-between text-xs">
                  <span className="text-[#A1A1AA]">Stereo Width</span>
                  <span className="font-mono-studio text-white">{stereoWidth}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={stereoWidth}
                  onChange={(e) => setStereoWidth(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>
            </div>

            {/* AI Auto-Ducking & Noise Reduction Toggles */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">AI Speech Ducking</p>
                  <p className="text-[10px] text-[#71717A]">Automatically lower music under voice</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDucking(!ducking)}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                    ducking ? 'bg-[#3B82F6]' : 'bg-[#2A2A30]'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${ducking ? 'left-5' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[#25252A]">
                <div>
                  <p className="text-xs font-semibold text-white">AI Background Denoise</p>
                  <p className="text-[10px] text-[#71717A]">Cut hiss, hum, and mic rumble</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNoiseReduction(!noiseReduction)}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                    noiseReduction ? 'bg-emerald-500' : 'bg-[#2A2A30]'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${noiseReduction ? 'left-5' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SFX BOARD TAB ── */}
        {activeSubTab === 'sfx' && (
          <div className="flex flex-col gap-3 pt-0.5">
            <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Quick SFX Triggers</span>
            <div className="flex flex-col gap-1.5">
              {SFX_ITEMS.map((sfx) => (
                <div
                  key={sfx.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#18181C] border border-[#282830] hover:border-[#3B82F6]/50 transition-colors"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">{sfx.name}</span>
                    <span className="text-[10px] text-[#71717A]">{sfx.desc}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePlaySfxPreview(sfx)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                        previewingSfx === sfx.id ? 'bg-emerald-600 text-white' : 'bg-[#141417] border border-[#2A2A30] text-[#D4D4D8] hover:text-white'
                      }`}
                    >
                      <Play className="w-3 h-3" />
                      {previewingSfx === sfx.id ? 'Playing' : 'Preview'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TIME & TRIM TAB ── */}
        {activeSubTab === 'time' && (
          <div className="flex flex-col gap-3.5 pt-0.5">
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2.5">
              <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Precision Audio Boundaries</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#A1A1AA]">In Point (Start)</span>
                    <span className="font-mono-studio text-white">{trimStart.toFixed(1)}s</span>
                  </div>
                  <input
                    type="range"
                    step="0.1"
                    min="0"
                    max={Math.max(1, trimEnd - 0.5)}
                    value={trimStart}
                    onChange={(e) => setTrimStart(parseFloat(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#A1A1AA]">Out Point (End)</span>
                    <span className="font-mono-studio text-white">{trimEnd.toFixed(1)}s</span>
                  </div>
                  <input
                    type="range"
                    step="0.1"
                    min={trimStart + 0.5}
                    max={Math.max(15, duration)}
                    value={trimEnd}
                    onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-[#25252A] text-xs">
                <span className="text-[#71717A]">Net Audio Duration:</span>
                <span className="font-mono-studio text-emerald-400 font-bold">{Math.max(0, trimEnd - trimStart).toFixed(1)}s</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-white">Loop Audio Segment</p>
                <p className="text-[10px] text-[#71717A]">Seamlessly loop when playhead reaches end</p>
              </div>
              <button
                type="button"
                onClick={() => setLoopAudio(!loopAudio)}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                  loopAudio ? 'bg-[#3B82F6]' : 'bg-[#2A2A30]'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${loopAudio ? 'left-5' : 'left-1'}`} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AudioCompoundInspector;
