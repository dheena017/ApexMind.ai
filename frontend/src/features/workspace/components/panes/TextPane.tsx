import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ScrollableTabs } from '@/src/shared/ui/ScrollableTabs';
import {
  Type,
  Search,
  Check,
  X,
  Sparkles,
  Bookmark,
  Trash2,
  Plus,
} from 'lucide-react';
import { CustomSelect } from '@/src/shared/ui/CustomSelect';
import { toast } from 'sonner';
import { addWorkspaceNotification } from '../../utils/workspaceNotificationManager';
import { TYPOGRAPHY_PRESETS, TypographyPresetItem } from '../../data/mediaCatalogData';
import {
  generateInfiniteStyles,
  InfiniteStyleMood,
} from '../../data/infiniteStyleEngine';

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
  onApplyPreset?: (preset: TextPreset) => void;
  onUpdateHook?: (hook: string) => void;
}

export const CATEGORY_SELECT_OPTIONS = [
  { value: 'all', label: 'All Categories (Curated & Infinite)', badge: '10M+' },
  { value: 'subtitles', label: 'Subtitles & Captions (Viral Reels)', badge: 'Reels' },
  { value: 'hooks', label: 'Viral Hooks & Attention Openers', badge: 'Hooks' },
  { value: 'quotes', label: 'Quotes & Ancient Wisdom', badge: 'Quotes' },
  { value: 'lowerthirds', label: 'Lower Thirds & Creator Badges', badge: 'Badges' },
  { value: 'cta', label: 'Call To Action (CTA Enders)', badge: 'CTA' },
  { value: 'animations', label: 'Kinetic Motion & Animations', badge: 'FX' },
] as const;

export const CURATED_STYLE_PILLS = [
  { id: 'all', category: 'all', query: '', label: '🔥 All' },
  { id: 'hormozi', category: 'subtitles', query: 'hormozi', label: '⚡ Hormozi' },
  { id: 'mrbeast', category: 'subtitles', query: 'mrbeast', label: '🎯 MrBeast' },
  { id: 'abdaal', category: 'subtitles', query: 'abdaal', label: '🎓 Ali Abdaal' },
  { id: 'karaoke', category: 'subtitles', query: 'karaoke', label: '🎤 Karaoke' },
  { id: 'luxury', category: 'subtitles', query: 'luxury', label: '✨ Luxury' },
  { id: 'cyber', category: 'subtitles', query: 'cyber', label: '🌃 Cyber' },
  { id: 'stoic', category: 'quotes', query: 'stoic', label: '🗿 Stoic' },
  { id: 'gym', category: 'subtitles', query: 'goggins', label: '💪 Raw Grit' },
  { id: 'cinema', category: 'subtitles', query: 'cinema', label: '🎬 Cinema' },
  { id: 'y2k', category: 'subtitles', query: 'y2k', label: '🕹️ Y2K Retro' },
  { id: 'minimal', category: 'subtitles', query: 'minimal', label: '🖤 Minimal' },
  { id: 'hacker', category: 'subtitles', query: 'terminal', label: '💻 Terminal' },
  { id: 'cta', category: 'cta', query: 'cta', label: '🚀 CTAs' },
] as const;

const LOCAL_STORAGE_SNIPPETS_KEY = 'apexmind_saved_text_snippets';

export const TextPane: React.FC<TextPaneProps> = ({
  onApplyPreset,
  onUpdateHook,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>('sub-hormozi');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 10M+ Infinite Style Engine State
  const [infiniteMood, setInfiniteMood] = useState<InfiniteStyleMood>('all');
  const [infinitePage, setInfinitePage] = useState<number>(1);
  const [infiniteStyles, setInfiniteStyles] = useState<TypographyPresetItem[]>(() =>
    generateInfiniteStyles(24, 'all', 1)
  );
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);

  // Custom Snippets
  const [savedSnippets, setSavedSnippets] = useState<string[]>([]);
  const [newSnippetInput, setNewSnippetInput] = useState('');

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
    toast.success(msg);
    addWorkspaceNotification({
      title: 'Typography Applied',
      message: msg,
      category: 'script',
      type: 'success',
      targetPane: 'text',
      actionLabel: 'Text Styling',
    });
  };

  const handleSynthesizeStyles = useCallback((mood?: InfiniteStyleMood) => {
    setIsSynthesizing(true);
    const targetMood = mood !== undefined ? mood : infiniteMood;
    setInfinitePage((prev) => {
      const nextPage = prev + 1;
      setTimeout(() => {
        const generated = generateInfiniteStyles(24, targetMood, nextPage);
        setInfiniteStyles(generated);
        setIsSynthesizing(false);
        triggerFeedback(`Synthesized 24 fresh styles (${targetMood.toUpperCase()})`);
      }, 200);
      return nextPage;
    });
  }, [infiniteMood]);

  const handleLoadMoreInfinite = useCallback(() => {
    setInfinitePage((prev) => {
      const nextPage = prev + 1;
      const more = generateInfiniteStyles(12, infiniteMood, nextPage);
      setInfiniteStyles((curr) => [...curr, ...more]);
      triggerFeedback('Generated 12 more infinite styles');
      return nextPage;
    });
  }, [infiniteMood]);

  const handleApplyPreset = (preset: TypographyPresetItem) => {
    setSelectedPresetId(preset.id);
    const customizedPreset: TextPreset = {
      id: preset.id,
      name: preset.name,
      previewText: preset.previewText,
      className: preset.className,
      color: preset.color,
      styleDescription: preset.styleDescription,
      fontFamily: preset.fontFamily,
      animationType: preset.animationType,
      category: preset.category,
      tags: preset.tags,
    };
    if (onApplyPreset) {
      onApplyPreset(customizedPreset);
    }
    triggerFeedback(`Applied "${preset.name}"`);
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

  // Merged Master Presets + Infinite Procedural Styles
  const combinedPresets = useMemo(() => {
    const existingIds = new Set(TYPOGRAPHY_PRESETS.map((p) => p.id));
    const uniqueInfinite = infiniteStyles.filter((p) => !existingIds.has(p.id));
    return [...TYPOGRAPHY_PRESETS, ...uniqueInfinite];
  }, [infiniteStyles]);

  // Filtered presets
  const filteredPresets = useMemo(() => {
    return combinedPresets.filter((p) => {
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
  }, [combinedPresets, selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-[#141414] text-white font-sans-studio select-none overflow-hidden rounded-none border-0">
      {/* ── Header Title Bar ── */}
      <div className="relative h-12 px-3.5 bg-[#141416] border-b border-[#242424] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.06] border border-[#33333A] text-white">
            <Type className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-tight text-white">
              Typography &amp; Subtitles
            </span>
          </div>
        </div>
      </div>

      <div className="px-3 py-2 bg-[#111111] border-b border-[#242424] shrink-0">
        <ScrollableTabs
          tabs={[
            { id: 'presets', label: 'Presets', icon: Sparkles, color: 'text-[#60A5FA]' },
            { id: 'custom', label: 'Saved', icon: Bookmark, color: 'text-[#60A5FA]' },
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as typeof activeTab)}
        />
      </div>

      {/* Preset search and category filters */}
      {activeTab === 'presets' && (
        <div className="border-b border-[#242424] bg-[#141416] p-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-[140px]">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search typography styles..."
                className="w-full bg-[#181818] border border-[#242424] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/40 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-zinc-500 outline-none transition-all"
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

            <div className="shrink-0 w-36 sm:w-40">
              <CustomSelect
                value={
                  CURATED_STYLE_PILLS.find(
                    (p) =>
                      (p.query === '' && !searchQuery && selectedCategory === 'all') ||
                      (p.query !== '' && searchQuery.toLowerCase() === p.query.toLowerCase())
                  )?.id || 'all'
                }
                onChange={(val) => {
                  const pill = CURATED_STYLE_PILLS.find((p) => p.id === val);
                  if (pill) handleMoodPillSelect(pill);
                }}
                options={CURATED_STYLE_PILLS.map((p) => ({
                  value: p.id,
                  label: p.label,
                }))}
                variant="compact"
                align="right"
                buttonClassName="!w-full !justify-between !bg-[#181818] !border-[#242424] !text-xs !py-2 !px-3 font-semibold hover:!border-white/10"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 flex flex-col gap-3">
        {/* ── UNIFIED TAB: PRESET PACKS & 10M+ STYLES ── */}
        {activeTab === 'presets' && (
          <div className="flex flex-col gap-3">

            {/* Presets & Generated Styles Grid */}
            {filteredPresets.length === 0 ? (
              <div className="bg-[#181818] border border-[#242424] rounded-xl p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
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
                  Reset filters to view all styles
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
                      style={{ contentVisibility: 'auto', containIntrinsicSize: '78px' }}
                      className={`group relative rounded-xl border p-2 bg-[#181818] hover:bg-[#1D1D22] transition-all cursor-pointer flex flex-col gap-1.5 transform-gpu ${
                        isSelected
                          ? 'border-blue-500 ring-1 ring-blue-500/50 shadow-lg shadow-blue-500/10'
                          : 'border-[#242424] hover:border-[#383842]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-bold text-white truncate">
                            {preset.name}
                          </span>
                          {preset.tags?.includes('infinite') && (
                            <span className="text-[9px] font-mono-studio text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1 rounded shrink-0">
                              AI Synth
                            </span>
                          )}
                          {preset.animationType && (
                            <span className="text-[9px] font-mono-studio text-zinc-300 bg-[#1E1E1E] px-1 rounded border border-[#2E2E2E] shrink-0">
                              {preset.animationType}
                            </span>
                          )}
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

                      <div className="bg-[#0C0C0F] border border-[#23232A] rounded-lg p-2.5 flex items-center justify-center text-center min-h-[44px] overflow-hidden">
                        <span
                          className={`text-sm sm:text-base leading-tight select-none ${preset.className}`}
                          style={{ color: preset.color, fontFamily: preset.fontFamily }}
                        >
                          {preset.previewText}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5 px-0.5">
                        <span>{preset.styleDescription}</span>
                        {isSelected && (
                          <span className="text-blue-400 font-semibold shrink-0 ml-2">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Load More Pagination Container */}
                <div className="pt-2 pb-2 flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleLoadMoreInfinite}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#1C1C22] hover:bg-[#25252E] border border-[#2D2D35] hover:border-blue-500/50 text-xs font-semibold text-zinc-200 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm group"
                  >
                    <Plus className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform shrink-0" />
                    <span>Load More Styles</span>
                    <span className="text-[10px] font-mono-studio text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                      +12
                    </span>
                  </button>
                  <span className="text-[10px] font-mono-studio text-zinc-500 text-center">
                    Showing {filteredPresets.length} styles • 10,000,000+ available
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 5: SAVED VAULT ── */}
        {activeTab === 'custom' && (
          <div className="flex flex-col gap-3">
            <div className="bg-[#181818] border border-[#242424] rounded-xl p-3.5 flex flex-col gap-2.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-blue-400" />
                Save Custom Hook or Quote
              </span>
              <textarea
                value={newSnippetInput}
                onChange={(e) => setNewSnippetInput(e.target.value)}
                placeholder="Type or paste a viral hook or quote..."
                rows={3}
                className="w-full bg-[#121216] border border-[#242424] rounded-xl p-2.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-blue-500 resize-none transition-colors"
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
              <div className="bg-[#181818] border border-[#242424] rounded-xl p-6 text-center text-xs text-zinc-500 flex flex-col items-center gap-1">
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
                    className="p-3 rounded-none border-0 bg-[#181818] hover:border-[#383842] transition-colors flex flex-col gap-2"
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
