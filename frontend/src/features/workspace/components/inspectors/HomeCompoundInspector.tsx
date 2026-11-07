import { CustomSelect } from '@/src/shared/ui/CustomSelect';
import { ScrollableTabs } from '@/src/shared/ui/ScrollableTabs';
import React, { useEffect, useState } from 'react';
import {
  Film,
  Type,
  Mic,
  Layers,
  Sparkles,
  Youtube,
  ChevronRight,
  Download,
  Upload,
  LoaderCircle,
} from 'lucide-react';
import { GeneratedScript, VideoExportSettings } from '../../types';

export interface HomeCompoundInspectorProps {
  onPublish: () => void;
  publishing: boolean;
  canPublish: boolean;
  publishedSuccess: boolean;
  script?: GeneratedScript;
  duration?: number;
  category?: string;
  canvasAspectRatio?: '9:16' | '16:9' | '1:1' | '4:5' | '21:9';
  onCanvasAspectRatioChange?: (ratio: '9:16' | '16:9' | '1:1' | '4:5' | '21:9') => void;
  onUpdateScript?: (updated: Partial<GeneratedScript>) => void;
  onSelectCompound?: (
    compound: 'video' | 'text' | 'voice' | 'music' | 'overlay',
    videoTab?: 'transform' | 'style'
  ) => void;
}

export const HomeCompoundInspector: React.FC<HomeCompoundInspectorProps> = ({
  onPublish,
  publishing,
  canPublish,
  publishedSuccess,
  script,
  duration = 0,
  canvasAspectRatio = '9:16',
  onSelectCompound,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'codec'>('overview');

  // Dynamic user-customizable Codec & Export settings
  const [selectedFps, setSelectedFps] = useState<'24' | '30' | '60'>('60');
  const [selectedBitrate, setSelectedBitrate] = useState<'4' | '8' | '16' | '25'>('8');
  const [selectedCodec, setSelectedCodec] = useState<'h264' | 'hevc' | 'vp9' | 'av1'>('h264');
  const [selectedContainer, setSelectedContainer] = useState<'mp4' | 'webm' | 'mov'>('mp4');
  const [selectedAudioSampleRate, setSelectedAudioSampleRate] = useState<'24000' | '44100' | '48000'>('24000');
  const [selectedAudioBitrate, setSelectedAudioBitrate] = useState<'128' | '192' | '320'>('192');
  const [selectedResolution, setSelectedResolution] = useState<VideoExportSettings['resolution']>(1080);
  const [hasTimelineContent, setHasTimelineContent] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const settings: VideoExportSettings = {
      fps: Number(selectedFps) as VideoExportSettings['fps'],
      videoBitrate: Number(selectedBitrate) as VideoExportSettings['videoBitrate'],
      codec: selectedCodec,
      container: selectedContainer,
      audioSampleRate: Number(selectedAudioSampleRate) as VideoExportSettings['audioSampleRate'],
      audioBitrate: Number(selectedAudioBitrate) as VideoExportSettings['audioBitrate'],
      resolution: selectedResolution,
    };
    window.dispatchEvent(new CustomEvent<VideoExportSettings>('workspace:export-settings', { detail: settings }));
  }, [selectedFps, selectedBitrate, selectedCodec, selectedContainer, selectedAudioSampleRate, selectedAudioBitrate, selectedResolution]);

  useEffect(() => {
    const handlePublishState = (event: Event) => {
      const detail = (event as CustomEvent<{ hasTimelineContent?: boolean }>).detail;
      if (detail?.hasTimelineContent !== undefined) {
        setHasTimelineContent(detail.hasTimelineContent);
      }
    };
    const handleExportState = (event: Event) => {
      const detail = (event as CustomEvent<{ exporting: boolean }>).detail;
      if (detail) setExporting(detail.exporting);
    };

    window.addEventListener('workspace:publish-state', handlePublishState);
    window.addEventListener('workspace:export-state', handleExportState);
    return () => {
      window.removeEventListener('workspace:publish-state', handlePublishState);
      window.removeEventListener('workspace:export-state', handleExportState);
    };
  }, []);

  const compoundShortcuts = [
    { id: 'video' as const, label: 'Video Canvas & Backdrop (V1)', icon: Film, color: 'text-amber-400', bg: 'bg-amber-400/10', badge: 'Visuals' },
    { id: 'video' as const, videoTab: 'style' as const, label: 'Video Looks & Grading', icon: Sparkles, color: 'text-sky-400', bg: 'bg-sky-400/10', badge: 'Looks' },
    { id: 'text' as const, label: 'Typography & Captions (T1)', icon: Type, color: 'text-blue-400', bg: 'bg-blue-400/10', badge: 'Captions' },
    { id: 'voice' as const, label: 'Voiceover Audio (A1)', icon: Mic, color: 'text-emerald-400', bg: 'bg-emerald-400/10', badge: 'Voice' },
    { id: 'overlay' as const, label: 'Stickers & Graphic Badges', icon: Layers, color: 'text-indigo-400', bg: 'bg-indigo-400/10', badge: 'Overlays' },
  ];

  const optionCardClass =
    'p-3.5 rounded-2xl bg-[#151515] border border-[#2A2A2A] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]';
  const optionChipClass =
    'min-h-[36px] px-2 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer select-none';

  return (
    <div className="flex flex-col h-full bg-[#141414] text-white font-sans-studio select-none">
      {/* ── Subtabs Header Bar ── */}
      <div className="px-2.5 pt-2 pb-2 shrink-0 border-b border-[#242424] bg-[#111111]">
        <ScrollableTabs
          tabs={[
            { id: 'overview', label: 'Overview', icon: Layers },
            { id: 'codec', label: 'Export Settings', icon: Download },
          ]}
          activeTab={activeSubTab}
          onChange={(tab) => setActiveSubTab(tab as any)}
        />
      </div>

      {/* ── Tab Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-3">

        {/* ─────── OVERVIEW TAB ─────── */}
        {activeSubTab === 'overview' && (
          <div className="flex flex-col gap-3 pt-0.5">
            {/* Inspector Navigation Panels */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono-studio text-slate-500 uppercase tracking-wider font-bold px-0.5">
                Active Inspectors
              </span>
              {compoundShortcuts.map((c) => {
                const Icon = c.icon;
                return (
                  <button
                    key={`${c.id}-${c.videoTab || 'default'}`}
                    type="button"
                    onClick={() => {
                      if (onSelectCompound) onSelectCompound(c.id, c.videoTab);
                      window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: c.id }));
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#181818] hover:bg-[#26262C] border border-[#242424] hover:border-white/10 transition-all cursor-pointer text-left group shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-6 h-6 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-3.5 h-3.5 ${c.color}`} />
                      </div>
                      <span className="text-xs font-semibold text-[#E4E4E7] group-hover:text-white truncate">
                        {c.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] font-mono-studio px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-[#2A2A2A]">
                        {c.badge}
                      </span>
                      <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-white transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Publish Button */}
            <button
              type="button"
              onClick={onPublish}
              disabled={!canPublish || publishing}
              className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                publishedSuccess
                  ? 'bg-emerald-600 text-white'
                  : canPublish
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-900/30'
                  : 'bg-[#181818] text-[#555] border border-[#242424] cursor-not-allowed'
              }`}
            >
              <Youtube className="w-4 h-4" />
              {publishing ? 'Publishing...' : publishedSuccess ? '✓ Published to YouTube!' : 'Publish to YouTube'}
            </button>

            {publishedSuccess && (
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('workspace:reset-publish'));
                }}
                className="w-full mt-2 py-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 bg-[#181818] hover:bg-[#26262C] text-zinc-300 hover:text-white border border-[#242424] hover:border-white/10 cursor-pointer transition-colors shadow-xs"
              >
                <Upload className="w-3.5 h-3.5 text-sky-400" />
                <span>Upload Another Video to YouTube</span>
              </button>
            )}
          </div>
        )}

        {/* ─────── CODEC & EXPORT TAB (Fully User Configurable) ─────── */}
        {activeSubTab === 'codec' && (
          <div className="flex flex-col gap-3 pt-0.5">
            {/* Framerate & Bitrate */}
            <div className={`${optionCardClass} flex flex-col gap-2.5`}>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono-studio text-slate-500 uppercase tracking-[0.14em] font-bold">
                  <span>Framerate</span>
                  <span className="rounded-full border border-white/10 bg-[#1d1d1d] px-1.5 py-0.5 text-[10px] text-white font-semibold tracking-normal">
                    {selectedFps} FPS
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {(['24', '30', '60'] as const).map((fps) => (
                    <button
                      key={fps}
                      type="button"
                      onClick={() => setSelectedFps(fps)}
                      className={`${optionChipClass} flex-1 ${
                        selectedFps === fps
                          ? 'bg-gradient-to-b from-[#2d74ff] to-[#1e5fe6] border-[#7bb0ff]/60 text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)]'
                          : 'bg-[#1a1a1a] border-[#2b2b2b] text-zinc-400 hover:bg-[#232326] hover:border-white/10 hover:text-white'
                      }`}
                    >
                      {fps} FPS
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono-studio text-slate-500 uppercase tracking-[0.14em] font-bold">
                  <span>Video Target Bitrate</span>
                  <span className="rounded-full border border-white/10 bg-[#1d1d1d] px-1.5 py-0.5 text-[10px] text-white font-semibold tracking-normal">
                    {selectedBitrate} Mbps
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {[
                    { id: '4' as const, label: '4M (Fast)' },
                    { id: '8' as const, label: '8M (Std)' },
                    { id: '16' as const, label: '16M (HQ)' },
                    { id: '25' as const, label: '25M (Max)' },
                  ].map((bit) => (
                    <button
                      key={bit.id}
                      type="button"
                      onClick={() => setSelectedBitrate(bit.id)}
                      className={`${optionChipClass} flex-1 text-[10px] ${
                        selectedBitrate === bit.id
                          ? 'bg-gradient-to-b from-[#2d74ff] to-[#1e5fe6] border-[#7bb0ff]/60 text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)]'
                          : 'bg-[#1a1a1a] border-[#2b2b2b] text-zinc-400 hover:bg-[#232326] hover:border-white/10 hover:text-white'
                      }`}
                    >
                      {bit.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={`${optionCardClass} flex flex-col gap-1.5`}>
              <div className="flex items-center justify-between text-[10px] font-mono-studio text-slate-500 uppercase tracking-[0.14em] font-bold">
                <span>Output Resolution</span>
                <span className="text-white tracking-normal">{selectedResolution}p</span>
              </div>
              <div className="flex gap-1.5">
                {([720, 1080, 1440] as const).map((resolution) => (
                  <button
                    key={resolution}
                    type="button"
                    onClick={() => setSelectedResolution(resolution)}
                    className={`${optionChipClass} flex-1 ${selectedResolution === resolution
                      ? 'bg-gradient-to-b from-[#2d74ff] to-[#1e5fe6] border-[#7bb0ff]/60 text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)]'
                      : 'bg-[#1a1a1a] border-[#2b2b2b] text-zinc-400 hover:bg-[#232326] hover:border-white/10 hover:text-white'
                    }`}
                  >
                    {resolution}p
                  </button>
                ))}
              </div>
            </div>

            {/* Video Codec & Container */}
            <div className={`${optionCardClass} flex flex-col gap-2.5`}>
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-mono-studio text-slate-500 uppercase tracking-[0.14em] font-bold">Video Codec</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'h264' as const, label: 'H.264 / AVC', desc: 'Universal compatibility' },
                    { id: 'hevc' as const, label: 'H.265 / HEVC', desc: 'Higher compression' },
                    { id: 'vp9' as const, label: 'VP9', desc: 'Web & YouTube native' },
                    { id: 'av1' as const, label: 'AV1', desc: 'Next-gen efficiency' },
                  ].map((codec) => (
                    <button
                      key={codec.id}
                      type="button"
                      onClick={() => {
                        setSelectedCodec(codec.id);
                        if (codec.id === 'vp9') setSelectedContainer('webm');
                        else if (codec.id === 'av1' && selectedContainer === 'mov') setSelectedContainer('mp4');
                        else if ((codec.id === 'h264' || codec.id === 'hevc') && selectedContainer === 'webm') setSelectedContainer('mp4');
                      }}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                        selectedCodec === codec.id
                          ? 'bg-gradient-to-b from-[#2d74ff] to-[#1e5fe6] border-[#7bb0ff]/60 text-white shadow-[0_10px_22px_rgba(37,99,235,0.2)]'
                          : 'bg-[#1a1a1a] border-[#2b2b2b] text-zinc-400 hover:bg-[#232326] hover:border-white/10 hover:text-white'
                      }`}
                    >
                      <p className="text-[10px] font-bold leading-none">{codec.label}</p>
                      <p className={`mt-1 text-[8.5px] leading-snug ${selectedCodec === codec.id ? 'text-blue-100/90 font-medium' : 'text-zinc-500'}`}>
                        {codec.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-mono-studio text-slate-500 uppercase tracking-[0.14em] font-bold">File Container</span>
                <div className="flex gap-1.5">
                  {(['mp4', 'webm', 'mov'] as const).map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => {
                        setSelectedContainer(cnt);
                        if (cnt === 'webm' && selectedCodec !== 'vp9' && selectedCodec !== 'av1') setSelectedCodec('vp9');
                        if (cnt === 'mov' && (selectedCodec === 'vp9' || selectedCodec === 'av1')) setSelectedCodec('h264');
                        if (cnt === 'mp4' && selectedCodec === 'vp9') setSelectedCodec('h264');
                      }}
                      className={`${optionChipClass} flex-1 text-xs uppercase ${
                        selectedContainer === cnt
                          ? 'bg-gradient-to-b from-[#2d74ff] to-[#1e5fe6] border-[#7bb0ff]/60 text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)]'
                          : 'bg-[#1a1a1a] border-[#2b2b2b] text-zinc-400 hover:bg-[#232326] hover:border-white/10 hover:text-white'
                      }`}
                    >
                      .{cnt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Audio Encoder Options */}
            <div className={`${optionCardClass} flex flex-col gap-2.5`}>
              <span className="text-[10px] font-mono-studio text-slate-500 uppercase tracking-[0.14em] font-bold">Audio Output Encoding</span>
              <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                <div className="flex flex-col gap-1.5">
                  <span className="text-slate-500">Sample Rate:</span>
                  <CustomSelect
                    size="sm"
                    value={selectedAudioSampleRate}
                    onChange={(val) => setSelectedAudioSampleRate(val as any)}
                    options={[
                      { value: '24000', label: '24 kHz (Gemini TTS)' },
                      { value: '44100', label: '44.1 kHz (CD Standard)' },
                      { value: '48000', label: '48 kHz (Broadcast Master)' },
                    ]}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-slate-500">Bitrate:</span>
                  <CustomSelect
                    size="sm"
                    value={selectedAudioBitrate}
                    onChange={(val) => setSelectedAudioBitrate(val as any)}
                    options={[
                      { value: '128', label: '128 kbps' },
                      { value: '192', label: '192 kbps (Recommended)' },
                      { value: '320', label: '320 kbps (High Fidelity)' },
                    ]}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('workspace:export-video'))}
              disabled={exporting || !hasTimelineContent}
              title={!hasTimelineContent ? 'Add media to the timeline to export' : exporting ? 'Rendering the final video...' : 'Export the composed video'}
              className={`flex w-full min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${
                exporting || !hasTimelineContent
                  ? 'cursor-not-allowed border-[#2A2A2A] bg-[#171717] text-zinc-500'
                  : 'cursor-pointer border-[#7bb0ff]/50 bg-gradient-to-b from-[#2d74ff] to-[#1e5fe6] text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)] hover:brightness-110'
              }`}
            >
              {exporting ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              {exporting ? 'Exporting...' : `Export ${selectedContainer.toUpperCase()}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeCompoundInspector;
