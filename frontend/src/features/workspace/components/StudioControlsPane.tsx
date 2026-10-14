import React, { useState, useEffect } from 'react';
import {
  Film,
  Type,
  Mic,
  Music,
  Layers,
  ShieldCheck,
  ChevronDown,
  Home,
  Image as ImageIcon,
} from 'lucide-react';
import { VoiceProfile, VisualBackdrop, MusicTrack, GeneratedScript } from '../types';
import {
  VideoCompoundInspector,
  TextCompoundInspector,
  AudioCompoundInspector,
  OverlayCompoundInspector,
  HomeCompoundInspector,
} from './inspectors';

export type CompoundType = 'home' | 'project' | 'video' | 'text' | 'voice' | 'music' | 'overlay';

export interface StudioControlsPaneProps {
  voices: VoiceProfile[];
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  onTestVoice: (voiceId: string) => void;
  testingVoiceId: string | null;

  backdrops: VisualBackdrop[];
  selectedBackdrop: string;
  onSelectBackdrop: (backdropId: string) => void;

  musicTracks: MusicTrack[];
  selectedMusic: string;
  onSelectMusic: (musicId: string) => void;

  onPublish: () => void;
  publishing: boolean;
  canPublish: boolean;
  publishedSuccess: boolean;

  script?: GeneratedScript;
  onUpdateScript?: (updated: Partial<GeneratedScript>) => void;
  duration?: number;
  currentTime?: number;
  playbackRate?: number;
  onPlaybackRateChange?: (rate: number) => void;
  volume?: number;
  onVolumeChange?: (volume: number) => void;
  category?: string;
  customImageUrl?: string;
  customVideoUrl?: string;
  activeElementOverlay?: { id?: string; name?: string; type: string; value: string; label?: string } | null;
  onSetCustomImage?: (url: string | undefined) => void;
  onSetCustomVideo?: (url: string | undefined) => void;
  canvasBackground?: string;
  onCanvasBackgroundChange?: (bg: string) => void;
  activeCompound?: CompoundType;
  onSelectCompound?: (compound: CompoundType) => void;
}

export const StudioControlsPane: React.FC<StudioControlsPaneProps> = ({
  voices,
  selectedVoice,
  onSelectVoice,
  onTestVoice,
  testingVoiceId,
  backdrops,
  selectedBackdrop,
  onSelectBackdrop,
  musicTracks,
  selectedMusic,
  onSelectMusic,
  onPublish,
  publishing,
  canPublish,
  publishedSuccess,
  script,
  onUpdateScript,
  duration = 12.1,
  playbackRate = 1,
  onPlaybackRateChange,
  volume = 1,
  onVolumeChange,
  category,
  customImageUrl,
  customVideoUrl,
  activeElementOverlay,
  onSetCustomImage,
  onSetCustomVideo,
  canvasBackground,
  onCanvasBackgroundChange,
  activeCompound: propCompound,
  onSelectCompound,
}) => {
  // Current active compound page (defaults to home, reacts to timeline / canvas clicks)
  const [activeCompound, setActiveCompound] = useState<CompoundType>(propCompound || 'home');
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  // Sync prop changes
  useEffect(() => {
    if (propCompound) {
      setActiveCompound(propCompound);
    }
  }, [propCompound]);

  // Listen to global compound selection events
  useEffect(() => {
    const handleCompoundSelect = (e: Event) => {
      const custom = e as CustomEvent<CompoundType>;
      if (custom.detail) {
        setActiveCompound(custom.detail);
        onSelectCompound?.(custom.detail);
      }
    };
    window.addEventListener('workspace:select-compound', handleCompoundSelect);
    return () => window.removeEventListener('workspace:select-compound', handleCompoundSelect);
  }, [onSelectCompound]);

  const activeBackdropObj =
    backdrops.find((b) => b.id === selectedBackdrop) ||
    {
      id: '',
      name: 'No Backdrop Selected',
      category: '',
      aspectRatio: '9:16',
      previewColor: '',
      textColor: '#FFFFFF',
      particleEffect: '',
    };

  const compoundMetadata = {
    home: { label: 'Home (Project Studio)', icon: Home, color: 'text-sky-400' },
    project: { label: 'Home (Project Studio)', icon: Home, color: 'text-sky-400' },
    video: {
      label: customImageUrl ? 'Image Inspector (V1)' : 'Video Backdrop (V1)',
      icon: customImageUrl ? ImageIcon : Film,
      color: 'text-amber-400',
    },
    text: { label: 'Captions & Title (T1)', icon: Type, color: 'text-blue-400' },
    voice: { label: `Voice: ${selectedVoice || 'Fenrir'} (A1)`, icon: Mic, color: 'text-emerald-400' },
    music: { label: 'Soundtrack Mix (A2)', icon: Music, color: 'text-purple-400' },
    overlay: { label: 'Overlay Sticker / Badge', icon: Layers, color: 'text-indigo-400' },
  }[activeCompound] || { label: 'Home (Project Studio)', icon: Home, color: 'text-sky-400' };

  const CurrentIcon = compoundMetadata.icon;

  const handleSwitchCompound = (type: CompoundType) => {
    setActiveCompound(type);
    onSelectCompound?.(type);
    setIsSwitcherOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none overflow-hidden rounded-2xl">
      {/* ── Top Bar: Active Compound Indicator, Home Button & Switcher Dropdown ── */}
      <div className="relative px-3 py-2 bg-[#17171A] border-b border-[#26262B] flex items-center justify-between z-20">
        <div className="flex items-center gap-2 min-w-0">
          <CurrentIcon className={`w-4 h-4 shrink-0 ${compoundMetadata.color}`} />
          <span className="text-xs font-bold text-white truncate">
            {compoundMetadata.label}
          </span>
        </div>

        {/* Right Actions: Home Button & Compound Switcher */}
        <div className="flex items-center gap-1.5">
          {/* Home Button */}
          <button
            type="button"
            onClick={() => handleSwitchCompound('home')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer border ${
              activeCompound === 'home' || activeCompound === 'project'
                ? 'bg-[#3B82F6] text-white border-transparent shadow'
                : 'bg-[#222228] hover:bg-[#2C2C34] text-[#D4D4D8] hover:text-white border-[#32323C]'
            }`}
            title="Go to Project Home Studio"
          >
            <Home className="w-3.5 h-3.5 text-sky-400" />
            <span>Home</span>
          </button>

          {/* Compound Switcher Dropdown Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#222228] hover:bg-[#2C2C34] text-[10px] text-[#A1A1AA] hover:text-white transition-colors cursor-pointer border border-[#32323C]"
              title="Switch inspector compound"
            >
              <span>Switch</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isSwitcherOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Switcher Menu Popup */}
            {isSwitcherOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-[#18181C] border border-[#2E2E36] rounded-xl shadow-2xl p-1 z-50 flex flex-col gap-0.5 animate-scale-up">
                {[
                  { id: 'home' as CompoundType, label: 'Home (Project Studio)', icon: Home },
                  { id: 'video' as CompoundType, label: customImageUrl ? 'Image Inspector (V1)' : 'Video Backdrop (V1)', icon: customImageUrl ? ImageIcon : Film },
                  { id: 'text' as CompoundType, label: 'Captions & Title (T1)', icon: Type },
                  { id: 'voice' as CompoundType, label: 'Voiceover Audio (A1)', icon: Mic },
                  { id: 'music' as CompoundType, label: 'Soundtrack Audio (A2)', icon: Music },
                  { id: 'overlay' as CompoundType, label: 'Overlays & Badges', icon: Layers },
                ].map((c) => {
                  const Icon = c.icon;
                  const isCurrent = activeCompound === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSwitchCompound(c.id)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                        isCurrent
                          ? 'bg-[#3B82F6]/20 text-white font-medium'
                          : 'text-[#9CA3AF] hover:text-white hover:bg-[#222228]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="truncate">{c.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Separate Compound Inspector Page ── */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {(activeCompound === 'home' || activeCompound === 'project') && (
          <HomeCompoundInspector
            onPublish={onPublish}
            publishing={publishing}
            canPublish={canPublish}
            publishedSuccess={publishedSuccess}
            script={script}
            duration={duration}
            category={category}
            onSelectCompound={handleSwitchCompound}
          />
        )}

        {activeCompound === 'video' && (
          <VideoCompoundInspector
            activeBackdrop={activeBackdropObj}
            backdrops={backdrops}
            onSelectBackdrop={onSelectBackdrop}
            duration={duration}
            playbackRate={playbackRate}
            onPlaybackRateChange={onPlaybackRateChange}
            customImageUrl={customImageUrl}
            customVideoUrl={customVideoUrl}
            onSetCustomImage={onSetCustomImage}
            onSetCustomVideo={onSetCustomVideo}
            canvasBackground={canvasBackground}
            onCanvasBackgroundChange={onCanvasBackgroundChange}
          />
        )}

        {activeCompound === 'text' && (
          <TextCompoundInspector
            script={script}
            onUpdateScript={onUpdateScript}
          />
        )}

        {activeCompound === 'overlay' && (
          <OverlayCompoundInspector
            activeOverlay={activeElementOverlay}
          />
        )}

        {(activeCompound === 'voice' || activeCompound === 'music') && (
          <AudioCompoundInspector
            audioType={activeCompound}
            voices={voices}
            selectedVoice={selectedVoice}
            onSelectVoice={onSelectVoice}
            onTestVoice={onTestVoice}
            testingVoiceId={testingVoiceId}
            musicTracks={musicTracks}
            selectedMusic={selectedMusic}
            onSelectMusic={onSelectMusic}
            volume={volume}
            onVolumeChange={onVolumeChange}
            playbackRate={playbackRate}
            onPlaybackRateChange={onPlaybackRateChange}
            duration={duration}
          />
        )}
      </div>
    </div>
  );
};

export default StudioControlsPane;
