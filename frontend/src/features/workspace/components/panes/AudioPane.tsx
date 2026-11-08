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
  Trash2,
  FileText,
  Sliders,
  ChevronDown,
  ChevronUp,
  Clock,
  Radio,
  Edit2,
  RotateCcw,
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

export interface VoiceoverTake {
  id: string;
  name: string;
  blobUrl: string;
  duration: number;
  durationFormatted: string;
  createdAt: string;
}

export interface AudioPaneProps {
  onSelectMusic?: (musicId: string) => void;
  selectedMusic?: string;
  onApplyRecordedVoice?: (recordedUrl: string) => void;
  onAddSfxToTimeline?: (sfx: SoundEffectItem) => void;
  scriptText?: string;
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
  { value: 'all', label: '✨ All Sound FX' },
  { value: 'Impact', label: '💥 Impacts & Booms' },
  { value: 'Transition', label: '⚡ Whooshes & Swishes' },
  { value: 'Tension', label: '⏳ Risers & Suspense' },
  { value: 'Action', label: '🎯 Hits, Clicks & Hits' },
] as const;

export const SOUNDTRACK_PROVIDERS = [
  { id: 'all', label: '✨ All Music Sources' },
  { id: 'jamendo', label: '🎵 Jamendo (500K+ CC)' },
  { id: 'ccmixter', label: '🎧 ccMixter (45K+ CC)' },
  { id: 'netlabels', label: '💿 Netlabels Open Music (70K+)' },
  { id: 'fma', label: '📻 Free Music Archive (150K+)' },
  { id: 'wikimedia', label: '🏛️ Wikimedia Commons' },
  { id: 'internet_archive', label: '📚 Internet Archive' },
] as const;

export const SFX_PROVIDERS = [
  { id: 'all', label: '✨ All Sound FX' },
  { id: 'bbc_sfx', label: '🎙️ BBC Sound Effects (16K+)' },
  { id: 'open_sfx', label: '💥 Open SFX Commons' },
  { id: 'wikimedia', label: '🏛️ Wikimedia Commons SFX' },
  { id: 'internet_archive', label: '📚 Internet Archive SFX' },
] as const;

export const AUDIO_PROVIDERS = SOUNDTRACK_PROVIDERS;

function renderAudioProviderBadge(provider?: string) {
  switch (provider) {
    case 'jamendo':
      return (
        <span className="text-[9px] font-mono-studio text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1 rounded shrink-0">
          Jamendo
        </span>
      );
    case 'ccmixter':
      return (
        <span className="text-[9px] font-mono-studio text-teal-300 bg-teal-500/15 border border-teal-500/30 px-1 rounded shrink-0">
          ccMixter
        </span>
      );
    case 'netlabels':
      return (
        <span className="text-[9px] font-mono-studio text-violet-300 bg-violet-500/15 border border-violet-500/30 px-1 rounded shrink-0">
          Netlabels
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
    case 'bbc_sfx':
      return (
        <span className="text-[9px] font-mono-studio text-rose-300 bg-rose-500/15 border border-rose-500/30 px-1 rounded shrink-0">
          BBC SFX
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

export function formatCompactAudioCount(num: number): string {
  if (!num) return '0';
  if (num >= 10_000_000) return `${(num / 1_000_000).toFixed(1)}M+`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M+`;
  if (num >= 100_000) return `${Math.round(num / 1_000)}K+`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K+`;
  return num.toString();
}

export function cleanTrackDisplayMetadata(rawTitle: string, rawArtist?: string): { title: string; artist: string } {
  let title = (rawTitle || '').replace(/^File:/i, '').replace(/\.(mp3|ogg|wav|flac|m4a|opus|aac)$/i, '').trim();
  let artist = (rawArtist || '').trim();

  // Strip license tags like (cc-by-3.0), (CC BY), [CC-BY], (public domain), etc.
  title = title.replace(/[\(\[]\s*cc[\s\-_0-9a-z.]*[\)\]]/gi, '').trim();
  title = title.replace(/[\(\[]\s*(public domain|royalty[\s\-_]free|creative commons|open audio)[\)\]]/gi, '').trim();
  title = title.replace(/[\(\[]\s*\d{4}\s*[\)\]]/g, '').trim();

  // Handle '"Title" by Artist'
  const byMatch = title.match(/^["']?(.+?)["']?\s+by\s+(.+)$/i);
  if (byMatch) {
    title = byMatch[1].trim();
    if (!artist || artist === 'Wikimedia Contributor' || artist.includes('Artist') || artist === 'Independent Creator') {
      artist = byMatch[2].trim();
    }
  }

  // Handle 'Artist - Title' or 'Title - Artist'
  if (title.includes(' - ') || title.includes(' – ')) {
    const parts = title.split(/\s+[-–]\s+/);
    if (parts.length === 2) {
      const p0 = parts[0].trim();
      const p1 = parts[1].trim();
      const p1Clean = p1.replace(/([a-zA-Z]+)[0-9]{2,}$/, '$1').trim();
      const p0Clean = p0.replace(/([a-zA-Z]+)[0-9]{2,}$/, '$1').trim();

      if (!artist || artist === 'Wikimedia Contributor' || artist.includes('Artist') || artist === 'Independent Creator') {
        if (p0.split(' ').length <= 3 && !/waltz|anthem|sound|theme|piano|loop|effect/i.test(p0)) {
          artist = p0Clean;
          title = p1Clean;
        } else {
          title = p0Clean;
          artist = p1Clean;
        }
      } else {
        title = p1Clean.length > p0Clean.length ? p1Clean : p0Clean;
      }
    }
  }

  // Strip date prefixes like '03may2020-tobefree' or '2020-05-03_'
  title = title.replace(/^\d{1,4}[a-zA-Z]{3,4}\d{2,4}[-_\s]*/, '');
  title = title.replace(/^\d{4}[-_]\d{2}[-_]\d{2}[-_\s]*/, '');

  // Clean hyphenated/snake case words like 'tobefree' -> 'To Be Free'
  if (title.includes('-') || title.includes('_')) {
    title = title.replace(/[-_]+/g, ' ').trim();
  } else if (title.toLowerCase() === 'tobefree') {
    title = 'To Be Free';
  }

  // Strip trailing usernames/digits like Felipe RuizBRX11
  if (artist) {
    artist = artist.replace(/([a-zA-Z]+)[0-9]{2,}$/, '$1').trim();
    artist = artist.replace(/^by\s+/i, '').replace(/[\(\[].*?[\)\]]/g, '').trim();
  }

  // Clean extra quotes
  title = title.replace(/^["'\s]+|["'\s]+$/g, '').trim();
  title = title.replace(/\s{2,}/g, ' ');

  // Title-case if all lower or upper
  if (title === title.toLowerCase() || title === title.toUpperCase()) {
    title = title.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return {
    title: title || 'Soundtrack Track',
    artist: artist && artist !== 'Wikimedia Contributor' && artist !== 'Independent Creator' ? artist : 'Independent Artist',
  };
}

export const AudioPane: React.FC<AudioPaneProps> = ({
  onSelectMusic,
  selectedMusic,
  onApplyRecordedVoice,
  onAddSfxToTimeline,
  scriptText = '',
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
  const takeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Voice recording & takes state
  const { status, startRecording, stopRecording, mediaBlobUrl } =
    useReactMediaRecorder({ audio: true });
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurferInstance = useRef<WaveSurfer | null>(null);
  const lastProcessedBlob = useRef<string | null>(null);

  const [recordedTakes, setRecordedTakes] = useState<VoiceoverTake[]>(() => {
    try {
      const stored = localStorage.getItem('apexmind_recorded_voiceover_takes');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return [];
  });
  const [playingTakeId, setPlayingTakeId] = useState<string | null>(null);
  const [editingTakeId, setEditingTakeId] = useState<string | null>(null);
  const [editingTakeName, setEditingTakeName] = useState<string>('');

  // Teleprompter & studio options
  const [isTeleprompterOpen, setIsTeleprompterOpen] = useState<boolean>(true);
  const [teleprompterText, setTeleprompterText] = useState<string>(() => {
    return scriptText?.trim() || 'Master your mind. The obstacle in your path is not in your way, it is the way. Stay disciplined and focused.';
  });
  const [teleprompterFontSize, setTeleprompterFontSize] = useState<number>(14);
  const [syncVideoPlayhead, setSyncVideoPlayhead] = useState<boolean>(true);
  const [useCountdown, setUseCountdown] = useState<boolean>(true);
  const [countdownVal, setCountdownVal] = useState<number | null>(null);

  // Persist takes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('apexmind_recorded_voiceover_takes', JSON.stringify(recordedTakes));
    } catch {}
  }, [recordedTakes]);

  // Sync teleprompter with project script changes
  useEffect(() => {
    if (scriptText?.trim()) {
      setTeleprompterText(scriptText.trim());
    }
  }, [scriptText]);

  // Auto-save fresh recording takes when completed
  useEffect(() => {
    if (mediaBlobUrl && mediaBlobUrl !== lastProcessedBlob.current && status === 'stopped') {
      lastProcessedBlob.current = mediaBlobUrl;
      const dur = recordingDuration || 2;
      const newTake: VoiceoverTake = {
        id: `take-${Date.now()}`,
        name: `Take ${recordedTakes.length + 1} (${dur}s)`,
        blobUrl: mediaBlobUrl,
        duration: dur,
        durationFormatted: `${Math.floor(dur / 60)}:${(dur % 60).toString().padStart(2, '0')}`,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setRecordedTakes((prev) => [newTake, ...prev]);
      toast.success(`Voiceover Take ${recordedTakes.length + 1} saved to library!`);
      addWorkspaceNotification({
        title: 'Voiceover Take Captured',
        message: `Take ${recordedTakes.length + 1} (${dur}s) saved to library.`,
        category: 'voice',
        type: 'success',
        targetPane: 'audio',
        actionLabel: 'Audio',
      });
    }
  }, [mediaBlobUrl, status, recordingDuration, recordedTakes.length]);

  const handleStartRecording = () => {
    if (useCountdown) {
      setCountdownVal(3);
      const cdTimer = setInterval(() => {
        setCountdownVal((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(cdTimer);
            setCountdownVal(null);
            startRecording();
            if (syncVideoPlayhead) {
              window.dispatchEvent(new CustomEvent('workspace:timeline-play'));
            }
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      startRecording();
      if (syncVideoPlayhead) {
        window.dispatchEvent(new CustomEvent('workspace:timeline-play'));
      }
    }
  };

  const handleStopRecording = () => {
    stopRecording();
    if (syncVideoPlayhead) {
      window.dispatchEvent(new CustomEvent('workspace:timeline-pause'));
    }
  };

  const togglePlayTake = (take: VoiceoverTake, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!takeAudioRef.current) return;
    if (playingTakeId === take.id) {
      takeAudioRef.current.pause();
      setPlayingTakeId(null);
    } else {
      takeAudioRef.current.src = take.blobUrl;
      takeAudioRef.current.play().catch(() => {});
      setPlayingTakeId(take.id);
    }
  };

  const handleApplyTakeToTimeline = (take: VoiceoverTake, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onApplyRecordedVoice) {
      onApplyRecordedVoice(take.blobUrl);
    }
    toast.success(`Applied "${take.name}" to Video Timeline!`);
    addWorkspaceNotification({
      title: 'Voiceover Inserted',
      message: `"${take.name}" placed on video timeline at playhead.`,
      category: 'voice',
      type: 'success',
      targetPane: 'audio',
      actionLabel: 'Voice',
    });
  };

  const handleDownloadTake = (take: VoiceoverTake, e: React.MouseEvent) => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = take.blobUrl;
    a.download = `${take.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Downloaded ${take.name}`);
  };

  const handleDeleteTake = (takeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecordedTakes((prev) => prev.filter((t) => t.id !== takeId));
    if (playingTakeId === takeId && takeAudioRef.current) {
      takeAudioRef.current.pause();
      setPlayingTakeId(null);
    }
    toast.info('Voiceover take removed');
  };

  const handleSaveRename = (takeId: string) => {
    if (!editingTakeName.trim()) return;
    setRecordedTakes((prev) =>
      prev.map((t) => (t.id === takeId ? { ...t, name: editingTakeName.trim() } : t))
    );
    setEditingTakeId(null);
  };

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
    { id: 'soundtracks', label: 'Music', icon: Music, badge: totalSoundtracks ? formatCompactAudioCount(totalSoundtracks) : undefined },
    { id: 'sfx', label: 'Sound FX', icon: Sparkles, badge: totalSfx ? formatCompactAudioCount(totalSfx) : undefined },
    { id: 'record', label: 'Voiceover', icon: Mic, badge: recordedTakes.length ? `${recordedTakes.length}` : undefined },
    { id: 'url', label: 'Import', icon: ExternalLink },
  ];

  return (
    <div className="flex flex-col h-full bg-[#141414] text-white font-sans-studio select-none overflow-hidden rounded-none border-0">
      {/* Hidden Audio Elements */}
      <audio ref={previewAudioRef} onEnded={() => setPlayingTrackId(null)} className="hidden" />
      <audio ref={sfxAudioRef} onEnded={() => setPlayingSfxId(null)} className="hidden" />
      <audio ref={customAudioRef} onEnded={() => setCustomAudioPlaying(false)} className="hidden" />
      <audio ref={takeAudioRef} onEnded={() => setPlayingTakeId(null)} className="hidden" />

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
              ? `${liveSoundtracks.length} Music Tracks`
              : activeTab === 'sfx'
              ? `${liveSfx.length} Sound FX`
              : 'Studio Audio'}
          </span>
        </div>
      </div>

      {/* ── Standardized Scrollable Tabs (Clean 4-Tab Navigation) ── */}
      <div className="p-2.5 bg-[#111111] border-b border-[#242424] shrink-0">
        <ScrollableTabs
          tabs={TABS}
          activeTab={activeTab}
          onChange={(tab) => {
            setActiveTab(tab);
            setSelectedProvider('all');
            setSearchQuery('');
          }}
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
                  placeholder="Search background music (cinematic, phonk, epic, lofi)..."
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
              {SOUNDTRACK_PROVIDERS.map((provider) => {
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
                <div className="py-8 flex flex-col items-center justify-center gap-2.5 text-center">
                  <p className="text-xs text-zinc-400">No music tracks found for this specific filter.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProvider('all');
                      setSelectedGenre('all');
                      setSearchQuery('');
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors cursor-pointer shadow-sm"
                  >
                    Explore All Music Sources
                  </button>
                </div>
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

                      {(() => {
                        const { title: cleanTitle, artist: cleanArtist } = cleanTrackDisplayMetadata(track.title, track.artist);
                        return (
                          <div className="min-w-0 flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p className="text-xs font-semibold truncate text-white group-hover:text-blue-300 transition-colors" title={cleanTitle}>
                                {cleanTitle}
                              </p>
                              {renderAudioProviderBadge(track.provider)}
                              {isSelected && (
                                <span className="text-[9px] font-mono-studio px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold shrink-0">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                              {cleanArtist && (
                                <span className="text-[10px] text-blue-400/90 font-medium truncate max-w-[130px]" title={`by ${cleanArtist}`}>
                                  by {cleanArtist}
                                </span>
                              )}
                              <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-mono tracking-wider bg-zinc-800/80 text-zinc-300 shrink-0">
                                {track.genre}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#1E1E1E] text-zinc-300 border border-[#2E2E2E] shrink-0">
                                {track.bpm} BPM
                              </span>
                              <span className="font-mono text-[10px] text-zinc-500 shrink-0">
                                {track.duration}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
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
                    <span>Load More Music Tracks</span>
                    <span className="text-[10px] font-mono-studio text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                      +24
                    </span>
                  </button>
                  <span className="text-[10px] font-mono-studio text-zinc-500 text-center">
                    Showing {liveSoundtracks.length} of {totalSoundtracks ? formatCompactAudioCount(totalSoundtracks) : '500K+'} Music Tracks
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
                  placeholder="Search sound effects & FX (whoosh, boom, hit, riser)..."
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
              {SFX_PROVIDERS.map((provider) => {
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
              <div className="py-8 flex flex-col items-center justify-center gap-2.5 text-center">
                <p className="text-xs text-zinc-400">No sound FX found for this specific filter.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProvider('all');
                    setSelectedSfxCategory('all');
                    setSearchQuery('');
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors cursor-pointer shadow-sm"
                >
                  Explore All Sound FX
                </button>
              </div>
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

                    {(() => {
                      const cleanSfxName = cleanTrackDisplayMetadata(sfx.name).title;
                      return (
                        <div className="min-w-0 flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className="text-xs font-semibold text-white truncate" title={cleanSfxName}>
                              {cleanSfxName}
                            </p>
                            {renderAudioProviderBadge(sfx.provider)}
                          </div>
                          <div className="flex items-center gap-1.5 text-[9px] text-zinc-400 font-mono-studio">
                            <span className="text-blue-400">{sfx.category}</span>
                            <span>•</span>
                            <span>{sfx.duration}</span>
                          </div>
                        </div>
                      );
                    })()}
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
                  <span>Load More Sound FX</span>
                  <span className="text-[10px] font-mono-studio text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                    +24
                  </span>
                </button>
                <span className="text-[10px] font-mono-studio text-zinc-500 text-center">
                  Showing {liveSfx.length} of {totalSfx ? formatCompactAudioCount(totalSfx) : '600K+'} Sound FX
                </span>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: STUDIO VOICE RECORD & TAKES MANAGER */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'record' && (
          <div className="flex flex-col gap-3.5">
            {/* Top Recording Console */}
            <div className="bg-[#18181A] border border-[#242428] rounded-2xl p-4 flex flex-col items-center text-center gap-3 shadow-md relative overflow-hidden">
              {/* Background Ambient Glow */}
              <div
                className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
                  status === 'recording'
                    ? 'bg-rose-500/10 opacity-100'
                    : 'bg-blue-500/5 opacity-50'
                }`}
              />

              {/* Pulsing Mic Indicator */}
              <div className="relative">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    status === 'recording'
                      ? 'bg-rose-500/20 text-rose-500 ring-4 ring-rose-500/30 animate-pulse'
                      : 'bg-[#222228] text-white hover:bg-[#282834]'
                  }`}
                >
                  {status === 'recording' ? (
                    <Radio className="w-7 h-7 text-rose-400 animate-pulse" />
                  ) : (
                    <Mic className="w-7 h-7 text-blue-400" />
                  )}
                </div>

                {status === 'recording' && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500" />
                  </span>
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-white tracking-tight">
                  {status === 'recording' ? 'Recording Voiceover Take...' : 'Microphone Voiceover'}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {status === 'recording'
                    ? 'Speak clearly into your microphone — audio is streaming live'
                    : 'Record custom voice narration directly to your video scenes'}
                </p>
              </div>

              {/* Live VU Level / Frequency Meter while Recording */}
              {status === 'recording' && (
                <div className="w-full flex flex-col items-center gap-2 pt-1">
                  <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/15 border border-rose-500/30 rounded-full text-rose-400 text-xs font-mono font-bold">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    REC: {formatSeconds(recordingDuration)}
                  </div>

                  {/* Simulated Dynamic 24-Bar VU Frequency Spectrum */}
                  <div className="w-full h-8 bg-[#0F0F12] border border-[#26262E] rounded-xl px-3 flex items-center justify-center gap-1 overflow-hidden">
                    {[45, 60, 30, 80, 95, 70, 50, 85, 100, 65, 40, 90, 75, 60, 85, 95, 55, 70, 80, 45, 60, 40, 30, 50].map((baseH, idx) => {
                      const dynamicH = Math.max(15, (baseH * ((recordingDuration % 3) + 1) * 0.4) % 100);
                      return (
                        <div
                          key={idx}
                          className="w-1.5 rounded-full transition-all duration-150"
                          style={{
                            height: `${dynamicH}%`,
                            backgroundColor:
                              dynamicH > 80
                                ? '#F43F5E'
                                : dynamicH > 50
                                ? '#F59E0B'
                                : '#10B981',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Countdown Overlay Display */}
              {countdownVal !== null && (
                <div className="flex items-center justify-center gap-2 py-1">
                  <span className="text-3xl font-black text-blue-400 animate-bounce">
                    {countdownVal}
                  </span>
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
                    Get Ready...
                  </span>
                </div>
              )}

              {/* Recording Action Buttons */}
              <div className="flex items-center gap-2 w-full pt-1">
                {status !== 'recording' ? (
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    disabled={countdownVal !== null}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 active:scale-[0.99]"
                  >
                    <Mic className="w-4 h-4" />
                    {countdownVal !== null ? `Starting in ${countdownVal}...` : 'Start Recording'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-rose-500/20 active:scale-[0.99]"
                  >
                    <MicOff className="w-4 h-4" />
                    Stop &amp; Save Take
                  </button>
                )}
              </div>

              {/* Quick Options Bar (Sync Video & Teleprompter) */}
              <div className="w-full flex items-center justify-between pt-2 border-t border-[#26262A] text-[11px] text-zinc-400">
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={syncVideoPlayhead}
                    onChange={(e) => setSyncVideoPlayhead(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span>Sync Video Playhead</span>
                </label>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={useCountdown}
                      onChange={(e) => setUseCountdown(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                    />
                    <span>3s Countdown</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsTeleprompterOpen((v) => !v)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      isTeleprompterOpen
                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                        : 'bg-[#222228] text-zinc-400 hover:text-white border border-[#2D2D36]'
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    Teleprompter
                    {isTeleprompterOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Script Teleprompter Reader (Collapsible) */}
            {isTeleprompterOpen && (
              <div className="bg-[#18181A] border border-[#26262C] rounded-xl p-3 flex flex-col gap-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs font-bold text-white">Teleprompter Narration Script</span>
                    <span className="text-[9px] font-mono-studio text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                      Live Teleprompter
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setTeleprompterFontSize((s) => Math.max(12, s - 1))}
                      className="px-1.5 py-0.5 rounded bg-[#222226] hover:bg-[#2C2C32] text-[10px] text-zinc-300 cursor-pointer"
                      title="Decrease text size"
                    >
                      A-
                    </button>
                    <button
                      type="button"
                      onClick={() => setTeleprompterFontSize((s) => Math.min(22, s + 1))}
                      className="px-1.5 py-0.5 rounded bg-[#222226] hover:bg-[#2C2C32] text-[10px] text-zinc-300 cursor-pointer"
                      title="Increase text size"
                    >
                      A+
                    </button>
                    {scriptText?.trim() && (
                      <button
                        type="button"
                        onClick={() => setTeleprompterText(scriptText.trim())}
                        className="px-1.5 py-0.5 rounded bg-[#222226] hover:bg-[#2C2C32] text-[10px] text-zinc-400 hover:text-white flex items-center gap-0.5 cursor-pointer ml-1"
                        title="Reset to current video script"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  value={teleprompterText}
                  onChange={(e) => setTeleprompterText(e.target.value)}
                  style={{ fontSize: `${teleprompterFontSize}px` }}
                  rows={3}
                  className="w-full bg-[#101014] border border-[#24242A] rounded-lg p-2.5 text-zinc-200 leading-relaxed font-sans-studio outline-none focus:border-blue-500/50 resize-y"
                  placeholder="Paste or write your voiceover narration script here to read while recording..."
                />
              </div>
            )}

            {/* Fresh Recording Review Player (Appears when a take just completed) */}
            {mediaBlobUrl && (
              <div className="bg-[#18181A] border border-[#242428] rounded-xl p-3.5 flex flex-col gap-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                    Latest Recording Preview
                  </span>
                  <span className="text-[10px] font-mono-studio text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    {formatSeconds(recordingDuration)}
                  </span>
                </div>

                <div ref={waveformRef} className="w-full bg-[#0E0E12] border border-[#222228] rounded-lg p-2" />

                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (wavesurferInstance.current) {
                        wavesurferInstance.current.playPause();
                      }
                    }}
                    className="py-1.5 px-3 rounded-lg bg-[#24242C] hover:bg-[#2E2E38] text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Preview
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyRecordedVoice}
                    className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Insert to Video at Playhead
                  </button>
                </div>
              </div>
            )}

            {/* ── RECORDED VOICEOVER TAKES & LIBRARY ── */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-blue-400" />
                    Recorded Voiceover Takes
                  </span>
                  <span className="text-[10px] font-mono-studio text-zinc-400 bg-[#222228] px-2 py-0.5 rounded-full border border-[#2D2D36]">
                    {recordedTakes.length} {recordedTakes.length === 1 ? 'Take' : 'Takes'}
                  </span>
                </div>

                {recordedTakes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setRecordedTakes([]);
                      toast.info('Cleared voiceover takes library');
                    }}
                    className="text-[10px] text-zinc-500 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    Clear All
                  </button>
                )}
              </div>

              {/* Takes List or Empty State */}
              {recordedTakes.length === 0 ? (
                <div className="bg-[#18181A] border border-[#242428] rounded-xl p-5 flex flex-col items-center justify-center text-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[#202026] flex items-center justify-center text-zinc-500">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-300">No Recorded Takes Yet</p>
                    <p className="text-[11px] text-zinc-500 max-w-xs mt-0.5">
                      Your voiceover recordings will be saved here as audio takes. Hit "Start Recording" above to capture narration directly to your video.
                    </p>
                  </div>
                  <div className="pt-1">
                    <span className="text-[10px] font-mono-studio text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      💡 Tip: Enable "Sync Video Playhead" to watch scenes while narrating
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {recordedTakes.map((take) => {
                    const isPlayingThis = playingTakeId === take.id;
                    const isEditing = editingTakeId === take.id;

                    return (
                      <div
                        key={take.id}
                        className={`bg-[#18181A] hover:bg-[#1D1D22] border rounded-xl p-3 flex flex-col gap-2 transition-all ${
                          isPlayingThis
                            ? 'border-blue-500/60 bg-[#161B26]'
                            : 'border-[#242428] hover:border-[#33333E]'
                        }`}
                      >
                        {/* Take Header */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingTakeName}
                                onChange={(e) => setEditingTakeName(e.target.value)}
                                onBlur={() => handleSaveRename(take.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveRename(take.id);
                                }}
                                autoFocus
                                className="bg-[#121214] border border-blue-500 rounded px-1.5 py-0.5 text-xs text-white outline-none w-44"
                              />
                            ) : (
                              <span
                                className="text-xs font-bold text-white truncate cursor-pointer hover:text-blue-400 transition-colors flex items-center gap-1.5"
                                onClick={() => {
                                  setEditingTakeId(take.id);
                                  setEditingTakeName(take.name);
                                }}
                                title="Click to rename take"
                              >
                                {take.name}
                                <Edit2 className="w-2.5 h-2.5 text-zinc-500 hover:text-white shrink-0" />
                              </span>
                            )}

                            <span className="text-[10px] font-mono-studio text-zinc-400 bg-[#222228] px-1.5 py-0.2 rounded border border-[#2E2E36] shrink-0">
                              {take.durationFormatted}
                            </span>
                            <span className="text-[10px] text-zinc-500 shrink-0 hidden sm:inline">
                              {take.createdAt}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => handleDownloadTake(take, e)}
                              className="p-1.5 rounded-lg bg-[#222228] hover:bg-[#2C2C34] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                              title="Download voiceover file (.webm)"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteTake(take.id, e)}
                              className="p-1.5 rounded-lg bg-[#222228] hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete take"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Take Audio Controls Bar */}
                        <div className="flex items-center gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={(e) => togglePlayTake(take, e)}
                            className={`p-2 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                              isPlayingThis
                                ? 'bg-blue-600 text-white'
                                : 'bg-[#222228] hover:bg-[#2B2B34] text-zinc-200 hover:text-white'
                            }`}
                            title={isPlayingThis ? 'Pause' : 'Play take'}
                          >
                            {isPlayingThis ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>

                          {/* Progress Graphic */}
                          <div className="flex-1 h-2 bg-[#121214] rounded-full overflow-hidden border border-[#24242A] flex items-center px-1">
                            <div
                              className={`h-1 rounded-full transition-all duration-300 ${
                                isPlayingThis ? 'bg-blue-500 w-2/3 animate-pulse' : 'bg-zinc-700 w-1/4'
                              }`}
                            />
                          </div>

                          {/* Insert Take into Video Timeline */}
                          <button
                            type="button"
                            onClick={(e) => handleApplyTakeToTimeline(take, e)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm shadow-blue-500/20 active:scale-[0.98]"
                            title="Place this take into the video timeline at the current playhead"
                          >
                            <Plus className="w-3 h-3 stroke-[2.5]" />
                            <span>+ Timeline</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
