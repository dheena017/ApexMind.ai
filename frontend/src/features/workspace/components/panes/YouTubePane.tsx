import React, { useState, useEffect } from 'react';
import {
  Youtube,
  Globe,
  Lock,
  EyeOff,
  ExternalLink,
  Flame,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Copy,
  RefreshCw,
  Unlink,
  Search,
  Plus,
  X,
  Check,
  Hash,
  Upload,
  Users,
  Eye,
  Film,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { GeneratedScript } from '../../types';
import type { YouTubeChannel } from '@/src/features/youtube/types';
import { youtubeApi } from '@/src/features/youtube/api/youtubeApi';
import { connectYouTubeWithGoogle } from '@/src/features/youtube/utils/googleOAuthConnect';
import { YouTubeIcon } from '@/src/features/youtube/components/YouTubeIcon';
import { CustomSelect } from '@/src/shared/ui/CustomSelect';
import { toast } from 'sonner';

export interface YouTubePaneProps {
  script: GeneratedScript;
  onUpdateScript?: (updated: Partial<GeneratedScript>) => void;
  onPublish?: () => void;
  canPublish?: boolean;
  publishing?: boolean;
  publishingStage?: 'idle' | 'rendering' | 'uploading' | 'done';
  publishedSuccess?: boolean;
  publishedVideoUrl?: string | null;
  onResetPublishState?: () => void;
  onNavigate?: (page: string) => void;
}

const YOUTUBE_CATEGORY_OPTIONS = [
  { value: 'People & Blogs', label: 'People & Blogs', description: 'Personal, motivational & lifestyle Shorts' },
  { value: 'Education', label: 'Education', description: 'Stoicism, mental models & learning' },
  { value: 'Entertainment', label: 'Entertainment', description: 'Engaging storytelling & viral reels' },
  { value: 'Motivation', label: 'Motivation & Self-Help', description: 'Daily discipline & mindset quotes' },
  { value: 'Science & Technology', label: 'Science & Tech', description: 'Psychology, neuroscience & AI' },
  { value: 'Howto & Style', label: 'Howto & Style', description: 'Guides, routines & habits' },
];

const AUDIENCE_OPTIONS = [
  { value: 'not-for-kids', label: 'Not for kids', description: 'Standard YouTube Shorts audience' },
  { value: 'made-for-kids', label: 'Made for kids', description: 'Complies with COPPA regulations' },
];

function formatNumber(num?: number | string): string {
  if (num === undefined || num === null || num === '') return '0';
  const val = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
  if (isNaN(val)) return '0';
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
  return val.toLocaleString();
}

function normalizeChannel(raw: any, fallbackQuery?: string): YouTubeChannel {
  const rawSubs = raw.subscribers ?? raw.subscriberCount ?? raw.subscriber_count ?? 0;
  const rawVids = raw.videosUploaded ?? raw.videos_uploaded ?? raw.videoCount ?? raw.video_count ?? 0;
  const rawViews = raw.totalLifetimeViews ?? raw.total_lifetime_views ?? raw.views ?? raw.viewCount ?? raw.view_count ?? 0;

  return {
    id: raw.id || raw.channelId || raw.channel_id || '',
    channelId: raw.channelId || raw.channel_id || raw.id || '',
    name: raw.name || raw.title || 'YouTube Channel',
    handle: raw.handle || fallbackQuery || '@channel',
    avatarUrl: raw.avatarUrl || raw.avatar_url || '',
    bannerUrl: raw.bannerUrl || raw.banner_url || '',
    subscribers: typeof rawSubs === 'string' ? parseFloat(rawSubs.replace(/,/g, '')) || 0 : Number(rawSubs) || 0,
    videosUploaded: typeof rawVids === 'string' ? parseFloat(rawVids.replace(/,/g, '')) || 0 : Number(rawVids) || 0,
    totalLifetimeViews: typeof rawViews === 'string' ? parseFloat(rawViews.replace(/,/g, '')) || 0 : Number(rawViews) || 0,
    verified: Boolean(raw.verified),
    channelUrl: raw.channelUrl || `https://www.youtube.com/${raw.handle || fallbackQuery}`,
  };
}

export const YouTubePane: React.FC<YouTubePaneProps> = ({
  script,
  onUpdateScript,
  onPublish,
  canPublish = true,
  publishing = false,
  publishingStage = 'idle',
  publishedSuccess = false,
  publishedVideoUrl = null,
  onResetPublishState,
  onNavigate,
}) => {
  // ── Two Dedicated Subtabs: Publish & Meta | Shorts SEO ──
  const [activeSubTab, setActiveSubTab] = useState<'meta' | 'seo'>('meta');

  // Video Publishing Configuration
  const [privacy, setPrivacy] = useState<'public' | 'unlisted' | 'private'>('public');
  const [category, setCategory] = useState('People & Blogs');
  const [madeForKids, setMadeForKids] = useState(false);

  // Hashtags (Managed in SEO & embedded into video description)
  const [tags, setTags] = useState<string[]>([
    '#Shorts',
    '#ApexMind',
    '#Motivation',
    '#Stoicism',
    '#Discipline',
    '#Mindset',
  ]);
  const [newTagInput, setNewTagInput] = useState('');

  // Connected Channel State
  const [channel, setChannel] = useState<YouTubeChannel | null>(null);
  const [loadingChannel, setLoadingChannel] = useState<boolean>(true);
  const [isSyncingStats, setIsSyncingStats] = useState<boolean>(false);
  const [connectingOAuth, setConnectingOAuth] = useState<boolean>(false);
  const [customHandleInput, setCustomHandleInput] = useState<string>('');
  const [isSearchingHandle, setIsSearchingHandle] = useState<boolean>(false);
  const [showHandleSearch, setShowHandleSearch] = useState<boolean>(false);
  const [copiedHandle, setCopiedHandle] = useState<boolean>(false);

  // Load user's connected YouTube channel
  const loadChannelData = async (silent = false) => {
    if (!silent) setLoadingChannel(true);
    try {
      let activeCh: any = null;

      // 1. Try OAuth status first
      const authStatus = await youtubeApi.getAuthStatus().catch(() => null);
      if (authStatus?.connected && authStatus.channel) {
        activeCh = authStatus.channel;
      }

      // 2. Try saved channels from database
      if (!activeCh) {
        const channelsRes = await fetch('/api/youtube/channels')
          .then((r) => r.json())
          .catch(() => null);
        if (channelsRes?.channels && channelsRes.channels.length > 0) {
          activeCh = channelsRes.channels[0];
        }
      }

      // 3. Fallback: check localStorage handle
      const storedHandle = localStorage.getItem('apexmind_yt_active_channel') || '';
      const targetQuery = activeCh?.handle || storedHandle;

      if (targetQuery) {
        localStorage.setItem('apexmind_yt_active_channel', targetQuery);
        try {
          const liveDetails = await youtubeApi.getChannelDetails(targetQuery);
          if (liveDetails) {
            activeCh = {
              ...(activeCh || {}),
              ...liveDetails,
            };
          }
        } catch (e) {
          console.warn('Live channel details resolution fallback:', e);
        }
      }

      if (activeCh) {
        setChannel(normalizeChannel(activeCh, targetQuery));
      } else {
        setChannel(null);
      }
    } catch (err) {
      console.warn('Could not load channel data:', err);
    } finally {
      if (!silent) setLoadingChannel(false);
    }
  };

  useEffect(() => {
    loadChannelData();
  }, []);

  const handleRefreshLiveStats = async () => {
    if (!channel) {
      await loadChannelData();
      return;
    }
    setIsSyncingStats(true);
    try {
      const target = channel.handle || channel.name;
      const live = await youtubeApi.getChannelDetails(target);
      if (live) {
        const updated = normalizeChannel({ ...channel, ...live }, target);
        setChannel(updated);
        toast.success(`Synced live: ${formatNumber(updated.subscribers)} subs • ${formatNumber(updated.videosUploaded)} videos • ${formatNumber(updated.totalLifetimeViews)} views`);
      } else {
        toast.info('Channel statistics are up to date.');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Could not refresh statistics from YouTube.');
    } finally {
      setIsSyncingStats(false);
    }
  };

  const handleConnectGoogle = () => {
    setConnectingOAuth(true);
    connectYouTubeWithGoogle({
      onLoading: setConnectingOAuth,
      onSuccess: async (connectedChannel) => {
        setConnectingOAuth(false);
        localStorage.setItem('apexmind_yt_active_channel', connectedChannel.handle);
        try {
          const live = await youtubeApi.getChannelDetails(connectedChannel.handle);
          setChannel(normalizeChannel({ ...connectedChannel, ...live }, connectedChannel.handle));
        } catch {
          setChannel(normalizeChannel(connectedChannel, connectedChannel.handle));
        }
        toast.success(`Connected YouTube channel "${connectedChannel.name}"!`);
      },
      onError: (err) => {
        setConnectingOAuth(false);
        toast.error(`YouTube connection failed: ${err}`);
      },
    });
  };

  const handleDisconnectChannel = async () => {
    if (!channel) return;
    if (!window.confirm(`Disconnect channel "${channel.name}" from ApexMind?`)) return;
    try {
      await youtubeApi.disconnectOAuth();
      setChannel(null);
      localStorage.removeItem('apexmind_yt_active_channel');
      toast.info('YouTube channel disconnected.');
    } catch {
      toast.error('Could not disconnect channel.');
    }
  };

  const handleSearchCustomHandle = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = customHandleInput.trim();
    if (!query) return;
    setIsSearchingHandle(true);
    try {
      const details = await youtubeApi.getChannelDetails(query);
      if (details) {
        const normalized = normalizeChannel(details, query);
        setChannel(normalized);
        localStorage.setItem('apexmind_yt_active_channel', normalized.handle || query);
        setShowHandleSearch(false);
        setCustomHandleInput('');
        toast.success(`Synced YouTube channel "${normalized.name}" (${normalized.handle})`);
      }
    } catch (err: any) {
      toast.error(err.message || 'YouTube channel not found. Please verify the handle.');
    } finally {
      setIsSearchingHandle(false);
    }
  };

  // Hashtag Handlers (Unique to SEO tab, used by metadata)
  const handleAddHashtag = (tagToAdd?: string) => {
    const raw = tagToAdd || newTagInput.trim();
    if (!raw) return;
    const formatted = raw.startsWith('#') ? raw : `#${raw}`;
    if (!tags.includes(formatted)) {
      const updated = [...tags, formatted];
      setTags(updated);
      onUpdateScript?.({ hashtags: updated });
    }
    if (!tagToAdd) setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = tags.filter((t) => t !== tagToRemove);
    setTags(updated);
    onUpdateScript?.({ hashtags: updated });
  };

  const handleCopyAllHashtags = () => {
    const text = tags.join(' ');
    navigator.clipboard.writeText(text);
    toast.success('All hashtags copied to clipboard');
  };

  // Video script details
  const videoTitle = script?.title || '';
  const hookText = script?.hook || '';
  const quoteText = script?.quote || '';
  const ctaText = script?.cta || '';
  const tagsText = tags.join(' ');

  const description = quoteText || hookText
    ? `${hookText ? `${hookText}\n\n` : ''}${quoteText ? `${quoteText}\n\n` : ''}${ctaText ? `${ctaText}\n\n` : ''}${tagsText}\n\nCreated with ApexMind AI Studio.`
    : 'Transform your mindset. Conquer your inner storm.\n\n#Shorts #Motivation #Discipline';

  const handleCopyDescription = () => {
    navigator.clipboard.writeText(description);
    toast.success('Description copied to clipboard');
  };

  // Dynamic Viral / SEO readiness score
  const hasTitle = videoTitle.trim().length >= 10;
  const hasHook = hookText.trim().length > 0;
  const hasCta = ctaText.trim().length > 0;
  const hasGoodTags = tags.length >= 3 && tags.length <= 8;
  const isChannelConnected = !!channel;

  let viralScore = 40;
  if (hasTitle) viralScore += 15;
  if (hasHook) viralScore += 15;
  if (hasCta) viralScore += 10;
  if (hasGoodTags) viralScore += 10;
  if (isChannelConnected) viralScore += 10;
  viralScore = Math.min(100, viralScore);

  return (
    <div className="flex flex-col h-full bg-[#121215] text-white font-sans-studio select-none overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl">
      {/* ── Top Header Bar (Ambient glow, refined micro-actions) ── */}
      <div className="relative h-12 px-3.5 bg-gradient-to-r from-red-950/25 via-[#17171C] to-[#15151A] border-b border-white/[0.06] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 flex items-center justify-center shrink-0 shadow-sm shadow-red-950/40">
            <Youtube className="w-4 h-4 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-white tracking-tight">YouTube Studio</span>
            <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-zinc-600" />
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium text-zinc-400">
              <Sparkles className="w-2.5 h-2.5 text-red-400" />
              Creator Hub
            </span>
          </div>
        </div>

        {/* ── Header Actions (View, Sync, Search, Unlink) ── */}
        {channel && (
          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={channel.channelUrl || `https://www.youtube.com/${channel.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-7 px-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-medium text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 border border-white/[0.08] hover:border-white/[0.15] shadow-xs cursor-pointer group"
              title="Open Channel on YouTube"
            >
              <span>View</span>
              <ArrowUpRight className="w-3 h-3 text-zinc-400 group-hover:text-red-400 transition-colors" />
            </a>

            <button
              type="button"
              disabled={isSyncingStats}
              onClick={handleRefreshLiveStats}
              className="h-7 w-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-all border border-white/[0.08] hover:border-white/[0.15] flex items-center justify-center cursor-pointer disabled:opacity-50 shadow-xs"
              title="Sync Live Channel Statistics"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncingStats ? 'animate-spin text-red-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setShowHandleSearch(!showHandleSearch)}
              className={`h-7 w-7 rounded-lg transition-all border flex items-center justify-center cursor-pointer shadow-xs ${
                showHandleSearch
                  ? 'bg-red-500/20 border-red-500/50 text-red-400'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border-white/[0.08] hover:border-white/[0.15]'
              }`}
              title="Switch or Search Channel"
            >
              <Search className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={handleDisconnectChannel}
              className="h-7 w-7 rounded-lg bg-white/[0.04] hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-all border border-white/[0.08] hover:border-red-500/30 flex items-center justify-center cursor-pointer shadow-xs"
              title="Disconnect Channel"
            >
              <Unlink className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* ── Connected YouTube Channel Identity & Metrics Card ── */}
      <div className="p-3.5 bg-gradient-to-b from-[#16161B] to-[#121215] border-b border-white/[0.06] shrink-0">
        {loadingChannel ? (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <div className="h-3.5 bg-zinc-800 rounded w-1/3" />
              <div className="h-2.5 bg-zinc-800 rounded w-1/4" />
            </div>
          </div>
        ) : channel ? (
          <div className="flex flex-col gap-2">
            {/* Top Identity Row: Avatar + Name & Handle | Compact Stats Cluster | Connected Badge */}
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  {channel.avatarUrl ? (
                    <img
                      src={channel.avatarUrl}
                      alt={channel.name}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-red-500/30 ring-offset-2 ring-offset-[#141418] shadow-md shadow-black/40"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-red-700 ring-2 ring-red-500/30 ring-offset-2 ring-offset-[#141418] flex items-center justify-center text-white font-bold text-xs shadow-md">
                      {channel.name?.slice(0, 2).toUpperCase() || 'YT'}
                    </div>
                  )}
                  {/* Micro YouTube badge overlay */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#16161A] border border-white/10 flex items-center justify-center shadow-xs">
                    <Youtube className="w-2 h-2 text-red-500" />
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-white tracking-tight truncate hover:text-red-300 transition-colors">
                      {channel.name}
                    </h3>
                    {channel.verified && (
                      <span className="text-[10px] text-blue-400 shrink-0" title="Verified Creator">
                        ✓
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (channel.handle) {
                        navigator.clipboard.writeText(channel.handle);
                        setCopiedHandle(true);
                        setTimeout(() => setCopiedHandle(false), 2000);
                        toast.success(`Copied handle ${channel.handle}`);
                      }
                    }}
                    className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 font-mono transition-colors group cursor-pointer"
                    title="Click to copy handle"
                  >
                    <span>{channel.handle || '@channel'}</span>
                    {copiedHandle ? (
                      <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Copy className="w-2.5 h-2.5 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    )}
                  </button>
                </div>
              </div>

              {/* Center Micro-Metrics Pill Cluster (Subs, Videos, Views) */}
              <div className="flex items-center gap-2 sm:gap-2.5 px-2.5 py-1 bg-[#0E0E12] border border-white/[0.08] rounded-lg shadow-inner">
                <div className="flex items-center gap-1 text-[11px] font-mono">
                  <span className="text-zinc-500 text-[10px] font-sans font-medium">Subs:</span>
                  <span className="font-bold text-white">{formatNumber(channel.subscribers)}</span>
                </div>
                <span className="text-white/15">•</span>
                <div className="flex items-center gap-1 text-[11px] font-mono">
                  <span className="text-zinc-500 text-[10px] font-sans font-medium">Videos:</span>
                  <span className="font-bold text-white">{formatNumber(channel.videosUploaded)}</span>
                </div>
                <span className="text-white/15">•</span>
                <div className="flex items-center gap-1 text-[11px] font-mono">
                  <span className="text-zinc-500 text-[10px] font-sans font-medium">Views:</span>
                  <span className="font-bold text-white">{formatNumber(channel.totalLifetimeViews)}</span>
                </div>
              </div>

              {/* Status Badge with Live Pulsing Radar Dot */}
              <div className="shrink-0 flex items-center">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/[0.12] text-emerald-400 text-[10px] font-semibold border border-emerald-500/25 flex items-center gap-1.5 shadow-xs">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  Connected
                </span>
              </div>
            </div>

            {/* Expandable Switch Handle Form */}
            {showHandleSearch && (
              <form onSubmit={handleSearchCustomHandle} className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  value={customHandleInput}
                  onChange={(e) => setCustomHandleInput(e.target.value)}
                  placeholder="Enter YouTube handle (@channel)..."
                  className="flex-1 bg-[#0E0E12] border border-white/[0.1] rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-red-500/80 transition-colors"
                />
                <button
                  type="submit"
                  disabled={isSearchingHandle || !customHandleInput.trim()}
                  className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isSearchingHandle ? 'Syncing...' : 'Sync'}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* Not Connected Channel Banner */
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-500 shrink-0">
                <Youtube className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white">No Channel Connected</div>
                <div className="text-[10px] text-zinc-400 truncate">Connect Google to upload Shorts directly</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleConnectGoogle}
              disabled={connectingOAuth}
              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50 shrink-0"
            >
              <YouTubeIcon className="w-3.5 h-3.5" />
              <span>{connectingOAuth ? 'Connecting…' : 'Connect'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Subtabs Segmented Control ── */}
      <div className="p-2.5 bg-[#141417] border-b border-[#26262B] shrink-0">
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#1A1A1E] rounded-xl border border-[#272730]">
          <button
            type="button"
            onClick={() => setActiveSubTab('meta')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none min-w-0 ${
              activeSubTab === 'meta'
                ? 'bg-[#272730] text-white shadow-sm font-bold border border-white/10'
                : 'text-[#8E8E93] hover:text-white hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            <Upload className={`w-3.5 h-3.5 shrink-0 ${activeSubTab === 'meta' ? 'text-red-500' : 'text-[#8E8E93]'}`} />
            <span className="truncate">Publish &amp; Meta</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('seo')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none min-w-0 ${
              activeSubTab === 'seo'
                ? 'bg-[#272730] text-white shadow-sm font-bold border border-white/10'
                : 'text-[#8E8E93] hover:text-white hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 shrink-0 ${activeSubTab === 'seo' ? 'text-amber-400' : 'text-[#8E8E93]'}`} />
            <span className="truncate">Shorts SEO</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0 transition-colors ${
                activeSubTab === 'seo'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'bg-[#26262B] text-zinc-400'
              }`}
            >
              {viralScore}%
            </span>
          </button>
        </div>
      </div>

      {/* ── Main Tab Content ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-4 flex flex-col gap-4">
        {/* ═══════════════════════════════════════════════════════════
            TAB 1: Publish & Meta (Clean, focused on video publishing)
            ═══════════════════════════════════════════════════════════ */}
        {activeSubTab === 'meta' && (
          <div className="flex flex-col gap-3.5">
            {/* Video Title */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono-studio">
                <span className="text-[#A1A1AA] uppercase font-bold flex items-center gap-1">
                  <Youtube className="w-3 h-3 text-red-500" /> Shorts Video Title
                </span>
                <span className={`text-[10px] ${videoTitle.length > 90 ? 'text-amber-400' : 'text-[#71717A]'}`}>
                  {videoTitle.length}/100
                </span>
              </div>
              <input
                type="text"
                value={videoTitle}
                onChange={(e) => onUpdateScript?.({ title: e.target.value })}
                placeholder="Enter compelling YouTube video title..."
                maxLength={100}
                className="w-full bg-[#1C1C20] border border-[#2A2A30] rounded-xl px-3 py-2 text-xs text-white font-medium outline-none focus:border-red-500/80 transition-colors"
              />
            </div>

            {/* Video Description (With Auto-Appended Hashtags & Copy) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono-studio">
                <span className="text-[#A1A1AA] uppercase font-bold">Video Description</span>
                <button
                  type="button"
                  onClick={handleCopyDescription}
                  className="flex items-center gap-1 text-[#71717A] hover:text-white transition-colors cursor-pointer"
                  title="Copy description"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
              <textarea
                rows={4}
                readOnly
                value={description}
                className="w-full bg-[#1C1C20] border border-[#2A2A30] rounded-xl px-3 py-2 text-xs text-zinc-300 font-sans outline-none resize-none custom-scrollbar leading-relaxed"
              />
            </div>

            {/* Visibility / Privacy */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-mono-studio text-[#A1A1AA] font-bold">
                Visibility / Privacy
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'public', label: 'Public', icon: Globe, desc: 'Instant reach' },
                  { id: 'unlisted', label: 'Unlisted', icon: EyeOff, desc: 'Link only' },
                  { id: 'private', label: 'Private', icon: Lock, desc: 'Only you' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = privacy === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPrivacy(item.id as any)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-red-500/15 border-red-500/50 text-white shadow-xs'
                          : 'bg-[#18181C] border-[#2A2A30] text-[#8E8E93] hover:text-white hover:bg-[#202026]'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 mb-1 ${isSelected ? 'text-red-400' : 'text-[#8E8E93]'}`} />
                      <span className="text-[11px] font-semibold">{item.label}</span>
                      <span className="text-[9px] text-[#71717A]">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category & Audience — Using Website CustomSelect Dropdown Component */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-mono-studio text-[#71717A] tracking-wider">
                  Category
                </label>
                <CustomSelect
                  options={YOUTUBE_CATEGORY_OPTIONS}
                  value={category}
                  onChange={(val) => setCategory(val)}
                  size="sm"
                  className="w-full text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-mono-studio text-[#71717A] tracking-wider">
                  Audience
                </label>
                <CustomSelect
                  options={AUDIENCE_OPTIONS}
                  value={madeForKids ? 'made-for-kids' : 'not-for-kids'}
                  onChange={(val) => setMadeForKids(val === 'made-for-kids')}
                  size="sm"
                  className="w-full text-xs"
                />
              </div>
            </div>


          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            TAB 2: Shorts SEO (Viral Optimization, Keywords & Checklist)
            ═══════════════════════════════════════════════════════════ */}
        {activeSubTab === 'seo' && (
          <div className="flex flex-col gap-3.5">
            {/* Viral Algorithm Score Header Card */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-950/30 to-[#18181C] border border-red-900/30 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-mono-studio text-red-400 font-bold flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" /> Viral Algorithm Score
                </div>
                <div className="text-xl font-black text-white mt-0.5">
                  {viralScore} <span className="text-xs font-normal text-zinc-400">/ 100</span>
                </div>
              </div>
              <div className="text-[10px] text-right font-semibold flex items-center gap-1">
                <TrendingUp className={`w-3.5 h-3.5 ${viralScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`} />
                <span className={viralScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}>
                  {viralScore >= 80 ? 'High Discovery' : 'Optimization Recommended'}
                </span>
              </div>
            </div>

            {/* Viral Hashtags & Suggested Tags Manager */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono-studio text-[#A1A1AA] uppercase tracking-wider font-bold flex items-center gap-1">
                  <Hash className="w-3 h-3 text-red-400" /> Viral Hashtags ({tags.length})
                </span>
                <button
                  type="button"
                  onClick={handleCopyAllHashtags}
                  className="text-[10px] text-red-400 hover:text-red-300 cursor-pointer flex items-center gap-1 font-medium"
                >
                  <Copy className="w-2.5 h-2.5" />
                  <span>Copy All</span>
                </button>
              </div>

              {/* Tag Input */}
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddHashtag();
                    }
                  }}
                  placeholder="Add hashtag (e.g. #Stoic)..."
                  className="flex-1 bg-[#121215] border border-[#2A2A30] focus:border-red-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddHashtag()}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>

              {/* Active Tag Cloud */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1E2A3A] border border-[#2A3A5A] text-[10px] text-[#60A5FA] font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-[#93C5FD] hover:text-white cursor-pointer ml-0.5"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Suggested Trending Tags */}
              <div className="flex flex-col gap-1 pt-2 border-t border-[#25252A]">
                <span className="text-[9px] text-[#71717A] uppercase font-bold">Suggested Trending Tags:</span>
                <div className="flex flex-wrap gap-1">
                  {['#Shorts', '#Viral', '#Mindset', '#Motivation', '#Discipline', '#Success', '#StoicMindset'].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleAddHashtag(sug)}
                      disabled={tags.includes(sug)}
                      className={`text-[9px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        tags.includes(sug)
                          ? 'opacity-30 border-transparent bg-transparent cursor-default'
                          : 'bg-[#1C1C22] border-[#2A2A32] text-[#A1A1AA] hover:text-white hover:border-red-500/60'
                      }`}
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Retention & Content Signals */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-2">
              <span className="text-[10px] font-mono-studio text-[#A1A1AA] uppercase tracking-wider font-bold">
                Viewer Retention Signals
              </span>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[#141418] border border-[#24242A] text-xs">
                <div>
                  <div className="text-[11px] font-semibold text-white">First 3 Seconds Hook</div>
                  <div className="text-[10px] text-zinc-400 truncate max-w-[220px]">
                    {hookText ? `"${hookText.slice(0, 32)}…"` : 'No hook detected'}
                  </div>
                </div>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${hasHook ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {hasHook ? 'Active' : 'Missing'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[#141418] border border-[#24242A] text-xs">
                <div>
                  <div className="text-[11px] font-semibold text-white">Call-To-Action (CTA)</div>
                  <div className="text-[10px] text-zinc-400 truncate max-w-[220px]">
                    {ctaText ? `"${ctaText.slice(0, 32)}…"` : 'No CTA detected'}
                  </div>
                </div>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${hasCta ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {hasCta ? 'Active' : 'Missing'}
                </span>
              </div>
            </div>

            {/* Dynamic SEO Algorithm Checklist */}
            <div className="p-3 rounded-xl bg-[#18181C] border border-[#282830] flex flex-col gap-1.5">
              <span className="text-[10px] font-mono-studio text-[#71717A] uppercase tracking-wider font-bold">
                Algorithm Discovery Checklist
              </span>
              {[
                { label: 'Vertical Aspect Ratio (9:16 Shorts)', pass: true },
                { label: 'Hook in First 3 Seconds Added', pass: hasHook },
                { label: 'Title character length (10–80 chars)', pass: hasTitle },
                { label: 'Call-To-Action Prompt Added', pass: hasCta },
                { label: '3–8 Viral Hashtags Included', pass: hasGoodTags },
                { label: 'Connected YouTube Channel', pass: isChannelConnected },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-1.5 rounded-lg bg-[#141418] border border-[#24242A] text-xs"
                >
                  <div className="flex items-center gap-2">
                    {item.pass ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    <span className={`text-[11px] ${item.pass ? 'text-zinc-200' : 'text-amber-300'}`}>
                      {item.label}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono font-semibold ${item.pass ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {item.pass ? 'Optimal' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky Bottom Action Bar (With Live Published YouTube Video Link) ── */}
      <div className="p-3 bg-[#151518] border-t border-[#26262B] shrink-0 flex flex-col gap-2.5">
        {publishedSuccess && (publishedVideoUrl || channel) ? (
          <div className="flex flex-col gap-2">
            <a
              href={publishedVideoUrl || channel?.channelUrl || `https://www.youtube.com/${channel?.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Watch Short on YouTube</span>
              <ExternalLink className="w-3.5 h-3.5 ml-0.5 text-emerald-200" />
            </a>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onResetPublishState) {
                    onResetPublishState();
                  } else {
                    window.dispatchEvent(new CustomEvent('workspace:reset-publish'));
                  }
                  toast.success('Ready to upload another video to YouTube!');
                }}
                className="h-9 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 bg-[#202026] hover:bg-[#2C2C34] text-zinc-200 hover:text-white border border-[#32323C] hover:border-sky-500/50 transition-all cursor-pointer shadow-sm"
                title="Publish current edited video or re-upload to YouTube"
              >
                <Upload className="w-3.5 h-3.5 text-sky-400" />
                <span>Upload Another Video</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onResetPublishState) onResetPublishState();
                  window.dispatchEvent(new CustomEvent('workspace:reset-publish'));
                  window.dispatchEvent(new CustomEvent('workspace:start-new-video'));
                  toast.info('Starting fresh new video project...');
                }}
                className="h-9 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 bg-gradient-to-r from-red-600/20 to-red-500/20 hover:from-red-600/30 hover:to-red-500/30 text-red-200 hover:text-white border border-red-500/40 transition-all cursor-pointer shadow-sm"
                title="Start a new script & generate a fresh video"
              >
                <Plus className="w-3.5 h-3.5 text-red-400" />
                <span>Create New Video</span>
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onPublish}
            disabled={publishing || !canPublish}
            className={`w-full h-10 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-[0.99] ${
              publishedSuccess
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                : 'bg-gradient-to-r from-red-600 via-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-red-950/40 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {publishing ? (
              <>
                <div className={`w-4 h-4 border-2 rounded-full animate-spin ${
                  publishingStage === 'rendering'
                    ? 'border-amber-400/40 border-t-amber-400'
                    : 'border-blue-400/40 border-t-blue-400'
                }`} />
                <span>
                  {publishingStage === 'rendering'
                    ? '🎬 [1/2] Rendering 1080p Video...'
                    : '🚀 [2/2] Publishing to YouTube Shorts...'}
                </span>
              </>
            ) : (
              <>
                <Youtube className="w-4 h-4 text-white" />
                <span>Publish Now to {channel?.name ? channel.name : 'YouTube'}</span>
              </>
            )}
          </button>
        )}

        {/* Live Published YouTube Link Banner */}
        {publishedSuccess && (
          <div className="p-2.5 rounded-xl bg-[#1A1A20] border border-emerald-500/30 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono-studio">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Youtube className="w-3 h-3 text-red-500" /> Published Video Link:
              </span>
              {publishedVideoUrl && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(publishedVideoUrl);
                    toast.success('YouTube Short link copied to clipboard!');
                  }}
                  className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy video link"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Link</span>
                </button>
              )}
            </div>

            {publishedVideoUrl ? (
              <a
                href={publishedVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 underline font-mono truncate flex items-center justify-between gap-1 p-1.5 rounded bg-[#121215] border border-[#26262E]"
              >
                <span className="truncate">{publishedVideoUrl}</span>
                <ExternalLink className="w-3 h-3 shrink-0 text-zinc-400" />
              </a>
            ) : (
              <span className="text-[11px] text-zinc-400 font-mono">
                {script.title || 'Video'} successfully uploaded to channel.
              </span>
            )}

            <div className="flex items-center justify-between pt-0.5 text-[10px]">
              {channel && (
                <a
                  href={channel.channelUrl || `https://www.youtube.com/${channel.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <span>Channel: {channel.name}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
              {publishedVideoUrl && (
                <a
                  href={publishedVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 ml-auto"
                >
                  <span>Open Video</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
