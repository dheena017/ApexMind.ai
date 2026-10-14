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
} from 'lucide-react';
import { GeneratedScript } from '../../types';

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
  const [activeTab, setActiveTab] = useState<'content' | 'subtitles'>('content');
  const [copyState, setCopyState] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const hookRef = useRef<HTMLTextAreaElement | null>(null);
  const quoteRef = useRef<HTMLTextAreaElement | null>(null);
  const subtitleRefs = useRef<Array<HTMLInputElement | null>>([]);

  const updateField = (field: 'hook' | 'quote', value: string) => {
    onUpdateScript({ [field]: value } as Partial<GeneratedScript>);
  };

  const formatSelection = (field: 'hook' | 'quote', style: 'bold' | 'italic') => {
    const ref = field === 'hook' ? hookRef : quoteRef;
    const current = field === 'hook' ? script.hook : script.quote;
    if (!ref.current) {
      const formatted = style === 'bold' ? `**${current || 'text'}**` : `*${current || 'text'}*`;
      updateField(field, formatted);
      return;
    }

    const { selectionStart, selectionEnd } = ref.current;
    const selectedValue = current.slice(selectionStart, selectionEnd) || 'text';
    const wrapped = style === 'bold' ? `**${selectedValue}**` : `*${selectedValue}*`;
    const nextValue = current.slice(0, selectionStart) + wrapped + current.slice(selectionEnd);

    updateField(field, nextValue);

    setTimeout(() => {
      ref.current?.focus();
      const nextCursor = selectionStart + wrapped.length;
      ref.current?.setSelectionRange(nextCursor, nextCursor);
    }, 0);
  };

  const handleCopySubtitles = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState(true);
      window.setTimeout(() => setCopyState(false), 1200);
    } catch {
      setCopyState(false);
    }
  };

  const playTextPreview = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.96;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none overflow-hidden rounded-2xl">
      {/* ── Top Header Bar (Matching Right Pane) ── */}
      <div className="relative px-3 py-2 bg-[#17171A] border-b border-[#26262B] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="text-xs font-bold text-white truncate">
            Script &amp; Subtitles
          </span>
        </div>

        {/* Right Actions: New & Switch */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onStartNewVideo && (
            <button
              type="button"
              onClick={onStartNewVideo}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer border bg-[#222228] hover:bg-[#2C2C34] text-[#D4D4D8] hover:text-white border-[#32323C]"
              title="Start a fresh empty project"
            >
              <Plus className="w-3.5 h-3.5 text-sky-400" />
              <span>New</span>
            </button>
          )}

          {onSwitchToAgent && (
            <button
              type="button"
              onClick={onSwitchToAgent}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#222228] hover:bg-[#2C2C34] text-[10px] text-[#A1A1AA] hover:text-white transition-colors cursor-pointer border border-[#32323C]"
              title="Open AI Prompt Studio"
            >
              <Wand2 className="w-3.5 h-3.5 text-[#60A5FA]" />
              <span>AI Prompt</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Subtabs Header Bar (Matching Right Pane) ── */}
      <div className="flex items-center gap-6 px-4 pt-2.5 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'content' ? 'text-white border-white' : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Hook &amp; Monologue
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('subtitles')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'subtitles' ? 'text-white border-white' : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Subtitles ({script.subtitles?.length || 0})
        </button>

      </div>

      {/* ── Main Tab Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
        {activeTab === 'content' && (
          <>
            {/* The Hook */}
            <div className="flex flex-col rounded-xl border border-[#2A2A30] bg-[#1C1C20] overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#26262B] bg-[#17171A] px-3 py-2">
                <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">
                  The Hook (First 2–3s)
                </span>
                <span className="text-[9px] text-[#9CA3AF]">Attention Grabber</span>
              </div>
              <div className="p-3">
                <textarea
                  ref={hookRef}
                  value={script.hook}
                  onChange={(e) => updateField('hook', e.target.value)}
                  rows={2}
                  className="w-full resize-none bg-transparent text-xs text-white outline-none placeholder:text-[#525252] leading-relaxed"
                  placeholder="Enter an attention-grabbing 3-5 word hook..."
                />
              </div>
            </div>

            {/* The Quote / Monologue */}
            <div className="flex flex-col rounded-xl border border-[#2A2A30] bg-[#1C1C20] overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#26262B] bg-[#17171A] px-3 py-2">
                <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">
                  The Quote / Monologue Body
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => formatSelection('quote', 'bold')}
                    className="cursor-pointer text-[#9CA3AF] hover:text-white p-0.5"
                    title="Bold"
                  >
                    <Bold className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => formatSelection('quote', 'italic')}
                    className="cursor-pointer text-[#9CA3AF] hover:text-white p-0.5"
                    title="Italic"
                  >
                    <Italic className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('quote', '')}
                    className="cursor-pointer text-[#9CA3AF] hover:text-red-400 p-0.5"
                    title="Clear"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <textarea
                  ref={quoteRef}
                  value={script.quote}
                  onChange={(e) => updateField('quote', e.target.value)}
                  rows={4}
                  className="w-full resize-none bg-transparent text-xs leading-relaxed text-white outline-none placeholder:text-[#525252]"
                  placeholder="Enter the motivational monologue / quote body..."
                />
              </div>
            </div>

            {/* Call To Action */}
            <div className="flex flex-col rounded-xl border border-[#2A2A30] bg-[#1C1C20] overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#26262B] bg-[#17171A] px-3 py-2">
                <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">
                  Call to Action (CTA)
                </span>
                <span className="text-[9px] text-[#9CA3AF]">Ending Prompt</span>
              </div>
              <div className="p-3">
                <input
                  type="text"
                  value={script.cta || ''}
                  onChange={(e) => onUpdateScript({ cta: e.target.value })}
                  className="w-full bg-transparent text-xs text-white outline-none placeholder:text-[#525252]"
                  placeholder="e.g. Subscribe to ApexMind. Discipline beats motivation."
                />
              </div>
            </div>
          </>
        )}

        {activeTab === 'subtitles' && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between pb-1">
              <label className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">
                Timed Subtitle Clips
              </label>
              {script.subtitles?.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleCopySubtitles(script.subtitles.map((s) => s.text).join('\n'))}
                  className="text-[10px] text-[#60A5FA] hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copyState ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copyState ? 'Copied' : 'Copy All'}</span>
                </button>
              )}
            </div>

            {(!script.subtitles || script.subtitles.length === 0) ? (
              <div className="py-12 text-center text-xs text-[#71717A] border border-dashed border-[#2A2A30] rounded-xl p-6">
                No subtitles generated yet. Run the AI Agent to generate speech with timed captions.
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {script.subtitles.map((sub, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-[#1C1C20] border border-[#2A2A30] hover:border-[#3A3A42] transition-colors"
                  >
                    <span className="text-[10px] font-mono-studio px-1.5 py-0.5 rounded bg-white/10 text-white/80 border border-white/15 shrink-0">
                      {`00:${Math.floor(sub.start).toString().padStart(2, '0')}`}
                    </span>
                    <input
                      ref={(el) => {
                        subtitleRefs.current[idx] = el;
                      }}
                      value={sub.text}
                      onChange={(e) => {
                        const next = [...script.subtitles];
                        next[idx] = { ...sub, text: e.target.value };
                        onUpdateScript({ subtitles: next });
                      }}
                      className="flex-1 bg-transparent text-xs text-white outline-none truncate"
                    />
                    <button
                      type="button"
                      onClick={() => playTextPreview(sub.text || '')}
                      className="text-[#71717A] hover:text-white p-1 cursor-pointer"
                      title="Audio Preview"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScriptEditorPane;
