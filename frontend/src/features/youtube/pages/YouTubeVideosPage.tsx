import React, { useState } from 'react';
import {
  Video,
  Play,
  Search,
  Youtube,
  ExternalLink,
  Sparkles,
  Eye,
  ThumbsUp,
  Share2,
  Check,
} from 'lucide-react';
import { Card, Badge, Button, Modal } from '@/src/shared/ui/common';
import { YouTubeChannel, YouTubeVideo, YouTubeLiveVideo } from '../types';

export interface YouTubeVideosPageProps {
  channels: YouTubeChannel[];
  videos: YouTubeVideo[];
  liveVideos?: YouTubeLiveVideo[];
  onNavigate: (page: string) => void;
}

export const YouTubeVideosPage: React.FC<YouTubeVideosPageProps> = ({
  channels,
  liveVideos = [],
  onNavigate,
}) => {
  const activeChannel = channels[0];
  const [search, setSearch] = useState('');
  const [activeSort, setActiveSort] = useState<'latest' | 'popular' | 'oldest'>('latest');
  const [selectedVideo, setSelectedVideo] = useState<YouTubeLiveVideo | null>(null);
  const [copiedVideoId, setCopiedVideoId] = useState<string | null>(null);

  const videoCatalog: YouTubeLiveVideo[] = liveVideos;

  const filteredVideos = videoCatalog
    .filter(
      (v) =>
        v.title.toLowerCase().includes(search.toLowerCase()) ||
        (v.category && v.category.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (activeSort === 'popular') {
        const aNum = parseInt(a.views.replace(/\D/g, '') || '0', 10);
        const bNum = parseInt(b.views.replace(/\D/g, '') || '0', 10);
        return bNum - aNum;
      }
      return 0;
    });

  const handleCopyLink = (vid: YouTubeLiveVideo) => {
    navigator.clipboard.writeText(vid.videoUrl);
    setCopiedVideoId(vid.id);
    setTimeout(() => setCopiedVideoId(null), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans-studio text-[#E5E5E5]">
      {/* ── Top Bar: Search, Sorting, and Studio Action ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#141414] border border-[#2F2F2F] shadow-lg">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search channel videos and quizzes..."
            className="w-full bg-[#121212] border border-[#2F2F2F] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-[#6B7280] outline-none focus:border-[#3B82F6] transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#121212] border border-[#2F2F2F]">
            {(['latest', 'popular', 'oldest'] as const).map((sort) => (
              <button
                key={sort}
                type="button"
                onClick={() => setActiveSort(sort)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  activeSort === sort
                    ? 'bg-[#3B82F6]/20 border border-[#3B82F6]/40 text-[#60A5FA]'
                    : 'text-[#9CA3AF] hover:text-white border border-transparent'
                }`}
              >
                {sort}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="primary"
            icon={<Sparkles className="w-3.5 h-3.5" />}
            onClick={() => onNavigate('workspace')}
            className="text-xs"
          >
            Create Video
          </Button>
        </div>
      </div>

      {/* ── Channel Videos Grid ── */}
      <Card className="bg-[#141414] border-[#2F2F2F] p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#262626]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Channel Videos</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-semibold">
                  Live from YouTube
                </span>
              </h3>
              <p className="text-xs text-[#9CA3AF]">
                {activeChannel
                  ? `Published long-form videos and brain teaser quizzes for ${activeChannel.name}`
                  : 'Published channel videos from YouTube'}
              </p>
            </div>
          </div>
          <Badge variant="blue">{filteredVideos.length} Videos Available</Badge>
        </div>

        {filteredVideos.length === 0 ? (
          <div className="py-16 text-center text-[#9CA3AF] space-y-3">
            <Video className="w-10 h-10 text-[#6B7280] mx-auto opacity-50" />
            <h4 className="text-sm font-bold text-white">No Videos Found</h4>
            <p className="text-xs text-[#9CA3AF]">
              {search ? 'No videos match your search query.' : 'No videos published on this channel.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                onClick={() => setSelectedVideo(video)}
                className="rounded-2xl bg-[#121212] border border-[#2F2F2F] overflow-hidden hover:border-[#3B82F6] transition-all flex flex-col justify-between group cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-black/60"
              >
                {/* 16:9 Thumbnail Image */}
                <div className="aspect-video w-full relative overflow-hidden bg-[#0A0A0A] border-b border-[#262626]">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    onError={(e) => {
                      e.currentTarget.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-2xl group-hover:scale-115 group-hover:bg-red-600 transition-all">
                      <Play className="w-5 h-5 fill-white text-white translate-x-0.5" />
                    </div>
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-xs border border-white/10 text-[11px] font-mono-studio font-bold text-white shadow">
                    {video.duration}
                  </div>
                </div>

                {/* Video Info Body */}
                <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                  <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-[#60A5FA] transition-colors">
                    {video.title}
                  </h4>

                  <div className="pt-2 border-t border-[#262626] flex items-center justify-between text-xs text-[#9CA3AF]">
                    <div className="flex items-center gap-2 font-mono-studio text-[11px]">
                      <span className="text-white font-medium">{video.views}</span>
                      <span>·</span>
                      <span>{video.published}</span>
                    </div>

                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-[#60A5FA] hover:text-[#93C5FD] flex items-center gap-1 transition-colors"
                    >
                      <span>Play</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Video Details Modal */}
      {selectedVideo && (
        <Modal
          isOpen={Boolean(selectedVideo)}
          onClose={() => setSelectedVideo(null)}
          title="Video Details"
        >
          <div className="space-y-4 text-sm text-[#E5E5E5]">
            <div className="aspect-video w-full rounded-2xl overflow-hidden relative bg-black border border-[#2F2F2F]">
              <img
                src={selectedVideo.thumbnailUrl}
                alt={selectedVideo.title}
                onError={(e) => {
                  e.currentTarget.src = `https://i.ytimg.com/vi/${selectedVideo.id}/hqdefault.jpg`;
                }}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <a
                  href={selectedVideo.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-2xl transition-transform hover:scale-110"
                >
                  <Play className="w-7 h-7 fill-white translate-x-0.5" />
                </a>
              </div>
              <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-black/85 text-xs font-mono-studio font-bold text-white">
                {selectedVideo.duration}
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-bold text-white">{selectedVideo.title}</h3>
              <p className="text-xs text-[#9CA3AF] font-mono-studio">
                {selectedVideo.views} · {selectedVideo.published}
              </p>
            </div>

            <div className="pt-3 border-t border-[#2F2F2F] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <a
                  href={selectedVideo.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-lg shadow-red-600/20"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Watch on YouTube</span>
                </a>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopyLink(selectedVideo)}
                  icon={
                    copiedVideoId === selectedVideo.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5" />
                    )
                  }
                  className="text-xs"
                >
                  {copiedVideoId === selectedVideo.id ? 'Copied Link' : 'Share Video'}
                </Button>
              </div>

              <Button variant="secondary" size="sm" onClick={() => setSelectedVideo(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default YouTubeVideosPage;
