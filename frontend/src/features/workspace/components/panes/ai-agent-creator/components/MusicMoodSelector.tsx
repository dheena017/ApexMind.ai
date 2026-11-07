/**
 * frontend/src/features/workspace/components/panes/ai-agent-creator/components/MusicMoodSelector.tsx
 */

import React from 'react';
import { Music, Flame, Zap, Compass, Moon } from 'lucide-react';
import { CustomSelect } from '@/src/shared/ui/CustomSelect';

export const MUSIC_MOODS = [
  { value: 'orchestral', label: 'Epic Orchestral', desc: 'Hans Zimmer style strings & brass', icon: Music },
  { value: 'phonk', label: 'Dark Aggressive Phonk', desc: 'Heavy cowbell, 808 bass, drift energy', icon: Flame },
  { value: 'ambient_calm', label: 'Ambient & Meditative', desc: 'Peaceful drone, soft piano pads', icon: Moon },
  { value: 'cinematic_hybrid', label: 'Cinematic Hybrid', desc: 'Electronic pulse meets epic percussion', icon: Zap },
  { value: 'stoic_lofi', label: 'Stoic Lo-Fi Beats', desc: 'Relaxed groove for deep monologue', icon: Compass },
];

interface MusicMoodSelectorProps {
  value: string;
  onChange: (val: string) => void;
}

export const MusicMoodSelector: React.FC<MusicMoodSelectorProps> = ({ value, onChange }) => {
  return (
    <CustomSelect
      options={MUSIC_MOODS.map((mood) => ({
        value: mood.value,
        label: mood.label,
        description: mood.desc,
        icon: <mood.icon className="w-3.5 h-3.5" />,
      }))}
      value={value}
      onChange={onChange}
      variant="compact"
      className="w-full"
    />
  );
};

