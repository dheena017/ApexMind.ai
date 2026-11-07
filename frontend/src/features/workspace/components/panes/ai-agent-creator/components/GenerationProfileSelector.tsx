/**
 * frontend/src/features/workspace/components/panes/ai-agent-creator/components/GenerationProfileSelector.tsx
 */

import React from 'react';
import { Film, Box } from 'lucide-react';
import { GenerationProfile } from '../../../../types/script';

interface GenerationProfileSelectorProps {
  value: GenerationProfile;
  onChange: (profile: GenerationProfile) => void;
}

export const GenerationProfileSelector: React.FC<GenerationProfileSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onChange('motivational_reel')}
        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
          value === 'motivational_reel'
            ? 'border-[#3B82F6] bg-[#3B82F6]/10 text-white shadow-[0_0_15px_rgba(59,130,246,0.15)]'
            : 'border-[#27272A] bg-[#141417] text-zinc-400 hover:border-[#3F3F46] hover:text-zinc-200'
        }`}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <Film className={`w-3.5 h-3.5 ${value === 'motivational_reel' ? 'text-[#3B82F6]' : 'text-zinc-500'}`} />
          <span className="text-xs font-bold leading-tight">Motivational Reel</span>
        </div>
        <p className="text-[10px] text-zinc-500 leading-snug">Short-form viral quote reel with nature b-roll & music</p>
      </button>

      <button
        type="button"
        onClick={() => onChange('cinematic_3d_story')}
        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
          value === 'cinematic_3d_story'
            ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 text-white shadow-[0_0_15px_rgba(139,92,246,0.15)]'
            : 'border-[#27272A] bg-[#141417] text-zinc-400 hover:border-[#3F3F46] hover:text-zinc-200'
        }`}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <Box className={`w-3.5 h-3.5 ${value === 'cinematic_3d_story' ? 'text-[#8B5CF6]' : 'text-zinc-500'}`} />
          <span className="text-xs font-bold leading-tight">3D Cinematic Story</span>
        </div>
        <p className="text-[10px] text-zinc-500 leading-snug">Character narrative, persistent 3D assets & camera staging</p>
      </button>
    </div>
  );
};

