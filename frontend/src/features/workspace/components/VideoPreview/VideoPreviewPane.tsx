import { Film, Sparkles } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GeneratedScript, VisualBackdrop, BackdropFilterSettings, ScriptSubtitle } from '../../types';
import { TimelineMediaClip, TimelineAudioClip, TimelineOverlayClip } from '../timeline/timelineTypes';
import { mediaCacheService } from '../../services/mediaCacheService';

// Timeline state broadcast from StudioTimelinePane
interface TimelineState {
  imageEnabled?: boolean;
  videoVisible: boolean;
  imageVisible: boolean;
  overlayVisible: boolean;
  captionsVisible: boolean;
  titleVisible: boolean;
  voiceMuted: boolean;
  musicMuted: boolean;
  sfxMuted?: boolean;
  videoStart: number;
  videoDuration: number;
  videoEnabled: boolean;
  overlayStart: number;
  overlayDuration: number;
  titleStart: number;
  titleDuration: number;
  imageStart?: number;
  imageDuration?: number;
  videoClips?: TimelineMediaClip[];
  imageClips?: TimelineMediaClip[];
  voiceClips?: TimelineAudioClip[];
  musicClips?: TimelineAudioClip[];
  sfxClips?: TimelineAudioClip[];
  overlayClips?: TimelineOverlayClip[];
  captionClips?: ScriptSubtitle[];
  selectedTrack?: string;
}

const DEFAULT_TIMELINE_STATE: TimelineState = {
  videoVisible: true,
  imageVisible: true,
  overlayVisible: true,
  captionsVisible: true,
  titleVisible: true,
  voiceMuted: false,
  musicMuted: false,
  videoStart: 0,
  videoDuration: 30,
  videoEnabled: true,
  imageEnabled: true,
  imageStart: 0,
  imageDuration: 8.0,
  overlayStart: 0,
  overlayDuration: 30,
  titleStart: 0,
  titleDuration: 30,
};

const getTransitionStyles = (type: string, progress: number): { styleA: React.CSSProperties; styleB: React.CSSProperties } => {
  const p = Math.max(0, Math.min(1, progress));

  switch (type) {
    case 'dissolve':
    case 'crossfade':
      return {
        styleA: { opacity: 1 - p },
        styleB: { opacity: p },
      };

    case 'fade-black':
      return {
        styleA: {
          opacity: p < 0.5 ? 1 : 0,
          filter: `brightness(${Math.max(0, (0.5 - p) * 2)})`,
        },
        styleB: {
          opacity: p >= 0.5 ? 1 : 0,
          filter: `brightness(${Math.max(0, (p - 0.5) * 2)})`,
        },
      };

    case 'fade-white':
      return {
        styleA: {
          opacity: p < 0.5 ? 1 : 0,
          filter: `brightness(${1 + p * 6})`,
        },
        styleB: {
          opacity: p >= 0.5 ? 1 : 0,
          filter: `brightness(${1 + (1 - p) * 6})`,
        },
      };

    case 'slide-left':
      return {
        styleA: { transform: `translateX(-${p * 100}%)` },
        styleB: { transform: `translateX(${(1 - p) * 100}%)` },
      };

    case 'slide-right':
      return {
        styleA: { transform: `translateX(${p * 100}%)` },
        styleB: { transform: `translateX(-${(1 - p) * 100}%)` },
      };

    case 'slide-up':
      return {
        styleA: { transform: `translateY(-${p * 100}%)` },
        styleB: { transform: `translateY(${(1 - p) * 100}%)` },
      };

    case 'slide-down':
      return {
        styleA: { transform: `translateY(${p * 100}%)` },
        styleB: { transform: `translateY(-${(1 - p) * 100}%)` },
      };

    case 'push-left':
      return {
        styleA: { transform: `translateX(-${p * 100}%)` },
        styleB: { transform: `translateX(${(1 - p) * 100}%)` },
      };

    case 'push-right':
      return {
        styleA: { transform: `translateX(${p * 100}%)` },
        styleB: { transform: `translateX(-${(1 - p) * 100}%)` },
      };

    case 'push-up':
      return {
        styleA: { transform: `translateY(-${p * 100}%)` },
        styleB: { transform: `translateY(${(1 - p) * 100}%)` },
      };

    case 'push-down':
      return {
        styleA: { transform: `translateY(${p * 100}%)` },
        styleB: { transform: `translateY(-${(1 - p) * 100}%)` },
      };

    case 'circle-wipe':
      return {
        styleA: { zIndex: 1 },
        styleB: {
          zIndex: 2,
          clipPath: `circle(${p * 150}% at 50% 50%)`,
          WebkitClipPath: `circle(${p * 150}% at 50% 50%)`,
        },
      };

    case 'split-reveal':
      return {
        styleA: { zIndex: 1 },
        styleB: {
          zIndex: 2,
          clipPath: `inset(0 ${(1 - p) * 50}% 0 ${(1 - p) * 50}%)`,
          WebkitClipPath: `inset(0 ${(1 - p) * 50}% 0 ${(1 - p) * 50}%)`,
        },
      };

    case 'zoom-in':
      return {
        styleA: { transform: `scale(${1 + p * 0.3})`, opacity: 1 - p },
        styleB: { transform: `scale(${0.7 + p * 0.3})`, opacity: p },
      };

    case 'zoom-out':
      return {
        styleA: { transform: `scale(${1 - p * 0.3})`, opacity: 1 - p },
        styleB: { transform: `scale(${1.3 - p * 0.3})`, opacity: p },
      };

    case 'smooth-zoom':
      return {
        styleA: { transform: `scale(${1 + p * 0.5})`, opacity: 1 - p * 0.8 },
        styleB: { transform: `scale(${0.6 + p * 0.4})`, opacity: p },
      };

    case 'soft-rotate':
      return {
        styleA: { transform: `rotate(-${p * 20}deg) scale(${1 - p * 0.2})`, opacity: 1 - p },
        styleB: { transform: `rotate(${(1 - p) * 20}deg) scale(${0.8 + p * 0.2})`, opacity: p },
      };

    case 'flash':
      return {
        styleA: {
          opacity: p < 0.5 ? 1 : 0,
          filter: `brightness(${1 + p * 8})`,
        },
        styleB: {
          opacity: p >= 0.5 ? 1 : 0,
          filter: `brightness(${1 + (1 - p) * 8})`,
        },
      };

    case 'blur-crossfade':
      return {
        styleA: { filter: `blur(${p * 16}px)`, opacity: 1 - p },
        styleB: { filter: `blur(${(1 - p) * 16}px)`, opacity: p },
      };

    case 'luma-fade':
      return {
        styleA: { filter: `contrast(${100 + p * 150}%) brightness(${Math.max(0, 1 - p * 1.5)})`, opacity: 1 - p },
        styleB: { filter: `contrast(${100 + (1 - p) * 150}%) brightness(${Math.min(1, p * 1.5)})`, opacity: p },
      };

    case 'rgb-split':
      return {
        styleA: { filter: `hue-rotate(${p * 120}deg) saturate(${100 + p * 100}%)`, opacity: 1 - p },
        styleB: { filter: `hue-rotate(${(1 - p) * -120}deg) saturate(${100 + (1 - p) * 100}%)`, opacity: p },
      };

    case 'whip-pan-left':
      return {
        styleA: { transform: `translateX(-${p * 120}%) skewX(${p * 12}deg)`, filter: `blur(${Math.sin(p * Math.PI) * 10}px)` },
        styleB: { transform: `translateX(${(1 - p) * 120}%) skewX(-${(1 - p) * 12}deg)`, filter: `blur(${Math.sin(p * Math.PI) * 10}px)` },
      };

    case 'whip-pan-right':
      return {
        styleA: { transform: `translateX(${p * 120}%) skewX(-${p * 12}deg)`, filter: `blur(${Math.sin(p * Math.PI) * 10}px)` },
        styleB: { transform: `translateX(${(1 - p) * 120}%) skewX(${(1 - p) * 12}deg)`, filter: `blur(${Math.sin(p * Math.PI) * 10}px)` },
      };

    default:
      return {
        styleA: { opacity: 1 - p },
        styleB: { opacity: p },
      };
  }
};

interface VideoPreviewPaneProps {
  script: GeneratedScript;
  activeBackdrop?: VisualBackdrop | null;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  playbackRate: number;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  onPlaybackRateChange: (rate: number) => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  isLooping?: boolean;
  onToggleLoop?: () => void;
  audioUrl?: string | null;
  musicUrl?: string | null;
  onApplyRecordedVoice?: (recordedUrl: string) => void;
  onUpdateScript?: (updated: Partial<GeneratedScript>) => void;
  onSelectBackdrop?: (backdropId: string) => void;
  backdrops?: VisualBackdrop[];
  voices?: { id: string; name: string; gender: 'Male' | 'Female'; style: string }[];
  selectedVoice?: string;
  onSelectVoice?: (voiceId: string) => void;
  onPublish?: () => void;
  canPublish?: boolean;
  publishing?: boolean;
  publishedSuccess?: boolean;
  customImageUrl?: string;
  customVideoUrl?: string;
  activeElementOverlay?: { type: string; value: string; label?: string; id?: string; name?: string } | null;
  captionPresetClass?: string;
  captionPresetColor?: string;
  captionPresetFontFamily?: string;
  captionPresetFontSize?: number;
  captionPresetFontWeight?: number;
  captionPresetTextTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  captionPresetPreviewText?: string;
  canvasAspectRatio?: '9:16' | '16:9' | '1:1' | '4:5' | '21:9';
  canvasOutputSize?: {
    aspectRatio: '9:16' | '16:9' | '1:1' | '4:5' | '21:9';
    width: number;
    height: number;
  };
  canvasBackground?: string;
  playbackDuration?: number;
  isExporting?: boolean;
  exportDuration?: number;
  exportFileName?: string;
  audioElement?: HTMLAudioElement | null;
  audioOutputStream?: MediaStream | null;
  onExportComplete?: (error?: string) => void;
}

// Backdrop-specific visual theme configs
const BACKDROP_THEMES: Record<string, {
  name: string;
  gradient: string;
  accentColor: string;
  titleShadow: string;
  imageUrl?: string;
}> = {
  v1: {
    name: 'Mountain Solitude',
    gradient: 'linear-gradient(180deg, #0a0f2c 0%, #111a45 30%, #1a0a3a 65%, #08070f 100%)',
    accentColor: '#3B82F6',
    titleShadow: '0 2px 10px rgba(0,0,0,0.9)',
  },
  v2: {
    name: 'Cyberpunk Neon',
    gradient: 'linear-gradient(180deg, #050d1a 0%, #0a1a35 30%, #120825 65%, #050508 100%)',
    accentColor: '#06B6D4',
    titleShadow: '0 2px 10px rgba(0,0,0,0.9)',
  },
  v3: {
    name: 'Ember Flame',
    gradient: 'linear-gradient(180deg, #160a02 0%, #291402 30%, #1c0a02 65%, #0a0500 100%)',
    accentColor: '#F59E0B',
    titleShadow: '0 2px 10px rgba(0,0,0,0.9)',
  },
  v4: {
    name: 'Teal Oceanic',
    gradient: 'linear-gradient(180deg, #010d18 0%, #021c2e 30%, #011420 65%, #010608 100%)',
    accentColor: '#2DD4BF',
    titleShadow: '0 2px 10px rgba(0,0,0,0.9)',
  },
};

export const VideoPreviewPane: React.FC<VideoPreviewPaneProps> = ({
  script,
  activeBackdrop,
  isPlaying,
  onTogglePlay,
  isMuted = false,
  onToggleMute = () => {},
  volume = 1,
  playbackRate = 1,
  onVolumeChange = () => {},
  currentTime,
  duration = 0,
  onSeek = () => {},
  isLooping = false,
  onToggleLoop,
  onApplyRecordedVoice,
  onUpdateScript,
  onSelectBackdrop,
  customImageUrl,
  customVideoUrl,
  activeElementOverlay,
  captionPresetClass,
  captionPresetColor,
  captionPresetFontFamily,
  captionPresetFontSize,
  captionPresetFontWeight,
  captionPresetTextTransform,
  captionPresetPreviewText,
  canvasAspectRatio = '9:16',
  canvasOutputSize,
  canvasBackground,
  playbackDuration,
  isExporting = false,
  exportDuration = 30,
  exportFileName = 'apexmind-video',
  audioUrl,
  musicUrl,
  audioElement,
  audioOutputStream,
  onExportComplete,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasFrameRef = useRef<HTMLDivElement>(null);
  const [canvasFrameSize, setCanvasFrameSize] = useState({ width: 0, height: 0 });
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const transitionVideoRef = useRef<HTMLVideoElement | null>(null);

  const [selectedLayer, setSelectedLayer] = useState<'subtitle' | 'title' | 'overlay' | 'backdrop' | null>(null);
  const [backdropFlipH, setBackdropFlipH] = useState(false);
  const [backdropFlipV, setBackdropFlipV] = useState(false);
  const [backdropRotation, setBackdropRotation] = useState(0);
  const [backdropScale, setBackdropScale] = useState(100);
  const [backdropPosX, setBackdropPosX] = useState(50);
  const [backdropPosY, setBackdropPosY] = useState(50);
  const [backdropFitMode, setBackdropFitMode] = useState<'fill' | 'fit' | 'crop'>('fill');
  const [backdropAnimation, setBackdropAnimation] = useState('none');
  const [videoTrackVolume, setVideoTrackVolume] = useState(0);
  const [captionStyle, setCaptionStyle] = useState({
    text: '',
    overridePreset: false,
    color: '#FFFFFF',
    fontFamily: 'Roboto',
    fontWeight: 'Medium',
    fontSize: 60,
    textAlign: 'center' as 'left' | 'center' | 'right' | 'justify',
    textTransform: 'uppercase' as 'none' | 'uppercase' | 'lowercase' | 'capitalize',
    isBold: true,
    isItalic: false,
    isUnderline: false,
    isStrikethrough: false,
    stroke: true,
    strokeColor: '#000000',
    strokeWidth: 2,
    dropShadow: true,
    shadowColor: '#000000',
    shadowBlur: 12,
    neonGlow: false,
    glowColor: '#3B82F6',
    letterSpacing: 0,
    lineHeight: 1.2,
    background: 'transparent',
    bgRadius: 8,
    bgPadding: 8,
    opacity: 100,
    posX: 50,
    posY: 76, // 9:16 viral safe zone sweet spot (avoids TikTok / Shorts UI clipping while staying prominent)
    customWidth: undefined as number | undefined,
    duration: 2.2,
  });
  const [overlayStyle, setOverlayStyle] = useState<{
    fitMode: 'fit' | 'fill';
    flipH: boolean;
    flipV: boolean;
    rotation: number;
    scale: number;
    posX: number;
    posY: number;
    accentColor: string;
    opacity: number;
    duration: number;
  }>({
    fitMode: 'fit' as const,
    flipH: false,
    flipV: false,
    rotation: 0,
    scale: 100,
    posX: 50,
    posY: 65,
    accentColor: '#3B82F6',
    opacity: 100,
    duration: 5,
  });

  // ── Timeline state (live sync from StudioTimelinePane events) ─────────
  const [timelineState, setTimelineState] = useState<TimelineState>(DEFAULT_TIMELINE_STATE);

  useEffect(() => {
    const frame = canvasFrameRef.current;
    if (!frame) return;

    const updateFrameSize = () => {
      const { width, height } = frame.getBoundingClientRect();
      setCanvasFrameSize((current) =>
        Math.abs(current.width - width) < 0.5 && Math.abs(current.height - height) < 0.5
          ? current
          : { width, height }
      );
    };

    updateFrameSize();
    const observer = new ResizeObserver(updateFrameSize);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isExporting) return;

    let cancelled = false;
    let recorder: MediaRecorder | null = null;
    let outputStream: MediaStream | null = null;

    const exportVideo = async () => {
      try {
        const preview = canvasRef.current;
        if (!preview) throw new Error('The video preview is not available.');

        // Broad cross-browser MIME type negotiation
        // Fast check: Try direct native FFmpeg render from backend first for pristine 60/30fps and full audio
        try {
          window.dispatchEvent(new CustomEvent('workspace:export-state', {
            detail: { exporting: true, message: 'Rendering broadcast-quality Full HD video with FFmpeg...' },
          }));

          const maxSubEnd = Math.max(
            0,
            ...(script.subtitles || []).map((s) => (Number(s.start) || 0) + (Number(s.duration) || 2.5))
          );
          const fullRenderDuration = Math.max(
            Number(exportDuration) || 0,
            Number(duration) || 0,
            Number(playbackDuration) || 0,
            maxSubEnd,
            15
          );

          const renderPayload = {
            title: script.title || exportFileName || 'apexmind-video',
            aspectRatio: canvasAspectRatio,
            duration: fullRenderDuration,
            audioUrl: audioUrl || null,
            musicUrl: musicUrl || null,
            backdropUrl: customVideoUrl || customImageUrl || activeBackdrop?.imageUrl || null,
            backdropType: customVideoUrl ? 'video' : 'image',
            subtitles: (script.subtitles || []).map((s) => ({
              start: s.start,
              duration: s.duration,
              text: s.text,
            })),
            captionColor: captionPresetColor || '#FACC15',
          };

          const res = await fetch('/api/workspace/render-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(renderPayload),
          });

          if (res.ok) {
            const result = await res.json();
            if (result.success && result.videoUrl) {
              const link = document.createElement('a');
              link.href = result.videoUrl;
              link.download = result.filename || `${renderPayload.title}.mp4`;
              document.body.appendChild(link);
              link.click();
              link.remove();
              onExportComplete?.();
              return;
            }
          }
        } catch (serverErr) {
          console.warn('Server FFmpeg render unavailable, using browser capture:', serverErr);
        }

        // Broad cross-browser MIME type negotiation (prefer VP9/Opus which preserves audio)
        const candidateTypes = [
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=h264,opus',
          'video/webm',
          'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
          'video/mp4;codecs=h264,aac',
          'video/mp4',
        ];
        let mimeType = '';
        if (typeof MediaRecorder !== 'undefined') {
          for (const t of candidateTypes) {
            if (MediaRecorder.isTypeSupported(t)) {
              mimeType = t;
              break;
            }
          }
        }
        if (!mimeType) {
          throw new Error('Video recording is not supported by your browser.');
        }

        const defaultDimensions = {
          '9:16': { width: 1080, height: 1920 },
          '16:9': { width: 1920, height: 1080 },
          '1:1': { width: 1080, height: 1080 },
          '4:5': { width: 1080, height: 1350 },
          '21:9': { width: 1920, height: 823 },
        }[canvasAspectRatio] || { width: 1080, height: 1920 };

        const dimensions = defaultDimensions;
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = dimensions.width;
        outputCanvas.height = dimensions.height;
        const context = outputCanvas.getContext('2d', { alpha: false });
        if (!context) throw new Error('Could not create video render canvas.');

        // Direct frame compositor: never empty, draws media + cinematic backdrop + titles + captions
        const captureFrame = (renderTimeSec: number) => {
          let drewMedia = false;

          // 1. Draw active video frame with proper object-fit: cover aspect scaling
          const videoEl = videoElementRef.current;
          if (videoEl && videoEl.readyState >= 2 && videoEl.videoWidth > 0) {
            try {
              const vW = videoEl.videoWidth;
              const vH = videoEl.videoHeight;
              const targetRatio = dimensions.width / dimensions.height;
              const sourceRatio = vW / vH;
              let sx = 0, sy = 0, sWidth = vW, sHeight = vH;
              if (sourceRatio > targetRatio) {
                sWidth = vH * targetRatio;
                sx = (vW - sWidth) / 2;
              } else {
                sHeight = vW / targetRatio;
                sy = (vH - sHeight) / 2;
              }
              context.drawImage(videoEl, sx, sy, sWidth, sHeight, 0, 0, dimensions.width, dimensions.height);
              drewMedia = true;
            } catch {}
          }

          // 2. Draw active image backdrop with proper object-fit: cover aspect scaling
          if (!drewMedia) {
            const imgEl = preview.querySelector('img');
            if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
              try {
                const iW = imgEl.naturalWidth;
                const iH = imgEl.naturalHeight;
                const targetRatio = dimensions.width / dimensions.height;
                const sourceRatio = iW / iH;
                let sx = 0, sy = 0, sWidth = iW, sHeight = iH;
                if (sourceRatio > targetRatio) {
                  sWidth = iH * targetRatio;
                  sx = (iW - sWidth) / 2;
                } else {
                  sHeight = iW / targetRatio;
                  sy = (iH - sHeight) / 2;
                }
                context.drawImage(imgEl, sx, sy, sWidth, sHeight, 0, 0, dimensions.width, dimensions.height);
                drewMedia = true;
              } catch {}
            }
          }

          // 3. Fallback: Draw rich studio gradient backdrop so frame is NEVER black
          if (!drewMedia) {
            const grad = context.createLinearGradient(0, 0, 0, dimensions.height);
            grad.addColorStop(0, '#0F172A');
            grad.addColorStop(0.45, '#1E1B4B');
            grad.addColorStop(1, '#020617');
            context.fillStyle = grad;
            context.fillRect(0, 0, dimensions.width, dimensions.height);

            const radial = context.createRadialGradient(
              dimensions.width / 2, dimensions.height / 2, 40,
              dimensions.width / 2, dimensions.height / 2, dimensions.width * 0.75
            );
            radial.addColorStop(0, 'rgba(59, 130, 246, 0.22)');
            radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
            context.fillStyle = radial;
            context.fillRect(0, 0, dimensions.width, dimensions.height);
          }

          // 4. Subtle Vignette
          const gradVignette = context.createRadialGradient(
            dimensions.width / 2, dimensions.height / 2, dimensions.width * 0.35,
            dimensions.width / 2, dimensions.height / 2, dimensions.width * 0.82
          );
          gradVignette.addColorStop(0, 'transparent');
          gradVignette.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
          context.fillStyle = gradVignette;
          context.fillRect(0, 0, dimensions.width, dimensions.height);

          // 5. Draw Title Pill (visible during first 3.5 seconds)
          if (script.title && renderTimeSec < 3.5) {
            context.save();
            const titleFontSize = Math.round(dimensions.width * 0.046);
            context.font = `800 ${titleFontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            const titleY = dimensions.height * 0.16;
            const metrics = context.measureText(script.title);
            const pillW = Math.min(dimensions.width * 0.9, metrics.width + 48);
            const pillH = titleFontSize + 24;

            // Broadcast title: thick black border around font, no box panel
            context.lineWidth = Math.max(5, Math.round(titleFontSize * 0.14));
            context.strokeStyle = '#000000';
            context.lineJoin = 'round';
            context.miterLimit = 2;
            context.shadowColor = 'rgba(0, 0, 0, 0.95)';
            context.shadowBlur = 12;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 3;
            context.strokeText(script.title, dimensions.width / 2, titleY, dimensions.width * 0.9);

            context.fillStyle = '#FFFFFF';
            context.fillText(script.title, dimensions.width / 2, titleY, dimensions.width * 0.9);
            context.restore();
          }

          // 6. Draw Caption / Subtitle Text matched to renderTimeSec
          const activeSub = (script.subtitles || []).find(
            (s) => renderTimeSec >= s.start && renderTimeSec <= s.start + (s.duration || 3)
          );
          const captionText = activeSub ? activeSub.text : '';

          if (captionText) {
            context.save();
            const capFontSize = Math.round(dimensions.width * 0.065);
            context.font = `900 ${capFontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            const capY = dimensions.height * 0.76;

            const metrics = context.measureText(captionText);
            const pillW = Math.min(dimensions.width * 0.92, metrics.width + 56);
            const pillH = capFontSize + 32;

            // Broadcast subtitle: thick black outline (border) around font, no box panel
            context.lineWidth = Math.max(6, Math.round(capFontSize * 0.16));
            context.strokeStyle = '#000000';
            context.lineJoin = 'round';
            context.miterLimit = 2;
            context.shadowColor = 'rgba(0, 0, 0, 0.95)';
            context.shadowBlur = 14;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 4;
            context.strokeText(captionText, dimensions.width / 2, capY, dimensions.width * 0.92);

            context.fillStyle = captionPresetColor || '#FACC15'; // Gold / vibrant highlight
            context.fillText(captionText, dimensions.width / 2, capY, dimensions.width * 0.92);
            context.restore();
          }
        };

        captureFrame(0);
        outputStream = outputCanvas.captureStream(30);

        // Attach audio tracks safely
        try {
          const captureAudio = audioElement as (HTMLAudioElement & {
            captureStream?: () => MediaStream;
            mozCaptureStream?: () => MediaStream;
          }) | null | undefined;
          const audioStream = audioOutputStream ?? captureAudio?.captureStream?.() ?? captureAudio?.mozCaptureStream?.();
          audioStream?.getAudioTracks().forEach((track) => {
            try {
              outputStream?.addTrack(track);
            } catch {}
          });
        } catch {}

        const chunks: BlobPart[] = [];
        recorder = new MediaRecorder(outputStream, {
          mimeType,
          videoBitsPerSecond: 10_000_000,
          audioBitsPerSecond: 192_000,
        });

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) chunks.push(event.data);
        };

        recorder.onstop = async () => {
          if (cancelled) return;
          const blob = new Blob(chunks, { type: mimeType });
          if (blob.size === 0) {
            onExportComplete?.('Rendered video was empty.');
            return;
          }

          const safeName = exportFileName.trim().replace(/[<>:"/\\|?*]+/g, '').slice(0, 80) || 'apexmind-video';

          // If browser recorded WebM, transcode to broadcast MP4 with FFmpeg via backend
          if (mimeType.includes('webm')) {
            try {
              window.dispatchEvent(new CustomEvent('workspace:export-state', {
                detail: { exporting: true, message: 'Finalizing pristine MP4...' },
              }));
              const formData = new FormData();
              formData.append('file', blob, 'video.webm');
              formData.append('filename', safeName);
              const convRes = await fetch('/api/workspace/convert-to-mp4', {
                method: 'POST',
                body: formData,
              });
              if (convRes.ok) {
                const convData = await convRes.json();
                if (convData.videoUrl) {
                  const link = document.createElement('a');
                  link.href = convData.videoUrl;
                  link.download = convData.filename || `${safeName}.mp4`;
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  onExportComplete?.();
                  return;
                }
              }
            } catch (convErr) {
              console.warn('Backend MP4 transcode failed, downloading direct file:', convErr);
            }
          }

          const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
          const link = document.createElement('a');
          const downloadUrl = URL.createObjectURL(blob);
          link.href = downloadUrl;
          link.download = `${safeName}.${ext}`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
          onExportComplete?.();
        };

        recorder.onerror = () => {
          if (!cancelled) onExportComplete?.('Recording error in browser encoder.');
        };

        recorder.start(500);

        const exportStartedAt = performance.now();
        const maxSubEnd = Math.max(
          0,
          ...(script.subtitles || []).map((s) => (Number(s.start) || 0) + (Number(s.duration) || 2.5))
        );
        const effectiveDuration = Math.max(
          Number(exportDuration) || 0,
          Number(duration) || 0,
          Number(playbackDuration) || 0,
          maxSubEnd,
          15
        );
        const exportLength = Math.max(1, effectiveDuration) * 1000;
        let lastReportedPercent = 0;

        while (!cancelled && performance.now() - exportStartedAt < exportLength) {
          const elapsed = performance.now() - exportStartedAt;
          const renderTimeSec = elapsed / 1000;
          captureFrame(renderTimeSec);

          const pct = Math.min(99, Math.round((elapsed / exportLength) * 100));
          if (pct > lastReportedPercent + 4) {
            lastReportedPercent = pct;
            window.dispatchEvent(new CustomEvent('workspace:export-state', {
              detail: { exporting: true, message: `Rendering ${pct}%...` },
            }));
          }

          // Natively request frame capture on stream
          const videoTrack = outputStream?.getVideoTracks()[0] as any;
          if (videoTrack?.requestFrame) {
            try { videoTrack.requestFrame(); } catch {}
          }

          await new Promise((resolve) => window.setTimeout(resolve, 1000 / 24));
        }

        if (!cancelled && recorder && recorder.state === 'recording') {
          try {
            recorder.requestData();
          } catch {}
          recorder.stop();
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Video export failed.';
          onExportComplete?.(message);
        }
      }
    };

    void exportVideo();
    return () => {
      cancelled = true;
      if (recorder?.state === 'recording') recorder.stop();
      outputStream?.getTracks().forEach((track) => track.stop());
    };
  }, [audioUrl, musicUrl, audioElement, audioOutputStream, canvasAspectRatio, canvasOutputSize, exportDuration, exportFileName, isExporting, onExportComplete, script]);

  useEffect(() => {
    const handleTimelineState = (e: Event) => {
      const detail = (e as CustomEvent<Partial<TimelineState>>).detail;
      if (detail) {
        setTimelineState((prev) => ({ ...prev, ...detail }));
      }
    };
    window.addEventListener('workspace:timeline-state', handleTimelineState);
    return () => window.removeEventListener('workspace:timeline-state', handleTimelineState);
  }, []);

  // Listen directly for clip property/transition changes so preview responds instantly
  useEffect(() => {
    const handleClipPropUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      if (detail.transition !== undefined || detail.transitionDuration !== undefined) {
        setTimelineState((prev) => {
          const updatedClips = (prev.videoClips || []).map((c) => {
            if (detail.applyToAll || (detail.clipId && c.id === detail.clipId)) {
              return {
                ...c,
                transition: detail.transition ?? c.transition,
                transitionDuration: detail.transitionDuration ?? c.transitionDuration,
              };
            }
            return c;
          });
          return { ...prev, videoClips: updatedClips };
        });
      }
    };
    window.addEventListener('workspace:update-clip-props', handleClipPropUpdate);
    window.addEventListener('workspace:update-clip-properties', handleClipPropUpdate);
    return () => {
      window.removeEventListener('workspace:update-clip-props', handleClipPropUpdate);
      window.removeEventListener('workspace:update-clip-properties', handleClipPropUpdate);
    };
  }, []);

  const isCustomImage = Boolean(customImageUrl);
  const isCustomVideo = Boolean(customVideoUrl);

  // Active clip resolution based on currentTime (exact bounds with graceful fallback)
  const activeVideoClip = (timelineState.videoClips || []).find((c) => {
    const start = Number(c.start) || 0;
    const dur = Number(c.duration) || 3;
    return currentTime >= start && currentTime < start + dur;
  }) || (timelineState.videoClips || []).filter((c) => currentTime >= (Number(c.start) || 0)).slice(-1)[0]
    || (timelineState.videoClips && timelineState.videoClips[0]);

  const activeImageClip = (timelineState.imageClips || []).find((c) => {
    const start = Number(c.start) || 0;
    const dur = Number(c.duration) || 3;
    return currentTime >= start - 0.05 && currentTime < start + dur + 0.05;
  }) || (timelineState.imageClips || []).reduce<any>((closest, c) => {
    if (currentTime >= c.start && (!closest || c.start > closest.start)) return c;
    return closest;
  }, undefined) || (timelineState.imageClips && timelineState.imageClips[0]);

  // Detect if playhead is currently within an active cut transition between two video clips
  const activeTransition = useMemo(() => {
    const clips = (timelineState.videoClips || []).slice().sort((a, b) => (Number(a.start) || 0) - (Number(b.start) || 0));
    if (clips.length < 2) return null;

    for (let i = 0; i < clips.length - 1; i++) {
      const clipA = clips[i];
      const clipB = clips[i + 1];
      const transType = (clipA.transition && clipA.transition !== 'none') ? clipA.transition : ((clipB.transition && clipB.transition !== 'none') ? clipB.transition : null);
      if (!transType || transType === 'none') continue;

      const cutTime = (Number(clipB.start) !== undefined && Number(clipB.start) > 0) ? Number(clipB.start) : ((Number(clipA.start) || 0) + (Number(clipA.duration) || 3));
      const transDuration = Math.max(0.1, Math.min(Number(clipA.transitionDuration || clipB.transitionDuration) || 0.5, 2.0));
      const transStart = cutTime - transDuration / 2;
      const transEnd = cutTime + transDuration / 2;

      if (currentTime >= transStart && currentTime <= transEnd) {
        const progress = Math.max(0, Math.min(1, (currentTime - transStart) / transDuration));
        return {
          isActive: true,
          type: transType,
          duration: transDuration,
          progress,
          clipA,
          clipB,
          cutTime,
        };
      }
    }
    return null;
  }, [timelineState.videoClips, currentTime]);

  const activeOverlayClip = (timelineState.overlayClips || [])
    .filter((c) => currentTime >= c.start && currentTime <= c.start + c.duration)
    .slice(-1)[0];

  const effectiveOverlay = activeOverlayClip
    ? {
        type: activeOverlayClip.type,
        value: activeOverlayClip.value,
        label: activeOverlayClip.label,
        name: activeOverlayClip.name,
      }
    : activeElementOverlay;

  // Track enabled & visible states
  const videoEnabled = timelineState.videoVisible !== false && timelineState.videoEnabled !== false;
  const imageEnabled = timelineState.imageVisible !== false && timelineState.imageEnabled !== false;
  const overlayEnabled = timelineState.overlayVisible !== false;
  const titleEnabled = timelineState.titleVisible !== false;
  const captionsEnabled = timelineState.captionsVisible !== false;

  // ── Frame-Accurate Playhead Sync: Check which clip is active under currentTime ──
  const isVideoTimeActive = videoEnabled && (
    (Array.isArray(timelineState.videoClips) && timelineState.videoClips.length > 0)
      ? Boolean(activeVideoClip?.url || script.storyboard?.some((s) => s.mediaUrl))
      : (
          currentTime >= timelineState.videoStart &&
          currentTime <= (timelineState.videoStart + (timelineState.videoDuration || 30))
        )
  );

  const imageStart = timelineState.imageStart ?? 0;
  const imageDuration = timelineState.imageDuration ?? 30;
  const isImageTimeActive = imageEnabled && (
    (Array.isArray(timelineState.imageClips) && timelineState.imageClips.length > 0)
      ? Boolean(activeImageClip?.url)
      : (
          currentTime >= imageStart &&
          currentTime <= (imageStart + imageDuration)
        )
  );

  const isOverlayTimeActive = Boolean(activeOverlayClip) || (
    currentTime >= timelineState.overlayStart &&
    currentTime <= (timelineState.overlayStart + Math.min(timelineState.overlayDuration, overlayStyle.duration))
  );

  const isTitleTimeActive = currentTime >= timelineState.titleStart &&
    currentTime <= (timelineState.titleStart + timelineState.titleDuration);


  const handleSelectLayer = (e: React.MouseEvent, layer: 'subtitle' | 'title' | 'overlay' | 'backdrop') => {
    e.stopPropagation();
    setSelectedLayer(layer);
    if (layer === 'backdrop') {
      window.dispatchEvent(new CustomEvent('workspace:select-compound', {
        detail: { compound: 'video', openInspector: true },
      }));
    }
    if (layer === 'subtitle') {
      window.dispatchEvent(new CustomEvent('workspace:select-compound', {
        detail: { compound: 'text', openInspector: true },
      }));
    }
    if (layer === 'title') {
      window.dispatchEvent(new CustomEvent('workspace:select-compound', {
        detail: { compound: 'text', openInspector: true },
      }));
    }
    if (layer === 'overlay') {
      window.dispatchEvent(new CustomEvent('workspace:select-compound', {
        detail: { compound: 'overlay', openInspector: true },
      }));
    }
  };

  const handleResetBackdrop = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (backdropRef.current) {
      backdropRef.current.style.transform = '';
      backdropRef.current.style.width = '';
      backdropRef.current.style.height = '';
      backdropRef.current.style.top = '';
      backdropRef.current.style.left = '';
    }
    setBackdropFlipH(false);
    setBackdropFlipV(false);
    setBackdropRotation(0);
    setBackdropFitMode('fill');
  };

  const handleFitBackdrop = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (backdropRef.current && canvasRef.current) {
      const cw = canvasRef.current.clientWidth;
      const ch = canvasRef.current.clientHeight;
      const targetW = Math.round(cw * 0.82);
      const targetH = Math.round(ch * 0.82);
      const left = Math.round((cw - targetW) / 2);
      const top = Math.round((ch - targetH) / 2);
      backdropRef.current.style.transform = `translate(${left}px, ${top}px)`;
      backdropRef.current.style.width = `${targetW}px`;
      backdropRef.current.style.height = `${targetH}px`;
      backdropRef.current.style.top = '0px';
      backdropRef.current.style.left = '0px';
      setBackdropFitMode('fit');
    }
  };

  // Press Escape or dispatch deselect-layer to deselect active layer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedLayer(null);
      }
    };
    const handleDeselect = () => {
      setSelectedLayer(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('workspace:deselect-layer', handleDeselect);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('workspace:deselect-layer', handleDeselect);
    };
  }, []);


  const [isVideoBuffering, setIsVideoBuffering] = useState<boolean>(false);
  const [captionColor] = useState<string>('#FFFFFF');
  const [captionSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('lg');

  const [filterSettings, setFilterSettings] = useState<BackdropFilterSettings>({
    brightness: 100,
    contrast: 100,
    saturate: 100,
    vignette: 0,
    hue: 0,
    blur: 0,
    grain: false,
    activeOverlay: 'none',
    lut: 'none',
    lutIntensity: 80,
    presetFilter: 'none',
  });
  const [perClipFilters, setPerClipFilters] = useState<Record<string, BackdropFilterSettings>>({});
  const [perClipTransforms, setPerClipTransforms] = useState<Record<string, any>>({});
  const [perClipAnimations, setPerClipAnimations] = useState<Record<string, string>>({});

  // Listen for backdrop transform and filter changes from inspectors
  useEffect(() => {
    const handleTransform = (e: Event) => {
      const customEvent = e as CustomEvent<{
        fitMode?: 'fill' | 'fit' | 'crop';
        flipH?: boolean;
        flipV?: boolean;
        rotation?: number;
        scale?: number;
        posX?: number;
        posY?: number;
        reset?: boolean;
      }>;
      const detail = customEvent.detail;
      if (!detail) return;

      if (detail.reset || detail.fitMode === 'fill') {
        handleResetBackdrop();
      } else if (detail.fitMode === 'fit') {
        handleFitBackdrop();
      }
      if (detail.flipH !== undefined) setBackdropFlipH(detail.flipH);
      if (detail.flipV !== undefined) setBackdropFlipV(detail.flipV);
      if (detail.rotation !== undefined) setBackdropRotation(detail.rotation);
      if (detail.scale !== undefined) setBackdropScale(detail.scale);
      if (detail.posX !== undefined) setBackdropPosX(detail.posX);
      if (detail.posY !== undefined) setBackdropPosY(detail.posY);
      if (detail.fitMode) setBackdropFitMode(detail.fitMode);
    };

    const handleFilter = (e: Event) => {
      const customEvent = e as CustomEvent<Partial<BackdropFilterSettings>>;
      if (customEvent.detail) {
        setFilterSettings((prev) => ({ ...prev, ...customEvent.detail }));
      }
    };
    const handleCaptionStyle = (e: Event) => {
      const detail = (e as CustomEvent<Partial<typeof captionStyle> & { cueIndex?: number | null }>).detail;
      if (!detail) return;
      // Do not mutate global captionStyle if this is an isolated single cue change
      if (typeof detail.cueIndex === 'number') {
        return;
      }
      setCaptionStyle((prev) => ({ ...prev, ...detail }));
    };
    const handleOverlayStyle = (e: Event) => {
      const detail = (e as CustomEvent<Partial<typeof overlayStyle>>).detail;
      if (detail) setOverlayStyle((prev) => ({ ...prev, ...detail }));
    };
    const handleBackdropAnimation = (e: Event) => {
      const detail = (e as CustomEvent<{ animation: string; clipId?: string }>).detail;
      if (detail) {
        if (detail.clipId) {
          setPerClipAnimations((prev) => ({ ...prev, [detail.clipId!]: detail.animation }));
        } else {
          setBackdropAnimation(detail.animation);
        }
      }
    };
    const handleVideoVolume = (e: Event) => {
      const detail = (e as CustomEvent<{ volume: number }>).detail;
      if (detail) setVideoTrackVolume(Math.min(100, Math.max(0, detail.volume)));
    };

    window.addEventListener('workspace:backdrop-transform', handleTransform);
    window.addEventListener('workspace:backdrop-filter', handleFilter);
    window.addEventListener('workspace:caption-style-change', handleCaptionStyle);
    window.addEventListener('workspace:overlay-style-change', handleOverlayStyle);
    window.addEventListener('workspace:backdrop-animation', handleBackdropAnimation);
    window.addEventListener('workspace:backdrop-audio', handleVideoVolume);
    return () => {
      window.removeEventListener('workspace:backdrop-transform', handleTransform);
      window.removeEventListener('workspace:backdrop-filter', handleFilter);
      window.removeEventListener('workspace:caption-style-change', handleCaptionStyle);
      window.removeEventListener('workspace:overlay-style-change', handleOverlayStyle);
      window.removeEventListener('workspace:backdrop-animation', handleBackdropAnimation);
      window.removeEventListener('workspace:backdrop-audio', handleVideoVolume);
    };
  }, []);

  const theme = (activeBackdrop?.id && BACKDROP_THEMES[activeBackdrop.id]) || null;
  const activeStoryboardVideo = (script.storyboard || []).find(
    (sc) => currentTime >= sc.start && currentTime <= sc.start + (sc.duration || 3) && sc.mediaType === 'video' && sc.mediaUrl
  )?.mediaUrl || (script.storyboard && script.storyboard[0]?.mediaType === 'video' ? script.storyboard[0]?.mediaUrl : undefined);

  const activeStoryboardImage = (script.storyboard || []).find(
    (sc) => currentTime >= sc.start && currentTime <= sc.start + (sc.duration || 3) && sc.mediaType === 'image' && sc.mediaUrl
  )?.mediaUrl || (script.storyboard && script.storyboard[0]?.mediaType === 'image' ? script.storyboard[0]?.mediaUrl : undefined);

  const activeVideo = !videoEnabled
    ? undefined
    : (activeVideoClip && activeVideoClip.url)
      ? activeVideoClip.url
      : (activeStoryboardVideo
          ? activeStoryboardVideo
          : (isCustomVideo
              ? customVideoUrl
              : (!isCustomImage
                  ? activeBackdrop?.videoUrl
                  : undefined)));

  const activeImage = !imageEnabled
    ? undefined
    : (activeImageClip && activeImageClip.url)
      ? activeImageClip.url
      : (activeStoryboardImage
          ? activeStoryboardImage
          : (isCustomImage
              ? customImageUrl
              : (!isCustomVideo
                  ? (filterSettings.customImageUrl || activeBackdrop?.imageUrl || undefined)
                  : undefined)));

  // Determine whether video or image layer is shown under the current playhead
  const showVideoLayer = ((Boolean(activeVideo) && isVideoTimeActive) || Boolean(activeTransition)) && videoEnabled;
  const showImageLayer = Boolean(activeImage) && imageEnabled && isImageTimeActive;

  const isSeekingOrSwitchingRef = useRef(false);
  const currentTimeRef = useRef(currentTime);
  currentTimeRef.current = currentTime;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const activeVideoClipRef = useRef(activeVideoClip);
  activeVideoClipRef.current = activeVideoClip;
  const bufferingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced buffering state so quick frame loads don't flash the loading spinner
  const handleWaiting = () => {
    if (bufferingTimeoutRef.current) clearTimeout(bufferingTimeoutRef.current);
    bufferingTimeoutRef.current = setTimeout(() => {
      setIsVideoBuffering(true);
    }, 450);
  };

  const handlePlayingOrCanPlay = () => {
    if (bufferingTimeoutRef.current) {
      clearTimeout(bufferingTimeoutRef.current);
      bufferingTimeoutRef.current = null;
    }
    setIsVideoBuffering(false);
  };

  // Next upcoming clip for background preloading
  const currentClipIndex = (timelineState.videoClips || []).findIndex(
    (c) => c.url === activeVideo || (c.start <= currentTime && currentTime < c.start + (c.duration || 3))
  );
  const nextVideoClip = currentClipIndex >= 0 && timelineState.videoClips
    ? timelineState.videoClips[currentClipIndex + 1]
    : undefined;

  const currentVideoSrc = activeTransition ? (activeTransition.clipA?.url || activeVideo) : activeVideo;
  const transitionVideoSrc = activeTransition?.clipB?.url;

  // Media Cache Engine: Resolve remote URLs into local zero-latency ObjectURLs (blob:)
  const [cachedVideoSrc, setCachedVideoSrc] = useState<string>(currentVideoSrc || '');
  const [cachedTransitionSrc, setCachedTransitionSrc] = useState<string>(transitionVideoSrc || '');

  // Proactively prefetch upcoming timeline clips into CacheStorage
  useEffect(() => {
    const prefetchList: string[] = [];
    if (currentVideoSrc) prefetchList.push(currentVideoSrc);
    if (transitionVideoSrc) prefetchList.push(transitionVideoSrc);
    if (nextVideoClip?.url) prefetchList.push(nextVideoClip.url);
    if (timelineState.videoClips) {
      for (const c of timelineState.videoClips) {
        if (c.url) prefetchList.push(c.url);
      }
    }
    if (prefetchList.length > 0) {
      mediaCacheService.preloadMedia(prefetchList);
    }
  }, [currentVideoSrc, transitionVideoSrc, nextVideoClip?.url, timelineState.videoClips]);

  // Resolve main video source
  useEffect(() => {
    let isCurrent = true;
    if (!currentVideoSrc) {
      setCachedVideoSrc('');
      return;
    }
    mediaCacheService.getCachedMediaUrl(currentVideoSrc).then((resolved) => {
      if (isCurrent && resolved) {
        setCachedVideoSrc(resolved);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [currentVideoSrc]);

  // Resolve transition incoming Clip B source
  useEffect(() => {
    let isCurrent = true;
    if (!transitionVideoSrc) {
      setCachedTransitionSrc('');
      return;
    }
    mediaCacheService.getCachedMediaUrl(transitionVideoSrc).then((resolved) => {
      if (isCurrent && resolved) {
        setCachedTransitionSrc(resolved);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [transitionVideoSrc]);

  const effectiveVideoSrc = cachedVideoSrc || currentVideoSrc;
  const effectiveTransitionSrc = cachedTransitionSrc || transitionVideoSrc;

  // Auto-reload video element only when active source changes
  useEffect(() => {
    const video = videoElementRef.current;
    if (!video || !effectiveVideoSrc) return;
    const currentAttr = video.getAttribute('src');
    if (currentAttr === effectiveVideoSrc) return;
    try {
      if (new URL(effectiveVideoSrc, window.location.href).href === video.src) return;
    } catch {}

    isSeekingOrSwitchingRef.current = true;
    video.src = effectiveVideoSrc;
    video.load();
    if (!isPlayingRef.current && !video.paused) {
      video.pause();
    }
    // Do not force currentTime immediately before metadata is ready
  }, [effectiveVideoSrc]);

  // Auto-sync incoming transition video source
  useEffect(() => {
    const tVideo = transitionVideoRef.current;
    if (!tVideo || !effectiveTransitionSrc) return;
    const currentAttr = tVideo.getAttribute('src');
    if (currentAttr === effectiveTransitionSrc) return;
    try {
      if (new URL(effectiveTransitionSrc, window.location.href).href === tVideo.src) return;
    } catch {}

    tVideo.src = effectiveTransitionSrc;
    tVideo.load();
    tVideo.muted = true;
    if (!isPlayingRef.current && !tVideo.paused) {
      tVideo.pause();
    }
  }, [effectiveTransitionSrc]);

  // Synchronize playback & seek without thrashing video decoders during continuous play
  useEffect(() => {
    const video = videoElementRef.current;
    const tVideo = transitionVideoRef.current;
    if (!video) return;

    video.volume = videoTrackVolume / 100;
    video.muted = videoTrackVolume === 0;
    video.playbackRate = playbackRate;

    if (!showVideoLayer) {
      if (!video.paused) video.pause();
      return;
    }

    if (tVideo) {
      tVideo.volume = 0;
      tVideo.muted = true;
      tVideo.playbackRate = playbackRate;
    }

    const clipA = activeTransition ? activeTransition.clipA : activeVideoClip;
    const clipStart = clipA ? (Number(clipA.start) || 0) : (timelineState.videoStart || 0);
    const rawOffset = Math.max(0, currentTime - clipStart);
    const videoDuration = video.duration && Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
    const offset = videoDuration > 0 ? (rawOffset % videoDuration) : rawOffset;

    // Transition Player B sync calculation
    let offsetB = 0;
    let vDurB = 0;
    if (activeTransition && tVideo) {
      const clipBStart = Number(activeTransition.clipB?.start) || 0;
      const rawOffsetB = Math.max(0, currentTime - clipBStart);
      vDurB = tVideo.duration && Number.isFinite(tVideo.duration) && tVideo.duration > 0 ? tVideo.duration : 0;
      offsetB = vDurB > 0 ? (rawOffsetB % vDurB) : rawOffsetB;
    }

    if (isPlaying) {
      if (video.paused && video.readyState >= 2 && !video.seeking) {
        video.play().catch(() => {});
      }
      if (activeTransition && tVideo && tVideo.paused && tVideo.readyState >= 2 && !tVideo.seeking) {
        tVideo.play().catch(() => {});
      }

      // Calculate true circular drift on looping media so loop boundaries never trigger false seek stutter
      const diff = Math.abs(video.currentTime - offset);
      const circularDiff = videoDuration > 0 ? Math.min(diff, Math.abs(videoDuration - diff)) : diff;

      // Only resync if video has genuinely drifted (> 1.2s, e.g. user scrubbed or jumped)
      // and is not currently in the middle of a seek or cut switch
      if (!video.seeking && !isSeekingOrSwitchingRef.current && video.readyState >= 2) {
        if (circularDiff > 1.2) {
          video.currentTime = offset;
      }
      if (activeTransition && tVideo && !tVideo.seeking && tVideo.readyState >= 1 && Math.abs(tVideo.currentTime - offsetB) > 0.09) {
        tVideo.currentTime = offsetB;
        }
        if (activeTransition && tVideo && !tVideo.seeking && tVideo.readyState >= 2 && Math.abs(tVideo.currentTime - offsetB) > 1.2) {
          tVideo.currentTime = offsetB;
        }
      }
    } else {
      // Paused: pause video and sync position smoothly
      if (tVideo && !tVideo.paused) tVideo.pause();
      if (!video.paused) video.pause();
      const diff = Math.abs(video.currentTime - offset);
      const circularDiff = videoDuration > 0 ? Math.min(diff, Math.abs(videoDuration - diff)) : diff;
      if (!video.seeking && video.readyState >= 1 && circularDiff > 0.08) {
        video.currentTime = offset;
      }
      if (activeTransition && tVideo && !tVideo.seeking && tVideo.readyState >= 1 && Math.abs(tVideo.currentTime - offsetB) > 0.09) {
        tVideo.currentTime = offsetB;
      }
    }
  }, [currentTime, isPlaying, playbackRate, showVideoLayer, activeVideoClip, timelineState.videoStart, videoTrackVolume, activeTransition]);

  // Active subtitle matching current playhead position strictly from timeline track clips or script.subtitles
  const effectiveSubtitles = (timelineState.captionClips && timelineState.captionClips.length > 0)
    ? timelineState.captionClips
    : (script.subtitles || []);

  const activeSubtitleObj = effectiveSubtitles.find(
    (s) => currentTime >= s.start && currentTime <= s.start + (s.duration || 3)
  );

  const activeStoryboardScene = (script.storyboard || []).find(
    (sc) => currentTime >= sc.start && currentTime <= sc.start + (sc.duration || 3)
  );

  const timedSubtitle = (() => {
    // 1. If an active subtitle clip is found on the timeline track, display it!
    if (activeSubtitleObj && activeSubtitleObj.text) {
      return activeSubtitleObj.text;
    }
    // 2. If storyboard scenes exist and one matches, show its subtitleText
    if (activeStoryboardScene && activeStoryboardScene.subtitleText) {
      return activeStoryboardScene.subtitleText;
    }
    // 3. If there are subtitle clips or scenes in the project, but none match currentTime,
    // show NOTHING (empty string)! DO NOT display script.quote!
    if (effectiveSubtitles.length > 0 || (script.storyboard && script.storyboard.length > 0)) {
      return '';
    }
    // 4. Fallback only if project has zero subtitle clips and zero scenes:
    const fallbackText = script.quote || script.hook || captionPresetPreviewText || '';
    if (!isPlaying) {
      return fallbackText;
    }
    return currentTime <= (captionStyle.duration || 4) ? fallbackText : '';
  })();

  const currentTitle = script.title?.trim() || '';
  const currentSubtitle = timedSubtitle.trim();

  const activeCaptionPresetClass =
    activeSubtitleObj?.captionPresetClass ||
    activeStoryboardScene?.captionPresetClass ||
    captionPresetClass;

  const activeCaptionPresetColor =
    activeSubtitleObj?.captionPresetColor ||
    activeStoryboardScene?.captionPresetColor ||
    captionPresetColor;

  const activeCaptionPresetFontFamily =
    activeStoryboardScene?.captionPresetFontFamily ||
    captionPresetFontFamily;

  const hasCaptionPreset = Boolean(activeCaptionPresetClass);
  const useCaptionPreset = hasCaptionPreset && !captionStyle.overridePreset;
  const visibleSubtitle = currentSubtitle;

  // Auto-synthesized karaoke words so ANY scene/quote gets animated rhythm
  const effectiveWords = useMemo(() => {
    if (activeSubtitleObj?.words && activeSubtitleObj.words.length > 0) {
      const wordsJoined = activeSubtitleObj.words.map((w) => w.word).join(' ').trim().toLowerCase();
      const currentText = (activeSubtitleObj.text || '').trim().toLowerCase();
      if (wordsJoined === currentText) {
        return activeSubtitleObj.words;
      }
    }
    if (!visibleSubtitle) return [];
    const tokens = visibleSubtitle.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return [];
    const subStart = activeSubtitleObj?.start ?? (activeStoryboardScene?.start ?? 0);
    const subDur = Math.max(0.6, activeSubtitleObj?.duration ?? (activeStoryboardScene?.duration ?? 3));
    const step = subDur / tokens.length;
    return tokens.map((word, i) => ({
      word,
      start: subStart + i * step,
      end: subStart + (i + 1) * step,
      highlightColor: activeSubtitleObj?.color || activeCaptionPresetColor || captionStyle.color || '#FACC15',
    }));
  }, [activeSubtitleObj, activeStoryboardScene, visibleSubtitle, activeCaptionPresetColor, captionStyle.color]);

  const effectiveDuration = Math.max(1, Number.isFinite(playbackDuration) && (playbackDuration ?? 0) > 0 ? playbackDuration! : (Number.isFinite(duration) && duration > 0 ? duration : 30));

  const currentVideoStart = activeVideoClip ? activeVideoClip.start : timelineState.videoStart;
  const currentVideoDuration = activeVideoClip ? activeVideoClip.duration : timelineState.videoDuration;

  // Track active scene and cut boundary for dynamic animation
  const activeStoryboardIndex = (script.storyboard || []).findIndex(
    (sc) => currentTime >= sc.start && currentTime <= sc.start + (sc.duration || 3)
  );
  const currentScene = activeStoryboardScene || (script.storyboard ? script.storyboard[0] : undefined);
  const sceneStart = currentScene ? (Number(currentScene.start) || 0) : (Number(currentVideoStart) || 0);
  const sceneDuration = currentScene ? (Number(currentScene.duration) || 3) : Math.max(0.1, Number(currentVideoDuration) || 3);
  const sceneProgress = Math.min(1, Math.max(0, (currentTime - sceneStart) / Math.max(0.1, sceneDuration)));
  const sceneElapsed = Math.max(0, currentTime - sceneStart);

  const backdropProgress = Math.min(1, Math.max(0,
    (currentTime - currentVideoStart) / Math.max(0.1, currentVideoDuration)
  ));
  const cutImpactBrightness = 100;

  // Camera & backdrop animation: rock-solid video playback with zero artificial camera shake/jitter
  const isVideoMedia = !!activeVideo && showVideoLayer;
  const isStaticMode = !backdropAnimation || backdropAnimation === 'none';

  let animationTransform = '';
  if (!isStaticMode) {
    if (backdropAnimation === 'zoom') {
      animationTransform = `scale(${1.0 + backdropProgress * 0.08})`;
    } else if (backdropAnimation === 'kenburns') {
      animationTransform = `scale(${1.05 + backdropProgress * 0.08}) translate(${-1 + backdropProgress * 2}%, ${1 - backdropProgress * 2}%)`;
    } else if (backdropAnimation === 'slide') {
      animationTransform = `translateY(${(1 - backdropProgress) * 6}%)`;
    } else if (backdropAnimation === 'glitch') {
      animationTransform = `translateX(${Math.sin(currentTime * 24) * 2}px)`;
    } else if (backdropAnimation === 'handheld') {
      animationTransform = `scale(1.02) translate(${Math.sin(currentTime * 3.5) * 0.3}%, ${Math.cos(currentTime * 4.2) * 0.3}%)`;
    }
  }

  const animationOpacity = backdropAnimation === 'fade'
    ? Math.min(1, backdropProgress * 4)
    : 1;

  const backdropTransform = [
    (backdropPosX !== 50 || backdropPosY !== 50) ? `translate(${(backdropPosX - 50) * 0.8}%, ${(backdropPosY - 50) * 0.8}%)` : '',
    backdropRotation ? `rotate(${backdropRotation}deg)` : '',
    (backdropScale !== 100 && backdropScale > 0) ? `scale(${backdropScale / 100})` : '',
    backdropFlipH ? 'scaleX(-1)' : '',
    backdropFlipV ? 'scaleY(-1)' : '',
    animationTransform,
  ].filter(Boolean).join(' ') || undefined;

  const activeClipFilter = (activeVideoClip && perClipFilters[activeVideoClip.id]) || (activeImageClip && perClipFilters[activeImageClip.id]) || filterSettings;

  const computedBackdropFilter = (() => {
    const parts: string[] = [];
    if (activeClipFilter.presetFilter && activeClipFilter.presetFilter !== 'none') {
      parts.push(activeClipFilter.presetFilter);
    }
    const effectiveBrightness = Math.round((activeClipFilter.brightness / 100) * cutImpactBrightness);
    if (effectiveBrightness !== 100) parts.push(`brightness(${effectiveBrightness}%)`);
    if (activeClipFilter.contrast !== 100) parts.push(`contrast(${activeClipFilter.contrast}%)`);
    if (activeClipFilter.saturate !== 100) parts.push(`saturate(${activeClipFilter.saturate}%)`);
    if (activeClipFilter.hue && activeClipFilter.hue !== 0) parts.push(`hue-rotate(${activeClipFilter.hue}deg)`);
    if (activeClipFilter.blur && activeClipFilter.blur !== 0) parts.push(`blur(${activeClipFilter.blur}px)`);
    if (activeClipFilter.lut && activeClipFilter.lut !== 'none') {
      const intensity = (activeClipFilter.lutIntensity ?? 80) / 100;
      if (activeClipFilter.lut === 'fuji-eterna') parts.push(`sepia(${20 * intensity}%) hue-rotate(${-10 * intensity}deg)`);
      else if (activeClipFilter.lut === 'kodak-vision') parts.push(`contrast(${100 + 15 * intensity}%) saturate(${100 + 20 * intensity}%)`);
      else if (activeClipFilter.lut === 'matrix-green') parts.push(`hue-rotate(${85 * intensity}deg) saturate(${100 + 30 * intensity}%)`);
      else if (activeClipFilter.lut === 'sepia-classic') parts.push(`sepia(${75 * intensity}%) contrast(${100 - 10 * intensity}%)`);
      else if (activeClipFilter.lut === 'tokyo-drift') parts.push(`hue-rotate(${180 * intensity}deg) saturate(${100 + 40 * intensity}%)`);
      else if (activeClipFilter.lut === 'alexa-logc') parts.push(`contrast(${100 - 15 * intensity}%) brightness(${100 + 5 * intensity}%)`);
      else if (activeClipFilter.lut === 'red-dragon') parts.push(`saturate(${100 + 30 * intensity}%) contrast(${100 + 10 * intensity}%) hue-rotate(${10 * intensity}deg)`);
    }
    return parts.length > 0 ? parts.join(' ') : undefined;
  })();
  const overlayTransform = [
    overlayStyle.flipH ? 'scaleX(-1)' : '',
    overlayStyle.flipV ? 'scaleY(-1)' : '',
    `rotate(${overlayStyle.rotation}deg)`,
    `scale(${(overlayStyle.scale ?? 100) / 100})`,
    overlayStyle.fitMode === 'fill' ? 'scale(1.15)' : '',
  ].filter(Boolean).join(' ');

  const overlayPositionStyle = {
    left: `${overlayStyle.posX ?? 50}%`,
    top: `${overlayStyle.posY ?? 78}%`,
    transform: `translate(-50%, -50%) ${overlayTransform}`,
  };

  // Caption font size styling map
  const captionSizeClass = {
    sm: 'text-xs md:text-sm',
    base: 'text-sm md:text-base',
    lg: 'text-base md:text-lg',
    xl: 'text-lg md:text-xl font-black',
  }[captionSize];

  const aspectClass = {
    '9:16': 'aspect-[9/16]',
    '16:9': 'aspect-[16/9]',
    '1:1': 'aspect-[1/1]',
    '4:5': 'aspect-[4/5]',
    '21:9': 'aspect-[21/9]',
  }[canvasAspectRatio] || 'aspect-[9/16]';

  const aspectRatio = {
    '9:16': 9 / 16,
    '16:9': 16 / 9,
    '1:1': 1,
    '4:5': 4 / 5,
    '21:9': 21 / 9,
  }[canvasAspectRatio] || 9 / 16;
  const fittedCanvasWidth = canvasFrameSize.width > 0 && canvasFrameSize.height > 0
    ? Math.min(canvasFrameSize.width, canvasFrameSize.height * aspectRatio)
    : undefined;
  const fittedCanvasHeight = fittedCanvasWidth !== undefined
    ? fittedCanvasWidth / aspectRatio
    : undefined;

  // Base canvas reference widths for proportional text/overlay scaling
  const baseCanvasWidth = {
    '9:16': 360,
    '16:9': 640,
    '1:1': 400,
    '4:5': 360,
    '21:9': 720,
  }[canvasAspectRatio] || 360;

  const currentCanvasWidth = fittedCanvasWidth ?? (canvasFrameSize.width > 0 ? canvasFrameSize.width : baseCanvasWidth);
  const canvasScale = Math.max(0.4, Math.min(3.0, currentCanvasWidth / baseCanvasWidth));

  // Dynamic proportional caption font size
  const baseCaptionFontSize = activeSubtitleObj?.fontSize
    ? Math.round(activeSubtitleObj.fontSize * 0.35)
    : useCaptionPreset
    ? (captionPresetFontSize || 21)
    : (captionStyle.fontSize ? Math.round(captionStyle.fontSize * 0.35) : 21);
  const scaledCaptionFontSize = Math.max(10, Math.min(64, Math.round(baseCaptionFontSize * canvasScale)));

  // For landscape ratios, constrain by width so the canvas reshapes short & wide.
  // For portrait/square ratios, constrain by height so the canvas stays tall & narrow.
  const isLandscape = canvasAspectRatio === '16:9' || canvasAspectRatio === '21:9';
  const dimensionClass = isLandscape
    ? 'w-full max-w-full' // width-driven → height auto-computed by aspect-ratio
    : 'h-full max-h-full'; // height-driven → width auto-computed by aspect-ratio

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1 select-none font-sans-studio overflow-hidden px-0.5 py-0.5">
      {/* ── Dynamic Aspect Ratio Video Studio Canvas ────────────────── */}
      <div ref={canvasFrameRef} className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden rounded-2xl">
        <div
          ref={canvasRef}
          onClick={(e) => {
            if (e.target === canvasRef.current) {
              setSelectedLayer(null);
              onTogglePlay();
            }
          }}
          id="apex-video-canvas-container"
          className={`group relative flex flex-col justify-between overflow-hidden ${dimensionClass} ${aspectClass} rounded-2xl border border-[#333333] shadow-2xl transition-[border-color,box-shadow,opacity] duration-300 cursor-default focus:outline-none @container`}
          tabIndex={-1}
          style={{
            background: canvasBackground || '#050505',
            width: fittedCanvasWidth,
            height: fittedCanvasHeight,
            containerType: 'inline-size',
          }}
          title="Canvas"
        >
        {/* Layer 1: Cinematic Background (Custom Color/Gradient or Theme Gradient) */}
        <div
          data-canvas-bg="true"
          className="absolute inset-0 z-0 transition-all duration-700 cursor-default"
          style={{
            background: canvasBackground || (theme ? theme.gradient : '#050505'),
            filter: computedBackdropFilter,
          }}
          onClick={() => {
            setSelectedLayer(null);
          }}
        />

        {/* Layer 1b: Video Layer (V1) - strictly visible when playhead is in video clip */}
        {(currentVideoSrc || activeVideo) && showVideoLayer && (
          <div
            ref={backdropRef}
            onClick={(e) => handleSelectLayer(e, 'backdrop')}
            onDoubleClick={handleResetBackdrop}
            className={`absolute inset-0 overflow-hidden cursor-default select-none transition-opacity duration-150 ${
              timelineState.selectedTrack === 'image' ? 'z-10' : 'z-20'
            }`}
            style={{
              opacity: animationOpacity,
              pointerEvents: 'auto',
            }}
            title="Video Layer (V1) • Click to select"
          >
            <div
              className="absolute inset-0 w-full h-full overflow-hidden"
              /* outgoing A */ style={activeTransition ? getTransitionStyles(activeTransition.type, activeTransition.progress).styleA : undefined}
            >
              <video
              ref={videoElementRef}
              src={effectiveVideoSrc}
              poster={activeVideoClip?.posterUrl || activeVideoClip?.thumbnailUrl || activeStoryboardScene?.posterUrl}
              muted={videoTrackVolume === 0}
              playsInline
              loop
              crossOrigin="anonymous"
              preload="auto"
              onWaiting={handleWaiting}
              onPlaying={handlePlayingOrCanPlay}
              onCanPlay={handlePlayingOrCanPlay}
              onLoadedData={handlePlayingOrCanPlay}
              onSeeked={handlePlayingOrCanPlay}
              onLoadedMetadata={(e) => {
                handlePlayingOrCanPlay();
                const target = e.currentTarget;
                const clipStart = activeVideoClipRef.current ? activeVideoClipRef.current.start : 0;
                const rawOffset = Math.max(0, currentTimeRef.current - clipStart);
                const vDur = target.duration && Number.isFinite(target.duration) && target.duration > 0 ? target.duration : 0;
                const offset = vDur > 0 ? (rawOffset % vDur) : rawOffset;
                try {
                  const diff = Math.abs(target.currentTime - offset);
                  const circularDiff = vDur > 0 ? Math.min(diff, Math.abs(vDur - diff)) : diff;
                  if (circularDiff > 0.15) {
                    target.currentTime = offset;
                  }
                } catch {}
                if (isPlayingRef.current) {
                  if (target.paused) target.play().catch(() => {});
                } else {
                  if (!target.paused) target.pause();
                }
                setTimeout(() => {
                  isSeekingOrSwitchingRef.current = false;
                }, 150);
              }}
              onError={() => {
                if (bufferingTimeoutRef.current) clearTimeout(bufferingTimeoutRef.current);
                setIsVideoBuffering(false);
                isSeekingOrSwitchingRef.current = false;
              }}
              className={`w-full h-full pointer-events-none ${
                backdropFitMode === 'fit' ? 'object-contain' : 'object-cover'
              } object-center opacity-100`}
              style={{
                transform: backdropTransform,
                filter: computedBackdropFilter,
              }}
            />
            </div>

            {/* Layer B (Incoming Transition Layer) */}
            {activeTransition && activeTransition.clipB?.url && (
              <div
                className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
                style={getTransitionStyles(activeTransition.type, activeTransition.progress).styleB}
              >
                  <video
                  ref={transitionVideoRef}
                  src={effectiveTransitionSrc || activeTransition.clipB.url}
                  poster={activeTransition.clipB.url}
                  muted
                  playsInline
                  loop
                  crossOrigin="anonymous"
                  preload="auto"
                  className={`w-full h-full pointer-events-none ${
                    backdropFitMode === 'fit' ? 'object-contain' : 'object-cover'
                  } object-center opacity-100`}
                  style={{
                    transform: backdropTransform,
                    filter: computedBackdropFilter,
                  }}
                />
              </div>
            )}

            {/* Background preloader for next video clip to ensure seamless cut transitions */}
            {nextVideoClip?.url && nextVideoClip.url !== activeVideo && (

              <video
                key={nextVideoClip.url}
                src={nextVideoClip.url}
                preload="auto"
                muted
                playsInline
                className="hidden pointer-events-none"
                style={{ display: 'none' }}
              />
            )}
            {/* Subtle Buffering Pulse Indicator */}
            {isVideoBuffering && isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 bg-black/25 backdrop-blur-[1px] transition-opacity">
                <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin shadow-lg" />
              </div>
            )}
            {/* Vignette Depth */}
            {filterSettings.vignette > 0 && (
              <div
                className="absolute inset-0 pointer-events-none transition-opacity"
                style={{
                  background: `radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,${filterSettings.vignette / 100}) 100%)`,
                }}
              />
            )}
            {/* Film Grain Texture */}
            {Boolean(filterSettings.grain) && (
              <div
                className="absolute inset-0 pointer-events-none opacity-25 mix-blend-overlay"
                style={{
                  backgroundImage: `radial-gradient(circle, #fff 10%, transparent 12%)`,
                  backgroundSize: '3px 3px',
                }}
              />
            )}
          </div>
        )}

        {/* Layer 1c: Image Layer (V2) - strictly visible when playhead is in image clip */}
        {activeImage && (
          <div
            onClick={(e) => handleSelectLayer(e, 'backdrop')}
            onDoubleClick={handleResetBackdrop}
            className={`absolute inset-0 overflow-hidden cursor-default select-none transition-opacity duration-150 ${
              timelineState.selectedTrack === 'image' ? 'z-20' : 'z-10'
            }`}
            style={{
              opacity: showImageLayer ? animationOpacity : 0,
              pointerEvents: showImageLayer ? 'auto' : 'none',
            }}
            title="Image Layer (V2) • Click to select"
          >
            <img
              src={activeImage}
              alt={activeBackdrop?.name || 'Visual Backdrop'}
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              className={`w-full h-full pointer-events-none ${
                backdropFitMode === 'fit' ? 'object-contain' : 'object-cover'
              } object-center opacity-100`}
              style={{
                transform: backdropTransform,
                filter: computedBackdropFilter,
              }}
              loading="eager"
            />
            {/* Vignette Depth */}
            {filterSettings.vignette > 0 && (
              <div
                className="absolute inset-0 pointer-events-none transition-opacity"
                style={{
                  background: `radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,${filterSettings.vignette / 100}) 100%)`,
                }}
              />
            )}
            {/* Film Grain Texture */}
            {Boolean(filterSettings.grain) && (
              <div
                className="absolute inset-0 pointer-events-none opacity-25 mix-blend-overlay"
                style={{
                  backgroundImage: `radial-gradient(circle, #fff 10%, transparent 12%)`,
                  backgroundSize: '3px 3px',
                }}
              />
            )}
          </div>
        )}

        {/* Dynamic Canvas Progress Bar Overlay */}
        {effectiveOverlay?.type === 'progress' && (
          <div className="absolute top-0 inset-x-0 h-1.5 bg-[#262626] z-30 overflow-hidden pointer-events-none" style={{ opacity: overlayEnabled && isOverlayTimeActive ? overlayStyle.opacity / 100 : 0 }}>
            <div
              className="h-full transition-all duration-200"
              style={{
                width: `${duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 55}%`,
                backgroundColor: overlayStyle.accentColor,
              }}
            />
          </div>
        )}

        {/* ── Title Header ────────────────────────────────────────────── */}
        {Boolean(currentTitle) && titleEnabled && isTitleTimeActive && (
          <div className="relative z-20 px-3 pt-6 pb-0.5 flex justify-center pointer-events-none transition-opacity duration-200">
            <div
              ref={titleRef}
              onClick={(e) => handleSelectLayer(e, 'title')}
              className="w-fit max-w-[92%] px-3 py-1 cursor-default select-none pointer-events-auto"
            >
              <h1
                className="font-black uppercase tracking-tight text-white text-center leading-tight drop-shadow-md pointer-events-none"
                style={{
                  fontSize: `${Math.max(12, Math.min(36, Math.round(18 * canvasScale)))}px`,
                  textShadow: theme ? theme.titleShadow : '0 2px 10px rgba(0,0,0,0.9)',
                }}
              >
                {currentTitle}
              </h1>
            </div>
          </div>
        )}

        {/* Dynamic Motivational Badge Overlay */}
        {effectiveOverlay?.type === 'badge' && (
          <div
            className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-200"
            style={{ opacity: overlayEnabled && isOverlayTimeActive ? overlayStyle.opacity / 100 : 0 }}
          >
            <div
              ref={overlayRef}
              onClick={(e) => handleSelectLayer(e, 'overlay')}
              className="absolute w-fit cursor-default select-none pointer-events-auto"
              style={overlayPositionStyle}
            >
              <span
                className="rounded-full font-black uppercase text-white shadow-lg border border-white/20 tracking-wider pointer-events-none"
                style={{
                  backgroundColor: overlayStyle.accentColor,
                  fontSize: `${Math.max(8, Math.min(20, Math.round(10 * canvasScale)))}px`,
                  padding: `${Math.round(2 * canvasScale)}px ${Math.round(10 * canvasScale)}px`,
                }}
              >
                {effectiveOverlay.value}
              </span>
            </div>
          </div>
        )}

        {/* Dynamic Motivational Sticker Overlay */}
        {effectiveOverlay?.type === 'sticker' && (
          <div
            ref={overlayRef}
            onClick={(e) => handleSelectLayer(e, 'overlay')}
            className="absolute z-20 cursor-default select-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] transition-opacity duration-200"
            style={{
              ...overlayPositionStyle,
              fontSize: `${Math.max(16, Math.min(64, Math.round(30 * canvasScale)))}px`,
              opacity: overlayEnabled && isOverlayTimeActive ? overlayStyle.opacity / 100 : 0,
            }}
          >
            {effectiveOverlay.value}
          </div>
        )}

        {/* Dynamic Shape / Generic Graphic Overlay */}
        {effectiveOverlay && effectiveOverlay.type !== 'progress' && effectiveOverlay.type !== 'badge' && effectiveOverlay.type !== 'sticker' && (
          <div
            ref={overlayRef}
            onClick={(e) => handleSelectLayer(e, 'overlay')}
            className="absolute z-20 rounded-xl border border-white/20 bg-black/70 backdrop-blur-md text-white font-bold cursor-default select-none shadow-xl transition-opacity duration-200"
            style={{
              ...overlayPositionStyle,
              fontSize: `${Math.max(9, Math.min(24, Math.round(12 * canvasScale)))}px`,
              padding: `${Math.round(6 * canvasScale)}px ${Math.round(12 * canvasScale)}px`,
              opacity: overlayEnabled && isOverlayTimeActive ? overlayStyle.opacity / 100 : 0,
            }}
          >
            {effectiveOverlay.value || effectiveOverlay.label || effectiveOverlay.name}
          </div>
        )}

        {/* ── Subtitle / Quote Dynamic Stage ─────────────────────────── */}
        {Boolean(visibleSubtitle) && captionsEnabled && (() => {
          const activeSubStart = activeSubtitleObj?.start ?? (activeStoryboardScene?.start ?? 0);
          const subElapsed = Math.max(0, currentTime - activeSubStart);
          const subPopProgress = Math.min(1, subElapsed / 0.22);
          const subScale = 0.94 + Math.sin(subPopProgress * Math.PI * 0.5) * 0.06;

          const activePosY = (activeSubtitleObj?.posY !== undefined)
            ? activeSubtitleObj.posY
            : (captionStyle.posY !== undefined && captionStyle.posY !== 64)
            ? captionStyle.posY
            : (canvasAspectRatio === '9:16' ? 76 : 80);

          return (
            <div
              ref={subtitleRef}
              onClick={(e) => handleSelectLayer(e, 'subtitle')}
              className="absolute z-20 flex items-center justify-center cursor-default select-none px-2 transition-all duration-100 pointer-events-auto"
              style={{
                left: `${captionStyle.posX ?? 50}%`,
                top: `${activePosY}%`,
                transform: `translate(-50%, -50%) scale(${subScale})`,
                opacity: captionStyle.opacity / 100,
                width: captionStyle.customWidth ? `${Math.round(captionStyle.customWidth * canvasScale)}px` : 'auto',
                maxWidth: '88%',
                minWidth: 'min(82%, 300px)',
                boxSizing: 'border-box',
              }}
            >
              <div
                className={`pointer-events-none w-full max-w-full text-center ${
                  useCaptionPreset
                    ? activeCaptionPresetClass
                    : `font-black text-center ${captionSizeClass} drop-shadow-[0_4px_14px_rgba(0,0,0,1)]`
                }`}
                style={{
                  backgroundColor: useCaptionPreset ? undefined : (captionStyle.background && captionStyle.background !== 'transparent' ? captionStyle.background : undefined),
                  borderRadius: useCaptionPreset ? undefined : (captionStyle.background && captionStyle.background !== 'transparent' ? `${Math.max(8, Math.round(captionStyle.bgRadius * canvasScale))}px` : undefined),
                  padding: useCaptionPreset ? undefined : (captionStyle.background && captionStyle.background !== 'transparent' ? `${Math.round(captionStyle.bgPadding * canvasScale)}px` : undefined),
                  color: (activeSubtitleObj?.color || activeSubtitleObj?.captionPresetColor) || (useCaptionPreset
                    ? activeCaptionPresetColor || captionStyle.color || captionColor
                    : captionStyle.color || captionColor),
                  filter: useCaptionPreset ? 'none' : undefined,
                  fontFamily: activeSubtitleObj?.fontFamily || (useCaptionPreset ? activeCaptionPresetFontFamily : captionStyle.fontFamily),
                  fontSize: `${scaledCaptionFontSize}px`,
                  fontWeight: activeSubtitleObj?.fontWeight ? (activeSubtitleObj.fontWeight === 'Black' ? 900 : activeSubtitleObj.fontWeight === 'ExtraBold' ? 800 : activeSubtitleObj.fontWeight === 'Bold' ? 700 : activeSubtitleObj.fontWeight === 'SemiBold' ? 600 : activeSubtitleObj.fontWeight === 'Medium' ? 500 : 400) : (useCaptionPreset ? captionPresetFontWeight : !captionStyle.isBold ? 400 : captionStyle.fontWeight === 'Black' ? 900
                    : captionStyle.fontWeight === 'ExtraBold' ? 800
                      : captionStyle.fontWeight === 'Bold' ? 700
                        : captionStyle.fontWeight === 'SemiBold' ? 600
                          : captionStyle.fontWeight === 'Medium' ? 500 : 400),
                  textAlign: activeSubtitleObj?.textAlign || 'center',
                  textTransform: activeSubtitleObj?.textTransform || (useCaptionPreset ? captionPresetTextTransform : captionStyle.textTransform),
                  fontStyle: activeSubtitleObj?.isItalic !== undefined ? (activeSubtitleObj.isItalic ? 'italic' : 'normal') : (useCaptionPreset ? undefined : captionStyle.isItalic ? 'italic' : 'normal'),
                  textDecoration: activeSubtitleObj ? [
                    activeSubtitleObj.isUnderline ? 'underline' : '',
                    activeSubtitleObj.isStrikethrough ? 'line-through' : '',
                  ].filter(Boolean).join(' ') || 'none' : (useCaptionPreset ? undefined : [
                    captionStyle.isUnderline ? 'underline' : '',
                    captionStyle.isStrikethrough ? 'line-through' : '',
                  ].filter(Boolean).join(' ') || 'none'),
                  letterSpacing: useCaptionPreset ? undefined : `${captionStyle.letterSpacing}em`,
                  lineHeight: useCaptionPreset ? 1.35 : captionStyle.lineHeight,
                  textShadow: useCaptionPreset
                    ? undefined
                    : captionStyle.neonGlow
                    ? `0 0 ${Math.round(10 * canvasScale)}px ${captionStyle.glowColor}, 0 0 ${Math.round(20 * canvasScale)}px ${captionStyle.glowColor}`
                    : captionStyle.dropShadow
                      ? `0 ${Math.max(1, Math.round(2 * canvasScale))}px ${Math.round(captionStyle.shadowBlur * canvasScale)}px ${captionStyle.shadowColor}`
                      : '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 4px 14px rgba(0,0,0,0.95)',
                  WebkitTextStroke: useCaptionPreset
                    ? undefined
                    : captionStyle.stroke
                    ? `${Math.max(1, Math.round(captionStyle.strokeWidth * canvasScale))}px ${captionStyle.strokeColor}`
                    : `${Math.max(1.5, Math.round(2 * canvasScale))}px #000`,
                  paintOrder: 'stroke fill',
                  whiteSpace: 'normal',
                  wordBreak: 'keep-all',
                  overflowWrap: 'normal',
                  hyphens: 'none',
                  textWrap: 'balance',
                  boxSizing: 'border-box',
                  display: 'block',
                }}
              >
                {effectiveWords.length > 0 ? (
                  effectiveWords.map((w, wIdx) => {
                    const isWordActive = currentTime >= w.start && currentTime <= w.end;
                    const isPast = currentTime > w.end;
                    return (
                      <span
                        key={wIdx}
                        className={`inline-block transition-all duration-100 mx-[0.18em] my-[0.06em] select-none ${
                          isWordActive ? 'font-black' : ''
                        }`}
                        style={{
                          display: 'inline-block',
                          whiteSpace: 'nowrap',
                          wordBreak: 'keep-all',
                          overflowWrap: 'normal',
                          hyphens: 'none',
                          color: isWordActive
                            ? (w.highlightColor || '#FACC15')
                            : (activeSubtitleObj?.color || (isPast ? (activeSubtitleObj?.captionPresetColor || (useCaptionPreset ? activeCaptionPresetColor || captionStyle.color : captionStyle.color)) : undefined)),
                          textShadow: isWordActive
                            ? '0 0 16px rgba(250, 204, 21, 0.8), -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 4px 14px rgba(0,0,0,0.95)'
                            : '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 4px 8px rgba(0,0,0,0.85)',
                          WebkitTextStroke: isWordActive
                            ? `${Math.max(1.8, Math.round(2.6 * canvasScale))}px #000`
                            : `${Math.max(1.4, Math.round(2.0 * canvasScale))}px #000`,
                          paintOrder: 'stroke fill',
                          opacity: isPast ? 0.95 : isWordActive ? 1 : 0.75,
                          transform: isWordActive ? 'scale(1.08) translateY(-1px)' : 'scale(1)',
                        }}
                      >
                        {w.word}
                      </span>
                    );
                  })
                ) : (
                  <span style={{
                    display: 'inline-block',
                    textWrap: 'balance',
                    wordBreak: 'keep-all',
                    overflowWrap: 'normal',
                    hyphens: 'none',
                    whiteSpace: 'normal',
                    WebkitTextStroke: `${Math.max(1.5, Math.round(2.2 * canvasScale))}px #000`,
                    paintOrder: 'stroke fill',
                    textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 4px 14px rgba(0,0,0,0.95)',
                  }}>
                    {visibleSubtitle}
                  </span>
                )}
              </div>
            </div>
          );
        })()}

        {/* Empty Canvas Placeholder */}
        {!activeVideo && !activeImage && !visibleSubtitle && !effectiveOverlay && !script.title && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center select-none pointer-events-none z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-3 text-white/30 shadow-inner">
              <Film className="w-5 h-5 text-white/40" />
            </div>
            <span className="text-xs font-semibold text-white/60 tracking-wide mb-1">Canvas Ready</span>
            <span className="text-[10px] text-white/35 max-w-[210px] leading-relaxed">
              Generate a script with AI or add media to the timeline to begin
            </span>
          </div>
        )}

        {/* Bottom Spacing Anchor */}
        <div className="h-6 pointer-events-none" />

        </div>
      </div>
    </div>
  );
};

export default VideoPreviewPane;
