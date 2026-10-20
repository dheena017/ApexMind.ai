import React, { useState } from 'react';
import {
  Film,
  Play,
  ArrowRight,
  Sparkles,
  Clock,
  Layers,
  Wand2,
} from 'lucide-react';
import { WebsiteVideo } from '@/src/features/videos/types';
import { VideoPlayerModal } from '@/src/features/videos/components/VideoPlayerModal';
import { Button } from '@/src/shared/ui/common';
import { buildRouteUrl } from '@/src/app/routes';

interface RecentVideosSectionProps {
  videos: WebsiteVideo[];
  onNavigate: (page: string) => void;
}

export const RecentVideosSection: React.FC<RecentVideosSectionProps> = ({
  videos,
  onNavigate,
}) => {
  const [playingVideo, setPlayingVideo] = useState<WebsiteVideo | null>(null);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/15 border border-[#3B82F6]/30 flex items-center justify-center text-[#60A5FA]">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Recent Studio Productions
            </h2>
            <p className="text-xs text-[#8E8E93]">
              Your rendered YouTube Shorts and website video assets
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('videos')}
          className="text-xs font-semibold text-[#60A5FA] hover:text-[#93C5FD] flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>All Videos ({videos.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Videos List / Grid */}
      {videos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#2B2B2B] bg-[#121212] p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-[#2F2F2F] flex items-center justify-center mx-auto text-[#737373]">
            <Film className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">No videos generated yet</h3>
            <p className="text-xs text-[#7A7A7A] max-w-sm mx-auto">
              Jump into the AI Video Studio to craft your first motivational YouTube Short with custom voiceover and subtitles.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<Wand2 className="w-3.5 h-3.5" />}
            onClick={() => onNavigate('workspace')}
          >
            Create Your First Video
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {videos.slice(0, 6).map((video) => (
            <div
              key={video.id}
              className="group relative overflow-hidden rounded-2xl bg-[#141414] border border-[#262626] hover:border-[#3B82F6]/50 transition-all duration-300 hover:shadow-xl flex flex-col"
            >
              {/* Media Thumbnail Container */}
              <div className="relative aspect-video w-full bg-[#1A1A1A] overflow-hidden">
                {video.coverImageUrl ? (
                  <img
                    src={video.coverImageUrl.startsWith('/api/') ? `${((import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '')}${video.coverImageUrl}` : video.coverImageUrl}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1A1A1A] to-[#0E0E0E]">
                    <Film className="w-8 h-8 text-[#444444]" />
                  </div>
                )}

                {/* Play Overlay Button */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPlayingVideo(video)}
                    className="w-10 h-10 rounded-full bg-[#3B82F6] hover:bg-[#2563EB] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer"
                    title="Watch preview"
                  >
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  </button>
                </div>

                {/* Aspect Ratio & Duration Badges */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/70 backdrop-blur-md text-white border border-white/10">
                    {video.aspectRatio || '9:16'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/70 backdrop-blur-md text-[#E0E0E0] border border-white/10 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-[#60A5FA]" />
                    {video.duration || '00:30'}
                  </span>
                </div>

                <div className="absolute top-2 right-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-md uppercase tracking-wider">
                    {video.status || 'ready'}
                  </span>
                </div>
              </div>

              {/* Video Info Card Body */}
              <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-[#60A5FA] uppercase tracking-wider">
                    {video.category || 'Motivation'}
                  </div>
                  <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-[#60A5FA] transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-xs text-[#8A8A8A] line-clamp-2 italic">
                    "{video.quote}"
                  </p>
                </div>

                <div className="pt-2.5 border-t border-[#222222] flex items-center justify-between text-[11px] text-[#737373]">
                  <span>Voice: {video.voice || 'Fenrir'}</span>
                  <button
                    type="button"
                    onClick={() => onNavigate(buildRouteUrl('workspace', { tab: 'editor', videoId: video.id }))}
                    className="text-[#60A5FA] hover:text-white font-semibold transition-colors cursor-pointer"
                  >
                    Edit Studio
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Player Modal */}
      {playingVideo && (
        <VideoPlayerModal
          video={playingVideo}
          onClose={() => setPlayingVideo(null)}
          onEditInStudio={() => {
            const vidId = playingVideo.id;
            setPlayingVideo(null);
            onNavigate(buildRouteUrl('workspace', { tab: 'editor', videoId: vidId }));
          }}
          onDelete={() => {
            setPlayingVideo(null);
            onNavigate(buildRouteUrl('videos', { filter: 'recent' }));
          }}
        />
      )}
    </div>
  );
};
