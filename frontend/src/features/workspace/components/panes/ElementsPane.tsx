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
  Check,
  Layers,
  ArrowRight,
} from 'lucide-react';

export interface ElementsPaneProps {
  onInsertElement?: (element: { id: string; name: string; type: string; value: string }) => void;
  onToggleVignette?: () => void;
  onToggleGrain?: () => void;
}

const BADGES = [
  { id: 'badge-1', label: 'RULE #1', desc: 'Core Principle', color: 'from-amber-500 to-orange-600', icon: Zap },
  { id: 'badge-2', label: 'THE 1% CLUB', desc: 'Elite Standards', color: 'from-blue-600 to-indigo-700', icon: Crown },
  { id: 'badge-3', label: 'NO EXCUSES', desc: 'Raw Discipline', color: 'from-red-600 to-rose-700', icon: Flame },
  { id: 'badge-4', label: 'STOIC MINDSET', desc: 'Mental Fortress', color: 'from-zinc-600 to-zinc-800', icon: Shield },
  { id: 'badge-5', label: 'DAY 1 OR ONE DAY', desc: 'Action Bias', color: 'from-emerald-600 to-teal-700', icon: Target },
  { id: 'badge-6', label: 'SILENT WARRIOR', desc: 'Zero Talk', color: 'from-purple-600 to-indigo-800', icon: Award },
];

const SHAPES = [
  { id: 'shape-box', name: 'Rounded Quote Card', desc: 'Semi-transparent background container', icon: Square },
  { id: 'shape-spotlight', name: 'Center Spotlight', desc: 'Radial focus highlighting the subject', icon: Circle },
  { id: 'shape-letterbox', name: 'Cinematic Cinema Bars', desc: 'Top & bottom film letterbox borders', icon: Layers },
  { id: 'shape-divider', name: 'Accent Divider Line', desc: 'Horizontal solid rule between lines', icon: ArrowRight },
];

const PROGRESS_BARS = [
  { id: 'prog-top', name: 'Top Reel Countdown Scrubber', desc: 'Smooth 0-100% time bar on top' },
  { id: 'prog-bottom', name: 'Bottom Progress Scrubber', desc: 'Clean blue fill bar across bottom' },
  { id: 'prog-soundwave', name: 'Dynamic Soundwave Bars', desc: 'Moving audio spectrum bars' },
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
];

export const ElementsPane: React.FC<ElementsPaneProps> = ({
  onInsertElement,
  onToggleVignette,
  onToggleGrain,
}) => {
  const [activeTab, setActiveTab] = useState<'badges' | 'shapes' | 'progress' | 'emojis'>('badges');
  const [appliedItem, setAppliedItem] = useState<string | null>(null);

  const handleSelect = (id: string, name: string, type: string, value: string) => {
    setAppliedItem(id);
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'overlay' }));
    if (onInsertElement) {
      onInsertElement({ id, name, type, value });
    }
    setTimeout(() => setAppliedItem(null), 1800);
  };

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none overflow-hidden rounded-2xl border border-[#26262B]">
      {/* ── Top Header Bar (Matching Right Pane) ── */}
      <div className="relative px-3 py-2 bg-[#17171A] border-b border-[#26262B] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Shapes className="w-4 h-4 shrink-0 text-[#60A5FA]" />
          <span className="text-xs font-bold text-white truncate">
            Studio Elements
          </span>
          <span className="text-[9px] font-mono-studio px-1.5 py-0.2 rounded bg-white/10 text-white/80 border border-white/15 shrink-0 uppercase font-bold">
            OVERLAYS
          </span>
        </div>

        {appliedItem && (
          <span className="text-[10px] font-mono-studio px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            ✓ Applied
          </span>
        )}
      </div>

      {/* ── Subtabs Header Bar (Matching Right Pane) ── */}
      <div className="flex items-center gap-6 px-4 pt-2.5 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar shrink-0">
        {(
          [
            { id: 'badges', label: 'Badges' },
            { id: 'shapes', label: 'Shapes' },
            { id: 'progress', label: 'Bars' },
            { id: 'emojis', label: 'Emojis' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
              activeTab === tab.id
                ? 'text-white border-white'
                : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Main Tab Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
        {activeTab === 'badges' && (
          <div className="space-y-2">
            <label className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider block">
              Header Callout Badges
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BADGES.map((badge) => {
                const Icon = badge.icon;
                const isSelected = appliedItem === badge.id;
                return (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={() => handleSelect(badge.id, badge.label, 'badge', badge.label)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'border-[#3B82F6] bg-[#3B82F6]/15'
                        : 'border-[#2A2A30] bg-[#1C1C20] hover:border-[#3A3A42]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-1.5 rounded-lg bg-gradient-to-tr ${badge.color} text-white shadow-xs`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      {isSelected && <Check className="w-3 h-3 text-[#60A5FA]" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white tracking-wide">{badge.label}</p>
                      <p className="text-[10px] text-[#71717A]">{badge.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'shapes' && (
          <div className="space-y-2">
            <label className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider block">
              Cinematic Shape Overlays
            </label>
            <div className="grid grid-cols-1 gap-2">
              {SHAPES.map((shape) => {
                const Icon = shape.icon;
                const isSelected = appliedItem === shape.id;
                return (
                  <button
                    key={shape.id}
                    type="button"
                    onClick={() => handleSelect(shape.id, shape.name, 'shape', shape.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-[#3B82F6] bg-[#3B82F6]/15'
                        : 'border-[#2A2A30] bg-[#1C1C20] hover:border-[#3A3A42]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#121214] text-[#60A5FA] border border-[#26262B]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{shape.name}</p>
                        <p className="text-[10px] text-[#71717A]">{shape.desc}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#60A5FA]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-2">
            <label className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider block">
              Retention Progress Bars
            </label>
            <div className="grid grid-cols-1 gap-2">
              {PROGRESS_BARS.map((prog) => {
                const isSelected = appliedItem === prog.id;
                return (
                  <button
                    key={prog.id}
                    type="button"
                    onClick={() => handleSelect(prog.id, prog.name, 'progress', prog.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-[#3B82F6] bg-[#3B82F6]/15'
                        : 'border-[#2A2A30] bg-[#1C1C20] hover:border-[#3A3A42]'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{prog.name}</p>
                      <p className="text-[10px] text-[#71717A]">{prog.desc}</p>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#60A5FA]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'emojis' && (
          <div className="space-y-2">
            <label className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider block">
              High Impact Symbols
            </label>
            <div className="grid grid-cols-5 gap-2">
              {EMOJI_ELEMENTS.map((emoji) => (
                <button
                  key={emoji.symbol}
                  type="button"
                  onClick={() => handleSelect(emoji.symbol, emoji.label, 'emoji', emoji.symbol)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-[#2A2A30] bg-[#1C1C20] hover:border-[#3B82F6]/50 hover:bg-[#222228] transition-all cursor-pointer"
                  title={emoji.label}
                >
                  <span className="text-xl mb-0.5">{emoji.symbol}</span>
                  <span className="text-[9px] text-[#71717A] truncate w-full text-center">
                    {emoji.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ElementsPane;
