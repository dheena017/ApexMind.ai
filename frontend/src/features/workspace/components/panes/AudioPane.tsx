import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { useReactMediaRecorder } from 'react-media-recorder';
import { motion, AnimatePresence } from 'motion/react';
import {
  Music,
  Plus,
  Mic,
  MicOff,
  Play,
  Pause,
  Check,
  Volume2,
  Sparkles,
  Radio,
  RotateCcw,
  Activity,
} from 'lucide-react';

export interface SoundtrackItem {
  id: string;
  title: string;
  genre: string;
  duration: string;
  bpm: number;
  mood: string;
  audioUrl: string;
}

export interface SoundEffectItem {
  id: string;
  name: string;
  category: string;
  duration: string;
  audioUrl: string;
}

export interface AudioPaneProps {
  onSelectMusic?: (musicId: string) => void;
  selectedMusic?: string;
  onApplyRecordedVoice?: (recordedUrl: string) => void;
  onAddSfxToTimeline?: (sfx: SoundEffectItem) => void;
}

const SOUNDTRACKS: SoundtrackItem[] = [
  {
    id: 'track-1',
    title: 'Titan Solitude Ambient',
    genre: 'Cinematic Ambient',
    duration: '2:15',
    bpm: 72,
    mood: 'Stoic & Solitary',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=cinematic-time-lapse-115672.mp3',
  },
  {
    id: 'track-2',
    title: 'Relentless Iron Grit',
    genre: 'Deep Bass Drone',
    duration: '1:45',
    bpm: 90,
    mood: 'Aggressive Discipline',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8bbf72e81.mp3?filename=epic-cinematic-trailer-110023.mp3',
  },
  {
    id: 'track-3',
    title: 'Midnight Cyber Drive',
    genre: 'Dark Synthwave',
    duration: '2:30',
    bpm: 120,
    mood: 'Futuristic Focus',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=synthwave-80s-110045.mp3',
  },
  {
    id: 'track-4',
    title: 'Dawn Meditation Piano',
    genre: 'Reflective Classical',
    duration: '2:05',
    bpm: 65,
    mood: 'Deep Wisdom',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_349dcc842a.mp3?filename=soft-piano-ambient-9689.mp3',
  },
  {
    id: 'track-5',
    title: 'Apex Phonk Acceleration',
    genre: 'High-Octane Phonk',
    duration: '1:50',
    bpm: 135,
    mood: 'Maximum Adrenaline',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2023/04/18/audio_650630ba81.mp3?filename=phonk-drift-146399.mp3',
  },
];

const SOUND_EFFECTS: SoundEffectItem[] = [
  { id: 'sfx-1', name: 'Cinematic Bass Boom', category: 'Impact', duration: '2.5s', audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c3527e30eb.mp3' },
  { id: 'sfx-2', name: 'Fast Whoosh Transition', category: 'Transition', duration: '0.8s', audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_bb63045688.mp3' },
  { id: 'sfx-3', name: 'Sub Riser Tension', category: 'Tension', duration: '3.2s', audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3' },
];

export const AudioPane: React.FC<AudioPaneProps> = ({
  onSelectMusic,
  selectedMusic,
  onApplyRecordedVoice,
  onAddSfxToTimeline,
}) => {
  const [activeTab, setActiveTab] = useState<'soundtracks' | 'recorder' | 'sfx'>('soundtracks');
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [activeAudioUrl, setActiveAudioUrl] = useState<string>(SOUNDTRACKS[0].audioUrl);
  const [isWsPlaying, setIsWsPlaying] = useState(false);
  const [wsDuration, setWsDuration] = useState(0);
  const [wsCurrentTime, setWsCurrentTime] = useState(0);

  const waveformContainerRef = useRef<HTMLDivElement | null>(null);
  const wavesurferInstance = useRef<WaveSurfer | null>(null);

  // react-media-recorder integration
  const {
    status: recordStatus,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
  } = useReactMediaRecorder({ audio: true });

  const isRecording = recordStatus === 'recording';
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording) {
      setRecordingSeconds(0);
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  useEffect(() => {
    if (!waveformContainerRef.current) return;

    wavesurferInstance.current = WaveSurfer.create({
      container: waveformContainerRef.current,
      waveColor: '#3F3F46',
      progressColor: '#3B82F6',
      cursorColor: '#60A5FA',
      barWidth: 2,
      barGap: 3,
      barRadius: 2,
      height: 48,
      normalize: true,
    });

    wavesurferInstance.current.load(activeAudioUrl);

    wavesurferInstance.current.on('ready', () => {
      if (wavesurferInstance.current) {
        setWsDuration(wavesurferInstance.current.getDuration());
      }
    });

    wavesurferInstance.current.on('audioprocess', () => {
      if (wavesurferInstance.current) {
        setWsCurrentTime(wavesurferInstance.current.getCurrentTime());
      }
    });

    wavesurferInstance.current.on('play', () => setIsWsPlaying(true));
    wavesurferInstance.current.on('pause', () => setIsWsPlaying(false));
    wavesurferInstance.current.on('finish', () => setIsWsPlaying(false));

    return () => {
      if (wavesurferInstance.current) {
        wavesurferInstance.current.destroy();
      }
    };
  }, [activeAudioUrl]);

  useEffect(() => {
    if (mediaBlobUrl) {
      setActiveAudioUrl(mediaBlobUrl);
    }
  }, [mediaBlobUrl]);

  const handleToggleWavePlay = () => {
    if (wavesurferInstance.current) {
      wavesurferInstance.current.playPause();
    }
  };

  const handleSelectTrack = (track: SoundtrackItem) => {
    setPlayingTrackId(track.id);
    setActiveAudioUrl(track.audioUrl);
    setTimeout(() => {
      wavesurferInstance.current?.play();
    }, 150);
  };

  const handlePlaySFX = (sfx: SoundEffectItem) => {
    setPlayingTrackId(sfx.id);
    setActiveAudioUrl(sfx.audioUrl);
    setTimeout(() => {
      wavesurferInstance.current?.play();
    }, 150);
  };

  const handleApplyMusic = (track: SoundtrackItem) => {
    if (onSelectMusic) {
      onSelectMusic(track.id);
    }
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'music' }));
  };

  const handleApplyVoice = () => {
    if (mediaBlobUrl && onApplyRecordedVoice) {
      onApplyRecordedVoice(mediaBlobUrl);
    }
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'voice' }));
  };

  const formatSecs = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = Math.floor(sec % 60);
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none overflow-hidden rounded-2xl border border-[#26262B]">
      {/* ── Top Header Bar (Matching Right Pane) ── */}
      <div className="relative px-3 py-2 bg-[#17171A] border-b border-[#26262B] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Music className="w-4 h-4 shrink-0 text-[#60A5FA]" />
          <span className="text-xs font-bold text-white truncate">
            Audio Studio Engine
          </span>
          <span className="text-[9px] font-mono-studio px-1.5 py-0.2 rounded bg-white/10 text-white/80 border border-white/15 shrink-0 uppercase font-bold">
            24kHz
          </span>
        </div>

        {/* Right Status Pill */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-mono-studio px-2 py-0.5 rounded-lg bg-[#222228] border border-[#32323C] text-[#A1A1AA]">
            {isRecording ? 'REC ON' : 'READY'}
          </span>
        </div>
      </div>

      {/* ── Subtabs Header Bar (Matching Right Pane) ── */}
      <div className="flex items-center gap-6 px-4 pt-2.5 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('soundtracks')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'soundtracks' ? 'text-white border-white' : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Soundtracks
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('recorder')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'recorder' ? 'text-white border-white' : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Mic Recorder
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sfx')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'sfx' ? 'text-white border-white' : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Sound FX
        </button>
      </div>

      {/* ── Main Tab Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
        {/* WaveSurfer.js Visualizer Dock */}
        <div className="rounded-xl border border-[#2A2A30] bg-[#1C1C20] p-3 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#60A5FA] animate-pulse" />
              <span className="font-bold text-white text-[11px]">Waveform Visualizer</span>
            </div>
            <span className="font-mono-studio text-[10px] text-[#A1A1AA]">
              {formatSecs(wsCurrentTime)} / {formatSecs(wsDuration)}
            </span>
          </div>

          <div
            ref={waveformContainerRef}
            className="w-full bg-[#121214] rounded-lg p-2 border border-[#26262B] min-h-[48px] cursor-pointer"
          />

          <div className="flex items-center justify-between pt-0.5">
            <button
              type="button"
              onClick={handleToggleWavePlay}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[11px] font-bold transition-all cursor-pointer"
            >
              {isWsPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
              <span>{isWsPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <span className="text-[9px] text-[#71717A] font-mono-studio">Drag playhead to scrub</span>
          </div>
        </div>

        {/* Tab 1: Soundtracks */}
        {activeTab === 'soundtracks' && (
          <div className="space-y-2">
            <label className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider block">
              Curated Motivational Background Scores
            </label>

            <div className="space-y-2">
              {SOUNDTRACKS.map((track) => {
                const isSelected = selectedMusic === track.id;
                const isPlaying = playingTrackId === track.id && isWsPlaying;

                return (
                  <div
                    key={track.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-[#3B82F6] bg-[#3B82F6]/15 ring-1 ring-[#3B82F6]/40'
                        : 'border-[#2A2A30] bg-[#1C1C20] hover:border-[#3A3A42]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleSelectTrack(track)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-md ${
                          isPlaying
                            ? 'bg-[#3B82F6] text-white animate-pulse'
                            : 'bg-[#17171A] text-white hover:bg-[#26262B] hover:text-[#60A5FA]'
                        }`}
                        title={isPlaying ? 'Pause' : 'Preview'}
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                      </button>

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{track.title}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#71717A] font-mono-studio">
                          <span>{track.genre}</span>
                          <span>•</span>
                          <span>{track.duration}</span>
                          <span>•</span>
                          <span>{track.bpm} BPM</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyMusic(track)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-[#3B82F6] text-white'
                          : 'border border-[#32323C] text-[#A1A1AA] hover:text-white hover:bg-[#222228]'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Active</span>
                        </>
                      ) : (
                        <span>Apply</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Mic Recorder */}
        {activeTab === 'recorder' && (
          <div className="p-4 rounded-xl border border-[#2A2A30] bg-[#1C1C20] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isRecording ? 'bg-red-500 animate-ping' : 'bg-emerald-400'
                  }`}
                />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {isRecording ? `Recording... (${formatSecs(recordingSeconds)})` : 'Microphone Ready'}
                </span>
              </div>
              <span className="text-[10px] font-mono-studio text-[#A1A1AA] uppercase">
                Status: {recordStatus}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-6 space-y-3 bg-[#121214] rounded-xl border border-[#26262B]">
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 text-white scale-110'
                    : 'bg-[#3B82F6] hover:bg-[#2563EB] text-white hover:scale-105'
                }`}
                title={isRecording ? 'Stop Recording' : 'Start Recording'}
              >
                {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </motion.button>
              <p className="text-xs font-bold text-white">
                {isRecording ? 'Tap to Stop Recording' : 'Tap Mic to Start Speaking'}
              </p>
              <p className="text-[10px] text-[#71717A]">
                Voice is instantly loaded into WaveSurfer.js visualizer!
              </p>
            </div>

            {mediaBlobUrl && (
              <div className="p-3 rounded-xl bg-[#17171A] border border-[#26262B] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">
                    Voiceover Captured ({formatSecs(recordingSeconds || 5)})
                  </span>
                  <button
                    type="button"
                    onClick={clearBlobUrl}
                    className="text-[10px] text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleApplyVoice}
                  className="w-full py-2 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" /> Apply Voiceover to Reel
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: SFX */}
        {activeTab === 'sfx' && (
          <div className="space-y-2">
            <label className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider block">
              Transition &amp; Impact Sound Effects
            </label>
            <div className="space-y-2">
              {SOUND_EFFECTS.map((sfx) => {
                const isPlaying = playingTrackId === sfx.id && isWsPlaying;
                return (
                  <div
                    key={sfx.id}
                    className="p-3 rounded-xl border border-[#2A2A30] bg-[#1C1C20] hover:border-[#3A3A42] flex items-center justify-between gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => handlePlaySFX(sfx)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer"
                    >
                      <span
                        className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center transition-all ${
                          isPlaying ? 'bg-[#3B82F6] text-white' : 'bg-[#17171A] text-white'
                        }`}
                      >
                        {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-bold text-white">{sfx.name}</span>
                        <span className="block text-[10px] text-[#71717A] font-mono-studio">
                          {sfx.category} • {sfx.duration}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddSfxToTimeline?.(sfx)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#32323C] bg-[#222228] px-2 py-1 text-[10px] font-semibold text-[#60A5FA] hover:text-white transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioPane;
