import React, { useEffect } from 'react';
import {
  Youtube,
  RefreshCw,
  Search,
  Film,
  Sparkles,
  Play,
  ExternalLink,
} from 'lucide-react';
import { Button, Card, Badge } from '@/src/shared/ui/common';
import { YouTubeChannel, YouTubeVideo, YouTubeLiveShort } from '../types';
import { YouTubeLoadingState } from '../components/YouTubeLoadingState';

export interface YouTubeShortsPageProps {
  videos?: YouTubeVideo[];
  channels: YouTubeChannel[];
  shortsSearch: string;
  onShortsSearchChange: (search: string) => void;
  selectedChannelForShorts: YouTubeChannel | null;
  liveShorts: YouTubeLiveShort[];
  liveShortsLoading: boolean;
  onLoadLiveShorts: (ch: YouTubeChannel) => void;
  onCloseLiveShorts?: () => void;
  onNavigate: (page: string) => void;
}

export const YouTubeShortsPage: React.FC<YouTubeShortsPageProps> = ({
  channels,
  shortsSearch,
  onShortsSearchChange,
  selectedChannelForShorts,
  liveShorts,
  liveShortsLoading,
  onLoadLiveShorts,
  onNavigate,
}) => {
  const activeChannel = channels[0];
  const channelToDisplay = selectedChannelForShorts || activeChannel;

  // Auto-fetch live shorts on initial mount
  useEffect(() => {
    if (activeChannel && liveShorts.length === 0 && !liveShortsLoading) {
      onLoadLiveShorts(activeChannel);
    }
  }, [activeChannel]);

  const displayedShorts = liveShorts || [];

  const filteredShorts = displayedShorts.filter((sh) => {
    if (!shortsSearch.trim()) return true;
    return sh.title.toLowerCase().includes(shortsSearch.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-fade-in font-sans-studio text-[#E5E5E5]">
      {/* ── Top Bar: Search, Live Feed Refresh, and Studio Create ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-[#141414] border border-[#2F2F2F] shadow-lg">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={shortsSearch}
            onChange={(e) => onShortsSearchChange(e.target.value)}
            placeholder="Search Shorts..."
            className="w-full bg-[#121212] border border-[#2F2F2F] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-[#6B7280] outline-none focus:border-[#3B82F6] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {activeChannel && (
            <Button
              size="sm"
              variant="secondary"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${liveShortsLoading ? 'animate-spin text-[#60A5FA]' : ''}`} />}
              onClick={() => onLoadLiveShorts(activeChannel)}
              disabled={liveShortsLoading}
              className="text-xs"
            >
              {liveShortsLoading ? 'Syncing Feed…' : 'Refresh Feed'}
            </Button>
          )}

          <Button
            size="sm"
            variant="primary"
            icon={<Sparkles className="w-3.5 h-3.5" />}
            onClick={() => onNavigate('workspace')}
            className="text-xs"
          >
            Create New Short
          </Button>
        </div>
      </div>

      {/* ── YouTube Shorts Grid (Authentic 9:16 Shorts Experience) ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 shrink-0">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Shorts</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-semibold">
                  Live from YouTube
                </span>
              </h2>
              <p className="text-xs text-[#9CA3AF]">
                {channelToDisplay
                  ? `Short-form videos from ${channelToDisplay.name} (${channelToDisplay.handle})`
                  : 'Latest published vertical Shorts'}
              </p>
            </div>
          </div>

          <a
            href={
              channelToDisplay?.handle
                ? `https://www.youtube.com/${channelToDisplay.handle}/shorts`
                : 'https://www.youtube.com/@emoji-eye-spy/shorts'
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#60A5FA] hover:text-[#93C5FD] font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>View on YouTube</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {liveShortsLoading ? (
          <YouTubeLoadingState
            title="Fetching live YouTube Shorts feed…"
            description="Connecting to YouTube servers for live video metrics"
          />
        ) : filteredShorts.length === 0 ? (
          <div className="py-16 text-center text-[#9CA3AF] space-y-3 rounded-2xl bg-[#141414] border border-[#2F2F2F]">
            <Film className="w-10 h-10 text-[#6B7280] mx-auto opacity-50" />
            <h4 className="text-sm font-bold text-white">No Shorts Found</h4>
            <p className="text-xs text-[#9CA3AF]">
              {shortsSearch ? 'Try a different search query' : 'No Shorts published yet on this channel'}
            </p>
            <Button size="sm" variant="primary" onClick={() => onNavigate('workspace')}>
              Generate Short in Studio
            </Button>
          </div>
        ) : (
          /* Authentic 9:16 Vertical Video Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {filteredShorts.map((sh) => (
              <a
                key={sh.id}
                href={sh.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative rounded-2xl overflow-hidden border border-[#2F2F2F] bg-[#141414] hover:border-[#3B82F6] transition-all flex flex-col hover:shadow-xl hover:shadow-black/60"
              >
                {/* 9:16 Aspect Ratio Thumbnail Container */}
                <div className="aspect-[9/16] bg-[#121212] relative overflow-hidden">
                  <img
                    src={sh.thumbnailUrl}
                    alt={sh.title}
                    onError={(e) => {
                      e.currentTarget.src = `https://i.ytimg.com/vi/${sh.id}/hqdefault.jpg`;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Top badge */}
                  <div className="absolute top-2 left-2">
                    <span className="px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1 border border-white/10">
                      <Film className="w-2.5 h-2.5 text-red-500" />
                      Short
                    </span>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />

                  {/* Views & Play Icon overlay */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs font-bold text-white drop-shadow">
                    <span className="font-mono-studio text-[11px] tracking-tight">{sh.views}</span>
                    <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-[#3B82F6] transition-colors">
                      <Play className="w-3 h-3 fill-white text-white translate-x-0.5" />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-1.5 bg-[#141414]">
                  <h4 className="text-xs font-semibold text-white line-clamp-2 group-hover:text-[#60A5FA] transition-colors leading-snug">
                    {sh.title}
                  </h4>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubeShortsPage;
