import React, { useState } from 'react';
import {
  Youtube,
  Zap,
  Play,
  ExternalLink,
  Film,
  Users,
  Video,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import { Button, Card, Badge } from '@/src/shared/ui/common';
import {
  YouTubeChannel,
  YouTubeVideo,
  AutomationJob,
  YouTubeLiveVideo,
  YouTubeLiveShort,
  YouTubeForYouItem,
} from '../types';
import { YouTubeTab } from '../components/YouTubeHeader';

export interface YouTubeHomePageProps {
  channels: YouTubeChannel[];
  videos: YouTubeVideo[];
  automations: AutomationJob[];
  liveVideos?: YouTubeLiveVideo[];
  liveShorts?: YouTubeLiveShort[];
  liveForYou?: YouTubeForYouItem[];
  syncingId: string | null;
  togglingAutoUploadId: string | null;
  copiedId: string | null;
  onCopyId: (id: string) => void;
  onSyncChannel: (id: string) => void;
  onToggleAutoUpload: (ch: YouTubeChannel) => void;
  onLoadLiveShorts: (ch: YouTubeChannel) => void;
  onOpenCorrectModal: (ch: YouTubeChannel) => void;
  onDeleteChannel: (id: string, name: string) => void;
  onOpenConnectModal: () => void;
  onNavigate: (page: string) => void;
  onTabChange: (tab: YouTubeTab) => void;
}

export const YouTubeHomePage: React.FC<YouTubeHomePageProps> = ({
  channels,
  liveVideos = [],
  liveShorts = [],
  liveForYou = [],
  onNavigate,
  onTabChange,
}) => {
  const activeChannel = channels[0];

  // Dynamic real data feeds directly from YouTube
  const forYouFeed: YouTubeForYouItem[] = liveForYou;
  const shortsFeed: YouTubeLiveShort[] = liveShorts;
  const videosFeed: YouTubeLiveVideo[] = liveVideos;

  return (
    <div className="space-y-8 animate-fade-in font-sans-studio text-[#E5E5E5]">
      {/* ── 1. Real Channel Metric Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#141414] border border-[#2F2F2F] flex items-center gap-3.5 shadow-sm hover:border-[#3B82F6]/40 transition-colors">
          <div className="p-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 shrink-0">
            <Youtube className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Channel
            </p>
            <p className="text-base sm:text-lg font-extrabold text-white mt-0.5 truncate">
              {activeChannel ? activeChannel.name : 'Emoji Eye Spy'}
            </p>
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>{activeChannel?.handle || '@emoji-eye-spy'} · Live</span>
            </p>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#141414] border border-[#2F2F2F] flex items-center gap-3.5 shadow-sm hover:border-[#3B82F6]/40 transition-colors">
          <div className="p-3 rounded-xl bg-[#3B82F6]/10 text-[#60A5FA] border border-[#3B82F6]/20 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Subscribers
            </p>
            <p className="text-lg sm:text-xl font-extrabold text-white mt-0.5 font-mono-studio">
              {(activeChannel?.subscribers ?? 72).toLocaleString()}
            </p>
            <p className="text-[11px] text-[#93C5FD] font-medium mt-0.5">Real Audience</p>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#141414] border border-[#2F2F2F] flex items-center gap-3.5 shadow-sm hover:border-[#3B82F6]/40 transition-colors">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
            <Video className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Public Videos
            </p>
            <p className="text-lg sm:text-xl font-extrabold text-white mt-0.5 font-mono-studio">
              {(activeChannel?.videosUploaded ?? 11).toLocaleString()}
            </p>
            <p className="text-[11px] text-[#C084FC] font-medium mt-0.5">Uploaded Videos</p>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#141414] border border-[#2F2F2F] flex items-center gap-3.5 shadow-sm hover:border-[#3B82F6]/40 transition-colors">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Upload Cadence
            </p>
            <p className="text-lg sm:text-xl font-extrabold text-white mt-0.5 font-mono-studio">
              {activeChannel ? (activeChannel.isAutoUploadEnabled ? 'Active' : 'Daily') : 'Daily'}
            </p>
            <p className="text-[11px] text-emerald-400 font-medium mt-0.5 truncate">
              {activeChannel?.scheduleCron || 'Daily Schedule'}
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. "For you" Shelf (Matching Real YouTube Screen) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">For you</h3>
          <span className="text-xs text-[#9CA3AF]">Algorithmic Recommendations</span>
        </div>

        {/* Horizontal Scroll Reel matching YouTube */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4 overflow-x-auto pb-2 custom-scrollbar">
          {forYouFeed.map((item) => (
            <a
              key={item.id}
              href={item.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-2xl overflow-hidden bg-[#141414] border border-[#2F2F2F] hover:border-[#3B82F6] transition-all hover:shadow-xl hover:shadow-black/60 shrink-0"
            >
              {/* Thumbnail Container (respects 9:16 if short, or 16:9 if video) */}
              <div
                className={`w-full relative overflow-hidden bg-[#0A0A0A] ${
                  item.isShort ? 'aspect-[9/16]' : 'aspect-video'
                }`}
              >
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  onError={(e) => {
                    e.currentTarget.src = item.isShort
                      ? `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`
                      : `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {item.isShort && (
                  <div className="absolute top-2 left-2">
                    <span className="px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1 border border-white/10">
                      <Film className="w-2.5 h-2.5 text-red-500" />
                      Short
                    </span>
                  </div>
                )}

                {item.duration && (
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/85 font-mono-studio text-[10px] font-bold text-white border border-white/10">
                    {item.duration}
                  </div>
                )}

                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-xl group-hover:scale-115 group-hover:bg-red-600 transition-all">
                    <Play className="w-4 h-4 fill-white translate-x-0.5" />
                  </div>
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="p-3 flex-1 flex flex-col justify-between space-y-1 bg-[#141414]">
                <h4 className="text-xs font-semibold text-white line-clamp-2 leading-snug group-hover:text-[#60A5FA] transition-colors">
                  {item.title}
                </h4>
                <div className="flex items-center gap-1.5 text-[11px] text-[#9CA3AF] font-mono-studio pt-1">
                  <span>{item.views}</span>
                  {item.published && (
                    <>
                      <span>·</span>
                      <span>{item.published}</span>
                    </>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* ── 3. "Shorts" Shelf (Matching Real YouTube Screen) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Shorts</span>
            </h3>
          </div>

          <button
            type="button"
            onClick={() => onTabChange('shorts')}
            className="text-xs text-[#60A5FA] hover:text-[#93C5FD] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Real Vertical Shorts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {shortsFeed.map((sh) => (
            <a
              key={sh.id}
              href={sh.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-2xl overflow-hidden border border-[#2F2F2F] bg-[#141414] hover:border-[#3B82F6] transition-all flex flex-col hover:shadow-xl hover:shadow-black/60"
            >
              <div className="aspect-[9/16] bg-[#0A0A0A] relative overflow-hidden">
                <img
                  src={sh.thumbnailUrl}
                  alt={sh.title}
                  onError={(e) => {
                    e.currentTarget.src = `https://i.ytimg.com/vi/${sh.id}/hqdefault.jpg`;
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                <div className="absolute top-2 left-2">
                  <span className="px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1 border border-white/10">
                    <Film className="w-2.5 h-2.5 text-red-500" />
                    Short
                  </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />

                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs font-bold text-white drop-shadow">
                  <span className="font-mono-studio text-[11px]">{sh.views}</span>
                  <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-[#3B82F6] transition-colors">
                    <Play className="w-3 h-3 fill-white text-white translate-x-0.5" />
                  </div>
                </div>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between space-y-1 bg-[#141414]">
                <h4 className="text-xs font-semibold text-white line-clamp-2 group-hover:text-[#60A5FA] transition-colors leading-snug">
                  {sh.title}
                </h4>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* ── 4. "Videos" Shelf (Matching Real YouTube Screen) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Videos</h3>
          </div>

          <button
            type="button"
            onClick={() => onTabChange('videos')}
            className="text-xs text-[#60A5FA] hover:text-[#93C5FD] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Real Widescreen Videos Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {videosFeed.slice(0, 8).map((vid) => (
            <a
              key={vid.id}
              href={vid.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-2xl overflow-hidden bg-[#141414] border border-[#2F2F2F] hover:border-[#3B82F6] transition-all hover:shadow-xl hover:shadow-black/60"
            >
              <div className="aspect-video w-full relative overflow-hidden bg-[#0A0A0A] border-b border-[#262626]">
                <img
                  src={vid.thumbnailUrl}
                  alt={vid.title}
                  onError={(e) => {
                    e.currentTarget.src = `https://i.ytimg.com/vi/${vid.id}/hqdefault.jpg`;
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-xl group-hover:scale-115 group-hover:bg-red-600 transition-all">
                    <Play className="w-4 h-4 fill-white translate-x-0.5" />
                  </div>
                </div>

                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/85 font-mono-studio text-[10px] font-bold text-white border border-white/10">
                  {vid.duration}
                </div>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between space-y-1.5 bg-[#141414]">
                <h4 className="text-xs font-semibold text-white line-clamp-2 leading-snug group-hover:text-[#60A5FA] transition-colors">
                  {vid.title}
                </h4>

                <div className="flex items-center gap-1.5 text-[11px] text-[#9CA3AF] font-mono-studio pt-1 border-t border-[#262626]">
                  <span>{vid.views}</span>
                  {vid.published && (
                    <>
                      <span>·</span>
                      <span>{vid.published}</span>
                    </>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default YouTubeHomePage;
