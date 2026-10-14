import React, { useState, useEffect } from 'react';
import {
  Crop,
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  Minus,
  Plus,
  Film,
} from 'lucide-react';
import { VisualBackdrop } from '../../types';
import { CustomSelect } from '@/src/shared/ui/CustomSelect';

type VideoInspectorTab = 'transform' | 'style' | 'animations' | 'adjust' | 'audio' | 'speed' | 'time';

const VIDEO_STYLE_PRESETS = [
  { label: 'Natural', brightness: 100, contrast: 100, saturation: 100, vignette: 0 },
  { label: 'Cinematic', brightness: 96, contrast: 125, saturation: 82, vignette: 24 },
  { label: 'Vivid', brightness: 105, contrast: 115, saturation: 145, vignette: 8 },
  { label: 'Noir', brightness: 95, contrast: 140, saturation: 0, vignette: 35 },
  { label: 'Vintage', brightness: 105, contrast: 90, saturation: 72, vignette: 22 },
];

export interface VideoCompoundInspectorProps {
  activeBackdrop: VisualBackdrop;
  backdrops: VisualBackdrop[];
  onSelectBackdrop: (backdropId: string) => void;
  duration: number;
  onUpdateDuration?: (duration: number) => void;
  playbackRate?: number;
  onPlaybackRateChange?: (rate: number) => void;
  customImageUrl?: string;
  customVideoUrl?: string;
  onSetCustomImage?: (url: string | undefined) => void;
  onSetCustomVideo?: (url: string | undefined) => void;
  canvasBackground?: string;
  onCanvasBackgroundChange?: (bg: string) => void;
  initialSubTab?: VideoInspectorTab;
}

export const VideoCompoundInspector: React.FC<VideoCompoundInspectorProps> = ({
  activeBackdrop,
  backdrops,
  onSelectBackdrop,
  duration = 12.1,
  onUpdateDuration,
  playbackRate = 1,
  onPlaybackRateChange,
  customImageUrl,
  customVideoUrl,
  onSetCustomImage,
  onSetCustomVideo,
  canvasBackground = '#050505',
  onCanvasBackgroundChange,
  initialSubTab = 'transform',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<VideoInspectorTab>(initialSubTab);

  // Transform states (Image 1)
  const [fitMode, setFitMode] = useState<'fill' | 'fit' | 'crop'>('fill');
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [rotation, setRotation] = useState(0);

  // Time states (Image 2)
  const [timeMode, setTimeMode] = useState<'duration' | 'timing'>('duration');
  const [localDuration, setLocalDuration] = useState(duration > 0 ? duration : 12.1);

  // Adjust states
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [vignette, setVignette] = useState(0);
  const [activeStyle, setActiveStyle] = useState('Natural');

  // Audio / Animation states
  const [videoVolume, setVideoVolume] = useState(100);
  const [animation, setAnimation] = useState('none');

  // Handlers to notify VideoPreviewPane canvas live
  const handleSetFitMode = (mode: 'fill' | 'fit' | 'crop') => {
    setFitMode(mode);
    window.dispatchEvent(
      new CustomEvent('workspace:backdrop-transform', {
        detail: { fitMode: mode },
      })
    );
  };

  const handleToggleFlipH = () => {
    const next = !flipH;
    setFlipH(next);
    window.dispatchEvent(
      new CustomEvent('workspace:backdrop-transform', {
        detail: { flipH: next },
      })
    );
  };

  const handleToggleFlipV = () => {
    const next = !flipV;
    setFlipV(next);
    window.dispatchEvent(
      new CustomEvent('workspace:backdrop-transform', {
        detail: { flipV: next },
      })
    );
  };

  const handleUpdateRotation = (newRot: number) => {
    setRotation(newRot);
    window.dispatchEvent(
      new CustomEvent('workspace:backdrop-transform', {
        detail: { rotation: newRot },
      })
    );
  };

  const handleResetTransform = () => {
    setFitMode('fill');
    setFlipH(false);
    setFlipV(false);
    setRotation(0);
    window.dispatchEvent(
      new CustomEvent('workspace:backdrop-transform', {
        detail: { reset: true, fitMode: 'fill', flipH: false, flipV: false, rotation: 0 },
      })
    );
  };

  // Sync adjust filters live to the canvas
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('workspace:backdrop-filter', {
        detail: {
          brightness,
          contrast,
          saturate: saturation,
          vignette,
        },
      })
    );
  }, [brightness, contrast, saturation, vignette]);

  // Format mm:ss.ms
  const formatTimeDigital = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleDurationChange = (newDur: number) => {
    const val = Math.max(1, Math.min(180, parseFloat(newDur.toFixed(1))));
    setLocalDuration(val);
    onUpdateDuration?.(val);
  };

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none">
      {/* ── Subtabs Header Bar (Exactly matching Image 1 & 2) ── */}
      <div className="flex items-center gap-4 px-3 pt-2.5 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar">
        {(['transform', 'style', 'animations', 'adjust', 'audio', 'speed', 'time'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveSubTab(tab)}
            className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
              activeSubTab === tab
                ? 'text-white border-white'
                : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {activeSubTab === 'style' && (
          <div className="flex flex-col gap-3 pt-1">
            <span className="text-xs text-[#71717A]">Choose a video look</span>
            <div className="grid grid-cols-2 gap-2.5">
              {VIDEO_STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setBrightness(preset.brightness);
                    setContrast(preset.contrast);
                    setSaturation(preset.saturation);
                    setVignette(preset.vignette);
                    setActiveStyle(preset.label);
                  }}
                  className={`p-3.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    activeStyle === preset.label
                      ? 'bg-[#2A2A34] border-[#3B82F6] text-white shadow'
                      : 'bg-[#1C1C20] border-[#2A2A30] text-[#9CA3AF] hover:bg-[#25252A]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 1: Transform (Image 1) */}
        {activeSubTab === 'transform' && (
          <div className="flex flex-col items-center gap-6 pt-1">
            {/* Fill, Fit, Crop Cards */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
              <button
                type="button"
                onClick={() => handleSetFitMode('fill')}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 p-3 transition-all cursor-pointer border ${
                  fitMode === 'fill'
                    ? 'bg-[#24242A] border-[#3B82F6] text-white shadow-lg'
                    : 'bg-[#1C1C20] border-[#2A2A30] text-[#A1A1AA] hover:bg-[#222228]'
                }`}
                title="Fill entire canvas with image"
              >
                <div className="w-8 h-8 rounded-lg bg-[#3A3A44] border-2 border-white/60 flex items-center justify-center" />
                <span className="text-xs font-medium">Fill</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetFitMode('fit')}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 p-3 transition-all cursor-pointer border ${
                  fitMode === 'fit'
                    ? 'bg-[#24242A] border-[#3B82F6] text-white shadow-lg'
                    : 'bg-[#1C1C20] border-[#2A2A30] text-[#A1A1AA] hover:bg-[#222228]'
                }`}
                title="Fit image inside canvas bounds"
              >
                <div className="w-8 h-8 rounded-lg bg-[#2A2A34] flex items-center justify-center">
                  <div className="w-4 h-6 rounded bg-white/70" />
                </div>
                <span className="text-xs font-medium">Fit</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetFitMode('crop')}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 p-3 transition-all cursor-pointer border ${
                  fitMode === 'crop'
                    ? 'bg-[#24242A] border-[#3B82F6] text-white shadow-lg'
                    : 'bg-[#1C1C20] border-[#2A2A30] text-[#A1A1AA] hover:bg-[#222228]'
                }`}
                title="Crop image frame"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80">
                  <Crop className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium">Crop</span>
              </button>
            </div>

            {/* Flip & Rotate Header and Controls */}
            <div className="w-full flex flex-col items-center gap-3.5 pt-2">
              <span className="text-xs font-semibold text-[#71717A]">Flip & Rotate</span>

              <div className="flex items-center gap-2.5">
                {/* Flip Horizontal */}
                <button
                  type="button"
                  onClick={handleToggleFlipH}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors cursor-pointer ${
                    flipH
                      ? 'bg-[#2E2E36] border-[#3B82F6] text-white'
                      : 'bg-[#1C1C20] border-[#2A2A30] text-[#D4D4D8] hover:bg-[#26262C]'
                  }`}
                  title="Flip Horizontal"
                >
                  <FlipHorizontal className="w-4 h-4" />
                </button>

                {/* Flip Vertical */}
                <button
                  type="button"
                  onClick={handleToggleFlipV}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors cursor-pointer ${
                    flipV
                      ? 'bg-[#2E2E36] border-[#3B82F6] text-white'
                      : 'bg-[#1C1C20] border-[#2A2A30] text-[#D4D4D8] hover:bg-[#26262C]'
                  }`}
                  title="Flip Vertical"
                >
                  <FlipVertical className="w-4 h-4" />
                </button>

                {/* Rotate 90 deg */}
                <button
                  type="button"
                  onClick={() => handleUpdateRotation((rotation + 90) % 360)}
                  className="w-10 h-10 rounded-xl bg-[#1C1C20] border border-[#2A2A30] flex items-center justify-center text-[#D4D4D8] hover:bg-[#26262C] transition-colors cursor-pointer"
                  title="Rotate 90 degrees"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                {/* Angle Stepper */}
                <div className="flex items-center bg-[#1C1C20] border border-[#2A2A30] rounded-xl px-2.5 h-10 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateRotation((rotation - 15 + 360) % 360)}
                    className="text-[#9CA3AF] hover:text-white cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-mono-studio text-white min-w-[32px] text-center font-bold">
                    {rotation}°
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdateRotation((rotation + 15) % 360)}
                    className="text-[#9CA3AF] hover:text-white cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Reset Transform Button */}
              <button
                type="button"
                onClick={handleResetTransform}
                className="w-full max-w-xs mt-1 py-2 px-3 rounded-xl bg-[#1C1C20] hover:bg-[#282830] border border-[#2A2A30] text-xs font-semibold text-[#A1A1AA] hover:text-white transition cursor-pointer flex items-center justify-center gap-2"
                title="Reset position, scale, and rotation to original fill"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Reset Image Transform & Position
              </button>
            </div>

            {/* Live Backdrop Preview */}
            {(customVideoUrl || customImageUrl || activeBackdrop?.id) && (
              <div className="w-full pt-2">
                <label className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider mb-1.5 block">
                  Active Backdrop Preview
                </label>
                <div className="w-full aspect-video rounded-xl overflow-hidden border border-[#2A2A30] bg-[#111114] relative">
                  {customVideoUrl ? (
                    <video
                      src={customVideoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : customImageUrl ? (
                    <img
                      src={customImageUrl}
                      alt="Custom backdrop"
                      className="w-full h-full object-cover"
                    />
                  ) : activeBackdrop?.imageUrl ? (
                    <img
                      src={activeBackdrop.imageUrl}
                      alt={activeBackdrop.name}
                      className="w-full h-full object-cover opacity-70"
                    />
                  ) : (
                    <div
                      className="w-full h-full"
                      style={{ background: activeBackdrop?.previewColor || '#1a1a2e' }}
                    />
                  )}
                  {(customImageUrl || customVideoUrl) && (
                    <button
                      type="button"
                      onClick={() => { onSetCustomImage?.(undefined); onSetCustomVideo?.(undefined); }}
                      className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-black/90 text-white text-[10px] px-2 py-0.5 rounded-lg border border-white/20 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Backdrop Switcher Preset */}
            <div className="w-full pt-4">
              <CustomSelect
                label="Visual Backdrop Preset"
                labelClassName="text-[10px] text-[#71717A] uppercase font-bold tracking-wider mb-1.5 block"
                value={activeBackdrop?.id || ''}
                onChange={(backdropId) => {
                  onSetCustomImage?.(undefined);
                  onSetCustomVideo?.(undefined);
                  onSelectBackdrop(backdropId);
                }}
                options={backdrops.map((b) => ({
                  value: b.id,
                  label: `${b.name} (${b.category})`,
                  description: b.category,
                  badge: b.aspectRatio || '9:16',
                }))}
                icon={<Film className="w-3.5 h-3.5 text-[#60A5FA]" />}
                placeholder="Choose visual backdrop preset..."
                buttonClassName="bg-[#1C1C20] border-[#2A2A30] hover:border-[#3B82F6]/50"
                menuClassName="bg-[#1C1C20] border-[#2A2A30]"
              />
            </div>


          </div>
        )}


        {/* TAB 2: Time (Image 2) */}
        {activeSubTab === 'time' && (
          <div className="flex flex-col items-center gap-6 pt-1">
            {/* Duration vs Timing Subtabs */}
            <div className="flex bg-[#18181C] p-1 rounded-xl border border-[#2A2A30] w-full max-w-xs">
              <button
                type="button"
                onClick={() => setTimeMode('duration')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  timeMode === 'duration' ? 'bg-[#2A2A32] text-white shadow' : 'text-[#71717A] hover:text-white'
                }`}
              >
                Duration
              </button>
              <button
                type="button"
                onClick={() => setTimeMode('timing')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  timeMode === 'timing' ? 'bg-[#2A2A32] text-white shadow' : 'text-[#71717A] hover:text-white'
                }`}
              >
                Timing
              </button>
            </div>

            {/* Stepper Box with Centered Digital Timer */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleDurationChange(localDuration - 0.5)}
                className="w-10 h-10 rounded-full bg-[#1C1C20] border border-[#2A2A30] flex items-center justify-center text-white hover:bg-[#282830] transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="px-5 py-2.5 rounded-xl bg-[#1C1C20] border border-[#2F2F36] text-base font-mono-studio font-bold text-white tracking-widest">
                {formatTimeDigital(localDuration)}
              </div>

              <button
                type="button"
                onClick={() => handleDurationChange(localDuration + 0.5)}
                className="w-10 h-10 rounded-full bg-[#1C1C20] border border-[#2A2A30] flex items-center justify-center text-white hover:bg-[#282830] transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-4 gap-2 w-full max-w-xs">
              {[
                { label: '15s', sec: 15 },
                { label: '30s', sec: 30 },
                { label: '60s', sec: 60 },
                { label: '1m', sec: 60 },
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDurationChange(p.sec)}
                  className={`py-2 rounded-xl text-xs font-mono-studio transition-all cursor-pointer border ${
                    localDuration === p.sec
                      ? 'bg-[#2A2A34] border-[#3B82F6] text-white font-bold'
                      : 'bg-[#1C1C20] border-[#2A2A30] text-[#9CA3AF] hover:bg-[#26262C] hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Adjust */}
        {activeSubTab === 'adjust' && (
          <div className="flex flex-col gap-4 pt-1">
            {[
              { label: 'Brightness', val: brightness, set: setBrightness, min: 0, max: 200, unit: '%' },
              { label: 'Contrast', val: contrast, set: setContrast, min: 0, max: 200, unit: '%' },
              { label: 'Saturation', val: saturation, set: setSaturation, min: 0, max: 200, unit: '%' },
              { label: 'Vignette Depth', val: vignette, set: setVignette, min: 0, max: 100, unit: '%' },
            ].map((adj) => (
              <div key={adj.label} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-[#9CA3AF]">
                  <span>{adj.label}</span>
                  <span className="font-mono-studio text-white">{adj.val}{adj.unit}</span>
                </div>
                <input
                  type="range"
                  min={adj.min}
                  max={adj.max}
                  value={adj.val}
                  onChange={(e) => {
                    adj.set(Number(e.target.value));
                    setActiveStyle('Custom');
                  }}
                  className="w-full accent-[#3B82F6] cursor-pointer"
                />
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: Animations */}
        {activeSubTab === 'animations' && (
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {[
              { id: 'none', label: 'None' },
              { id: 'fade', label: 'Fade In' },
              { id: 'zoom', label: 'Slow Zoom' },
              { id: 'kenburns', label: 'Ken Burns' },
              { id: 'slide', label: 'Slide Up' },
              { id: 'glitch', label: 'Kinetic Glitch' },
            ].map((anim) => (
              <button
                key={anim.id}
                type="button"
                onClick={() => setAnimation(anim.id)}
                className={`p-3.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  animation === anim.id
                    ? 'bg-[#2A2A34] border-[#3B82F6] text-white shadow'
                    : 'bg-[#1C1C20] border-[#2A2A30] text-[#9CA3AF] hover:bg-[#25252A]'
                }`}
              >
                {anim.label}
              </button>
            ))}
          </div>
        )}

        {/* TAB 5: Speed */}
        {activeSubTab === 'speed' && (
          <div className="flex flex-col gap-3 pt-1">
            <span className="text-xs text-[#71717A]">Video Playback Speed</span>
            <div className="grid grid-cols-3 gap-2">
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => onPlaybackRateChange?.(rate)}
                  className={`py-2 rounded-xl text-xs font-mono-studio transition-all cursor-pointer border ${
                    playbackRate === rate
                      ? 'bg-[#3B82F6] text-white border-transparent font-bold'
                      : 'bg-[#1C1C20] border-[#2A2A30] text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: Audio */}
        {activeSubTab === 'audio' && (
          <div className="flex flex-col gap-4 pt-1">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs text-[#9CA3AF]">
                <span>Video Track Volume</span>
                <span className="font-mono-studio text-white">{videoVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={videoVolume}
                onChange={(e) => setVideoVolume(Number(e.target.value))}
                className="w-full accent-[#3B82F6] cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCompoundInspector;
