import React, { useState } from 'react';
import {
  Shapes,
  Square,
  Circle,
  Award,
  Zap,
  Layers,
  Sparkles,
  Plus,
  Tv,
  Sliders,
  Share2,
  Youtube,
  Instagram,
} from 'lucide-react';

export interface ElementsPaneProps {
  onInsertElement?: (element: { id: string; name: string; type: string; value: string; label?: string }) => void;
  onToggleVignette?: () => void;
  onToggleGrain?: () => void;
}

import { toast } from 'sonner';
import { addWorkspaceNotification } from '../../utils/workspaceNotificationManager';
import { VISUAL_ELEMENTS } from '../../data/mediaCatalogData';
import { elementsApi } from '../../api/elementsApi';

const BADGES = VISUAL_ELEMENTS.filter((e) => e.category === 'badges').map((e) => ({
  id: e.id,
  label: e.label,
  desc: e.desc,
  color: e.color,
  icon: Zap,
}));

const SHAPES = VISUAL_ELEMENTS.filter((e) => e.category === 'frames').map((e) => ({
  id: e.id,
  name: e.name,
  desc: e.desc,
  icon: Square,
}));

const SOCIAL_TAGS = [
  { id: 'social-yt', name: 'YouTube Subscribe Pill', icon: Youtube, defaultVal: 'SUBSCRIBE FOR MORE' },
  { id: 'social-ig', name: 'Instagram Creator Tag', icon: Instagram, defaultVal: '@ApexMind.ai' },
  { id: 'social-share', name: 'Save & Share Reminder', icon: Share2, defaultVal: 'SAVE THIS REEL' },
];

const PROGRESS_BARS = [
  { id: 'prog-top', name: 'Top Reel Countdown Scrubber', desc: 'Smooth 0-100% time bar on top edge' },
  { id: 'prog-bottom', name: 'Bottom Progress Scrubber', desc: 'Clean blue fill bar across bottom' },
  { id: 'prog-soundwave', name: 'Dynamic Soundwave Bars', desc: 'Animated audio spectrum equalizer bars' },
];

export const ElementsPane: React.FC<ElementsPaneProps> = ({
  onInsertElement,
  onToggleVignette,
  onToggleGrain,
}) => {
  const [pendingElement, setPendingElement] = useState<{ id: string; name: string; type: string; value: string } | null>(null);

  // Visual FX State
  const [grainIntensity, setGrainIntensity] = useState<number>(30);
  const [vignetteDarkness, setVignetteDarkness] = useState<number>(50);
  const [letterboxBars, setLetterboxBars] = useState<number>(0);

  // Custom Badge Creator
  const [customBadgeText, setCustomBadgeText] = useState('');
  const [customBadgeGradient, setCustomBadgeGradient] = useState('from-amber-500 to-orange-600');

  const handleApply = (id: string, name: string, type: string, value: string) => {
    setPendingElement(null);
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'overlay' }));
    if (onInsertElement) {
      onInsertElement({ id, name, type, value, label: name });
    }
    window.dispatchEvent(
      new CustomEvent('workspace:add-timeline-clip', {
        detail: {
          type: 'overlay',
          elementType: type,
          value,
          name,
          duration: 4.5,
        },
      })
    );
    toast.success(`Applied "${name}"`);
    addWorkspaceNotification({
      title: 'Element Applied',
      message: `Applied ${name} (${type}) to video canvas.`,
      category: 'media',
      type: 'info',
      targetPane: 'elements',
      actionLabel: 'Canvas',
    });
  };

  const handleCreateCustomBadge = async () => {
    if (!customBadgeText.trim()) return;
    const text = customBadgeText.trim().toUpperCase();
    try {
      const res = await elementsApi.createCustomBadge({ text, gradient: customBadgeGradient });
      if (res?.element) {
        handleApply(res.element.id, res.element.name, 'badge', res.element.label || res.element.name);
      } else {
        handleApply(`custom-badge-${Date.now()}`, text, 'badge', text);
      }
    } catch {
      handleApply(`custom-badge-${Date.now()}`, text, 'badge', text);
    }
    setCustomBadgeText('');
  };

  return (
    <div className="flex flex-col h-full bg-[#141414] text-white font-sans-studio select-none overflow-hidden rounded-none border-0">
      {/*  Top Header Bar (Matching Studio Shell)  */}
      <div className="relative h-11 px-3.5 bg-[#141414] border-b border-[#242424] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-[#181818] border border-[#242424] flex items-center justify-center shrink-0 text-white">
            <Shapes className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-bold text-white truncate">Elements &amp; Overlays</span>
          </div>
        </div>
      </div>

      {/*  Main Content Area  */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          {BADGES.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.id}
                onClick={() => handleApply(b.id, b.label, 'badge', b.label)}
                style={{ contentVisibility: 'auto', containIntrinsicSize: '68px' }}
                className="p-3 rounded-xl border bg-[#181818] hover:border-[#3B82F6] hover:bg-[#1E1E1E] transition-all flex flex-col items-center text-center gap-2 group cursor-pointer border-[#242424] transform-gpu"
              >
                <div
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase text-white bg-gradient-to-r ${b.color} shadow-md flex items-center gap-1`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{b.label}</span>
                </div>
                <span className="text-[10px] text-slate-400">{b.desc}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ElementsPane;
