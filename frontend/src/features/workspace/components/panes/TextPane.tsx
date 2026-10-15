import React, { useState, useEffect, useMemo } from 'react';
import {
  Type,
  Search,
  Check,
  X,
  Sparkles,
  Sliders,
  Palette,
  Bookmark,
  Trash2,
  Copy,
  Plus,
  RefreshCw,
  Eye,
  Zap,
  AlignLeft,
  Heading,
} from 'lucide-react';
import { CustomSelect } from '@/src/shared/ui/CustomSelect';
import { TYPOGRAPHY_PRESETS, TypographyPresetItem } from '../../data/mediaCatalogData';

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
  animationType?: 'pop' | 'typewriter' | 'karaoke' | 'word-bounce' | 'glow-pulse' | 'slide-up';
  category?: string;
  tags?: string[];
}

export interface TextPaneProps {
  onInsertText?: (text: string, type: 'heading' | 'subheading' | 'body') => void;
  onApplyPreset?: (preset: TextPreset) => void;
  onUpdateTitle?: (title: string) => void;
  onUpdateHook?: (hook: string) => void;
  onUpdateQuote?: (quote: string) => void;
}

export const CATEGORY_SELECT_OPTIONS = [
  { value: 'all', label: 'All Categories (70+ Presets)', badge: '70+' },
  { value: 'subtitles', label: 'Subtitles (Viral Reels)', badge: 'Reels' },
  { value: 'hooks', label: 'Viral Hooks & Openers', badge: 'Hooks' },
  { value: 'quotes', label: 'Quotes & Wisdom', badge: 'Quotes' },
  { value: 'lowerthirds', label: 'Lower Thirds & Badges', badge: 'Badges' },
  { value: 'cta', label: 'Call To Action (CTA)', badge: 'CTA' },
  { value: 'animations', label: 'Kinetic Animations', badge: 'FX' },
] as const;

export const CURATED_STYLE_PILLS = [
  { id: 'all', category: 'all', query: '', label: '🔥 All' },
  { id: 'hormozi', category: 'subtitles', query: 'hormozi', label: '⚡ Hormozi' },
  { id: 'mrbeast', category: 'subtitles', query: 'mrbeast', label: '🎯 MrBeast' },
  { id: 'karaoke', category: 'subtitles', query: 'karaoke', label: '🎤 Karaoke' },
  { id: 'luxury', category: 'subtitles', query: 'luxury', label: '✨ Luxury' },
  { id: 'cyber', category: 'subtitles', query: 'cyber', label: '🌃 Cyber' },
  { id: 'stoic', category: 'quotes', query: 'stoic', label: '🏛️ Stoic' },
  { id: 'gym', category: 'hooks', query: 'gym', label: '💪 Gym' },
  { id: 'minimal', category: 'subtitles', query: 'minimal', label: '🖤 Minimal' },
  { id: 'hacker', category: 'subtitles', query: 'hacker', label: '💻 Terminal' },
] as const;

const FONT_OPTIONS = [
  { value: '', label: 'Preset Default Font' },
  { value: 'Impact, sans-serif', label: 'Impact (Viral Hormozi)', badge: 'Punchy' },
  { value: 'Anton, sans-serif', label: 'Anton (MrBeast Condensed)', badge: 'YouTube' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat (Modern Bold)', badge: 'Clean' },
  { value: 'Inter, sans-serif', label: 'Inter (Minimalist Aesthetic)', badge: 'Refined' },
  { value: 'Space Grotesk, sans-serif', label: 'Space Grotesk (Cyber Tech)', badge: 'Futuristic' },
  { value: 'JetBrains Mono, monospace', label: 'JetBrains Mono (Terminal)', badge: 'Code' },
  { value: 'Playfair Display, serif', label: 'Playfair Display (Vox Serif)', badge: 'Editorial' },
  { value: 'Georgia, serif', label: 'Georgia (Classic Wisdom)', badge: 'Serif' },
];

const SIZE_OPTIONS = [
  { value: '', label: 'Preset Default Size' },
  { value: '18', label: '18px — Subtle Caption' },
  { value: '22', label: '22px — Standard Reel' },
  { value: '26', label: '26px — Medium Emphasis' },
  { value: '32', label: '32px — Bold Subtitle' },
  { value: '40', label: '40px — Large Hook' },
  { value: '48', label: '48px — Viral Title' },
];

const WEIGHT_OPTIONS = [
  { value: '', label: 'Preset Default Weight' },
  { value: '400', label: 'Regular (400)' },
  { value: '500', label: 'Medium (500)' },
  { value: '600', label: 'Semibold (600)' },
  { value: '700', label: 'Bold (700)' },
  { value: '800', label: 'Extra Bold (800)' },
  { value: '900', label: 'Black (900 — Maximum Impact)' },
];

const CASE_OPTIONS = [
  { value: '', label: 'Preset Default Case' },
  { value: 'none', label: 'Original As Typed' },
  { value: 'uppercase', label: 'UPPERCASE (All Caps)' },
  { value: 'lowercase', label: 'lowercase (aesthetic)' },
  { value: 'capitalize', label: 'Capitalize Every Word' },
];

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
  const [activeTab, setActiveTab] = useState<'presets' | 'quick' | 'hooks' | 'custom' | 'overrides'>('presets');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>('sub-hormozi');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);

  // Style Overrides State
  const [fontOverride, setFontOverride] = useState('');
  const [sizeOverride, setSizeOverride] = useState('');
  const [weightOverride, setWeightOverride] = useState('');
  const [caseOverride, setCaseOverride] = useState<TextPreset['textTransform'] | ''>('');
  const [colorOverride, setColorOverride] = useState('');

  // Custom Snippets
  const [savedSnippets, setSavedSnippets] = useState<string[]>([]);
  const [newSnippetInput, setNewSnippetInput] = useState('');
  const [hooksList, setHooksList] = useState(INITIAL_VIRAL_HOOKS);

  // Load saved snippets from localStorage
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
    setTimeout(() => setAppliedFeedback(null), 2000);
  };

  const handleApplyPreset = (preset: TypographyPresetItem) => {
    setSelectedPresetId(preset.id);
    const customizedPreset: TextPreset = {
      id: preset.id,
      name: preset.name,
      previewText: preset.previewText,
      className: preset.className,
      color: colorOverride || preset.color,
      styleDescription: preset.styleDescription,
      fontFamily: fontOverride || preset.fontFamily,
      fontSize: sizeOverride ? Number(sizeOverride) : undefined,
      fontWeight: weightOverride ? Number(weightOverride) : undefined,
      textTransform: caseOverride || undefined,
      animationType: preset.animationType,
      category: preset.category,
      tags: preset.tags,
    };
    if (onApplyPreset) {
      onApplyPreset(customizedPreset);
    }
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'text' }));
    triggerFeedback(`Applied "${preset.name}"`);
  };

  const handleQuickInsert = (text: string, type: 'heading' | 'subheading' | 'body') => {
    if (onInsertText) {
      onInsertText(text, type);
    } else if (type === 'heading' && onUpdateTitle) {
      onUpdateTitle(text);
    } else if (type === 'subheading' && onUpdateHook) {
      onUpdateHook(text);
    } else if (onUpdateQuote) {
      onUpdateQuote(text);
    }
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'text' }));
    triggerFeedback(`Added ${type} text`);
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
    triggerFeedback('Quote applied');
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
    triggerFeedback('Saved to your vault');
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
      { category: 'Stoic Discipline', hook: 'Never announce your moves. Let the results speak.' },
    ];
    setHooksList((prev) => [...freshPacks, ...prev]);
    triggerFeedback('Synthesized 5 new viral hooks');
  };

  // Instant mood pill select
  const handleMoodPillSelect = (pill: (typeof CURATED_STYLE_PILLS)[number]) => {
    const isActive =
      (pill.query === '' && !searchQuery) ||
      (pill.query !== '' && searchQuery.toLowerCase() === pill.query.toLowerCase());
    const newQuery = isActive && pill.query !== '' ? '' : pill.query;
    const newCat = isActive && pill.query !== '' ? 'all' : pill.category;

    setSearchQuery(newQuery);
    setSelectedCategory(newCat);
  };

  // Filtered presets
  const filteredPresets = useMemo(() => {
    return TYPOGRAPHY_PRESETS.filter((p) => {
      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesQ =
        q === '' ||
        p.name.toLowerCase().includes(q) ||
        p.previewText.toLowerCase().includes(q) ||
        p.styleDescription.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCat && matchesQ;
    });
  }, [selectedCategory, searchQuery]);

  // Filtered hooks
  const filteredHooks = useMemo(() => {
    return hooksList.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        item.hook.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, hooksList]);

  const activePreset = useMemo(() => {
    return (
      TYPOGRAPHY_PRESETS.find((p) => p.id === selectedPresetId) ||
      TYPOGRAPHY_PRESETS[0]
    );
  }, [selectedPresetId]);

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none overflow-hidden rounded-xl border border-[#26262B]">
      {/* ── Header Title Bar ── */}
      <div className="relative h-12 px-3.5 bg-[#141416] border-b border-[#26262B] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-[#60A5FA]">
            <Type className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-tight text-white">
              Typography &amp; Subtitles
            </span>
            <span className="text-[10px] font-mono-studio text-[#A1A1AA] bg-[#222226] px-2 py-0.5 rounded-full border border-[#2F2F36]">
              {TYPOGRAPHY_PRESETS.length} Presets
            </span>
          </div>
        </div>

        {appliedFeedback && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-[#60A5FA] border border-blue-500/30 animate-pulse">
            ✓ {appliedFeedback}
          </span>
        )}
      </div>

      {/* ── Subtabs Navigation Bar ── */}
      <div className="flex items-center gap-4 sm:gap-5 px-3.5 pt-2 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar shrink-0 bg-[#141417]">
        <button
          type="button"
          onClick={() => setActiveTab('presets')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'presets'
              ? 'text-white border-blue-500'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Preset Packs ({TYPOGRAPHY_PRESETS.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('quick')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 flex items-center gap-1.5 ${
            activeTab === 'quick'
              ? 'text-white border-blue-500'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          <Plus className="w-3.5 h-3.5 text-[#60A5FA]" />
          <span>Quick Insert</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('hooks')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 flex items-center gap-1.5 ${
            activeTab === 'hooks'
              ? 'text-white border-blue-500'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Hook Vault ({hooksList.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('overrides')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 flex items-center gap-1.5 ${
            activeTab === 'overrides'
              ? 'text-white border-blue-500'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-emerald-400" />
          <span>Style Studio</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('custom')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 flex items-center gap-1.5 ${
            activeTab === 'custom'
              ? 'text-white border-blue-500'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5 text-purple-400" />
          <span>Saved ({savedSnippets.length})</span>
        </button>
      </div>

      {/* ── Unified Search, Dropdown & Mood Bar (Presets & Hooks) ── */}
      {(activeTab === 'presets' || activeTab === 'hooks') && (
        <div className="flex flex-col gap-2 border-b border-[#26262B] bg-[#141416] p-3 shrink-0">
          {/* Search + CustomSelect Dropdown Row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'presets'
                    ? 'Search 70+ typography styles (Hormozi, MrBeast, Vox)...'
                    : 'Search viral hooks (stoic, fitness, wealth)...'
                }
                className="w-full bg-[#1C1C20] border border-[#2A2A30] focus:border-blue-500/70 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-zinc-500 outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category CustomSelect Dropdown */}
            <div className="shrink-0 w-44 sm:w-48">
              <CustomSelect
                options={CATEGORY_SELECT_OPTIONS.map((c) => ({
                  value: c.value,
                  label: c.label,
                  badge: c.badge,
                }))}
                value={selectedCategory}
                onChange={(val) => setSelectedCategory(val)}
                variant="compact"
                buttonClassName="!w-full !justify-between !bg-[#1A1A1E] !border-[#2E2E36] !text-[11px] !py-2 !px-3 font-semibold hover:!border-blue-500/60"
                menuClassName="!w-64 !bg-[#16161A] !border-[#2E2E38] shadow-2xl"
              />
            </div>
          </div>

          {/* Curated Style & Mood Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pt-0.5 pb-0.5">
            {CURATED_STYLE_PILLS.map((pill) => {
              const isActive =
                (pill.query === '' && !searchQuery && selectedCategory === 'all') ||
                (pill.query !== '' && searchQuery.toLowerCase() === pill.query.toLowerCase());
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => handleMoodPillSelect(pill)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-[#1C1C20] text-zinc-400 hover:text-white hover:bg-[#25252A] border-[#2A2A30]'
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Main Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 flex flex-col gap-3">
        {/* ── TAB 1: PRESET PACKS ── */}
        {activeTab === 'presets' && (
          <div className="flex flex-col gap-3">
            {filteredPresets.length === 0 ? (
              <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-8 text-center text-xs text-[#A1A1AA] flex flex-col items-center gap-2">
                <Search className="w-6 h-6 text-zinc-600" />
                <p>No presets matching &ldquo;{searchQuery}&rdquo;</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="mt-1 text-[11px] text-blue-400 hover:underline cursor-pointer"
                >
                  Reset filters to view all 70+ presets
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {filteredPresets.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset)}
                      className={`group relative rounded-xl border p-2 bg-[#18181C] hover:bg-[#1D1D22] transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? 'border-blue-500 ring-1 ring-blue-500/50 shadow-lg shadow-blue-500/10'
                          : 'border-[#26262B] hover:border-[#383842]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-white truncate">
                            {preset.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/50 shadow-xs shrink-0"
                            style={{ backgroundColor: preset.color }}
                            title={`Color: ${preset.color}`}
                          />
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-[#0C0C0F] border border-[#23232A] rounded-lg p-2 flex items-center justify-center text-center min-h-[42px] overflow-hidden">
                        <span
                          className={`text-sm sm:text-base leading-tight select-none ${preset.className}`}
                          style={{
                            color: colorOverride || preset.color,
                            fontFamily: fontOverride || preset.fontFamily,
                            fontSize: sizeOverride ? `${sizeOverride}px` : undefined,
                            fontWeight: weightOverride ? Number(weightOverride) : undefined,
                            textTransform: caseOverride || undefined,
                          }}
                        >
                          {preset.previewText}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: QUICK INSERT ── */}
        {activeTab === 'quick' && (
          <div className="flex flex-col gap-3">
            <div className="bg-[#18181C] border border-[#26262B] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Heading className="w-4 h-4 text-[#60A5FA]" />
                <span className="text-xs font-bold text-white">One-Click Text Insertion</span>
              </div>
              <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                Click any button to instantly add stylized text layers to your reel with the current font and active preset styling:
              </p>

              <div className="grid grid-cols-1 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleQuickInsert('ADD A BOLD HEADING', 'heading')}
                  className="w-full p-3 rounded-xl bg-[#141418] hover:bg-[#1E1E24] border border-[#2B2B34] hover:border-blue-500/50 text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-white group-hover:text-blue-400 transition-colors uppercase">
                      + Add Heading Text
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono-studio">
                      Primary impact line for titles &amp; retention hooks
                    </span>
                  </div>
                  <Plus className="w-4 h-4 text-zinc-500 group-hover:text-blue-400" />
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickInsert('Viral Punchy Subheading', 'subheading')}
                  className="w-full p-3 rounded-xl bg-[#141418] hover:bg-[#1E1E24] border border-[#2B2B34] hover:border-blue-500/50 text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-200 group-hover:text-blue-400 transition-colors">
                      + Add Subheading
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono-studio">
                      Contextual subtext or secondary speaker line
                    </span>
                  </div>
                  <Plus className="w-4 h-4 text-zinc-500 group-hover:text-blue-400" />
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickInsert('Captions flow word by word with the voice narration.', 'body')}
                  className="w-full p-3 rounded-xl bg-[#141418] hover:bg-[#1E1E24] border border-[#2B2B34] hover:border-blue-500/50 text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-zinc-300 group-hover:text-blue-400 transition-colors">
                      + Add Body / Captions Block
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono-studio">
                      Standard subtitle sentences &amp; paragraph commentary
                    </span>
                  </div>
                  <Plus className="w-4 h-4 text-zinc-500 group-hover:text-blue-400" />
                </button>
              </div>
            </div>

            {/* Active Style Quick Card */}
            <div className="bg-[#18181C] border border-[#26262B] rounded-xl p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Currently Active Preset: {activePreset.name}
                </span>
                <span
                  className="w-3 h-3 rounded-full border border-black/50"
                  style={{ backgroundColor: colorOverride || activePreset.color }}
                />
              </div>
              <div className="bg-[#0D0D10] border border-[#23232A] rounded-lg p-2.5 text-center">
                <span className={`text-xs ${activePreset.className}`}>
                  {activePreset.previewText}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: HOOK VAULT ── */}
        {activeTab === 'hooks' && (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-mono-studio text-zinc-400">
                {filteredHooks.length} Viral Hooks Available
              </span>
              <button
                type="button"
                onClick={handleGenerateFreshHooks}
                className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-semibold bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Generate +5 Fresh</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {filteredHooks.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[#26262B] bg-[#18181C] hover:border-[#383842] transition-colors flex flex-col gap-2 p-3"
                >
                  <div className="bg-[#0E0E12] border border-[#23232A] rounded-lg p-2.5 flex items-center justify-center text-center min-h-[46px]">
                    <p className="text-xs font-bold text-white tracking-wide leading-snug">
                      &ldquo;{item.hook}&rdquo;
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <span className="px-2 py-0.5 rounded-full border border-[#2C2C34] bg-[#141418] text-[9px] font-semibold text-zinc-400">
                      {item.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleInsertHook(item.hook)}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        Set Hook
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertQuote(item.hook)}
                        className="px-2.5 py-1 rounded-lg border border-[#303038] bg-[#222228] hover:bg-[#2A2A32] text-zinc-200 text-[10px] font-medium transition-colors cursor-pointer"
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

        {/* ── TAB 4: STYLE STUDIO & OVERRIDES (Using CustomSelect) ── */}
        {activeTab === 'overrides' && (
          <div className="flex flex-col gap-3">
            <div className="bg-[#18181C] border border-[#26262B] rounded-xl p-3.5 flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-400" />
                  Global Typography Overrides
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFontOverride('');
                    setSizeOverride('');
                    setWeightOverride('');
                    setCaseOverride('');
                    setColorOverride('');
                    triggerFeedback('Overrides reset');
                  }}
                  className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset Overrides
                </button>
              </div>

              {/* Font Family Dropdown with CustomSelect */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-mono-studio text-zinc-400 font-semibold">
                  Font Family
                </label>
                <CustomSelect
                  options={FONT_OPTIONS}
                  value={fontOverride}
                  onChange={(val) => setFontOverride(val)}
                  placeholder="Preset Default Font"
                  buttonClassName="!bg-[#141418] !border-[#2B2B34] !text-xs !py-2"
                  menuClassName="!bg-[#16161A] !border-[#2E2E38]"
                />
              </div>

              {/* Font Size & Weight Row with CustomSelect */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-mono-studio text-zinc-400 font-semibold">
                    Font Size
                  </label>
                  <CustomSelect
                    options={SIZE_OPTIONS}
                    value={sizeOverride}
                    onChange={(val) => setSizeOverride(val)}
                    placeholder="Default Size"
                    buttonClassName="!bg-[#141418] !border-[#2B2B34] !text-xs !py-2"
                    menuClassName="!bg-[#16161A] !border-[#2E2E38]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-mono-studio text-zinc-400 font-semibold">
                    Font Weight
                  </label>
                  <CustomSelect
                    options={WEIGHT_OPTIONS}
                    value={weightOverride}
                    onChange={(val) => setWeightOverride(val)}
                    placeholder="Default Weight"
                    buttonClassName="!bg-[#141418] !border-[#2B2B34] !text-xs !py-2"
                    menuClassName="!bg-[#16161A] !border-[#2E2E38]"
                  />
                </div>
              </div>

              {/* Letter Case with CustomSelect */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-mono-studio text-zinc-400 font-semibold">
                  Letter Casing
                </label>
                <CustomSelect
                  options={CASE_OPTIONS}
                  value={caseOverride}
                  onChange={(val) => setCaseOverride(val as any)}
                  placeholder="Preset Default Case"
                  buttonClassName="!bg-[#141418] !border-[#2B2B34] !text-xs !py-2"
                  menuClassName="!bg-[#16161A] !border-[#2E2E38]"
                />
              </div>

              {/* Color Swatches & Native Color Picker */}
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-center justify-between text-[10px] uppercase font-mono-studio text-zinc-400 font-semibold">
                  <span>Custom Color Tint</span>
                  {colorOverride && (
                    <span className="text-blue-400 font-bold">{colorOverride}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {[
                    { name: 'Pure White', value: '#FFFFFF' },
                    { name: 'Neon Blue', value: '#3B82F6' },
                    { name: 'Hormozi Gold', value: '#FACC15' },
                    { name: 'Crimson Red', value: '#EF4444' },
                    { name: 'Terminal Green', value: '#10B981' },
                    { name: 'Amber Glow', value: '#F59E0B' },
                    { name: 'Cyber Violet', value: '#A855F7' },
                  ].map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setColorOverride(color.value)}
                      title={color.name}
                      className={`h-5 w-5 rounded-full border transition-all cursor-pointer ${
                        colorOverride.toUpperCase() === color.value
                          ? 'border-white scale-110 ring-2 ring-blue-500/50'
                          : 'border-white/20 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value }}
                    />
                  ))}

                  {/* Native Color Wheel Input */}
                  <label
                    className="relative flex h-5 w-5 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-[#4A4A54] bg-[#141418] hover:border-blue-400 transition-colors"
                    title="Choose Custom Color"
                  >
                    <Palette className="pointer-events-none h-3 w-3 text-zinc-400" />
                    <input
                      type="color"
                      value={colorOverride || '#FFFFFF'}
                      onChange={(e) => setColorOverride(e.target.value.toUpperCase())}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </label>

                  {colorOverride && (
                    <button
                      type="button"
                      onClick={() => setColorOverride('')}
                      className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer ml-1"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Real-time Overrides Preview Box */}
              <div className="mt-1 bg-[#0E0E12] border border-[#26262E] rounded-xl p-3 flex flex-col items-center justify-center text-center min-h-[64px]">
                <span
                  className="text-sm font-bold transition-all"
                  style={{
                    color: colorOverride || activePreset.color,
                    fontFamily: fontOverride || activePreset.fontFamily,
                    fontSize: sizeOverride ? `${sizeOverride}px` : '18px',
                    fontWeight: weightOverride ? Number(weightOverride) : 800,
                    textTransform: caseOverride || 'uppercase',
                  }}
                >
                  LIVE TYPOGRAPHY PREVIEW
                </span>
                <span className="text-[9px] text-zinc-500 mt-1 font-mono-studio">
                  {fontOverride ? fontOverride.split(',')[0] : activePreset.name} •{' '}
                  {sizeOverride ? `${sizeOverride}px` : 'Auto Size'} •{' '}
                  {colorOverride || activePreset.color}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleApplyPreset(activePreset)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Apply Styled Preset to Canvas</span>
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 5: SAVED VAULT ── */}
        {activeTab === 'custom' && (
          <div className="flex flex-col gap-3">
            <div className="bg-[#18181C] border border-[#26262B] rounded-xl p-3.5 flex flex-col gap-2.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-purple-400" />
                Save Custom Hook or Quote
              </span>
              <textarea
                value={newSnippetInput}
                onChange={(e) => setNewSnippetInput(e.target.value)}
                placeholder="Type or paste a viral hook or quote..."
                rows={3}
                className="w-full bg-[#121216] border border-[#2A2A32] rounded-xl p-2.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-blue-500 resize-none transition-colors"
              />
              <button
                type="button"
                onClick={handleSaveCustomSnippet}
                disabled={!newSnippetInput.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                Save to My Vault
              </button>
            </div>

            {savedSnippets.length === 0 ? (
              <div className="bg-[#18181C] border border-[#26262B] rounded-xl p-6 text-center text-xs text-zinc-500 flex flex-col items-center gap-1">
                <Bookmark className="w-6 h-6 text-zinc-600" />
                <p className="font-semibold text-zinc-400 mt-1">No custom snippets saved yet</p>
                <p className="text-[11px] text-zinc-500">
                  Save your best hooks above to quickly reuse them across reels.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {savedSnippets.map((snippet, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-[#26262B] bg-[#18181C] hover:border-[#383842] transition-colors flex flex-col gap-2"
                  >
                    <div className="bg-[#101014] border border-[#23232A] rounded-lg p-2.5 flex items-center min-h-[40px]">
                      <p className="text-xs font-medium text-white leading-snug">
                        &ldquo;{snippet}&rdquo;
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono-studio">
                        Vault Snippet #{idx + 1}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (onUpdateHook) onUpdateHook(snippet);
                            triggerFeedback('Applied hook');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#22222A] hover:bg-blue-600 text-zinc-200 hover:text-white border border-[#30303A] text-[10px] font-semibold transition-colors cursor-pointer"
                        >
                          Use as Hook
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSnippet(idx)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-[#251518] transition-colors cursor-pointer"
                          title="Delete snippet"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
