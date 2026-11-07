import React, { useEffect, useState } from 'react';
import { ScrollableTabs } from '@/src/shared/ui/ScrollableTabs';
import {
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  Minus,
  Plus,
  RefreshCw,
  Move,
  Lock,
  Unlock,
  Clock,
  Check,
  Palette,
} from 'lucide-react';
import { MotionInspectorPage, OVERLAY_MOTION_PRESETS } from './MotionInspectorPage';

export interface OverlayCompoundInspectorProps {
  activeOverlay?: { type: string; value: string; label?: string; id?: string; name?: string } | null;
}

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

const hslToHex = (h: number, s: number, l: number) => {
  const hue = h / 360;
  const saturation = s / 100;
  const lightness = l / 100;

  const hueToRgb = (p: number, q: number, t: number) => {
    let temp = t;
    if (temp < 0) temp += 1;
    if (temp > 1) temp -= 1;
    if (temp < 1 / 6) return p + (q - p) * 6 * temp;
    if (temp < 1 / 2) return q;
    if (temp < 2 / 3) return p + (q - p) * (2 / 3 - temp) * 6;
    return p;
  };

  let r: number; let g: number; let b: number;

  if (saturation === 0) {
    r = g = b = lightness;
  } else {
    const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
    const p = 2 * lightness - q;
    r = hueToRgb(p, q, hue + 1 / 3);
    g = hueToRgb(p, q, hue);
    b = hueToRgb(p, q, hue - 1 / 3);
  }

  const toHex = (value: number) => Math.round(value * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

const COLOR_PRESETS = [
  ...Array.from({ length: 18 }, (_, index) => hslToHex((index * 360) / 18, 82, 58)),
  '#FFFFFF',
  '#000000',
];

export const OverlayCompoundInspector: React.FC<OverlayCompoundInspectorProps> = ({
  activeOverlay,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'transform' | 'color' | 'motion'>('transform');

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
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [opacity, setOpacity] = useState(100);
  const [animation, setAnimation] = useState('none');
  const [animationOut, setAnimationOut] = useState('none');
  const [animationDirection, setAnimationDirection] = useState<'in' | 'out'>('in');
  const [animDuration, setAnimDuration] = useState(0.5);
  const [animOutDuration, setAnimOutDuration] = useState(0.5);

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
          textColor,
          opacity,
          animation,
          animationOut,
          animDuration,
          animOutDuration,
        },
      })
    );
  }, [
    fitMode, flipH, flipV, rotation, scale, posX, posY, lockAspect,
    accentColor, textColor, opacity, animation, animationOut, animDuration, animOutDuration,
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

  return (
    <div className="flex flex-col h-full bg-[#141414] text-white font-sans-studio select-none">
      {/* ── Subtabs Header Bar ── */}
      <div className="px-2.5 pt-2 pb-2 shrink-0 border-b border-[#242424] bg-[#111111]">
        <ScrollableTabs
          tabs={[
            { id: 'transform', label: 'Position', icon: Move },
            { id: 'color', label: 'Color', icon: Palette },
            { id: 'motion', label: 'Motion' },
          ]}
          activeTab={activeSubTab}
          onChange={(tab) => setActiveSubTab(tab as any)}
        />
      </div>

      {/* ── Tab Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">

        {/* ── TRANSFORM TAB ── */}
        {activeSubTab === 'transform' && (
          <div className="flex flex-col gap-3.5 pt-0.5">
            {/* Active Overlay Card */}
            {activeOverlay ? (
              <div className="w-full p-2.5 rounded-xl bg-[#181818] border border-[#242424] flex items-center gap-2.5">
                <div className="shrink-0 text-xl w-9 h-9 flex items-center justify-center bg-[#181D2B] rounded-lg">
                  {activeOverlay.type === 'sticker' ? activeOverlay.value : '✨'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] font-mono-studio text-slate-500 uppercase tracking-wider">Active Overlay Target</div>
                  <div className="text-xs font-semibold text-white truncate">
                    {activeOverlay.name || activeOverlay.label || activeOverlay.value}
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              </div>
            ) : (
              <div className="w-full p-3 rounded-xl bg-[#181818] border border-dashed border-[#242424] text-center">
                <p className="text-[11px] text-slate-500 font-medium">Select a sticker or badge from Elements pane to inspect</p>
              </div>
            )}

            {/* 9-Point Interactive Anchor Grid */}
            <div className="p-3 rounded-xl bg-[#181818] border border-[#242424] flex flex-col gap-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">9-Point Screen Placement</span>
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
                          ? 'bg-[#2563EB] border-[#60A5FA]/40 text-white shadow-xs'
                          : 'bg-[#181818] border-[#25252A] text-slate-500 hover:text-white'
                      }`}
                    >
                      {anchor.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Precision XY Sliders + Inputs */}
            <div className="p-3 rounded-xl bg-[#181818] border border-[#242424] flex flex-col gap-2.5">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Fine Position Coordinates</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'X Position', value: posX, setter: setPosX },
                  { label: 'Y Position', value: posY, setter: setPosY },
                ].map((ctrl) => (
                  <div key={ctrl.label} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs items-center">
                      <span className="text-slate-400">{ctrl.label}</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={ctrl.value}
                        onChange={(e) => ctrl.setter(Math.max(0, Math.min(100, Number(e.target.value) || 50)))}
                        className="w-11 bg-[#141414] border border-[#242424] rounded px-1 py-0.5 text-right font-mono-studio text-xs text-white outline-none"
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
            <div className="p-3 rounded-xl bg-[#181818] border border-[#242424] flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  Scale Zoom
                  <button
                    type="button"
                    onClick={() => setLockAspect(!lockAspect)}
                    className="cursor-pointer text-slate-500 hover:text-white"
                  >
                    {lockAspect ? <Lock className="w-3 h-3 text-[#3B82F6]" /> : <Unlock className="w-3 h-3 text-slate-500" />}
                  </button>
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="10"
                    max="400"
                    value={scale}
                    onChange={(e) => setScale(Math.max(10, Math.min(400, Number(e.target.value) || 100)))}
                    className="w-12 bg-[#141414] border border-[#242424] rounded px-1 py-0.5 text-right font-mono-studio text-xs text-white outline-none"
                  />
                  <span className="text-[10px] text-slate-500">%</span>
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
            <div className="p-3 rounded-xl bg-[#181818] border border-[#242424] flex flex-col gap-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Orientation</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFlipH(!flipH)}
                  className={`flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 border text-xs font-semibold cursor-pointer transition-colors ${
                    flipH ? 'bg-[#2563EB] border-[#60A5FA]/40 text-white shadow-xs' : 'bg-[#181818] border-[#242424] text-zinc-400 hover:bg-[#26262C] hover:border-white/10 hover:text-white'
                  }`}
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  Flip H
                </button>
                <button
                  type="button"
                  onClick={() => setFlipV(!flipV)}
                  className={`flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 border text-xs font-semibold cursor-pointer transition-colors ${
                    flipV ? 'bg-[#2563EB] border-[#60A5FA]/40 text-white shadow-xs' : 'bg-[#181818] border-[#242424] text-zinc-400 hover:bg-[#26262C] hover:border-white/10 hover:text-white'
                  }`}
                >
                  <FlipVertical className="w-3.5 h-3.5" />
                  Flip V
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="w-9 h-9 rounded-lg bg-[#111111] border border-[#242424] flex items-center justify-center text-[#D4D4D8] hover:bg-[#26262C] hover:border-white/10 cursor-pointer"
                  title="Rotate +90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center bg-[#111111] border border-[#242424] rounded-lg px-2 h-9 gap-1.5">
                  <button type="button" onClick={() => setRotation((r) => (r - 15 + 360) % 360)} className="text-slate-500 hover:text-white cursor-pointer"><Minus className="w-3 h-3" /></button>
                  <span className="text-xs font-mono-studio text-white font-bold w-9 text-center">{rotation}°</span>
                  <button type="button" onClick={() => setRotation((r) => (r + 15) % 360)} className="text-slate-500 hover:text-white cursor-pointer"><Plus className="w-3 h-3" /></button>
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <button
              type="button"
              onClick={handleResetTransform}
              className="w-full py-2 rounded-xl bg-[#181818] hover:bg-[#282830] border border-[#242424] text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Overlay Geometry
            </button>
          </div>
        )}

        {/* ── COLOR & BLEND TAB ── */}
        {activeSubTab === 'color' && (
          <div className="flex flex-col gap-3.5 pt-0.5">
            <div className="p-3 rounded-xl bg-[#181818] border border-[#242424] flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-200 font-medium">Overlay Color Tint</span>
                <span className="font-mono-studio text-slate-100">{accentColor}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-[#242424] bg-transparent cursor-pointer shrink-0"
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

            <div className="p-3 rounded-xl bg-[#181818] border border-[#242424] flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-200 font-medium">Text Color</span>
                <span className="font-mono-studio text-slate-100">{textColor}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-[#242424] bg-transparent cursor-pointer shrink-0"
                />
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTextColor(c)}
                      style={{ background: c }}
                      className={`w-5 h-5 rounded-md border transition-transform cursor-pointer ${
                        textColor.toLowerCase() === c.toLowerCase() ? 'scale-125 border-white ring-2 ring-blue-500/50' : 'border-white/20 hover:scale-110'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#181818] border border-[#242424] flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-200">Layer Opacity</span>
                <span className="font-mono-studio text-slate-100 font-bold">{opacity}%</span>
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

        {activeSubTab === 'motion' && (
          <div className="flex flex-col gap-3 pt-0.5">
            <MotionInspectorPage
              presets={OVERLAY_MOTION_PRESETS}
              value={animationDirection === 'in' ? animation : animationOut}
              onChange={(preset) => {
                if (animationDirection === 'in') setAnimation(preset);
                else setAnimationOut(preset);
              }}
              direction={animationDirection}
              onDirectionChange={setAnimationDirection}
              duration={animationDirection === 'in' ? animDuration : animOutDuration}
              onDurationChange={(nextDuration) => {
                if (animationDirection === 'in') setAnimDuration(nextDuration);
                else setAnimOutDuration(nextDuration);
              }}
            />
          </div>
        )}

      </div>
    </div>
  );
};

export default OverlayCompoundInspector;
