import React, { useEffect, useRef, useState } from 'react';
import Moveable from 'react-moveable';
import { toCanvas } from 'html-to-image';
import { GeneratedScript, VisualBackdrop, BackdropFilterSettings } from '../../types';
import { TimelineMediaClip, TimelineAudioClip, TimelineOverlayClip } from '../timeline/timelineTypes';
import { CanvasSafeZonesOverlay } from './CanvasSafeZonesOverlay';
import { consoleLogger } from '@/src/shared/utils/logger';

// Timeline state broadcast from StudioTimelinePane
interface TimelineState {
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
  imageStart: 0,
  imageDuration: 8.0,
  overlayStart: 0,
  overlayDuration: 30,
  titleStart: 0,
  titleDuration: 30,
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
  canvasAspectRatio?: '9:16' | '16:9' | '1:1' | '4:5' | '21:9';
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
  imageUrl: string;
}> = {
  v1: {
    name: 'Mountain Solitude',
    gradient: 'linear-gradient(180deg, #0a0f2c 0%, #111a45 30%, #1a0a3a 65%, #08070f 100%)',
    accentColor: '#3B82F6',
    titleShadow: '0 2px 10px rgba(0,0,0,0.9)',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=720&q=80',
  },
  v2: {
    name: 'Cyberpunk Neon',
    gradient: 'linear-gradient(180deg, #050d1a 0%, #0a1a35 30%, #120825 65%, #050508 100%)',
    accentColor: '#06B6D4',
    titleShadow: '0 2px 10px rgba(0,0,0,0.9)',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=720&q=80',
  },
  v3: {
    name: 'Ember Flame',
    gradient: 'linear-gradient(180deg, #160a02 0%, #291402 30%, #1c0a02 65%, #0a0500 100%)',
    accentColor: '#F59E0B',
    titleShadow: '0 2px 10px rgba(0,0,0,0.9)',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=720&q=80',
  },
  v4: {
    name: 'Teal Oceanic',
    gradient: 'linear-gradient(180deg, #010d18 0%, #021c2e 30%, #011420 65%, #010608 100%)',
    accentColor: '#2DD4BF',
    titleShadow: '0 2px 10px rgba(0,0,0,0.9)',
    imageUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=720&q=80',
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
  canvasAspectRatio = '9:16',
  canvasBackground,
  playbackDuration,
  isExporting = false,
  exportDuration = 30,
  exportFileName = 'apexmind-video',
  audioElement,
  audioOutputStream,
  onExportComplete,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  const [selectedLayer, setSelectedLayer] = useState<'subtitle' | 'title' | 'overlay' | 'backdrop' | null>(null);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
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
    color: '#FFFFFF',
    fontFamily: 'Roboto',
    fontWeight: 'Medium',
    fontSize: 60,
    textAlign: 'center' as const,
    dropShadow: true,
    background: 'transparent',
    opacity: 100,
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
    posY: 78,
    accentColor: '#3B82F6',
    opacity: 100,
    duration: 5,
  });

  // ── Timeline state (live sync from StudioTimelinePane events) ─────────
  const [timelineState, setTimelineState] = useState<TimelineState>(DEFAULT_TIMELINE_STATE);

  useEffect(() => {
    if (!isExporting) return;

    let cancelled = false;
    let recorder: MediaRecorder | null = null;
    let outputStream: MediaStream | null = null;

    const exportVideo = async () => {
      try {
        const preview = canvasRef.current;
        if (!preview) throw new Error('The video preview is not available.');
        if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported('video/mp4')) {
          throw new Error('MP4 export is not supported by this browser.');
        }
        const h264MimeType = 'video/mp4;codecs=avc1.42E01E,mp4a.40.2';
        const mimeType = MediaRecorder.isTypeSupported(h264MimeType) ? h264MimeType : 'video/mp4';

        const dimensions = {
          '9:16': { width: 1080, height: 1920 },
          '16:9': { width: 1920, height: 1080 },
          '1:1': { width: 1080, height: 1080 },
          '4:5': { width: 1080, height: 1350 },
          '21:9': { width: 1920, height: 823 },
        }[canvasAspectRatio];
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = dimensions.width;
        outputCanvas.height = dimensions.height;
        const context = outputCanvas.getContext('2d');
        if (!context) throw new Error('Could not create the video export canvas.');

        const captureFrame = async () => {
          const frame = await toCanvas(preview, {
            pixelRatio: 1,
            skipFonts: true,
            style: { border: 'none', borderRadius: '0', boxShadow: 'none' },
          });
          context.drawImage(frame, 0, 0, dimensions.width, dimensions.height);
        };

        await captureFrame();
        outputStream = outputCanvas.captureStream(30);
        const captureAudio = audioElement as (HTMLAudioElement & {
          captureStream?: () => MediaStream;
          mozCaptureStream?: () => MediaStream;
        }) | null | undefined;
        const audioStream = audioOutputStream ?? captureAudio?.captureStream?.() ?? captureAudio?.mozCaptureStream?.();
        audioStream?.getAudioTracks().forEach((track) => outputStream?.addTrack(track));

        const chunks: BlobPart[] = [];
        recorder = new MediaRecorder(outputStream, {
          mimeType,
          videoBitsPerSecond: 8_000_000,
          audioBitsPerSecond: 192_000,
        });
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunks.push(event.data);
        };
        recorder.onstop = () => {
          if (cancelled) return;
          const blob = new Blob(chunks, { type: mimeType });
          if (blob.size === 0) {
            onExportComplete?.('The MP4 export did not contain any video frames.');
            return;
          }

          const safeName = exportFileName.trim().replace(/[<>:"/\\|?*]+/g, '').slice(0, 80) || 'apexmind-video';
          const link = document.createElement('a');
          const downloadUrl = URL.createObjectURL(blob);
          link.href = downloadUrl;
          link.download = `${safeName}.mp4`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
          onExportComplete?.();
        };
        recorder.onerror = () => {
          if (!cancelled) onExportComplete?.('The browser could not encode the MP4.');
        };
        recorder.start(1000);

        const exportStartedAt = performance.now();
        const exportLength = Math.max(1, exportDuration) * 1000;
        while (!cancelled && performance.now() - exportStartedAt < exportLength) {
          const frameStartedAt = performance.now();
          await captureFrame();
          const delay = Math.max(0, 1000 / 15 - (performance.now() - frameStartedAt));
          if (delay > 0) await new Promise((resolve) => window.setTimeout(resolve, delay));
        }

        if (!cancelled && recorder.state === 'recording') recorder.stop();
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Video export failed.';
          onExportComplete?.(message.includes('tainted') || message.includes('cross-origin')
            ? 'A media source blocks capture. Upload the video or image file directly, or use a CORS-enabled source.'
            : message);
        }
      }
    };

    void exportVideo();
    return () => {
      cancelled = true;
      if (recorder?.state === 'recording') recorder.stop();
      outputStream?.getTracks().forEach((track) => track.stop());
    };
  }, [audioElement, audioOutputStream, canvasAspectRatio, exportDuration, exportFileName, isExporting, onExportComplete]);

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

  const isCustomImage = Boolean(customImageUrl);
  const isCustomVideo = Boolean(customVideoUrl);

  // Active clip resolution based on currentTime (top layer takes precedence when overlapping)
  const activeVideoClip = (timelineState.videoClips || [])
    .filter((c) => currentTime >= c.start && currentTime <= c.start + c.duration)
    .slice(-1)[0];
  const activeImageClip = (timelineState.imageClips || [])
    .filter((c) => currentTime >= c.start && currentTime <= c.start + c.duration)
    .slice(-1)[0];
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

  // ── Frame-Accurate Playhead Sync: Check which clip is active under currentTime ──
  const isVideoTimeActive = Boolean(activeVideoClip) || (!timelineState.videoClips?.length && (
    isCustomVideo || (currentTime >= timelineState.videoStart && currentTime <= (timelineState.videoStart + (timelineState.videoDuration || 30)))
  ));

  const imageStart = timelineState.imageStart ?? 0;
  const imageDuration = timelineState.imageDuration ?? 30;
  const isImageTimeActive = Boolean(activeImageClip) || (!timelineState.imageClips?.length && (
    isCustomImage || (currentTime >= imageStart && currentTime <= (imageStart + imageDuration))
  ));

  const isOverlayTimeActive = Boolean(activeOverlayClip) || (
    currentTime >= timelineState.overlayStart &&
    currentTime <= (timelineState.overlayStart + Math.min(timelineState.overlayDuration, overlayStyle.duration))
  );

  const isTitleTimeActive = currentTime >= timelineState.titleStart &&
    currentTime <= (timelineState.titleStart + timelineState.titleDuration);

  // Track enabled & visible states
  const videoEnabled = timelineState.videoVisible !== false || isCustomVideo;
  const imageEnabled = timelineState.imageVisible !== false || isCustomImage;
  const overlayEnabled = timelineState.overlayVisible !== false;
  const titleEnabled = timelineState.titleVisible !== false;
  const captionsEnabled = timelineState.captionsVisible !== false;


  const handleSelectLayer = (e: React.MouseEvent, layer: 'subtitle' | 'title' | 'overlay' | 'backdrop') => {
    e.stopPropagation();
    setSelectedLayer(layer);
    if (layer === 'backdrop') {
      setTargetElement(backdropRef.current);
      window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'video' }));
    }
    if (layer === 'subtitle') {
      setTargetElement(subtitleRef.current);
      window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'text' }));
    }
    if (layer === 'title') {
      setTargetElement(titleRef.current);
      window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'text' }));
    }
    if (layer === 'overlay') {
      setTargetElement(overlayRef.current);
      window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'overlay' }));
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
        setTargetElement(null);
      }
    };
    const handleDeselect = () => {
      setSelectedLayer(null);
      setTargetElement(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('workspace:deselect-layer', handleDeselect);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('workspace:deselect-layer', handleDeselect);
    };
  }, []);

  const [showSafeZones, setShowSafeZones] = useState(false);

  const [subtitleYPercent] = useState<number>(50); // Center: 50%
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
  });

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
      const detail = (e as CustomEvent<Partial<typeof captionStyle>>).detail;
      if (detail) setCaptionStyle((prev) => ({ ...prev, ...detail }));
    };
    const handleOverlayStyle = (e: Event) => {
      const detail = (e as CustomEvent<Partial<typeof overlayStyle>>).detail;
      if (detail) setOverlayStyle((prev) => ({ ...prev, ...detail }));
    };
    const handleBackdropAnimation = (e: Event) => {
      const detail = (e as CustomEvent<{ animation: string }>).detail;
      if (detail) setBackdropAnimation(detail.animation);
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
  const activeVideo = activeVideoClip
    ? activeVideoClip.url
    : (timelineState.videoClips && timelineState.videoClips.length > 0
        ? undefined
        : (isCustomVideo
            ? customVideoUrl
            : (!isCustomImage
                ? (activeBackdrop?.videoUrl || (activeBackdrop?.id === 'v1' ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' : undefined))
                : undefined)));

  const activeImage = activeImageClip
    ? activeImageClip.url
    : (timelineState.imageClips && timelineState.imageClips.length > 0
        ? undefined
        : (isCustomImage
            ? customImageUrl
            : (!isCustomVideo
                ? (filterSettings.customImageUrl || activeBackdrop?.imageUrl || theme?.imageUrl || undefined)
                : undefined)));

  // Determine whether video or image layer is shown under the current playhead
  const showVideoLayer = Boolean(activeVideo) && (videoEnabled || isCustomVideo) && isVideoTimeActive;
  const showImageLayer = Boolean(activeImage) && (imageEnabled || isCustomImage) && isImageTimeActive;

  // Auto-reload video element when source changes
  useEffect(() => {
    const video = videoElementRef.current;
    if (!video) return;
    if (activeVideo && video.src !== activeVideo) {
      video.src = activeVideo;
      video.load();
    }
  }, [activeVideo]);

  // Sync video element time and play/pause state with timeline currentTime
  useEffect(() => {
    const video = videoElementRef.current;
    if (!video) return;
    video.volume = videoTrackVolume / 100;
    video.muted = videoTrackVolume === 0;
    video.playbackRate = playbackRate;

    if (showVideoLayer) {
      const clipStart = activeVideoClip ? activeVideoClip.start : timelineState.videoStart;
      const offset = Math.max(0, currentTime - clipStart);
      if (Math.abs(video.currentTime - offset) > 0.25) {
        video.currentTime = offset;
      }
      if (isPlaying) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    } else {
      video.pause();
    }
  }, [currentTime, isPlaying, playbackRate, showVideoLayer, activeVideoClip, timelineState.videoStart, videoTrackVolume]);

  // Active subtitle text matching current playhead position
  const timedSubtitle = (() => {
    if (!script.subtitles || script.subtitles.length === 0) {
      return currentTime <= captionStyle.duration ? script.quote || script.hook : '';
    }
    const current = script.subtitles.find(
      (s) => currentTime >= s.start && currentTime <= s.start + (s.duration || 3)
    );
    if (current) return current.text;
    return '';
  })();

  const currentTitle = script.title?.trim() || '';
  const currentSubtitle = captionStyle.text.trim()
    ? currentTime <= captionStyle.duration ? captionStyle.text.trim() : ''
    : timedSubtitle.trim();
  const currentVideoStart = activeVideoClip ? activeVideoClip.start : timelineState.videoStart;
  const currentVideoDuration = activeVideoClip ? activeVideoClip.duration : timelineState.videoDuration;
  const backdropProgress = Math.min(1, Math.max(0,
    (currentTime - currentVideoStart) / Math.max(0.1, currentVideoDuration)
  ));
  const animationTransform = backdropAnimation === 'zoom'
    ? `scale(${1.02 + backdropProgress * 0.12})`
    : backdropAnimation === 'kenburns'
      ? `scale(${1.1 + backdropProgress * 0.15}) translate(${-2 + backdropProgress * 4}%, ${2 - backdropProgress * 4}%)`
      : backdropAnimation === 'slide'
        ? `translateY(${(1 - backdropProgress) * 8}%)`
        : backdropAnimation === 'glitch'
          ? `translateX(${Math.sin(currentTime * 24) * 2}px)`
          : '';
  const animationOpacity = backdropAnimation === 'fade' ? Math.min(1, backdropProgress * 4) : 1;

  const backdropTransform = [
    (backdropPosX !== 50 || backdropPosY !== 50) ? `translate(${(backdropPosX - 50) * 0.8}%, ${(backdropPosY - 50) * 0.8}%)` : '',
    backdropRotation ? `rotate(${backdropRotation}deg)` : '',
    (backdropScale !== 100 && backdropScale > 0) ? `scale(${backdropScale / 100})` : '',
    backdropFlipH ? 'scaleX(-1)' : '',
    backdropFlipV ? 'scaleY(-1)' : '',
    animationTransform,
  ].filter(Boolean).join(' ') || undefined;

  const computedBackdropFilter = (() => {
    const parts: string[] = [];
    if (filterSettings.brightness !== 100) parts.push(`brightness(${filterSettings.brightness}%)`);
    if (filterSettings.contrast !== 100) parts.push(`contrast(${filterSettings.contrast}%)`);
    if (filterSettings.saturate !== 100) parts.push(`saturate(${filterSettings.saturate}%)`);
    if (filterSettings.hue && filterSettings.hue !== 0) parts.push(`hue-rotate(${filterSettings.hue}deg)`);
    if (filterSettings.blur && filterSettings.blur !== 0) parts.push(`blur(${filterSettings.blur}px)`);
    if (filterSettings.lut && filterSettings.lut !== 'none') {
      const intensity = (filterSettings.lutIntensity ?? 80) / 100;
      if (filterSettings.lut === 'fuji-eterna') parts.push(`sepia(${20 * intensity}%) hue-rotate(${-10 * intensity}deg)`);
      else if (filterSettings.lut === 'kodak-vision') parts.push(`contrast(${100 + 15 * intensity}%) saturate(${100 + 20 * intensity}%)`);
      else if (filterSettings.lut === 'matrix-green') parts.push(`hue-rotate(${85 * intensity}deg) saturate(${100 + 30 * intensity}%)`);
      else if (filterSettings.lut === 'sepia-classic') parts.push(`sepia(${75 * intensity}%) contrast(${100 - 10 * intensity}%)`);
      else if (filterSettings.lut === 'tokyo-drift') parts.push(`hue-rotate(${180 * intensity}deg) saturate(${100 + 40 * intensity}%)`);
      else if (filterSettings.lut === 'alexa-logc') parts.push(`contrast(${100 - 15 * intensity}%) brightness(${100 + 5 * intensity}%)`);
      else if (filterSettings.lut === 'red-dragon') parts.push(`saturate(${100 + 30 * intensity}%) contrast(${100 + 10 * intensity}%) hue-rotate(${10 * intensity}deg)`);
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

  // For landscape ratios, constrain by width so the canvas reshapes short & wide.
  // For portrait/square ratios, constrain by height so the canvas stays tall & narrow.
  const isLandscape = canvasAspectRatio === '16:9' || canvasAspectRatio === '21:9';
  const dimensionClass = isLandscape
    ? 'w-full max-w-full' // width-driven → height auto-computed by aspect-ratio
    : 'h-full max-h-full'; // height-driven → width auto-computed by aspect-ratio

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1 select-none font-sans-studio overflow-hidden px-0.5 py-0.5">
      {/* ── Dynamic Aspect Ratio Video Studio Canvas ────────────────── */}
      <div className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden rounded-2xl">
        <div
          ref={canvasRef}
          onClick={(e) => {
            if (e.target === canvasRef.current) {
              setSelectedLayer(null);
              setTargetElement(null);
              onTogglePlay();
            }
          }}
          id="apex-video-canvas-container"
          className={`group relative flex flex-col justify-between overflow-hidden ${dimensionClass} ${aspectClass} rounded-2xl border border-[#333333] shadow-2xl transition-all duration-300 cursor-pointer focus:outline-none`}
          tabIndex={-1}
          style={{
            background: canvasBackground || '#050505',
          }}
          title="Canvas"
        >
        {/* Layer 1: Cinematic Background (Custom Color/Gradient or Theme Gradient) */}
        <div
          data-canvas-bg="true"
          className="absolute inset-0 z-0 transition-all duration-700 cursor-pointer"
          style={{ background: canvasBackground || (theme ? theme.gradient : '#050505') }}
          onClick={() => {
            setSelectedLayer(null);
            setTargetElement(null);
          }}
        />

        {/* Layer 1b: Video Layer (V1) - strictly visible when playhead is in video clip */}
        {activeVideo && (
          <div
            ref={backdropRef}
            onClick={(e) => handleSelectLayer(e, 'backdrop')}
            onDoubleClick={handleResetBackdrop}
            className="absolute inset-0 z-10 overflow-hidden cursor-move select-none transition-opacity duration-150"
            style={{
              opacity: showVideoLayer ? animationOpacity : 0,
              pointerEvents: showVideoLayer ? 'auto' : 'none',
            }}
            title="Video Layer (V1) • Click to select & resize/move"
          >
            <video
              ref={videoElementRef}
              src={activeVideo}
              loop
              muted={videoTrackVolume === 0}
              playsInline
              className={`w-full h-full pointer-events-none transition-all duration-300 ${
                backdropFitMode === 'fit' ? 'object-contain' : 'object-cover'
              } object-center opacity-100`}
              style={{
                transform: backdropTransform,
                filter: computedBackdropFilter,
              }}
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

        {/* Layer 1c: Image Layer (V2) - strictly visible when playhead is in image clip */}
        {activeImage && (
          <div
            ref={backdropRef}
            onClick={(e) => handleSelectLayer(e, 'backdrop')}
            onDoubleClick={handleResetBackdrop}
            className="absolute inset-0 z-10 overflow-hidden cursor-move select-none transition-opacity duration-150"
            style={{
              opacity: showImageLayer ? animationOpacity : 0,
              pointerEvents: showImageLayer ? 'auto' : 'none',
            }}
            title="Image Layer (V2) • Click to select & resize/move"
          >
            <img
              src={activeImage}
              alt={activeBackdrop?.name || 'Visual Backdrop'}
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              className={`w-full h-full pointer-events-none transition-all duration-300 ${
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
              className="w-fit max-w-[92%] px-3 py-1 cursor-move select-none pointer-events-auto"
            >
              <h1
                className="font-black uppercase tracking-tight text-white text-center leading-tight drop-shadow-md pointer-events-none"
                style={{
                  fontSize: 'clamp(14px, 4.2vw, 19px)',
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
              className="absolute w-fit cursor-move select-none pointer-events-auto"
              style={overlayPositionStyle}
            >
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase text-white shadow-lg border border-white/20 tracking-wider pointer-events-none" style={{ backgroundColor: overlayStyle.accentColor }}>
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
            className="absolute z-20 text-3xl cursor-move select-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] transition-opacity duration-200"
            style={{
              ...overlayPositionStyle,
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
            className="absolute z-20 px-3 py-1.5 rounded-xl border border-white/20 bg-black/70 backdrop-blur-md text-white text-xs font-bold cursor-move select-none shadow-xl transition-opacity duration-200"
            style={{
              ...overlayPositionStyle,
              opacity: overlayEnabled && isOverlayTimeActive ? overlayStyle.opacity / 100 : 0,
            }}
          >
            {effectiveOverlay.value || effectiveOverlay.label || effectiveOverlay.name}
          </div>
        )}

        {/* ── Subtitle / Quote Dynamic Stage ─────────────────────────── */}
        {Boolean(currentSubtitle) && captionsEnabled && (
          <div
            ref={subtitleRef}
            onClick={(e) => handleSelectLayer(e, 'subtitle')}
            className="absolute left-1/2 -translate-x-1/2 z-20 w-fit max-w-[88%] flex flex-col items-center justify-center cursor-move select-none p-2 transition-opacity duration-150"
            style={{
              top: `${subtitleYPercent}%`,
              opacity: captionStyle.opacity / 100,
            }}
          >
            <div className="pointer-events-none rounded-md px-2 py-1" style={{ backgroundColor: captionStyle.background }}>
              <p
                className={`font-black uppercase text-center leading-tight ${
                  captionPresetClass || captionSizeClass
                }`}
                style={{
                  color: captionStyle.color || captionPresetColor || captionColor,
                  fontFamily: captionStyle.fontFamily,
                  fontSize: `${Math.round(captionStyle.fontSize * 0.25)}px`,
                  fontWeight: captionStyle.fontWeight === 'Black' ? 900 : captionStyle.fontWeight === 'Bold' ? 700 : captionStyle.fontWeight === 'Medium' ? 500 : 400,
                  textAlign: captionStyle.textAlign,
                  textShadow: captionPresetClass?.includes('custom-caption-style')
                    ? captionPresetClass.includes('custom-caption-shadow')
                      ? '0 2px 10px rgba(0,0,0,0.95), 0 4px 20px rgba(0,0,0,0.85)'
                      : 'none'
                    : captionStyle.dropShadow
                      ? '0 2px 10px rgba(0,0,0,0.95), 0 4px 20px rgba(0,0,0,0.85)'
                      : 'none',
                  WebkitTextStroke: captionPresetClass?.includes('custom-caption-style')
                    ? captionPresetClass.includes('custom-caption-outline')
                      ? '1px #000000'
                      : '0px transparent'
                    : undefined,
                }}
              >
                {currentSubtitle}
              </p>
            </div>
          </div>
        )}

        {/* Bottom Spacing Anchor */}
        <div className="h-6 pointer-events-none" />

        {/* ── React Moveable Transform Bounding Box (Clideo/Canva Style) ── */}
        {targetElement && !isExporting && (
          <Moveable
            target={targetElement}
            container={canvasRef.current}
            origin={false}
            edge={true}
            draggable={true}
            resizable={true}
            rotatable={true}
            scalable={false}
            keepRatio={false}
            rotationPosition="top"
            renderDirections={['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']}
            throttleDrag={0}
            throttleResize={0}
            throttleRotate={0}
            onDragStart={(e) => {
              e.setTransform(e.target.style.transform);
            }}
            onDrag={({ target, transform }) => {
              target.style.transform = transform;
            }}
            onResizeStart={(e) => {
              e.setOrigin(['%', '%']);
              if (e.dragStart) {
                e.dragStart.setTransform(e.target.style.transform);
              }
            }}
            onResize={({ target, width, height, delta, drag }) => {
              if (delta[0]) target.style.width = `${width}px`;
              if (delta[1]) target.style.height = `${height}px`;
              if (drag && drag.transform) {
                target.style.transform = drag.transform;
              }
            }}
            onRotateStart={(e) => {
              e.setTransform(e.target.style.transform);
            }}
            onRotate={({ target, transform }) => {
              target.style.transform = transform;
            }}
          />
        )}

        {/* Layer: Shorts / Reels Safe Zones Overlay */}
          <CanvasSafeZonesOverlay isVisible={showSafeZones && !isExporting} platform="shorts" />
        </div>
      </div>
    </div>
  );
};

export default VideoPreviewPane;
