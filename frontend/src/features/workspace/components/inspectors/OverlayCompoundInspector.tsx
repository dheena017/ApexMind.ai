import React, { useEffect, useState } from 'react';
import {
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  Minus,
  Plus,
} from 'lucide-react';

export interface OverlayCompoundInspectorProps {
  activeOverlay?: { type: string; value: string; label?: string } | null;
}

export const OverlayCompoundInspector: React.FC<OverlayCompoundInspectorProps> = ({
  activeOverlay,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'transform' | 'color' | 'opacity' | 'time'>('transform');

  // Transform States (Image 4)
  const [fitMode, setFitMode] = useState<'fill' | 'fit'>('fit');
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [rotation, setRotation] = useState(0);

  // Color & Opacity
  const [accentColor, setAccentColor] = useState('#3B82F6');
  const [opacity, setOpacity] = useState(100);

  // Time
  const [duration, setDuration] = useState(5.0);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('workspace:overlay-style-change', {
      detail: { fitMode, flipH, flipV, rotation, accentColor, opacity, duration },
    }));
  }, [fitMode, flipH, flipV, rotation, accentColor, opacity, duration]);

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none">
      {/* ── Subtabs Header Bar (Exactly matching Image 4) ── */}
      <div className="flex items-center gap-5 px-4 pt-2.5 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar">
        {(['transform', 'color', 'opacity', 'time'] as const).map((tab) => (
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
        {/* TAB 1: Transform (Image 4) */}
        {activeSubTab === 'transform' && (
          <div className="flex flex-col items-center gap-6 pt-1">
            {/* Active Overlay Preview */}
            {activeOverlay ? (
              <div className="w-full p-3 rounded-xl bg-[#18181C] border border-[#2A2A30] flex items-center gap-3">
                <div className="shrink-0 text-2xl">{activeOverlay.type === 'sticker' ? activeOverlay.value : '🏷️'}</div>
                <div className="min-w-0">
                  <div className="text-[10px] font-mono-studio text-[#71717A] uppercase tracking-wider">Active Overlay</div>
                  <div className="text-xs font-semibold text-white truncate">
                    {activeOverlay.type === 'badge' ? `Badge: ${activeOverlay.value}` : activeOverlay.type === 'sticker' ? `Sticker: ${activeOverlay.value}` : activeOverlay.value}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full p-3 rounded-xl bg-[#18181C] border border-dashed border-[#2A2A30] text-center">
                <p className="text-[10px] text-[#71717A] font-mono-studio">No overlay selected</p>
                <p className="text-[9px] text-[#4B4B55] mt-0.5">Add a sticker or badge from the Elements panel</p>
              </div>
            )}

            {/* Fill & Fit Buttons */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
              <button
                type="button"
                onClick={() => setFitMode('fill')}
                className={`py-3.5 rounded-2xl flex items-center justify-center gap-2.5 border transition-all cursor-pointer ${
                  fitMode === 'fill'
                    ? 'bg-[#2A2A32] border-[#3B82F6] text-white shadow-lg'
                    : 'bg-[#1C1C20] border-[#2A2A30] text-[#9CA3AF] hover:bg-[#24242A]'
                }`}
              >
                <div className="w-4 h-4 rounded bg-[#3A3A44] border border-white/60" />
                <span className="text-xs font-medium">Fill</span>
              </button>

              <button
                type="button"
                onClick={() => setFitMode('fit')}
                className={`py-3.5 rounded-2xl flex items-center justify-center gap-2.5 border transition-all cursor-pointer ${
                  fitMode === 'fit'
                    ? 'bg-[#2A2A32] border-[#3B82F6] text-white shadow-lg'
                    : 'bg-[#1C1C20] border-[#2A2A30] text-[#9CA3AF] hover:bg-[#24242A]'
                }`}
              >
                <div className="w-2.5 h-4 rounded bg-white/70" />
                <span className="text-xs font-medium">Fit</span>
              </button>
            </div>

            {/* Flip & Rotate Subtitle & Buttons */}
            <div className="w-full flex flex-col items-center gap-3.5 pt-2">
              <span className="text-xs font-semibold text-[#71717A]">Flip & Rotate</span>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setFlipH(!flipH)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors cursor-pointer ${
                    flipH
                      ? 'bg-[#2E2E36] border-[#3B82F6] text-white'
                      : 'bg-[#1C1C20] border-[#2A2A30] text-[#D4D4D8] hover:bg-[#26262C]'
                  }`}
                  title="Flip Horizontal"
                >
                  <FlipHorizontal className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setFlipV(!flipV)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors cursor-pointer ${
                    flipV
                      ? 'bg-[#2E2E36] border-[#3B82F6] text-white'
                      : 'bg-[#1C1C20] border-[#2A2A30] text-[#D4D4D8] hover:bg-[#26262C]'
                  }`}
                  title="Flip Vertical"
                >
                  <FlipVertical className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="w-10 h-10 rounded-xl bg-[#1C1C20] border border-[#2A2A30] flex items-center justify-center text-[#D4D4D8] hover:bg-[#26262C] transition-colors cursor-pointer"
                  title="Rotate 90 degrees"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                <div className="flex items-center bg-[#1C1C20] border border-[#2A2A30] rounded-xl px-2.5 h-10 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRotation((prev) => (prev - 15 + 360) % 360)}
                    className="text-[#9CA3AF] hover:text-white cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-mono-studio text-white min-w-[32px] text-center font-bold">
                    {rotation}°
                  </span>
                  <button
                    type="button"
                    onClick={() => setRotation((prev) => (prev + 15) % 360)}
                    className="text-[#9CA3AF] hover:text-white cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Color */}
        {activeSubTab === 'color' && (
          <div className="flex flex-col gap-3.5 pt-1">
            <span className="text-xs text-[#71717A]">Badge Accent Color</span>
            <div className="flex gap-2.5">
              {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#FFFFFF'].map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setAccentColor(col)}
                  className={`w-7 h-7 rounded-full border cursor-pointer ${
                    accentColor === col ? 'ring-2 ring-white scale-110' : ''
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Opacity */}
        {activeSubTab === 'opacity' && (
          <div className="flex flex-col gap-2.5 pt-1">
            <div className="flex justify-between text-xs text-[#9CA3AF]">
              <span>Opacity</span>
              <span className="font-mono-studio text-white">{opacity}%</span>
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
        )}

        {/* TAB 4: Time */}
        {activeSubTab === 'time' && (
          <div className="flex flex-col items-center gap-4 pt-1">
            <span className="text-xs text-[#71717A]">Overlay Display Duration</span>
            <div className="px-5 py-2.5 rounded-xl bg-[#1C1C20] border border-[#2A2A30] font-mono-studio text-white font-bold">
              {duration.toFixed(1)}s
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverlayCompoundInspector;
