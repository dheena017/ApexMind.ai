import React, { useState, useEffect, useRef } from 'react';
import { workspaceApi } from '../api/workspaceApi';
import { GeneratedScript, MusicTrack, VisualBackdrop, VoiceProfile } from '../types';
import { consoleLogger } from '@/src/shared/utils/logger';
import { ScriptEditorPane } from '../components/ScriptEditorPane';
import { VideoPreviewPane } from '../components/VideoPreviewPane';
import { StudioControlsPane } from '../components/StudioControlsPane';

export default function WorkspacePage({ onNavigate }: { onNavigate: (page: string) => void }) {
  // AI Script Generation
  const [agentPrompt, setAgentPrompt] = useState('');
  const [category, setCategory] = useState('Stoic Mindset & Discipline');
  const [loadingAgent, setLoadingAgent] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [testingVoiceId, setTestingVoiceId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);
  const [memoryCount, setMemoryCount] = useState(0);

  // Script State (Live dynamic data)
  const [script, setScript] = useState<GeneratedScript>({
    title: 'MASTER YOUR DAY',
    hook: 'Top 5 Habit Hacks!',
    quote:
      'True power is never loud. It compounds in silence while nobody is watching, through early mornings and relentless consistency.',
    cta: 'Stay silent. Let the results make the noise.',
    speechStyle: 'Stoic, deep, grounded, powerful',
    visualTheme: 'v1',
    recommendedVoice: 'Fenrir',
    tags: ['stoic', 'mindset', 'discipline', 'shorts'],
    hashtags: ['#Shorts', '#Motivation', '#Grit'],
    subtitles: [
      { text: 'Top 5 Habit Hacks!', start: 0.0, duration: 2.8 },
      { text: 'True power is never loud.', start: 2.8, duration: 2.0 },
      { text: 'It compounds in silence while nobody is watching.', start: 4.8, duration: 3.5 },
      { text: 'Through early mornings and relentless consistency.', start: 8.3, duration: 3.2 },
      { text: 'Stay silent. Let the results make the noise.', start: 11.5, duration: 3.0 },
    ],
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

  // Load Media Library & Quote Memory from live backend API
  useEffect(() => {
    async function loadData() {
      try {
        consoleLogger.info('Studio', 'Loading live media library and quote memory...');
        const media = await workspaceApi.getMediaLibrary();
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

        const mem = await workspaceApi.getQuoteMemory();
        setMemoryCount(mem.totalQuotesInMemory || 0);
      } catch (err) {
        consoleLogger.error('Studio', 'Failed to load initial media library data:', err);
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
        {/* Left Pane: Script Editor (col-span-4) */}
        <div className="lg:col-span-4 h-full min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 bg-[#121212] border border-[#2F2F2F] rounded-2xl p-3.5 overflow-y-auto custom-scrollbar shadow-xl">
            <ScriptEditorPane
              script={script}
              onUpdateScript={(updated) => setScript((prev) => ({ ...prev, ...updated }))}
              agentPrompt={agentPrompt}
              onPromptChange={setAgentPrompt}
              category={category}
              onCategoryChange={setCategory}
              memoryCount={memoryCount}
              loadingAgent={loadingAgent}
              onRunAgent={handleRunAIAgent}
            />
          </div>
        </div>

        {/* Center Pane: Video Preview (col-span-4) */}
        <div className="lg:col-span-4 h-full min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 bg-[#121212] border border-[#2F2F2F] rounded-2xl p-2.5 flex items-center justify-center overflow-hidden shadow-xl">
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
