import React, { useState, useEffect } from 'react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Plus,
  Type,
} from 'lucide-react';
import { GeneratedScript } from '../../types';
import { CustomSelect } from '@/src/shared/ui/CustomSelect';

export interface TextCompoundInspectorProps {
  script?: GeneratedScript;
  onUpdateScript?: (updated: Partial<GeneratedScript>) => void;
  captionColor?: string;
  onCaptionColorChange?: (color: string) => void;
}

export const TextCompoundInspector: React.FC<TextCompoundInspectorProps> = ({
  script,
  onUpdateScript,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'text' | 'adjust' | 'background' | 'opacity' | 'time'>('text');

  // Text Tab States (Image 3)
  const [textContent, setTextContent] = useState(script?.quote || script?.hook || '');

  useEffect(() => {
    setTextContent(script?.quote || script?.hook || '');
  }, [script?.quote, script?.hook]);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textFont, setTextFont] = useState('Roboto');
  const [textWeight, setTextWeight] = useState('Medium');
  const [textSize, setTextSize] = useState(60);

  // Adjust / Style
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [dropShadow, setDropShadow] = useState(true);

  // Background
  const [bgColor, setBgColor] = useState('transparent');

  // Opacity
  const [opacity, setOpacity] = useState(100);

  // Time
  const [duration, setDuration] = useState(2.2);

  const colorPalette = [
    '#000000',
    '#FFFFFF',
    '#EF4444',
    '#F97316',
    '#FACC15',
    '#22C55E',
    '#3B82F6',
    '#A855F7',
    '#EC4899',
  ];

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none">
      {/* ── Subtabs Header Bar (Exactly matching Image 3) ── */}
      <div className="flex items-center gap-5 px-4 pt-2.5 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar">
        {(['text', 'adjust', 'background', 'opacity', 'time'] as const).map((tab) => (
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
        {/* TAB 1: Text (Image 3) */}
        {activeSubTab === 'text' && (
          <div className="flex flex-col gap-5 pt-1">
            {/* Live Canvas Text Preview */}
            <div className="w-full rounded-xl bg-[#0D0D10] border border-[#2A2A30] overflow-hidden">
              <div className="px-2 py-1 border-b border-[#2A2A30] flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                <span className="text-[9px] font-mono-studio text-[#71717A] uppercase tracking-wider">Canvas Preview</span>
              </div>
              <div
                className="min-h-[60px] flex items-center justify-center p-4 text-center"
                style={{ color: textColor, fontFamily: textFont, fontSize: `${Math.round(textSize * 0.25)}px`, fontWeight: textWeight === 'Black' ? 900 : textWeight === 'Bold' ? 700 : textWeight === 'Medium' ? 500 : 400, textAlign: textAlign, opacity: opacity / 100, textShadow: dropShadow ? '0 2px 8px rgba(0,0,0,0.8)' : 'none' }}
              >
                {textContent || <span className="text-[#4B4B55] italic text-xs">Caption text will appear here...</span>}
              </div>
            </div>

            {/* Text Input Area */}
            <div className="w-full">
              <textarea
                rows={2}
                value={textContent}
                onChange={(e) => {
                  setTextContent(e.target.value);
                  onUpdateScript?.({ quote: e.target.value });
                }}
                placeholder="Enter caption text..."
                className="w-full bg-[#1C1C20] border border-[#2A2A30] focus:border-[#3B82F6] rounded-xl px-3.5 py-3 text-xs text-white outline-none resize-none"
              />
            </div>

            {/* Color Swatch Circles Palette */}
            <div className="flex items-center justify-between gap-1.5 overflow-x-auto py-1">
              {/* Rainbow Custom Picker Circle */}
              <label className="w-6 h-6 rounded-full bg-gradient-to-tr from-rose-500 via-amber-400 via-emerald-400 to-sky-500 cursor-pointer shadow-md hover:scale-110 transition-transform flex items-center justify-center shrink-0">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="opacity-0 w-0 h-0 pointer-events-none"
                />
              </label>

              {colorPalette.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setTextColor(col)}
                  className={`w-6 h-6 rounded-full shrink-0 border transition-transform cursor-pointer ${
                    textColor === col ? 'scale-110 ring-2 ring-[#3B82F6] border-white' : 'border-black/30 hover:scale-105'
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>

            {/* Font Family Dropdown */}
            <div className="w-full">
              <CustomSelect
                value={textFont}
                onChange={setTextFont}
                options={['Roboto', 'Inter', 'Montserrat', 'Oswald', 'Outfit', 'Bebas Neue', 'Caveat'].map((f) => ({
                  value: f,
                  label: f,
                }))}
                icon={<Type className="w-3.5 h-3.5 text-[#60A5FA]" />}
                placeholder="Select font family..."
                buttonClassName="bg-[#1C1C20] border-[#2A2A30] hover:border-[#3B82F6]/50"
                menuClassName="bg-[#1C1C20] border-[#2A2A30]"
              />
            </div>

            {/* Font Weight & Size Row */}
            <div className="flex items-center gap-2.5">
              {/* Weight Select */}
              <select
                value={textWeight}
                onChange={(e) => setTextWeight(e.target.value)}
                className="flex-1 bg-[#1C1C20] border border-[#2A2A30] rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
              >
                {['Regular', 'Medium', 'Bold', 'Black'].map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>

              {/* Font Size Stepper */}
              <div className="flex items-center bg-[#1C1C20] border border-[#2A2A30] rounded-xl px-2 h-9 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTextSize((prev) => Math.max(16, prev - 4))}
                  className="text-[#9CA3AF] hover:text-white cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-mono-studio text-white min-w-[28px] text-center font-bold">
                  {textSize}
                </span>
                <button
                  type="button"
                  onClick={() => setTextSize((prev) => Math.min(120, prev + 4))}
                  className="text-[#9CA3AF] hover:text-white cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Adjust */}
        {activeSubTab === 'adjust' && (
          <div className="flex flex-col gap-4 pt-1">
            <span className="text-xs text-[#71717A]">Alignment & Style</span>
            <div className="flex bg-[#1C1C20] p-1 rounded-xl border border-[#2A2A30]">
              {(['left', 'center', 'right'] as const).map((al) => (
                <button
                  key={al}
                  type="button"
                  onClick={() => setTextAlign(al)}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                    textAlign === al ? 'bg-[#2E2E36] text-white shadow' : 'text-[#71717A] hover:text-white'
                  }`}
                >
                  {al === 'left' ? <AlignLeft className="w-3.5 h-3.5" /> : al === 'center' ? <AlignCenter className="w-3.5 h-3.5" /> : <AlignRight className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs text-[#9CA3AF] pt-2">
              <span>Drop Shadow</span>
              <input
                type="checkbox"
                checked={dropShadow}
                onChange={(e) => setDropShadow(e.target.checked)}
                className="accent-[#3B82F6] cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* TAB 3: Background */}
        {activeSubTab === 'background' && (
          <div className="flex flex-col gap-3.5 pt-1">
            <span className="text-xs text-[#71717A]">Caption Box Background</span>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'None', val: 'transparent' },
                { label: 'Dark', val: 'rgba(0,0,0,0.6)' },
                { label: 'Solid', val: '#000000' },
                { label: 'Blue', val: 'rgba(59,130,246,0.2)' },
              ].map((bg) => (
                <button
                  key={bg.label}
                  type="button"
                  onClick={() => setBgColor(bg.val)}
                  className={`py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    bgColor === bg.val ? 'bg-[#3B82F6]/20 border-[#3B82F6] text-white' : 'bg-[#1C1C20] border-[#2A2A30] text-[#9CA3AF]'
                  }`}
                >
                  {bg.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Opacity */}
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

        {/* TAB 5: Time */}
        {activeSubTab === 'time' && (
          <div className="flex flex-col items-center gap-4 pt-1">
            <span className="text-xs text-[#71717A]">Caption Display Duration</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDuration((prev) => Math.max(0.4, parseFloat((prev - 0.2).toFixed(1))))}
                className="w-9 h-9 rounded-full bg-[#1C1C20] border border-[#2A2A30] flex items-center justify-center text-white cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <div className="px-4 py-2 rounded-xl bg-[#1C1C20] border border-[#2A2A30] font-mono-studio text-white font-bold">
                {duration.toFixed(1)}s
              </div>
              <button
                type="button"
                onClick={() => setDuration((prev) => Math.min(15, parseFloat((prev + 0.2).toFixed(1))))}
                className="w-9 h-9 rounded-full bg-[#1C1C20] border border-[#2A2A30] flex items-center justify-center text-white cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextCompoundInspector;
