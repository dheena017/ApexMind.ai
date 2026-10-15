import React, { useState, useEffect } from 'react';
import {
  Type,
  AlignLeft,
  Plus,
  Zap,
  Bookmark,
  Trash2,
  Copy,
  Sparkles,
  Search,
  Wand2,
  Maximize2,
  Palette,
  Eye,
} from 'lucide-react';

export interface TextPreset {
  id: string;
  name: string;
  previewText: string;
  className: string;
  color: string;
  styleDescription: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

export interface TextPaneProps {
  onInsertText?: (text: string, type: 'heading' | 'subheading' | 'body') => void;
  onApplyPreset?: (preset: TextPreset) => void;
  onUpdateTitle?: (title: string) => void;
  onUpdateHook?: (hook: string) => void;
  onUpdateQuote?: (quote: string) => void;
}

import { TYPOGRAPHY_PRESETS, TypographyPresetItem } from '../../data/mediaCatalogData';

const VIRAL_TYPOGRAPHY_PRESETS: TextPreset[] = TYPOGRAPHY_PRESETS.map((p) => ({
  id: p.id,
  name: p.name,
  previewText: p.previewText,
  className: p.className,
  color: p.color,
  styleDescription: p.styleDescription,
  fontFamily: p.fontFamily,
}));

const INITIAL_VIRAL_HOOKS = [
  { category: 'Stoic Discipline', hook: 'Nobody is coming to save you.' },
  { category: 'Stoic Discipline', hook: 'Rule #1: Never explain your goals.' },
  { category: 'Stoic Discipline', hook: 'Silence is your deadliest weapon.' },
  { category: 'Stoic Discipline', hook: 'Win in private before you speak in public.' },
  { category: 'Stoic Discipline', hook: 'You are not tired. You are undisciplined.' },
  { category: 'Fitness & Iron Will', hook: 'Your excuses are lying to you.' },
  { category: 'Fitness & Iron Will', hook: 'Suffer the pain of discipline or the pain of regret.' },
  { category: 'Fitness & Iron Will', hook: 'The standard is the standard.' },
  { category: 'Fitness & Iron Will', hook: 'Do it tired. Do it broke. Just do it.' },
  { category: 'Fitness & Iron Will', hook: 'Pain today. Strength tomorrow.' },
  { category: 'Dark Psychology', hook: 'They do not want you to succeed. They want you to fit in.' },
  { category: 'Dark Psychology', hook: 'Never reveal your next move.' },
  { category: 'Dark Psychology', hook: 'Observe everything. React to nothing.' },
  { category: 'Dark Psychology', hook: 'The loudest in the room is the weakest.' },
  { category: 'Dark Psychology', hook: 'Master your mind or someone else will.' },
  { category: 'Wealth & Success', hook: 'In 6 months, you can be unrecognizable.' },
  { category: 'Wealth & Success', hook: 'Stop trading your focus for cheap validation.' },
  { category: 'Wealth & Success', hook: 'Build the empire while they party.' },
  { category: 'Wealth & Success', hook: 'Focus is the new currency of the 21st century.' },
  { category: 'Wealth & Success', hook: 'Consistency compounds in the dark.' },
];

const LOCAL_STORAGE_SNIPPETS_KEY = 'apexmind_saved_text_snippets';

export const TextPane: React.FC<TextPaneProps> = ({
  onInsertText,
  onApplyPreset,
  onUpdateTitle,
  onUpdateHook,
  onUpdateQuote,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'hooks' | 'custom'>('presets');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);
  const [fontOverride, setFontOverride] = useState('');
  const [sizeOverride, setSizeOverride] = useState('');
  const [weightOverride, setWeightOverride] = useState('');
  const [caseOverride, setCaseOverride] = useState<TextPreset['textTransform'] | ''>('');
  const [colorOverride, setColorOverride] = useState('');

  // Custom Snippets
  const [savedSnippets, setSavedSnippets] = useState<string[]>([]);
  const [newSnippetInput, setNewSnippetInput] = useState('');
  const [hooksList, setHooksList] = useState(INITIAL_VIRAL_HOOKS);

  // Load saved snippets
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_SNIPPETS_KEY);
      if (stored) {
        setSavedSnippets(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const triggerFeedback = (msg: string) => {
    setAppliedFeedback(msg);
    setTimeout(() => setAppliedFeedback(null), 1800);
  };

  const handleApplyPreset = (preset: TextPreset) => {
    setSelectedPresetId(preset.id);
    const customizedPreset: TextPreset = {
      ...preset,
      fontFamily: fontOverride || preset.fontFamily,
      fontSize: sizeOverride ? Number(sizeOverride) : undefined,
      fontWeight: weightOverride ? Number(weightOverride) : undefined,
      textTransform: caseOverride || undefined,
      color: colorOverride || preset.color,
    };
    if (onApplyPreset) {
      onApplyPreset(customizedPreset);
    }
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'text' }));
    triggerFeedback(`Applied "${preset.name}" style`);
  };

  const handleApplyCustomStyle = () => {
    const preset = TYPOGRAPHY_PRESETS.find((item) => item.id === selectedPresetId) || TYPOGRAPHY_PRESETS[0];
    if (preset) handleApplyPreset(preset);
  };

  const handleInsertHook = (hookText: string) => {
    if (onUpdateHook) {
      onUpdateHook(hookText);
    }
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'text' }));
    triggerFeedback('Hook applied to reel');
  };

  const handleInsertQuote = (text: string) => {
    if (onUpdateQuote) {
      onUpdateQuote(text);
    }
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'text' }));
    triggerFeedback('Quote updated');
  };

  const handleSaveCustomSnippet = () => {
    if (!newSnippetInput.trim()) return;
    const snippet = newSnippetInput.trim();
    const updated = [snippet, ...savedSnippets];
    setSavedSnippets(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_SNIPPETS_KEY, JSON.stringify(updated));
    } catch {}
    setNewSnippetInput('');
    triggerFeedback('Snippet saved to library');
  };

  const handleDeleteSnippet = (index: number) => {
    const updated = savedSnippets.filter((_, i) => i !== index);
    setSavedSnippets(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_SNIPPETS_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleGenerateFreshHooks = () => {
    const freshPacks = [
      { category: 'Stoic Discipline', hook: 'They will laugh now. They will watch later.' },
      { category: 'Fitness & Iron Will', hook: 'Tired is a state of mind. Action is a decision.' },
      { category: 'Dark Psychology', hook: 'Silence is the best response to an insecure person.' },
      { category: 'Wealth & Success', hook: 'Invest in assets that pay you while you sleep.' },
    ];
    setHooksList((prev) => [...freshPacks, ...prev]);
    triggerFeedback('Synthesized 4 new hooks');
  };

  const filteredHooks = hooksList.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.hook.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-[#121212] text-white font-sans-studio select-none overflow-hidden rounded-xl border border-[#2F2F2F]">
      <div className="relative h-10 px-3 bg-[#1E1E1E] border-b border-[#2F2F2F] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#121212] border border-[#2F2F2F] text-[#3B82F6]">
            <Type className="w-3 h-3" />
          </div>
          <span className="text-xs font-bold tracking-tight text-white truncate">
            Typography &amp; Captions
          </span>
        </div>

        {appliedFeedback && (
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-[#1E1E1E] text-[#E5E5E5] border border-[#2F2F2F]">
            ✓ {appliedFeedback}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 px-3 pt-2 border-b border-[#2F2F2F] text-xs font-semibold overflow-x-auto custom-scrollbar shrink-0 bg-[#121212]">
        <button
          type="button"
          onClick={() => setActiveTab('presets')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-[2px] shrink-0 ${
            activeTab === 'presets'
              ? 'text-white border-[#3B82F6]'
                : 'text-[#9CA3AF] border-transparent hover:text-[#E5E5E5]'
          }`}
        >
          Preset Packs
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('hooks')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'hooks'
              ? 'text-white border-[#3B82F6]'
                : 'text-[#9CA3AF] border-transparent hover:text-[#E5E5E5]'
          }`}
        >
          Hook Vault ({hooksList.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('custom')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 flex items-center gap-1.5 ${
            activeTab === 'custom'
              ? 'text-white border-[#3B82F6]'
                : 'text-[#9CA3AF] border-transparent hover:text-[#E5E5E5]'
          }`}
        >
          <Bookmark className="w-3 h-3" />
          My Vault ({savedSnippets.length})
        </button>
      </div>

      {activeTab === 'hooks' && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[#2F2F2F] bg-[#121212] shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
            {[
              { id: 'all', label: 'All Categories' },
              { id: 'Stoic Discipline', label: 'Stoic' },
              { id: 'Fitness & Iron Will', label: 'Fitness' },
              { id: 'Dark Psychology', label: 'Psychology' },
              { id: 'Wealth & Success', label: 'Wealth' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors shrink-0 cursor-pointer border ${
                  selectedCategory === cat.id
                    ? 'bg-[#1E1E1E] text-white border-[#3B82F6]'
                    : 'bg-[#121212] text-[#9CA3AF] border-[#2F2F2F] hover:text-white hover:border-[#4A4A4A]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleGenerateFreshHooks}
            className="flex items-center gap-1 text-[10px] text-[#E5E5E5] bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#2F2F2F] px-2 py-1 rounded-md transition-colors shrink-0 cursor-pointer"
            title="Generate 4 fresh viral hooks"
          >
            <Sparkles className="w-3 h-3" />
            +New
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 flex flex-col gap-2.5">
        {activeTab === 'presets' && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-0.5">
              {[
                { id: 'all', label: 'All Packs' },
                { id: 'subtitles', label: 'Subtitles' },
                { id: 'hooks', label: 'Hooks' },
                { id: 'quotes', label: 'Quotes' },
                { id: 'lowerthirds', label: 'Lower Thirds' },
                { id: 'cta', label: 'Call To Action' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors shrink-0 cursor-pointer border ${
                    selectedCategory === cat.id
                      ? 'bg-[#1E1E1E] text-white border-[#3B82F6]'
                      : 'bg-[#121212] text-[#9CA3AF] border-[#2F2F2F] hover:text-white hover:border-[#4A4A4A]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <details className="group rounded-lg border border-[#2F2F2F] bg-[#121212]">
              <summary className="flex cursor-pointer list-none items-center justify-between px-2.5 py-2 text-[10px] font-semibold text-[#9CA3AF] hover:text-white">
                <span>Customize style</span>
                <span className="text-[#6B7280] transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <div className="grid grid-cols-2 gap-2 border-t border-[#2F2F2F] p-2">
                <label className="flex flex-col gap-1 text-[9px] font-medium text-[#9CA3AF]">
                  Font
                  <select
                    value={fontOverride}
                    onChange={(event) => setFontOverride(event.target.value)}
                    className="min-w-0 rounded-md border border-[#2F2F2F] bg-[#1E1E1E] px-2 py-1.5 text-[10px] text-white outline-none focus:border-[#3B82F6]"
                  >
                    <option value="">Preset font</option>
                    {['Inter, sans-serif', 'Arial, sans-serif', 'Georgia, serif', 'Impact, sans-serif', 'Montserrat, sans-serif', 'Space Grotesk, sans-serif', 'JetBrains Mono, monospace'].map((font) => (
                      <option key={font} value={font}>{font.split(',')[0]}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-[9px] font-medium text-[#9CA3AF]">
                  Size
                  <select
                    value={sizeOverride}
                    onChange={(event) => setSizeOverride(event.target.value)}
                    className="min-w-0 rounded-md border border-[#2F2F2F] bg-[#1E1E1E] px-2 py-1.5 text-[10px] text-white outline-none focus:border-[#3B82F6]"
                  >
                    <option value="">Preset size</option>
                    {[16, 20, 24, 28, 32, 36, 42].map((size) => (
                      <option key={size} value={size}>{size}px</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-[9px] font-medium text-[#9CA3AF]">
                  Weight
                  <select
                    value={weightOverride}
                    onChange={(event) => setWeightOverride(event.target.value)}
                    className="min-w-0 rounded-md border border-[#2F2F2F] bg-[#1E1E1E] px-2 py-1.5 text-[10px] text-white outline-none focus:border-[#3B82F6]"
                  >
                    <option value="">Preset weight</option>
                    <option value="400">Regular</option>
                    <option value="500">Medium</option>
                    <option value="600">Semibold</option>
                    <option value="700">Bold</option>
                    <option value="800">Extra bold</option>
                    <option value="900">Black</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-[9px] font-medium text-[#9CA3AF]">
                  Letter case
                  <select
                    value={caseOverride}
                    onChange={(event) => setCaseOverride(event.target.value as TextPreset['textTransform'] | '')}
                    className="min-w-0 rounded-md border border-[#2F2F2F] bg-[#1E1E1E] px-2 py-1.5 text-[10px] text-white outline-none focus:border-[#3B82F6]"
                  >
                    <option value="">Preset case</option>
                    <option value="none">Original</option>
                    <option value="uppercase">UPPERCASE</option>
                    <option value="lowercase">lowercase</option>
                    <option value="capitalize">Capitalize</option>
                  </select>
                </label>
                <div className="col-span-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5" aria-label="Text color">
                    {[
                      { name: 'White', value: '#FFFFFF' },
                      { name: 'Blue', value: '#3B82F6' },
                      { name: 'Yellow', value: '#FACC15' },
                      { name: 'Red', value: '#EF4444' },
                      { name: 'Green', value: '#10B981' },
                      { name: 'Amber', value: '#F59E0B' },
                    ].map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setColorOverride(color.value)}
                        aria-label={`Set text color to ${color.name}`}
                        aria-pressed={colorOverride === color.value}
                        className={`h-4 w-4 rounded-full border transition-colors ${
                          colorOverride.toUpperCase() === color.value ? 'border-white' : 'border-[#2F2F2F]'
                        }`}
                        style={{ backgroundColor: color.value }}
                      />
                    ))}
                    <label className="relative ml-0.5 flex h-4 w-4 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-[#4A4A4A] bg-[#1E1E1E]" aria-label="Choose a custom text color">
                      <Palette className="pointer-events-none h-2.5 w-2.5 text-[#9CA3AF]" />
                      <input
                        type="color"
                        value={colorOverride || '#FFFFFF'}
                        onChange={(event) => setColorOverride(event.target.value.toUpperCase())}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        aria-label="Choose a custom text color"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setColorOverride('')}
                      className="ml-1 text-[9px] text-[#9CA3AF] hover:text-white"
                    >
                      Reset
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCustomStyle}
                    className="rounded-md bg-[#3B82F6] px-2.5 py-1.5 text-[10px] font-semibold text-white transition-colors hover:bg-[#2563EB]"
                  >
                    Preview style
                  </button>
                </div>
              </div>
            </details>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search typography presets..."
                className="w-full bg-[#1E1E1E] border border-[#2F2F2F] rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-white placeholder:text-[#6B7280] outline-none focus:border-[#3B82F6] transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 gap-2">
              {TYPOGRAPHY_PRESETS.filter((p) => {
                const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
                const matchesQ =
                  searchQuery.trim() === '' ||
                  p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.previewText.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
                return matchesCat && matchesQ;
              }).map((preset) => {
                const isSelected = selectedPresetId === preset.id;

                return (
                  <button
                    type="button"
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    aria-pressed={isSelected}
                    className={`w-full rounded-lg border transition-colors cursor-pointer flex flex-col gap-2 text-left p-2.5 ${
                      isSelected
                        ? 'bg-[#1E1E1E] border-[#3B82F6]'
                        : 'bg-[#121212] border-[#2F2F2F] hover:border-[#4A4A4A]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-white">
                        {preset.name}
                      </span>
                      <span
                        className="inline-flex h-3 w-3 rounded-full border border-[#2F2F2F]"
                        style={{ backgroundColor: preset.color }}
                      />
                    </div>

                    <div className="bg-[#0A0A0A] border border-[#2F2F2F] rounded-md p-2 flex items-center justify-center text-center min-h-[44px]">
                      <span
                        className={`text-xs ${preset.className}`}
                        style={{
                          color: colorOverride || preset.color,
                          fontFamily: fontOverride || preset.fontFamily,
                          fontSize: sizeOverride ? `${sizeOverride}px` : undefined,
                          fontWeight: weightOverride ? Number(weightOverride) : undefined,
                          textTransform: caseOverride || undefined,
                          filter: 'none',
                          textShadow: 'none',
                          WebkitTextStroke: 'none',
                        }}
                      >
                        {preset.previewText}
                      </span>
                    </div>

                    <p className="text-[10px] text-[#9CA3AF] leading-snug">
                      {preset.styleDescription}
                    </p>
                    <span className="flex items-center justify-end gap-1 text-[9px] font-medium text-[#6B7280]">
                      <Eye className="h-3 w-3" />
                      {isSelected ? 'Showing in preview' : 'Click to preview'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'hooks' && (
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hook phrases..."
                className="w-full bg-[#1E1E1E] border border-[#2F2F2F] rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-white placeholder:text-[#6B7280] outline-none focus:border-[#3B82F6] transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 gap-2">
              {filteredHooks.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-[#2F2F2F] bg-[#121212] hover:border-[#4A4A4A] transition-colors flex flex-col gap-2 p-2.5"
                >
                  <div className="bg-[#0A0A0A] border border-[#2F2F2F] rounded-md p-2 flex items-center justify-center text-center min-h-[48px]">
                    <p className="text-[11px] font-bold text-white tracking-wide leading-snug">
                      “{item.hook}”
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="px-1.5 py-0.5 rounded border border-[#2F2F2F] bg-[#1E1E1E] text-[9px] font-medium text-[#9CA3AF]">
                      {item.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleInsertHook(item.hook)}
                        className="px-2 py-1 rounded-md bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[10px] font-semibold transition-colors cursor-pointer"
                      >
                        Set as Hook
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertQuote(item.hook)}
                        className="px-2 py-1 rounded-md border border-[#2F2F2F] bg-[#1E1E1E] hover:border-[#4A4A4A] text-white text-[10px] font-medium transition-colors cursor-pointer"
                      >
                        Set Quote
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'custom' && (
          <div className="flex flex-col gap-2">
            <div className="bg-[#121212] border border-[#2F2F2F] rounded-lg p-2.5 flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-white">Save Custom Hook or Quote</span>
              <textarea
                value={newSnippetInput}
                onChange={(e) => setNewSnippetInput(e.target.value)}
                placeholder="Type or paste your viral hook..."
                rows={3}
                className="w-full bg-[#0A0A0A] border border-[#2F2F2F] rounded-md p-2 text-[11px] text-white placeholder:text-[#6B7280] outline-none focus:border-[#3B82F6] resize-none"
              />
              <button
                type="button"
                onClick={handleSaveCustomSnippet}
                disabled={!newSnippetInput.trim()}
                className="bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white rounded-md py-1.5 text-[10px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Save to Library
              </button>
            </div>

            {savedSnippets.length === 0 ? (
              <div className="bg-[#121212] border border-[#2F2F2F] rounded-lg p-4 text-center text-[10px] text-[#9CA3AF]">
                No custom snippets saved yet.
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {savedSnippets.map((snippet, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-[#2F2F2F] bg-[#121212] hover:border-[#4A4A4A] transition-colors flex flex-col gap-2"
                  >
                    <div className="bg-[#0A0A0A] border border-[#2F2F2F] rounded-md p-2 flex items-center min-h-[40px]">
                      <p className="text-[11px] font-medium text-white leading-snug">{snippet}</p>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] uppercase tracking-[0.12em] text-[#6B7280]">
                        saved snippet
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (onUpdateHook) {
                              onUpdateHook(snippet);
                            }
                          }}
                          className="px-2 py-1 rounded-md bg-[#1E1E1E] text-[#E5E5E5] border border-[#2F2F2F] text-[9px] font-medium transition-colors cursor-pointer"
                        >
                          Hook
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSnippet(idx)}
                          className="p-1 rounded-md text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#1E1E1E] transition-colors cursor-pointer"
                          aria-label="Delete snippet"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TextPane;
