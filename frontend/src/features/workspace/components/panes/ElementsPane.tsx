import React, { useState } from 'react';
import {
  Shapes,
  Square,
  Circle,
  Shield,
  Award,
  Zap,
  Flame,
  Crown,
  Target,
  Layers,
  ArrowRight,
  Sparkles,
  Plus,
  Tv,
  Film,
  Sliders,
  Share2,
  AtSign,
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
import { VISUAL_ELEMENTS, VisualElementItem } from '../../data/mediaCatalogData';

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

const EMOJI_ELEMENTS = [
  { symbol: '⚡', label: 'Lightning' },
  { symbol: '⚔️', label: 'Swords' },
  { symbol: '👑', label: 'Crown' },
  { symbol: '🔥', label: 'Fire' },
  { symbol: '🦁', label: 'Lion' },
  { symbol: '⏳', label: 'Hourglass' },
  { symbol: '🎯', label: 'Bullseye' },
  { symbol: '💎', label: 'Diamond' },
  { symbol: '🧠', label: 'Mind' },
  { symbol: '🏛️', label: 'Stoic Pillar' },
  { symbol: '🏆', label: 'Trophy' },
  { symbol: '🛡️', label: 'Shield' },
  { symbol: '🚀', label: 'Rocket' },
  { symbol: '🐺', label: 'Wolf' },
  { symbol: '⛓️', label: 'Chains' },
  { symbol: '📈', label: 'Growth' },
];

export const ElementsPane: React.FC<ElementsPaneProps> = ({
  onInsertElement,
  onToggleVignette,
  onToggleGrain,
}) => {
  const [activeTab, setActiveTab] = useState<'badges' | 'fx' | 'social' | 'shapes' | 'progress' | 'custom'>('badges');
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

  const handleApplyPending = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (!pendingElement) return;
    handleApply(pendingElement.id, pendingElement.name, pendingElement.type, pendingElement.value);
  };

  const handleCreateCustomBadge = () => {
    if (!customBadgeText.trim()) return;
    const text = customBadgeText.trim().toUpperCase();
    handleApply(`custom-badge-${Date.now()}`, text, 'badge', text);
    setCustomBadgeText('');
  };

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none overflow-hidden rounded-2xl border border-[#26262B]">
      {/* ── Top Header Bar (Matching Studio Shell) ── */}
      <div className="relative h-11 px-3.5 bg-[#17171A] border-b border-[#26262B] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Shapes className="w-4 h-4 shrink-0 text-purple-400" />
          <span className="text-xs font-bold text-white truncate">
            Studio Elements &amp; Overlays
          </span>
        </div>
      </div>

      {/* ── Subtabs Header Bar ── */}
      <div className="flex items-center gap-4 sm:gap-5 px-3.5 pt-2 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar shrink-0 bg-[#141417]">
        {[
          { id: 'badges', label: 'Badges' },
          { id: 'fx', label: 'Visual FX' },
          { id: 'social', label: 'Social Tags' },
          { id: 'shapes', label: 'Frames' },
          { id: 'progress', label: 'Progress' },
          { id: 'custom', label: 'Custom' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
              activeTab === tab.id
                ? 'text-white border-white'
                : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3">
        {/* ── Tab: Visual FX Sliders ── */}
        {activeTab === 'fx' && (
          <div className="flex flex-col gap-3.5">
            <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-3.5 flex flex-col gap-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#60A5FA]" />
                Cinematic Visual Texture Overlays
              </span>

              {/* Film Grain */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-mono-studio">
                  <span className="text-[#71717A]">35MM FILM GRAIN INTENSITY</span>
                  <span className="text-[#60A5FA] font-bold">{grainIntensity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={grainIntensity}
                  onChange={(e) => {
                    setGrainIntensity(Number(e.target.value));
                    onToggleGrain?.();
                  }}
                  className="w-full accent-[#3B82F6]"
                />
              </div>

              {/* Vignette Darkness */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-mono-studio">
                  <span className="text-[#71717A]">CORNER VIGNETTE SHADOW</span>
                  <span className="text-[#60A5FA] font-bold">{vignetteDarkness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={vignetteDarkness}
                  onChange={(e) => {
                    setVignetteDarkness(Number(e.target.value));
                    onToggleVignette?.();
                  }}
                  className="w-full accent-[#3B82F6]"
                />
              </div>

              {/* Letterbox Bars */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-mono-studio">
                  <span className="text-[#71717A]">CINEMA LETTERBOX BARS</span>
                  <span className="text-[#60A5FA] font-bold">{letterboxBars}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="18"
                  value={letterboxBars}
                  onChange={(e) => setLetterboxBars(Number(e.target.value))}
                  className="w-full accent-[#3B82F6]"
                />
              </div>
            </div>

            {/* Retro Overlays */}
            <div className="grid grid-cols-2 gap-2">
              <div
                onClick={() => handleApply('fx-crt', 'CRT Scanlines', 'shape', 'shape-scanlines')}
                className="p-3 rounded-xl border bg-[#1C1C20] hover:border-[#3B82F6] hover:bg-[#222228] transition-all text-left flex flex-col gap-2 cursor-pointer border-[#2A2A30]"
              >
                <div className="flex items-center gap-1.5 text-[#60A5FA]">
                  <Tv className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold text-white">CRT Scanlines</span>
                </div>
                <span className="text-[10px] text-[#A1A1AA]">Retro monitor lines</span>
              </div>

              <div
                onClick={() => handleApply('fx-spotlight', 'Center Spotlight', 'shape', 'shape-spotlight')}
                className="p-3 rounded-xl border bg-[#1C1C20] hover:border-[#3B82F6] hover:bg-[#222228] transition-all text-left flex flex-col gap-2 cursor-pointer border-[#2A2A30]"
              >
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Circle className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold text-white">Center Spotlight</span>
                </div>
                <span className="text-[10px] text-[#A1A1AA]">Subject radial focus</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Social Tags ── */}
        {activeTab === 'social' && (
          <div className="flex flex-col gap-2">
            {SOCIAL_TAGS.map((tag) => {
              const Icon = tag.icon;
              return (
                <div
                  key={tag.id}
                  onClick={() => handleApply(tag.id, tag.name, 'badge', tag.defaultVal)}
                  className="p-3 rounded-xl border bg-[#1C1C20] hover:border-[#3B82F6] hover:bg-[#222228] transition-all flex items-center justify-between gap-3 cursor-pointer border-[#2A2A30]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#2A2A32] flex items-center justify-center text-[#60A5FA] shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{tag.name}</p>
                      <p className="text-[10px] text-[#A1A1AA] truncate">{tag.defaultVal}</p>
                    </div>
                  </div>

                  
                </div>
              );
            })}
          </div>
        )}

        {/* ── Tab 1: Badges ── */}
        {activeTab === 'badges' && (
          <div className="grid grid-cols-2 gap-2">
            {BADGES.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.id}
                  onClick={() => handleApply(b.id, b.label, 'badge', b.label)}
                  className="p-3 rounded-xl border bg-[#1C1C20] hover:border-[#3B82F6] hover:bg-[#222228] transition-all flex flex-col items-center text-center gap-2 group cursor-pointer border-[#2A2A30]"
                >
                  <div
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase text-white bg-gradient-to-r ${b.color} shadow-md flex items-center gap-1`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{b.label}</span>
                  </div>
                  <span className="text-[10px] text-[#A1A1AA]">{b.desc}</span>
                  
                </div>
              );
            })}
          </div>
        )}

        {/* ── Tab 2: Shapes & Frames ── */}
        {activeTab === 'shapes' && (
          <div className="flex flex-col gap-2">
            {SHAPES.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.id}
                  onClick={() => handleApply(s.id, s.name, 'shape', s.id)}
                  className="p-3 rounded-xl border bg-[#1C1C20] hover:border-[#3B82F6] hover:bg-[#222228] transition-all flex items-center gap-3 text-left cursor-pointer border-[#2A2A30]"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#2A2A32] flex items-center justify-center text-[#60A5FA] shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white">{s.name}</p>
                    <p className="text-[10px] text-[#A1A1AA] truncate">{s.desc}</p>
                  </div>
                  
                </div>
              );
            })}
          </div>
        )}

        {/* ── Tab 3: Progress Scrubbers ── */}
        {activeTab === 'progress' && (
          <div className="flex flex-col gap-2">
            {PROGRESS_BARS.map((p) => (
              <div
                key={p.id}
                onClick={() => handleApply(p.id, p.name, 'progress', p.id)}
                className="p-3 rounded-xl border bg-[#1C1C20] hover:border-[#3B82F6] hover:bg-[#222228] transition-all flex flex-col gap-1.5 text-left cursor-pointer border-[#2A2A30]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{p.name}</span>
                  <span className="text-[9px] font-mono-studio text-[#60A5FA]">OVERLAY</span>
                </div>
                <span className="text-[10px] text-[#A1A1AA]">{p.desc}</span>

                {/* Mini Preview Bar */}
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-1">
                  <div className="w-2/3 h-full bg-[#3B82F6] rounded-full" />
                </div>
                
              </div>
            ))}
          </div>
        )}

        {/* ── Tab 4: Custom Badge Creator ── */}
        {activeTab === 'custom' && (
          <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-3.5 flex flex-col gap-3">
            <span className="text-xs font-bold text-white">Create Custom Badge</span>
            <p className="text-[11px] text-[#A1A1AA]">
              Generate a personalized motivational pill badge to pin above your captions.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-mono-studio text-[#71717A]">Badge Text</label>
              <input
                type="text"
                value={customBadgeText}
                onChange={(e) => setCustomBadgeText(e.target.value)}
                placeholder="e.g. CHAPTER 1 • AWAKENING"
                className="bg-[#141417] border border-[#2A2A30] rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#52525B] outline-none focus:border-[#3B82F6]"
              />
            </div>

            {/* Gradient Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-mono-studio text-[#71717A]">Badge Gradient</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: 'Gold Fire', grad: 'from-amber-500 to-orange-600' },
                  { name: 'Cyber Blue', grad: 'from-blue-600 to-indigo-700' },
                  { name: 'Red Fury', grad: 'from-red-600 to-rose-700' },
                  { name: 'Emerald', grad: 'from-emerald-600 to-teal-700' },
                  { name: 'Violet', grad: 'from-purple-600 to-indigo-800' },
                  { name: 'Obsidian', grad: 'from-zinc-700 to-zinc-900' },
                ].map((g) => (
                  <button
                    key={g.grad}
                    type="button"
                    onClick={() => setCustomBadgeGradient(g.grad)}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold text-white bg-gradient-to-r ${g.grad} border transition-all ${
                      customBadgeGradient === g.grad ? 'border-white ring-2 ring-white/40' : 'border-transparent'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {customBadgeText.trim() && (
              <div className="mt-2 p-3 rounded-lg bg-[#141417] border border-[#26262B] flex items-center justify-center">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase text-white bg-gradient-to-r ${customBadgeGradient} shadow-md`}
                >
                  {customBadgeText.trim()}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleCreateCustomBadge}
              disabled={!customBadgeText.trim()}
              className="mt-2 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white rounded-xl py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#3B82F6]/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Insert Badge
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ElementsPane;
