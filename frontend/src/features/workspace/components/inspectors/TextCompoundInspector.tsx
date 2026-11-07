import React, { useState, useEffect, useRef } from 'react';
import { ScrollableTabs } from '@/src/shared/ui/ScrollableTabs';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Minus,
  Plus,
  Bold,
  Italic,
  Underline,
  Strikethrough,
} from 'lucide-react';
import { MotionInspectorPage as MotionPresetPicker, VIDEO_MOTION_PRESETS } from './MotionInspectorPage';
import { GeneratedScript, ScriptSubtitle } from '../../types';
import { SelectedClip } from '../timeline/timelineTypes';
import '@/src/shared/ui/CustomSelect';

export interface TextCompoundInspectorProps {
  script?: GeneratedScript;
  onUpdateScript?: (updated: Partial<GeneratedScript>) => void;
  captionColor?: string;
  onCaptionColorChange?: (color: string) => void;
  selectedClip?: SelectedClip | null;
  onUpdateSubtitles?: (subtitles: ScriptSubtitle[]) => void;
}

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
  const [activeSubTab, setActiveSubTab] = useState<'text' | 'motion'>('text');
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
  const [posY, setPosY] = useState(76); // 9:16 safe zone avoids short-form platform UI clipping

  // Animation & Timing
  const [activeAnimation, setActiveAnimation] = useState('pop');
  const [activeAnimationOut, setActiveAnimationOut] = useState('none');
  const [animationDirection, setAnimationDirection] = useState<'in' | 'out'>('in');
  const [animDuration, setAnimDuration] = useState(0.35);
  const [animOutDuration, setAnimOutDuration] = useState(0.35);
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
      if (activeCue.animationOut) setActiveAnimationOut(activeCue.animationOut);
      if (typeof activeCue.animationInDuration === 'number') setAnimDuration(activeCue.animationInDuration);
      if (typeof activeCue.animationOutDuration === 'number') setAnimOutDuration(activeCue.animationOutDuration);
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
    activeCue?.animation,
    activeCue?.animationOut,
    activeCue?.animationInDuration,
    activeCue?.animationOutDuration,
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
      animationOut: activeAnimationOut,
      animationInDuration: animDuration,
      animationOutDuration: animOutDuration,
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
          animationOut: activeAnimationOut,
          animDuration,
          animationOutDuration: animOutDuration,
          direction: animationDirection,
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
        currentSub.animation !== activeAnimation ||
        currentSub.animationOut !== activeAnimationOut ||
        currentSub.animationInDuration !== animDuration ||
        currentSub.animationOutDuration !== animOutDuration
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
                animationOut: activeAnimationOut,
                animationInDuration: animDuration,
                animationOutDuration: animOutDuration,
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
              animationOut: activeAnimationOut,
              animationInDuration: animDuration,
              animationOutDuration: animOutDuration,
            },
          })
        );
      }
    }

    window.dispatchEvent(
      new CustomEvent('workspace:caption-style-change', {
        detail: {
          cueIndex: isSingleCue ? activeCueIndex : null,
          targetLayer: textTarget,
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
          animationOut: isSingleCue ? undefined : activeAnimationOut,
          animationInDuration: animDuration,
          animationOutDuration: animOutDuration,
          direction: animationDirection,
          animDuration,
          duration: displayDuration,
        },
      })
    );
  }, [
    textContent, overridePreset, textColor, textFont, textWeight, textSize, textAlign, textTransform,
    isBold, isItalic, isUnderline, isStrikethrough, strokeOutline, strokeColor, strokeWidth,
    dropShadow, shadowColor, shadowBlur, neonGlow, glowColor, letterSpacing, lineHeight,
    bgColor, bgRadius, bgPadding, opacity, posY, activeAnimation, activeAnimationOut,
    animationDirection, animDuration, animOutDuration, displayDuration,
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

  const handleMotionChange = (animation: string) => {
    if (animationDirection === 'in') {
      setActiveAnimation(animation);
    } else {
      setActiveAnimationOut(animation);
    }
    window.dispatchEvent(
      new CustomEvent('workspace:preview-text-motion', {
        detail: {
          animation,
          direction: animationDirection,
          duration: animationDirection === 'in' ? animDuration : animOutDuration,
          target: textTarget === 'title' ? 'title' : 'caption',
        },
      })
    );
  };

  const handleMotionDurationChange = (duration: number) => {
    if (animationDirection === 'in') {
      setAnimDuration(duration);
    } else {
      setAnimOutDuration(duration);
    }
    window.dispatchEvent(
      new CustomEvent('workspace:preview-text-motion', {
        detail: {
          animation: animationDirection === 'in' ? activeAnimation : activeAnimationOut,
          direction: animationDirection,
          duration,
          target: textTarget === 'title' ? 'title' : 'caption',
        },
      })
    );
  };

  const activateCustomTextStyle = () => setOverridePreset(true);

  return (
    <div className="flex flex-col h-full bg-[#141414] text-white font-sans-studio select-none">
      <div className="px-2.5 pt-2 pb-2 shrink-0 border-b border-[#242424] bg-[#111111]">
        <ScrollableTabs
          tabs={[
            { id: 'text', label: 'Text' },
            { id: 'motion', label: 'Motion' },
          ]}
          activeTab={activeSubTab}
          onChange={(tab) => setActiveSubTab(tab as 'text' | 'motion')}
        />
      </div>
      {/*  Tab Content Area  */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">

        {activeSubTab === 'text' && (
        <div className="flex flex-col gap-3 pt-0.5">
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
                  <div className="flex flex-col gap-1 bg-[#111111] border border-[#242424] rounded-lg p-1.5">
                    <span className="text-[9px] text-slate-500 uppercase font-bold">Start Time</span>
                    <div className="flex items-center justify-between font-mono-studio text-xs">
                      <button
                        type="button"
                        onClick={() => handleCueStartChange(Math.max(0, (activeCue.start || 0) - 0.2))}
                        className="w-5 h-5 rounded bg-[#1E1E1E] hover:bg-teal-500/30 hover:text-teal-300 flex items-center justify-center cursor-pointer text-white"
                      >-</button>
                      <span className="text-white font-bold">{(activeCue.start || 0).toFixed(1)}s</span>
                      <button
                        type="button"
                        onClick={() => handleCueStartChange((activeCue.start || 0) + 0.2)}
                        className="w-5 h-5 rounded bg-[#1E1E1E] hover:bg-teal-500/30 hover:text-teal-300 flex items-center justify-center cursor-pointer text-white"
                      >+</button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 bg-[#111111] border border-[#242424] rounded-lg p-1.5">
                    <span className="text-[9px] text-slate-500 uppercase font-bold">Duration</span>
                    <div className="flex items-center justify-between font-mono-studio text-xs">
                      <button
                        type="button"
                        onClick={() => handleCueDurationChange(Math.max(0.3, (activeCue.duration || 1.5) - 0.2))}
                        className="w-5 h-5 rounded bg-[#1E1E1E] hover:bg-teal-500/30 hover:text-teal-300 flex items-center justify-center cursor-pointer text-white"
                      >-</button>
                      <span className="text-white font-bold">{(activeCue.duration || 1.5).toFixed(1)}s</span>
                      <button
                        type="button"
                        onClick={() => handleCueDurationChange((activeCue.duration || 1.5) + 0.2)}
                        className="w-5 h-5 rounded bg-[#1E1E1E] hover:bg-teal-500/30 hover:text-teal-300 flex items-center justify-center cursor-pointer text-white"
                      >+</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Target Layer Selector */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Select Layer To Edit</span>
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
                        ? 'bg-[#2563EB] border-[#60A5FA]/40 text-white shadow-xs'
                        : 'bg-[#111111] border-[#242424] text-slate-500 hover:text-white'
                    }`}
                  >
                    {tgt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[10px] font-mono-studio text-slate-500">
                <span className="uppercase font-bold">Content Editor</span>
                <span>{textContent.length} chars</span>
              </div>
              <textarea
                rows={3}
                value={textContent}
                onChange={(e) => handleUpdateContent(e.target.value)}
                placeholder="Type or paste caption text..."
                className="w-full bg-[#181818] border border-[#242424] focus:border-[#3B82F6] rounded-xl px-3 py-2 text-xs text-white outline-none resize-none"
              />
            </div>

            {/* Formatting & Alignment Buttons */}
            <div
              className="p-2.5 rounded-xl bg-[#181818] border border-[#242424] flex flex-col gap-2"
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
                          btn.active ? 'bg-[#2E2E38] border-[#3B82F6] text-white' : 'bg-[#111111] border-[#242424] text-slate-500 hover:text-white'
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
                          textAlign === al.id ? 'bg-[#2E2E38] border-[#3B82F6] text-white' : 'bg-[#111111] border-[#242424] text-slate-500 hover:text-white'
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
                      textTransform === tr.id ? 'bg-[#2563EB] border-[#60A5FA]/40 text-white shadow-xs' : 'bg-[#181818] border-[#242424] text-zinc-400 hover:bg-[#26262C] hover:border-white/10 hover:text-white'
                    }`}
                  >
                    {tr.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size & Spacing Sliders */}
            <div
              className="p-3 rounded-xl bg-[#181818] border border-[#242424] flex flex-col gap-2.5"
              onClickCapture={activateCustomTextStyle}
              onChangeCapture={activateCustomTextStyle}
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Font Size</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="12"
                      max="140"
                      value={textSize}
                      onChange={(e) => setTextSize(Math.max(12, Math.min(140, Number(e.target.value) || 58)))}
                      className="w-12 bg-[#141414] border border-[#242424] rounded px-1.5 py-0.5 text-right font-mono-studio text-xs text-white outline-none"
                    />
                    <span className="text-[10px] text-slate-500">px</span>
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
                  <div className="flex justify-between text-[10px] text-slate-400">
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
                  <div className="flex justify-between text-[10px] text-slate-400">
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
              className="p-3 rounded-xl bg-[#181818] border border-[#242424] flex flex-col gap-2"
              onClickCapture={activateCustomTextStyle}
              onChangeCapture={activateCustomTextStyle}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Text Color</span>
                <span className="font-mono-studio text-white font-bold">{textColor}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={textColor.startsWith('#') ? textColor : '#FFFFFF'}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-[#242424] bg-transparent cursor-pointer shrink-0"
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

        {activeSubTab === 'motion' && (
          <div className="flex flex-col gap-3 pt-0.5">
            <MotionPresetPicker
              presets={VIDEO_MOTION_PRESETS}
              value={animationDirection === 'in' ? activeAnimation : activeAnimationOut}
              direction={animationDirection}
              onDirectionChange={setAnimationDirection}
              duration={animationDirection === 'in' ? animDuration : animOutDuration}
              onDurationChange={handleMotionDurationChange}
              onChange={handleMotionChange}
            />
          </div>
        )}

      </div>
    </div>
  );
};

export default TextCompoundInspector;
