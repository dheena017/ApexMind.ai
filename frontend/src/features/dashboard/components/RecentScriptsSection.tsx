import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { RecentScriptItem } from '../types';

interface RecentScriptsSectionProps {
  scripts: RecentScriptItem[];
  onNavigate: (page: string) => void;
}

export const RecentScriptsSection: React.FC<RecentScriptsSectionProps> = ({
  scripts,
  onNavigate,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenInStudio = (script: RecentScriptItem) => {
    try {
      sessionStorage.setItem('apexmind_initial_prompt_topic', script.title);
      sessionStorage.setItem('apexmind_initial_prompt_hook', script.hook || '');
      sessionStorage.setItem('apexmind_initial_prompt_quote', script.quote);
      if (script.category) {
        sessionStorage.setItem('apexmind_initial_prompt_category', script.category);
      }
    } catch (e) {}
    onNavigate('workspace-script');
  };

  return (
    <div className="rounded-2xl bg-[#141414] border border-[#262626] p-5 sm:p-6 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#242424]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Recent AI Script Monologues
            </h3>
            <p className="text-xs text-[#8E8E93]">
              Stored quotes guaranteeing zero repetition in video exports
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('workspace-script')}
          className="text-xs font-semibold text-[#60A5FA] hover:text-[#93C5FD] flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>Script Studio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Script Items */}
      {scripts.length === 0 ? (
        <div className="text-center py-6 text-xs text-[#737373]">
          No AI scripts generated yet. Use the prompt launcher above to generate your first script!
        </div>
      ) : (
        <div className="space-y-3">
          {scripts.slice(0, 5).map((script) => (
            <div
              key={script.id}
              className="group p-3.5 rounded-xl bg-[#181818] border border-[#242424] hover:border-[#383838] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#60A5FA] bg-[#3B82F6]/10 px-2 py-0.5 rounded border border-[#3B82F6]/20">
                    {script.category || 'Stoic Mindset'}
                  </span>
                  <span className="text-xs font-bold text-white truncate">
                    {script.title}
                  </span>
                </div>
                <p className="text-xs text-[#9E9E9E] line-clamp-1 italic">
                  "{script.hook || script.quote}"
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleCopy(script.id, script.quote)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#222222] hover:bg-[#2A2A2A] border border-[#333333] text-[11px] font-semibold text-[#CCCCCC] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                  title="Copy quote to clipboard"
                >
                  {copiedId === script.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenInStudio(script)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#3B82F6]/15 hover:bg-[#3B82F6]/25 border border-[#3B82F6]/30 text-[11px] font-semibold text-[#60A5FA] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                  title="Load script into AI Studio"
                >
                  <span>Use in Studio</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
