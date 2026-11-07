import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScrollableTabs, TabItem } from '@/src/shared/ui/ScrollableTabs';
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
  Sparkles,
  Search,
  X,
  ExternalLink,
  Download,
  RefreshCw,
} from 'lucide-react';
import { CustomSelect } from '@/src/shared/ui/CustomSelect';
import { workspaceApi } from '../../api/workspaceApi';
import { toast } from 'sonner';
import { addWorkspaceNotification } from '../../utils/workspaceNotificationManager';

export interface SoundtrackItem {
  id: string;
  title: string;
  artist?: string;
  genre: string;
  duration: string;
  bpm: number;
  mood: string;
  audioUrl: string;
  provider?: string;
}

export interface SoundEffectItem {
  id: string;
  name: string;
  category: 'Impact' | 'Transition' | 'Tension' | 'Action';
  duration: string;
  audioUrl: string;
  provider?: string;
}

export interface AudioPaneProps {
  onSelectMusic?: (musicId: string) => void;
  selectedMusic?: string;
  onApplyRecordedVoice?: (recordedUrl: string) => void;
  onAddSfxToTimeline?: (sfx: SoundEffectItem) => void;
}

export const SOUNDTRACK_GENRES = [
  { value: 'all', label: '✨ All Genres & Moods' },
  { value: 'cinematic', label: '🎬 Cinematic & Epic' },
  { value: 'motivational', label: '⚡ Motivational & Focus' },
  { value: 'ambient', label: '🌌 Ambient & Chill' },
  { value: 'lofi', label: '☕ Lo-Fi Hip Hop' },
  { value: 'phonk', label: '🏎️ Drift Phonk & Bass' },
  { value: 'synthwave', label: '🌆 Synthwave & Cyber' },
  { value: 'piano', label: '🎹 Piano & Classical' },
  { value: 'electronic', label: '⚡ Electronic & EDM' },
] as const;

export const SFX_CATEGORIES = [
  { value: 'all', label: '✨ All Sound Effects' },
  { value: 'Impact', label: '💥 Impacts & Booms' },
  { value: 'Transition', label: '⚡ Whooshes & Swishes' },
  { value: 'Tension', label: '⏳ Risers & Suspense' },
  { value: 'Action', label: '🎯 Hits, Clicks & Hits' },
] as const;

export const AUDIO_PROVIDERS = [
  { id: 'all', label: '✨ All Free Live Providers' },
  { id: 'jamendo', label: '🎵 Jamendo (500K+ CC)' },
  { id: 'wikimedia', label: '🏛️ Wikimedia Commons' },
  { id: 'internet_archive', label: '📚 Internet Archive' },
  { id: 'fma', label: '📻 Free Music Archive' },
  { id: 'open_sfx', label: '💥 Open SFX Commons' },
] as const;

function renderAudioProviderBadge(provider?: string) {
  switch (provider) {
    case 'jamendo':
      return (
        <span className="text-[9px] font-mono-studio text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1 rounded shrink-0">
          Jamendo
        </span>
      );
    case 'wikimedia':
      return (
        <span className="text-[9px] font-mono-studio text-purple-300 bg-purple-500/15 border border-purple-500/30 px-1 rounded shrink-0">
          Wikimedia
        </span>
      );
    case 'internet_archive':
      return (
        <span className="text-[9px] font-mono-studio text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1 rounded shrink-0">
          Archive
        </span>
      );
    case 'fma':
      return (
        <span className="text-[9px] font-mono-studio text-blue-300 bg-blue-500/15 border border-blue-500/30 px-1 rounded shrink-0">
          FMA
        </span>
      );
    case 'open_sfx':
      return (
        <span className="text-[9px] font-mono-studio text-pink-300 bg-pink-500/15 border border-pink-500/30 px-1 rounded shrink-0">
          OpenSFX
        </span>
      );
    default:
      return (
        <span className="text-[9px] font-mono-studio text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-1 rounded shrink-0">
          Free Audio
        </span>
      );
  }
}

export const AudioPane: React.FC<AudioPaneProps> = ({
  onSelectMusic,
  selectedMusic,
  onApplyRecordedVoice,
  onAddSfxToTimeline,
}) => {
  const [activeTab, setActiveTab] = useState<'soundtracks' | 'sfx' | 'record' | 'url'>('soundtracks');

  // Live stream states - zero hardcoded data
  const [liveSoundtracks, setLiveSoundtracks] = useState<SoundtrackItem[]>([]);
  const [liveSfx, setLiveSfx] = useState<SoundEffectItem[]>([]);
  const [totalSoundtracks, setTotalSoundtracks] = useState<number>(0);
  const [totalSfx, setTotalSfx] = useState<number>(0);

  // Filters & Search
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedSfxCategory, setSelectedSfxCategory] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [musicPage, setMusicPage] = useState<number>(1);
  const [sfxPage, setSfxPage] = useState<number>(1);

  // Selection & playback
  const [pendingMusicId, setPendingMusicId] = useState(selectedMusic || '');
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [playingSfxId, setPlayingSfxId] = useState<string | null>(null);
  const [customAudioUrl, setCustomAudioUrl] = useState('');
  const [customAudioTitle, setCustomAudioTitle] = useState('');
  const [customAudioPlaying, setCustomAudioPlaying] = useState(false);

  // Loading & error flags
  const [isSearchingAudio, setIsSearchingAudio] = useState(false);
  const [isSearchingSfx, setIsSearchingSfx] = useState(false);
  const [audioSearchError, setAudioSearchError] = useState<string | null>(null);
  const [sfxSearchError, setSfxSearchError] = useState<string | null>(null);

  // Hidden audio preview elements
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const sfxAudioRef = useRef<HTMLAudioElement | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);

  // Voice recording state
  const { status, startRecording, stopRecording, mediaBlobUrl } =
    useReactMediaRecorder({ audio: true });
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurferInstance = useRef<WaveSurfer | null>(null);

  // Live Soundtrack Search via Backend Service
  const fetchLiveSoundtracks = useCallback(
    async (page: number = 1, append: boolean = false) => {
      setIsSearchingAudio(true);
      setAudioSearchError(null);
      try {
        const result = await workspaceApi.searchOpenTracks(
          searchQuery.trim(),
          selectedGenre === 'all' ? '' : selectedGenre,
          24,
          selectedProvider,
          page
        );

        if (append) {
          setLiveSoundtracks((prev) => [...prev, ...(result.items || [])]);
        } else {
          setLiveSoundtracks(result.items || []);
        }
        setTotalSoundtracks(result.total || (result.items || []).length);
      } catch (error) {
        setAudioSearchError(error instanceof Error ? error.message : 'Could not load live soundtrack streams.');
      } finally {
        setIsSearchingAudio(false);
      }
    },
    [searchQuery, selectedGenre, selectedProvider]
  );

  // Live Sound Effects Search via Backend Service
  const fetchLiveSfx = useCallback(
    async (page: number = 1, append: boolean = false) => {
      setIsSearchingSfx(true);
      setSfxSearchError(null);
      try {
        const query = searchQuery.trim() || (selectedSfxCategory === 'all' ? '' : selectedSfxCategory);
        const result = await workspaceApi.searchOpenSfx(
          query,
          24,
          selectedSfxCategory,
          selectedProvider,
          page
        );

        if (append) {
          setLiveSfx((prev) => [...prev, ...(result.items || [])]);
        } else {
          setLiveSfx(result.items || []);
        }
        setTotalSfx(result.total || (result.items || []).length);
      } catch (error) {
        setSfxSearchError(error instanceof Error ? error.message : 'Could not load sound effect streams.');
      } finally {
        setIsSearchingSfx(false);
      }
    },
    [searchQuery, selectedSfxCategory, selectedProvider]
  );

  // Debounced search on filter changes
  useEffect(() => {
    if (activeTab === 'soundtracks') {
      const timer = setTimeout(() => {
        setMusicPage(1);
        fetchLiveSoundtracks(1, false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [activeTab, searchQuery, selectedGenre, selectedProvider, fetchLiveSoundtracks]);

  useEffect(() => {
    if (activeTab === 'sfx') {
      const timer = setTimeout(() => {
        setSfxPage(1);
        fetchLiveSfx(1, false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [activeTab, searchQuery, selectedSfxCategory, selectedProvider, fetchLiveSfx]);

  const handleLoadMoreMusic = () => {
    const nextPage = musicPage + 1;
    setMusicPage(nextPage);
    fetchLiveSoundtracks(nextPage, true);
  };

  const handleLoadMoreSfx = () => {
    const nextPage = sfxPage + 1;
    setSfxPage(nextPage);
    fetchLiveSfx(nextPage, true);
  };

  // WaveSurfer initialization for recorded audio playback
  useEffect(() => {
    if (!mediaBlobUrl || !waveformRef.current) return;

    if (wavesurferInstance.current) {
      wavesurferInstance.current.destroy();
    }

    try {
      wavesurferInstance.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#4B5563',
        progressColor: '#3B82F6',
        cursorColor: '#60A5FA',
        barWidth: 2,
        barRadius: 2,
        height: 48,
        normalize: true,
      });

      wavesurferInstance.current.load(mediaBlobUrl);
    } catch {}

    return () => {
      if (wavesurferInstance.current) {
        wavesurferInstance.current.destroy();
      }
    };
  }, [mediaBlobUrl]);

  // Recording duration timer
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

  const togglePlayTrack = (track: SoundtrackItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!previewAudioRef.current) return;

    if (playingTrackId === track.id) {
      previewAudioRef.current.pause();
      setPlayingTrackId(null);
    } else {
      previewAudioRef.current.src = track.audioUrl;
      previewAudioRef.current.volume = 0.8;
      previewAudioRef.current.play().catch(() => {});
      setPlayingTrackId(track.id);
    }
  };

  const togglePlaySfx = (sfx: SoundEffectItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!sfxAudioRef.current) return;

    if (playingSfxId === sfx.id) {
      sfxAudioRef.current.pause();
      setPlayingSfxId(null);
    } else {
      sfxAudioRef.current.src = sfx.audioUrl;
      sfxAudioRef.current.volume = 0.85;
      sfxAudioRef.current.play().catch(() => {});
      setPlayingSfxId(sfx.id);
    }
  };

  const handleSelectSoundtrack = (trackId: string) => {
    setPendingMusicId(trackId);
    if (onSelectMusic) {
      onSelectMusic(trackId);
    }
    const track = liveSoundtracks.find((t) => t.id === trackId);
    toast.success(`Applied Soundtrack: ${track?.title || 'Selected Track'}`);
    addWorkspaceNotification({
      title: 'Soundtrack Selected',
      message: `Selected "${track?.title || 'Track'}" as background music.`,
      category: 'media',
      type: 'success',
      targetPane: 'audio',
      actionLabel: 'Audio',
    });
  };

  const handleApplyCustomAudio = () => {
    if (!customAudioUrl.trim()) return;
    const directUrl = customAudioUrl.trim();
    if (onSelectMusic) {
      onSelectMusic(directUrl);
    }
    toast.success('Applied Custom Audio Stream');
    addWorkspaceNotification({
      title: 'Custom Audio Applied',
      message: 'Background music updated from direct stream URL.',
      category: 'media',
      type: 'success',
      targetPane: 'audio',
      actionLabel: 'Audio',
    });
  };

  const handleApplyRecordedVoice = () => {
    if (!mediaBlobUrl) return;
    if (onApplyRecordedVoice) {
      onApplyRecordedVoice(mediaBlobUrl);
    }
    toast.success('Applied Studio Voiceover Recording');
    addWorkspaceNotification({
      title: 'Voiceover Recording Applied',
      message: `Mic recording applied to project (${recordingDuration}s).`,
      category: 'voice',
      type: 'success',
      targetPane: 'audio',
      actionLabel: 'Voice',
    });
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  const TABS: TabItem<'soundtracks' | 'sfx' | 'record' | 'url'>[] = [
    { id: 'soundtracks', label: 'Soundtracks', icon: Music, badge: totalSoundtracks ? `${totalSoundtracks.toLocaleString()}` : undefined },
    { id: 'sfx', label: 'Sound Effects', icon: Sparkles, badge: totalSfx ? `${totalSfx.toLocaleString()}` : undefined },
    { id: 'record', label: 'Studio Record', icon: Mic },
    { id: 'url', label: 'Web Audio Import', icon: ExternalLink },
  ];

  return (
    <div className="flex flex-col h-full bg-[#141414] text-white font-sans-studio select-none overflow-hidden rounded-none border-0">
      {/* Hidden Audio Elements */}
      <audio ref={previewAudioRef} onEnded={() => setPlayingTrackId(null)} className="hidden" />
      <audio ref={sfxAudioRef} onEnded={() => setPlayingSfxId(null)} className="hidden" />
      <audio ref={customAudioRef} onEnded={() => setCustomAudioPlaying(false)} className="hidden" />

      {/* ── Top Header Bar ── */}
      <div className="relative h-11 px-3.5 bg-[#141414] border-b border-[#242424] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Music className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="text-xs font-bold text-white truncate">
            Audio &amp; Voiceover Studio
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {(isSearchingAudio || isSearchingSfx) && (
            <RefreshCw className="w-3.5 h-3.5 text-[#60A5FA] animate-spin" />
          )}
          <span className="text-[10px] font-mono-studio text-slate-400 bg-white/[0.06] px-2 py-0.5 rounded-full border border-[#242424]">
            {activeTab === 'soundtracks'
              ? `${liveSoundtracks.length} Live Tracks`
              : activeTab === 'sfx'
              ? `${liveSfx.length} Live SFX`
              : 'Studio Audio'}
          </span>
        </div>
      </div>

      {/* ── Standardized Scrollable Tabs (Clean 4-Tab Navigation) ── */}
      <div className="p-2.5 bg-[#111111] border-b border-[#242424] shrink-0">
        <ScrollableTabs
          tabs={TABS}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab)}
          containerBgClassName="bg-[#181818]"
        />
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 flex flex-col gap-3">
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: LIVE SOUNDTRACKS */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'soundtracks' && (
          <div className="flex flex-col gap-2.5">
            {/* Search & Genre Filter */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-[140px]">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search live soundtracks (e.g. cinematic, phonk, epic, lofi)..."
                  className="w-full bg-[#181818] border border-[#242424] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/40 transition-all"
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
              <div className="shrink-0 w-36 sm:w-44">
                <CustomSelect
                  value={selectedGenre}
                  onChange={(val) => setSelectedGenre(val)}
                  options={SOUNDTRACK_GENRES.map((g) => ({
                    value: g.value,
                    label: g.label,
                  }))}
                  variant="compact"
                  align="right"
                  buttonClassName="!w-full !justify-between !bg-[#181818] !border-[#242424] !text-xs !py-2 !px-3 font-semibold hover:!border-white/10"
                />
              </div>
            </div>

            {/* Provider Filter Quick Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-0.5">
              {AUDIO_PROVIDERS.filter((p) => p.id !== 'open_sfx').map((provider) => {
                const isProviderActive = selectedProvider === provider.id;
                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => setSelectedProvider(provider.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                      isProviderActive
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : 'bg-[#181818] hover:bg-[#202020] text-zinc-400 hover:text-white border border-[#262626]'
                    }`}
                  >
                    {provider.label}
                  </button>
                );
              })}
            </div>

            {/* Track Stream List */}
            <div className="flex flex-col gap-2 pt-1">
              {isSearchingAudio && liveSoundtracks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-zinc-500 gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                  <span className="text-xs font-mono-studio">Querying live royalty-free music streams...</span>
                </div>
              )}
              {audioSearchError && (
                <p role="alert" className="py-2 text-xs text-red-400">{audioSearchError}</p>
              )}
              {!isSearchingAudio && !audioSearchError && liveSoundtracks.length === 0 && (
                <p className="py-6 text-center text-xs text-zinc-500">No soundtrack streams found matching your query.</p>
              )}
              {liveSoundtracks.map((track) => {
                const isSelected = selectedMusic === track.id || selectedMusic === track.audioUrl;
                const isPending = pendingMusicId === track.id;
                const isPlaying = playingTrackId === track.id;

                return (
                  <div
                    key={track.id}
                    onClick={() => handleSelectSoundtrack(track.id)}
                    className={`group p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 transform-gpu ${
                      isSelected
                        ? 'bg-[#18233C] text-white border-blue-500/80 ring-1 ring-blue-500/30'
                        : isPending
                        ? 'bg-[#1A1E29] border-blue-500/50'
                        : 'bg-[#181818] border-[#242424] hover:border-[#3E3E4B] hover:bg-[#1A1A20]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => togglePlayTrack(track, e)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                          isPlaying
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/40 ring-2 ring-blue-400/50'
                            : 'bg-[#1E1E1E] text-zinc-300 hover:text-white hover:bg-blue-600'
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
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-xs font-semibold truncate text-white group-hover:text-blue-300 transition-colors">
                            {track.title}
                          </p>
                          {renderAudioProviderBadge(track.provider)}
                          {isSelected && (
                            <span className="text-[9px] font-mono-studio px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold shrink-0">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                          <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-mono tracking-wider bg-zinc-800/80 text-zinc-300">
                            {track.genre}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#1E1E1E] text-zinc-300 border border-[#2E2E2E]">
                            {track.bpm} BPM
                          </span>
                          <span className="font-mono text-[10px] text-zinc-500">
                            {track.duration}
                          </span>
                          {track.artist && (
                            <span className="text-[10px] text-zinc-500 truncate hidden sm:inline">
                              by {track.artist}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSoundtrack(track.id);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-[#22222A] hover:bg-blue-600 text-zinc-300 hover:text-white border border-[#2D2D38]'
                      }`}
                    >
                      {isSelected ? 'Applied' : '+ Apply'}
                    </button>
                  </div>
                );
              })}

              {/* Load More Soundtracks */}
              {liveSoundtracks.length > 0 && (
                <div className="pt-2 pb-1 flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleLoadMoreMusic}
                    disabled={isSearchingAudio}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#1C1C22] hover:bg-[#25252E] border border-[#2D2D35] hover:border-blue-500/50 text-xs font-semibold text-zinc-200 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm group"
                  >
                    <Plus className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform shrink-0" />
                    <span>Load More Soundtracks</span>
                    <span className="text-[10px] font-mono-studio text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                      +24
                    </span>
                  </button>
                  <span className="text-[10px] font-mono-studio text-zinc-500 text-center">
                    Showing {liveSoundtracks.length} of {totalSoundtracks ? totalSoundtracks.toLocaleString() : '500,000+'} Tracks
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: LIVE SOUND EFFECTS (SFX) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'sfx' && (
          <div className="flex flex-col gap-2.5">
            {/* Search & SFX Category in One Row */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-[140px]">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search live sound effects (whoosh, boom, hit, riser)..."
                  className="w-full bg-[#181818] border border-[#242424] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/40 transition-all"
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
              <div className="shrink-0 w-36 sm:w-44">
                <CustomSelect
                  value={selectedSfxCategory}
                  onChange={(val) => setSelectedSfxCategory(val)}
                  options={SFX_CATEGORIES.map((c) => ({
                    value: c.value,
                    label: c.label,
                  }))}
                  variant="compact"
                  align="right"
                  buttonClassName="!w-full !justify-between !bg-[#181818] !border-[#242424] !text-xs !py-2 !px-3 font-semibold hover:!border-white/10"
                />
              </div>
            </div>

            {/* Provider Filter Quick Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-0.5">
              {[
                { id: 'all', label: '✨ All SFX Providers' },
                { id: 'open_sfx', label: '💥 Open SFX Commons' },
                { id: 'wikimedia', label: '🏛️ Wikimedia SFX' },
                { id: 'internet_archive', label: '📚 Archive SFX' },
              ].map((provider) => {
                const isProviderActive = selectedProvider === provider.id;
                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => setSelectedProvider(provider.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                      isProviderActive
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : 'bg-[#181818] hover:bg-[#202020] text-zinc-400 hover:text-white border border-[#262626]'
                    }`}
                  >
                    {provider.label}
                  </button>
                );
              })}
            </div>

            {isSearchingSfx && liveSfx.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-zinc-500 gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-xs font-mono-studio">Querying live sound effect libraries...</span>
              </div>
            )}
            {sfxSearchError && (
              <p role="alert" className="py-2 text-xs text-red-400">{sfxSearchError}</p>
            )}
            {!isSearchingSfx && !sfxSearchError && liveSfx.length === 0 && (
              <p className="py-6 text-center text-xs text-zinc-500">No sound effects found matching your query.</p>
            )}
            {liveSfx.map((sfx) => {
              const isPlaying = playingSfxId === sfx.id;

              return (
                <div
                  key={sfx.id}
                  className="p-3 rounded-xl border border-[#242424] hover:border-[#383842] bg-[#181818] hover:bg-[#1D1D22] transition-all flex items-center justify-between gap-3 transform-gpu"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => togglePlaySfx(sfx, e)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                        isPlaying
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/40 ring-2 ring-blue-400/50'
                          : 'bg-[#1E1E1E] text-zinc-300 hover:text-white hover:bg-blue-600'
                      }`}
                    >
                      {isPlaying ? (
                        <Pause className="w-3.5 h-3.5" fill="currentColor" />
                      ) : (
                        <Play className="w-3.5 h-3.5 ml-0.5" fill="currentColor" />
                      )}
                    </button>

                    <div className="min-w-0 flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {sfx.name}
                        </p>
                        {renderAudioProviderBadge(sfx.provider)}
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] text-zinc-400 font-mono-studio">
                        <span className="text-blue-400">{sfx.category}</span>
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
                      toast.success(`Added SFX: ${sfx.name}`);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#22222A] hover:bg-blue-600 border border-[#2E2E38] hover:border-transparent text-white text-[10px] font-semibold transition-all shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    + Timeline
                  </button>
                </div>
              );
            })}

            {/* Load More Sound Effects */}
            {liveSfx.length > 0 && (
              <div className="pt-2 pb-1 flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleLoadMoreSfx}
                  disabled={isSearchingSfx}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#1C1C22] hover:bg-[#25252E] border border-[#2D2D35] hover:border-blue-500/50 text-xs font-semibold text-zinc-200 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm group"
                >
                  <Plus className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span>Load More Sound Effects</span>
                  <span className="text-[10px] font-mono-studio text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                    +24
                  </span>
                </button>
                <span className="text-[10px] font-mono-studio text-zinc-500 text-center">
                  Showing {liveSfx.length} of {totalSfx ? totalSfx.toLocaleString() : '65,000+'} SFX
                </span>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: STUDIO VOICE RECORD */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'record' && (
          <div className="flex flex-col gap-4">
            <div className="bg-[#181818] border border-[#242424] rounded-2xl p-5 flex flex-col items-center text-center gap-3 shadow-sm">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                  status === 'recording'
                    ? 'bg-rose-500/20 text-rose-500 ring-4 ring-rose-500/30 animate-pulse'
                    : 'bg-[#1E1E1E] text-white hover:bg-[#242C40]'
                }`}
              >
                {status === 'recording' ? (
                  <MicOff className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8 text-[#60A5FA]" />
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-white">
                  {status === 'recording' ? 'Recording Voiceover...' : 'Microphone Voiceover'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {status === 'recording'
                    ? 'Speak clearly into your microphone'
                    : 'Record custom voice narration directly to video'}
                </p>
              </div>

              {status === 'recording' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-400 text-xs font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  {formatSeconds(recordingDuration)}
                </div>
              )}

              <div className="flex items-center gap-2 w-full pt-1">
                {status !== 'recording' ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/20"
                  >
                    <Mic className="w-4 h-4" />
                    Start Recording
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-rose-500/20"
                  >
                    <MicOff className="w-4 h-4" />
                    Stop Recording
                  </button>
                )}
              </div>
            </div>

            {/* Recording Review Player */}
            {mediaBlobUrl && (
              <div className="bg-[#181818] border border-[#242424] rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-[#60A5FA]" />
                    Recorded Audio Playback
                  </span>
                  <span className="text-[10px] font-mono-studio text-slate-400">
                    {formatSeconds(recordingDuration)}
                  </span>
                </div>

                <div ref={waveformRef} className="w-full bg-[#111111] rounded-lg p-2" />

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (wavesurferInstance.current) {
                        wavesurferInstance.current.playPause();
                      }
                    }}
                    className="py-2 px-3 rounded-lg bg-[#242424] hover:bg-[#2C2C2C] text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Preview
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyRecordedVoice}
                    className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Apply to Video Voiceover
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 4: WEB URL AUDIO IMPORT */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'url' && (
          <div className="flex flex-col gap-4">
            <div className="bg-[#181818] border border-[#242424] rounded-xl p-4 flex flex-col gap-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-[#60A5FA]" />
                Import Audio from Direct URL
              </span>
              <p className="text-xs text-slate-400">
                Paste any direct MP3, WAV, or AAC audio stream link from Jamendo, Archive.org, or your own CDN.
              </p>

              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={customAudioTitle}
                  onChange={(e) => setCustomAudioTitle(e.target.value)}
                  placeholder="Audio Title (e.g. Cinematic Intro Theme)..."
                  className="w-full bg-[#111111] border border-[#242424] rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-[#2563EB] transition-colors"
                />
                <input
                  type="url"
                  value={customAudioUrl}
                  onChange={(e) => setCustomAudioUrl(e.target.value)}
                  placeholder="https://example.com/audio/track.mp3"
                  className="w-full bg-[#111111] border border-[#242424] rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-[#2563EB] transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                {customAudioUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!customAudioRef.current) return;
                      if (customAudioPlaying) {
                        customAudioRef.current.pause();
                        setCustomAudioPlaying(false);
                      } else {
                        customAudioRef.current.src = customAudioUrl;
                        customAudioRef.current.play().catch(() => toast.error('Could not load audio from URL'));
                        setCustomAudioPlaying(true);
                      }
                    }}
                    className="py-2 px-3 rounded-lg bg-[#242424] hover:bg-[#2C2C2C] text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    {customAudioPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {customAudioPlaying ? 'Pause' : 'Test Audio'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleApplyCustomAudio}
                  disabled={!customAudioUrl.trim()}
                  className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Apply as Background Music
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioPane;
