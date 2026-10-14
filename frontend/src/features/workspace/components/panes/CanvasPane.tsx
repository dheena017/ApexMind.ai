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
  RotateCcw,
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
  { id: '9:16', label: 'Stories / Shorts — 9:16', sublabel: 'Shorts, Reels, TikTok', icon: RectangleVertical },
  { id: '16:9', label: 'Widescreen — 16:9', sublabel: 'YouTube, Desktop', icon: RectangleHorizontal },
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
  const [activeTab, setActiveTab] = useState<'ratio' | 'background'>('ratio');
  const [isRatioDropdownOpen, setIsRatioDropdownOpen] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const currentRatioObj = ASPECT_RATIOS.find((r) => r.id === aspectRatio) || ASPECT_RATIOS[0];
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
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none overflow-hidden rounded-2xl border border-[#26262B]">
      {/* ── Top Header Bar (Matching Right Pane) ── */}
      <div className="relative px-3 py-2 bg-[#17171A] border-b border-[#26262B] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <LayoutTemplate className="w-4 h-4 shrink-0 text-[#60A5FA]" />
          <span className="text-xs font-bold text-white truncate">
            Canvas &amp; Frame
          </span>
          <span className="text-[9px] font-mono-studio px-1.5 py-0.2 rounded bg-white/10 text-white/80 border border-white/15 shrink-0 uppercase font-bold">
            {aspectRatio}
          </span>
        </div>

        {/* Right Action: Reset Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              handleSelectRatio('9:16');
              handleSelectBg('#000000');
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer border bg-[#222228] hover:bg-[#2C2C34] text-[#D4D4D8] hover:text-white border-[#32323C]"
            title="Reset to 9:16 Black Canvas"
          >
            <RotateCcw className="w-3 h-3 text-sky-400" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ── Subtabs Header Bar (Matching Right Pane) ── */}
      <div className="flex items-center gap-6 px-4 pt-2.5 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('ratio')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'ratio' ? 'text-white border-white' : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Aspect Ratio
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('background')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'background' ? 'text-white border-white' : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Background &amp; Colors
        </button>
      </div>

      {/* ── Main Tab Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-5">
        {activeTab === 'ratio' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">
                Video Format &amp; Ratio
              </label>

              {/* Aspect Ratio Cards Grid */}
              <div className="grid grid-cols-1 gap-2.5">
                {ASPECT_RATIOS.map((item) => {
                  const ItemIcon = item.icon;
                  const isSelected = item.id === aspectRatio;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectRatio(item.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-[#3B82F6] bg-[#3B82F6]/15 text-white'
                          : 'border-[#2A2A30] bg-[#1C1C20] text-[#9CA3AF] hover:border-[#3A3A42] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#3B82F6]/20 text-[#60A5FA]' : 'bg-[#17171A] text-[#71717A]'}`}>
                          <ItemIcon className="w-4 h-4 shrink-0" />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-[#D4D4D8]'}`}>
                            {item.label}
                          </p>
                          <p className="text-[10px] text-[#71717A] truncate">{item.sublabel}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#60A5FA] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'background' && (
          <div className="flex flex-col gap-5">
            {/* Color Swatches Grid */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">
                Solid Colors &amp; Gradients
              </label>

              <div className="flex flex-col gap-3 items-center justify-center p-4 rounded-xl bg-[#1C1C20] border border-[#2A2A30]">
                {/* Row 1: Rainbow Picker + Solids */}
                <div className="flex items-center justify-center gap-2 flex-wrap">
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
                              swatch.value === '#FFFFFF' || swatch.value === '#EAB308' ? 'text-black' : 'text-white'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Row 2: Pastels & Gradients */}
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {SECOND_ROW_SWATCHES.map((swatch) => {
                    const active = isColorActive(swatch.value);
                    return (
                      <button
                        key={swatch.id}
                        type="button"
                        onClick={() => handleSelectBg(swatch.value)}
                        className={`w-7 h-7 rounded-full transition-transform cursor-pointer relative hover:scale-110 active:scale-95 flex items-center justify-center shadow-xs border ${
                          active ? 'border-white ring-2 ring-white/50 scale-105' : 'border-black/20'
                        }`}
                        style={swatch.isGradient ? { backgroundImage: swatch.value } : { backgroundColor: swatch.value }}
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

              {/* Active Color Preview & Hex input */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1C1C20] border border-[#2A2A30]">
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
        )}
      </div>
    </div>
  );
};

export default CanvasPane;
