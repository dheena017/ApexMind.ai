import React, { useEffect, useState } from 'react';
import {
  FlipHorizontal, FlipVertical, RotateCw, Minus, Plus,
  Sparkles, Zap, Eye, Layers, Copy, RefreshCw,
  Move, Maximize2, Lock, Unlock, SlidersHorizontal,
  Clock, Star, TriangleRight, Check, Palette,
} from 'lucide-react';

export interface OverlayCompoundInspectorProps {
  activeOverlay?: { type: string; value: string; label?: string; id?: string; name?: string } | null;
}

const ANIMATION_PRESETS = [
  { id: 'none', label: 'Static (Fixed)', desc: 'No entrance motion', icon: '—' },
  { id: 'fade', label: 'Smooth Fade In', desc: 'Gentle opacity rise', icon: '✨' },
  { id: 'pop', label: 'Pop & Scale In', desc: 'Punchy scale-up entrance', icon: '💥' },
  { id: 'slide-up', label: 'Slide Up Entrance', desc: 'Slides up from bottom', icon: '⬆️' },
  { id: 'slide-left', label: 'Slide Left', desc: 'Enters from right side', icon: '⬅️' },
  { id: 'slide-right', label: 'Slide Right', desc: 'Enters from left side', icon: '➡️' },
  { id: 'bounce', label: 'Bounce Drop', desc: 'Dynamic energetic bounce', icon: '🔵' },
  { id: 'spin', label: 'Spin Enter', desc: 'Rotational 360 spin entrance', icon: '🌀' },
  { id: 'pulse', label: 'Pulse Heartbeat', desc: 'Continuous subtle heartbeat', icon: '💓' },
];

const BLEND_MODES = [
  { id: 'Normal', label: 'Normal', desc: 'Standard opaque alpha' },
  { id: 'Screen', label: 'Screen', desc: 'Lightens & removes dark areas' },
  { id: 'Multiply', label: 'Multiply', desc: 'Darkens & blends texture' },
  { id: 'Overlay', label: 'Overlay', desc: 'High-contrast lighting blend' },
  { id: 'Soft Light', label: 'Soft Light', desc: 'Subtle atmospheric wash' },
  { id: 'Hard Light', label: 'Hard Light', desc: 'Intense spotlight lighting' },
  { id: 'Color Dodge', label: 'Color Dodge', desc: 'Bright glowing highlights' },
  { id: 'Difference', label: 'Difference', desc: 'Inverted artistic contrast' },
];

const POSITION_ANCHORS = [
  { label: 'Top-Left', x: 10, y: 15 },
  { label: 'Top-Center', x: 50, y: 15 },
  { label: 'Top-Right', x: 90, y: 15 },
  { label: 'Mid-Left', x: 10, y: 50 },
  { label: 'Center', x: 50, y: 50 },
  { label: 'Mid-Right', x: 90, y: 50 },
  { label: 'Bottom-Left', x: 10, y: 82 },
  { label: 'Lower-Third', x: 50, y: 82 },
  { label: 'Bottom-Right', x: 90, y: 82 },
];

const COLOR_PRESETS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#FBBF24', '#FFFFFF', '#000000',
];

export const OverlayCompoundInspector: React.FC<OverlayCompoundInspectorProps> = ({
  activeOverlay,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'transform' | 'animate' | 'color' | 'shadow' | 'time'>('transform');

  // Transform states
  const [fitMode, setFitMode] = useState<'fit' | 'fill' | 'stretch'>('fit');
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(100);
  const [lockAspect, setLockAspect] = useState(true);
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(78);

  // Style & Color
  const [accentColor, setAccentColor] = useState('#3B82F6');
  const [gradientEnd, setGradientEnd] = useState('#1D4ED8');
  const [useGradient, setUseGradient] = useState(false);
  const [blendMode, setBlendMode] = useState('Normal');
  const [opacity, setOpacity] = useState(100);

  // Glow & Shadow
  const [glow, setGlow] = useState(false);
  const [glowColor, setGlowColor] = useState('#3B82F6');
  const [glowRadius, setGlowRadius] = useState(15);
  const [shadow, setShadow] = useState(true);
  const [shadowBlur, setShadowBlur] = useState(10);

  // Animation & Timing
  const [animation, setAnimation] = useState('pop');
  const [animDuration, setAnimDuration] = useState(0.35);
  const [delay, setDelay] = useState(0.0);
  const [displayDuration, setDisplayDuration] = useState(4.0);
  const [loopAnim, setLoopAnim] = useState(false);

  // Broadcast overlay style changes in real-time
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('workspace:overlay-style-change', {
        detail: {
          fitMode,
          flipH,
          flipV,
          rotation,
          scale,
          posX,
          posY,
          lockAspect,
          accentColor,
          gradientEnd: useGradient ? gradientEnd : undefined,
          blendMode,
          opacity,
          glow,
          glowColor,
          glowRadius,
          shadow,
          shadowBlur,
          animation,
          animDuration,
          delay,
          duration: displayDuration,
          loop: loopAnim,
        },
      })
    );
  }, [
    fitMode, flipH, flipV, rotation, scale, posX, posY, lockAspect,
    accentColor, gradientEnd, useGradient, blendMode, opacity,
    glow, glowColor, glowRadius, shadow, shadowBlur,
    animation, animDuration, delay, displayDuration, loopAnim,
  ]);

  const handleResetTransform = () => {
    setScale(100);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setPosX(50);
    setPosY(78);
    setFitMode('fit');
  };

  const tabs = ['transform', 'animate', 'color', 'shadow', 'time'] as const;

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
            {tab === 'animate' ? 'Motion FX' : tab}
          </button>
        ))}
      </div>

      {/* ── Tab Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">

        {/* ── TRANSFORM TAB ── */}
        {activeSubTab === 'transform' && (
          <div className="flex flex-col gap-3.5 pt-0.5">
            {/* Active Overlay Card */}
            {activeOverlay ? (
              <div className="w-full p-2.5 rounded-xl bg-[#18181C] border border-[#282830] flex items-center gap-2.5">
                <div className="shrink-0 text-xl w-9 h-9 flex items-center justify-center bg-[#1E1E24] rounded-lg">
                  {activeOverlay.type === 'sticker' ? activeOverlay.value : '🏷️'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] font-mono-studio text-[#71717A] uppercase tracking-wider">Active Overlay Target</div>
                  <div className="text-xs font-semibold text-white truncate">
                    {activeOverlay.name || activeOverlay.label || activeOverlay.value}
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              </div>
            ) : (
              <div className="w-full p-3 rounded-xl bg-[#18181C] border border-dashed border-[#2A2A30] text-center">
                <p className="text-[11px] text-[#71717A] font-medium">Select a sticker or badge from Elements pane to inspect</p>
              </div>
            )}

            {/* 9-Point Interactive Anchor Grid */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">9-Point Screen Placement</span>
              <div className="grid grid-cols-3 gap-1.5 aspect-[16/9] max-h-36 bg-[#111114] p-2 rounded-lg border border-[#222228]">
                {POSITION_ANCHORS.map((anchor) => {
                  const isNear = Math.abs(posX - anchor.x) <= 5 && Math.abs(posY - anchor.y) <= 5;
                  return (
                    <button
                      key={anchor.label}
                      type="button"
                      onClick={() => {
                        setPosX(anchor.x);
                        setPosY(anchor.y);
                      }}
                      className={`rounded flex flex-col items-center justify-center text-[9px] font-semibold border transition-all cursor-pointer ${
                        isNear
                          ? 'bg-[#1E2A3A] border-[#3B82F6] text-white shadow-sm'
                          : 'bg-[#18181C] border-[#25252A] text-[#71717A] hover:text-white'
                      }`}
                    >
                      {anchor.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Precision XY Sliders + Inputs */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2.5">
              <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Fine Position Coordinates</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'X Position', value: posX, setter: setPosX },
                  { label: 'Y Position', value: posY, setter: setPosY },
                ].map((ctrl) => (
                  <div key={ctrl.label} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs items-center">
                      <span className="text-[#A1A1AA]">{ctrl.label}</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={ctrl.value}
                        onChange={(e) => ctrl.setter(Math.max(0, Math.min(100, Number(e.target.value) || 50)))}
                        className="w-11 bg-[#121215] border border-[#2A2A30] rounded px-1 py-0.5 text-right font-mono-studio text-xs text-white outline-none"
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={ctrl.value}
                      onChange={(e) => ctrl.setter(Number(e.target.value))}
                      className="w-full accent-[#3B82F6] cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Scale Zoom & Aspect Lock */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#A1A1AA] flex items-center gap-1.5 font-medium">
                  Scale Zoom
                  <button
                    type="button"
                    onClick={() => setLockAspect(!lockAspect)}
                    className="cursor-pointer text-[#71717A] hover:text-white"
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
                    className="w-12 bg-[#121215] border border-[#2A2A30] rounded px-1 py-0.5 text-right font-mono-studio text-xs text-white outline-none"
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

            {/* Rotation & Flips */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Orientation</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFlipH(!flipH)}
                  className={`flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 border text-xs font-semibold cursor-pointer transition-colors ${
                    flipH ? 'bg-[#2E2E36] border-[#3B82F6] text-white' : 'bg-[#141417] border-[#2A2A30] text-[#A1A1AA] hover:bg-[#202026]'
                  }`}
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  Flip H
                </button>
                <button
                  type="button"
                  onClick={() => setFlipV(!flipV)}
                  className={`flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 border text-xs font-semibold cursor-pointer transition-colors ${
                    flipV ? 'bg-[#2E2E36] border-[#3B82F6] text-white' : 'bg-[#141417] border-[#2A2A30] text-[#A1A1AA] hover:bg-[#202026]'
                  }`}
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

            {/* Reset Button */}
            <button
              type="button"
              onClick={handleResetTransform}
              className="w-full py-2 rounded-xl bg-[#1C1C20] hover:bg-[#282830] border border-[#2A2A30] text-xs font-semibold text-[#A1A1AA] hover:text-white transition cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Overlay Geometry
            </button>
          </div>
        )}

        {/* ── MOTION FX TAB ── */}
        {activeSubTab === 'animate' && (
          <div className="flex flex-col gap-3 pt-0.5">
            <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Entrance Motion Presets</span>
            <div className="flex flex-col gap-1.5">
              {ANIMATION_PRESETS.map((anim) => (
                <button
                  key={anim.id}
                  type="button"
                  onClick={() => setAnimation(anim.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                    animation === anim.id
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
                  {animation === anim.id && <Check className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />}
                </button>
              ))}
            </div>

            {animation !== 'none' && (
              <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2.5">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#A1A1AA]">Entrance Duration</span>
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

                <div className="flex flex-col gap-1 pt-1 border-t border-[#25252A]">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#A1A1AA]">Start Delay Offset</span>
                    <span className="font-mono-studio text-white">{delay}s</span>
                  </div>
                  <input
                    type="range"
                    step="0.1"
                    min="0"
                    max="5"
                    value={delay}
                    onChange={(e) => setDelay(parseFloat(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── COLOR & BLEND TAB ── */}
        {activeSubTab === 'color' && (
          <div className="flex flex-col gap-3.5 pt-0.5">
            {/* Blend Mode Selector */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Compositing Blend Mode</span>
              <div className="grid grid-cols-2 gap-1.5">
                {BLEND_MODES.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBlendMode(b.id)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                      blendMode === b.id
                        ? 'bg-[#1E2A3A] border-[#3B82F6] text-white shadow-sm'
                        : 'bg-[#18181C] border-[#282830] text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    <p className="text-xs font-bold text-white mb-0.5">{b.label}</p>
                    <p className="text-[8px] text-[#71717A]">{b.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Color Chooser */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#A1A1AA] font-medium">Overlay Color Tint</span>
                <span className="font-mono-studio text-white">{accentColor}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-[#2A2A30] bg-transparent cursor-pointer shrink-0"
                />
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAccentColor(c)}
                      style={{ background: c }}
                      className={`w-5 h-5 rounded-md border transition-transform cursor-pointer ${
                        accentColor.toLowerCase() === c.toLowerCase() ? 'scale-125 border-white ring-2 ring-blue-500/50' : 'border-white/20 hover:scale-110'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Opacity Slider */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#A1A1AA]">Layer Opacity</span>
                <span className="font-mono-studio text-white font-bold">{opacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full accent-[#3B82F6] cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* ── SHADOW & GLOW TAB ── */}
        {activeSubTab === 'shadow' && (
          <div className="flex flex-col gap-3.5 pt-0.5">
            {/* Glow Light */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">Atmospheric Glow</p>
                  <p className="text-[10px] text-[#71717A]">Radiant light halo around edges</p>
                </div>
                <button
                  type="button"
                  onClick={() => setGlow(!glow)}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                    glow ? 'bg-[#3B82F6]' : 'bg-[#2A2A30]'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${glow ? 'left-5' : 'left-1'}`} />
                </button>
              </div>

              {glow && (
                <div className="flex flex-col gap-2 pt-2 border-t border-[#25252A]">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#A1A1AA]">Glow Radius</span>
                    <span className="font-mono-studio text-white">{glowRadius}px</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    value={glowRadius}
                    onChange={(e) => setGlowRadius(Number(e.target.value))}
                    className="w-full accent-[#3B82F6] cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#A1A1AA]">Glow Color</span>
                    <input
                      type="color"
                      value={glowColor}
                      onChange={(e) => setGlowColor(e.target.value)}
                      className="w-7 h-7 rounded border border-[#2A2A30] bg-transparent cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Drop Shadow */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">Depth Drop Shadow</p>
                  <p className="text-[10px] text-[#71717A]">Separates overlay from video background</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShadow(!shadow)}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                    shadow ? 'bg-[#3B82F6]' : 'bg-[#2A2A30]'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${shadow ? 'left-5' : 'left-1'}`} />
                </button>
              </div>

              {shadow && (
                <div className="flex flex-col gap-1 pt-2 border-t border-[#25252A]">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#A1A1AA]">Shadow Softness Blur</span>
                    <span className="font-mono-studio text-white">{shadowBlur}px</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="30"
                    value={shadowBlur}
                    onChange={(e) => setShadowBlur(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TIME TAB ── */}
        {activeSubTab === 'time' && (
          <div className="flex flex-col gap-3.5 pt-0.5">
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#A1A1AA]">Display Duration</span>
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
                  onChange={(e) => setDisplayDuration(Math.max(0.5, Math.min(60, Number(e.target.value) || 4)))}
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

            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-white">Loop Motion FX</p>
                <p className="text-[10px] text-[#71717A]">Keep animation pulsing across entire duration</p>
              </div>
              <button
                type="button"
                onClick={() => setLoopAnim(!loopAnim)}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                  loopAnim ? 'bg-[#3B82F6]' : 'bg-[#2A2A30]'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${loopAnim ? 'left-5' : 'left-1'}`} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default OverlayCompoundInspector;
