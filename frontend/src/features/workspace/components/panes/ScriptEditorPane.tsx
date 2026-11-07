/**
 * frontend/src/features/workspace/components/panes/ScriptEditorPane.tsx
 *
 * Modular Script Editor Pane (Milestone 4).
 * Decomposed into ScriptToolbar, ScriptContentTab, SubtitleEditorTab, and SubtitleCueCard.
 */

import React, { useState } from 'react';
import {
  FileText,
  Type,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/src/shared/ui/common';
import { GeneratedScript } from '../../types';
import { ScriptToolbar } from './script-editor/components/ScriptToolbar';
import { ScriptContentTab } from './script-editor/ScriptContentTab';
import { SubtitleEditorTab } from './script-editor/SubtitleEditorTab';
import { generateCuesFromText } from '../../utils/subtitleTiming';

export interface ScriptEditorPaneProps {
  script: GeneratedScript;
  onUpdateScript: (updated: Partial<GeneratedScript>) => void;
  onSwitchToAgent?: () => void;
  onStartNewVideo?: () => void;
  currentTime?: number;
  onSeek?: (timeSec: number) => void;
  timelineDuration?: number;
  onApproveAndContinue?: () => void;
  isContinuing?: boolean;
}

export const ScriptEditorPane: React.FC<ScriptEditorPaneProps> = ({
  script,
  onUpdateScript,
  onSwitchToAgent,
  onStartNewVideo,
  currentTime: _currentTime = 0,
  onSeek,
  timelineDuration = 30,
  onApproveAndContinue,
  isContinuing = false,
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'subtitles'>('content');
  const [notice, setNotice] = useState<string | null>(null);
  const [activePlayingKey, setActivePlayingKey] = useState<string | null>(null);

  const showTemporaryNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2500);
  };

  const updateField = (field: keyof GeneratedScript, value: any) => {
    onUpdateScript({ [field]: value });
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

  const handleGenerateCuesFromScript = () => {
    const fullText = [script.hook, script.quote, script.cta]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (!fullText) {
      showTemporaryNotice('Please write some script content first');
      return;
    }

    const newCues = generateCuesFromText(fullText, timelineDuration);
    updateField('subtitles', newCues);
    showTemporaryNotice(`Generated ${newCues.length} subtitle cues from script!`);
  };

  return (
    <div className="flex flex-col h-full bg-[#121215] text-[#E5E5E5] font-sans-studio select-none overflow-hidden rounded-none border-0">
      {/* ── Top Header Toolbar ── */}
      <ScriptToolbar
        onStartNewVideo={onStartNewVideo}
        onSwitchToAgent={onSwitchToAgent}
      />

      {/* ── Subtabs Segmented Control ── */}
      <div className="p-2.5 bg-[#121215] border-b border-[#24242A] shrink-0">
        <div className="flex items-center gap-1 p-1 bg-[#18181C] rounded-xl border border-[#24242A]">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none whitespace-nowrap ${
              activeTab === 'content'
                ? 'bg-[#2563EB] text-white shadow-xs border border-[#3B82F6]/60 font-bold'
                : 'text-[#9CA3AF] hover:text-white hover:bg-[#202026] border border-transparent'
            }`}
          >
            <FileText className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'content' ? 'text-white' : 'text-zinc-500'}`} />
            <span className="truncate">Script Content</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('subtitles')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none min-w-0 ${
              activeTab === 'subtitles'
                ? 'bg-[#2563EB] text-white shadow-xs border border-[#3B82F6]/60 font-bold'
                : 'text-[#9CA3AF] hover:text-white hover:bg-[#202026] border border-transparent'
            }`}
          >
            <Type className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'subtitles' ? 'text-white' : 'text-zinc-500'}`} />
            <span className="truncate">Subtitles</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono shrink-0 transition-colors ${
                activeTab === 'subtitles'
                  ? 'bg-white/20 text-white font-bold'
                  : 'bg-[#24242A] text-zinc-400'
              }`}
            >
              {script.subtitles?.length || 0}
            </span>
          </button>
        </div>
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
        {activeTab === 'content' && (
          <ScriptContentTab
            script={script}
            timelineDuration={timelineDuration}
            activePlayingKey={activePlayingKey}
            onUpdateField={updateField}
            onPlayPreview={playTextPreview}
            onSyncToCues={() => {
              handleGenerateCuesFromScript();
              setActiveTab('subtitles');
            }}
            onShowNotice={showTemporaryNotice}
          />
        )}

        {activeTab === 'subtitles' && (
          <SubtitleEditorTab
            subtitles={script.subtitles || []}
            title={script.title}
            timelineDuration={timelineDuration}
            onUpdateSubtitles={(subs) => updateField('subtitles', subs)}
            onGenerateCuesFromScript={handleGenerateCuesFromScript}
            onSeek={onSeek}
            onShowNotice={showTemporaryNotice}
          />
        )}
      </div>

      {/* ── Action Footer: Approve & Continue (Milestones 4 & 5) ── */}
      {onApproveAndContinue && (
        <div className="px-3.5 py-2.5 border-t border-[#24242A] bg-[#141418] shrink-0 flex flex-col gap-1.5">
          <Button
            size="sm"
            onClick={onApproveAndContinue}
            disabled={isContinuing}
            className="w-full h-10 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-bold rounded-xl shadow-md active:scale-[0.99] transition-all py-2 text-xs flex items-center justify-center gap-2 cursor-pointer border border-[#60A5FA]/40"
          >
            {isContinuing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating Voiceover &amp; Video Media...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Approve Script &amp; Continue to Video</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ScriptEditorPane;
