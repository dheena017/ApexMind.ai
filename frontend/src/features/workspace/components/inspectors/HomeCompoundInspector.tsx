import React, { useState, useEffect } from 'react';
import {
  Check,
  Copy,
  Home,
  Film,
  Type,
  Mic,
  Music,
  Layers,
  ArrowRight,
  Sparkles,
  Youtube,
  TrendingUp,
  Hash,
  BarChart2,
  Zap,
  Star,
  AlertCircle,
  Globe,
  Instagram,
  Bookmark,
  Share2,
  ChevronRight,
  Cpu,
  Radio,
  Clock,
  Download,
  RefreshCw,
  Target,
  Plus,
  X,
  Sliders,
  Settings2,
  ShieldCheck,
  Smartphone,
  Monitor,
  Square,
  Maximize2,
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

const computeContentReadiness = (
  script: GeneratedScript | undefined,
  duration: number,
  title: string,
  hook: string,
  cta: string,
  hashtags: string[],
  aspectRatio: string,
): number | null => {
  const cleanTitle = normalizeText(title);
  const cleanHook = normalizeText(hook);
  const cleanQuote = normalizeText(script?.quote);
  const cleanCta = normalizeText(cta);
  const cleanHashtags = normalizeHashtags(hashtags);
  const subtitleCount = script?.subtitles?.length ?? 0;
  const spokenWords = countWords(`${cleanHook} ${cleanQuote} ${cleanCta}`);

  if (
    !cleanTitle &&
    !spokenWords &&
    cleanHashtags.length === 0 &&
    !(script?.tags?.some((tag) => tag.trim()) ?? false) &&
    subtitleCount === 0
  ) {
    return null;
  }

  let score = 0;

  const titleWords = countWords(cleanTitle);
  if (cleanTitle) {
    score += titleWords >= 4 && titleWords <= 12 ? 13 : titleWords > 0 ? 6 : 0;
    if (cleanTitle.length >= 18 && cleanTitle.length <= 70) score += 5;
  }

  const hookWords = countWords(cleanHook);
  if (cleanHook) {
    score += hookWords >= 5 && hookWords <= 20 ? 15 : hookWords > 0 ? 7 : 0;
    if (/[.!?]/.test(cleanHook)) score += 5;
  }

  if (spokenWords > 0 && duration > 0) {
    const wordsPerMinute = (spokenWords / duration) * 60;
    score += Math.round(25 * Math.max(0, 1 - Math.abs(wordsPerMinute - 145) / 145));
  }

  const ctaWords = countWords(cleanCta);
  if (cleanCta) score += ctaWords >= 2 && ctaWords <= 10 ? 10 : 5;

  if (cleanHashtags.length >= 3 && cleanHashtags.length <= 8) score += 8;
  else if (cleanHashtags.length > 0) score += Math.min(6, cleanHashtags.length * 2);
  if (script?.tags?.some((tag) => tag.trim())) score += 4;

  if (subtitleCount >= 4) score += 10;
  else if (subtitleCount > 0) score += 5;

  if (aspectRatio === '9:16') score += 5;

  return Math.min(100, Math.max(0, score));
};

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
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'seo' | 'audit' | 'distribute' | 'codec'>('overview');
  const [copiedMetadata, setCopiedMetadata] = useState(false);
  const [copiedHashtags, setCopiedHashtags] = useState(false);
  const [platform, setPlatform] = useState<'youtube' | 'instagram' | 'tiktok' | 'twitter'>('youtube');
  const [savedDraft, setSavedDraft] = useState(false);

  // Dynamic user-customizable Codec & Export settings
  const [selectedResolution, setSelectedResolution] = useState<'1080x1920' | '1920x1080' | '1080x1080' | '1080x1350' | '3840x2160'>('1080x1920');
  const [selectedFps, setSelectedFps] = useState<'24' | '30' | '60'>('60');
  const [selectedBitrate, setSelectedBitrate] = useState<'4' | '8' | '16' | '25'>('8');
  const [selectedCodec, setSelectedCodec] = useState<'h264' | 'hevc' | 'vp9' | 'av1'>('h264');
  const [selectedContainer, setSelectedContainer] = useState<'mp4' | 'webm' | 'mov'>('mp4');
  const [selectedAudioSampleRate, setSelectedAudioSampleRate] = useState<'24000' | '44100' | '48000'>('24000');
  const [selectedAudioBitrate, setSelectedAudioBitrate] = useState<'128' | '192' | '320'>('192');

  // Interactive SEO editing
  const [editingTitle, setEditingTitle] = useState(script?.title || '');
  const [editingHook, setEditingHook] = useState(script?.hook || '');
  const [editingCta, setEditingCta] = useState(script?.cta || '');
  const [newHashtag, setNewHashtag] = useState('');
  const [currentHashtags, setCurrentHashtags] = useState<string[]>(script?.hashtags || []);
  const uniqueHashtags = normalizeHashtags(currentHashtags);

  useEffect(() => {
    setEditingTitle(script?.title || '');
    setEditingHook(script?.hook || '');
    setEditingCta(script?.cta || '');
    setCurrentHashtags(script?.hashtags || []);
  }, [script?.title, script?.hook, script?.cta, script?.hashtags]);

  const handleApplyTitleChange = (val: string) => {
    setEditingTitle(val);
    onUpdateScript?.({ title: val });
  };

  const handleApplyHookChange = (val: string) => {
    setEditingHook(val);
    onUpdateScript?.({ hook: val });
  };

  const handleApplyCtaChange = (val: string) => {
    setEditingCta(val);
    onUpdateScript?.({ cta: val });
  };

  const handleAddHashtag = (tagToAdd?: string) => {
    const raw = tagToAdd || newHashtag.trim();
    if (!raw) return;
    const formatted = raw.startsWith('#') ? raw : `#${raw}`;
    if (!currentHashtags.includes(formatted)) {
      const updated = [...currentHashtags, formatted];
      setCurrentHashtags(updated);
      onUpdateScript?.({ hashtags: updated });
    }
    if (!tagToAdd) setNewHashtag('');
  };

  const handleRemoveHashtag = (tagToRemove: string) => {
    const updated = currentHashtags.filter((t) => t !== tagToRemove);
    setCurrentHashtags(updated);
    onUpdateScript?.({ hashtags: updated });
  };

  const handleCopyMetadata = () => {
    const text = `${editingTitle || script?.title || 'ApexMind Video'}\n\n${script?.quote || ''}\n\n${currentHashtags.join(' ')}`;
    navigator.clipboard?.writeText(text);
    setCopiedMetadata(true);
    setTimeout(() => setCopiedMetadata(false), 2000);
  };

  const handleCopyHashtags = () => {
    const tags = currentHashtags.join(' ');
    navigator.clipboard?.writeText(tags);
    setCopiedHashtags(true);
    setTimeout(() => setCopiedHashtags(false), 2000);
  };

  const handleSaveDraft = () => {
    window.dispatchEvent(new CustomEvent('workspace:save-draft'));
    setSavedDraft(true);
    setTimeout(() => setSavedDraft(false), 2000);
  };

  const handleAspectRatioSelect = (ratio: '9:16' | '16:9' | '1:1' | '4:5' | '21:9') => {
    onCanvasAspectRatioChange?.(ratio);
    window.dispatchEvent(new CustomEvent('workspace:aspect-ratio-change', { detail: { aspectRatio: ratio } }));
  };

  const compoundShortcuts = [
    { id: 'video' as const, label: 'Video Canvas & Backdrop (V1)', icon: Film, color: 'text-amber-400', bg: 'bg-amber-400/10', badge: 'Visuals' },
    { id: 'video' as const, videoTab: 'style' as const, label: 'Video Looks & Grading', icon: Sparkles, color: 'text-sky-400', bg: 'bg-sky-400/10', badge: 'Looks' },
    { id: 'text' as const, label: 'Typography & Captions (T1)', icon: Type, color: 'text-blue-400', bg: 'bg-blue-400/10', badge: 'Captions' },
    { id: 'voice' as const, label: 'Voiceover Audio (A1)', icon: Mic, color: 'text-emerald-400', bg: 'bg-emerald-400/10', badge: 'Voice' },
    { id: 'music' as const, label: 'Soundtrack Mix (A2)', icon: Music, color: 'text-purple-400', bg: 'bg-purple-400/10', badge: 'Music' },
    { id: 'overlay' as const, label: 'Stickers & Graphic Badges', icon: Layers, color: 'text-indigo-400', bg: 'bg-indigo-400/10', badge: 'Overlays' },
  ];

  const displayCategory = category || (script?.tags?.[0]) || 'General Creator';
  const readinessScore = computeContentReadiness(
    script,
    duration,
    editingTitle,
    editingHook,
    editingCta,
    currentHashtags,
    canvasAspectRatio,
  );
  const scoreColor = readinessScore === null
    ? 'text-[#A1A1AA]'
    : readinessScore >= 75 ? 'text-emerald-400' : readinessScore >= 50 ? 'text-amber-400' : 'text-red-400';
  const scoreBg = readinessScore === null
    ? 'bg-white/5 border-white/10'
    : readinessScore >= 75 ? 'bg-emerald-400/10 border-emerald-400/30' : readinessScore >= 50 ? 'bg-amber-400/10 border-amber-400/30' : 'bg-red-400/10 border-red-400/30';
  const spokenWordCount = countWords(`${editingHook} ${script?.quote ?? ''} ${editingCta}`);
  const spokenWordsPerMinute = duration > 0 ? Math.round((spokenWordCount / duration) * 60) : 0;

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none">
      {/* ── Subtabs Header Bar ── */}
      <div className="flex items-center gap-3 px-3 pt-2.5 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar shrink-0">
        {(['overview', 'seo', 'audit', 'distribute', 'codec'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveSubTab(tab)}
            className={`pb-2.5 transition-colors cursor-pointer border-b-2 shrink-0 capitalize ${
              activeSubTab === tab
                ? 'text-white border-[#3B82F6]'
                : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
            }`}
          >
            {tab === 'codec' ? 'Export & Codec' : tab}
          </button>
        ))}
      </div>

      {/* ── Tab Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-3">

        {/* ─────── OVERVIEW TAB ─────── */}
        {activeSubTab === 'overview' && (
          <div className="flex flex-col gap-3 pt-0.5">
            {/* Content readiness score */}
            <div className={`p-3 rounded-xl border ${scoreBg} flex items-center justify-between`}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <TrendingUp className={`w-4 h-4 ${scoreColor}`} />
                </div>
                <div>
                  <p className="text-[10px] text-[#71717A] uppercase tracking-wider font-bold" title="A checklist score for script and format completeness; it cannot predict views or virality.">Content Readiness</p>
                  <p className={`text-xl font-black leading-tight ${scoreColor}`}>
                    {readinessScore ?? '—'}<span className="text-xs font-medium ml-0.5 text-[#A1A1AA]">/100</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[#A1A1AA] font-semibold truncate max-w-[130px]">{displayCategory}</p>
                <p className="text-[10px] text-[#71717A] font-mono-studio">
                  {readinessScore === null ? 'Add content to score' : readinessScore >= 75 ? 'Ready' : readinessScore >= 50 ? 'In progress' : 'Needs work'}
                </p>
                <p className="text-[10px] text-[#71717A] font-mono-studio">{duration > 0 ? `${duration.toFixed(1)}s total` : 'Duration not set'}</p>
              </div>
            </div>

            {/* Canvas Aspect Ratio Quick Selector */}
            <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-[#18181C] border border-[#282830]">
              <div className="flex items-center justify-between text-[10px] font-mono-studio text-[#71717A] uppercase tracking-wider font-bold">
                <span>Canvas Format</span>
                <span className="text-sky-400 font-bold">{canvasAspectRatio}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: '9:16' as const, label: '9:16', desc: 'Shorts/Reels', icon: Smartphone },
                  { id: '16:9' as const, label: '16:9', desc: 'YouTube', icon: Monitor },
                  { id: '1:1' as const, label: '1:1', desc: 'Square', icon: Square },
                  { id: '4:5' as const, label: '4:5', desc: 'Portrait', icon: Maximize2 },
                ].map((aspect) => {
                  const Icon = aspect.icon;
                  const isSelected = canvasAspectRatio === aspect.id;
                  return (
                    <button
                      key={aspect.id}
                      type="button"
                      onClick={() => handleAspectRatioSelect(aspect.id)}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#1E293B] border-sky-500 text-sky-400 shadow-sm'
                          : 'bg-[#141417] border-[#2A2A30] text-[#71717A] hover:text-[#D4D4D8] hover:border-[#3A3A42]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 mb-1" />
                      <span className="text-[10px] font-bold leading-none">{aspect.label}</span>
                      <span className="text-[8px] text-[#71717A] mt-0.5">{aspect.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Content Checklist */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: 'Hook', icon: Zap, value: (script?.hook || editingHook) ? 'Ready' : 'Missing', ok: !!(script?.hook || editingHook), color: 'text-amber-400' },
                { label: 'Tags', icon: Hash, value: `${currentHashtags.length}`, ok: currentHashtags.length >= 3, color: 'text-blue-400' },
                { label: 'CTA', icon: Target, value: (script?.cta || editingCta) ? 'Ready' : 'Missing', ok: !!(script?.cta || editingCta), color: 'text-emerald-400' },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className={`flex flex-col items-center gap-1 p-2 rounded-xl border ${stat.ok ? 'bg-[#18181C] border-[#282830]' : 'bg-[#1C1410] border-amber-900/30'}`}>
                    <Icon className={`w-3.5 h-3.5 ${stat.ok ? stat.color : 'text-amber-500'}`} />
                    <span className={`text-xs font-black ${stat.ok ? 'text-white' : 'text-amber-400'}`}>{stat.value}</span>
                    <span className="text-[9px] text-[#71717A]">{stat.label}</span>
                  </div>
                );
              })}
            </div>

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
          </div>
        )}

        {/* ─────── SEO TAB ─────── */}
        {activeSubTab === 'seo' && (
          <div className="flex flex-col gap-3 pt-0.5">
            {/* Live Editable Title */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono-studio text-[#71717A] uppercase tracking-wider font-bold">Video Title</span>
                <span className={`text-[10px] font-mono-studio ${editingTitle.length <= 100 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {editingTitle.length}/100 chars
                </span>
              </div>
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => handleApplyTitleChange(e.target.value)}
                placeholder="Enter compelling video title..."
                className="w-full bg-[#121215] border border-[#2A2A30] focus:border-[#3B82F6] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
              />
            </div>

            {/* Live Editable Hook & CTA */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <span className="text-[10px] font-mono-studio text-[#71717A] uppercase tracking-wider font-bold">Opening Hook (First 3s)</span>
              <input
                type="text"
                value={editingHook}
                onChange={(e) => handleApplyHookChange(e.target.value)}
                placeholder="First 3 seconds attention hook..."
                className="w-full bg-[#121215] border border-[#2A2A30] focus:border-[#3B82F6] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
              />

              <span className="text-[10px] font-mono-studio text-[#71717A] uppercase tracking-wider font-bold mt-1">Closing Call-To-Action</span>
              <input
                type="text"
                value={editingCta}
                onChange={(e) => handleApplyCtaChange(e.target.value)}
                placeholder="Subscribe / Comment / Like prompt..."
                className="w-full bg-[#121215] border border-[#2A2A30] focus:border-[#3B82F6] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
              />
            </div>

            {/* Interactive Hashtag Manager */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono-studio text-[#71717A] uppercase tracking-wider font-bold">
                  Hashtags ({currentHashtags.length})
                </span>
                <button
                  type="button"
                  onClick={handleCopyHashtags}
                  className="text-[10px] text-[#3B82F6] hover:text-blue-300 cursor-pointer flex items-center gap-1 font-medium"
                >
                  <Copy className="w-2.5 h-2.5" />
                  {copiedHashtags ? 'Copied!' : 'Copy All'}
                </button>
              </div>

              {/* Tag input row */}
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newHashtag}
                  onChange={(e) => setNewHashtag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddHashtag(); }}
                  placeholder="Add hashtag (e.g. #Stoic)..."
                  className="flex-1 bg-[#121215] border border-[#2A2A30] focus:border-[#3B82F6] rounded-lg px-2.5 py-1 text-xs text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddHashtag()}
                  className="px-2.5 py-1 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-xs font-semibold text-white flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>

              {/* Tag Cloud */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {currentHashtags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1E2A3A] border border-[#2A3A5A] text-[10px] text-[#60A5FA] font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveHashtag(tag)}
                      className="text-[#93C5FD] hover:text-white cursor-pointer ml-0.5"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Popular Suggestions */}
              <div className="flex flex-col gap-1 pt-1 border-t border-[#25252A]">
                <span className="text-[9px] text-[#71717A] uppercase font-bold">Suggested Tags:</span>
                <div className="flex flex-wrap gap-1">
                  {['#Shorts', '#Viral', '#Mindset', '#Motivation', '#Discipline', '#Success', '#SelfImprovement', '#Stoicism'].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleAddHashtag(sug)}
                      disabled={currentHashtags.includes(sug)}
                      className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                        currentHashtags.includes(sug)
                          ? 'opacity-30 border-transparent bg-transparent cursor-default'
                          : 'bg-[#1C1C22] border-[#2A2A32] text-[#A1A1AA] hover:text-white hover:border-[#3B82F6]'
                      }`}
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dynamic SEO Checklist */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-1.5">
              <span className="text-[10px] font-mono-studio text-[#71717A] uppercase tracking-wider font-bold">SEO Audit Checklist</span>
              {[
                { label: 'Title is 10–80 characters', pass: editingTitle.trim().length >= 10 && editingTitle.trim().length <= 80 },
                { label: 'Opening hook added', pass: normalizeText(editingHook).length > 0 },
                { label: 'Call-to-action added', pass: normalizeText(editingCta).length > 0 },
                { label: '3–8 unique hashtags added', pass: uniqueHashtags.length >= 3 && uniqueHashtags.length <= 8 },
                { label: 'Short-form target duration set (15–58s)', pass: duration >= 15 && duration <= 58 },
                { label: 'Vertical aspect ratio configured', pass: canvasAspectRatio === '9:16' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  {item.pass
                    ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    : <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  <span className={`text-[11px] ${item.pass ? 'text-[#D4D4D8]' : 'text-amber-300'}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─────── AUDIT TAB ─────── */}
        {activeSubTab === 'audit' && (
          <div className="flex flex-col gap-3 pt-0.5">
            {/* Platform Selection */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'youtube' as const, label: 'YouTube', icon: '▶' },
                { id: 'instagram' as const, label: 'Reels', icon: '◈' },
                { id: 'tiktok' as const, label: 'TikTok', icon: '♪' },
                { id: 'twitter' as const, label: 'X / Social', icon: '𝕏' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatform(p.id)}
                  className={`py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide cursor-pointer border transition-all text-center ${
                    platform === p.id
                      ? 'bg-[#3B82F6] text-white border-transparent shadow'
                      : 'bg-[#18181C] border-[#282830] text-[#71717A] hover:text-white'
                  }`}
                >
                  <span className="mr-1">{p.icon}</span>{p.label}
                </button>
              ))}
            </div>

            {/* Platform Requirements */}
            <div className="p-3 rounded-xl bg-[#1C1C20] border border-[#2A2A30] flex flex-col gap-2">
              <span className="text-[10px] font-mono-studio text-[#71717A] uppercase tracking-wider font-bold">
                {platform === 'youtube' ? 'YouTube Shorts' : platform === 'instagram' ? 'Instagram Reels' : platform === 'tiktok' ? 'TikTok' : 'X'} Checks
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
                  pass: normalizeText(editingHook).length > 0,
                },
                {
                  label: 'Call-to-action added',
                  pass: normalizeText(editingCta).length > 0,
                },
                {
                  label: `Export: ${selectedContainer.toUpperCase()} / ${selectedCodec.toUpperCase()}`,
                  pass: selectedContainer === 'mp4' && selectedCodec === 'h264',
                },
                ...(platform === 'youtube' ? [
                  { label: `Video title: ${editingTitle.trim().length}/100 characters`, pass: editingTitle.trim().length > 0 && editingTitle.trim().length <= 100 },
                ] : platform === 'instagram' ? [
                  { label: `Unique hashtags: ${uniqueHashtags.length} (suggested 3–10)`, pass: uniqueHashtags.length >= 3 && uniqueHashtags.length <= 10 },
                  { label: `Resolution: ${selectedResolution} (1080×1920 target)`, pass: selectedResolution === '1080x1920' },
                ] : platform === 'tiktok' ? [
                  { label: `Resolution: ${selectedResolution} (1080×1920 target)`, pass: selectedResolution === '1080x1920' },
                ] : [
                  { label: 'Post text available', pass: Boolean(normalizeText(`${editingTitle} ${script?.quote ?? ''}`)) },
                ]),
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
                  value: editingHook ? `${countWords(editingHook)} words` : 'Missing',
                  color: 'text-amber-400',
                  pass: countWords(editingHook) >= 5 && countWords(editingHook) <= 20,
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
                  <select
                    value={selectedAudioSampleRate}
                    onChange={(e) => setSelectedAudioSampleRate(e.target.value as any)}
                    className="bg-[#121215] border border-[#2A2A30] rounded-lg px-2 py-1 text-white text-xs outline-none"
                  >
                    <option value="24000">24 kHz (Gemini TTS)</option>
                    <option value="44100">44.1 kHz (CD Standard)</option>
                    <option value="48000">48 kHz (Broadcast Master)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[#71717A]">Bitrate:</span>
                  <select
                    value={selectedAudioBitrate}
                    onChange={(e) => setSelectedAudioBitrate(e.target.value as any)}
                    className="bg-[#121215] border border-[#2A2A30] rounded-lg px-2 py-1 text-white text-xs outline-none"
                  >
                    <option value="128">128 kbps</option>
                    <option value="192">192 kbps (Recommended)</option>
                    <option value="320">320 kbps (High Fidelity)</option>
                  </select>
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
