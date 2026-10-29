import React, { useState, useEffect, useRef, useCallback } from 'react';
import { workspaceApi } from '../api/workspaceApi';
import { videosApi } from '@/src/features/videos/api/videosApi';
import { DEFAULT_SOUNDTRACK_AUDIO_URL, GeneratedScript, MusicTrack, VisualBackdrop, VoiceProfile } from '../types';
import { consoleLogger } from '@/src/shared/utils/logger';
import { VideoPreviewPane } from '../components/VideoPreview';
import { StudioControlsPane, CompoundType } from '../components/StudioControlsPane';
import { StudioTimelinePane } from '../components/timeline';
import { WorkspaceTabType } from '../components/WorkspaceSidebar';
import {
  AIAgentCreatorPane,
  ScriptEditorPane,
  CanvasPane,
  MediaPane,
  TextPane,
  ElementsPane,
  AudioPane,
  ImagePane,
  VideoStockPane,
} from '../components/panes';
import { TYPOGRAPHY_PRESETS } from '../data/mediaCatalogData';
import { Toaster, toast } from 'sonner';
import confetti from 'canvas-confetti';
import { WorkspaceCommandPalette } from '../components/WorkspaceCommandPalette';
import { useAuth } from '@/src/features/auth/context/AuthContext';
import { DEFAULT_CREATOR_PROFILE, getCreatorProfile } from '@/src/features/profile/api/profileApi';
import { addWorkspaceNotification } from '../utils/workspaceNotificationManager';
import { getQueryParams, updateUrlQuery } from '@/src/app/routes';

interface WorkspacePageProps {
  onNavigate: (page: string) => void;
  activePane: WorkspaceTabType;
  onPaneChange: (pane: WorkspaceTabType) => void;
}

interface WorkspaceDraftSnapshot {
  version: 1;
  savedAt: string;
  script: GeneratedScript;
  agentPrompt: string;
  category: string;
  targetLength: string;
  selectedModel: string;
  selectedVoice: string;
  selectedMusic: string;
  selectedBackdrop: string;
  customBackdropImage?: string;
  customBackdropVideo?: string;
  canvasAspectRatio: '9:16' | '16:9' | '1:1' | '4:5' | '21:9';
  canvasOutputSize?: {
    aspectRatio: '9:16' | '16:9' | '1:1' | '4:5' | '21:9';
    width: number;
    height: number;
  };
  canvasBackground: string;
  timelineDuration: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  musicVolume: number;
  activeElementOverlay: { id?: string; name?: string; type: string; value: string; label?: string } | null;
  selectedSfx: { id: string; name: string; audioUrl: string; duration: number; start: number } | null;
  captionPreset: {
    className?: string;
    color?: string;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    previewText?: string;
  } | null;
}

type CanvasAspectRatio = WorkspaceDraftSnapshot['canvasAspectRatio'];
type CanvasOutputSize = NonNullable<WorkspaceDraftSnapshot['canvasOutputSize']>;

const getDefaultCanvasOutputSize = (aspectRatio: CanvasAspectRatio): CanvasOutputSize => {
  const dimensions: Record<CanvasAspectRatio, { width: number; height: number }> = {
    '9:16': { width: 1080, height: 1920 },
    '16:9': { width: 1920, height: 1080 },
    '1:1': { width: 1080, height: 1080 },
    '4:5': { width: 1080, height: 1350 },
    '21:9': { width: 1920, height: 824 },
  };
  return { aspectRatio, ...dimensions[aspectRatio] };
};

const getWorkspaceDraftKey = (userId?: string) => `apexmind_workspace_draft_v1:${userId || 'guest'}`;

export default function WorkspacePage({
  onNavigate,
  activePane,
  onPaneChange,
}: WorkspacePageProps) {
  const { user } = useAuth();
  // Navigation between separate AI Creator and Script Editor pages

  // AI Model & Script Generation
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [category, setCategory] = useState('Stoic Mindset & Discipline');
  const [targetLength, setTargetLength] = useState('30 seconds');
  const [loadingAgent, setLoadingAgent] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [testingVoiceId, setTestingVoiceId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);
  const [memoryCount, setMemoryCount] = useState(0);

  // Custom Backdrop Media (Images / Stock Videos / Uploads)
  const [customBackdropImage, setCustomBackdropImage] = useState<string | undefined>(undefined);
  const [customBackdropVideo, setCustomBackdropVideo] = useState<string | undefined>(undefined);
  const [activeElementOverlay, setActiveElementOverlay] = useState<{ id?: string; name?: string; type: string; value: string; label?: string } | null>(null);
  const [activeCompound, setActiveCompound] = useState<CompoundType>('home');
  const [canvasAspectRatio, setCanvasAspectRatio] = useState<'9:16' | '16:9' | '1:1' | '4:5' | '21:9'>('9:16');
  const [canvasOutputSize, setCanvasOutputSize] = useState<CanvasOutputSize>(() => getDefaultCanvasOutputSize('9:16'));
  const [canvasBackground, setCanvasBackground] = useState<string>('#050505');
  const [captionPreset, setCaptionPreset] = useState<WorkspaceDraftSnapshot['captionPreset']>(null);
  const [scriptSubPane, setScriptSubPane] = useState<'prompt' | 'editor'>(
    activePane === 'editor' ? 'editor' : 'prompt'
  );
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const handleCanvasAspectRatioChange = (ratio: CanvasAspectRatio) => {
    setCanvasAspectRatio(ratio);
    setCanvasOutputSize(getDefaultCanvasOutputSize(ratio));
  };

  // Script State (Live dynamic data with initial studio preview)
  const [script, setScript] = useState<GeneratedScript>({
    title: '',
    hook: '',
    quote: '',
    cta: '',
    speechStyle: '',
    visualTheme: '',
    recommendedVoice: 'Fenrir',
    tags: [],
    hashtags: [],
    subtitles: [],
  });

  // Media Library Catalog (Loaded dynamically from SQLite backend)
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
  const [backdrops, setBackdrops] = useState<VisualBackdrop[]>([]);
  const [voices, setVoices] = useState<VoiceProfile[]>([]);

  // Active Selections
  const [selectedVoice, setSelectedVoice] = useState('Fenrir');
  const [selectedMusic, setSelectedMusic] = useState('');
  const [selectedSfx, setSelectedSfx] = useState<{
    id: string;
    name: string;
    audioUrl: string;
    duration: number;
    start: number;
  } | null>(null);
  const [selectedBackdrop, setSelectedBackdrop] = useState('');
  const [preferredTone, setPreferredTone] = useState(DEFAULT_CREATOR_PROFILE.tone);
  const [targetAudience, setTargetAudience] = useState(DEFAULT_CREATOR_PROFILE.audience);

  // Audio Playback Engine
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [musicVolume, setMusicVolume] = useState(0.35);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [timelineDuration, setTimelineDuration] = useState(30);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(true);
  const [voiceFadeSettings, setVoiceFadeSettings] = useState({ fadeIn: 0, fadeOut: 0 });
  const [musicFadeSettings, setMusicFadeSettings] = useState({ fadeIn: 0, fadeOut: 0 });
  const [noiseReduction, setNoiseReduction] = useState(false);
  const [audioOutputStream, setAudioOutputStream] = useState<MediaStream | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioProcessingGraphRef = useRef<{
    context: AudioContext;
    source: MediaElementAudioSourceNode;
    musicSource: MediaElementAudioSourceNode | null;
    highPass: BiquadFilterNode;
    lowPass: BiquadFilterNode;
    gain: GainNode;
    musicGain: GainNode;
    destination: MediaStreamAudioDestinationNode;
  } | null>(null);
  const isExportingRef = useRef(false);
  const wasLoopingBeforeExportRef = useRef(true);

  const ensureAudioProcessingGraph = useCallback(() => {
    if (audioProcessingGraphRef.current) return audioProcessingGraphRef.current;
    const audio = audioRef.current;
    if (!audio || typeof window.AudioContext === 'undefined') return null;

    try {
      const context = new AudioContext();
      const source = context.createMediaElementSource(audio);
      const highPass = context.createBiquadFilter();
      const lowPass = context.createBiquadFilter();
      const gain = context.createGain();
      const musicGain = context.createGain();
      const destination = context.createMediaStreamDestination();
      highPass.type = 'highpass';
      lowPass.type = 'lowpass';
      highPass.frequency.value = 80;
      lowPass.frequency.value = 11_000;
      source.connect(highPass);
      highPass.connect(lowPass);
      lowPass.connect(gain);
      gain.connect(context.destination);
      gain.connect(destination);
      musicGain.connect(context.destination);
      musicGain.connect(destination);
      audioProcessingGraphRef.current = {
        context,
        source,
        musicSource: null,
        highPass,
        lowPass,
        gain,
        musicGain,
        destination,
      };
      setAudioOutputStream(destination.stream);
      return audioProcessingGraphRef.current;
    } catch (error) {
      consoleLogger.error('Audio', 'Could not initialize the audio processing graph:', error);
      return null;
    }
  }, []);

  const ensureMusicAudioGraph = useCallback(() => {
    const graph = ensureAudioProcessingGraph();
    const musicAudio = musicAudioRef.current;
    if (!graph || !musicAudio) return null;
    if (!graph.musicSource) {
      graph.musicSource = graph.context.createMediaElementSource(musicAudio);
      graph.musicSource.connect(graph.musicGain);
    }
    return graph;
  }, [ensureAudioProcessingGraph]);

  const [voiceTrackMuted, setVoiceTrackMuted] = useState(false);
  const [musicTrackMuted, setMusicTrackMuted] = useState(false);

  useEffect(() => {
    const handleTimelineState = (e: Event) => {
      const detail = (e as CustomEvent<{
        voiceMuted?: boolean;
        musicMuted?: boolean;
        videoEnabled?: boolean;
        videoClips?: unknown[];
        imageEnabled?: boolean;
        imageClips?: unknown[];
      }>).detail;
      if (detail) {
        if (detail.voiceMuted !== undefined) setVoiceTrackMuted(Boolean(detail.voiceMuted));
        if (detail.musicMuted !== undefined) setMusicTrackMuted(Boolean(detail.musicMuted));
        if (detail.videoEnabled === false || (Array.isArray(detail.videoClips) && detail.videoClips.length === 0)) {
          setCustomBackdropVideo(undefined);
        }
        if (detail.imageEnabled === false || (Array.isArray(detail.imageClips) && detail.imageClips.length === 0)) {
          setCustomBackdropImage(undefined);
        }
      }
    };
    window.addEventListener('workspace:timeline-state', handleTimelineState);
    return () => window.removeEventListener('workspace:timeline-state', handleTimelineState);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const trackDuration = duration > 0 ? duration : timelineDuration;
    const fadeInGain = voiceFadeSettings.fadeIn > 0
      ? Math.min(1, currentTime / voiceFadeSettings.fadeIn)
      : 1;
    const fadeOutGain = voiceFadeSettings.fadeOut > 0
      ? Math.min(1, Math.max(0, (trackDuration - currentTime) / voiceFadeSettings.fadeOut))
      : 1;
    const effectiveGain = (isMuted || voiceTrackMuted) ? 0 : volume * Math.min(fadeInGain, fadeOutGain);
    const graph = audioProcessingGraphRef.current;
    if (graph) {
      audio.volume = 1;
      audio.muted = false;
      graph.gain.gain.setTargetAtTime(effectiveGain, graph.context.currentTime, 0.02);
      graph.highPass.frequency.setTargetAtTime(noiseReduction ? 100 : 10, graph.context.currentTime, 0.05);
      graph.lowPass.frequency.setTargetAtTime(noiseReduction ? 10_000 : 20_000, graph.context.currentTime, 0.05);
    } else {
      audio.volume = effectiveGain;
      audio.muted = isMuted || voiceTrackMuted;
    }
    audio.playbackRate = playbackRate;
    if (isPlaying && graph?.context.state === 'suspended') void graph.context.resume();
  }, [currentTime, duration, isMuted, isPlaying, noiseReduction, playbackRate, timelineDuration, volume, voiceFadeSettings, voiceTrackMuted]);

  useEffect(() => {
    const handleAudioEffects = (event: Event) => {
      const detail = (event as CustomEvent<{
        audioType: 'voice' | 'music';
        fadeIn: number;
        fadeOut: number;
        noiseReduction: boolean;
      }>).detail;
      if (detail?.audioType === 'voice') {
        setVoiceFadeSettings({ fadeIn: detail.fadeIn, fadeOut: detail.fadeOut });
        setNoiseReduction(detail.noiseReduction);
        if (detail.noiseReduction) {
          const graph = ensureAudioProcessingGraph();
          if (graph?.context.state === 'suspended') void graph.context.resume();
        }
      } else if (detail?.audioType === 'music') {
        setMusicFadeSettings({ fadeIn: detail.fadeIn, fadeOut: detail.fadeOut });
      }
    };
    window.addEventListener('workspace:audio-effects-change', handleAudioEffects);
    return () => window.removeEventListener('workspace:audio-effects-change', handleAudioEffects);
  }, [ensureAudioProcessingGraph]);

  useEffect(() => {
    const musicAudio = musicAudioRef.current;
    if (!musicAudio) return;
    const selectedTrack = musicTracks.find((track) => track.id === selectedMusic);
    const sourceUrl = selectedTrack
      ? selectedTrack.audioUrl || DEFAULT_SOUNDTRACK_AUDIO_URL
      : '';
    if (!sourceUrl) {
      musicAudio.pause();
      musicAudio.removeAttribute('src');
      musicAudio.load();
      return;
    }

    if (musicAudio.src !== new URL(sourceUrl, window.location.href).href) {
      musicAudio.src = sourceUrl;
      musicAudio.load();
    }
    const graph = ensureMusicAudioGraph();
    if (graph?.context.state === 'suspended') void graph.context.resume();
  }, [ensureMusicAudioGraph, musicTracks, selectedMusic]);

  useEffect(() => {
    const musicAudio = musicAudioRef.current;
    if (!musicAudio || !selectedMusic) return;
    const totalDuration = duration > 0 ? duration : timelineDuration;
    const fadeInGain = musicFadeSettings.fadeIn > 0
      ? Math.min(1, currentTime / musicFadeSettings.fadeIn)
      : 1;
    const fadeOutGain = musicFadeSettings.fadeOut > 0
      ? Math.min(1, Math.max(0, (totalDuration - currentTime) / musicFadeSettings.fadeOut))
      : 1;

    // Automated AI Audio Ducking: dynamically duck background music when voiceover is actively speaking
    const isVoicePlaying = Boolean(
      audioUrl &&
      audioRef.current &&
      !audioRef.current.paused &&
      currentTime < (audioRef.current.duration || 30)
    );
    const duckLevel = isVoicePlaying
      ? (script.soundDesign?.ducking?.voiceActiveVolume ?? 0.2)
      : (script.soundDesign?.ducking?.pauseSwellVolume ?? 1.0);

    const effectiveMusicGain = (isMuted || musicTrackMuted)
      ? 0
      : musicVolume * Math.min(fadeInGain, fadeOutGain) * duckLevel;

    const graph = audioProcessingGraphRef.current;
    if (graph?.musicSource) {
      musicAudio.volume = 1;
      musicAudio.muted = false;
      graph.musicGain.gain.setTargetAtTime(effectiveMusicGain, graph.context.currentTime, 0.02);
    } else {
      musicAudio.volume = effectiveMusicGain;
      musicAudio.muted = isMuted || musicTrackMuted;
    }
    musicAudio.playbackRate = playbackRate;
    if (Math.abs(musicAudio.currentTime - currentTime) > 0.5 && Number.isFinite(musicAudio.duration)) {
      musicAudio.currentTime = Math.min(currentTime, musicAudio.duration);
    }
    if (isPlaying && musicAudio.paused) musicAudio.play().catch(() => {});
    if (!isPlaying && !musicAudio.paused) musicAudio.pause();
  }, [audioUrl, currentTime, duration, isMuted, isPlaying, musicFadeSettings, musicTrackMuted, musicVolume, playbackRate, script.soundDesign, selectedMusic, timelineDuration]);

  useEffect(() => () => {
    const graph = audioProcessingGraphRef.current;
    if (!graph) return;
    graph.destination.stream.getTracks().forEach((track) => track.stop());
    void graph.context.close();
    audioProcessingGraphRef.current = null;
  }, []);

  const handleVideoExportComplete = useCallback((error?: string) => {
    if (!isExportingRef.current) return;
    isExportingRef.current = false;
    setIsExporting(false);
    setIsPlaying(false);
    audioRef.current?.pause();
    setIsLooping(wasLoopingBeforeExportRef.current);
    window.dispatchEvent(new CustomEvent('workspace:export-state', {
      detail: {
        exporting: false,
        message: error || 'MP4 download started.',
      },
    }));
    if (!error) {
      addWorkspaceNotification({
        title: 'Video Export Completed',
        message: 'High-definition MP4 short rendered and downloaded successfully.',
        category: 'export',
        type: 'success',
        targetPane: 'canvas',
        actionLabel: 'Preview',
      });
    } else {
      addWorkspaceNotification({
        title: 'Video Export Failed',
        message: error,
        category: 'export',
        type: 'error',
        targetPane: 'canvas',
        actionLabel: 'Retry',
      });
    }
  }, []);

  // Load Media Library & Quote Memory from live backend API
  useEffect(() => {
    async function loadData() {
      try {
        if (user?.id) {
          try {
            const creatorProfile = getCreatorProfile(user.id);
            setCategory(creatorProfile.niche);
            setPreferredTone(creatorProfile.tone);
            setTargetAudience(creatorProfile.audience);
            setSelectedVoice(creatorProfile.defaultVoice);
          } catch (profileError) {
            consoleLogger.error('Studio', 'Failed to load creator preferences:', profileError);
          }
        }

        consoleLogger.info('Studio', 'Loading live media library and quote memory...');
        const [media, mem] = await Promise.all([
          workspaceApi.getMediaLibrary(),
          workspaceApi.getQuoteMemory(),
        ]);

        setMusicTracks(media.musicTracks || []);
        setBackdrops(media.visualBackdrops || []);
        setVoices(media.voiceProfiles || []);

        if (media.voiceProfiles && media.voiceProfiles.length > 0) {
          setSelectedVoice((currentVoice) =>
            media.voiceProfiles.some((voice) => voice.id === currentVoice)
              ? currentVoice
              : media.voiceProfiles[0].id
          );
        }

        setMemoryCount(mem.totalQuotesInMemory || 0);

        // ── Deep Linking: Load Video, Prompt, or Tab from URL Query Parameters ──
        const urlParams = getQueryParams();
        const deepVideoId = urlParams.videoId || urlParams.video;
        if (deepVideoId) {
          try {
            consoleLogger.info('Studio', `Deep link detected for videoId: ${deepVideoId}`);
            const vid = await videosApi.getVideoById(deepVideoId);
            if (vid) {
              if (vid.videoUrl) setCustomBackdropVideo(vid.videoUrl);
              if (vid.audioUrl) {
                setAudioUrl(vid.audioUrl);
              }
              let parsedSubtitles: any[] = [];
              if (Array.isArray(vid.subtitles)) {
                parsedSubtitles = vid.subtitles;
              } else if (typeof vid.subtitles === 'string') {
                try {
                  const p = JSON.parse(vid.subtitles);
                  if (Array.isArray(p)) parsedSubtitles = p;
                } catch {}
              }
              setScript((prev) => ({
                ...prev,
                title: vid.title || prev.title,
                quote: vid.quote || prev.quote,
                hook: vid.hook || prev.hook,
                subtitles: parsedSubtitles.length > 0 ? parsedSubtitles : prev.subtitles,
              }));
              if (vid.category) setCategory(vid.category);
              setScriptSubPane('editor');
              onPaneChange('editor');
              toast.success(`Loaded "${vid.title}" into Studio`);
            }
          } catch (vidErr) {
            consoleLogger.warn('Studio', `Could not load deep-linked video ${deepVideoId}:`, vidErr);
          }
        }

        if (urlParams.topic) {
          setTargetAudience(urlParams.topic);
        }
        if (urlParams.category) {
          setCategory(urlParams.category);
        }
        if (urlParams.prompt) {
          setAgentPrompt(urlParams.prompt);
        }
      } catch (err) {
        consoleLogger.error('Studio', 'Failed to load initial workspace data:', err);
      }
    }
    loadData();
  }, [user?.id]);

  // Update audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      const exportEnd = Math.max(duration > 0 ? duration : 30, timelineDuration);
      if (currentTime >= exportEnd - 0.2) {
        if (isLooping) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
          setIsPlaying(true);
        } else {
          setIsPlaying(false);
          setCurrentTime(0);
        }
      } else {
        // Voice audio clip ended, but timeline visuals and music continue until exportEnd!
        audio.pause();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [duration, isExporting, isLooping, timelineDuration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = isMuted;
    audio.volume = volume;
    audio.playbackRate = playbackRate;
    audio.loop = isLooping;
  }, [isLooping, isMuted, playbackRate, volume]);

  const getActiveCreativeBrief = () => {
    const selectedTrack = musicTracks.find((track) => track.id === selectedMusic);
    const selectedBackdropItem = backdrops.find((backdrop) => backdrop.id === selectedBackdrop);
    const selectedVoiceProfile = voices.find((voice) => voice.id === selectedVoice);

    const creativeBrief: Record<string, string> = {};

    if (selectedTrack?.mood) creativeBrief.audioMood = selectedTrack.mood;
    if (selectedVoiceProfile?.style) creativeBrief.audioMood ??= selectedVoiceProfile.style;

    if (selectedBackdropItem) {
      creativeBrief.backgroundStyle = `${selectedBackdropItem.category} ${selectedBackdropItem.name}`;
      creativeBrief.visualTheme = selectedBackdropItem.name;
    } else if (canvasBackground && canvasBackground !== '#050505') {
      creativeBrief.backgroundStyle = canvasBackground;
    }

    if (captionPreset?.className) creativeBrief.textStyle = captionPreset.className;
    if (captionPreset?.color) creativeBrief.captionStyle = captionPreset.color;

    if (canvasAspectRatio) creativeBrief.aspectRatio = canvasAspectRatio;
    if (selectedTrack?.title || selectedTrack?.name || selectedMusic) {
      creativeBrief.musicTrack = selectedTrack?.title || selectedTrack?.name || selectedMusic;
    }
    if (selectedVoice) creativeBrief.voiceName = selectedVoice;
    if (selectedBackdropItem?.particleEffect) {
      creativeBrief.videoStyle = `${canvasAspectRatio} ${selectedBackdropItem.category || 'cinematic'} reel with ${selectedBackdropItem.particleEffect}`;
    } else if (canvasAspectRatio) {
      creativeBrief.videoStyle = `${canvasAspectRatio} cinematic short-form reel`;
    }
    if (activeElementOverlay) {
      const overlayText = `${activeElementOverlay.type} ${activeElementOverlay.name || ''}`.trim();
      if (overlayText) creativeBrief.motionStyle = `overlay: ${overlayText}`;
    }

    return creativeBrief;
  };

  // Run AI Script Generation
  const handleRunAIAgent = async (): Promise<boolean> => {
    setLoadingAgent(true);
    setAgentError(null);
    consoleLogger.info('Studio', `Generating script for category: ${category}`);
    try {
      const creativeBrief = getActiveCreativeBrief();
      const selectedTrack = musicTracks.find((track) => track.id === selectedMusic);
      const selectedBackdropItem = backdrops.find((backdrop) => backdrop.id === selectedBackdrop);
      const selectedVoiceProfile = voices.find((voice) => voice.id === selectedVoice);

      const creativeContext: Record<string, unknown> = {
        category,
        topic: targetAudience || 'broad audience',
        tone: preferredTone || 'motivational',
        length: targetLength || '30 seconds',
        model: selectedModel,
        audience: targetAudience,
        creatorPrompt: agentPrompt || null,
        shotPacing: selectedTrack?.bpm
          ? `short-form pacing matched to ${selectedTrack.bpm} BPM with quick-cut rhythm`
          : 'fast vertical short-form pacing with tight retention hooks',
        transitionStyle: selectedSfx?.name
          ? `use ${selectedSfx.name} as an impact transition and fast match cut`
          : (selectedBackdropItem?.particleEffect ? `cinematic ${selectedBackdropItem.particleEffect} transitions` : 'dynamic match cuts and quick transitions'),
        subtitleMotion: captionPreset?.className
          ? `subtitle motion styled like ${captionPreset.className}`
          : 'centered kinetic subtitles with strong readability',
        textAnimation: captionPreset?.className
          ? `text animation using ${captionPreset.className}`
          : 'bold punch-in text reveal with clean title emphasis',
        cameraMovement: activeElementOverlay
          ? `camera movement guided by ${activeElementOverlay.type} ${activeElementOverlay.name || ''}`.trim()
          : (selectedBackdropItem?.particleEffect ? `subtle push-in and parallax around ${selectedBackdropItem.particleEffect}` : 'steady hand-held feel with occasional push-in focus'),
        sceneStructure: {
          hookPlacement: 'front-load the strongest emotional hook in the first 1-3 seconds',
          ctaTiming: 'deliver the closing call-to-action in the final 2-4 seconds with a hard stop',
          emphasisPoints: [
            'lead with the most shocking truth or tension',
            'repeat the emotional payoff once in the middle',
            'land the final action cue in the closing beat',
          ],
          shotPlan: selectedTrack?.bpm
            ? `3-beat rhythm driven by ${selectedTrack.bpm} BPM energy: hook, escalation, resolution`
            : '3-beat rhythm: hook, escalation, resolution',
          subtitlePriority: 'keep subtitles readable, dominant, and synced to the strongest words',
        },
        visual: {
          aspectRatio: canvasAspectRatio,
          backgroundColor: canvasBackground,
          selectedBackdrop: selectedBackdropItem
            ? {
                id: selectedBackdropItem.id,
                name: selectedBackdropItem.name,
                category: selectedBackdropItem.category,
                particleEffect: selectedBackdropItem.particleEffect,
                previewColor: selectedBackdropItem.previewColor,
              }
            : null,
          customBackdropImage: customBackdropImage || null,
          customBackdropVideo: customBackdropVideo || null,
          captionPreset: captionPreset
            ? {
                className: captionPreset.className || null,
                color: captionPreset.color || null,
                fontFamily: captionPreset.fontFamily || null,
                fontSize: captionPreset.fontSize || null,
                fontWeight: captionPreset.fontWeight || null,
                textTransform: captionPreset.textTransform || null,
                previewText: captionPreset.previewText || null,
              }
            : null,
          overlay: activeElementOverlay
            ? {
                id: activeElementOverlay.id || null,
                name: activeElementOverlay.name || null,
                type: activeElementOverlay.type,
                value: activeElementOverlay.value,
                label: activeElementOverlay.label || null,
              }
            : null,
          motionStyle: creativeBrief.motionStyle || null,
          visualTheme: creativeBrief.visualTheme || null,
        },
        audio: {
          voiceName: selectedVoice || null,
          voiceStyle: selectedVoiceProfile?.style || null,
          musicTrack: selectedTrack
            ? {
                id: selectedTrack.id,
                title: selectedTrack.title || selectedTrack.name || selectedMusic,
                genre: selectedTrack.genre,
                mood: selectedTrack.mood || null,
                bpm: selectedTrack.bpm,
              }
            : (selectedMusic ? { id: selectedMusic, title: selectedMusic } : null),
          sfx: selectedSfx
            ? {
                id: selectedSfx.id,
                name: selectedSfx.name,
                duration: selectedSfx.duration,
                start: selectedSfx.start,
              }
            : null,
          volume,
          isMuted,
          musicVolume,
          playbackRate,
          noiseReduction,
          voiceFade: voiceFadeSettings,
          musicFade: musicFadeSettings,
          audioMood: creativeBrief.audioMood || null,
        },
        text: {
          captionStyle: creativeBrief.captionStyle || null,
          textStyle: creativeBrief.textStyle || null,
          typographyPreset: captionPreset ? captionPreset.className || null : null,
        },
        composition: {
          aspectRatio: canvasAspectRatio,
          backgroundStyle: creativeBrief.backgroundStyle || null,
          videoStyle: creativeBrief.videoStyle || null,
          outputFormat: creativeBrief.outputFormat || null,
          activeCompound,
        },
      };

      const promptParts = [
        agentPrompt.trim(),
        targetAudience.trim() ? `Target audience: ${targetAudience.trim()}` : '',
      ].filter(Boolean);
      const generated = await workspaceApi.generateScript({
        category,
        userPrompt: promptParts.join('\n') || undefined,
        tone: preferredTone,
        model: selectedModel,
        length: targetLength,
        ...(creativeBrief.audioMood ? { audioMood: creativeBrief.audioMood } : {}),
        ...(creativeBrief.backgroundStyle ? { backgroundStyle: creativeBrief.backgroundStyle } : {}),
        ...(creativeBrief.textStyle ? { textStyle: creativeBrief.textStyle } : {}),
        ...(creativeBrief.videoStyle ? { videoStyle: creativeBrief.videoStyle } : {}),
        ...(creativeBrief.voiceName ? { voiceName: creativeBrief.voiceName } : {}),
        aspectRatio: creativeBrief.aspectRatio || canvasAspectRatio || '9:16',
        ...(creativeBrief.musicTrack ? { musicTrack: creativeBrief.musicTrack } : {}),
        ...(creativeBrief.captionStyle ? { captionStyle: creativeBrief.captionStyle } : {}),
        ...(creativeBrief.visualTheme ? { visualTheme: creativeBrief.visualTheme } : {}),
        ...(creativeBrief.motionStyle ? { motionStyle: creativeBrief.motionStyle } : {}),
        ...(creativeBrief.outputFormat ? { outputFormat: creativeBrief.outputFormat } : {}),
        creativeContext,
        availableAssets: {
          visualBackdrops: backdrops.map((b) => ({
            id: b.id,
            name: b.name,
            category: b.category,
            imageUrl: b.imageUrl,
            videoUrl: b.videoUrl,
            previewColor: b.previewColor,
          })),
          textStyles: TYPOGRAPHY_PRESETS.slice(0, 20).map((t) => ({
            id: t.id,
            name: t.name,
            className: t.className,
            color: t.color,
            fontFamily: t.fontFamily,
            styleDescription: t.styleDescription,
          })),
          musicTracks: musicTracks.map((m) => ({
            id: m.id,
            title: m.title,
            genre: m.genre,
            bpm: m.bpm,
            audioUrl: m.audioUrl,
          })),
          voices: voices.map((v) => ({
            id: v.id,
            name: v.name,
            gender: v.gender,
            style: v.style,
          })),
        },
      });

      setScript({ ...generated, recommendedVoice: selectedVoice || generated.recommendedVoice });

      if (generated.aspectRatio && generated.aspectRatio !== canvasAspectRatio) {
        handleCanvasAspectRatioChange(generated.aspectRatio as CanvasAspectRatio);
      }

      // If AI planned a multi-scene storyboard with multiple videos and images:
      let finalStoryboard = generated.storyboard || [];
      if (finalStoryboard.length > 0) {
        // Clear custom backdrop overrides so multi-scene storyboard cuts drive the timeline & preview
        setCustomBackdropVideo(undefined);
        setCustomBackdropImage(undefined);

        const firstScene = finalStoryboard[0];
        if (firstScene.captionPresetClass) {
          setCaptionPreset({
            className: firstScene.captionPresetClass,
            color: firstScene.captionPresetColor || '#FACC15',
            fontFamily: firstScene.captionPresetFontFamily || 'Impact, sans-serif',
          });
        }
      } else if (generated.visualTheme) {
        const generatedBackdrop = backdrops.find(
          (backdrop) =>
            backdrop.id === generated.visualTheme ||
            backdrop.name.toLowerCase() === generated.visualTheme?.trim().toLowerCase()
        );
        if (generatedBackdrop) setSelectedBackdrop(generatedBackdrop.id);
      }

      const chosenMusicId = generated.soundDesign?.soundtrackTrackId || generated.musicTrack;
      if (chosenMusicId) {
        const matchedMusic = musicTracks.find(
          (m) =>
            m.id === chosenMusicId ||
            m.title.toLowerCase().includes(chosenMusicId?.toLowerCase() || '')
        );
        if (matchedMusic) setSelectedMusic(matchedMusic.id);
      }

      const mem = await workspaceApi.getQuoteMemory();
      setMemoryCount(mem.totalQuotesInMemory || 0);

      toast.success('AI Script Generated!', {
        description: generated.title || 'Ready for studio editing',
      });

      addWorkspaceNotification({
        title: 'AI Script Generated',
        message: `"${generated.title || 'Short'}" ready with ${generated.subtitles?.length || 0} cue points.`,
        category: 'script',
        type: 'ai',
        targetPane: 'editor',
        actionLabel: 'Review Script',
      });

      // ── Step: Synthesize Voiceover & Resolve Stock Media Cuts First ──
      const voiceToUse = selectedVoice || generated.recommendedVoice || 'Fenrir';
      const unresolvedScenes = finalStoryboard.filter((s: any) => !s.mediaUrl || s.mediaStatus === 'unresolved');

      const [mediaBatchRes] = await Promise.all([
        unresolvedScenes.length > 0
          ? workspaceApi.resolveScenesMedia({
              scenes: unresolvedScenes.map((s: any) => ({
                sceneNumber: s.sceneNumber,
                visualQuery: s.visualQuery || s.subtitleText || promptParts.join(' ') || 'nature landscape',
                googleSearchQuery: s.googleSearchQuery,
                fallbackQueries: s.fallbackQueries,
                mediaType: s.mediaType || 'video',
              })),
              aspectRatio: generated.aspectRatio || canvasAspectRatio || '9:16',
            }).catch((err) => {
              consoleLogger.warn('Workspace', `Progressive scene media error: ${err}`);
              return null;
            })
          : Promise.resolve(null),
        handleSynthesizeVoice(generated, voiceToUse).catch((err) => {
          consoleLogger.warn('Workspace', `Voiceover synthesis error: ${err}`);
          return null;
        }),
      ]);

      if (mediaBatchRes?.success && mediaBatchRes.data?.scenes) {
        const resolvedMap = new Map();
        mediaBatchRes.data.scenes.forEach((item: any) => {
          if (item.status === 'resolved' && item.media) {
            resolvedMap.set(item.sceneNumber, item.media);
          }
        });
        if (resolvedMap.size > 0) {
          finalStoryboard = finalStoryboard.map((s: any) => {
            const resolved = resolvedMap.get(s.sceneNumber);
            if (resolved) {
              return {
                ...s,
                mediaUrl: resolved.url,
                previewUrl: resolved.previewUrl || resolved.url,
                posterUrl: resolved.previewUrl || resolved.thumbnailUrl || '',
                thumbnailUrl: resolved.thumbnailUrl || resolved.previewUrl || '',
                mediaName: resolved.title || s.mediaName,
                mediaId: resolved.id || s.mediaId,
                mediaStatus: 'resolved',
              };
            }
            return s;
          });
          setScript((prev) => (prev ? { ...prev, storyboard: finalStoryboard } : prev));
        }
      }

      // ── Step LAST: Timeline & Track Population ──
      // Places scene cuts onto Video Track, captions onto Subtitles Track, BGM & SFX onto Audio Tracks, and opens Studio Timeline
      if (finalStoryboard && finalStoryboard.length > 0) {
        window.dispatchEvent(
          new CustomEvent('workspace:set-timeline-storyboard', {
            detail: {
              storyboard: finalStoryboard,
              musicTrack: generated.soundDesign?.soundtrackTrackId || generated.musicTrack,
              soundDesign: generated.soundDesign,
              hooks: generated.hooks,
            },
          })
        );
        setShowTimeline(true);

        addWorkspaceNotification({
          title: 'Timeline & Tracks Populated',
          message: `AI directed ${finalStoryboard.length} dynamic scene cuts with synchronized visuals & sound design.`,
          category: 'timeline',
          type: 'ai',
          targetPane: 'canvas',
          actionLabel: 'Preview Video',
        });
      }
      return true;
    } catch (err) {
      consoleLogger.error('Studio', 'Error generating script:', err);
      const errorMessage = err instanceof Error ? err.message : 'Please check connection or API keys.';
      setAgentError(errorMessage);
      setScriptSubPane('prompt');
      onPaneChange('prompt');
      toast.error('Script generation failed', {
        description: errorMessage,
      });
      addWorkspaceNotification({
        title: 'Script Generation Failed',
        message: errorMessage,
        category: 'script',
        type: 'error',
        targetPane: 'script',
        actionLabel: 'Retry Prompt',
      });
      return false;
    } finally {
      setLoadingAgent(false);
    }
  };

  // Synthesize Voiceover via 24kHz Gemini API
  const handleSynthesizeVoice = async (targetScript = script, voiceName = selectedVoice) => {
    setLoadingAudio(true);
    setDuration(0);
    setCurrentTime(0);
    consoleLogger.info('Studio', `Synthesizing voiceover with voice: ${voiceName}...`);
    try {
      // Prioritize storyboard subtitle texts to guarantee 100% exact parity between spoken audio and CC captions
      const storyboardTexts = targetScript.storyboard
        ?.map((s) => s.subtitleText?.trim())
        .filter((txt): txt is string => Boolean(txt)) || [];
      const textToSpeak = storyboardTexts.length > 0
        ? storyboardTexts.join(' ')
        : [targetScript.hook, targetScript.quote, targetScript.cta].filter(Boolean).join(' ');

      const res = await workspaceApi.generateVoiceover({
        text: textToSpeak,
        voiceName,
      });

      if (res.audioUrl) {
        setAudioUrl(res.audioUrl);
        if (audioRef.current) {
          audioRef.current.src = res.audioUrl;
          audioRef.current.currentTime = 0;
          setCurrentTime(0);
        }
        addWorkspaceNotification({
          title: '24kHz Voiceover Synthesized',
          message: `Vocal track rendered with voice profile '${voiceName}'.`,
          category: 'voice',
          type: 'success',
          targetPane: 'audio',
          actionLabel: 'Audio Settings',
        });
      }
    } catch (err) {
      consoleLogger.error('Studio', 'Failed to generate voiceover:', err);
    } finally {
      setLoadingAudio(false);
    }
  };

  // Audition single voice sample
  const handleTestVoice = async (voiceId: string) => {
    setTestingVoiceId(voiceId);
    consoleLogger.info('Studio', `Auditioning voice: ${voiceId}`);
    try {
      const previewText = `ApexMind Studio sample test with voice ${voiceId}.`;
      const res = await workspaceApi.generateVoiceover({
        text: previewText,
        voiceName: voiceId,
      });
      if (res.audioUrl && audioRef.current) {
        audioRef.current.src = res.audioUrl;
        setAudioUrl(res.audioUrl);
        setDuration(0);
        setCurrentTime(0);
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      consoleLogger.error('Studio', 'Failed to test voice sample:', err);
    } finally {
      setTestingVoiceId(null);
    }
  };

  // Universal Studio Playback Engine (Smooth 60fps RAF Master Clock)
  useEffect(() => {
    if (!isPlaying) return;

    const maxTime = Math.max(duration > 0 ? duration : 30, timelineDuration);
    let lastTs = performance.now();
    let animId: number;

    const tick = (now: number) => {
      const deltaSec = ((now - lastTs) / 1000) * playbackRate;
      lastTs = now;

      const audio = audioRef.current;
      if (audio && audioUrl && !audio.paused && !audio.ended && Number.isFinite(audio.duration) && audio.currentTime < audio.duration - 0.05) {
        setCurrentTime(audio.currentTime);
      } else {
        setCurrentTime((prev) => {
          const next = prev + deltaSec;
          if (next >= maxTime) {
            if (isLooping) {
              if (audio && audioUrl) {
                audio.currentTime = 0;
                audio.play().catch(() => {});
              }
              if (musicAudioRef.current && selectedMusic) {
                musicAudioRef.current.currentTime = 0;
                musicAudioRef.current.play().catch(() => {});
              }
              return 0;
            } else {
              setIsPlaying(false);
              return maxTime;
            }
          }
          return next;
        });
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, duration, timelineDuration, playbackRate, isLooping, audioUrl, isExporting, selectedMusic]);

  // Play / Pause Audio & Timeline Playhead
  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
      if (musicAudioRef.current && !musicAudioRef.current.paused) {
        musicAudioRef.current.pause();
      }
    } else {
      const maxTime = Math.max(duration > 0 ? duration : 30, timelineDuration);
      let startTime = currentTime;
      if (currentTime >= maxTime - 0.1) {
        startTime = 0;
        setCurrentTime(0);
      }
      setIsPlaying(true);
      if (audioRef.current && audioUrl) {
        const audioDur = audioRef.current.duration;
        if (Number.isFinite(audioDur) && startTime < audioDur) {
          audioRef.current.currentTime = startTime;
          audioRef.current.play().catch(() => {});
        } else {
          audioRef.current.pause();
        }
      }
      if (musicAudioRef.current && selectedMusic) {
        musicAudioRef.current.play().catch(() => {});
      }
    }
  };

  // Seek playhead (functional across full timeline even without audio synthesized yet)
  const handleSeek = (newTime: number) => {
    const maxTime = Math.max(duration > 0 ? duration : 30, timelineDuration);
    const clamped = Math.max(0, Math.min(maxTime, parseFloat(newTime.toFixed(2))));
    setCurrentTime(clamped);
    if (audioRef.current && audioUrl) {
      const audioDur = audioRef.current.duration;
      if (Number.isFinite(audioDur) && audioDur > 0 && clamped < audioDur) {
        audioRef.current.currentTime = clamped;
        if (isPlaying) audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
    if (musicAudioRef.current && selectedMusic) {
      const musicDur = musicAudioRef.current.duration;
      if (Number.isFinite(musicDur) && musicDur > 0) {
        musicAudioRef.current.currentTime = clamped % musicDur;
        if (isPlaying) musicAudioRef.current.play().catch(() => {});
      }
    }
  };

  const handleVolumeChange = (nextVolume: number) => {
    const clampedVolume = Math.min(1, Math.max(0, nextVolume));
    setVolume(clampedVolume);
    setIsMuted(clampedVolume === 0);
  };

  const handleStartNewVideo = useCallback(() => {
    setAgentPrompt('');
    setScriptSubPane('prompt');
    onPaneChange('prompt');
    setAudioUrl(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current.src = '';
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setScript({
      title: '',
      hook: '',
      quote: '',
      cta: '',
      speechStyle: '',
      visualTheme: '',
      recommendedVoice: selectedVoice || 'Fenrir',
      tags: [],
      hashtags: [],
      subtitles: [],
    });
    setSelectedBackdrop('');
    setSelectedMusic('');
    setCustomBackdropImage(undefined);
    setCustomBackdropVideo(undefined);
    setActiveElementOverlay(null);
    setSelectedSfx(null);
    // Dispatch event to clear all timeline tracks and clips immediately
    window.dispatchEvent(new CustomEvent('workspace:clear-timeline'));
  }, [onPaneChange, selectedVoice]);

  // Capture real cover image snapshot from active studio canvas or real media
  const resolveRealCoverImage = async (): Promise<string> => {
    try {
      const canvasEl = document.getElementById('apex-video-canvas-container');
      if (canvasEl) {
        const { toJpeg } = await import('html-to-image');
        const snapshot = await toJpeg(canvasEl, {
          quality: 0.88,
          pixelRatio: 1,
          skipFonts: true,
        });
        if (snapshot && snapshot.startsWith('data:image')) {
          return snapshot;
        }
      }
    } catch (e) {
      console.warn('Canvas snapshot notice:', e);
    }

    return (
      customBackdropImage ||
      script.storyboard?.find((s) => (s.mediaType === 'image' && s.mediaUrl) || s.posterUrl)?.mediaUrl ||
      script.storyboard?.find((s) => s.posterUrl)?.posterUrl ||
      backdrops.find((b) => b.id === selectedBackdrop)?.imageUrl ||
      ''
    );
  };

  // Publish to YouTube Shorts
  const handlePublish = async () => {
    const publishTitle = script.title?.trim() || 'Untitled Short';
    const publishQuote = script.quote?.trim() || script.hook?.trim() || script.cta?.trim() || 'ApexMind video';

    setPublishing(true);
    consoleLogger.info('YouTube', `📤 Uploading video to YouTube Shorts: "${publishTitle}"`);
    try {
      const publishedShort = await workspaceApi.publishVideo({
        title: publishTitle,
        quote: publishQuote,
        voice: selectedVoice,
        visualTheme: selectedBackdrop,
        category,
      });
      // Also save to website video library automatically
      const resolvedVideoUrl =
        customBackdropVideo ||
        script.storyboard?.find((s) => s.mediaType === 'video' && s.mediaUrl)?.mediaUrl ||
        backdrops.find((b) => b.id === selectedBackdrop)?.videoUrl ||
        '';

      const realCover = await resolveRealCoverImage();

      await videosApi.createVideo({
        title: publishTitle,
        quote: publishQuote,
        hook: script.hook || '',
        cta: script.cta || '',
        category,
        coverImageUrl: realCover,
        videoUrl: resolvedVideoUrl,
        audioUrl: audioUrl && !audioUrl.startsWith('data:') ? audioUrl : '',
        voice: selectedVoice,
        aspectRatio: canvasAspectRatio,
        duration: `00:${String(Math.round(duration || 30)).padStart(2, '0')}`,
        visualTheme: selectedBackdrop || 'v1',
        subtitles: script.subtitles as any,
        tags: script.hashtags || [],
        status: 'ready',
      }).catch(() => {}); // Non-blocking
      setPublishedSuccess(true);
      const isLive = Boolean(publishedShort?.liveUploaded);
      const videoLink = publishedShort?.videoUrl || publishedShort?.url;
      toast.success(isLive ? 'Uploaded LIVE to YouTube Shorts!' : 'Published video to YouTube!', {
        description: videoLink || script.title || 'Live on YouTube',
      });
      addWorkspaceNotification({
        title: isLive ? 'Live YouTube Short Broadcast' : 'Published to YouTube Shorts',
        message: isLive
          ? `"${script.title}" uploaded directly to your channel: ${videoLink}`
          : `"${script.title}" broadcast to connected YouTube channel.`,
        category: 'export',
        type: 'success',
        targetPane: 'canvas',
        actionLabel: 'View Preview',
      });
      setTimeout(() => {
        onNavigate('youtube');
      }, 1500);
    } catch (err) {
      consoleLogger.error('YouTube', 'Upload failed:', err);
      toast.error('YouTube upload failed', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
    } finally {
      setPublishing(false);
    }
  };

  // Save to Website Video Library (without publishing to YouTube)
  const handleSaveToLibrary = async () => {
    if (!script.title && !script.quote) return;
    try {
      const resolvedVideoUrl =
        customBackdropVideo ||
        script.storyboard?.find((s) => s.mediaType === 'video' && s.mediaUrl)?.mediaUrl ||
        backdrops.find((b) => b.id === selectedBackdrop)?.videoUrl ||
        '';

      const realCover = await resolveRealCoverImage();

      await videosApi.createVideo({
        title: script.title || 'Untitled Short',
        quote: script.quote || '',
        hook: script.hook || '',
        cta: script.cta || '',
        category,
        coverImageUrl: realCover,
        videoUrl: resolvedVideoUrl,
        audioUrl: audioUrl || '',
        voice: selectedVoice,
        aspectRatio: canvasAspectRatio,
        duration: `00:${String(Math.round(duration || 30)).padStart(2, '0')}`,
        visualTheme: selectedBackdrop || 'v1',
        subtitles: script.subtitles as any,
        tags: script.hashtags || [],
        status: 'ready',
      });
      consoleLogger.success('Library', `✅ Saved "${script.title}" to Website Video Library`);
      toast.success(`Saved "${script.title}" to Video Library!`);
      addWorkspaceNotification({
        title: 'Saved to Video Library',
        message: `"${script.title}" archived in website videos.`,
        category: 'export',
        type: 'success',
        targetPane: 'media',
        actionLabel: 'View Library',
      });
      onNavigate('videos');
    } catch (err) {
      consoleLogger.error('Library', 'Save to library failed:', err);
      toast.error('Save to library failed', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
    }
  };

  // Selected backdrop & music objects
  const activeBackdropObj =
    backdrops.find((b) => b.id === selectedBackdrop) ||
    {
      id: '',
      name: '',
      category: '',
      aspectRatio: '9:16',
      previewColor: '',
      textColor: '#FFFFFF',
      particleEffect: '',
    };

  const canPublish = Boolean(
    script.title?.trim() ||
    script.quote?.trim() ||
    script.hook?.trim() ||
    script.cta?.trim() ||
    (Array.isArray(script.subtitles) && script.subtitles.some((subtitle) => subtitle.text?.trim()))
  );

  // Panel layout visibility states
  const [showLeftPane, setShowLeftPane] = useState(true);
  const [showTimeline, setShowTimeline] = useState(true);
  const [showRightPane, setShowRightPane] = useState(true);

  // ── Resizable Layout Panel Dimensions ──────────────────────────────
  const DEFAULT_LEFT_WIDTH = 380;
  const DEFAULT_RIGHT_WIDTH = 380;
  const DEFAULT_TIMELINE_HEIGHT = 180;

  const [leftPaneWidth, setLeftPaneWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('apexmind:left-pane-width');
      return saved ? Math.max(260, Math.min(window.innerWidth * 0.45, Number(saved))) : DEFAULT_LEFT_WIDTH;
    } catch {
      return DEFAULT_LEFT_WIDTH;
    }
  });

  const [rightPaneWidth, setRightPaneWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('apexmind:right-pane-width');
      return saved ? Math.max(260, Math.min(window.innerWidth * 0.45, Number(saved))) : DEFAULT_RIGHT_WIDTH;
    } catch {
      return DEFAULT_RIGHT_WIDTH;
    }
  });

  const [timelineHeight, setTimelineHeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('apexmind:timeline-height');
      return saved ? Math.max(110, Math.min(window.innerHeight * 0.6, Number(saved))) : DEFAULT_TIMELINE_HEIGHT;
    } catch {
      return DEFAULT_TIMELINE_HEIGHT;
    }
  });

  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);

  useEffect(() => {
    const handleWindowResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);



  // Synchronize publish state and actions with WorkspaceHeader
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('workspace:publish-state', {
        detail: { publishing, canPublish, publishedSuccess },
      })
    );
  }, [publishing, canPublish, publishedSuccess]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('workspace:panel-state', {
        detail: { showLeftPane, showTimeline, showRightPane },
      })
    );
  }, [showLeftPane, showTimeline, showRightPane]);

  useEffect(() => {
    try {
      const storedDraft = localStorage.getItem(getWorkspaceDraftKey(user?.id));
      if (!storedDraft) return;
      const draft = JSON.parse(storedDraft) as WorkspaceDraftSnapshot;
      if (draft.version !== 1 || !draft.script || typeof draft.script !== 'object') return;

      setScript(draft.script);
      setAgentPrompt(draft.agentPrompt || '');
      setCategory(draft.category || 'Stoic Mindset & Discipline');
      setTargetLength(draft.targetLength || '30 seconds');
      setSelectedModel(draft.selectedModel || 'gemini-2.5-flash');
      setSelectedVoice(draft.selectedVoice || 'Fenrir');
      setSelectedMusic(draft.selectedMusic || '');
      setSelectedBackdrop(draft.selectedBackdrop || '');
      setCustomBackdropImage(draft.customBackdropImage);
      setCustomBackdropVideo(draft.customBackdropVideo);
      const restoredAspectRatio = draft.canvasAspectRatio || '9:16';
      setCanvasAspectRatio(restoredAspectRatio);
      const restoredOutputSize = draft.canvasOutputSize;
      setCanvasOutputSize(
        restoredOutputSize?.aspectRatio === restoredAspectRatio &&
          Number.isInteger(restoredOutputSize.width) &&
          Number.isInteger(restoredOutputSize.height) &&
          restoredOutputSize.width >= 2 &&
          restoredOutputSize.height >= 2 &&
          restoredOutputSize.width % 2 === 0 &&
          restoredOutputSize.height % 2 === 0 &&
          Math.max(restoredOutputSize.width, restoredOutputSize.height) >= 1080 &&
          restoredOutputSize.width <= 8192 &&
          restoredOutputSize.height <= 8192
          ? restoredOutputSize
          : getDefaultCanvasOutputSize(restoredAspectRatio),
      );
      setCanvasBackground(draft.canvasBackground || '#050505');
      setTimelineDuration(draft.timelineDuration || 30);
      setPlaybackRate(draft.playbackRate || 1);
      setVolume(draft.volume ?? 1);
      setIsMuted(draft.isMuted ?? false);
      setMusicVolume(draft.musicVolume ?? 0.35);
      setActiveElementOverlay(draft.activeElementOverlay || null);
      setSelectedSfx(draft.selectedSfx || null);
      setCaptionPreset(draft.captionPreset || null);
    } catch (error) {
      consoleLogger.warn('Studio', 'Could not restore the local workspace draft:', error);
    }
  }, [user?.id]);

  // Synchronize targetLength preset with timelineDuration when no recorded audio duration is active
  useEffect(() => {
    if (!targetLength) return;
    const match = targetLength.match(/(\d+)\s*(second|sec|minute|min)/i);
    if (match) {
      const val = parseInt(match[1], 10);
      const isMin = match[2].toLowerCase().startsWith('min');
      const sec = isMin ? val * 60 : val;
      if (sec > 0 && (!duration || duration <= 0)) {
        setTimelineDuration(sec);
      }
    }
  }, [targetLength, duration]);

  useEffect(() => {
    const handleSaveDraft = () => {
      const persistableUrl = (url?: string) => {
        if (!url) return undefined;
        if (/^https?:\/\//i.test(url)) return url;
        if (url.startsWith('data:image/') && url.length < 250_000) return url;
        return undefined;
      };

      const draft: WorkspaceDraftSnapshot = {
        version: 1,
        savedAt: new Date().toISOString(),
        script,
        agentPrompt,
        category,
        targetLength,
        selectedModel,
        selectedVoice,
        selectedMusic,
        selectedBackdrop,
        customBackdropImage: persistableUrl(customBackdropImage),
        customBackdropVideo: persistableUrl(customBackdropVideo),
        canvasAspectRatio,
        canvasOutputSize,
        canvasBackground,
        timelineDuration,
        playbackRate,
        volume,
        isMuted,
        musicVolume,
        activeElementOverlay,
        selectedSfx,
        captionPreset,
      };

      try {
        localStorage.setItem(getWorkspaceDraftKey(user?.id), JSON.stringify(draft));
        window.dispatchEvent(new CustomEvent('workspace:save-draft-state', {
          detail: { saved: true, message: 'Draft saved on this device.' },
        }));
      } catch (error) {
        consoleLogger.error('Studio', 'Could not save the local workspace draft:', error);
        window.dispatchEvent(new CustomEvent('workspace:save-draft-state', {
          detail: { saved: false, message: 'Draft could not be saved. Local storage may be full.' },
        }));
      }
    };

    window.addEventListener('workspace:save-draft', handleSaveDraft);
    return () => window.removeEventListener('workspace:save-draft', handleSaveDraft);
  }, [
    activeElementOverlay,
    agentPrompt,
    canvasAspectRatio,
    canvasOutputSize,
    canvasBackground,
    captionPreset,
    category,
    customBackdropImage,
    customBackdropVideo,
    isMuted,
    musicVolume,
    playbackRate,
    script,
    selectedBackdrop,
    selectedModel,
    selectedMusic,
    selectedSfx,
    selectedVoice,
    targetLength,
    timelineDuration,
    user?.id,
    volume,
  ]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('workspace:status', {
      detail: {
        aspectRatio: canvasAspectRatio,
        currentTime,
        duration: Math.max(duration, timelineDuration),
        playbackRate,
        voice: selectedVoice,
        music: musicTracks.find((track) => track.id === selectedMusic)?.title || '',
        visual: backdrops.find((backdrop) => backdrop.id === selectedBackdrop)?.name || '',
        captionCount: script.subtitles?.length || 0,
        overlay: activeElementOverlay?.label || activeElementOverlay?.name || activeElementOverlay?.value || '',
        sfx: selectedSfx?.name || '',
        isPlaying,
        isExporting,
      },
    }));
  }, [activeElementOverlay, backdrops, canvasAspectRatio, currentTime, duration, isExporting, isPlaying, musicTracks, playbackRate, script.subtitles, selectedBackdrop, selectedMusic, selectedSfx, selectedVoice, timelineDuration]);

  useEffect(() => {
    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ panel: 'left' | 'bottom' | 'right' }>;
      if (!customEvent.detail) return;
      if (customEvent.detail.panel === 'left') setShowLeftPane((prev) => !prev);
      if (customEvent.detail.panel === 'bottom') setShowTimeline((prev) => !prev);
      if (customEvent.detail.panel === 'right') setShowRightPane((prev) => !prev);
    };
    window.addEventListener('workspace:toggle-panel', handleToggle);
    return () => window.removeEventListener('workspace:toggle-panel', handleToggle);
  }, []);

  // Left-pane selections update the active inspector without changing panel visibility.
  useEffect(() => {
    const handleCompoundSelect = (e: Event) => {
      const detail = (e as CustomEvent<
        CompoundType | { compound: CompoundType; openInspector?: boolean }
      >).detail;
      const compound = typeof detail === 'string' ? detail : detail?.compound;
      if (!compound) return;
      if (typeof detail !== 'string' && detail.openInspector) setShowRightPane(true);
      setActiveCompound(compound);
    };
    window.addEventListener('workspace:select-compound', handleCompoundSelect);
    return () => window.removeEventListener('workspace:select-compound', handleCompoundSelect);
  }, []);

  useEffect(() => {
    const handleAspectRatio = (e: Event) => {
      const customEvent = e as CustomEvent<{ aspectRatio: '9:16' | '16:9' | '1:1' | '4:5' | '21:9' }>;
      if (customEvent.detail?.aspectRatio) {
        handleCanvasAspectRatioChange(customEvent.detail.aspectRatio);
      }
    };
    window.addEventListener('workspace:aspect-ratio-change', handleAspectRatio);
    return () => window.removeEventListener('workspace:aspect-ratio-change', handleAspectRatio);
  }, []);

  useEffect(() => {
    const handleAddSfx = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string; name: string; audioUrl: string; duration?: number }>;
      if (customEvent.detail) {
        setSelectedSfx({
          id: customEvent.detail.id,
          name: customEvent.detail.name,
          audioUrl: customEvent.detail.audioUrl,
          duration: customEvent.detail.duration || 0.6,
          start: currentTime,
        });
        setShowTimeline(true);
        setActiveCompound('music');
        addWorkspaceNotification({
          title: `SFX Placed: ${customEvent.detail.name}`,
          message: 'Sound effect attached to multi-track timeline.',
          category: 'voice',
          type: 'info',
          targetPane: 'audio',
          actionLabel: 'Audio Settings',
        });
      }
    };
    window.addEventListener('workspace:add-sfx-timeline', handleAddSfx);
    return () => window.removeEventListener('workspace:add-sfx-timeline', handleAddSfx);
  }, [currentTime]);

  // Synchronize script title with header
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('workspace:title-change', {
        detail: { title: script.title },
      })
    );
  }, [script.title]);

  useEffect(() => {
    const handleUpdateTitle = (e: Event) => {
      const customEvent = e as CustomEvent<{ title: string }>;
      if (customEvent.detail?.title !== undefined) {
        setScript((prev) => ({ ...prev, title: customEvent.detail.title }));
      }
    };
    window.addEventListener('workspace:update-title', handleUpdateTitle);
    return () => window.removeEventListener('workspace:update-title', handleUpdateTitle);
  }, []);

  // Sync timeline video clip repositioning/trimming back into script storyboard
  useEffect(() => {
    const handleTimelineVideoClips = (e: Event) => {
      const detail = (e as CustomEvent<{ videoClips: any[] }>).detail;
      if (!detail?.videoClips) return;
      setScript((prev) => {
        if (!prev?.storyboard || prev.storyboard.length === 0) return prev;
        const updatedStoryboard = prev.storyboard.map((sc, idx) => {
          const matchingClip = detail.videoClips[idx];
          if (matchingClip) {
            return {
              ...sc,
              start: matchingClip.start,
              duration: matchingClip.duration,
            };
          }
          return sc;
        });
        return { ...prev, storyboard: updatedStoryboard };
      });
    };
    window.addEventListener('workspace:timeline-video-clips-updated', handleTimelineVideoClips);
    return () => window.removeEventListener('workspace:timeline-video-clips-updated', handleTimelineVideoClips);
  }, []);

  useEffect(() => {
    const handleOpenPalette = () => setCommandPaletteOpen(true);
    window.addEventListener('workspace:open-command-palette', handleOpenPalette);
    return () => window.removeEventListener('workspace:open-command-palette', handleOpenPalette);
  }, []);

  useEffect(() => {
    const handleTriggerPublish = () => {
      if (canPublish && !publishing) {
        handlePublish();
      }
    };
    window.addEventListener('workspace:trigger-publish', handleTriggerPublish);
    return () => window.removeEventListener('workspace:trigger-publish', handleTriggerPublish);
  }, [canPublish, publishing, handlePublish]);

  useEffect(() => {
    const handleExportRequest = () => {
      if (isExportingRef.current) return;
      isExportingRef.current = true;
      wasLoopingBeforeExportRef.current = isLooping;
      setIsExporting(true);
      setIsLooping(false);
      setCurrentTime(0);
      setIsPlaying(true);

      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        if (audioUrl) audio.play().catch(() => {});
      }

      window.dispatchEvent(new CustomEvent('workspace:export-state', {
        detail: { exporting: true, message: 'Rendering final video...' },
      }));
      const renderSize = canvasOutputSize.aspectRatio === canvasAspectRatio
        ? canvasOutputSize
        : getDefaultCanvasOutputSize(canvasAspectRatio);
      addWorkspaceNotification({
        title: 'Export Render Started',
        message: `Rendering ${renderSize.width} × ${renderSize.height} MP4 (${canvasAspectRatio}) with timeline audio...`,
        category: 'export',
        type: 'render',
        targetPane: 'canvas',
        actionLabel: 'Watch Render',
      });
    };
    window.addEventListener('workspace:export-video', handleExportRequest);
    return () => window.removeEventListener('workspace:export-video', handleExportRequest);
  }, [audioUrl, canvasAspectRatio, canvasOutputSize, isLooping]);

  // Listen for save-to-library event from header
  useEffect(() => {
    const handleSave = () => {
      if (canPublish) handleSaveToLibrary();
    };
    window.addEventListener('workspace:save-to-library', handleSave);
    return () => window.removeEventListener('workspace:save-to-library', handleSave);
  }, [canPublish, handleSaveToLibrary]);

  return (
    <div className="w-full h-auto lg:h-full flex flex-col lg:flex-row min-h-0 font-sans-studio select-none gap-0 overflow-hidden">
      {/* Hidden Audio Element */}
      <audio ref={audioRef} className="hidden" preload="auto" />
      <audio ref={musicAudioRef} className="hidden" preload="auto" crossOrigin="anonymous" loop />

      {/* ── Left Studio Column: Full-Height (Top to Bottom) ── */}
      {showLeftPane && (
        <div
          style={isDesktop ? { width: `${leftPaneWidth}px` } : undefined}
          className="w-full max-w-full lg:w-auto shrink-0 min-h-130 lg:h-full lg:min-h-0 flex flex-col overflow-hidden border-r border-[#242426]"
        >
            {activePane === 'editor' || (activePane === 'script' && scriptSubPane === 'editor') ? (
              <ScriptEditorPane
                script={script}
                onUpdateScript={(updated) => setScript((prev) => ({ ...prev, ...updated }))}
                onSwitchToAgent={() => {
                  setScriptSubPane('prompt');
                  onPaneChange('prompt');
                }}
                onStartNewVideo={handleStartNewVideo}
              />
            ) : activePane === 'prompt' || (activePane === 'script' && scriptSubPane === 'prompt') ? (
              <AIAgentCreatorPane
                agentPrompt={agentPrompt}
                onPromptChange={(val) => {
                  setAgentPrompt(val);
                  if (agentError) setAgentError(null);
                }}
                category={category}
                onCategoryChange={setCategory}
                targetLength={targetLength}
                onTargetLengthChange={setTargetLength}
                aspectRatio={canvasAspectRatio}
                onAspectRatioChange={handleCanvasAspectRatioChange}
                agentError={agentError}
                onClearError={() => setAgentError(null)}
                selectedVoice={selectedVoice}
                onVoiceChange={(vId) => {
                  setSelectedVoice(vId);
                  handleSynthesizeVoice(script, vId);
                }}
                voices={voices}
                onTestVoice={handleTestVoice}
                testingVoiceId={testingVoiceId}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                loadingAgent={loadingAgent}
                onRunAgent={async () => {
                  const success = await handleRunAIAgent();
                  if (success) {
                    setScriptSubPane('editor');
                    onPaneChange('editor');
                  }
                }}
                onSwitchToEditor={() => {
                  setScriptSubPane('editor');
                  onPaneChange('editor');
                }}
                onStartNewVideo={handleStartNewVideo}
              />
            ) : activePane === 'canvas' ? (
              <CanvasPane
                aspectRatio={canvasAspectRatio}
                outputSize={canvasOutputSize}
                onOutputSizeChange={setCanvasOutputSize}
                onAspectRatioChange={(r) => {
                  handleCanvasAspectRatioChange(r);
                  setActiveCompound('video');
                  addWorkspaceNotification({
                    title: `Canvas Aspect Ratio: ${r}`,
                    message: `Studio viewport adjusted to ${r === '9:16' ? '9:16 Vertical Short (1080x1920)' : r}.`,
                    category: 'media',
                    type: 'info',
                    targetPane: 'canvas',
                    actionLabel: 'Canvas View',
                  });
                }}
                background={canvasBackground}
                onBackgroundChange={(bg) => {
                  setCanvasBackground(bg);
                  setActiveCompound('video');
                }}
              />
            ) : activePane === 'media' ? (
              <MediaPane
                onApplyBackdrop={(url, isVideo, name) => {
                  setShowTimeline(true);
                  setActiveCompound('video');
                  if (isVideo) {
                    setCustomBackdropVideo(url);
                  } else {
                    setCustomBackdropImage(url);
                  }
                  window.dispatchEvent(
                    new CustomEvent('workspace:add-timeline-clip', {
                      detail: {
                        type: isVideo ? 'video' : 'image',
                        url,
                        name: name || (isVideo ? 'Uploaded Video' : 'Uploaded Image'),
                        duration: isVideo ? 10 : 8,
                        start: currentTime,
                      },
                    })
                  );
                  window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'video' }));
                  addWorkspaceNotification({
                    title: isVideo ? 'Video Added to Timeline' : 'Image Added to Timeline',
                    message: 'Media placed at playhead. Drag freely along the timeline.',
                    category: 'media',
                    type: 'info',
                    targetPane: 'canvas',
                    actionLabel: 'Preview',
                  });
                }}
                onApplyAudio={(url) => {
                  setShowTimeline(true);
                  setActiveCompound('music');
                  setAudioUrl(url);
                  if (audioRef.current) {
                    audioRef.current.src = url;
                    audioRef.current.play().catch(() => {});
                    setIsPlaying(true);
                  }
                  window.dispatchEvent(
                    new CustomEvent('workspace:add-timeline-clip', {
                      detail: {
                        type: 'music',
                        url,
                        name: 'Imported Audio',
                        duration: 15,
                        start: currentTime,
                      },
                    })
                  );
                  window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'music' }));
                  addWorkspaceNotification({
                    title: 'Audio Added to Timeline',
                    message: 'Soundtrack clip placed at playhead. Add more audio tracks or trim freely.',
                    category: 'voice',
                    type: 'info',
                    targetPane: 'audio',
                    actionLabel: 'Audio Settings',
                  });
                }}
                activeMediaUrl={customBackdropVideo || customBackdropImage}
              />
            ) : activePane === 'text' ? (
              <TextPane
                onUpdateTitle={(title) => {
                  setActiveCompound('text');
                  setScript((prev) => ({ ...prev, title }));
                }}
                onUpdateHook={(hook) => {
                  setActiveCompound('text');
                  setScript((prev) => ({ ...prev, hook }));
                }}
                onUpdateQuote={(quote) => {
                  setActiveCompound('text');
                  setScript((prev) => ({ ...prev, quote }));
                }}
                onApplyPreset={(p) => {
                  setCaptionPreset({
                    className: p.className,
                    color: p.color,
                    fontFamily: p.fontFamily,
                    fontSize: p.fontSize,
                    fontWeight: p.fontWeight,
                    textTransform: p.textTransform,
                    previewText: p.previewText,
                  });
                  addWorkspaceNotification({
                    title: `Subtitle Preset Applied`,
                    message: `Kinetic typography styling updated for subtitle cue cards.`,
                    category: 'script',
                    type: 'info',
                    targetPane: 'text',
                    actionLabel: 'Text Styling',
                  });
                }}
              />
            ) : activePane === 'elements' ? (
              <ElementsPane
                onInsertElement={(el) => {
                  setShowTimeline(true);
                  setActiveCompound('overlay');
                  setActiveElementOverlay({ ...el, label: el.name });
                  if (el.type === 'badge') {
                    setScript((prev) => ({ ...prev, title: prev.title ? `${el.value}: ${prev.title}` : el.value }));
                  }
                  window.dispatchEvent(
                    new CustomEvent('workspace:add-timeline-clip', {
                      detail: {
                        type: 'overlay',
                        url: el.value || '',
                        elementType: el.type,
                        value: el.value,
                        name: el.name || 'Overlay Element',
                        label: el.label || el.name,
                        duration: 4.5,
                        start: currentTime,
                      },
                    })
                  );
                  window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'overlay' }));
                  addWorkspaceNotification({
                    title: `Overlay Added: ${el.name || el.type}`,
                    message: 'Visual element attached to timeline at playhead.',
                    category: 'media',
                    type: 'info',
                    targetPane: 'elements',
                    actionLabel: 'View Overlay',
                  });
                }}
              />
            ) : activePane === 'audio' ? (
              <AudioPane
                onSelectMusic={(mId) => {
                  setShowTimeline(true);
                  setActiveCompound('music');
                  setSelectedMusic(mId);
                  const track = musicTracks.find((t) => t.id === mId);
                  const sourceUrl = track?.audioUrl || DEFAULT_SOUNDTRACK_AUDIO_URL;
                  if (musicAudioRef.current) {
                    musicAudioRef.current.src = sourceUrl;
                    musicAudioRef.current.play().catch(() => {});
                    setIsPlaying(true);
                  }
                  window.dispatchEvent(
                    new CustomEvent('workspace:add-timeline-clip', {
                      detail: {
                        type: 'music',
                        url: sourceUrl,
                        name: track ? track.title : 'Soundtrack',
                        duration: 15.0,
                        start: currentTime,
                      },
                    })
                  );
                  window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'music' }));
                  addWorkspaceNotification({
                    title: 'Soundtrack Added to Timeline',
                    message: track ? `Loaded "${track.title}" at playhead.` : 'Soundtrack clip added.',
                    category: 'voice',
                    type: 'info',
                    targetPane: 'audio',
                    actionLabel: 'Audio Settings',
                  });
                }}
                selectedMusic={selectedMusic}
                onAddSfxToTimeline={(sfx) => {
                  const durationSeconds = Number.parseFloat(sfx.duration);
                  const sfxDur = Number.isFinite(durationSeconds) ? durationSeconds : 2.0;
                  setSelectedSfx({
                    id: sfx.id,
                    name: sfx.name,
                    audioUrl: sfx.audioUrl,
                    duration: sfxDur,
                    start: currentTime,
                  });
                  setShowTimeline(true);
                  setActiveCompound('music');
                  window.dispatchEvent(
                    new CustomEvent('workspace:add-timeline-clip', {
                      detail: {
                        type: 'sfx',
                        url: sfx.audioUrl,
                        name: sfx.name,
                        duration: sfxDur,
                        start: currentTime,
                      },
                    })
                  );
                  window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'music' }));
                  const formattedCurrentTime = `${Math.floor(currentTime / 60).toString().padStart(2, '0')}:${Math.floor(currentTime % 60).toString().padStart(2, '0')}`;
                  addWorkspaceNotification({
                    title: `SFX Cue: ${sfx.name}`,
                    message: `Sound effect placed at timecode ${formattedCurrentTime}.`,
                    category: 'voice',
                    type: 'info',
                    targetPane: 'audio',
                    actionLabel: 'Audio Mixer',
                  });
                }}
                onApplyRecordedVoice={(recordedUrl) => {
                  setShowTimeline(true);
                  setActiveCompound('voice');
                  setAudioUrl(recordedUrl);
                  if (audioRef.current) {
                    audioRef.current.src = recordedUrl;
                    audioRef.current.play().catch(() => {});
                    setIsPlaying(true);
                  }
                  window.dispatchEvent(
                    new CustomEvent('workspace:add-timeline-clip', {
                      detail: {
                        type: 'voice',
                        url: recordedUrl,
                        name: 'Recorded Voice',
                        duration: duration > 0 ? duration : 12.1,
                        start: currentTime,
                      },
                    })
                  );
                  window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'voice' }));
                  addWorkspaceNotification({
                    title: 'Voice Recording Added to Timeline',
                    message: 'Live voice recording placed at playhead.',
                    category: 'voice',
                    type: 'success',
                    targetPane: 'audio',
                    actionLabel: 'Voice Settings',
                  });
                }}
              />
            ) : activePane === 'image' ? (
              <ImagePane
                onSelectImage={(url) => {
                  setShowTimeline(true);
                  setActiveCompound('video');
                  setCustomBackdropImage(url);
                  setCustomBackdropVideo('');
                  window.dispatchEvent(
                    new CustomEvent('workspace:add-timeline-clip', {
                      detail: {
                        type: 'image',
                        url,
                        name: 'Stock Photo',
                        duration: 8,
                        start: currentTime,
                      },
                    })
                  );
                  window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'video' }));
                  addWorkspaceNotification({
                    title: 'Stock Photo Added',
                    message: 'Image added to timeline at playhead. Drag freely anywhere on the timeline.',
                    category: 'media',
                    type: 'info',
                    targetPane: 'image',
                    actionLabel: 'Preview',
                  });
                }}
                activeImageUrl={customBackdropImage}
              />
            ) : activePane === 'video' ? (
              <VideoStockPane
                onSelectVideo={(url) => {
                  setShowTimeline(true);
                  setActiveCompound('video');
                  setCustomBackdropVideo(url);
                  setCustomBackdropImage('');
                  window.dispatchEvent(
                    new CustomEvent('workspace:add-timeline-clip', {
                      detail: {
                        type: 'video',
                        url,
                        name: 'Stock Video',
                        duration: 10,
                        start: currentTime,
                      },
                    })
                  );
                  window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'video' }));
                  addWorkspaceNotification({
                    title: 'Stock Video Added',
                    message: 'Video added to timeline at playhead. Drag freely anywhere on the timeline.',
                    category: 'media',
                    type: 'info',
                    targetPane: 'video',
                    actionLabel: 'Preview',
                  });
                }}
                activeVideoUrl={customBackdropVideo}
              />
            ) : null}
          </div>
        )}

      {/* ── Main Work Area (Right of Left Panel): Top Preview & Controls, Bottom Timeline ── */}
      <div className="flex-1 min-w-0 h-auto lg:h-full flex flex-col min-h-0 overflow-hidden">
        {/* Top Area: Video Preview and Inspiration Studio */}
        <div className="flex flex-col lg:flex-row gap-0 h-auto min-h-0 flex-1 overflow-hidden relative">
          {/* Center Pane: Video Preview Canvas */}
          <div className="flex-1 min-w-0 w-full max-w-full min-h-130 lg:h-full lg:min-h-0 flex flex-col items-center justify-center overflow-hidden">
            <div className="w-full h-full max-h-full flex items-center justify-center overflow-hidden">
              <VideoPreviewPane
                canvasAspectRatio={canvasAspectRatio}
                canvasOutputSize={canvasOutputSize}
                canvasBackground={canvasBackground}
                script={script}
                activeBackdrop={activeBackdropObj}
                customImageUrl={customBackdropImage}
                customVideoUrl={customBackdropVideo}
                activeElementOverlay={activeElementOverlay}
                captionPresetClass={captionPreset?.className}
                captionPresetColor={captionPreset?.color}
                captionPresetFontFamily={captionPreset?.fontFamily}
                captionPresetFontSize={captionPreset?.fontSize}
                captionPresetFontWeight={captionPreset?.fontWeight}
                captionPresetTextTransform={captionPreset?.textTransform}
                captionPresetPreviewText={captionPreset?.previewText}
                isPlaying={isPlaying}
                isMuted={isMuted}
                volume={volume}
                playbackRate={playbackRate}
                onTogglePlay={togglePlay}
                onToggleMute={() => {
                  if (isMuted || volume === 0) {
                    setVolume((currentVolume) => currentVolume || 0.7);
                    setIsMuted(false);
                  } else {
                    setIsMuted(true);
                  }
                }}
                onVolumeChange={handleVolumeChange}
                onPlaybackRateChange={setPlaybackRate}
                currentTime={currentTime}
                duration={duration}
                playbackDuration={Math.max(duration, timelineDuration)}
                onSeek={handleSeek}
                isLooping={isLooping}
                onToggleLoop={() => setIsLooping((prev) => !prev)}
                audioUrl={audioUrl}
                audioElement={audioRef.current}
                audioOutputStream={audioOutputStream}
                isExporting={isExporting}
                exportDuration={Math.max(duration, timelineDuration)}
                exportFileName={script.title || 'apexmind-video'}
                onExportComplete={handleVideoExportComplete}
                onApplyRecordedVoice={(recordedUrl) => {
                  setAudioUrl(recordedUrl);
                  if (audioRef.current) {
                    audioRef.current.src = recordedUrl;
                    audioRef.current.play().catch(() => {});
                    setIsPlaying(true);
                  }
                }}
                onUpdateScript={(updated) => setScript((prev) => ({ ...prev, ...updated }))}
                onSelectBackdrop={setSelectedBackdrop}
                backdrops={backdrops}
                voices={voices}
                selectedVoice={selectedVoice}
                onSelectVoice={(vId) => {
                  setSelectedVoice(vId);
                  handleSynthesizeVoice(script, vId);
                }}
                onPublish={handlePublish}
                canPublish={canPublish}
                publishing={publishing}
                publishedSuccess={publishedSuccess}
              />
            </div>
          </div>

          {/* Right Pane: Inspiration Studio Panel */}
          {showRightPane && (
            <div
              style={isDesktop ? { width: `${rightPaneWidth}px` } : undefined}
              className="w-full max-w-full lg:w-auto shrink-0 min-h-130 lg:h-full lg:min-h-0 flex flex-col overflow-hidden border-l border-[#242426]"
            >
              <StudioControlsPane
                voices={voices}
                selectedVoice={selectedVoice}
                onSelectVoice={(vId) => {
                  setSelectedVoice(vId);
                  handleSynthesizeVoice(script, vId);
                }}
                onTestVoice={handleTestVoice}
                testingVoiceId={testingVoiceId}
                backdrops={backdrops}
                selectedBackdrop={selectedBackdrop}
                onSelectBackdrop={setSelectedBackdrop}
                musicTracks={musicTracks}
                selectedMusic={selectedMusic}
                onSelectMusic={setSelectedMusic}
                onPublish={handlePublish}
                publishing={publishing}
                canPublish={canPublish}
                publishedSuccess={publishedSuccess}
                script={script}
                onUpdateScript={(updated) => setScript((prev) => ({ ...prev, ...updated }))}
                duration={duration}
                timelineDuration={timelineDuration}
                onDurationChange={setTimelineDuration}
                currentTime={currentTime}
                playbackRate={playbackRate}
                onPlaybackRateChange={setPlaybackRate}
                volume={volume}
                onVolumeChange={handleVolumeChange}
                musicVolume={musicVolume}
                onMusicVolumeChange={setMusicVolume}
                category={category}
                customImageUrl={customBackdropImage}
                customVideoUrl={customBackdropVideo}
                activeElementOverlay={activeElementOverlay}
                onSetCustomImage={(url) => {
                  setCustomBackdropImage(url);
                }}
                onSetCustomVideo={(url) => {
                  setCustomBackdropVideo(url);
                }}
                canvasBackground={canvasBackground}
                onCanvasBackgroundChange={setCanvasBackground}
                canvasAspectRatio={canvasAspectRatio}
                onCanvasAspectRatioChange={handleCanvasAspectRatioChange}
                activeCompound={activeCompound}
                onSelectCompound={setActiveCompound}
              />
            </div>
          )}
        </div>

        {/* ── Studio Multi-Track Timeline Panel (Bottom Studio Area, placed next to Left Panel) ── */}
        {showTimeline && (
          <div className="shrink-0 min-h-[44px] border-t border-[#242426]">
            <StudioTimelinePane
              timelineHeight={timelineHeight}
              onTimelineHeightChange={setTimelineHeight}
              currentTime={currentTime}
              duration={duration}
              timelineDuration={timelineDuration}
              isPlaying={isPlaying}
              onTogglePlay={togglePlay}
              onSeek={handleSeek}
              onTimelineDurationChange={setTimelineDuration}
              selectedSfx={selectedSfx}
              onRemoveSfx={() => setSelectedSfx(null)}
              onRemoveVideo={() => {
                setCustomBackdropVideo(undefined);
                setActiveCompound((prev) => (prev === 'video' ? 'text' : prev));
              }}
              onRemoveImage={() => {
                setCustomBackdropImage(undefined);
                setActiveCompound((prev) => (prev === 'video' ? 'text' : prev));
              }}
              script={script}
              onUpdateSubtitles={(newSubtitles) =>
                setScript((prev) => {
                  const updatedStoryboard = prev.storyboard?.map((sc, i) => {
                    const sub = newSubtitles[i];
                    if (sub) {
                      return {
                        ...sc,
                        start: sub.start,
                        duration: sub.duration,
                        subtitleText: sub.text,
                        words: sub.words || sc.words,
                      };
                    }
                    return sc;
                  });
                  return {
                    ...prev,
                    subtitles: newSubtitles,
                    ...(updatedStoryboard ? { storyboard: updatedStoryboard } : {}),
                  };
                })
              }
              activeBackdrop={activeBackdropObj}
              selectedVoice={selectedVoice}
              selectedMusic={selectedMusic}
              audioUrl={audioUrl}
              volume={volume}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted(!isMuted)}
              customImageUrl={customBackdropImage}
              customVideoUrl={customBackdropVideo}
              activeElementOverlay={activeElementOverlay}
              voices={voices}
              musicTracks={musicTracks}
              onSelectCompound={(compound) => {
                setShowRightPane(true);
                setActiveCompound(compound as CompoundType);
              }}
            />
          </div>
        )}
      </div>

      {/* Modern Rich Notifications (Sonner) */}
      <Toaster position="top-right" theme="dark" richColors closeButton />

      {/* Global Command Palette (Cmd+K / Ctrl+K / /) */}
      <WorkspaceCommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onSelectPane={onPaneChange}
        onSelectAspectRatio={setCanvasAspectRatio}
        onTogglePlay={togglePlay}
        onToggleMute={() => setIsMuted((prev) => !prev)}
        onGenerateScript={handleRunAIAgent}
        onToggleTimeline={() => setShowTimeline((prev) => !prev)}
      />
    </div>
  );
}
