import React, { useMemo } from 'react';
import {
  Youtube,
  Zap,
  Play,
  Film,
  Users,
  Video,
  ChevronRight,
  Loader2,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Target,
  Flame,
  ListVideo,
  BarChart2,
  ArrowUpRight,
} from 'lucide-react';
import {
  YouTubeChannel,
  YouTubeVideo,
  AutomationJob,
  YouTubeLiveVideo,
  YouTubeLiveShort,
  YouTubeForYouItem,
  YouTubePlaylist,
} from '../types';
import { YouTubeTab } from '../components/YouTubeHeader';
import { YouTubeLoadingState } from '../components/YouTubeLoadingState';
import { Button } from '@/src/shared/ui/common';
import { YouTubeIcon } from '../components/YouTubeIcon';

export interface YouTubeHomePageProps {
  channels: YouTubeChannel[];
  videos?: YouTubeVideo[];
  automations?: AutomationJob[];
  liveVideos?: YouTubeLiveVideo[];
  liveShorts?: YouTubeLiveShort[];
  liveForYou?: YouTubeForYouItem[];
  playlists?: YouTubePlaylist[];
  feedLoading?: boolean;
  syncingId?: string | null;
  togglingAutoUploadId?: string | null;
  copiedId?: string | null;
  onCopyId?: (id: string) => void;
  onSyncChannel?: (id: string) => void;
  onToggleAutoUpload?: (ch: YouTubeChannel) => void;
  onLoadLiveShorts?: (ch: YouTubeChannel) => void;
  onOpenCorrectModal?: (ch: YouTubeChannel) => void;
  onDisconnectChannel?: (id: string, name: string) => void;
  onDeleteChannel?: (id: string, name: string) => void;
  onOpenConnectModal?: () => void;
  onNavigate: (page: string) => void;
  onTabChange: (tab: YouTubeTab) => void;
}

export const YouTubeHomePage: React.FC<YouTubeHomePageProps> = ({
  channels,
  liveVideos = [],
  liveShorts = [],
  playlists = [],
  feedLoading = false,
  onOpenConnectModal,
  onNavigate,
  onTabChange,
}) => {
  const activeChannel = channels[0];
  const shortsFeed: YouTubeLiveShort[] = liveShorts;
  const videosFeed: YouTubeLiveVideo[] = liveVideos;
  const latestVideo = videosFeed[0];

  // Dynamic metrics calculated purely from live channel data
  const metrics = useMemo(() => {
    const subs = activeChannel?.subscribers ?? 0;

    // Calculate milestone goal (e.g. 100, 500, 1000, 5000, 10000, 50000, 100000...)
    const milestones = [100, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 500000, 1000000];
    const nextMilestone = milestones.find((m) => m > subs) || (subs + 1000);
    const progressPercent = Math.min(100, Math.max(5, Math.round((subs / nextMilestone) * 100)));

    // Total content items count from live feeds
    const totalVideos = activeChannel?.videosUploaded ?? (videosFeed.length + shortsFeed.length);

    return {
      subs,
      nextMilestone,
      progressPercent,
      totalVideos,
      totalShorts: shortsFeed.length,
      totalLongForm: videosFeed.length,
      totalPlaylists: playlists.length,
    };
  }, [activeChannel, videosFeed, shortsFeed, playlists]);

  return (
    <div className="space-y-8 animate-fade-in font-sans-studio text-[#E5E5E5]">
      {/* ── 1. Live Channel Metric Strip ── */}
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
              {activeChannel ? activeChannel.name : 'No Channel Connected'}
            </p>
            {activeChannel ? (
              <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span>{activeChannel.handle} · Live</span>
              </p>
            ) : (
              <p className="text-[11px] text-zinc-400 font-medium flex items-center gap-1.5 mt-0.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0" />
                <span>Disconnected</span>
              </p>
            )}
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
              {metrics.subs.toLocaleString()}
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
              {metrics.totalVideos.toLocaleString()}
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
              {activeChannel ? (activeChannel.isAutoUploadEnabled ? 'Active' : 'Manual') : '—'}
            </p>
            <p className="text-[11px] text-emerald-400 font-medium mt-0.5 truncate">
              {activeChannel?.scheduleCron || (activeChannel ? 'On demand' : 'No schedule')}
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. Real Milestone & Channel Health Tracker ── */}
      {activeChannel && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#141414] via-[#181818] to-[#141414] border border-[#2B2B2B] shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Subscriber Milestone Goal</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Next: {metrics.nextMilestone.toLocaleString()} Subs
                  </span>
                </h4>
                <p className="text-xs text-[#9CA3AF]">
                  Currently at {metrics.subs.toLocaleString()} subscribers ({metrics.progressPercent}% of goal)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onTabChange('analytics')}
                className="px-3 py-1.5 rounded-xl bg-[#202020] hover:bg-[#2A2A2A] text-white text-xs font-semibold transition-all border border-[#333333] flex items-center gap-1.5 cursor-pointer"
              >
                <BarChart2 className="w-3.5 h-3.5 text-[#60A5FA]" />
                <span>Audience Analytics</span>
              </button>
            </div>
          </div>

          {/* Progress Track */}
          <div className="space-y-1.5">
            <div className="w-full h-2 rounded-full bg-[#202020] overflow-hidden p-0.5 border border-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${metrics.progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#9CA3AF] font-mono-studio">
              <span>{metrics.subs.toLocaleString()} subs</span>
              <span>{Math.max(0, metrics.nextMilestone - metrics.subs).toLocaleString()} subs needed to level up</span>
              <span>{metrics.nextMilestone.toLocaleString()} subs</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Latest Published Upload Spotlight ── */}
      {latestVideo && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
                <Youtube className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Latest Channel Upload</span>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              </h3>
            </div>
            <a
              href={latestVideo.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#60A5FA] hover:text-[#93C5FD] font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Watch on YouTube</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-[#2F2F2F] hover:border-[#3B82F6]/50 transition-all shadow-md grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Widescreen Preview */}
            <div className="md:col-span-5 relative rounded-xl overflow-hidden aspect-video bg-[#0A0A0A] border border-[#262626] group">
              <img
                src={latestVideo.thumbnailUrl}
                alt={latestVideo.title}
                onError={(e) => {
                  e.currentTarget.src = `https://i.ytimg.com/vi/${latestVideo.id}/hqdefault.jpg`;
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <a
                href={latestVideo.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 bg-black/30 group-hover:bg-transparent flex items-center justify-center transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 fill-white translate-x-0.5" />
                </div>
              </a>
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/85 text-[11px] font-mono-studio font-bold text-white border border-white/10">
                {latestVideo.duration}
              </div>
            </div>

            {/* Video Details & Quick Actions */}
            <div className="md:col-span-7 space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md">
                  Most Recent
                </span>
                <h4 className="text-base sm:text-lg font-bold text-white line-clamp-2 leading-snug">
                  {latestVideo.title}
                </h4>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[#9CA3AF] font-mono-studio">
                <span className="px-2 py-1 rounded-lg bg-[#1E1E1E] text-white border border-white/5 font-semibold">
                  {latestVideo.views}
                </span>
                {latestVideo.published && (
                  <span>Published {latestVideo.published}</span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                  onClick={() => onTabChange('seo')}
                >
                  Inspect SEO &amp; Tags
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                  onClick={() => onTabChange('analytics')}
                >
                  View Analytics
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Creator Studio Launchpad (Fast Actions) ── */}
      <div className="space-y-3">
        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight px-1 flex items-center gap-2">
          <span>Creator Studio Launchpad</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => onNavigate('generator')}
            className="p-4 rounded-2xl bg-[#141414] hover:bg-[#1A1A1A] border border-[#2F2F2F] hover:border-red-500/50 transition-all text-left group shadow-sm cursor-pointer space-y-2.5"
          >
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 w-fit group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                  Create AI Short
                </h4>
                <ArrowUpRight className="w-4 h-4 text-[#6B7280] group-hover:text-white transition-colors" />
              </div>
              <p className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">
                Generate high-retention script, AI voiceover, and export direct to YouTube.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('analytics')}
            className="p-4 rounded-2xl bg-[#141414] hover:bg-[#1A1A1A] border border-[#2F2F2F] hover:border-blue-500/50 transition-all text-left group shadow-sm cursor-pointer space-y-2.5"
          >
            <div className="p-2.5 rounded-xl bg-[#3B82F6]/10 text-[#60A5FA] border border-[#3B82F6]/20 w-fit group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white group-hover:text-[#60A5FA] transition-colors">
                  Audience Analytics
                </h4>
                <ArrowUpRight className="w-4 h-4 text-[#6B7280] group-hover:text-white transition-colors" />
              </div>
              <p className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">
                Track real views, subscriber velocities, and retention metrics.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('seo')}
            className="p-4 rounded-2xl bg-[#141414] hover:bg-[#1A1A1A] border border-[#2F2F2F] hover:border-amber-500/50 transition-all text-left group shadow-sm cursor-pointer space-y-2.5"
          >
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 w-fit group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                  SEO &amp; Tags Radar
                </h4>
                <ArrowUpRight className="w-4 h-4 text-[#6B7280] group-hover:text-white transition-colors" />
              </div>
              <p className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">
                Inspect YouTube autocomplete trends and competitor video tags.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('trending')}
            className="p-4 rounded-2xl bg-[#141414] hover:bg-[#1A1A1A] border border-[#2F2F2F] hover:border-orange-500/50 transition-all text-left group shadow-sm cursor-pointer space-y-2.5"
          >
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 w-fit group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                  Trending Shorts
                </h4>
                <ArrowUpRight className="w-4 h-4 text-[#6B7280] group-hover:text-white transition-colors" />
              </div>
              <p className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">
                Monitor real-time viral trends and top ranking vertical formats.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* ── 5. "Shorts" Shelf (Real Vertical Grid) ── */}
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

      {/* ── 6. "Videos" Shelf (Real 16:9 Uploads) ── */}
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
          <div className="py-10 px-4 text-center rounded-2xl bg-[#141414] border border-[#262626] text-[#9CA3AF] space-y-3">
            <Video className="w-8 h-8 text-[#6B7280] mx-auto opacity-50" />
            <p className="text-sm font-semibold text-white">No published videos found</p>
            <p className="text-xs text-[#9CA3AF]">
              {activeChannel
                ? 'Published long-form videos and brain teaser quizzes will appear here.'
                : 'Connect your YouTube channel using Google Sign-In to view your live videos.'}
            </p>
            {!activeChannel && (
              <div className="pt-1">
                <Button size="sm" variant="primary" icon={<YouTubeIcon />} onClick={onOpenConnectModal}>
                  Connect YouTube Channel
                </Button>
              </div>
            )}
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

      {/* ── 7. Real Playlists Shelf (if present) ── */}
      {playlists.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <ListVideo className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Playlists</span>
                <span className="text-xs font-mono-studio px-2 py-0.5 rounded-full bg-[#202020] text-[#9CA3AF]">
                  {playlists.length}
                </span>
              </h3>
            </div>

            <button
              type="button"
              onClick={() => onTabChange('playlists')}
              className="text-xs text-[#60A5FA] hover:text-[#93C5FD] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {playlists.slice(0, 4).map((pl) => (
              <a
                key={pl.id}
                href={pl.playlistUrl || `https://www.youtube.com/playlist?list=${pl.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-2xl overflow-hidden bg-[#141414] border border-[#2F2F2F] hover:border-[#10B981] transition-all hover:shadow-xl"
              >
                <div className="aspect-video w-full relative overflow-hidden bg-[#0A0A0A] border-b border-[#262626]">
                  <img
                    src={pl.thumbnailUrl || (videosFeed[0]?.thumbnailUrl ?? '')}
                    alt={pl.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/85 text-[11px] font-mono-studio font-bold text-white border border-white/10 flex items-center gap-1">
                    <ListVideo className="w-3 h-3 text-emerald-400" />
                    <span>{pl.videoCount || 0} videos</span>
                  </div>
                </div>

                <div className="p-3.5 space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
                    {pl.title}
                  </h4>
                  {pl.description && (
                    <p className="text-[11px] text-[#9CA3AF] line-clamp-2 leading-relaxed">
                      {pl.description}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeHomePage;
