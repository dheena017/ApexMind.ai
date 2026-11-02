import { CustomSelect } from '@/src/shared/ui/CustomSelect';
import React, { useState } from 'react';
import {
  Check,
  Copy,
  Film,
  Type,
  Mic,
  Music,
  Layers,
  Sparkles,
  Youtube,
  Zap,
  AlertCircle,
  Instagram,
  Globe,
  Bookmark,
  ChevronRight,
  Clock,
  Download, Share2,
  Upload,
  Smartphone,
} from 'lucide-react';
import { GeneratedScript } from '../../types';

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

const normalizeText = (value?: string): string => (value ?? '').replace(/[#@]/g, ' ').replace(/\s+/g, ' ').trim();

const countWords = (value?: string): number => normalizeText(value).split(' ').filter(Boolean).length;

const normalizeHashtags = (hashtags: string[]): string[] => Array.from(new Set(
  hashtags
    .map((tag) => tag.trim().replace(/^#+/, '').toLowerCase())
    .filter(Boolean)
    .map((tag) => `#${tag}`),
));

export const HomeCompoundInspector: React.FC<HomeCompoundInspectorProps> = ({
  onPublish,
  publishing,
  canPublish,
  publishedSuccess,
  script,
  duration = 0,
  category = '',
  canvasAspectRatio = '9:16',
  onCanvasAspectRatioChange,
  onUpdateScript,
  onSelectCompound,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'audit' | 'distribute' | 'codec'>('overview');
  const [copiedMetadata, setCopiedMetadata] = useState(false);
  const [savedDraft, setSavedDraft] = useState(false);

  // Dynamic user-customizable Codec & Export settings
  const [selectedResolution, setSelectedResolution] = useState<'1080x1920' | '1920x1080' | '1080x1080' | '1080x1350' | '3840x2160'>('1080x1920');
  const [selectedFps, setSelectedFps] = useState<'24' | '30' | '60'>('60');
  const [selectedBitrate, setSelectedBitrate] = useState<'4' | '8' | '16' | '25'>('8');
  const [selectedCodec, setSelectedCodec] = useState<'h264' | 'hevc' | 'vp9' | 'av1'>('h264');
  const [selectedContainer, setSelectedContainer] = useState<'mp4' | 'webm' | 'mov'>('mp4');
  const [selectedAudioSampleRate, setSelectedAudioSampleRate] = useState<'24000' | '44100' | '48000'>('24000');
  const [selectedAudioBitrate, setSelectedAudioBitrate] = useState<'128' | '192' | '320'>('192');

  const title = script?.title || '';
  const hook = script?.hook || '';
  const cta = script?.cta || '';
  const hashtags = script?.hashtags || [];
  const uniqueHashtags = normalizeHashtags(hashtags);

  const handleCopyMetadata = () => {
    const text = `${title || 'ApexMind Video'}\n\n${script?.quote || ''}\n\n${hashtags.join(' ')}`;
    navigator.clipboard?.writeText(text);
    setCopiedMetadata(true);
    setTimeout(() => setCopiedMetadata(false), 2000);
  };

  const handleSaveDraft = () => {
    window.dispatchEvent(new CustomEvent('workspace:save-draft'));
    setSavedDraft(true);
    setTimeout(() => setSavedDraft(false), 2000);
  };

  const compoundShortcuts = [
    { id: 'video' as const, label: 'Video Canvas & Backdrop (V1)', icon: Film, color: 'text-amber-400', bg: 'bg-amber-400/10', badge: 'Visuals' },
    { id: 'video' as const, videoTab: 'style' as const, label: 'Video Looks & Grading', icon: Sparkles, color: 'text-sky-400', bg: 'bg-sky-400/10', badge: 'Looks' },
    { id: 'text' as const, label: 'Typography & Captions (T1)', icon: Type, color: 'text-blue-400', bg: 'bg-blue-400/10', badge: 'Captions' },
    { id: 'voice' as const, label: 'Voiceover Audio (A1)', icon: Mic, color: 'text-emerald-400', bg: 'bg-emerald-400/10', badge: 'Voice' },
    { id: 'music' as const, label: 'Soundtrack Mix (A2)', icon: Music, color: 'text-blue-400', bg: 'bg-purple-400/10', badge: 'Music' },
    { id: 'overlay' as const, label: 'Stickers & Graphic Badges', icon: Layers, color: 'text-indigo-400', bg: 'bg-indigo-400/10', badge: 'Overlays' },
  ];

  const spokenWordCount = countWords(`${hook} ${script?.quote ?? ''} ${cta}`);
  const spokenWordsPerMinute = duration > 0 ? Math.round((spokenWordCount / duration) * 60) : 0;

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none">
      {/* ── Subtabs Header Bar ── */}
      <div className="px-3 pt-2.5 pb-2 shrink-0 border-b border-[#26262B]/80">
        <div className="grid grid-cols-4 gap-1 p-1 bg-[#1A1A1E] rounded-xl border border-[#272730]">
          {(
            [
              { id: 'overview', label: 'Overview', icon: Layers },
              { id: 'audit', label: 'Audit', icon: AlertCircle },
              { id: 'distribute', label: 'Share', icon: Share2 },
              { id: 'codec', label: 'Codec', icon: Download },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            const isActive = activeSubTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveSubTab(t.id)}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#272730] text-white shadow-sm font-bold border border-white/10'
                    : 'text-[#8E8E93] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-sky-400' : 'text-[#8E8E93]'}`} />
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-3">

        {/* ─────── OVERVIEW TAB ─────── */}
        {activeSubTab === 'overview' && (
          <div className="flex flex-col gap-3 pt-0.5">
            {/* Inspector Navigation Panels */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono-studio text-[#71717A] uppercase tracking-wider font-bold px-0.5">
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
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#18181C] hover:bg-[#222228] border border-[#282830] transition-colors cursor-pointer text-left group"
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
                      <span className="text-[9px] font-mono-studio px-1.5 py-0.5 rounded bg-white/5 text-[#A1A1AA] border border-white/10">
                        {c.badge}
                      </span>
                      <ChevronRight className="w-3 h-3 text-[#71717A] group-hover:text-white transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyMetadata}
                className="flex-1 py-2 rounded-xl bg-[#1C1C20] hover:bg-[#25252C] border border-[#2A2A30] text-xs font-medium text-[#D4D4D8] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Copy className="w-3 h-3 text-[#3B82F6]" />
                {copiedMetadata ? 'Copied!' : 'Copy Meta'}
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                className="flex-1 py-2 rounded-xl bg-[#1C1C20] hover:bg-[#25252C] border border-[#2A2A30] text-xs font-medium text-[#D4D4D8] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Bookmark className="w-3 h-3 text-amber-400" />
                {savedDraft ? 'Saved!' : 'Save Draft'}
              </button>
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
                  : 'bg-[#1C1C20] text-[#555] border border-[#2A2A30] cursor-not-allowed'
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
                className="w-full mt-2 py-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 bg-[#202026] hover:bg-[#2C2C34] text-zinc-200 hover:text-white border border-[#32323C] cursor-pointer transition-colors shadow-xs"
              >
                <Upload className="w-3.5 h-3.5 text-sky-400" />
                <span>Upload Another Video to YouTube</span>
              </button>
            )}
          </div>
        )}

        {/* ─────── AUDIT TAB ─────── */}
        {activeSubTab === 'audit' && (
          <div className="flex flex-col gap-3 pt-0.5">
            {/* Platform Requirements */}
            <div className="p-3 rounded-xl bg-[#1C1C20] border border-[#2A2A30] flex flex-col gap-2">
              <span className="text-[10px] font-mono-studio text-[#71717A] uppercase tracking-wider font-bold">
                YouTube Shorts Checks
              </span>
              {[
                {
                  label: `Vertical format: ${canvasAspectRatio}`,
                  pass: canvasAspectRatio === '9:16',
                },
                {
                  label: `Short-form duration: ${duration > 0 ? `${duration.toFixed(1)}s` : 'not set'} (target ≤60s)`,
                  pass: duration > 0 && duration <= 60,
                },
                {
                  label: 'Opening hook added',
                  pass: normalizeText(hook).length > 0,
                },
                {
                  label: 'Call-to-action added',
                  pass: normalizeText(cta).length > 0,
                },
                {
                  label: `Export: ${selectedContainer.toUpperCase()} / ${selectedCodec.toUpperCase()}`,
                  pass: selectedContainer === 'mp4' && selectedCodec === 'h264',
                },
                {
                  label: `Video title: ${title.trim().length}/100 characters`,
                  pass: title.trim().length > 0 && title.trim().length <= 100,
                },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  {item.pass
                    ? <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    : <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />}
                  <span className={`text-[11px] ${item.pass ? 'text-[#D4D4D8]' : 'text-amber-300'}`}>{item.label}</span>
                </div>
              ))}
              <p className="text-[9px] leading-relaxed text-[#71717A] border-t border-[#25252A] pt-2">
                Checks use current project settings and are guidance, not a guarantee of platform acceptance.
              </p>
            </div>

            {/* Measurable readiness signals */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <span className="text-[10px] font-mono-studio text-[#71717A] uppercase tracking-wider font-bold">Readiness Signals</span>
              {[
                {
                  label: 'Spoken pace',
                  icon: Clock,
                  value: !spokenWordCount ? 'Add spoken script' : duration > 0 ? `${spokenWordsPerMinute} words/min` : 'Set duration',
                  color: 'text-blue-400',
                  pass: spokenWordsPerMinute >= 110 && spokenWordsPerMinute <= 175,
                },
                {
                  label: 'Opening hook',
                  icon: Zap,
                  value: hook ? `${countWords(hook)} words` : 'Missing',
                  color: 'text-amber-400',
                  pass: countWords(hook) >= 5 && countWords(hook) <= 20,
                },
                {
                  label: 'Captions',
                  icon: Type,
                  value: script?.subtitles?.length ? `${script.subtitles.length} lines` : 'Not added',
                  color: 'text-sky-400',
                  pass: (script?.subtitles?.length ?? 0) > 0,
                },
                {
                  label: 'Short-form format',
                  icon: Smartphone,
                  value: canvasAspectRatio === '9:16' ? '9:16 · vertical' : `${canvasAspectRatio} · not vertical`,
                  color: 'text-emerald-400',
                  pass: canvasAspectRatio === '9:16',
                },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-3 h-3 ${item.color}`} />
                      <span className="text-[11px] text-[#A1A1AA]">{item.label}</span>
                    </div>
                    <span className={`text-[11px] font-bold ${item.pass ? item.color : 'text-amber-400'}`}>{item.value}</span>
                  </div>
                );
              })}
              <p className="text-[9px] leading-relaxed text-[#71717A] border-t border-[#25252A] pt-2">
                Checklist guidance only; actual reach depends on audience response and platform distribution.
              </p>
            </div>
          </div>
        )}

        {/* ─────── DISTRIBUTE TAB ─────── */}
        {activeSubTab === 'distribute' && (
          <div className="flex flex-col gap-3 pt-0.5">
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <span className="text-[10px] font-mono-studio text-[#71717A] uppercase tracking-wider font-bold">Publish & Share</span>
              {[
                { label: 'YouTube Shorts', icon: Youtube, desc: 'Direct API publish', color: 'text-red-400', action: onPublish, disabled: !canPublish || publishing },
                { label: 'Instagram Reels', icon: Instagram, desc: 'Export optimized video', color: 'text-pink-400', action: () => window.dispatchEvent(new CustomEvent('workspace:export-video')), disabled: false },
                { label: 'TikTok', icon: Globe, desc: 'Export 9:16 MP4', color: 'text-[#69C9D0]', action: () => window.dispatchEvent(new CustomEvent('workspace:export-video')), disabled: false },
                { label: 'Copy Video Metadata', icon: Copy, desc: 'Title + Description + Tags', color: 'text-blue-400', action: handleCopyMetadata, disabled: false },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    disabled={item.disabled}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-[#1C1C20] hover:bg-[#252529] border border-[#2A2A30] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-left group"
                  >
                    <Icon className={`w-4 h-4 ${item.color} shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white">{item.label}</p>
                      <p className="text-[10px] text-[#71717A]">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#555] group-hover:text-white transition-colors" />
                  </button>
                );
              })}
            </div>

            {/* Export Actions */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-mono-studio text-[#71717A] uppercase tracking-wider font-bold">One-Click Render</span>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('workspace:export-video'))}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Render & Download {selectedContainer.toUpperCase()} ({selectedResolution})
              </button>
            </div>
          </div>
        )}

        {/* ─────── CODEC & EXPORT TAB (Fully User Configurable) ─────── */}
        {activeSubTab === 'codec' && (
          <div className="flex flex-col gap-3 pt-0.5">
            {/* Resolution Selector */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <div className="flex justify-between items-center text-[10px] font-mono-studio text-[#71717A] uppercase tracking-wider font-bold">
                <span>Output Resolution</span>
                <span className="text-white font-semibold">{selectedResolution}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: '1080x1920' as const, label: '1080×1920 (9:16)', badge: 'Shorts/Reels' },
                  { id: '1920x1080' as const, label: '1920×1080 (16:9)', badge: 'Landscape' },
                  { id: '1080x1080' as const, label: '1080×1080 (1:1)', badge: 'Square' },
                  { id: '1080x1350' as const, label: '1080×1350 (4:5)', badge: 'Portrait Feed' },
                  { id: '3840x2160' as const, label: '3840×2160 (4K)', badge: 'Ultra HD' },
                ].map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => setSelectedResolution(res.id)}
                    className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                      selectedResolution === res.id
                        ? 'bg-[#1E293B] border-blue-500 text-white'
                        : 'bg-[#141417] border-[#2A2A30] text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    <p className="text-[11px] font-bold leading-tight">{res.label}</p>
                    <span className="text-[9px] text-[#71717A]">{res.badge}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Framerate & Bitrate */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2.5">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[10px] font-mono-studio text-[#71717A] uppercase font-bold">
                  <span>Framerate</span>
                  <span className="text-white font-semibold">{selectedFps} FPS</span>
                </div>
                <div className="flex gap-1.5">
                  {(['24', '30', '60'] as const).map((fps) => (
                    <button
                      key={fps}
                      type="button"
                      onClick={() => setSelectedFps(fps)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        selectedFps === fps
                          ? 'bg-[#3B82F6] border-transparent text-white'
                          : 'bg-[#141417] border-[#2A2A30] text-[#71717A] hover:text-white'
                      }`}
                    >
                      {fps} FPS
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[10px] font-mono-studio text-[#71717A] uppercase font-bold">
                  <span>Video Target Bitrate</span>
                  <span className="text-white font-semibold">{selectedBitrate} Mbps</span>
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
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                        selectedBitrate === bit.id
                          ? 'bg-[#3B82F6] border-transparent text-white'
                          : 'bg-[#141417] border-[#2A2A30] text-[#71717A] hover:text-white'
                      }`}
                    >
                      {bit.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Video Codec & Container */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2.5">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono-studio text-[#71717A] uppercase font-bold">Video Codec</span>
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
                      onClick={() => setSelectedCodec(codec.id)}
                      className={`p-2 rounded-lg border text-left cursor-pointer transition-colors ${
                        selectedCodec === codec.id
                          ? 'bg-[#1E293B] border-blue-500 text-white'
                          : 'bg-[#141417] border-[#2A2A30] text-[#71717A] hover:text-white'
                      }`}
                    >
                      <p className="text-[10px] font-bold">{codec.label}</p>
                      <p className="text-[8px] text-[#71717A]">{codec.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono-studio text-[#71717A] uppercase font-bold">File Container</span>
                <div className="flex gap-1.5">
                  {(['mp4', 'webm', 'mov'] as const).map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setSelectedContainer(cnt)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase border transition-colors cursor-pointer ${
                        selectedContainer === cnt
                          ? 'bg-emerald-600 border-transparent text-white'
                          : 'bg-[#141417] border-[#2A2A30] text-[#71717A] hover:text-white'
                      }`}
                    >
                      .{cnt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Audio Encoder Options */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <span className="text-[10px] font-mono-studio text-[#71717A] uppercase font-bold">Audio Output Encoding</span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex flex-col gap-1">
                  <span className="text-[#71717A]">Sample Rate:</span>
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

                <div className="flex flex-col gap-1">
                  <span className="text-[#71717A]">Bitrate:</span>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeCompoundInspector;
