import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ScrollableTabs, TabItem } from '@/src/shared/ui/ScrollableTabs';
import { CustomSelect } from '@/src/shared/ui/CustomSelect';
import {
  Shapes,
  Search,
  Check,
  X,
  Plus,
  Trash2,
  Sparkles,
  RefreshCw,
  Sliders,
  Bookmark,
  Zap,
  Crown,
  Flame,
  Shield,
  Layers,
  ExternalLink,
  Loader2,
  Globe,
  Palette,
  Smile,
  MessageSquare,
  Film,
  Building,
  Coins,
  Flag,
  Scissors,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { addWorkspaceNotification } from '../../utils/workspaceNotificationManager';
import { elementsApi, VisualElementItem } from '../../api/elementsApi';

export interface ElementsPaneProps {
  onInsertElement?: (element: { id: string; name: string; type: string; value: string; label?: string }) => void;
  onToggleVignette?: () => void;
  onToggleGrain?: () => void;
  onSwitchToVideos?: () => void;
  onSwitchToImages?: () => void;
}

export const ELEMENT_PROVIDERS = [
  { id: 'all', label: '✨ All Live Providers' },
  { id: 'iconify', label: '🎨 Iconify (200k+ Live)' },
  { id: 'studio', label: '👑 Apex Studio (Viral)' },
  { id: 'openmoji', label: '🌟 OpenMoji (4,000+)' },
  { id: 'twemoji', label: '🐦 Twemoji (Viral Reactions)' },
  { id: 'noto_emoji', label: '🌐 Google Noto (3,500+)' },
  { id: 'svgrepo', label: '📐 SVG Repo (500k+)' },
  { id: 'game_icons', label: '⚔️ Game & Stoic (4,000+)' },
  { id: 'giphy_stickers', label: '🎬 Giphy Stickers (Live)' },
  { id: 'tenor_stickers', label: '💥 Tenor Stickers (Meme)' },
  { id: 'wikimedia', label: '🏛️ Wikimedia (Seals & Crests)' },
  { id: 'openverse', label: '🌍 Openverse (CC Overlays)' },
  { id: 'reshot', label: '✨ Reshot (Minimal Vectors)' },
  { id: 'svg_shapes', label: '💬 Shapes & Callouts' },
  { id: 'brand_logos', label: '🏷️ Brand Logos (3,000+)' },
  { id: 'cryptologos', label: '💰 Crypto & Finance' },
  { id: 'flags_iso', label: '🚩 World Flags (250+)' },
] as const;

export const ELEMENT_CATEGORIES = [
  { value: 'all', label: '✨ All Categories' },
  { value: 'badges', label: '🏅 Badges & Seals' },
  { value: 'icons', label: '🎨 Vector Icons' },
  { value: 'emojis', label: '🌟 Emojis & Reactions' },
  { value: 'stickers', label: '🎬 Animated Stickers' },
  { value: 'shapes', label: '💬 Callouts & Shapes' },
  { value: 'brands', label: '🏷️ Brands & Finance' },
  { value: 'progress', label: '⏱️ Progress Scrubbers' },
  { value: 'social', label: '📱 Social CTA Pills' },
  { value: 'frames', label: '🔲 Frames & Letterbox' },
] as const;

const SAVED_ELEMENTS_KEY = 'apexmind_saved_elements';

interface ElementCardProps {
  el: VisualElementItem;
  isSelected: boolean;
  onApply: (el: VisualElementItem) => void;
  onSaveToggle: (el: VisualElementItem, e: React.MouseEvent) => void;
  isSaved: boolean;
}

const ElementCard = React.memo<ElementCardProps>(({
  el,
  isSelected,
  onApply,
  onSaveToggle,
  isSaved,
}) => {
  const [imgError, setImgError] = useState(false);

  const isBadge = el.category === 'badges' || el.type === 'badge';
  const isEmoji = el.category === 'emojis' || el.type === 'emoji';
  const isProgress = el.category === 'progress';
  const isSticker = el.category === 'stickers' || el.type === 'sticker';

  const renderBadgeTag = (prov?: string) => {
    switch (prov) {
      case 'studio':
        return <span className="px-1 py-0.2 rounded text-[7.5px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Studio</span>;
      case 'iconify':
        return <span className="px-1 py-0.2 rounded text-[7.5px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">Iconify</span>;
      case 'openmoji':
        return <span className="px-1 py-0.2 rounded text-[7.5px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">OpenMoji</span>;
      case 'twemoji':
        return <span className="px-1 py-0.2 rounded text-[7.5px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">Twemoji</span>;
      case 'noto_emoji':
        return <span className="px-1 py-0.2 rounded text-[7.5px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">Noto</span>;
      case 'giphy_stickers':
        return <span className="px-1 py-0.2 rounded text-[7.5px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">Animated</span>;
      case 'tenor_stickers':
        return <span className="px-1 py-0.2 rounded text-[7.5px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">Tenor</span>;
      case 'game_icons':
        return <span className="px-1 py-0.2 rounded text-[7.5px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">Stoic</span>;
      case 'brand_logos':
        return <span className="px-1 py-0.2 rounded text-[7.5px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Brand</span>;
      case 'cryptologos':
        return <span className="px-1 py-0.2 rounded text-[7.5px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">Crypto</span>;
      case 'wikimedia':
        return <span className="px-1 py-0.2 rounded text-[7.5px] font-bold bg-zinc-500/20 text-zinc-300 border border-zinc-500/30">Wiki</span>;
      case 'flags_iso':
        return <span className="px-1 py-0.2 rounded text-[7.5px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">Flag</span>;
      default:
        return <span className="px-1 py-0.2 rounded text-[7.5px] font-bold bg-zinc-700/40 text-zinc-300 border border-zinc-600/30">{prov || 'Vector'}</span>;
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onApply(el)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onApply(el);
        }
      }}
      style={{ contentVisibility: 'auto', containIntrinsicSize: '90px' }}
      className={`group relative rounded-xl border overflow-hidden h-24 sm:h-26 bg-[#181818] hover:bg-[#1f1f24] transition-all cursor-pointer text-left transform-gpu flex flex-col justify-between p-1.5 ${
        isSelected
          ? 'border-[#3B82F6] ring-1 ring-[#3B82F6]/50 shadow-md shadow-blue-500/10'
          : 'border-[#242424] hover:border-[#3B82F6]'
      }`}
    >
      {/* Top Bar: Provider Tag + Bookmark */}
      <div className="w-full flex items-center justify-between z-10 px-0.5">
        {renderBadgeTag(el.provider)}

        <div className="flex items-center gap-1">
          {isSelected && (
            <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center shadow-xs">
              <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
            </div>
          )}
          <button
            type="button"
            onClick={(e) => onSaveToggle(el, e)}
            className={`p-0.5 rounded-md transition-all cursor-pointer ${
              isSaved
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 hover:bg-white/10'
            }`}
            title={isSaved ? 'Remove from Saved' : 'Save'}
          >
            <Bookmark className={`w-3 h-3 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Asset Display Center (Compact & Well Proportioned) */}
      <div className="w-full flex-1 flex items-center justify-center py-0.5 select-none overflow-hidden">
        {isBadge && el.color ? (
          <div
            className={`px-1.5 py-0.5 rounded-full text-[7.5px] font-black uppercase text-white bg-gradient-to-r ${el.color} shadow-xs flex items-center gap-1 max-w-[96%] truncate transform group-hover:scale-105 transition-transform`}
          >
            <Zap className="w-2 h-2 shrink-0" />
            <span className="truncate">{el.label || el.name}</span>
          </div>
        ) : isProgress ? (
          <div className="w-full flex flex-col items-center gap-1 px-1">
            <div className={`w-full h-1.5 rounded-full ${el.color || 'bg-amber-400'} shadow-xs`} />
            <span className="text-[7px] text-zinc-400 font-mono-studio">Scrubber</span>
          </div>
        ) : (el.svgUrl || el.previewUrl) && !imgError ? (
          <img
            src={el.svgUrl || el.previewUrl}
            alt={el.name}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className={`object-contain transition-transform duration-300 group-hover:scale-110 ${
              isSticker ? 'h-10 w-10' : 'h-8 w-8 sm:h-9 sm:w-9 max-h-[85%] max-w-[85%]'
            }`}
          />
        ) : el.symbol ? (
          <span className="text-xl transition-transform duration-300 group-hover:scale-115 select-none">
            {el.symbol}
          </span>
        ) : (
          <Shapes className="w-6 h-6 text-zinc-500 group-hover:text-blue-400 transition-colors" />
        )}
      </div>

      {/* Bottom Title Bar */}
      <div className="w-full pt-1 border-t border-[#222224] flex items-center justify-between text-[8.5px] text-zinc-400 z-10 px-0.5">
        <span className="truncate max-w-[80%] font-medium text-zinc-300 group-hover:text-white transition-colors" title={el.name}>
          {el.name}
        </span>
        <span className="text-blue-400 font-bold group-hover:underline text-[8px] shrink-0">+</span>
      </div>
    </div>
  );
});

export const ElementsPane: React.FC<ElementsPaneProps> = ({
  onInsertElement,
  onToggleVignette,
  onToggleGrain,
  onSwitchToVideos,
  onSwitchToImages,
}) => {
  // Navigation Tabs matching TextPane screenshot
  const [activeTab, setActiveTab] = useState<'elements' | 'customizer' | 'saved'>('elements');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [gridColumns, setGridColumns] = useState<3 | 4>(3);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Dynamic Data & Loading State
  const [elements, setElements] = useState<VisualElementItem[]>([]);
  const [savedElements, setSavedElements] = useState<VisualElementItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(SAVED_ELEMENTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);

  // Custom Badge Creator State
  const [customBadgeText, setCustomBadgeText] = useState('');
  const [customBadgeGradient, setCustomBadgeGradient] = useState('from-amber-500 to-orange-600');
  const [isCreatingBadge, setIsCreatingBadge] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch pure live elements from backend
  const fetchLiveElements = useCallback(
    async (q: string, category: string, provider: string, pageNum: number, append: boolean = false) => {
      try {
        if (!append) {
          setIsLoading(true);
          setErrorMessage(null);
        }
        const res = await elementsApi.searchElements({
          query: q.trim(),
          category,
          provider,
          page: pageNum,
          pageSize: 40,
        });

        if (res.error) {
          setErrorMessage(res.error);
          if (!append) setElements([]);
          return;
        }

        if (res && res.elements) {
          setErrorMessage(null);
          if (append) {
            setElements((prev) => [...prev, ...res.elements]);
          } else {
            setElements(res.elements);
          }
          setTotalCount(res.total || 0);
        }
      } catch (err) {
        console.error('[ElementsPane] Search query failed:', err);
        const msg = err instanceof Error ? err.message : 'Live element providers unreachable';
        setErrorMessage(msg);
        if (!append) setElements([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Debounced search on filter change
  useEffect(() => {
    if (activeTab !== 'elements') return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setPage(1);

    debounceTimerRef.current = setTimeout(() => {
      fetchLiveElements(searchQuery, selectedCategory, selectedProvider, 1, false);
    }, 280);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchQuery, selectedCategory, selectedProvider, activeTab, fetchLiveElements]);

  // Load more pagination
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLiveElements(searchQuery, selectedCategory, selectedProvider, nextPage, true);
  };

  // Insert element to canvas & timeline
  const handleApply = (el: VisualElementItem) => {
    setSelectedId(el.id);
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'overlay' }));

    const elementValue = el.svgUrl || el.previewUrl || el.symbol || el.label || el.name;

    if (onInsertElement) {
      onInsertElement({
        id: el.id,
        name: el.name,
        type: el.type,
        value: elementValue,
        label: el.label || el.name,
      });
    }

    window.dispatchEvent(
      new CustomEvent('workspace:add-timeline-clip', {
        detail: {
          type: 'overlay',
          elementType: el.type,
          value: elementValue,
          name: el.name,
          duration: 4.5,
        },
      })
    );

    toast.success(`Applied "${el.name}" to canvas`);
    addWorkspaceNotification({
      title: 'Element Added',
      message: `Added ${el.name} from ${el.provider || 'catalog'} to timeline.`,
      category: 'media',
      type: 'info',
      targetPane: 'elements',
      actionLabel: 'Canvas',
    });
  };

  // Save / Bookmark element toggle
  const handleSaveToggle = (el: VisualElementItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedElements((prev) => {
      const exists = prev.some((x) => x.id === el.id);
      let updated: VisualElementItem[];
      if (exists) {
        updated = prev.filter((x) => x.id !== el.id);
        toast.info(`Removed "${el.name}" from saved`);
      } else {
        updated = [el, ...prev];
        toast.success(`Saved "${el.name}" to library`);
      }
      try {
        localStorage.setItem(SAVED_ELEMENTS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Custom Badge Creator Submission
  const handleCreateCustomBadge = async () => {
    if (!customBadgeText.trim()) return;
    setIsCreatingBadge(true);
    try {
      const res = await elementsApi.createCustomBadge({
        text: customBadgeText.trim(),
        gradient: customBadgeGradient,
      });
      if (res?.element) {
        handleApply(res.element);
        setCustomBadgeText('');
        toast.success('Generated custom badge!');
        setActiveTab('elements');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create badge');
    } finally {
      setIsCreatingBadge(false);
    }
  };

  // Tabs structure matching TextPane
  const TABS: TabItem<'elements' | 'customizer' | 'saved'>[] = [
    {
      id: 'elements',
      label: 'Live Elements',
      icon: Shapes,
      badge: totalCount > 9999 ? `${(totalCount / 1000000).toFixed(1)}M+` : totalCount > 999 ? `${Math.floor(totalCount / 1000)}k+` : totalCount || '1M+',
    },
    { id: 'customizer', label: 'Style Customizer', icon: Sliders },
    { id: 'saved', label: 'Saved Styles', icon: Bookmark, badge: savedElements.length || undefined },
  ];

  return (
    <div className="flex flex-col h-full bg-[#141414] text-white font-sans-studio select-none overflow-hidden rounded-none border-0">
      {/* ── Top Header Title Bar ── */}
      <div className="relative h-12 px-3.5 bg-[#141416] border-b border-[#242424] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.06] border border-[#33333A] text-white">
            <Shapes className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-tight text-white">
              Studio Elements
            </span>
            <span className="text-[10px] font-mono-studio text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
              {totalCount ? `${totalCount.toLocaleString()} Live Elements` : '1M+ Live Elements'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchLiveElements(searchQuery, selectedCategory, selectedProvider, 1, false)}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1C1C22] hover:bg-[#25252E] border border-[#2D2D35] text-zinc-300 hover:text-white text-[11px] font-semibold transition-all cursor-pointer"
          title="Refresh live element catalog"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Sync</span>
        </button>
      </div>

      {/* ── Top Navigation Tabs (Exact visual match to user screenshot) ── */}
      <div className="px-3 pt-2.5 pb-2 bg-[#141416] border-b border-[#242424] shrink-0">
        <ScrollableTabs
          tabs={TABS}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab)}
          containerBgClassName="bg-[#121214]"
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: LIVE ELEMENTS CATALOG */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'elements' && (
        <>
          {/* Search, Categories & Providers (Exact visual match to user screenshot) */}
          <div className="border-b border-[#242424] bg-[#141416] p-3 shrink-0 flex flex-col gap-2.5">
            {/* Search Bar + All Categories Dropdown */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-[140px]">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search live elements (e.g. fire, sword, crown, subscribe, 100)..."
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
                  options={ELEMENT_CATEGORIES.map((c) => ({
                    value: c.value,
                    label: c.label,
                  }))}
                  variant="compact"
                  align="right"
                  buttonClassName="!w-full !justify-between !bg-[#181818] !border-[#242424] !text-xs !py-2 !px-3 font-semibold hover:!border-white/10"
                />
              </div>
            </div>

            {/* Providers Quick Filter Pills (Exact visual match to user screenshot) */}
            <div className="flex items-center gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-0.5">
              {ELEMENT_PROVIDERS.map((provider) => {
                const isProviderActive = selectedProvider === provider.id;
                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => {
                      setSelectedProvider(provider.id);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      isProviderActive
                        ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
                        : 'bg-[#181818] hover:bg-[#202020] text-zinc-400 hover:text-white border border-[#262626]'
                    }`}
                  >
                    {provider.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card Grid Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-3">
            {/* View Stats & Column Density Toggle */}
            <div className="flex items-center justify-between px-0.5 text-[10px] text-zinc-400">
              <span className="font-mono-studio text-zinc-500">
                {totalCount > 0 ? `${totalCount.toLocaleString()} Live Assets` : 'Live Vectors & Badges'}
              </span>
              <div className="flex items-center gap-1 bg-[#181818] p-0.5 rounded-lg border border-[#242424]">
                <button
                  type="button"
                  onClick={() => setGridColumns(3)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                    gridColumns === 3
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="3 Columns (Balanced)"
                >
                  3 Col
                </button>
                <button
                  type="button"
                  onClick={() => setGridColumns(4)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                    gridColumns === 4
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="4 Columns (Compact Grid)"
                >
                  4 Col
                </button>
              </div>
            </div>

            {errorMessage ? (
              <div className="bg-[#181818] border border-rose-900/40 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3 my-auto">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-bold text-white">Live Provider Error</p>
                  <p className="text-[11px] text-zinc-400 max-w-xs font-mono-studio bg-black/40 p-2 rounded border border-white/5 break-words">
                    {errorMessage}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fetchLiveElements(searchQuery, selectedCategory, selectedProvider, 1, false)}
                  className="mt-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Connection</span>
                </button>
              </div>
            ) : isLoading && elements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-500 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-xs font-mono-studio">Streaming live element providers...</span>
              </div>
            ) : elements.length === 0 ? (
              <div className="bg-[#181818] border border-[#242424] rounded-xl p-8 flex flex-col items-center justify-center text-center gap-2">
                <Shapes className="w-8 h-8 text-[#52525B] opacity-40" />
                <p className="text-xs font-bold text-white">No Elements Found</p>
                <p className="text-[11px] text-zinc-400 max-w-xs">
                  Try searching for a different keyword like &ldquo;flame&rdquo;, &ldquo;crown&rdquo;, or switch providers.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedProvider('all');
                  }}
                  className="mt-2 text-xs font-semibold text-blue-400 hover:text-blue-300"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className={`grid ${gridColumns === 4 ? 'grid-cols-4' : 'grid-cols-3'} gap-2`}>
                {elements.map((el) => {
                  const isSaved = savedElements.some((x) => x.id === el.id);
                  return (
                    <ElementCard
                      key={el.id}
                      el={el}
                      isSelected={selectedId === el.id}
                      onApply={handleApply}
                      onSaveToggle={handleSaveToggle}
                      isSaved={isSaved}
                    />
                  );
                })}
              </div>
            )}

            {/* Load More Pagination */}
            {elements.length > 0 && elements.length < totalCount && (
              <button
                type="button"
                disabled={isLoading}
                onClick={handleLoadMore}
                className="w-full py-2 my-2 rounded-xl bg-[#181818] hover:bg-[#202020] border border-[#242424] text-xs text-zinc-300 hover:text-white font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Load More Elements</span>
              </button>
            )}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: STYLE CUSTOMIZER (BADGE CREATOR) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'customizer' && (
        <div className="p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1">
          <div className="bg-[#181818] border border-[#242424] rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Viral Studio Badge Generator</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Generate custom procedural badges with high-contrast gradient backgrounds, tailored for viral short-form retention hooks.
            </p>

            <div className="flex flex-col gap-1.5 mt-1">
              <label className="text-[10px] text-zinc-400 font-medium uppercase">Badge Headline Text</label>
              <input
                type="text"
                value={customBadgeText}
                onChange={(e) => setCustomBadgeText(e.target.value)}
                placeholder="E.g. UNSTOPPABLE, DAY 1, 100K CLUB, RULE #1"
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-lg px-3 py-2 text-xs text-white uppercase focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-zinc-400 font-medium uppercase">Gradient Accent Styling</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: 'Gold & Amber', val: 'from-amber-500 to-orange-600' },
                  { label: 'Electric Blue', val: 'from-blue-600 to-indigo-700' },
                  { label: 'Crimson Flame', val: 'from-red-600 to-rose-700' },
                  { label: 'Emerald Mint', val: 'from-emerald-600 to-teal-700' },
                  { label: 'Cyber Purple', val: 'from-purple-600 to-indigo-800' },
                  { label: 'Stealth Carbon', val: 'from-zinc-700 to-zinc-900' },
                ].map((g) => (
                  <button
                    key={g.label}
                    type="button"
                    onClick={() => setCustomBadgeGradient(g.val)}
                    className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                      customBadgeGradient === g.val
                        ? 'border-white bg-[#222] shadow-sm'
                        : 'border-[#2a2a2a] bg-[#141414] hover:bg-[#1c1c1c]'
                    }`}
                  >
                    <div className={`h-2.5 w-full rounded bg-gradient-to-r ${g.val}`} />
                    <span className="text-[9px] text-zinc-300 font-medium truncate">{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Preview Pill */}
            {customBadgeText.trim() && (
              <div className="p-3 rounded-lg bg-[#121212] border border-[#2a2a2a] flex flex-col items-center gap-1.5 mt-1">
                <span className="text-[9px] text-zinc-500 uppercase font-mono-studio">Canvas Preview</span>
                <div
                  className={`px-3 py-1.5 rounded-full text-xs font-black uppercase text-white bg-gradient-to-r ${customBadgeGradient} shadow-md flex items-center gap-1.5`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{customBadgeText.trim().toUpperCase()}</span>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={isCreatingBadge || !customBadgeText.trim()}
              onClick={handleCreateCustomBadge}
              className="w-full mt-2 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isCreatingBadge ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>Generate &amp; Insert Badge</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: SAVED ELEMENTS */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'saved' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-3">
          {savedElements.length === 0 ? (
            <div className="bg-[#181818] border border-[#242424] rounded-xl p-8 flex flex-col items-center justify-center text-center gap-2.5 my-auto">
              <Bookmark className="w-8 h-8 text-[#52525B]" />
              <p className="text-xs font-bold text-white">No Saved Elements Yet</p>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Click the bookmark icon on any vector, sticker, or badge in the catalog to build your quick-access library.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('elements')}
                className="mt-2 bg-[#3B82F6] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#2563EB] transition-colors"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <div className={`grid ${gridColumns === 4 ? 'grid-cols-4' : 'grid-cols-3'} gap-2`}>
              {savedElements.map((el) => (
                <ElementCard
                  key={el.id}
                  el={el}
                  isSelected={selectedId === el.id}
                  onApply={handleApply}
                  onSaveToggle={handleSaveToggle}
                  isSaved={true}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ElementsPane;
