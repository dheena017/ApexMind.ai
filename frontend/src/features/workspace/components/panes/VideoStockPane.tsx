import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Film,
  Play,
  ChevronDown,
  Search,
  ChevronLeft,
  ChevronRight,
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
  Volume2,
  VolumeX,
  Maximize2,
} from 'lucide-react';
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

export const VideoStockPane: React.FC<VideoStockPaneProps> = ({
  onSelectVideo,
  activeVideoUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'url' | 'settings' | 'saved'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
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

  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
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

  const handleMouseEnter = (id: string) => {
    setHoveredId(id);
    const video = videoRefs.current[id];
    if (video) {
      video.playbackRate = playbackSpeed;
      video.play().catch(() => {});
    }
  };

  const handleMouseLeave = (id: string) => {
    setHoveredId(null);
    const video = videoRefs.current[id];
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  };

  const handleApply = (vid: StockVideoItem) => {
    setSelectedId(vid.id);
    onSelectVideo(vid.videoUrl, vid.posterUrl);
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'video' }));
    toast.success(`Applied "${vid.title}"`);
  };

  const handleAddToTimeline = (vid: StockVideoItem, e?: React.MouseEvent) => {
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
  };

  const handleStageVideo = (vid: StockVideoItem) => setSelectedId(vid.id);

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

  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedVideos.filter((item) => item.id !== id);
    setSavedVideos(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_VIDEOS_KEY, JSON.stringify(updated));
    } catch {}
  };

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
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none overflow-hidden rounded-2xl border border-[#26262B]">
      {/* ── Top Header Bar (Matching Studio Shell) ── */}
      <div className="relative h-11 px-3.5 bg-[#17171A] border-b border-[#26262B] flex items-center justify-between z-20 shrink-0">
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
          <span className="text-[10px] font-mono-studio text-[#A1A1AA] bg-[#222226] px-2 py-0.5 rounded-full border border-[#2F2F36]">
            {filteredVideos.length} Clips
          </span>
        </div>
      </div>

      {/* ── Subtabs Header Bar ── */}
      <div className="flex items-center gap-4 sm:gap-5 px-3.5 pt-2 border-b border-[#26262B] text-xs font-semibold overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0 bg-[#141417]">
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'catalog'
              ? 'text-white border-blue-500 font-bold'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Motion Catalog
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 flex items-center gap-1.5 ${
            activeTab === 'settings'
              ? 'text-white border-blue-500 font-bold'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-[#60A5FA]" />
          <span>Speed &amp; Mood</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'url'
              ? 'text-white border-blue-500 font-bold'
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
              ? 'text-white border-blue-500 font-bold'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5 text-amber-400" />
          <span>Saved ({savedVideos.length})</span>
        </button>
      </div>

      {/* ── Category Filter Chips (In Catalog Mode) ── */}
      {activeTab === 'catalog' && (
        <div className="flex items-center gap-1.5 px-3.5 py-2 border-b border-[#26262B]/70 bg-[#141416] overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0">
          <button
            type="button"
            onClick={() => setHideUsed(!hideUsed)}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              hideUsed
                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-xs'
                : 'bg-[#1C1C22] text-[#A1A1AA] hover:text-white hover:bg-[#26262E] border border-[#2A2A32]'
            }`}
            title="Filter out videos already in project so they cannot be reused"
          >
            <span>{hideUsed ? '🚫 Used Hidden' : '👁️ Hide Used'}</span>
            {timelineVideoUrls.size > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-mono">
                {timelineVideoUrls.size}
              </span>
            )}
          </button>
          {(
            [
              { id: 'all', label: '✨ All Free Loops' },
              { id: 'nature', label: '🌲 Nature' },
              { id: 'mountains', label: '⛰️ Mountains' },
              { id: 'ocean', label: '🌊 Ocean Waves' },
              { id: 'city', label: '🏙️ City & Cyber' },
              { id: 'gym', label: '💪 Gym & Fitness' },
              { id: 'clouds', label: '☁️ Sky & Storm' },
              { id: 'fire', label: '🔥 Fire & Action' },
              { id: 'sunset', label: '🌅 Golden Hour' },
              { id: 'space', label: '🌌 Space' },
              { id: 'abstract', label: '🌀 Dark & Stoic' },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold'
                  : 'bg-[#1C1C22] text-[#A1A1AA] hover:text-white hover:bg-[#26262E] border border-[#2A2A32]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Main Content Area ── */}
      <div ref={contentScrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3.5">
        {activeTab === 'settings' ? (
          /* Motion Speed & Mood Grading Tab */
          <div className="flex flex-col gap-4">
            <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-3.5 flex flex-col gap-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-[#60A5FA]" />
                Video Loop Playback Speed
              </span>
              <p className="text-[11px] text-[#A1A1AA]">
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
                        : 'bg-[#141417] text-[#A1A1AA] border-[#2A2A30] hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Video Color Mood Preset */}
            <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-3.5 flex flex-col gap-2.5">
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
                        ? 'bg-[#1E2330] text-white border-[#3B82F6] ring-1 ring-[#3B82F6]/50'
                        : 'bg-[#141417] text-[#A1A1AA] border-[#2A2A30] hover:text-white'
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
            <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-3.5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-[#60A5FA]" />
                <span className="text-xs font-bold text-white">Import Custom Video URL</span>
              </div>
              <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                Paste any direct MP4, WebM, or public video link to render as the animated background in your canvas.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono-studio text-[#71717A]">Clip Title</label>
                <input
                  type="text"
                  value={customTitleInput}
                  onChange={(e) => setCustomTitleInput(e.target.value)}
                  placeholder="e.g. Cinematic Rain Drone"
                  className="bg-[#141417] border border-[#2A2A30] rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#52525B] outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono-studio text-[#71717A]">Video URL (MP4 / WebM / Cloud Storage)</label>
                <input
                  type="url"
                  value={customUrlInput}
                  onChange={(e) => {
                    setCustomUrlInput(e.target.value);
                    setUrlVideoValid(null);
                  }}
                  placeholder="https://commondatastorage.googleapis.com/...mp4"
                  className="bg-[#141417] border border-[#2A2A30] rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#52525B] outline-none focus:border-[#3B82F6]"
                />
              </div>

              {/* Video Preview */}
              {customUrlInput.trim() && (
                <div className="mt-2 rounded-xl overflow-hidden border border-[#2A2A30] bg-[#121214] aspect-[9/12] max-h-56 relative flex items-center justify-center">
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
                      <p className="text-[10px] text-[#A1A1AA] mt-1">Check that URL is direct .mp4 or .webm</p>
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
            {/* Search Input & Provider Selector */}
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search motion clips or #tags..."
                  className="w-full bg-[#1C1C20] border border-[#2A2A30] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-[#525252] outline-none focus:border-[#3B82F6]/60 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Provider Quick Pills */}
              {activeTab === 'catalog' && (
                <div className="flex items-center gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {[
                    { id: 'all', label: '✨ All (Pexels + Pixabay + Wikimedia)' },
                    { id: 'pixabay', label: '🎥 Pixabay (Free)' },
                    { id: 'pexels', label: '🎬 Pexels (Free)' },
                    { id: 'wikimedia', label: '🌐 Wikimedia (Public Domain)' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleProviderChange(p.id)}
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-medium transition-colors shrink-0 cursor-pointer ${
                        selectedProvider === p.id
                          ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40 font-semibold'
                          : 'bg-[#18181B] text-[#71717A] hover:text-[#D4D4D8] border border-[#27272A]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Empty Saved State */}
            {activeTab === 'saved' && savedVideos.length === 0 ? (
              <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-8 flex flex-col items-center justify-center text-center gap-2.5">
                <Bookmark className="w-8 h-8 text-[#52525B]" />
                <p className="text-xs font-bold text-white">No Saved Clips Yet</p>
                <p className="text-[11px] text-[#A1A1AA] max-w-xs">
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
                    className="rounded-xl border border-[#2A2A30] aspect-[9/16] bg-[#1A1A1E] animate-pulse flex flex-col justify-end p-2.5"
                  >
                    <div className="h-3 w-3/4 bg-zinc-800 rounded mb-1" />
                    <div className="h-2.5 w-1/2 bg-zinc-800/60 rounded mb-2" />
                    <div className="h-6 w-full bg-zinc-800/80 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-8 text-center text-xs text-[#A1A1AA]">
                No video clips matching &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              /* Video Grid & Pagination */
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2.5">
                {filteredVideos.map((vid) => {
                  const isHovered = hoveredId === vid.id;
                  const isSelected = selectedId === vid.id || (!selectedId && activeVideoUrl === vid.videoUrl);

                  return (
                    <div
                      key={vid.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleApply(vid)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleApply(vid);
                        }
                      }}
                      onMouseEnter={() => handleMouseEnter(vid.id)}
                      onMouseLeave={() => handleMouseLeave(vid.id)}
                      className={`group relative rounded-xl border overflow-hidden aspect-[9/14] bg-[#16161A] transition-all cursor-pointer text-left flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/10'
                          : 'border-[#26262D] hover:border-[#3E3E4A] hover:shadow-md'
                      }`}
                    >
                      {/* Video element for hover preview */}
                      <video
                        ref={(el) => {
                          videoRefs.current[vid.id] = el;
                        }}
                        src={vid.videoUrl}
                        poster={vid.posterUrl}
                        loop
                        muted
                        playsInline
                        preload="metadata"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* Top Glass Badges */}
                      <div className="relative z-10 p-2 flex items-center justify-between pointer-events-none">
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-md text-[9px] font-semibold text-zinc-200 border border-white/10 uppercase tracking-wider">
                            {vid.category}
                          </span>
                          {vid.source && (
                            <span className="px-1.5 py-0.5 rounded-full bg-blue-950/80 backdrop-blur-md text-[8.5px] font-bold text-blue-300 border border-blue-500/30 uppercase">
                              {vid.source}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {typeof vid.aestheticScore === 'number' && vid.aestheticScore > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-emerald-950/80 backdrop-blur-md text-[8.5px] font-bold text-emerald-300 border border-emerald-500/40 flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                              {Math.round(vid.aestheticScore)}
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded-full bg-black/65 backdrop-blur-md text-[9px] font-mono text-zinc-300 border border-white/10">
                            {vid.duration}
                          </span>
                        </div>
                      </div>

                      {/* Aesthetic & 60fps/120fps Quality Badges */}
                      {vid.aestheticBadges && vid.aestheticBadges.length > 0 && (
                        <div className="relative z-10 px-2 flex flex-wrap gap-1 pointer-events-none">
                          {vid.aestheticBadges.slice(0, 2).map((badge: string) => (
                            <span
                              key={badge}
                              className="px-1.5 py-0.5 rounded-full bg-amber-950/80 backdrop-blur-md text-[8px] font-bold text-amber-300 border border-amber-500/40 flex items-center gap-0.5"
                            >
                              <span>⚡</span> {badge}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Center Play Indicator */}
                      {!isHovered && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          <div className="w-8 h-8 rounded-full bg-black/55 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-md">
                            <Play className="w-3.5 h-3.5 text-white ml-0.5" fill="white" />
                          </div>
                        </div>
                      )}

                      {/* Delete button for Saved clips */}
                      {activeTab === 'saved' && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSaved(vid.id, e)}
                          className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors"
                          title="Delete from Saved"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}

                      {/* Bottom Info & Action Bar */}
                      <div className="relative z-10 bg-gradient-to-t from-black via-black/80 to-transparent p-2.5 pt-8 flex flex-col gap-1.5 pointer-events-auto">
                        <p className="text-[11px] font-semibold text-white leading-tight line-clamp-1 group-hover:text-blue-300 transition-colors drop-shadow-sm">
                          {vid.title}
                        </p>

                        {(() => {
                          const isUsedInTimeline = timelineVideoUrls.has(vid.videoUrl);
                          return (
                            <div className="flex items-center justify-between gap-1 pt-0.5">
                              <span className="text-[9px] text-zinc-400 font-mono flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${isUsedInTimeline ? 'bg-amber-400' : 'bg-emerald-400'} inline-block animate-pulse`} />
                                {isUsedInTimeline ? 'In Project' : 'Stock'}
                              </span>

                              <div className="flex items-center gap-1">
                                {isUsedInTimeline ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.dispatchEvent(new CustomEvent('workspace:remove-clip-by-url', { detail: { url: vid.videoUrl } }));
                                      toast.success(`Removed "${vid.title}" from Timeline`);
                                    }}
                                    className="px-2 py-0.5 rounded bg-rose-500/25 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                                    title="Remove this video from Timeline Track"
                                  >
                                    <Trash2 className="w-2.5 h-2.5 stroke-[2.5]" />
                                    Remove
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => handleAddToTimeline(vid, e)}
                                    className="px-2 py-0.5 rounded bg-amber-500/25 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                                    title="Add to Timeline Track V1"
                                  >
                                    <Plus className="w-2.5 h-2.5 stroke-[3]" />
                                    Track
                                  </button>
                                )}
                                {isSelected && (
                                  <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[9px] font-bold flex items-center gap-1 shadow-sm">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    Active
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load More / Next Page button (Appends down by down like Image pane) */}
              {activeTab === 'catalog' && filteredVideos.length > 0 && (
                <div className="pt-3 pb-2 flex flex-col items-center gap-2 border-t border-[#26262B]">
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
