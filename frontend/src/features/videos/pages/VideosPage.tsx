import React, { useState, useEffect, useCallback } from 'react';
import {
  Film,
  RefreshCw,
  Plus,
  Grid3X3,
  List,
  Search,
  X,
  SlidersHorizontal,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { Button, Card } from '@/src/shared/ui/common';
import { WebsiteVideo, VideoFilterState } from '../types';
import { videosApi } from '../api/videosApi';
import { VideoCard } from '../components/VideoCard';
import { VideoPlayerModal } from '../components/VideoPlayerModal';
import { VideoMetricsBar } from '../components/VideoMetricsBar';

const CATEGORIES = [
  'All',
  'Stoic Mindset & Discipline',
  'Fitness & Iron Will',
  'Deep Focus & Flow',
  'Calm & Resilience',
  'Unstoppable Motivation',
];

const SORT_OPTIONS: { label: string; value: VideoFilterState['sortBy'] }[] = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Title A–Z', value: 'title' },
  { label: 'Duration', value: 'duration' },
];

export default function VideosPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [videos, setVideos] = useState<WebsiteVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<WebsiteVideo | null>(null);
  const [filter, setFilter] = useState<VideoFilterState>({
    search: '',
    category: 'All',
    aspectRatio: 'all',
    sortBy: 'newest',
    viewMode: 'grid',
  });
  const [showSortMenu, setShowSortMenu] = useState(false);

  const loadVideos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await videosApi.getVideos({
        category: filter.category !== 'All' ? filter.category : undefined,
        search: filter.search || undefined,
      });
      setVideos(data);
    } catch (err) {
      console.error('Failed to load website videos:', err);
    } finally {
      setLoading(false);
    }
  }, [filter.category, filter.search]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const handleDelete = async (videoId: string) => {
    try {
      await videosApi.deleteVideo(videoId);
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
      if (selectedVideo?.id === videoId) {
        setSelectedVideo(null);
      }
    } catch (err) {
      console.error('Failed to delete video:', err);
    }
  };

  const handleEditInStudio = (video: WebsiteVideo) => {
    onNavigate('workspace');
  };

  const sortedVideos = [...videos].sort((a, b) => {
    switch (filter.sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      case 'duration':
        return (a.duration || '').localeCompare(b.duration || '');
      default:
        return 0;
    }
  });

  return (
    <div className="w-full space-y-7">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2A2A2A]">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-[#3B82F6] to-[#6366F1] text-white shadow-lg">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Website Video Library
            </h1>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              All videos created by ApexMind AI Studio — not YouTube uploads
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={loadVideos}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => onNavigate('workspace')}
          >
            Create New Video
          </Button>
        </div>
      </div>

      {/* ── Metrics Bar ── */}
      <VideoMetricsBar videos={videos} />

      {/* ── Toolbar: Search + Category Filter + View Mode ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 min-w-0 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666] pointer-events-none" />
          <input
            type="text"
            value={filter.search}
            onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search by title, quote, voice..."
            className="w-full pl-9 pr-8 py-2 rounded-xl text-sm text-white bg-[#141414] border border-[#2A2A2A] focus:border-[#3B82F6]/60 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/30 placeholder-[#4A4A4A] transition-all"
          />
          {filter.search && (
            <button
              onClick={() => setFilter((f) => ({ ...f, search: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Category Chip Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter((f) => ({ ...f, category: cat }))}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                  filter.category === cat
                    ? 'bg-[#3B82F6]/20 text-[#60A5FA] border-[#3B82F6]/50'
                    : 'bg-[#161616] text-[#9CA3AF] border-[#2A2A2A] hover:text-white hover:border-[#3A3A3A]'
                }`}
              >
                {cat === 'All' ? 'All Videos' : cat.split('&')[0].trim()}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#161616] text-[#9CA3AF] hover:text-white text-xs font-semibold border border-[#2A2A2A] hover:border-[#3A3A3A] transition-all cursor-pointer whitespace-nowrap"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {SORT_OPTIONS.find((s) => s.value === filter.sortBy)?.label || 'Sort'}
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-[#171717] border border-[#2D2D2D] rounded-xl shadow-2xl z-30 overflow-hidden">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setFilter((f) => ({ ...f, sortBy: opt.value }));
                      setShowSortMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
                      filter.sortBy === opt.value
                        ? 'text-[#60A5FA] bg-[#3B82F6]/10'
                        : 'text-[#9CA3AF] hover:text-white hover:bg-[#1F1F1F]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-0.5 bg-[#161616] p-0.5 rounded-xl border border-[#2A2A2A]">
            <button
              onClick={() => setFilter((f) => ({ ...f, viewMode: 'grid' }))}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                filter.viewMode === 'grid'
                  ? 'bg-[#3B82F6]/20 text-[#60A5FA]'
                  : 'text-[#6B7280] hover:text-white'
              }`}
              title="Grid View"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setFilter((f) => ({ ...f, viewMode: 'list' }))}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                filter.viewMode === 'list'
                  ? 'bg-[#3B82F6]/20 text-[#60A5FA]'
                  : 'text-[#6B7280] hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Video Grid / List ── */}
      {loading ? (
        <div className="flex items-center justify-center py-24 gap-3 text-[#9CA3AF]">
          <RefreshCw className="w-5 h-5 animate-spin text-[#3B82F6]" />
          <span className="text-sm">Loading your studio videos...</span>
        </div>
      ) : sortedVideos.length === 0 ? (
        <Card className="py-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-2xl bg-[#3B82F6]/10 text-[#60A5FA]">
              <Film className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-bold text-white">
                {filter.search || filter.category !== 'All'
                  ? 'No videos match your filters'
                  : 'No website videos created yet'}
              </p>
              <p className="text-xs text-[#9CA3AF] mt-1 max-w-xs mx-auto">
                {filter.search || filter.category !== 'All'
                  ? 'Try adjusting your search or clearing the category filter.'
                  : 'Create your first AI motivational video from the Studio to see it here.'}
              </p>
            </div>
            {filter.search || filter.category !== 'All' ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setFilter((f) => ({ ...f, search: '', category: 'All' }))}
              >
                Clear Filters
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                icon={<Sparkles className="w-4 h-4" />}
                onClick={() => onNavigate('workspace')}
              >
                Open AI Studio
              </Button>
            )}
          </div>
        </Card>
      ) : filter.viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {sortedVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              viewMode="grid"
              onPlay={setSelectedVideo}
              onEditInStudio={handleEditInStudio}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              viewMode="list"
              onPlay={setSelectedVideo}
              onEditInStudio={handleEditInStudio}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ── Result Count ── */}
      {!loading && sortedVideos.length > 0 && (
        <p className="text-center text-xs text-[#6B7280] pt-2">
          Showing {sortedVideos.length} website-created video{sortedVideos.length !== 1 ? 's' : ''}
          {filter.search && ` matching "${filter.search}"`}
          {filter.category !== 'All' && ` in "${filter.category.split('&')[0].trim()}"`}
        </p>
      )}

      {/* ── Video Player Modal ── */}
      {selectedVideo && (
        <VideoPlayerModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onEditInStudio={(v) => {
            setSelectedVideo(null);
            handleEditInStudio(v);
          }}
          onDelete={(id) => {
            handleDelete(id);
            setSelectedVideo(null);
          }}
        />
      )}
    </div>
  );
}
