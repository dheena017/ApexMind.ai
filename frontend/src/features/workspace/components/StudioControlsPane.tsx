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
  Sparkles,
} from 'lucide-react';
import { VoiceProfile, VisualBackdrop, MusicTrack, GeneratedScript, ScriptSubtitle, DEFAULT_VISUAL_BACKDROPS } from '../types';
import { VideoInspectorTab } from './inspectors';
import { SelectedClip } from './timeline/timelineTypes';
import {
  VideoCompoundInspector,
  TextCompoundInspector,
  AudioCompoundInspector,
  OverlayCompoundInspector,
  HomeCompoundInspector,
  TransitionsInspector,
} from './inspectors';

export type CompoundType = 'home' | 'project' | 'video' | 'text' | 'voice' | 'music' | 'overlay' | 'transitions';

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
  timelineDuration?: number;
  onDurationChange?: (duration: number) => void;
  currentTime?: number;
  playbackRate?: number;
  onPlaybackRateChange?: (rate: number) => void;
  volume?: number;
  onVolumeChange?: (volume: number) => void;
  musicVolume?: number;
  onMusicVolumeChange?: (volume: number) => void;
  category?: string;
  customImageUrl?: string;
  customVideoUrl?: string;
  activeElementOverlay?: { id?: string; name?: string; type: string; value: string; label?: string } | null;
  onSetCustomImage?: (url: string | undefined) => void;
  onSetCustomVideo?: (url: string | undefined) => void;
  canvasBackground?: string;
  onCanvasBackgroundChange?: (bg: string) => void;
  canvasAspectRatio?: '9:16' | '16:9' | '1:1' | '4:5' | '21:9';
  onCanvasAspectRatioChange?: (ratio: '9:16' | '16:9' | '1:1' | '4:5' | '21:9') => void;
  activeCompound?: CompoundType;
  onSelectCompound?: (compound: CompoundType) => void;
  selectedClip?: SelectedClip | null;
  onSelectClip?: (clip: SelectedClip | null) => void;
  onUpdateSubtitles?: (subtitles: ScriptSubtitle[]) => void;
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
  duration,
  timelineDuration,
  onDurationChange,
  playbackRate = 1,
  onPlaybackRateChange,
  volume = 1,
  onVolumeChange,
  musicVolume,
  onMusicVolumeChange,
  category,
  customImageUrl,
  customVideoUrl,
  activeElementOverlay,
  onSetCustomImage,
  onSetCustomVideo,
  canvasBackground,
  onCanvasBackgroundChange,
  canvasAspectRatio = '9:16',
  onCanvasAspectRatioChange,
  activeCompound: propCompound,
  onSelectCompound,
  selectedClip: propSelectedClip,
  onSelectClip,
  onUpdateSubtitles,
}) => {
  const [activeClipDetails, setActiveClipDetails] = useState<{ start: number; duration: number; name: string } | null>(null);

  useEffect(() => {
    const handleClipDetails = (e: Event) => {
      const detail = (e as CustomEvent<{ selectedClip: SelectedClip | null; details: { start: number; duration: number; name: string } | null }>).detail;
      if (detail) {
        setActiveClipDetails(detail.details);
      }
    };
    window.addEventListener('workspace:selected-clip-details', handleClipDetails);
    return () => window.removeEventListener('workspace:selected-clip-details', handleClipDetails);
  }, []);
  const [localSelectedClip, setLocalSelectedClip] = useState<SelectedClip | null>(propSelectedClip || null);

  useEffect(() => {
    if (propSelectedClip !== undefined) {
      setLocalSelectedClip(propSelectedClip);
    }
  }, [propSelectedClip]);
  const effectiveDuration = duration || timelineDuration || 15;
  const readinessDuration = duration && duration > 0 ? duration : timelineDuration ?? 0;
  const effectiveCategory = category || (script?.tags?.[0]) || 'General';
  // Current active compound page (defaults to home, reacts to timeline / canvas clicks)
  const [activeCompound, setActiveCompound] = useState<CompoundType>(propCompound || 'home');
  const [videoInspectorTab, setVideoInspectorTab] = useState<VideoInspectorTab>('transform');
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  // Sync prop changes
  useEffect(() => {
    if (propCompound) {
      setActiveCompound(propCompound);
    }
  }, [propCompound]);


  // Listen to open-inspector-tab events from timeline buttons/zones
  useEffect(() => {
    const handleOpenTab = (e: Event) => {
      const detail = (e as CustomEvent<{ compound?: CompoundType; subTab?: VideoInspectorTab; clipId?: string }>).detail;
      if (!detail) return;
      if (detail.compound) {
        setActiveCompound(detail.compound);
        onSelectCompound?.(detail.compound);
      }
      if (detail.subTab) {
        setVideoInspectorTab(detail.subTab);
      }
      if (detail.clipId) {
        setLocalSelectedClip({ track: detail.compound === 'video' ? 'video' : 'video', clipId: detail.clipId, all: false });
      }
    };
    window.addEventListener('workspace:open-inspector-tab', handleOpenTab);
    return () => window.removeEventListener('workspace:open-inspector-tab', handleOpenTab);
  }, [onSelectCompound]);

  // Listen to global compound selection events
  useEffect(() => {
    const handleCompoundSelect = (e: Event) => {
      const detail = (e as CustomEvent<
        CompoundType | { compound: CompoundType; openInspector?: boolean; selectedClip?: SelectedClip }
      >).detail;
      const compound = typeof detail === 'string' ? detail : detail?.compound;
      if (!compound) return;
      setActiveCompound(compound);
      onSelectCompound?.(compound);
      if (typeof detail !== 'string' && detail?.selectedClip !== undefined) {
        setLocalSelectedClip(detail.selectedClip);
      }
    };
    window.addEventListener('workspace:select-compound', handleCompoundSelect);
    return () => window.removeEventListener('workspace:select-compound', handleCompoundSelect);
  }, [onSelectCompound]);

  const availableBackdrops = (backdrops && backdrops.length > 0) ? backdrops : DEFAULT_VISUAL_BACKDROPS;

  const activeBackdropObj =
    availableBackdrops.find((b) => b.id === selectedBackdrop) ||
    availableBackdrops[0] ||
    {
      id: 'v1',
      name: 'Dark Mountain Dawn',
      category: 'Nature & Solitude',
      aspectRatio: '9:16',
      previewColor: 'from-slate-900 via-indigo-950 to-purple-950',
      textColor: '#FFFFFF',
      particleEffect: 'glowing-dust',
    };

  const compoundMetadata = {
    home: { label: 'Home (Project Studio)', icon: Home, color: 'text-sky-400' },
    project: { label: 'Home (Project Studio)', icon: Home, color: 'text-sky-400' },
    video: {
      label: customImageUrl ? 'Image Inspector (V2)' : 'Video Backdrop (V1)',
      icon: customImageUrl ? ImageIcon : Film,
      color: 'text-amber-400',
    },
    text: { label: 'Captions & Title (T1)', icon: Type, color: 'text-blue-400' },
    voice: { label: `Voice: ${selectedVoice || 'Fenrir'} (A1)`, icon: Mic, color: 'text-emerald-400' },
    music: { label: 'Soundtrack Mix (A2)', icon: Music, color: 'text-purple-400' },
    overlay: { label: 'Overlay Sticker / Badge', icon: Layers, color: 'text-indigo-400' },
    transitions: { label: 'Transitions Studio', icon: Sparkles, color: 'text-amber-400' },
  }[activeCompound] || { label: 'Home (Project Studio)', icon: Home, color: 'text-sky-400' };

  const isAllClipsMode = Boolean(
    !localSelectedClip ||
    localSelectedClip.all ||
    (!('clipId' in localSelectedClip && localSelectedClip.clipId) && !('index' in localSelectedClip && typeof localSelectedClip.index === 'number'))
  );

  const CurrentIcon = compoundMetadata.icon;

  const handleSwitchCompound = (type: CompoundType, videoTab?: VideoInspectorTab) => {
    setActiveCompound(type);
    if (type === 'video') setVideoInspectorTab(videoTab || 'transform');
    onSelectCompound?.(type);
    setIsSwitcherOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none overflow-hidden rounded-2xl border border-[#26262B]">
      {/* ── Top Bar: Active Compound Indicator, Home Button & Switcher Dropdown ── */}
      <div className="relative h-11 px-3.5 bg-[#17171A] border-b border-[#26262B] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <CurrentIcon className={`w-4 h-4 shrink-0 ${compoundMetadata.color}`} />
          <span className="text-xs font-bold text-white truncate">
            {compoundMetadata.label}
          </span>
        </div>

        {/* Right Actions: Home Button & Compound Switcher */}
        <div className="flex items-center gap-1.5 shrink-0">
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
                  { id: 'video' as CompoundType, label: customImageUrl ? 'Image Inspector (V2)' : 'Video Backdrop (V1)', icon: customImageUrl ? ImageIcon : Film },
                  { id: 'text' as CompoundType, label: 'Captions & Title (T1)', icon: Type },
                  { id: 'voice' as CompoundType, label: 'Voiceover Audio (A1)', icon: Mic },
                  { id: 'music' as CompoundType, label: 'Soundtrack Audio (A2)', icon: Music },
                  { id: 'overlay' as CompoundType, label: 'Overlays & Badges', icon: Layers },
                  { id: 'transitions' as CompoundType, label: 'Transitions Studio', icon: Sparkles },
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
            duration={readinessDuration}
            category={effectiveCategory}
            canvasAspectRatio={canvasAspectRatio}
            onCanvasAspectRatioChange={onCanvasAspectRatioChange}
            onUpdateScript={onUpdateScript}
            onSelectCompound={handleSwitchCompound}
          />
        )}

        {activeCompound === 'video' && (
          <VideoCompoundInspector
            activeBackdrop={activeBackdropObj}
            backdrops={availableBackdrops}
            onSelectBackdrop={onSelectBackdrop}
            duration={!isAllClipsMode && activeClipDetails?.duration ? activeClipDetails.duration : (timelineDuration ?? effectiveDuration)}
            onUpdateDuration={onDurationChange}
            selectedClip={localSelectedClip}
            playbackRate={playbackRate}
            onPlaybackRateChange={onPlaybackRateChange}
            customImageUrl={customImageUrl}
            customVideoUrl={customVideoUrl}
            onSetCustomImage={onSetCustomImage}
            onSetCustomVideo={onSetCustomVideo}
            canvasBackground={canvasBackground}
            onCanvasBackgroundChange={onCanvasBackgroundChange}
            canvasAspectRatio={canvasAspectRatio}
            onCanvasAspectRatioChange={onCanvasAspectRatioChange}
            initialSubTab={videoInspectorTab}
          />
        )}

        {activeCompound === 'text' && (
          <TextCompoundInspector
            script={script}
            onUpdateScript={onUpdateScript}
            selectedClip={localSelectedClip}
            onUpdateSubtitles={onUpdateSubtitles}
          />
        )}

        {activeCompound === 'overlay' && (
          <OverlayCompoundInspector
            activeOverlay={activeElementOverlay}
          />
        )}

        {activeCompound === 'transitions' && (
          <TransitionsInspector
            selectedClip={localSelectedClip}
            customImageUrl={customImageUrl}
            customVideoUrl={customVideoUrl}
            activeBackdrop={activeBackdropObj}
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
            volume={activeCompound === 'music' ? musicVolume ?? volume : volume}
            onVolumeChange={activeCompound === 'music' ? onMusicVolumeChange || onVolumeChange : onVolumeChange}
            playbackRate={playbackRate}
            onPlaybackRateChange={onPlaybackRateChange}
            duration={effectiveDuration}
          />
        )}
      </div>
    </div>
  );
};

export default StudioControlsPane;
