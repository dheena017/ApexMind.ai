import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Wand2, Volume2, Play, Pause, Youtube, Music, Image as ImageIcon, CheckCircle2, ShieldCheck, Tag, ArrowRight, Sliders, Film } from 'lucide-react';
import { Button, Card, Badge, Input } from '@/src/shared/ui/common';
import { workspaceApi } from '../api/workspaceApi';
import { GeneratedScript, MusicTrack, VisualBackdrop, VoiceProfile } from '../types';
import { consoleLogger } from '@/src/shared/utils/logger';


export default function WorkspacePage({ onNavigate }: { onNavigate: (page: string) => void }) {
  // AI Agent Natural Language Input
  const [agentPrompt, setAgentPrompt] = useState('');
  const [category, setCategory] = useState('Stoic Mindset & Discipline');
  const [loadingAgent, setLoadingAgent] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Generated Script State (Initialized clean; populated dynamically by AI Agent)
  const [script, setScript] = useState<GeneratedScript>({
    title: '',
    hook: '',
    quote: '',
    cta: '',
    speechStyle: '',
    visualTheme: 'Dark Mountain Dawn',
    recommendedVoice: 'Fenrir',
    tags: [],
    hashtags: [],
    subtitles: [],
  });


  // Media Library
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
  const [backdrops, setBackdrops] = useState<VisualBackdrop[]>([]);
  const [voices, setVoices] = useState<VoiceProfile[]>([]);

  // Selections
  const [selectedVoice, setSelectedVoice] = useState('Fenrir');
  const [selectedMusic, setSelectedMusic] = useState('m1');
  const [selectedBackdrop, setSelectedBackdrop] = useState('v1');

  // Audio Playback
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [publishedSuccess, setPublishedSuccess] = useState(false);

  useEffect(() => {
    async function loadMedia() {
      try {
        consoleLogger.info('Studio', 'Loading non-copyright media catalog assets...');
        const media = await workspaceApi.getMediaLibrary();
        setMusicTracks(media.musicTracks);
        setBackdrops(media.visualBackdrops);
        setVoices(media.voiceProfiles);
        consoleLogger.success('Studio', `Media catalog active (${media.musicTracks.length} audio tracks, ${media.visualBackdrops.length} visual backdrops, ${media.voiceProfiles.length} voice profiles)`);
      } catch (e) {
        consoleLogger.error('Studio', 'Failed to load media presets:', e);
      }
    }
    loadMedia();
  }, []);

  // Run Full AI Agent Command (Creates Script, Selects Voice & Effects)
  const handleRunAIAgent = async () => {
    setLoadingAgent(true);
    consoleLogger.info('Studio', `🚀 Starting AI Agent run | Category: "${category}" | Prompt: "${agentPrompt || 'Default topic'}"`);
    try {
      const result = await workspaceApi.generateScript({
        category,
        topic: agentPrompt,
        tone: 'Authoritative & Inspiring',
      });
      setScript(result);
      if (result.recommendedVoice) setSelectedVoice(result.recommendedVoice);
      consoleLogger.success('Studio', `✨ AI Agent finished scriptwriting: "${result.title}"`, result);
    } catch (e) {
      consoleLogger.error('Studio', 'AI Agent script generation failed:', e);
    } finally {
      setLoadingAgent(false);
    }
  };

  // Synthesize Audio Voiceover via Gemini TTS
  const handleSynthesizeVoice = async () => {
    setLoadingAudio(true);
    consoleLogger.info('Studio', `🎙️ Requesting Gemini TTS synthesis for voice "${selectedVoice}"...`);
    try {
      const fullSpeechText = `${script.hook} ${script.quote} ${script.cta}`;
      const audioRes = await workspaceApi.generateVoiceover(fullSpeechText, selectedVoice);
      const url = `data:${audioRes.mimeType};base64,${audioRes.audioBase64}`;
      setAudioUrl(url);

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setIsPlaying(true);
      }
      consoleLogger.success('Studio', `🔊 Audio synthesized & playback initialized (${selectedVoice})`);
    } catch (e: any) {
      consoleLogger.error('Studio', 'Voiceover synthesis failed:', e);
    } finally {
      setLoadingAudio(false);
    }
  };

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

  // Upload & Publish to YouTube Shorts
  const handlePublish = async () => {
    setPublishing(true);
    consoleLogger.info('YouTube', `📤 Uploading Short to YouTube: "${script.title}" [Voice: ${selectedVoice}, Theme: ${selectedBackdrop}]...`);
    try {
      await workspaceApi.publishVideo({
        title: script.title,
        quote: script.quote,
        voice: selectedVoice,
        visualTheme: selectedBackdrop,
        category,
      });
      setPublishedSuccess(true);
      consoleLogger.success('YouTube', `🎉 Short published successfully: "${script.title}"`);
      setTimeout(() => {
        onNavigate('youtube');
      }, 1500);
    } catch (e) {
      consoleLogger.error('YouTube', 'Publishing Short failed:', e);
    } finally {
      setPublishing(false);
    }
  };


  const activeBackdropObj = backdrops.find((b) => b.id === selectedBackdrop) || backdrops[0];

  return (
    <div className="flex-1 w-full min-h-screen bg-[#0A0A0A] text-[#E5E5E5] p-6 lg:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#2F2F2F]">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-[#3B82F6] to-[#2563EB] text-white shadow-lg shadow-[#3B82F6]/25">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">ApexMind AI Agent Studio</h1>
            <p className="text-xs text-[#9CA3AF] mt-0.5">Enter what video you need: AI generates Script, Audio Voiceover, Visual Effects, & YouTube Upload</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => onNavigate('dashboard')}>
            Dashboard
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={publishing || !script.title || !script.quote}
            icon={<Youtube className="w-4 h-4 text-red-400" />}
            onClick={handlePublish}
          >
            {publishing ? 'Uploading to Shorts...' : 'Upload to YouTube'}
          </Button>

        </div>
      </div>

      {publishedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-semibold flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Success! Video rendered & published to YouTube Shorts catalog.</span>
          </div>
        </div>
      )}

      {/* Primary AI Agent Prompt Input Bar */}
      <Card className="bg-gradient-to-r from-[#1E1E1E] via-[#2A2A2A] to-[#1E1E1E] border-[#3B82F6]/40 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#60A5FA] flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-[#3B82F6]" />
            AI Studio Command Box
          </span>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Quote Memory Active (0% Repetition)
            </span>
            <Badge variant="blue">Gemini 3.8 Flash Powered</Badge>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-semibold text-[#9CA3AF]">What kind of motivational YouTube short do you want to create?</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={agentPrompt}
              onChange={(e) => setAgentPrompt(e.target.value)}
              className="flex-1 bg-[#121212] border border-[#2F2F2F] text-sm text-[#E5E5E5] rounded-xl px-4 py-3 outline-none focus:border-[#3B82F6]"
              placeholder="E.g., Create a 30s short on overcoming laziness with Fenrir voice and deep ambient music..."
            />
            <Button
              variant="primary"
              disabled={loadingAgent}
              icon={<Wand2 className={`w-4 h-4 ${loadingAgent ? 'animate-spin' : ''}`} />}
              onClick={handleRunAIAgent}
              className="py-3 px-6"
            >
              {loadingAgent ? 'AI Agent Creating...' : 'Run AI Agent'}
            </Button>
          </div>
        </div>

        {/* Preset Category Quick Selection */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[#6B7280]">Quick Topics:</span>
          {['Stoic Mindset & Discipline', 'Morning Energy & Grit', 'Fitness & Power', 'Financial Freedom'].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat);
                setAgentPrompt(`Create a powerful short focused on ${cat}`);
              }}
              className={`px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                category === cat ? 'bg-[#3B82F6]/20 border-[#3B82F6] text-[#60A5FA] font-bold' : 'bg-[#121212] border-[#2F2F2F] text-[#9CA3AF]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </Card>

      {/* Workspace Controls & Preview Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Script Review */}
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-[#2F2F2F] mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#60A5FA] flex items-center gap-2">
                <Tag className="w-4 h-4" />
                1. AI Script & Auto-Synced Captions
              </span>
              <Badge variant="blue">Auto-Generated</Badge>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#9CA3AF] uppercase font-semibold">YouTube Short Title</label>
                <input
                  value={script.title}
                  onChange={(e) => setScript({ ...script, title: e.target.value })}
                  className="w-full bg-[#121212] border border-[#2F2F2F] text-sm text-white font-bold rounded-xl p-3 mt-1 outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#121212] border border-[#2F2F2F] space-y-1">
                  <span className="text-[11px] font-bold text-[#60A5FA] uppercase">Viral Opening Hook</span>
                  <p className="text-xs text-[#E5E5E5] font-medium">{script.hook}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#121212] border border-[#2F2F2F] space-y-1">
                  <span className="text-[11px] font-bold text-[#60A5FA] uppercase">Call To Action</span>
                  <p className="text-xs text-[#E5E5E5] font-medium">{script.cta}</p>
                </div>
              </div>

              <div>
                <label className="text-xs text-[#9CA3AF] uppercase font-semibold">Core Monologue</label>
                <textarea
                  value={script.quote}
                  onChange={(e) => setScript({ ...script, quote: e.target.value })}
                  rows={3}
                  className="w-full bg-[#121212] border border-[#2F2F2F] text-xs text-[#E5E5E5] rounded-xl p-3 mt-1 outline-none focus:border-[#3B82F6] leading-relaxed"
                />
              </div>
            </div>
          </Card>

          {/* Voice Synthesis */}
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-[#2F2F2F] mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                2. AI Voiceover Synthesis (Gemini TTS)
              </span>
              <Badge variant="blue">gemini-3.8-flash-lite-tts</Badge>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Select Voice Persona</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {voices.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVoice(v.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedVoice === v.id
                          ? 'bg-[#3B82F6]/10 border-[#3B82F6] text-[#60A5FA]'
                          : 'bg-[#121212] border-[#2F2F2F] text-[#9CA3AF] hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-xs text-white">{v.name}</div>
                      <div className="text-[10px] text-[#9CA3AF] mt-0.5 line-clamp-1">{v.style}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button
                  variant="primary"
                  className="w-full sm:w-auto"
                  disabled={loadingAudio}
                  icon={<Volume2 className={`w-4 h-4 ${loadingAudio ? 'animate-spin' : ''}`} />}
                  onClick={handleSynthesizeVoice}
                >
                  {loadingAudio ? 'Synthesizing Audio...' : 'Synthesize Voiceover'}
                </Button>

                {audioUrl && (
                  <div className="flex items-center gap-3 p-2 bg-[#121212] border border-[#2F2F2F] rounded-xl w-full sm:w-auto justify-center">
                    <button
                      onClick={togglePlay}
                      className="p-2 rounded-lg bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <span className="text-xs font-mono-studio text-[#60A5FA]">
                      {isPlaying ? 'Playing WAV Voiceover...' : 'Audio Ready'}
                    </span>
                  </div>
                )}
              </div>

              <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />
            </div>
          </Card>

          {/* Music & Visual Effects */}
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-[#2F2F2F] mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Film className="w-4 h-4" />
                3. Audio Tracks & Background Visual Effects
              </span>
              <Badge variant="green">Non-Copyright Safe</Badge>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Music Track</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {musicTracks.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMusic(m.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedMusic === m.id
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                          : 'bg-[#121212] border-[#2F2F2F] text-[#9CA3AF] hover:text-white'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white">{m.title}</span>
                        <span className="text-[10px] text-[#6B7280]">{m.duration}</span>
                      </div>
                      <div className="text-[10px] text-[#9CA3AF] mt-1">{m.genre} · {m.bpm} BPM</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Visual Theme & Particle Effects</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {backdrops.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBackdrop(b.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedBackdrop === b.id
                          ? 'bg-[#3B82F6]/10 border-[#3B82F6] text-[#60A5FA]'
                          : 'bg-[#121212] border-[#2F2F2F] text-[#9CA3AF] hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-xs text-white">{b.name}</div>
                      <div className="text-[10px] text-[#9CA3AF] mt-0.5">{b.category}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column Canvas Preview */}
        <div className="lg:col-span-5 sticky top-8 space-y-6">
          <Card className="p-6 bg-[#1E1E1E] border-[#2F2F2F]">
            <div className="flex items-center justify-between pb-3 border-b border-[#2F2F2F] mb-4">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#3B82F6]" />
                Live 9:16 Canvas & Subtitle Player
              </span>
              <span className="text-xs font-mono-studio text-[#9CA3AF]">YouTube Short (1080x1920)</span>
            </div>

            {/* Vertical Video Canvas */}
            <div
              className={`relative aspect-[9/16] w-full max-w-[320px] mx-auto rounded-2xl bg-gradient-to-br ${
                activeBackdropObj?.previewColor || 'from-[#0A0A0A] to-[#1E1E1E]'
              } p-6 flex flex-col justify-between border-2 border-[#3B82F6]/40 shadow-2xl overflow-hidden transition-all duration-300`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0,transparent_100%)] pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-mono-studio font-bold text-[#60A5FA] border border-white/10">
                  APEXMIND AI
                </span>
                <span className="text-[10px] font-mono-studio text-[#9CA3AF]">00:28</span>
              </div>

              <div className="relative z-10 text-center space-y-4 py-8">
                <div className="text-[10px] uppercase font-mono-studio font-bold tracking-widest text-[#60A5FA] drop-shadow">
                  {category}
                </div>

                <div
                  className="text-xl font-extrabold leading-snug drop-shadow-lg tracking-tight"
                  style={{ color: activeBackdropObj?.textColor || '#FFFFFF' }}
                >
                  {script.hook ? `"${script.hook}"` : 'Your Viral Hook Will Appear Here'}
                </div>

                <p className="text-xs font-medium text-gray-200/90 leading-relaxed px-2">
                  {script.quote || 'Enter your topic or prompt above and run the AI Agent to generate your script and voiceover.'}
                </p>

                <div className="pt-2">
                  <span className="px-3 py-1 rounded-lg bg-[#3B82F6]/90 backdrop-blur text-white text-[11px] font-bold shadow-lg">
                    {script.cta || 'Call To Action'}
                  </span>
                </div>

              </div>

              <div className="relative z-10 flex items-center justify-between pt-3 border-t border-white/15 text-[11px] text-gray-300">
                <div className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-[#60A5FA] animate-pulse" />
                  <span className="font-mono-studio text-gray-200">{selectedVoice} Voice</span>
                </div>
                <span className="text-emerald-400 font-semibold text-[10px]">Ready to Upload</span>
              </div>
            </div>

            <div className="space-y-3 mt-6 pt-4 border-t border-[#2F2F2F]">
              <Button
                variant="primary"
                className="w-full py-3"
                disabled={publishing}
                icon={<Youtube className="w-5 h-5 text-red-500" />}
                onClick={handlePublish}
              >
                {publishing ? 'Publishing to YouTube Shorts...' : 'One-Click Upload to YouTube'}
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-[#9CA3AF]">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified non-copyright audio, photo & video assets.</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
