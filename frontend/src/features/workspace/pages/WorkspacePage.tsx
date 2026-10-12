import React, { useState, useEffect, useRef } from 'react';
import { workspaceApi } from '../api/workspaceApi';
import { GeneratedScript, MusicTrack, VisualBackdrop, VoiceProfile } from '../types';
import { consoleLogger } from '@/src/shared/utils/logger';
import { AIAgentCreatorPane } from '../components/AIAgentCreatorPane';
import { ScriptEditorPane } from '../components/ScriptEditorPane';
import { VideoPreviewPane } from '../components/VideoPreviewPane';
import { StudioControlsPane } from '../components/StudioControlsPane';

export default function WorkspacePage({ onNavigate }: { onNavigate: (page: string) => void }) {
  // Navigation between separate AI Creator and Script Editor pages
  const [activeLeftPane, setActiveLeftPane] = useState<'prompt' | 'editor'>('prompt');

  // AI Model & Script Generation
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [channelName, setChannelName] = useState('ApexMind');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [category, setCategory] = useState('Stoic Mindset & Discipline');
  const [loadingAgent, setLoadingAgent] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [testingVoiceId, setTestingVoiceId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);
  const [memoryCount, setMemoryCount] = useState(0);

  // Script State (Live dynamic data - no hardcoded mock scripts)
  const [script, setScript] = useState<GeneratedScript>({
    title: '',
    hook: '',
    quote: '',
    cta: '',
    speechStyle: '',
    visualTheme: 'v1',
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
  const [selectedMusic, setSelectedMusic] = useState('m1');
  const [selectedBackdrop, setSelectedBackdrop] = useState('v1');

  // Audio Playback Engine
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(15);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load Media Library, Channels & Quote Memory from live backend API
  useEffect(() => {
    async function loadData() {
      try {
        consoleLogger.info('Studio', 'Loading live media library, channels, and quote memory...');
        const [channels, media, mem] = await Promise.all([
          workspaceApi.getConnectedChannels(),
          workspaceApi.getMediaLibrary(),
          workspaceApi.getQuoteMemory(),
        ]);

        if (channels && channels.length > 0) {
          setChannelName(channels[0].name || channels[0].handle || 'ApexMind');
        }

        setMusicTracks(media.musicTracks || []);
        setBackdrops(media.visualBackdrops || []);
        setVoices(media.voiceProfiles || []);

        if (media.visualBackdrops && media.visualBackdrops.length > 0) {
          setSelectedBackdrop(media.visualBackdrops[0].id);
        }
        if (media.voiceProfiles && media.voiceProfiles.length > 0) {
          setSelectedVoice(media.voiceProfiles[0].id);
        }
        if (media.musicTracks && media.musicTracks.length > 0) {
          setSelectedMusic(media.musicTracks[0].id);
        }

        setMemoryCount(mem.totalQuotesInMemory || 0);

        // Load the latest real quote from memory if available
        if (mem.memoryStore && mem.memoryStore.length > 0) {
          const latest = mem.memoryStore[0];
          const loadedScript: GeneratedScript = {
            title: latest.title,
            hook: latest.hook,
            quote: latest.quote,
            cta: 'Stay silent. Let your results speak.',
            speechStyle: 'Stoic, deep, grounded, powerful',
            visualTheme: 'v1',
            recommendedVoice: 'Fenrir',
            tags: ['motivation', 'discipline', 'mindset', 'shorts'],
            hashtags: ['#Shorts', '#Motivation', '#Grit'],
            subtitles: [
              { text: latest.hook, start: 0.0, duration: 2.5 },
              { text: latest.quote, start: 2.5, duration: 7.5 },
              { text: 'Stay silent. Let your results speak.', start: 10.0, duration: 3.0 },
            ],
          };
          setScript(loadedScript);
        }
      } catch (err) {
        consoleLogger.error('Studio', 'Failed to load initial workspace data:', err);
      }
    }
    loadData();
  }, []);

  // Update audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Run AI Script Generation
  const handleRunAIAgent = async () => {
    setLoadingAgent(true);
    consoleLogger.info('Studio', `Generating script for category: ${category}`);
    try {
      const generated = await workspaceApi.generateScript({
        category,
        userPrompt: agentPrompt.trim() || undefined,
        model: selectedModel,
      });

      setScript(generated);
      if (generated.recommendedVoice) {
        setSelectedVoice(generated.recommendedVoice);
      }
      if (generated.visualTheme) {
        setSelectedBackdrop(generated.visualTheme);
      }

      const mem = await workspaceApi.getQuoteMemory();
      setMemoryCount(mem.totalQuotesInMemory || 0);

      // Automatically synthesize 24kHz voiceover with updated script
      handleSynthesizeVoice(generated, generated.recommendedVoice || selectedVoice);
    } catch (err) {
      consoleLogger.error('Studio', 'Error generating script:', err);
    } finally {
      setLoadingAgent(false);
    }
  };

  // Synthesize Voiceover via 24kHz Gemini API
  const handleSynthesizeVoice = async (targetScript = script, voiceName = selectedVoice) => {
    setLoadingAudio(true);
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
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      consoleLogger.error('Studio', 'Failed to test voice sample:', err);
    } finally {
      setTestingVoiceId(null);
    }
  };

  // Play / Pause Audio
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!audioUrl) {
        handleSynthesizeVoice();
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleSeek = (newTime: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
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
  const activeBackdropObj = backdrops.find((b) => b.id === selectedBackdrop) || {
    id: 'v1',
    name: 'Dark Mountain Dawn',
    category: 'Nature & Solitude',
    aspectRatio: '9:16',
    previewColor: 'from-amber-600 via-slate-900 to-indigo-950',
    textColor: '#FFFFFF',
    particleEffect: 'glowing-dust',
  };

  const activeMusicObj = musicTracks.find((m) => m.id === selectedMusic);
  const canPublish = Boolean(script.title && script.quote);

  return (
    <div className="w-full h-full flex flex-col min-h-0 font-sans-studio select-none">
      {/* Hidden Audio Element */}
      <audio ref={audioRef} className="hidden" preload="auto" />

      {/* Tri-Pane Director's Studio Layout (Exact 3-Panel Viewport Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 h-full min-h-0 flex-1">
        {/* Left Pane: AI Agent Creator OR Script Editor (col-span-4) */}
        <div className="lg:col-span-4 h-full min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 bg-[#121212] border border-[#2F2F2F] rounded-2xl p-3.5 overflow-y-auto custom-scrollbar shadow-xl">
            {activeLeftPane === 'prompt' ? (
              <AIAgentCreatorPane
                agentPrompt={agentPrompt}
                onPromptChange={setAgentPrompt}
                category={category}
                onCategoryChange={setCategory}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                memoryCount={memoryCount}
                loadingAgent={loadingAgent}
                onRunAgent={async () => {
                  await handleRunAIAgent();
                  setActiveLeftPane('editor');
                }}
                onSwitchToEditor={() => setActiveLeftPane('editor')}
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
                    visualTheme: 'v1',
                    recommendedVoice: selectedVoice || 'Fenrir',
                    tags: [],
                    hashtags: [],
                    subtitles: [],
                  });
                }}
              />
            ) : (
              <ScriptEditorPane
                script={script}
                onUpdateScript={(updated) => setScript((prev) => ({ ...prev, ...updated }))}
                memoryCount={memoryCount}
                onSwitchToAgent={() => setActiveLeftPane('prompt')}
                onStartNewVideo={() => {
                  setAgentPrompt('');
                  setActiveLeftPane('prompt');
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
                    visualTheme: 'v1',
                    recommendedVoice: selectedVoice || 'Fenrir',
                    tags: [],
                    hashtags: [],
                    subtitles: [],
                  });
                }}
              />
            )}
          </div>
        </div>

        {/* Center Pane: Video Preview (col-span-4) */}
        <div className="lg:col-span-4 h-full min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 bg-[#0A0A0A] border border-[#2F2F2F] rounded-2xl flex items-center justify-center overflow-hidden shadow-xl">
            <VideoPreviewPane
              script={script}
              activeBackdrop={activeBackdropObj}
              activeMusic={activeMusicObj}
              selectedVoice={selectedVoice}
              isPlaying={isPlaying}
              onTogglePlay={togglePlay}
              audioUrl={audioUrl}
              loadingAudio={loadingAudio}
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
              channelName={channelName}
            />
          </div>
        </div>

        {/* Right Pane: Studio Controls (col-span-4) */}
        <div className="lg:col-span-4 h-full min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 bg-[#121212] border border-[#2F2F2F] rounded-2xl p-3.5 overflow-y-auto custom-scrollbar shadow-xl">
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
