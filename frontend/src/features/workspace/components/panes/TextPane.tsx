import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Type,
  Search,
  Check,
  X,
  Plus,
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
  { value: 'bold-impact', label: '⚡ Bold & Impactful (Viral Shorts)' },
  { value: 'display', label: '💥 Display & Headlines' },
  { value: 'sans-serif', label: '⚡ Sans-Serif (Clean & Modern)' },
  { value: 'minimal', label: '💎 Minimal & Geometric (Tech)' },
  { value: 'condensed', label: '📐 Condensed & Tall (Titles)' },
  { value: 'serif', label: '🗿 Serif (Stoic & Editorial)' },
  { value: 'slab-serif', label: '🏛️ Slab Serif (Heavy & News)' },
  { value: 'monospace', label: '💻 Monospace (Terminal & Cyber)' },
  { value: 'futuristic', label: '🚀 Futuristic & Sci-Fi' },
  { value: 'retro', label: '👾 Retro, Y2K & Pixel' },
  { value: 'handwriting', label: '✍️ Handwriting & Casual' },
  { value: 'calligraphy', label: '✒️ Calligraphy & Signature' },
] as const;

export const TEXT_PROVIDERS = [
  { id: 'all', label: '✨ All Live Providers' },
  { id: 'google_fonts', label: '🌐 Google Fonts (1,900+)' },
  { id: 'fontshare', label: '💎 Fontshare ITF (Viral Display)' },
  { id: 'fontsource', label: '📚 Fontsource CDN (1,600+)' },
  { id: 'bunny', label: '🐰 Bunny Fonts (1,900+)' },
  { id: 'gwfh', label: '🏛️ GWFH Open Fonts (1,500+)' },
] as const;

const loadedFontUrls = new Set<string>();

// Dynamic stylesheet injector without URL hash collisions and with reactive load notification
function ensureFontLoaded(url?: string, onFontReady?: () => void) {
  if (!url || typeof document === 'undefined') return;
  if (loadedFontUrls.has(url)) return;
  loadedFontUrls.add(url);

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  if (onFontReady) {
    link.onload = () => {
      if (document.fonts) {
        document.fonts.ready.then(() => onFontReady()).catch(() => onFontReady());
      } else {
        onFontReady();
      }
    };
  }
  document.head.appendChild(link);
}

// Clean preview formatter: truncates long project scripts for card display
function getCardPreviewText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  if (trimmed.length <= 36) return trimmed;
  const firstSentence = trimmed.split(/[.?!]/)[0].trim();
  if (firstSentence && firstSentence.length >= 8 && firstSentence.length <= 40) {
    return firstSentence;
  }
  return trimmed.slice(0, 34).trim() + '...';
}

function renderFontProviderBadge(provider?: string) {
  switch (provider) {
    case 'fontshare':
      return (
        <span className="text-[9px] font-mono-studio text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1 rounded shrink-0">
          Fontshare
        </span>
      );
    case 'gwfh':
    case 'open_font_library':
      return (
        <span className="text-[9px] font-mono-studio text-purple-300 bg-purple-500/15 border border-purple-500/30 px-1 rounded shrink-0">
          GWFH
        </span>
      );
    case 'fontsource':
      return (
        <span className="text-[9px] font-mono-studio text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1 rounded shrink-0">
          Fontsource
        </span>
      );
    case 'bunny':
    case 'coollabs':
      return (
        <span className="text-[9px] font-mono-studio text-pink-300 bg-pink-500/15 border border-pink-500/30 px-1 rounded shrink-0">
          Bunny
        </span>
      );
    default:
      return (
        <span className="text-[9px] font-mono-studio text-blue-300 bg-blue-500/15 border border-blue-500/30 px-1 rounded shrink-0">
          Google
        </span>
      );
  }
}

export const TextPane: React.FC<TextPaneProps> = ({
  onApplyPreset,
  currentText = '',
}) => {
  const [selectedFontId, setSelectedFontId] = useState<string | null>(null);
  const [selectedWeight, setSelectedWeight] = useState<number>(700);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Live provider stream state
  const [fonts, setFonts] = useState<TextPreset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalFonts, setTotalFonts] = useState<number>(0);
  const [, setLoadedVersion] = useState<number>(0);

  const triggerFontRepaint = useCallback(() => {
    setLoadedVersion((v) => v + 1);
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
        const prov = selectedProvider;
        const res = await workspaceApi.searchOpenFonts(
          searchQuery,
          selectedCategory,
          prov,
          currentPage,
          24
        );

        if (res && res.items) {
          const items: TextPreset[] = res.items;
          items.forEach((item) => {
            if (item.googleFontUrl) {
              ensureFontLoaded(item.googleFontUrl, triggerFontRepaint);
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
        console.error('Failed to load live fonts:', err);
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

  const handleApplyFont = (font: TextPreset, weight?: number) => {
    setSelectedFontId(font.id);
    const chosenWeight = weight || font.defaultWeight || 700;
    setSelectedWeight(chosenWeight);

    if (font.googleFontUrl) {
      ensureFontLoaded(font.googleFontUrl, triggerFontRepaint);
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
    triggerFeedback(`Applied Font: ${font.name} (${chosenWeight})`);
  };

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
              Font Styles
            </span>
            <span className="text-[10px] font-mono-studio text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
              {totalFonts ? `${totalFonts.toLocaleString()} Live Fonts` : '8,500+ Live Fonts'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchFonts(1, false)}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1C1C22] hover:bg-[#25252E] border border-[#2D2D35] text-zinc-300 hover:text-white text-[11px] font-semibold transition-all cursor-pointer"
          title="Refresh live font catalog"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Sync</span>
        </button>
      </div>

      {/* ── Search, Categories & Providers ── */}
      <div className="border-b border-[#242424] bg-[#141416] p-3 shrink-0 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-[140px]">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search live fonts (e.g. Satoshi, Montserrat, Clash Display, Bebas)..."
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

          {/* Category Dropdown */}
          <div className="shrink-0 w-40 sm:w-52">
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

        {/* Text Providers Quick Pills */}
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

      {/* ── Main Font Styles List ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 flex flex-col gap-3">
        {isLoading && fonts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3 text-zinc-500">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-xs font-semibold">Streaming live font styles...</span>
          </div>
        ) : fonts.length === 0 ? (
          <div className="bg-[#181818] border border-[#242424] rounded-xl p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <Search className="w-6 h-6 text-zinc-600" />
            <p>No fonts found matching &ldquo;{searchQuery}&rdquo;</p>
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

              // Dynamically display project script text if present; otherwise display the font's own name
              const previewTextToRender = currentText?.trim()
                ? getCardPreviewText(currentText)
                : font.name;

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
                      {renderFontProviderBadge(font.provider)}
                      <span className="text-[9px] font-mono-studio text-zinc-400 bg-[#1E1E1E] px-1 rounded border border-[#2E2E2E] shrink-0">
                        {font.category || 'Font'}
                      </span>
                      <span className="text-[9px] font-mono-studio text-zinc-500 bg-[#141416] px-1 rounded border border-[#242428] shrink-0 hidden sm:inline">
                        {font.stylesCount || availableWeights.length} styles
                      </span>
                    </div>

                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Dynamic Font Preview: displays user's real script text or font's own name in its exact typeface */}
                  <div className="bg-[#0C0C0F] border border-[#23232A] rounded-lg py-3.5 px-4 flex items-center justify-center text-center min-h-[58px] overflow-hidden">
                    <span
                      className="text-xl sm:text-2xl leading-snug select-none text-white tracking-tight"
                      style={{
                        fontFamily: font.fontFamily,
                        fontWeight: isSelected ? selectedWeight : font.defaultWeight || 700,
                      }}
                    >
                      {previewTextToRender}
                    </span>
                  </div>

                  {/* Provider Details & Weight Selector */}
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[10px] text-zinc-500 truncate">
                      {font.designer ? `by ${font.designer}` : font.name}
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
                Showing {fonts.length} of {totalFonts ? totalFonts.toLocaleString() : '5,500+'} Font Styles
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
