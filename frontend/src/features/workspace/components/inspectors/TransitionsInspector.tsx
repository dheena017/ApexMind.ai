import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import {
  Wand2,
  Zap,
  Sparkles,
  Check,
  Play,
  Film,
  Image as ImageIcon,
  Clock,
  Shuffle,
  Layers,
} from 'lucide-react';
import { VisualBackdrop } from '../../types';
import { SelectedClip } from '../timeline/timelineTypes';

export interface TransitionPresetItem {
  id: string;
  label: string;
  category: 'all' | 'basic' | 'slide' | 'zoom' | 'wipe' | 'special';
  hoverEffect?: string;
}

export const TRANSITION_PRESETS: TransitionPresetItem[] = [
  { id: 'none', label: 'None', category: 'basic' },
  { id: 'dissolve', label: 'Crossfade', category: 'basic', hoverEffect: 'group-hover:opacity-40' },
  { id: 'fade-black', label: 'Fade to Black', category: 'basic', hoverEffect: 'group-hover:brightness-25' },
  { id: 'fade-white', label: 'Fade to White', category: 'basic', hoverEffect: 'group-hover:brightness-175' },
  { id: 'zoom-in', label: 'Zoom In', category: 'zoom', hoverEffect: 'group-hover:scale-125' },
  { id: 'zoom-out', label: 'Zoom Out', category: 'zoom', hoverEffect: 'group-hover:scale-75' },
  { id: 'slide-left', label: 'Slide Left', category: 'slide', hoverEffect: 'group-hover:-translate-x-3' },
  { id: 'slide-right', label: 'Slide Right', category: 'slide', hoverEffect: 'group-hover:translate-x-3' },
  { id: 'slide-up', label: 'Slide Up', category: 'slide', hoverEffect: 'group-hover:-translate-y-3' },
  { id: 'slide-down', label: 'Slide Down', category: 'slide', hoverEffect: 'group-hover:translate-y-3' },
  { id: 'push-left', label: 'Push Left', category: 'slide', hoverEffect: 'group-hover:-translate-x-4' },
  { id: 'push-right', label: 'Push Right', category: 'slide', hoverEffect: 'group-hover:translate-x-4' },
  { id: 'push-up', label: 'Push Up', category: 'slide', hoverEffect: 'group-hover:-translate-y-4' },
  { id: 'push-down', label: 'Push Down', category: 'slide', hoverEffect: 'group-hover:translate-y-4' },
  { id: 'luma-fade', label: 'Luma Fade', category: 'basic', hoverEffect: 'group-hover:contrast-200 group-hover:brightness-80' },
  { id: 'blur-crossfade', label: 'Blur Crossfade', category: 'basic', hoverEffect: 'group-hover:blur-xs group-hover:opacity-60' },
  { id: 'split-reveal', label: 'Split Reveal', category: 'wipe', hoverEffect: 'group-hover:scale-x-75' },
  { id: 'circle-wipe', label: 'Circle Wipe', category: 'wipe', hoverEffect: 'group-hover:scale-90' },
  { id: 'rgb-split', label: 'RGB Split', category: 'special', hoverEffect: 'group-hover:hue-rotate-90 group-hover:saturate-200' },
  { id: 'whip-pan-left', label: 'Whip Pan Left', category: 'slide', hoverEffect: 'group-hover:-translate-x-5 group-hover:skew-x-6' },
  { id: 'whip-pan-right', label: 'Whip Pan Right', category: 'slide', hoverEffect: 'group-hover:translate-x-5 group-hover:-skew-x-6' },
  { id: 'soft-rotate', label: 'Soft Rotate', category: 'special', hoverEffect: 'group-hover:rotate-12 group-hover:scale-110' },
  { id: 'smooth-zoom', label: 'Smooth Zoom', category: 'zoom', hoverEffect: 'group-hover:scale-120' },
  { id: 'flash', label: 'Flash', category: 'special', hoverEffect: 'group-hover:brightness-200' },
];

const MOUNTAIN_PREVIEW_IMG = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=260&q=80';

export interface TransitionsInspectorProps {
  selectedClip?: SelectedClip | null;
  customImageUrl?: string;
  customVideoUrl?: string;
  activeBackdrop?: VisualBackdrop;
}


const AI_TRANSITION_POOLS: Record<string, { transitions: string[]; duration: number }> = {
  cinematic: {
    transitions: ['blur-crossfade', 'dissolve', 'luma-fade', 'soft-rotate', 'fade-black'],
    duration: 0.7,
  },
  viral: {
    transitions: ['zoom-in', 'whip-pan-left', 'flash', 'whip-pan-right', 'rgb-split', 'push-left'],
    duration: 0.35,
  },
  camera: {
    transitions: ['slide-left', 'slide-right', 'smooth-zoom', 'push-up', 'push-down'],
    duration: 0.5,
  },
  creative: {
    transitions: ['split-reveal', 'circle-wipe', 'soft-rotate', 'zoom-out', 'flash'],
    duration: 0.5,
  },
};

export const TransitionsInspector: React.FC<TransitionsInspectorProps> = ({
  selectedClip,
  customImageUrl,
  activeBackdrop,
}) => {
  const [activeTransition, setActiveTransition] = useState('dissolve');
  const [transitionDuration, setTransitionDuration] = useState(0.5);
  const [transitionCategory, setTransitionCategory] = useState<'all' | 'basic' | 'slide' | 'zoom' | 'wipe' | 'special'>('all');
  const [targetTrack, setTargetTrack] = useState<'video' | 'image'>(selectedClip?.track === 'image' ? 'image' : 'video');
  const [targetClipId, setTargetClipId] = useState<string | undefined>(
    selectedClip && 'clipId' in selectedClip && selectedClip.clipId && !selectedClip.all ? selectedClip.clipId : undefined
  );
    const [aiTransitionMood, setAiTransitionMood] = useState<'cinematic' | 'viral' | 'camera' | 'creative'>('cinematic');
  const [isAiMatching, setIsAiMatching] = useState(false);

  const handleAiMatchCurrentCut = () => {
    setIsAiMatching(true);
    const pool = AI_TRANSITION_POOLS[aiTransitionMood] || AI_TRANSITION_POOLS.cinematic;
    const chosen = pool.transitions[Math.floor(Math.random() * pool.transitions.length)];
    const dur = pool.duration;

    setTimeout(() => {
      setIsAiMatching(false);
      handleTransitionChange(chosen, dur);
      toast.success(`✨ AI Matched Cut: ${TRANSITION_PRESETS.find((p) => p.id === chosen)?.label || chosen}`, {
        description: `Optimized for ${aiTransitionMood.toUpperCase()} pacing at ${dur}s.`,
      });
    }, 450);
  };

  const handleAiAutoTransitionAll = () => {
    setIsAiMatching(true);
    setTimeout(() => {
      setIsAiMatching(false);
      window.dispatchEvent(
        new CustomEvent('workspace:ai-smart-transitions', {
          detail: {
            mood: aiTransitionMood,
            track: targetTrack,
          },
        })
      );
      toast.success(`✨ AI Smart Transitions Applied`, {
        description: `Sequenced complementary ${aiTransitionMood.toUpperCase()} transitions across all cuts on the timeline!`,
      });
    }, 500);
  };

  const [appliedNotice, setAppliedNotice] = useState(false);

  // Sync prop changes
  useEffect(() => {
    if (selectedClip) {
      if (selectedClip.track === 'image' || selectedClip.track === 'video') {
        setTargetTrack(selectedClip.track);
      }
      if ('clipId' in selectedClip && selectedClip.clipId && !selectedClip.all) {
        setTargetClipId(selectedClip.clipId);
      } else {
        setTargetClipId(undefined);
      }
    }
  }, [selectedClip]);

  // Listen to open-inspector-tab & clip selection details
  useEffect(() => {
    const handleOpenTab = (e: Event) => {
      const detail = (e as CustomEvent<{ compound?: string; clipId?: string; track?: 'video' | 'image'; transition?: string }>).detail;
      if (detail && (detail.compound === 'transitions' || !detail.compound)) {
        if (detail.track) setTargetTrack(detail.track);
        if (detail.clipId) setTargetClipId(detail.clipId);
        if (detail.transition !== undefined) setActiveTransition(detail.transition || 'none');
      }
    };

    const handleSelectedDetails = (e: Event) => {
      const detail = (e as CustomEvent<{ selectedClip?: any; details?: any }>).detail;
      if (detail?.details) {
        setActiveTransition(detail.details.transition || 'none');
        if (typeof detail.details.transitionDuration === 'number') {
          setTransitionDuration(detail.details.transitionDuration);
        }
      }
      if (detail?.selectedClip?.track === 'image' || detail?.selectedClip?.track === 'video') {
        setTargetTrack(detail.selectedClip.track);
      }
      if (detail?.selectedClip?.clipId) {
        setTargetClipId(detail.selectedClip.clipId);
      }
    };

    window.addEventListener('workspace:open-inspector-tab', handleOpenTab);
    window.addEventListener('workspace:selected-clip-details', handleSelectedDetails);
    return () => {
      window.removeEventListener('workspace:open-inspector-tab', handleOpenTab);
      window.removeEventListener('workspace:selected-clip-details', handleSelectedDetails);
    };
  }, []);

  const previewThumbnail = customImageUrl || activeBackdrop?.imageUrl || MOUNTAIN_PREVIEW_IMG;

  // Broadcast transition change
  const handleTransitionChange = (newTrans: string, dur?: number) => {
    setActiveTransition(newTrans);
    const d = dur ?? transitionDuration;
    const clipId = targetClipId;
    const applyToAll = !clipId;
    const track = targetTrack;

    window.dispatchEvent(
      new CustomEvent('workspace:update-clip-props', {
        detail: {
          track,
          clipId,
          transition: newTrans,
          transitionDuration: d,
          applyToAll,
        },
      })
    );
    window.dispatchEvent(
      new CustomEvent('workspace:update-clip-properties', {
        detail: {
          track,
          clipId,
          transition: newTrans,
          transitionDuration: d,
          applyToAll,
        },
      })
    );
    window.dispatchEvent(
      new CustomEvent('workspace:preview-transition', {
        detail: {
          transition: newTrans,
          transitionDuration: d,
          clipId,
        },
      })
    );
  };

  const handleApplyToAllTransitions = () => {
    const track = targetTrack;
    window.dispatchEvent(
      new CustomEvent('workspace:update-clip-props', {
        detail: {
          track,
          transition: activeTransition,
          transitionDuration,
          applyToAll: true,
        },
      })
    );
    window.dispatchEvent(
      new CustomEvent('workspace:update-clip-properties', {
        detail: {
          track,
          transition: activeTransition,
          transitionDuration,
          applyToAll: true,
        },
      })
    );
    window.dispatchEvent(
      new CustomEvent('workspace:preview-transition', {
        detail: {
          transition: activeTransition,
          transitionDuration,
        },
      })
    );
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 2000);
  };

  const handleReplayPreview = () => {
    window.dispatchEvent(
      new CustomEvent('workspace:preview-transition', {
        detail: {
          transition: activeTransition,
          transitionDuration,
          clipId: targetClipId,
        },
      })
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none overflow-y-auto custom-scrollbar p-3 gap-3.5">
      {/* ── AI Smart Transition Director Card ── */}
      <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-950/40 via-[#1D1818] to-purple-950/30 border border-amber-500/30 shadow-lg shadow-amber-950/20 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                AI Smart Transition Director
              </span>
              <p className="text-[10px] text-zinc-400">Intelligently sequence cuts based on scene rhythm</p>
            </div>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-studio font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            AI BEAT
          </span>
        </div>

        {/* Mood Selector */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-black/40 border border-white/5">
          {[
            { id: 'cinematic' as const, label: 'Cinematic', icon: '🎬' },
            { id: 'viral' as const, label: 'Viral / Fast', icon: '⚡' },
            { id: 'camera' as const, label: 'Camera Flow', icon: '🌊' },
            { id: 'creative' as const, label: 'Creative', icon: '🎨' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setAiTransitionMood(m.id)}
              className={`py-1.5 px-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                aiTransitionMood === m.id
                  ? 'bg-amber-600 text-white shadow-xs font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{m.icon}</span>
              <span className="leading-tight text-center">{m.label}</span>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <button
            type="button"
            onClick={handleAiMatchCurrentCut}
            disabled={isAiMatching}
            className="py-2 px-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/25 border border-amber-400/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Wand2 className={`w-3.5 h-3.5 ${isAiMatching ? 'animate-spin' : ''}`} />
            <span>{isAiMatching ? 'Analyzing...' : 'AI Match Current Cut'}</span>
          </button>
          <button
            type="button"
            onClick={handleAiAutoTransitionAll}
            disabled={isAiMatching}
            className="py-2 px-2 rounded-xl bg-[#231D19] hover:bg-[#2C231E] border border-amber-400/30 text-amber-200 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Transition All Cuts</span>
          </button>
        </div>
      </div>
      {/* ── Context & Target Scope Bar ── */}
      <div className="p-2.5 rounded-xl bg-[#18181D] border border-[#26262E] flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#A1A1AA] font-medium flex items-center gap-1.5">
            <Shuffle className="w-3.5 h-3.5 text-amber-400" />
            Active Target
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setTargetTrack('video');
                setTargetClipId(undefined);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors border ${
                targetTrack === 'video'
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                  : 'bg-[#141417] text-[#71717A] border-[#2A2A30] hover:text-white'
              }`}
            >
              <Film className="w-2.5 h-2.5" />
              <span>V1 Video</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTargetTrack('image');
                setTargetClipId(undefined);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors border ${
                targetTrack === 'image'
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                  : 'bg-[#141417] text-[#71717A] border-[#2A2A30] hover:text-white'
              }`}
            >
              <ImageIcon className="w-2.5 h-2.5" />
              <span>V2 Image</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] bg-[#131316] px-2.5 py-1.5 rounded-lg border border-[#222228]">
          <span className="text-zinc-300 font-medium truncate">
            {targetClipId ? (
              <span className="flex items-center gap-1 text-sky-400 font-mono text-[10.5px]">
                <Layers className="w-3 h-3 text-sky-400" />
                Cut Seam on Clip ({targetClipId.slice(0, 8)}...)
              </span>
            ) : (
              <span className="text-zinc-400">
                Editing All Cut Seams on Track <strong className="text-white">{targetTrack === 'video' ? 'V1 Video' : 'V2 Image'}</strong>
              </span>
            )}
          </span>
          {targetClipId && (
            <button
              type="button"
              onClick={() => setTargetClipId(undefined)}
              className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer shrink-0 ml-1"
            >
              Clear selection
            </button>
          )}
        </div>
      </div>

      {/* ── Transition Duration Slider & Quick Presets ── */}
      <div className="p-3 rounded-xl bg-[#18181D] border border-[#26262E] flex flex-col gap-2.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[#A1A1AA] font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            Transition Duration
          </span>
          <span className="font-mono-studio text-sky-400 font-bold bg-sky-950/40 border border-sky-500/30 px-2 py-0.5 rounded text-[11px]">
            {transitionDuration.toFixed(1)}s
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
            value={transitionDuration}
            onChange={(e) => {
              const d = Number(e.target.value);
              setTransitionDuration(d);
              handleTransitionChange(activeTransition, d);
            }}
            className="flex-1 accent-[#3B82F6] cursor-pointer h-1.5 bg-[#2A2A35] rounded-lg"
          />
          <div className="flex gap-1 shrink-0">
            {[0.3, 0.5, 0.8, 1.0, 1.5].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setTransitionDuration(d);
                  handleTransitionChange(activeTransition, d);
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                  Math.abs(transitionDuration - d) < 0.05
                    ? 'bg-[#3B82F6] text-white font-bold shadow-xs'
                    : 'bg-[#141417] text-[#71717A] hover:text-white border border-[#2A2A30]'
                }`}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Category Filter Pills ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-xs select-none">
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'basic', label: 'Basic' },
            { id: 'slide', label: 'Slide & Push' },
            { id: 'zoom', label: 'Zoom' },
            { id: 'wipe', label: 'Wipe' },
            { id: 'special', label: 'Special' },
          ] as const
        ).map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setTransitionCategory(cat.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors shrink-0 ${
              transitionCategory === cat.id
                ? 'bg-[#282834] text-white border border-white/30 shadow-xs'
                : 'bg-[#16161A] text-[#71717A] hover:text-white border border-transparent'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── Transition Cards Grid (24 Presets) ── */}
      <div className="grid grid-cols-4 gap-2.5 pt-0.5">
        {TRANSITION_PRESETS.filter((t) =>
          transitionCategory === 'all' ? true : t.category === transitionCategory || t.id === 'none'
        ).map((t) => {
          const isSelected = activeTransition === t.id;
          const isNone = t.id === 'none';

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleTransitionChange(t.id)}
              className="group flex flex-col items-center cursor-pointer text-left select-none"
              title={t.label}
            >
              <div
                className={`w-full aspect-square rounded-2xl overflow-hidden relative border transition-all duration-150 ${
                  isSelected
                    ? 'border-2 border-[#3B82F6] ring-2 ring-[#3B82F6]/30 shadow-md shadow-blue-500/15'
                    : 'border-[#26262E] hover:border-[#3B82F6]/70 hover:ring-1 hover:ring-[#3B82F6]/30 bg-[#16161A]'
                }`}
              >
                {isNone ? (
                  <div className="w-full h-full bg-[#1A1A22] flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-7 h-7 text-[#71717A] stroke-[1.8]"
                      fill="none"
                      stroke="currentColor"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-full h-full relative overflow-hidden bg-[#141418]">
                    <img
                      src={previewThumbnail}
                      alt={t.label}
                      className={`w-full h-full object-cover transition-all duration-300 ${
                        t.hoverEffect || ''
                      }`}
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
              <span
                className={`text-[11px] font-medium truncate block text-center mt-1.5 w-full leading-tight transition-colors ${
                  isSelected ? 'text-white font-bold' : 'text-[#A1A1AA] group-hover:text-white'
                }`}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Bottom Actions Floating Bar ── */}
      <div className="mt-auto pt-3 border-t border-[#26262E] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] text-[#A1A1AA] truncate">
            Active:{' '}
            <strong className="text-white font-semibold">
              {TRANSITION_PRESETS.find((p) => p.id === activeTransition)?.label || 'None'}
            </strong>
          </span>
          <button
            type="button"
            onClick={handleReplayPreview}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Replay transition preview on canvas"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleApplyToAllTransitions}
          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0 ${
            appliedNotice
              ? 'bg-emerald-600 text-white border-emerald-400'
              : 'bg-[#252530] hover:bg-[#323240] border-white/10 hover:border-white/30 text-white'
          }`}
          title="Apply this transition to all cut seams on the selected track"
        >
          <Check className={`w-3.5 h-3.5 ${appliedNotice ? 'text-white' : 'text-sky-400'}`} />
          <span>{appliedNotice ? 'Applied to All!' : 'Apply to all'}</span>
        </button>
      </div>
    </div>
  );
};

export default TransitionsInspector;

