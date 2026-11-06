import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ScrollableTabs } from '@/src/shared/ui/ScrollableTabs';
import {
  Image as ImageIcon,
  Search,
  Check,
  X,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Sliders,
  RotateCcw,
  ChevronLeft,
  Sun,
  Contrast,
  Droplets,
  History,
  ChevronDown,
} from 'lucide-react';
import { workspaceApi } from '../../api/workspaceApi';
import { CustomSelect } from '@/src/shared/ui/CustomSelect';
import { toast } from 'sonner';

export interface StockImageItem {
  id: string;
  title: string;
  category: 'stoic' | 'gym' | 'cyber' | 'nature' | 'minimal' | 'architecture' | string;
  url: string;
  thumbnail: string;
  author: string;
  authorUrl?: string;
  resolution: string;
  source?: 'pexels' | 'pixabay' | 'unsplash' | 'wikimedia' | 'curated' | string;
  tags?: string[];
  prompt?: string;
  model?: string;
  aspectRatio?: string;
  createdAt?: number;
}

export interface ImagePaneProps {
  onSelectImage: (imageUrl: string) => void;
  activeImageUrl?: string;
}

export const PROVIDER_OPTIONS = [
  { value: 'all', label: 'All (100M+ Stock)' },
  { value: 'flickr', label: 'Flickr HD (Free)' },
  { value: 'wikimedia', label: 'Wikimedia (Free)' },
  { value: 'pixabay', label: 'Pixabay' },
  { value: 'unsplash', label: 'Unsplash' },
  { value: 'pexels', label: 'Pexels' },
] as const;

export type ProviderType = (typeof PROVIDER_OPTIONS)[number]['value'];

export const CURATED_MOOD_PILLS = [
  { id: 'all', query: '', category: 'all', label: '✨ All' },
  { id: 'rain', query: 'rain', category: 'all', label: '🌧️ Rain' },
  { id: 'stoic', query: 'stoic', category: 'stoic', label: '🗿 Stoic' },
  { id: 'gym', query: 'gym', category: 'gym', label: '💪 Gym' },
  { id: 'cyber', query: 'cyberpunk', category: 'cyber', label: '🌃 Cyber' },
  { id: 'nature', query: 'nature', category: 'nature', label: '⛰️ Nature' },
  { id: 'dark', query: 'dark', category: 'minimal', label: '🖤 Dark' },
  { id: 'space', query: 'space', category: 'all', label: '🌌 Space' },
  { id: 'ocean', query: 'ocean', category: 'all', label: '🌊 Ocean' },
  { id: 'fire', query: 'fire', category: 'all', label: '🔥 Fire' },
  { id: 'luxury', query: 'luxury', category: 'architecture', label: '✨ Luxury' },
] as const;

const LOCAL_STORAGE_KEY = 'apexmind_custom_images';
const RECENT_IMAGES_KEY = 'apexmind_recent_images';

interface ImageCardProps {
  img: StockImageItem;
  isSelected: boolean;
  isActive: boolean;
  activeTab: string;
  onApply: (img: StockImageItem) => void;
  onDeleteSaved: (id: string, e: React.MouseEvent) => void;
  renderSourceBadge: (source?: string) => React.ReactNode;
}

const ImageCard = React.memo<ImageCardProps>(({
  img,
  isSelected,
  isActive,
  activeTab,
  onApply,
  onDeleteSaved,
  renderSourceBadge,
}) => {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onApply(img)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onApply(img);
        }
      }}
      style={{ contentVisibility: 'auto', containIntrinsicSize: '240px' }}
      className={`group relative rounded-xl border overflow-hidden aspect-[9/16] bg-[#181818] transition-all cursor-pointer text-left transform-gpu ${
        isSelected
          ? 'border-[#3B82F6] ring-1 ring-[#3B82F6]/50 shadow-lg shadow-blue-500/10'
          : 'border-[#242424] hover:border-[#2E2E2E]'
      }`}
    >
      <img
        src={img.thumbnail}
        alt={img.title}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
        decoding="async"
      />

      {/* Top Provider & Theme Badges */}
      <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
        {renderSourceBadge(img.source)}
      </div>

      {/* Selected Indicator */}
      {isActive && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center z-10 shadow-md">
          <Check className="w-3 h-3 text-white stroke-[3]" />
        </div>
      )}

      {/* Delete button for Saved images */}
      {activeTab === 'saved' && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteSaved(img.id, e);
          }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors z-10 cursor-pointer"
          title="Delete from Saved"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-85 group-hover:opacity-100 transition-opacity" />

      {/* Bottom Info */}
      <div className="absolute inset-x-0 bottom-0 p-2.5 flex flex-col gap-1.5 z-10">
        <div className="flex flex-col min-w-0">
          <p className="text-[11px] font-bold text-white truncate drop-shadow-md leading-tight" title={img.title}>
            {img.title}
          </p>
          <p className="text-[9px] text-zinc-400 truncate">
            {img.authorUrl ? (
              <a
                href={img.authorUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="hover:underline text-zinc-400 hover:text-white"
              >
                {img.author}
              </a>
            ) : (
              `by ${img.author}`
            )}
          </p>
        </div>
      </div>
    </div>
  );
});
ImageCard.displayName = 'ImageCard';

export const ImagePane: React.FC<ImagePaneProps> = ({
  onSelectImage,
  activeImageUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'url' | 'filters' | 'history'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Images state
  const [images, setImages] = useState<StockImageItem[]>([]);
  const [savedImages, setSavedImages] = useState<StockImageItem[]>([]);
  const [recentImages, setRecentImages] = useState<StockImageItem[]>([]);

  // Pagination & Loading
  const [page, setPage] = useState<number>(1);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [totalFound, setTotalFound] = useState<number>(0);

  // Provider Status & Modal
  const [providerStatus, setProviderStatus] = useState<{
    pexels: boolean;
    pixabay: boolean;
    unsplash: boolean;
    jamendo?: boolean;
  }>({ pexels: false, pixabay: false, unsplash: false });

  // Custom URL inputs
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [customTitleInput, setCustomTitleInput] = useState('');
  const [urlPreviewValid, setUrlPreviewValid] = useState<boolean | null>(null);

  // Backdrop Image Filter Settings
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [blur, setBlur] = useState<number>(0);
  const [vignette, setVignette] = useState<boolean>(true);

  // Load saved & recent images from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) setSavedImages(JSON.parse(stored));
      const recent = localStorage.getItem(RECENT_IMAGES_KEY);
      if (recent) setRecentImages(JSON.parse(recent));
    } catch {}
  }, []);

  // Fetch provider active key status
  useEffect(() => {
    workspaceApi.getMediaProvidersStatus().then((status) => {
      if (status) setProviderStatus(status);
    });
  }, []);

  // Live stock photos search runner
  const fetchLiveStockImages = useCallback(
    async (
      query: string,
      provider: ProviderType,
      category: string,
      pageNum: number,
      isAppending: boolean = false
    ) => {
      try {
        if (isAppending) {
          setIsLoadingMore(true);
        } else {
          setIsLoadingLive(true);
        }

        const cleanQuery = query.trim().replace(/^#/, '');
        const res = await workspaceApi.searchOpenImages(
          cleanQuery,
          provider,
          category,
          pageNum,
          36,
          'portrait'
        );

        if (res && res.items) {
          const formatted: StockImageItem[] = res.items.map((it: any) => ({
            id: it.id || `live-${Date.now()}-${Math.random()}`,
            title: it.title || 'Stock Backdrop',
            category: it.category || (category !== 'all' ? category : 'cinematic'),
            url: it.url,
            thumbnail: it.thumbnail || it.url,
            author: it.author || 'Stock Creator',
            authorUrl: it.authorUrl,
            resolution: it.resolution || '1080x1920 HD',
            source: it.source || provider,
            tags: it.tags || [],
          }));

          if (res.providers) {
            setProviderStatus(res.providers);
          }

          setTotalFound(res.total || formatted.length);
          setHasMore(formatted.length >= 12);

          if (isAppending) {
            setImages((prev) => {
              const existingUrls = new Set(prev.map((p) => p.url));
              const newItems = formatted.filter((f) => !existingUrls.has(f.url));
              return [...prev, ...newItems];
            });
          } else {
            setImages(formatted);
          }
        }
      } catch {
        if (!isAppending) {
          setImages([]);
        }
      } finally {
        setIsLoadingLive(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  // Provider Select Options
  const providerSelectOptions = useMemo(
    () => [
      { value: 'all', label: 'All (100M+ Stock)', badge: '100M+' },
      { value: 'flickr', label: 'Flickr HD', badge: 'Free HD' },
      { value: 'wikimedia', label: 'Wikimedia', badge: 'Free CC0' },
      { value: 'pexels', label: 'Pexels' },
      { value: 'pixabay', label: 'Pixabay' },
      { value: 'unsplash', label: 'Unsplash' },
    ],
    []
  );

  // Debounce search when user types in the search input
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Instant provider selection handler
  const handleProviderSelect = (val: string) => {
    const prov = val as ProviderType;
    setSelectedProvider(prov);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setPage(1);
    setIsLoadingLive(true);
    fetchLiveStockImages(searchQuery, prov, selectedCategory, 1, false);
  };

  // Instant mood pill select handler
  const handleMoodPillSelect = (pill: (typeof CURATED_MOOD_PILLS)[number]) => {
    const isActive =
      (pill.query === '' && !searchQuery) ||
      (pill.query !== '' && searchQuery.toLowerCase() === pill.query);
    const newQuery = isActive && pill.query !== '' ? '' : pill.query;
    const newCat = isActive && pill.query !== '' ? 'all' : pill.category;

    setSearchQuery(newQuery);
    setSelectedCategory(newCat);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setPage(1);
    setIsLoadingLive(true);
    fetchLiveStockImages(newQuery, selectedProvider, newCat, 1, false);
  };

  // Debounce keyboard search query changes
  useEffect(() => {
    if (activeTab !== 'catalog') return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setPage(1);

    searchTimeoutRef.current = setTimeout(() => {
      fetchLiveStockImages(searchQuery, selectedProvider, selectedCategory, 1, false);
    }, 350);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, activeTab, fetchLiveStockImages]);

  // Load next page
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLiveStockImages(searchQuery, selectedProvider, selectedCategory, nextPage, true);
  };

  const handleApply = (img: StockImageItem) => {
    setSelectedId(img.id);
    window.dispatchEvent(new CustomEvent('workspace:backdrop-filter', {
      detail: {
        brightness,
        contrast,
        saturate: saturation,
        blur,
        vignette: vignette ? 45 : 0,
      },
    }));
    onSelectImage(img.url);
    window.dispatchEvent(
      new CustomEvent('workspace:add-timeline-clip', {
        detail: {
          type: 'image',
          url: img.url,
          name: img.title || 'Image Graphic',
          duration: 4.0,
        },
      })
    );
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'video' }));
    toast.success(`Applied "${img.title}"`);

    // Add to recent images
    setRecentImages((prev) => {
      const filtered = prev.filter((i) => i.url !== img.url);
      const updated = [img, ...filtered].slice(0, 8);
      try {
        localStorage.setItem(RECENT_IMAGES_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleStageImage = (img: StockImageItem) => setSelectedId(img.id);

  const handleAddCustomUrl = (saveToFavorites = false) => {
    if (!customUrlInput.trim()) return;
    const url = customUrlInput.trim();
    const title = customTitleInput.trim() || 'Custom Web Image';

    const newItem: StockImageItem = {
      id: `custom-${Date.now()}`,
      title,
      category: 'minimal',
      url,
      thumbnail: url,
      author: 'Imported Asset',
      resolution: 'Custom URL',
      source: 'curated',
    };

    handleApply(newItem);

    if (saveToFavorites) {
      const updated = [newItem, ...savedImages];
      setSavedImages(updated);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
    }

    setCustomUrlInput('');
    setCustomTitleInput('');
    setUrlPreviewValid(null);
  };

  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedImages.filter((item) => item.id !== id);
    setSavedImages(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const resetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
    setVignette(true);
    window.dispatchEvent(new CustomEvent('workspace:backdrop-filter', {
      detail: { brightness: 100, contrast: 100, saturate: 100, blur: 0, vignette: 45 },
    }));
  };

  const dispatchGradingChange = (detail: {
    brightness?: number;
    contrast?: number;
    saturate?: number;
    blur?: number;
    vignette?: number;
  }) => {
    window.dispatchEvent(new CustomEvent('workspace:backdrop-filter', { detail }));
  };

  const sourceList = activeTab === 'history' ? recentImages : images;

  // Render provider badge
  const renderSourceBadge = (source?: string) => {
    switch (source) {
      case 'pexels':
        return (
          <span className="media-source-badge">
            Pexels
          </span>
        );
      case 'pixabay':
        return (
          <span className="media-source-badge">
            Pixabay
          </span>
        );
      case 'unsplash':
        return (
          <span className="media-source-badge">
            Unsplash
          </span>
        );
      case 'wikimedia':
      case 'wikimedia_commons':
        return (
          <span className="media-source-badge">
            Wikimedia
          </span>
        );
      case 'flickr':
        return (
          <span className="media-source-badge">
            Flickr HD
          </span>
        );
      case 'open_commons_library':
        return (
          <span className="media-source-badge">
            Open Stock
          </span>
        );
      default:
        return (
          <span className="media-source-badge">
            Studio HD
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#141414] text-white font-sans-studio select-none overflow-hidden rounded-none border-0">
      {/* ── Top Header Bar (Matching Studio Shell) ── */}
      <div className="relative h-11 px-3.5 bg-[#141414] border-b border-[#242424] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <ImageIcon className="w-4 h-4 shrink-0 text-blue-400" />
          <span className="text-xs font-bold text-white truncate">
            Stock Photos (100M+ Library)
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isLoadingLive && (
            <RefreshCw className="w-3.5 h-3.5 text-[#60A5FA] animate-spin" />
          )}

          <span className="text-[10px] font-mono-studio text-slate-400 bg-white/[0.06] px-2 py-0.5 rounded-full border border-[#242424]">
            {totalFound} Photos
          </span>
        </div>
      </div>

      {/* ── Subtabs Segmented Control ── */}
      <div className="p-2.5 bg-[#111111] border-b border-[#242424] shrink-0">
        <ScrollableTabs
          tabs={[
            { id: 'catalog', label: 'Catalog', icon: ImageIcon, color: 'text-blue-400' },
            { id: 'url', label: 'URL', icon: ExternalLink, color: 'text-blue-400' },
            { id: 'history', label: 'History', icon: History, color: 'text-blue-400', badge: recentImages.length > 0 ? recentImages.length : undefined },
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as any)}
        />
      </div>

      {/* ── Search & Filter Bar (When in Catalog) ── */}
      {activeTab === 'catalog' && (
        <div className="flex flex-col gap-2 border-b border-[#242424] bg-[#141416] p-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-[140px]">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedCategory('all');
                }}
                placeholder="Search 100M+ stock photos..."
                className="w-full bg-[#181818] border border-[#242424] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/40 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-zinc-500 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mood / Theme Dropdown */}
            <div className="shrink-0 w-36 sm:w-40">
              <CustomSelect
                options={CURATED_MOOD_PILLS.map((p) => ({
                  value: p.id,
                  label: p.label,
                }))}
                value={
                  CURATED_MOOD_PILLS.find(
                    (p) =>
                      (p.query === '' && !searchQuery && selectedCategory === 'all') ||
                      (p.query !== '' && searchQuery.toLowerCase() === p.query.toLowerCase())
                  )?.id || 'all'
                }
                onChange={(val) => {
                  const pill = CURATED_MOOD_PILLS.find((p) => p.id === val);
                  if (pill) handleMoodPillSelect(pill);
                }}
                variant="compact"
                align="right"
                buttonClassName="!w-full !justify-between !bg-[#181818] !border-[#242424] !text-xs !py-2 !px-3 font-semibold hover:!border-white/10"
              />
            </div>
          </div>

          {/* Provider Quick Pills */}
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={() => setActiveTab('filters')}
              className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg border border-[#2F2F2F] bg-[#181818] px-2 text-[10px] font-semibold text-[#D4D4D8] transition-colors hover:bg-[#26262C] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]/60"
              title="Adjust backdrop image"
            >
              <Sliders className="h-3 w-3" />
              Adjust
            </button>
            <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[
                { id: 'all', label: '✨ All (100M+)' },
                { id: 'unsplash', label: 'Unsplash' },
                { id: 'pexels', label: 'Pexels' },
                { id: 'pixabay', label: 'Pixabay' },
                { id: 'wikimedia', label: 'Wikimedia' },
                { id: 'flickr', label: 'Flickr HD' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleProviderSelect(p.id)}
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-medium transition-colors shrink-0 cursor-pointer ${
                    selectedProvider === p.id
                      ? 'bg-[#2563EB] text-white border-[#60A5FA]/40 shadow-xs font-semibold'
                      : 'bg-[#181818] text-zinc-400 hover:text-white hover:bg-[#26262C] border border-[#242424]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 flex flex-col gap-3">
        {activeTab === 'filters' ? (
          <div className="flex flex-col gap-4">
            <div className="bg-[#181818] border border-[#242424] rounded-xl p-3.5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('catalog')}
                    className="inline-flex h-7 items-center gap-1 rounded-lg border border-[#2F2F2F] bg-[#111111] px-2 text-[10px] font-medium text-[#D4D4D8] hover:bg-[#242424] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]/60"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    Photos
                  </button>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#60A5FA]" />
                    Image Grading
                  </span>
                </div>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>

              {/* Brightness Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-mono-studio">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Sun className="w-3 h-3" /> BRIGHTNESS
                  </span>
                  <span className="text-[#60A5FA] font-bold">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="150"
                  value={brightness}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setBrightness(value);
                    dispatchGradingChange({ brightness: value });
                  }}
                  className="w-full accent-[#3B82F6]"
                />
              </div>

              {/* Contrast Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-mono-studio">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Contrast className="w-3 h-3" /> CONTRAST
                  </span>
                  <span className="text-[#60A5FA] font-bold">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="180"
                  value={contrast}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setContrast(value);
                    dispatchGradingChange({ contrast: value });
                  }}
                  className="w-full accent-[#3B82F6]"
                />
              </div>

              {/* Saturation Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-mono-studio">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Droplets className="w-3 h-3" /> SATURATION
                  </span>
                  <span className="text-[#60A5FA] font-bold">{saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setSaturation(value);
                    dispatchGradingChange({ saturate: value });
                  }}
                  className="w-full accent-[#3B82F6]"
                />
              </div>

              {/* Background Blur Slider (For Caption Legibility) */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-mono-studio">
                  <span className="text-slate-500">BACKGROUND BLUR (TEXT FOCUS)</span>
                  <span className="text-[#60A5FA] font-bold">{blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="16"
                  value={blur}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setBlur(value);
                    dispatchGradingChange({ blur: value });
                  }}
                  className="w-full accent-[#3B82F6]"
                />
              </div>

              {/* Vignette Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-[#242424]">
                <span className="text-xs text-zinc-300">Cinematic Vignette Shadow</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextVignette = !vignette;
                    setVignette(nextVignette);
                    dispatchGradingChange({ vignette: nextVignette ? 45 : 0 });
                  }}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                    vignette ? 'bg-[#3B82F6]' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                      vignette ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Filter Presets */}
            <div className="bg-[#181818] border border-[#242424] rounded-xl p-3.5 flex flex-col gap-2">
              <span className="text-[10px] uppercase font-mono-studio text-slate-500">
                Quick Cinematic Color Presets
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Moody Dark Stoic', b: 70, c: 130, s: 70, bl: 2 },
                  { name: 'Pure B&W Grayscale', b: 90, c: 140, s: 0, bl: 0 },
                  { name: 'Cyber Neon Glow', b: 110, c: 140, s: 150, bl: 1 },
                  { name: 'Muted Film Look', b: 85, c: 90, s: 80, bl: 0 },
                ].map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      setBrightness(p.b);
                      setContrast(p.c);
                      setSaturation(p.s);
                      setBlur(p.bl);
                      dispatchGradingChange({
                        brightness: p.b,
                        contrast: p.c,
                        saturate: p.s,
                        blur: p.bl,
                        vignette: vignette ? 45 : 0,
                      });
                    }}
                    className="p-2 rounded-lg bg-[#111111] hover:bg-[#1E1E1E] border border-[#242424] text-left text-[11px] font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'url' ? (
          /* Custom Image URL Importer */
          <div className="flex flex-col gap-4">
            <div className="bg-[#181818] border border-[#242424] rounded-xl p-3.5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-[#60A5FA]" />
                <span className="text-xs font-bold text-white">Import Custom Image URL</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Paste any high-resolution image URL (Unsplash, Pexels, Imgur, or CDN link) to set as canvas background.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono-studio text-slate-500">Image Title</label>
                <input
                  type="text"
                  value={customTitleInput}
                  onChange={(e) => setCustomTitleInput(e.target.value)}
                  placeholder="e.g. Cinematic Mountain Sunset"
                  className="bg-[#111111] border border-[#242424] rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#52525B] outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono-studio text-slate-500">Direct Image URL (JPG / PNG / WebP)</label>
                <input
                  type="url"
                  value={customUrlInput}
                  onChange={(e) => {
                    setCustomUrlInput(e.target.value);
                    setUrlPreviewValid(null);
                  }}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="bg-[#111111] border border-[#242424] rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#52525B] outline-none focus:border-[#3B82F6]"
                />
              </div>

              {/* Preview Container */}
              {customUrlInput.trim() && (
                <div className="mt-2 rounded-xl overflow-hidden border border-[#242424] bg-[#141414] aspect-[9/12] max-h-56 relative flex items-center justify-center">
                  <img
                    src={customUrlInput.trim()}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onLoad={() => setUrlPreviewValid(true)}
                    onError={() => setUrlPreviewValid(false)}
                  />
                  {urlPreviewValid === false && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-3 text-center">
                      <p className="text-xs text-rose-400 font-semibold">Unable to load image preview</p>
                      <p className="text-[10px] text-slate-400 mt-1">Make sure URL allows direct embedding</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleAddCustomUrl(false)}
                  disabled={!customUrlInput.trim()}
                  className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white rounded-xl py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#3B82F6]/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Apply to Canvas
                </button>
                <button
                  type="button"
                  onClick={() => handleAddCustomUrl(true)}
                  disabled={!customUrlInput.trim()}
                  className="bg-[#1E1E1E] hover:bg-[#34343E] disabled:opacity-50 text-white rounded-xl px-3 py-2 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border border-[#3A3A44]"
                  title="Save to My Library"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === 'catalog' || activeTab === 'history' ? (
          /* Catalog or Saved Images Grid */
          <>
            {/* Dedicated History Tab Header with Clear button */}
            {activeTab === 'history' && (
              <div className="flex items-center justify-between pb-1 border-b border-[#242424]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <History className="w-3.5 h-3.5 text-[#60A5FA]" />
                  <span>Recently Used Images</span>
                  <span className="text-[10px] font-mono font-normal text-zinc-400">({recentImages.length})</span>
                </div>
                {recentImages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setRecentImages([]);
                      try {
                        localStorage.removeItem(RECENT_IMAGES_KEY);
                      } catch {}
                    }}
                    className="text-[10px] text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-1"
                    title="Clear Recently Used History"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            )}

            {/* Empty History State */}
            {activeTab === 'history' && recentImages.length === 0 && (
              <div className="bg-[#181818] border border-[#242424] rounded-xl p-8 flex flex-col items-center justify-center text-center gap-2.5">
                <History className="w-8 h-8 text-[#52525B]" />
                <p className="text-xs font-bold text-white">No Recent Images</p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Images you apply to your canvas will appear here for fast access.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('catalog')}
                  className="mt-2 bg-[#3B82F6] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#2563EB] transition-colors cursor-pointer"
                >
                  Browse Catalog
                </button>
              </div>
            )}

            {activeTab === 'catalog' && savedImages.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Saved Images</span>
                  <span className="text-[10px] font-mono-studio text-slate-400">{savedImages.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {savedImages.map((img) => (
                    <ImageCard
                      key={img.id}
                      img={img}
                      isSelected={selectedId === img.id || (!selectedId && activeImageUrl === img.url)}
                      isActive={activeImageUrl === img.url}
                      activeTab="saved"
                      onApply={handleApply}
                      onDeleteSaved={handleDeleteSaved}
                      renderSourceBadge={renderSourceBadge}
                    />
                  ))}
                </div>
              </div>
            )}

            {sourceList.length === 0 && isLoadingLive ? (
              <div className="grid grid-cols-2 gap-2.5">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={`skel-${idx}`}
                    className="rounded-none border-0 aspect-[9/16] bg-[#181818] animate-pulse flex flex-col justify-end p-2.5"
                  >
                    <div className="h-3 w-3/4 bg-zinc-800 rounded mb-1" />
                    <div className="h-2.5 w-1/2 bg-zinc-800/60 rounded mb-2" />
                    <div className="h-6 w-full bg-zinc-800/80 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : sourceList.length === 0 && !isLoadingLive ? (
              <div className="bg-[#181818] border border-[#242424] rounded-xl p-6 text-center text-xs text-slate-400 flex flex-col items-center gap-2.5">
                <Search className="w-6 h-6 text-zinc-600" />
                <p>No photos found{searchQuery ? ` matching "${searchQuery}"` : ''} on {selectedProvider.toUpperCase()}</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    handleProviderSelect('all');
                  }}
                  className="mt-1 text-[11px] text-blue-400 hover:underline cursor-pointer"
                >
                  Reset filters to browse all photos
                </button>
              </div>
            ) : (
              /* Image Grid */
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2.5">
                  {sourceList.map((img) => (
                    <ImageCard
                      key={img.id}
                      img={img}
                      isSelected={selectedId === img.id || (!selectedId && activeImageUrl === img.url)}
                      isActive={activeImageUrl === img.url}
                      activeTab={activeTab}
                      onApply={handleApply}
                      onDeleteSaved={handleDeleteSaved}
                      renderSourceBadge={renderSourceBadge}
                    />
                  ))}
                </div>

                {/* Load More Pagination (Infinite browsing over 100M+ assets) */}
                {activeTab === 'catalog' && (
                  <div className="pt-2 pb-1 flex flex-col items-center gap-1.5">
                    {hasMore && (
                      <button
                        type="button"
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="w-full py-2 rounded-xl bg-[#1C1C22] hover:bg-[#25252E] border border-[#2D2D35] hover:border-blue-500/40 text-xs font-semibold text-zinc-300 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                      >
                        {isLoadingMore ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                            <span>Loading Next 36 Photos...</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
                            <span>Load More Photos (Page {page + 1})</span>
                          </>
                        )}
                      </button>
                    )}
                    <span className="text-[10px] font-mono text-zinc-500">
                      Showing {sourceList.length} photos • {totalFound} total indexed
                    </span>
                    {(selectedProvider === 'pexels' || selectedProvider === 'all') && (
                      <div className="flex items-center justify-center gap-1 text-[9px] text-zinc-500">
                        <span>Photos provided by</span>
                        <a
                          href="https://www.pexels.com"
                          target="_blank"
                          rel="noreferrer"
                          className="text-zinc-400 hover:text-white underline font-semibold flex items-center gap-0.5"
                        >
                          Pexels
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ImagePane;
