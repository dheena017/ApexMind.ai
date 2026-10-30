import React, { useState, useEffect, useRef } from 'react';
import {
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Minus, Plus, Type,
  Sparkles, Bold, Italic, Underline, Strikethrough, LetterSpacing,
  Eye, Copy, RotateCw, Zap, Star, Wand2, Check, Sliders, RefreshCw,
  Palette, Move, Lock,
} from 'lucide-react';
import { GeneratedScript, ScriptSubtitle } from '../../types';
import { SelectedClip } from '../timeline/timelineTypes';
import { CustomSelect } from '@/src/shared/ui/CustomSelect';

export interface TextCompoundInspectorProps {
  script?: GeneratedScript;
  onUpdateScript?: (updated: Partial<GeneratedScript>) => void;
  captionColor?: string;
  onCaptionColorChange?: (color: string) => void;
  selectedClip?: SelectedClip | null;
  onUpdateSubtitles?: (subtitles: ScriptSubtitle[]) => void;
}

const CAPTION_ANIMATION_PRESETS = [
  { id: 'fade', label: 'Soft Fade In', desc: 'Smooth word fade-in', icon: '✨' },
  { id: 'pop', label: 'Viral Pop & Zoom', desc: 'Punchy scale punch per word', icon: '💥' },
  { id: 'karaoke', label: 'Karaoke Highlighter', desc: 'Active word highlighted in gold', icon: '🎤' },
  { id: 'typewriter', label: 'Typewriter Tick', desc: 'Rapid letter-by-letter typing', icon: '⌨️' },
  { id: 'slide', label: 'Slide Up Reveal', desc: 'Dynamic upward sliding entrance', icon: '⬆️' },
  { id: 'blur', label: 'Cinematic Blur In', desc: 'Sharpens from atmospheric blur', icon: '🎯' },
  { id: 'glitch', label: 'Cyber Glitch Shutter', desc: 'Micro glitch flicker effect', icon: '⚡' },
  { id: 'wave', label: 'Dynamic Wave Bounce', desc: 'Rhythmic organic wave bounce', icon: '🌊' },
];

const FONT_PRESETS = [
  { id: 'Montserrat', label: 'Montserrat', style: 'Bold & Punchy' },
  { id: 'Inter', label: 'Inter', style: 'Modern Clean' },
  { id: 'Outfit', label: 'Outfit', style: 'Contemporary' },
  { id: 'Oswald', label: 'Oswald', style: 'Tall Impact' },
  { id: 'Bebas Neue', label: 'Bebas Neue', style: 'Cinematic Title' },
  { id: 'Roboto', label: 'Roboto', style: 'Balanced' },
  { id: 'Space Grotesk', label: 'Space Grotesk', style: 'Tech & Sci-Fi' },
  { id: 'Playfair Display', label: 'Playfair Display', style: 'Classic Elegant' },
  { id: 'Poppins', label: 'Poppins', style: 'Geometric Friendly' },
  { id: 'Syne', label: 'Syne', style: 'Artistic High-Fashion' },
  { id: 'Bangers', label: 'Bangers', style: 'Comic Bold' },
  { id: 'Archivo Black', label: 'Archivo Black', style: 'Heavy Duty' },
  { id: 'Caveat', label: 'Caveat', style: 'Handwritten Script' },
  { id: 'Cinzel', label: 'Cinzel', style: 'Roman Luxury' },
  { id: 'Fira Code', label: 'Fira Code', style: 'Developer Monospace' },
];

const TEXT_STYLE_COMBOS = [
  { label: 'Viral Yellow', color: '#FACC15', font: 'Montserrat', weight: 'Black', size: 68, shadow: true, stroke: true, strokeColor: '#000000', strokeWidth: 3 },
  { label: 'Clean Studio', color: '#FFFFFF', font: 'Inter', weight: 'Bold', size: 56, shadow: true, stroke: false, strokeColor: '#000000', strokeWidth: 0 },
  { label: 'Cinematic Title', color: '#E2E8F0', font: 'Oswald', weight: 'Bold', size: 64, shadow: true, stroke: false, strokeColor: '#000000', strokeWidth: 0 },
  { label: 'Cyberpunk Neon', color: '#22D3EE', font: 'Bebas Neue', weight: 'Bold', size: 70, shadow: true, stroke: true, strokeColor: '#083344', strokeWidth: 2 },
  { label: 'Luxury Gold', color: '#FCD34D', font: 'Cinzel', weight: 'Bold', size: 58, shadow: true, stroke: false, strokeColor: '#000000', strokeWidth: 0 },
  { label: 'Stoic Minimal', color: '#E4E4E7', font: 'Outfit', weight: 'Medium', size: 52, shadow: false, stroke: false, strokeColor: '#000000', strokeWidth: 0 },
];

const COLOR_PALETTE = [
  '#FFFFFF', '#000000', '#FACC15', '#F59E0B', '#EF4444',
  '#EC4899', '#A855F7', '#6366F1', '#3B82F6', '#06B6D4',
  '#10B981', '#84CC16', '#F43F5E', '#D946EF', '#D4D4D8',
];

export const TextCompoundInspector: React.FC<TextCompoundInspectorProps> = ({
  script,
  onUpdateScript,
  captionColor,
  onCaptionColorChange,
  selectedClip,
  onUpdateSubtitles,
}) => {
  const effectiveSubtitles: ScriptSubtitle[] = (script?.subtitles && script.subtitles.length > 0)
    ? script.subtitles
    : ((script?.storyboard?.filter((sc) => sc.subtitleText).map((sc) => ({
        text: sc.subtitleText || '',
        start: sc.start,
        duration: sc.duration,
        captionPresetClass: sc.captionPresetClass,
        captionPresetColor: sc.captionPresetColor,
      })) as ScriptSubtitle[]) || []);

  const isSingleCue = Boolean(
    selectedClip?.track === 'caption' &&
    !selectedClip.all &&
    typeof selectedClip.index === 'number' &&
    selectedClip.index >= 0 &&
    selectedClip.index < (effectiveSubtitles.length || 0)
  );
  const isTitleSelected = Boolean(selectedClip?.track === 'title');

  const activeCueIndex = isSingleCue && selectedClip?.track === 'caption' ? (selectedClip.index ?? 0) : null;
  const activeCue = activeCueIndex !== null && effectiveSubtitles[activeCueIndex]
    ? effectiveSubtitles[activeCueIndex]
    : null;

  const [titleTiming, setTitleTiming] = useState<{ start: number; duration: number }>({ start: 0, duration: 3.5 });

  useEffect(() => {
    const handleSelectedClipDetails = (e: Event) => {
      const detail = (e as CustomEvent<{ selectedClip: SelectedClip | null; details: { start: number; duration: number; name: string } | null }>).detail;
      if (detail?.selectedClip?.track === 'title' && detail.details) {
        setTitleTiming({ start: detail.details.start, duration: detail.details.duration });
      }
    };
    window.addEventListener('workspace:selected-clip-details', handleSelectedClipDetails);
    return () => window.removeEventListener('workspace:selected-clip-details', handleSelectedClipDetails);
  }, []);
  const [activeSubTab, setActiveSubTab] = useState<'text' | 'style' | 'animation' | 'position' | 'background' | 'shadow'>('text');

  // Text target selector: user can choose what part of script they are styling
  const [textTarget, setTextTarget] = useState<'cue' | 'quote' | 'hook' | 'cta' | 'title'>(isTitleSelected ? 'title' : isSingleCue ? 'cue' : 'quote');

  const [textContent, setTextContent] = useState('');
  const [textColor, setTextColor] = useState(captionColor || '#FFFFFF');
  const [textFont, setTextFont] = useState('Montserrat');
  const [textWeight, setTextWeight] = useState('Bold');
  const [textSize, setTextSize] = useState(58);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('center');
  const [textTransform, setTextTransform] = useState<'none' | 'uppercase' | 'lowercase' | 'capitalize'>('none');
  const [overridePreset, setOverridePreset] = useState(false);

  // Style flags
  const [isBold, setIsBold] = useState(true);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);

  // Stroke & Outline
  const [strokeOutline, setStrokeOutline] = useState(true);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);

  // Shadow & Glow
  const [dropShadow, setDropShadow] = useState(true);
  const [shadowColor, setShadowColor] = useState('#000000');
  const [shadowBlur, setShadowBlur] = useState(12);
  const [neonGlow, setNeonGlow] = useState(false);
  const [glowColor, setGlowColor] = useState('#3B82F6');

  // Spacing & Box
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [bgColor, setBgColor] = useState('transparent');
  const [bgRadius, setBgRadius] = useState(8);
  const [bgPadding, setBgPadding] = useState(8);
  const [opacity, setOpacity] = useState(100);

  // Screen Position
  const [posY, setPosY] = useState(76); // 9:16 viral safe zone (76%) avoids TikTok / Shorts UI clipping

  // Animation & Timing
  const [activeAnimation, setActiveAnimation] = useState('pop');
  const [animDuration, setAnimDuration] = useState(0.35);
  const [displayDuration, setDisplayDuration] = useState(3.0);

  const isSyncingFromCueRef = useRef(false);

  // Sync state when active cue changes so inspector reflects the selected clip
  useEffect(() => {
    if (isSingleCue && activeCue) {
      isSyncingFromCueRef.current = true;
      setTextTarget('cue');
      setTextContent(activeCue.text || '');
      if (activeCue.color || activeCue.captionPresetColor) {
        setTextColor(activeCue.color || activeCue.captionPresetColor!);
      }
      if (activeCue.fontFamily) setTextFont(activeCue.fontFamily);
      if (activeCue.fontSize) setTextSize(activeCue.fontSize);
      if (activeCue.fontWeight) setTextWeight(activeCue.fontWeight);
      if (activeCue.textAlign) setTextAlign(activeCue.textAlign);
      if (activeCue.textTransform) setTextTransform(activeCue.textTransform);
      if (activeCue.isBold !== undefined) setIsBold(activeCue.isBold);
      if (activeCue.isItalic !== undefined) setIsItalic(activeCue.isItalic);
      if (activeCue.isUnderline !== undefined) setIsUnderline(activeCue.isUnderline);
      if (activeCue.isStrikethrough !== undefined) setIsStrikethrough(activeCue.isStrikethrough);
      if (activeCue.stroke !== undefined) setStrokeOutline(activeCue.stroke);
      if (activeCue.strokeColor) setStrokeColor(activeCue.strokeColor);
      if (activeCue.strokeWidth !== undefined) setStrokeWidth(activeCue.strokeWidth);
      if (activeCue.dropShadow !== undefined) setDropShadow(activeCue.dropShadow);
      if (activeCue.shadowColor) setShadowColor(activeCue.shadowColor);
      if (activeCue.shadowBlur !== undefined) setShadowBlur(activeCue.shadowBlur);
      if (activeCue.neonGlow !== undefined) setNeonGlow(activeCue.neonGlow);
      if (activeCue.glowColor) setGlowColor(activeCue.glowColor);
      if (activeCue.background) setBgColor(activeCue.background);
      if (activeCue.bgRadius !== undefined) setBgRadius(activeCue.bgRadius);
      if (activeCue.bgPadding !== undefined) setBgPadding(activeCue.bgPadding);
      if (activeCue.opacity !== undefined) setOpacity(activeCue.opacity);
      if (activeCue.posY !== undefined) setPosY(activeCue.posY);
      if (activeCue.animation) setActiveAnimation(activeCue.animation);
      setTimeout(() => { isSyncingFromCueRef.current = false; }, 50);
    } else if (isTitleSelected) {
      setTextTarget('title');
      setTextContent(script?.title || '');
    } else if (textTarget === 'quote') {
      setTextContent(script?.quote || '');
    } else if (textTarget === 'hook') {
      setTextContent(script?.hook || '');
    } else if (textTarget === 'cta') {
      setTextContent(script?.cta || '');
    } else if (textTarget === 'title') {
      setTextContent(script?.title || '');
    }
  }, [
    isTitleSelected,
    isSingleCue,
    activeCueIndex,
    activeCue?.text,
    activeCue?.color,
    activeCue?.captionPresetColor,
    activeCue?.fontFamily,
    activeCue?.fontSize,
    activeCue?.fontWeight,
    textTarget,
    script?.quote,
    script?.hook,
    script?.cta,
    script?.title,
  ]);

  // Sync color with prop if provided
  useEffect(() => {
    if (captionColor) setTextColor(captionColor);
  }, [captionColor]);

  // Listen to manual position updates from canvas dragging
  useEffect(() => {
    const handlePosUpdate = (e: Event) => {
      const detail = (e as CustomEvent<{ posX: number; posY: number }>).detail;
      if (detail && typeof detail.posY === 'number') {
        setPosY(detail.posY);
      }
    };
    window.addEventListener('workspace:caption-position-update', handlePosUpdate);
    return () => window.removeEventListener('workspace:caption-position-update', handlePosUpdate);
  }, []);

  const isInitialMount = useRef(true);

  // Helper to apply current single cue style to all cues if user requests
  const handleApplyToAllCues = () => {
    const subs = (script?.subtitles && script.subtitles.length > 0) ? script.subtitles : effectiveSubtitles;
    if (!subs.length || !onUpdateSubtitles) return;
    onCaptionColorChange?.(textColor);
    const updated = subs.map((sub) => ({
      ...sub,
      color: textColor,
      captionPresetColor: textColor,
      fontFamily: textFont,
      fontWeight: textWeight,
      fontSize: textSize,
      textAlign,
      textTransform,
      isBold,
      isItalic,
      isUnderline,
      isStrikethrough,
      stroke: strokeOutline,
      strokeColor,
      strokeWidth,
      dropShadow,
      shadowColor,
      shadowBlur,
      neonGlow,
      glowColor,
      background: bgColor,
      bgRadius,
      bgPadding,
      opacity,
      posY,
      animation: activeAnimation,
    }));
    onUpdateSubtitles(updated);
    window.dispatchEvent(
      new CustomEvent('workspace:caption-style-change', {
        detail: {
          cueIndex: null,
          color: textColor,
          fontFamily: textFont,
          fontWeight: textWeight,
          fontSize: textSize,
          textAlign,
          textTransform,
          isBold,
          isItalic,
          isUnderline,
          isStrikethrough,
          stroke: strokeOutline,
          strokeColor,
          strokeWidth,
          dropShadow,
          shadowColor,
          shadowBlur,
          neonGlow,
          glowColor,
          letterSpacing,
          lineHeight,
          background: bgColor,
          bgRadius,
          bgPadding,
          opacity,
          posY,
          animation: activeAnimation,
          animDuration,
          duration: displayDuration,
        },
      })
    );
  };

  // Broadcast caption style changes to canvas in real time & persist per-clip
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (isSyncingFromCueRef.current) return;

    // When an isolated cue is active, persist changes ONLY to that specific cue!
    const subs = (script?.subtitles && script.subtitles.length > 0) ? script.subtitles : effectiveSubtitles;
    if (isSingleCue && activeCueIndex !== null && subs.length > 0 && onUpdateSubtitles) {
      const currentSub = subs[activeCueIndex];
      if (currentSub && (
        currentSub.color !== textColor ||
        currentSub.fontFamily !== textFont ||
        currentSub.fontSize !== textSize ||
        currentSub.fontWeight !== textWeight ||
        currentSub.textAlign !== textAlign ||
        currentSub.textTransform !== textTransform ||
        currentSub.isBold !== isBold ||
        currentSub.isItalic !== isItalic ||
        currentSub.isUnderline !== isUnderline ||
        currentSub.isStrikethrough !== isStrikethrough ||
        currentSub.stroke !== strokeOutline ||
        currentSub.strokeColor !== strokeColor ||
        currentSub.strokeWidth !== strokeWidth ||
        currentSub.dropShadow !== dropShadow ||
        currentSub.shadowColor !== shadowColor ||
        currentSub.shadowBlur !== shadowBlur ||
        currentSub.neonGlow !== neonGlow ||
        currentSub.glowColor !== glowColor ||
        currentSub.background !== bgColor ||
        currentSub.bgRadius !== bgRadius ||
        currentSub.bgPadding !== bgPadding ||
        currentSub.opacity !== opacity ||
        currentSub.posY !== posY ||
        currentSub.animation !== activeAnimation
      )) {
        const updated = subs.map((sub, idx) =>
          idx === activeCueIndex
            ? {
                ...sub,
                color: textColor,
                captionPresetColor: textColor,
                fontFamily: textFont,
                fontSize: textSize,
                fontWeight: textWeight,
                textAlign,
                textTransform,
                isBold,
                isItalic,
                isUnderline,
                isStrikethrough,
                stroke: strokeOutline,
                strokeColor,
                strokeWidth,
                dropShadow,
                shadowColor,
                shadowBlur,
                neonGlow,
                glowColor,
                background: bgColor,
                bgRadius,
                bgPadding,
                opacity,
                posY,
                animation: activeAnimation,
              }
            : sub
        );
        onUpdateSubtitles(updated);
        window.dispatchEvent(
          new CustomEvent('workspace:update-clip-properties', {
            detail: {
              track: 'caption',
              index: activeCueIndex,
              color: textColor,
              captionPresetColor: textColor,
              fontFamily: textFont,
              fontSize: textSize,
              fontWeight: textWeight,
              textAlign,
              textTransform,
              isBold,
              isItalic,
              isUnderline,
              isStrikethrough,
              stroke: strokeOutline,
              strokeColor,
              strokeWidth,
              dropShadow,
              shadowColor,
              shadowBlur,
              neonGlow,
              glowColor,
              background: bgColor,
              bgRadius,
              bgPadding,
              opacity,
              posY,
              animation: activeAnimation,
            },
          })
        );
      }
    }

    window.dispatchEvent(
      new CustomEvent('workspace:caption-style-change', {
        detail: {
          cueIndex: isSingleCue ? activeCueIndex : null,
          text: isSingleCue ? undefined : textContent,
          overridePreset,
          color: isSingleCue ? undefined : textColor,
          fontFamily: isSingleCue ? undefined : textFont,
          fontWeight: isSingleCue ? undefined : textWeight,
          fontSize: isSingleCue ? undefined : textSize,
          textAlign: isSingleCue ? undefined : textAlign,
          textTransform: isSingleCue ? undefined : textTransform,
          isBold: isSingleCue ? undefined : isBold,
          isItalic: isSingleCue ? undefined : isItalic,
          isUnderline: isSingleCue ? undefined : isUnderline,
          isStrikethrough: isSingleCue ? undefined : isStrikethrough,
          stroke: isSingleCue ? undefined : strokeOutline,
          strokeColor: isSingleCue ? undefined : strokeColor,
          strokeWidth: isSingleCue ? undefined : strokeWidth,
          dropShadow: isSingleCue ? undefined : dropShadow,
          shadowColor: isSingleCue ? undefined : shadowColor,
          shadowBlur: isSingleCue ? undefined : shadowBlur,
          neonGlow: isSingleCue ? undefined : neonGlow,
          glowColor: isSingleCue ? undefined : glowColor,
          letterSpacing: isSingleCue ? undefined : letterSpacing,
          lineHeight: isSingleCue ? undefined : lineHeight,
          background: isSingleCue ? undefined : bgColor,
          bgRadius: isSingleCue ? undefined : bgRadius,
          bgPadding: isSingleCue ? undefined : bgPadding,
          opacity: isSingleCue ? undefined : opacity,
          posY: isSingleCue ? undefined : posY,
          animation: isSingleCue ? undefined : activeAnimation,
          animDuration,
          duration: displayDuration,
        },
      })
    );
  }, [
    textContent, overridePreset, textColor, textFont, textWeight, textSize, textAlign, textTransform,
    isBold, isItalic, isUnderline, isStrikethrough, strokeOutline, strokeColor, strokeWidth,
    dropShadow, shadowColor, shadowBlur, neonGlow, glowColor, letterSpacing, lineHeight,
    bgColor, bgRadius, bgPadding, opacity, posY, activeAnimation, animDuration, displayDuration,
    isSingleCue, activeCueIndex, onUpdateSubtitles, script?.subtitles
  ]);

  const handleUpdateContent = (newText: string) => {
    setTextContent(newText);
    const subs = (script?.subtitles && script.subtitles.length > 0) ? script.subtitles : effectiveSubtitles;
    if (isSingleCue && activeCueIndex !== null && subs.length > 0 && onUpdateSubtitles) {
      const currentSub = subs[activeCueIndex];
      const tokens = newText.trim().split(/\s+/).filter(Boolean);
      const subStart = currentSub?.start ?? 0;
      const subDur = Math.max(0.6, currentSub?.duration ?? 2.5);
      const step = tokens.length > 0 ? subDur / tokens.length : 0;
      const newWords = tokens.map((word, i) => ({
        word,
        start: parseFloat((subStart + i * step).toFixed(2)),
        end: parseFloat((subStart + (i + 1) * step).toFixed(2)),
        highlightColor: currentSub?.color || textColor || '#FACC15',
      }));

      const updated = subs.map((sub, idx) =>
        idx === activeCueIndex ? { ...sub, text: newText, words: newWords } : sub
      );
      onUpdateSubtitles(updated);

      window.dispatchEvent(
        new CustomEvent('workspace:update-clip-text', {
          detail: { track: 'caption', index: activeCueIndex, text: newText, words: newWords },
        })
      );
      return;
    }
    if (textTarget === 'quote') onUpdateScript?.({ quote: newText });
    else if (textTarget === 'hook') onUpdateScript?.({ hook: newText });
    else if (textTarget === 'cta') onUpdateScript?.({ cta: newText });
    else if (textTarget === 'title') onUpdateScript?.({ title: newText });
  };

  const handleCueStartChange = (newStart: number) => {
    const subs = (script?.subtitles && script.subtitles.length > 0) ? script.subtitles : effectiveSubtitles;
    if (isSingleCue && activeCueIndex !== null && subs.length > 0 && onUpdateSubtitles) {
      const roundedStart = Math.max(0, parseFloat(newStart.toFixed(2)));
      const updated = subs.map((sub, idx) =>
        idx === activeCueIndex ? { ...sub, start: roundedStart } : sub
      );
      onUpdateSubtitles(updated);
      window.dispatchEvent(
        new CustomEvent('workspace:update-clip-timing', {
          detail: { track: 'caption', index: activeCueIndex, start: roundedStart },
        })
      );
    }
  };

  const handleCueDurationChange = (newDur: number) => {
    const subs = (script?.subtitles && script.subtitles.length > 0) ? script.subtitles : effectiveSubtitles;
    if (isSingleCue && activeCueIndex !== null && subs.length > 0 && onUpdateSubtitles) {
      const roundedDur = Math.max(0.2, parseFloat(newDur.toFixed(2)));
      const updated = subs.map((sub, idx) =>
        idx === activeCueIndex ? { ...sub, duration: roundedDur } : sub
      );
      onUpdateSubtitles(updated);
      window.dispatchEvent(
        new CustomEvent('workspace:update-clip-timing', {
          detail: { track: 'caption', index: activeCueIndex, duration: roundedDur },
        })
      );
    }
  };

  const handleTitleStartChange = (newStart: number) => {
    const val = Math.max(0, parseFloat(newStart.toFixed(2)));
    setTitleTiming((prev) => ({ ...prev, start: val }));
    window.dispatchEvent(
      new CustomEvent('workspace:update-clip-timing', {
        detail: { track: 'title', start: val },
      })
    );
  };

  const handleTitleDurationChange = (newDur: number) => {
    const val = Math.max(0.5, parseFloat(newDur.toFixed(2)));
    setTitleTiming((prev) => ({ ...prev, duration: val }));
    window.dispatchEvent(
      new CustomEvent('workspace:update-clip-timing', {
        detail: { track: 'title', duration: val },
      })
    );
  };

  const handleColorChange = (newCol: string) => {
    setTextColor(newCol);
    if (!isSingleCue) {
      onCaptionColorChange?.(newCol);
    }
  };

  const activateCustomTextStyle = () => setOverridePreset(true);

  const applyStyleCombo = (combo: typeof TEXT_STYLE_COMBOS[0]) => {
    setTextColor(combo.color);
    setTextFont(combo.font);
    setTextWeight(combo.weight);
    setTextSize(combo.size);
    setDropShadow(combo.shadow);
    setStrokeOutline(combo.stroke);
    setStrokeColor(combo.strokeColor);
    setStrokeWidth(combo.strokeWidth);
    if (!isSingleCue) {
      onCaptionColorChange?.(combo.color);
    }
  };

  const tabs = ['text', 'style', 'animation', 'position', 'background', 'shadow'] as const;

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

        {/* ── TEXT TAB ── */}
        {activeSubTab === 'text' && (
          <div className="flex flex-col gap-3 pt-0.5">
            {/* Title Clip Active Banner with Start and Duration Steppers */}
            {isTitleSelected && (
              <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0"></span>
                    <span className="font-bold text-sky-200 truncate">
                      Editing Video Title Clip
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-studio font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 shrink-0">
                    TITLE CLIP
                  </span>
                </div>

                {/* Title Specific Timings */}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="flex flex-col gap-1 bg-[#141417] border border-[#2A2A30] rounded-lg p-1.5">
                    <span className="text-[9px] text-[#71717A] uppercase font-bold">Start Time</span>
                    <div className="flex items-center justify-between font-mono-studio text-xs">
                      <button
                        type="button"
                        onClick={() => handleTitleStartChange(Math.max(0, titleTiming.start - 0.2))}
                        className="w-5 h-5 rounded bg-[#222228] hover:bg-sky-500/30 hover:text-sky-300 flex items-center justify-center cursor-pointer text-white"
                      >-</button>
                      <span className="text-white font-bold">{titleTiming.start.toFixed(1)}s</span>
                      <button
                        type="button"
                        onClick={() => handleTitleStartChange(titleTiming.start + 0.2)}
                        className="w-5 h-5 rounded bg-[#222228] hover:bg-sky-500/30 hover:text-sky-300 flex items-center justify-center cursor-pointer text-white"
                      >+</button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 bg-[#141417] border border-[#2A2A30] rounded-lg p-1.5">
                    <span className="text-[9px] text-[#71717A] uppercase font-bold">Duration</span>
                    <div className="flex items-center justify-between font-mono-studio text-xs">
                      <button
                        type="button"
                        onClick={() => handleTitleDurationChange(Math.max(0.5, titleTiming.duration - 0.2))}
                        className="w-5 h-5 rounded bg-[#222228] hover:bg-sky-500/30 hover:text-sky-300 flex items-center justify-center cursor-pointer text-white"
                      >-</button>
                      <span className="text-white font-bold">{titleTiming.duration.toFixed(1)}s</span>
                      <button
                        type="button"
                        onClick={() => handleTitleDurationChange(titleTiming.duration + 0.2)}
                        className="w-5 h-5 rounded bg-[#222228] hover:bg-sky-500/30 hover:text-sky-300 flex items-center justify-center cursor-pointer text-white"
                      >+</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Single Cue Active Banner */}
            {isSingleCue && activeCue && (
              <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0"></span>
                    <span className="font-bold text-teal-200 truncate">
                      Editing Cue #{activeCueIndex! + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-studio font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      ISOLATED CUE
                    </span>
                    <button
                      type="button"
                      onClick={handleApplyToAllCues}
                      className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/10 hover:bg-white/20 text-zinc-200 hover:text-white transition-colors cursor-pointer border border-white/20"
                      title="Apply this clip's color & style to all cues"
                    >
                      Apply to All
                    </button>
                  </div>
                </div>

                {/* Cue Specific Timings */}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="flex flex-col gap-1 bg-[#141417] border border-[#2A2A30] rounded-lg p-1.5">
                    <span className="text-[9px] text-[#71717A] uppercase font-bold">Start Time</span>
                    <div className="flex items-center justify-between font-mono-studio text-xs">
                      <button
                        type="button"
                        onClick={() => handleCueStartChange(Math.max(0, (activeCue.start || 0) - 0.2))}
                        className="w-5 h-5 rounded bg-[#222228] hover:bg-teal-500/30 hover:text-teal-300 flex items-center justify-center cursor-pointer text-white"
                      >-</button>
                      <span className="text-white font-bold">{(activeCue.start || 0).toFixed(1)}s</span>
                      <button
                        type="button"
                        onClick={() => handleCueStartChange((activeCue.start || 0) + 0.2)}
                        className="w-5 h-5 rounded bg-[#222228] hover:bg-teal-500/30 hover:text-teal-300 flex items-center justify-center cursor-pointer text-white"
                      >+</button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 bg-[#141417] border border-[#2A2A30] rounded-lg p-1.5">
                    <span className="text-[9px] text-[#71717A] uppercase font-bold">Duration</span>
                    <div className="flex items-center justify-between font-mono-studio text-xs">
                      <button
                        type="button"
                        onClick={() => handleCueDurationChange(Math.max(0.3, (activeCue.duration || 1.5) - 0.2))}
                        className="w-5 h-5 rounded bg-[#222228] hover:bg-teal-500/30 hover:text-teal-300 flex items-center justify-center cursor-pointer text-white"
                      >-</button>
                      <span className="text-white font-bold">{(activeCue.duration || 1.5).toFixed(1)}s</span>
                      <button
                        type="button"
                        onClick={() => handleCueDurationChange((activeCue.duration || 1.5) + 0.2)}
                        className="w-5 h-5 rounded bg-[#222228] hover:bg-teal-500/30 hover:text-teal-300 flex items-center justify-center cursor-pointer text-white"
                      >+</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Target Layer Selector */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Select Layer To Edit</span>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: 'quote' as const, label: 'Body Quote' },
                  { id: 'hook' as const, label: 'Opening Hook' },
                  { id: 'cta' as const, label: 'Ending CTA' },
                  { id: 'title' as const, label: 'Video Title' },
                ].map((tgt) => (
                  <button
                    key={tgt.id}
                    type="button"
                    onClick={() => setTextTarget(tgt.id)}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer text-center ${
                      textTarget === tgt.id
                        ? 'bg-[#1E293B] border-[#3B82F6] text-white'
                        : 'bg-[#141417] border-[#2A2A30] text-[#71717A] hover:text-white'
                    }`}
                  >
                    {tgt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[10px] font-mono-studio text-[#71717A]">
                <span className="uppercase font-bold">Content Editor</span>
                <span>{textContent.length} chars</span>
              </div>
              <textarea
                rows={3}
                value={textContent}
                onChange={(e) => handleUpdateContent(e.target.value)}
                placeholder="Type or paste caption text..."
                className="w-full bg-[#1C1C20] border border-[#2A2A30] focus:border-[#3B82F6] rounded-xl px-3 py-2 text-xs text-white outline-none resize-none"
              />
            </div>

            {/* Formatting & Alignment Buttons */}
            <div
              className="p-2.5 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2"
              onClickCapture={activateCustomTextStyle}
              onChangeCapture={activateCustomTextStyle}
            >
              <div className="flex items-center gap-1.5 justify-between">
                {/* Bold, Italic, Underline, Strikethrough */}
                <div className="flex items-center gap-1">
                  {[
                    { icon: Bold, active: isBold, setter: setIsBold, title: 'Bold' },
                    { icon: Italic, active: isItalic, setter: setIsItalic, title: 'Italic' },
                    { icon: Underline, active: isUnderline, setter: setIsUnderline, title: 'Underline' },
                    { icon: Strikethrough, active: isStrikethrough, setter: setIsStrikethrough, title: 'Strikethrough' },
                  ].map((btn) => {
                    const Icon = btn.icon;
                    return (
                      <button
                        key={btn.title}
                        type="button"
                        onClick={() => btn.setter(!btn.active)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center border cursor-pointer transition-colors ${
                          btn.active ? 'bg-[#2E2E38] border-[#3B82F6] text-white' : 'bg-[#141417] border-[#2A2A30] text-[#71717A] hover:text-white'
                        }`}
                        title={btn.title}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}
                </div>

                {/* Text Alignments */}
                <div className="flex items-center gap-1">
                  {[
                    { id: 'left' as const, icon: AlignLeft },
                    { id: 'center' as const, icon: AlignCenter },
                    { id: 'right' as const, icon: AlignRight },
                    { id: 'justify' as const, icon: AlignJustify },
                  ].map((al) => {
                    const Icon = al.icon;
                    return (
                      <button
                        key={al.id}
                        type="button"
                        onClick={() => setTextAlign(al.id)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center border cursor-pointer transition-colors ${
                          textAlign === al.id ? 'bg-[#2E2E38] border-[#3B82F6] text-white' : 'bg-[#141417] border-[#2A2A30] text-[#71717A] hover:text-white'
                        }`}
                        title={`Align ${al.id}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Text Transform */}
              <div className="flex gap-1.5 pt-1 border-t border-[#25252A]">
                {[
                  { id: 'none' as const, label: 'Aa' },
                  { id: 'uppercase' as const, label: 'UPPER' },
                  { id: 'lowercase' as const, label: 'lower' },
                  { id: 'capitalize' as const, label: 'Title Case' },
                ].map((tr) => (
                  <button
                    key={tr.id}
                    type="button"
                    onClick={() => setTextTransform(tr.id)}
                    className={`flex-1 py-1 rounded-md text-[10px] font-bold border cursor-pointer transition-colors ${
                      textTransform === tr.id ? 'bg-[#3B82F6] border-transparent text-white' : 'bg-[#141417] border-[#2A2A30] text-[#71717A] hover:text-white'
                    }`}
                  >
                    {tr.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size & Spacing Sliders */}
            <div
              className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2.5"
              onClickCapture={activateCustomTextStyle}
              onChangeCapture={activateCustomTextStyle}
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#A1A1AA] font-medium">Font Size</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="12"
                      max="140"
                      value={textSize}
                      onChange={(e) => setTextSize(Math.max(12, Math.min(140, Number(e.target.value) || 58)))}
                      className="w-12 bg-[#121215] border border-[#2A2A30] rounded px-1.5 py-0.5 text-right font-mono-studio text-xs text-white outline-none"
                    />
                    <span className="text-[10px] text-[#71717A]">px</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="16"
                  max="120"
                  value={textSize}
                  onChange={(e) => setTextSize(Number(e.target.value))}
                  className="w-full accent-[#3B82F6] cursor-pointer"
                />
              </div>

              {/* Letter Spacing & Line Height */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#25252A]">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[10px] text-[#A1A1AA]">
                    <span>Tracking</span>
                    <span className="font-mono-studio text-white">{letterSpacing}em</span>
                  </div>
                  <input
                    type="range"
                    step="0.01"
                    min="-0.05"
                    max="0.3"
                    value={letterSpacing}
                    onChange={(e) => setLetterSpacing(parseFloat(e.target.value))}
                    className="w-full accent-[#3B82F6] cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[10px] text-[#A1A1AA]">
                    <span>Line Height</span>
                    <span className="font-mono-studio text-white">{lineHeight}</span>
                  </div>
                  <input
                    type="range"
                    step="0.05"
                    min="0.9"
                    max="2.0"
                    value={lineHeight}
                    onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                    className="w-full accent-[#3B82F6] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Color Chooser */}
            <div
              className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2"
              onClickCapture={activateCustomTextStyle}
              onChangeCapture={activateCustomTextStyle}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A1A1AA] font-medium">Text Color</span>
                <span className="font-mono-studio text-white font-bold">{textColor}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={textColor.startsWith('#') ? textColor : '#FFFFFF'}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-[#2A2A30] bg-transparent cursor-pointer shrink-0"
                />
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleColorChange(c)}
                      style={{ background: c }}
                      className={`w-5 h-5 rounded-md border transition-transform cursor-pointer ${
                        textColor.toLowerCase() === c.toLowerCase() ? 'scale-125 border-white ring-2 ring-blue-500/50' : 'border-white/20 hover:scale-110'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STYLE TAB (Fonts & Presets) ── */}
        {activeSubTab === 'style' && (
          <div
            className="flex flex-col gap-3.5 pt-0.5"
            onClickCapture={activateCustomTextStyle}
            onChangeCapture={activateCustomTextStyle}
          >
            {/* Quick Combos */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Style Combos</span>
              <div className="grid grid-cols-2 gap-1.5">
                {TEXT_STYLE_COMBOS.map((combo) => (
                  <button
                    key={combo.label}
                    type="button"
                    onClick={() => applyStyleCombo(combo)}
                    className="p-2.5 rounded-xl bg-[#18181C] hover:bg-[#202026] border border-[#282830] hover:border-[#3B82F6]/50 text-left cursor-pointer transition-all group"
                  >
                    <p className="text-xs font-bold text-white mb-0.5" style={{ color: combo.color }}>{combo.label}</p>
                    <p className="text-[9px] text-[#71717A]">{combo.font} • {combo.weight}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Typography Font Picker */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Typography Font Family</span>
              <div className="flex flex-col gap-1 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                {FONT_PRESETS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setTextFont(f.id)}
                    className={`flex items-center justify-between p-2 rounded-xl border text-left cursor-pointer transition-colors ${
                      textFont === f.id
                        ? 'bg-[#1E2A3A] border-[#3B82F6] text-white shadow-sm'
                        : 'bg-[#18181C] border-[#282830] text-[#A1A1AA] hover:bg-[#202026] hover:text-white'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block" style={{ fontFamily: f.id }}>{f.label}</span>
                      <span className="text-[9px] text-[#71717A]">{f.style}</span>
                    </div>
                    {textFont === f.id && <Check className="w-3.5 h-3.5 text-[#3B82F6]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Weight */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-1.5">
              <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Font Weight</span>
              <div className="grid grid-cols-3 gap-1">
                {(['Regular', 'Medium', 'SemiBold', 'Bold', 'ExtraBold', 'Black'] as const).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setTextWeight(w)}
                    className={`py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                      textWeight === w ? 'bg-[#3B82F6] border-transparent text-white' : 'bg-[#141417] border-[#2A2A30] text-[#71717A] hover:text-white'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ANIMATION TAB ── */}
        {activeSubTab === 'animation' && (
          <div className="flex flex-col gap-3 pt-0.5">
            <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Caption Motion Presets</span>
            <div className="flex flex-col gap-1.5">
              {CAPTION_ANIMATION_PRESETS.map((anim) => (
                <button
                  key={anim.id}
                  type="button"
                  onClick={() => setActiveAnimation(anim.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                    activeAnimation === anim.id
                      ? 'bg-[#1E2A3A] border-[#3B82F6] text-white shadow-sm'
                      : 'bg-[#18181C] border-[#282830] text-[#A1A1AA] hover:bg-[#202026] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{anim.icon}</span>
                    <div>
                      <span className="text-xs font-semibold text-white block">{anim.label}</span>
                      <span className="text-[10px] text-[#71717A]">{anim.desc}</span>
                    </div>
                  </div>
                  {activeAnimation === anim.id && <Check className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />}
                </button>
              ))}
            </div>

            {/* Animation Speed & Timing */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#A1A1AA]">Entrance Transition Duration</span>
                <span className="font-mono-studio text-white">{animDuration}s</span>
              </div>
              <input
                type="range"
                step="0.05"
                min="0.1"
                max="1.5"
                value={animDuration}
                onChange={(e) => setAnimDuration(parseFloat(e.target.value))}
                className="w-full accent-[#3B82F6] cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* ── POSITION TAB ── */}
        {activeSubTab === 'position' && (
          <div className="flex flex-col gap-3.5 pt-0.5">
            {/* Quick Position Presets */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Screen Placement</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Top Hook Banner', y: 18, desc: 'Highest impact placement' },
                  { label: 'Center Stage', y: 50, desc: 'Central dramatic hook' },
                  { label: 'Shorts / Reel Sweet Spot', y: 76, desc: 'Optimal 9:16 viral placement' },
                  { label: 'Lower Third', y: 80, desc: 'Landscape / standard caption' },
                ].map((pos) => (
                  <button
                    key={pos.label}
                    type="button"
                    onClick={() => setPosY(pos.y)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                      Math.abs(posY - pos.y) <= 4
                        ? 'bg-[#1E2A3A] border-[#3B82F6] text-white shadow-sm'
                        : 'bg-[#141417] border-[#2A2A30] text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    <p className="text-[11px] font-bold">{pos.label}</p>
                    <p className="text-[8px] text-[#71717A]">{pos.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Fine Vertical Y Slider */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#A1A1AA]">Vertical Offset (Y%)</span>
                <input
                  type="number"
                  min="5"
                  max="95"
                  value={posY}
                  onChange={(e) => setPosY(Math.max(5, Math.min(95, Number(e.target.value) || 50)))}
                  className="w-12 bg-[#121215] border border-[#2A2A30] rounded px-1.5 py-0.5 text-right font-mono-studio text-xs text-white outline-none"
                />
              </div>
              <input
                type="range"
                min="5"
                max="95"
                value={posY}
                onChange={(e) => setPosY(Number(e.target.value))}
                className="w-full accent-[#3B82F6] cursor-pointer"
              />
            </div>

            {/* Display Duration */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#A1A1AA]">Layer Display Duration</span>
                <span className="font-mono-studio text-white font-bold">{displayDuration.toFixed(1)}s</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDisplayDuration((p) => Math.max(0.5, parseFloat((p - 0.5).toFixed(1))))}
                  className="w-8 h-8 rounded-lg bg-[#141417] border border-[#2A2A30] flex items-center justify-center text-white cursor-pointer hover:bg-[#202026]"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="60"
                  value={displayDuration}
                  onChange={(e) => setDisplayDuration(Math.max(0.5, Math.min(60, Number(e.target.value) || 3)))}
                  className="flex-1 bg-[#121215] border border-[#2A2A30] rounded-lg px-2 py-1 text-center font-mono-studio text-xs text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => setDisplayDuration((p) => Math.min(60, parseFloat((p + 0.5).toFixed(1))))}
                  className="w-8 h-8 rounded-lg bg-[#141417] border border-[#2A2A30] flex items-center justify-center text-white cursor-pointer hover:bg-[#202026]"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── BACKGROUND TAB ── */}
        {activeSubTab === 'background' && (
          <div className="flex flex-col gap-3 pt-0.5">
            <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Caption Box Background</span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: 'None', val: 'transparent' },
                { label: 'Dark Tint (60%)', val: 'rgba(0,0,0,0.6)' },
                { label: 'Solid Black', val: '#000000' },
                { label: 'Blue Studio', val: 'rgba(59,130,246,0.3)' },
                { label: 'Purple Cyber', val: 'rgba(168,85,247,0.3)' },
                { label: 'Frosted Glass', val: 'rgba(255,255,255,0.1)' },
              ].map((bg) => (
                <button
                  key={bg.label}
                  type="button"
                  onClick={() => setBgColor(bg.val)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer text-left ${
                    bgColor === bg.val ? 'bg-[#3B82F6]/20 border-[#3B82F6] text-white' : 'bg-[#18181C] border-[#282830] text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  {bg.label}
                </button>
              ))}
            </div>

            {bgColor !== 'transparent' && (
              <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2.5">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#A1A1AA]">Corner Radius</span>
                    <span className="font-mono-studio text-white">{bgRadius}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="32"
                    value={bgRadius}
                    onChange={(e) => setBgRadius(Number(e.target.value))}
                    className="w-full accent-[#3B82F6] cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#A1A1AA]">Padding</span>
                    <span className="font-mono-studio text-white">{bgPadding}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="32"
                    value={bgPadding}
                    onChange={(e) => setBgPadding(Number(e.target.value))}
                    className="w-full accent-[#3B82F6] cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SHADOW & OUTLINE TAB ── */}
        {activeSubTab === 'shadow' && (
          <div className="flex flex-col gap-3.5 pt-0.5">
            {/* Outline / Stroke */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Text Stroke Outline</span>
                <button
                  type="button"
                  onClick={() => setStrokeOutline(!strokeOutline)}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                    strokeOutline ? 'bg-[#3B82F6]' : 'bg-[#2A2A30]'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${strokeOutline ? 'left-5' : 'left-1'}`} />
                </button>
              </div>

              {strokeOutline && (
                <div className="flex flex-col gap-2 pt-1 border-t border-[#25252A]">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#A1A1AA]">Stroke Width</span>
                    <span className="font-mono-studio text-white">{strokeWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    className="w-full accent-[#3B82F6] cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#A1A1AA]">Stroke Color</span>
                    <input
                      type="color"
                      value={strokeColor}
                      onChange={(e) => setStrokeColor(e.target.value)}
                      className="w-7 h-7 rounded border border-[#2A2A30] bg-transparent cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Drop Shadow & Glow */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Drop Shadow</span>
                <button
                  type="button"
                  onClick={() => setDropShadow(!dropShadow)}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                    dropShadow ? 'bg-[#3B82F6]' : 'bg-[#2A2A30]'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${dropShadow ? 'left-5' : 'left-1'}`} />
                </button>
              </div>

              {dropShadow && (
                <div className="flex flex-col gap-2 pt-1 border-t border-[#25252A]">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#A1A1AA]">Shadow Blur</span>
                    <span className="font-mono-studio text-white">{shadowBlur}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={shadowBlur}
                    onChange={(e) => setShadowBlur(Number(e.target.value))}
                    className="w-full accent-[#3B82F6] cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Neon Glow Toggle */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Neon Cyber Glow</span>
                <button
                  type="button"
                  onClick={() => setNeonGlow(!neonGlow)}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                    neonGlow ? 'bg-[#3B82F6]' : 'bg-[#2A2A30]'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${neonGlow ? 'left-5' : 'left-1'}`} />
                </button>
              </div>

              {neonGlow && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-[#25252A]">
                  <span className="text-[#A1A1AA]">Glow Tint</span>
                  <input
                    type="color"
                    value={glowColor}
                    onChange={(e) => setGlowColor(e.target.value)}
                    className="w-7 h-7 rounded border border-[#2A2A30] bg-transparent cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TextCompoundInspector;
