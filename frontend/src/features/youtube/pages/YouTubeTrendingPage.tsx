import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Flame,
  Play,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Loader2,
  Search,
  TrendingUp,
  Zap,
  Target,
  SlidersHorizontal,
  Lightbulb,
  Copy,
  Check,
  Award,
  Bookmark,
  BookmarkCheck,
  Music,
  Share2,
  X,
  Wand2,
  BrainCircuit,
  MessageSquare,
} from 'lucide-react';
import { Button, Card, Badge, Input } from '@/src/shared/ui/common';
import { YouTubeLiveShort } from '../types';
import { youtubeApi } from '../api/youtubeApi';
import { YouTubeVideoDetailsModal } from '../components/YouTubeVideoDetailsModal';

export interface YouTubeTrendingPageProps {
  onPlayShort?: (short: YouTubeLiveShort) => void;
  onNavigate: (page: string) => void;
}

const NICHES = [
  'All Viral',
  'Motivation',
  'Discipline & Focus',
  'Stoic Wisdom',
  'Fitness & Grind',
  'Wealth & Mindset',
];

const VIEW_FILTERS = [
  { id: 'all', label: 'All Views' },
  { id: '1m', label: '1M+ Views', min: 1000000 },
  { id: '500k', label: '500K+ Views', min: 500000 },
  { id: '100k', label: '100K+ Views', min: 100000 },
];

export const YouTubeTrendingPage: React.FC<YouTubeTrendingPageProps> = ({
  onPlayShort,
  onNavigate,
}) => {
  const [trendingShorts, setTrendingShorts] = useState<YouTubeLiveShort[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNiche, setActiveNiche] = useState('All Viral');
  const [viewFilter, setViewFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'views' | 'default'>('views');
  const [selectedShortForModal, setSelectedShortForModal] = useState<YouTubeLiveShort | null>(null);
  const [deconstructedShort, setDeconstructedShort] = useState<YouTubeLiveShort | null>(null);
  const [copiedHookId, setCopiedHookId] = useState<string | null>(null);
  const [copiedRemixIndex, setCopiedRemixIndex] = useState<number | null>(null);

  // Inspiration Vault (Saved bookmarks in localStorage)
  const [savedShorts, setSavedShorts] = useState<YouTubeLiveShort[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('apexmind_saved_shorts');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const toggleSaveShort = (short: YouTubeLiveShort, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSavedShorts((prev) => {
      const exists = prev.some((s) => s.id === short.id);
      const updated = exists
        ? prev.filter((s) => s.id !== short.id)
        : [short, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem('apexmind_saved_shorts', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const isShortSaved = (id: string) => savedShorts.some((s) => s.id === id);

  const fetchTrending = async (query?: string) => {
    setLoading(true);
    try {
      if (query && query.trim()) {
        const res = await youtubeApi.searchVideos(query.trim(), 'short', 30);
        setTrendingShorts(
          res.map((v) => ({
            id: v.id,
            title: v.title,
            views: v.views,
            thumbnailUrl: v.thumbnailUrl,
            videoUrl: v.videoUrl,
            published: v.published || 'Trending on YouTube',
            duration: v.duration,
          }))
        );
      } else {
        const res = await youtubeApi.getTrendingShorts(30);
        setTrendingShorts(res);
      }
    } catch {
      setTrendingShorts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrending();
  }, []);

  const handleNicheChange = (niche: string) => {
    setActiveNiche(niche);
    setSearchQuery('');
    if (niche === 'All Viral') {
      fetchTrending();
    } else if (niche === 'Vault') {
      // Show saved inspiration
    } else {
      fetchTrending(`${niche} motivation shorts`);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setActiveNiche('Custom Search');
    fetchTrending(`${searchQuery.trim()} shorts`);
  };

  // Helper to parse views string into comparable integer
  const parseViews = (viewsStr: string | number): number => {
    if (typeof viewsStr === 'number') return viewsStr;
    const clean = String(viewsStr).toLowerCase().replace(/views?/g, '').trim();
    if (clean.endsWith('m')) return Math.floor(parseFloat(clean) * 1000000);
    if (clean.endsWith('k')) return Math.floor(parseFloat(clean) * 1000);
    return parseInt(clean.replace(/\D/g, '') || '0', 10);
  };

  // Filter & sort
  const displayedShorts = useMemo(() => {
    let list = activeNiche === 'Vault' ? [...savedShorts] : [...trendingShorts];

    // Filter by view count threshold
    const selectedVF = VIEW_FILTERS.find((vf) => vf.id === viewFilter);
    if (selectedVF && selectedVF.min) {
      list = list.filter((s) => parseViews(s.views) >= selectedVF.min!);
    }

    if (sortBy === 'views') {
      list.sort((a, b) => parseViews(b.views) - parseViews(a.views));
    }
    return list;
  }, [trendingShorts, savedShorts, activeNiche, viewFilter, sortBy]);

  const topShort = displayedShorts[0];

  const handleCopyHook = (short: YouTubeLiveShort, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(short.title);
    setCopiedHookId(short.id);
    setTimeout(() => setCopiedHookId(null), 2000);
  };

  // Generate 3 high-retention hook variations based on the short's topic
  const hookVariations = useMemo(() => {
    if (!deconstructedShort) return [];
    const raw = deconstructedShort.title
      .replace(/#\w+/g, '')
      .replace(/[|•-].*$/, '')
      .trim();

    return [
      {
        type: 'Pattern Interrupt Hook',
        text: `Stop scrolling if you want to understand ${raw || 'this rule'}...`,
        rationale: 'Creates an immediate visual & mental brake in the viewer feed.',
      },
      {
        type: 'Curiosity Gap Hook',
        text: `Why 99% of people get ${raw || 'this'} completely wrong:`,
        rationale: 'Triggers FOMO and intellectual challenge.',
      },
      {
        type: 'Direct Challenge Hook',
        text: `Most people can't hear this, but ${raw || 'this is the truth'}.`,
        rationale: 'Elicits emotional engagement and high retention rate.',
      },
    ];
  }, [deconstructedShort]);

  const handleCopyRemix = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedRemixIndex(index);
    setTimeout(() => setCopiedRemixIndex(null), 2000);
  };

  const handleSendToStudio = (short: YouTubeLiveShort) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('apexmind_generator_topic', short.title);
    }
    setDeconstructedShort(null);
    onNavigate('generator');
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans-studio text-[#E5E5E5]">
      {/* ── 1. Top Header Banner ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-[#141414] border border-[#2F2F2F] shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-red-500/10 text-amber-500 border border-amber-500/30 shadow-inner">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Viral Trending Shorts Radar
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                Live Feed
              </span>
            </div>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Live viral formats, hook deconstructions, and audio trends streamed directly from YouTube
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={() => fetchTrending(searchQuery || (activeNiche !== 'All Viral' && activeNiche !== 'Vault' ? `${activeNiche} shorts` : undefined))}
            disabled={loading}
            className="text-xs"
          >
            Refresh Feed
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={<Sparkles className="w-3.5 h-3.5" />}
            onClick={() => onNavigate('generator')}
            className="text-xs"
          >
            Create AI Short
          </Button>
        </div>
      </div>

      {/* ── 2. Trend Intel & Audio Vibe Bar ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#2F2F2F] flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-[#9CA3AF]">Tracking</p>
            <p className="text-sm sm:text-base font-extrabold text-white font-mono-studio">
              {displayedShorts.length} Viral Shorts
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#2F2F2F] flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-[#9CA3AF]">Trending Audio</p>
            <p className="text-sm sm:text-base font-extrabold text-white font-mono-studio">
              Dark Cinema / Phonk
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#2F2F2F] flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-[#9CA3AF]">Top Metric</p>
            <p className="text-sm sm:text-base font-extrabold text-white font-mono-studio">
              {topShort ? topShort.views : 'Live'}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#2F2F2F] flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#3B82F6]/10 text-[#60A5FA] border border-[#3B82F6]/20">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-[#9CA3AF]">Inspiration Vault</p>
            <p className="text-sm sm:text-base font-extrabold text-white font-mono-studio">
              {savedShorts.length} Saved
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. #1 Ranked Viral Spotlight ── */}
      {topShort && !loading && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#171717] via-[#141414] to-[#171717] border border-amber-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* 9:16 Vertical Preview */}
            <div className="md:col-span-3 sm:w-48 aspect-[9/16] rounded-xl overflow-hidden bg-black relative border border-white/10 shadow-2xl group mx-auto md:mx-0">
              <img
                src={topShort.thumbnailUrl}
                alt={topShort.title}
                onError={(e) => {
                  e.currentTarget.src = `https://i.ytimg.com/vi/${topShort.id}/hqdefault.jpg`;
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <button
                type="button"
                onClick={() => setSelectedShortForModal(topShort)}
                className="absolute inset-0 bg-black/30 group-hover:bg-transparent flex items-center justify-center transition-colors cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl group-hover:scale-115 transition-transform">
                  <Play className="w-5 h-5 fill-white translate-x-0.5" />
                </div>
              </button>
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-gray-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow">
                <Award className="w-3 h-3" />
                #1 Top Viral
              </div>
            </div>

            {/* Details & Actions */}
            <div className="md:col-span-9 space-y-3">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  Highest Viewed Short in Feed
                </span>
                <h3 className="text-base sm:text-xl font-black text-white leading-snug">
                  {topShort.title}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[#9CA3AF] font-mono-studio">
                <span className="px-2.5 py-1 rounded-lg bg-[#222222] text-white border border-white/10 font-bold">
                  {topShort.views}
                </span>
                <span>Format: Vertical 9:16</span>
              </div>

              {/* Hook Preview Pill */}
              <div className="p-3 rounded-xl bg-[#1C1C1C] border border-[#2B2B2B] text-xs text-[#A1A1AA] flex items-center justify-between gap-3">
                <p className="line-clamp-1 italic">
                  &ldquo;{topShort.title}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={(e) => handleCopyHook(topShort, e)}
                  className="px-2.5 py-1 rounded-lg bg-[#272727] hover:bg-[#333333] text-white text-[11px] font-semibold transition-all border border-white/10 shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  {copiedHookId === topShort.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Hook Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-[#9CA3AF]" />
                      <span>Copy Hook</span>
                    </>
                  )}
                </button>
              </div>

              {/* Actions Bar */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedShortForModal(topShort)}
                  className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Watch in Studio</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeconstructedShort(topShort)}
                  className="px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-gray-950 text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
                >
                  <Wand2 className="w-3.5 h-3.5 text-gray-950" />
                  <span>Deconstruct Hook &amp; Remix</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => toggleSaveShort(topShort, e)}
                  className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
                    isShortSaved(topShort.id)
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-[#272727] hover:bg-[#333333] text-white border-[#3A3A3A]'
                  }`}
                >
                  {isShortSaved(topShort.id) ? (
                    <>
                      <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Saved</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Save to Vault</span>
                    </>
                  )}
                </button>

                <a
                  href={topShort.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-full bg-[#272727] hover:bg-[#333333] text-[#A1A1AA] hover:text-white text-xs font-semibold transition-all border border-[#3A3A3A] flex items-center gap-1.5"
                >
                  <span>Open YouTube</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Search, Filter Pills & Sorter ── */}
      <div className="space-y-3">
        {/* Niche & Vault Selector */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {NICHES.map((niche) => {
            const isActive = activeNiche === niche;
            return (
              <button
                key={niche}
                type="button"
                onClick={() => handleNicheChange(niche)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-gray-950 shadow-md shadow-amber-500/20 scale-[1.02]'
                    : 'bg-[#181818] text-[#9CA3AF] hover:text-white hover:bg-[#252525] border border-[#2A2A2A]'
                }`}
              >
                {niche}
              </button>
            );
          })}

          {/* Inspiration Vault Filter */}
          <button
            type="button"
            onClick={() => handleNicheChange('Vault')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeNiche === 'Vault'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 scale-[1.02]'
                : 'bg-[#181818] text-[#9CA3AF] hover:text-white hover:bg-[#252525] border border-[#2A2A2A]'
            }`}
          >
            <Bookmark className="w-3 h-3" />
            <span>Inspiration Vault ({savedShorts.length})</span>
          </button>
        </div>

        {/* Search Bar + Views Filter + Sorter */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#141414] border border-[#262626]">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trending Shorts by topic (e.g. 'cold shower discipline', 'stoic morning')..."
              className="w-full pl-10 pr-20 py-2 rounded-xl bg-[#1B1B1B] border border-[#2F2F2F] text-xs text-white placeholder-[#6B7280] outline-none focus:border-amber-500 transition-colors"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-gray-950 text-[11px] font-bold transition-all cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* View count filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-[#1A1A1A] p-1 rounded-xl border border-white/5">
              {VIEW_FILTERS.map((vf) => (
                <button
                  key={vf.id}
                  type="button"
                  onClick={() => setViewFilter(vf.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewFilter === vf.id
                      ? 'bg-white text-gray-950 font-bold shadow-sm'
                      : 'text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  {vf.label}
                </button>
              ))}
            </div>

            {/* Sorter */}
            <div className="flex items-center gap-1 bg-[#1A1A1A] p-1 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setSortBy('views')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  sortBy === 'views'
                    ? 'bg-[#2A2A2A] text-white font-bold'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                Views
              </button>
              <button
                type="button"
                onClick={() => setSortBy('default')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  sortBy === 'default'
                    ? 'bg-[#2A2A2A] text-white font-bold'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                Rank
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Trending Shorts Grid ── */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
          <p className="text-xs text-[#9CA3AF]">Streaming live trending Shorts from YouTube…</p>
        </div>
      ) : displayedShorts.length === 0 ? (
        <div className="py-16 text-center text-xs text-[#6B7280] space-y-2 bg-[#141414] rounded-2xl border border-[#242424]">
          <Flame className="w-8 h-8 text-[#4B5563] mx-auto opacity-50" />
          <p className="text-sm font-semibold text-white">
            {activeNiche === 'Vault' ? 'Your Inspiration Vault is empty' : 'No trending shorts found'}
          </p>
          <p>
            {activeNiche === 'Vault'
              ? 'Click the bookmark icon on any trending Short to save it here for offline reference.'
              : 'Try searching for a different keyword or click "All Viral".'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {displayedShorts.map((short, idx) => {
            const isSaved = isShortSaved(short.id);
            const rank = idx + 1;

            return (
              <div
                key={short.id}
                onClick={() => {
                  setSelectedShortForModal(short);
                  onPlayShort?.(short);
                }}
                className="group relative rounded-2xl overflow-hidden bg-[#181818] border border-[#2A2A2A] hover:border-amber-500/60 shadow-lg transition-all duration-300 flex flex-col aspect-[9/16] hover:shadow-2xl hover:shadow-black cursor-pointer"
              >
                <img
                  src={short.thumbnailUrl}
                  alt={short.title}
                  onError={(e) => {
                    e.currentTarget.src = `https://i.ytimg.com/vi/${short.id}/hqdefault.jpg`;
                  }}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Top Badges */}
                <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10">
                  <span
                    className={`px-2 py-0.5 rounded-md backdrop-blur-md text-[10px] font-mono-studio font-black shadow border ${
                      rank === 1
                        ? 'bg-amber-500 text-gray-950 border-amber-400'
                        : rank === 2
                        ? 'bg-slate-200 text-gray-950 border-white'
                        : rank === 3
                        ? 'bg-amber-700 text-white border-amber-600'
                        : 'bg-black/80 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    #{rank}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => toggleSaveShort(short, e)}
                    title={isSaved ? 'Remove from Vault' : 'Save to Vault'}
                    className={`p-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                      isSaved
                        ? 'bg-amber-500 text-gray-950 scale-110 shadow-md'
                        : 'bg-black/60 text-white hover:bg-white hover:text-gray-950'
                    }`}
                  >
                    <Bookmark className="w-3 h-3 fill-current" />
                  </button>
                </div>

                {/* Hover overlay with interactive controls */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-between p-3 opacity-90 group-hover:opacity-100 transition-opacity">
                  <div />

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-white line-clamp-2 drop-shadow-md group-hover:text-amber-400 transition-colors">
                      {short.title}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-[#D1D5DB] font-mono-studio pt-1 border-t border-white/10">
                      <span className="font-bold text-white">{short.views}</span>

                      <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeconstructedShort(short);
                          }}
                          title="Deconstruct Hook"
                          className="p-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-gray-950 transition-colors cursor-pointer"
                        >
                          <Wand2 className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleCopyHook(short, e)}
                          title="Copy Hook Text"
                          className="p-1.5 rounded-full bg-white/20 hover:bg-white text-white hover:text-black transition-colors cursor-pointer"
                        >
                          {copiedHookId === short.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 6. In-Studio Video Details Modal (createPortal) ── */}
      <YouTubeVideoDetailsModal
        isOpen={Boolean(selectedShortForModal)}
        video={selectedShortForModal}
        onClose={() => setSelectedShortForModal(null)}
        title="Trending Short Studio Player"
      />

      {/* ── 7. Hook Deconstructor & AI Remix Drawer (createPortal) ── */}
      {deconstructedShort &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
            onClick={() => setDeconstructedShort(null)}
          >
            <div
              className="bg-[#181818] border border-[#2F2F2F] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-scale-up text-[#E5E5E5] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <BrainCircuit className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Viral Hook Deconstruction &amp; AI Remix
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDeconstructedShort(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#9CA3AF] hover:text-white hover:bg-[#282828] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar">
                {/* Original Short Reference */}
                <div className="p-3.5 rounded-xl bg-[#141414] border border-[#2B2B2B] flex items-start gap-3">
                  <img
                    src={deconstructedShort.thumbnailUrl}
                    alt=""
                    className="w-12 aspect-[9/16] rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-amber-400">
                      Target Viral Short
                    </span>
                    <h4 className="text-xs font-bold text-white line-clamp-2 mt-0.5">
                      {deconstructedShort.title}
                    </h4>
                    <p className="text-[11px] text-[#9CA3AF] font-mono-studio mt-1">
                      {deconstructedShort.views}
                    </p>
                  </div>
                </div>

                {/* Deconstructed Trigger */}
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Viral Psychological Trigger</span>
                  </div>
                  <p className="text-xs text-[#E5E5E5] leading-relaxed">
                    Uses an immediate <strong>Pattern Interrupt</strong> combined with a high-stakes
                    negative consequence claim that stops infinite feed scrolling within the first 1.2
                    seconds.
                  </p>
                </div>

                {/* 3 AI Remix Hooks */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">
                    3 AI Remixed High-Retention Hooks
                  </h4>

                  {hookVariations.map((v, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-[#141414] border border-[#2B2B2B] hover:border-amber-500/40 transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-amber-400">
                          {v.type}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyRemix(v.text, i)}
                          className="px-2 py-0.5 rounded-md bg-[#222222] hover:bg-[#2A2A2A] text-[11px] text-[#E5E5E5] flex items-center gap-1 transition-all cursor-pointer border border-white/5"
                        >
                          {copiedRemixIndex === i ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-[#9CA3AF]" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs font-semibold text-white leading-relaxed">
                        &ldquo;{v.text}&rdquo;
                      </p>
                      <p className="text-[11px] text-[#888888]">{v.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[#2A2A2A] flex items-center justify-between gap-3 bg-[#141414]">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setDeconstructedShort(null)}
                >
                  Close
                </Button>

                <Button
                  size="sm"
                  variant="primary"
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                  onClick={() => handleSendToStudio(deconstructedShort)}
                >
                  Generate Script with this Hook
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default YouTubeTrendingPage;
