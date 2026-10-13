import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { useReactMediaRecorder } from 'react-media-recorder';
import { motion, AnimatePresence } from 'motion/react';
import {
  Music,
  Mic,
  MicOff,
  Play,
  Pause,
  Check,
  Volume2,
  Sparkles,
  Radio,
  RotateCcw,
  VolumeX,
  Disc,
  Sliders,
  Activity,
  Layers,
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
  { id: 'sfx-4', name: 'Heartbeat Pulse', category: 'Atmosphere', duration: '4.0s', audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_2753a81765.mp3' },
  { id: 'sfx-5', name: 'Typewriter Keystroke', category: 'Foley', duration: '1.2s', audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c761e0cb60.mp3' },
];

export const AudioPane: React.FC<AudioPaneProps> = ({
  onSelectMusic,
  selectedMusic = 'track-1',
  onApplyRecordedVoice,
}) => {
  const [activeTab, setActiveTab] = useState<'soundtracks' | 'recorder' | 'sfx'>('soundtracks');
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(SOUNDTRACKS[0].audioUrl);
  const [isWsPlaying, setIsWsPlaying] = useState(false);
  const [wsCurrentTime, setWsCurrentTime] = useState(0);
  const [wsDuration, setWsDuration] = useState(0);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const waveformContainerRef = useRef<HTMLDivElement | null>(null);
  const wavesurferInstance = useRef<WaveSurfer | null>(null);
  const timerIntervalRef = useRef<any>(null);

  // Open-Source react-media-recorder integration
  const {
    status: recordStatus,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
  } = useReactMediaRecorder({ audio: true });

  const isRecording = recordStatus === 'recording';

  // Live recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  // Open-Source wavesurfer.js Canvas Waveform Visualizer
  useEffect(() => {
    if (!waveformContainerRef.current) return;

    if (wavesurferInstance.current) {
      wavesurferInstance.current.destroy();
    }

    try {
      const ws = WaveSurfer.create({
        container: waveformContainerRef.current,
        waveColor: '#3B82F6',
        progressColor: '#93C5FD',
        cursorColor: '#FFFFFF',
        cursorWidth: 2,
        barWidth: 2,
        barGap: 2,
        barRadius: 2,
        height: 44,
        url: activeAudioUrl || SOUNDTRACKS[0].audioUrl,
      });

      ws.on('ready', () => {
        setWsDuration(ws.getDuration());
      });

      ws.on('timeupdate', (currentTime) => {
        setWsCurrentTime(currentTime);
      });

      ws.on('play', () => setIsWsPlaying(true));
      ws.on('pause', () => setIsWsPlaying(false));
      ws.on('finish', () => {
        setIsWsPlaying(false);
        setPlayingTrackId(null);
      });

      wavesurferInstance.current = ws;
    } catch (err) {
      console.warn('WaveSurfer initialization error:', err);
    }

    return () => {
      if (wavesurferInstance.current) {
        wavesurferInstance.current.destroy();
        wavesurferInstance.current = null;
      }
    };
  }, [activeAudioUrl]);

  // Load recorded voice into wavesurfer when recorded
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
    <div className="flex flex-col font-sans-studio text-[#E5E5E5] space-y-4">
      {/* ── Top Header Bar ────────────────────────────────────────────── */}
      <div className="flex w-full items-center justify-between gap-2 rounded-xl border border-[#2F2F2F] bg-[#121212]/90 px-3 py-2.5 shadow-[0_1px_0_rgba(255,255,255,0.02)] backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/30">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Audio Studio Engine</h2>
            <p className="text-[10px] text-[#9CA3AF]">wavesurfer.js • react-media-recorder</p>
          </div>
        </div>

        <span className="text-[10px] font-mono-studio px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[#60A5FA] font-semibold">
          24kHz Studio Audio
        </span>
      </div>

      {/* ── Open-Source WaveSurfer.js Visualizer Dock ────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[#2F2F2F] bg-[#0E0E0E] p-3.5 shadow-xl space-y-2.5 relative overflow-hidden"
      >
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[#60A5FA] animate-pulse" />
            <span className="font-bold text-white text-[11px]">
              Live Interactive Waveform Visualizer
            </span>
          </div>
          <span className="font-mono-studio text-[10px] text-[#9CA3AF]">
            {formatSecs(wsCurrentTime)} / {formatSecs(wsDuration)}
          </span>
        </div>

        {/* Real WaveSurfer.js Canvas Mount */}
        <div
          ref={waveformContainerRef}
          className="w-full bg-[#050505] rounded-xl p-2 border border-[#222222] min-h-[50px] cursor-pointer"
        />

        {/* Scrubber playback controls */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={handleToggleWavePlay}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold transition-all cursor-pointer"
          >
            {isWsPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            <span>{isWsPlaying ? 'Pause Audio' : 'Play Waveform'}</span>
          </button>

          <span className="text-[9px] text-[#71717A] font-mono-studio">
            Drag playhead to scrub audio
          </span>
        </div>
      </motion.div>

      {/* ── Sub Navigation Tabs ──────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#141414] border border-[#262626]">
        {(
          [
            { id: 'soundtracks', label: 'Soundtracks' },
            { id: 'recorder', label: 'Mic Recorder' },
            { id: 'sfx', label: 'Sound FX' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer relative ${
              activeTab === tab.id
                ? 'bg-[#3B82F6] text-white shadow-xs'
                : 'text-[#9CA3AF] hover:text-white hover:bg-[#1E1E1E]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Soundtracks List ─────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === 'soundtracks' && (
          <motion.div
            key="soundtracks"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="space-y-2"
          >
            <span className="text-[10px] font-extrabold text-[#9CA3AF] uppercase tracking-wider block px-1">
              Curated Motivational Background Scores
            </span>

            <div className="space-y-2">
              {SOUNDTRACKS.map((track) => {
                const isSelected = selectedMusic === track.id;
                const isPlaying = playingTrackId === track.id && isWsPlaying;

                return (
                  <motion.div
                    key={track.id}
                    whileHover={{ scale: 1.01 }}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-[#3B82F6] bg-[#3B82F6]/10 ring-1 ring-[#3B82F6]/40'
                        : 'border-[#262626] bg-[#141414] hover:border-[#404040]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Play/Preview Waveform Button */}
                      <button
                        type="button"
                        onClick={() => handleSelectTrack(track)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-md ${
                          isPlaying
                            ? 'bg-[#3B82F6] text-white animate-pulse'
                            : 'bg-[#1E1E1E] text-white hover:bg-[#2A2A2A] hover:text-[#60A5FA]'
                        }`}
                        title={isPlaying ? 'Pause' : 'Load into WaveSurfer'}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{track.title}</p>
                        <div className="flex items-center gap-2 text-[10px] text-[#71717A] font-mono-studio">
                          <span>{track.genre}</span>
                          <span>•</span>
                          <span>{track.duration}</span>
                          <span>•</span>
                          <span>{track.bpm} BPM</span>
                        </div>
                      </div>
                    </div>

                    {/* Apply Track Button */}
                    <button
                      type="button"
                      onClick={() => handleApplyMusic(track)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-[#3B82F6] text-white'
                          : 'border border-[#2F2F2F] text-[#9CA3AF] hover:text-white hover:bg-[#1E1E1E]'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Active</span>
                        </>
                      ) : (
                        <span>Apply</span>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Open-Source react-media-recorder Live Mic ───────────────── */}
        {activeTab === 'recorder' && (
          <motion.div
            key="recorder"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="p-4 rounded-2xl border border-[#2F2F2F] bg-[#141414] space-y-4"
          >
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
              <span className="text-[10px] font-mono-studio text-[#9CA3AF] uppercase">
                Status: {recordStatus}
              </span>
            </div>

            {/* Record Control Circle */}
            <div className="flex flex-col items-center justify-center py-6 space-y-3 bg-[#0A0A0A] rounded-xl border border-[#222222]">
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 text-white scale-110 shadow-black/50'
                    : 'bg-[#3B82F6] hover:bg-[#2563EB] text-white hover:scale-105 shadow-black/40'
                }`}
                title={isRecording ? 'Stop Recording' : 'Start Recording'}
              >
                {isRecording ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
              </motion.button>
              <p className="text-xs font-bold text-white">
                {isRecording ? 'Tap to Stop Recording' : 'Tap Mic to Start Speaking'}
              </p>
              <p className="text-[10px] text-[#71717A]">
                Audio is instantly loaded into WaveSurfer.js visualizer above!
              </p>
            </div>

            {/* Recorded Playback & Apply */}
            {mediaBlobUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 rounded-xl bg-[#1E1E1E] border border-[#2F2F2F] space-y-3"
              >
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
                  className="w-full py-2.5 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Apply Voiceover to Reel Timeline
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── Sound Effects SFX ────────────────────────────────────────── */}
        {activeTab === 'sfx' && (
          <motion.div
            key="sfx"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="space-y-2"
          >
            <span className="text-[10px] font-extrabold text-[#9CA3AF] uppercase tracking-wider block px-1">
              Reel Transition & Impact Sound Effects
            </span>
            <div className="space-y-2">
              {SOUND_EFFECTS.map((sfx) => {
                const isPlaying = playingTrackId === sfx.id && isWsPlaying;
                return (
                  <motion.div
                    key={sfx.id}
                    whileHover={{ scale: 1.01 }}
                    className="p-3 rounded-xl border border-[#262626] bg-[#141414] hover:border-[#404040] flex items-center justify-between cursor-pointer"
                    onClick={() => handlePlaySFX(sfx)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isPlaying
                            ? 'bg-[#3B82F6] text-white'
                            : 'bg-[#1E1E1E] text-white group-hover:bg-[#2A2A2A]'
                        }`}
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{sfx.name}</p>
                        <span className="text-[10px] text-[#71717A] font-mono-studio">
                          {sfx.category} • {sfx.duration}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#60A5FA] font-mono-studio font-semibold">
                      Preview Wave →
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
