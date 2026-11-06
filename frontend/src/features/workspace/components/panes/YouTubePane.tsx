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
  Copy,
  RefreshCw,
  Plus,
  X,
  Check,
  Hash,
  Upload,
  Sparkles,
  ArrowUpRight,
  Wand2,
  ChevronDown,
  ChevronUp,
  Trash2,
  Shuffle,
} from 'lucide-react';
import { GeneratedScript } from '../../types';
import type { YouTubeChannel } from '@/src/features/youtube/types';
import { youtubeApi } from '@/src/features/youtube/api/youtubeApi';
import { workspaceApi } from '../../api/workspaceApi';
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
  { value: 'Education', label: 'Education', description: 'Mental models, psychology & learning' },
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
  const handle = raw.handle || fallbackQuery || '';

  return {
    id: raw.id || raw.channelId || raw.channel_id || '',
    channelId: raw.channelId || raw.channel_id || raw.id || '',
    name: raw.name || raw.title || 'YouTube Channel',
    handle,
    avatarUrl: raw.avatarUrl || raw.avatar_url || '',
    bannerUrl: raw.bannerUrl || raw.banner_url || '',
    subscribers: typeof rawSubs === 'string' ? parseFloat(rawSubs.replace(/,/g, '')) || 0 : Number(rawSubs) || 0,
    videosUploaded: typeof rawVids === 'string' ? parseFloat(rawVids.replace(/,/g, '')) || 0 : Number(rawVids) || 0,
    totalLifetimeViews: typeof rawViews === 'string' ? parseFloat(rawViews.replace(/,/g, '')) || 0 : Number(rawViews) || 0,
    verified: Boolean(raw.verified),
    channelUrl: raw.channelUrl || (handle ? `https://www.youtube.com/${handle}` : ''),
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
  const [showPublishedLink, setShowPublishedLink] = useState(true);

  useEffect(() => {
    setShowPublishedLink(true);
  }, [publishedSuccess, publishedVideoUrl]);

  // Video Publishing Configuration
  const [privacy, setPrivacy] = useState<'public' | 'unlisted' | 'private'>('public');
  const [category, setCategory] = useState('People & Blogs');
  const [madeForKids, setMadeForKids] = useState(false);

  // Hashtags (Managed in SEO & embedded into video description)
  const [tags, setTags] = useState<string[]>(() => {
    return script?.hashtags?.length ? script.hashtags : script?.tags || [];
  });
  const [newTagInput, setNewTagInput] = useState('');

  // AI Metadata Generation States
  const [isGeneratingMeta, setIsGeneratingMeta] = useState<boolean>(false);
  const [generatingSection, setGeneratingSection] = useState<'all' | 'title' | 'desc' | 'tags' | null>(null);
  const [showTitleDrawer, setShowTitleDrawer] = useState<boolean>(false);
  const [copiedDescription, setCopiedDescription] = useState<boolean>(false);

  const [titleSuggestions, setTitleSuggestions] = useState<Array<{ title: string; angle: string; viralityScore: number }>>(
    () => script?.titleIdeas || []
  );

  const [categorizedTags, setCategorizedTags] = useState<{
    trending: string[];
    niche: string[];
    growth: string[];
    ai: string[];
  }>({ trending: [], niche: [], growth: [], ai: [] });

  const [customDescription, setCustomDescription] = useState<string>(() => script?.description || '');

  useEffect(() => {
    setCustomDescription(script?.description || '');
    setTitleSuggestions(script?.titleIdeas || []);
    setTags(script?.hashtags?.length ? script.hashtags : script?.tags || []);
  }, [script?.description, script?.titleIdeas, script?.hashtags, script?.tags]);

  // Connected Channel State
  const [channel, setChannel] = useState<YouTubeChannel | null>(null);
  const [loadingChannel, setLoadingChannel] = useState<boolean>(true);
  const [isSyncingStats, setIsSyncingStats] = useState<boolean>(false);
  const [copiedHandle, setCopiedHandle] = useState<boolean>(false);

  // Load user's connected YouTube channel
  const loadChannelData = async (silent = false) => {
    if (!silent) setLoadingChannel(true);
    try {
      const [statusResult, channelsResult] = await Promise.allSettled([
        youtubeApi.getAuthStatus(),
        youtubeApi.getChannels(),
      ]);
      const authStatus = statusResult.status === 'fulfilled' ? statusResult.value : null;
      const savedChannels = channelsResult.status === 'fulfilled' ? channelsResult.value : [];
      if (statusResult.status === 'rejected' || channelsResult.status === 'rejected') {
        console.warn('Could not verify the active YouTube channel.', {
          statusError: statusResult.status === 'rejected' ? statusResult.reason : undefined,
          channelsError: channelsResult.status === 'rejected' ? channelsResult.reason : undefined,
        });
      }
      let activeCh = authStatus?.activeChannelId
        ? savedChannels.find((saved) => saved.id === authStatus.activeChannelId) || authStatus.channel
        : authStatus?.connected ? authStatus.channel : null;
      const targetQuery = activeCh?.handle || activeCh?.id || '';

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
        localStorage.removeItem('apexmind_yt_active_channel');
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

  useEffect(() => {
    const handleChannelChanged = (event: Event) => {
      const { platform } = (event as CustomEvent<{ platform?: string }>).detail || {};
      if (!platform || platform === 'youtube') void loadChannelData();
    };
    const handleStorageChanged = (event: StorageEvent) => {
      if (event.key === 'apexmind_yt_active_channel') void loadChannelData();
    };
    window.addEventListener('youtube:channel-switched', handleChannelChanged);
    window.addEventListener('storage', handleStorageChanged);
    return () => {
      window.removeEventListener('youtube:channel-switched', handleChannelChanged);
      window.removeEventListener('storage', handleStorageChanged);
    };
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
  const handleUpdateDescription = (newDesc: string) => {
    setCustomDescription(newDesc);
    onUpdateScript?.({ description: newDesc });
  };

  const handleSelectTitle = (chosenTitle: string) => {
    onUpdateScript?.({ title: chosenTitle });
    toast.success(`Title applied: "${chosenTitle}"`);
    setShowTitleDrawer(false);
  };

  const handleGenerateMetadata = async (mode: 'all' | 'title' | 'desc' | 'tags' = 'all') => {
    if (![videoTitle, hookText, quoteText, script?.category || ''].some((value) => value.trim())) {
      toast.error('Add a title or script before generating YouTube metadata.');
      return;
    }

    setIsGeneratingMeta(true);
    setGeneratingSection(mode);
    try {
      const result = await workspaceApi.generateMetadata({
        category,
        topic: script?.category || '',
        title: videoTitle,
        hook: hookText,
        quote: quoteText,
        cta: ctaText,
      });

      if (mode === 'all' || mode === 'title') {
        if (result.titles && result.titles.length > 0) {
          setTitleSuggestions(result.titles);
          if (mode === 'all' && !videoTitle.trim()) {
            onUpdateScript?.({ title: result.titles[0].title });
          }
          if (mode === 'title') setShowTitleDrawer(true);
        }
      }

      if (mode === 'all' || mode === 'desc') {
        if (result.description) {
          handleUpdateDescription(result.description);
        }
      }

      if (mode === 'all' || mode === 'tags') {
        setCategorizedTags({ ...result.hashtags, ai: result.hashtags.ai || [] });
        setTags(result.allHashtags);
        onUpdateScript?.({ hashtags: result.allHashtags, tags: result.allHashtags });
      }

      toast.success(
        mode === 'all'
          ? 'AI generated titles, description, and hashtags for this video.'
          : mode === 'title'
          ? 'AI generated title suggestions.'
          : mode === 'desc'
          ? 'AI generated a video description.'
          : 'AI generated hashtags for this video.'
      );
    } catch (err) {
      toast.error(`Could not generate metadata: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingMeta(false);
      setGeneratingSection(null);
    }
  };

  const handleAddAllFromCategory = (catKey: 'trending' | 'niche' | 'growth' | 'ai') => {
    const list = categorizedTags[catKey] || [];
    const newTags = list.filter((tag) => !tags.includes(tag));
    if (newTags.length === 0) {
      toast.info(list.length ? 'All suggested hashtags are already added.' : 'Generate AI metadata to get hashtag recommendations.');
      return;
    }
    const combined = [...tags, ...newTags];
    setTags(combined);
    onUpdateScript?.({ hashtags: combined, tags: combined });
    toast.success(`Added ${newTags.length} ${newTags.length === 1 ? 'hashtag' : 'hashtags'}`);
  };

  const handleClearAllTags = () => {
    setTags([]);
    onUpdateScript?.({ hashtags: [], tags: [] });
    toast.info('All hashtags cleared');
  };

  const handleCopyDescription = () => {
    navigator.clipboard.writeText(customDescription);
    setCopiedDescription(true);
    toast.success('Description copied to clipboard');
    setTimeout(() => setCopiedDescription(false), 2000);
  };

  // The estimate is provided by Gemini with its title suggestions.
  const titleWithinLimit = videoTitle.length > 0 && videoTitle.length <= 100;
  const hasHook = hookText.trim().length > 0;
  const hasCta = ctaText.trim().length > 0;
  const hasRecommendedTagCount = tags.length >= 3 && tags.length <= 8;
  const isChannelConnected = !!channel;

  const viralScore = titleSuggestions.length
    ? Math.round(titleSuggestions.reduce((total, item) => total + item.viralityScore, 0) / titleSuggestions.length)
    : null;
  const hashtagCategories = [
    { key: 'trending', label: 'Trending', tags: categorizedTags.trending },
    { key: 'niche', label: 'Category & niche', tags: categorizedTags.niche },
    { key: 'growth', label: 'Growth', tags: categorizedTags.growth },
    { key: 'ai', label: 'AI-related', tags: categorizedTags.ai },
  ] as const;
  const hasHashtagSuggestions = hashtagCategories.some(({ tags: suggestions }) => suggestions.length > 0);
  const readinessChecks = [
    { label: 'Video title', detail: `${videoTitle.length}/100 characters`, pass: titleWithinLimit },
    { label: 'Opening hook', detail: hasHook ? 'Added to script' : 'Not in script yet', pass: hasHook },
    { label: 'Call to action', detail: hasCta ? 'Added to script' : 'Not in script yet', pass: hasCta },
    {
      label: 'Hashtag count',
      detail: `${tags.length} added`,
      pass: hasRecommendedTagCount,
    },
    {
      label: 'YouTube channel',
      detail: loadingChannel ? 'Checking connection…' : isChannelConnected ? channel?.name || 'Connected' : 'Not connected',
      pass: loadingChannel ? null : isChannelConnected,
    },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-[#141414] text-white font-sans-studio select-none overflow-hidden rounded-none border-0">
      {/* ── Top Header Bar (Ambient glow, refined micro-actions) ── */}
      <div className="relative h-12 px-3.5 bg-[#141414] border-b border-[#242424] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#3B82F6]/20 to-[#2563EB]/10 border border-[#3B82F6]/30 flex items-center justify-center shrink-0 shadow-sm shadow-blue-950/40">
            <Youtube className="w-4 h-4 text-[#60A5FA]" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-white tracking-tight">YouTube Studio</span>
          </div>
        </div>

        {/* ── Header Actions ── */}
        {channel && (
          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={channel.channelUrl || `https://www.youtube.com/${channel.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-7 px-2.5 rounded-lg bg-[#181818] hover:bg-[#26262C] text-[11px] font-medium text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 border border-[#242424] hover:border-white/10 shadow-xs cursor-pointer group"
              title="Open Channel on YouTube"
            >
              <span>View</span>
              <ArrowUpRight className="w-3 h-3 text-zinc-400 group-hover:text-[#60A5FA] transition-colors" />
            </a>

            <button
              type="button"
              disabled={isSyncingStats}
              onClick={handleRefreshLiveStats}
              className="h-7 w-7 rounded-lg bg-[#181818] hover:bg-[#26262C] text-zinc-400 hover:text-white transition-all border border-[#242424] hover:border-white/10 flex items-center justify-center cursor-pointer disabled:opacity-50 shadow-xs"
              title="Sync Live Channel Statistics"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncingStats ? 'animate-spin text-[#60A5FA]' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => onNavigate?.('channels')}
              className="h-7 px-2.5 rounded-lg bg-[#181818] hover:bg-[#26262C] text-[10px] font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer border border-[#242424] hover:border-white/10"
              title="Connect or select a channel in Social Accounts"
            >
              Manage channels
            </button>
          </div>
        )}
      </div>

      {/* ── Connected YouTube Channel Identity & Metrics Card ── */}
      <div className="p-2.5 bg-[#141414] border-b border-[#242424] shrink-0">
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
            {/* Single Unified Row: Avatar + Identity + Metrics + Live Status */}
            <div className="flex items-center justify-between gap-2.5 min-w-0">
              {/* Left: Avatar + Name & Handle */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative shrink-0">
                  {channel.avatarUrl ? (
                    <img
                      src={channel.avatarUrl}
                      alt={channel.name}
                      className="w-8 h-8 rounded-full object-cover ring-1.5 ring-blue-500/30 ring-offset-1 ring-offset-[#141418] shadow-sm"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 ring-1.5 ring-blue-500/30 ring-offset-1 ring-offset-[#141418] flex items-center justify-center text-white font-bold text-[10px] shadow-sm">
                      {channel.name?.slice(0, 2).toUpperCase() || 'YT'}
                    </div>
                  )}
                  {/* Micro YouTube badge overlay */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#181818] border border-[#2A2A2A] flex items-center justify-center shadow-xs">
                    <Youtube className="w-1.5 h-1.5 text-red-500" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <h3 className="text-xs font-bold text-white tracking-tight truncate hover:text-[#93C5FD] transition-colors" title={channel.name}>
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
                    className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 font-mono transition-colors group cursor-pointer truncate"
                    title="Click to copy handle"
                  >
                    <span className="truncate">{channel.handle || 'Handle unavailable'}</span>
                    {copiedHandle ? (
                      <Check className="w-2.5 h-2.5 text-[#3B82F6] shrink-0" />
                    ) : (
                      <Copy className="w-2.5 h-2.5 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    )}
                  </button>
                </div>
              </div>

              {/* Right: Inline Metrics Pill + Connected Status Indicator */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-2 px-2.5 py-1 bg-[#111111] border border-[#242424] rounded-lg shadow-inner text-[10.5px] font-mono">
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-500 text-[10px] font-sans font-medium">Subs:</span>
                    <span className="font-bold text-white">{formatNumber(channel.subscribers)}</span>
                  </div>
                  <span className="text-white/20">•</span>
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-500 text-[10px] font-sans font-medium">Videos:</span>
                    <span className="font-bold text-white">{formatNumber(channel.videosUploaded)}</span>
                  </div>
                  <span className="text-white/20">•</span>
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-500 text-[10px] font-sans font-medium">Views:</span>
                    <span className="font-bold text-white">{formatNumber(channel.totalLifetimeViews)}</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        ) : (
          /* Not Connected Channel Banner */
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#181818] border border-[#242424] flex items-center justify-center text-white shrink-0">
                <Youtube className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white">No Channel Connected</div>
                <div className="text-[10px] text-zinc-400 truncate">Connect and select a channel in Social Accounts</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.('channels')}
              className="px-2.5 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border border-[#60A5FA]/40 shrink-0"
            >
              <YouTubeIcon className="w-3.5 h-3.5" />
              <span>Manage</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Subtabs Segmented Control ── */}
      <div className="p-2.5 bg-[#111111] border-b border-[#242424] shrink-0">
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#181818] rounded-none border-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('meta')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none min-w-0 ${
              activeSubTab === 'meta'
                ? 'bg-[#2563EB] text-white shadow-sm font-bold border border-[#60A5FA]/40'
                : 'text-[#9CA3AF] hover:text-white hover:bg-[#26262C] hover:border-white/10 border border-transparent'
            }`}
          >
            <Upload className={`w-3.5 h-3.5 shrink-0 ${activeSubTab === 'meta' ? 'text-[#60A5FA]' : 'text-slate-400'}`} />
            <span className="truncate">Publish &amp; Meta</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('seo')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none min-w-0 ${
              activeSubTab === 'seo'
                ? 'bg-[#2563EB] text-white shadow-sm font-bold border border-[#60A5FA]/40'
                : 'text-[#9CA3AF] hover:text-white hover:bg-[#26262C] hover:border-white/10 border border-transparent'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 shrink-0 ${activeSubTab === 'seo' ? 'text-white' : 'text-slate-400'}`} />
            <span className="truncate">Shorts SEO</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0 transition-colors ${
                activeSubTab === 'seo'
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-[#26262B] text-zinc-400'
              }`}
            >
              {viralScore !== null ? `${viralScore}%` : 'AI'}
            </span>
          </button>
        </div>
      </div>

      {/* ── Main Tab Content ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-4 flex flex-col gap-4">
        {/*
            TAB 1: Publish & Meta (Clean, focused on video publishing)
            */}
        {activeSubTab === 'meta' && (
          <div className="flex flex-col gap-3.5">
            {/* AI Global Quick Generation Banner */}
            <div className="p-2.5 rounded-xl bg-[#161616] border border-[#242424] flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-[#2563EB]/15 border border-[#60A5FA]/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-[#60A5FA]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-white leading-tight">AI Metadata Engine</div>
                  <div className="text-[9px] text-zinc-400 truncate">Generate viral Title, Description &amp; Hashtags in 1-click</div>
                </div>
              </div>
              <button
                type="button"
                disabled={isGeneratingMeta}
                onClick={() => handleGenerateMetadata('all')}
                className="px-2.5 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-95 text-white font-bold text-[10px] flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(37,99,235,0.3)] border border-[#60A5FA]/40 disabled:opacity-50 shrink-0"
              >
                <Wand2 className={`w-3 h-3 ${isGeneratingMeta && generatingSection === 'all' ? 'animate-spin' : ''}`} />
                <span>{isGeneratingMeta && generatingSection === 'all' ? 'Generating…' : 'AI Generate All'}</span>
              </button>
            </div>

            {/* Video Title & AI Suggestions */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono-studio">
                <span className="text-slate-400 uppercase font-bold flex items-center gap-1">
                  <Youtube className="w-3 h-3 text-[#60A5FA]" /> Shorts Video Title
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTitleDrawer(!showTitleDrawer)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#181818] hover:bg-[#26262C] text-zinc-300 hover:text-white border border-[#242424] hover:border-white/10 font-semibold cursor-pointer transition-colors"
                    title="Toggle AI Title Ideas"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-[#60A5FA]" />
                    <span>AI Titles ({titleSuggestions.length})</span>
                    {showTitleDrawer ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                  </button>
                  <span className={`text-[10px] ${videoTitle.length > 80 ? 'text-[#60A5FA]' : 'text-slate-500'}`}>
                    {videoTitle.length}/100
                  </span>
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => onUpdateScript?.({ title: e.target.value })}
                  placeholder="Enter compelling YouTube video title..."
                  maxLength={100}
                  className="w-full bg-[#181818] border border-[#242424] rounded-xl px-3 py-2 text-xs text-white font-semibold outline-none focus:border-[#2563EB] transition-colors"
                />
              </div>

              {/* Expandable AI Title Suggestions Drawer */}
              {showTitleDrawer && (
                <div className="p-2.5 rounded-xl bg-[#141414] border border-[#242424] flex flex-col gap-2 animate-scale-up">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#60A5FA] font-bold uppercase tracking-wider flex items-center gap-1">
                      ⚡ High-CTR Viral Hook Titles
                    </span>
                    <button
                      type="button"
                      disabled={isGeneratingMeta}
                      onClick={() => handleGenerateMetadata('title')}
                      className="text-[9px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <Shuffle className={`w-2.5 h-2.5 ${isGeneratingMeta && generatingSection === 'title' ? 'animate-spin text-[#60A5FA]' : ''}`} />
                      <span>{isGeneratingMeta && generatingSection === 'title' ? 'Refining…' : 'Generate More'}</span>
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {titleSuggestions.length === 0 ? (
                      <p className="px-2 py-3 text-center text-[10px] text-zinc-500">
                        Generate AI metadata to get title suggestions.
                      </p>
                    ) : titleSuggestions.map((item, idx) => {
                      const isSelected = videoTitle.trim() === item.title.trim();
                      return (
                        <button
                          key={`${item.title}-${idx}`}
                          type="button"
                          onClick={() => handleSelectTitle(item.title)}
                          className={`text-left p-2 rounded-lg text-xs transition-all flex flex-col gap-1 border cursor-pointer ${
                            isSelected
                              ? 'bg-[#2563EB] border-[#60A5FA]/40 text-white shadow-xs'
                              : 'bg-[#181818] border-[#242424] text-zinc-300 hover:bg-[#26262C] hover:border-white/10 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[9px] font-mono-studio">
                            <span className="text-[#93C5FD] font-semibold">{item.angle}</span>
                            <span className="px-1.5 py-0.2 rounded bg-[#2563EB] text-white font-bold border border-[#60A5FA]/40">
                              AI: {item.viralityScore}/100
                            </span>
                          </div>
                          <span className="text-[11px] font-medium leading-snug">{item.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Video Description (Fully Editable + AI Polish + Formatting Templates) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2 text-[10px] font-mono-studio">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-slate-400 uppercase font-bold">Video Description</span>
                  <span className="whitespace-nowrap text-[9px] text-zinc-500">
                    {customDescription.length} chars • {customDescription.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    disabled={isGeneratingMeta}
                    onClick={() => handleGenerateMetadata('desc')}
                    className="h-7 inline-flex shrink-0 items-center gap-1 px-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white border border-[#60A5FA]/40 shadow-xs transition-colors cursor-pointer text-[10px] font-semibold whitespace-nowrap disabled:opacity-50 disabled:cursor-wait focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50"
                    title="AI Polish Description"
                    aria-label="AI polish description"
                    aria-busy={isGeneratingMeta && generatingSection === 'desc'}
                  >
                    <Wand2 className={`w-3.5 h-3.5 ${isGeneratingMeta && generatingSection === 'desc' ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingMeta && generatingSection === 'desc' ? 'Writing…' : 'AI Polish'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyDescription}
                    className="h-7 inline-flex shrink-0 items-center gap-1 px-2 rounded-lg bg-[#181818] hover:bg-[#26262C] text-zinc-300 hover:text-white border border-[#242424] hover:border-white/10 transition-colors cursor-pointer text-[10px] font-medium whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50"
                    title="Copy description"
                    aria-label={copiedDescription ? 'Description copied' : 'Copy description'}
                  >
                    {copiedDescription ? (
                      <Check className="w-2.5 h-2.5 text-[#3B82F6]" />
                    ) : (
                      <Copy className="w-2.5 h-2.5" />
                    )}
                    <span>{copiedDescription ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <textarea
                rows={5}
                value={customDescription}
                onChange={(e) => handleUpdateDescription(e.target.value)}
                placeholder="Write or generate rich YouTube video description..."
                className="w-full bg-[#181818] border border-[#242424] rounded-xl px-3 py-2 text-xs text-zinc-200 font-sans outline-none focus:border-[#2563EB] resize-none custom-scrollbar leading-relaxed"
              />
            </div>

            {/* Quick Hashtags Strip in Meta Tab */}
            <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-[#141414] border border-[#242424]">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400 uppercase font-bold font-mono-studio flex items-center gap-1">
                  <Hash className="w-3 h-3 text-[#60A5FA]" /> Attached Hashtags ({tags.length})
                </span>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('seo')}
                  className="text-[10px] text-[#60A5FA] hover:text-white font-medium cursor-pointer"
                >
                  {tags.length ? 'Edit in SEO →' : 'Add hashtags →'}
                </button>
              </div>
              {tags.length ? (
                <div className="flex flex-wrap gap-1">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#181818] hover:bg-[#26262C] border border-[#242424] hover:border-white/10 text-[10px] text-zinc-200 hover:text-white font-medium transition-colors"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        aria-label={`Remove ${t}`}
                        className="text-zinc-400 hover:text-white cursor-pointer ml-0.5"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] leading-relaxed text-[#9CA3AF]">
                  No hashtags added yet. Open SEO to add your own or generate relevant suggestions.
                </p>
              )}
            </div>

            {/* Visibility / Privacy */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-mono-studio text-slate-400 font-bold">
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
                          ? 'bg-[#2563EB] border-[#60A5FA]/40 text-white shadow-[0_0_12px_rgba(37,99,235,0.25)] font-semibold'
                          : 'bg-[#181818] border-[#242424] text-zinc-400 hover:text-white hover:bg-[#26262C] hover:border-white/10'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 mb-1 ${isSelected ? 'text-white' : 'text-zinc-400'}`} />
                      <span className="text-[11px] font-semibold">{item.label}</span>
                      <span className={`text-[9px] ${isSelected ? 'text-blue-100/90' : 'text-zinc-500'}`}>{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category & Audience — Using Website CustomSelect Dropdown Component */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-mono-studio text-slate-500 tracking-wider">
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
                <label className="text-[10px] uppercase font-mono-studio text-slate-500 tracking-wider">
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

        {/*
            TAB 2: Shorts SEO (Viral Optimization, Keywords & Checklist)
            */}
        {activeSubTab === 'seo' && (
          <div className="flex flex-col gap-3.5">
            {/* Gemini title estimate */}
            <div className="p-3.5 rounded-xl bg-[#141414] border border-[#242424] flex items-center justify-between shadow-xs">
              <div>
                <div className="text-[10px] uppercase font-mono-studio text-[#60A5FA] font-bold flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-[#60A5FA]" /> AI Title Score Estimate
                </div>
                <div className="text-xl font-black text-white mt-0.5 font-mono">
                  {viralScore ?? '—'} <span className="text-xs font-normal text-[#9CA3AF]">/ 100</span>
                </div>
              </div>
              <div className="text-[10px] text-right font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#181818] border border-[#242424]">
                <TrendingUp className={`w-3.5 h-3.5 ${viralScore !== null && viralScore >= 80 ? 'text-[#60A5FA]' : 'text-[#9CA3AF]'}`} />
                <span className={viralScore !== null && viralScore >= 80 ? 'text-[#60A5FA]' : 'text-[#9CA3AF]'}>
                  {viralScore === null ? 'Awaiting AI analysis' : viralScore >= 80 ? 'Strong AI estimate' : 'AI estimate'}
                </span>
              </div>
            </div>

            {/* Hashtags & Suggested Tags Manager */}
            <div className="p-3.5 rounded-xl bg-[#141414] border border-[#242424] flex flex-col gap-3 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex min-w-0 items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono-studio text-[#9CA3AF] uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-[#60A5FA]" /> Active Hashtags ({tags.length})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                  <button
                    type="button"
                    disabled={isGeneratingMeta}
                    onClick={() => handleGenerateMetadata('tags')}
                    className="text-[10px] px-2.5 py-1.5 rounded-lg bg-[#1E1E1E] hover:bg-[#26262C] text-[#9CA3AF] hover:text-white border border-[#242424] hover:border-[#3B82F6]/50 font-semibold cursor-pointer flex items-center gap-1.5 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-wait"
                  >
                    <Sparkles className={`w-3 h-3 ${isGeneratingMeta && generatingSection === 'tags' ? 'animate-spin text-[#60A5FA]' : 'text-[#60A5FA]'}`} />
                    <span>{isGeneratingMeta && generatingSection === 'tags' ? 'Generating…' : 'AI Generate'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyAllHashtags}
                    disabled={tags.length === 0}
                    className="px-2.5 py-1.5 rounded-lg bg-[#1E1E1E] hover:bg-[#26262C] border border-[#242424] hover:border-[#3B82F6]/40 text-[10px] text-[#9CA3AF] hover:text-white cursor-pointer flex items-center gap-1.5 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Copy className="w-2.5 h-2.5" />
                    <span>Copy</span>
                  </button>
                  {tags.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllTags}
                      className="p-1.5 rounded-lg bg-[#1E1E1E] hover:bg-[#26262C] border border-[#242424] hover:border-[#3B82F6]/40 text-[#9CA3AF] hover:text-[#60A5FA] cursor-pointer flex items-center justify-center transition-colors"
                      title="Clear all hashtags"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tag Input */}
              <div className="flex gap-2">
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
                  aria-label="Add a hashtag"
                  placeholder="Add a hashtag, e.g. #ContentCreator"
                  className="min-w-0 flex-1 bg-[#121212] border border-[#242424] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/15 rounded-lg px-3 py-2 text-xs text-[#E5E5E5] placeholder:text-[#6B7280] outline-none transition-colors"
                />
                <button
                  type="button"
                  disabled={!newTagInput.trim()}
                  onClick={() => handleAddHashtag()}
                  className="px-3 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white flex items-center gap-1 cursor-pointer border border-[#60A5FA]/40 shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>

              {/* Active Tag Cloud */}
              <div className="flex flex-wrap gap-1.5 min-h-10 p-2.5 rounded-lg bg-[#121212] border border-[#242424]">
                {tags.length === 0 ? (
                  <span className="w-full py-1 text-center text-[10px] text-[#6B7280]">
                    Your hashtags will appear here. Add one above or generate video-specific suggestions.
                  </span>
                ) : (
                  tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex max-w-full items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-[#1E1E1E] border border-[#3B82F6]/30 text-[10px] text-[#60A5FA] font-medium animate-scale-up"
                    >
                      <span className="truncate">{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        aria-label={`Remove ${tag}`}
                        className="shrink-0 rounded-full p-0.5 text-[#9CA3AF] hover:bg-[#3B82F6]/20 hover:text-white cursor-pointer transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Categorized Smart Tag Recommendations */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[#242424]">
                {!hasHashtagSuggestions ? (
                  <div className="rounded-lg border border-dashed border-[#333333] bg-[#121212] px-3 py-3.5 text-center">
                    <Sparkles className="mx-auto mb-1.5 h-4 w-4 text-[#60A5FA]" />
                    <p className="text-[10px] font-medium text-[#E5E5E5]">No recommendations yet</p>
                    <p className="mt-0.5 text-[10px] text-[#6B7280]">
                      Generate metadata to get hashtag suggestions based on your video.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {hashtagCategories.map(({ key, label, tags: suggestions }) => {
                      if (suggestions.length === 0) return null;
                      const remainingCount = suggestions.filter((tag) => !tags.includes(tag)).length;

                      return (
                        <section key={key} className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[#60A5FA]">
                              {label}
                            </span>
                            <button
                              type="button"
                              disabled={remainingCount === 0}
                              onClick={() => handleAddAllFromCategory(key)}
                              className="rounded-md px-1.5 py-0.5 text-[9px] font-semibold text-[#60A5FA] transition-colors hover:bg-[#3B82F6]/10 hover:text-white disabled:cursor-default disabled:text-[#6B7280]"
                            >
                              {remainingCount > 0 ? `Add remaining (${remainingCount})` : 'All added'}
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {suggestions.map((suggestion) => {
                              const isAdded = tags.includes(suggestion);
                              return (
                                <button
                                  key={suggestion}
                                  type="button"
                                  onClick={() => handleAddHashtag(suggestion)}
                                  disabled={isAdded}
                                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[9px] font-medium transition-colors ${
                                    isAdded
                                      ? 'border-[#3B82F6]/25 bg-[#3B82F6]/10 text-[#60A5FA] cursor-default'
                                      : 'border-[#242424] bg-[#1E1E1E] text-[#9CA3AF] hover:border-[#3B82F6]/50 hover:bg-[#26262C] hover:text-white cursor-pointer'
                                  }`}
                                >
                                  {isAdded ? <Check className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5 text-[#60A5FA]" />}
                                  {suggestion}
                                </button>
                              );
                            })}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <section className="rounded-xl border border-[#242424] bg-[#141414] p-3.5">
              <div className="mb-2.5">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#E5E5E5]">
                  Script highlights
                </h3>
                <p className="mt-1 text-[10px] leading-relaxed text-[#6B7280]">
                  Taken from your current script. These checks do not predict viewer retention.
                </p>
              </div>
              <div className="grid gap-2">
                {[
                  { label: 'Opening hook', value: hookText },
                  { label: 'Call to action', value: ctaText },
                ].map((item) => {
                  const hasContent = Boolean(item.value.trim());
                  const preview = item.value.trim();

                  return (
                    <div
                      key={item.label}
                      className="flex min-w-0 items-start gap-2.5 rounded-lg border border-[#242424] bg-[#121212] p-2.5"
                    >
                      <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                        hasContent ? 'bg-[#3B82F6]/15 text-[#60A5FA]' : 'bg-[#1E1E1E] text-[#6B7280]'
                      }`}>
                        {hasContent ? <Check className="h-2.5 w-2.5" /> : <span className="h-1 w-1 rounded-full bg-current" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-semibold text-[#E5E5E5]">{item.label}</div>
                        <p
                          className={`mt-0.5 break-words text-[10px] leading-relaxed ${
                            hasContent ? 'text-[#9CA3AF]' : 'text-[#6B7280]'
                          }`}
                          title={preview || undefined}
                        >
                          {preview || 'Not added to the script yet'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl border border-[#242424] bg-[#141414] p-3.5">
              <div className="mb-2.5">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#E5E5E5]">
                  Publishing readiness
                </h3>
                <p className="mt-1 text-[10px] leading-relaxed text-[#6B7280]">
                  Live checks from your title, script, hashtags, and channel connection.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                {readinessChecks.map((item) => (
                  <div
                    key={item.label}
                    className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-[#242424] bg-[#121212] px-2.5 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                        item.pass === true
                          ? 'bg-[#3B82F6]/15 text-[#60A5FA]'
                          : 'bg-[#1E1E1E] text-[#6B7280]'
                      }`}>
                        {item.pass === true
                          ? <Check className="h-2.5 w-2.5" />
                          : item.pass === null
                          ? <span className="h-2 w-2 animate-spin rounded-full border border-current border-t-transparent" />
                          : <span className="h-1 w-1 rounded-full bg-current" />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-medium text-[#E5E5E5]">{item.label}</p>
                        <p className="truncate text-[9px] text-[#6B7280]">{item.detail}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 text-[9px] font-semibold ${
                      item.pass === true ? 'text-[#60A5FA]' : 'text-[#6B7280]'
                    }`}>
                      {item.pass === true ? 'Ready' : item.pass === null ? 'Checking' : 'Needs attention'}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* ── Sticky Bottom Action Bar (With Live Published YouTube Video Link) ── */}
      <div className="p-3 bg-[#111111] border-t border-[#242424] shrink-0 flex flex-col gap-2.5">
        {publishedSuccess && (publishedVideoUrl || channel) ? (
          <div className="flex flex-col gap-2">
            <a
              href={publishedVideoUrl || channel?.channelUrl || `https://www.youtube.com/${channel?.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Watch Short on YouTube</span>
              <ExternalLink className="w-3.5 h-3.5 ml-0.5 text-white" />
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
                className="h-9 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 bg-[#181818] hover:bg-[#26262C] text-zinc-300 hover:text-white border border-[#242424] hover:border-white/10 transition-all cursor-pointer shadow-sm"
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
                className="h-9 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white border border-[#60A5FA]/40 transition-all cursor-pointer shadow-sm shadow-[0_0_10px_rgba(37,99,235,0.25)]"
                title="Start a new script & generate a fresh video"
              >
                <Plus className="w-3.5 h-3.5 text-[#60A5FA]" />
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
                : !canPublish || publishing
                ? 'bg-[#181818] text-[#52525B] border border-[#242424] cursor-not-allowed'
                : 'bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] text-white shadow-[0_0_18px_rgba(37,99,235,0.35)] border border-[#60A5FA]/40'
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
        {publishedSuccess && showPublishedLink && (
          <div className="p-2.5 rounded-xl bg-[#161616] border border-[#3B82F6]/30 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono-studio">
              <span className="text-[#60A5FA] font-bold flex items-center gap-1">
                <Youtube className="w-3 h-3 text-[#60A5FA]" /> Published Video Link:
              </span>
              <div className="flex items-center gap-3">
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
                <button
                  type="button"
                  onClick={() => setShowPublishedLink(false)}
                  className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
                  title="Close published video link"
                  aria-label="Close published video link"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {publishedVideoUrl ? (
              <a
                href={publishedVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 underline font-mono truncate flex items-center justify-between gap-1 p-1.5 rounded bg-[#141414] border border-[#242424]"
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
                  className="text-zinc-400 hover:text-[#60A5FA] transition-colors flex items-center gap-1"
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
                  className="text-[#60A5FA] hover:text-[#93C5FD] font-bold flex items-center gap-1 ml-auto"
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
