import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Volume2,
  Edit2,
  Bold,
  Italic,
  Trash2,
  RefreshCw,
  Wand2,
  Plus,
  Check,
  FileText,
  ArrowLeftRight,
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
  const [activeTab, setActiveTab] = useState<'content' | 'subtitles'>('content');
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
  };

  const totalWords = [script.hook, script.quote, script.cta]
    .filter(Boolean)
    .join(' ')
    .trim()
    .split(/\s+/).filter(Boolean).length;

  const estimatedSpeechSeconds = Math.round((totalWords / 150) * 60);

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none overflow-hidden rounded-2xl border border-[#26262B]">
      {/* ── Top Header Bar (Matching Right Inspector Pane) ── */}
      <div className="relative h-11 px-3.5 bg-[#17171A] border-b border-[#26262B] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="text-xs font-bold text-white truncate">
            Script &amp; Subtitles
          </span>
        </div>

        {/* Right Actions: New & Switch */}
        <div className="flex items-center gap-2 shrink-0">
          {onStartNewVideo && (
            <button
              type="button"
              onClick={onStartNewVideo}
              className="h-7 px-2.5 rounded-md bg-[#222226] hover:bg-[#2C2C32] text-[11px] font-medium text-white transition-colors cursor-pointer border border-[#323238] flex items-center gap-1"
              title="Start a new script from scratch"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">New</span>
            </button>
          )}

          {/* Studio Mode Switcher Button */}
          {onSwitchToAgent && (
            <button
              type="button"
              onClick={onSwitchToAgent}
              className="h-7 flex items-center gap-1.5 px-2.5 rounded-md bg-[#26262B] hover:bg-[#303036] hover:border-[#42424A] text-[11px] font-semibold text-white transition-all cursor-pointer border border-[#36363D] shadow-xs group"
              title="Click to switch to AI Prompt Studio"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate">Script Editor</span>
              <ArrowLeftRight className="w-3 h-3 text-[#A1A1AA] group-hover:text-white transition-colors" />
            </button>
          )}

        </div>
      </div>

      {/* ── Subtabs Header Bar ── */}
      <div className="flex items-center gap-4 sm:gap-5 px-3.5 pt-2 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar shrink-0 bg-[#141417]">
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
          <span>Subtitles</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
            {script.subtitles?.length || 0}
          </span>
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

              {/* AI Multi-Hook Variation Selector */}
              {script.hooks && script.hooks.length > 0 && (
                <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-[#141418] border border-amber-500/20 mb-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      ⚡ AI Viral Hook Angles ({script.hooks.length})
                    </span>
                    <span className="text-zinc-500 text-[9px]">Click to apply</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {script.hooks.map((h, hIdx) => {
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
                          }}
                          className={`text-left p-2 rounded-lg text-xs transition-all flex flex-col gap-0.5 border ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500/50 text-amber-200 shadow-sm'
                              : 'bg-[#1C1C22] border-[#2A2A32] text-zinc-300 hover:border-zinc-500'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[9px] font-mono-studio">
                            <span className="text-amber-400 font-semibold">{h.angle}</span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                              Virality: {h.viralityScore}%
                            </span>
                          </div>
                          <span className="line-clamp-2 text-[11px] leading-snug">{h.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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

            {/* AI Scene Plan */}
            {(script.shotPacing || script.transitionStyle || script.subtitleMotion || script.textAnimation || script.cameraMovement || script.sceneStructure) && (
              <div className="flex flex-col gap-2.5 rounded-xl border border-[#2A2A30] bg-[#18181B] p-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#60A5FA]" />
                  <span className="text-[10px] uppercase font-mono-studio font-bold text-white">AI Scene Plan</span>
                </div>

                <div className="grid grid-cols-1 gap-2 text-[11px] text-[#E4E4E7]">
                  {script.shotPacing && (
                    <div className="rounded-lg border border-[#2A2A30] bg-[#1C1C20] p-2">
                      <div className="text-[9px] uppercase text-[#A1A1AA] mb-1">Shot pacing</div>
                      <div>{script.shotPacing}</div>
                    </div>
                  )}

                  {script.transitionStyle && (
                    <div className="rounded-lg border border-[#2A2A30] bg-[#1C1C20] p-2">
                      <div className="text-[9px] uppercase text-[#A1A1AA] mb-1">Transition style</div>
                      <div>{script.transitionStyle}</div>
                    </div>
                  )}

                  {script.subtitleMotion && (
                    <div className="rounded-lg border border-[#2A2A30] bg-[#1C1C20] p-2">
                      <div className="text-[9px] uppercase text-[#A1A1AA] mb-1">Subtitle motion</div>
                      <div>{script.subtitleMotion}</div>
                    </div>
                  )}

                  {script.textAnimation && (
                    <div className="rounded-lg border border-[#2A2A30] bg-[#1C1C20] p-2">
                      <div className="text-[9px] uppercase text-[#A1A1AA] mb-1">Text animation</div>
                      <div>{script.textAnimation}</div>
                    </div>
                  )}

                  {script.cameraMovement && (
                    <div className="rounded-lg border border-[#2A2A30] bg-[#1C1C20] p-2">
                      <div className="text-[9px] uppercase text-[#A1A1AA] mb-1">Camera movement</div>
                      <div>{script.cameraMovement}</div>
                    </div>
                  )}
                </div>

                {script.sceneStructure && (
                  <div className="rounded-lg border border-[#2A2A30] bg-[#1C1C20] p-2 flex flex-col gap-2 text-[11px] text-[#E4E4E7]">
                    <div className="text-[9px] uppercase text-[#A1A1AA]">Scene structure</div>
                    {script.sceneStructure.hookPlacement && (
                      <div><span className="text-[#A1A1AA]">Hook:</span> {script.sceneStructure.hookPlacement}</div>
                    )}
                    {script.sceneStructure.ctaTiming && (
                      <div><span className="text-[#A1A1AA]">CTA timing:</span> {script.sceneStructure.ctaTiming}</div>
                    )}
                    {script.sceneStructure.shotPlan && (
                      <div><span className="text-[#A1A1AA]">Shot plan:</span> {script.sceneStructure.shotPlan}</div>
                    )}
                    {script.sceneStructure.subtitlePriority && (
                      <div><span className="text-[#A1A1AA]">Subtitle priority:</span> {script.sceneStructure.subtitlePriority}</div>
                    )}
                    {Array.isArray(script.sceneStructure.emphasisPoints) && script.sceneStructure.emphasisPoints.length > 0 && (
                      <div>
                        <div className="text-[#A1A1AA] mb-1">Emphasis points</div>
                        <ul className="list-disc pl-4 space-y-1">
                          {script.sceneStructure.emphasisPoints.map((point, index) => (
                            <li key={`emphasis-${index}`}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Tab 2: Timeline Subtitles ── */}
        {activeTab === 'subtitles' && (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono-studio text-[#71717A] uppercase">
                  Timeline Subtitles
                </span>
                <button
                  type="button"
                  onClick={() => autoRebalanceTimings(30)}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[#60A5FA] transition-colors"
                  title="Auto-distribute cues evenly over 30s"
                >
                  Auto-Align 30s
                </button>
              </div>
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
                No subtitle cues generated yet. Click &ldquo;Add Cue&rdquo; to start.
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
      </div>
    </div>
  );
};

export default ScriptEditorPane;
