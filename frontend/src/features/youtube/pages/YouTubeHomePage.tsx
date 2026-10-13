import React from 'react';
import {
  Youtube,
  Zap,
  Play,
  Film,
  Users,
  Video,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import {
  YouTubeChannel,
  YouTubeVideo,
  AutomationJob,
  YouTubeLiveVideo,
  YouTubeLiveShort,
  YouTubeForYouItem,
} from '../types';
import { YouTubeTab } from '../components/YouTubeHeader';
import { YouTubeLoadingState } from '../components/YouTubeLoadingState';

export interface YouTubeHomePageProps {
  channels: YouTubeChannel[];
  videos: YouTubeVideo[];
  automations: AutomationJob[];
  liveVideos?: YouTubeLiveVideo[];
  liveShorts?: YouTubeLiveShort[];
  liveForYou?: YouTubeForYouItem[];
  feedLoading?: boolean;
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
  feedLoading = false,
  onOpenConnectModal,
  onNavigate,
  onTabChange,
}) => {
  const activeChannel = channels[0];

  if (!activeChannel) {
    return (
      <div className="py-16 px-4 text-center rounded-2xl bg-[#141414] border border-[#262626] text-[#9CA3AF] space-y-3">
        <Youtube className="w-10 h-10 text-[#6B7280] mx-auto opacity-50" />
        <h3 className="text-sm font-bold text-white">
          {feedLoading ? 'Loading YouTube channel…' : 'No YouTube channel connected'}
        </h3>
        {feedLoading ? (
          <YouTubeLoadingState
            title="Loading YouTube channel…"
            description="Checking for connected channels and published content"
          />
        ) : (
          <>
            <p className="text-xs text-[#9CA3AF]">
              Connect a channel to see its videos, Shorts, and live metrics here.
            </p>
            <button
              type="button"
              onClick={onOpenConnectModal}
              className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-sm font-semibold text-white transition-colors"
            >
              Connect YouTube channel
            </button>
          </>
        )}
      </div>
    );
  }

  // Dynamic real data feeds directly from YouTube
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

      {/* ── 2. "Shorts" Shelf (Matching Real YouTube Screen) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Shorts</span>
              {feedLoading && shortsFeed.length === 0 && (
                <span className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/25 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin text-red-400" />
                  Loading...
                </span>
              )}
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

        {/* Loading State matching YouTube style */}
        {feedLoading ? (
          <YouTubeLoadingState
            title="Fetching live YouTube Shorts feed…"
            description="Connecting to YouTube servers for live video metrics"
          />
        ) : shortsFeed.length === 0 ? (
          <div className="py-10 px-4 text-center rounded-2xl bg-[#141414] border border-[#262626] text-[#9CA3AF] space-y-2">
            <Film className="w-8 h-8 text-[#6B7280] mx-auto opacity-50" />
            <p className="text-sm font-semibold text-white">No Shorts available yet</p>
            <p className="text-xs text-[#9CA3AF]">
              Vertical Shorts from {activeChannel ? activeChannel.name : 'your channel'} will appear here once live on YouTube.
            </p>
          </div>
        ) : (
          /* Real Vertical Shorts Grid */
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

                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-xl group-hover:scale-115 group-hover:bg-red-600 transition-all">
                      <Play className="w-4 h-4 fill-white translate-x-0.5" />
                    </div>
                  </div>
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between space-y-1 bg-[#141414]">
                  <h4 className="text-xs font-semibold text-white line-clamp-2 leading-snug group-hover:text-[#60A5FA] transition-colors">
                    {sh.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#9CA3AF] font-mono-studio pt-1">
                    <span>{sh.views}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* ── 3. "Videos" Shelf (Matching Real YouTube Screen) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Videos</span>
              {feedLoading && videosFeed.length === 0 && (
                <span className="text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/25 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                  Loading...
                </span>
              )}
            </h3>
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

        {/* Loading State matching YouTube style */}
        {feedLoading ? (
          <YouTubeLoadingState
            title="Fetching live YouTube video catalog…"
            description="Connecting to YouTube servers for live video metrics"
          />
        ) : videosFeed.length === 0 ? (
          <div className="py-10 px-4 text-center rounded-2xl bg-[#141414] border border-[#262626] text-[#9CA3AF] space-y-2">
            <Video className="w-8 h-8 text-[#6B7280] mx-auto opacity-50" />
            <p className="text-sm font-semibold text-white">No published videos found</p>
            <p className="text-xs text-[#9CA3AF]">
              Published long-form videos and brain teaser quizzes will appear here.
            </p>
          </div>
        ) : (
          /* Real Widescreen Videos Grid */
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
        )}
      </div>
    </div>
  );
};

export default YouTubeHomePage;
