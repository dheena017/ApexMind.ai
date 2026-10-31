import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { useReactMediaRecorder } from 'react-media-recorder';
import {
  Music,
  Plus,
  Mic,
  MicOff,
  Play,
  Pause,
  Check,
  Volume2,
  VolumeX,
  Sparkles,
  Radio,
  RotateCcw,
  Activity,
  Search,
  X,
  ExternalLink,
  Sliders,
  Download,
  RefreshCw,
  Gauge,
} from 'lucide-react';
import { workspaceApi } from '../../api/workspaceApi';

import { toast } from 'sonner';
import { addWorkspaceNotification } from '../../utils/workspaceNotificationManager';

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

import {
  CURATED_SOUNDTRACKS as EXPANDED_SOUNDTRACKS,
  CURATED_SFX as EXPANDED_SFX,
  VIRAL_MEME_SOUNDBOARD,
} from '../../data/mediaCatalogData';

const CURATED_SOUNDTRACKS: SoundtrackItem[] = EXPANDED_SOUNDTRACKS.map((t) => ({
  id: t.id,
  title: t.title,
  genre: t.genre,
  duration: t.duration,
  bpm: t.bpm,
  mood: t.mood,
  audioUrl: t.audioUrl,
}));

const CURATED_SOUND_EFFECTS: SoundEffectItem[] = EXPANDED_SFX.map((s) => ({
  id: s.id,
  name: s.name,
  category: s.category === 'whoosh' ? 'Transition' : s.category === 'impact' ? 'Impact' : s.category === 'riser' ? 'Tension' : 'Action',
  duration: s.duration,
  audioUrl: s.audioUrl,
}));

export const AudioPane: React.FC<AudioPaneProps> = ({
  onSelectMusic,
  selectedMusic,
  onApplyRecordedVoice,
  onAddSfxToTimeline,
}) => {
  const [activeTab, setActiveTab] = useState<'soundtracks' | 'sfx' | 'soundboard' | 'record' | 'mixer' | 'url'>('soundtracks');
  const [soundtracks, setSoundtracks] = useState<SoundtrackItem[]>(CURATED_SOUNDTRACKS);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedSfxCategory, setSelectedSfxCategory] = useState<string>('all');
  const [pendingMusicId, setPendingMusicId] = useState(selectedMusic || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [playingSfxId, setPlayingSfxId] = useState<string | null>(null);
  const [customAudioUrl, setCustomAudioUrl] = useState('');
  const [customAudioTitle, setCustomAudioTitle] = useState('');
  const [customAudioPlaying, setCustomAudioPlaying] = useState(false);
  const [isLoadingBackend, setIsLoadingBackend] = useState(false);

  // Audio Mixer State
  const [musicVolume, setMusicVolume] = useState<number>(65);
  const [voiceVolume, setVoiceVolume] = useState<number>(100);
  const [autoDucking, setAutoDucking] = useState<boolean>(true);
  const [reverbRoom, setReverbRoom] = useState<'dry' | 'studio' | 'hall'>('studio');

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
            audioUrl: m.audioUrl || '',
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
        // Fallback
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
        previewAudioRef.current.volume = musicVolume / 100;
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
      const track = soundtracks.find((t) => t.id === trackId);

      window.dispatchEvent(
        new CustomEvent('workspace:add-timeline-clip', {
          detail: {
            type: 'music',
            url: track?.audioUrl || '',
            name: track?.title || 'Soundtrack',
            duration: track?.duration || 15.0,
          },
        })
      );
      window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'music' }));

      const name = track?.title || 'Soundtrack';
      toast.success(`Applied "${name}"`);
      addWorkspaceNotification({
        title: 'Soundtrack Applied',
        message: `Applied audio "${name}" to music track A2.`,
        category: 'voice',
        type: 'info',
        targetPane: 'audio',
        actionLabel: 'Audio Settings',
      });
    }
  };

  useEffect(() => {
    setPendingMusicId(selectedMusic || '');
  }, [selectedMusic]);

  const handleApplyCustomAudio = () => {
    if (!customAudioUrl.trim()) return;
    const url = customAudioUrl.trim();
    if (onApplyRecordedVoice) {
      onApplyRecordedVoice(url);
    }
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'music' }));
    toast.success('Custom audio applied to timeline');
    addWorkspaceNotification({
      title: 'Custom Audio Applied',
      message: 'Custom web audio URL loaded on soundtrack track.',
      category: 'voice',
      type: 'info',
      targetPane: 'audio',
      actionLabel: 'Audio Settings',
    });
  };

  const handleApplyRecordedVoice = () => {
    if (mediaBlobUrl && onApplyRecordedVoice) {
      onApplyRecordedVoice(mediaBlobUrl);
      window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'voice' }));
      toast.success('Recorded voiceover applied to timeline');
      addWorkspaceNotification({
        title: 'Voiceover Applied',
        message: 'Microphone recording placed on voice track A1.',
        category: 'voice',
        type: 'success',
        targetPane: 'audio',
        actionLabel: 'Audio Settings',
      });
    }
  };


  const downloadRecordedVoice = () => {
    if (!mediaBlobUrl) return;
    const a = document.createElement('a');
    a.href = mediaBlobUrl;
    a.download = `voiceover-${Date.now()}.webm`;
    a.click();
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

      {/* ── Top Header Bar (Matching Studio Shell) ── */}
      <div className="relative h-11 px-3.5 bg-[#17171A] border-b border-[#26262B] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Music className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="text-xs font-bold text-white truncate">
            Audio &amp; Voiceover Studio
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isLoadingBackend && (
            <RefreshCw className="w-3.5 h-3.5 text-[#60A5FA] animate-spin" />
          )}
          <span className="text-[10px] font-mono-studio text-[#A1A1AA] bg-[#222226] px-2 py-0.5 rounded-full border border-[#2F2F36]">
            {activeTab === 'soundtracks'
              ? `${filteredSoundtracks.length} Tracks`
              : activeTab === 'sfx'
              ? `${filteredSfx.length} SFX`
              : 'Studio Audio'}
          </span>
        </div>
      </div>

      {/* ── Subtabs Header Bar ── */}
      <div className="flex items-center gap-4 sm:gap-5 px-3.5 pt-2 border-b border-[#26262B] text-xs font-semibold overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0 bg-[#141417]">
        <button
          type="button"
          onClick={() => setActiveTab('soundtracks')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'soundtracks'
              ? 'text-white border-blue-500 font-bold'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Soundtracks
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sfx')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'sfx'
              ? 'text-white border-blue-500 font-bold'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Sound Effects
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('soundboard')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 flex items-center gap-1.5 ${
            activeTab === 'soundboard'
              ? 'text-white border-blue-500 font-bold'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Soundboard ({VIRAL_MEME_SOUNDBOARD.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('mixer')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 flex items-center gap-1.5 ${
            activeTab === 'mixer'
              ? 'text-white border-blue-500 font-bold'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-[#60A5FA]" />
          <span>Mixer</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('record')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 flex items-center gap-1.5 ${
            activeTab === 'record'
              ? 'text-white border-blue-500 font-bold'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          <Mic className="w-3.5 h-3.5 text-rose-400" />
          <span>Voiceover</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'url'
              ? 'text-white border-blue-500 font-bold'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Direct URL
        </button>
      </div>

      {/* ── Genre / Category Chips ── */}
      {activeTab === 'soundtracks' && (
        <div className="flex items-center gap-1.5 px-3.5 py-2 border-b border-[#26262B]/70 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0 bg-[#141416]">
          {[
            { id: 'all', label: 'All Vibes' },
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
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                selectedGenre === cat.id
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold'
                  : 'bg-[#1C1C22] text-[#A1A1AA] hover:text-white hover:bg-[#26262E] border border-[#2A2A32]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'sfx' && (
        <div className="flex items-center gap-1.5 px-3.5 py-2 border-b border-[#26262B]/70 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0 bg-[#141416]">
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
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                selectedSfxCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold'
                  : 'bg-[#1C1C22] text-[#A1A1AA] hover:text-white hover:bg-[#26262E] border border-[#2A2A32]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Main Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 flex flex-col gap-3">
        {/* Search Bar for SFX only (Soundtracks has its dedicated Jamendo integrated search) */}
        {activeTab === 'sfx' && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sound effects (boom, whoosh, riser)..."
              className="w-full bg-[#16161A] border border-[#27272F] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-blue-500/60 transition-colors"
            />
          </div>
        )}

        {/* ── Tab: Audio Mixer ── */}
        {activeTab === 'mixer' && (
          <div className="flex flex-col gap-3.5">
            <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-3.5 flex flex-col gap-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#60A5FA]" />
                Reel Audio Level Mixing
              </span>

              {/* Music Volume */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-mono-studio">
                  <span className="text-[#71717A]">SOUNDTRACK VOLUME</span>
                  <span className="text-[#60A5FA] font-bold">{musicVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(Number(e.target.value))}
                  className="w-full accent-[#3B82F6]"
                />
              </div>

              {/* Voice Volume */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-mono-studio">
                  <span className="text-[#71717A]">VOICEOVER / NARRATION LEVEL</span>
                  <span className="text-[#60A5FA] font-bold">{voiceVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={voiceVolume}
                  onChange={(e) => setVoiceVolume(Number(e.target.value))}
                  className="w-full accent-[#3B82F6]"
                />
              </div>

              {/* Auto-Ducking Switch */}
              <div className="flex items-center justify-between pt-2 border-t border-[#26262B]">
                <div>
                  <p className="text-xs font-semibold text-white">Smart Music Ducking</p>
                  <p className="text-[10px] text-[#A1A1AA]">Lower music volume when voiceover speaks</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoDucking((d) => !d)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                    autoDucking ? 'bg-[#3B82F6]' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                      autoDucking ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Room Ambience */}
            <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-3.5 flex flex-col gap-2">
              <span className="text-[10px] uppercase font-mono-studio text-[#71717A]">
                Voiceover Room Reverb
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'dry', label: 'Dry / Clean' },
                  { id: 'studio', label: 'Studio Room' },
                  { id: 'hall', label: 'Cathedral Hall' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setReverbRoom(r.id as any)}
                    className={`p-2 rounded-lg text-xs font-semibold border transition-all ${
                      reverbRoom === r.id
                        ? 'bg-[#1E2330] text-white border-[#3B82F6]'
                        : 'bg-[#141417] text-[#A1A1AA] border-[#2A2A30]'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 1: Soundtracks ── */}
        {activeTab === 'soundtracks' && (
          <div className="flex flex-col gap-2.5">
            {/* Search Input */}
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vibes, phonk, lofi, BPM..."
                className="w-full bg-[#16161A] border border-[#27272F] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-1">
              {filteredSoundtracks.map((track) => {
                const isSelected = selectedMusic === track.id;
                const isPending = pendingMusicId === track.id;
                const isPlaying = playingTrackId === track.id;

                return (
                  <div
                    key={track.id}
                    onClick={() => handleSelectSoundtrack(track.id)}
                    className={`group p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#181D2A] border-blue-500/80 ring-1 ring-blue-500/40 shadow-sm'
                        : isPending
                        ? 'bg-[#1A1E29] border-blue-500/50'
                        : 'bg-[#16161A] border-[#26262D] hover:border-[#3E3E4B] hover:bg-[#1A1A20]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => togglePlayTrack(track, e)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                          isPlaying
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/40 ring-2 ring-blue-400/50'
                            : 'bg-[#222228] text-zinc-300 hover:text-white hover:bg-blue-600'
                        }`}
                        title={isPlaying ? 'Pause preview' : 'Play preview'}
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4" fill="currentColor" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                        )}
                      </button>

                      <div className="min-w-0 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
                            {track.title}
                          </p>
                          {isSelected && (
                            <span className="text-[9px] font-mono-studio px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/40 font-bold shrink-0">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                          <span className="px-1.5 py-0.2 rounded bg-zinc-800/80 text-zinc-300 text-[9px] uppercase font-mono tracking-wider">
                            {track.genre}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-blue-950/40 text-blue-400 border border-blue-900/30 text-[9px] font-mono">
                            {track.bpm} BPM
                          </span>
                          <span className="text-zinc-500 font-mono text-[10px]">
                            {track.duration}
                          </span>
                        </div>
                      </div>
                    </div>

                    
                  </div>
                );
              })}
            </div>
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

        {/* ── Tab: Viral Meme Soundboard ── */}
        {activeTab === 'soundboard' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-studio text-[#71717A] uppercase tracking-wider">
                Instant Zero-Latency Viral Pads
              </span>
              <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Live Hotkeys
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {VIRAL_MEME_SOUNDBOARD.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    try {
                      const sound = new Audio(item.audioUrl);
                      sound.volume = 0.8;
                      sound.play();
                    } catch {}
                  }}
                  className="p-3 rounded-xl border border-[#2A2A30] bg-[#1C1C20] hover:border-amber-500/50 hover:bg-[#25252D] active:scale-[0.98] transition-all cursor-pointer flex flex-col gap-1.5 group relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl select-none">{item.emoji}</span>
                    <span className="text-[9px] font-mono-studio font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {item.shortcut}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-[#A1A1AA] truncate">{item.desc}</p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onAddSfxToTimeline) {
                        onAddSfxToTimeline({
                          id: item.id,
                          name: `${item.emoji} ${item.name}`,
                          category: 'Impact',
                          duration: '1.5s',
                          audioUrl: item.audioUrl,
                        });
                      }
                    }}
                    className="mt-1 text-[9px] font-bold text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-600 px-2 py-1 rounded transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    + Timeline
                  </button>
                </div>
              ))}
            </div>
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
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono-studio text-[#71717A]">
                    Recorded Waveform
                  </span>
                  <button
                    type="button"
                    onClick={downloadRecordedVoice}
                    className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white"
                  >
                    <Download className="w-3 h-3" /> Download
                  </button>
                </div>

                <div ref={waveformRef} className="w-full bg-[#141416] rounded-lg p-2" />

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => wavesurferInstance.current?.playPause()}
                    className="flex-1 bg-[#2A2A32] hover:bg-[#34343E] text-white rounded-xl py-2 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Preview
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

        {/* ── Tab 5: Custom Audio URL ── */}
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
