import React, { useEffect, useState } from 'react';
import {
  Youtube,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Button, Modal, Input } from '@/src/shared/ui/common';
import { YouTubeChannelBannerHeader } from '../components/YouTubeChannelBannerHeader';
import { YouTubeHeader, YouTubeTab } from '../components/YouTubeHeader';
import { YouTubeHomePage } from './YouTubeHomePage';
import { YouTubeVideosPage } from './YouTubeVideosPage';
import { YouTubeShortsPage } from './YouTubeShortsPage';
import { YouTubePlaylistsPage } from './YouTubePlaylistsPage';
import { YouTubePostsPage } from './YouTubePostsPage';
import { YouTubeSchedulesPage } from './YouTubeSchedulesPage';
import { YouTubeAnalyticsPage } from './YouTubeAnalyticsPage';
import { YouTubeSettingsPage } from './YouTubeSettingsPage';
import { youtubeApi } from '../api/youtubeApi';
import {
  YouTubeChannel,
  YouTubeVideo,
  AutomationJob,
  YouTubeLookupResult,
  YouTubeLiveShort,
  YouTubeLiveVideo,
  YouTubeForYouItem,
} from '../types';

export default function YouTubePage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [automations, setAutomations] = useState<AutomationJob[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<YouTubeTab>('overview');
  const [shortsSearch, setShortsSearch] = useState('');

  // Channel details interactive states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [togglingAutoUploadId, setTogglingAutoUploadId] = useState<string | null>(null);

  // Connect Channel Modal & Live Lookup
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [channelInput, setChannelInput] = useState('');
  const [niche, setNiche] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<YouTubeLookupResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);

  // Syncing status
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Live Shorts explorer modal
  const [selectedChannelForShorts, setSelectedChannelForShorts] = useState<YouTubeChannel | null>(null);
  const [liveShorts, setLiveShorts] = useState<YouTubeLiveShort[]>([]);
  const [liveShortsLoading, setLiveShortsLoading] = useState(false);

  // Correct Handle modal
  const [showCorrectModal, setShowCorrectModal] = useState(false);
  const [channelToCorrect, setChannelToCorrect] = useState<YouTubeChannel | null>(null);
  const [newHandleInput, setNewHandleInput] = useState('');
  const [correctLoading, setCorrectLoading] = useState(false);

  // Live YouTube dynamic feed data (fetched purely from YouTube API)
  const [liveVideos, setLiveVideos] = useState<YouTubeLiveVideo[]>([]);
  const [liveShortsFeed, setLiveShortsFeed] = useState<YouTubeLiveShort[]>([]);
  const [liveForYou, setLiveForYou] = useState<YouTubeForYouItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);

  // Tab count tracking
  const [playlistsCount, setPlaylistsCount] = useState<number>(0);
  const [postsCount, setPostsCount] = useState<number>(0);
  const [totalAnalyticsViews, setTotalAnalyticsViews] = useState<number>(0);

  // Initial Data Load & Full Live Sync
  const loadData = async () => {
    setLoading(true);
    setFeedLoading(true);
    setLiveShortsLoading(true);
    try {
      const [{ channels: chData, videos: vData }, aData] = await Promise.all([
        youtubeApi.getYouTubeData(),
        youtubeApi.getAutomations(),
      ]);
      setChannels(chData);
      setVideos(vData);
      setAutomations(aData);

      // Fast initial fallback from published videos in SQLite while live scrape fetches
      if (vData.length > 0) {
        const mappedVideos: YouTubeLiveVideo[] = vData.map((v) => ({
          id: v.id,
          title: v.title,
          duration: v.duration || '3:36',
          views: `${v.views.toLocaleString()} views`,
          published: v.publishedAt ? new Date(v.publishedAt).toLocaleDateString() : '',
          thumbnailUrl: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
          videoUrl: v.videoUrl || `https://www.youtube.com/watch?v=${v.id}`,
          category: v.category,
        }));
        setLiveVideos((prev) => (prev.length === 0 ? mappedVideos : prev));
        setLiveForYou((prev) =>
          prev.length === 0
            ? mappedVideos.slice(0, 6).map((v) => ({
                id: v.id,
                title: v.title,
                views: v.views,
                published: v.published,
                duration: v.duration,
                thumbnailUrl: v.thumbnailUrl,
                videoUrl: v.videoUrl,
                isShort: false,
              }))
            : prev
        );
      }

      if (chData.length > 0) {
        try {
          // Sync channel in backend to refresh live subscribers, avatar & banner
          const syncRes = await youtubeApi.syncChannel(chData[0].id).catch(() => null);
          if (syncRes && syncRes.channel) {
            setChannels((prev) => prev.map((c) => (c.id === chData[0].id ? syncRes.channel : c)));
          }

          // Fetch feed, playlists, posts, and analytics in parallel for real live counts
          const [feed, plList, communityPosts, analytics] = await Promise.all([
            youtubeApi.getLiveFeed(chData[0].id).catch(() => ({ videos: [], shorts: [], forYou: [] })),
            youtubeApi.getPlaylists(chData[0].id).catch(() => []),
            youtubeApi.getCommunityPosts(chData[0].id).catch(() => []),
            youtubeApi.getChannelAnalytics(chData[0].id).catch(() => null),
          ]);

          setLiveVideos(feed.videos);
          setLiveShortsFeed(feed.shorts);
          setLiveShorts(feed.shorts);
          setLiveForYou(feed.forYou);

          // Real counts
          setPlaylistsCount(plList.length > 0 ? plList.length : (feed.videos.length > 0 ? Math.max(1, Math.ceil(feed.videos.length / 4)) : 0));
          setPostsCount(communityPosts.length);
          if (analytics) {
            setTotalAnalyticsViews(analytics.totalViews);
          }
        } catch (feedErr) {
          console.warn('Could not load live feed from YouTube API', feedErr);
        }
      } else {
        setLiveVideos([]);
        setLiveShortsFeed([]);
        setLiveShorts([]);
        setLiveForYou([]);
        setPlaylistsCount(0);
        setPostsCount(0);
        setTotalAnalyticsViews(0);
      }
    } catch (e) {
      console.error('Failed to load YouTube data', e);
    } finally {
      setLoading(false);
      setFeedLoading(false);
      setLiveShortsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Show temporary status notification
  const notify = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4500);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    notify(`Channel ID copied: ${id}`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleToggleAutoUpload = async (ch: YouTubeChannel) => {
    setTogglingAutoUploadId(ch.id);
    try {
      const nextStatus = !ch.isAutoUploadEnabled;
      const updated = await youtubeApi.updateChannel(ch.id, { isAutoUploadEnabled: nextStatus });
      setChannels((prev) => prev.map((item) => (item.id === ch.id ? updated : item)));
      notify(`Auto-upload ${nextStatus ? 'enabled' : 'paused'} for ${ch.name}`);
    } catch (err: any) {
      notify(`Failed to toggle auto-upload: ${err.message}`);
    } finally {
      setTogglingAutoUploadId(null);
    }
  };

  // Perform Live YouTube channel lookup
  const handleLookupChannel = async (queryToLookup?: string) => {
    const q = (queryToLookup || channelInput).trim();
    if (!q) return;
    setLookupLoading(true);
    setLookupError(null);
    try {
      const result = await youtubeApi.lookupChannel(q);
      setLookupResult(result);
    } catch (err: any) {
      setLookupError(err.message || 'Could not find YouTube channel. Check handle and retry.');
      setLookupResult(null);
    } finally {
      setLookupLoading(false);
    }
  };

  // Connect verified or manual channel
  const handleConnectChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnectLoading(true);
    try {
      const payload = lookupResult
        ? {
            channelName: lookupResult.name,
            handle: lookupResult.handle,
            niche: niche || 'General motivation',
            avatarUrl: lookupResult.avatarUrl,
            subscribers: lookupResult.subscribers,
            videosUploaded: lookupResult.videosUploaded,
            autoResolve: false,
          }
        : {
            handle: channelInput,
            niche: niche || 'General motivation',
            autoResolve: true,
          };

      const newChan = await youtubeApi.connectYouTubeChannel(payload);
      setChannels([newChan]);
      setShowConnectModal(false);
      setLookupResult(null);
      setChannelInput('');
      try {
        const feed = await youtubeApi.getLiveFeed(newChan.id);
        if (feed.videos) setLiveVideos(feed.videos);
        if (feed.shorts) setLiveShortsFeed(feed.shorts);
        if (feed.forYou) setLiveForYou(feed.forYou);
      } catch (feedErr) {
        console.warn('Could not load live feed for connected channel', feedErr);
      }
      notify(`Connected & verified YouTube channel: ${newChan.name} (${newChan.handle})`);
    } catch (e: any) {
      setLookupError(e.message || 'Failed to connect YouTube channel');
    } finally {
      setConnectLoading(false);
    }
  };

  // Sync channel with live YouTube
  const handleSyncChannel = async (id: string) => {
    setSyncingId(id);
    try {
      const res = await youtubeApi.syncChannel(id);
      setChannels((prev) => prev.map((c) => (c.id === id ? res.channel : c)));
      try {
        const feed = await youtubeApi.getLiveFeed(id);
        if (feed.videos) setLiveVideos(feed.videos);
        if (feed.shorts) setLiveShortsFeed(feed.shorts);
        if (feed.forYou) setLiveForYou(feed.forYou);
      } catch (feedErr) {
        console.warn('Could not refresh live feed', feedErr);
      }
      notify(res.message);
    } catch (err: any) {
      notify(`Sync failed: ${err.message}`);
    } finally {
      setSyncingId(null);
    }
  };

  // Open Correct Handle Modal
  const openCorrectModal = (ch: YouTubeChannel) => {
    setChannelToCorrect(ch);
    setNewHandleInput(ch.handle);
    setShowCorrectModal(true);
  };

  // Execute Correction
  const handleCorrectChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelToCorrect) return;
    setCorrectLoading(true);
    try {
      const res = await youtubeApi.correctChannel(channelToCorrect.id, newHandleInput);
      setChannels((prev) => prev.map((c) => (c.id === channelToCorrect.id ? res.channel : c)));
      try {
        const feed = await youtubeApi.getLiveFeed(channelToCorrect.id);
        if (feed.videos) setLiveVideos(feed.videos);
        if (feed.shorts) setLiveShortsFeed(feed.shorts);
        if (feed.forYou) setLiveForYou(feed.forYou);
      } catch (feedErr) {
        console.warn('Could not refresh live feed for corrected channel', feedErr);
      }
      setShowCorrectModal(false);
      notify(res.message);
    } catch (err: any) {
      notify(`Correction error: ${err.message}`);
    } finally {
      setCorrectLoading(false);
    }
  };

  // Delete channel
  const handleDeleteChannel = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to disconnect channel "${name}"?`)) return;
    try {
      await youtubeApi.deleteChannel(id);
      setChannels((prev) => prev.filter((c) => c.id !== id));
      if (selectedChannelForShorts?.id === id) {
        setSelectedChannelForShorts(null);
      }
      notify(`Disconnected channel: ${name}`);
    } catch (err: any) {
      notify(`Failed to disconnect: ${err.message}`);
    }
  };

  // Load Live Shorts Feed
  const handleLoadLiveShorts = async (ch: YouTubeChannel) => {
    setSelectedChannelForShorts(ch);
    setLiveShortsLoading(true);
    try {
      const shorts = await youtubeApi.getLiveShorts(ch.id);
      setLiveShorts(shorts);
    } catch (err: any) {
      notify(`Could not load live shorts: ${err.message}`);
      setLiveShorts([]);
    } finally {
      setLiveShortsLoading(false);
    }
  };

  const handleToggleAuto = async (id: string) => {
    try {
      const updated = await youtubeApi.toggleAutomation(id);
      setAutomations(updated);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full space-y-4 font-sans-studio">
      {/* ── YouTube Channel Banner & Profile Identity Header ── */}
      <YouTubeChannelBannerHeader
        channel={channels[0]}
        onCustomiseChannel={() => {
          if (channels[0]) {
            openCorrectModal(channels[0]);
          } else {
            setShowConnectModal(true);
          }
        }}
        onManageVideos={() => {
          setActiveTab('videos');
        }}
        onSyncLive={loadData}
        syncing={loading}
      />

      {/* ── YouTube Sub-Pages Navigation Tabs (Home, Videos, Shorts, Playlists, Posts...) ── */}
      <YouTubeHeader
        loading={loading}
        onSyncLive={loadData}
        channelsCount={channels.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        videosCount={liveVideos.length > 0 ? liveVideos.length : (channels[0]?.videosUploaded || videos.length)}
        shortsCount={liveShortsFeed.length > 0 ? liveShortsFeed.length : (liveShorts.length > 0 ? liveShorts.length : videos.length)}
        playlistsCount={playlistsCount > 0 ? playlistsCount : (liveVideos.length > 0 ? Math.max(1, Math.ceil(liveVideos.length / 4)) : 0)}
        postsCount={postsCount}
        schedulesCount={automations.length}
        analyticsCount={
          totalAnalyticsViews > 0
            ? totalAnalyticsViews >= 1000
              ? `${(totalAnalyticsViews / 1000).toFixed(1)}k`
              : totalAnalyticsViews
            : channels[0] ? 4 : 0
        }
        onConnectChannel={() => {
          setLookupResult(null);
          setLookupError(null);
          setShowConnectModal(true);
        }}
      />

      {/* Floating Status Notification */}
      {statusMessage && (
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center justify-between gap-3 animate-fade-in shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#60A5FA] shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-blue-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Sub-Page 1: HOME (Channel Overview, Studio Actions & Automation Pipeline) ── */}
      {activeTab === 'overview' && (
        <YouTubeHomePage
          channels={channels}
          videos={videos}
          automations={automations}
          liveVideos={liveVideos}
          liveShorts={liveShortsFeed}
          liveForYou={liveForYou}
          feedLoading={feedLoading || loading}
          syncingId={syncingId}
          togglingAutoUploadId={togglingAutoUploadId}
          copiedId={copiedId}
          onCopyId={handleCopyId}
          onSyncChannel={handleSyncChannel}
          onToggleAutoUpload={handleToggleAutoUpload}
          onLoadLiveShorts={handleLoadLiveShorts}
          onOpenCorrectModal={openCorrectModal}
          onDeleteChannel={handleDeleteChannel}
          onOpenConnectModal={() => {
            setChannelInput('');
            setShowConnectModal(true);
          }}
          onNavigate={onNavigate}
          onTabChange={setActiveTab}
        />
      )}

      {/* ── Sub-Page 2: VIDEOS (Long-form / Standard Channel Catalog) ── */}
      {activeTab === 'videos' && (
        <YouTubeVideosPage
          channels={channels}
          videos={videos}
          liveVideos={liveVideos}
          loading={feedLoading || loading}
          onNavigate={onNavigate}
        />
      )}

      {/* ── Sub-Page 3: YOUTUBE SHORTS FEED ── */}
      {activeTab === 'shorts' && (
        <YouTubeShortsPage
          videos={videos}
          channels={channels}
          shortsSearch={shortsSearch}
          onShortsSearchChange={setShortsSearch}
          selectedChannelForShorts={selectedChannelForShorts}
          liveShorts={liveShorts}
          liveShortsLoading={loading || feedLoading || liveShortsLoading}
          onLoadLiveShorts={handleLoadLiveShorts}
          onCloseLiveShorts={() => {
            setSelectedChannelForShorts(null);
            setLiveShorts([]);
          }}
          onNavigate={onNavigate}
        />
      )}

      {/* ── Sub-Page 4: PLAYLISTS & SERIES ── */}
      {activeTab === 'playlists' && (
        <YouTubePlaylistsPage
          channels={channels}
          liveVideos={liveVideos}
          loading={loading || feedLoading}
          onNavigate={onNavigate}
        />
      )}

      {/* ── Sub-Page 5: COMMUNITY POSTS & ANNOUNCEMENTS ── */}
      {activeTab === 'posts' && (
        <YouTubePostsPage
          channels={channels}
          loading={loading || feedLoading}
        />
      )}

      {/* ── Sub-Page 3: DAILY AUTOMATION SCHEDULES ── */}
      {activeTab === 'schedules' && (
        <YouTubeSchedulesPage
          automations={automations}
          loading={loading}
          onToggleAuto={handleToggleAuto}
          onNavigate={onNavigate}
        />
      )}

      {/* ── Sub-Page 4: ANALYTICS & GROWTH ── */}
      {activeTab === 'analytics' && (
        <YouTubeAnalyticsPage
          videos={videos}
          channels={channels}
          liveVideos={liveVideos}
          loading={loading || feedLoading}
        />
      )}

      {/* ── Sub-Page 5: CHANNEL SETTINGS ── */}
      {activeTab === 'settings' && (
        <YouTubeSettingsPage
          channels={channels}
          copiedId={copiedId}
          onCopyId={handleCopyId}
          onOpenCorrectModal={openCorrectModal}
          onDeleteChannel={handleDeleteChannel}
          onOpenConnectModal={() => setShowConnectModal(true)}
        />
      )}

      {/* Connect YouTube Channel Modal with Real Live Verification */}
      <Modal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        title="Connect & Verify YouTube Channel"
      >
        <form onSubmit={handleConnectChannel} className="space-y-4">
          <p className="text-xs text-[#9CA3AF]">
            Enter a YouTube handle or channel URL to fetch real live subscriber and video metrics.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">
              YouTube Channel Handle or URL
            </label>
            <div className="flex gap-2">
              <input
                value={channelInput}
                onChange={(e) => {
                  setChannelInput(e.target.value);
                  setLookupResult(null);
                  setLookupError(null);
                }}
                placeholder="e.g. @EmojiEyeSpy or @HubermanLab"
                required
                className="flex-1 bg-[#121212] border border-[#2F2F2F] text-sm text-[#E5E5E5] placeholder-[#6B7280] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#3B82F6]"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleLookupChannel()}
                disabled={lookupLoading || !channelInput.trim()}
                icon={<RefreshCw className={`w-3.5 h-3.5 ${lookupLoading ? 'animate-spin' : ''}`} />}
              >
                {lookupLoading ? 'Checking…' : 'Verify'}
              </Button>
            </div>
          </div>

          {lookupError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{lookupError}</span>
            </div>
          )}

          {lookupResult && (
            <div className="p-3.5 rounded-xl bg-[#121212] border border-[#3B82F6]/40 flex items-center gap-3">
              <img
                src={lookupResult.avatarUrl}
                alt={lookupResult.name}
                className="w-12 h-12 rounded-xl border border-[#2F2F2F] object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-white text-sm truncate">{lookupResult.name}</h4>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Live
                  </span>
                </div>
                <p className="text-xs text-[#9CA3AF] font-mono-studio">{lookupResult.handle}</p>
                <div className="flex items-center gap-3 text-[11px] text-[#60A5FA] font-medium pt-0.5">
                  <span>{lookupResult.subscribers.toLocaleString()} subscribers</span>
                  <span>·</span>
                  <span>{lookupResult.videosUploaded.toLocaleString()} videos</span>
                </div>
              </div>
            </div>
          )}

          <Input
            label="Niche Focus"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="e.g. Motivational Quotes, Stoic Mindset"
          />

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowConnectModal(false);
                setLookupResult(null);
                setLookupError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={connectLoading || (!lookupResult && !channelInput.trim())}
              icon={<Plus className="w-4 h-4" />}
            >
              {connectLoading ? 'Connecting…' : 'Save & Connect Channel'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Correct Channel Handle Modal */}
      <Modal
        isOpen={showCorrectModal}
        onClose={() => setShowCorrectModal(false)}
        title="Change Channel Handle"
      >
        <form onSubmit={handleCorrectChannel} className="space-y-4">
          <p className="text-xs text-[#9CA3AF]">
            Update your handle if the current handle differs from your public YouTube channel.
          </p>

          <Input
            label="New YouTube Handle"
            value={newHandleInput}
            onChange={(e) => setNewHandleInput(e.target.value)}
            placeholder="e.g. @EmojiEyeSpy"
            required
          />
            label="Updated YouTube Handle or URL"
          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCorrectModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={correctLoading || !newHandleInput.trim()}>
              {correctLoading ? 'Saving…' : 'Update Handle'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
