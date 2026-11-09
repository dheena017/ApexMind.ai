import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScrollableTabs } from '@/src/shared/ui/ScrollableTabs';
import {
  Box,
  Search,
  X,
  Check,
  ExternalLink,
  Plus,
  RefreshCw,
  Sparkles,
  Sliders,
  Eye,
  History,
  Trash2,
  Copy,
} from 'lucide-react';
import { CustomSelect } from '@/src/shared/ui/CustomSelect';
import { toast } from 'sonner';
import { Visual3DItem, Visuals3DPaneProps } from '../../types';
import { visuals3dApi } from '../../api/visuals3dApi';

const CATEGORY_OPTIONS = [
  { value: 'all', label: '✨ All Categories' },
  { value: 'space', label: '🪐 Space & Celestial' },
  { value: 'portal', label: '🌀 Portals & Voids' },
  { value: 'cyberpunk', label: '🌆 Cyberpunk & Neon' },
  { value: 'stoic', label: '🏛️ Stoic & Classical' },
  { value: 'environments', label: '🏔️ Environments & HDRIs' },
  { value: 'props', label: '📦 Props & Objects' },
  { value: 'characters', label: '👤 Characters & Avatars' },
  { value: 'loops', label: '🔁 3D Motion Loops' },
];

const PROVIDER_PILLS = [
  { id: 'all', label: '✨ All Providers' },
  { id: 'roblox_creator_store', label: '🧱 Roblox Creator Store' },
  { id: 'sketchfab', label: '🎨 Sketchfab (Free CC)' },
  { id: 'sloyd_ai', label: '⚡ Sloyd AI (Roblox Low-Poly)' },
  { id: 'meshy_ai', label: '🤖 Meshy AI (Blocky & Stylized)' },
  { id: 'poly_haven', label: '🌐 Poly Haven (CC0)' },
  { id: 'pixabay_3d', label: '🔥 Pixabay 3D Loops' },
  { id: 'wikimedia_3d', label: '🏛️ Wikimedia 3D' },
  { id: 'poly_pizza', label: '🎮 Poly Pizza' },
];

const formatProviderLabel = (prov: string) => {
  switch (prov) {
    case 'roblox_creator_store':
      return 'ROBLOX STORE';
    case 'sketchfab':
      return 'SKETCHFAB';
    case 'sloyd_ai':
      return 'SLOYD AI';
    case 'meshy_ai':
      return 'MESHY AI';
    case 'poly_haven':
      return 'POLY HAVEN';
    case 'pixabay_3d':
      return 'PIXABAY 3D';
    case 'wikimedia_3d':
      return 'WIKIMEDIA 3D';
    case 'poly_pizza':
      return 'POLY PIZZA';
    default:
      return (prov || '3D').replace(/_/g, ' ').toUpperCase();
  }
};

export const Visuals3DPane: React.FC<Visuals3DPaneProps> = ({
  onSelect3DVisual,
  onApplyToTimeline,
  activeVisualUrl,
  onSwitchToVideos,
  onSwitchToCanvas,
  initialQuery = '',
  initialProvider,
}) => {
  // Navigation tabs (Catalog, URL, History)
  const [activeTab, setActiveTab] = useState<'catalog' | 'url' | 'history'>('catalog');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'models' | 'loops'>('all');
  const [selectedOrientation, setSelectedOrientation] = useState<'portrait' | 'landscape' | 'squarish'>('portrait');

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>(initialProvider || 'all');

  useEffect(() => {
    if (initialQuery !== undefined && initialQuery !== '') {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    if (initialProvider) {
      setSelectedProvider(initialProvider);
    }
  }, [initialProvider]);

  // Live 3D Assets State
  const [items, setItems] = useState<Visual3DItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [previewingItem, setPreviewingItem] = useState<Visual3DItem | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  // Custom 3D URL Input State
  const [customUrl, setCustomUrl] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');

  // History State
  const [recentItems, setRecentItems] = useState<Visual3DItem[]>(() => {
    try {
      const stored = localStorage.getItem('apexmind_recent_3d');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Infinite Scroll Refs
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadingMoreRef = useRef(loadingMore);
  loadingMoreRef.current = loadingMore;
  const loadingRef = useRef(loading);
  loadingRef.current = loading;
  const hasMoreRef = useRef(hasMore);
  hasMoreRef.current = hasMore;
  const pageRef = useRef(page);
  pageRef.current = page;

  // Query live assets from real external providers
  const fetchLive3DAssets = useCallback(
    async (
      q: string,
      cat: string,
      prov: string,
      mediaType: 'all' | 'models' | 'loops' = 'all',
      pageNum: number = 1,
      isAppending: boolean = false
    ) => {
      if (isAppending) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const queryTerm = q.trim();
        const effectiveCategory = cat === 'all' ? '' : cat;

        const res = await visuals3dApi.searchAssets({
          query: queryTerm,
          category: effectiveCategory,
          provider: prov,
          page: pageNum,
          pageSize: 24,
        });

        if (res && res.items) {
          let filtered = res.items;
          if (mediaType === 'models') {
            filtered = filtered.filter((it) => !it.isVideo && (it.format === 'glb' || it.format === 'gltf' || it.format === 'stl'));
          } else if (mediaType === 'loops') {
            filtered = filtered.filter((it) => it.isVideo || it.format === 'mp4' || it.category === 'loops');
          }

          setHasMore(res.hasMore ?? filtered.length > 0);

          if (isAppending) {
            setItems((prev) => {
              const existingIds = new Set(prev.map((i) => i.id));
              const newItems = filtered.filter((f) => !existingIds.has(f.id));
              return [...prev, ...newItems];
            });
          } else {
            setItems(filtered);
          }
        }
      } catch (e: any) {
        toast.error(`3D catalog notice: ${e.message || 'Connecting to live 3D sources...'}`);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  const triggerLoadMore = useCallback(() => {
    if (loadingRef.current || loadingMoreRef.current || !hasMoreRef.current) return;
    const nextPage = pageRef.current + 1;
    setPage(nextPage);
    fetchLive3DAssets(searchQuery, selectedCategory, selectedProvider, mediaTypeFilter, nextPage, true);
  }, [fetchLive3DAssets, searchQuery, selectedCategory, selectedProvider, mediaTypeFilter]);

  // Infinite Scroll via IntersectionObserver
  useEffect(() => {
    if (activeTab !== 'catalog') return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          triggerLoadMore();
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '350px',
        threshold: 0.05,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTab, triggerLoadMore]);

  // Fallback Scroll Event Listener for fast wheel/trackpad scrolling
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (activeTab !== 'catalog') return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 350) {
      triggerLoadMore();
    }
  };

  useEffect(() => {
    setPage(1);
    fetchLive3DAssets(searchQuery, selectedCategory, selectedProvider, mediaTypeFilter, 1, false);
  }, [selectedCategory, selectedProvider, mediaTypeFilter, fetchLive3DAssets]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLive3DAssets(searchQuery, selectedCategory, selectedProvider, mediaTypeFilter, 1, false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setPage(1);
    fetchLive3DAssets('', 'all', selectedProvider, mediaTypeFilter, 1, false);
  };


  const saveRecent = (item: Visual3DItem) => {
    const updated = [item, ...recentItems.filter((i) => i.id !== item.id)].slice(0, 30);
    setRecentItems(updated);
    try {
      localStorage.setItem('apexmind_recent_3d', JSON.stringify(updated));
    } catch {}
  };

  const handleSelectAsset = (item: Visual3DItem) => {
    saveRecent(item);
    onSelect3DVisual(item.assetUrl, item.title, item.isVideo, item.thumbnailUrl || item.previewUrl);
    toast.success(`Applied "${item.title}" to active 3D backdrop!`);
  };

  const handleApplyTimeline = (item: Visual3DItem, e: React.MouseEvent) => {
    e.stopPropagation();
    saveRecent(item);
    if (onApplyToTimeline) {
      onApplyToTimeline(item);
    } else {
      onSelect3DVisual(item.assetUrl, item.title, item.isVideo, item.thumbnailUrl || item.previewUrl);
    }
    toast.success(`Added "${item.title}" to video timeline track!`);
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const url = customUrl.trim();
    if (!url) return;

    const title = customTitle.trim() || 'Custom 3D Asset';
    const isVideo = url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm');
    const format = isVideo ? 'mp4' : url.toLowerCase().endsWith('.stl') ? 'stl' : 'glb';

    const customItem: Visual3DItem = {
      id: `custom_3d_${Date.now()}`,
      title,
      assetUrl: url,
      category: 'props',
      provider: 'custom_url',
      previewUrl: url,
      thumbnailUrl: url,
      format,
      isVideo,
      license: 'Custom URL',
      author: 'User Imported',
    };

    handleSelectAsset(customItem);
    setCustomUrl('');
    setCustomTitle('');
  };

  const aspectClass =
    selectedOrientation === 'landscape'
      ? 'aspect-video'
      : selectedOrientation === 'squarish'
      ? 'aspect-square'
      : 'aspect-[9/16]';

  return (
    <div className="flex flex-col h-full bg-[#141414] text-white font-sans-studio select-none overflow-hidden rounded-none border-0">
      {/* ── 1. Top Header Bar ────────────────────────────────────────── */}
      <div className="relative h-11 px-3.5 bg-[#141414] border-b border-[#242424] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Box className="w-4 h-4 shrink-0 text-blue-400" />
          <span className="text-xs font-bold text-white truncate">
            Stock 3D Visuals & CGI (Free Live APIs)
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Models / Loops Toggle Switch */}
          <div className="flex items-center bg-[#1A1A1E] border border-[#2A2A30] rounded-lg p-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => setMediaTypeFilter(mediaTypeFilter === 'models' ? 'all' : 'models')}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                mediaTypeFilter === 'models'
                  ? 'bg-[#2563EB] text-white shadow-xs font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Show 3D Meshes & Models"
            >
              Models
            </button>
            <button
              type="button"
              onClick={() => setMediaTypeFilter(mediaTypeFilter === 'loops' ? 'all' : 'loops')}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                mediaTypeFilter === 'loops'
                  ? 'bg-[#2563EB] text-white shadow-xs font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Show 3D CGI Motion Loops"
            >
              Loops
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setPage(1);
              fetchLive3DAssets(searchQuery, selectedCategory, selectedProvider, mediaTypeFilter, 1, false);
            }}
            disabled={loading}
            className="p-1 text-zinc-400 hover:text-white rounded-md hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Refresh Live 3D Catalog"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#60A5FA] ${loading ? 'animate-spin' : ''}`} />
          </button>

          <span className="text-[10px] font-mono-studio text-slate-400 bg-white/[0.06] px-2 py-0.5 rounded-full border border-[#242424]">
            {items.length} 3D Items
          </span>
        </div>
      </div>

      {/* ── 2. Subtabs Segmented Control ─────────────────────────────── */}
      <div className="p-2.5 bg-[#111111] border-b border-[#242424] shrink-0">
        <ScrollableTabs
          tabs={[
            { id: 'catalog', label: 'Catalog', icon: Box, color: 'text-blue-400' },
            { id: 'url', label: 'URL', icon: ExternalLink, color: 'text-blue-400' },
            {
              id: 'history',
              label: 'History',
              icon: History,
              color: 'text-blue-400',
              badge: recentItems.length > 0 ? recentItems.length : undefined,
            },
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as any)}
        />
      </div>

      {/* ── 3. Search & Filter Bar (When in Catalog Tab) ──────────────── */}
      {activeTab === 'catalog' && (
        <div className="flex flex-col gap-2 border-b border-[#242424] bg-[#141416] p-3 shrink-0">
          {/* Search Row + Category Dropdown */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1 min-w-[140px]">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedCategory('all');
                }}
                placeholder="Search real 3D models, celestial portals, loops..."
                className="w-full bg-[#181818] border border-[#242424] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/40 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-zinc-500 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category / Theme Dropdown */}
            <div className="shrink-0 w-36 sm:w-44">
              <CustomSelect
                options={CATEGORY_OPTIONS}
                value={selectedCategory}
                onChange={(val) => {
                  setSelectedCategory(val);
                }}
                variant="compact"
                align="right"
                buttonClassName="!w-full !justify-between !bg-[#181818] !border-[#242424] !text-xs !py-2 !px-3 font-semibold hover:!border-white/10"
              />
            </div>
          </form>

          {/* Provider Quick Pills & Aspect Ratio */}
          <div className="flex items-center justify-between gap-1.5 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {PROVIDER_PILLS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProvider(p.id)}
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

            {/* Aspect Ratio Filter Pills */}
            <div className="flex items-center gap-1 shrink-0 pl-1.5 border-l border-[#242424]">
              {[
                { id: 'portrait', label: '9:16' },
                { id: 'landscape', label: '16:9' },
                { id: 'squarish', label: '1:1' },
              ].map((ar) => (
                <button
                  key={ar.id}
                  type="button"
                  onClick={() => setSelectedOrientation(ar.id as any)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                    selectedOrientation === ar.id
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'bg-[#181818] text-zinc-400 hover:text-white border border-[#242424]'
                  }`}
                >
                  {ar.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Main Scrollable Content Area ──────────────────────────── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3.5 space-y-4 custom-scrollbar"
      >
        {/* TAB 1: CATALOG GRID */}
        {activeTab === 'catalog' && (
          <div>
            {loading && items.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-zinc-400 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-[#60A5FA]" />
                <p className="text-xs font-medium">Querying live 3D providers (Poly Haven, Pixabay, Wikimedia, Poly Pizza)...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="py-16 text-center text-zinc-500 space-y-2 border border-dashed border-[#242424] rounded-2xl bg-[#181818]/40 p-6">
                <Box className="w-9 h-9 mx-auto text-zinc-600" />
                <p className="text-xs font-medium text-zinc-300">No 3D visual assets found.</p>
                <p className="text-[11px] text-zinc-500">
                  Try switching providers or search for portal, space, chair, or neon.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('portal');
                    setSelectedCategory('all');
                    setSelectedProvider('all');
                  }}
                  className="mt-2 px-3 py-1 text-xs rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white font-medium transition cursor-pointer"
                >
                  Browse Cosmic Portals
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  {items.map((item) => {
                    const isSelected = activeVisualUrl === item.assetUrl;
                    const isHovered = hoveredItemId === item.id;

                    return (
                      <div
                        key={item.id}
                        onMouseEnter={() => setHoveredItemId(item.id)}
                        onMouseLeave={() => setHoveredItemId(null)}
                        onClick={() => handleSelectAsset(item)}
                        className={`group relative rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer flex flex-col bg-[#181818] ${
                          isSelected
                            ? 'border-[#2563EB] ring-2 ring-[#2563EB]/40 shadow-lg shadow-[#2563EB]/20'
                            : 'border-[#242424] hover:border-[#383842]'
                        }`}
                      >
                        {/* Media Card Container */}
                        <div className={`relative ${aspectClass} w-full bg-[#121214] flex items-center justify-center overflow-hidden`}>
                          {item.isVideo ? (
                            <video
                              src={item.assetUrl}
                              poster={item.thumbnailUrl}
                              loop
                              muted
                              playsInline
                              autoPlay={isHovered}
                              className="w-full h-full object-cover transition duration-300"
                            />
                          ) : (item.thumbnailUrl || item.previewUrl) ? (
                            <img
                              src={item.thumbnailUrl || item.previewUrl}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  const fallback = parent.querySelector('.card-fallback-badge');
                                  if (fallback) (fallback as HTMLElement).style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}

                          {/* Fallback 3D Canvas Placeholder if preview image fails or is empty */}
                          <div
                            className="card-fallback-badge absolute inset-0 flex-col items-center justify-center p-3 bg-gradient-to-br from-[#1c1d26] via-[#121216] to-[#0a0a0c] text-center"
                            style={{ display: (!item.isVideo && !item.thumbnailUrl && !item.previewUrl) ? 'flex' : 'none' }}
                          >
                            <Box className="w-8 h-8 text-blue-400/80 mb-1.5 animate-pulse" />
                            <span className="text-[10px] text-zinc-300 font-semibold line-clamp-1">{item.title}</span>
                            <span className="text-[8px] text-blue-400 font-mono mt-0.5">{item.format.toUpperCase()} 3D MODEL</span>
                          </div>

                          {/* Top Badges */}
                          <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-10">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/70 text-blue-300 border border-blue-500/30 backdrop-blur-md">
                              {item.format.toUpperCase()}
                            </span>
                            {item.duration && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/70 text-zinc-300 backdrop-blur-md">
                                {item.duration.toFixed(0)}s
                              </span>
                            )}
                          </div>

                          {/* Provider Badge (Bottom-Left) */}
                          <div className="absolute bottom-2 left-2 z-10">
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-black/85 text-zinc-300 backdrop-blur-md border border-white/10 shadow-sm">
                              {formatProviderLabel(item.provider)}
                            </span>
                          </div>

                          {/* Hover Overlay with Action Buttons */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5 z-20">
                            <div className="flex items-center gap-1.5 w-full">
                              <button
                                type="button"
                                onClick={(e) => handleApplyTimeline(item, e)}
                                className="flex-1 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white font-semibold text-[11px] flex items-center justify-center gap-1 transition shadow-md shadow-blue-500/20 cursor-pointer"
                                title="Add to video timeline track"
                              >
                                <Plus className="w-3.5 h-3.5" /> Timeline
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewingItem(item);
                                }}
                                className="p-1.5 rounded-lg bg-[#222228] hover:bg-[#2c2c34] text-zinc-200 transition border border-[#33333e] cursor-pointer"
                                title="Inspect 3D in WebGL Modal"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Card Meta Footer */}
                        <div className="p-2.5 border-t border-[#242424] bg-[#181818]">
                          <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                          <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                            {item.author || item.license || 'Free Creative Commons'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Infinite Scroll Sentinel & Status Indicators */}
                <div ref={sentinelRef} className="h-6 w-full pointer-events-none" />

                {loadingMore && (
                  <div className="py-4 flex items-center justify-center gap-2 text-zinc-400">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                    <span className="text-xs font-medium text-zinc-400">Loading more 3D assets...</span>
                  </div>
                )}

                {!hasMore && items.length > 0 && !loadingMore && (
                  <div className="py-4 text-center text-[11px] text-zinc-500 font-medium border-t border-[#222228] mt-3">
                    ✨ All 3D visual assets loaded ({items.length} assets)
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB 2: URL IMPORTER */}
        {activeTab === 'url' && (
          <div className="flex flex-col gap-4">
            <form onSubmit={handleApplyCustomUrl} className="bg-[#181818] border border-[#242424] rounded-xl p-3.5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-[#60A5FA]" />
                <span className="text-xs font-bold text-white">Import Custom 3D Asset URL</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Paste any direct link to a 3D model (<code>.glb</code>, <code>.gltf</code>, <code>.stl</code>) or 3D motion loop (<code>.mp4</code>) to set as active backdrop.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono-studio text-slate-500">Asset Title</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Cyberpunk Hovercar 3D"
                  className="bg-[#111111] border border-[#242424] rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#52525B] outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono-studio text-slate-500">Direct 3D Asset URL</label>
                <input
                  type="url"
                  required
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://.../model.glb"
                  className="bg-[#111111] border border-[#242424] rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#52525B] outline-none focus:border-[#3B82F6]"
                />
              </div>

              <button
                type="submit"
                disabled={!customUrl.trim()}
                className="w-full mt-2 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white rounded-xl py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#3B82F6]/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Apply 3D Backdrop
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: HISTORY */}
        {activeTab === 'history' && (
          <div>
            <div className="flex items-center justify-between border-b border-[#242424] pb-2 mb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Recently Used 3D Assets ({recentItems.length})
              </span>
              {recentItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setRecentItems([]);
                    localStorage.removeItem('apexmind_recent_3d');
                  }}
                  className="text-[10px] text-zinc-400 hover:text-white transition cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {recentItems.length === 0 ? (
              <div className="py-16 text-center text-zinc-500 border border-dashed border-[#242424] rounded-2xl p-6">
                <History className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                <p className="text-xs font-medium text-zinc-300">No recently selected 3D assets yet.</p>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Assets you apply to your timeline or backdrop will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {recentItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectAsset(item)}
                    className="group relative rounded-xl border border-[#242424] bg-[#181818] hover:border-[#2563EB] overflow-hidden transition cursor-pointer"
                  >
                    <div className={`relative ${aspectClass} w-full bg-[#121214]`}>
                      {item.isVideo ? (
                        <video src={item.assetUrl} poster={item.thumbnailUrl} className="w-full h-full object-cover" />
                      ) : (
                        <img src={item.thumbnailUrl || item.previewUrl} alt={item.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="p-2 border-t border-[#242424] bg-[#181818]">
                      <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 5. 3D WebGL Inspector Modal ──────────────────────────────── */}
      {previewingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-[#2E2E34] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-3.5 border-b border-[#2E2E34] flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white">{previewingItem.title}</h3>
                <span className="text-[10px] text-blue-400 font-mono">
                  {previewingItem.provider.toUpperCase()} • {previewingItem.format.toUpperCase()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingItem(null)}
                className="p-1 text-zinc-400 hover:text-white rounded-md hover:bg-white/[0.06] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative aspect-[9/16] max-h-[460px] bg-gradient-to-b from-[#141418] via-[#0b0b0e] to-[#050507] flex items-center justify-center overflow-hidden">
              {previewingItem.isVideo ? (
                <video src={previewingItem.assetUrl} controls autoPlay className="w-full h-full object-contain" />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center p-4">
                  {/* High-res rendered 3D preview */}
                  {(previewingItem.thumbnailUrl || previewingItem.previewUrl) ? (
                    <img
                      src={previewingItem.thumbnailUrl || previewingItem.previewUrl}
                      alt={previewingItem.title}
                      className="w-full h-full object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.9)] filter brightness-105 select-none"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 space-y-3 text-center">
                      <Box className="w-16 h-16 text-blue-500 animate-pulse" />
                      <p className="text-xs text-white font-medium">3D {previewingItem.format.toUpperCase()} Asset Ready</p>
                    </div>
                  )}

                  {/* 3D Model Format Badge Overlay */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-white/10 text-[10px] text-blue-400 font-mono font-semibold shadow-lg">
                    <Box className="w-3.5 h-3.5" />
                    <span>{previewingItem.format.toUpperCase()} 3D ASSET</span>
                  </div>

                  {/* Direct File & Author Banner */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-2 rounded-xl bg-black/85 backdrop-blur-md border border-white/10 shadow-xl gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-white font-semibold truncate">{previewingItem.title}</p>
                      <p className="text-[9px] text-zinc-400 truncate">
                        {previewingItem.author || formatProviderLabel(previewingItem.provider)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Roblox Copy Asset ID */}
                      {previewingItem.provider === 'roblox_creator_store' && (
                        <button
                          type="button"
                          onClick={() => {
                            const rawId = previewingItem.id.replace('roblox_', '');
                            navigator.clipboard.writeText(rawId);
                            toast.success(`Copied Roblox Asset ID: ${rawId}`);
                          }}
                          className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] text-zinc-200 font-medium flex items-center gap-1 transition cursor-pointer"
                          title="Copy ID for Roblox Studio Toolbox"
                        >
                          <Copy className="w-3 h-3 text-zinc-400" />
                          <span>Copy ID</span>
                        </button>
                      )}

                      {/* Sketchfab Copy Model UID */}
                      {previewingItem.provider === 'sketchfab' && (
                        <button
                          type="button"
                          onClick={() => {
                            const rawUid = previewingItem.id.replace('sketchfab_', '');
                            navigator.clipboard.writeText(rawUid);
                            toast.success(`Copied Sketchfab Model UID: ${rawUid}`);
                          }}
                          className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] text-zinc-200 font-medium flex items-center gap-1 transition cursor-pointer"
                          title="Copy UID for Blender Sketchfab Add-on & API"
                        >
                          <Copy className="w-3 h-3 text-zinc-400" />
                          <span>Copy UID</span>
                        </button>
                      )}

                      {/* Sloyd AI Copy Model ID */}
                      {previewingItem.provider === 'sloyd_ai' && (
                        <button
                          type="button"
                          onClick={() => {
                            const rawId = previewingItem.id.replace('sloyd_', '');
                            navigator.clipboard.writeText(rawId);
                            toast.success(`Copied Sloyd Asset ID: ${rawId}`);
                          }}
                          className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] text-zinc-200 font-medium flex items-center gap-1 transition cursor-pointer"
                          title="Copy Sloyd Model ID"
                        >
                          <Copy className="w-3 h-3 text-zinc-400" />
                          <span>Copy ID</span>
                        </button>
                      )}

                      {/* Official Source Store / Creator Store Link */}
                      {previewingItem.sourceUrl && (
                        <a
                          href={previewingItem.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] text-zinc-200 font-medium flex items-center gap-1 transition"
                          title="View on Creator Store"
                        >
                          <span>{previewingItem.provider === 'roblox_creator_store' ? 'Store' : 'Source'}</span>
                          <ExternalLink className="w-3 h-3 text-zinc-400" />
                        </a>
                      )}

                      {/* Download Raw File */}
                      {previewingItem.assetUrl && (
                        <a
                          href={previewingItem.assetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-blue-600/25 hover:bg-blue-600/40 text-[10px] text-blue-300 font-semibold flex items-center gap-1 transition border border-blue-500/30"
                          title="Download raw 3D file"
                        >
                          <span>.{previewingItem.format}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3.5 border-t border-[#2E2E34] flex items-center justify-between gap-2">
              <span className="text-[11px] text-zinc-400 truncate max-w-[280px]">
                {previewingItem.provider === 'sketchfab'
                  ? `By ${previewingItem.author} • ${previewingItem.license} • Sketchfab`
                  : previewingItem.provider === 'sloyd_ai'
                  ? `By ${previewingItem.author} • Sloyd AI Low-Poly (CC-BY 4.0)`
                  : (previewingItem.license || 'Creative Commons')}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewingItem(null)}
                  className="px-3 py-1.5 rounded-lg border border-[#33333C] text-xs text-zinc-300 hover:bg-white/[0.06] cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSelectAsset(previewingItem);
                    setPreviewingItem(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Apply 3D Backdrop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Visuals3DPane;