import React, { useRef, useState } from 'react';
import {
  Volume2,
  Edit2,
  Bold,
  Italic,
  Trash2,
  RefreshCw,
  Wand2,
  Plus,
  Copy,
  Check,
  FileText,
  ChevronDown,
  Download,
  Clock,
  Sparkles,
  Type,
  AlignLeft,
} from 'lucide-react';
import { GeneratedScript, ScriptSubtitle } from '../../types';

export interface ScriptEditorPaneProps {
  script: GeneratedScript;
  onUpdateScript: (updated: Partial<GeneratedScript>) => void;
  onSwitchToAgent?: () => void;
  onStartNewVideo?: () => void;
}

export const ScriptEditorPane: React.FC<ScriptEditorPaneProps> = ({
  script,
  onUpdateScript,
  onSwitchToAgent,
  onStartNewVideo,
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'subtitles' | 'export'>('content');
  const [copyState, setCopyState] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const hookRef = useRef<HTMLTextAreaElement | null>(null);
  const quoteRef = useRef<HTMLTextAreaElement | null>(null);

  const updateField = (field: keyof GeneratedScript, value: any) => {
    onUpdateScript({ [field]: value });
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

  const playTextPreview = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  // Subtitle management
  const handleUpdateSubtitle = (index: number, updated: Partial<ScriptSubtitle>) => {
    const subs = [...(script.subtitles || [])];
    subs[index] = { ...subs[index], ...updated };
    updateField('subtitles', subs);
  };

  const handleAddSubtitle = () => {
    const subs = [...(script.subtitles || [])];
    const lastSub = subs[subs.length - 1];
    const start = lastSub ? lastSub.start + lastSub.duration : 0;
    subs.push({
      text: 'New subtitle cue...',
      start: Number(start.toFixed(1)),
      duration: 2.0,
    });
    updateField('subtitles', subs);
  };

  const handleDeleteSubtitle = (index: number) => {
    const subs = (script.subtitles || []).filter((_, i) => i !== index);
    updateField('subtitles', subs);
  };

  // Export generators
  const generateSrt = (): string => {
    const subs = script.subtitles || [];
    return subs
      .map((sub, idx) => {
        const startSec = sub.start;
        const endSec = sub.start + sub.duration;
        const formatTime = (sec: number) => {
          const h = Math.floor(sec / 3600);
          const m = Math.floor((sec % 3600) / 60);
          const s = Math.floor(sec % 60);
          const ms = Math.floor((sec % 1) * 1000);
          return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
        };
        return `${idx + 1}\n${formatTime(startSec)} --> ${formatTime(endSec)}\n${sub.text}\n`;
      })
      .join('\n');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalWords = [script.hook, script.quote, script.cta]
    .filter(Boolean)
    .join(' ')
    .trim()
    .split(/\s+/).filter(Boolean).length;

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none overflow-hidden rounded-2xl border border-[#26262B]">
      {/* ── Top Header Bar (Matching Right Inspector Pane) ── */}
      <div className="relative px-3 py-2 bg-[#17171A] border-b border-[#26262B] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="text-xs font-bold text-white truncate">
            Script &amp; Subtitles
          </span>
          <span className="text-[9px] font-mono-studio px-1.5 py-0.2 rounded bg-white/10 text-white/80 border border-white/15 shrink-0 uppercase font-bold">
            {totalWords} WORDS
          </span>
        </div>

        {/* Right Actions: New & Switch */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onStartNewVideo && (
            <button
              type="button"
              onClick={onStartNewVideo}
              className="px-2 py-1 rounded-md bg-[#222226] hover:bg-[#2C2C32] text-[11px] font-medium text-white transition-colors cursor-pointer border border-[#323238] flex items-center gap-1"
              title="Start a new script from scratch"
            >
              <Plus className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">New</span>
            </button>
          )}

          {/* Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#26262B] hover:bg-[#303036] text-[11px] font-semibold text-white transition-colors cursor-pointer border border-[#36363D]"
            >
              <span className="truncate">Script Editor</span>
              <ChevronDown className="w-3 h-3 text-[#A1A1AA]" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-[#1C1C20] border border-[#2A2A30] shadow-xl p-1 z-40 flex flex-col gap-0.5">
                  {onSwitchToAgent && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onSwitchToAgent();
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#A1A1AA] hover:text-white hover:bg-[#26262B] transition-colors"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      AI Prompt
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/15"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Script &amp; Subtitles
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Subtabs Header Bar ── */}
      <div className="flex items-center gap-6 px-4 pt-2.5 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'content'
              ? 'text-white border-white'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Script Content
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('subtitles')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 flex items-center gap-1.5 ${
            activeTab === 'subtitles'
              ? 'text-white border-white'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          <span>Timeline Subtitles</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
            {script.subtitles?.length || 0}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('export')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'export'
              ? 'text-white border-white'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Export &amp; SRT
        </button>
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
        {/* ── Tab 1: Script Content ── */}
        {activeTab === 'content' && (
          <div className="flex flex-col gap-3">
            {/* Reel Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-mono-studio text-[#71717A]">
                Reel Title
              </label>
              <input
                type="text"
                value={script.title || ''}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Title of this video..."
                className="w-full bg-[#1C1C20] border border-[#2A2A30] rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-[#3B82F6]"
              />
            </div>

            {/* Hook Field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono-studio">
                <span className="text-amber-400 font-bold">HOOK (FIRST 3 SECONDS)</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => formatSelection('hook', 'caps')}
                    className="px-1.5 py-0.5 rounded bg-[#2A2A32] text-zinc-300 hover:text-white"
                  >
                    CAPS
                  </button>
                  <button
                    type="button"
                    onClick={() => playTextPreview(script.hook)}
                    className="p-1 rounded bg-[#2A2A32] text-zinc-300 hover:text-white"
                    title="Audition TTS"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <textarea
                ref={hookRef}
                value={script.hook || ''}
                onChange={(e) => updateField('hook', e.target.value)}
                placeholder="The aggressive hook to stop scrolling..."
                rows={2}
                className="w-full bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500/60 resize-none font-semibold leading-relaxed"
              />
            </div>

            {/* Core Quote */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono-studio">
                <span className="text-[#60A5FA] font-bold">CORE MESSAGE &amp; QUOTE</span>
                <button
                  type="button"
                  onClick={() => playTextPreview(script.quote)}
                  className="p-1 rounded bg-[#2A2A32] text-zinc-300 hover:text-white"
                  title="Audition TTS"
                >
                  <Volume2 className="w-3 h-3" />
                </button>
              </div>
              <textarea
                ref={quoteRef}
                value={script.quote || ''}
                onChange={(e) => updateField('quote', e.target.value)}
                placeholder="The deep motivational philosophical body..."
                rows={4}
                className="w-full bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-3 text-xs text-white outline-none focus:border-[#3B82F6]/60 resize-none leading-relaxed"
              />
            </div>

            {/* Call To Action */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-mono-studio text-[#71717A]">
                Call To Action (CTA)
              </label>
              <input
                type="text"
                value={script.cta || ''}
                onChange={(e) => updateField('cta', e.target.value)}
                placeholder="e.g. Follow for daily mental mastery."
                className="w-full bg-[#1C1C20] border border-[#2A2A30] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#3B82F6]"
              />
            </div>
          </div>
        )}

        {/* ── Tab 2: Timeline Subtitles ── */}
        {activeTab === 'subtitles' && (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-studio text-[#71717A] uppercase">
                Synchronized Subtitle Cues
              </span>
              <button
                type="button"
                onClick={handleAddSubtitle}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[10px] font-bold cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Add Cue
              </button>
            </div>

            {(script.subtitles || []).length === 0 ? (
              <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-6 text-center text-xs text-[#A1A1AA]">
                No subtitle cues generated yet. Run the AI Agent or click &ldquo;Add Cue&rdquo;.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {script.subtitles.map((sub, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-[#2A2A30] bg-[#1C1C20] flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono-studio text-[#60A5FA]">
                        #{idx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[10px] font-mono-studio text-zinc-400">
                          <Clock className="w-3 h-3" />
                          <input
                            type="number"
                            step="0.1"
                            value={sub.start}
                            onChange={(e) =>
                              handleUpdateSubtitle(idx, { start: Number(e.target.value) })
                            }
                            className="w-12 bg-[#141417] border border-[#2A2A30] rounded px-1 text-center text-white"
                          />
                          <span>s +</span>
                          <input
                            type="number"
                            step="0.1"
                            value={sub.duration}
                            onChange={(e) =>
                              handleUpdateSubtitle(idx, { duration: Number(e.target.value) })
                            }
                            className="w-12 bg-[#141417] border border-[#2A2A30] rounded px-1 text-center text-white"
                          />
                          <span>s</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteSubtitle(idx)}
                          className="p-1 text-zinc-500 hover:text-rose-400"
                          title="Delete cue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={sub.text}
                      onChange={(e) => handleUpdateSubtitle(idx, { text: e.target.value })}
                      className="w-full bg-[#141417] border border-[#2A2A30] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab 3: Export & SRT ── */}
        {activeTab === 'export' && (
          <div className="flex flex-col gap-3">
            <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-4 flex flex-col gap-3">
              <span className="text-xs font-bold text-white">Subtitle &amp; Caption Export</span>
              <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                Export subtitle files compatible with Premiere Pro, CapCut, DaVinci Resolve, or YouTube Studio captions.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    downloadFile(
                      generateSrt(),
                      `${(script.title || 'subtitles').replace(/\s+/g, '_')}.srt`,
                      'text/plain'
                    )
                  }
                  className="bg-[#2A2A32] hover:bg-[#34343E] text-white rounded-xl py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 border border-[#3A3A44]"
                >
                  <Download className="w-3.5 h-3.5 text-[#60A5FA]" />
                  Download .SRT
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const fullText = `TITLE: ${script.title}\n\nHOOK: ${script.hook}\n\nQUOTE: ${script.quote}\n\nCTA: ${script.cta}\n\nTAGS: ${(script.hashtags || []).join(' ')}`;
                    navigator.clipboard.writeText(fullText);
                    setCopyState(true);
                    setTimeout(() => setCopyState(false), 1500);
                  }}
                  className="bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-[#3B82F6]/20"
                >
                  {copyState ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copyState ? 'Copied Full Script' : 'Copy Full Script'}
                </button>
              </div>
            </div>

            {/* SRT Preview Box */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-mono-studio text-[#71717A] uppercase">
                SRT Raw Code Preview
              </span>
              <pre className="w-full bg-[#141416] border border-[#26262B] rounded-xl p-3 text-[10px] font-mono text-zinc-300 max-h-48 overflow-y-auto custom-scrollbar select-text">
                {generateSrt() || 'No subtitles to render.'}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScriptEditorPane;
