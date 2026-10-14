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
  Sliders,
  Maximize2,
  Tv,
} from 'lucide-react';

export interface CanvasPaneProps {
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5' | '21:9';
  onAspectRatioChange: (ratio: '9:16' | '16:9' | '1:1' | '4:5' | '21:9') => void;
  background: string;
  onBackgroundChange: (bg: string) => void;
}

const PLATFORM_PRESETS: Array<{
  id: '9:16' | '16:9' | '1:1' | '4:5' | '21:9';
  platform: string;
  label: string;
  resolution: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: '9:16', platform: 'Shorts & Reels', label: 'Vertical Video (9:16)', resolution: '1080 × 1920 HD', icon: RectangleVertical },
  { id: '16:9', platform: 'YouTube Standard', label: 'Widescreen (16:9)', resolution: '1920 × 1080 HD', icon: RectangleHorizontal },
  { id: '1:1', platform: 'Instagram Feed', label: 'Square Post (1:1)', resolution: '1080 × 1080 SQ', icon: Square },
  { id: '4:5', platform: 'IG & FB Feed', label: 'Portrait Feed (4:5)', resolution: '1080 × 1350 PT', icon: RectangleVertical },
  { id: '21:9', platform: 'Cinematic Cinema', label: 'Ultrawide Film (21:9)', resolution: '2560 × 1080 UW', icon: RectangleHorizontal },
];

const STUDIO_SOLIDS = [
  { id: 'black', value: '#000000', name: 'Pitch Black' },
  { id: 'obsidian', value: '#0A0A0C', name: 'Obsidian' },
  { id: 'slate', value: '#1E293B', name: 'Slate Gray' },
  { id: 'white', value: '#FFFFFF', name: 'Studio White' },
  { id: 'crimson', value: '#DC2626', name: 'Crimson' },
  { id: 'ember', value: '#EA580C', name: 'Ember Orange' },
  { id: 'gold', value: '#D97706', name: 'Imperial Gold' },
  { id: 'emerald', value: '#059669', name: 'Emerald' },
  { id: 'cyan', value: '#0891B2', name: 'Electric Cyan' },
  { id: 'blue', value: '#2563EB', name: 'Royal Blue' },
  { id: 'indigo', value: '#4F46E5', name: 'Deep Indigo' },
  { id: 'purple', value: '#7C3AED', name: 'Cyber Purple' },
  { id: 'rose', value: '#E11D48', name: 'Rose Red' },
  { id: 'zinc', value: '#27272A', name: 'Deep Zinc' },
];

const STUDIO_GRADIENTS = [
  { id: 'grad-cyber', value: 'linear-gradient(135deg, #09090b 0%, #1e1b4b 50%, #312e81 100%)', name: 'Midnight Cyber' },
  { id: 'grad-sunset', value: 'linear-gradient(135deg, #4c0519 0%, #831843 50%, #ea580c 100%)', name: 'Blood Sunset' },
  { id: 'grad-gold', value: 'linear-gradient(135deg, #1c1917 0%, #451a03 50%, #b45309 100%)', name: 'Golden Vault' },
  { id: 'grad-emerald', value: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #047857 100%)', name: 'Emerald Deep' },
  { id: 'grad-neon', value: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 50%, #8B5CF6 100%)', name: 'Neon Spectrum' },
  { id: 'grad-violet', value: 'linear-gradient(135deg, #581c87 0%, #3b0764 50%, #020617 100%)', name: 'Dark Void' },
  { id: 'grad-titan', value: 'linear-gradient(180deg, #18181b 0%, #09090b 100%)', name: 'Titan Monochrome' },
  { id: 'grad-fire', value: 'linear-gradient(135deg, #991b1b 0%, #b91c1c 50%, #f97316 100%)', name: 'Inferno Forge' },
];

export const CanvasPane: React.FC<CanvasPaneProps> = ({
  aspectRatio,
  onAspectRatioChange,
  background,
  onBackgroundChange,
}) => {
  const [activeTab, setActiveTab] = useState<'ratio' | 'solid' | 'gradient' | 'custom'>('ratio');
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Custom Gradient Builder
  const [gradColor1, setGradColor1] = useState('#09090b');
  const [gradColor2, setGradColor2] = useState('#1e1b4b');
  const [gradAngle, setGradAngle] = useState(135);

  const currentPreset = PLATFORM_PRESETS.find((r) => r.id === aspectRatio) || PLATFORM_PRESETS[0];

  const handleSelectBg = (val: string) => {
    onBackgroundChange(val);
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'video' }));
  };

  const handleSelectRatio = (ratioId: '9:16' | '16:9' | '1:1' | '4:5' | '21:9') => {
    onAspectRatioChange(ratioId);
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'video' }));
  };

  const applyCustomGradient = () => {
    const customGrad = `linear-gradient(${gradAngle}deg, ${gradColor1} 0%, ${gradColor2} 100%)`;
    handleSelectBg(customGrad);
  };

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none overflow-hidden rounded-2xl border border-[#26262B]">
      {/* ── Top Header Bar (Matching Right Inspector Pane) ── */}
      <div className="relative px-3 py-2 bg-[#17171A] border-b border-[#26262B] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <LayoutTemplate className="w-4 h-4 shrink-0 text-[#60A5FA]" />
          <span className="text-xs font-bold text-white truncate">
            Canvas &amp; Frame Studio
          </span>
          <span className="text-[9px] font-mono-studio px-1.5 py-0.2 rounded bg-white/10 text-white/80 border border-white/15 shrink-0 uppercase font-bold">
            {aspectRatio}
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleSelectBg('#000000')}
          className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
          title="Reset to default black"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* ── Subtabs Header Bar ── */}
      <div className="flex items-center gap-5 px-4 pt-2.5 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar shrink-0">
        {[
          { id: 'ratio', label: 'Platform Ratio' },
          { id: 'solid', label: 'Solid Color' },
          { id: 'gradient', label: 'Gradients' },
          { id: 'custom', label: 'Custom Grad' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
              activeTab === tab.id
                ? 'text-white border-white'
                : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3">
        {/* ── Tab 1: Platform Aspect Ratios ── */}
        {activeTab === 'ratio' && (
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-mono-studio text-[#71717A] uppercase tracking-wider">
              Target Output Platforms
            </span>

            <div className="flex flex-col gap-2">
              {PLATFORM_PRESETS.map((p) => {
                const Icon = p.icon;
                const isSelected = aspectRatio === p.id;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectRatio(p.id)}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between text-left cursor-pointer ${
                      isSelected
                        ? 'bg-[#1E2330] border-[#3B82F6] ring-1 ring-[#3B82F6]/50 shadow-md'
                        : 'bg-[#1C1C20] border-[#2A2A30] hover:border-[#3A3A42] hover:bg-[#222228]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#3B82F6] text-white' : 'bg-[#2A2A32] text-[#60A5FA]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-white truncate">{p.label}</p>
                          <span className="text-[9px] font-mono-studio px-1 rounded bg-zinc-800 text-zinc-300">
                            {p.platform}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#A1A1AA] mt-0.5">{p.resolution}</p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="p-1 rounded-full bg-[#3B82F6] text-white">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tab 2: Studio Solid Colors ── */}
        {activeTab === 'solid' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-studio text-[#71717A] uppercase tracking-wider">
                Studio Solid Swatches
              </span>

              {/* Eyedropper / Color Picker */}
              <button
                type="button"
                onClick={() => colorInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2A2A32] hover:bg-[#34343E] text-white text-[10px] font-semibold transition-colors cursor-pointer border border-[#3A3A44]"
              >
                <Pipette className="w-3 h-3 text-[#60A5FA]" />
                <span>Custom Hex</span>
              </button>
              <input
                ref={colorInputRef}
                type="color"
                className="hidden"
                onChange={(e) => handleSelectBg(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {STUDIO_SOLIDS.map((c) => {
                const isActive = background.toLowerCase() === c.value.toLowerCase();
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectBg(c.value)}
                    className={`aspect-square rounded-xl border p-1 flex flex-col items-center justify-between transition-all cursor-pointer relative overflow-hidden ${
                      isActive
                        ? 'border-white ring-2 ring-white/50 scale-105 shadow-lg'
                        : 'border-[#2A2A30] hover:border-[#3A3A42]'
                    }`}
                    style={{ backgroundColor: c.value }}
                  >
                    <span className="sr-only">{c.name}</span>
                    {isActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tab 3: Studio Gradients ── */}
        {activeTab === 'gradient' && (
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-mono-studio text-[#71717A] uppercase tracking-wider">
              Cinematic Multi-Stop Gradients
            </span>

            <div className="grid grid-cols-2 gap-2.5">
              {STUDIO_GRADIENTS.map((g) => {
                const isActive = background === g.value;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleSelectBg(g.value)}
                    className={`h-20 rounded-xl border p-2 flex flex-col justify-end text-left transition-all cursor-pointer relative overflow-hidden group ${
                      isActive
                        ? 'border-white ring-2 ring-white/50 shadow-lg'
                        : 'border-[#2A2A30] hover:border-[#3A3A42]'
                    }`}
                    style={{ background: g.value }}
                  >
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                    <span className="relative z-10 text-[10px] font-bold text-white drop-shadow-md truncate">
                      {g.name}
                    </span>
                    {isActive && (
                      <div className="absolute top-2 right-2 p-1 rounded-full bg-white text-black shadow-md z-10">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tab 4: Custom Gradient Builder ── */}
        {activeTab === 'custom' && (
          <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-3.5 flex flex-col gap-3">
            <span className="text-xs font-bold text-white">Gradient Studio Builder</span>
            <p className="text-[11px] text-[#A1A1AA]">
              Blend custom colors and customize gradient angles for unique reel backgrounds.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono-studio text-[#71717A]">Color 1</label>
                <div className="flex items-center gap-2 bg-[#141417] border border-[#2A2A30] rounded-lg p-1.5">
                  <input
                    type="color"
                    value={gradColor1}
                    onChange={(e) => setGradColor1(e.target.value)}
                    className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                  />
                  <span className="text-xs font-mono text-zinc-300">{gradColor1}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono-studio text-[#71717A]">Color 2</label>
                <div className="flex items-center gap-2 bg-[#141417] border border-[#2A2A30] rounded-lg p-1.5">
                  <input
                    type="color"
                    value={gradColor2}
                    onChange={(e) => setGradColor2(e.target.value)}
                    className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                  />
                  <span className="text-xs font-mono text-zinc-300">{gradColor2}</span>
                </div>
              </div>
            </div>

            {/* Angle Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono-studio">
                <span className="text-[#71717A]">ANGLE</span>
                <span className="text-[#60A5FA] font-bold">{gradAngle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={gradAngle}
                onChange={(e) => setGradAngle(Number(e.target.value))}
                className="w-full accent-[#3B82F6]"
              />
            </div>

            {/* Live Gradient Preview */}
            <div
              className="w-full h-16 rounded-xl border border-[#2A2A30] shadow-inner mt-1"
              style={{
                background: `linear-gradient(${gradAngle}deg, ${gradColor1} 0%, ${gradColor2} 100%)`,
              }}
            />

            <button
              type="button"
              onClick={applyCustomGradient}
              className="mt-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#3B82F6]/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Apply Custom Gradient
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasPane;
