import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Sparkles,
  Sliders,
  Check,
  ChevronRight,
  Bookmark,
  Layers,
  Clock,
  Activity,
  ArrowRight,
  Quote,
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
    <div className="flex flex-col font-sans-studio text-[#E5E5E5] space-y-4">
      {/* ── Top Header Bar ────────────────────────────────────────────── */}
      <div className="flex w-full items-center justify-between gap-2 rounded-xl border border-[#2F2F2F] bg-[#121212]/90 px-3 py-2.5 shadow-[0_1px_0_rgba(255,255,255,0.02)] backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/30">
            <Shapes className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Studio Elements</h2>
            <p className="text-[10px] text-[#9CA3AF]">motion/react • lucide vector badges</p>
          </div>
        </div>

        {appliedItem && (
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-[10px] font-mono-studio px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
          >
            ✓ Applied to Canvas!
          </motion.span>
        )}
      </div>

      {/* ── Sub Navigation Tabs ──────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#141414] border border-[#262626]">
        {(
          [
            { id: 'badges', label: 'Badges' },
            { id: 'shapes', label: 'Shapes' },
            { id: 'progress', label: 'Progress' },
            { id: 'emojis', label: 'Stickers' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#3B82F6] text-white shadow-xs'
                : 'text-[#9CA3AF] hover:text-white hover:bg-[#1E1E1E]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Animated Tab Content via Framer Motion ───────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === 'badges' && (
          <motion.div
            key="badges"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="space-y-2"
          >
            <span className="text-[10px] font-extrabold text-[#9CA3AF] uppercase tracking-wider block px-1">
              Motivational Badges & Viral Stamps
            </span>
            <div className="grid grid-cols-2 gap-2">
              {BADGES.map((b) => {
                const IconComp = b.icon;
                const isAdded = appliedItem === b.id;
                return (
                  <motion.div
                    key={b.id}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(b.id, b.label, 'badge', b.label)}
                    className={`p-3 rounded-xl border bg-[#141414] hover:bg-[#181818] transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                      isAdded
                        ? 'border-emerald-500 ring-1 ring-emerald-500/50'
                        : 'border-[#262626] hover:border-[#404040]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase text-white bg-gradient-to-r ${b.color} shadow-xs flex items-center gap-1`}
                      >
                        <IconComp className="w-3 h-3" />
                        {b.label}
                      </span>
                      {isAdded && <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />}
                    </div>
                    <div>
                      <p className="text-[10px] text-[#A1A1AA] font-medium">{b.desc}</p>
                      <p className="text-[9px] text-[#3B82F6] font-semibold mt-1">Render on Canvas →</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeTab === 'shapes' && (
          <motion.div
            key="shapes"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="space-y-2"
          >
            <span className="text-[10px] font-extrabold text-[#9CA3AF] uppercase tracking-wider block px-1">
              Geometric Frames & Framing Masks
            </span>
            <div className="space-y-2">
              {SHAPES.map((s) => {
                const IconComp = s.icon;
                return (
                  <motion.div
                    key={s.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleSelect(s.id, s.name, 'shape', s.id)}
                    className="p-3 rounded-xl border border-[#262626] bg-[#141414] hover:bg-[#181818] hover:border-[#3B82F6]/60 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#1E1E1E] text-[#60A5FA] flex items-center justify-center border border-[#2F2F2F]">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{s.name}</p>
                        <p className="text-[10px] text-[#71717A]">{s.desc}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#3B82F6] font-semibold">Apply</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeTab === 'progress' && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="space-y-2"
          >
            <span className="text-[10px] font-extrabold text-[#9CA3AF] uppercase tracking-wider block px-1">
              Reel Scrubber & Progress Bars
            </span>
            <div className="space-y-2">
              {PROGRESS_BARS.map((pb) => (
                <motion.div
                  key={pb.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSelect(pb.id, pb.name, 'progress', pb.id)}
                  className="p-3 rounded-xl border border-[#262626] bg-[#141414] hover:bg-[#181818] hover:border-[#3B82F6]/60 transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{pb.name}</span>
                    <span className="text-[10px] text-[#3B82F6] font-semibold">Attach to Video</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#262626] overflow-hidden">
                    <div className="h-full w-2/3 bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] rounded-full" />
                  </div>
                  <p className="text-[10px] text-[#71717A]">{pb.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'emojis' && (
          <motion.div
            key="emojis"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="space-y-2"
          >
            <span className="text-[10px] font-extrabold text-[#9CA3AF] uppercase tracking-wider block px-1">
              Motivational Stickers & Icons
            </span>
            <div className="grid grid-cols-5 gap-2">
              {EMOJI_ELEMENTS.map((em) => (
                <motion.button
                  key={em.label}
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => handleSelect(em.label, em.label, 'sticker', em.symbol)}
                  className="aspect-square flex flex-col items-center justify-center rounded-xl border border-[#262626] bg-[#141414] hover:bg-[#1E1E1E] hover:border-[#3B82F6]/60 transition-all cursor-pointer p-2 shadow-xs"
                  title={em.label}
                >
                  <span className="text-2xl">{em.symbol}</span>
                  <span className="text-[9px] text-[#71717A] truncate mt-1">{em.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
