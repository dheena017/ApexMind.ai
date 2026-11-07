/**
 * frontend/src/features/workspace/components/panes/ai-agent-creator/components/DurationSelector.tsx
 */

import React from 'react';
import { Zap, Sliders, Flame, Shield } from 'lucide-react';

export const DURATION_PRESETS = [
  { value: '15 seconds', label: '15s', desc: 'Ultra-Hook', subtext: 'Best for TikTok/Reels', icon: Zap },
  { value: '30 seconds', label: '30s', desc: 'Standard Short', subtext: 'Sweet spot for virality', icon: Sliders },
  { value: '45 seconds', label: '45s', desc: 'Story Arc', subtext: 'Deeper insight & quote', icon: Flame },
  { value: '60 seconds', label: '60s', desc: 'Deep Dive', subtext: 'Maximum retention value', icon: Shield },
];

interface DurationSelectorProps {
  value: string;
  onChange: (val: string) => void;
}

export const DurationSelector: React.FC<DurationSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="grid grid-cols-4 gap-2">
      {DURATION_PRESETS.map((d) => {
        const IconComponent = d.icon;
        const isSelected = value === d.value;
        return (
          <button
            key={d.value}
            type="button"
            onClick={() => onChange(d.value)}
            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
              isSelected
                ? 'border-[#3B82F6] bg-[#3B82F6]/10 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                : 'border-[#27272A] bg-[#141417] text-zinc-400 hover:border-[#3F3F46] hover:text-zinc-200'
            }`}
          >
            <div className="flex justify-center mb-1">
              <IconComponent className={`w-4 h-4 ${isSelected ? 'text-[#3B82F6]' : 'text-zinc-500'}`} />
            </div>
            <div className="text-xs font-bold leading-tight">{d.label}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5 truncate">{d.desc}</div>
          </button>
        );
      })}
    </div>
  );
};

