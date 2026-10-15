import React, { useState, useRef, useEffect } from 'react';
import {
  Film,
  Play,
  Search,
  X,
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

export interface StockVideoItem {
  id: string;
  title: string;
  category: 'gym' | 'clouds' | 'city' | 'ocean' | 'fire' | 'abstract' | 'minimal';
  videoUrl: string;
  posterUrl: string;
  duration: string;
  resolution: string;
  tags?: string[];
}

export interface VideoStockPaneProps {
  onSelectVideo: (videoUrl: string) => void;
  activeVideoUrl?: string;
}

import { CURATED_STOCK_VIDEOS as EXPANDED_VIDEOS } from '../../data/mediaCatalogData';

const CURATED_STOCK_VIDEOS: StockVideoItem[] = [
  ...EXPANDED_VIDEOS.map((v) => ({
    id: v.id,
    title: v.title,
    category: (v.category === 'atmospheric' ? 'clouds' : v.category === 'urban' ? 'city' : v.category === 'abstract' ? 'abstract' : 'gym') as any,
    videoUrl: v.videoUrl,
    posterUrl: v.posterUrl,
    duration: v.duration,
    resolution: v.resolution,
    tags: v.tags,
  })),
  {
    id: 'vid-2',
    title: 'Heavy Barbell Gym Deadlift Grit',
    category: 'gym',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80',
    duration: '20s Loop',
    resolution: '1080x1920',
    tags: ['gym', 'deadlift', 'weights', 'power'],
  },
  {
    id: 'vid-3',
    title: 'Cyberpunk Neon Traffic Lights',
    category: 'city',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80',
    duration: '12s Loop',
    resolution: '1080x1920',
    tags: ['neon', 'city', 'night', 'cyberpunk'],
  },
  {
    id: 'vid-4',
    title: 'Deep Oceanic Storm Mist Waves',
    category: 'ocean',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=400&q=80',
    duration: '18s Loop',
    resolution: '1080x1920',
    tags: ['ocean', 'waves', 'water', 'storm'],
  },
  {
    id: 'vid-5',
    title: 'Glowing Fire Sparks & Embers',
    category: 'fire',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=400&q=80',
    duration: '10s Loop',
    resolution: '1080x1920',
    tags: ['fire', 'embers', 'sparks', 'flame'],
  },
  {
    id: 'vid-6',
    title: 'Thunderstorm Lightning Cloudscape',
    category: 'clouds',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=400&q=80',
    duration: '14s Loop',
    resolution: '1080x1920',
    tags: ['lightning', 'thunder', 'rain', 'dark'],
  },
  {
    id: 'vid-7',
    title: 'Tunnel Speed Neon Blur Rush',
    category: 'abstract',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
    duration: '16s Loop',
    resolution: '1080x1920',
    tags: ['speed', 'tunnel', 'blur', 'abstract'],
  },
  {
    id: 'vid-8',
    title: 'Night Skyline Time-lapse Stars',
    category: 'city',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    duration: '22s Loop',
    resolution: '1080x1920',
    tags: ['stars', 'night', 'timelapse', 'skyline'],
  },
];

const SEARCH_TOPICS = ['#clouds', '#gym', '#city', '#ocean', '#fire', '#drone', '#night', '#lightning', '#abstract'];

const LOCAL_STORAGE_VIDEOS_KEY = 'apexmind_custom_videos';

export const VideoStockPane: React.FC<VideoStockPaneProps> = ({
  onSelectVideo,
  activeVideoUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'url' | 'settings' | 'saved'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [videos, setVideos] = useState<StockVideoItem[]>(CURATED_STOCK_VIDEOS);
  const [savedVideos, setSavedVideos] = useState<StockVideoItem[]>([]);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [customTitleInput, setCustomTitleInput] = useState('');
  const [urlVideoValid, setUrlVideoValid] = useState<boolean | null>(null);
  const [isLoadingBackend, setIsLoadingBackend] = useState(false);

  // Playback & Filter settings
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [colorMood, setColorMood] = useState<'normal' | 'dark' | 'bw' | 'cyber'>('normal');

  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  // Load saved videos from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_VIDEOS_KEY);
      if (stored) setSavedVideos(JSON.parse(stored));
    } catch {}
  }, []);

  // Fetch backend media library video backdrops
  useEffect(() => {
    let isMounted = true;
    const fetchBackendVideos = async () => {
      try {
        setIsLoadingBackend(true);
        const data = await workspaceApi.getMediaLibrary();
        if (isMounted && data?.visualBackdrops?.length) {
          const apiVideos: StockVideoItem[] = data.visualBackdrops
            .filter((b) => Boolean(b.videoUrl))
            .map((b) => ({
              id: `api-vid-${b.id}`,
              title: b.name,
              category: (b.category?.toLowerCase() || 'abstract') as any,
              videoUrl: b.videoUrl!,
              posterUrl: b.imageUrl || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
              duration: '15s Loop',
              resolution: '1080x1920 HD',
            }));

          if (apiVideos.length > 0) {
            setVideos((prev) => {
              const existingUrls = new Set(prev.map((v) => v.videoUrl));
              const newItems = apiVideos.filter((v) => !existingUrls.has(v.videoUrl));
              return [...newItems, ...prev];
            });
          }
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setIsLoadingBackend(false);
      }
    };
    fetchBackendVideos();
    return () => {
      isMounted = false;
    };
  }, []);

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
    setSelectedId(null);
    onSelectVideo(vid.videoUrl);
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'video' }));
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
      posterUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=400&q=80',
      duration: 'Custom',
      resolution: 'Stream HD',
    };

    onSelectVideo(url);
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

  const filteredVideos = sourceList.filter((vid) => {
    const matchesCategory = selectedCategory === 'all' || vid.category === selectedCategory;
    const cleanQuery = searchQuery.trim().replace(/^#/, '').toLowerCase();
    const matchesQuery =
      cleanQuery === '' ||
      vid.title.toLowerCase().includes(cleanQuery) ||
      (vid.tags && vid.tags.some((t) => t.toLowerCase().includes(cleanQuery)));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none overflow-hidden rounded-2xl border border-[#26262B]">
      {/* ── Top Header Bar (Matching Studio Shell) ── */}
      <div className="relative h-11 px-3.5 bg-[#17171A] border-b border-[#26262B] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Film className="w-4 h-4 shrink-0 text-rose-400" />
          <span className="text-xs font-bold text-white truncate">
            Motion Stock Clips
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
      <div className="flex items-center gap-4 sm:gap-5 px-3.5 pt-2 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar shrink-0 bg-[#141417]">
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'catalog'
              ? 'text-white border-white'
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
              ? 'text-white border-white'
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
              ? 'text-white border-white'
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
              ? 'text-white border-white'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5 text-amber-400" />
          <span>Saved ({savedVideos.length})</span>
        </button>
      </div>

      {/* ── Category Filter Chips (In Catalog Mode) ── */}
      {activeTab === 'catalog' && (
        <div className="flex flex-col gap-1.5 border-b border-[#26262B]/60 bg-[#141416] py-2 shrink-0">
          <div className="flex items-center gap-1.5 px-4 overflow-x-auto custom-scrollbar">
            {(
              [
                { id: 'all', label: 'All Loops' },
                { id: 'clouds', label: 'Clouds & Sky' },
                { id: 'gym', label: 'Gym & Iron' },
                { id: 'city', label: 'Cyber City' },
                { id: 'ocean', label: 'Storm Waves' },
                { id: 'fire', label: 'Fire Embers' },
                { id: 'abstract', label: 'Abstract Motion' },
              ] as const
            ).map((cat) => (
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

          {/* Quick Keyword Topics */}
          <div className="flex items-center gap-1 px-4 overflow-x-auto custom-scrollbar pt-0.5">
            {SEARCH_TOPICS.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => setSearchQuery(topic)}
                className="text-[9px] px-2 py-0.5 rounded-full bg-[#1C1C22] text-zinc-400 hover:text-white border border-zinc-800 shrink-0 cursor-pointer transition-colors"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Main Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3.5">
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
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
            ) : filteredVideos.length === 0 ? (
              <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-8 text-center text-xs text-[#A1A1AA]">
                No video clips matching &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              /* Video Grid */
              <div className="grid grid-cols-2 gap-2.5">
                {filteredVideos.map((vid) => {
                  const isHovered = hoveredId === vid.id;
                  const isSelected = selectedId === vid.id || (!selectedId && activeVideoUrl === vid.videoUrl);

                  return (
                    <div
                      key={vid.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleStageVideo(vid)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleStageVideo(vid);
                        }
                      }}
                      onMouseEnter={() => handleMouseEnter(vid.id)}
                      onMouseLeave={() => handleMouseLeave(vid.id)}
                      className={`group relative rounded-xl border overflow-hidden aspect-[9/14] bg-[#1C1C20] transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]/40 shadow-lg'
                          : 'border-[#2A2A30] hover:border-[#3A3A42]'
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
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Overlay Gradients */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

                      {/* Play indicator on hover */}
                      {!isHovered && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/20">
                            <Play className="w-3.5 h-3.5 text-white ml-0.5" fill="white" />
                          </div>
                        </div>
                      )}

                      {/* Video Info Bottom */}
                      <div className="absolute bottom-2 left-2 right-16">
                        <p className="text-[11px] font-bold text-white truncate drop-shadow-md">
                          {vid.title}
                        </p>
                        <p className="text-[9px] text-[#A1A1AA] truncate">{vid.duration}</p>
                      </div>

                      {/* Category Tag */}
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[8px] font-mono-studio text-white/80 border border-white/10 uppercase">
                        {vid.category}
                      </div>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleApply(vid);
                        }}
                        className="absolute bottom-2 right-2 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] px-2 py-1 text-[9px] font-bold text-white"
                      >
                        Apply
                      </button>

                      {/* Delete button for Saved clips */}
                      {activeTab === 'saved' && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSaved(vid.id, e)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors"
                          title="Delete from Saved"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VideoStockPane;
