import React, { useState, useEffect, useRef } from 'react';
import { workspaceApi } from '../api/workspaceApi';
import { GeneratedScript, MusicTrack, VisualBackdrop, VoiceProfile } from '../types';
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
import { useAuth } from '@/src/features/auth/context/AuthContext';
import { DEFAULT_CREATOR_PROFILE, getCreatorProfile } from '@/src/features/profile/api/profileApi';

interface WorkspacePageProps {
  onNavigate: (page: string) => void;
  activePane: WorkspaceTabType;
  onPaneChange: (pane: WorkspaceTabType) => void;
}

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
  const [selectedBackdrop, setSelectedBackdrop] = useState('');
  const [preferredTone, setPreferredTone] = useState(DEFAULT_CREATOR_PROFILE.tone);
  const [targetAudience, setTargetAudience] = useState(DEFAULT_CREATOR_PROFILE.audience);

  // Audio Playback Engine
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

        if (media.visualBackdrops && media.visualBackdrops.length > 0) {
          setSelectedBackdrop((currentBackdrop) =>
            media.visualBackdrops.some((b) => b.id === currentBackdrop)
              ? currentBackdrop
              : media.visualBackdrops[0].id
          );
        }

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
  }, [isLooping]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = isMuted;
    audio.volume = volume;
    audio.playbackRate = playbackRate;
    audio.loop = isLooping;
  }, [isLooping, isMuted, playbackRate, volume]);

  // Run AI Script Generation
  const handleRunAIAgent = async () => {
    setLoadingAgent(true);
    consoleLogger.info('Studio', `Generating script for category: ${category}`);
    try {
      const promptParts = [
        agentPrompt.trim(),
        targetAudience.trim() ? `Target audience: ${targetAudience.trim()}` : '',
      ].filter(Boolean);
      const generated = await workspaceApi.generateScript({
        category,
        userPrompt: promptParts.join('\n') || undefined,
        tone: preferredTone,
        model: selectedModel,
      });

      setScript({ ...generated, recommendedVoice: selectedVoice || generated.recommendedVoice });
      if (generated.visualTheme) {
        setSelectedBackdrop(generated.visualTheme);
      }

      const mem = await workspaceApi.getQuoteMemory();
      setMemoryCount(mem.totalQuotesInMemory || 0);

      // Automatically synthesize 24kHz voiceover with updated script
      handleSynthesizeVoice(generated, selectedVoice || generated.recommendedVoice || 'Fenrir');
    } catch (err) {
      consoleLogger.error('Studio', 'Error generating script:', err);
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
    if (audioRef.current && audioUrl && !audioRef.current.paused) return;

    const maxTime = duration > 0 ? duration : 30;
    let lastTs = performance.now();
    let animId: number;

    const tick = (now: number) => {
      const deltaSec = ((now - lastTs) / 1000) * playbackRate;
      lastTs = now;

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
  }, [isPlaying, duration, playbackRate, isLooping, audioUrl]);

  // Play / Pause Audio & Timeline Playhead
  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    } else {
      const maxTime = duration > 0 ? duration : 30;
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
    const maxTime = duration > 0 ? duration : 30;
    const clamped = Math.max(0, Math.min(maxTime, parseFloat(newTime.toFixed(2))));
    setCurrentTime(clamped);
    if (audioRef.current && duration > 0 && !Number.isNaN(audioRef.current.duration)) {
      audioRef.current.currentTime = clamped;
    }
  };

  const handleVolumeChange = (nextVolume: number) => {
    const clampedVolume = Math.min(1, Math.max(0, nextVolume));
    setVolume(clampedVolume);
    setIsMuted(clampedVolume === 0);
  };

  // Publish to YouTube Shorts
  const handlePublish = async () => {
    setPublishing(true);
    consoleLogger.info('YouTube', `📤 Uploading video to YouTube Shorts: "${script.title}"`);
    try {
      await workspaceApi.publishVideo({
        title: script.title,
        quote: script.quote,
        voice: selectedVoice,
        visualTheme: selectedBackdrop,
        category,
      });
      setPublishedSuccess(true);
      setTimeout(() => {
        onNavigate('youtube');
      }, 1500);
    } catch (err) {
      consoleLogger.error('YouTube', 'Upload failed:', err);
    } finally {
      setPublishing(false);
    }
  };

  // Selected backdrop & music objects
  const activeBackdropObj =
    backdrops.find((b) => b.id === selectedBackdrop) ||
    backdrops[0] || {
      id: '',
      name: '',
      category: '',
      aspectRatio: '9:16',
      previewColor: '',
      textColor: '#FFFFFF',
      particleEffect: '',
    };

  const canPublish = Boolean(script.title && script.quote);

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
    const handleTriggerPublish = () => {
      if (canPublish && !publishing) {
        handlePublish();
      }
    };
    window.addEventListener('workspace:trigger-publish', handleTriggerPublish);
    return () => window.removeEventListener('workspace:trigger-publish', handleTriggerPublish);
  }, [canPublish, publishing, handlePublish]);

  const centerColSpan =
    showLeftPane && showRightPane
      ? 'lg:col-span-4'
      : !showLeftPane && !showRightPane
      ? 'lg:col-span-12'
      : 'lg:col-span-8';

  return (
    <div className="w-full h-auto min-h-full lg:h-full flex flex-col min-h-0 font-sans-studio select-none gap-2">
      {/* Hidden Audio Element */}
      <audio ref={audioRef} className="hidden" preload="auto" />

      {/* ── Tri-Pane Studio Layout (Left: AI Prompt/Script, Center: Video Preview, Right: Inspiration Studio) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 h-auto min-h-0 flex-1 lg:h-full overflow-hidden">
        {/* Left Pane: Dynamic Active Studio Panel (col-span-4) */}
        {showLeftPane && (
          <div className="lg:col-span-4 min-h-[520px] lg:h-full lg:min-h-0 flex flex-col transition-all duration-200">
            <div className="flex-1 min-h-0 bg-[#121212] border border-[#3A3A3A] rounded-2xl p-3.5 overflow-y-auto custom-scrollbar shadow-xl">
            {activePane === 'canvas' ? (
              <CanvasPane
                aspectRatio={canvasAspectRatio}
                onAspectRatioChange={(r) => {
                  setCanvasAspectRatio(r);
                  setShowRightPane(true);
                  setActiveCompound('video');
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
                }}
              />
            ) : activePane === 'audio' ? (
              <AudioPane
                onSelectMusic={(mId) => {
                  setShowRightPane(true);
                  setActiveCompound('music');
                  setSelectedMusic(mId);
                }}
                selectedMusic={selectedMusic}
                onApplyRecordedVoice={(recordedUrl) => {
                  setShowRightPane(true);
                  setActiveCompound('voice');
                  setAudioUrl(recordedUrl);
                  if (audioRef.current) {
                    audioRef.current.src = recordedUrl;
                    audioRef.current.play().catch(() => {});
                    setIsPlaying(true);
                  }
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
            ) : activePane === 'editor' || (activePane === 'script' && scriptSubPane === 'editor') ? (
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
            ) : (
              <AIAgentCreatorPane
                agentPrompt={agentPrompt}
                onPromptChange={setAgentPrompt}
                category={category}
                onCategoryChange={setCategory}
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
            )}
          </div>
        </div>
        )}

        {/* Center Pane: Video Preview Canvas */}
        <div className={`${centerColSpan} min-h-[520px] lg:h-full lg:min-h-0 flex flex-col items-center justify-center transition-all duration-200`}>
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
              onSeek={handleSeek}
              isLooping={isLooping}
              onToggleLoop={() => setIsLooping((prev) => !prev)}
              audioUrl={audioUrl}
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
          <div className="lg:col-span-4 min-h-[520px] lg:h-full lg:min-h-0 flex flex-col transition-all duration-200">
            <div className="flex-1 min-h-0 bg-[#121212] border border-[#3A3A3A] rounded-2xl p-3.5 overflow-y-auto custom-scrollbar shadow-xl">
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
                currentTime={currentTime}
                playbackRate={playbackRate}
                onPlaybackRateChange={setPlaybackRate}
                volume={volume}
                onVolumeChange={handleVolumeChange}
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
                activeCompound={activeCompound}
                onSelectCompound={setActiveCompound}
              />
            </div>
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
    </div>
  );
}
