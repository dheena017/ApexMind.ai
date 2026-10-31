import { toast } from 'sonner';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Wand2,
  Crop, FlipHorizontal, FlipVertical, RotateCw, Minus, Plus, Film,
  Sliders, Zap, Palette, Clock, Volume2, VolumeX, RefreshCw,
  Sun, Contrast, Eye, Layers, Sparkles, Image as ImageIcon,
  Check, Maximize2, Lock, Unlock, Play, ChevronRight, Gauge,
  Smartphone, Monitor, Square,
} from 'lucide-react';
import { VisualBackdrop, DEFAULT_VISUAL_BACKDROPS } from '../../types';
import { SelectedClip } from '../timeline/timelineTypes';
import { CustomSelect } from '@/src/shared/ui/CustomSelect';

export type VideoInspectorTab =
  | 'transform'
  | 'animations'
  | 'adjust'
  | 'style'
  | 'speed'
  | 'audio'
  | 'time';

const VIDEO_STYLE_PRESETS = [
  { label: 'Natural', brightness: 100, contrast: 100, saturation: 100, vignette: 0, hue: 0, desc: 'Clean authentic look' },
  { label: 'Cine Warm', brightness: 105, contrast: 110, saturation: 115, vignette: 20, hue: 10, desc: 'Golden warm cinematic tone' },
  { label: 'Moody Teal', brightness: 95, contrast: 120, saturation: 85, vignette: 30, hue: -15, desc: 'Teal shadows with warm highlights' },
  { label: 'Noir B&W', brightness: 90, contrast: 130, saturation: 0, vignette: 35, hue: 0, desc: 'High contrast dramatic monochrome' },
  { label: 'Cyber Neon', brightness: 108, contrast: 125, saturation: 140, vignette: 15, hue: 45, desc: 'Vibrant futuristic glow' },
  { label: 'Vintage Kodachrome', brightness: 102, contrast: 105, saturation: 90, vignette: 25, hue: 5, desc: '1970s analog retro film' },
  { label: 'Bleach Bypass', brightness: 110, contrast: 140, saturation: 60, vignette: 40, hue: 0, desc: 'Gritty cinematic desaturation' },
  { label: 'Vivid Pop', brightness: 105, contrast: 115, saturation: 135, vignette: 0, hue: 0, desc: 'High saturation social feed pop' },
  { label: 'Golden Hour', brightness: 108, contrast: 108, saturation: 120, vignette: 18, hue: 15, desc: 'Rich amber sunset glow' },
  { label: 'Cold Glacier', brightness: 98, contrast: 112, saturation: 90, vignette: 20, hue: -25, desc: 'Arctic crisp blue tone' },
];

const LUT_PRESETS = [
  { id: 'none', label: 'None / Rec.709', desc: 'Standard standard' },
  { id: 'fuji-eterna', label: 'Fuji Eterna', desc: 'Soft contrast cinematic' },
  { id: 'kodak-vision', label: 'Kodak Vision3', desc: 'Hollywood classic blockbuster' },
  { id: 'alexa-logc', label: 'Arri Alexa LogC', desc: 'High dynamic range master' },
  { id: 'red-dragon', label: 'RED DragonColor', desc: 'Deep reds & punchy shadows' },
  { id: 'matrix-green', label: 'Matrix Acid Green', desc: 'Sci-fi cyberpunk tint' },
  { id: 'sepia-classic', label: 'Sepia Archival', desc: 'Antique historic warm tint' },
  { id: 'tokyo-drift', label: 'Tokyo Night Drive', desc: 'Neon cyan & magenta' },
];

const MOUNTAIN_PREVIEW_IMG = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=260&q=80';

const CANVAS_BG_PRESETS = [
  { label: 'Pure Black', value: '#000000' },
  { label: 'Studio Onyx', value: '#050505' },
  { label: 'Deep Slate', value: '#0F172A' },
  { label: 'Midnight Blue', value: '#0A0F24' },
  { label: 'Crimson Dark', value: '#1A080A' },
  { label: 'Cyber Violet', value: '#120826' },
  { label: 'Emerald Deep', value: '#061A12' },
  { label: 'Clean White', value: '#FFFFFF' },
];

export interface VideoCompoundInspectorProps {
  activeBackdrop: VisualBackdrop;
  backdrops: VisualBackdrop[];
  onSelectBackdrop: (backdropId: string) => void;
  duration?: number;
  onUpdateDuration?: (duration: number) => void;
  playbackRate?: number;
  onPlaybackRateChange?: (rate: number) => void;
  customImageUrl?: string;
  customVideoUrl?: string;
  onSetCustomImage?: (url: string | undefined) => void;
  onSetCustomVideo?: (url: string | undefined) => void;
  canvasBackground?: string;
  onCanvasBackgroundChange?: (bg: string) => void;
  canvasAspectRatio?: '9:16' | '16:9' | '1:1' | '4:5' | '21:9';
  onCanvasAspectRatioChange?: (ratio: '9:16' | '16:9' | '1:1' | '4:5' | '21:9') => void;
  initialSubTab?: VideoInspectorTab;
  selectedClip?: SelectedClip | null;
}

const formatTimeDigital = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};


const AI_ANIMATION_PAIRS: Record<string, { in: string; inDur: number; out: string; outDur: number }[]> = {
  viral: [
    { in: 'zoom-in', inDur: 0.3, out: 'slide-fade', outDur: 0.3 },
    { in: 'bounce', inDur: 0.4, out: 'flash', outDur: 0.3 },
    { in: 'spin', inDur: 0.35, out: 'zoom-out', outDur: 0.35 },
    { in: 'flip-x', inDur: 0.35, out: 'slide-right', outDur: 0.3 },
  ],
  cinematic: [
    { in: 'fade', inDur: 0.8, out: 'blur', outDur: 0.8 },
    { in: 'soft-reveal', inDur: 0.7, out: 'zoom-out', outDur: 0.8 },
    { in: 'blur', inDur: 0.8, out: 'fade', outDur: 0.8 },
    { in: 'zoom-in', inDur: 0.9, out: 'soft-reveal', outDur: 0.7 },
  ],
  clean: [
    { in: 'slide-up', inDur: 0.5, out: 'slide-fade', outDur: 0.4 },
    { in: 'slide-fade', inDur: 0.45, out: 'slide-down', outDur: 0.45 },
    { in: 'wipe-right', inDur: 0.5, out: 'wipe-down', outDur: 0.5 },
    { in: 'fade', inDur: 0.5, out: 'slide-fade', outDur: 0.4 },
  ],
  dramatic: [
    { in: 'flash', inDur: 0.4, out: 'zoom-out', outDur: 0.5 },
    { in: 'diamond', inDur: 0.5, out: 'spin', outDur: 0.45 },
    { in: 'flip-y', inDur: 0.45, out: 'flash', outDur: 0.35 },
    { in: 'circle', inDur: 0.5, out: 'diamond', outDur: 0.5 },
  ],
};

export const VideoCompoundInspector: React.FC<VideoCompoundInspectorProps> = ({
  activeBackdrop,
  backdrops,
  onSelectBackdrop,
  duration = 15,
  onUpdateDuration,
  playbackRate = 1,
  onPlaybackRateChange,
  customImageUrl,
  customVideoUrl,
  onSetCustomImage,
  onSetCustomVideo,
  canvasBackground = '#050505',
  onCanvasBackgroundChange,
  canvasAspectRatio = '9:16',
  onCanvasAspectRatioChange,
  initialSubTab = 'transform',
  selectedClip,
}) => {
  const backdropOptions = useMemo(() => {
    const list = (backdrops && Array.isArray(backdrops) && backdrops.length > 0)
      ? backdrops
      : DEFAULT_VISUAL_BACKDROPS;
    const finalItems = (list && list.length > 0) ? list : DEFAULT_VISUAL_BACKDROPS;
    return finalItems
      .filter((b) => b && (b.id || b.name))
      .map((b) => ({
        value: b.id || b.name,
        label: `${b.name || b.id}${b.category ? ` (${b.category})` : ''}`,
        description: b.category,
        badge: b.aspectRatio || '9:16',
      }));
  }, [backdrops]);
  const [activeSubTab, setActiveSubTab] = useState<VideoInspectorTab>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  useEffect(() => {
    const handleOpenTab = (e: Event) => {
      const detail = (e as CustomEvent<{ compound?: string; subTab?: VideoInspectorTab; tab?: VideoInspectorTab }>).detail;
      const targetTab = detail?.subTab || detail?.tab;
      if (detail && targetTab && (detail.compound === 'video' || !detail.compound)) {
        setActiveSubTab(targetTab);
      }
    };
    const handleSelectedDetails = (e: Event) => {
      const detail = (e as CustomEvent<{ selectedClip?: any; details?: any }>).detail;
      if (detail?.details) {
        if (detail.details.animationIn !== undefined) {
          setAnimationIn(detail.details.animationIn || 'none');
        }
        if (typeof detail.details.animationInDuration === 'number') {
          setAnimationInDuration(detail.details.animationInDuration);
        }
        if (detail.details.animationOut !== undefined) {
          setAnimationOut(detail.details.animationOut || 'none');
        }
        if (typeof detail.details.animationOutDuration === 'number') {
          setAnimationOutDuration(detail.details.animationOutDuration);
        }
      }
    };
    window.addEventListener('workspace:open-inspector-tab', handleOpenTab);
    window.addEventListener('workspace:selected-clip-details', handleSelectedDetails);
    return () => {
      window.removeEventListener('workspace:open-inspector-tab', handleOpenTab);
      window.removeEventListener('workspace:selected-clip-details', handleSelectedDetails);
    };
  }, []);

  const isImageMode = Boolean(customImageUrl && !customVideoUrl);

  useEffect(() => {
    if (isImageMode && (activeSubTab === 'speed' || activeSubTab === 'audio')) {
      setActiveSubTab('transform');
    }
  }, [isImageMode, activeSubTab]);

  // Transform states (user configurable)
  const [fitMode, setFitMode] = useState<'fill' | 'fit' | 'crop'>('fill');
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(100);
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(50);
  const [lockAspect, setLockAspect] = useState(true);

  // Time & Duration
  const [localDuration, setLocalDuration] = useState(duration > 0 ? duration : 15);

  useEffect(() => {
    if (duration > 0) setLocalDuration(duration);
  }, [duration]);

  // Visual adjustments
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [vignette, setVignette] = useState(0);
  const [hue, setHue] = useState(0);
  const [blur, setBlur] = useState(0);
  const [grain, setGrain] = useState(0);
  const [activeStyle, setActiveStyle] = useState('Natural');
  const [styleSection, setStyleSection] = useState<'all' | 'looks' | 'lut' | 'adjust'>('all');
  const hasAdjustments = brightness !== 100 || contrast !== 100 || saturation !== 100 || vignette !== 0 || hue !== 0 || blur !== 0 || grain !== 0;

    const [aiAnimMood, setAiAnimMood] = useState<'viral' | 'cinematic' | 'clean' | 'dramatic'>('viral');
  const [isAiAnimAnalyzing, setIsAiAnimAnalyzing] = useState(false);

  const handleAiAutoAnimateClip = () => {
    setIsAiAnimAnalyzing(true);
    const pairs = AI_ANIMATION_PAIRS[aiAnimMood] || AI_ANIMATION_PAIRS.viral;
    const chosen = pairs[Math.floor(Math.random() * pairs.length)];

    setTimeout(() => {
      setIsAiAnimAnalyzing(false);
      setAnimationIn(chosen.in);
      setAnimationInDuration(chosen.inDur);
      setAnimationOut(chosen.out);
      setAnimationOutDuration(chosen.outDur);

      const isSingleClip = Boolean(selectedClip && (selectedClip.track === 'video' || selectedClip.track === 'image') && 'clipId' in selectedClip && selectedClip.clipId && !selectedClip.all);
      const clipId = isSingleClip && selectedClip && 'clipId' in selectedClip ? selectedClip.clipId : undefined;

      window.dispatchEvent(
        new CustomEvent('workspace:update-clip-props', {
          detail: {
            track: isImageMode ? 'image' : 'video',
            clipId,
            animationIn: chosen.in,
            animationInDuration: chosen.inDur,
            animationOut: chosen.out,
            animationOutDuration: chosen.outDur,
          },
        })
      );

      window.dispatchEvent(
        new CustomEvent('workspace:preview-clip-animation', {
          detail: {
            type: chosen.in,
            direction: 'in',
            duration: chosen.inDur,
          },
        })
      );

      toast.success(`✨ AI Motion Applied: ${chosen.in} (In) → ${chosen.out} (Out)`, {
        description: `Optimized for ${aiAnimMood.toUpperCase()} pacing with ${chosen.inDur}s / ${chosen.outDur}s curves.`,
      });
    }, 450);
  };

  const handleAiAnimateAllClips = () => {
    setIsAiAnimAnalyzing(true);
    setTimeout(() => {
      setIsAiAnimAnalyzing(false);
      window.dispatchEvent(
        new CustomEvent('workspace:ai-smart-animations', {
          detail: {
            mood: aiAnimMood,
            track: isImageMode ? 'image' : 'video',
          },
        })
      );
      toast.success(`✨ AI Choreographed All Clips`, {
        description: `Synchronized alternating motion flow across all timeline cuts in ${aiAnimMood.toUpperCase()} style.`,
      });
    }, 500);
  };

  const [animDirection, setAnimDirection] = useState<'in' | 'out'>('out');

  const adjustmentGroups = useMemo(() => [
    {
      title: 'Basic Tone',
      items: [
        { label: 'Brightness', icon: <Sun className="w-3.5 h-3.5 text-amber-400" />, value: brightness, setter: setBrightness, min: 20, max: 200, unit: '%', def: 100 },
        { label: 'Contrast', icon: <Contrast className="w-3.5 h-3.5 text-sky-400" />, value: contrast, setter: setContrast, min: 20, max: 200, unit: '%', def: 100 },
        { label: 'Saturation', icon: <Palette className="w-3.5 h-3.5 text-blue-400" />, value: saturation, setter: setSaturation, min: 0, max: 200, unit: '%', def: 100 },
      ],
    },
    {
      title: 'Color & Mood',
      items: [
        { label: 'Vignette Darkening', icon: <Eye className="w-3.5 h-3.5 text-zinc-400" />, value: vignette, setter: setVignette, min: 0, max: 100, unit: '%', def: 0 },
        { label: 'Hue Rotate', icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />, value: hue, setter: setHue, min: -180, max: 180, unit: '°', def: 0 },
      ],
    },
    {
      title: 'Texture & Detail',
      items: [
        { label: 'Gaussian Blur', icon: <Layers className="w-3.5 h-3.5 text-blue-400" />, value: blur, setter: setBlur, min: 0, max: 20, unit: 'px', def: 0 },
        { label: 'Film Grain Intensity', icon: <Film className="w-3.5 h-3.5 text-yellow-400" />, value: grain, setter: setGrain, min: 0, max: 100, unit: '%', def: 0 },
      ],
    },
  ], [brightness, contrast, saturation, vignette, hue, blur, grain]);

  const [animationIn, setAnimationIn] = useState('none');
  const [animationInDuration, setAnimationInDuration] = useState(0.5);
  const [animationOut, setAnimationOut] = useState('none');
  const [animationOutDuration, setAnimationOutDuration] = useState(0.5);

  const handleInAnimChange = (anim: string, dur?: number) => {
    setAnimationIn(anim);
    const d = dur ?? animationInDuration;
    const isSingleVideoClip = Boolean(selectedClip && (selectedClip.track === 'video' || selectedClip.track === 'image') && 'clipId' in selectedClip && selectedClip.clipId && !selectedClip.all);
    const clipId = isSingleVideoClip && selectedClip && 'clipId' in selectedClip ? selectedClip.clipId : undefined;
    const applyToAll = !clipId;
    window.dispatchEvent(
      new CustomEvent('workspace:update-clip-props', {
        detail: {
          track: isImageMode ? 'image' : 'video',
          clipId,
          animationIn: anim,
          animationInDuration: d,
        },
      })
    );
  };

  const handleOutAnimChange = (anim: string, dur?: number) => {
    setAnimationOut(anim);
    const d = dur ?? animationOutDuration;
    const isSingleVideoClip = Boolean(selectedClip && (selectedClip.track === 'video' || selectedClip.track === 'image') && 'clipId' in selectedClip && selectedClip.clipId && !selectedClip.all);
    const clipId = isSingleVideoClip && selectedClip && 'clipId' in selectedClip ? selectedClip.clipId : undefined;
    const applyToAll = !clipId;
    window.dispatchEvent(
      new CustomEvent('workspace:update-clip-props', {
        detail: {
          track: isImageMode ? 'image' : 'video',
          clipId,
          animationOut: anim,
          animationOutDuration: d,
        },
      })
    );
  };

  // Audio & Animation states
  const [videoVolume, setVideoVolume] = useState(100);
  const [animation, setAnimation] = useState('none');
  const [animSpeed, setAnimSpeed] = useState<'0.5' | '1' | '1.5' | '2'>('1');
  const [activeLUT, setActiveLUT] = useState('none');
  const [lutIntensity, setLutIntensity] = useState(80);
  const [loopVideo, setLoopVideo] = useState(true);
  const [muteVideo, setMuteVideo] = useState(false);

  // Broadcast transform changes to the canvas in real time (scoped to clipId if single clip selected)
  useEffect(() => {
    const isSingleVideoClip = Boolean(selectedClip && selectedClip.track === 'video' && 'clipId' in selectedClip && selectedClip.clipId && !selectedClip.all);
    const clipId = isSingleVideoClip && selectedClip && 'clipId' in selectedClip ? selectedClip.clipId : undefined;
    const applyToAll = !clipId;
    window.dispatchEvent(
      new CustomEvent('workspace:backdrop-transform', {
        detail: { clipId, fitMode, flipH, flipV, rotation, scale, posX, posY, lockAspect },
      })
    );
    if (clipId) {
      window.dispatchEvent(
        new CustomEvent('workspace:update-clip-properties', {
          detail: {
            track: 'video',
            clipId,
            transform: { fitMode, flipH, flipV, rotation, scale, posX, posY, lockAspect },
          },
        })
      );
    }
  }, [fitMode, flipH, flipV, rotation, scale, posX, posY, lockAspect, selectedClip]);

  // Broadcast filter adjustments to the canvas (scoped to clipId if single clip selected)
  useEffect(() => {
    const isSingleVideoClip = Boolean(selectedClip && selectedClip.track === 'video' && 'clipId' in selectedClip && selectedClip.clipId && !selectedClip.all);
    const clipId = isSingleVideoClip && selectedClip && 'clipId' in selectedClip ? selectedClip.clipId : undefined;
    const applyToAll = !clipId;
    window.dispatchEvent(
      new CustomEvent('workspace:backdrop-filter', {
        detail: { clipId, brightness, contrast, saturate: saturation, vignette, hue, blur, grain, lut: activeLUT, lutIntensity },
      })
    );
    if (clipId) {
      window.dispatchEvent(
        new CustomEvent('workspace:update-clip-properties', {
          detail: {
            track: 'video',
            clipId,
            filterSettings: { brightness, contrast, saturate: saturation, vignette, hue, blur, grain, lut: activeLUT, lutIntensity, stylePreset: activeStyle },
          },
        })
      );
    }
  }, [brightness, contrast, saturation, vignette, hue, blur, grain, activeLUT, lutIntensity, selectedClip, activeStyle]);

  // Broadcast animation changes (scoped to clipId if single clip selected)
  useEffect(() => {
    const isSingleVideoClip = Boolean(selectedClip && selectedClip.track === 'video' && 'clipId' in selectedClip && selectedClip.clipId && !selectedClip.all);
    const clipId = isSingleVideoClip && selectedClip && 'clipId' in selectedClip ? selectedClip.clipId : undefined;
    const applyToAll = !clipId;
    window.dispatchEvent(
      new CustomEvent('workspace:backdrop-animation', {
        detail: { clipId, animation, speed: parseFloat(animSpeed) },
      })
    );
    if (clipId) {
      window.dispatchEvent(
        new CustomEvent('workspace:update-clip-properties', {
          detail: { track: 'video', clipId, animation },
        })
      );
    }
  }, [animation, animSpeed, selectedClip]);

  // Broadcast audio changes
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('workspace:backdrop-audio', {
        detail: { volume: muteVideo ? 0 : videoVolume },
      })
    );
  }, [videoVolume, muteVideo]);

  const handleResetTransform = () => {
    setFitMode('fill');
    setFlipH(false);
    setFlipV(false);
    setRotation(0);
    setScale(100);
    setPosX(50);
    setPosY(50);
  };

  const handleResetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setVignette(0);
    setHue(0);
    setBlur(0);
    setGrain(0);
    setActiveStyle('Natural');
    setActiveLUT('none');
  };

  const handleDurationChange = (newDur: number) => {
    const val = Math.max(0.5, Math.min(300, parseFloat(newDur.toFixed(1))));
    setLocalDuration(val);
    if (selectedClip && !selectedClip.all && 'clipId' in selectedClip && selectedClip.clipId) {
      window.dispatchEvent(
        new CustomEvent('workspace:update-clip-timing', {
          detail: {
            track: selectedClip.track,
            clipId: selectedClip.clipId,
            duration: val,
          },
        })
      );
    } else {
      onUpdateDuration?.(val);
    }
  };

  const applyStylePreset = (preset: typeof VIDEO_STYLE_PRESETS[0]) => {
    setBrightness(preset.brightness);
    setContrast(preset.contrast);
    setSaturation(preset.saturation);
    setVignette(preset.vignette);
    setHue(preset.hue);
    setActiveStyle(preset.label);
  };

  const tabs: VideoInspectorTab[] = isImageMode
    ? ['transform', 'animations', 'adjust', 'time']
    : ['transform', 'animations', 'adjust', 'speed', 'time'];

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none">
      {/* ── Subtabs Header Bar ── */}
      <div className="flex items-center gap-2.5 px-3 pt-2.5 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveSubTab(tab)}
            className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
              activeSubTab === tab
                ? 'text-white border-[#3B82F6]'
                : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        {Boolean(selectedClip && selectedClip.track === 'video' && 'clipId' in selectedClip && selectedClip.clipId && !selectedClip.all) && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs mb-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
              <span className="font-bold text-amber-200 truncate">
                Editing Clip: {'clipId' in selectedClip! ? selectedClip.clipId : ''}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-studio font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ISOLATED CLIP
              </span>
            </div>
          </div>
        )}

        {/* ── TRANSFORM TAB ── */}
        {activeSubTab === 'transform' && (
          <div className="flex flex-col gap-3.5 pt-0.5">
            {/* Aspect Ratio Selector */}
            <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-[#18181C] border border-[#282830]">
              <div className="flex items-center justify-between text-[10px] font-mono-studio text-[#71717A] uppercase tracking-wider font-bold">
                <span>Canvas Aspect Ratio</span>
                <span className="text-sky-400 font-bold">{canvasAspectRatio}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: '9:16' as const, label: '9:16', desc: 'Shorts/Reels', icon: Smartphone },
                  { id: '16:9' as const, label: '16:9', desc: 'Landscape', icon: Monitor },
                  { id: '1:1' as const, label: '1:1', desc: 'Square', icon: Square },
                  { id: '4:5' as const, label: '4:5', desc: 'Portrait', icon: Maximize2 },
                ].map((aspect) => {
                  const Icon = aspect.icon;
                  const isSelected = canvasAspectRatio === aspect.id;
                  return (
                    <button
                      key={aspect.id}
                      type="button"
                      onClick={() => {
                        onCanvasAspectRatioChange?.(aspect.id);
                        window.dispatchEvent(new CustomEvent('workspace:aspect-ratio-change', { detail: { aspectRatio: aspect.id } }));
                      }}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#1E293B] border-sky-500 text-sky-400 shadow-sm'
                          : 'bg-[#141417] border-[#2A2A30] text-[#71717A] hover:text-[#D4D4D8]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 mb-1" />
                      <span className="text-[10px] font-bold leading-none">{aspect.label}</span>
                      <span className="text-[8px] text-[#71717A] mt-0.5">{aspect.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fit Mode Cards */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Fit & Scaling Mode</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { mode: 'fill' as const, label: 'Cover / Fill', desc: 'No letterbox', icon: <Maximize2 className="w-4 h-4" /> },
                  { mode: 'fit' as const, label: 'Fit Aspect', desc: 'Full frame visible', icon: <div className="w-3 h-4 border border-white/70 rounded-xs" /> },
                  { mode: 'crop' as const, label: 'Center Crop', desc: 'Punch in center', icon: <Crop className="w-4 h-4" /> },
                ].map(({ mode, label, desc, icon }) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFitMode(mode)}
                    className={`py-2 px-1.5 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                      fitMode === mode
                        ? 'bg-[#1E2A3A] border-[#3B82F6] text-white shadow-md'
                        : 'bg-[#1C1C20] border-[#2A2A30] text-[#A1A1AA] hover:text-white hover:bg-[#222228]'
                    }`}
                  >
                    {icon}
                    <span className="text-[10px] font-bold leading-none">{label}</span>
                    <span className="text-[8px] text-[#71717A]">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scale Slider + Numeric Input */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#A1A1AA] flex items-center gap-1.5 font-medium">
                  Scale Zoom
                  <button
                    type="button"
                    onClick={() => setLockAspect(!lockAspect)}
                    className="cursor-pointer text-[#71717A] hover:text-white"
                    title={lockAspect ? 'Aspect ratio locked' : 'Aspect ratio free'}
                  >
                    {lockAspect ? <Lock className="w-3 h-3 text-[#3B82F6]" /> : <Unlock className="w-3 h-3 text-[#71717A]" />}
                  </button>
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="10"
                    max="400"
                    value={scale}
                    onChange={(e) => setScale(Math.max(10, Math.min(400, Number(e.target.value) || 100)))}
                    className="w-14 bg-[#121215] border border-[#2A2A30] rounded px-1.5 py-0.5 text-right font-mono-studio text-xs text-white outline-none"
                  />
                  <span className="text-[10px] text-[#71717A]">%</span>
                </div>
              </div>
              <input
                type="range"
                min="10"
                max="300"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-full accent-[#3B82F6] cursor-pointer"
              />
            </div>

            {/* Position Offset XY with Numeric Inputs */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2.5">
              <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Position Offset (Anchor)</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'X Center', value: posX, setter: setPosX },
                  { label: 'Y Center', value: posY, setter: setPosY },
                ].map((ctrl) => (
                  <div key={ctrl.label} className="flex flex-col gap-1">
                    <div className="flex justify-between text-[11px] items-center">
                      <span className="text-[#A1A1AA]">{ctrl.label}</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={ctrl.value}
                        onChange={(e) => ctrl.setter(Math.max(0, Math.min(100, Number(e.target.value) || 50)))}
                        className="w-11 bg-[#121215] border border-[#2A2A30] rounded px-1 py-0.5 text-right font-mono-studio text-[11px] text-white outline-none"
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={ctrl.value}
                      onChange={(e) => ctrl.setter(Number(e.target.value))}
                      className="w-full accent-[#8B5CF6] cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Flip & Rotation */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Rotation & Orientation</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFlipH(!flipH)}
                  className={`flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 border transition-colors cursor-pointer text-xs font-semibold ${
                    flipH ? 'bg-[#2E2E36] border-[#3B82F6] text-white' : 'bg-[#141417] border-[#2A2A30] text-[#A1A1AA] hover:bg-[#202026]'
                  }`}
                  title="Flip Horizontal"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  Flip H
                </button>
                <button
                  type="button"
                  onClick={() => setFlipV(!flipV)}
                  className={`flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 border transition-colors cursor-pointer text-xs font-semibold ${
                    flipV ? 'bg-[#2E2E36] border-[#3B82F6] text-white' : 'bg-[#141417] border-[#2A2A30] text-[#A1A1AA] hover:bg-[#202026]'
                  }`}
                  title="Flip Vertical"
                >
                  <FlipVertical className="w-3.5 h-3.5" />
                  Flip V
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="w-9 h-9 rounded-lg bg-[#141417] border border-[#2A2A30] flex items-center justify-center text-[#D4D4D8] hover:bg-[#202026] cursor-pointer"
                  title="Rotate +90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center bg-[#141417] border border-[#2A2A30] rounded-lg px-2 h-9 gap-1.5">
                  <button type="button" onClick={() => setRotation((r) => (r - 15 + 360) % 360)} className="text-[#71717A] hover:text-white cursor-pointer"><Minus className="w-3 h-3" /></button>
                  <span className="text-xs font-mono-studio text-white font-bold w-9 text-center">{rotation}°</span>
                  <button type="button" onClick={() => setRotation((r) => (r + 15) % 360)} className="text-[#71717A] hover:text-white cursor-pointer"><Plus className="w-3 h-3" /></button>
                </div>
              </div>
            </div>

            {/* Canvas Background Color Chooser */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Canvas Background Color</span>
                <span className="font-mono-studio text-[11px] text-white">{canvasBackground}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={canvasBackground.startsWith('#') ? canvasBackground : '#050505'}
                  onChange={(e) => onCanvasBackgroundChange?.(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-[#2A2A30] bg-transparent cursor-pointer shrink-0"
                />
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {CANVAS_BG_PRESETS.map((bg) => (
                    <button
                      key={bg.label}
                      type="button"
                      onClick={() => onCanvasBackgroundChange?.(bg.value)}
                      title={bg.label}
                      style={{ background: bg.value }}
                      className={`w-6 h-6 rounded-md border transition-transform cursor-pointer ${
                        canvasBackground === bg.value ? 'scale-110 border-white ring-2 ring-blue-500/50' : 'border-white/20 hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Active Backdrop Card & Preset Selector */}
            <div className="flex flex-col gap-2">
              {(customVideoUrl || customImageUrl || activeBackdrop?.id) && (
                <div className="w-full aspect-video rounded-xl overflow-hidden border border-[#2A2A30] bg-[#111114] relative">
                  {customVideoUrl ? (
                    <video src={customVideoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  ) : customImageUrl ? (
                    <img src={customImageUrl} alt="Custom backdrop" className="w-full h-full object-cover" />
                  ) : activeBackdrop?.imageUrl ? (
                    <img src={activeBackdrop.imageUrl} alt={activeBackdrop.name} className="w-full h-full object-cover opacity-80" />
                  ) : (
                    <div className="w-full h-full" style={{ background: activeBackdrop?.previewColor || '#1a1a2e' }} />
                  )}
                  <div className="absolute top-1.5 left-1.5 bg-black/70 text-[9px] text-white px-2 py-0.5 rounded font-mono-studio backdrop-blur-sm">
                    {customVideoUrl ? 'Custom Video' : customImageUrl ? 'Custom Image' : activeBackdrop?.name || 'Backdrop'}
                  </div>
                  {(customImageUrl || customVideoUrl) && (
                    <button
                      type="button"
                      onClick={() => { onSetCustomImage?.(undefined); onSetCustomVideo?.(undefined); }}
                      className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-black/90 text-white text-[10px] px-2 py-0.5 rounded border border-white/20 cursor-pointer"
                    >
                      Clear Custom
                    </button>
                  )}
                </div>
              )}

              <CustomSelect
                label="Select Visual Backdrop"
                labelClassName="text-[10px] text-[#71717A] uppercase font-bold tracking-wider mb-1 block"
                value={customVideoUrl || customImageUrl ? '' : (activeBackdrop?.id || '')}
                onChange={(backdropId) => {
                  onSetCustomImage?.(undefined);
                  onSetCustomVideo?.(undefined);
                  onSelectBackdrop(backdropId);
                }}
                options={backdropOptions}
                icon={<Film className="w-3.5 h-3.5 text-[#60A5FA]" />}
                placeholder={
                  customVideoUrl
                    ? 'Custom Video active — switch to preset...'
                    : customImageUrl
                    ? 'Custom Image active — switch to preset...'
                    : 'Choose backdrop preset...'
                }
                buttonClassName="bg-[#1C1C20] border-[#2A2A30] hover:border-[#3B82F6]/50"
                menuClassName="bg-[#1C1C20] border-[#2A2A30]"
              />
            </div>

            {/* Reset Button */}
            <button
              type="button"
              onClick={handleResetTransform}
              className="w-full py-2 rounded-xl bg-[#1C1C20] hover:bg-[#282830] border border-[#2A2A30] text-xs font-semibold text-[#A1A1AA] hover:text-white transition cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset All Transform Values
            </button>
          </div>
        )}

        {/* ── ANIMATIONS TAB (In & Out Animations) ── */}
        {activeSubTab === 'animations' && (
          <div className="flex flex-col gap-3 pt-0.5 select-none">
            {/* In / Out Direction Segmented Pill Switcher */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-[#18181D] border border-[#26262E]">
              <button
                type="button"
                onClick={() => setAnimDirection('in')}
                className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  animDirection === 'in'
                    ? 'bg-[#282834] text-white shadow-xs border border-white/10'
                    : 'text-[#71717A] hover:text-white'
                }`}
              >
                In
              </button>
              <button
                type="button"
                onClick={() => setAnimDirection('out')}
                className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  animDirection === 'out'
                    ? 'bg-[#282834] text-white shadow-xs border border-white/10'
                    : 'text-[#71717A] hover:text-white'
                }`}
              >
                Out
              </button>
            </div>

            {/* Animation Duration Slider */}
            <div className="p-2.5 rounded-xl bg-[#18181D] border border-[#26262E] flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#A1A1AA] font-medium">
                  {animDirection === 'in' ? 'In Animation Duration' : 'Out Animation Duration'}
                </span>
                <span className="font-mono-studio text-sky-400 font-bold bg-sky-950/40 border border-sky-500/30 px-2 py-0.5 rounded text-[11px]">
                  {(animDirection === 'in' ? animationInDuration : animationOutDuration).toFixed(1)}s
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={animDirection === 'in' ? animationInDuration : animationOutDuration}
                  onChange={(e) => {
                    const d = Number(e.target.value);
                    if (animDirection === 'in') {
                      setAnimationInDuration(d);
                      handleInAnimChange(animationIn, d);
                    } else {
                      setAnimationOutDuration(d);
                      handleOutAnimChange(animationOut, d);
                    }
                  }}
                  className="flex-1 accent-[#3B82F6] cursor-pointer h-1.5 bg-[#2A2A35] rounded-lg"
                />
                <div className="flex gap-1 shrink-0">
                  {[0.3, 0.5, 0.8, 1.0].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        if (animDirection === 'in') {
                          setAnimationInDuration(d);
                          handleInAnimChange(animationIn, d);
                        } else {
                          setAnimationOutDuration(d);
                          handleOutAnimChange(animationOut, d);
                        }
                      }}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                        Math.abs((animDirection === 'in' ? animationInDuration : animationOutDuration) - d) < 0.05
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

            {/* Animation Presets Grid (4 columns, comprehensive modern motion suite) */}
            <div className="grid grid-cols-4 gap-2.5 pt-0.5">
              {[
                {
                  id: 'none',
                  label: 'None',
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#71717A] stroke-[1.8]" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="8" />
                      <line x1="6.3" y1="6.3" x2="17.7" y2="17.7" />
                    </svg>
                  ),
                },
                {
                  id: 'fade',
                  label: 'Fade',
                  icon: (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-700/30 border border-white/10 shadow-inner" />
                  ),
                },
                {
                  id: 'blur',
                  label: 'Blur',
                  icon: (
                    <div className="w-9 h-9 rounded-xl bg-white/70 blur-[2px] shadow-sm" />
                  ),
                },
                {
                  id: 'zoom-in',
                  label: 'Zoom In',
                  icon: (
                    <div className="w-10 h-10 rounded-xl bg-[#202026] border border-white/20 flex items-center justify-center relative">
                      <div className="w-7 h-7 rounded-lg bg-white/40 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-md bg-white shadow-xs" />
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'zoom-out',
                  label: 'Zoom Out',
                  icon: (
                    <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center relative shadow-xs">
                      <div className="w-7 h-7 rounded-lg bg-[#222228] flex items-center justify-center">
                        <div className="w-4 h-4 rounded-md bg-[#121216] border border-white/20" />
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'slide-fade',
                  label: 'Slide Fade',
                  icon: (
                    <div className="w-10 h-10 relative flex items-center justify-center">
                      <div className="w-6 h-6 rounded-lg bg-white/25 absolute left-1" />
                      <div className="w-6 h-6 rounded-lg bg-white/50 absolute left-2.5" />
                      <div className="w-6 h-6 rounded-lg bg-white absolute left-4 shadow-sm" />
                    </div>
                  ),
                },
                {
                  id: 'soft-reveal',
                  label: 'Soft Reveal',
                  icon: (
                    <div className="w-9 h-9 rounded-xl overflow-hidden relative bg-[#1c1c24] border border-white/10">
                      <div className="absolute inset-0 bg-gradient-to-br from-white via-zinc-300 to-transparent" />
                    </div>
                  ),
                },
                {
                  id: 'circle',
                  label: 'Circle',
                  icon: (
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center relative">
                      <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-white/50 flex items-center justify-center">
                          <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'slide-left',
                  label: 'Slide Left',
                  icon: (
                    <div className="w-10 h-10 rounded-xl bg-[#1b1b22] border border-white/15 flex items-center justify-center relative">
                      <div className="w-7 h-6 rounded-md bg-white/80 flex items-center justify-center shadow-xs -translate-x-1">
                        <svg className="w-3.5 h-3.5 text-zinc-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'slide-right',
                  label: 'Slide Right',
                  icon: (
                    <div className="w-10 h-10 rounded-xl bg-[#1b1b22] border border-white/15 flex items-center justify-center relative">
                      <div className="w-7 h-6 rounded-md bg-white/80 flex items-center justify-center shadow-xs translate-x-1">
                        <svg className="w-3.5 h-3.5 text-zinc-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'slide-up',
                  label: 'Slide Up',
                  icon: (
                    <div className="w-10 h-10 rounded-xl bg-[#1b1b22] border border-white/15 flex items-center justify-center relative">
                      <div className="w-7 h-6 rounded-md bg-white/80 flex items-center justify-center shadow-xs -translate-y-1">
                        <svg className="w-3.5 h-3.5 text-zinc-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'slide-down',
                  label: 'Slide Down',
                  icon: (
                    <div className="w-10 h-10 rounded-xl bg-[#1b1b22] border border-white/15 flex items-center justify-center relative">
                      <div className="w-7 h-6 rounded-md bg-white/80 flex items-center justify-center shadow-xs translate-y-1">
                        <svg className="w-3.5 h-3.5 text-zinc-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'spin',
                  label: 'Spin 360',
                  icon: (
                    <div className="w-10 h-10 rounded-xl bg-[#1b1b22] border border-white/15 flex items-center justify-center relative">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-sky-400 to-indigo-300 rotate-45 shadow-sm flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-xs bg-zinc-900" />
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'bounce',
                  label: 'Bounce',
                  icon: (
                    <div className="w-10 h-10 rounded-xl bg-[#1b1b22] border border-white/15 flex items-center justify-center relative">
                      <div className="w-7 h-7 rounded-xl bg-white shadow-md flex items-center justify-center scale-105">
                        <div className="w-3 h-3 rounded-md bg-amber-500" />
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'flip-x',
                  label: 'Flip 3D',
                  icon: (
                    <div className="w-10 h-10 rounded-xl bg-[#1b1b22] border border-white/15 flex items-center justify-center relative overflow-hidden">
                      <div className="w-4 h-7 rounded-sm bg-gradient-to-r from-white to-zinc-400 shadow-sm transform -skew-y-12" />
                    </div>
                  ),
                },
                {
                  id: 'flip-y',
                  label: 'Tilt 3D',
                  icon: (
                    <div className="w-10 h-10 rounded-xl bg-[#1b1b22] border border-white/15 flex items-center justify-center relative overflow-hidden">
                      <div className="w-7 h-4 rounded-sm bg-gradient-to-b from-white to-zinc-400 shadow-sm transform -skew-x-12" />
                    </div>
                  ),
                },
                {
                  id: 'wipe-right',
                  label: 'Wipe H',
                  icon: (
                    <div className="w-9 h-9 rounded-xl border border-white/20 overflow-hidden flex bg-zinc-900">
                      <div className="w-1/2 h-full bg-white" />
                      <div className="w-1/2 h-full bg-zinc-800" />
                    </div>
                  ),
                },
                {
                  id: 'wipe-down',
                  label: 'Wipe V',
                  icon: (
                    <div className="w-9 h-9 rounded-xl border border-white/20 overflow-hidden flex flex-col bg-zinc-900">
                      <div className="w-full h-1/2 bg-white" />
                      <div className="w-full h-1/2 bg-zinc-800" />
                    </div>
                  ),
                },
                {
                  id: 'diamond',
                  label: 'Diamond',
                  icon: (
                    <div className="w-10 h-10 rounded-xl bg-[#1b1b22] border border-white/15 flex items-center justify-center relative">
                      <div className="w-6 h-6 bg-white rotate-45 rounded-sm shadow-xs" />
                    </div>
                  ),
                },
                {
                  id: 'flash',
                  label: 'Flash Glow',
                  icon: (
                    <div className="w-10 h-10 rounded-xl bg-[#1b1b22] border border-white/15 flex items-center justify-center relative">
                      <div className="w-6 h-6 rounded-full bg-amber-300 blur-[2px] shadow-lg shadow-amber-400/50 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                      </div>
                    </div>
                  ),
                },
              ].map((item) => {
                const currentActive = animDirection === 'in' ? animationIn : animationOut;
                const isSelected = currentActive === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (animDirection === 'in') {
                        handleInAnimChange(item.id);
                      } else {
                        handleOutAnimChange(item.id);
                      }
                      window.dispatchEvent(
                        new CustomEvent('workspace:preview-clip-animation', {
                          detail: {
                            type: item.id,
                            direction: animDirection,
                            duration: animDirection === 'in' ? animationInDuration : animationOutDuration,
                          },
                        })
                      );
                    }}
                    className="group flex flex-col items-center cursor-pointer text-left select-none"
                    title={item.label}
                  >
                    <div
                      className={`w-full aspect-square rounded-2xl overflow-hidden relative border transition-all duration-150 flex items-center justify-center bg-[#15151A] ${
                        isSelected
                          ? 'border-2 border-[#3B82F6] ring-2 ring-[#3B82F6]/30 shadow-md shadow-blue-500/15'
                          : 'border-[#26262E] hover:border-[#3B82F6]/70 hover:ring-1 hover:ring-[#3B82F6]/30'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <span
                      className={`text-[11px] font-medium truncate block text-center mt-1.5 w-full leading-tight transition-colors ${
                        isSelected ? 'text-white font-bold' : 'text-[#A1A1AA] group-hover:text-white'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ADJUST TAB (Direct Access) ── */}
        {activeSubTab === 'adjust' && (
          <div className="flex flex-col gap-3.5 pt-0.5">
            {/* Quick Presets Carousel */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-mono-studio text-[#71717A] uppercase tracking-wider font-bold">
                Quick Look Style
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                {VIDEO_STYLE_PRESETS.map((p) => {
                  const isCur = activeStyle === p.label;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => applyStylePreset(p)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer border ${
                        isCur
                          ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 shadow-xs'
                          : 'bg-[#18181C] text-[#A1A1AA] border-[#2A2A30] hover:text-white hover:border-[#383842]'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reset All Adjustments */}
            {hasAdjustments && (
              <button
                type="button"
                onClick={handleResetAdjustments}
                className="w-full py-1.5 rounded-lg bg-[#222228] hover:bg-[#2C2C34] text-xs font-semibold text-zinc-300 hover:text-white border border-[#303038] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 text-amber-400" />
                Reset Tone & Adjustments
              </button>
            )}

            {/* Sliders Groups */}
            {adjustmentGroups.map((group) => (
              <div key={group.title} className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-3">
                <span className="text-[10px] font-mono-studio text-[#71717A] uppercase tracking-wider font-bold">
                  {group.title}
                </span>
                {group.items.map((item) => (
                  <div key={item.label} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#A1A1AA] flex items-center gap-1.5 font-medium">
                        {item.icon}
                        {item.label}
                      </span>
                      <span className="font-mono-studio text-sky-400 font-bold">
                        {item.value}{item.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={item.min}
                        max={item.max}
                        value={item.value}
                        onChange={(e) => item.setter(Number(e.target.value))}
                        className="flex-1 accent-[#3B82F6] cursor-pointer h-1.5 bg-[#2A2A35] rounded-lg"
                      />
                      {item.value !== item.def && (
                        <button
                          type="button"
                          onClick={() => item.setter(item.def)}
                          className="text-[9px] font-mono text-zinc-500 hover:text-zinc-200 cursor-pointer"
                        >
                          reset
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── STYLE TAB (Merged Cinematic Looks & 3D LUTs) ── */}
        {activeSubTab === 'style' && (
          <div className="flex flex-col gap-3.5 pt-0.5">
            {/* Top Sub-category Navigation Pills + Quick Reset */}
            <div className="flex items-center justify-between pb-0.5">
              <div className="flex items-center gap-1 bg-[#16161A] p-0.5 rounded-lg border border-[#282830]">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'looks', label: 'Looks' },
                  { id: 'lut', label: '3D LUT' },
                  { id: 'adjust', label: 'Adjust' },
                ].map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setStyleSection(sec.id as any)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      styleSection === sec.id
                        ? 'bg-[#2A2A36] text-white shadow-xs'
                        : 'text-[#71717A] hover:text-[#A1A1AA]'
                    }`}
                  >
                    {sec.label}
                    {sec.id === 'adjust' && hasAdjustments && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleResetAdjustments}
                className="text-[10px] text-[#71717A] hover:text-white flex items-center gap-1 cursor-pointer transition-colors px-2 py-1 rounded hover:bg-[#1E1E24]"
                title="Reset all look presets, LUTs, and color adjustments to default"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                Reset All
              </button>
            </div>
            {(styleSection === 'all' || styleSection === 'looks') && (
              <div className="flex flex-col gap-2">
              <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-amber-400" />Cinematic Look Presets</span>
                <span className="font-mono-studio text-[10px] text-[#A1A1AA]">{activeStyle}</span>
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {VIDEO_STYLE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyStylePreset(preset)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      activeStyle === preset.label
                        ? 'bg-[#1E2A3A] border-[#3B82F6] text-white shadow-md'
                        : 'bg-[#18181C] border-[#282830] text-[#A1A1AA] hover:bg-[#202026] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-white">{preset.label}</span>
                      {activeStyle === preset.label && <Check className="w-3 h-3 text-[#3B82F6]" />}
                    </div>
                    <p className="text-[9px] text-[#71717A] leading-tight">{preset.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            )}

            {/* 3D LUT Film Emulation */}
            {(styleSection === 'all' || styleSection === 'lut') && (
              <div className={styleSection === 'all' ? "border-t border-[#26262B] pt-3 flex flex-col gap-2" : "flex flex-col gap-2"}>
              <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Film className="w-3 h-3 text-sky-400" />3D LUT Film Emulation</span>
                <span className="font-mono-studio text-[10px] text-[#A1A1AA]">
                  {LUT_PRESETS.find((l) => l.id === activeLUT)?.label || 'None'}
                </span>
              </span>
              <div className="flex flex-col gap-1.5">
                {LUT_PRESETS.map((lut) => (
                  <button
                    key={lut.id}
                    type="button"
                    onClick={() => setActiveLUT(lut.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                      activeLUT === lut.id
                        ? 'bg-[#1E2A3A] border-[#3B82F6] text-white shadow-sm'
                        : 'bg-[#18181C] border-[#282830] text-[#A1A1AA] hover:bg-[#202026] hover:text-white'
                    }`}
                  >
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-white block">{lut.label}</span>
                      <span className="text-[10px] text-[#71717A]">{lut.desc}</span>
                    </div>
                    {activeLUT === lut.id && <Check className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />}
                  </button>
                ))}
              </div>

              {activeLUT !== 'none' && (
                <div className="mt-2.5 p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#A1A1AA]">LUT Blend Mix</span>
                    <span className="font-mono-studio text-white font-bold">{lutIntensity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={lutIntensity}
                    onChange={(e) => setLutIntensity(Number(e.target.value))}
                    className="w-full accent-[#3B82F6] cursor-pointer"
                  />
                </div>
              )}
            </div>
            )}

            {/* Color & Tone Adjustments Grouped */}
            {(styleSection === 'all' || styleSection === 'adjust') && (
              <div className={`flex flex-col gap-3 ${styleSection === 'all' ? 'border-t border-[#26262B] pt-3.5' : 'pt-0.5'}`}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-400" />
                    Color & Tone Controls
                  </span>
                  <button
                    type="button"
                    onClick={handleResetAdjustments}
                    className="text-[10px] text-[#3B82F6] hover:text-blue-300 cursor-pointer flex items-center gap-1 font-medium"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    Reset Sliders
                  </button>
                </div>

                {adjustmentGroups.map((group) => {
                  const isGroupModified = group.items.some((item) => item.value !== item.def);
                  return (
                    <div key={group.title} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between px-0.5">
                        <span className="text-[10px] font-mono-studio text-[#A1A1AA] uppercase tracking-wider font-semibold">
                          {group.title}
                        </span>
                        {isGroupModified && (
                          <span className="text-[9px] text-blue-400 font-mono-studio bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                            Modified
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        {group.items.map((ctrl) => {
                          const isModified = ctrl.value !== ctrl.def;
                          return (
                            <div
                              key={ctrl.label}
                              className={`p-2.5 rounded-xl border transition-colors flex flex-col gap-1.5 ${
                                isModified ? 'bg-[#1A1A22] border-[#3B82F6]/40' : 'bg-[#18181C] border-[#282830]'
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5">
                                  {ctrl.icon}
                                  <span className={`font-medium ${isModified ? 'text-white font-semibold' : 'text-[#A1A1AA]'}`}>
                                    {ctrl.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    min={ctrl.min}
                                    max={ctrl.max}
                                    value={ctrl.value}
                                    onChange={(e) => ctrl.setter(Number(e.target.value))}
                                    className="w-12 bg-[#121215] border border-[#2A2A30] focus:border-[#3B82F6] rounded px-1 py-0.5 text-right font-mono-studio text-[11px] text-white outline-none transition-colors"
                                  />
                                  <span className="text-[10px] text-[#71717A] w-3">{ctrl.unit}</span>
                                  <button
                                    type="button"
                                    onClick={() => ctrl.setter(ctrl.def)}
                                    title={`Reset to default (${ctrl.def}${ctrl.unit})`}
                                    disabled={!isModified}
                                    className={`cursor-pointer ml-1 p-0.5 rounded transition-colors ${
                                      isModified ? 'text-[#A1A1AA] hover:text-white hover:bg-[#2A2A34]' : 'text-[#444] cursor-not-allowed opacity-40'
                                    }`}
                                  >
                                    <RefreshCw className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                              <input
                                type="range"
                                min={ctrl.min}
                                max={ctrl.max}
                                value={ctrl.value}
                                onChange={(e) => ctrl.setter(Number(e.target.value))}
                                className="w-full accent-[#3B82F6] cursor-pointer"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TRANSITIONS TAB ── */}
        {/* ── SPEED TAB ── */}
        {activeSubTab === 'speed' && (
          <div className="flex flex-col gap-3.5 pt-0.5">
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Playback Velocity Multiplier</span>
              <div className="grid grid-cols-4 gap-1.5">
                {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => onPlaybackRateChange?.(rate)}
                    className={`py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      playbackRate === rate
                        ? 'bg-[#3B82F6] border-transparent text-white shadow-sm'
                        : 'bg-[#141417] border-[#2A2A30] text-[#71717A] hover:text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex items-center justify-between">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-white">Loop Backdrop Clip</p>
                <p className="text-[10px] text-[#71717A]">Automatically restart video at end</p>
              </div>
              <button
                type="button"
                onClick={() => setLoopVideo(!loopVideo)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  loopVideo ? 'bg-[#3B82F6]' : 'bg-[#2A2A30]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    loopVideo ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* ── AUDIO TAB ── */}
        {activeSubTab === 'audio' && (
          <div className="flex flex-col gap-3.5 pt-0.5">
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A1A1AA] flex items-center gap-1.5 font-medium">
                  {muteVideo ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                  Video Track Audio
                </span>
                <span className="font-mono-studio text-white font-bold">{muteVideo ? 'MUTED' : `${videoVolume}%`}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={muteVideo ? 0 : videoVolume}
                onChange={(e) => {
                  setVideoVolume(Number(e.target.value));
                  if (muteVideo) setMuteVideo(false);
                }}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMuteVideo(!muteVideo)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    muteVideo ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-[#141417] border-[#2A2A30] text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  {muteVideo ? 'Unmute Track' : 'Mute Track'}
                </button>
                <button
                  type="button"
                  onClick={() => { setVideoVolume(100); setMuteVideo(false); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#141417] border border-[#2A2A30] text-[#A1A1AA] hover:text-white cursor-pointer"
                >
                  100%
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TIME TAB ── */}
        {activeSubTab === 'time' && (
          <div className={`flex flex-col gap-3 ${styleSection === 'all' ? 'border-t border-[#26262B] pt-3.5 mt-2' : 'pt-0.5'}`}>
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#A1A1AA] font-medium">Active Clip Duration</span>
                <span className="font-mono-studio text-white font-bold">{formatTimeDigital(localDuration)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDurationChange(localDuration - 1)}
                  className="w-9 h-9 rounded-lg bg-[#141417] border border-[#2A2A30] flex items-center justify-center text-white hover:bg-[#222228] cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="300"
                  value={localDuration}
                  onChange={(e) => handleDurationChange(Number(e.target.value) || 1)}
                  className="flex-1 bg-[#121215] border border-[#2A2A30] rounded-lg px-2.5 py-1.5 text-center font-mono-studio text-sm text-white font-bold outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleDurationChange(localDuration + 1)}
                  className="w-9 h-9 rounded-lg bg-[#141417] border border-[#2A2A30] flex items-center justify-center text-white hover:bg-[#222228] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-1.5 text-[11px] font-mono-studio">
              <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider mb-0.5">Timeline Diagnostics</span>
              <div className="flex justify-between"><span className="text-[#71717A]">Framerate</span><span className="text-white">30.00 fps</span></div>
              <div className="flex justify-between"><span className="text-[#71717A]">Total Frames</span><span className="text-white">{Math.round(localDuration * 30)} frames</span></div>
              <div className="flex justify-between"><span className="text-[#71717A]">Clip Speed</span><span className="text-white">{playbackRate}x</span></div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default VideoCompoundInspector;
