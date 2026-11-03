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
  const [tags, setTags] = useState<string[]>(() => {
    if (script?.hashtags && script.hashtags.length > 0) return script.hashtags;
    if (script?.tags && script.tags.length > 0) return script.tags;
    return ['#Shorts', '#ApexMind', '#Motivation', '#Stoicism', '#Discipline', '#Mindset', '#AI', '#AIGenerated'];
  });
  const [newTagInput, setNewTagInput] = useState('');

  // AI Metadata Generation States
  const [isGeneratingMeta, setIsGeneratingMeta] = useState<boolean>(false);
  const [generatingSection, setGeneratingSection] = useState<'all' | 'title' | 'desc' | 'tags' | null>(null);
  const [showTitleDrawer, setShowTitleDrawer] = useState<boolean>(false);
  const [copiedDescription, setCopiedDescription] = useState<boolean>(false);

  const [titleSuggestions, setTitleSuggestions] = useState<Array<{ title: string; angle: string; viralityScore: number }>>(() => [
    { title: script?.title || 'The Stoic Discipline Code', angle: 'Primary Hook', viralityScore: 98 },
    ...(script?.titleIdeas || [
      { title: 'Stop Waiting for Motivation (Brutal Truth)', angle: 'Brutal Truth', viralityScore: 96 },
      { title: 'The Quiet Rule Marcus Aurelius Never Broke', angle: 'Curiosity Gap', viralityScore: 94 },
      { title: 'Why Weak Men Seek Comfort (And Strong Men Don\'t)', angle: 'Direct Challenge', viralityScore: 92 },
      { title: 'How to Conquer Your Mind in Total Silence', angle: 'Stoic Insight', viralityScore: 90 },
    ]),
  ]);

  const [categorizedTags, setCategorizedTags] = useState<{
    trending: string[];
    niche: string[];
    growth: string[];
    ai: string[];
  }>({
    trending: ['#Shorts', '#YouTubeShorts', '#AI', '#AIGenerated', '#ViralShorts', '#ShortsFeed'],
    niche: ['#Stoicism', '#MarcusAurelius', '#StoicMindset', '#DailyDiscipline', '#InnerStrength'],
    growth: ['#Motivation', '#SelfImprovement', '#Discipline', '#Mindset', '#Success'],
    ai: ['#AI', '#AIGenerated', '#AICreation', '#ApexMindAI', '#AIVideo'],
  });

  const [customDescription, setCustomDescription] = useState<string>(() => {
    if (script?.description) return script.description;
    const h = script?.hook || '';
    const q = script?.quote || '';
    const c = script?.cta || '';
    const t = (script?.hashtags && script.hashtags.length > 0 ? script.hashtags : tags).join(' ');
    return q || h
      ? `${h ? `⚡ ${h}\n\n` : ''}📜 ${q ? `${q}\n\n` : ''}${c ? `🎯 ${c}\n\n` : ''}🤖 AI Disclosure: This video and audio were created with AI (ApexMind AI Studio).\n\n${t}`
      : 'Transform your mindset. Conquer your inner storm.\n\n🤖 AI Disclosure: This video and audio were created with AI tools using ApexMind AI.\n\n#Shorts #Motivation #Discipline #AI #AIGenerated';
  });

  useEffect(() => {
    if (script?.description && script.description !== customDescription) {
      setCustomDescription(script.description);
    }
    if (script?.titleIdeas && script.titleIdeas.length > 0) {
      setTitleSuggestions([
        { title: script.title || 'The Stoic Discipline Code', angle: 'Primary Hook', viralityScore: 98 },
        ...script.titleIdeas,
      ]);
    }
    if (script?.hashtags && script.hashtags.length > 0) {
      setTags(script.hashtags);
    }
  }, [script?.description, script?.titleIdeas, script?.hashtags]);

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
    ? `${hookText ? `${hookText}\n\n` : ''}${quoteText ? `${quoteText}\n\n` : ''}${ctaText ? `${ctaText}\n\n` : ''}🤖 AI Disclosure: This video and audio were created with AI (ApexMind AI Studio).\n\n${tagsText}`
    : 'Transform your mindset. Conquer your inner storm.\n\n🤖 AI Disclosure: This video and audio were created with AI tools using ApexMind AI.\n\n#Shorts #Motivation #Discipline #AI #AIGenerated';

  const handleUpdateDescription = (newDesc: string) => {
    setCustomDescription(newDesc);
    onUpdateScript?.({ description: newDesc });
  };

  const handleSelectTitle = (chosenTitle: string) => {
    onUpdateScript?.({ title: chosenTitle });
    toast.success(`Title applied: "${chosenTitle}"`);
    setShowTitleDrawer(false);
  };

  const handleApplyDescriptionTemplate = (type: 'viral' | 'takeaways' | 'minimal') => {
    const h = script?.hook || 'Stop waiting for motivation to strike.';
    const q = script?.quote || 'Discipline is an unyielding contract you honor with yourself in total silence.';
    const c = script?.cta || 'Subscribe for daily mental mastery.';
    const t = tags.join(' ');

    let generated = '';
    if (type === 'viral') {
      generated = `⚡ ${h}\n\n${q}\n\n🎯 ${c}\n\n🤖 AI Disclosure: Video & audio generated with AI by ApexMind AI Studio.\n\n${t}`;
    } else if (type === 'takeaways') {
      generated = `⚡ ${h}\n\n📜 ${q}\n\nKey Takeaways:\n• Action creates momentum, not waiting for mood.\n• The obstacle in front of you becomes your path.\n• Silence and execution beat loud excuses.\n\n🎯 ${c}\n\n🤖 AI Disclosure: Video & audio generated with AI by ApexMind AI Studio.\n\n${t}`;
    } else {
      generated = `${q}\n\n🤖 Video created with AI.\n\n${t}`;
    }
    handleUpdateDescription(generated);
    toast.success(`Applied ${type === 'viral' ? 'Viral Shorts' : type === 'takeaways' ? 'Deep Takeaways' : 'Minimal'} template`);
  };

  const handleGenerateMetadata = async (mode: 'all' | 'title' | 'desc' | 'tags' = 'all') => {
    setIsGeneratingMeta(true);
    setGeneratingSection(mode);
    try {
      const result = await workspaceApi.generateMetadata({
        category,
        topic: videoTitle || script?.category || 'Stoic Mindset & Discipline',
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
        if (result.hashtags) {
          setCategorizedTags({
            trending: result.hashtags.trending || [],
            niche: result.hashtags.niche || [],
            growth: result.hashtags.growth || [],
            ai: (result.hashtags.ai && result.hashtags.ai.length > 0)
              ? result.hashtags.ai
              : ['#AI', '#AIGenerated', '#AICreation', '#ApexMindAI', '#AIVideo'],
          });
        }
        if (mode === 'tags' || (mode === 'all' && tags.length < 3)) {
          const freshTags = result.allHashtags.slice(0, 8);
          setTags(freshTags);
          onUpdateScript?.({ hashtags: freshTags, tags: freshTags });
        }
      }

      toast.success(
        mode === 'all'
          ? 'AI generated fresh titles, description, and hashtags!'
          : mode === 'title'
          ? 'AI generated 5 viral title hooks!'
          : mode === 'desc'
          ? 'AI crafted rich SEO description!'
          : 'AI generated fresh trending hashtags!'
      );
    } catch (err: any) {
      toast.error('Could not generate metadata: ' + (err.message || 'Error'));
    } finally {
      setIsGeneratingMeta(false);
      setGeneratingSection(null);
    }
  };

  const handleAddAllFromCategory = (catKey: 'trending' | 'niche' | 'growth' | 'ai') => {
    const list = categorizedTags[catKey] || [];
    const combined = Array.from(new Set([...tags, ...list]));
    setTags(combined);
    onUpdateScript?.({ hashtags: combined, tags: combined });
    toast.success(`Added ${list.length} tags from ${catKey}`);
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
    <div className="flex flex-col h-full bg-[#141414] text-white font-sans-studio select-none overflow-hidden rounded-none border-0">
      {/* ── Top Header Bar (Ambient glow, refined micro-actions) ── */}
      <div className="relative h-12 px-3.5 bg-[#141414] border-b border-[#242424] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 flex items-center justify-center shrink-0 shadow-sm shadow-red-950/40">
            <Youtube className="w-4 h-4 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-white tracking-tight">YouTube Studio</span>
          </div>
        </div>

        {/* ── Header Actions (View, Sync, Search, Unlink) ── */}
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
              onClick={() => setShowHandleSearch(!showHandleSearch)}
              className={`h-7 w-7 rounded-lg transition-all border flex items-center justify-center cursor-pointer shadow-xs ${
                showHandleSearch
                  ? 'bg-[#2563EB] border-[#60A5FA]/40 text-white'
                  : 'bg-[#181818] hover:bg-[#26262C] text-zinc-400 hover:text-white border-[#242424] hover:border-white/10'
              }`}
              title="Switch or Search Channel"
            >
              <Search className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={handleDisconnectChannel}
              className="h-7 w-7 rounded-lg bg-[#181818] hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-all border border-[#242424] hover:border-red-500/30 flex items-center justify-center cursor-pointer shadow-xs"
              title="Disconnect Channel"
            >
              <Unlink className="w-3 h-3" />
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
                    <span className="truncate">{channel.handle || '@channel'}</span>
                    {copiedHandle ? (
                      <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
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

                {/* Subtle live indicator dot */}
                <span className="relative flex h-2 w-2 shrink-0" title="Channel Connected">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
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
                  className="flex-1 bg-[#111111] border border-white/[0.1] rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-[#2563EB] transition-colors"
                />
                <button
                  type="submit"
                  disabled={isSearchingHandle || !customHandleInput.trim()}
                  className="px-3 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50 border border-[#60A5FA]/40 shadow-xs"
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
              <div className="w-8 h-8 rounded-xl bg-[#181818] border border-[#242424] flex items-center justify-center text-white shrink-0">
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
              className="px-2.5 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border border-[#60A5FA]/40 disabled:opacity-50 shrink-0"
            >
              <YouTubeIcon className="w-3.5 h-3.5" />
              <span>{connectingOAuth ? 'Connecting…' : 'Connect'}</span>
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
            <Sparkles className={`w-3.5 h-3.5 shrink-0 ${activeSubTab === 'seo' ? 'text-amber-400' : 'text-slate-400'}`} />
            <span className="truncate">Shorts SEO</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0 transition-colors ${
                activeSubTab === 'seo'
                  ? 'bg-white/20 text-white border border-white/30'
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
                  <Youtube className="w-3 h-3 text-red-500" /> Shorts Video Title
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
                  <span className={`text-[10px] ${videoTitle.length > 80 ? 'text-amber-400' : 'text-slate-500'}`}>
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
                      <Shuffle className={`w-2.5 h-2.5 ${isGeneratingMeta && generatingSection === 'title' ? 'animate-spin text-red-400' : ''}`} />
                      <span>{isGeneratingMeta && generatingSection === 'title' ? 'Refining…' : 'Generate More'}</span>
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {titleSuggestions.map((item, idx) => {
                      const isSelected = videoTitle.trim() === item.title.trim();
                      return (
                        <button
                          key={idx}
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
                              CTR: {item.viralityScore}%
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
              <div className="flex items-center justify-between text-[10px] font-mono-studio">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 uppercase font-bold">Video Description</span>
                  <span className="text-[9px] text-zinc-500">
                    {customDescription.length} chars • {customDescription.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={isGeneratingMeta}
                    onClick={() => handleGenerateMetadata('desc')}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#181818] hover:bg-[#26262C] text-zinc-300 hover:text-white border border-[#242424] hover:border-white/10 transition-colors cursor-pointer text-[10px]"
                    title="AI Polish Description"
                  >
                    <Wand2 className={`w-2.5 h-2.5 ${isGeneratingMeta && generatingSection === 'desc' ? 'animate-spin text-[#60A5FA]' : 'text-[#60A5FA]'}`} />
                    <span>{isGeneratingMeta && generatingSection === 'desc' ? 'Writing…' : 'AI Polish'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyDescription}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#181818] hover:bg-[#26262C] text-zinc-300 hover:text-white border border-[#242424] hover:border-white/10 transition-colors cursor-pointer text-[10px]"
                    title="Copy description"
                  >
                    {copiedDescription ? (
                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-2.5 h-2.5" />
                    )}
                    <span>{copiedDescription ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Quick Preset Formatting Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-0.5">
                <span className="text-[9px] text-zinc-500 uppercase font-bold shrink-0">Presets:</span>
                {[
                  { id: 'viral' as const, label: '⚡ Viral Shorts' },
                  { id: 'takeaways' as const, label: '📖 Deep Takeaways' },
                  { id: 'minimal' as const, label: '🎯 Minimal' },
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleApplyDescriptionTemplate(tpl.id)}
                    className="px-2.5 py-0.5 rounded-full text-[9px] font-medium bg-[#181818] hover:bg-[#26262C] text-zinc-300 hover:text-white border border-[#242424] hover:border-white/10 transition-colors cursor-pointer shrink-0"
                  >
                    {tpl.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const aiDisclosure = '\n\n🤖 AI Disclosure: This video and audio were created with AI (ApexMind AI Studio).';
                    if (!customDescription.toLowerCase().includes('created with ai') && !customDescription.toLowerCase().includes('ai disclosure')) {
                      handleUpdateDescription(customDescription.trim() + aiDisclosure);
                      toast.success('AI creation disclosure added to description');
                    } else {
                      toast.info('AI disclosure is already in the description');
                    }
                  }}
                  className="px-2.5 py-0.5 rounded-full text-[9px] font-medium bg-[#2563EB]/15 hover:bg-[#2563EB]/25 text-[#60A5FA] hover:text-white border border-[#3B82F6]/30 transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                  title="Insert mandatory AI Content Disclosure"
                >
                  <span>🤖</span>
                  <span>+ AI Disclosure</span>
                </button>
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
                  Manage in SEO →
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {tags.slice(0, 8).map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#181818] hover:bg-[#26262C] border border-[#242424] hover:border-white/10 text-[10px] text-zinc-200 hover:text-white font-medium transition-colors"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-zinc-400 hover:text-white cursor-pointer ml-0.5"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                {tags.length > 8 && (
                  <span className="text-[10px] text-zinc-500 self-center">+{tags.length - 8} more</span>
                )}
              </div>
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

        {/* ═══════════════════════════════════════════════════════════
            TAB 2: Shorts SEO (Viral Optimization, Keywords & Checklist)
            ═══════════════════════════════════════════════════════════ */}
        {activeSubTab === 'seo' && (
          <div className="flex flex-col gap-3.5">
            {/* Viral Algorithm Score Header Card */}
            <div className="p-3.5 rounded-xl bg-[#141414] border border-[#242424] flex items-center justify-between shadow-xs">
              <div>
                <div className="text-[10px] uppercase font-mono-studio text-[#60A5FA] font-bold flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-[#60A5FA]" /> Viral Algorithm Score
                </div>
                <div className="text-xl font-black text-white mt-0.5 font-mono">
                  {viralScore} <span className="text-xs font-normal text-zinc-400">/ 100</span>
                </div>
              </div>
              <div className="text-[10px] text-right font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#181818] border border-[#242424]">
                <TrendingUp className={`w-3.5 h-3.5 ${viralScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`} />
                <span className={viralScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}>
                  {viralScore >= 80 ? 'High Discovery' : 'Optimization Recommended'}
                </span>
              </div>
            </div>

            {/* Viral Hashtags & Suggested Tags Manager */}
            <div className="p-3.5 rounded-xl bg-[#141414] border border-[#242424] flex flex-col gap-2.5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono-studio text-slate-400 uppercase tracking-wider font-bold flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-[#60A5FA]" /> Active Hashtags ({tags.length})
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono font-bold border shrink-0 ${
                    tags.length >= 3 && tags.length <= 8
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}>
                    {tags.length >= 3 && tags.length <= 8 ? 'Optimal (3-8)' : '3-8 Recommended'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                  <button
                    type="button"
                    disabled={isGeneratingMeta}
                    onClick={() => handleGenerateMetadata('tags')}
                    className="text-[10px] px-2.5 py-1 rounded-md bg-[#181818] hover:bg-[#26262C] text-zinc-300 hover:text-white border border-[#242424] hover:border-white/10 font-semibold cursor-pointer flex items-center gap-1 transition-colors whitespace-nowrap"
                  >
                    <Sparkles className={`w-3 h-3 ${isGeneratingMeta && generatingSection === 'tags' ? 'animate-spin text-[#60A5FA]' : 'text-[#60A5FA]'}`} />
                    <span>{isGeneratingMeta && generatingSection === 'tags' ? 'Generating…' : 'AI Generate'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyAllHashtags}
                    className="px-2 py-1 rounded-md bg-[#181818] hover:bg-[#26262C] border border-[#242424] hover:border-white/10 text-[10px] text-zinc-300 hover:text-white cursor-pointer flex items-center gap-1 font-medium transition-colors"
                  >
                    <Copy className="w-2.5 h-2.5" />
                    <span>Copy</span>
                  </button>
                  {tags.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllTags}
                      className="p-1 rounded-md bg-[#181818] hover:bg-rose-500/10 border border-[#242424] hover:border-rose-500/30 text-zinc-400 hover:text-rose-400 cursor-pointer flex items-center justify-center transition-colors"
                      title="Clear all hashtags"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
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
                  placeholder="Add custom hashtag (e.g. #StoicGrit)..."
                  className="flex-1 bg-[#141416] border border-[#24242A] focus:border-[#2563EB] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => handleAddHashtag()}
                  className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white flex items-center gap-1 cursor-pointer border border-[#60A5FA]/40 shadow-xs transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>

              {/* Active Tag Cloud */}
              <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-lg bg-[#141414] border border-[#222228]">
                {tags.length === 0 ? (
                  <span className="text-[11px] text-zinc-500 italic py-0.5">No hashtags added yet. Click suggestions below or AI Generate.</span>
                ) : (
                  tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#181818] hover:bg-[#26262C] border border-[#242424] hover:border-white/10 text-[10px] text-zinc-200 hover:text-white font-medium animate-scale-up transition-colors"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-zinc-400 hover:text-white cursor-pointer ml-0.5"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Categorized Smart Tag Recommendations */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[#25252A]">
                {/* 1. Trending Shorts Cluster */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-[#60A5FA] font-bold uppercase tracking-wider flex items-center gap-1">
                      🔥 High-Velocity Shorts Tags
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddAllFromCategory('trending')}
                      className="text-[9px] text-zinc-400 hover:text-white cursor-pointer font-semibold"
                    >
                      + Add All ({categorizedTags.trending.length})
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {categorizedTags.trending.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleAddHashtag(sug)}
                        disabled={tags.includes(sug)}
                        className={`text-[9px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                          tags.includes(sug)
                            ? 'opacity-30 border-transparent bg-transparent cursor-default'
                            : 'bg-[#181818] border-[#242424] text-zinc-400 hover:text-white hover:bg-[#26262C] hover:border-white/10 active:scale-95'
                        }`}
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Niche Mindset & Topic Cluster */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-[#60A5FA] font-bold uppercase tracking-wider flex items-center gap-1">
                      🧠 Category &amp; Niche Authority
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddAllFromCategory('niche')}
                      className="text-[9px] text-zinc-400 hover:text-white cursor-pointer font-semibold"
                    >
                      + Add All ({categorizedTags.niche.length})
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {categorizedTags.niche.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleAddHashtag(sug)}
                        disabled={tags.includes(sug)}
                        className={`text-[9px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                          tags.includes(sug)
                            ? 'opacity-30 border-transparent bg-transparent cursor-default'
                            : 'bg-[#181818] border-[#242424] text-zinc-400 hover:text-white hover:bg-[#26262C] hover:border-white/10 active:scale-95'
                        }`}
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. High-Reach Growth Cluster */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      🚀 Algorithm Growth &amp; Reach
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddAllFromCategory('growth')}
                      className="text-[9px] text-zinc-400 hover:text-white cursor-pointer font-semibold"
                    >
                      + Add All ({categorizedTags.growth.length})
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {categorizedTags.growth.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleAddHashtag(sug)}
                        disabled={tags.includes(sug)}
                        className={`text-[9px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                          tags.includes(sug)
                            ? 'opacity-30 border-transparent bg-transparent cursor-default'
                            : 'bg-[#181818] border-[#242424] text-zinc-400 hover:text-white hover:bg-[#26262C] hover:border-white/10 active:scale-95'
                        }`}
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. AI Content & Disclosure Cluster */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      🤖 AI Content &amp; Disclosure
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddAllFromCategory('ai')}
                      className="text-[9px] text-zinc-400 hover:text-white cursor-pointer font-semibold"
                    >
                      + Add All ({(categorizedTags.ai || []).length})
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(categorizedTags.ai || []).map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleAddHashtag(sug)}
                        disabled={tags.includes(sug)}
                        className={`text-[9px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                          tags.includes(sug)
                            ? 'opacity-30 border-transparent bg-transparent cursor-default'
                            : 'bg-[#181818] border-[#242424] text-zinc-400 hover:text-white hover:bg-[#26262C] hover:border-white/10 active:scale-95'
                        }`}
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Retention & Content Signals */}
            <div className="p-3 rounded-xl bg-[#181818] border border-[#242424] flex flex-col gap-2">
              <span className="text-[10px] font-mono-studio text-slate-400 uppercase tracking-wider font-bold">
                Viewer Retention Signals
              </span>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[#111111] border border-[#24242A] text-xs">
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

              <div className="flex items-center justify-between p-2 rounded-lg bg-[#111111] border border-[#24242A] text-xs">
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
            <div className="p-3 rounded-xl bg-[#181818] border border-[#242424] flex flex-col gap-1.5">
              <span className="text-[10px] font-mono-studio text-slate-500 uppercase tracking-wider font-bold">
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
                  className="flex items-center justify-between p-1.5 rounded-lg bg-[#111111] border border-[#24242A] text-xs"
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
      <div className="p-3 bg-[#111111] border-t border-[#242424] shrink-0 flex flex-col gap-2.5">
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
        {publishedSuccess && (
          <div className="p-2.5 rounded-xl bg-[#161616] border border-emerald-500/30 flex flex-col gap-1.5">
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
