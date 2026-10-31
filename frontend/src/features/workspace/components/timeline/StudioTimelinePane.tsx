import { alignAudioVisualCuts } from '../../utils/cutSyncEngine';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Type, Play, Pause, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { ScriptSubtitle, DEFAULT_VISUAL_BACKDROPS } from '../../types';
import {
  StudioTimelinePaneProps,
  groupMicroCaptionsIntoPhrases,
  formatTime,
  computeCaptionLanes,
  computeClipLanes,
  SelectedClip,
  DragAction,
  EnabledTracks,
  TimelineMediaClip,
  TimelineAudioClip,
  TimelineOverlayClip,
  MIN_TIMELINE_ZOOM,
  MAX_TIMELINE_ZOOM,
  TIMELINE_ZOOM_STEP,
  TrackId,
  DEFAULT_TRACK_ORDER,
} from './timelineTypes';
import { TimelineToolbar } from './TimelineToolbar';
import { TimelineTrackHeaders } from './TimelineTrackHeaders';
import { TimelineRuler } from './TimelineRuler';
import { VideoTrackClip } from './VideoTrackClip';
import { ImageTrackClip } from './ImageTrackClip';
import { OverlayTrackClip } from './OverlayTrackClip';
import { CaptionTrackClips } from './CaptionTrackClips';
import { AudioTrackClip } from './AudioTrackClip';
import { TimelineClipContextMenu } from './TimelineClipContextMenu';
import { mediaCacheService } from '../../services/mediaCacheService';

export const StudioTimelinePane: React.FC<StudioTimelinePaneProps> = ({
  currentTime,
  duration,
  isPlaying,
  onTogglePlay,
  onSeek,
  onTimelineDurationChange,
  selectedSfx,
  onRemoveSfx,
  onRemoveVideo,
  onRemoveImage,
  script,
  onUpdateSubtitles,
  activeBackdrop,
  selectedVoice,
  selectedMusic,
  audioUrl,
  customImageUrl,
  customVideoUrl,
  activeElementOverlay,
  onSelectCompound,
  voices = [],
  musicTracks = [],
  timelineDuration = 30,
  timelineHeight,
  onTimelineHeightChange,
  selectedClip: propSelectedClip,
  onSelectClip: onSelectClipProp,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isTimelineExpandedLocal, setIsTimelineExpandedLocal] = useState(false);
  const isTimelineExpanded = timelineHeight !== undefined ? timelineHeight > 220 : isTimelineExpandedLocal;
  const timelineViewportHeight = isTimelineExpanded ? 'max-h-[600px]' : 'max-h-[170px]';

  const DEFAULT_TRACK_HEADERS_WIDTH = 210;
  const [trackHeadersWidth, setTrackHeadersWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('apexmind:timeline-track-width');
      return saved ? Math.max(175, Math.min(380, Number(saved))) : DEFAULT_TRACK_HEADERS_WIDTH;
    } catch {
      return DEFAULT_TRACK_HEADERS_WIDTH;
    }
  });
  const [isResizingTrackHeaders, setIsResizingTrackHeaders] = useState(false);
  const trackResizeStartXRef = useRef(0);
  const trackResizeStartWidthRef = useRef(DEFAULT_TRACK_HEADERS_WIDTH);

  const handleTrackHeadersResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {}
      trackResizeStartXRef.current = e.clientX;
      trackResizeStartWidthRef.current = trackHeadersWidth;
      setIsResizingTrackHeaders(true);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';

      const handlePointerMove = (ev: PointerEvent) => {
        const delta = ev.clientX - trackResizeStartXRef.current;
        const newWidth = Math.max(130, Math.min(360, Math.round(trackResizeStartWidthRef.current + delta)));
        setTrackHeadersWidth(newWidth);
      };

      const handlePointerUp = () => {
        setIsResizingTrackHeaders(false);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        try {
          localStorage.setItem('apexmind:timeline-track-width', String(trackHeadersWidth));
        } catch {}
      };

      window.addEventListener('pointermove', handlePointerMove, { passive: true });
      window.addEventListener('pointerup', handlePointerUp, { once: true });
    },
    [trackHeadersWidth]
  );

  const handleToggleExpandedHeight = useCallback(() => {
    if (onTimelineHeightChange && timelineHeight !== undefined) {
      if (timelineHeight > 220) {
        onTimelineHeightChange(180);
      } else {
        onTimelineHeightChange(360);
      }
    } else {
      setIsTimelineExpandedLocal((prev) => !prev);
    }
  }, [onTimelineHeightChange, timelineHeight]);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rulerViewportWidth, setRulerViewportWidth] = useState(0);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [snapGuideTime, setSnapGuideTime] = useState<number | null>(null);

  useEffect(() => {
    if (isCollapsed) return;
    const rulerViewport = rulerScrollRef.current;
    if (!rulerViewport) return;

    const updateWidth = () => setRulerViewportWidth(rulerViewport.clientWidth);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(rulerViewport);
    return () => observer.disconnect();
  }, [isCollapsed]);

  // Available tracks corresponding to Left-Panel categories (starts with only 1 primary Video track; tracks dynamically open when media is present)
  const [enabledTracks, setEnabledTracks] = useState<EnabledTracks>({

    video: true,

    image: false,

    overlay: false,

    captions: false,

    title: false,

    voice: false,

    music: false,

    sfx: false,

  });



  const [trackOrder, setTrackOrder] = useState<TrackId[]>(() => {

    try {

      const saved = localStorage.getItem('apexmind:timeline-track-order');

      if (saved) {

        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed) && parsed.length > 0) {

          const valid = new Set(DEFAULT_TRACK_ORDER);

          const filtered = parsed.filter((t): t is TrackId => valid.has(t));

          const missing = DEFAULT_TRACK_ORDER.filter((t) => !filtered.includes(t));

          return [...filtered, ...missing];

        }

      }

    } catch {}

    return DEFAULT_TRACK_ORDER;

  });



  const handleReorderTracks = useCallback((newOrder: TrackId[]) => {

    setTrackOrder(newOrder);

    try {

      localStorage.setItem('apexmind:timeline-track-order', JSON.stringify(newOrder));

    } catch {}

  }, []);



  const handleMoveTrack = useCallback((trackId: TrackId, direction: 'up' | 'down') => {

    setTrackOrder((prev) => {

      const enabledList = prev.filter((t) => enabledTracks[t]);

      const currIdx = enabledList.indexOf(trackId);

      if (currIdx === -1) return prev;

      const targetIdx = direction === 'up' ? currIdx - 1 : currIdx + 1;

      if (targetIdx < 0 || targetIdx >= enabledList.length) return prev;



      const targetTrackId = enabledList[targetIdx];

      const nextOrder = [...prev];

      const fromIndex = nextOrder.indexOf(trackId);

      const toIndex = nextOrder.indexOf(targetTrackId);

      if (fromIndex === -1 || toIndex === -1) return prev;



      nextOrder.splice(fromIndex, 1);

      nextOrder.splice(toIndex, 0, trackId);

      try {

        localStorage.setItem('apexmind:timeline-track-order', JSON.stringify(nextOrder));

      } catch {}

      return nextOrder;

    });

  }, [enabledTracks]);

  const [addTrackMenuOpen, setAddTrackMenuOpen] = useState(false);

  // Visibility, Lock, and Mute state per track
  const [videoTrackVisible, setVideoTrackVisible] = useState(true);
  const [videoTrackMuted, setVideoTrackMuted] = useState(false);
  const [imageTrackVisible, setImageTrackVisible] = useState(true);
  const [overlayTrackVisible, setOverlayTrackVisible] = useState(true);
  const [captionsTrackLocked, setCaptionsTrackLocked] = useState(false);
  const [titleTrackLocked, setTitleTrackLocked] = useState(false);
  const [voiceTrackMuted, setVoiceTrackMuted] = useState(false);
  const [musicTrackMuted, setMusicTrackMuted] = useState(false);
  const [sfxTrackMuted, setSfxTrackMuted] = useState(false);

  // Active clip selection across any compound track
  const [selectedClip, setSelectedClip] = useState<SelectedClip | null>(propSelectedClip || null);

  useEffect(() => {
    if (propSelectedClip !== undefined) {
      setSelectedClip(propSelectedClip);
    }
  }, [propSelectedClip]);

  useEffect(() => {
    const handleTimelineSelect = (e: Event) => {
      const detail = (e as CustomEvent<{ selectedClip?: SelectedClip }>).detail;
      if (detail?.selectedClip !== undefined) {
        setSelectedClip(detail.selectedClip);
      }
    };
    window.addEventListener('workspace:timeline-select-clip', handleTimelineSelect);
    return () => window.removeEventListener('workspace:timeline-select-clip', handleTimelineSelect);
  }, []);

  useEffect(() => {
    const handleBackdropAudio = (e: Event) => {
      const detail = (e as CustomEvent<{ volume?: number }>).detail;
      if (typeof detail?.volume === 'number') {
        setVideoTrackMuted(detail.volume === 0);
      }
    };
    window.addEventListener('workspace:backdrop-audio', handleBackdropAudio);
    return () => window.removeEventListener('workspace:backdrop-audio', handleBackdropAudio);
  }, []);



  // Multi-clip state for all tracks
  const [videoClips, setVideoClips] = useState<TimelineMediaClip[]>([]);
  const [imageClips, setImageClips] = useState<TimelineMediaClip[]>([]);
  const [voiceClips, setVoiceClips] = useState<TimelineAudioClip[]>([]);
  const [musicClips, setMusicClips] = useState<TimelineAudioClip[]>([]);
  const [sfxClips, setSfxClips] = useState<TimelineAudioClip[]>([]);
  const [overlayClips, setOverlayClips] = useState<TimelineOverlayClip[]>([]);

  // Proactively pre-cache all project clips into local browser CacheStorage to prevent lag
  useEffect(() => {
    const urls: string[] = [];
    for (const c of videoClips) {
      if (c.url) urls.push(c.url);
    }
    for (const c of imageClips) {
      if (c.url) urls.push(c.url);
    }
    if (urls.length > 0) {
      mediaCacheService.preloadMedia(urls);
    }
  }, [videoClips, imageClips]);

  // Moveable / trimmable timing states for fallback non-multi-clip tracks
  const [videoStart, setVideoStart] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(12.1);

  const [imageStart, setImageStart] = useState<number>(0);
  const [imageDuration, setImageDuration] = useState<number>(8.0);

  const [overlayStart, setOverlayStart] = useState<number>(1.5);
  const [overlayDuration, setOverlayDuration] = useState<number>(6.0);

  const [titleStart, setTitleStart] = useState<number>(0);
  const [titleDuration, setTitleDuration] = useState<number>(3.5);

  const [voiceStart, setVoiceStart] = useState<number>(0);
  const [voiceDuration, setVoiceDuration] = useState<number>(12.1);

  const [musicStart, setMusicStart] = useState<number>(0);
  const [musicDuration, setMusicDuration] = useState<number>(15.0);

  const [sfxStart, setSfxStart] = useState<number>(0);
  const [sfxDuration, setSfxDuration] = useState<number>(0);

  // Subtitle clips for fluid dragging, trimming, and editing
  const [localClips, setLocalClips] = useState<ScriptSubtitle[]>([]);

  // Listen for clip timing changes dispatched from inspectors
  useEffect(() => {
    const handleUpdateClipTiming = (e: Event) => {
      const detail = (e as CustomEvent<{
        track: string;
        clipId?: string;
        index?: number;
        duration?: number;
        start?: number;
        text?: string;
        words?: any[];
      }>).detail;
      if (!detail) return;

      if (detail.track === 'video') {
        setVideoClips((prev) => {
          if (prev.length > 0 && detail.clipId) {
            return prev.map((c) =>
              c.id === detail.clipId
                ? {
                    ...c,
                    duration: detail.duration ?? c.duration,
                    start: detail.start ?? c.start,
                  }
                : c
            );
          }
          return prev;
        });
        if (typeof detail.duration === 'number') setVideoDuration(detail.duration);
        if (typeof detail.start === 'number') setVideoStart(detail.start);
      } else if (detail.track === 'image') {
        setImageClips((prev) => {
          if (prev.length > 0 && detail.clipId) {
            return prev.map((c) =>
              c.id === detail.clipId
                ? {
                    ...c,
                    duration: detail.duration ?? c.duration,
                    start: detail.start ?? c.start,
                  }
                : c
            );
          }
          return prev;
        });
        if (typeof detail.duration === 'number') setImageDuration(detail.duration);
        if (typeof detail.start === 'number') setImageStart(detail.start);
      } else if (detail.track === 'overlay') {
        if (detail.clipId) {
          setOverlayClips((prev) =>
            prev.map((c) =>
              c.id === detail.clipId
                ? {
                    ...c,
                    duration: detail.duration ?? c.duration,
                    start: detail.start ?? c.start,
                  }
                : c
            )
          );
        }
      } else if (detail.track === 'voice') {
        if (detail.clipId) {
          setVoiceClips((prev) =>
            prev.map((c) =>
              c.id === detail.clipId
                ? {
                    ...c,
                    duration: detail.duration ?? c.duration,
                    start: detail.start ?? c.start,
                  }
                : c
            )
          );
        }
      } else if (detail.track === 'music') {
        if (detail.clipId) {
          setMusicClips((prev) =>
            prev.map((c) =>
              c.id === detail.clipId
                ? {
                    ...c,
                    duration: detail.duration ?? c.duration,
                    start: detail.start ?? c.start,
                  }
                : c
            )
          );
        }
      } else if (detail.track === 'sfx') {
        if (detail.clipId) {
          setSfxClips((prev) =>
            prev.map((c) =>
              c.id === detail.clipId
                ? {
                    ...c,
                    duration: detail.duration ?? c.duration,
                    start: detail.start ?? c.start,
                  }
                : c
            )
          );
        }
      } else if (detail.track === 'caption') {
        if (typeof detail.index === 'number') {
          setLocalClips((prev) =>
            prev.map((c, idx) =>
              idx === detail.index
                ? {
                    ...c,
                    start: typeof detail.start === 'number' ? Math.max(0, parseFloat(detail.start.toFixed(2))) : c.start,
                    duration: typeof detail.duration === 'number' ? Math.max(0.2, parseFloat(detail.duration.toFixed(2))) : c.duration,
                    text: detail.text !== undefined ? detail.text : c.text,
                    words: detail.words !== undefined ? detail.words : c.words,
                  }
                : c
            )
          );
        }
      } else if (detail.track === 'title') {
        if (typeof detail.start === 'number') setTitleStart(Math.max(0, parseFloat(detail.start.toFixed(2))));
        if (typeof detail.duration === 'number') setTitleDuration(Math.max(0.5, parseFloat(detail.duration.toFixed(2))));
      }
    };
    const handleUpdateClipProperties = (e: Event) => {
      const detail = (e as CustomEvent<{
        track: string;
        clipId?: string;
        index?: number;
        filterSettings?: any;
        transform?: any;
        animation?: string;
        transition?: string;
        transitionDuration?: number;
        animationIn?: string;
        animationInDuration?: number;
        animationOut?: string;
        animationOutDuration?: number;
        applyToAll?: boolean;
        colorLabel?: string;
        color?: string;
        fontFamily?: string;
        fontSize?: number;
        fontWeight?: string;
        textAlign?: 'left' | 'center' | 'right' | 'justify';
        textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
        isBold?: boolean;
        isItalic?: boolean;
        isUnderline?: boolean;
        isStrikethrough?: boolean;
        stroke?: boolean;
        strokeColor?: string;
        strokeWidth?: number;
        dropShadow?: boolean;
        shadowColor?: string;
        shadowBlur?: number;
        neonGlow?: boolean;
        glowColor?: string;
        background?: string;
        bgRadius?: number;
        bgPadding?: number;
        opacity?: number;
        posY?: number;
      }>).detail;
      if (!detail) return;
      if (detail.track === 'caption' && typeof detail.index === 'number') {
        setLocalClips((prev) =>
          prev.map((c, idx) =>
            idx === detail.index
              ? {
                  ...c,
                  color: detail.color ?? c.color,
                  captionPresetColor: detail.color ?? c.captionPresetColor,
                  fontFamily: detail.fontFamily ?? c.fontFamily,
                  fontSize: detail.fontSize ?? c.fontSize,
                  fontWeight: detail.fontWeight ?? c.fontWeight,
                  textAlign: detail.textAlign ?? c.textAlign,
                  textTransform: detail.textTransform ?? c.textTransform,
                  isBold: detail.isBold ?? c.isBold,
                  isItalic: detail.isItalic ?? c.isItalic,
                  isUnderline: detail.isUnderline ?? c.isUnderline,
                  isStrikethrough: detail.isStrikethrough ?? c.isStrikethrough,
                  stroke: detail.stroke ?? c.stroke,
                  strokeColor: detail.strokeColor ?? c.strokeColor,
                  strokeWidth: detail.strokeWidth ?? c.strokeWidth,
                  dropShadow: detail.dropShadow ?? c.dropShadow,
                  shadowColor: detail.shadowColor ?? c.shadowColor,
                  shadowBlur: detail.shadowBlur ?? c.shadowBlur,
                  neonGlow: detail.neonGlow ?? c.neonGlow,
                  glowColor: detail.glowColor ?? c.glowColor,
                  background: detail.background ?? c.background,
                  bgRadius: detail.bgRadius ?? c.bgRadius,
                  bgPadding: detail.bgPadding ?? c.bgPadding,
                  opacity: detail.opacity ?? c.opacity,
                  posY: detail.posY ?? c.posY,
                  animation: detail.animation ?? c.animation,
                }
              : c
          )
        );
        return;
      }
      if (!detail.clipId || detail.applyToAll) {
        if (detail.transition !== undefined) {
          if (detail.track === 'video') {
            setVideoClips((prev) => prev.map((c) => ({ ...c, transition: detail.transition, transitionDuration: detail.transitionDuration ?? 0.5 })));
          } else if (detail.track === 'image') {
            setImageClips((prev) => prev.map((c) => ({ ...c, transition: detail.transition, transitionDuration: detail.transitionDuration ?? 0.5 })));
          }
        }
        if (!detail.clipId) return;
      }
      if (detail.track === 'video') {
        setVideoClips((prev) =>
          prev.map((c) =>
            c.id === detail.clipId
              ? {
                  ...c,
                  speed: typeof (detail as any).speed === 'number' ? (detail as any).speed : c.speed,
                  reversed: (detail as any).reversed !== undefined ? (detail as any).reversed : c.reversed,
                  audioFadeIn: (detail as any).audioFadeIn !== undefined ? (detail as any).audioFadeIn : c.audioFadeIn,
                  audioFadeOut: (detail as any).audioFadeOut !== undefined ? (detail as any).audioFadeOut : c.audioFadeOut,
                  normalizeAudio: (detail as any).normalizeAudio !== undefined ? (detail as any).normalizeAudio : c.normalizeAudio,
                  denoise: (detail as any).denoise !== undefined ? (detail as any).denoise : c.denoise,
                  volume: (detail as any).volume !== undefined ? (detail as any).volume : c.volume,
                  filterSettings: detail.filterSettings ? { ...(c.filterSettings || {}), ...detail.filterSettings } : c.filterSettings,
                  transform: detail.transform ? { ...(c.transform || {}), ...detail.transform } : c.transform,
                  animation: detail.animation ?? c.animation,
                  colorLabel: detail.colorLabel !== undefined ? detail.colorLabel : c.colorLabel,
                  transition: detail.transition !== undefined ? detail.transition : c.transition,
                  transitionDuration: detail.transitionDuration !== undefined ? detail.transitionDuration : c.transitionDuration,
                  animationIn: detail.animationIn !== undefined ? detail.animationIn : c.animationIn,
                  animationInDuration: detail.animationInDuration !== undefined ? detail.animationInDuration : c.animationInDuration,
                  animationOut: detail.animationOut !== undefined ? detail.animationOut : c.animationOut,
                  animationOutDuration: detail.animationOutDuration !== undefined ? detail.animationOutDuration : c.animationOutDuration,
                }
              : c
          )
        );
        if (detail.applyToAll && detail.transition !== undefined) {
          setVideoClips((prev) => prev.map((c) => ({ ...c, transition: detail.transition, transitionDuration: detail.transitionDuration ?? 0.5 })));
        }
      } else if (detail.track === 'image') {
        setImageClips((prev) =>
          prev.map((c) =>
            c.id === detail.clipId
              ? {
                  ...c,
                  filterSettings: detail.filterSettings ? { ...(c.filterSettings || {}), ...detail.filterSettings } : c.filterSettings,
                  transform: detail.transform ? { ...(c.transform || {}), ...detail.transform } : c.transform,
                  animation: detail.animation ?? c.animation,
                  colorLabel: detail.colorLabel ?? c.colorLabel,
                  transition: detail.transition !== undefined ? detail.transition : c.transition,
                  transitionDuration: detail.transitionDuration !== undefined ? detail.transitionDuration : c.transitionDuration,
                  animationIn: detail.animationIn !== undefined ? detail.animationIn : c.animationIn,
                  animationInDuration: detail.animationInDuration !== undefined ? detail.animationInDuration : c.animationInDuration,
                  animationOut: detail.animationOut !== undefined ? detail.animationOut : c.animationOut,
                  animationOutDuration: detail.animationOutDuration !== undefined ? detail.animationOutDuration : c.animationOutDuration,
                }
              : c
          )
        );
        if (detail.applyToAll && detail.transition !== undefined) {
          setImageClips((prev) => prev.map((c) => ({ ...c, transition: detail.transition, transitionDuration: detail.transitionDuration ?? 0.5 })));
        }
      }
    };
    const handleUpdateClipText = (e: Event) => {
      const detail = (e as CustomEvent<{ track: string; index: number; text: string; words?: any[] }>).detail;
      if (!detail || detail.track !== 'caption' || typeof detail.index !== 'number') return;
      setLocalClips((prev) =>
        prev.map((c, idx) =>
          idx === detail.index
            ? { ...c, text: detail.text, words: detail.words ?? c.words }
            : c
        )
      );
    };
    window.addEventListener('workspace:update-clip-timing', handleUpdateClipTiming);
    window.addEventListener('workspace:update-clip-properties', handleUpdateClipProperties);
    window.addEventListener('workspace:update-clip-props', handleUpdateClipProperties);
    
    const handleAiSmartTransitions = (e: Event) => {
      const detail = (e as CustomEvent<{ mood?: string; track?: 'video' | 'image' }>).detail;
      const mood = detail?.mood || 'cinematic';
      const pools: Record<string, { transitions: string[]; duration: number }> = {
        cinematic: { transitions: ['blur-crossfade', 'dissolve', 'luma-fade', 'soft-rotate', 'fade-black'], duration: 0.7 },
        viral: { transitions: ['zoom-in', 'whip-pan-left', 'flash', 'whip-pan-right', 'rgb-split', 'push-left'], duration: 0.35 },
        camera: { transitions: ['slide-left', 'slide-right', 'smooth-zoom', 'push-up', 'push-down'], duration: 0.5 },
        creative: { transitions: ['split-reveal', 'circle-wipe', 'soft-rotate', 'zoom-out', 'flash'], duration: 0.5 },
      };
      const pool = pools[mood] || pools.cinematic;

      const applyTransitions = (clips: any[]) => {
        if (clips.length <= 1) return clips;
        return clips.map((c, idx) => {
          if (idx === clips.length - 1) return { ...c, transition: 'none' };
          const trans = pool.transitions[idx % pool.transitions.length];
          return { ...c, transition: trans, transitionDuration: pool.duration };
        });
      };

      setVideoClips((prev) => applyTransitions(prev));
      setImageClips((prev) => applyTransitions(prev));
    };

    const handleAiSmartAnimations = (e: Event) => {
      const detail = (e as CustomEvent<{ mood?: string; track?: 'video' | 'image' }>).detail;
      const mood = detail?.mood || 'viral';
      const pairs: Record<string, { in: string; inDur: number; out: string; outDur: number }[]> = {
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
      const moodPairs = pairs[mood] || pairs.viral;

      const applyAnims = (clips: any[]) => {
        return clips.map((c, idx) => {
          const pair = moodPairs[idx % moodPairs.length];
          return {
            ...c,
            animationIn: pair.in,
            animationInDuration: pair.inDur,
            animationOut: pair.out,
            animationOutDuration: pair.outDur,
          };
        });
      };

      setVideoClips((prev) => applyAnims(prev));
      setImageClips((prev) => applyAnims(prev));
    };

    window.addEventListener('workspace:ai-smart-transitions', handleAiSmartTransitions);
    window.addEventListener('workspace:ai-smart-animations', handleAiSmartAnimations);
    window.addEventListener('workspace:update-clip-text', handleUpdateClipText);
    return () => {
      window.removeEventListener('workspace:update-clip-timing', handleUpdateClipTiming);
      window.removeEventListener('workspace:update-clip-properties', handleUpdateClipProperties);
      window.removeEventListener('workspace:update-clip-props', handleUpdateClipProperties);
      window.removeEventListener('workspace:update-clip-text', handleUpdateClipText);
      window.removeEventListener('workspace:ai-smart-transitions', handleAiSmartTransitions);
      window.removeEventListener('workspace:ai-smart-animations', handleAiSmartAnimations);
    };
  }, []);

  // Broadcast selected clip details to inspectors whenever selection or clips update
  useEffect(() => {
    if (!selectedClip) {
      window.dispatchEvent(
        new CustomEvent('workspace:selected-clip-details', {
          detail: { selectedClip: null, details: null },
        })
      );
      return;
    }
    let details: {
      start: number;
      duration: number;
      name: string;
      transition?: string;
      transitionDuration?: number;
      animationIn?: string;
      animationInDuration?: number;
      animationOut?: string;
      animationOutDuration?: number;
    } | null = null;
    if (selectedClip.track === 'video') {
      const found = videoClips.find((c) => c.id === selectedClip.clipId) || videoClips[0];
      details = found
        ? {
            start: found.start,
            duration: found.duration,
            name: found.name,
            transition: found.transition,
            transitionDuration: found.transitionDuration,
            animationIn: found.animationIn,
            animationInDuration: found.animationInDuration,
            animationOut: found.animationOut,
            animationOutDuration: found.animationOutDuration,
          }
        : { start: videoStart, duration: videoDuration, name: 'Video Backdrop' };
    } else if (selectedClip.track === 'image') {
      const found = imageClips.find((c) => c.id === selectedClip.clipId) || imageClips[0];
      details = found
        ? {
            start: found.start,
            duration: found.duration,
            name: found.name,
            transition: found.transition,
            transitionDuration: found.transitionDuration,
            animationIn: found.animationIn,
            animationInDuration: found.animationInDuration,
            animationOut: found.animationOut,
            animationOutDuration: found.animationOutDuration,
          }
        : { start: imageStart, duration: imageDuration, name: 'Image Backdrop' };
    } else if (selectedClip.track === 'caption' && typeof selectedClip.index === 'number') {
      const found = localClips[selectedClip.index];
      if (found) {
        details = { start: found.start, duration: found.duration || 1.5, name: found.text };
      }
    } else if (selectedClip.track === 'overlay') {
      const found = overlayClips.find((c) => c.id === selectedClip.clipId) || overlayClips[0];
      if (found) details = { start: found.start, duration: found.duration, name: found.name };
    } else if (selectedClip.track === 'voice') {
      const found = voiceClips.find((c) => c.id === selectedClip.clipId) || voiceClips[0];
      if (found) details = { start: found.start, duration: found.duration, name: found.name };
    } else if (selectedClip.track === 'music') {
      const found = musicClips.find((c) => c.id === selectedClip.clipId) || musicClips[0];
      if (found) details = { start: found.start, duration: found.duration, name: found.name };
    } else if (selectedClip.track === 'sfx') {
      const found = sfxClips.find((c) => c.id === selectedClip.clipId) || sfxClips[0];
      if (found) details = { start: found.start, duration: found.duration, name: found.name };
    } else if (selectedClip.track === 'title') {
      details = { start: titleStart, duration: titleDuration, name: script.title || 'Video Title' };
    }

    window.dispatchEvent(
      new CustomEvent('workspace:selected-clip-details', {
        detail: { selectedClip, details },
      })
    );
  }, [
    selectedClip,
    videoClips,
    videoStart,
    videoDuration,
    imageClips,
    imageStart,
    imageDuration,
    localClips,
    overlayClips,
    voiceClips,
    musicClips,
    sfxClips,
    titleStart,
    titleDuration,
    script.title,
  ]);
  const [editingClipIndex, setEditingClipIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  const [activeDrag, setActiveDrag] = useState<DragAction>(null);
  const dragTooltipRef = useRef<string | null>(null);
  const setDragTooltip = useCallback((tooltip: string | null) => {
    dragTooltipRef.current = tooltip;
  }, []);

  const tracksContainerRef = useRef<HTMLDivElement>(null);
  const tracksScrollRef = useRef<HTMLDivElement>(null);
  const rulerScrollRef = useRef<HTMLDivElement>(null);
  const rulerContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingPlayhead = useRef<boolean>(false);
  const [scrollbarWidth, setScrollbarWidth] = useState<number>(0);

  useEffect(() => {
    const el = tracksScrollRef.current;
    if (!el) return;
    const checkScrollbar = () => {
      const sbWidth = el.offsetWidth - el.clientWidth;
      setScrollbarWidth(Math.max(0, sbWidth));
    };
    checkScrollbar();
    const ro = new ResizeObserver(checkScrollbar);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);


  const handleTracksScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (rulerScrollRef.current) {
      rulerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const maxVideoEnd = videoClips.reduce((max, c) => Math.max(max, (Number(c.start) || 0) + (Number(c.duration) || 0)), 0);
  const maxImageEnd = imageClips.reduce((max, c) => Math.max(max, (Number(c.start) || 0) + (Number(c.duration) || 0)), 0);
  const maxVoiceEnd = voiceClips.reduce((max, c) => Math.max(max, (Number(c.start) || 0) + (Number(c.duration) || 0)), 0);
  const maxMusicEnd = musicClips.reduce((max, c) => Math.max(max, (Number(c.start) || 0) + (Number(c.duration) || 0)), 0);
  const maxSfxEnd = sfxClips.reduce((max, c) => Math.max(max, (Number(c.start) || 0) + (Number(c.duration) || 0)), 0);
  const maxOverlayEnd = overlayClips.reduce((max, c) => Math.max(max, (Number(c.start) || 0) + (Number(c.duration) || 0)), 0);

  const contentEnd = Math.max(
    0,
    enabledTracks.video ? Math.max(maxVideoEnd, (customVideoUrl || (!customImageUrl && activeBackdrop?.id)) ? (Number(videoStart) || 0) + (Number(videoDuration) || 0) : 0) : 0,
    enabledTracks.image ? Math.max(maxImageEnd, (customImageUrl || (!customVideoUrl && activeBackdrop?.imageUrl)) ? (Number(imageStart) || 0) + (Number(imageDuration) || 0) : 0) : 0,
    enabledTracks.overlay ? Math.max(maxOverlayEnd, activeElementOverlay ? (Number(overlayStart) || 0) + (Number(overlayDuration) || 0) : 0) : 0,
    enabledTracks.captions
      ? localClips.reduce((end, clip) => Math.max(end, (Number(clip.start) || 0) + (Number(clip.duration) || 3)), 0)
      : 0,
    enabledTracks.title && script.title ? (Number(titleStart) || 0) + (Number(titleDuration) || 0) : 0,
    enabledTracks.voice ? Math.max(maxVoiceEnd, audioUrl ? (Number(voiceStart) || 0) + (Number(voiceDuration) || 0) : 0) : 0,
    enabledTracks.music ? Math.max(maxMusicEnd, selectedMusic ? (Number(musicStart) || 0) + (Number(musicDuration) || 0) : 0) : 0,
    enabledTracks.sfx ? Math.max(maxSfxEnd, selectedSfx ? (Number(sfxStart) || 0) + (Number(sfxDuration) || 0) : 0) : 0
  );
  const rawProjectDuration = Math.max(
    0,
    Number.isFinite(contentEnd) && contentEnd > 0
      ? contentEnd
      : (Number.isFinite(duration) && duration > 0 ? duration : (Number(timelineDuration) || 0))
  );
  const projectDuration = Number.isFinite(rawProjectDuration) && rawProjectDuration > 0 ? rawProjectDuration : 0;
  // Stable timeline runway (no dependency on currentTime to prevent jumping/rubber-banding while scrubbing)
  const totalDuration = projectDuration > 0
    ? Math.max(projectDuration, Math.ceil(projectDuration / 5) * 5 + 5)
    : 30;
  const progressPercent = Math.min(100, Math.max(0, (currentTime / totalDuration) * 100));

  const timelineScale = Math.max(0.25, Number.isFinite(zoomLevel) ? zoomLevel : 1);

  // Pixel-based canvas width across infinite runway
  const safeTotalDuration = Math.max(0.1, Number.isFinite(totalDuration) ? totalDuration : 300);
  const safeViewportWidth = Math.max(300, Number(rulerViewportWidth) || 720);
  const safeScale = Math.max(0.25, Number.isFinite(timelineScale) ? timelineScale : 1);
  const basePxPerSecond = 24;
  const trackContentWidthPx = Math.max(
    safeViewportWidth * 1.8,
    Math.round(safeTotalDuration * basePxPerSecond * safeScale)
  );
  const totalTimelineWidthPx = trackHeadersWidth + trackContentWidthPx;

  // Auto-scroll timeline to follow playhead during playback
  useEffect(() => {
    if (!isPlaying || !tracksScrollRef.current) return;
    const scrollEl = tracksScrollRef.current;
    const playheadPx = (currentTime / (totalDuration || 1)) * trackContentWidthPx;
    const currentScrollLeft = scrollEl.scrollLeft;
    const viewportWidth = scrollEl.clientWidth - trackHeadersWidth;
    if (playheadPx > currentScrollLeft + viewportWidth - 60) {
      scrollEl.scrollLeft = Math.max(0, playheadPx - 80);
    } else if (playheadPx < currentScrollLeft) {
      scrollEl.scrollLeft = Math.max(0, playheadPx - 40);
    }
  }, [isPlaying, currentTime, totalDuration, trackContentWidthPx, trackHeadersWidth]);

  useEffect(() => {
    onTimelineDurationChange?.(projectDuration);
  }, [onTimelineDurationChange, projectDuration]);

  useEffect(() => {
    if (!selectedSfx) return;
    setSfxClips((prev) => {
      if (prev.some((c) => c.name === selectedSfx.name && Math.abs(c.start - selectedSfx.start) < 0.1)) return prev;
      return [
        ...prev,
        {
          id: `sfx-${Date.now()}`,
          type: 'sfx',
          url: selectedSfx.audioUrl,
          name: selectedSfx.name,
          start: selectedSfx.start,
          duration: selectedSfx.duration || 2.0,
        },
      ];
    });
    setSfxStart(selectedSfx.start);
    setSfxDuration(selectedSfx.duration);
    setEnabledTracks((previous) => ({ ...previous, sfx: true }));
    setSelectedClip({ track: 'sfx' });
  }, [selectedSfx]);

  // Dynamic Lane Stacking for Captions (prevent text overlapping; overlapping clips sit ABOVE)
  const { lanes: captionLanes, maxLane: captionMaxLane } = computeCaptionLanes(localClips);
  const laneHeight = 32;
  const laneGap = 4;
  const captionTrackHeight = Math.max(40, (captionMaxLane + 1) * (laneHeight + laneGap) + 4);
  const titleTrackHeight = 40;

  // Dynamic Lane Stacking for Media & Audio Tracks (overlapping clips automatically move above & below!)
  const { lanes: videoLanes, maxLane: videoMaxLane } = computeClipLanes(videoClips);
  const videoTrackHeight = Math.max(40, (videoMaxLane + 1) * (laneHeight + laneGap) + 4);

  const { lanes: imageLanes, maxLane: imageMaxLane } = computeClipLanes(imageClips);
  const imageTrackHeight = Math.max(40, (imageMaxLane + 1) * (laneHeight + laneGap) + 4);

  const { lanes: overlayLanes, maxLane: overlayMaxLane } = computeClipLanes(overlayClips);
  const overlayTrackHeight = Math.max(40, (overlayMaxLane + 1) * (laneHeight + laneGap) + 4);

  const { lanes: voiceLanes, maxLane: voiceMaxLane } = computeClipLanes(voiceClips);
  const voiceTrackHeight = Math.max(40, (voiceMaxLane + 1) * (laneHeight + laneGap) + 4);

  const { lanes: musicLanes, maxLane: musicMaxLane } = computeClipLanes(musicClips);
  const musicTrackHeight = Math.max(40, (musicMaxLane + 1) * (laneHeight + laneGap) + 4);

  const { lanes: sfxLanes, maxLane: sfxMaxLane } = computeClipLanes(sfxClips);
  const sfxTrackHeight = Math.max(40, (sfxMaxLane + 1) * (laneHeight + laneGap) + 4);

  const currentTimeRef = useRef(currentTime);
  currentTimeRef.current = currentTime;

  // Listen for newly added clips from Left Panes (Media, Image, Video, Audio, Elements)
  useEffect(() => {
    const handleAddTimelineClip = (e: Event) => {
      const detail = (e as CustomEvent<{
        type: 'video' | 'image' | 'voice' | 'music' | 'sfx' | 'overlay';
        url?: string;
        name?: string;
        duration?: number;
        start?: number;
        value?: string;
        label?: string;
        elementType?: 'sticker' | 'badge' | 'progress' | 'shape';
      }>).detail;
      if (!detail) return;

      const clipStart = detail.start !== undefined ? detail.start : parseFloat(currentTimeRef.current.toFixed(2));
      const clipId = `${detail.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      if (detail.type === 'video' && detail.url) {
        const clipDuration = detail.duration || 10;
        const poster = (detail as any).posterUrl || (detail as any).thumbnailUrl || customImageUrl || activeBackdrop?.imageUrl;
        const newClip: TimelineMediaClip = {
          id: clipId,
          type: 'video',
          url: detail.url,
          posterUrl: poster,
          thumbnailUrl: poster,
          name: detail.name || 'Video Clip',
          start: clipStart,
          duration: clipDuration,
        };
        setVideoClips((prev) => [...prev, newClip]);
        setEnabledTracks((prev) => ({ ...prev, video: true }));
        setVideoTrackVisible(true);
        setSelectedClip({ track: 'video', clipId });
        onSelectCompound?.('video');
      } else if (detail.type === 'image' && detail.url) {
        const clipDuration = detail.duration || 8;
        const newClip: TimelineMediaClip = {
          id: clipId,
          type: 'image',
          url: detail.url,
          name: detail.name || 'Image Graphic',
          start: clipStart,
          duration: clipDuration,
        };
        setImageClips((prev) => [...prev, newClip]);
        setEnabledTracks((prev) => ({ ...prev, image: true }));
        setImageTrackVisible(true);
        setSelectedClip({ track: 'image', clipId });
        onSelectCompound?.('video');
      } else if (detail.type === 'voice') {
        const clipDuration = detail.duration || (duration > 0 ? duration : 12.1);
        const newClip: TimelineAudioClip = {
          id: clipId,
          type: 'voice',
          url: detail.url || audioUrl || '',
          name: detail.name || 'Voiceover Track',
          start: clipStart,
          duration: clipDuration,
        };
        setVoiceClips((prev) => [...prev, newClip]);
        setEnabledTracks((prev) => ({ ...prev, voice: true }));
        setVoiceTrackMuted(false);
        setSelectedClip({ track: 'voice', clipId });
        onSelectCompound?.('voice');
      } else if (detail.type === 'music') {
        const clipDuration = detail.duration || 15.0;
        const newClip: TimelineAudioClip = {
          id: clipId,
          type: 'music',
          url: detail.url || '',
          name: detail.name || 'Music Soundtrack',
          start: clipStart,
          duration: clipDuration,
        };
        setMusicClips((prev) => [...prev, newClip]);
        setEnabledTracks((prev) => ({ ...prev, music: true }));
        setMusicTrackMuted(false);
        setSelectedClip({ track: 'music', clipId });
        onSelectCompound?.('music');
      } else if (detail.type === 'sfx') {
        const clipDuration = detail.duration || 2.0;
        const newClip: TimelineAudioClip = {
          id: clipId,
          type: 'sfx',
          url: detail.url || '',
          name: detail.name || 'Sound Effect',
          start: clipStart,
          duration: clipDuration,
        };
        setSfxClips((prev) => [...prev, newClip]);
        setEnabledTracks((prev) => ({ ...prev, sfx: true }));
        setSfxTrackMuted(false);
        setSelectedClip({ track: 'sfx', clipId });
        onSelectCompound?.('music');
      } else if (detail.type === 'overlay') {
        const clipDuration = detail.duration || 4.5;
        const newClip: TimelineOverlayClip = {
          id: clipId,
          type: detail.elementType || 'shape',
          value: detail.value || detail.url || '',
          label: detail.label || detail.name || 'Visual Element',
          name: detail.name || 'Overlay Element',
          start: clipStart,
          duration: clipDuration,
        };
        setOverlayClips((prev) => [...prev, newClip]);
        setEnabledTracks((prev) => ({ ...prev, overlay: true }));
        setOverlayTrackVisible(true);
        setSelectedClip({ track: 'overlay', clipId });
        onSelectCompound?.('overlay');
      }
    };

    const handleSetStoryboard = (e: Event) => {
      const detail = (e as CustomEvent<{ storyboard?: any[]; musicTrack?: string; captions?: any[]; duration?: number; soundDesign?: any; hooks?: any[] }>).detail;
      if (!detail || !detail.storyboard || !detail.storyboard.length) return;

      const newVideoClips: TimelineMediaClip[] = [];
      const newImageClips: TimelineMediaClip[] = [];
      const newSfxClips: TimelineAudioClip[] = [];

      let runningStart = 0;
      detail.storyboard.forEach((scene: any, idx: number) => {
        const clipId = `sb-${scene.sceneNumber || idx + 1}-${Date.now()}`;
        const clipName = scene.mediaName || `Scene ${scene.sceneNumber || idx + 1}: ${scene.beat || 'Beat'}`;
        const parsedStart = typeof scene.start === 'number' && Number.isFinite(scene.start) ? scene.start : parseFloat(scene.start);
        const parsedDuration = typeof scene.duration === 'number' && Number.isFinite(scene.duration) ? scene.duration : parseFloat(scene.duration);
        const clipDuration = Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : 2.5;
        const clipStart = Number.isFinite(parsedStart) ? parsedStart : runningStart;
        runningStart = parseFloat((clipStart + clipDuration).toFixed(2));

        // Enforce pure video cuts on the timeline for every storyboard scene
        const fallbackBackdrop = DEFAULT_VISUAL_BACKDROPS[idx % DEFAULT_VISUAL_BACKDROPS.length];
        const resolvedUrl = scene.mediaUrl || scene.videoUrl || scene.previewUrl || customVideoUrl || customImageUrl || activeBackdrop?.videoUrl || activeBackdrop?.imageUrl || fallbackBackdrop.videoUrl;
        const aiMotionPatterns = [
          { in: 'zoom-in', inDur: 0.35, out: 'slide-fade', outDur: 0.35, trans: 'whip-pan-left', transDur: 0.35 },
          { in: 'slide-left', inDur: 0.4, out: 'soft-reveal', outDur: 0.4, trans: 'luma-fade', transDur: 0.45 },
          { in: 'bounce', inDur: 0.4, out: 'zoom-out', outDur: 0.4, trans: 'soft-rotate', transDur: 0.4 },
          { in: 'flip-x', inDur: 0.35, out: 'flash', outDur: 0.3, trans: 'rgb-split', transDur: 0.35 },
          { in: 'soft-reveal', inDur: 0.5, out: 'fade', outDur: 0.5, trans: 'blur-crossfade', transDur: 0.5 },
        ];
        const motionPattern = aiMotionPatterns[idx % aiMotionPatterns.length];
        const isLastScene = idx === (detail.storyboard?.length ?? 1) - 1;

        newVideoClips.push({
          id: clipId,
          type: 'video',
          url: resolvedUrl,
          posterUrl: scene.posterUrl || scene.thumbnailUrl || (scene.mediaType === 'image' ? scene.mediaUrl : undefined),
          thumbnailUrl: scene.thumbnailUrl || scene.posterUrl,
          name: clipName,
          start: clipStart,
          duration: clipDuration,
          animationIn: scene.animationIn || motionPattern.in,
          animationInDuration: scene.animationInDuration || motionPattern.inDur,
          animationOut: scene.animationOut || motionPattern.out,
          animationOutDuration: scene.animationOutDuration || motionPattern.outDur,
          transition: isLastScene ? 'none' : (scene.transition || motionPattern.trans),
          transitionDuration: isLastScene ? 0.5 : (scene.transitionDuration || motionPattern.transDur),
          aestheticScore: scene.aestheticScore || scene.media?.aestheticScore,
          aestheticBadges: scene.aestheticBadges || scene.media?.aestheticBadges,
        });

        // Intelligently place purposeful SFX cues (opening whoosh, mid impact, climax drop)
        // Ensure at least 2.2s separation so clips don't collide or stack into chaotic dominoes
        if (scene.sfxUrl && (newSfxClips.length === 0 || !newSfxClips.some((c) => Math.abs(c.start - clipStart) < 2.2))) {
          newSfxClips.push({
            id: `sfx-${scene.sceneNumber || idx + 1}-${Date.now()}`,
            type: 'sfx',
            url: scene.sfxUrl,
            name: scene.sfx || 'Whoosh',
            start: clipStart,
            duration: 1.2,
          });
        }
      });

      // Standalone Sound Design: Only add if there is a real acoustic gap (>= 2.5s) and limit to max 4 SFX
      const soundDesignEvents = (detail as any).soundDesign?.sfxEvents || [];
      soundDesignEvents.forEach((evt: any, i: number) => {
        const evtTime = typeof evt.time === 'number' && Number.isFinite(evt.time) ? evt.time : i * 3.0;
        if (newSfxClips.length < 4 && evt.sfxUrl && !newSfxClips.some((c) => Math.abs(c.start - evtTime) < 2.5)) {
          newSfxClips.push({
            id: `sfx-evt-${i}-${Date.now()}`,
            type: 'sfx',
            url: evt.sfxUrl,
            name: evt.label || 'Impact',
            start: evtTime,
            duration: 1.2,
          });
        }
      });

      if (newVideoClips.length > 0) {
        setVideoClips(newVideoClips);
        setImageClips([]); // 100% pure video cuts
        setEnabledTracks((prev) => ({ ...prev, video: true, image: false }));
        setVideoTrackVisible(true);
        setImageTrackVisible(false);
        setIsCollapsed(false);
      }
      if (detail.captions && detail.captions.length > 0) {
        const grouped = groupMicroCaptionsIntoPhrases(detail.captions);
        setLocalClips(grouped);
        setEnabledTracks((prev) => ({ ...prev, captions: true }));
        setCaptionsTrackLocked(false);
        onUpdateSubtitles?.(grouped);
      }
      if (detail.duration && detail.duration > 0) {
        onTimelineDurationChange?.(detail.duration);
        setVideoDuration(detail.duration);
        setVoiceDuration(detail.duration);
        setEnabledTracks((prev) => ({ ...prev, voice: true, title: Boolean(script.title) }));
        setVoiceTrackMuted(false);
              }
      if (newSfxClips.length > 0) {
        setSfxClips(newSfxClips);
        setEnabledTracks((prev) => ({ ...prev, sfx: true }));
        setSfxTrackMuted(false);
      }
    };

    window.addEventListener('workspace:add-timeline-clip', handleAddTimelineClip);
    window.addEventListener('workspace:set-timeline-storyboard', handleSetStoryboard);
    return () => {
      window.removeEventListener('workspace:add-timeline-clip', handleAddTimelineClip);
      window.removeEventListener('workspace:set-timeline-storyboard', handleSetStoryboard);
    };
  }, [duration, audioUrl, onSelectCompound]);

  // Auto-enable Image track and sync if customImageUrl is chosen
  useEffect(() => {
    if (customImageUrl) {
      setImageClips((prev) => {
        if (prev.some((c) => c.url === customImageUrl)) return prev;
        return [
          ...prev,
          {
            id: `img-${Date.now()}`,
            type: 'image',
            url: customImageUrl,
            name: 'Image Graphic',
            start: 0,
            duration: 8.0,
          },
        ];
      });
      setEnabledTracks((prev) => ({ ...prev, image: true }));
      setImageTrackVisible(true);
      setSelectedClip({ track: 'image' });
    }
  }, [customImageUrl]);

  // Auto-enable Video track and sync if customVideoUrl is chosen (only if timeline has 0 video clips)
  useEffect(() => {
    if (customVideoUrl) {
      setVideoClips((prev) => {
        if (prev.length > 0) return prev; // Do not auto-append duplicate clips
        return [
          {
            id: `vid-${Date.now()}`,
            type: 'video',
            url: customVideoUrl,
            posterUrl: customImageUrl || activeBackdrop?.imageUrl,
            thumbnailUrl: customImageUrl || activeBackdrop?.imageUrl,
            name: 'Video Clip',
            start: 0,
            duration: duration > 0 ? duration : 12.1,
          },
        ];
      });
      setEnabledTracks((prev) => ({ ...prev, video: true }));
      setVideoTrackVisible(true);
      setSelectedClip({ track: 'video' });
    }
  }, [customVideoUrl, duration]);

  // Listen for direct removal of video clip by URL
  useEffect(() => {
    const handleRemoveClipByUrl = (e: Event) => {
      const detail = (e as CustomEvent<{ url: string }>).detail;
      if (!detail?.url) return;
      setVideoClips((prev) => prev.filter((c) => c.url !== detail.url));
      setImageClips((prev) => prev.filter((c) => c.url !== detail.url));
    };
    window.addEventListener('workspace:remove-clip-by-url', handleRemoveClipByUrl);
    return () => window.removeEventListener('workspace:remove-clip-by-url', handleRemoveClipByUrl);
  }, []);

  const lastBackdropIdRef = useRef<string | undefined>(undefined);
  const lastMusicIdRef = useRef<string | undefined>(undefined);

  // Listen for timeline reset / new project creation
  useEffect(() => {
    const handleClearTimeline = () => {
      setVideoClips([]);
      setImageClips([]);
      setVoiceClips([]);
      setMusicClips([]);
      setSfxClips([]);
      setOverlayClips([]);
      setLocalClips([]);
      setSelectedClip(null);
      lastBackdropIdRef.current = undefined;
      lastMusicIdRef.current = undefined;
    };
    window.addEventListener('workspace:clear-timeline', handleClearTimeline);
    return () => window.removeEventListener('workspace:clear-timeline', handleClearTimeline);
  }, []);

  // Backdrop clip selection synchronization (only when user actively selects a new backdrop)
  useEffect(() => {
    if (!activeBackdrop?.id || customVideoUrl || customImageUrl) {
      lastBackdropIdRef.current = activeBackdrop?.id;
      return;
    }
    // Only update if the user deliberately selected a new backdrop
    if (lastBackdropIdRef.current === activeBackdrop.id) {
      return;
    }
    lastBackdropIdRef.current = activeBackdrop.id;

    const videoUrl = activeBackdrop.videoUrl || undefined;
    if (videoUrl) {
      setVideoClips((prev) => {
        if (prev.length <= 1) {
          return [{
            id: `vid-${activeBackdrop.id}`,
            type: 'video',
            url: videoUrl,
            posterUrl: activeBackdrop.imageUrl,
            thumbnailUrl: activeBackdrop.imageUrl,
            name: activeBackdrop.name || 'Video Clip',
            start: prev[0]?.start ?? 0,
            duration: prev[0]?.duration ?? (duration > 0 ? duration : 12.1),
          }];
        }
        return prev;
      });
      setEnabledTracks((prev) => ({ ...prev, video: true }));
    } else if (activeBackdrop.imageUrl) {
      const imageUrl = activeBackdrop.imageUrl;
      setImageClips((prev) => {
        if (prev.length <= 1) {
          return [{
            id: `img-${activeBackdrop.id}`,
            type: 'image',
            url: imageUrl,
            name: activeBackdrop.name || 'Image Graphic',
            start: prev[0]?.start ?? 0,
            duration: prev[0]?.duration ?? 8.0,
          }];
        }
        return prev;
      });
      setEnabledTracks((prev) => ({ ...prev, image: true }));
    }
  }, [activeBackdrop?.id, customVideoUrl, customImageUrl, duration]);

  // Auto-enable Music track and sync clip only when user actively selects a music track
  useEffect(() => {
    if (!selectedMusic) {
      lastMusicIdRef.current = undefined;
      return;
    }
    if (lastMusicIdRef.current === selectedMusic) {
      return;
    }
    lastMusicIdRef.current = selectedMusic;

    const trackObj = musicTracks.find((m) => m.id === selectedMusic);
    setMusicClips((prev) => {
      if (prev.length <= 1) {
        return [
          {
            id: `mus-${selectedMusic}`,
            type: 'music',
            url: trackObj?.audioUrl || '',
            name: trackObj ? trackObj.title : 'Soundtrack',
            start: prev[0]?.start ?? 0,
            duration: prev[0]?.duration ?? 15.0,
          },
        ];
      }
      return prev;
    });
    setEnabledTracks((prev) => ({ ...prev, music: true }));
    setMusicTrackMuted(false);
  }, [selectedMusic, musicTracks]);

  // Auto-enable Voice track and select clip if audioUrl is chosen
  useEffect(() => {
    if (audioUrl) {
      setVoiceClips((prev) => {
        if (prev.some((c) => c.url === audioUrl)) {
          if (duration > 0 && Math.abs((prev[0]?.duration || 0) - duration) > 0.05) {
            return prev.map((c) => (c.url === audioUrl ? { ...c, duration } : c));
          }
          return prev;
        }
        return [
          ...prev,
          {
            id: `vox-${Date.now()}`,
            type: 'voice',
            url: audioUrl,
            name: selectedVoice ? `Voice: ${selectedVoice}` : 'Voiceover',
            start: 0,
            duration: duration > 0 ? duration : 12.1,
          },
        ];
      });
      setEnabledTracks((prev) => ({ ...prev, voice: true }));
      setVoiceTrackMuted(false);
      setSelectedClip({ track: 'voice' });
    }
  }, [audioUrl, duration, selectedVoice]);

  // Auto-enable Overlay track if activeElementOverlay is selected
  useEffect(() => {
    if (activeElementOverlay) {
      setOverlayClips((prev) => {
        if (prev.some((c) => c.value === activeElementOverlay.value)) return prev;
        return [
          ...prev,
          {
            id: `ovl-${Date.now()}`,
            type: (activeElementOverlay.type as any) || 'badge',
            value: activeElementOverlay.value,
            label: activeElementOverlay.label || activeElementOverlay.name || 'Visual Element',
            name: activeElementOverlay.name || 'Overlay Element',
            start: 1.5,
            duration: 6.0,
          },
        ];
      });
      setEnabledTracks((prev) => ({ ...prev, overlay: true }));
      setSelectedClip({ track: 'overlay' });
    }
  }, [activeElementOverlay]);

  // Sync script subtitles into local clips (from subtitles or storyboard)
  useEffect(() => {
    if (script.subtitles && script.subtitles.length > 0) {
      const totalWords = script.subtitles.reduce((sum, c) => sum + (c.text ? c.text.trim().split(/\s+/).length : 1), 0);
      const avgWords = totalWords / script.subtitles.length;
      const avgDuration = script.subtitles.reduce((sum, c) => sum + (c.duration || 1), 0) / script.subtitles.length;
      // Only group if incoming subtitles are raw micro-captions (<= 2 words and < 1.4s per cue)
      if (avgWords <= 2 && avgDuration < 1.4 && script.subtitles.length > 5) {
        const grouped = groupMicroCaptionsIntoPhrases(script.subtitles);
        setLocalClips(grouped);
        onUpdateSubtitles?.(grouped);
      } else {
        setLocalClips(script.subtitles);
      }
    } else if (script.storyboard && script.storyboard.length > 0) {
      const generated = script.storyboard
        .filter((sc) => sc.subtitleText)
        .map((sc) => ({
          text: sc.subtitleText || '',
          start: sc.start,
          duration: sc.duration,
          captionPresetClass: sc.captionPresetClass,
          captionPresetColor: sc.captionPresetColor,
        }));
      const grouped = groupMicroCaptionsIntoPhrases(generated);
      setLocalClips(grouped);
      if (!script.subtitles || script.subtitles.length === 0) {
        onUpdateSubtitles?.(grouped);
      }
    } else {
      setLocalClips([]);
    }
  }, [script.subtitles, script.storyboard]);

  // Auto-sync storyboard scenes into videoClips if videoClips is empty
  useEffect(() => {
    if (script.storyboard && script.storyboard.length > 0 && videoClips.length === 0) {
      let runningStart = 0;
      const initialVideos: TimelineMediaClip[] = [];
      script.storyboard.forEach((scene: any, idx: number) => {
        const fallbackBackdrop = DEFAULT_VISUAL_BACKDROPS[idx % DEFAULT_VISUAL_BACKDROPS.length];
        const resolvedUrl = scene.mediaUrl || scene.videoUrl || scene.previewUrl || customVideoUrl || customImageUrl || activeBackdrop?.videoUrl || activeBackdrop?.imageUrl || fallbackBackdrop.videoUrl;
        const parsedStart = typeof scene.start === 'number' && Number.isFinite(scene.start) ? scene.start : parseFloat(scene.start);
        const parsedDuration = typeof scene.duration === 'number' && Number.isFinite(scene.duration) ? scene.duration : parseFloat(scene.duration);
        const clipDuration = Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : 2.5;
        const clipStart = Number.isFinite(parsedStart) ? parsedStart : runningStart;
        runningStart = parseFloat((clipStart + clipDuration).toFixed(2));

        const aiMotionPatterns = [
          { in: 'zoom-in', inDur: 0.35, out: 'slide-fade', outDur: 0.35, trans: 'whip-pan-left', transDur: 0.35 },
          { in: 'slide-left', inDur: 0.4, out: 'soft-reveal', outDur: 0.4, trans: 'luma-fade', transDur: 0.45 },
          { in: 'bounce', inDur: 0.4, out: 'zoom-out', outDur: 0.4, trans: 'soft-rotate', transDur: 0.4 },
          { in: 'flip-x', inDur: 0.35, out: 'flash', outDur: 0.3, trans: 'rgb-split', transDur: 0.35 },
          { in: 'soft-reveal', inDur: 0.5, out: 'fade', outDur: 0.5, trans: 'blur-crossfade', transDur: 0.5 },
        ];
        const isLastScene = idx === (script.storyboard?.length ?? 1) - 1;
        const motionPattern = aiMotionPatterns[idx % aiMotionPatterns.length];

        initialVideos.push({
          id: `sb-${scene.sceneNumber || idx + 1}-${Date.now()}`,
          type: 'video',
          url: resolvedUrl,
          posterUrl: scene.posterUrl || scene.thumbnailUrl || (scene.mediaType === 'image' ? scene.mediaUrl : undefined),
          thumbnailUrl: scene.thumbnailUrl || scene.posterUrl,
          name: scene.mediaName || `Scene ${scene.sceneNumber || idx + 1}: ${scene.beat || 'Beat'}`,
          start: clipStart,
          duration: clipDuration,
          animationIn: scene.animationIn || motionPattern.in,
          animationInDuration: scene.animationInDuration || motionPattern.inDur,
          animationOut: scene.animationOut || motionPattern.out,
          animationOutDuration: scene.animationOutDuration || motionPattern.outDur,
          transition: isLastScene ? 'none' : (scene.transition || motionPattern.trans),
          transitionDuration: isLastScene ? 0.5 : (scene.transitionDuration || motionPattern.transDur),
        });
      });

      if (initialVideos.length > 0) {
        setVideoClips(initialVideos);
        setEnabledTracks((prev) => ({ ...prev, video: true }));
        setVideoTrackVisible(true);
      }
    }
  }, [script.storyboard, videoClips.length]);

  // Sync initial video / voice length to duration
  useEffect(() => {
    if (duration > 0) {
      setVideoDuration(duration);
      setVoiceDuration(duration);
    }
  }, [duration]);

  // ── Broadcast timeline state to VideoPreviewPane via CustomEvent ──────
  // Fired whenever any visibility/mute/trim/enabled state changes so the
  // preview canvas can reflect the current timeline configuration in real time.
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('workspace:timeline-state', {
        detail: {
          selectedTrack: selectedClip?.track,
          // Visibility / enabled
          videoVisible: enabledTracks.video && videoTrackVisible,
          imageVisible: enabledTracks.image && imageTrackVisible,
          overlayVisible: enabledTracks.overlay && overlayTrackVisible,
          captionsVisible: enabledTracks.captions,
          titleVisible: enabledTracks.title,
          // Mute
          voiceMuted: voiceTrackMuted || !enabledTracks.voice,
          musicMuted: musicTrackMuted || !enabledTracks.music,
          sfxMuted: sfxTrackMuted || !enabledTracks.sfx,
          // Multi-clip arrays
          videoClips,
          imageClips,
          voiceClips,
          musicClips,
          sfxClips,
          overlayClips,
          captionClips: localClips,
          // Clip timing (for legacy fallback)
          videoStart: videoClips[0]?.start ?? videoStart,
          videoDuration: videoClips[0]?.duration ?? videoDuration,
          videoEnabled: enabledTracks.video,
          imageStart: imageClips[0]?.start ?? imageStart,
          imageDuration: imageClips[0]?.duration ?? imageDuration,
          overlayStart: overlayClips[0]?.start ?? overlayStart,
          overlayDuration: overlayClips[0]?.duration ?? overlayDuration,
          titleStart,
          titleDuration,
          // Track enabled flags
          enabledTracks,
        },
      })
    );
  }, [
    enabledTracks,
    videoTrackVisible,
    imageTrackVisible,
    overlayTrackVisible,
    voiceTrackMuted,
    musicTrackMuted,
    sfxTrackMuted,
    videoClips,
    imageClips,
    voiceClips,
    musicClips,
    sfxClips,
    overlayClips,
    localClips,
    videoStart,
    videoDuration,
    imageStart,
    imageDuration,
    overlayStart,
    overlayDuration,
    titleStart,
    titleDuration,
  ]);


  // Magnetic Snapping Calculation Helper
  const calculateSnap = (
    targetTime: number,
    candidatePoints: number[],
    tolerance: number = 0.35
  ): { value: number; snapped: boolean; snapPoint?: number } => {
    if (!snapEnabled) return { value: targetTime, snapped: false };
    let bestPoint: number | null = null;
    let minDistance = Infinity;

    for (const pt of candidatePoints) {
      if (typeof pt === 'number' && !isNaN(pt)) {
        const distance = Math.abs(targetTime - pt);
        if (distance <= tolerance && distance < minDistance) {
          minDistance = distance;
          bestPoint = pt;
        }
      }
    }

    if (bestPoint !== null) {
      return { value: bestPoint, snapped: true, snapPoint: bestPoint };
    }
    return { value: targetTime, snapped: false };
  };

  // Helper to snap a clip of given duration when moving (both start and end edge snapping)
  const snapClipMove = (
    rawStart: number,
    clipDuration: number,
    candidatePoints: number[],
    tolerance: number
  ): { newStart: number; snapped: boolean; snapPoint?: number } => {
    if (!snapEnabled) return { newStart: rawStart, snapped: false };

    const leftSnap = calculateSnap(rawStart, candidatePoints, tolerance);
    const rightSnap = calculateSnap(rawStart + clipDuration, candidatePoints, tolerance);

    if (leftSnap.snapped && rightSnap.snapped) {
      const leftDist = Math.abs(leftSnap.value - rawStart);
      const rightDist = Math.abs(rightSnap.value - (rawStart + clipDuration));
      if (leftDist <= rightDist) {
        return { newStart: leftSnap.value, snapped: true, snapPoint: leftSnap.snapPoint };
      } else {
        return { newStart: rightSnap.value - clipDuration, snapped: true, snapPoint: rightSnap.snapPoint };
      }
    } else if (leftSnap.snapped) {
      return { newStart: leftSnap.value, snapped: true, snapPoint: leftSnap.snapPoint };
    } else if (rightSnap.snapped) {
      return { newStart: rightSnap.value - clipDuration, snapped: true, snapPoint: rightSnap.snapPoint };
    }
    return { newStart: rawStart, snapped: false };
  };

  // Playhead scrub drag handler on ruler
  const handleRulerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingPlayhead.current = true;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    updateTimeFromPointer(e);
  };

  // Playhead scrub handler directly on tracks area
  const handleTracksPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('.timeline-clip-card') || target.closest('button') || target.closest('[data-clip-action]')) {
      return;
    }
    isDraggingPlayhead.current = true;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    updateTimeFromPointer(e);
  };

  const updateTimeFromPointer = (e: React.PointerEvent<HTMLDivElement> | PointerEvent) => {
    const target = rulerContainerRef.current || tracksContainerRef.current;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const rawTime = ratio * totalDuration;
    onSeek(rawTime);
  };

  // Select clip and trigger inspector event
  const handleSelectClip = (
    clip: SelectedClip,
    compound?: 'video' | 'text' | 'voice' | 'music' | 'overlay'
  ) => {
    setSelectedClip(clip);
    onSelectClipProp?.(clip);
    if (compound) {
      onSelectCompound?.(compound);
      window.dispatchEvent(
        new CustomEvent('workspace:select-compound', {
          detail: { compound, selectedClip: clip },
        })
      );
    }
  };

  // Enable track from Left Panel
  const handleEnableTrack = (
    trackKey: keyof EnabledTracks,
    selected: SelectedClip,
    compound: 'video' | 'text' | 'voice' | 'music' | 'overlay'
  ) => {
    setEnabledTracks((p) => ({ ...p, [trackKey]: true }));
    handleSelectClip(selected, compound);
  };

  // Keyboard Shortcuts: Space (Play/Pause), Del (Delete), Ctrl+D (Duplicate), Ctrl+B (Split), Arrows (Nudge)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        editingClipIndex !== null
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      } else if (e.code === 'Delete' || e.code === 'Backspace') {
        if (selectedClip) {
          e.preventDefault();
          handleDeleteClip();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyD' || e.key === 'd')) {
        if (selectedClip) {
          e.preventDefault();
          handleDuplicateClip();
        }
      } else if (((e.ctrlKey || e.metaKey) && (e.code === 'KeyB' || e.key === 'b')) || e.code === 'KeyS') {
        e.preventDefault();
        handleSplitClip();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        onSeek(Math.max(0, currentTime - 0.1));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onSeek(Math.min(totalDuration, currentTime + 0.1));
      } else if (e.code === 'KeyN') {
        e.preventDefault();
        setSnapEnabled((prev) => !prev);
      } else if (e.code === 'Escape') {
        setSelectedClip(null);
        setEditingClipIndex(null);
        setAddTrackMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClip, currentTime, totalDuration, onTogglePlay, onSeek, captionsTrackLocked, localClips]);

  // Global Pointer Listeners for Playhead & Moveable Track Clips
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (isDraggingPlayhead.current) {
        updateTimeFromPointer(e);
        return;
      }

      if (!activeDrag || !tracksContainerRef.current) return;

      const rect = tracksContainerRef.current.getBoundingClientRect();
      const pxPerSec = rect.width / (totalDuration || 1);
      const deltaSec = (e.clientX - activeDrag.startX) / pxPerSec;
      const snapToleranceSec = Math.max(0.35, 14 / pxPerSec);

      // Candidate points for magnetic snapping (excluding the currently dragged clip)
      const snapPoints: number[] = [0, currentTime];

      for (const c of videoClips) {
        if (activeDrag.kind !== 'video' || activeDrag.clipId !== c.id) {
          snapPoints.push(c.start, c.start + c.duration);
        }
      }
      for (const c of imageClips) {
        if (activeDrag.kind !== 'image' || activeDrag.clipId !== c.id) {
          snapPoints.push(c.start, c.start + c.duration);
        }
      }
      for (const c of voiceClips) {
        if (activeDrag.kind !== 'voice' || activeDrag.clipId !== c.id) {
          snapPoints.push(c.start, c.start + c.duration);
        }
      }
      for (const c of musicClips) {
        if (activeDrag.kind !== 'music' || activeDrag.clipId !== c.id) {
          snapPoints.push(c.start, c.start + c.duration);
        }
      }
      for (const c of sfxClips) {
        if (activeDrag.kind !== 'sfx' || activeDrag.clipId !== c.id) {
          snapPoints.push(c.start, c.start + c.duration);
        }
      }
      for (const c of overlayClips) {
        if (activeDrag.kind !== 'overlay' || activeDrag.clipId !== c.id) {
          snapPoints.push(c.start, c.start + c.duration);
        }
      }
      for (let idx = 0; idx < localClips.length; idx++) {
        const c = localClips[idx];
        if (activeDrag.kind !== 'subtitle' || activeDrag.index !== idx) {
          snapPoints.push(c.start, c.start + (c.duration || 3));
        }
      }

      const maxTimelineBound = Math.max(totalDuration + 60, 300);

      if (activeDrag.kind === 'subtitle') {
        const { index, mode, origStart, origDuration } = activeDrag;
        setLocalClips((prev) => {
          const updated = [...prev];
          const target = { ...updated[index] };
          const clipDuration = target.duration || origDuration || 3;

          if (mode === 'move') {
            const rawStart = origStart + deltaSec;
            const snapRes = snapClipMove(rawStart, clipDuration, snapPoints, snapToleranceSec);
            const nextStart = Math.max(0, Math.min(maxTimelineBound - clipDuration, snapRes.newStart));
            target.start = parseFloat(nextStart.toFixed(2));
            setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
            setDragTooltip(
              `▶ Captions [${index + 1}] • Start: ${target.start.toFixed(1)}s • Dur: ${clipDuration.toFixed(1)}s${snapRes.snapped ? ' 🧲 Snapped' : ''}`
            );
          } else if (mode === 'trim-left') {
            const rawStart = origStart + deltaSec;
            const snapRes = calculateSnap(rawStart, snapPoints, snapToleranceSec);
            const nextStart = Math.max(0, Math.min(origStart + origDuration - 0.3, snapRes.value));
            const nextDuration = origDuration - (nextStart - origStart);
            target.start = parseFloat(nextStart.toFixed(2));
            target.duration = parseFloat(Math.max(0.3, nextDuration).toFixed(2));
            setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
            setDragTooltip(
              `◀ Trim In: ${target.start.toFixed(1)}s • Dur: ${target.duration.toFixed(1)}s${snapRes.snapped ? ' 🧲 Snapped' : ''}`
            );
          } else if (mode === 'trim-right') {
            const rawEnd = origStart + origDuration + deltaSec;
            const snapRes = calculateSnap(rawEnd, snapPoints, snapToleranceSec);
            const nextEnd = Math.max(target.start + 0.3, Math.min(maxTimelineBound, snapRes.value));
            target.duration = parseFloat((nextEnd - target.start).toFixed(2));
            setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
            setDragTooltip(
              `▶ Trim Out: ${nextEnd.toFixed(1)}s • Dur: ${target.duration.toFixed(1)}s${snapRes.snapped ? ' 🧲 Snapped' : ''}`
            );
          }

          updated[index] = target;
          return updated;
        });
      } else if (activeDrag.kind === 'video') {
        const { clipId, mode, origStart, origDuration } = activeDrag;
        setVideoClips((prev) =>
          prev.map((c) => {
            if (c.id !== clipId) return c;
            const target = { ...c };
            if (mode === 'move') {
              const rawStart = origStart + deltaSec;
              const snapRes = snapClipMove(rawStart, target.duration, snapPoints, snapToleranceSec);
              const nextStart = Math.max(0, Math.min(maxTimelineBound - target.duration, snapRes.newStart));
              target.start = parseFloat(nextStart.toFixed(2));
              setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
              setDragTooltip(
                `▶ Video "${target.name}" • Start: ${nextStart.toFixed(1)}s • Dur: ${target.duration.toFixed(1)}s${snapRes.snapped ? ' 🧲 Snapped' : ''}`
              );
            } else if (mode === 'trim-left') {
              const rawStart = origStart + deltaSec;
              const snapRes = calculateSnap(rawStart, snapPoints, snapToleranceSec);
              const nextStart = Math.max(0, Math.min(origStart + origDuration - 0.5, snapRes.value));
              const nextDuration = origDuration - (nextStart - origStart);
              target.start = parseFloat(nextStart.toFixed(2));
              target.duration = parseFloat(Math.max(0.5, nextDuration).toFixed(2));
              setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
              setDragTooltip(`◀ Video Trim In: ${target.start.toFixed(1)}s • Dur: ${target.duration.toFixed(1)}s${snapRes.snapped ? ' 🧲 Snapped' : ''}`);
            } else if (mode === 'trim-right') {
              const rawEnd = origStart + origDuration + deltaSec;
              const snapRes = calculateSnap(rawEnd, snapPoints, snapToleranceSec);
              const nextEnd = Math.max(target.start + 0.5, Math.min(maxTimelineBound, snapRes.value));
              target.duration = parseFloat((nextEnd - target.start).toFixed(2));
              setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
              setDragTooltip(`▶ Video Trim Out: ${nextEnd.toFixed(1)}s • Dur: ${target.duration.toFixed(1)}s${snapRes.snapped ? ' 🧲 Snapped' : ''}`);
            }
            return target;
          })
        );
      } else if (activeDrag.kind === 'image') {
        const { clipId, mode, origStart, origDuration } = activeDrag;
        setImageClips((prev) =>
          prev.map((c) => {
            if (c.id !== clipId) return c;
            const target = { ...c };
            if (mode === 'move') {
              const rawStart = origStart + deltaSec;
              const snapRes = snapClipMove(rawStart, target.duration, snapPoints, snapToleranceSec);
              const nextStart = Math.max(0, Math.min(maxTimelineBound - target.duration, snapRes.newStart));
              target.start = parseFloat(nextStart.toFixed(2));
              setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
              setDragTooltip(
                `▶ Image "${target.name}" • Start: ${nextStart.toFixed(1)}s • Dur: ${target.duration.toFixed(1)}s${snapRes.snapped ? ' 🧲 Snapped' : ''}`
              );
            } else if (mode === 'trim-left') {
              const rawStart = origStart + deltaSec;
              const snapRes = calculateSnap(rawStart, snapPoints, snapToleranceSec);
              const nextStart = Math.max(0, Math.min(origStart + origDuration - 0.5, snapRes.value));
              const nextDuration = origDuration - (nextStart - origStart);
              target.start = parseFloat(nextStart.toFixed(2));
              target.duration = parseFloat(Math.max(0.5, nextDuration).toFixed(2));
              setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
              setDragTooltip(`◀ Image Trim In: ${target.start.toFixed(1)}s • Dur: ${target.duration.toFixed(1)}s${snapRes.snapped ? ' 🧲 Snapped' : ''}`);
            } else if (mode === 'trim-right') {
              const rawEnd = origStart + origDuration + deltaSec;
              const snapRes = calculateSnap(rawEnd, snapPoints, snapToleranceSec);
              const nextEnd = Math.max(target.start + 0.5, Math.min(maxTimelineBound, snapRes.value));
              target.duration = parseFloat((nextEnd - target.start).toFixed(2));
              setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
              setDragTooltip(`▶ Image Trim Out: ${nextEnd.toFixed(1)}s • Dur: ${target.duration.toFixed(1)}s${snapRes.snapped ? ' 🧲 Snapped' : ''}`);
            }
            return target;
          })
        );
      } else if (activeDrag.kind === 'overlay') {
        const { clipId, mode, origStart, origDuration } = activeDrag;
        if (clipId) {
          setOverlayClips((prev) =>
            prev.map((c) => {
              if (c.id !== clipId) return c;
              const target = { ...c };
              if (mode === 'move') {
                const rawStart = origStart + deltaSec;
                const snapRes = snapClipMove(rawStart, target.duration, snapPoints, snapToleranceSec);
                const nextStart = Math.max(0, Math.min(maxTimelineBound - target.duration, snapRes.newStart));
                target.start = parseFloat(nextStart.toFixed(2));
                setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
                setDragTooltip(
                  `▶ Overlay "${target.label || target.name}" • Start: ${nextStart.toFixed(1)}s • Dur: ${target.duration.toFixed(1)}s${snapRes.snapped ? ' 🧲 Snapped' : ''}`
                );
              } else if (mode === 'trim-left') {
                const rawStart = origStart + deltaSec;
                const snapRes = calculateSnap(rawStart, snapPoints, snapToleranceSec);
                const nextStart = Math.max(0, Math.min(origStart + origDuration - 0.5, snapRes.value));
                const nextDuration = origDuration - (nextStart - origStart);
                target.start = parseFloat(nextStart.toFixed(2));
                target.duration = parseFloat(Math.max(0.5, nextDuration).toFixed(2));
                setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
                setDragTooltip(`◀ Overlay Trim In: ${target.start.toFixed(1)}s • Dur: ${target.duration.toFixed(1)}s${snapRes.snapped ? ' 🧲 Snapped' : ''}`);
              } else if (mode === 'trim-right') {
                const rawEnd = origStart + origDuration + deltaSec;
                const snapRes = calculateSnap(rawEnd, snapPoints, snapToleranceSec);
                const nextEnd = Math.max(target.start + 0.5, Math.min(maxTimelineBound, snapRes.value));
                target.duration = parseFloat((nextEnd - target.start).toFixed(2));
                setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
                setDragTooltip(`▶ Overlay Trim Out: ${nextEnd.toFixed(1)}s • Dur: ${target.duration.toFixed(1)}s${snapRes.snapped ? ' 🧲 Snapped' : ''}`);
              }
              return target;
            })
          );
        } else {
          if (activeDrag.mode === 'move') {
            const rawStart = activeDrag.origStart + deltaSec;
            const snapRes = snapClipMove(rawStart, overlayDuration, snapPoints, snapToleranceSec);
            const nextStart = Math.max(0, Math.min(maxTimelineBound - overlayDuration, snapRes.newStart));
            setOverlayStart(parseFloat(nextStart.toFixed(2)));
            setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
            setDragTooltip(`▶ O1 Overlay • Start: ${nextStart.toFixed(1)}s${snapRes.snapped ? ' 🧲 Snapped' : ''}`);
          }
        }
      } else if (activeDrag.kind === 'voice') {
        const { clipId, mode, origStart, origDuration } = activeDrag;
        if (clipId) {
          setVoiceClips((prev) =>
            prev.map((c) => {
              if (c.id !== clipId) return c;
              const target = { ...c };
              if (mode === 'move') {
                const rawStart = origStart + deltaSec;
                const snapRes = snapClipMove(rawStart, target.duration, snapPoints, snapToleranceSec);
                const nextStart = Math.max(0, Math.min(maxTimelineBound - target.duration, snapRes.newStart));
                target.start = parseFloat(nextStart.toFixed(2));
                setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
                setDragTooltip(
                  `▶ Voice "${target.name}" • Start: ${nextStart.toFixed(1)}s • Dur: ${target.duration.toFixed(1)}s${snapRes.snapped ? ' 🧲 Snapped' : ''}`
                );
              } else if (mode === 'trim-left') {
                const rawStart = origStart + deltaSec;
                const snapRes = calculateSnap(rawStart, snapPoints, snapToleranceSec);
                const nextStart = Math.max(0, Math.min(origStart + origDuration - 0.5, snapRes.value));
                const nextDuration = origDuration - (nextStart - origStart);
                target.start = parseFloat(nextStart.toFixed(2));
                target.duration = parseFloat(Math.max(0.5, nextDuration).toFixed(2));
                setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
                setDragTooltip(`◀ Voice Trim In: ${target.start.toFixed(1)}s • Dur: ${target.duration.toFixed(1)}s${snapRes.snapped ? ' 🧲 Snapped' : ''}`);
              } else if (mode === 'trim-right') {
                const rawEnd = origStart + origDuration + deltaSec;
                const snapRes = calculateSnap(rawEnd, snapPoints, snapToleranceSec);
                const nextEnd = Math.max(target.start + 0.5, Math.min(maxTimelineBound, snapRes.value));
                target.duration = parseFloat((nextEnd - target.start).toFixed(2));
                setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
                setDragTooltip(`▶ Voice Trim Out: ${nextEnd.toFixed(1)}s • Dur: ${target.duration.toFixed(1)}s${snapRes.snapped ? ' 🧲 Snapped' : ''}`);
              }
              return target;
            })
          );
        } else {
          if (activeDrag.mode === 'move') {
            const rawStart = activeDrag.origStart + deltaSec;
            const snapRes = snapClipMove(rawStart, voiceDuration, snapPoints, snapToleranceSec);
            const nextStart = Math.max(0, Math.min(maxTimelineBound - 0.5, snapRes.newStart));
            setVoiceStart(parseFloat(nextStart.toFixed(2)));
            setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
            setDragTooltip(`▶ A1 Voice Delay: ${nextStart.toFixed(1)}s${snapRes.snapped ? ' 🧲 Snapped' : ''}`);
          }
        }
      } else if (activeDrag.kind === 'music') {
        const { clipId, mode, origStart, origDuration } = activeDrag;
        if (clipId) {
          setMusicClips((prev) =>
            prev.map((c) => {
              if (c.id !== clipId) return c;
              const target = { ...c };
              if (mode === 'move') {
                const rawStart = origStart + deltaSec;
                const snapRes = snapClipMove(rawStart, target.duration, snapPoints, snapToleranceSec);
                const nextStart = Math.max(0, Math.min(maxTimelineBound - target.duration, snapRes.newStart));
                target.start = parseFloat(nextStart.toFixed(2));
                setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
                setDragTooltip(
                  `▶ Music "${target.name}" • Start: ${nextStart.toFixed(1)}s • Dur: ${target.duration.toFixed(1)}s${snapRes.snapped ? ' 🧲 Snapped' : ''}`
                );
              } else if (mode === 'trim-left') {
                const rawStart = origStart + deltaSec;
                const snapRes = calculateSnap(rawStart, snapPoints, snapToleranceSec);
                const nextStart = Math.max(0, Math.min(origStart + origDuration - 0.5, snapRes.value));
                const nextDuration = origDuration - (nextStart - origStart);
                target.start = parseFloat(nextStart.toFixed(2));
                target.duration = parseFloat(Math.max(0.5, nextDuration).toFixed(2));
                setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
                setDragTooltip(`◀ Music Trim In: ${target.start.toFixed(1)}s • Dur: ${target.duration.toFixed(1)}s${snapRes.snapped ? ' 🧲 Snapped' : ''}`);
              } else if (mode === 'trim-right') {
                const rawEnd = origStart + origDuration + deltaSec;
                const snapRes = calculateSnap(rawEnd, snapPoints, snapToleranceSec);
                const nextEnd = Math.max(target.start + 0.5, Math.min(maxTimelineBound, snapRes.value));
                target.duration = parseFloat((nextEnd - target.start).toFixed(2));
                setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
                setDragTooltip(`▶ Music Trim Out: ${nextEnd.toFixed(1)}s • Dur: ${target.duration.toFixed(1)}s${snapRes.snapped ? ' 🧲 Snapped' : ''}`);
              }
              return target;
            })
          );
        } else {
          if (activeDrag.mode === 'move') {
            const rawStart = activeDrag.origStart + deltaSec;
            const snapRes = snapClipMove(rawStart, musicDuration, snapPoints, snapToleranceSec);
            const nextStart = Math.max(0, Math.min(maxTimelineBound - 0.5, snapRes.newStart));
            setMusicStart(parseFloat(nextStart.toFixed(2)));
            setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
            setDragTooltip(`▶ A2 Music Beat Alignment: ${nextStart.toFixed(1)}s${snapRes.snapped ? ' 🧲 Snapped' : ''}`);
          }
        }
      } else if (activeDrag.kind === 'sfx') {
        const { clipId, mode, origStart, origDuration } = activeDrag;
        if (clipId) {
          setSfxClips((prev) =>
            prev.map((c) => {
              if (c.id !== clipId) return c;
              const target = { ...c };
              if (mode === 'move') {
                const rawStart = origStart + deltaSec;
                const snapRes = snapClipMove(rawStart, target.duration, snapPoints, snapToleranceSec);
                const nextStart = Math.max(0, Math.min(maxTimelineBound - target.duration, snapRes.newStart));
                target.start = parseFloat(nextStart.toFixed(2));
                setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
                setDragTooltip(
                  `▶ SFX "${target.name}" • Start: ${nextStart.toFixed(1)}s • Dur: ${target.duration.toFixed(1)}s${snapRes.snapped ? ' 🧲 Snapped' : ''}`
                );
              } else if (mode === 'trim-left') {
                const rawStart = origStart + deltaSec;
                const snapRes = calculateSnap(rawStart, snapPoints, snapToleranceSec);
                const nextStart = Math.max(0, Math.min(origStart + origDuration - 0.3, snapRes.value));
                const nextDuration = origDuration - (nextStart - origStart);
                target.start = parseFloat(nextStart.toFixed(2));
                target.duration = parseFloat(Math.max(0.3, nextDuration).toFixed(2));
                setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
                setDragTooltip(`◀ SFX Trim In: ${target.start.toFixed(1)}s • Dur: ${target.duration.toFixed(1)}s${snapRes.snapped ? ' 🧲 Snapped' : ''}`);
              } else if (mode === 'trim-right') {
                const rawEnd = origStart + origDuration + deltaSec;
                const snapRes = calculateSnap(rawEnd, snapPoints, snapToleranceSec);
                const nextEnd = Math.max(target.start + 0.3, Math.min(maxTimelineBound, snapRes.value));
                target.duration = parseFloat((nextEnd - target.start).toFixed(2));
                setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
                setDragTooltip(`▶ SFX Trim Out: ${nextEnd.toFixed(1)}s • Dur: ${target.duration.toFixed(1)}s${snapRes.snapped ? ' 🧲 Snapped' : ''}`);
              }
              return target;
            })
          );
        } else {
          if (activeDrag.mode === 'move') {
            const rawStart = activeDrag.origStart + deltaSec;
            const snapRes = snapClipMove(rawStart, sfxDuration, snapPoints, snapToleranceSec);
            const nextStart = Math.max(0, Math.min(maxTimelineBound - sfxDuration, snapRes.newStart));
            setSfxStart(parseFloat(nextStart.toFixed(2)));
            setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
            setDragTooltip(`▶ SFX Delay: ${nextStart.toFixed(1)}s${snapRes.snapped ? ' 🧲 Snapped' : ''}`);
          }
        }
      } else if (activeDrag.kind === 'title') {
        const { mode, origStart, origDuration } = activeDrag;
        if (mode === 'move') {
          const rawStart = origStart + deltaSec;
          const snapRes = snapClipMove(rawStart, origDuration, snapPoints, snapToleranceSec);
          const nextStart = Math.max(0, Math.min(maxTimelineBound - origDuration, snapRes.newStart));
          setTitleStart(parseFloat(nextStart.toFixed(2)));
          setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
          setDragTooltip(
            `▶ Title • Start: ${nextStart.toFixed(1)}s • Dur: ${origDuration.toFixed(1)}s${snapRes.snapped ? ' 🧲 Snapped' : ''}`
          );
        } else if (mode === 'trim-left') {
          const rawStart = origStart + deltaSec;
          const snapRes = calculateSnap(rawStart, snapPoints, snapToleranceSec);
          const nextStart = Math.max(0, Math.min(origStart + origDuration - 0.5, snapRes.value));
          const nextDuration = origDuration - (nextStart - origStart);
          setTitleStart(parseFloat(nextStart.toFixed(2)));
          setTitleDuration(parseFloat(Math.max(0.5, nextDuration).toFixed(2)));
          setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
          setDragTooltip(`◀ Title Trim In: ${nextStart.toFixed(1)}s • Dur: ${nextDuration.toFixed(1)}s${snapRes.snapped ? ' 🧲 Snapped' : ''}`);
        } else if (mode === 'trim-right') {
          const rawEnd = origStart + origDuration + deltaSec;
          const snapRes = calculateSnap(rawEnd, snapPoints, snapToleranceSec);
          const nextEnd = Math.max(titleStart + 0.5, Math.min(maxTimelineBound, snapRes.value));
          const nextDuration = nextEnd - titleStart;
          setTitleDuration(parseFloat(Math.max(0.5, nextDuration).toFixed(2)));
          setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
          setDragTooltip(`▶ Title Trim Out: ${nextEnd.toFixed(1)}s • Dur: ${nextDuration.toFixed(1)}s${snapRes.snapped ? ' 🧲 Snapped' : ''}`);
        }
      }
    };

    const handleGlobalPointerUp = () => {
      if (isDraggingPlayhead.current) {
        isDraggingPlayhead.current = false;
      }
      if (activeDrag) {
        if (activeDrag.kind === 'subtitle' && onUpdateSubtitles) {
          onUpdateSubtitles(localClips);
        }
        if (activeDrag.kind === 'video') {
          window.dispatchEvent(
            new CustomEvent('workspace:timeline-video-clips-updated', {
              detail: { videoClips },
            })
          );
        }
        setActiveDrag(null);
        setSnapGuideTime(null);
        setDragTooltip(null);
      }
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [
    activeDrag,
    totalDuration,
    currentTime,
    videoClips,
    imageClips,
    videoStart,
    videoDuration,
    imageStart,
    imageDuration,
    overlayStart,
    overlayDuration,
    titleStart,
    titleDuration,
    voiceStart,
    voiceDuration,
    musicStart,
    musicDuration,
    sfxStart,
    sfxDuration,
    localClips,
    snapEnabled,
    onUpdateSubtitles,
  ]);

  // Split selected clip at current playhead time
  const handleSplitClip = () => {
    if (!selectedClip) return;
    if (selectedClip.track === 'caption' && typeof selectedClip.index === 'number' && !captionsTrackLocked) {
      const clip = localClips[selectedClip.index];
      if (!clip) return;
      const clipEnd = clip.start + (clip.duration || 3);
      if (currentTime > clip.start + 0.2 && currentTime < clipEnd - 0.2) {
        const leftDuration = parseFloat((currentTime - clip.start).toFixed(2));
        const rightDuration = parseFloat((clipEnd - currentTime).toFixed(2));

        const words = clip.text.split(' ');
        const midWord = Math.ceil(words.length / 2);
        const textLeft = words.slice(0, midWord).join(' ') || clip.text;
        const textRight = words.slice(midWord).join(' ') || '...';

        const updated = [...localClips];
        updated[selectedClip.index] = { ...clip, text: textLeft, duration: leftDuration };
        updated.splice(selectedClip.index + 1, 0, {
          text: textRight,
          start: parseFloat(currentTime.toFixed(2)),
          duration: rightDuration,
        });

        setLocalClips(updated);
        onUpdateSubtitles?.(updated);
        setSelectedClip({ track: 'caption', index: selectedClip.index + 1 });
      }
    } else if (selectedClip.track === 'video') {
      handleSplitVideoClip(selectedClip.clipId);
    } else if (selectedClip.track === 'image') {
      handleSplitImageClip(selectedClip.clipId);
    } else if (selectedClip.track === 'overlay') {
      handleSplitOverlayClip(selectedClip.clipId);
    } else if (selectedClip.track === 'voice') {
      handleSplitVoiceClip(selectedClip.clipId);
    } else if (selectedClip.track === 'music') {
      handleSplitMusicClip(selectedClip.clipId);
    } else if (selectedClip.track === 'sfx') {
      handleSplitSfxClip(selectedClip.clipId);
    }
  };

  // Duplicate selected clip
  const handleDuplicateClip = () => {
    if (!selectedClip) return;
    if (selectedClip.track === 'caption' && typeof selectedClip.index === 'number') {
      if (captionsTrackLocked) return;
      const clip = localClips[selectedClip.index];
      if (!clip) return;
      const newStart = parseFloat((clip.start + (clip.duration || 3) + 0.1).toFixed(2));
      const duplicated: ScriptSubtitle = {
        text: `${clip.text} (Copy)`,
        start: newStart,
        duration: clip.duration || 3,
      };
      const updated = [...localClips, duplicated].sort((a, b) => a.start - b.start);
      setLocalClips(updated);
      onUpdateSubtitles?.(updated);
      setSelectedClip({ track: 'caption', index: updated.indexOf(duplicated) });
    } else if (selectedClip.track === 'video') {
      handleDuplicateVideoClip(selectedClip.clipId);
    } else if (selectedClip.track === 'image') {
      handleDuplicateImageClip(selectedClip.clipId);
    } else if (selectedClip.track === 'overlay') {
      handleDuplicateOverlayClip(selectedClip.clipId);
    } else if (selectedClip.track === 'voice') {
      handleDuplicateVoiceClip(selectedClip.clipId);
    } else if (selectedClip.track === 'music') {
      handleDuplicateMusicClip(selectedClip.clipId);
    } else if (selectedClip.track === 'sfx') {
      handleDuplicateSfxClip(selectedClip.clipId);
    }
  };

  // Add new caption at playhead
  const handleAddCaption = () => {
    if (captionsTrackLocked) return;
    const newStart = parseFloat(currentTime.toFixed(2));
    const newClip: ScriptSubtitle = {
      text: 'New Caption Cue',
      start: newStart,
      duration: 2.5,
    };
    const updated = [...localClips, newClip].sort((a, b) => a.start - b.start);
    setLocalClips(updated);
    onUpdateSubtitles?.(updated);
    setSelectedClip({ track: 'caption', index: updated.indexOf(newClip) });
  };

  // Delete selected clip (all tracks supported)
  const handleDeleteClip = () => {
    if (!selectedClip) return;
    if (selectedClip.track === 'caption') {
      if (captionsTrackLocked) return;
      const updated = localClips.filter((_, idx) => idx !== selectedClip.index);
      setLocalClips(updated);
      onUpdateSubtitles?.(updated);
      setSelectedClip(null);
      setEditingClipIndex(null);
    } else if (selectedClip.track === 'video') {
      handleDeleteVideoClip(selectedClip.clipId);
    } else if (selectedClip.track === 'image') {
      handleDeleteImageClip(selectedClip.clipId);
    } else if (selectedClip.track === 'overlay') {
      handleDeleteOverlayClip(selectedClip.clipId);
    } else if (selectedClip.track === 'voice') {
      handleDeleteVoiceClip(selectedClip.clipId);
    } else if (selectedClip.track === 'music') {
      handleDeleteMusicClip(selectedClip.clipId);
    } else if (selectedClip.track === 'title') {
      handleTitleDelete();
    } else if (selectedClip.track === 'sfx') {
      handleDeleteSfxClip(selectedClip.clipId);
    }
  };

  // ── Sync Audio & CC (Closed Captions) ──────────────────────────────────
  // Proportional word-based duration distribution matching voiceover length
  const handleSyncAudioAndCC = useCallback(() => {
    const targetVoiceDuration =
      voiceClips.length > 0 && voiceClips[0].duration > 0
        ? voiceClips[0].duration
        : duration > 0
        ? duration
        : 0;

    if (targetVoiceDuration <= 0) {
      toast.info('No voiceover audio detected to sync with.');
      return;
    }

    const voiceStart = voiceClips[0]?.start ?? 0;

    let sourceCaptions = [...localClips];
    if (sourceCaptions.length === 0 && script.storyboard && script.storyboard.length > 0) {
      sourceCaptions = script.storyboard
        .filter((sc) => sc.subtitleText)
        .map((sc) => ({
          text: sc.subtitleText || '',
          start: sc.start,
          duration: sc.duration,
          captionPresetClass: sc.captionPresetClass,
          captionPresetColor: sc.captionPresetColor,
        }));
    }

    if (sourceCaptions.length === 0) {
      toast.info('No caption cues available to sync.');
      return;
    }

    const wordCounts = sourceCaptions.map((clip) => {
      const words = (clip.text || '').trim().split(/\s+/).filter(Boolean);
      return Math.max(1, words.length);
    });
    const totalWords = wordCounts.reduce((sum, w) => sum + w, 0);

    let curStart = voiceStart;
    const syncedCaptions: ScriptSubtitle[] = sourceCaptions.map((clip, i) => {
      const isLast = i === sourceCaptions.length - 1;
      let clipDur: number;

      if (!isLast) {
        clipDur = Math.max(0.4, parseFloat(((wordCounts[i] / totalWords) * targetVoiceDuration).toFixed(2)));
      } else {
        clipDur = Math.max(0.4, parseFloat(((voiceStart + targetVoiceDuration) - curStart).toFixed(2)));
      }

      const clipStart = parseFloat(curStart.toFixed(2));
      curStart = parseFloat((curStart + clipDur).toFixed(2));

      let scaledWords = clip.words;
      if (clip.words && clip.words.length > 0) {
        const origStart = clip.start || 0;
        const origDur = Math.max(0.1, clip.duration || 1);
        scaledWords = clip.words.map((w) => {
          const relStart = Math.max(0, Math.min(1, ((w.start || 0) - origStart) / origDur));
          const relEnd = Math.max(relStart + 0.05, Math.min(1, ((w.end || 0) - origStart) / origDur));
          return {
            ...w,
            start: parseFloat((clipStart + relStart * clipDur).toFixed(2)),
            end: parseFloat((clipStart + relEnd * clipDur).toFixed(2)),
          };
        });
      }

      return {
        ...clip,
        start: clipStart,
        duration: clipDur,
        words: scaledWords,
      };
    });

    setLocalClips(syncedCaptions);
    onUpdateSubtitles?.(syncedCaptions);

    if (videoClips.length > 0) {
      // Enforce cinematic pacing: Each video clip must sustain for at least 3.2s
      // Never collapse video clips into 0.4s micro-cuts matching single caption words
      const MIN_CLIP_DURATION = 3.2;
      const availableDuration = targetVoiceDuration;
      const maxClipsAllowed = Math.max(1, Math.floor(availableDuration / MIN_CLIP_DURATION));

      let effectiveClips = videoClips;
      if (videoClips.length > maxClipsAllowed) {
        const step = videoClips.length / maxClipsAllowed;
        effectiveClips = Array.from({ length: maxClipsAllowed }, (_, idx) => {
          const pickIndex = Math.min(videoClips.length - 1, Math.floor(idx * step));
          return videoClips[pickIndex];
        });
      }

      const totalClips = effectiveClips.length;
      let curVStart = voiceStart;
      const oldTotalVideoDur = effectiveClips.reduce((sum, c) => sum + (c.duration || 3.5), 0);

      setVideoClips(
        effectiveClips.map((vClip, idx) => {
          const isLast = idx === totalClips - 1;
          const proportionalDur = ((vClip.duration || 3.5) / oldTotalVideoDur) * availableDuration;
          const dur = isLast
            ? Math.max(MIN_CLIP_DURATION, parseFloat(((voiceStart + targetVoiceDuration) - curVStart).toFixed(2)))
            : Math.max(MIN_CLIP_DURATION, parseFloat(proportionalDur.toFixed(2)));
          const vStart = parseFloat(curVStart.toFixed(2));
          curVStart = parseFloat((curVStart + dur).toFixed(2));
          return {
            ...vClip,
            start: vStart,
            duration: dur,
          };
        })
      );
    }

    setVoiceClips((prev) => {
      if (prev.length > 0) {
        return prev.map((c, i) => (i === 0 ? { ...c, duration: targetVoiceDuration } : c));
      }
      return [
        {
          id: `vox-${Date.now()}`,
          type: 'voice',
          url: audioUrl || '',
          name: selectedVoice ? `Voice: ${selectedVoice}` : 'Voiceover',
          start: voiceStart,
          duration: targetVoiceDuration,
        },
      ];
    });

    const totalEnd = parseFloat((voiceStart + targetVoiceDuration).toFixed(2));
    onTimelineDurationChange?.(totalEnd);

    window.dispatchEvent(
      new CustomEvent('workspace:timeline-state', {
        detail: {
          captionClips: syncedCaptions,
          totalDuration: totalEnd,
        },
      })
    );

    toast.success(
      `Audio & CC Synchronized (${targetVoiceDuration.toFixed(1)}s)`,
      {
        description: `Aligned ${syncedCaptions.length} captions and video cuts to match voice track.`,
      }
    );
  }, [
    voiceClips,
    duration,
    localClips,
    script.storyboard,
    onUpdateSubtitles,
    videoClips,
    audioUrl,
    selectedVoice,
    onTimelineDurationChange,
  ]);

  const effectiveVoiceDur = voiceClips[0]?.duration > 0 ? voiceClips[0].duration : (duration > 0 ? duration : 0);
  const maxCaptionsEnd = localClips.reduce((end, clip) => Math.max(end, (Number(clip.start) || 0) + (Number(clip.duration) || 0)), 0);
  const hasAudioMismatch = Boolean(
    effectiveVoiceDur > 0 &&
    maxCaptionsEnd > 0 &&
    Math.abs(maxCaptionsEnd - effectiveVoiceDur) > 0.6
  );

  const lastSyncedVoiceDurRef = useRef<number>(0);

  // Auto-sync Audio & Captions once when voice duration is established or updated
  useEffect(() => {
    if (effectiveVoiceDur > 0 && localClips.length > 0) {
      const mismatch = Math.abs(maxCaptionsEnd - effectiveVoiceDur);
      if (mismatch > 0.3 && lastSyncedVoiceDurRef.current !== effectiveVoiceDur) {
        lastSyncedVoiceDurRef.current = effectiveVoiceDur;
        handleSyncAudioAndCC();
      }
    }
  }, [effectiveVoiceDur, localClips.length, maxCaptionsEnd, handleSyncAudioAndCC]);

  // ── Context menu & clip manipulation handlers for Video & Image tracks ──

  // Video track
  const handleDeleteVideoClip = (clipId?: string) => {
    if (videoClips.length > 0) {
      setVideoClips((prev) => {
        const targetId = clipId || prev[0]?.id;
        const remaining = prev.filter((c) => c.id !== targetId);
        if (remaining.length === 0) {
          setEnabledTracks((p) => ({ ...p, video: false }));
          onRemoveVideo?.();
          window.dispatchEvent(new CustomEvent('workspace:video-clips-cleared'));
        }
        return remaining;
      });
    } else {
      setEnabledTracks((p) => ({ ...p, video: false }));
      onRemoveVideo?.();
      window.dispatchEvent(new CustomEvent('workspace:video-clips-cleared'));
    }
    setSelectedClip(null);
  };

  const handleDuplicateVideoClip = (clipId?: string) => {
    if (videoClips.length > 0) {
      setVideoClips((prev) => {
        const target = clipId ? prev.find((c) => c.id === clipId) : prev[0];
        if (!target) return prev;
        const newClip: TimelineMediaClip = {
          ...target,
          id: `vid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: `${target.name} (Copy)`,
          start: parseFloat((target.start + target.duration + 0.1).toFixed(2)),
        };
        return [...prev, newClip];
      });
    } else {
      setVideoStart((s) => Math.min(totalDuration - videoDuration, s + 0.5));
    }
  };

  const handleSplitVideoClip = (clipId?: string) => {
    if (videoClips.length > 0) {
      setVideoClips((prev) => {
        const target = clipId
          ? prev.find((c) => c.id === clipId)
          : (prev.find((c) => currentTime > c.start + 0.3 && currentTime < c.start + c.duration - 0.3) || prev[0]);
        if (!target) return prev;
        const clipEnd = target.start + target.duration;
        if (currentTime > target.start + 0.3 && currentTime < clipEnd - 0.3) {
          const leftDuration = parseFloat((currentTime - target.start).toFixed(2));
          const rightDuration = parseFloat((clipEnd - currentTime).toFixed(2));
          const updatedLeft = { ...target, duration: leftDuration };
          const splitRight: TimelineMediaClip = {
            ...target,
            id: `vid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: `${target.name} (Part 2)`,
            start: parseFloat(currentTime.toFixed(2)),
            duration: rightDuration,
          };
          return prev.flatMap((c) => (c.id === target.id ? [updatedLeft, splitRight] : [c]));
        }
        return prev;
      });
    } else {
      if (currentTime > videoStart + 0.5 && currentTime < videoStart + videoDuration - 0.5) {
        setVideoDuration(parseFloat((currentTime - videoStart).toFixed(2)));
      }
    }
  };

  const handleVideoZoom = () => {
    const ratio = (videoDuration / totalDuration) * 3;
    setZoomLevel(Math.min(MAX_TIMELINE_ZOOM, Math.max(MIN_TIMELINE_ZOOM, 1 / ratio)));
  };

  // Overlay track
  const handleDeleteOverlayClip = (clipId?: string) => {
    if (overlayClips.length > 0) {
      setOverlayClips((prev) => {
        const targetId = clipId || prev[0]?.id;
        const remaining = prev.filter((c) => c.id !== targetId);
        if (remaining.length === 0) {
          setEnabledTracks((p) => ({ ...p, overlay: false }));
        }
        return remaining;
      });
    } else {
      setEnabledTracks((p) => ({ ...p, overlay: false }));
    }
    setSelectedClip(null);
  };

  const handleDuplicateOverlayClip = (clipId?: string) => {
    if (overlayClips.length > 0) {
      setOverlayClips((prev) => {
        const target = clipId ? prev.find((c) => c.id === clipId) : prev[0];
        if (!target) return prev;
        const newClip: TimelineOverlayClip = {
          ...target,
          id: `ovl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: `${target.name || target.label} (Copy)`,
          start: parseFloat((target.start + target.duration + 0.1).toFixed(2)),
        };
        return [...prev, newClip];
      });
    } else {
      setOverlayStart((s) => Math.min(totalDuration - overlayDuration, s + 0.5));
    }
  };

  const handleSplitOverlayClip = (clipId?: string) => {
    if (overlayClips.length > 0) {
      setOverlayClips((prev) => {
        const target = clipId
          ? prev.find((c) => c.id === clipId)
          : (prev.find((c) => currentTime > c.start + 0.3 && currentTime < c.start + c.duration - 0.3) || prev[0]);
        if (!target) return prev;
        const clipEnd = target.start + target.duration;
        if (currentTime > target.start + 0.3 && currentTime < clipEnd - 0.3) {
          const leftDuration = parseFloat((currentTime - target.start).toFixed(2));
          const rightDuration = parseFloat((clipEnd - currentTime).toFixed(2));
          const updatedLeft = { ...target, duration: leftDuration };
          const splitRight: TimelineOverlayClip = {
            ...target,
            id: `ovl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: `${target.name || target.label} (Part 2)`,
            start: parseFloat(currentTime.toFixed(2)),
            duration: rightDuration,
          };
          return prev.flatMap((c) => (c.id === target.id ? [updatedLeft, splitRight] : [c]));
        }
        return prev;
      });
    } else {
      if (currentTime > overlayStart + 0.5 && currentTime < overlayStart + overlayDuration - 0.5) {
        setOverlayDuration(parseFloat((currentTime - overlayStart).toFixed(2)));
      }
    }
  };

  const handleOverlayZoom = () => {
    const ratio = (overlayDuration / totalDuration) * 3;
    setZoomLevel(Math.min(MAX_TIMELINE_ZOOM, Math.max(MIN_TIMELINE_ZOOM, 1 / ratio)));
  };

  // Voice track
  const handleDeleteVoiceClip = (clipId?: string) => {
    if (voiceClips.length > 0) {
      setVoiceClips((prev) => {
        const targetId = clipId || prev[0]?.id;
        const remaining = prev.filter((c) => c.id !== targetId);
        if (remaining.length === 0) {
          setEnabledTracks((p) => ({ ...p, voice: false }));
        }
        return remaining;
      });
    } else {
      setEnabledTracks((p) => ({ ...p, voice: false }));
    }
    setSelectedClip(null);
  };

  const handleDuplicateVoiceClip = (clipId?: string) => {
    if (voiceClips.length > 0) {
      setVoiceClips((prev) => {
        const target = clipId ? prev.find((c) => c.id === clipId) : prev[0];
        if (!target) return prev;
        const newClip: TimelineAudioClip = {
          ...target,
          id: `vox-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: `${target.name} (Copy)`,
          start: parseFloat((target.start + target.duration + 0.1).toFixed(2)),
        };
        return [...prev, newClip];
      });
    } else {
      setVoiceStart((s) => Math.min(totalDuration - voiceDuration, s + 0.5));
    }
  };

  const handleSplitVoiceClip = (clipId?: string) => {
    if (voiceClips.length > 0) {
      setVoiceClips((prev) => {
        const target = clipId
          ? prev.find((c) => c.id === clipId)
          : (prev.find((c) => currentTime > c.start + 0.3 && currentTime < c.start + c.duration - 0.3) || prev[0]);
        if (!target) return prev;
        const clipEnd = target.start + target.duration;
        if (currentTime > target.start + 0.3 && currentTime < clipEnd - 0.3) {
          const leftDuration = parseFloat((currentTime - target.start).toFixed(2));
          const rightDuration = parseFloat((clipEnd - currentTime).toFixed(2));
          const updatedLeft = { ...target, duration: leftDuration };
          const splitRight: TimelineAudioClip = {
            ...target,
            id: `vox-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: `${target.name} (Part 2)`,
            start: parseFloat(currentTime.toFixed(2)),
            duration: rightDuration,
          };
          return prev.flatMap((c) => (c.id === target.id ? [updatedLeft, splitRight] : [c]));
        }
        return prev;
      });
    } else {
      if (currentTime > voiceStart + 0.5 && currentTime < voiceStart + voiceDuration - 0.5) {
        setVoiceDuration(parseFloat((currentTime - voiceStart).toFixed(2)));
      }
    }
  };

  const handleVoiceZoom = () => {
    const ratio = (voiceDuration / totalDuration) * 3;
    setZoomLevel(Math.min(MAX_TIMELINE_ZOOM, Math.max(MIN_TIMELINE_ZOOM, 1 / ratio)));
  };

  // Music track
  const handleDeleteMusicClip = (clipId?: string) => {
    if (musicClips.length > 0) {
      setMusicClips((prev) => {
        const targetId = clipId || prev[0]?.id;
        const remaining = prev.filter((c) => c.id !== targetId);
        if (remaining.length === 0) {
          setEnabledTracks((p) => ({ ...p, music: false }));
        }
        return remaining;
      });
    } else {
      setEnabledTracks((p) => ({ ...p, music: false }));
    }
    setSelectedClip(null);
  };

  const handleDuplicateMusicClip = (clipId?: string) => {
    if (musicClips.length > 0) {
      setMusicClips((prev) => {
        const target = clipId ? prev.find((c) => c.id === clipId) : prev[0];
        if (!target) return prev;
        const newClip: TimelineAudioClip = {
          ...target,
          id: `mus-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: `${target.name} (Copy)`,
          start: parseFloat((target.start + target.duration + 0.1).toFixed(2)),
        };
        return [...prev, newClip];
      });
    } else {
      setMusicStart((s) => Math.min(totalDuration - musicDuration, s + 0.5));
    }
  };

  const handleSplitMusicClip = (clipId?: string) => {
    if (musicClips.length > 0) {
      setMusicClips((prev) => {
        const target = clipId
          ? prev.find((c) => c.id === clipId)
          : (prev.find((c) => currentTime > c.start + 0.3 && currentTime < c.start + c.duration - 0.3) || prev[0]);
        if (!target) return prev;
        const clipEnd = target.start + target.duration;
        if (currentTime > target.start + 0.3 && currentTime < clipEnd - 0.3) {
          const leftDuration = parseFloat((currentTime - target.start).toFixed(2));
          const rightDuration = parseFloat((clipEnd - currentTime).toFixed(2));
          const updatedLeft = { ...target, duration: leftDuration };
          const splitRight: TimelineAudioClip = {
            ...target,
            id: `mus-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: `${target.name} (Part 2)`,
            start: parseFloat(currentTime.toFixed(2)),
            duration: rightDuration,
          };
          return prev.flatMap((c) => (c.id === target.id ? [updatedLeft, splitRight] : [c]));
        }
        return prev;
      });
    } else {
      if (currentTime > musicStart + 0.5 && currentTime < musicStart + musicDuration - 0.5) {
        setMusicDuration(parseFloat((currentTime - musicStart).toFixed(2)));
      }
    }
  };

  const handleMusicZoom = () => {
    const ratio = (musicDuration / totalDuration) * 3;
    setZoomLevel(Math.min(MAX_TIMELINE_ZOOM, Math.max(MIN_TIMELINE_ZOOM, 1 / ratio)));
  };

  // SFX track
  const handleDeleteSfxClip = (clipId?: string) => {
    if (sfxClips.length > 0) {
      setSfxClips((prev) => {
        const targetId = clipId || prev[0]?.id;
        const remaining = prev.filter((c) => c.id !== targetId);
        if (remaining.length === 0) {
          setEnabledTracks((p) => ({ ...p, sfx: false }));
          setSfxDuration(0);
          onRemoveSfx?.();
        }
        return remaining;
      });
    } else {
      setEnabledTracks((p) => ({ ...p, sfx: false }));
      setSfxDuration(0);
      onRemoveSfx?.();
    }
    setSelectedClip(null);
  };

  const handleDuplicateSfxClip = (clipId?: string) => {
    if (sfxClips.length > 0) {
      setSfxClips((prev) => {
        const target = clipId ? prev.find((c) => c.id === clipId) : prev[0];
        if (!target) return prev;
        const newClip: TimelineAudioClip = {
          ...target,
          id: `sfx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: `${target.name} (Copy)`,
          start: parseFloat((target.start + target.duration + 0.1).toFixed(2)),
        };
        return [...prev, newClip];
      });
    } else {
      setSfxStart((s) => Math.min(totalDuration - sfxDuration, s + 0.5));
    }
  };

  const handleSplitSfxClip = (clipId?: string) => {
    if (sfxClips.length > 0) {
      setSfxClips((prev) => {
        const target = clipId
          ? prev.find((c) => c.id === clipId)
          : (prev.find((c) => currentTime > c.start + 0.2 && currentTime < c.start + c.duration - 0.2) || prev[0]);
        if (!target) return prev;
        const clipEnd = target.start + target.duration;
        if (currentTime > target.start + 0.2 && currentTime < clipEnd - 0.2) {
          const leftDuration = parseFloat((currentTime - target.start).toFixed(2));
          const rightDuration = parseFloat((clipEnd - currentTime).toFixed(2));
          const updatedLeft = { ...target, duration: leftDuration };
          const splitRight: TimelineAudioClip = {
            ...target,
            id: `sfx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: `${target.name} (Part 2)`,
            start: parseFloat(currentTime.toFixed(2)),
            duration: rightDuration,
          };
          return prev.flatMap((c) => (c.id === target.id ? [updatedLeft, splitRight] : [c]));
        }
        return prev;
      });
    }
  };

  // Image track
  const handleDeleteImageClip = (clipId?: string) => {
    if (imageClips.length > 0) {
      setImageClips((prev) => {
        const targetId = clipId || prev[0]?.id;
        const remaining = prev.filter((c) => c.id !== targetId);
        if (remaining.length === 0) {
          setEnabledTracks((p) => ({ ...p, image: false }));
          onRemoveImage?.();
          window.dispatchEvent(new CustomEvent('workspace:image-clips-cleared'));
        }
        return remaining;
      });
    } else {
      setEnabledTracks((p) => ({ ...p, image: false }));
      onRemoveImage?.();
      window.dispatchEvent(new CustomEvent('workspace:image-clips-cleared'));
    }
    setSelectedClip(null);
  };

  const handleDuplicateImageClip = (clipId?: string) => {
    if (imageClips.length > 0) {
      setImageClips((prev) => {
        const target = clipId ? prev.find((c) => c.id === clipId) : prev[0];
        if (!target) return prev;
        const newClip: TimelineMediaClip = {
          ...target,
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: `${target.name} (Copy)`,
          start: parseFloat((target.start + target.duration + 0.1).toFixed(2)),
        };
        return [...prev, newClip];
      });
    } else {
      setImageStart((s) => Math.min(totalDuration - imageDuration, s + 0.5));
    }
  };

  const handleSplitImageClip = (clipId?: string) => {
    if (imageClips.length > 0) {
      setImageClips((prev) => {
        const target = clipId
          ? prev.find((c) => c.id === clipId)
          : (prev.find((c) => currentTime > c.start + 0.3 && currentTime < c.start + c.duration - 0.3) || prev[0]);
        if (!target) return prev;
        const clipEnd = target.start + target.duration;
        if (currentTime > target.start + 0.3 && currentTime < clipEnd - 0.3) {
          const leftDuration = parseFloat((currentTime - target.start).toFixed(2));
          const rightDuration = parseFloat((clipEnd - currentTime).toFixed(2));
          const updatedLeft = { ...target, duration: leftDuration };
          const splitRight: TimelineMediaClip = {
            ...target,
            id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: `${target.name} (Part 2)`,
            start: parseFloat(currentTime.toFixed(2)),
            duration: rightDuration,
          };
          return prev.flatMap((c) => (c.id === target.id ? [updatedLeft, splitRight] : [c]));
        }
        return prev;
      });
    } else {
      if (currentTime > imageStart + 0.5 && currentTime < imageStart + imageDuration - 0.5) {
        setImageDuration(parseFloat((currentTime - imageStart).toFixed(2)));
      }
    }
  };

  const handleImageZoom = () => {
    const ratio = (imageDuration / totalDuration) * 3;
    setZoomLevel(Math.min(MAX_TIMELINE_ZOOM, Math.max(MIN_TIMELINE_ZOOM, 1 / ratio)));
  };

  // Global Timeline Event Listeners for Context Menu Actions & Hotkeys
  useEffect(() => {
    const handleSplitClipEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ track?: string; clipId?: string }>).detail;
      if (!detail) return;
      if (detail.track === 'video') handleSplitVideoClip(detail.clipId);
      else if (detail.track === 'image') handleSplitImageClip(detail.clipId);
      else if (detail.track === 'overlay') handleSplitOverlayClip(detail.clipId);
      else if (detail.track === 'voice') handleSplitVoiceClip(detail.clipId);
      else if (detail.track === 'music') handleSplitMusicClip(detail.clipId);
      else if (detail.track === 'sfx') handleSplitSfxClip(detail.clipId);
      else handleSplitClip();
    };

    const handleDuplicateClipEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ track?: string; clipId?: string }>).detail;
      if (!detail) return;
      if (detail.track === 'video') handleDuplicateVideoClip(detail.clipId);
      else if (detail.track === 'image') handleDuplicateImageClip(detail.clipId);
      else if (detail.track === 'overlay') handleDuplicateOverlayClip(detail.clipId);
      else if (detail.track === 'voice') handleDuplicateVoiceClip(detail.clipId);
      else if (detail.track === 'music') handleDuplicateMusicClip(detail.clipId);
      else if (detail.track === 'sfx') handleDuplicateSfxClip(detail.clipId);
      else handleDuplicateClip();
    };

    const handleDeleteClipEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ track?: string; clipId?: string }>).detail;
      if (!detail) return;
      if (detail.track === 'video') handleDeleteVideoClip(detail.clipId);
      else if (detail.track === 'image') handleDeleteImageClip(detail.clipId);
      else if (detail.track === 'overlay') handleDeleteOverlayClip(detail.clipId);
      else if (detail.track === 'voice') handleDeleteVoiceClip(detail.clipId);
      else if (detail.track === 'music') handleDeleteMusicClip(detail.clipId);
      else if (detail.track === 'sfx') handleDeleteSfxClip(detail.clipId);
      else if (detail.track === 'caption' && detail.clipId) handleDeleteCaptionByIndex(Number(detail.clipId));
      else handleDeleteClip();
    };

    const handleArrangeClipEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ track?: string; clipId?: string; direction?: 'up' | 'down' | 'front' | 'back' }>).detail;
      if (!detail || !detail.clipId) return;
      const { track, clipId, direction } = detail;
      const rearrange = (list: any[]) => {
        const idx = list.findIndex((c) => c.id === clipId);
        if (idx < 0) return list;
        const next = [...list];
        const item = next.splice(idx, 1)[0];
        if (direction === 'front' || direction === 'up') {
          next.push(item);
        } else {
          next.unshift(item);
        }
        return next;
      };
      if (track === 'video') setVideoClips((prev) => rearrange(prev));
      else if (track === 'image') setImageClips((prev) => rearrange(prev));
      else if (track === 'overlay') setOverlayClips((prev) => rearrange(prev));
    };

    const handleZoomToClipEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ startTime?: number; duration?: number }>).detail;
      if (detail && detail.startTime !== undefined) {
        onSeek(detail.startTime);
        setZoomLevel(1.5);
      }
    };

    const handleToggleTrackVisibility = (e: Event) => {
      const detail = (e as CustomEvent<{ track?: string }>).detail;
      if (!detail || !detail.track) return;
      if (detail.track === 'video') setVideoTrackVisible((v) => !v);
      else if (detail.track === 'image') setImageTrackVisible((v) => !v);
      else if (detail.track === 'overlay') setOverlayTrackVisible((v) => !v);
      else if (detail.track === 'voice') setVoiceTrackMuted((m) => !m);
      else if (detail.track === 'music') setMusicTrackMuted((m) => !m);
      else if (detail.track === 'sfx') setSfxTrackMuted((m) => !m);
    };

    window.addEventListener('workspace:split-clip', handleSplitClipEvent);
    window.addEventListener('workspace:duplicate-clip', handleDuplicateClipEvent);
    window.addEventListener('workspace:delete-clip', handleDeleteClipEvent);
    window.addEventListener('workspace:arrange-clip', handleArrangeClipEvent);
    window.addEventListener('workspace:zoom-to-clip', handleZoomToClipEvent);
    const handleAiCutSync = () => {
      const bpm = script?.soundDesign?.bpm || 140;
      const targetDuration = (voiceClips && voiceClips[0]?.duration) || duration || totalDuration;
      const sfxDrops = (script?.soundDesign?.sfxEvents || [])
        .map((e: any) => e.time)
        .filter((t: any) => typeof t === 'number' && t > 0);

      // Apply to video clips
      setVideoClips((prev) => {
        if (!prev || prev.length <= 1) return prev;
        const aligned = alignAudioVisualCuts({
          storyboard: prev.map((c, i) => ({
            sceneNumber: i + 1,
            subtitleText: script?.storyboard?.[i]?.subtitleText || c.name,
            beat: script?.storyboard?.[i]?.beat || 'scene',
            mediaName: c.name,
          })),
          totalDuration: targetDuration,
          bpm,
          sfxDrops,
        });
        return prev.map((c, i) => {
          const match = aligned[i];
          return match ? { ...c, start: match.start, duration: match.duration } : c;
        });
      });

      // Apply to image clips
      setImageClips((prev) => {
        if (!prev || prev.length <= 1) return prev;
        const aligned = alignAudioVisualCuts({
          storyboard: prev.map((c, i) => ({
            sceneNumber: i + 1,
            subtitleText: script?.storyboard?.[i]?.subtitleText || c.name,
            beat: script?.storyboard?.[i]?.beat || 'scene',
            mediaName: c.name,
          })),
          totalDuration: targetDuration,
          bpm,
          sfxDrops,
        });
        return prev.map((c, i) => {
          const match = aligned[i];
          return match ? { ...c, start: match.start, duration: match.duration } : c;
        });
      });

      toast.success(`🎬 AI Cut Sync: Video cuts aligned to voice pauses & ${bpm} BPM music beat`);
    };

    const handlePlaybackRateChange = (e: Event) => {
      const detail = (e as CustomEvent<{ speed?: number; clipId?: string }>).detail;
      if (!detail || typeof detail.speed !== 'number') return;
      const speed = detail.speed;
      const targetClipId = detail.clipId || (selectedClip && 'clipId' in selectedClip ? selectedClip.clipId : undefined);
      setVideoClips((prev) =>
        prev.map((c) => {
          if (targetClipId && c.id !== targetClipId) return c;
          const oldSpeed = c.speed || 1.0;
          const scale = oldSpeed / speed;
          const newDur = Math.max(0.4, parseFloat((c.duration * scale).toFixed(2)));
          return { ...c, speed, duration: newDur };
        })
      );
    };

    const handleFreezeFrame = (e: Event) => {
      const detail = (e as CustomEvent<{ clipId?: string; startTime?: number }>).detail;
      const targetTime = currentTime;
      setVideoClips((prev) => {
        const target = prev.find((c) =>
          detail?.clipId ? c.id === detail.clipId : targetTime >= c.start && targetTime <= c.start + c.duration
        );
        if (!target) return prev;
        const freezeDur = 2.0;
        const splitPoint = Math.max(0.2, targetTime - target.start);
        const firstPart = { ...target, duration: splitPoint };
        const freezeClip = {
          ...target,
          id: `freeze-${Date.now()}`,
          name: `${target.name} [Freeze]`,
          start: target.start + splitPoint,
          duration: freezeDur,
          speed: 0,
        };
        const secondPartDur = Math.max(0.2, target.duration - splitPoint);
        const secondPart = {
          ...target,
          id: `split-${Date.now()}`,
          start: target.start + splitPoint + freezeDur,
          duration: secondPartDur,
        };
        const idx = prev.findIndex((c) => c.id === target.id);
        const updated = [...prev];
        updated.splice(idx, 1, firstPart, freezeClip, secondPart);
        return updated;
      });
      toast.success('❄️ Freeze Frame inserted at playhead (2.0s)');
    };

    const handleDetachAudio = (e: Event) => {
      const detail = (e as CustomEvent<{ clipId?: string; startTime?: number; duration?: number }>).detail;
      const target = videoClips.find((c) => c.id === detail?.clipId) || videoClips[0];
      if (!target) return;
      const audioUrlToDetach = target.url || audioUrl;
      if (audioUrlToDetach) {
        setVoiceClips((prev) => [
          ...prev,
          {
            id: `detached-${Date.now()}`,
            name: `${target.name} (Detached Audio)`,
            start: target.start,
            duration: target.duration,
            url: audioUrlToDetach,
            type: 'voice',
          },
        ]);
        setEnabledTracks((prev) => ({ ...prev, voice: true }));
        setVoiceTrackMuted(false);
        toast.success('🔊 Audio detached to voice track');
      }
    };

    const handleAiEnhance = (e: Event) => {
      const detail = (e as CustomEvent<{ track?: string; clipId?: string }>).detail;
      setVideoClips((prev) =>
        prev.map((c) => {
          if (detail?.clipId && c.id !== detail.clipId) return c;
          return {
            ...c,
            aestheticScore: 98,
            aestheticBadges: ['4K AI Enhanced', 'Cinematic Grade'],
            filterSettings: {
              ...(c.filterSettings || {}),
              sharpness: 25,
              contrast: 15,
              vibrance: 12,
            },
          };
        })
      );
      toast.success('✨ 4K AI Upscaling & Clarity Grade Applied');
    };

    window.addEventListener('workspace:ai-cut-sync', handleAiCutSync);
    window.addEventListener('workspace:playback-rate-change', handlePlaybackRateChange);
    window.addEventListener('workspace:freeze-frame', handleFreezeFrame);
    window.addEventListener('workspace:detach-audio', handleDetachAudio);
    window.addEventListener('workspace:ai-enhance', handleAiEnhance);
    window.addEventListener('workspace:toggle-track-visibility', handleToggleTrackVisibility);

    return () => {
      window.removeEventListener('workspace:split-clip', handleSplitClipEvent);
      window.removeEventListener('workspace:duplicate-clip', handleDuplicateClipEvent);
      window.removeEventListener('workspace:delete-clip', handleDeleteClipEvent);
      window.removeEventListener('workspace:arrange-clip', handleArrangeClipEvent);
      window.removeEventListener('workspace:zoom-to-clip', handleZoomToClipEvent);
      window.removeEventListener('workspace:ai-cut-sync', handleAiCutSync);
      window.removeEventListener('workspace:playback-rate-change', handlePlaybackRateChange);
      window.removeEventListener('workspace:freeze-frame', handleFreezeFrame);
      window.removeEventListener('workspace:detach-audio', handleDetachAudio);
      window.removeEventListener('workspace:ai-enhance', handleAiEnhance);
      window.removeEventListener('workspace:toggle-track-visibility', handleToggleTrackVisibility);
    };
  }, []);

  // Title track
  const [titleContextMenu, setTitleContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [titleColorLabel, setTitleColorLabel] = useState<string>('');
  const handleTitleDelete = () => {
    setEnabledTracks((p) => ({ ...p, title: false }));
    setSelectedClip(null);
  };
  const handleTitleZoom = () => {
    const ratio = (titleDuration / totalDuration) * 3;
    setZoomLevel(Math.min(3, Math.max(1, 1 / ratio)));
  };

  // Caption context menu actions (index-aware wrappers)
  const handleDeleteCaptionByIndex = (index: number) => {
    if (captionsTrackLocked) return;
    const updated = localClips.filter((_, idx) => idx !== index);
    setLocalClips(updated);
    onUpdateSubtitles?.(updated);
    setSelectedClip(null);
    setEditingClipIndex(null);
  };
  const handleDuplicateCaptionByIndex = (index: number) => {
    if (captionsTrackLocked) return;
    const clip = localClips[index];
    if (!clip) return;
    const newStart = parseFloat((clip.start + (clip.duration || 3) + 0.1).toFixed(2));
    const duplicated: ScriptSubtitle = {
      text: `${clip.text} (Copy)`,
      start: newStart,
      duration: clip.duration || 3,
    };
    const updated = [...localClips, duplicated].sort((a, b) => a.start - b.start);
    setLocalClips(updated);
    onUpdateSubtitles?.(updated);
    setSelectedClip({ track: 'caption', index: updated.indexOf(duplicated) });
  };
  const handleSplitCaptionByIndex = (index: number) => {
    if (captionsTrackLocked) return;
    setSelectedClip({ track: 'caption', index });
    // Re-use existing split logic (it reads selectedClip which we just set)
    setTimeout(handleSplitClip, 0);
  };
  const handleEditCaptionByIndex = (index: number, text: string) => {
    if (captionsTrackLocked) return;
    setEditingClipIndex(index);
    setEditingText(text);
  };

  // Save inline edited subtitle
  const handleSaveInlineText = (index: number) => {
    if (editingText.trim()) {
      const updated = [...localClips];
      updated[index] = { ...updated[index], text: editingText.trim() };
      setLocalClips(updated);
      onUpdateSubtitles?.(updated);
    }
    setEditingClipIndex(null);
  };

  // Media presence flags strictly reflect whether track clips actually exist
  const hasVideo = Boolean(videoClips.length > 0 || customVideoUrl || activeBackdrop?.videoUrl);
  const hasImage = Boolean(imageClips.length > 0 || customImageUrl || activeBackdrop?.imageUrl);
  const hasOverlay = Boolean(overlayClips.length > 0 || activeElementOverlay);
  const hasCaptions = Boolean(captionLanes.length > 0 || (script.subtitles && script.subtitles.length > 0) || localClips.length > 0);
  const hasVoice = Boolean(voiceClips.length > 0 || (audioUrl && audioUrl.trim()));
  const hasMusic = Boolean(musicClips.length > 0 || (selectedMusic && selectedMusic.trim()));
  const hasSfx = Boolean(sfxClips.length > 0 || selectedSfx);
  const hasTitle = Boolean(script.title && script.title.trim());

  // Dynamically open tracks when media is added, and keep empty tracks hidden
  useEffect(() => {
    setEnabledTracks((prev) => {
      const next = {
        video: true, // Primary video track is always visible at starting
        image: prev.image || hasImage,
        overlay: prev.overlay || hasOverlay,
        captions: prev.captions || hasCaptions,
        title: prev.title || hasTitle,
        voice: prev.voice || hasVoice,
        music: prev.music || hasMusic,
        sfx: prev.sfx || hasSfx,
      };
      if (
        prev.video === next.video &&
        prev.image === next.image &&
        prev.overlay === next.overlay &&
        prev.captions === next.captions &&
        prev.title === next.title &&
        prev.voice === next.voice &&
        prev.music === next.music &&
        prev.sfx === next.sfx
      ) {
        return prev;
      }
      return next;
    });
  }, [hasImage, hasOverlay, hasCaptions, hasTitle, hasVoice, hasMusic, hasSfx]);

  // Dynamic voice profile resolution from loaded voices
  const activeVoiceObj = voices.find((v) => v.id === selectedVoice || v.name === selectedVoice);
  const voiceLabel = activeVoiceObj
    ? `Voice: ${activeVoiceObj.name} (${activeVoiceObj.gender} • ${activeVoiceObj.style || 'Neural TTS'})`
    : `Voice: ${selectedVoice || 'Neural Voice'} (AI TTS Waves)`;

  // Dynamic soundtrack resolution from loaded music tracks
  const activeMusicObj = musicTracks.find((m) => m.id === selectedMusic);
  const musicLabel = activeMusicObj
    ? `Soundtrack: ${activeMusicObj.title} (${activeMusicObj.genre || 'Score'})`
    : selectedMusic
      ? 'Soundtrack: Selected Mix (Looping Bed)'
      : 'Ambient Motivation (Soundtrack)';
  const musicSubLabel = activeMusicObj?.duration
    ? `${activeMusicObj.duration} • -14 dB Studio Mix`
    : '-14 dB Studio Mix';

  // Total enabled tracks configured in timeline
  const enabledTracksCount = Object.values(enabledTracks).filter(Boolean).length;
  const tracksWithContentCount = [
    hasVideo && enabledTracks.video,
    hasImage && enabledTracks.image,
    hasOverlay && enabledTracks.overlay,
    captionLanes.length > 0 && enabledTracks.captions,
    hasTitle && enabledTracks.title,
    hasVoice && enabledTracks.voice,
    hasMusic && enabledTracks.music,
    hasSfx && enabledTracks.sfx,
  ].filter(Boolean).length;
  const activeTracksCount = enabledTracksCount;

  // Mouse wheel horizontal scroll handler for tracks
  const handleTimelineWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!tracksScrollRef.current) return;
    if (Math.abs(e.deltaX) > 0) return;
    if (e.ctrlKey) return;
    if (e.shiftKey) {
      e.preventDefault();
      tracksScrollRef.current.scrollLeft += e.deltaY;
      return;
    }
    const canScrollVertically =
      tracksScrollRef.current.scrollHeight > tracksScrollRef.current.clientHeight + 4;
    if (!canScrollVertically && Math.abs(e.deltaY) > 0) {
      tracksScrollRef.current.scrollLeft += e.deltaY;
    }
  };

  // Mouse wheel horizontal scroll handler on time ruler
  const handleRulerWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!tracksScrollRef.current) return;
    if (e.ctrlKey) return;
    if (Math.abs(e.deltaY) > 0 || Math.abs(e.deltaX) > 0) {
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > 0 ? e.deltaX : e.deltaY;
      tracksScrollRef.current.scrollLeft += delta;
    }
  };

  // Keep major labels comfortably separated across infinite runway at every zoom and viewport size.
  const targetTickInterval = Math.max(0.1, (80 * safeTotalDuration) / trackContentWidthPx);
  const tickMagnitude = 10 ** Math.floor(Math.log10(targetTickInterval));
  const tickInterval = Math.max(
    0.1,
    [1, 2, 2.5, 5, 10, 15, 30, 60, 120, 300]
      .map((scale) => scale * tickMagnitude)
      .find((interval) => interval >= targetTickInterval) ?? 10 * tickMagnitude
  );
  const rawTickCount = Math.floor(safeTotalDuration / tickInterval + 1e-9) + 1;
  const safeTickCount = Math.min(500, Math.max(1, Number.isFinite(rawTickCount) ? rawTickCount : 1));
  const ticks = Array.from(
    { length: safeTickCount },
    (_, index) => index * tickInterval
  );


  // ── Dynamic Track Lane Renderers ─────────────────────────────────────
  const renderVideoTrackLane = () => (
    <React.Fragment key="track-lane-video">
                {/* ── Track 1: Video Backdrop Clip Block (Moveable & Trimmable) ───── */}
                {enabledTracks.video && (
                  hasVideo ? (
                    <VideoTrackClip
                      clips={videoLanes}
                      trackHeight={videoTrackHeight}
                      laneHeight={laneHeight}
                      laneGap={laneGap}
                      maxLane={videoMaxLane}
                      videoStart={videoClips[0]?.start ?? videoStart}
                      videoDuration={videoClips[0]?.duration ?? videoDuration}
                      totalDuration={totalDuration}
                      selectedClip={selectedClip}
                      videoTrackVisible={videoTrackVisible}
                      backdropName={activeBackdrop?.name || 'Video Clip'}
                      mediaUrl={customVideoUrl || activeBackdrop?.imageUrl}
                      posterUrl={customImageUrl || activeBackdrop?.imageUrl}
                      onSelectClip={(clipId) => handleSelectClip({ track: 'video', clipId, all: false }, 'video')}
                      onPointerDownMoveClip={(e, clip) => {
                        handleSelectClip({ track: 'video', clipId: clip.id, all: false }, 'video');
                        setActiveDrag({
                          kind: 'video',
                          clipId: clip.id,
                          mode: 'move',
                          startX: e.clientX,
                          origStart: clip.start,
                          origDuration: clip.duration,
                        });
                      }}
                      onPointerDownTrimLeftClip={(e, clip) => {
                        e.stopPropagation();
                        handleSelectClip({ track: 'video', clipId: clip.id, all: false }, 'video');
                        setActiveDrag({
                          kind: 'video',
                          clipId: clip.id,
                          mode: 'trim-left',
                          startX: e.clientX,
                          origStart: clip.start,
                          origDuration: clip.duration,
                        });
                      }}
                      onPointerDownTrimRightClip={(e, clip) => {
                        e.stopPropagation();
                        handleSelectClip({ track: 'video', clipId: clip.id, all: false }, 'video');
                        setActiveDrag({
                          kind: 'video',
                          clipId: clip.id,
                          mode: 'trim-right',
                          startX: e.clientX,
                          origStart: clip.start,
                          origDuration: clip.duration,
                        });
                      }}
                      onDeleteClip={(clipId) => handleDeleteVideoClip(clipId)}
                      onDuplicateClip={(clipId) => handleDuplicateVideoClip(clipId)}
                      onSplitClip={(clipId) => handleSplitVideoClip(clipId)}
                      onSelect={() => handleSelectClip({ track: 'video' }, 'video')}
                      onPointerDownMove={(e) => {
                        const first = videoClips[0];
                        if (first) {
                          handleSelectClip({ track: 'video', clipId: first.id }, 'video');
                          setActiveDrag({
                            kind: 'video',
                            clipId: first.id,
                            mode: 'move',
                            startX: e.clientX,
                            origStart: first.start,
                            origDuration: first.duration,
                          });
                        }
                      }}
                      onPointerDownTrimLeft={(e) => {
                        e.stopPropagation();
                        const first = videoClips[0];
                        if (first) {
                          handleSelectClip({ track: 'video', clipId: first.id }, 'video');
                          setActiveDrag({
                            kind: 'video',
                            clipId: first.id,
                            mode: 'trim-left',
                            startX: e.clientX,
                            origStart: first.start,
                            origDuration: first.duration,
                          });
                        }
                      }}
                      onPointerDownTrimRight={(e) => {
                        e.stopPropagation();
                        const first = videoClips[0];
                        if (first) {
                          handleSelectClip({ track: 'video', clipId: first.id }, 'video');
                          setActiveDrag({
                            kind: 'video',
                            clipId: first.id,
                            mode: 'trim-right',
                            startX: e.clientX,
                            origStart: first.start,
                            origDuration: first.duration,
                          });
                        }
                      }}
                      onDelete={() => handleDeleteVideoClip()}
                      onDuplicate={() => handleDuplicateVideoClip()}
                      onSplit={() => handleSplitVideoClip()}
                      onHide={() => setVideoTrackVisible(!videoTrackVisible)}
                      onZoomToClip={handleVideoZoom}
                    />
                  ) : (
                    <div
                      style={{ height: `${videoTrackHeight}px` }}
                      className="box-border border-b border-[#242426] p-1 relative flex items-center w-full"
                    />
                  )
                )}


    </React.Fragment>
  );

  const renderImageTrackLane = () => (
    <React.Fragment key="track-lane-image">
                {/* ── Track 2: Image Backdrop Clip Block ────────────────────── */}
                {enabledTracks.image && (
                  hasImage ? (
                    <ImageTrackClip
                      clips={imageLanes}
                      trackHeight={imageTrackHeight}
                      laneHeight={laneHeight}
                      laneGap={laneGap}
                      maxLane={imageMaxLane}
                      imageStart={imageClips[0]?.start ?? imageStart}
                      imageDuration={imageClips[0]?.duration ?? imageDuration}
                      totalDuration={totalDuration}
                      selectedClip={selectedClip}
                      imageTrackVisible={imageTrackVisible}
                      imageUrl={customImageUrl || activeBackdrop?.imageUrl}
                      imageName={customImageUrl ? 'Custom Image Graphic' : `${activeBackdrop?.name || 'Image'}`}
                      onSelectClip={(clipId) => handleSelectClip({ track: 'image', clipId, all: false }, 'video')}
                      onPointerDownMoveClip={(e, clip) => {
                        handleSelectClip({ track: 'image', clipId: clip.id, all: false }, 'video');
                        setActiveDrag({
                          kind: 'image',
                          clipId: clip.id,
                          mode: 'move',
                          startX: e.clientX,
                          origStart: clip.start,
                          origDuration: clip.duration,
                        });
                      }}
                      onPointerDownTrimLeftClip={(e, clip) => {
                        e.stopPropagation();
                        handleSelectClip({ track: 'image', clipId: clip.id, all: false }, 'video');
                        setActiveDrag({
                          kind: 'image',
                          clipId: clip.id,
                          mode: 'trim-left',
                          startX: e.clientX,
                          origStart: clip.start,
                          origDuration: clip.duration,
                        });
                      }}
                      onPointerDownTrimRightClip={(e, clip) => {
                        e.stopPropagation();
                        handleSelectClip({ track: 'image', clipId: clip.id, all: false }, 'video');
                        setActiveDrag({
                          kind: 'image',
                          clipId: clip.id,
                          mode: 'trim-right',
                          startX: e.clientX,
                          origStart: clip.start,
                          origDuration: clip.duration,
                        });
                      }}
                      onDeleteClip={(clipId) => handleDeleteImageClip(clipId)}
                      onDuplicateClip={(clipId) => handleDuplicateImageClip(clipId)}
                      onSplitClip={(clipId) => handleSplitImageClip(clipId)}
                      onSelect={() => handleSelectClip({ track: 'image' }, 'video')}
                      onPointerDownMove={(e) => {
                        const first = imageClips[0];
                        if (first) {
                          handleSelectClip({ track: 'image', clipId: first.id }, 'video');
                          setActiveDrag({
                            kind: 'image',
                            clipId: first.id,
                            mode: 'move',
                            startX: e.clientX,
                            origStart: first.start,
                            origDuration: first.duration,
                          });
                        }
                      }}
                      onPointerDownTrimLeft={(e) => {
                        e.stopPropagation();
                        const first = imageClips[0];
                        if (first) {
                          handleSelectClip({ track: 'image', clipId: first.id }, 'video');
                          setActiveDrag({
                            kind: 'image',
                            clipId: first.id,
                            mode: 'trim-left',
                            startX: e.clientX,
                            origStart: first.start,
                            origDuration: first.duration,
                          });
                        }
                      }}
                      onPointerDownTrimRight={(e) => {
                        e.stopPropagation();
                        const first = imageClips[0];
                        if (first) {
                          handleSelectClip({ track: 'image', clipId: first.id }, 'video');
                          setActiveDrag({
                            kind: 'image',
                            clipId: first.id,
                            mode: 'trim-right',
                            startX: e.clientX,
                            origStart: first.start,
                            origDuration: first.duration,
                          });
                        }
                      }}
                      onDelete={() => handleDeleteImageClip()}
                      onDuplicate={() => handleDuplicateImageClip()}
                      onSplit={() => handleSplitImageClip()}
                      onHide={() => setImageTrackVisible(!imageTrackVisible)}
                      onZoomToClip={handleImageZoom}
                    />
                  ) : (
                    <div
                      style={{ height: `${imageTrackHeight}px` }}
                      className="box-border border-b border-[#242426] p-1 relative flex items-center w-full"
                    />
                  )
                )}


    </React.Fragment>
  );

  const renderOverlayTrackLane = () => (
    <React.Fragment key="track-lane-overlay">
                {/* ── Track 3: Overlays / Elements Clip Block ───────────────── */}
                {enabledTracks.overlay && (
                  hasOverlay ? (
                    <OverlayTrackClip
                      clips={overlayLanes}
                      trackHeight={overlayTrackHeight}
                      laneHeight={laneHeight}
                      laneGap={laneGap}
                      maxLane={overlayMaxLane}
                      overlayStart={overlayStart}
                      overlayDuration={overlayDuration}
                      totalDuration={totalDuration}
                      selectedClip={selectedClip}
                      overlayTrackVisible={overlayTrackVisible}
                      label={activeElementOverlay?.label || activeElementOverlay?.name}
                      onPointerDownMoveClip={(e, clip) => {
                        handleSelectClip({ track: 'overlay', clipId: clip.id, all: false }, 'overlay');
                        setActiveDrag({
                          kind: 'overlay',
                          clipId: clip.id,
                          mode: 'move',
                          startX: e.clientX,
                          origStart: clip.start,
                          origDuration: clip.duration,
                        });
                      }}
                      onPointerDownTrimLeftClip={(e, clip) => {
                        e.stopPropagation();
                        handleSelectClip({ track: 'overlay', clipId: clip.id, all: false }, 'overlay');
                        setActiveDrag({
                          kind: 'overlay',
                          clipId: clip.id,
                          mode: 'trim-left',
                          startX: e.clientX,
                          origStart: clip.start,
                          origDuration: clip.duration,
                        });
                      }}
                      onPointerDownTrimRightClip={(e, clip) => {
                        e.stopPropagation();
                        handleSelectClip({ track: 'overlay', clipId: clip.id, all: false }, 'overlay');
                        setActiveDrag({
                          kind: 'overlay',
                          clipId: clip.id,
                          mode: 'trim-right',
                          startX: e.clientX,
                          origStart: clip.start,
                          origDuration: clip.duration,
                        });
                      }}
                      onDeleteClip={(clipId) => handleDeleteOverlayClip(clipId)}
                      onDuplicateClip={(clipId) => handleDuplicateOverlayClip(clipId)}
                      onSplitClip={(clipId) => handleSplitOverlayClip(clipId)}
                      onSelect={() => handleSelectClip({ track: 'overlay' }, 'overlay')}
                      onPointerDownMove={(e) => {
                        const first = overlayClips[0];
                        if (first) {
                          handleSelectClip({ track: 'overlay', clipId: first.id }, 'overlay');
                          setActiveDrag({
                            kind: 'overlay',
                            clipId: first.id,
                            mode: 'move',
                            startX: e.clientX,
                            origStart: first.start,
                            origDuration: first.duration,
                          });
                        } else {
                          handleSelectClip({ track: 'overlay' }, 'overlay');
                          setActiveDrag({
                            kind: 'overlay',
                            mode: 'move',
                            startX: e.clientX,
                            origStart: overlayStart,
                            origDuration: overlayDuration,
                          });
                        }
                      }}
                      onPointerDownTrimLeft={(e) => {
                        e.stopPropagation();
                        const first = overlayClips[0];
                        if (first) {
                          handleSelectClip({ track: 'overlay', clipId: first.id }, 'overlay');
                          setActiveDrag({
                            kind: 'overlay',
                            clipId: first.id,
                            mode: 'trim-left',
                            startX: e.clientX,
                            origStart: first.start,
                            origDuration: first.duration,
                          });
                        } else {
                          handleSelectClip({ track: 'overlay' }, 'overlay');
                          setActiveDrag({
                            kind: 'overlay',
                            mode: 'trim-left',
                            startX: e.clientX,
                            origStart: overlayStart,
                            origDuration: overlayDuration,
                          });
                        }
                      }}
                      onPointerDownTrimRight={(e) => {
                        e.stopPropagation();
                        const first = overlayClips[0];
                        if (first) {
                          handleSelectClip({ track: 'overlay', clipId: first.id }, 'overlay');
                          setActiveDrag({
                            kind: 'overlay',
                            clipId: first.id,
                            mode: 'trim-right',
                            startX: e.clientX,
                            origStart: first.start,
                            origDuration: first.duration,
                          });
                        } else {
                          handleSelectClip({ track: 'overlay' }, 'overlay');
                          setActiveDrag({
                            kind: 'overlay',
                            mode: 'trim-right',
                            startX: e.clientX,
                            origStart: overlayStart,
                            origDuration: overlayDuration,
                          });
                        }
                      }}
                      onDelete={() => handleDeleteOverlayClip()}
                      onDuplicate={() => handleDuplicateOverlayClip()}
                      onSplit={() => handleSplitOverlayClip()}
                      onHide={() => setOverlayTrackVisible(!overlayTrackVisible)}
                      onZoomToClip={handleOverlayZoom}
                    />
                  ) : (
                    <div
                      style={{ height: `${overlayTrackHeight}px` }}
                      className="box-border border-b border-[#242426] p-1 relative flex items-center w-full"
                    />
                  )
                )}


    </React.Fragment>
  );

  const renderCaptionsTrackLane = () => (
    <React.Fragment key="track-lane-captions">
                {/* ── Track 4: Subtitle & Kinetic Caption Clips (Moveable, Trimmable, Stacking Lanes) ────── */}
                {enabledTracks.captions && (
                  captionLanes.length > 0 ? (
                    <CaptionTrackClips
                      captionLanes={captionLanes}
                      captionMaxLane={captionMaxLane}
                      captionTrackHeight={captionTrackHeight}
                      laneHeight={laneHeight}
                      laneGap={laneGap}
                      totalDuration={totalDuration}
                      selectedClip={selectedClip}
                      captionsTrackLocked={captionsTrackLocked}
                      editingClipIndex={editingClipIndex}
                      editingText={editingText}
                      setEditingText={setEditingText}
                      onSelectClip={(index) => {
                        handleSelectClip({ track: 'caption', index, all: false }, 'text');
                      }}
                      onDoubleClickClip={(index, text) => {
                        if (captionsTrackLocked) return;
                        setEditingClipIndex(index);
                        setEditingText(text);
                      }}
                      onSaveInlineText={handleSaveInlineText}
                      onCancelInlineEdit={() => setEditingClipIndex(null)}
                      onPointerDownMove={(e, index, start, dur) => {
                        if (captionsTrackLocked || editingClipIndex === index) return;
                        handleSelectClip({ track: 'caption', index, all: false }, 'text');
                        setActiveDrag({
                          kind: 'subtitle',
                          index,
                          mode: 'move',
                          startX: e.clientX,
                          origStart: start,
                          origDuration: dur,
                        });
                      }}
                      onPointerDownTrimLeft={(e, index, start, dur) => {
                        e.stopPropagation();
                        handleSelectClip({ track: 'caption', index, all: false }, 'text');
                        setActiveDrag({
                          kind: 'subtitle',
                          index,
                          mode: 'trim-left',
                          startX: e.clientX,
                          origStart: start,
                          origDuration: dur,
                        });
                      }}
                      onPointerDownTrimRight={(e, index, start, dur) => {
                        e.stopPropagation();
                        handleSelectClip({ track: 'caption', index, all: false }, 'text');
                        setActiveDrag({
                          kind: 'subtitle',
                          index,
                          mode: 'trim-right',
                          startX: e.clientX,
                          origStart: start,
                          origDuration: dur,
                        });
                      }}
                      onDeleteCaption={handleDeleteCaptionByIndex}
                      onDuplicateCaption={handleDuplicateCaptionByIndex}
                      onSplitCaption={handleSplitCaptionByIndex}
                      onEditCaption={handleEditCaptionByIndex}
                    />
                  ) : (
                    <div
                      className="relative box-border border-b border-[#242426] w-full"
                      style={{ height: `${captionTrackHeight}px` }}
                    >
                      <div className="absolute inset-x-0 top-0 h-px bg-[#2D2D2D]" />
                    </div>
                  )
                )}


    </React.Fragment>
  );

  const renderTitleTrackLane = () => (
    <React.Fragment key="track-lane-title">
                {/* ── Track 5: Title / Hook Overlay Clip Block ──────────────── */}
                {enabledTracks.title && (
                  hasTitle ? (
                    <div
                      className="box-border border-b border-[#242426] p-1 relative flex items-center w-full transition-all"
                      style={{ height: `${titleTrackHeight}px` }}
                    >
                      <div
                        onClick={() => handleSelectClip({ track: 'title' }, 'text')}
                        onPointerDown={(e) => {
                          handleSelectClip({ track: 'title' });
                          setActiveDrag({
                            kind: 'title',
                            mode: 'move',
                            startX: e.clientX,
                            origStart: titleStart,
                            origDuration: titleDuration,
                          });
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          handleSelectClip({ track: 'title' });
                          setTitleContextMenu({ x: e.clientX, y: e.clientY });
                        }}
                        className={`timeline-clip-card absolute rounded-md px-1.5 flex items-center justify-between border cursor-grab active:cursor-grabbing select-none group transition-all overflow-hidden ${selectedClip?.track === 'title'
                            ? 'bg-[#0E2A44] border-sky-300 text-white z-20'
                            : 'bg-[#0A1A2A] hover:bg-[#0E2338] border-sky-500/30 text-sky-100 z-10'
                          }`}
                        style={{
                          left: `${(titleStart / totalDuration) * 100}%`,
                          width: `${Math.min(100, (titleDuration / totalDuration) * 100)}%`,
                          minWidth: '44px',
                          top: '4px',
                          height: '32px',
                        }}
                      >
                        {/* Left Trim Handle */}
                        {!titleTrackLocked && (
                          <div
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              handleSelectClip({ track: 'title' }, 'text');
                              setActiveDrag({
                                kind: 'title',
                                mode: 'trim-left',
                                startX: e.clientX,
                                origStart: titleStart,
                                origDuration: titleDuration,
                              });
                            }}
                            className="timeline-trim-handle-left bg-sky-400/40 hover:bg-sky-400 opacity-0 group-hover:opacity-100 transition-opacity z-30"
                            title="Drag to trim Title start time"
                          >
                            <div className="w-0.5 h-3 bg-white rounded-full" />
                          </div>
                        )}

                        {/* Clean Box Content: Icon + Title */}
                        <div className="flex items-center gap-1.5 w-full min-w-0 overflow-hidden px-1.5 select-none z-10">
                          <Type className="w-3 h-3 text-sky-300/90 shrink-0 pointer-events-none" />
                          <span className="text-[10px] font-bold text-sky-100 truncate tracking-tight flex-1 min-w-0 pointer-events-none">
                            "{script.title || 'Untitled'}"
                          </span>
                        </div>

                        {/* Right Trim Handle */}
                        {!titleTrackLocked && (
                          <div
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              handleSelectClip({ track: 'title' }, 'text');
                              setActiveDrag({
                                kind: 'title',
                                mode: 'trim-right',
                                startX: e.clientX,
                                origStart: titleStart,
                                origDuration: titleDuration,
                              });
                            }}
                            className="timeline-trim-handle-right bg-sky-400/40 hover:bg-sky-400 opacity-0 group-hover:opacity-100 transition-opacity z-30"
                            title="Drag to trim Title duration"
                          >
                            <div className="w-0.5 h-3 bg-white rounded-full" />
                          </div>
                        )}
                      </div>
                      {/* Title track right-click context menu */}
                      <TimelineClipContextMenu
                        x={titleContextMenu?.x ?? 0}
                        y={titleContextMenu?.y ?? 0}
                        trackType="title"
                        isVisible={titleContextMenu !== null}
                        onClose={() => setTitleContextMenu(null)}
                        onDelete={handleTitleDelete}
                        onSplit={handleSplitClip}
                        onZoomToClip={handleTitleZoom}
                        onColorLabel={(c) => setTitleColorLabel(c)}
                        onCopyTimings={() => {
                          const text = `Start: ${titleStart.toFixed(2)}s | Duration: ${titleDuration.toFixed(2)}s | Title: "${script.title || 'Untitled'}"`;
                          navigator.clipboard.writeText(text).catch(() => { });
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{ height: `${titleTrackHeight}px` }}
                      className="box-border border-b border-[#242426] p-1 relative flex items-center w-full"
                    />
                  )
                )}


    </React.Fragment>
  );

  const renderVoiceTrackLane = () => (
    <React.Fragment key="track-lane-voice">
                {/* ── Track 6: Voiceover Audio (With Full-Width Dynamic Audio Waves) ───── */}
                {enabledTracks.voice && (
                  hasVoice ? (
                    <AudioTrackClip
                      type="voice"
                      clips={voiceLanes}
                      trackHeight={voiceTrackHeight}
                      laneHeight={laneHeight}
                      laneGap={laneGap}
                      maxLane={voiceMaxLane}
                      start={voiceStart}
                      duration={voiceDuration}
                      totalDuration={totalDuration}
                      selectedClip={selectedClip}
                      isMuted={voiceTrackMuted}
                      label={voiceLabel}
                      onPointerDownMoveClip={(e, clip) => {
                        handleSelectClip({ track: 'voice', clipId: clip.id, all: false }, 'voice');
                        setActiveDrag({
                          kind: 'voice',
                          clipId: clip.id,
                          mode: 'move',
                          startX: e.clientX,
                          origStart: clip.start,
                          origDuration: clip.duration,
                        });
                      }}
                      onPointerDownTrimLeftClip={(e, clip) => {
                        e.stopPropagation();
                        handleSelectClip({ track: 'voice', clipId: clip.id, all: false }, 'voice');
                        setActiveDrag({
                          kind: 'voice',
                          clipId: clip.id,
                          mode: 'trim-left',
                          startX: e.clientX,
                          origStart: clip.start,
                          origDuration: clip.duration,
                        });
                      }}
                      onPointerDownTrimRightClip={(e, clip) => {
                        e.stopPropagation();
                        handleSelectClip({ track: 'voice', clipId: clip.id, all: false }, 'voice');
                        setActiveDrag({
                          kind: 'voice',
                          clipId: clip.id,
                          mode: 'trim-right',
                          startX: e.clientX,
                          origStart: clip.start,
                          origDuration: clip.duration,
                        });
                      }}
                      onDeleteClip={(clipId) => handleDeleteVoiceClip(clipId)}
                      onDuplicateClip={(clipId) => handleDuplicateVoiceClip(clipId)}
                      onSplitClip={(clipId) => handleSplitVoiceClip(clipId)}
                      onSelect={() => handleSelectClip({ track: 'voice' }, 'voice')}
                      onPointerDownMove={(e) => {
                        const first = voiceClips[0];
                        if (first) {
                          handleSelectClip({ track: 'voice', clipId: first.id }, 'voice');
                          setActiveDrag({
                            kind: 'voice',
                            clipId: first.id,
                            mode: 'move',
                            startX: e.clientX,
                            origStart: first.start,
                            origDuration: first.duration,
                          });
                        } else {
                          handleSelectClip({ track: 'voice' }, 'voice');
                          setActiveDrag({
                            kind: 'voice',
                            mode: 'move',
                            startX: e.clientX,
                            origStart: voiceStart,
                            origDuration: voiceDuration,
                          });
                        }
                      }}
                      onPointerDownTrimLeft={(e) => {
                        e.stopPropagation();
                        const first = voiceClips[0];
                        if (first) {
                          handleSelectClip({ track: 'voice', clipId: first.id }, 'voice');
                          setActiveDrag({
                            kind: 'voice',
                            clipId: first.id,
                            mode: 'trim-left',
                            startX: e.clientX,
                            origStart: first.start,
                            origDuration: first.duration,
                          });
                        } else {
                          handleSelectClip({ track: 'voice' }, 'voice');
                          setActiveDrag({
                            kind: 'voice',
                            mode: 'trim-left',
                            startX: e.clientX,
                            origStart: voiceStart,
                            origDuration: voiceDuration,
                          });
                        }
                      }}
                      onPointerDownTrimRight={(e) => {
                        e.stopPropagation();
                        const first = voiceClips[0];
                        if (first) {
                          handleSelectClip({ track: 'voice', clipId: first.id }, 'voice');
                          setActiveDrag({
                            kind: 'voice',
                            clipId: first.id,
                            mode: 'trim-right',
                            startX: e.clientX,
                            origStart: first.start,
                            origDuration: first.duration,
                          });
                        } else {
                          handleSelectClip({ track: 'voice' }, 'voice');
                          setActiveDrag({
                            kind: 'voice',
                            mode: 'trim-right',
                            startX: e.clientX,
                            origStart: voiceStart,
                            origDuration: voiceDuration,
                          });
                        }
                      }}
                      onDelete={() => handleDeleteVoiceClip()}
                      onDuplicate={() => handleDuplicateVoiceClip()}
                      onMute={() => setVoiceTrackMuted(!voiceTrackMuted)}
                      onSplit={() => handleSplitVoiceClip()}
                      onZoomToClip={handleVoiceZoom}
                    />
                  ) : (
                    <div
                      style={{ height: `${voiceTrackHeight}px` }}
                      className="box-border border-b border-[#242426] p-1 relative flex items-center w-full"
                    />
                  )
                )}


    </React.Fragment>
  );

  const renderMusicTrackLane = () => (
    <React.Fragment key="track-lane-music">
                {/* ── Track 7: Background Music Soundtrack (With Full-Width Dynamic Music Waves) ───── */}
                {enabledTracks.music && (
                  hasMusic ? (
                    <AudioTrackClip
                      type="music"
                      clips={musicLanes}
                      trackHeight={musicTrackHeight}
                      laneHeight={laneHeight}
                      laneGap={laneGap}
                      maxLane={musicMaxLane}
                      start={musicStart}
                      duration={musicDuration}
                      totalDuration={totalDuration}
                      selectedClip={selectedClip}
                      isMuted={musicTrackMuted}
                      label={musicLabel}
                      subLabel={musicSubLabel}
                      onPointerDownMoveClip={(e, clip) => {
                        handleSelectClip({ track: 'music', clipId: clip.id, all: false }, 'music');
                        setActiveDrag({
                          kind: 'music',
                          clipId: clip.id,
                          mode: 'move',
                          startX: e.clientX,
                          origStart: clip.start,
                          origDuration: clip.duration,
                        });
                      }}
                      onPointerDownTrimLeftClip={(e, clip) => {
                        e.stopPropagation();
                        handleSelectClip({ track: 'music', clipId: clip.id, all: false }, 'music');
                        setActiveDrag({
                          kind: 'music',
                          clipId: clip.id,
                          mode: 'trim-left',
                          startX: e.clientX,
                          origStart: clip.start,
                          origDuration: clip.duration,
                        });
                      }}
                      onPointerDownTrimRightClip={(e, clip) => {
                        e.stopPropagation();
                        handleSelectClip({ track: 'music', clipId: clip.id, all: false }, 'music');
                        setActiveDrag({
                          kind: 'music',
                          clipId: clip.id,
                          mode: 'trim-right',
                          startX: e.clientX,
                          origStart: clip.start,
                          origDuration: clip.duration,
                        });
                      }}
                      onDeleteClip={(clipId) => handleDeleteMusicClip(clipId)}
                      onDuplicateClip={(clipId) => handleDuplicateMusicClip(clipId)}
                      onSplitClip={(clipId) => handleSplitMusicClip(clipId)}
                      onSelect={() => handleSelectClip({ track: 'music' }, 'music')}
                      onPointerDownMove={(e) => {
                        const first = musicClips[0];
                        if (first) {
                          handleSelectClip({ track: 'music', clipId: first.id }, 'music');
                          setActiveDrag({
                            kind: 'music',
                            clipId: first.id,
                            mode: 'move',
                            startX: e.clientX,
                            origStart: first.start,
                            origDuration: first.duration,
                          });
                        } else {
                          handleSelectClip({ track: 'music' }, 'music');
                          setActiveDrag({
                            kind: 'music',
                            mode: 'move',
                            startX: e.clientX,
                            origStart: musicStart,
                            origDuration: musicDuration,
                          });
                        }
                      }}
                      onPointerDownTrimLeft={(e) => {
                        e.stopPropagation();
                        const first = musicClips[0];
                        if (first) {
                          handleSelectClip({ track: 'music', clipId: first.id }, 'music');
                          setActiveDrag({
                            kind: 'music',
                            clipId: first.id,
                            mode: 'trim-left',
                            startX: e.clientX,
                            origStart: first.start,
                            origDuration: first.duration,
                          });
                        } else {
                          handleSelectClip({ track: 'music' }, 'music');
                          setActiveDrag({
                            kind: 'music',
                            mode: 'trim-left',
                            startX: e.clientX,
                            origStart: musicStart,
                            origDuration: musicDuration,
                          });
                        }
                      }}
                      onPointerDownTrimRight={(e) => {
                        e.stopPropagation();
                        const first = musicClips[0];
                        if (first) {
                          handleSelectClip({ track: 'music', clipId: first.id }, 'music');
                          setActiveDrag({
                            kind: 'music',
                            clipId: first.id,
                            mode: 'trim-right',
                            startX: e.clientX,
                            origStart: first.start,
                            origDuration: first.duration,
                          });
                        } else {
                          handleSelectClip({ track: 'music' }, 'music');
                          setActiveDrag({
                            kind: 'music',
                            mode: 'trim-right',
                            startX: e.clientX,
                            origStart: musicStart,
                            origDuration: musicDuration,
                          });
                        }
                      }}
                      onDelete={() => handleDeleteMusicClip()}
                      onDuplicate={() => handleDuplicateMusicClip()}
                      onMute={() => setMusicTrackMuted(!musicTrackMuted)}
                      onSplit={() => handleSplitMusicClip()}
                      onZoomToClip={handleMusicZoom}
                    />
                  ) : (
                    <div
                      style={{ height: `${musicTrackHeight}px` }}
                      className="box-border border-b border-[#242426] p-1 relative flex items-center w-full"
                    />
                  )
                )}


    </React.Fragment>
  );

  const renderSfxTrackLane = () => (
    <React.Fragment key="track-lane-sfx">
                {/* ── Track 8: Sound FX Track ──────────────────────────────── */}
                {enabledTracks.sfx && (
                  hasSfx ? (
                    <AudioTrackClip
                    type="sfx"
                    clips={sfxLanes}
                    trackHeight={sfxTrackHeight}
                    laneHeight={laneHeight}
                    laneGap={laneGap}
                    maxLane={sfxMaxLane}
                    start={sfxStart}
                    duration={sfxDuration}
                    totalDuration={totalDuration}
                    selectedClip={selectedClip}
                    isMuted={sfxTrackMuted}
                    label={selectedSfx ? `SFX: ${selectedSfx.name}` : 'Sound FX'}
                    onPointerDownMoveClip={(e, clip) => {
                      handleSelectClip({ track: 'sfx', clipId: clip.id, all: false }, 'music');
                      setActiveDrag({
                        kind: 'sfx',
                        clipId: clip.id,
                        mode: 'move',
                        startX: e.clientX,
                        origStart: clip.start,
                        origDuration: clip.duration,
                      });
                    }}
                    onPointerDownTrimLeftClip={(e, clip) => {
                      e.stopPropagation();
                      handleSelectClip({ track: 'sfx', clipId: clip.id, all: false }, 'music');
                      setActiveDrag({
                        kind: 'sfx',
                        clipId: clip.id,
                        mode: 'trim-left',
                        startX: e.clientX,
                        origStart: clip.start,
                        origDuration: clip.duration,
                      });
                    }}
                    onPointerDownTrimRightClip={(e, clip) => {
                      e.stopPropagation();
                      handleSelectClip({ track: 'sfx', clipId: clip.id, all: false }, 'music');
                      setActiveDrag({
                        kind: 'sfx',
                        clipId: clip.id,
                        mode: 'trim-right',
                        startX: e.clientX,
                        origStart: clip.start,
                        origDuration: clip.duration,
                      });
                    }}
                    onDeleteClip={(clipId) => handleDeleteSfxClip(clipId)}
                    onDuplicateClip={(clipId) => handleDuplicateSfxClip(clipId)}
                    onSplitClip={(clipId) => handleSplitSfxClip(clipId)}
                    onSelect={() => handleSelectClip({ track: 'sfx' }, 'music')}
                    onPointerDownMove={(e) => {
                      const first = sfxClips[0];
                      if (first) {
                        handleSelectClip({ track: 'sfx', clipId: first.id }, 'music');
                        setActiveDrag({
                          kind: 'sfx',
                          clipId: first.id,
                          mode: 'move',
                          startX: e.clientX,
                          origStart: first.start,
                          origDuration: first.duration,
                        });
                      } else {
                        handleSelectClip({ track: 'sfx', clipId: 'sfx-default' }, 'music');
                        setActiveDrag({
                          kind: 'sfx',
                          clipId: 'sfx-default',
                          mode: 'move',
                          startX: e.clientX,
                          origStart: sfxStart,
                          origDuration: sfxDuration,
                        });
                      }
                    }}
                    onPointerDownTrimLeft={(e) => {
                      e.stopPropagation();
                      const first = sfxClips[0];
                      if (first) {
                        handleSelectClip({ track: 'sfx', clipId: first.id }, 'music');
                        setActiveDrag({
                          kind: 'sfx',
                          clipId: first.id,
                          mode: 'trim-left',
                          startX: e.clientX,
                          origStart: first.start,
                          origDuration: first.duration,
                        });
                      } else {
                        handleSelectClip({ track: 'sfx', clipId: 'sfx-default' }, 'music');
                        setActiveDrag({
                          kind: 'sfx',
                          clipId: 'sfx-default',
                          mode: 'trim-left',
                          startX: e.clientX,
                          origStart: sfxStart,
                          origDuration: sfxDuration,
                        });
                      }
                    }}
                    onPointerDownTrimRight={(e) => {
                      e.stopPropagation();
                      const first = sfxClips[0];
                      if (first) {
                        handleSelectClip({ track: 'sfx', clipId: first.id }, 'music');
                        setActiveDrag({
                          kind: 'sfx',
                          clipId: first.id,
                          mode: 'trim-right',
                          startX: e.clientX,
                          origStart: first.start,
                          origDuration: first.duration,
                        });
                      } else {
                        handleSelectClip({ track: 'sfx', clipId: 'sfx-default' }, 'music');
                        setActiveDrag({
                          kind: 'sfx',
                          clipId: 'sfx-default',
                          mode: 'trim-right',
                          startX: e.clientX,
                          origStart: sfxStart,
                          origDuration: sfxDuration,
                        });
                      }
                    }}
                    onDelete={() => handleDeleteSfxClip()}
                    onDuplicate={() => handleDuplicateSfxClip()}
                    onMute={() => setSfxTrackMuted(!sfxTrackMuted)}
                    onSplit={() => handleSplitSfxClip()}
                  />
                ) : (
                  <div
                    style={{ height: `${sfxTrackHeight}px` }}
                    className="box-border border-b border-[#242426] p-1 relative flex items-center w-full"
                  />
                )
              )}


    </React.Fragment>
  );

  const renderTrackLane = (trackId: TrackId) => {
    if (!enabledTracks[trackId]) return null;
    switch (trackId) {
      case 'video':
        return renderVideoTrackLane();
      case 'image':
        return renderImageTrackLane();
      case 'overlay':
        return renderOverlayTrackLane();
      case 'captions':
        return renderCaptionsTrackLane();
      case 'title':
        return renderTitleTrackLane();
      case 'voice':
        return renderVoiceTrackLane();
      case 'music':
        return renderMusicTrackLane();
      case 'sfx':
        return renderSfxTrackLane();
      default:
        return null;
    }
  };
  return (
    <div className="w-full bg-[#121212] border border-[#3A3A3A] rounded-2xl overflow-hidden shadow-2xl transition-all font-sans-studio select-none relative group/timeline-card">
      {/* ── Top Header Bar / Timeline Toolbar ──────────────────────── */}
      <TimelineToolbar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isExpandedHeight={isTimelineExpanded}
        onToggleExpandedHeight={handleToggleExpandedHeight}
        activeTracksCount={activeTracksCount}
        selectedClip={selectedClip}
        captionsTrackLocked={captionsTrackLocked}
        onSplitClip={handleSplitClip}
        onDuplicateClip={handleDuplicateClip}
        onAddCaption={handleAddCaption}
        onDeleteClip={handleDeleteClip}
        snapEnabled={snapEnabled}
        onToggleSnap={() => setSnapEnabled(!snapEnabled)}
        onSyncAudioAndCC={handleSyncAudioAndCC}
        hasAudioMismatch={hasAudioMismatch}
        voiceDuration={effectiveVoiceDur}
        captionsEnd={maxCaptionsEnd}
        addTrackMenuOpen={addTrackMenuOpen}
        onToggleAddTrackMenu={() => setAddTrackMenuOpen(!addTrackMenuOpen)}
        onCloseAddTrackMenu={() => setAddTrackMenuOpen(false)}
        onEnableTrack={handleEnableTrack}
        enabledTracks={enabledTracks}
        onSeek={onSeek}
        isPlaying={isPlaying}
        onTogglePlay={onTogglePlay}
        currentTime={currentTime}
        projectDuration={projectDuration}
        totalDuration={totalDuration}
        zoomLevel={zoomLevel}
        onZoomIn={() => setZoomLevel(Math.min(MAX_TIMELINE_ZOOM, zoomLevel + TIMELINE_ZOOM_STEP))}
        onZoomOut={() => setZoomLevel(Math.max(MIN_TIMELINE_ZOOM, zoomLevel - TIMELINE_ZOOM_STEP))}
        onZoomFit={() => setZoomLevel(1)}
        onDurationChange={onTimelineDurationChange}
      />

      {/* ── Collapsible Tracks Body ───────────────────────────────── */}
      {!isCollapsed && (
        <div className="flex flex-col bg-[#0D0D0D]">
          {/* ── Time Ruler Row (Placed Above Scrollable Tracks Area) ── */}
          <div className="flex border-b border-[#262626] bg-[#111111] select-none shrink-0 z-20">
            {/* Time Ruler & Track Labels Header (synced with horizontal scroll of tracks) */}
            <div
              ref={rulerScrollRef}
              className="flex-1 min-w-0 overflow-hidden relative h-6"
            >
              <div
                className="flex min-w-full"
                style={{
                  width: `${totalTimelineWidthPx}px`,
                }}
              >
                {/* Corner Track Labels Header (moves together with horizontal scroll) */}
                <div
                  style={{ width: `${trackHeadersWidth}px` }}
                  className="shrink-0 h-6 border-r border-[#262626] flex items-center justify-between px-2.5 text-[9px] font-mono-studio text-[#737373] uppercase tracking-wider relative group/corner-header select-none bg-[#111111]"
                >
                  <span className="truncate">Track Labels</span>
                  <div
                    onPointerDown={handleTrackHeadersResizeStart}
                    onDoubleClick={() => {
                      setTrackHeadersWidth(DEFAULT_TRACK_HEADERS_WIDTH);
                      try {
                        localStorage.setItem('apexmind:timeline-track-width', String(DEFAULT_TRACK_HEADERS_WIDTH));
                      } catch {}
                    }}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/20 z-30"
                    title="Drag left/right to adjust track labels width"
                  />
                </div>

                {/* Time Ruler Canvas & Playhead Needle */}
                <div
                  ref={rulerContainerRef}
                  onWheel={handleRulerWheel}
                  style={{ width: `${trackContentWidthPx}px` }}
                  className="relative shrink-0 h-6"
                >
                  <TimelineRuler
                    ticks={ticks}
                    totalDuration={totalDuration}
                    onRulerPointerDown={handleRulerPointerDown}
                  />
                  {/* Modern Studio Playhead Needle on ruler */}
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      handleRulerPointerDown(e);
                    }}
                    className="absolute top-0 w-0 flex justify-center h-6 pointer-events-auto cursor-ew-resize group/playhead z-40 select-none"
                    style={{ left: `${progressPercent}%` }}
                    title={`Playhead: ${formatTime(currentTime)} (Drag to scrub)`}
                  >
                    <svg
                      width="14"
                      height="24"
                      viewBox="0 0 14 24"
                      className="overflow-visible shrink-0"
                    >
                      <path
                        d="M 2 0.5 L 12 0.5 C 13.1 0.5 14 1.4 14 2.5 L 14 13.5 L 7 24 L 0 13.5 L 0 2.5 C 0 1.4 0.9 0.5 2 0.5 Z"
                        className="fill-white group-hover/playhead:fill-[#E4E4E7] transition-colors"
                      />
                      <circle cx="7" cy="7" r="1.5" fill="#18181B" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Spacer matching vertical scrollbar width so ruler aligns with tracks */}
            {scrollbarWidth > 0 && (
              <div style={{ width: `${scrollbarWidth}px` }} className="shrink-0 bg-[#141414]" />
            )}
          </div>

          {/* ── Scrollable Tracks Area (Begins strictly BELOW the Time Ruler) ── */}
          <div
            ref={tracksScrollRef}
            onScroll={handleTracksScroll}
            onWheel={handleTimelineWheel}
            style={timelineHeight ? { height: `${timelineHeight}px`, maxHeight: `${timelineHeight}px` } : undefined}
            className={`min-w-0 w-full overflow-x-auto overflow-y-auto custom-scrollbar relative ${timelineHeight ? '' : timelineViewportHeight}`}
          >
            <div
              className="flex min-w-full"
              style={{
                width: `calc(${100 * timelineScale}% - ${trackHeadersWidth * timelineScale}px + ${trackHeadersWidth}px)`,
              }}
            >
              {/* ── Track Header Column with Overlaid Zero-Flow Splitter ── */}
              <div
                style={{ width: `${trackHeadersWidth}px` }}
                className="relative shrink-0 flex flex-col bg-[#141416]"
              >
                <TimelineTrackHeaders
                  trackOrder={trackOrder}
                  onMoveTrack={handleMoveTrack}
                  onReorderTracks={handleReorderTracks}
                  width={trackHeadersWidth}
                  showCornerHeader={false}
                  enabledTracks={enabledTracks}
                  selectedClip={selectedClip}
                  onSelectClip={handleSelectClip}
                  onSyncAudioAndCC={handleSyncAudioAndCC}
                  hasVoiceMismatch={hasAudioMismatch}
                  videoTrackVisible={videoTrackVisible}
                  onToggleVideoTrackVisible={() => setVideoTrackVisible(!videoTrackVisible)}
                  videoTrackHeight={videoTrackHeight}
                  videoMaxLane={videoMaxLane}
                  videoTrackMuted={videoTrackMuted}
                  onToggleVideoTrackMuted={() => {
                    const nextMuted = !videoTrackMuted;
                    setVideoTrackMuted(nextMuted);
                    window.dispatchEvent(
                      new CustomEvent('workspace:backdrop-audio', {
                        detail: { volume: nextMuted ? 0 : 100 },
                      })
                    );
                  }}
                  imageTrackVisible={imageTrackVisible}
                  onToggleImageTrackVisible={() => setImageTrackVisible(!imageTrackVisible)}
                  imageTrackHeight={imageTrackHeight}
                  imageMaxLane={imageMaxLane}
                  overlayTrackVisible={overlayTrackVisible}
                  onToggleOverlayTrackVisible={() => setOverlayTrackVisible(!overlayTrackVisible)}
                  overlayTrackHeight={overlayTrackHeight}
                  overlayMaxLane={overlayMaxLane}
                  captionsTrackLocked={captionsTrackLocked}
                  onToggleCaptionsTrackLocked={() => setCaptionsTrackLocked(!captionsTrackLocked)}
                  captionTrackHeight={captionTrackHeight}
                  captionMaxLane={captionMaxLane}
                  titleTrackHeight={titleTrackHeight}
                  titleTrackLocked={titleTrackLocked}
                  onToggleTitleTrackLocked={() => setTitleTrackLocked(!titleTrackLocked)}
                  voiceTrackMuted={voiceTrackMuted}
                  onToggleVoiceTrackMuted={() => setVoiceTrackMuted(!voiceTrackMuted)}
                  voiceTrackHeight={voiceTrackHeight}
                  voiceMaxLane={voiceMaxLane}
                  musicTrackMuted={musicTrackMuted}
                  onToggleMusicTrackMuted={() => setMusicTrackMuted(!musicTrackMuted)}
                  musicTrackHeight={musicTrackHeight}
                  musicMaxLane={musicMaxLane}
                  sfxTrackMuted={sfxTrackMuted}
                  onToggleSfxTrackMuted={() => setSfxTrackMuted(!sfxTrackMuted)}
                  sfxTrackHeight={sfxTrackHeight}
                  sfxMaxLane={sfxMaxLane}
                />

                {/* ── Resizable Splitter (Overlaid on right border - ZERO layout flow width) ── */}
                <div
                  role="separator"
                  aria-orientation="vertical"
                  onPointerDown={handleTrackHeadersResizeStart}
                  onDoubleClick={() => {
                    setTrackHeadersWidth(DEFAULT_TRACK_HEADERS_WIDTH);
                    try {
                      localStorage.setItem('apexmind:timeline-track-width', String(DEFAULT_TRACK_HEADERS_WIDTH));
                    } catch {}
                  }}
                  className={`absolute right-0 top-0 bottom-0 w-2 translate-x-1/2 z-50 cursor-col-resize group/col-resize flex items-center justify-center hover:bg-white/10 select-none transition-colors ${
                    isResizingTrackHeaders ? 'bg-white/20' : ''
                  }`}
                  title="Drag left/right to adjust track labels width (double-click to reset)"
                >
                  <div
                    className={`w-[2px] h-full transition-colors ${
                      isResizingTrackHeaders
                        ? 'bg-white'
                        : 'bg-transparent group-hover/col-resize:bg-white/70'
                    }`}
                  />
                </div>
              </div>

              {/* ── Timeline Tracks Area (Scrollable & Zoomable) ───── */}
              <div
                ref={tracksContainerRef}
                onPointerDown={handleTracksPointerDown}
                style={{ width: `${trackContentWidthPx}px` }}
                className="relative shrink-0 cursor-crosshair select-none"
              >


                {/* ── Dynamic Order Track Lanes ─────────────────────────────── */}
                {trackOrder.map((trackId) => renderTrackLane(trackId))}

                {/* ── Playhead indicator line across all tracks ────── */}
                <div
                  className="absolute top-0 bottom-0 pointer-events-none z-30 select-none w-0 flex justify-center"
                  style={{ left: `${progressPercent}%` }}
                >
                  <div className="w-[1.5px] h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)] shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioTimelinePane;
