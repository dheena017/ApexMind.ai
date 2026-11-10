import React, { useRef, useState, useMemo } from 'react';
import { ScrollableTabs } from '@/src/shared/ui/ScrollableTabs';
import {
  Volume2,
  Bold,
  Italic,
  Minus,
  Trash2,
  Plus,
  FileText,
  ArrowLeftRight,
  Sparkles,
  Type,
  Hash,
  Play,
  Scissors,
  Download,
  Copy,
  Search,
  X,
  CheckCircle2,
} from 'lucide-react';
import { GeneratedScript, ScriptSubtitle, HookOption } from '../../types';

export interface ScriptEditorPaneProps {
  script: GeneratedScript;
  onUpdateScript: (updated: Partial<GeneratedScript>) => void;
  onSwitchToAgent?: () => void;
  onStartNewVideo?: () => void;
  currentTime?: number;
  onSeek?: (timeSec: number) => void;
  timelineDuration?: number;
}

function formatTimecode(seconds: number): string {
  const s = Math.max(0, seconds);
  const mins = Math.floor(s / 60);
  const secs = (s % 60).toFixed(1);
  return `${mins.toString().padStart(2, '0')}:${Number(secs) < 10 ? '0' : ''}${secs}`;
}

function formatSRTTime(seconds: number): string {
  const s = Math.max(0, seconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 1000);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

export const ScriptEditorPane: React.FC<ScriptEditorPaneProps> = ({
  script,
  onUpdateScript,
  onSwitchToAgent,
  onStartNewVideo,
  currentTime = 0,
  onSeek,
  timelineDuration = 30,
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'subtitles'>('content');
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [activePlayingKey, setActivePlayingKey] = useState<string | null>(null);

  const hookRef = useRef<HTMLTextAreaElement | null>(null);
  const quoteRef = useRef<HTMLTextAreaElement | null>(null);

  const updateField = (field: keyof GeneratedScript, value: any) => {
    onUpdateScript({ [field]: value });
  };

  const showTemporaryNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2500);
  };

  const formatSelection = (field: 'hook' | 'quote', style: 'bold' | 'italic' | 'caps') => {
    const ref = field === 'hook' ? hookRef : quoteRef;
    const current = (field === 'hook' ? script.hook : script.quote) || '';
    if (!ref.current) return;

    const { selectionStart, selectionEnd } = ref.current;
    const selectedValue = current.slice(selectionStart, selectionEnd) || current;

    let modified = selectedValue;
    if (style === 'bold') modified = `**${selectedValue}**`;
    if (style === 'italic') modified = `*${selectedValue}*`;
    if (style === 'caps') modified = selectedValue.toUpperCase();

    const nextValue =
      selectionStart === selectionEnd
        ? modified
        : current.slice(0, selectionStart) + modified + current.slice(selectionEnd);

    updateField(field, nextValue);
  };

  const playTextPreview = (text: string, rate: number = 1.0, key?: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    if (key && activePlayingKey === key) {
      setActivePlayingKey(null);
      return;
    }

    if (!text?.trim()) return;

    const cleanText = text.replace(/[*_#]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = rate;
    utterance.pitch = 0.95;

    if (key) {
      setActivePlayingKey(key);
      utterance.onend = () => setActivePlayingKey(null);
      utterance.onerror = () => setActivePlayingKey(null);
    }

    window.speechSynthesis.speak(utterance);
  };

  // ── Subtitle Cue Operations ──
  const handleUpdateSubtitle = (index: number, updated: Partial<ScriptSubtitle>) => {
    const subs = [...(script.subtitles || [])];
    subs[index] = { ...subs[index], ...updated };
    updateField('subtitles', subs);
  };

  const handleAddSubtitle = (afterIndex?: number) => {
    const subs = [...(script.subtitles || [])];
    if (afterIndex !== undefined && afterIndex >= 0 && afterIndex < subs.length) {
      const prev = subs[afterIndex];
      const start = Number((prev.start + prev.duration).toFixed(1));
      const newCue: ScriptSubtitle = {
        text: 'New subtitle cue...',
        start,
        duration: 2.0,
      };
      subs.splice(afterIndex + 1, 0, newCue);
    } else {
      const lastSub = subs[subs.length - 1];
      const start = lastSub ? Number((lastSub.start + lastSub.duration).toFixed(1)) : 0;
      subs.push({
        text: 'New subtitle cue...',
        start,
        duration: 2.0,
      });
    }
    updateField('subtitles', subs);
    showTemporaryNotice('Added new subtitle cue');
  };

  const handleDeleteSubtitle = (index: number) => {
    const subs = (script.subtitles || []).filter((_, i) => i !== index);
    updateField('subtitles', subs);
    showTemporaryNotice('Deleted subtitle cue');
  };

  const handleSplitSubtitle = (index: number) => {
    const subs = [...(script.subtitles || [])];
    const target = subs[index];
    if (!target) return;

    const words = target.text.trim().split(/\s+/).filter(Boolean);
    if (words.length <= 1) {
      showTemporaryNotice('Cue too short to split');
      return;
    }

    const mid = Math.ceil(words.length / 2);
    const firstPart = words.slice(0, mid).join(' ');
    const secondPart = words.slice(mid).join(' ');
    const halfDuration = Number((target.duration / 2).toFixed(1));

    const cue1: ScriptSubtitle = {
      ...target,
      text: firstPart,
      duration: halfDuration,
    };
    const cue2: ScriptSubtitle = {
      text: secondPart,
      start: Number((target.start + halfDuration).toFixed(1)),
      duration: halfDuration,
    };

    subs.splice(index, 1, cue1, cue2);
    updateField('subtitles', subs);
    showTemporaryNotice('Split into 2 cues');
  };

  const autoRebalanceTimings = (targetDurationSec: number) => {
    const subs = script.subtitles || [];
    if (subs.length === 0) return;
    const durationPerCue = Number((targetDurationSec / subs.length).toFixed(1));
    const rebalanced = subs.map((s, idx) => ({
      ...s,
      start: Number((idx * durationPerCue).toFixed(1)),
      duration: durationPerCue,
    }));
    updateField('subtitles', rebalanced);
    showTemporaryNotice(`Rebalanced cues evenly over ${targetDurationSec}s`);
  };

  // Convert Script Hook, Quote & CTA into natural short-form subtitle cues
  const handleGenerateCuesFromScript = () => {
    const fullText = [script.hook, script.quote, script.cta]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (!fullText) {
      showTemporaryNotice('Please write some script content first');
      return;
    }

    // Split text into chunks of ~4 to 6 words
    const words = fullText.split(/\s+/).filter(Boolean);
    const chunkSize = 5;
    const chunks: string[] = [];

    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(' '));
    }

    const targetSec = timelineDuration > 0 ? timelineDuration : 30;
    const durationPerChunk = Number((targetSec / chunks.length).toFixed(1));

    const newCues: ScriptSubtitle[] = chunks.map((chunk, idx) => ({
      text: chunk,
      start: Number((idx * durationPerChunk).toFixed(1)),
      duration: durationPerChunk,
    }));

    updateField('subtitles', newCues);
    showTemporaryNotice(`Generated ${newCues.length} subtitle cues from script!`);
  };

  // Export an SRT file for YouTube Shorts, Reels, or other short-form platforms
  const handleExportSRT = () => {
    const subs = script.subtitles || [];
    if (subs.length === 0) {
      showTemporaryNotice('No subtitle cues to export');
      return;
    }

    const srtContent = subs
      .map((s, i) => {
        const start = formatSRTTime(s.start);
        const end = formatSRTTime(s.start + s.duration);
        return `${i + 1}\n${start} --> ${end}\n${s.text}\n`;
      })
      .join('\n');

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(script.title || 'video_subtitles').replace(/[^a-zA-Z0-9_-]/g, '_')}.srt`;
    a.click();
    URL.revokeObjectURL(url);
    showTemporaryNotice('Downloaded subtitles as .SRT');
  };

  // Copy complete transcript to clipboard
  const handleCopyTranscript = () => {
    const subs = script.subtitles || [];
    if (subs.length === 0) return;
    const fullTranscript = subs.map((s) => s.text).join(' ');
    navigator.clipboard?.writeText(fullTranscript);
    showTemporaryNotice('Copied full transcript to clipboard');
  };

  // Copy hashtags
  const handleCopyHashtags = () => {
    const tags = (script.hashtags || []).length > 0
      ? script.hashtags.join(' ')
      : '#Shorts #Viral #Trending';
    navigator.clipboard?.writeText(tags);
    showTemporaryNotice('Copied hashtags to clipboard');
  };

  const totalWords = [script.hook, script.quote, script.cta]
    .filter(Boolean)
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const estimatedSpeechSeconds = Math.round((totalWords / 150) * 60);

  // Filter cues by search term
  const filteredSubtitles = useMemo(() => {
    const subs = script.subtitles || [];
    if (!searchQuery.trim()) return subs;
    const q = searchQuery.toLowerCase();
    return subs.filter((s) => s.text.toLowerCase().includes(q));
  }, [script.subtitles, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-[#121215] text-[#E5E5E5] font-sans-studio select-none overflow-hidden rounded-none border-0">
      
      {/* ── Top Header Bar ── */}
      <div className="relative h-11 px-3.5 bg-[#141418] border-b border-[#24242A] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 shrink-0 text-[#3B82F6]" />
          <span className="text-xs font-bold text-white tracking-tight truncate">
            Script &amp; Subtitles
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {onStartNewVideo && (
            <button
              type="button"
              onClick={onStartNewVideo}
              className="h-7 px-2.5 rounded-lg bg-[#18181C] hover:bg-[#202026] text-[11px] font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer border border-[#27272A] flex items-center gap-1 shadow-xs"
              title="Start a new script from scratch"
            >
              <Plus className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span className="hidden sm:inline">New</span>
            </button>
          )}

          {/* Studio Mode Switcher Button */}
          {onSwitchToAgent && (
            <button
              type="button"
              onClick={onSwitchToAgent}
              className="h-7 flex items-center gap-1.5 px-2.5 rounded-lg bg-[#1E1E24] hover:bg-[#26262E] text-[11px] font-medium text-zinc-300 hover:text-white transition-all cursor-pointer border border-[#2A2A32] shadow-xs group"
              title="Click to switch to AI Prompt Studio"
            >
              <FileText className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span className="truncate">Script Editor</span>
              <ArrowLeftRight className="w-3 h-3 text-zinc-500 group-hover:text-white transition-colors" />
            </button>
          )}
        </div>
      </div>

      {/* ── Subtabs Segmented Control (Standardized ScrollableTabs) ── */}
      <div className="p-2.5 bg-[#121215] border-b border-[#24242A] shrink-0">
        <ScrollableTabs
          tabs={[
            { id: 'content', label: 'Script Content', icon: FileText },
            { id: 'subtitles', label: 'Subtitles', icon: Type, badge: script.subtitles?.length || 0 },
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab)}
          containerBgClassName="bg-[#18181C]"
        />
      </div>

      {/* Floating Notice Toast */}
      {notice && (
        <div className="mx-3.5 mt-2 p-2 rounded-lg bg-[#18181C] border border-[#3B82F6]/40 text-[#93C5FD] text-xs flex items-center gap-1.5 shadow-md shrink-0 animate-fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* ── Main Content Area ── */}
      <div className="workspace-script-editor-content flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-4">
        
        {/*
            TAB 1: SCRIPT CONTENT
        */}
        {activeTab === 'content' && (
          <div className="space-y-4">

            {/* Quick Metrics Header Strip */}
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#141418] border border-[#24242A] text-center">
              <div className="flex flex-col">
                <span className="text-[9px] font-mono-studio uppercase text-[#9CA3AF]">Words</span>
                <span className="text-xs font-bold text-white font-mono">{totalWords}</span>
              </div>
              <div className="flex flex-col border-x border-[#24242A]">
                <span className="text-[9px] font-mono-studio uppercase text-[#9CA3AF]">Voice Time</span>
                <span className="text-xs font-bold text-white font-mono">
                  {totalWords ? `~${estimatedSpeechSeconds}s` : '--'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-mono-studio uppercase text-[#9CA3AF]">Video Length</span>
                <span className="text-xs font-bold text-[#60A5FA] font-mono">{Math.round(timelineDuration || 30)}s</span>
              </div>
            </div>

            {/* Reel Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono-studio">
                <span className="text-[#9CA3AF] uppercase font-semibold">Reel Title</span>
                <span className="text-zinc-500 text-[9px] font-mono">
                  {(script.title || '').length} / 70
                </span>
              </div>
              <input
                type="text"
                value={script.title || ''}
                maxLength={70}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Add a title for this video"
                className="w-full bg-[#16161A] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 transition-all placeholder:text-zinc-600"
              />
            </div>

            {/* Hook Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white tracking-tight">Hook (First 3 Seconds)</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Format Toolbar */}
                  <div className="flex items-center bg-[#18181C] rounded-lg border border-[#27272A] p-0.5">
                    <button
                      type="button"
                      onClick={() => formatSelection('hook', 'bold')}
                      className="p-1 rounded hover:bg-[#24242A] text-zinc-400 hover:text-white transition-colors"
                      title="Bold"
                    >
                      <Bold className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => formatSelection('hook', 'italic')}
                      className="p-1 rounded hover:bg-[#24242A] text-zinc-400 hover:text-white transition-colors"
                      title="Italic"
                    >
                      <Italic className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => formatSelection('hook', 'caps')}
                      className="px-1.5 py-0.5 text-[9px] font-bold rounded hover:bg-[#24242A] text-zinc-400 hover:text-white transition-colors"
                      title="Uppercase"
                    >
                      CAPS
                    </button>
                  </div>

                  {/* Audition Button */}
                  <button
                    type="button"
                    onClick={() => playTextPreview(script.hook || '', 1.05, 'hook')}
                    className={`h-6 px-2 rounded-lg text-[10px] font-medium transition-colors border flex items-center gap-1 cursor-pointer ${
                      activePlayingKey === 'hook'
                        ? 'bg-[#2563EB] text-white border-[#3B82F6]'
                        : 'bg-[#18181C] hover:bg-[#202026] text-zinc-300 hover:text-white border-[#27272A]'
                    }`}
                    title="Audition TTS voice preview"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>{activePlayingKey === 'hook' ? 'Stop' : 'Audition'}</span>
                  </button>
                </div>
              </div>

              {/* AI Multi-Hook Variation Selector (Styled with Website Theme) */}
              {script.hooks && script.hooks.length > 0 && (
                <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-[#141418] border border-[#24242A]">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-[#3B82F6]" />
                      <span>AI Hook Variations</span>
                      <span className="px-1.5 py-0.2 rounded bg-[#18181C] text-zinc-400 font-mono text-[9px] border border-[#27272A]">
                        {script.hooks.length}
                      </span>
                    </span>
                    <span className="text-zinc-500 text-[9px]">Click to apply</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {script.hooks.map((h: HookOption, hIdx: number) => {
                      const isSelected = script.hook?.trim() === h.text?.trim();
                      return (
                        <button
                          key={h.id || hIdx}
                          type="button"
                          onClick={() => {
                            updateField('hook', h.text);
                            if (script.subtitles && script.subtitles.length > 0) {
                              const updatedSubs = [...script.subtitles];
                              updatedSubs[0] = { ...updatedSubs[0], text: h.text };
                              onUpdateScript({ hook: h.text, subtitles: updatedSubs });
                            }
                            showTemporaryNotice(`Applied "${h.angle}" hook`);
                          }}
                          className={`text-left p-2.5 rounded-xl text-xs transition-all flex flex-col gap-1 border cursor-pointer ${
                            isSelected
                              ? 'bg-[#1E2538] border-[#3B82F6] text-white shadow-xs'
                              : 'bg-[#16161A] border-[#24242A] text-zinc-300 hover:border-[#383842] hover:bg-[#1A1A20]'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[9px] font-mono-studio">
                            <span className={isSelected ? 'text-[#60A5FA] font-bold' : 'text-zinc-400 font-semibold'}>
                              {h.angle}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-[#121215] text-zinc-300 border border-[#27272A] font-mono">
                              Virality: {h.viralityScore}%
                            </span>
                          </div>
                          <span className="text-[11px] leading-relaxed line-clamp-2">
                            {h.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Hook Textarea */}
              <div className="relative">
                <textarea
                  ref={hookRef}
                  value={script.hook || ''}
                  onChange={(e) => updateField('hook', e.target.value)}
                  rows={2}
                  placeholder="The opening line that stops the scroll in the first 3 seconds..."
                  className="w-full bg-[#16161A] border border-[#27272A] rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 resize-none font-medium leading-relaxed transition-all"
                />
              </div>
            </div>

            {/* Core Body / Quote */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white tracking-tight">Body &amp; Core Insight</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="flex items-center bg-[#18181C] rounded-lg border border-[#27272A] p-0.5">
                    <button
                      type="button"
                      onClick={() => formatSelection('quote', 'bold')}
                      className="p-1 rounded hover:bg-[#24242A] text-zinc-400 hover:text-white transition-colors"
                      title="Bold"
                    >
                      <Bold className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => formatSelection('quote', 'italic')}
                      className="p-1 rounded hover:bg-[#24242A] text-zinc-400 hover:text-white transition-colors"
                      title="Italic"
                    >
                      <Italic className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => formatSelection('quote', 'caps')}
                      className="px-1.5 py-0.5 text-[9px] font-bold rounded hover:bg-[#24242A] text-zinc-400 hover:text-white transition-colors"
                      title="Uppercase"
                    >
                      CAPS
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => playTextPreview(script.quote || '', 0.95, 'quote')}
                    className={`h-6 px-2 rounded-lg text-[10px] font-medium transition-colors border flex items-center gap-1 cursor-pointer ${
                      activePlayingKey === 'quote'
                        ? 'bg-[#2563EB] text-white border-[#3B82F6]'
                        : 'bg-[#18181C] hover:bg-[#202026] text-zinc-300 hover:text-white border-[#27272A]'
                    }`}
                    title="Audition TTS voice preview"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>{activePlayingKey === 'quote' ? 'Stop' : 'Audition'}</span>
                  </button>
                </div>
              </div>

              <textarea
                ref={quoteRef}
                value={script.quote || ''}
                onChange={(e) => updateField('quote', e.target.value)}
                rows={4}
                placeholder="The core philosophical lesson, narrative breakdown, or actionable insight..."
                className="w-full bg-[#16161A] border border-[#27272A] rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 resize-none leading-relaxed transition-all"
              />
            </div>

            {/* Call to Action */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white tracking-tight">Call to Action (CTA)</span>
                </div>

                <button
                  type="button"
                  onClick={() => playTextPreview(script.cta || '', 1.0, 'cta')}
                  className={`h-6 px-2 rounded-lg text-[10px] font-medium transition-colors border flex items-center gap-1 cursor-pointer ${
                    activePlayingKey === 'cta'
                      ? 'bg-[#2563EB] text-white border-[#3B82F6]'
                      : 'bg-[#18181C] hover:bg-[#202026] text-zinc-300 hover:text-white border-[#27272A]'
                  }`}
                  title="Audition TTS voice preview"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>{activePlayingKey === 'cta' ? 'Stop' : 'Audition'}</span>
                </button>
              </div>

              <input
                type="text"
                value={script.cta || ''}
                onChange={(e) => updateField('cta', e.target.value)}
                placeholder="e.g. Subscribe for daily principles • Share with someone who needs this"
                className="w-full bg-[#16161A] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 transition-all"
              />
            </div>

            {/* Hashtags Strip */}
            <div className="p-3 rounded-xl bg-[#141418] border border-[#24242A] space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Hash className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>Hashtags</span>
                  <span className="text-[10px] font-normal text-zinc-500">
                    {(script.hashtags || []).length || 5}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyHashtags}
                  className="px-2.5 py-1.5 rounded-lg bg-[#18181C] hover:bg-[#202026] text-zinc-300 hover:text-white border border-[#27272A] text-[10px] font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Copy hashtags"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {((script.hashtags && script.hashtags.length > 0)
                  ? script.hashtags.slice(0, 5)
                  : ['#Shorts', '#Viral', '#Trending', '#Reels', '#Video']
                ).map((tag, tIdx) => (
                  <span
                    key={tIdx}
                    className="px-2 py-1 rounded-md bg-[#18181C] border border-[#27272A] text-[10px] text-zinc-300 font-mono"
                  >
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            </div>

            {/* AI Scene Plan / Storyboard Breakdown (if present) */}
            {(script.shotPacing || script.transitionStyle || script.subtitleMotion || script.textAnimation || script.cameraMovement || script.sceneStructure) && (
              <div className="p-3 rounded-xl bg-[#141418] border border-[#24242A] space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span className="text-xs font-bold text-white tracking-tight">AI Scene Plan</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {script.shotPacing && (
                    <div className="p-2 rounded-lg bg-[#18181C] border border-[#27272A]">
                      <div className="text-[9px] font-mono uppercase text-[#9CA3AF] mb-0.5">Shot Pacing</div>
                      <div className="text-zinc-200 truncate">{script.shotPacing}</div>
                    </div>
                  )}

                  {script.transitionStyle && (
                    <div className="p-2 rounded-lg bg-[#18181C] border border-[#27272A]">
                      <div className="text-[9px] font-mono uppercase text-[#9CA3AF] mb-0.5">Transition</div>
                      <div className="text-zinc-200 truncate">{script.transitionStyle}</div>
                    </div>
                  )}

                  {script.subtitleMotion && (
                    <div className="p-2 rounded-lg bg-[#18181C] border border-[#27272A]">
                      <div className="text-[9px] font-mono uppercase text-[#9CA3AF] mb-0.5">Caption Motion</div>
                      <div className="text-zinc-200 truncate">{script.subtitleMotion}</div>
                    </div>
                  )}

                  {script.cameraMovement && (
                    <div className="p-2 rounded-lg bg-[#18181C] border border-[#27272A]">
                      <div className="text-[9px] font-mono uppercase text-[#9CA3AF] mb-0.5">Camera</div>
                      <div className="text-zinc-200 truncate">{script.cameraMovement}</div>
                    </div>
                  )}
                </div>
              </div>
            )}


          </div>
        )}

        {/*
            TAB 2: SUBTITLES (COMPLETELY OVERHAULED UI & UX)
        */}
        {activeTab === 'subtitles' && (
          <div className="space-y-3.5">
            
            {/* ── Subtitle Control Bar ── */}
            <div className="p-3 rounded-2xl bg-[#141418] border border-[#24242A] space-y-3 shadow-sm">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Timeline Subtitles
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#18181C] text-[#60A5FA] border border-[#27272A]">
                    {script.subtitles?.length || 0} Cues
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Auto-Fit / Rebalance to Timeline Duration */}
                  <button
                    type="button"
                    onClick={() => autoRebalanceTimings(Math.round(timelineDuration || 30))}
                    className="px-2.5 py-1 rounded-lg bg-[#18181C] hover:bg-[#202026] border border-[#27272A] hover:border-[#383842] text-[10px] font-medium text-zinc-300 hover:text-white transition-all cursor-pointer shadow-xs"
                    title={`Evenly distribute timings over active video duration (${Math.round(timelineDuration || 30)}s)`}
                  >
                    <span>Auto-Fit {Math.round(timelineDuration || 30)}s</span>
                  </button>

                  {/* Add Cue Button */}
                  <button
                    type="button"
                    onClick={() => handleAddSubtitle()}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[10px] font-bold cursor-pointer shadow-xs transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Cue</span>
                  </button>
                </div>
              </div>

              {/* Search / Filter Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter or search subtitle cues..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-[#16161A] border border-[#27272A] text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#3B82F6] transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2 text-zinc-500 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* ── Subtitle Cues List ── */}
            {filteredSubtitles.length === 0 ? (
              <div className="bg-[#141418] border border-dashed border-[#24242A] rounded-2xl p-8 text-center space-y-3">
                <Type className="w-8 h-8 text-zinc-600 mx-auto" />
                <div className="text-xs text-zinc-400">
                  {searchQuery ? `No subtitle cues match "${searchQuery}"` : 'No subtitle cues generated yet.'}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateCuesFromScript}
                    className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Cues from Script</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredSubtitles.map((sub, idx) => {
                  const origIdx = (script.subtitles || []).indexOf(sub);
                  const wordCount = sub.text.trim().split(/\s+/).filter(Boolean).length;
                  const endTime = Number((sub.start + sub.duration).toFixed(1));

                  return (
                    <div
                      key={idx}
                      className="group p-3 rounded-xl transition-colors border bg-[#141418] border-[#24242A] hover:border-[#383842]"
                    >
                      {/* Top Bar of Cue Card */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        {/* Cue Index & Formatted Timecode */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#18181C] text-[#60A5FA] border border-[#27272A]">
                            #{origIdx + 1}
                          </span>

                          <span className="text-[11px] font-mono text-zinc-300">
                            {formatTimecode(sub.start)} → {formatTimecode(endTime)}
                          </span>
                        </div>

                        {/* Cue Actions */}
                        <div className="flex items-center gap-1">
                          {/* Playhead Seek to this Cue */}
                          {onSeek && (
                            <button
                              type="button"
                              onClick={() => onSeek(sub.start)}
                              aria-label={`Seek to subtitle cue ${origIdx + 1}`}
                              className="w-8 h-8 rounded-lg bg-[#18181C] hover:bg-[#222228] text-zinc-400 hover:text-white transition-colors cursor-pointer border border-[#27272A] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/60"
                              title="Seek playhead to this cue"
                            >
                              <Play className="w-3.5 h-3.5 text-[#3B82F6]" />
                            </button>
                          )}

                          {/* Split Cue */}
                          <button
                            type="button"
                            onClick={() => handleSplitSubtitle(origIdx)}
                            aria-label={`Split subtitle cue ${origIdx + 1}`}
                            className="w-8 h-8 rounded-lg bg-[#18181C] hover:bg-[#222228] text-zinc-400 hover:text-white transition-colors cursor-pointer border border-[#27272A] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/60"
                            title="Split cue in half"
                          >
                            <Scissors className="w-3.5 h-3.5 text-zinc-400" />
                          </button>

                          {/* Add Cue After */}
                          <button
                            type="button"
                            onClick={() => handleAddSubtitle(origIdx)}
                            aria-label={`Insert cue after subtitle ${origIdx + 1}`}
                            className="w-8 h-8 rounded-lg bg-[#18181C] hover:bg-[#222228] text-zinc-400 hover:text-white transition-colors cursor-pointer border border-[#27272A] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/60"
                            title="Insert cue after this"
                          >
                            <Plus className="w-3.5 h-3.5 text-[#3B82F6]" />
                          </button>

                          {/* Delete Cue */}
                          <button
                            type="button"
                            onClick={() => handleDeleteSubtitle(origIdx)}
                            aria-label={`Delete subtitle cue ${origIdx + 1}`}
                            className="w-8 h-8 rounded-lg bg-[#18181C] hover:bg-red-950/40 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer border border-[#27272A] hover:border-red-900/50 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
                            title="Delete this cue"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Subtitle Cue Text Input */}
                      <input
                        type="text"
                        value={sub.text}
                        onChange={(e) => handleUpdateSubtitle(origIdx, { text: e.target.value })}
                        aria-label={`Text for subtitle cue ${origIdx + 1}`}
                        className="w-full bg-[#18181C] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 transition-all font-medium"
                        placeholder="Subtitle cue line..."
                      />

                      {/* Bottom Micro-Adjusters & Word Count */}
                      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-[#24242A]/60 text-[10px] font-mono">
                        <div className="flex items-center gap-2">
                          {/* Start Time Stepper */}
                          <div className="flex items-center gap-1">
                            <span className="text-[#9CA3AF]">Start:</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateSubtitle(origIdx, {
                                  start: Math.max(0, Number((sub.start - 0.1).toFixed(1))),
                                })
                              }
                              aria-label={`Move subtitle cue ${origIdx + 1} start earlier by 0.1 seconds`}
                              className="w-7 h-7 rounded-lg bg-[#18181C] hover:bg-[#202026] text-zinc-300 cursor-pointer border border-[#27272A] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/60"
                              title="-0.1s"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-white font-bold w-9 text-center">{sub.start.toFixed(1)}s</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateSubtitle(origIdx, {
                                  start: Number((sub.start + 0.1).toFixed(1)),
                                })
                              }
                              aria-label={`Move subtitle cue ${origIdx + 1} start later by 0.1 seconds`}
                              className="w-7 h-7 rounded-lg bg-[#18181C] hover:bg-[#202026] text-zinc-300 cursor-pointer border border-[#27272A] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/60"
                              title="+0.1s"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Duration Stepper */}
                          <div className="flex items-center gap-1">
                            <span className="text-[#9CA3AF]">Dur:</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateSubtitle(origIdx, {
                                  duration: Math.max(0.5, Number((sub.duration - 0.1).toFixed(1))),
                                })
                              }
                              aria-label={`Shorten subtitle cue ${origIdx + 1} by 0.1 seconds`}
                              className="w-7 h-7 rounded-lg bg-[#18181C] hover:bg-[#202026] text-zinc-300 cursor-pointer border border-[#27272A] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/60"
                              title="-0.1s"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-white font-bold w-9 text-center">{sub.duration.toFixed(1)}s</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateSubtitle(origIdx, {
                                  duration: Number((sub.duration + 0.1).toFixed(1)),
                                })
                              }
                              aria-label={`Lengthen subtitle cue ${origIdx + 1} by 0.1 seconds`}
                              className="w-7 h-7 rounded-lg bg-[#18181C] hover:bg-[#202026] text-zinc-300 cursor-pointer border border-[#27272A] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/60"
                              title="+0.1s"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Words count */}
                        <div className="text-[9px] text-zinc-500">
                          {wordCount} {wordCount === 1 ? 'word' : 'words'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Subtitles Footer Utility Bar ── */}
            <div className="p-3 rounded-xl bg-[#141418] border border-[#24242A] flex items-center justify-between text-xs gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportSRT}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181C] hover:bg-[#202026] border border-[#27272A] hover:border-[#383842] text-[11px] font-medium text-zinc-200 hover:text-white transition-colors cursor-pointer shadow-xs"
                  title="Download .SRT caption file"
                >
                  <Download className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>Export .SRT</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyTranscript}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181C] hover:bg-[#202026] border border-[#27272A] hover:border-[#383842] text-[11px] font-medium text-zinc-200 hover:text-white transition-colors cursor-pointer shadow-xs"
                  title="Copy all subtitles as continuous text"
                >
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Copy Text</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Clear all subtitle cues?')) {
                    updateField('subtitles', []);
                    showTemporaryNotice('Cleared all subtitles');
                  }
                }}
                className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScriptEditorPane;
