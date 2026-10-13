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
} from 'lucide-react';
import { GeneratedScript } from '../../types';

export interface ScriptEditorPaneProps {
  script: GeneratedScript;
  onUpdateScript: (updated: Partial<GeneratedScript>) => void;
  onSwitchToAgent?: () => void;
  onStartNewVideo?: () => void;
}

interface ScriptEditorHeaderProps {
  onStartNewVideo?: () => void;
  onSwitchToAgent?: () => void;
}

interface ScriptEditorSectionProps {
  title: string;
  titleClassName?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const ScriptEditorHeader: React.FC<ScriptEditorHeaderProps> = ({
  onStartNewVideo,
  onSwitchToAgent,
}) => (
  <header className="sticky top-0 z-10 flex w-full shrink-0 items-center justify-between gap-2 rounded-xl border border-[#2F2F2F] bg-[#121212]/90 px-3 py-2.5 shadow-[0_1px_0_rgba(255,255,255,0.02)] backdrop-blur-sm">
    <div className="flex min-w-0 items-center gap-2">
      <h2 className="truncate text-sm font-bold tracking-tight text-white">Script &amp; Subtitles</h2>
    </div>

    <div className="ml-auto flex shrink-0 items-center gap-1.5">
      {onStartNewVideo && (
        <button
          type="button"
          onClick={onStartNewVideo}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-transparent p-1.5 text-xs font-semibold text-[#9CA3AF] transition-colors hover:border-[#2F2F2F] hover:bg-[#1E1E1E] hover:text-white"
          title="Start a fresh empty project"
        >
          <Plus className="h-4 w-4 text-white" />
          <span className="hidden sm:inline">New</span>
        </button>
      )}

      {onSwitchToAgent && (
        <button
          type="button"
          onClick={onSwitchToAgent}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-transparent p-1.5 text-xs font-semibold text-[#9CA3AF] transition-colors hover:border-[#2F2F2F] hover:bg-[#1E1E1E] hover:text-white"
          title="Open AI Prompt Generator"
        >
          <Wand2 className="h-4 w-4" />
          <span className="hidden sm:inline">AI Prompt</span>
        </button>
      )}
    </div>
  </header>
);

const ScriptEditorSection: React.FC<ScriptEditorSectionProps> = ({
  title,
  titleClassName = 'text-white',
  actions,
  children,
  className = '',
}) => (
  <section className={`relative overflow-hidden rounded-2xl border border-[#2F2F2F] bg-[#181818] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-all hover:border-[#4B4B4B] ${className}`}>
    <div className="flex items-center justify-between border-b border-[#2F2F2F] bg-[#151515] px-3 py-2.5">
      <div className="flex items-center">
        <span className={`text-xs font-bold uppercase tracking-wider ${titleClassName}`}>{title}</span>
      </div>
      {actions && <div className="relative flex items-center gap-2">{actions}</div>}
    </div>
    {children}
  </section>
);

export const ScriptEditorPane: React.FC<ScriptEditorPaneProps> = ({
  script,
  onUpdateScript,
  onSwitchToAgent,
  onStartNewVideo,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copyState, setCopyState] = useState(false);
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

  const renderSubtitleMenu = () => {
    const currentText = script.subtitles.map((sub) => sub.text).join('\n');
    return (
      <div className="absolute right-0 top-full z-20 mt-2 w-44 rounded-xl border border-[#2F2F2F] bg-[#111111] p-1.5 shadow-2xl">
        <button
          type="button"
          onClick={() => {
            setMenuOpen(false);
            subtitleRefs.current[0]?.focus();
          }}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] text-[#E5E5E5] hover:bg-[#1D1D1D]"
        >
          <Edit2 className="w-3.5 h-3.5 text-white" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => {
            setMenuOpen(false);
            if (currentText) playTextPreview(currentText);
          }}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] text-[#E5E5E5] hover:bg-[#1D1D1D]"
        >
          <Volume2 className="w-3.5 h-3.5 text-white" />
          Preview
        </button>
        <button
          type="button"
          onClick={() => {
            setMenuOpen(false);
            void handleCopySubtitles(currentText);
          }}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] text-[#E5E5E5] hover:bg-[#1D1D1D]"
        >
          {copyState ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
          {copyState ? 'Copied' : 'Copy'}
        </button>
        <button
          type="button"
          onClick={() => {
            setMenuOpen(false);
            onUpdateScript({ subtitles: [] });
          }}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] text-red-300 hover:bg-[#1D1D1D]"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3 font-sans-studio text-[#E5E5E5]">
      <ScriptEditorHeader
        onStartNewVideo={onStartNewVideo}
        onSwitchToAgent={onSwitchToAgent}
      />

      <div className="flex flex-col space-y-3 animate-fade-in">
        <ScriptEditorSection
          title="THE HOOK"
          titleClassName="text-white"
        >
          <div className="space-y-2 p-3">
            <textarea
              ref={hookRef}
              value={script.hook}
              onChange={(e) => updateField('hook', e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-[#262626] bg-[#0E0E0E] p-2 text-xs text-white outline-none transition-colors focus:border-[#6B7280]"
              placeholder="Enter an attention-grabbing 3-5 word hook spoken in the first 2 seconds..."
            />

          </div>
        </ScriptEditorSection>

        <ScriptEditorSection
          title="THE QUOTE"
          titleClassName="text-white"
        >
          <div className="space-y-2 p-3">
            <textarea
              ref={quoteRef}
              value={script.quote}
              onChange={(e) => updateField('quote', e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-[#262626] bg-[#0E0E0E] p-2 text-xs leading-relaxed text-white outline-none transition-colors focus:border-[#6B7280]"
              placeholder="Enter the motivational monologue / quote body..."
            />

            <div className="flex items-center justify-between border-t border-[#262626] pt-1 text-[11px] text-[#9CA3AF]">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => formatSelection('quote', 'bold')}
                  className="cursor-pointer font-bold hover:text-white"
                  title="Bold"
                >
                  <Bold className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => formatSelection('quote', 'italic')}
                  className="cursor-pointer italic hover:text-white"
                  title="Italic"
                >
                  <Italic className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => quoteRef.current?.focus()}
                  className="cursor-pointer hover:text-white"
                  title="Edit formatting"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => updateField('quote', '')}
                  className="cursor-pointer hover:text-red-400"
                  title="Clear"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              {onSwitchToAgent && (
                <button
                  type="button"
                  onClick={onSwitchToAgent}
                  className="flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-white hover:underline"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Re-generate with AI</span>
                </button>
              )}
            </div>
          </div>
        </ScriptEditorSection>

        <ScriptEditorSection
          title="SUBTITLES"
          titleClassName="text-white"
          className="flex min-h-[140px] flex-1 flex-col"
          actions={
            <>
              <button
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
                className="flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-white hover:underline"
              >
                <Edit2 className="h-3 w-3" />
                Edit
              </button>
            </>
          }
        >
          <div className="flex flex-1 flex-col space-y-1.5 overflow-y-auto p-3 pr-1 custom-scrollbar">
            {script.subtitles.length === 0 ? (
              <div className="py-6 text-center text-[11px] italic text-[#6B7280]">
                No subtitles yet. Generate a script with AI to populate this section.
              </div>
            ) : (
              script.subtitles.map((sub, idx) => (
                <div
                  key={idx}
                  className="group flex items-center justify-between gap-2 rounded-lg border border-[#262626] bg-[#0E0E0E] p-1.5 text-[11px] transition-colors hover:border-[#4B4B4B]"
                >
                  <span className="shrink-0 rounded bg-[#1A1A1A] px-1 py-0.2 font-mono-studio text-[10px] text-white">
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
                    placeholder="Enter subtitle text..."
                    className="flex-1 border-none bg-transparent text-[11px] text-white outline-none truncate"
                  />
                  <div className="flex items-center gap-1.5 text-[#6B7280] group-hover:text-[#9CA3AF]">
                    <button
                      type="button"
                      onClick={() => subtitleRefs.current[idx]?.focus()}
                      className="cursor-pointer hover:text-white"
                      aria-label={`Edit subtitle ${idx + 1}`}
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => playTextPreview(sub.text || 'Subtitle preview')}
                      className="cursor-pointer hover:text-white"
                      aria-label={`Preview subtitle ${idx + 1}`}
                    >
                      <Volume2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          {menuOpen && renderSubtitleMenu()}
        </ScriptEditorSection>
      </div>
    </div>
  );
};

export default ScriptEditorPane;
