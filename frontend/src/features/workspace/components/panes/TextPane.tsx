import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ScrollableTabs } from '@/src/shared/ui/ScrollableTabs';
import {
  Type,
  Search,
  Check,
  X,
  Sparkles,
  Sliders,
  Bookmark,
  Trash2,
  Plus,
  Palette,
  RefreshCw,
} from 'lucide-react';
import { CustomSelect } from '@/src/shared/ui/CustomSelect';
import { toast } from 'sonner';
import { addWorkspaceNotification } from '../../utils/workspaceNotificationManager';
import { workspaceApi } from '../../api/workspaceApi';

export interface TextPreset {
  id: string;
  name: string;
  family?: string;
  fontFamily: string;
  category?: string;
  categoryKey?: string;
  designer?: string;
  popularity?: number;
  weights?: number[];
  defaultWeight?: number;
  hasItalic?: boolean;
  stylesCount?: number;
  googleFontUrl?: string;
  className?: string;
  color?: string;
  styleDescription?: string;
  provider?: string;
  tags?: string[];
  previewText?: string;
  fontSize?: number;
  fontWeight?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  animationType?: 'pop' | 'typewriter' | 'karaoke' | 'word-bounce' | 'glow-pulse' | 'slide-up';
}

export interface TextPaneProps {
  onApplyPreset?: (preset: TextPreset) => void;
  onUpdateHook?: (hook: string) => void;
  currentText?: string;
}

export const FONT_CATEGORIES = [
  { value: 'all', label: '✨ All Categories' },
  { value: 'display', label: '💥 Display & Headlines' },
  { value: 'sans-serif', label: '⚡ Sans-Serif (Modern)' },
  { value: 'serif', label: '🗿 Serif (Stoic & Classical)' },
  { value: 'monospace', label: '💻 Monospace (Terminal)' },
  { value: 'handwriting', label: '✍️ Handwriting & Script' },
] as const;

export const TEXT_PROVIDERS = [
  { id: 'all', label: '✨ All Live Providers' },
  { id: 'google_fonts', label: '🌐 Google Fonts (1,900+)' },
  { id: 'fontsource', label: '📚 Fontsource CDN (1,600+)' },
] as const;

const LOCAL_STORAGE_CUSTOM_STYLES_KEY = 'apexmind_saved_custom_typography_styles';

// Dynamic Google Fonts CSS injector
function ensureGoogleFontLoaded(url?: string) {
  if (!url || typeof document === 'undefined') return;
  const existing = document.querySelector(`link[href="${url}"]`);
  if (!existing) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }
}

// Clean, compact preview text formatter for font cards
function getCardPreviewText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return 'The quick brown fox';
  if (trimmed.length <= 36) return trimmed;
  // If long paragraph, take first clean sentence or hook clause
  const firstSentence = trimmed.split(/[.?!]/)[0].trim();
  if (firstSentence && firstSentence.length >= 8 && firstSentence.length <= 40) {
    return firstSentence;
  }
  return trimmed.slice(0, 34).trim() + '...';
}

export const TextPane: React.FC<TextPaneProps> = ({
  onApplyPreset,
  currentText = '',
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'customizer' | 'saved'>('presets');
  const [selectedFontId, setSelectedFontId] = useState<string | null>(null);
  const [selectedWeight, setSelectedWeight] = useState<number>(700);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Real provider stream state
  const [fonts, setFonts] = useState<TextPreset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalFonts, setTotalFonts] = useState<number>(0);

  // Customizer state
  const [customFont, setCustomFont] = useState<string>('Inter, sans-serif');
  const [customColor, setCustomColor] = useState<string>('#FFFFFF');
  const [customWeight, setCustomWeight] = useState<number>(700);
  const [customTransform, setCustomTransform] = useState<'uppercase' | 'none' | 'capitalize'>('none');
  const [customOutline, setCustomOutline] = useState<'heavy' | 'medium' | 'thin' | 'none'>('none');
  const [customShadow, setCustomShadow] = useState<'drop' | 'pop3d' | 'glow' | 'none'>('drop');
  const [customContainer, setCustomContainer] = useState<'pill' | 'glass' | 'border' | 'none'>('none');
  const [customAnimation, setCustomAnimation] = useState<'word-bounce' | 'pop' | 'typewriter' | 'karaoke' | 'glow-pulse' | 'none'>('none');
  const [customStyleName, setCustomStyleName] = useState<string>('');

  // Saved styles library
  const [savedCustomStyles, setSavedCustomStyles] = useState<TextPreset[]>([]);

  // Load saved styles from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_CUSTOM_STYLES_KEY);
      if (stored) {
        setSavedCustomStyles(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const triggerFeedback = (msg: string) => {
    toast.success(msg);
    addWorkspaceNotification({
      title: 'Font Updated',
      message: msg,
      category: 'script',
      type: 'success',
      targetPane: 'text',
      actionLabel: 'Typography',
    });
  };

  // Live search query to backend /api/media/font-search
  const fetchFonts = useCallback(
    async (currentPage: number = 1, append: boolean = false) => {
      setIsLoading(true);
      try {
        const prov = selectedProvider !== 'all' ? selectedProvider : 'google_fonts';
        const res = await workspaceApi.searchOpenFonts(
          searchQuery,
          selectedCategory,
          prov,
          currentPage,
          24
        );

        if (res && res.items) {
          const items: TextPreset[] = res.items;
          // Dynamically load Google Font CSS for all returned fonts
          items.forEach((item) => {
            if (item.googleFontUrl) {
              ensureGoogleFontLoaded(item.googleFontUrl);
            }
          });

          if (append) {
            setFonts((prev) => [...prev, ...items]);
          } else {
            setFonts(items);
            if (items.length > 0 && !selectedFontId) {
              setSelectedFontId(items[0].id);
              setSelectedWeight(items[0].defaultWeight || 700);
            }
          }
          setTotalFonts(res.total || items.length);
        }
      } catch (err) {
        console.error('Failed to load Google Fonts:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, selectedCategory, selectedProvider, selectedFontId]
  );

  // Trigger search on filter changes with debounce
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(() => {
      setPage(1);
      fetchFonts(1, false);
    }, 250);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, selectedCategory, selectedProvider, fetchFonts]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFonts(nextPage, true);
  };

  // Build composite CSS class for customizer
  const computedCustomClass = useMemo(() => {
    const parts: string[] = [];

    // Weight
    if (customWeight === 900) parts.push('font-black');
    else if (customWeight === 800) parts.push('font-extrabold');
    else if (customWeight === 700) parts.push('font-bold');
    else if (customWeight === 600) parts.push('font-semibold');
    else parts.push('font-medium');

    // Transform
    if (customTransform === 'uppercase') parts.push('uppercase tracking-tight');
    else if (customTransform === 'capitalize') parts.push('capitalize tracking-normal');
    else parts.push('normal-case');

    // Outline / Stroke
    if (customOutline === 'heavy') {
      parts.push('[-webkit-text-stroke:2px_#000] [paint-order:stroke_fill] [text-shadow:-2px_-2px_0_#000,2px_-2px_0_#000,-2px_2px_0_#000,2px_2px_0_#000,0_4px_12px_rgba(0,0,0,0.95)]');
    } else if (customOutline === 'medium') {
      parts.push('[-webkit-text-stroke:1.5px_#000] [paint-order:stroke_fill] [text-shadow:-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000]');
    } else if (customOutline === 'thin') {
      parts.push('[-webkit-text-stroke:1px_#000]');
    }

    // Shadow / FX
    if (customShadow === 'drop') {
      parts.push('drop-shadow-[0_4px_14px_rgba(0,0,0,1)]');
    } else if (customShadow === 'pop3d') {
      parts.push('drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]');
    } else if (customShadow === 'glow') {
      parts.push('drop-shadow-[0_0_16px_currentColor]');
    }

    // Container frame
    if (customContainer === 'pill') {
      parts.push('bg-black/90 px-3 py-1 rounded-xl border border-white/10');
    } else if (customContainer === 'glass') {
      parts.push('backdrop-blur-md bg-white/10 px-3 py-1 rounded-xl border border-white/20');
    } else if (customContainer === 'border') {
      parts.push('bg-zinc-950/90 px-3 py-1 rounded-xl border border-blue-500/50');
    }

    return parts.join(' ');
  }, [customWeight, customTransform, customOutline, customShadow, customContainer]);

  const handleApplyFont = (font: TextPreset, weight?: number) => {
    setSelectedFontId(font.id);
    const chosenWeight = weight || font.defaultWeight || 700;
    setSelectedWeight(chosenWeight);

    if (font.googleFontUrl) {
      ensureGoogleFontLoaded(font.googleFontUrl);
    }

    const applied: TextPreset = {
      ...font,
      fontWeight: chosenWeight,
      previewText: currentText?.trim() || font.name,
      color: '#FFFFFF',
    };

    if (onApplyPreset) {
      onApplyPreset(applied);
    }
    triggerFeedback(`Applied Google Font: ${font.name} (${chosenWeight})`);
  };

  const handleApplyCustomizer = () => {
    const customPreset: TextPreset = {
      id: `custom-${Date.now()}`,
      name: customStyleName.trim() || 'Custom Typography',
      previewText: currentText?.trim() || 'Your Text Here',
      className: computedCustomClass,
      color: customColor,
      fontFamily: customFont,
      fontWeight: customWeight,
      textTransform: customTransform,
      animationType: customAnimation !== 'none' ? customAnimation : undefined,
      styleDescription: `${customFont.split(',')[0]} custom style (${customAnimation})`,
      category: 'subtitles',
      tags: ['custom', 'user-defined'],
    };

    if (onApplyPreset) {
      onApplyPreset(customPreset);
    }
    triggerFeedback('Applied custom style to video captions');
  };

  const handleSaveCustomStyle = () => {
    const styleName = customStyleName.trim() || `Custom Style #${savedCustomStyles.length + 1}`;
    const newStyle: TextPreset = {
      id: `saved-style-${Date.now()}`,
      name: styleName,
      previewText: currentText?.trim() || 'Your Text Here',
      className: computedCustomClass,
      color: customColor,
      fontFamily: customFont,
      fontWeight: customWeight,
      textTransform: customTransform,
      animationType: customAnimation !== 'none' ? customAnimation : undefined,
      styleDescription: `${customFont.split(',')[0]} • ${customWeight} • ${customTransform}`,
      category: 'subtitles',
      tags: ['saved-custom'],
    };

    const updated = [newStyle, ...savedCustomStyles];
    setSavedCustomStyles(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_STYLES_KEY, JSON.stringify(updated));
    } catch {}
    setCustomStyleName('');
    triggerFeedback(`Saved "${styleName}" to your style library`);
  };

  const handleDeleteSavedStyle = (id: string) => {
    const updated = savedCustomStyles.filter((s) => s.id !== id);
    setSavedCustomStyles(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_STYLES_KEY, JSON.stringify(updated));
    } catch {}
    toast.success('Removed style from library');
  };

  const effectivePreviewText = currentText?.trim() || 'The quick brown fox';

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
              Google Fonts Provider
            </span>
            <span className="text-[10px] font-mono-studio text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
              1,959 Live Fonts
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchFonts(1, false)}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1C1C22] hover:bg-[#25252E] border border-[#2D2D35] text-zinc-300 hover:text-white text-[11px] font-semibold transition-all cursor-pointer"
          title="Refresh live Google Fonts"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Sync</span>
        </button>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="px-3 py-2 bg-[#111111] border-b border-[#242424] shrink-0">
        <ScrollableTabs
          tabs={[
            { id: 'presets', label: 'Font Styles', icon: Sparkles, color: 'text-[#60A5FA]' },
            { id: 'customizer', label: 'Custom Styler', icon: Sliders, color: 'text-[#60A5FA]' },
            { id: 'saved', label: 'Saved Styles', icon: Bookmark, color: 'text-[#60A5FA]' },
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as typeof activeTab)}
        />
      </div>

      {/* Font search, category dropdown, and provider pills */}
      {activeTab === 'presets' && (
        <div className="border-b border-[#242424] bg-[#141416] p-3 shrink-0 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-[140px]">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Google Fonts (e.g. Montserrat, Bebas, Cinzel)..."
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

            {/* Category Dropdown (All, Display, Sans-Serif, Serif, Monospace, Handwriting) */}
            <div className="shrink-0 w-36 sm:w-44">
              <CustomSelect
                value={selectedCategory}
                onChange={(val) => {
                  setSelectedCategory(val);
                  setPage(1);
                }}
                options={FONT_CATEGORIES.map((c) => ({
                  value: c.value,
                  label: c.label,
                }))}
                variant="compact"
                align="right"
                buttonClassName="!w-full !justify-between !bg-[#181818] !border-[#242424] !text-xs !py-2 !px-3 font-semibold hover:!border-white/10"
              />
            </div>
          </div>

          {/* Text Providers Quick Pills (All Providers, Google Fonts, Fontsource, System) */}
          <div className="flex items-center gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-0.5">
            {TEXT_PROVIDERS.map((provider) => {
              const isProviderActive =
                (provider.id === 'all' && selectedProvider === 'all') ||
                (provider.id === selectedProvider);

              return (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => {
                    setSelectedProvider(provider.id);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                    isProviderActive
                      ? 'bg-blue-600 text-white border border-blue-500 shadow-sm shadow-blue-500/20 font-semibold'
                      : 'bg-[#181818] text-zinc-400 hover:text-white hover:bg-[#26262C] border border-[#242424]'
                  }`}
                >
                  {provider.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Main Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 flex flex-col gap-3">
        {/* ── TAB 1: GOOGLE FONTS PROVIDER (1,900+ LIVE FONTS ONLY) ── */}
        {activeTab === 'presets' && (
          <div className="flex flex-col gap-3">
            {isLoading && fonts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 gap-3 text-zinc-500">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-xs font-semibold">Streaming live Google Fonts catalog...</span>
              </div>
            ) : fonts.length === 0 ? (
              <div className="bg-[#181818] border border-[#242424] rounded-xl p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <Search className="w-6 h-6 text-zinc-600" />
                <p>No Google Fonts matching &ldquo;{searchQuery}&rdquo;</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedProvider('all');
                  }}
                  className="mt-1 text-[11px] text-blue-400 hover:underline cursor-pointer"
                >
                  Reset filters to browse all fonts
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {fonts.map((font) => {
                  const isSelected = selectedFontId === font.id;
                  const availableWeights = font.weights && font.weights.length > 0 ? font.weights : [400, 700];

                  return (
                    <div
                      key={font.id}
                      onClick={() => handleApplyFont(font)}
                      style={{ contentVisibility: 'auto', containIntrinsicSize: '90px' }}
                      className={`group relative rounded-xl border p-3 bg-[#181818] hover:bg-[#1D1D22] transition-all cursor-pointer flex flex-col gap-2 transform-gpu ${
                        isSelected
                          ? 'border-blue-500 ring-1 ring-blue-500/50 shadow-lg shadow-blue-500/10'
                          : 'border-[#242424] hover:border-[#383842]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-bold text-white truncate">
                            {font.name}
                          </span>
                          <span className="text-[9px] font-mono-studio text-blue-400 bg-blue-500/15 border border-blue-500/30 px-1 rounded shrink-0">
                            {font.category || 'Google Font'}
                          </span>
                          <span className="text-[9px] font-mono-studio text-zinc-400 bg-[#1E1E1E] px-1 rounded border border-[#2E2E2E] shrink-0">
                            {font.stylesCount || availableWeights.length} styles
                          </span>
                        </div>

                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Live Dynamic Preview Render in the REAL Google Font */}
                      <div className="bg-[#0C0C0F] border border-[#23232A] rounded-lg py-3.5 px-4 flex items-center justify-center text-center min-h-[58px] overflow-hidden">
                        <span
                          className="text-xl sm:text-2xl leading-snug select-none text-white tracking-tight"
                          style={{
                            fontFamily: font.fontFamily,
                            fontWeight: isSelected ? selectedWeight : font.defaultWeight || 700,
                          }}
                        >
                          {getCardPreviewText(effectivePreviewText)}
                        </span>
                      </div>

                      {/* Provider Details & Available Font Weights */}
                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-[10px] text-zinc-500 truncate">
                          {font.designer ? `by ${font.designer}` : 'Google Fonts'}
                        </span>

                        {/* Weight selector pills */}
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {availableWeights.slice(0, 4).map((w) => (
                            <button
                              key={w}
                              type="button"
                              onClick={() => handleApplyFont(font, w)}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono-studio transition-colors cursor-pointer ${
                                isSelected && selectedWeight === w
                                  ? 'bg-blue-600 text-white font-bold'
                                  : 'bg-[#22222A] text-zinc-400 hover:text-white border border-[#2D2D38]'
                              }`}
                              title={`Apply weight ${w}`}
                            >
                              {w}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Load More Pagination Container */}
                <div className="pt-2 pb-2 flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#1C1C22] hover:bg-[#25252E] border border-[#2D2D35] hover:border-blue-500/50 text-xs font-semibold text-zinc-200 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm group"
                  >
                    <Plus className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform shrink-0" />
                    <span>Load More Font Styles</span>
                    <span className="text-[10px] font-mono-studio text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                      +24
                    </span>
                  </button>
                  <span className="text-[10px] font-mono-studio text-zinc-500 text-center">
                    Showing {fonts.length} of {totalFonts || '1,959'} Font Styles
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: INTERACTIVE CUSTOM STYLE BUILDER ── */}
        {activeTab === 'customizer' && (
          <div className="flex flex-col gap-3.5">
            {/* Live Interactive Custom Preview Card */}
            <div className="bg-[#18181C] border border-blue-500/30 rounded-xl p-3.5 flex flex-col gap-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  Live Custom Style Preview
                </span>
                <span className="text-[10px] text-zinc-400 font-mono-studio">
                  {customFont.split(',')[0]}
                </span>
              </div>

              <div className="bg-[#0C0C0F] border border-[#23232A] rounded-lg p-4 flex items-center justify-center text-center min-h-[64px] overflow-hidden">
                <span
                  className={`text-base sm:text-lg leading-tight select-none ${computedCustomClass}`}
                  style={{ color: customColor, fontFamily: customFont }}
                >
                  {effectivePreviewText}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleApplyCustomizer}
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  Apply to Video
                </button>
              </div>
            </div>

            {/* Customizer Controls */}
            <div className="bg-[#181818] border border-[#242424] rounded-xl p-3 flex flex-col gap-3">
              {/* Weight & Casing */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-zinc-300">Font Weight</label>
                  <select
                    value={customWeight}
                    onChange={(e) => setCustomWeight(Number(e.target.value))}
                    className="bg-[#121215] border border-[#25252B] rounded-lg px-2 py-1.5 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value={900}>900 Black</option>
                    <option value={800}>800 ExtraBold</option>
                    <option value={700}>700 Bold</option>
                    <option value={600}>600 SemiBold</option>
                    <option value={400}>400 Normal</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-zinc-300">Text Casing</label>
                  <select
                    value={customTransform}
                    onChange={(e) => setCustomTransform(e.target.value as typeof customTransform)}
                    className="bg-[#121215] border border-[#25252B] rounded-lg px-2 py-1.5 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="uppercase">UPPERCASE</option>
                    <option value="capitalize">Capitalize Words</option>
                    <option value="none">Normal Case</option>
                  </select>
                </div>
              </div>

              {/* Stroke & Shadow */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-zinc-300">Dark Outline</label>
                  <select
                    value={customOutline}
                    onChange={(e) => setCustomOutline(e.target.value as typeof customOutline)}
                    className="bg-[#121215] border border-[#25252B] rounded-lg px-2 py-1.5 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="heavy">Heavy 2px Stroke</option>
                    <option value="medium">Medium 1.5px Stroke</option>
                    <option value="thin">Thin 1px Stroke</option>
                    <option value="none">None</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-zinc-300">Shadow &amp; Glow</label>
                  <select
                    value={customShadow}
                    onChange={(e) => setCustomShadow(e.target.value as typeof customShadow)}
                    className="bg-[#121215] border border-[#25252B] rounded-lg px-2 py-1.5 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="drop">Deep Drop Shadow</option>
                    <option value="pop3d">3D Hard Shadow</option>
                    <option value="glow">Neon Color Glow</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>

              {/* Container & Animation */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-zinc-300">Background Pill</label>
                  <select
                    value={customContainer}
                    onChange={(e) => setCustomContainer(e.target.value as typeof customContainer)}
                    className="bg-[#121215] border border-[#25252B] rounded-lg px-2 py-1.5 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="pill">Solid Black Pill</option>
                    <option value="glass">Frosted Glass</option>
                    <option value="border">Neon Border Box</option>
                    <option value="none">None (Floating Text)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-zinc-300">Kinetic Animation</label>
                  <select
                    value={customAnimation}
                    onChange={(e) => setCustomAnimation(e.target.value as typeof customAnimation)}
                    className="bg-[#121215] border border-[#25252B] rounded-lg px-2 py-1.5 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="word-bounce">Word Bounce</option>
                    <option value="pop">Pop Spring</option>
                    <option value="typewriter">Typewriter</option>
                    <option value="karaoke">Karaoke Word Glow</option>
                    <option value="glow-pulse">Glow Pulse</option>
                    <option value="none">Static (No Motion)</option>
                  </select>
                </div>
              </div>

              {/* Save Style Section */}
              <div className="pt-2 border-t border-[#242424] flex flex-col gap-2">
                <label className="text-[11px] font-bold text-zinc-300">Save to My Styles</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customStyleName}
                    onChange={(e) => setCustomStyleName(e.target.value)}
                    placeholder="Style name (e.g. My Clean Style)..."
                    className="flex-1 bg-[#121215] border border-[#25252B] focus:border-blue-500 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomStyle}
                    className="px-3 py-1.5 rounded-lg bg-[#22222A] hover:bg-[#2C2C36] border border-[#353540] text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-blue-400" />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: USER SAVED CUSTOM STYLES ── */}
        {activeTab === 'saved' && (
          <div className="flex flex-col gap-3">
            {savedCustomStyles.length === 0 ? (
              <div className="bg-[#181818] border border-[#242424] rounded-xl p-8 text-center text-xs text-zinc-500 flex flex-col items-center gap-2">
                <Bookmark className="w-6 h-6 text-zinc-600" />
                <p className="font-semibold text-zinc-400">No saved custom styles yet</p>
                <p className="text-[11px] text-zinc-500 max-w-xs">
                  Customize and save your own styles in the &ldquo;Custom Styler&rdquo; tab to reuse here.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('customizer')}
                  className="mt-1 px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 text-xs font-semibold cursor-pointer"
                >
                  Open Custom Styler
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {savedCustomStyles.map((style) => (
                  <div
                    key={style.id}
                    className="group relative rounded-xl border border-[#242424] hover:border-[#383842] p-2.5 bg-[#181818] hover:bg-[#1D1D22] transition-all flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        {style.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (onApplyPreset) onApplyPreset(style);
                            triggerFeedback(`Applied "${style.name}"`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          Apply
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSavedStyle(style.id)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-[#251518] transition-colors cursor-pointer"
                          title="Delete saved style"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#0C0C0F] border border-[#23232A] rounded-lg p-3 flex items-center justify-center text-center min-h-[48px] overflow-hidden">
                      <span
                        className={`text-sm sm:text-base leading-tight select-none ${style.className || ''}`}
                        style={{ color: style.color || '#FFFFFF', fontFamily: style.fontFamily }}
                      >
                        {effectivePreviewText}
                      </span>
                    </div>

                    <div className="text-[10px] text-zinc-500 truncate">
                      {style.styleDescription}
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
