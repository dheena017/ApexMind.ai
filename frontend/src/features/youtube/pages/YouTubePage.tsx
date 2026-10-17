import React, { useEffect, useState } from 'react';
import {
  Youtube,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/src/shared/ui/common';
import { YouTubeChannelBannerHeader } from '../components/YouTubeChannelBannerHeader';
import { YouTubeHeader, YouTubeTab } from '../components/YouTubeHeader';
import { YouTubeHomePage } from './YouTubeHomePage';
import { YouTubeVideosPage } from './YouTubeVideosPage';
import { YouTubeShortsPage } from './YouTubeShortsPage';
import { YouTubePlaylistsPage } from './YouTubePlaylistsPage';
import { YouTubePostsPage } from './YouTubePostsPage';
import { YouTubeAnalyticsPage } from './YouTubeAnalyticsPage';
import { YouTubeSettingsPage } from './YouTubeSettingsPage';
import { YouTubeSeoPage } from './YouTubeSeoPage';
import { YouTubeTrendingPage } from './YouTubeTrendingPage';
import { YouTubeVideoDetailsModal } from '../components/YouTubeVideoDetailsModal';
import { youtubeApi } from '../api/youtubeApi';
import { connectYouTubeWithGoogle } from '../utils/googleOAuthConnect';
import { PageRoute, getQueryParams, buildRouteUrl } from '@/src/app/routes';
import {
  YouTubeChannel,
  YouTubeLiveShort,
  YouTubeLiveVideo,
  YouTubeForYouItem,
  YouTubePlaylist,
} from '../types';

export default function YouTubePage({
  onNavigate,
  initialTab = 'overview',
}: {
  onNavigate: (page: string) => void;
  initialTab?: YouTubeTab;
}) {
  const [loading, setLoading] = useState(false);
  const [currentChannelQuery, setCurrentChannelQuery] = useState<string>('');

  const [channel, setChannel] = useState<YouTubeChannel | null>(null);
  const [liveVideos, setLiveVideos] = useState<YouTubeLiveVideo[]>([]);
  const [liveShorts, setLiveShorts] = useState<YouTubeLiveShort[]>([]);
  const [liveForYou, setLiveForYou] = useState<YouTubeForYouItem[]>([]);
  const [activeTab, setActiveTab] = useState<YouTubeTab>(() => {
    const q = getQueryParams();
    if (q.tab) return q.tab as YouTubeTab;
    return initialTab;
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Sync state if initialTab prop changes (e.g., from browser back/forward or route navigation)
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (tab: YouTubeTab) => {
    setActiveTab(tab);
    const targetRoute = tab === 'overview' ? 'youtube' : (`youtube-${tab}` as PageRoute);
    onNavigate(targetRoute);
  };

  // Tab counts & items
  const [livePlaylists, setLivePlaylists] = useState<YouTubePlaylist[]>([]);
  const [playlistsCount, setPlaylistsCount] = useState<number>(0);
  const [postsCount, setPostsCount] = useState<number>(0);

  // Shorts search filter
  const [shortsSearch, setShortsSearch] = useState('');

  // Interactive in-studio video player modal
  const [activePlayingVideo, setActivePlayingVideo] = useState<YouTubeLiveVideo | YouTubeLiveShort | null>(null);

  // Connect Channel with Google OAuth (GIS popup flow)
  const handleConnectWithGoogle = () => {
    connectYouTubeWithGoogle({
      onLoading: setLoading,
      onSuccess: (connectedChannel) => {
        setChannel(connectedChannel);
        setCurrentChannelQuery(connectedChannel.handle);
        loadChannelLive(connectedChannel.handle);
      },
      onError: (err) => {
        alert(`YouTube authorization notice: ${err}`);
      },
    });
  };

  const handleDisconnectChannel = async () => {
    if (!window.confirm('Disconnect this YouTube channel from ApexMind Studio?')) return;
    try {
      setLoading(true);
      await youtubeApi.disconnectOAuth();
      setChannel(null);
      setCurrentChannelQuery('');
      setLiveVideos([]);
      setLiveShorts([]);
      setLiveForYou([]);
      localStorage.removeItem('apexmind_yt_active_channel');
    } catch (e: any) {
      console.warn('Disconnect note:', e);
    } finally {
      setLoading(false);
    }
  };

  // Load channel data live from YouTube (Zero local DB reads)
  const loadChannelLive = async (targetQuery: string) => {
    const cleanQuery = (targetQuery || '').trim();
    if (!cleanQuery) {
      setChannel(null);
      setLiveVideos([]);
      setLiveShorts([]);
      setLiveForYou([]);
      return;
    }

    setLoading(true);
    try {
      const ch = await youtubeApi.getChannelDetails(cleanQuery);
      setChannel(ch);
      localStorage.setItem('apexmind_yt_active_channel', ch.handle || cleanQuery);

      // Fetch uploads, shorts, playlists, and analytics in parallel
      const channelIdentifier = ch.id || ch.channelId || ch.handle || cleanQuery;
      const [vids, shortsList, playlists] = await Promise.all([
        youtubeApi.getChannelVideos(channelIdentifier, 24).catch(() => []),
        youtubeApi.getChannelShorts(channelIdentifier, 24).catch(() => []),
        youtubeApi.getPlaylists(channelIdentifier).catch(() => []),
      ]);

      setLiveVideos(vids);
      setLiveShorts(shortsList);
      setLivePlaylists(playlists);
      setPlaylistsCount(playlists.length);

      // Construct live for-you recommendations
      const forYou: YouTubeForYouItem[] = [
        ...shortsList.slice(0, 2).map((s) => ({
          id: s.id,
          title: s.title,
          views: s.views,
          thumbnailUrl: s.thumbnailUrl,
          videoUrl: s.videoUrl,
          isShort: true,
        })),
        ...vids.slice(0, 4).map((v) => ({
          id: v.id,
          title: v.title,
          views: v.views,
          duration: v.duration,
          thumbnailUrl: v.thumbnailUrl,
          videoUrl: v.videoUrl,
          isShort: false,
        })),
      ];
      setLiveForYou(forYou);
    } catch (err: any) {
      console.error('Failed to load channel live from YouTube', err);
      setChannel(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check OAuth return parameters from Google
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('oauth')) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }

    // Check backend for authenticated Google OAuth YouTube channel
    const initChannel = async () => {
      try {
        const authStatus = await youtubeApi.getAuthStatus();
        if (authStatus.connected && authStatus.channel) {
          const ch = authStatus.channel;
          setChannel(ch);
          setCurrentChannelQuery(ch.handle);
          localStorage.setItem('apexmind_yt_active_channel', ch.handle);
          loadChannelLive(ch.handle);
          return;
        } else {
          setChannel(null);
          setLiveVideos([]);
          setLiveShorts([]);
          setLiveForYou([]);
          localStorage.removeItem('apexmind_yt_active_channel');
          setCurrentChannelQuery('');
        }
      } catch (e) {
        console.warn('OAuth status check note:', e);
        setChannel(null);
      }
    };

    initChannel();
  }, []);


  const channelsList = channel ? [channel] : [];

  return (
    <div className="w-full min-h-screen bg-[#0A0A0A] text-[#E5E5E5] space-y-6 pb-20 font-sans-studio animate-fade-in">
      {/* ── 1. Top Channel Banner & Studio Navigation Group ── */}
      <div className="space-y-3">
        <YouTubeChannelBannerHeader
          channel={channel}
          onCustomiseChannel={() => handleTabChange('settings')}
          onManageVideos={() => handleTabChange('videos')}
          onSyncLive={() => loadChannelLive(currentChannelQuery)}
          onConnectChannel={handleConnectWithGoogle}
          syncing={loading}
        />

        <YouTubeHeader
          loading={loading}
          onSyncLive={() => loadChannelLive(currentChannelQuery)}
          channelsCount={channel ? 1 : 0}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          videosCount={liveVideos.length}
          shortsCount={liveShorts.length}
          playlistsCount={playlistsCount}
          postsCount={postsCount}
        />
      </div>


      {/* ── Tab 1: HOME (Overview) ── */}
      {activeTab === 'overview' && (
        <YouTubeHomePage
          channels={channelsList}
          videos={[]}
          automations={[]}
          liveVideos={liveVideos}
          liveShorts={liveShorts}
          liveForYou={liveForYou}
          playlists={livePlaylists}
          feedLoading={loading}
          syncingId={null}
          togglingAutoUploadId={null}
          copiedId={null}
          onCopyId={() => {}}
          onSyncChannel={() => loadChannelLive(currentChannelQuery)}
          onToggleAutoUpload={() => {}}
          onLoadLiveShorts={() => {}}
          onOpenCorrectModal={handleConnectWithGoogle}
          onDisconnectChannel={() => {}}
          onOpenConnectModal={handleConnectWithGoogle}
          onNavigate={onNavigate}
          onTabChange={handleTabChange}
        />
      )}

      {/* ── Tab 2: VIDEOS (Real 16:9 Uploads) ── */}
      {activeTab === 'videos' && (
        <YouTubeVideosPage
          channels={channelsList}
          videos={[]}
          liveVideos={liveVideos}
          loading={loading}
          onNavigate={onNavigate}
        />
      )}

      {/* ── Tab 3: SHORTS (Real 9:16 Vertical Feed) ── */}
      {activeTab === 'shorts' && (
        <YouTubeShortsPage
          channels={channelsList}
          shortsSearch={shortsSearch}
          onShortsSearchChange={setShortsSearch}
          selectedChannelForShorts={channel}
          liveShorts={liveShorts}
          liveShortsLoading={loading}
          onLoadLiveShorts={() => loadChannelLive(currentChannelQuery)}
          onNavigate={onNavigate}
        />
      )}

      {/* ── Tab 4: PLAYLISTS ── */}
      {activeTab === 'playlists' && (
        <YouTubePlaylistsPage
          channels={channelsList}
          liveVideos={liveVideos}
          playlists={livePlaylists}
          loading={loading}
          onNavigate={onNavigate}
        />
      )}

      {/* ── Tab 5: SEO & KEYWORDS ── */}
      {activeTab === 'seo' && <YouTubeSeoPage />}

      {/* ── Tab 6: TRENDING SHORTS ── */}
      {activeTab === 'trending' && (
        <YouTubeTrendingPage
          onPlayShort={(short) => setActivePlayingVideo(short)}
          onNavigate={onNavigate}
        />
      )}

      {/* ── Tab 7: COMMUNITY ── */}
      {activeTab === 'posts' && (
        <YouTubePostsPage channels={channelsList} loading={loading} />
      )}

      {/* ── Tab 8: ANALYTICS ── */}
      {activeTab === 'analytics' && (
        <YouTubeAnalyticsPage
          videos={[]}
          channels={channelsList}
          liveVideos={liveVideos}
          loading={loading}
        />
      )}

      {/* ── Tab 9: SETTINGS ── */}
      {activeTab === 'settings' && (
        <YouTubeSettingsPage
          channels={channelsList}
          copiedId={null}
          onCopyId={() => {}}
          onOpenCorrectModal={handleConnectWithGoogle}
          onDisconnectChannel={handleDisconnectChannel}
          onOpenConnectModal={handleConnectWithGoogle}
        />
      )}

      {/* ── In-Studio Embedded Video Player Modal (via React createPortal) ── */}
      <YouTubeVideoDetailsModal
        isOpen={Boolean(activePlayingVideo)}
        video={activePlayingVideo}
        onClose={() => setActivePlayingVideo(null)}
      />
    </div>
  );
}


