/**
 * frontend/src/features/workspace/components/panes/script-editor/HookSelector.tsx
 */

import React from 'react';
import { Sparkles } from 'lucide-react';
import { HookOption } from '../../../types';

interface HookSelectorProps {
  hooks: HookOption[];
  currentHook?: string;
  onSelectHook: (hook: HookOption) => void;
}

export const HookSelector: React.FC<HookSelectorProps> = ({
  hooks,
  currentHook,
  onSelectHook,
}) => {
  if (!hooks || hooks.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-[#141418] border border-[#24242A]">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-white font-semibold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
          <span>AI Hook Variations</span>
          <span className="px-1.5 py-0.2 rounded bg-[#18181C] text-zinc-400 font-mono text-[9px] border border-[#27272A]">
            {hooks.length}
          </span>
        </span>
        <span className="text-zinc-500 text-[9px]">Click to apply</span>
      </div>

      <div className="flex flex-col gap-1.5">
        {hooks.map((h, hIdx) => {
          const isSelected = currentHook?.trim() === h.text?.trim();
          return (
            <button
              key={h.id || hIdx}
              type="button"
              onClick={() => onSelectHook(h)}
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
  );
};
