/**
 * frontend/src/features/workspace/components/panes/ai-agent-creator/components/VisualStyleSelector.tsx
 */

import React from 'react';
import { Film, Sparkles, Moon, Sun, Camera } from 'lucide-react';
import { CustomSelect } from '@/src/shared/ui/CustomSelect';

export const VISUAL_STYLES = [
  { value: 'dark_cinematic', label: 'Dark Cinematic 4K', desc: 'Moody shadows, volumetric light', icon: Moon },
  { value: 'warm_golden_hour', label: 'Warm Golden Hour', desc: 'Rich amber sunlight, soft lens flare', icon: Sun },
  { value: 'anime_cyberpunk', label: 'Anime & Cyberpunk', desc: 'Vibrant neon, stylized hand-drawn', icon: Sparkles },
  { value: 'documentary_realism', label: 'Documentary Realism', desc: 'Natural lighting, neutral color grading', icon: Camera },
  { value: 'hyper_motivational', label: 'Hyper-Motivational', desc: 'High contrast, energetic grading', icon: Film },
];

interface VisualStyleSelectorProps {
  value: string;
  onChange: (val: string) => void;
}

export const VisualStyleSelector: React.FC<VisualStyleSelectorProps> = ({ value, onChange }) => {
  return (
    <CustomSelect
      options={VISUAL_STYLES.map((item) => ({
        value: item.value,
        label: item.label,
        description: item.desc,
        icon: <item.icon className="w-3.5 h-3.5" />,
      }))}
      value={value}
      onChange={onChange}
      variant="compact"
      className="w-full"
    />
  );
};

