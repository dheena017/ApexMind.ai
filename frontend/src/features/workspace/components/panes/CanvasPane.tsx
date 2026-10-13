import React, { useState, useRef } from 'react';
import {
  LayoutTemplate,
  RectangleHorizontal,
  RectangleVertical,
  Square,
  ChevronsUpDown,
  Check,
  Pipette,
  Sparkles,
} from 'lucide-react';

export interface CanvasPaneProps {
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5' | '21:9';
  onAspectRatioChange: (ratio: '9:16' | '16:9' | '1:1' | '4:5' | '21:9') => void;
  background: string;
  onBackgroundChange: (bg: string) => void;
}

const ASPECT_RATIOS: Array<{
  id: '9:16' | '16:9' | '1:1' | '4:5' | '21:9';
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: '16:9', label: 'Widescreen — 16:9', sublabel: 'YouTube, Desktop', icon: RectangleHorizontal },
  { id: '9:16', label: 'Stories / Shorts — 9:16', sublabel: 'Shorts, Reels, TikTok', icon: RectangleVertical },
  { id: '1:1', label: 'Square — 1:1', sublabel: 'Instagram, Square Posts', icon: Square },
  { id: '4:5', label: 'Portrait — 4:5', sublabel: 'Instagram Feed, FB', icon: RectangleVertical },
  { id: '21:9', label: 'Cinematic — 21:9', sublabel: 'Ultrawide Film', icon: RectangleHorizontal },
];

const SOLID_COLORS: Array<{ id: string; value: string; name: string }> = [
  { id: 'black', value: '#000000', name: 'Black' },
  { id: 'white', value: '#FFFFFF', name: 'White' },
  { id: 'red', value: '#EF4444', name: 'Red' },
  { id: 'orange', value: '#F97316', name: 'Orange' },
  { id: 'yellow', value: '#EAB308', name: 'Yellow' },
  { id: 'green', value: '#22C55E', name: 'Green' },
  { id: 'blue', value: '#3B82F6', name: 'Blue' },
  { id: 'purple', value: '#8B5CF6', name: 'Purple' },
  { id: 'pink', value: '#EC4899', name: 'Pink' },
];

const SECOND_ROW_SWATCHES: Array<{ id: string; value: string; name: string; isGradient?: boolean }> = [
  { id: 'gray', value: '#9CA3AF', name: 'Gray' },
  { id: 'beige', value: '#D4C5B9', name: 'Warm Beige' },
  { id: 'mint', value: '#A7F3D0', name: 'Soft Mint' },
  { id: 'sky', value: '#BAE6FD', name: 'Soft Sky Blue' },
  { id: 'soft-pink', value: '#FBCFE8', name: 'Soft Pink' },
  { id: 'grad-cyan-blue', value: 'linear-gradient(135deg, #06B6D4, #3B82F6)', name: 'Cyan Blue', isGradient: true },
  { id: 'grad-sunset', value: 'linear-gradient(135deg, #EC4899, #F59E0B)', name: 'Sunset', isGradient: true },
  { id: 'grad-purple-pink', value: 'linear-gradient(135deg, #8B5CF6, #EC4899)', name: 'Neon Purple', isGradient: true },
  { id: 'grad-mint-cyan', value: 'linear-gradient(135deg, #10B981, #06B6D4)', name: 'Mint Cyan', isGradient: true },
  { id: 'grad-rose', value: 'linear-gradient(135deg, #F43F5E, #FB7185)', name: 'Rose Dawn', isGradient: true },
];

export const CanvasPane: React.FC<CanvasPaneProps> = ({
  aspectRatio,
  onAspectRatioChange,
  background,
  onBackgroundChange,
}) => {
  const [isRatioDropdownOpen, setIsRatioDropdownOpen] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const currentRatioObj = ASPECT_RATIOS.find((r) => r.id === aspectRatio) || ASPECT_RATIOS[1];
  const RatioIcon = currentRatioObj.icon;

  const handleSelectBg = (val: string) => {
    onBackgroundChange(val);
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'video' }));
  };

  const handleSelectRatio = (ratioId: '9:16' | '16:9' | '1:1' | '4:5' | '21:9') => {
    onAspectRatioChange(ratioId);
    setIsRatioDropdownOpen(false);
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'video' }));
  };

  const isColorActive = (val: string) => background.toLowerCase() === val.toLowerCase();

  return (
    <div className="flex flex-col font-sans-studio text-[#E5E5E5] space-y-6 select-none p-1">
      {/* ── Top Header Bar ────────────────────────────────────────────── */}
      <div className="flex w-full items-center justify-between gap-2 rounded-xl border border-[#2F2F2F] bg-[#121212]/90 px-3 py-2.5 shadow-[0_1px_0_rgba(255,255,255,0.02)] backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/30">
            <LayoutTemplate className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Canvas</h2>
            <p className="text-[10px] text-[#9CA3AF]">Aspect Ratio • Background Color & Gradients</p>
          </div>
        </div>

        <span className="text-[10px] font-mono-studio px-2 py-0.5 rounded-full bg-[#181818] border border-[#2F2F2F] text-[#9CA3AF]">
          {aspectRatio}
        </span>
      </div>

      {/* ── Section 1: Resize ─────────────────────────────────────────── */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-[#A1A1AA] block text-center">
          Resize
        </label>

        {/* Dropdown Selector Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsRatioDropdownOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#1A1A1D] hover:bg-[#222226] border border-[#2E2E33] hover:border-[#3E3E46] transition-all cursor-pointer text-white shadow-sm"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <RatioIcon className="w-4 h-4 text-[#9CA3AF] shrink-0" />
              <span className="text-xs font-medium text-white truncate">
                {currentRatioObj.label}
              </span>
            </div>
            <ChevronsUpDown className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
          </button>

          {/* Dropdown Options Popup */}
          {isRatioDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#17171A] border border-[#2F2F36] rounded-xl shadow-2xl p-1 z-50 flex flex-col gap-0.5">
              {ASPECT_RATIOS.map((item) => {
                const ItemIcon = item.icon;
                const isSelected = item.id === aspectRatio;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectRatio(item.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[#3B82F6]/20 text-[#60A5FA] font-medium'
                        : 'text-[#D4D4D8] hover:text-white hover:bg-[#202026]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ItemIcon className="w-4 h-4 shrink-0 text-[#9CA3AF]" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{item.label}</p>
                        <p className="text-[10px] text-[#71717A] truncate">{item.sublabel}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#60A5FA] shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Section 2: Background ─────────────────────────────────────── */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-[#A1A1AA] block text-center">
          Background
        </label>

        {/* 2-Row Swatch Grid */}
        <div className="flex flex-col gap-2.5 items-center justify-center p-3.5 rounded-2xl bg-[#17171A] border border-[#26262B]">
          
          {/* Row 1: Rainbow Wheel + Solid Colors */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {/* Rainbow Wheel Custom Color Picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => colorInputRef.current?.click()}
                className="w-7 h-7 rounded-full border border-white/20 shadow-md hover:scale-110 active:scale-95 transition-transform cursor-pointer flex items-center justify-center"
                style={{
                  background: 'conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)',
                }}
                title="Custom color picker"
              >
                <input
                  ref={colorInputRef}
                  type="color"
                  value={background.startsWith('#') ? background : '#3B82F6'}
                  onChange={(e) => handleSelectBg(e.target.value)}
                  className="sr-only"
                />
              </button>
            </div>

            {/* Solid Colors */}
            {SOLID_COLORS.map((swatch) => {
              const active = isColorActive(swatch.value);
              return (
                <button
                  key={swatch.id}
                  type="button"
                  onClick={() => handleSelectBg(swatch.value)}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer relative hover:scale-110 active:scale-95 flex items-center justify-center shadow-xs border ${
                    active
                      ? 'border-white ring-2 ring-white/50 scale-105'
                      : swatch.value === '#000000'
                      ? 'border-[#333333]'
                      : swatch.value === '#FFFFFF'
                      ? 'border-zinc-300'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: swatch.value }}
                  title={swatch.name}
                >
                  {active && (
                    <Check
                      className={`w-3.5 h-3.5 stroke-[3] ${
                        swatch.value === '#FFFFFF' || swatch.value === '#EAB308'
                          ? 'text-black'
                          : 'text-white'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Row 2: Pastels + Gradients */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {SECOND_ROW_SWATCHES.map((swatch) => {
              const active = isColorActive(swatch.value);
              return (
                <button
                  key={swatch.id}
                  type="button"
                  onClick={() => handleSelectBg(swatch.value)}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer relative hover:scale-110 active:scale-95 flex items-center justify-center shadow-xs border ${
                    active
                      ? 'border-white ring-2 ring-white/50 scale-105'
                      : 'border-black/20'
                  }`}
                  style={
                    swatch.isGradient
                      ? { backgroundImage: swatch.value }
                      : { backgroundColor: swatch.value }
                  }
                  title={swatch.name}
                >
                  {active && (
                    <Check
                      className={`w-3.5 h-3.5 stroke-[3] ${
                        swatch.id === 'beige' || swatch.id === 'mint' || swatch.id === 'sky' || swatch.id === 'soft-pink'
                          ? 'text-black'
                          : 'text-white'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Active Color Preview & Hex input */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#141416] border border-[#26262B]">
          <div
            className="w-5 h-5 rounded-md border border-white/20 shrink-0 shadow-inner"
            style={
              background.startsWith('linear-gradient')
                ? { backgroundImage: background }
                : { backgroundColor: background }
            }
          />
          <span className="text-[11px] text-[#A1A1AA] font-mono-studio flex-1 truncate">
            {background.startsWith('linear-gradient') ? 'Dynamic Gradient' : background}
          </span>
          {!background.startsWith('linear-gradient') && (
            <div className="flex items-center gap-1">
              <Pipette className="w-3 h-3 text-[#71717A]" />
              <input
                type="text"
                value={background}
                onChange={(e) => onBackgroundChange(e.target.value)}
                placeholder="#000000"
                className="w-16 bg-transparent text-[10px] font-mono-studio text-white outline-none text-right uppercase"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
