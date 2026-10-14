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
  Search,
  ExternalLink,
  VolumeX,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { workspaceApi } from '../../api/workspaceApi';

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
  category: 'Impact' | 'Transition' | 'Tension' | 'Action';
  duration: string;
  audioUrl: string;
}

export interface AudioPaneProps {
  onSelectMusic?: (musicId: string) => void;
  selectedMusic?: string;
  onApplyRecordedVoice?: (recordedUrl: string) => void;
  onAddSfxToTimeline?: (sfx: SoundEffectItem) => void;
}

const CURATED_SOUNDTRACKS: SoundtrackItem[] = [
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
  {
    id: 'track-6',
    title: 'Echoes of the Coliseum',
    genre: 'Orchestral Hybrid',
    duration: '2:20',
    bpm: 80,
    mood: 'Historical Grandeur',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/26/audio_d0c6ff1101.mp3?filename=cinematic-atmosphere-score-10928.mp3',
  },
  {
    id: 'track-7',
    title: 'Dark Room Cyber Lofi',
    genre: 'Chill Synth Lofi',
    duration: '2:10',
    bpm: 84,
    mood: 'Deep Coding & Flow',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_c83d6a718f.mp3?filename=lofi-study-112191.mp3',
  },
  {
    id: 'track-8',
    title: 'Sub Zero Tension Drone',
    genre: 'Minimalist Suspense',
    duration: '1:55',
    bpm: 68,
    mood: 'Dark Psychology',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_c29c87d4f9.mp3?filename=cinematic-drone-110484.mp3',
  },
];

const CURATED_SOUND_EFFECTS: SoundEffectItem[] = [
  // Impacts
  { id: 'sfx-1', name: 'Cinematic Bass Boom', category: 'Impact', duration: '2.5s', audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c3527e30eb.mp3' },
  { id: 'sfx-2', name: 'Sub Drop 808 Slam', category: 'Impact', duration: '1.8s', audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8bbf72e81.mp3' },
  { id: 'sfx-3', name: 'Heavy Metal Anvil', category: 'Impact', duration: '1.2s', audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3' },
  { id: 'sfx-4', name: 'Cinematic Trailer Hit', category: 'Impact', duration: '2.0s', audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c3527e30eb.mp3' },
  // Transitions
  { id: 'sfx-5', name: 'Fast Whoosh Air Cut', category: 'Transition', duration: '0.8s', audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_bb63045688.mp3' },
  { id: 'sfx-6', name: 'Glitch Swoosh Whip', category: 'Transition', duration: '1.1s', audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_bb63045688.mp3' },
  { id: 'sfx-7', name: 'Vinyl Record Stop', category: 'Transition', duration: '1.4s', audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3' },
  { id: 'sfx-8', name: 'Film Reel Rewind', category: 'Transition', duration: '1.6s', audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_bb63045688.mp3' },
  // Tension
  { id: 'sfx-9', name: 'Sub Riser Pitch Rise', category: 'Tension', duration: '3.2s', audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3' },
  { id: 'sfx-10', name: 'Heartbeat Pulse Low', category: 'Tension', duration: '4.0s', audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c3527e30eb.mp3' },
  { id: 'sfx-11', name: 'Ticking Clock Metronome', category: 'Tension', duration: '2.8s', audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_bb63045688.mp3' },
  { id: 'sfx-12', name: 'Dark Cyber Drone Swell', category: 'Tension', duration: '3.5s', audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/26/audio_d0c6ff1101.mp3' },
  // Action & UI
  { id: 'sfx-13', name: 'Camera Shutter Click', category: 'Action', duration: '0.5s', audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_bb63045688.mp3' },
  { id: 'sfx-14', name: 'Cyber Bell Hologram', category: 'Action', duration: '1.2s', audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3' },
  { id: 'sfx-15', name: 'Sword Blade Draw', category: 'Action', duration: '1.0s', audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_bb63045688.mp3' },
  { id: 'sfx-16', name: 'Page Turn Fast Whisper', category: 'Action', duration: '0.7s', audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_bb63045688.mp3' },
];

export const AudioPane: React.FC<AudioPaneProps> = ({
  onSelectMusic,
  selectedMusic,
  onApplyRecordedVoice,
  onAddSfxToTimeline,
}) => {
  const [activeTab, setActiveTab] = useState<'soundtracks' | 'sfx' | 'record' | 'url'>('soundtracks');
  const [soundtracks, setSoundtracks] = useState<SoundtrackItem[]>(CURATED_SOUNDTRACKS);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedSfxCategory, setSelectedSfxCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [playingSfxId, setPlayingSfxId] = useState<string | null>(null);
  const [customAudioUrl, setCustomAudioUrl] = useState('');
  const [customAudioTitle, setCustomAudioTitle] = useState('');
  const [customAudioPlaying, setCustomAudioPlaying] = useState(false);
  const [isLoadingBackend, setIsLoadingBackend] = useState(false);

  // Hidden audio preview elements
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const sfxAudioRef = useRef<HTMLAudioElement | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);

  // Voice recording state
  const { status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl } =
    useReactMediaRecorder({ audio: true });
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurferInstance = useRef<WaveSurfer | null>(null);

  // Load music tracks from backend media-library API
  useEffect(() => {
    let isMounted = true;
    const fetchBackendMusic = async () => {
      try {
        setIsLoadingBackend(true);
        const data = await workspaceApi.getMediaLibrary();
        if (isMounted && data?.musicTracks?.length) {
          const apiTracks: SoundtrackItem[] = data.musicTracks.map((m) => ({
            id: m.id,
            title: m.title,
            genre: m.genre || 'Cinematic',
            duration: m.duration || '2:00',
            bpm: m.bpm || 90,
            mood: m.genre || 'Epic Focus',
            audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=cinematic-time-lapse-115672.mp3',
          }));

          if (apiTracks.length > 0) {
            setSoundtracks((prev) => {
              const existingIds = new Set(prev.map((t) => t.id));
              const newTracks = apiTracks.filter((t) => !existingIds.has(t.id));
              return [...newTracks, ...prev];
            });
          }
        }
      } catch {
        // Fallback to curated
      } finally {
        if (isMounted) setIsLoadingBackend(false);
      }
    };
    fetchBackendMusic();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Recording Timer
  useEffect(() => {
    if (status === 'recording') {
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // WaveSurfer initialization for recorded audio
  useEffect(() => {
    if (mediaBlobUrl && waveformRef.current) {
      if (wavesurferInstance.current) {
        wavesurferInstance.current.destroy();
      }
      wavesurferInstance.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#3B82F6',
        progressColor: '#60A5FA',
        cursorColor: '#FFFFFF',
        barWidth: 2,
        barRadius: 2,
        height: 48,
        barGap: 3,
      });
      wavesurferInstance.current.load(mediaBlobUrl);
      return () => {
        wavesurferInstance.current?.destroy();
      };
    }
  }, [mediaBlobUrl]);

  const togglePlayTrack = (track: SoundtrackItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingTrackId === track.id) {
      previewAudioRef.current?.pause();
      setPlayingTrackId(null);
    } else {
      if (previewAudioRef.current) {
        previewAudioRef.current.src = track.audioUrl;
        previewAudioRef.current.play().catch(() => {});
        setPlayingTrackId(track.id);
      }
    }
  };

  const togglePlaySfx = (sfx: SoundEffectItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingSfxId === sfx.id) {
      sfxAudioRef.current?.pause();
      setPlayingSfxId(null);
    } else {
      if (sfxAudioRef.current) {
        sfxAudioRef.current.src = sfx.audioUrl;
        sfxAudioRef.current.play().catch(() => {});
        setPlayingSfxId(sfx.id);
      }
    }
  };

  const handleSelectSoundtrack = (trackId: string) => {
    if (onSelectMusic) {
      onSelectMusic(trackId);
      window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'music' }));
    }
  };

  const handleApplyCustomAudio = () => {
    if (!customAudioUrl.trim()) return;
    const url = customAudioUrl.trim();
    if (onApplyRecordedVoice) {
      onApplyRecordedVoice(url);
    }
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'music' }));
  };

  const handleApplyRecordedVoice = () => {
    if (mediaBlobUrl && onApplyRecordedVoice) {
      onApplyRecordedVoice(mediaBlobUrl);
      window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'voice' }));
    }
  };

  const filteredSoundtracks = soundtracks.filter((t) => {
    const matchesGenre = selectedGenre === 'all' || t.genre.toLowerCase().includes(selectedGenre.toLowerCase());
    const matchesQuery =
      searchQuery.trim() === '' ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.mood.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGenre && matchesQuery;
  });

  const filteredSfx = CURATED_SOUND_EFFECTS.filter((s) => {
    const matchesCat = selectedSfxCategory === 'all' || s.category === selectedSfxCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none overflow-hidden rounded-2xl border border-[#26262B]">
      {/* Hidden Audio Elements */}
      <audio
        ref={previewAudioRef}
        onEnded={() => setPlayingTrackId(null)}
        className="hidden"
      />
      <audio
        ref={sfxAudioRef}
        onEnded={() => setPlayingSfxId(null)}
        className="hidden"
      />
      <audio
        ref={customAudioRef}
        onEnded={() => setCustomAudioPlaying(false)}
        className="hidden"
      />

      {/* ── Top Header Bar (Matching Right Inspector Pane) ── */}
      <div className="relative px-3 py-2 bg-[#17171A] border-b border-[#26262B] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Music className="w-4 h-4 shrink-0 text-[#60A5FA]" />
          <span className="text-xs font-bold text-white truncate">
            Audio &amp; Voiceover
          </span>
          <span className="text-[9px] font-mono-studio px-1.5 py-0.2 rounded bg-white/10 text-white/80 border border-white/15 shrink-0 uppercase font-bold">
            HQ AUDIO
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isLoadingBackend && (
            <RefreshCw className="w-3 h-3 text-[#60A5FA] animate-spin" />
          )}
          <span className="text-[10px] font-mono-studio text-[#A1A1AA]">
            {activeTab === 'soundtracks'
              ? `${filteredSoundtracks.length} Tracks`
              : activeTab === 'sfx'
              ? `${filteredSfx.length} SFX`
              : 'Studio Mic'}
          </span>
        </div>
      </div>

      {/* ── Subtabs Header Bar ── */}
      <div className="flex items-center gap-5 px-4 pt-2.5 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('soundtracks')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'soundtracks'
              ? 'text-white border-white'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Soundtracks
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sfx')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'sfx'
              ? 'text-white border-white'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Sound Effects
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('record')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 flex items-center gap-1.5 ${
            activeTab === 'record'
              ? 'text-white border-white'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          <Mic className="w-3 h-3 text-rose-400" />
          Voice Record
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'url'
              ? 'text-white border-white'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Custom Audio URL
        </button>
      </div>

      {/* ── Genre / Category Chips ── */}
      {activeTab === 'soundtracks' && (
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-[#26262B]/60 overflow-x-auto custom-scrollbar shrink-0 bg-[#141416]">
          {[
            { id: 'all', label: 'All Vibe' },
            { id: 'cinematic', label: 'Cinematic' },
            { id: 'drone', label: 'Bass Drone' },
            { id: 'synthwave', label: 'Synthwave' },
            { id: 'phonk', label: 'Phonk' },
            { id: 'piano', label: 'Piano' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedGenre(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all shrink-0 cursor-pointer ${
                selectedGenre === cat.id
                  ? 'bg-[#3B82F6] text-white shadow-sm'
                  : 'bg-[#1C1C20] text-[#A1A1AA] hover:text-white hover:bg-[#26262C] border border-[#2A2A30]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'sfx' && (
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-[#26262B]/60 overflow-x-auto custom-scrollbar shrink-0 bg-[#141416]">
          {[
            { id: 'all', label: 'All SFX' },
            { id: 'Impact', label: '💥 Impacts' },
            { id: 'Transition', label: '⚡ Transitions' },
            { id: 'Tension', label: '⏳ Tension' },
            { id: 'Action', label: '🎯 Actions' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedSfxCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all shrink-0 cursor-pointer ${
                selectedSfxCategory === cat.id
                  ? 'bg-[#3B82F6] text-white shadow-sm'
                  : 'bg-[#1C1C20] text-[#A1A1AA] hover:text-white hover:bg-[#26262C] border border-[#2A2A30]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Main Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3">
        {/* Search Bar for Soundtracks or SFX */}
        {(activeTab === 'soundtracks' || activeTab === 'sfx') && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'soundtracks'
                  ? 'Search soundtracks by mood, tempo...'
                  : 'Search sound effects (boom, whoosh, riser)...'
              }
              className="w-full bg-[#1C1C20] border border-[#2A2A30] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-[#525252] outline-none focus:border-[#3B82F6]/60 transition-colors"
            />
          </div>
        )}

        {/* ── Tab 1: Soundtracks ── */}
        {activeTab === 'soundtracks' && (
          <div className="flex flex-col gap-2">
            {filteredSoundtracks.map((track) => {
              const isSelected = selectedMusic === track.id;
              const isPlaying = playingTrackId === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => handleSelectSoundtrack(track.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#1E2330] border-[#3B82F6] ring-1 ring-[#3B82F6]/50'
                      : 'bg-[#1C1C20] border-[#2A2A30] hover:border-[#3A3A42] hover:bg-[#222228]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => togglePlayTrack(track, e)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isPlaying
                          ? 'bg-[#3B82F6] text-white shadow-md shadow-[#3B82F6]/40'
                          : 'bg-[#2A2A32] text-[#A1A1AA] hover:text-white hover:bg-[#34343E]'
                      }`}
                    >
                      {isPlaying ? (
                        <Pause className="w-3.5 h-3.5" fill="currentColor" />
                      ) : (
                        <Play className="w-3.5 h-3.5 ml-0.5" fill="currentColor" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-white truncate">
                          {track.title}
                        </p>
                        {isSelected && (
                          <span className="text-[9px] font-mono-studio px-1.5 py-0.2 rounded bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/40 font-bold shrink-0">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#A1A1AA]">
                        <span>{track.genre}</span>
                        <span>•</span>
                        <span>{track.bpm} BPM</span>
                        <span>•</span>
                        <span>{track.duration}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isSelected ? (
                      <div className="p-1.5 rounded-full bg-[#3B82F6] text-white">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectSoundtrack(track.id);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#26262E] hover:bg-[#32323C] text-[10px] font-semibold text-white transition-colors border border-[#34343E]"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Tab 2: Sound Effects ── */}
        {activeTab === 'sfx' && (
          <div className="flex flex-col gap-2">
            {filteredSfx.map((sfx) => {
              const isPlaying = playingSfxId === sfx.id;

              return (
                <div
                  key={sfx.id}
                  className="p-2.5 rounded-xl border border-[#2A2A30] bg-[#1C1C20] hover:border-[#3A3A42] transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => togglePlaySfx(sfx, e)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isPlaying
                          ? 'bg-[#3B82F6] text-white'
                          : 'bg-[#2A2A32] text-[#A1A1AA] hover:text-white'
                      }`}
                    >
                      {isPlaying ? (
                        <Pause className="w-3 h-3" fill="currentColor" />
                      ) : (
                        <Play className="w-3 h-3 ml-0.5" fill="currentColor" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {sfx.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-[9px] text-[#A1A1AA]">
                        <span className="font-mono-studio text-[#60A5FA]">{sfx.category}</span>
                        <span>•</span>
                        <span>{sfx.duration}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onAddSfxToTimeline) {
                        onAddSfxToTimeline(sfx);
                      }
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2A2A32] hover:bg-[#3B82F6] text-white text-[10px] font-semibold transition-all shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Timeline
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Tab 3: Studio Voice Record ── */}
        {activeTab === 'record' && (
          <div className="flex flex-col gap-4">
            <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-4 flex flex-col items-center text-center gap-3">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                  status === 'recording'
                    ? 'bg-rose-500/20 text-rose-500 ring-4 ring-rose-500/30 animate-pulse'
                    : 'bg-[#2A2A32] text-white hover:bg-[#32323C]'
                }`}
              >
                <Mic className="w-8 h-8" />
              </div>

              <div>
                <p className="text-xs font-bold text-white">
                  {status === 'recording' ? 'Recording Voiceover...' : 'Record Custom Voiceover'}
                </p>
                <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                  Speak clearly into your microphone to record your narration
                </p>
              </div>

              {status === 'recording' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/30 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-xs font-mono-studio text-rose-400 font-bold">
                    {formatSeconds(recordingDuration)}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                {status !== 'recording' ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="bg-rose-600 hover:bg-rose-500 text-white rounded-xl px-5 py-2 text-xs font-bold transition-all shadow-lg shadow-rose-600/20 cursor-pointer flex items-center gap-2"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    Start Recording
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl px-5 py-2 text-xs font-bold transition-all border border-zinc-600 cursor-pointer flex items-center gap-2"
                  >
                    <MicOff className="w-3.5 h-3.5 text-rose-400" />
                    Stop Recording
                  </button>
                )}
              </div>
            </div>

            {/* Waveform & Playback of Recorded Voice */}
            {mediaBlobUrl && (
              <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-3.5 flex flex-col gap-3">
                <span className="text-[10px] uppercase font-mono-studio text-[#71717A]">
                  Recorded Preview Waveform
                </span>

                <div ref={waveformRef} className="w-full bg-[#141416] rounded-lg p-2" />

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => wavesurferInstance.current?.playPause()}
                    className="flex-1 bg-[#2A2A32] hover:bg-[#34343E] text-white rounded-xl py-2 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Preview Playback
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyRecordedVoice}
                    className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#3B82F6]/20"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Apply Voiceover
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab 4: Custom Audio URL ── */}
        {activeTab === 'url' && (
          <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-3.5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-[#60A5FA]" />
              <span className="text-xs font-bold text-white">Import Direct Audio URL</span>
            </div>
            <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
              Paste any direct audio link (MP3, WAV, AAC, or podcast stream) to play as the reel&rsquo;s background music or voiceover.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-mono-studio text-[#71717A]">Track Title</label>
              <input
                type="text"
                value={customAudioTitle}
                onChange={(e) => setCustomAudioTitle(e.target.value)}
                placeholder="e.g. Dark Phonk Master"
                className="bg-[#141417] border border-[#2A2A30] rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#52525B] outline-none focus:border-[#3B82F6]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-mono-studio text-[#71717A]">Direct Audio URL (MP3 / WAV)</label>
              <input
                type="url"
                value={customAudioUrl}
                onChange={(e) => setCustomAudioUrl(e.target.value)}
                placeholder="https://cdn.pixabay.com/download/audio/..."
                className="bg-[#141417] border border-[#2A2A30] rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#52525B] outline-none focus:border-[#3B82F6]"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (!customAudioUrl.trim()) return;
                  if (customAudioPlaying) {
                    customAudioRef.current?.pause();
                    setCustomAudioPlaying(false);
                  } else {
                    if (customAudioRef.current) {
                      customAudioRef.current.src = customAudioUrl.trim();
                      customAudioRef.current.play().catch(() => {});
                      setCustomAudioPlaying(true);
                    }
                  }
                }}
                disabled={!customAudioUrl.trim()}
                className="flex-1 bg-[#2A2A32] hover:bg-[#34343E] disabled:opacity-50 text-white rounded-xl py-2 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {customAudioPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" /> Test Audio
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleApplyCustomAudio}
                disabled={!customAudioUrl.trim()}
                className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white rounded-xl py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#3B82F6]/20"
              >
                <Check className="w-3.5 h-3.5" /> Set as Soundtrack
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioPane;
