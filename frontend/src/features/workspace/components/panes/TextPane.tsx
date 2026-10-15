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
    if (onApplyPreset) {
      onApplyPreset(preset);
    }
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'text' }));
    triggerFeedback(`Applied "${preset.name}" preset`);
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
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none overflow-hidden rounded-2xl border border-[#26262B]">
      {/* ── Top Header Bar (Matching Studio Shell) ── */}
      <div className="relative h-11 px-3.5 bg-[#17171A] border-b border-[#26262B] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Type className="w-4 h-4 shrink-0 text-sky-400" />
          <span className="text-xs font-bold text-white truncate">
            Typography &amp; Captions
          </span>
        </div>

        {appliedFeedback && (
          <span className="text-[10px] font-mono-studio px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            ✓ {appliedFeedback}
          </span>
        )}
      </div>

      {/* ── Subtabs Header Bar ── */}
      <div className="flex items-center gap-4 sm:gap-5 px-3.5 pt-2 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar shrink-0 bg-[#141417]">
        <button
          type="button"
          onClick={() => setActiveTab('presets')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'presets'
              ? 'text-white border-white'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Preset Packs
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('hooks')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'hooks'
              ? 'text-white border-white'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Hook Vault ({hooksList.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('custom')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 flex items-center gap-1.5 ${
            activeTab === 'custom'
              ? 'text-white border-white'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          <Bookmark className="w-3 h-3" />
          My Vault ({savedSnippets.length})
        </button>
      </div>

      {/* ── Hook Categories (When in hooks tab) ── */}
      {activeTab === 'hooks' && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#26262B]/60 bg-[#141416] shrink-0">
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
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#3B82F6] text-white shadow-sm'
                    : 'bg-[#1C1C20] text-[#A1A1AA] hover:text-white hover:bg-[#26262C] border border-[#2A2A30]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleGenerateFreshHooks}
            className="flex items-center gap-1 text-[10px] text-[#60A5FA] bg-[#2A2A32] hover:bg-[#34343E] px-2 py-1 rounded-lg transition-colors shrink-0 cursor-pointer"
            title="Generate 4 fresh viral hooks"
          >
            <Sparkles className="w-3 h-3" />
            +New
          </button>
        </div>
      )}

      {/* ── Main Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3.5">
        {/* ── Tab 1: Typography Packs ── */}
        {activeTab === 'presets' && (
          <div className="flex flex-col gap-2.5">
            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
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
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[#3B82F6] text-white shadow-sm'
                      : 'bg-[#1C1C20] text-[#A1A1AA] hover:text-white hover:bg-[#26262C] border border-[#2A2A30]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Presets Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search typography presets..."
                className="w-full bg-[#1C1C20] border border-[#2A2A30] rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder:text-[#525252] outline-none focus:border-[#3B82F6]/60 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 gap-2.5">
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
                  <div
                    key={preset.id}
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 text-left ${
                      isSelected
                        ? 'bg-[#1E2330] border-[#3B82F6] ring-1 ring-[#3B82F6]/30'
                        : 'bg-[#1C1C20] border-[#2A2A30] hover:border-[#3A3A42] hover:bg-[#222228]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        {preset.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: preset.color }}
                        />
                      </div>
                    </div>

                    {/* Visual Preview */}
                    <div className="bg-[#121214] border border-[#26262C] rounded-lg p-2.5 flex items-center justify-center text-center">
                      <span className={`text-sm ${preset.className}`}>
                        {preset.previewText}
                      </span>
                    </div>

                    <p className="text-[10px] text-[#A1A1AA] leading-relaxed">
                      {preset.styleDescription}
                    </p>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleApplyPreset(preset);
                      }}
                      className="w-full rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] px-2.5 py-1.5 text-[10px] font-bold text-white transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tab 3: Viral Hook Vault ── */}
        {activeTab === 'hooks' && (
          <div className="flex flex-col gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hook phrases..."
                className="w-full bg-[#1C1C20] border border-[#2A2A30] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-[#525252] outline-none focus:border-[#3B82F6]/60 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {filteredHooks.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-[#2A2A30] bg-[#1C1C20] hover:border-[#3A3A42] hover:bg-[#222228] transition-all flex flex-col gap-2"
                >
                  <div className="bg-[#121214] border border-[#26262C] rounded-lg p-3 flex items-center justify-center text-center min-h-14">
                    <p className="text-xs font-bold text-white tracking-wide leading-relaxed">
                      &ldquo;{item.hook}&rdquo;
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-1 rounded-md border border-[#3B82F6]/20 bg-[#3B82F6]/10 text-[9px] font-mono-studio text-[#60A5FA]">
                      {item.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleInsertHook(item.hook)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Set as Hook
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertQuote(item.hook)}
                        className="px-2.5 py-1.5 rounded-lg border border-[#2F2F38] bg-[#25252C] hover:bg-[#34343E] text-white text-[10px] font-semibold transition-colors cursor-pointer"
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

        {/* ── Tab 4: Custom Vault ── */}
        {activeTab === 'custom' && (
          <div className="flex flex-col gap-3">
            <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-3.5 flex flex-col gap-3">
              <span className="text-xs font-bold text-white">Save Custom Hook or Quote</span>
              <textarea
                value={newSnippetInput}
                onChange={(e) => setNewSnippetInput(e.target.value)}
                placeholder="Type or paste your viral hook..."
                rows={3}
                className="w-full bg-[#141417] border border-[#2A2A30] rounded-lg p-2.5 text-xs text-white placeholder:text-[#52525B] outline-none focus:border-[#3B82F6] resize-none"
              />
              <button
                type="button"
                onClick={handleSaveCustomSnippet}
                disabled={!newSnippetInput.trim()}
                className="bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white rounded-xl py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#3B82F6]/20"
              >
                <Plus className="w-3.5 h-3.5" />
                Save to Library
              </button>
            </div>

            {savedSnippets.length === 0 ? (
              <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-6 text-center text-xs text-[#A1A1AA]">
                No custom snippets saved yet.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {savedSnippets.map((snippet, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-[#2A2A30] bg-[#1C1C20] hover:border-[#3A3A42] transition-colors flex flex-col gap-2"
                  >
                      <div className="bg-[#121214] border border-[#26262C] rounded-lg p-3 flex items-center min-h-14">
                        <p className="text-xs font-medium text-white leading-relaxed">&ldquo;{snippet}&rdquo;</p>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleInsertHook(snippet)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            Set as Hook
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInsertQuote(snippet)}
                            className="px-2.5 py-1.5 rounded-lg border border-[#2F2F38] bg-[#25252C] hover:bg-[#34343E] text-white text-[10px] font-semibold transition-colors cursor-pointer"
                          >
                            Set Quote
                          </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteSnippet(idx)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
