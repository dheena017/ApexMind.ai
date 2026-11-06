import { useEffect, useRef, useState } from 'react';
import {
  Youtube,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import '@/src/shared/ui/common';
import { YouTubeChannelBannerHeader } from '../components/YouTubeChannelBannerHeader';
import { YouTubeHeader, YouTubeTab } from '../components/YouTubeHeader';
import { YouTubeHomePage } from './YouTubeHomePage';
import { YouTubeVideosPage } from './YouTubeVideosPage';
import { YouTubeShortsPage } from './YouTubeShortsPage';
import { YouTubePlaylistsPage } from './YouTubePlaylistsPage';
import { YouTubePostsPage } from './YouTubePostsPage';
import { YouTubeSchedulesPage } from './YouTubeSchedulesPage';
import { YouTubeVideoDetailsModal } from '../components/YouTubeVideoDetailsModal';
import { toast } from 'sonner';
import { youtubeApi } from '../api/youtubeApi';
import { connectYouTubeWithGoogle } from '../utils/googleOAuthConnect';
import { PageRoute, getQueryParams } from '@/src/app/routes';
import {
  YouTubeChannel,
  YouTubeLiveShort,
  YouTubeLiveVideo,
  YouTubeForYouItem,
  YouTubePlaylist,
  AutomationJob,
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
  const channelLoadRequestRef = useRef(0);

  const [channel, setChannel] = useState<YouTubeChannel | null>(null);
  const [availableChannels, setAvailableChannels] = useState<YouTubeChannel[]>([]);
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

  // Daily Automations state
  const [automations, setAutomations] = useState<AutomationJob[]>([]);
  const [automationsLoading, setAutomationsLoading] = useState(false);

  const loadAutomations = async () => {
    setAutomationsLoading(true);
    try {
      const data = await youtubeApi.getAutomations();
      setAutomations(data);
    } catch (e) {
      console.warn('Failed to load automations:', e);
    } finally {
      setAutomationsLoading(false);
    }
  };

  const handleToggleAuto = async (id: string) => {
    try {
      const updated = await youtubeApi.toggleAutomation(id);
      setAutomations(updated);
    } catch (e) {
      alert(`Could not toggle automation: ${e}`);
    }
  };

  useEffect(() => {
    if (activeTab === 'schedules') {
      loadAutomations();
    }
  }, [activeTab]);

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
    const requestId = ++channelLoadRequestRef.current;
    const cleanQuery = (targetQuery || '').trim();
    if (!cleanQuery) {
      setLoading(false);
      setChannel(null);
      setCurrentChannelQuery('');
      setLiveVideos([]);
      setLiveShorts([]);
      setLiveForYou([]);
      setLivePlaylists([]);
      setPlaylistsCount(0);
      return;
    }

    setCurrentChannelQuery(cleanQuery);
    setLoading(true);
    try {
      const ch = await youtubeApi.getChannelDetails(cleanQuery);
      if (requestId !== channelLoadRequestRef.current) return;
      setChannel(ch);
      localStorage.setItem('apexmind_yt_active_channel', ch.handle || cleanQuery);

      // Fetch uploads, shorts, playlists, and analytics in parallel
      const channelIdentifier = ch.id || ch.channelId || ch.handle || cleanQuery;
      const [vids, shortsList, playlists] = await Promise.all([
        youtubeApi.getChannelVideos(channelIdentifier, 24).catch(() => []),
        youtubeApi.getChannelShorts(channelIdentifier, 24).catch(() => []),
        youtubeApi.getPlaylists(channelIdentifier).catch(() => []),
      ]);
      if (requestId !== channelLoadRequestRef.current) return;

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
      if (requestId !== channelLoadRequestRef.current) return;
      console.error('Failed to load channel live from YouTube', err);
      setChannel(null);
    } finally {
      if (requestId === channelLoadRequestRef.current) setLoading(false);
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
        let connectedChannel: YouTubeChannel | undefined;
        let savedChannels: YouTubeChannel[] = [];
        try {
          savedChannels = await youtubeApi.getChannels();
          setAvailableChannels(savedChannels);
        } catch (channelsError) {
          console.warn('Saved YouTube channels unavailable:', channelsError);
        }

        const selectedHandle = localStorage.getItem('apexmind_yt_active_channel')?.trim();
        if (selectedHandle) {
          connectedChannel = savedChannels.find(
            (saved) => saved.handle === selectedHandle || saved.id === selectedHandle,
          );
        }

        try {
          const authStatus = await youtubeApi.getAuthStatus();
          if (!connectedChannel && authStatus.connected && authStatus.channel) {
            connectedChannel = authStatus.channel;
          }
        } catch (statusError) {
          console.warn('YouTube connection status unavailable; using saved channels:', statusError);
        }

        if (!connectedChannel) {
          connectedChannel = savedChannels[0];
        }

        if (connectedChannel) {
          const ch = connectedChannel;
          setChannel(ch);
          setCurrentChannelQuery(ch.handle);
          localStorage.setItem('apexmind_yt_active_channel', ch.handle);
          loadChannelLive(ch.handle);
        } else {
          setChannel(null);
          setLiveVideos([]);
          setLiveShorts([]);
          setLiveForYou([]);
          localStorage.removeItem('apexmind_yt_active_channel');
          setCurrentChannelQuery('');
        }
      } catch (e) {
        console.warn('Could not restore the signed-in user YouTube channel:', e);
      }
    };

    initChannel();
  }, []);

  useEffect(() => {
    const handleChannelSwitched = (event: Event) => {
      const { handle, platform } = (event as CustomEvent<{
        handle?: string;
        platform?: string;
      }>).detail || {};
      if (platform && platform !== 'youtube') return;
      void loadChannelLive(handle || '');
    };
    window.addEventListener('youtube:channel-switched', handleChannelSwitched);
    return () => window.removeEventListener('youtube:channel-switched', handleChannelSwitched);
  }, []);

  const selectYouTubeChannel = async (selected: YouTubeChannel) => {
    const handle = selected.handle || selected.id;
    try {
      await youtubeApi.setActiveChannel(selected.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not select YouTube channel.');
      return;
    }
    localStorage.setItem('apexmind_yt_active_channel', handle);
    localStorage.setItem('apexmind_social_active_account', handle);
    window.dispatchEvent(new CustomEvent('youtube:channel-switched', {
      detail: {
        channel: selected,
        handle,
        platform: 'youtube',
      },
    }));
  };

  const channelsList = channel ? [channel] : [];

  return (
    <div className="w-full min-h-screen bg-[#0A0A0A] text-[#E5E5E5] space-y-6 pb-20 font-sans-studio animate-fade-in">
      {/*  1. Top Channel Banner & Studio Navigation Group  */}
      <div className="space-y-3">
        {availableChannels.length > 1 && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#24242A] bg-[#141418] px-4 py-3">
            <label htmlFor="youtube-channel-target" className="text-xs font-semibold text-zinc-300">
              Selected YouTube channel
            </label>
            <select
              id="youtube-channel-target"
              value={availableChannels.find((item) => item.handle === channel?.handle || item.id === channel?.id)?.id || ''}
              onChange={(event) => {
                const selected = availableChannels.find((item) => item.id === event.target.value);
                if (selected) void selectYouTubeChannel(selected);
              }}
              className="max-w-[65%] rounded-lg border border-[#33333C] bg-[#1A1A1F] px-3 py-2 text-xs text-white"
            >
              {availableChannels.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} {item.handle}
                </option>
              ))}
            </select>
          </div>
        )}
        <YouTubeChannelBannerHeader
          channel={channel}
          onCustomiseChannel={() => window.open('https://studio.youtube.com', '_blank')}
          onManageVideos={() => handleTabChange('videos')}
          onSyncLive={() => loadChannelLive(currentChannelQuery)}
          onConnectChannel={handleConnectWithGoogle}
          syncing={loading}
        />

        <YouTubeHeader
          loading={loading}
          onSyncLive={() => loadChannelLive(currentChannelQuery)}
          channelsCount={availableChannels.length || (channel ? 1 : 0)}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          videosCount={liveVideos.length}
          shortsCount={liveShorts.length}
          schedulesCount={automations.length}
          playlistsCount={playlistsCount}
          postsCount={postsCount}
        />
      </div>


      {/*  Tab 1: HOME (Overview)  */}
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

      {/*  Tab 2: VIDEOS (Real 16:9 Uploads)  */}
      {activeTab === 'videos' && (
        <YouTubeVideosPage
          channels={channelsList}
          videos={[]}
          liveVideos={liveVideos}
          loading={loading}
          onNavigate={onNavigate}
        />
      )}

      {/*  Tab 3: SHORTS (Real 9:16 Vertical Feed)  */}
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

      {/*  Tab 4: PLAYLISTS  */}
      {activeTab === 'playlists' && (
        <YouTubePlaylistsPage
          channels={channelsList}
          liveVideos={liveVideos}
          playlists={livePlaylists}
          loading={loading}
          onNavigate={onNavigate}
        />
      )}

      {/*  Tab 5: COMMUNITY  */}
      {activeTab === 'posts' && (
        <YouTubePostsPage channels={channelsList} loading={loading} />
      )}

      {/*  Tab: DAILY SCHEDULES & AUTOMATIONS  */}
      {activeTab === 'schedules' && (
        <YouTubeSchedulesPage
          automations={automations}
          loading={automationsLoading}
          onToggleAuto={handleToggleAuto}
          onRefresh={loadAutomations}
          onNavigate={onNavigate}
        />
      )}

      {/*  In-Studio Embedded Video Player Modal (via React createPortal)  */}
      <YouTubeVideoDetailsModal
        isOpen={Boolean(activePlayingVideo)}
        video={activePlayingVideo}
        onClose={() => setActivePlayingVideo(null)}
      />
    </div>
  );
}
