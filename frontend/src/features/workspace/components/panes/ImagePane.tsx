import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Image as ImageIcon,
  Search,
  Check,
  X,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  Wand2,
  Layers,
  Download,
  Bookmark,
  RefreshCw,
  Sliders,
  RotateCcw,
  Sun,
  Contrast,
  Droplets,
  History,
  Key,
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
  { id: 'stoic', query: 'stoic', category: 'stoic', label: '🏛️ Stoic' },
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

export const ImagePane: React.FC<ImagePaneProps> = ({
  onSelectImage,
  activeImageUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'ai-generator' | 'url' | 'filters' | 'saved'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // ── AI Visual Generator (Gemini Multimodal Scene Generation) ──
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiStyle, setAiStyle] = useState<'cinematic' | 'stoic' | 'cyberpunk' | 'anime' | '3d' | 'vintage' | 'minimal'>('cinematic');
  const [aiAspectRatio, setAiAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiGeneratedList, setAiGeneratedList] = useState<StockImageItem[]>([]);
  const AI_IMAGES_STORAGE_KEY = 'apexmind_ai_generated_images';


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
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);

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

  // Provider Select Options with real-time status badges
  const providerSelectOptions = useMemo(
    () => [
      { value: 'all', label: 'All (100M+ Stock)', badge: '100M+' },
      { value: 'flickr', label: 'Flickr HD (Free)', badge: 'Free HD' },
      { value: 'wikimedia', label: 'Wikimedia (Free)', badge: 'Free CC0' },
      {
        value: 'pexels',
        label: 'Pexels',
        badge: providerStatus.pexels ? 'Connected' : 'Key Req',
      },
      {
        value: 'pixabay',
        label: 'Pixabay',
        badge: providerStatus.pixabay ? 'Connected' : 'Key Req',
      },
      {
        value: 'unsplash',
        label: 'Unsplash',
        badge: providerStatus.unsplash ? 'Connected' : 'Key Req',
      },
    ],
    [providerStatus]
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


  const AI_INSPIRATIONS = [
    { label: '🏛️ Stoic Marble Statue', prompt: 'Classical Greek marble statue head in pouring rain, dramatic golden hour lightning, moody dark atmosphere, 8k cinematic' },
    { label: '🧪 Neon Cyberpunk Lab', prompt: 'Futuristic cyberpunk scientist in a dark neon laboratory mixing glowing green potions with rising volumetric smoke, 8k' },
    { label: '🌧️ Rainy Tokyo Streets', prompt: 'Melancholic rainy crosswalk in Tokyo at midnight, neon reflections on wet asphalt, cinematic bokeh 35mm' },
    { label: '⛰️ Himalayan Summit', prompt: 'Lone adventurer standing on a razor-sharp snow mountain peak at sunrise, majestic orange sunlight, IMAX composition' },
    { label: '🌌 Deep Space Nebula', prompt: 'Celestial stellar portal inside deep cosmic nebula, glowing turquoise and violet dust clouds, photorealistic NASA style' },
    { label: '🔥 Molten Steel Forge', prompt: 'Blacksmith forging legendary blade with flying molten golden sparks, dark foundry, extreme high contrast lighting' },
  ];

  const AI_STYLE_PRESETS = [
    { id: 'cinematic', label: '🎬 Cinematic', desc: '35mm anamorphic, volumetric lighting & 8k realism' },
    { id: 'stoic', label: '🏛️ Dark Stoic', desc: 'Chiaroscuro, marble statues, moody gold & charcoal' },
    { id: 'cyberpunk', label: '🏙️ Cyberpunk', desc: 'Neon cyan/magenta rim lighting, reflective wet asphalt' },
    { id: 'anime', label: '🎨 Anime Art', desc: 'Makoto Shinkai style, vibrant sky & atmospheric light' },
    { id: '3d', label: '🔮 3D Render', desc: 'Unreal Engine 5, raytraced subsurface scattering' },
    { id: 'vintage', label: '📷 Vintage Film', desc: '1970s Kodachrome analog film grain & nostalgic hues' },
  ] as const;

  const handleGenerateAiVisual = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a scene prompt to generate a visual');
      return;
    }
    setIsGeneratingAi(true);
    try {
      const res = await workspaceApi.generateAiImage({
        prompt: aiPrompt.trim(),
        aspectRatio: aiAspectRatio,
        style: aiStyle,
      });

      if (res?.data) {
        const newItem: StockImageItem = {
          id: res.data.id || `ai-${Date.now()}`,
          title: res.data.title || `AI: ${aiPrompt.slice(0, 32)}`,
          category: aiStyle,
          url: res.data.url,
          thumbnail: res.data.thumbnail || res.data.url,
          author: 'Gemini Multimodal AI',
          resolution: `${res.data.width || 1080}×${res.data.height || 1920}`,
          source: 'gemini_ai',
          tags: res.data.tags || ['ai_generated', aiStyle],
        };

        const updated = [newItem, ...aiGeneratedList.filter((i) => i.id !== newItem.id)].slice(0, 30);
        setAiGeneratedList(updated);
        try {
          localStorage.setItem(AI_IMAGES_STORAGE_KEY, JSON.stringify(updated));
        } catch {}

        handleApply(newItem);
        toast.success('✨ AI Visual Generated & Placed on Timeline', {
          description: `Rendered in ${aiStyle} style for ${aiAspectRatio} vertical short.`,
        });
      }
    } catch (err: any) {
      toast.error('AI Visual Generation Failed', {
        description: err.message || 'Please check your GEMINI_API_KEY.',
      });
    } finally {
      setIsGeneratingAi(false);
    }
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
  };

  const sourceList = activeTab === 'saved' ? savedImages : images;

  // Render provider badge
  const renderSourceBadge = (source?: string) => {
    switch (source) {
      case 'pexels':
        return (
          <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-[8px] font-mono font-bold text-emerald-400">
            Pexels
          </span>
        );
      case 'pixabay':
        return (
          <span className="px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-500/40 text-[8px] font-mono font-bold text-sky-400">
            Pixabay
          </span>
        );
      case 'unsplash':
        return (
          <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-[8px] font-mono font-bold text-amber-400">
            Unsplash
          </span>
        );
      case 'wikimedia':
      case 'wikimedia_commons':
        return (
          <span className="px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/40 text-[8px] font-mono font-bold text-indigo-400">
            Wikimedia
          </span>
        );
      case 'flickr':
        return (
          <span className="px-1.5 py-0.5 rounded bg-pink-950/80 border border-pink-500/40 text-[8px] font-mono font-bold text-pink-400">
            Flickr HD
          </span>
        );
      case 'open_commons_library':
        return (
          <span className="px-1.5 py-0.5 rounded bg-teal-950/80 border border-teal-500/40 text-[8px] font-mono font-bold text-teal-400">
            Open Stock
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded bg-zinc-900/80 border border-zinc-700/60 text-[8px] font-mono font-bold text-zinc-300">
            Studio HD
          </span>
        );
    }
  };

  const activeKeyCount = [providerStatus.pexels, providerStatus.pixabay, providerStatus.unsplash].filter(Boolean).length;

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none overflow-hidden rounded-2xl border border-[#26262B]">
      {/* ── Top Header Bar (Matching Studio Shell) ── */}
      <div className="relative h-11 px-3.5 bg-[#17171A] border-b border-[#26262B] flex items-center justify-between z-20 shrink-0">
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

          {/* Provider API Key Status Pill */}
          <button
            type="button"
            onClick={() => setShowKeyModal(true)}
            className={`text-[9px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 cursor-pointer transition-colors ${
              activeKeyCount > 0
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40 hover:bg-emerald-900/50'
                : 'bg-[#222226] text-zinc-400 border-[#2F2F36] hover:text-white hover:border-zinc-500'
            }`}
            title="Configure Pexels, Pixabay, & Unsplash API keys"
          >
            <Key className="w-2.5 h-2.5" />
            <span>{activeKeyCount > 0 ? `${activeKeyCount} APIs Active` : 'API Keys'}</span>
          </button>

          <span className="text-[10px] font-mono-studio text-[#A1A1AA] bg-[#222226] px-2 py-0.5 rounded-full border border-[#2F2F36]">
            {totalFound} Photos
          </span>
        </div>
      </div>

      {/* ── Subtabs Header Bar ── */}
      <div className="flex items-center gap-4 sm:gap-5 px-3.5 pt-2 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar shrink-0 bg-[#141417]">
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'catalog'
              ? 'text-white border-blue-500'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Photo Catalog
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ai-generator')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 flex items-center gap-1.5 ${
            activeTab === 'ai-generator'
              ? 'text-white border-blue-500'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold text-white">
            AI Visual Gen
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('filters')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 flex items-center gap-1.5 ${
            activeTab === 'filters'
              ? 'text-white border-blue-500'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-[#60A5FA]" />
          <span>Color Filters</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'url'
              ? 'text-white border-blue-500'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Direct URL
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('saved')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 flex items-center gap-1.5 ${
            activeTab === 'saved'
              ? 'text-white border-blue-500'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5 text-amber-400" />
          <span>Saved ({savedImages.length})</span>
        </button>
      </div>

      {/* ── Search & Provider Bar (When in Catalog) ── */}
      {activeTab === 'catalog' && (
        <div className="flex flex-col gap-2 border-b border-[#26262B] bg-[#141416] p-3 shrink-0">
          {/* Unified Search Input + Provider Select */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedCategory('all');
                }}
                placeholder="Search 100M+ stock photos (e.g. rain, gym, stoic, neon)..."
                className="w-full bg-[#1C1C20] border border-[#2A2A30] focus:border-blue-500/70 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-zinc-500 outline-none transition-colors"
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

            {/* Provider Dropdown */}
            <div className="shrink-0 w-44 sm:w-48">
              <CustomSelect
                options={providerSelectOptions}
                value={selectedProvider}
                onChange={handleProviderSelect}
                variant="compact"
                buttonClassName="!w-full !justify-between !bg-[#1A1A1E] !border-[#2E2E36] !text-[11px] !py-2 !px-3 font-semibold hover:!border-blue-500/60"
                menuClassName="!w-64 !bg-[#16161A] !border-[#2E2E38] shadow-2xl"
              />
            </div>
          </div>

          {/* Curated Mood / Theme Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pt-0.5 pb-0.5">
            {CURATED_MOOD_PILLS.map((pill) => {
              const isActive =
                (pill.query === '' && !searchQuery) ||
                (pill.query !== '' && searchQuery.toLowerCase() === pill.query);
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
                {/* ── Tab: AI Visual Generator (Gemini Multimodal Scene Generation) ── */}
        {activeTab === 'ai-generator' ? (
          <div className="flex flex-col gap-4">
            {/* AI Generator Hero Card */}
            <div className="relative overflow-hidden rounded-2xl bg-[#141416] border border-[#26262B] p-4 shadow-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      Gemini Multimodal Scene Generator
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-500/30">
                        Nano Banana 2.1
                      </span>
                    </h3>
                    <p className="text-[10px] text-zinc-400">
                      Generate bespoke vertical 9:16 cinematic visuals with high-detail lighting & style coherence.
                    </p>
                  </div>
                </div>
              </div>

              {/* Prompt Input Box */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-400">
                  <span>SCENE PROMPT</span>
                  <span className="text-[9px] font-mono text-zinc-500">{aiPrompt.length}/300 chars</span>
                </div>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={aiPrompt}
                    maxLength={300}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe your scene in rich detail (e.g. Ancient Greek warrior standing on rainy summit under dramatic thunder, golden light, 8k cinematic)..."
                    className="w-full bg-[#18181B] border border-[#27272A] focus:border-blue-500/70 rounded-xl p-3 text-xs text-white placeholder:text-zinc-500 outline-none resize-none transition-colors"
                  />
                  {aiPrompt && (
                    <button
                      type="button"
                      onClick={() => setAiPrompt('')}
                      className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Inspiration Chips */}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                  <Wand2 className="w-2.5 h-2.5 text-blue-400" /> Quick Inspiration Scenes
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                  {AI_INSPIRATIONS.map((chip, idx) => (
                    <button
                      key={`chip-${idx}`}
                      type="button"
                      onClick={() => setAiPrompt(chip.prompt)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] hover:border-blue-500/40 text-zinc-300 hover:text-white transition-colors shrink-0 cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual Style Selector */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Visual Aesthetic
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AI_STYLE_PRESETS.map((st) => {
                    const isSelected = aiStyle === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setAiStyle(st.id as any)}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col gap-0.5 ${
                          isSelected
                            ? 'bg-blue-600/10 border-blue-500 text-white shadow-xs'
                            : 'bg-[#18181B] border-[#27272A] text-zinc-400 hover:bg-[#202024] hover:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{st.label}</span>
                          {isSelected && <Check className="w-3 h-3 text-blue-400 shrink-0" />}
                        </div>
                        <span className="text-[9px] text-zinc-500 line-clamp-1 leading-snug">{st.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Aspect Ratio Selector & Action Button */}
              <div className="flex items-center justify-between gap-3 pt-1 border-t border-[#26262B]">
                <div className="flex items-center gap-1 bg-[#18181B] p-0.5 rounded-lg border border-[#27272A]">
                  {(['9:16', '16:9', '1:1'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setAiAspectRatio(r)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono transition-all cursor-pointer ${
                        aiAspectRatio === r
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {r} {r === '9:16' ? '(Shorts)' : ''}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAiVisual}
                  disabled={isGeneratingAi || !aiPrompt.trim()}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingAi ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing Scene Visual...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white" />
                      <span>Generate AI Visual</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Generated History Gallery */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  Generated Scene Assets ({aiGeneratedList.length})
                </span>
                {aiGeneratedList.length > 0 && (
                  <span className="text-[10px] text-zinc-500">1-click apply to active timeline</span>
                )}
              </div>

              {aiGeneratedList.length === 0 ? (
                <div className="p-8 rounded-xl bg-[#141416] border border-[#26262B] text-center text-xs text-zinc-500 flex flex-col items-center gap-2">
                  <Sparkles className="w-8 h-8 text-blue-500/30" />
                  <p className="font-semibold text-zinc-400">No AI visuals generated yet</p>
                  <p className="text-[11px] max-w-xs text-zinc-600">
                    Type a scene prompt above or pick a quick inspiration scene to create high-definition 9:16 visuals.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {aiGeneratedList.map((item) => (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleApply(item)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleApply(item);
                      }}
                      className="group relative rounded-xl overflow-hidden border border-[#26262B] hover:border-blue-500/80 bg-[#141416] aspect-[9/16] cursor-pointer shadow-md transition-all flex flex-col justify-end p-2.5"
                    >
                      <img
                        src={item.url}
                        alt={item.title}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

                      <div className="relative z-10 flex flex-col gap-1 text-left">
                        <div className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-500/40 text-[8px] font-mono font-bold text-blue-300">
                            {item.category?.toUpperCase() || 'AI GEN'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-white line-clamp-2 leading-tight">
                          {item.title}
                        </p>
                        <span className="text-[9px] text-zinc-400 flex items-center gap-1">
                          Click to Add to Timeline
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* ── Tab 2: Color Filters & Backdrop Tuning ── */}
        {activeTab === 'filters' ? (
          <div className="flex flex-col gap-4">
            <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-3.5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#60A5FA]" />
                  Backdrop Image Grading
                </span>
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
                  <span className="text-[#71717A] flex items-center gap-1">
                    <Sun className="w-3 h-3" /> BRIGHTNESS
                  </span>
                  <span className="text-[#60A5FA] font-bold">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="150"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-[#3B82F6]"
                />
              </div>

              {/* Contrast Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-mono-studio">
                  <span className="text-[#71717A] flex items-center gap-1">
                    <Contrast className="w-3 h-3" /> CONTRAST
                  </span>
                  <span className="text-[#60A5FA] font-bold">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="180"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full accent-[#3B82F6]"
                />
              </div>

              {/* Saturation Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-mono-studio">
                  <span className="text-[#71717A] flex items-center gap-1">
                    <Droplets className="w-3 h-3" /> SATURATION
                  </span>
                  <span className="text-[#60A5FA] font-bold">{saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  className="w-full accent-[#3B82F6]"
                />
              </div>

              {/* Background Blur Slider (For Caption Legibility) */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-mono-studio">
                  <span className="text-[#71717A]">BACKGROUND BLUR (TEXT FOCUS)</span>
                  <span className="text-[#60A5FA] font-bold">{blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="16"
                  value={blur}
                  onChange={(e) => setBlur(Number(e.target.value))}
                  className="w-full accent-[#3B82F6]"
                />
              </div>

              {/* Vignette Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-[#26262B]">
                <span className="text-xs text-zinc-300">Cinematic Vignette Shadow</span>
                <button
                  type="button"
                  onClick={() => setVignette((v) => !v)}
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
            <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-3.5 flex flex-col gap-2">
              <span className="text-[10px] uppercase font-mono-studio text-[#71717A]">
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
                    }}
                    className="p-2 rounded-lg bg-[#141417] hover:bg-[#222228] border border-[#2A2A30] text-left text-[11px] font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
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
            <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-3.5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-[#60A5FA]" />
                <span className="text-xs font-bold text-white">Import Custom Image URL</span>
              </div>
              <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                Paste any high-resolution image URL (Unsplash, Pexels, Imgur, or CDN link) to set as canvas background.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono-studio text-[#71717A]">Image Title</label>
                <input
                  type="text"
                  value={customTitleInput}
                  onChange={(e) => setCustomTitleInput(e.target.value)}
                  placeholder="e.g. Cinematic Mountain Sunset"
                  className="bg-[#141417] border border-[#2A2A30] rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#52525B] outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono-studio text-[#71717A]">Direct Image URL (JPG / PNG / WebP)</label>
                <input
                  type="url"
                  value={customUrlInput}
                  onChange={(e) => {
                    setCustomUrlInput(e.target.value);
                    setUrlPreviewValid(null);
                  }}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="bg-[#141417] border border-[#2A2A30] rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#52525B] outline-none focus:border-[#3B82F6]"
                />
              </div>

              {/* Preview Container */}
              {customUrlInput.trim() && (
                <div className="mt-2 rounded-xl overflow-hidden border border-[#2A2A30] bg-[#121214] aspect-[9/12] max-h-56 relative flex items-center justify-center">
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
                      <p className="text-[10px] text-[#A1A1AA] mt-1">Make sure URL allows direct embedding</p>
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
                  className="bg-[#2A2A32] hover:bg-[#34343E] disabled:opacity-50 text-white rounded-xl px-3 py-2 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border border-[#3A3A44]"
                  title="Save to My Library"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Catalog or Saved Images Grid */
          <>
            {/* Recently Used Carousel */}
            {activeTab === 'catalog' && recentImages.length > 0 && !searchQuery && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-mono-studio text-[#71717A] uppercase flex items-center gap-1">
                  <History className="w-3 h-3" /> Recently Used
                </span>
                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                  {recentImages.map((rec) => (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => handleApply(rec)}
                      className="w-16 h-20 rounded-lg overflow-hidden border border-[#2A2A30] hover:border-[#3B82F6] shrink-0 relative group cursor-pointer"
                    >
                      <img src={rec.thumbnail} alt={rec.title} className="w-full h-full object-cover" />
                      {activeImageUrl === rec.url && (
                        <div className="absolute inset-0 bg-[#3B82F6]/40 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty Saved State */}
            {activeTab === 'saved' && savedImages.length === 0 ? (
              <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-8 flex flex-col items-center justify-center text-center gap-2.5">
                <Bookmark className="w-8 h-8 text-[#52525B]" />
                <p className="text-xs font-bold text-white">No Saved Images Yet</p>
                <p className="text-[11px] text-[#A1A1AA] max-w-xs">
                  Import images using the &ldquo;Direct URL&rdquo; tab to build your custom studio backdrops library.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('url')}
                  className="mt-2 bg-[#3B82F6] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#2563EB] transition-colors cursor-pointer"
                >
                  Import an Image
                </button>
              </div>
            ) : sourceList.length === 0 && isLoadingLive ? (
              <div className="grid grid-cols-2 gap-2.5">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={`skel-${idx}`}
                    className="rounded-xl border border-[#2A2A30] aspect-[9/16] bg-[#1A1A1E] animate-pulse flex flex-col justify-end p-2.5"
                  >
                    <div className="h-3 w-3/4 bg-zinc-800 rounded mb-1" />
                    <div className="h-2.5 w-1/2 bg-zinc-800/60 rounded mb-2" />
                    <div className="h-6 w-full bg-zinc-800/80 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : sourceList.length === 0 && !isLoadingLive ? (
              <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-6 text-center text-xs text-[#A1A1AA] flex flex-col items-center gap-2.5">
                {selectedProvider !== 'all' &&
                selectedProvider !== 'flickr' &&
                selectedProvider !== 'wikimedia' &&
                !providerStatus[selectedProvider as keyof typeof providerStatus] ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Key className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-white text-xs capitalize">
                      {selectedProvider} API Key Not Connected
                    </p>
                    <p className="text-[11px] text-[#A1A1AA] max-w-xs leading-relaxed">
                      {selectedProvider} requires an API key in <code className="text-zinc-300">.env</code>. You can switch to our free high-resolution libraries with zero setup:
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => handleProviderSelect('flickr')}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] cursor-pointer transition-colors shadow-xs"
                      >
                        Browse Flickr HD (Free)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProviderSelect('wikimedia')}
                        className="px-3 py-1.5 rounded-lg bg-[#27272E] hover:bg-[#34343E] text-zinc-200 border border-[#3A3A46] font-semibold text-[11px] cursor-pointer transition-colors"
                      >
                        Browse Wikimedia (Free)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProviderSelect('all')}
                        className="px-3 py-1.5 rounded-lg bg-[#1E1E24] hover:bg-[#282830] text-zinc-400 hover:text-white text-[11px] cursor-pointer transition-colors"
                      >
                        Back to All
                      </button>
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            ) : (
              /* Image Grid */
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2.5">
                  {sourceList.map((img) => {
                    const isSelected = selectedId === img.id || (!selectedId && activeImageUrl === img.url);
                    return (
                      <div
                        key={img.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleApply(img)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleApply(img);
                          }
                        }}
                        className={`group relative rounded-xl border overflow-hidden aspect-[9/16] bg-[#1C1C20] transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'border-[#3B82F6] ring-1 ring-[#3B82F6]/50 shadow-lg shadow-blue-500/10'
                            : 'border-[#2A2A30] hover:border-[#3A3A42]'
                        }`}
                      >
                        <img
                          src={img.thumbnail}
                          alt={img.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />

                        {/* Top Provider & Theme Badges */}
                        <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
                          {renderSourceBadge(img.source)}
                        </div>

                        {/* Selected Indicator */}
                        {activeImageUrl === img.url && (
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
                              handleDeleteSaved(img.id, e);
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors z-10 cursor-pointer"
                            title="Delete from Saved"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-85 group-hover:opacity-100 transition-opacity" />

                        {/* Bottom Info & Full-Width Apply Button */}
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
                  })}
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
        )}
      </div>

      {/* ── API Keys Configuration Modal ── */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181C] border border-[#2D2D35] rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4 text-left">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Stock Media API Configuration</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              ApexMind searches <strong>100,000,000+ photos</strong> across Pexels, Pixabay, Unsplash, and Wikimedia Commons.
              Adding free developer keys unlocks unlimited high-resolution commercial photography:
            </p>

            <div className="flex flex-col gap-2.5">
              {/* Pixabay (Recommended: 100% Instant, Never Paused) */}
              <div className="p-2.5 rounded-xl bg-[#121214] border border-blue-500/30 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Pixabay API</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/40">Instant &bull; 10 Seconds</span>
                    {providerStatus.pixabay ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-600/40">Active</span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">Keyless</span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5">4.5M+ high-resolution photos &bull; 5,000 req/hr free</p>
                </div>
                <a
                  href="https://pixabay.com/api/docs/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] font-semibold text-blue-400 hover:underline flex items-center gap-1 shrink-0"
                >
                  Get Key <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>

              {/* Unsplash */}
              <div className="p-2.5 rounded-xl bg-[#121214] border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Unsplash API</span>
                    {providerStatus.unsplash ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-600/40">Active</span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">Keyless</span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5">5M+ studio-grade vertical photography</p>
                </div>
                <a
                  href="https://unsplash.com/developers"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] font-semibold text-blue-400 hover:underline flex items-center gap-1 shrink-0"
                >
                  Get Key <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>

              {/* Pexels (Registration currently paused by Pexels) */}
              <div className="p-2.5 rounded-xl bg-[#121214] border border-zinc-800 flex items-center justify-between opacity-80">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Pexels API</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-600/30">Signups Paused by Pexels</span>
                    {providerStatus.pexels && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-600/40">Active</span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5">If you already have an existing Pexels key, it will still work</p>
                </div>
                <a
                  href="https://www.pexels.com/api/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] font-semibold text-zinc-400 hover:text-white flex items-center gap-1 shrink-0"
                >
                  Status <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300">
              Paste keys directly in your <span className="text-blue-400 font-bold">.env</span> file:
              <pre className="mt-1 text-zinc-400">
{`PEXELS_API_KEY="your_key"
PIXABAY_API_KEY="your_key"
UNSPLASH_ACCESS_KEY="your_key"`}
              </pre>
            </div>

            <button
              type="button"
              onClick={() => setShowKeyModal(false)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImagePane;
