import React, { useEffect, useRef, useState } from 'react';
import Moveable from 'react-moveable';
import { GeneratedScript, VisualBackdrop, BackdropFilterSettings } from '../../types';
import { CanvasSafeZonesOverlay } from './CanvasSafeZonesOverlay';
import { consoleLogger } from '@/src/shared/utils/logger';

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
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const [selectedLayer, setSelectedLayer] = useState<'subtitle' | 'title' | 'overlay' | 'backdrop' | null>(null);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [backdropFlipH, setBackdropFlipH] = useState(false);
  const [backdropFlipV, setBackdropFlipV] = useState(false);
  const [, setBackdropRotation] = useState(0);
  const [backdropFitMode, setBackdropFitMode] = useState<'fill' | 'fit' | 'crop'>('fill');

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
    grain: false,
    activeOverlay: 'none',
  });

  // Listen for backdrop transform and filter changes from inspectors
  useEffect(() => {
    const handleTransform = (e: Event) => {
      const customEvent = e as CustomEvent<{
        fitMode?: 'fill' | 'fit' | 'crop';
        flipH?: boolean;
        flipV?: boolean;
        rotation?: number;
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
      if (detail.rotation !== undefined) {
        setBackdropRotation(detail.rotation);
        if (backdropRef.current) {
          backdropRef.current.style.transform = `rotate(${detail.rotation}deg)`;
        }
      }
      if (detail.fitMode) setBackdropFitMode(detail.fitMode);
    };

    const handleFilter = (e: Event) => {
      const customEvent = e as CustomEvent<Partial<BackdropFilterSettings>>;
      if (customEvent.detail) {
        setFilterSettings((prev) => ({ ...prev, ...customEvent.detail }));
      }
    };

    window.addEventListener('workspace:backdrop-transform', handleTransform);
    window.addEventListener('workspace:backdrop-filter', handleFilter);
    return () => {
      window.removeEventListener('workspace:backdrop-transform', handleTransform);
      window.removeEventListener('workspace:backdrop-filter', handleFilter);
    };
  }, []);

  const theme = (activeBackdrop?.id && BACKDROP_THEMES[activeBackdrop.id]) || null;
  const activeVideo = customVideoUrl;
  const activeImage = customImageUrl || filterSettings.customImageUrl || (activeBackdrop?.imageUrl || theme?.imageUrl || undefined);

  // Active subtitle text matching current playback position
  const activeSubtitle = (() => {
    if (!script.subtitles || script.subtitles.length === 0) {
      return script.quote || script.hook || '';
    }
    const current = script.subtitles.find(
      (s) => currentTime >= s.start && currentTime <= s.start + (s.duration || 3)
    );
    if (current) return current.text;
    if (currentTime > 0 && script.subtitles.length > 0) {
      return script.cta || script.subtitles[script.subtitles.length - 1].text;
    }
    return '';
  })();

  const currentTitle = script.title?.trim() || '';
  const currentSubtitle = (activeSubtitle || script.quote || '').trim();

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
    <div className="w-full h-full flex items-center justify-center p-1.5 select-none font-sans-studio overflow-hidden">
      {/* ── Dynamic Aspect Ratio Video Studio Canvas ────────────────── */}
      <div
        ref={canvasRef}
        onClick={(e) => {
          // Only toggle play if clicking the empty canvas background (not a layer element)
          if (e.target === canvasRef.current) {
            setSelectedLayer(null);
            setTargetElement(null);
            onTogglePlay();
          }
        }}
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

        {/* Layer 1b: Visual Backdrop — interactive layer with Moveable (resize, move, rotate) */}
        {activeVideo ? (
          <div
            ref={backdropRef}
            onClick={(e) => handleSelectLayer(e, 'backdrop')}
            onDoubleClick={handleResetBackdrop}
            className="absolute inset-0 z-10 overflow-hidden cursor-move select-none"
            title="Video Layer • Click to select & resize/move, double-click to reset"
          >
            <video
              src={activeVideo}
              autoPlay
              loop
              muted
              playsInline
              className={`w-full h-full pointer-events-none transition-all duration-300 ${
                backdropFitMode === 'fit' ? 'object-contain' : 'object-cover'
              } object-center opacity-100`}
              style={{
                transform: `${backdropFlipH ? 'scaleX(-1)' : ''} ${backdropFlipV ? 'scaleY(-1)' : ''}`.trim() || undefined,
              }}
            />
            {/* Vignette Depth — only when explicitly adjusted by user */}
            {filterSettings.vignette > 0 && (
              <div
                className="absolute inset-0 pointer-events-none transition-opacity"
                style={{
                  background: `radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,${filterSettings.vignette / 100}) 100%)`,
                }}
              />
            )}
          </div>
        ) : activeImage ? (
          <div
            ref={backdropRef}
            onClick={(e) => handleSelectLayer(e, 'backdrop')}
            onDoubleClick={handleResetBackdrop}
            className="absolute inset-0 z-10 overflow-hidden cursor-move select-none"
            title="Image Layer • Click to select & resize/move, double-click to reset"
          >
            <img
              src={activeImage}
              alt={activeBackdrop?.name || 'Visual Backdrop'}
              className={`w-full h-full pointer-events-none transition-all duration-300 ${
                backdropFitMode === 'fit' ? 'object-contain' : 'object-cover'
              } object-center opacity-100`}
              style={{
                transform: `${backdropFlipH ? 'scaleX(-1)' : ''} ${backdropFlipV ? 'scaleY(-1)' : ''}`.trim() || undefined,
                filter: filterSettings.brightness !== 100 || filterSettings.contrast !== 100 || filterSettings.saturate !== 100
                  ? `brightness(${filterSettings.brightness}%) contrast(${filterSettings.contrast}%) saturate(${filterSettings.saturate}%)`
                  : undefined,
              }}
              loading="eager"
            />
            {/* Vignette Depth — only when explicitly adjusted by user */}
            {filterSettings.vignette > 0 && (
              <div
                className="absolute inset-0 pointer-events-none transition-opacity"
                style={{
                  background: `radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,${filterSettings.vignette / 100}) 100%)`,
                }}
              />
            )}
          </div>
        ) : null}

        {/* Dynamic Canvas Progress Bar Overlay */}
        {activeElementOverlay?.type === 'progress' && (
          <div className="absolute top-0 inset-x-0 h-1.5 bg-[#262626] z-30 overflow-hidden pointer-events-none">
            <div
              className="h-full bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] transition-all duration-200"
              style={{
                width: `${duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 55}%`,
              }}
            />
          </div>
        )}

        {/* ── Title Header ────────────────────────────────────────────── */}
        {Boolean(currentTitle) && (
          <div className="relative z-20 px-3 pt-6 pb-0.5 flex justify-center pointer-events-none">
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
        {activeElementOverlay?.type === 'badge' && (
          <div className="relative z-20 flex justify-center pb-1 pointer-events-none">
            <div
              ref={overlayRef}
              onClick={(e) => handleSelectLayer(e, 'overlay')}
              className="w-fit cursor-move select-none pointer-events-auto"
            >
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg border border-white/20 tracking-wider pointer-events-none">
                {activeElementOverlay.value}
              </span>
            </div>
          </div>
        )}

        {/* Dynamic Motivational Sticker Overlay */}
        {activeElementOverlay?.type === 'sticker' && (
          <div
            ref={overlayRef}
            onClick={(e) => handleSelectLayer(e, 'overlay')}
            className="absolute top-10 right-3.5 z-20 text-3xl cursor-move select-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]"
          >
            {activeElementOverlay.value}
          </div>
        )}

        {/* ── Subtitle / Quote Dynamic Stage ─────────────────────────── */}
        {Boolean(currentSubtitle) && (
          <div
            ref={subtitleRef}
            onClick={(e) => handleSelectLayer(e, 'subtitle')}
            className="absolute left-1/2 -translate-x-1/2 z-20 w-fit max-w-[88%] flex flex-col items-center justify-center cursor-move select-none p-2"
            style={{
              top: `${subtitleYPercent}%`,
            }}
          >
            <div className="pointer-events-none">
              <p
                className={`font-black uppercase text-center leading-tight ${
                  captionPresetClass || captionSizeClass
                }`}
                style={{
                  color: captionPresetColor || captionColor,
                  textShadow:
                    captionPresetClass
                      ? undefined
                      : '0 2px 10px rgba(0,0,0,0.95), 0 4px 20px rgba(0,0,0,0.85)',
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
        {targetElement && (
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
        <CanvasSafeZonesOverlay isVisible={showSafeZones} platform="shorts" />
      </div>
    </div>
  );
};

export default VideoPreviewPane;
