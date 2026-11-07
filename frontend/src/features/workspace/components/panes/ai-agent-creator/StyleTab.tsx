/**
 * frontend/src/features/workspace/components/panes/ai-agent-creator/StyleTab.tsx
 */

import React from 'react';
import { Film, Type, Music } from 'lucide-react';
import { VisualStyleSelector } from './components/VisualStyleSelector';
import { MusicMoodSelector } from './components/MusicMoodSelector';
import { CustomSelect } from '@/src/shared/ui/CustomSelect';

export const SUBTITLE_PRESETS = [
  { value: 'hormozi', label: 'Hormozi Viral Yellow', desc: 'Punchy uppercase, bold background pill' },
  { value: 'mrbeast', label: 'MrBeast Pop Bold', desc: 'Vibrant blue & yellow gradient animation' },
  { value: 'minimal_clean', label: 'Minimalist Editorial', desc: 'Clean white sans-serif with subtle shadow' },
  { value: 'cinema_gold', label: 'Cinematic Gold Serif', desc: 'Elegant Roman typography for stoic quotes' },
  { value: 'cyber_neon', label: 'Cyberpunk Neon', desc: 'Glowing green/cyan monospace styling' },
];

interface StyleTabProps {
  selectedAesthetic: string;
  onAestheticChange: (val: string) => void;
  selectedSubtitle: string;
  onSubtitleChange: (val: string) => void;
  selectedMusicMood: string;
  onMusicMoodChange: (val: string) => void;
}

export const StyleTab: React.FC<StyleTabProps> = ({
  selectedAesthetic,
  onAestheticChange,
  selectedSubtitle,
  onSubtitleChange,
  selectedMusicMood,
  onMusicMoodChange,
}) => {
  return (
    <div className="space-y-4">
      {/* ── Visual Aesthetic ── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-[#3B82F6]" />
            Visual Aesthetic
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">Render Target</span>
        </div>
        <VisualStyleSelector value={selectedAesthetic} onChange={onAestheticChange} />
      </div>

      {/* ── Subtitle Style ── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-[#3B82F6]" />
            Subtitle Animation Style
          </span>
          <span className="text-[10px] text-[#60A5FA] font-mono">High Retention</span>
        </div>
        <CustomSelect
          options={SUBTITLE_PRESETS}
          value={selectedSubtitle}
          onChange={onSubtitleChange}
          variant="compact"
          className="w-full"
        />
      </div>

      {/* ── Music Mood ── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-[#3B82F6]" />
            Music Mood &amp; Soundtrack
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">Auto Sidechain</span>
        </div>
        <MusicMoodSelector value={selectedMusicMood} onChange={onMusicMoodChange} />
      </div>
    </div>
  );
};

