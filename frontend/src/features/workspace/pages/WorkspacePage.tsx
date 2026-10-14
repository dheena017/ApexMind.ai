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
import { Toaster, toast } from 'sonner';
import confetti from 'canvas-confetti';
import { WorkspaceCommandPalette } from '../components/WorkspaceCommandPalette';
import { useAuth } from '@/src/features/auth/context/AuthContext';
import { DEFAULT_CREATOR_PROFILE, getCreatorProfile } from '@/src/features/profile/api/profileApi';
import { addWorkspaceNotification } from '../utils/workspaceNotificationManager';

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
  canvasBackground: string;
  timelineDuration: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  musicVolume: number;
  activeElementOverlay: { id?: string; name?: string; type: string; value: string; label?: string } | null;
  selectedSfx: { id: string; name: string; audioUrl: string; duration: number; start: number } | null;
  captionPreset: { className?: string; color?: string } | null;
}

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
  const [canvasBackground, setCanvasBackground] = useState<string>('#050505');
  const [captionPreset, setCaptionPreset] = useState<{ className?: string; color?: string } | null>(null);
  const [scriptSubPane, setScriptSubPane] = useState<'prompt' | 'editor'>(
    activePane === 'editor' ? 'editor' : 'prompt'
  );
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

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
    const effectiveGain = isMuted ? 0 : volume * Math.min(fadeInGain, fadeOutGain);
    const graph = audioProcessingGraphRef.current;
    if (graph) {
      audio.volume = 1;
      audio.muted = false;
      graph.gain.gain.setTargetAtTime(effectiveGain, graph.context.currentTime, 0.02);
      graph.highPass.frequency.setTargetAtTime(noiseReduction ? 100 : 10, graph.context.currentTime, 0.05);
      graph.lowPass.frequency.setTargetAtTime(noiseReduction ? 10_000 : 20_000, graph.context.currentTime, 0.05);
    } else {
      audio.volume = effectiveGain;
      audio.muted = isMuted;
    }
    audio.playbackRate = playbackRate;
    if (isPlaying && graph?.context.state === 'suspended') void graph.context.resume();
  }, [currentTime, duration, isMuted, isPlaying, noiseReduction, playbackRate, timelineDuration, volume, voiceFadeSettings]);

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
    const graph = audioProcessingGraphRef.current;
    if (graph?.musicSource) {
      musicAudio.volume = 1;
      graph.musicGain.gain.setTargetAtTime(musicVolume * Math.min(fadeInGain, fadeOutGain), graph.context.currentTime, 0.02);
    } else {
      musicAudio.volume = musicVolume * Math.min(fadeInGain, fadeOutGain);
    }
    musicAudio.playbackRate = playbackRate;
    if (Math.abs(musicAudio.currentTime - currentTime) > 0.5 && Number.isFinite(musicAudio.duration)) {
      musicAudio.currentTime = Math.min(currentTime, musicAudio.duration);
    }
    if (isPlaying && musicAudio.paused) musicAudio.play().catch(() => {});
    if (!isPlaying && !musicAudio.paused) musicAudio.pause();
  }, [currentTime, duration, isPlaying, musicFadeSettings, musicVolume, playbackRate, selectedMusic, timelineDuration]);

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
      if (isLooping) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        setIsPlaying(true);
      } else if (isExporting) {
        const exportEnd = Math.max(duration > 0 ? duration : 30, timelineDuration);
        setCurrentTime(audio.currentTime);
        setIsPlaying(audio.currentTime < exportEnd - 0.05);
      } else {
        setIsPlaying(false);
        setCurrentTime(0);
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
  const handleRunAIAgent = async () => {
    setLoadingAgent(true);
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
            ? { className: captionPreset.className || null, color: captionPreset.color || null }
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
        ...(creativeBrief.aspectRatio ? { aspectRatio: creativeBrief.aspectRatio } : {}),
        ...(creativeBrief.musicTrack ? { musicTrack: creativeBrief.musicTrack } : {}),
        ...(creativeBrief.captionStyle ? { captionStyle: creativeBrief.captionStyle } : {}),
        ...(creativeBrief.visualTheme ? { visualTheme: creativeBrief.visualTheme } : {}),
        ...(creativeBrief.motionStyle ? { motionStyle: creativeBrief.motionStyle } : {}),
        ...(creativeBrief.outputFormat ? { outputFormat: creativeBrief.outputFormat } : {}),
        creativeContext,
      });

      setScript({ ...generated, recommendedVoice: selectedVoice || generated.recommendedVoice });
      if (generated.visualTheme) {
        const generatedBackdrop = backdrops.find(
          (backdrop) =>
            backdrop.id === generated.visualTheme ||
            backdrop.name.toLowerCase() === generated.visualTheme?.trim().toLowerCase()
        );
        if (generatedBackdrop) setSelectedBackdrop(generatedBackdrop.id);
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

      // Automatically synthesize 24kHz voiceover with updated script
      handleSynthesizeVoice(generated, selectedVoice || generated.recommendedVoice || 'Fenrir');
    } catch (err) {
      consoleLogger.error('Studio', 'Error generating script:', err);
      toast.error('Script generation failed', {
        description: err instanceof Error ? err.message : 'Please check connection',
      });
      addWorkspaceNotification({
        title: 'Script Generation Failed',
        message: err instanceof Error ? err.message : 'Please check API key or prompt parameters.',
        category: 'script',
        type: 'error',
        targetPane: 'script',
        actionLabel: 'Retry Prompt',
      });
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
      const textToSpeak = `${targetScript.hook} ${targetScript.quote} ${targetScript.cta}`;
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

  // Universal Studio Playback Engine
  useEffect(() => {
    if (!isPlaying) return;
    // If audio is actively playing, audio event listener handles time updates
    const audio = audioRef.current;
    if (audio && audioUrl && !audio.paused && !isExporting) return;

    const maxTime = Math.max(duration > 0 ? duration : 30, timelineDuration);
    let lastTs = performance.now();
    let animId: number;

    const tick = (now: number) => {
      const deltaSec = ((now - lastTs) / 1000) * playbackRate;
      lastTs = now;

      if (isExporting && audio && audioUrl && !audio.paused) {
        setCurrentTime(audio.currentTime);
        animId = requestAnimationFrame(tick);
        return;
      }

      setCurrentTime((prev) => {
        const next = prev + deltaSec;
        if (next >= maxTime) {
          if (isLooping) {
            return 0;
          } else {
            setIsPlaying(false);
            return maxTime;
          }
        }
        return next;
      });

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, duration, timelineDuration, playbackRate, isLooping, audioUrl, isExporting]);

  // Play / Pause Audio & Timeline Playhead
  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    } else {
      const maxTime = Math.max(duration > 0 ? duration : 30, timelineDuration);
      if (currentTime >= maxTime - 0.1) {
        handleSeek(0);
      }
      setIsPlaying(true);
      if (audioRef.current && audioUrl) {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  // Seek playhead (functional across full timeline even without audio synthesized yet)
  const handleSeek = (newTime: number) => {
    const maxTime = Math.max(duration > 0 ? duration : 30, timelineDuration);
    const clamped = Math.max(0, Math.min(maxTime, parseFloat(newTime.toFixed(2))));
    setCurrentTime(clamped);
    if (audioRef.current && duration > 0 && !Number.isNaN(audioRef.current.duration) && clamped <= duration) {
      audioRef.current.currentTime = clamped;
    } else if (audioRef.current && clamped > duration) {
      audioRef.current.pause();
    }
  };

  const handleVolumeChange = (nextVolume: number) => {
    const clampedVolume = Math.min(1, Math.max(0, nextVolume));
    setVolume(clampedVolume);
    setIsMuted(clampedVolume === 0);
  };

  // Publish to YouTube Shorts
  const handlePublish = async () => {
    const publishTitle = script.title?.trim() || 'Untitled Short';
    const publishQuote = script.quote?.trim() || script.hook?.trim() || script.cta?.trim() || 'ApexMind video';

    setPublishing(true);
    consoleLogger.info('YouTube', `📤 Uploading video to YouTube Shorts: "${publishTitle}"`);
    try {
      await workspaceApi.publishVideo({
        title: publishTitle,
        quote: publishQuote,
        voice: selectedVoice,
        visualTheme: selectedBackdrop,
        category,
      });
      // Also save to website video library automatically
      await videosApi.createVideo({
        title: publishTitle,
        quote: publishQuote,
        hook: script.hook || '',
        cta: script.cta || '',
        category,
        coverImageUrl:
          backdrops.find((b) => b.id === selectedBackdrop)?.imageUrl ||
          'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1080&q=85',
        audioUrl: audioUrl || '',
        voice: selectedVoice,
        aspectRatio: canvasAspectRatio,
        duration: `00:${String(Math.round(duration || 30)).padStart(2, '0')}`,
        visualTheme: selectedBackdrop || 'v1',
        subtitles: script.subtitles as any,
        tags: script.hashtags || [],
        status: 'ready',
      }).catch(() => {}); // Non-blocking
      setPublishedSuccess(true);
      toast.success('Published video to YouTube!', {
        description: script.title || 'Live on YouTube',
      });
      addWorkspaceNotification({
        title: 'Published to YouTube Shorts',
        message: `"${script.title}" broadcast to connected YouTube channel.`,
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
      await videosApi.createVideo({
        title: script.title || 'Untitled Short',
        quote: script.quote || '',
        hook: script.hook || '',
        cta: script.cta || '',
        category,
        coverImageUrl:
          backdrops.find((b) => b.id === selectedBackdrop)?.imageUrl ||
          'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1080&q=85',
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
      setCanvasAspectRatio(draft.canvasAspectRatio || '9:16');
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

  // Listen to global compound selection events: ALWAYS open and show right inspector pane
  useEffect(() => {
    const handleCompoundSelect = (e: Event) => {
      const customEvent = e as CustomEvent<CompoundType>;
      if (customEvent.detail) {
        setShowRightPane(true);
        setActiveCompound(customEvent.detail);
      }
    };
    window.addEventListener('workspace:select-compound', handleCompoundSelect);
    return () => window.removeEventListener('workspace:select-compound', handleCompoundSelect);
  }, []);

  useEffect(() => {
    const handleAspectRatio = (e: Event) => {
      const customEvent = e as CustomEvent<{ aspectRatio: '9:16' | '16:9' | '1:1' | '4:5' | '21:9' }>;
      if (customEvent.detail?.aspectRatio) {
        setCanvasAspectRatio(customEvent.detail.aspectRatio);
      }
    };
    window.addEventListener('workspace:aspect-ratio-change', handleAspectRatio);
    return () => window.removeEventListener('workspace:aspect-ratio-change', handleAspectRatio);
  }, []);

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
      addWorkspaceNotification({
        title: 'Export Render Started',
        message: `Rendering 1080p short (${canvasAspectRatio}) with timeline audio...`,
        category: 'export',
        type: 'render',
        targetPane: 'canvas',
        actionLabel: 'Watch Render',
      });
    };
    window.addEventListener('workspace:export-video', handleExportRequest);
    return () => window.removeEventListener('workspace:export-video', handleExportRequest);
  }, [audioUrl, isLooping]);

  // Listen for save-to-library event from header
  useEffect(() => {
    const handleSave = () => {
      if (canPublish) handleSaveToLibrary();
    };
    window.addEventListener('workspace:save-to-library', handleSave);
    return () => window.removeEventListener('workspace:save-to-library', handleSave);
  }, [canPublish, handleSaveToLibrary]);

  const centerColSpan =
    showLeftPane && showRightPane
      ? 'lg:col-span-4'
      : !showLeftPane && !showRightPane
      ? 'lg:col-span-12'
      : 'lg:col-span-8';

  return (
    <div className="w-full h-auto lg:h-full flex flex-col min-h-0 font-sans-studio select-none gap-2">
      {/* Hidden Audio Element */}
      <audio ref={audioRef} className="hidden" preload="auto" />
      <audio ref={musicAudioRef} className="hidden" preload="auto" crossOrigin="anonymous" loop />

      {/* ── Tri-Pane Studio Layout (Left: AI Prompt/Script, Center: Video Preview, Right: Inspiration Studio) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-1 h-auto min-h-0 flex-1 lg:h-full overflow-hidden">
        {/* Left Pane: Dynamic Active Studio Panel (col-span-4) */}
        {showLeftPane && (
          <div className="lg:col-span-4 min-h-130 lg:h-full lg:min-h-0 flex flex-col transition-all duration-200">
            {activePane === 'editor' || (activePane === 'script' && scriptSubPane === 'editor') ? (
              <ScriptEditorPane
                script={script}
                onUpdateScript={(updated) => setScript((prev) => ({ ...prev, ...updated }))}
                onSwitchToAgent={() => {
                  setScriptSubPane('prompt');
                  onPaneChange('prompt');
                }}
                onStartNewVideo={() => {
                  setAgentPrompt('');
                  setScriptSubPane('prompt');
                  onPaneChange('prompt');
                  setAudioUrl(null);
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.src = '';
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
                }}
              />
            ) : activePane === 'prompt' || (activePane === 'script' && scriptSubPane === 'prompt') ? (
              <AIAgentCreatorPane
                agentPrompt={agentPrompt}
                onPromptChange={setAgentPrompt}
                category={category}
                onCategoryChange={setCategory}
                targetLength={targetLength}
                onTargetLengthChange={setTargetLength}
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
                  await handleRunAIAgent();
                  setScriptSubPane('editor');
                  onPaneChange('editor');
                }}
                onSwitchToEditor={() => {
                  setScriptSubPane('editor');
                  onPaneChange('editor');
                }}
                onStartNewVideo={() => {
                  setAgentPrompt('');
                  setAudioUrl(null);
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.src = '';
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
                }}
              />
            ) : activePane === 'canvas' ? (
              <CanvasPane
                aspectRatio={canvasAspectRatio}
                onAspectRatioChange={(r) => {
                  setCanvasAspectRatio(r);
                  setShowRightPane(true);
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
                  setShowRightPane(true);
                  setActiveCompound('video');
                }}
              />
            ) : activePane === 'media' ? (
              <MediaPane
                onApplyBackdrop={(url, isVideo) => {
                  setShowRightPane(true);
                  setActiveCompound('video');
                  if (isVideo) {
                    setCustomBackdropVideo(url);
                    setCustomBackdropImage(undefined);
                  } else {
                    setCustomBackdropImage(url);
                    setCustomBackdropVideo(undefined);
                  }
                  addWorkspaceNotification({
                    title: isVideo ? 'Dynamic Video Backdrop Applied' : 'Custom Image Backdrop Applied',
                    message: 'Backdrop mapped to active 9:16 viewport layer.',
                    category: 'media',
                    type: 'info',
                    targetPane: 'canvas',
                    actionLabel: 'Preview',
                  });
                }}
                onApplyAudio={(url) => {
                  setShowRightPane(true);
                  setActiveCompound('music');
                  setAudioUrl(url);
                  if (audioRef.current) {
                    audioRef.current.src = url;
                    audioRef.current.play().catch(() => {});
                    setIsPlaying(true);
                  }
                  addWorkspaceNotification({
                    title: 'Custom Audio Loaded',
                    message: 'Audio asset attached to active timeline soundtrack.',
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
                  setShowRightPane(true);
                  setActiveCompound('text');
                  setScript((prev) => ({ ...prev, title }));
                }}
                onUpdateHook={(hook) => {
                  setShowRightPane(true);
                  setActiveCompound('text');
                  setScript((prev) => ({ ...prev, hook }));
                }}
                onUpdateQuote={(quote) => {
                  setShowRightPane(true);
                  setActiveCompound('text');
                  setScript((prev) => ({ ...prev, quote }));
                }}
                onApplyPreset={(p) => {
                  setShowRightPane(true);
                  setActiveCompound('text');
                  setCaptionPreset({ className: p.className, color: p.color });
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
                  setShowRightPane(true);
                  setActiveCompound('overlay');
                  setActiveElementOverlay({ ...el, label: el.name });
                  if (el.type === 'badge') {
                    setScript((prev) => ({ ...prev, title: prev.title ? `${el.value}: ${prev.title}` : el.value }));
                  }
                  addWorkspaceNotification({
                    title: `Overlay Added: ${el.name || el.type}`,
                    message: 'Visual element attached to timeline canvas.',
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
                  setShowRightPane(true);
                  setActiveCompound('music');
                  setSelectedMusic(mId);
                  const track = musicTracks.find((t) => t.id === mId);
                  addWorkspaceNotification({
                    title: 'Soundtrack Selected',
                    message: track ? `Loaded "${track.title}" (${track.genre}, ${track.bpm} BPM).` : 'Soundtrack updated.',
                    category: 'voice',
                    type: 'info',
                    targetPane: 'audio',
                    actionLabel: 'Audio Settings',
                  });
                }}
                selectedMusic={selectedMusic}
                onAddSfxToTimeline={(sfx) => {
                  const durationSeconds = Number.parseFloat(sfx.duration);
                  setSelectedSfx({
                    id: sfx.id,
                    name: sfx.name,
                    audioUrl: sfx.audioUrl,
                    duration: Number.isFinite(durationSeconds) ? durationSeconds : 0.5,
                    start: currentTime,
                  });
                  setShowTimeline(true);
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
                  setShowRightPane(true);
                  setActiveCompound('voice');
                  setAudioUrl(recordedUrl);
                  if (audioRef.current) {
                    audioRef.current.src = recordedUrl;
                    audioRef.current.play().catch(() => {});
                    setIsPlaying(true);
                  }
                  addWorkspaceNotification({
                    title: 'Voice Recording Attached',
                    message: 'Live voice recording synchronized with timeline.',
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
                  setShowRightPane(true);
                  setActiveCompound('video');
                  setCustomBackdropImage(url);
                  setCustomBackdropVideo(undefined);
                }}
                activeImageUrl={customBackdropImage}
              />
            ) : activePane === 'video' ? (
              <VideoStockPane
                onSelectVideo={(url) => {
                  setShowRightPane(true);
                  setActiveCompound('video');
                  setCustomBackdropVideo(url);
                  setCustomBackdropImage(undefined);
                }}
                activeVideoUrl={customBackdropVideo}
              />
            ) : null}
          </div>
        )}


        {/* Center Pane: Video Preview Canvas */}
        <div className={`${centerColSpan} min-h-130 lg:h-full lg:min-h-0 flex flex-col items-center justify-center transition-all duration-200`}>
          <div className="w-full h-full max-h-full flex items-center justify-center overflow-hidden">
            <VideoPreviewPane
              canvasAspectRatio={canvasAspectRatio}
              canvasBackground={canvasBackground}
              script={script}
              activeBackdrop={activeBackdropObj}
              customImageUrl={customBackdropImage}
              customVideoUrl={customBackdropVideo}
              activeElementOverlay={activeElementOverlay}
              captionPresetClass={captionPreset?.className}
              captionPresetColor={captionPreset?.color}
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
          <div className="lg:col-span-4 min-h-130 lg:h-full lg:min-h-0 flex flex-col transition-all duration-200">
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
              onCanvasAspectRatioChange={setCanvasAspectRatio}
              activeCompound={activeCompound}
              onSelectCompound={setActiveCompound}
            />
          </div>
        )}
      </div>

      {/* ── Studio Multi-Track Timeline Panel (Bottom Studio Area) ── */}
      {showTimeline && (
        <div className="mt-2 shrink-0 transition-all duration-200">
          <StudioTimelinePane
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            onSeek={handleSeek}
            onTimelineDurationChange={setTimelineDuration}
            selectedSfx={selectedSfx}
            onRemoveSfx={() => setSelectedSfx(null)}
            script={script}
            onUpdateSubtitles={(newSubtitles) =>
              setScript((prev) => ({ ...prev, subtitles: newSubtitles }))
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
