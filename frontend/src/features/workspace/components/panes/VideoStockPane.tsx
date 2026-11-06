import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScrollableTabs, ScrollableTabContainer } from '@/src/shared/ui/ScrollableTabs';
import {
  Film,
  Play,
  ChevronDown,
  Search,
  X,
  Check,
  ExternalLink,
  Plus,
  Trash2,
  Bookmark,
  RefreshCw,
  Sparkles,
  Gauge,
  Sliders,
} from 'lucide-react';
import { CustomSelect } from '@/src/shared/ui/CustomSelect';
import { workspaceApi } from '../../api/workspaceApi';
import { toast } from 'sonner';

export interface StockVideoItem {
  id: string;
  title: string;
  category: 'gym' | 'clouds' | 'city' | 'ocean' | 'fire' | 'abstract' | 'minimal';
  videoUrl: string;
  posterUrl?: string;
  duration: string;
  resolution: string;
  source?: string;
  tags?: string[];
  aestheticScore?: number;
  aestheticBadges?: string[];
}

export interface VideoStockPaneProps {
  onSelectVideo: (videoUrl: string, posterUrl?: string) => void;
  activeVideoUrl?: string;
}

const SEARCH_TOPICS = ['#nature', '#mountains', '#forest', '#ocean', '#waterfall', '#clouds', '#sunset', '#aurora', '#river', '#rain'];

const LOCAL_STORAGE_VIDEOS_KEY = 'apexmind_custom_videos';

interface VideoCardProps {
  vid: StockVideoItem;
  isSelected: boolean;
  playbackSpeed: number;
  onAddToTimeline: (vid: StockVideoItem) => void;
}

const VideoCard: React.FC<VideoCardProps> = React.memo(({
  vid,
  isSelected,
  playbackSpeed,
  onAddToTimeline,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleMouseEnter = () => {
    // 120ms debounce prevents mounting video decoder while user is rapidly scrolling past
    hoverTimerRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 120);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setIsHovered(false);
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isHovered && videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.play().catch(() => {});
    }
  }, [isHovered, playbackSpeed]);

  const hasPoster = Boolean(vid.posterUrl) && !imgError;

  return (
    <button
      type="button"
      aria-label={`Add ${vid.title} to timeline`}
      title={`Add ${vid.title} to timeline`}
      onClick={() => onAddToTimeline(vid)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ contentVisibility: 'auto', containIntrinsicSize: '240px' }}
      className={`group relative block w-full rounded-xl border overflow-hidden aspect-[9/16] bg-[#181818] transition-all cursor-pointer p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]/70 transform-gpu ${
        isSelected
          ? 'border-[#3B82F6] ring-1 ring-[#3B82F6]/50 shadow-lg shadow-blue-500/10'
          : 'border-[#242424] hover:border-[#2E2E2E]'
      }`}
    >
      {/* ── Visual Media: High-performance lazy image by default, video mounted ONLY on intentional hover ── */}
      {isHovered ? (
        <video
          ref={videoRef}
          src={vid.videoUrl}
          poster={vid.posterUrl}
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : hasPoster ? (
        <img
          src={vid.posterUrl}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <video
          src={vid.videoUrl}
          preload="none"
          muted
          playsInline
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {vid.source && (
        <span className="media-source-badge absolute left-2 top-2 z-10">
          {vid.source}
        </span>
      )}
      {isSelected && (
        <span className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-[#3B82F6] text-white shadow-md">
          <Check className="h-3 w-3 stroke-[3]" />
        </span>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-85 transition-opacity group-hover:opacity-100" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1.5 p-2.5">
        <p className="truncate text-left text-[11px] font-bold leading-tight text-white drop-shadow-md" title={vid.title}>
          {vid.title}
        </p>
        <p className="truncate text-left text-[9px] text-zinc-400">
          {[vid.duration, vid.resolution].filter(Boolean).join(' · ')}
        </p>
      </div>
    </button>
  );
});

export const VideoStockPane: React.FC<VideoStockPaneProps> = ({
  onSelectVideo,
  activeVideoUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'url' | 'settings' | 'saved'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [videos, setVideos] = useState<StockVideoItem[]>([]);
  const [savedVideos, setSavedVideos] = useState<StockVideoItem[]>([]);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [customTitleInput, setCustomTitleInput] = useState('');
  const [urlVideoValid, setUrlVideoValid] = useState<boolean | null>(null);
  const [isLoadingBackend, setIsLoadingBackend] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [totalClipsFound, setTotalClipsFound] = useState<number>(0);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const contentScrollRef = useRef<HTMLDivElement>(null);

  // Playback & Filter settings
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [colorMood, setColorMood] = useState<'normal' | 'dark' | 'bw' | 'cyber'>('normal');
  const [timelineVideoUrls, setTimelineVideoUrls] = useState<Set<string>>(new Set());
  const [hideUsed, setHideUsed] = useState<boolean>(false);

  // Sync timeline video clips to detect used assets and allow 1-click removal
  useEffect(() => {
    const handleTimelineState = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.videoClips) {
        setTimelineVideoUrls(new Set((detail.videoClips as any[]).map((c) => c.url).filter(Boolean)));
      }
    };
    window.addEventListener('workspace:timeline-state', handleTimelineState);
    return () => window.removeEventListener('workspace:timeline-state', handleTimelineState);
  }, []);

  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  // Load saved videos from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_VIDEOS_KEY);
      if (stored) setSavedVideos(JSON.parse(stored));
    } catch {}
  }, []);

  // Live stock videos runner with progressive infinite appending (down by down like Image pane)
  const fetchVideos = useCallback(
    async (
      query: string,
      category: string,
      provider: string,
      pageNum: number,
      isAppending: boolean = false
    ) => {
      try {
        if (isAppending) {
          setIsLoadingMore(true);
        } else {
          setIsLoadingBackend(true);
        }

        const rawQ = query.trim().replace(/^#/, '');
        const cleanQ = rawQ || (category !== 'all' ? category : 'cinematic nature');
        const res = await workspaceApi.searchOpenVideos(cleanQ, category, pageNum, 24, provider);

        if (res && res.items && res.items.length > 0) {
          const formatted: StockVideoItem[] = res.items.map((it: any) => ({
            id: it.id || `live-vid-${Date.now()}-${Math.random()}`,
            title: it.title || 'Stock Video Loop',
            category: it.category || category,
            videoUrl: it.videoUrl,
            posterUrl: it.posterUrl || '',
            duration: typeof it.duration === 'number' ? `${Math.round(it.duration)}s` : (it.duration || 'Loop'),
            resolution: it.resolution || '1080x1920 HD',
            source: it.source || it.provider || 'stock',
            tags: it.tags || [],
            aestheticScore: typeof it.aestheticScore === 'number' ? it.aestheticScore : undefined,
            aestheticBadges: Array.isArray(it.aestheticBadges) ? it.aestheticBadges : [],
          }));

          setTotalClipsFound(res.total || formatted.length);
          setHasMore(formatted.length >= 6);

          if (isAppending) {
            setVideos((prev) => {
              const existingUrls = new Set(prev.map((p) => p.videoUrl));
              const newItems = formatted.filter((f) => !existingUrls.has(f.videoUrl));
              return [...prev, ...newItems];
            });
          } else {
            setVideos(formatted);
          }
        } else {
          if (!isAppending) {
            setVideos([]);
            setTotalClipsFound(0);
          }
          setHasMore(false);
        }
      } catch {
        if (!isAppending) {
          setVideos([]);
          setTotalClipsFound(0);
        }
      } finally {
        setIsLoadingBackend(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  // Re-fetch when search filters change
  useEffect(() => {
    if (activeTab !== 'catalog') return;
    setPage(1);
    const timer = setTimeout(() => {
      fetchVideos(searchQuery, selectedCategory, selectedProvider, 1, false);
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedProvider, activeTab, fetchVideos]);

  // Load next page of clips down below the current grid
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchVideos(searchQuery, selectedCategory, selectedProvider, nextPage, true);
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
  };

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setSearchQuery('');
  };

  const handleProviderChange = (provId: string) => {
    setSelectedProvider(provId);
  };

  const handleAddToTimeline = useCallback((vid: StockVideoItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedId(vid.id);
    window.dispatchEvent(
      new CustomEvent('workspace:add-timeline-clip', {
        detail: {
          type: 'video',
          url: vid.videoUrl,
          posterUrl: vid.posterUrl,
          name: vid.title,
          duration: 4.0,
        },
      })
    );
    toast.success(`Added "${vid.title}" to Timeline Track (V1)`);
  }, []);

  const handleAddCustomUrl = (saveToFavorites = false) => {
    if (!customUrlInput.trim()) return;
    const url = customUrlInput.trim();
    const title = customTitleInput.trim() || 'Custom Video Clip';

    const newItem: StockVideoItem = {
      id: `custom-vid-${Date.now()}`,
      title,
      category: 'minimal',
      videoUrl: url,
      duration: 'Custom',
      resolution: 'Stream HD',
    };

    onSelectVideo(url, newItem.posterUrl);
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'video' }));

    if (saveToFavorites) {
      const updated = [newItem, ...savedVideos];
      setSavedVideos(updated);
      try {
        localStorage.setItem(LOCAL_STORAGE_VIDEOS_KEY, JSON.stringify(updated));
      } catch {}
    }

    setCustomUrlInput('');
    setCustomTitleInput('');
    setUrlVideoValid(null);
  };

  const handleDeleteSaved = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedVideos((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(LOCAL_STORAGE_VIDEOS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const sourceList = activeTab === 'saved' ? savedVideos : videos;

  const baseFiltered =
    activeTab === 'saved'
      ? sourceList.filter((vid) => {
          const matchesCategory = selectedCategory === 'all' || vid.category === selectedCategory;
          const cleanQuery = searchQuery.trim().replace(/^#/, '').toLowerCase();
          const matchesQuery =
            cleanQuery === '' ||
            vid.title.toLowerCase().includes(cleanQuery) ||
            (vid.tags && vid.tags.some((t) => t.toLowerCase().includes(cleanQuery)));
          return matchesCategory && matchesQuery;
        })
      : videos;

  const filteredVideos = baseFiltered.filter((vid) => !hideUsed || !timelineVideoUrls.has(vid.videoUrl));

  return (
    <div className="flex flex-col h-full bg-[#141414] text-white font-sans-studio select-none overflow-hidden rounded-none border-0">
      {/* ── Top Header Bar (Matching Studio Shell) ── */}
      <div className="relative h-11 px-3.5 bg-[#141414] border-b border-[#242424] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Film className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="text-xs font-bold text-white truncate">
            Nature Video Clips
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isLoadingBackend && (
            <RefreshCw className="w-3.5 h-3.5 text-[#60A5FA] animate-spin" />
          )}
          <span className="text-[10px] font-mono-studio text-slate-400 bg-white/[0.06] px-2 py-0.5 rounded-full border border-[#242424]">
            {filteredVideos.length} Clips
          </span>
        </div>
      </div>

      {/* ── Subtabs Segmented Control ── */}
      <div className="p-2.5 bg-[#111111] border-b border-[#242424] shrink-0">
        <ScrollableTabs
          tabs={[
            { id: 'catalog', label: 'Catalog', icon: Film, color: 'text-blue-400' },
            { id: 'settings', label: 'Mood', icon: Sliders, color: 'text-blue-400' },
            { id: 'url', label: 'URL', icon: ExternalLink, color: 'text-blue-400' },
            { id: 'saved', label: 'Saved', icon: Bookmark, color: 'text-blue-400' },
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as any)}
        />
      </div>

      {/* ── Main Content Area ── */}
      <div ref={contentScrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3.5">
        {activeTab === 'settings' ? (
          /* Motion Speed & Mood Grading Tab */
          <div className="flex flex-col gap-4">
            <div className="bg-[#181818] border border-[#242424] rounded-xl p-3.5 flex flex-col gap-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-[#60A5FA]" />
                Video Loop Playback Speed
              </span>
              <p className="text-[11px] text-slate-400">
                Slow down drone or storm footage for dramatic stoic impact or speed it up for hype reels.
              </p>

              <div className="grid grid-cols-4 gap-2 pt-1">
                {[
                  { label: '0.5x Slow', val: 0.5 },
                  { label: '0.75x Chill', val: 0.75 },
                  { label: '1.0x Normal', val: 1.0 },
                  { label: '1.5x Fast', val: 1.5 },
                ].map((s) => (
                  <button
                    key={s.val}
                    type="button"
                    onClick={() => setPlaybackSpeed(s.val)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      playbackSpeed === s.val
                        ? 'bg-[#3B82F6] text-white border-[#3B82F6] shadow-md shadow-[#3B82F6]/20'
                        : 'bg-[#111111] text-slate-400 border-[#242424] hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Video Color Mood Preset */}
            <div className="bg-[#181818] border border-[#242424] rounded-xl p-3.5 flex flex-col gap-2.5">
              <span className="text-xs font-bold text-white">Video Color Mood</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'normal', name: 'Original Color' },
                  { id: 'dark', name: 'Dark Moody Stoic' },
                  { id: 'bw', name: 'High Contrast B&W' },
                  { id: 'cyber', name: 'Cyberpunk Glow' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setColorMood(m.id as any)}
                    className={`p-2.5 rounded-lg border text-xs font-semibold text-left transition-all ${
                      colorMood === m.id
                        ? 'bg-[#2563EB] text-white border-[#60A5FA]/40 shadow-xs'
                        : 'bg-[#111111] text-slate-400 border-[#242424] hover:text-white'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'url' ? (
          /* Custom Video URL Input Form */
          <div className="flex flex-col gap-4">
            <div className="bg-[#181818] border border-[#242424] rounded-xl p-3.5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-[#60A5FA]" />
                <span className="text-xs font-bold text-white">Import Custom Video URL</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Paste any direct MP4, WebM, or public video link to render as the animated background in your canvas.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono-studio text-slate-500">Clip Title</label>
                <input
                  type="text"
                  value={customTitleInput}
                  onChange={(e) => setCustomTitleInput(e.target.value)}
                  placeholder="e.g. Cinematic Rain Drone"
                  className="bg-[#111111] border border-[#242424] rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#52525B] outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono-studio text-slate-500">Video URL (MP4 / WebM / Cloud Storage)</label>
                <input
                  type="url"
                  value={customUrlInput}
                  onChange={(e) => {
                    setCustomUrlInput(e.target.value);
                    setUrlVideoValid(null);
                  }}
                  placeholder="https://example.com/video.mp4"
                  className="bg-[#111111] border border-[#242424] rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#52525B] outline-none focus:border-[#3B82F6]"
                />
              </div>

              {/* Video Preview */}
              {customUrlInput.trim() && (
                <div className="mt-2 rounded-xl overflow-hidden border border-[#242424] bg-[#141414] aspect-[9/12] max-h-56 relative flex items-center justify-center">
                  <video
                    ref={previewVideoRef}
                    src={customUrlInput.trim()}
                    className="w-full h-full object-cover"
                    controls
                    muted
                    loop
                    onCanPlay={() => setUrlVideoValid(true)}
                    onError={() => setUrlVideoValid(false)}
                  />
                  {urlVideoValid === false && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-3 text-center">
                      <p className="text-xs text-rose-400 font-semibold">Video could not be played</p>
                      <p className="text-[10px] text-slate-400 mt-1">Check that URL is direct .mp4 or .webm</p>
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
                  title="Save to My Clips"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Motion Catalog / Saved Clips */
          <>
            {/* Search Input & Category Dropdown in One Row */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-[140px]">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search motion clips or #tags..."
                    className="w-full bg-[#181818] border border-[#242424] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/40 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {activeTab === 'catalog' && (
                  <div className="shrink-0 w-36 sm:w-40">
                    <CustomSelect
                      value={selectedCategory}
                      onChange={(val) => handleCategoryChange(val as any)}
                      options={[
                        { value: 'all', label: '✨ All Free Loops' },
                        { value: 'nature', label: '🌲 Nature' },
                        { value: 'mountains', label: '⛰️ Mountains' },
                        { value: 'ocean', label: '🌊 Ocean' },
                        { value: 'city', label: '🏙️ City & Cyber' },
                        { value: 'gym', label: '💪 Gym & Fitness' },
                        { value: 'clouds', label: '☁️ Sky & Storm' },
                        { value: 'fire', label: '🔥 Fire & Action' },
                        { value: 'sunset', label: '🌅 Golden Hour' },
                        { value: 'space', label: '🌌 Space' },
                        { value: 'abstract', label: '🌀 Dark & Stoic' },
                      ]}
                      variant="compact"
                      align="right"
                      buttonClassName="!w-full !justify-between !bg-[#181818] !border-[#242424] !text-xs !py-2 !px-3 font-semibold hover:!border-white/10"
                    />
                  </div>
                )}
              </div>

              {/* Provider Quick Pills */}
              {activeTab === 'catalog' && (
                <ScrollableTabContainer className="pt-0.5">
                  {[
                    { id: 'all', label: '✨ All' },
                    { id: 'pixabay', label: '🎥 Pixabay' },
                    { id: 'pexels', label: '🎬 Pexels' },
                    { id: 'wikimedia', label: '🌐 Wikimedia' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleProviderChange(p.id)}
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-medium transition-colors shrink-0 cursor-pointer ${
                        selectedProvider === p.id
                          ? 'bg-[#2563EB] text-white border-[#60A5FA]/40 shadow-xs font-semibold'
                          : 'bg-[#181818] text-zinc-400 hover:text-white hover:bg-[#26262C] border border-[#242424]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </ScrollableTabContainer>
              )}
            </div>

            {/* Empty Saved State */}
            {activeTab === 'saved' && savedVideos.length === 0 ? (
              <div className="bg-[#181818] border border-[#242424] rounded-xl p-8 flex flex-col items-center justify-center text-center gap-2.5">
                <Bookmark className="w-8 h-8 text-[#52525B]" />
                <p className="text-xs font-bold text-white">No Saved Clips Yet</p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Import video loops using the &ldquo;Direct URL&rdquo; tab to build your library.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('url')}
                  className="mt-2 bg-[#3B82F6] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#2563EB] transition-colors"
                >
                  Import Video URL
                </button>
              </div>
            ) : filteredVideos.length === 0 && isLoadingBackend ? (
              <div className="grid grid-cols-2 gap-2.5">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={`vskel-${idx}`}
                    className="rounded-none border-0 aspect-[9/16] bg-[#181818] animate-pulse flex flex-col justify-end p-2.5"
                  >
                    <div className="h-3 w-3/4 bg-zinc-800 rounded mb-1" />
                    <div className="h-2.5 w-1/2 bg-zinc-800/60 rounded mb-2" />
                    <div className="h-6 w-full bg-zinc-800/80 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="bg-[#181818] border border-[#242424] rounded-xl p-8 text-center text-xs text-slate-400">
                No video clips matching &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              /* Video Grid & Pagination */
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2.5">
                  {filteredVideos.map((vid) => (
                    <VideoCard
                      key={vid.id}
                      vid={vid}
                      isSelected={selectedId === vid.id || (!selectedId && activeVideoUrl === vid.videoUrl)}
                      playbackSpeed={playbackSpeed}
                      onAddToTimeline={(video) => handleAddToTimeline(video)}
                    />
                  ))}
                </div>

              {/* Load More / Next Page button (Appends down by down like Image pane) */}
              {activeTab === 'catalog' && filteredVideos.length > 0 && (
                <div className="pt-3 pb-2 flex flex-col items-center gap-2 border-t border-[#242424]">
                  {hasMore && (
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore || isLoadingBackend}
                      className="w-full py-2.5 rounded-xl bg-[#1C1C22] hover:bg-[#25252E] border border-[#2D2D35] hover:border-blue-500/40 text-xs font-semibold text-zinc-300 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-sm"
                    >
                      {isLoadingMore ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                          <span>Loading Next Video Clips...</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
                          <span>Load More Clips (Next Page {page + 1})</span>
                        </>
                      )}
                    </button>
                  )}
                  <span className="text-[10px] font-mono-studio text-zinc-500">
                    Showing {filteredVideos.length} clips • {totalClipsFound || filteredVideos.length} available
                  </span>
                  <div className="flex items-center justify-center gap-1.5 text-[9px] text-zinc-500">
                    <span>Free videos provided by</span>
                    <a
                      href="https://pixabay.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-zinc-400 hover:text-white underline font-semibold flex items-center gap-0.5"
                    >
                      Pixabay
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <span>•</span>
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
                </div>
              )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VideoStockPane;
