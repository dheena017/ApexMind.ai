import { useState, useEffect, useRef } from 'react';
import {
  Youtube,
  Instagram,
  Facebook,
  Radio,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Users,
  Video,
  Check,
  Share2,
  Link2,
} from 'lucide-react';
import { socialApi } from '@/src/features/social/api/socialApi';
import { youtubeApi } from '@/src/features/youtube/api/youtubeApi';
import { SocialAccount, SocialPlatform, PublishedPost } from '@/src/features/social/types';
import { connectYouTubeWithGoogle } from '@/src/features/youtube/utils/googleOAuthConnect';
import { navigateOAuthPopup, openOAuthPopup } from '@/src/shared/utils/oauthPopup';
import { getSocialAvatarFallback, handleSocialAvatarError } from '../utils/avatar';
import useAuth from '@/src/features/auth/hooks/useAuth';

function formatCount(num?: number): string {
  if (!num || num === 0) return '0';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

function formatDateTime(val?: string): string {
  if (!val) return 'Recently';
  try {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return val;
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return val;
  }
}

export default function SocialLinkingPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<PublishedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | SocialPlatform>('all');
  const [activeChannelKey, setActiveChannelKey] = useState<string>('');
  const [activeYouTubeChannelId, setActiveYouTubeChannelId] = useState<string>('');
  const [verifiedActiveUserId, setVerifiedActiveUserId] = useState<string | null>(null);
  const activeChannelVerified = Boolean(user?.id && verifiedActiveUserId === user.id);
  const [ownedYouTubeChannelIds, setOwnedYouTubeChannelIds] = useState<string[]>([]);

  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [connectingMetaPlatform, setConnectingMetaPlatform] = useState<SocialPlatform | null>(null);
  const metaCallbackHandled = useRef(false);

  const loadPublishedPosts = async () => {
    setPostsLoading(true);
    setPostsError(null);
    try {
      setPosts(await socialApi.getPublishedPosts(50));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load publishing history.';
      setPostsError(message);
      console.warn('Failed to load publishing history:', err);
    } finally {
      setPostsLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setAccountsError(null);
    try {
      const [fleet, youtubeData] = await Promise.all([
        socialApi.getFleetAccounts(),
        Promise.all([
          loadPublishedPosts(),
          youtubeApi.getAuthStatus().catch((err) => {
            console.warn('Could not load active YouTube channel:', err);
            return null;
          }),
          youtubeApi.getChannels().catch((err) => {
            console.warn('Could not load YouTube channels connected to this account:', err);
            return [];
          }),
        ]).then(([, status, channels]) => ({ status, channels })),
      ]);
      const uniqueFleet = fleet.filter((account, index, allAccounts) =>
        !account.platformAccountId ||
        allAccounts.findIndex((candidate) =>
          candidate.platform === account.platform &&
          candidate.platformAccountId === account.platformAccountId,
        ) === index,
      );
      setAccounts(uniqueFleet);
      setOwnedYouTubeChannelIds(youtubeData.channels.map((channel) => channel.id));
      const channelStatus = youtubeData.status;

      // Resolve active channel
      const stored = localStorage.getItem('apexmind_social_active_account');
      const storedYouTubeChannel = localStorage.getItem('apexmind_yt_active_channel');
      const serverActiveYouTubeAccount = channelStatus?.activeChannelId
        ? uniqueFleet.find((account) =>
            account.platform === 'youtube' &&
            account.platformAccountId === channelStatus.activeChannelId &&
            youtubeData.channels.some((channel) => channel.id === account.platformAccountId),
          )
        : undefined;
      setVerifiedActiveUserId(serverActiveYouTubeAccount ? user?.id || null : null);
      if (serverActiveYouTubeAccount) {
        const key = serverActiveYouTubeAccount.handle || serverActiveYouTubeAccount.id;
        setActiveYouTubeChannelId(serverActiveYouTubeAccount.platformAccountId);
        setActiveChannelKey(key);
        localStorage.setItem('apexmind_social_active_account', key);
        localStorage.setItem('apexmind_yt_active_channel', key);
      } else if (stored && uniqueFleet.some((a) => a.handle === stored || a.id === stored)) {
        const storedAccount = uniqueFleet.find((a) => a.handle === stored || a.id === stored);
        setActiveYouTubeChannelId(
          storedAccount?.platform === 'youtube' ? storedAccount.platformAccountId : '',
        );
        setActiveChannelKey(stored);
      } else if (uniqueFleet.length > 0) {
        const selectedYouTubeAccount = uniqueFleet.find(
          (account) =>
            account.platform === 'youtube' &&
            (account.handle === storedYouTubeChannel ||
              account.id === storedYouTubeChannel ||
              account.platformAccountId === storedYouTubeChannel),
        );
        const fallbackAccount = selectedYouTubeAccount || uniqueFleet[0];
        const fallbackKey = fallbackAccount.handle || fallbackAccount.id;
        setActiveYouTubeChannelId(
          fallbackAccount.platform === 'youtube' ? fallbackAccount.platformAccountId : '',
        );
        setActiveChannelKey(fallbackKey);
        localStorage.setItem('apexmind_social_active_account', fallbackKey);
      } else {
        setActiveYouTubeChannelId('');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load connected social accounts.';
      setAccountsError(message);
      console.warn('Failed to load connected social accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleFleetUpdate = () => loadData();
    window.addEventListener('social:fleet-updated', handleFleetUpdate);
    return () => window.removeEventListener('social:fleet-updated', handleFleetUpdate);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const oauthError = params.get('error_description') || params.get('error');
    if ((!code && !state && !oauthError) || metaCallbackHandled.current) return;
    metaCallbackHandled.current = true;

    window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash}`);
    if (oauthError) {
      setActionError(`Social account authorization was not completed: ${oauthError}`);
      return;
    }
    if (!code || !state) {
      setActionError('Social account authorization returned an incomplete response. Please try again.');
      return;
    }

    socialApi.completeMetaOAuth(code, state)
      .then(({ message }) => {
        setNotice(message);
        setActionError(null);
        window.dispatchEvent(new CustomEvent('social:fleet-updated'));
      })
      .catch((err: Error) => setActionError(err.message || 'Could not connect the social account.'));
  }, []);

  const handleSetActive = async (acc: SocialAccount) => {
    const key = acc.handle || acc.id;
    if (acc.platform === 'youtube') {
      if (!ownedYouTubeChannelIds.includes(acc.platformAccountId)) {
        setActionError(
          'This channel is not connected to your signed-in account. Reconnect it with YouTube OAuth before selecting it.',
        );
        return;
      }
      try {
        await youtubeApi.setActiveChannel(acc.platformAccountId);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Could not select YouTube channel.');
        return;
      }
      setActiveYouTubeChannelId(acc.platformAccountId);
      localStorage.setItem('apexmind_yt_active_channel', key);
      localStorage.setItem('apexmind_social_active_account', key);
      setVerifiedActiveUserId(user?.id || null);
      localStorage.setItem('apexmind_yt_channel', JSON.stringify({
        id: acc.platformAccountId,
        channelId: acc.platformAccountId,
        name: acc.name,
        handle: acc.handle,
        subscribers: acc.followersCount,
        videosUploaded: acc.postsCount,
        avatarUrl: acc.avatarUrl || '',
        bannerUrl: acc.bannerUrl,
        channelUrl: getPlatformUrl(acc),
        userId: user?.id,
      }));
      window.dispatchEvent(new CustomEvent('youtube:channel-switched', {
        detail: { channel: acc, handle: key, platform: 'youtube' },
      }));
    } else {
      setActiveYouTubeChannelId('');
    }
    setActiveChannelKey(key);
    localStorage.setItem('apexmind_social_active_account', key);
    setNotice(`Active publishing destination set to "${acc.name}" (${acc.handle})`);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleConnectGoogle = (targetAccount?: SocialAccount) => {
    setActionError(null);
    setNotice(null);
    connectYouTubeWithGoogle({
      onLoading: setConnectingGoogle,
      onSuccess: async (connectedChannel) => {
        if (targetAccount && targetAccount.platformAccountId === connectedChannel.id) {
          try {
            await youtubeApi.setActiveChannel(connectedChannel.id);
            const key = targetAccount.handle || targetAccount.id;
            setActiveYouTubeChannelId(targetAccount.platformAccountId);
            localStorage.setItem('apexmind_yt_active_channel', key);
            localStorage.setItem('apexmind_social_active_account', key);
            localStorage.setItem('apexmind_yt_channel', JSON.stringify({
              ...connectedChannel,
              userId: user?.id,
            }));
            setActiveChannelKey(key);
            setVerifiedActiveUserId(user?.id || null);
            window.dispatchEvent(new CustomEvent('youtube:channel-switched', {
              detail: { channel: connectedChannel, handle: key, platform: 'youtube' },
            }));
            setNotice(`Reconnected and selected "${connectedChannel.name}" as the active YouTube channel.`);
          } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Could not select the reconnected YouTube channel.');
          }
        } else if (targetAccount) {
          setNotice(
            `Connected "${connectedChannel.name}". It does not match "${targetAccount.name}", so the requested channel was not selected.`,
          );
        } else {
          setNotice(`Successfully connected YouTube channel "${connectedChannel.name}"!`);
        }
        await loadData();
        window.dispatchEvent(new CustomEvent('social:fleet-updated'));
      },
      onError: (err) => {
        setActionError(err);
      },
    });
  };

  const handleConnectMeta = async (platform: SocialPlatform) => {
    setActionError(null);
    setNotice(null);
    const authWindow = openOAuthPopup();
    if (!authWindow) {
      setActionError('Allow pop-ups to continue with secure social account connection.');
      return;
    }
    setConnectingMetaPlatform(platform);
    try {
      const oauthUrl = await socialApi.getOAuthUrl(platform);
      navigateOAuthPopup(authWindow, oauthUrl);
    } catch (err: any) {
      authWindow.close();
      setActionError(err.message || `Could not start ${platform} authorization.`);
      setConnectingMetaPlatform(null);
    }
  };

  const handleConnectPlatform = (platform: SocialPlatform) => {
    if (platform === 'youtube') {
      handleConnectGoogle();
    } else {
      handleConnectMeta(platform);
    }
  };

  const handleDisconnect = async (accountId: string, accountName: string) => {
    if (!window.confirm(`Disconnect "${accountName}" from this studio?`)) return;
    setDisconnectingId(accountId);
    setActionError(null);
    setNotice(null);
    try {
      await socialApi.disconnectAccount(accountId);
      const updated = accounts.filter((a) => a.id !== accountId);
      setAccounts(updated);

      const disconnectedAccount = accounts.find((a) => a.id === accountId);
      if (
        activeChannelKey === accountId ||
        activeChannelKey === disconnectedAccount?.handle ||
        (disconnectedAccount?.platform === 'youtube' &&
          activeYouTubeChannelId === disconnectedAccount.platformAccountId)
      ) {
        const nextAccount = updated.find((account) => account.platform === 'youtube') || updated[0];
        const next = nextAccount?.handle || nextAccount?.id || '';
        setActiveYouTubeChannelId(
          nextAccount?.platform === 'youtube' ? nextAccount.platformAccountId : '',
        );
        setActiveChannelKey(next);
        if (next) {
          localStorage.setItem('apexmind_social_active_account', next);
        } else {
          localStorage.removeItem('apexmind_social_active_account');
        }
        if (accounts.find((account) => account.id === accountId)?.platform === 'youtube') {
          if (nextAccount?.platform === 'youtube') {
            localStorage.setItem('apexmind_yt_active_channel', next);
            window.dispatchEvent(new CustomEvent('youtube:channel-switched', {
              detail: { channel: nextAccount, handle: next, platform: 'youtube' },
            }));
          } else {
            localStorage.removeItem('apexmind_yt_active_channel');
            window.dispatchEvent(new CustomEvent('youtube:channel-switched', {
              detail: { handle: '', platform: 'youtube' },
            }));
          }
        }
      }

      setNotice(`Disconnected "${accountName}" from Social Accounts.`);
      window.dispatchEvent(new CustomEvent('social:fleet-updated'));
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Could not disconnect account.');
    } finally {
      setDisconnectingId(null);
    }
  };

  // High-contrast, clean circular platform badge on avatar corner
  const renderPlatformBadge = (platform: SocialPlatform) => {
    switch (platform) {
      case 'youtube':
        return (
          <div
            className="w-5 h-5 rounded-full bg-[#FF0000] flex items-center justify-center shadow-md ring-2 ring-[#111114]"
            title="YouTube"
          >
            <svg className="w-2.5 h-2.5 text-white fill-current ml-0.5" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        );
      case 'instagram':
        return (
          <div
            className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#FD1D1D] via-[#F56040] to-[#833AB4] flex items-center justify-center shadow-md ring-2 ring-[#111114]"
            title="Instagram"
          >
            <Instagram className="w-2.5 h-2.5 text-white" />
          </div>
        );
      case 'facebook':
        return (
          <div
            className="w-5 h-5 rounded-full bg-[#1877F2] flex items-center justify-center shadow-md ring-2 ring-[#111114]"
            title="Facebook"
          >
            <Facebook className="w-2.5 h-2.5 text-white fill-current" />
          </div>
        );
      default:
        return (
          <div className="w-5 h-5 rounded-full bg-[#27272A] flex items-center justify-center shadow-md ring-2 ring-[#111114]">
            <Radio className="w-2.5 h-2.5 text-zinc-400" />
          </div>
        );
    }
  };

  const getPlatformIcon = (platform: SocialPlatform, className = 'w-4 h-4') => {
    switch (platform) {
      case 'youtube':
        return <Youtube className={`${className} text-[#EF4444] fill-current`} />;
      case 'instagram':
        return <Instagram className={`${className} text-[#EC4899]`} />;
      case 'facebook':
        return <Facebook className={`${className} text-[#3B82F6] fill-current`} />;
      default:
        return <Radio className={`${className} text-[#9CA3AF]`} />;
    }
  };

  const getPlatformBadgeClasses = (platform: SocialPlatform) => {
    switch (platform) {
      case 'youtube':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'instagram':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case 'facebook':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  const getPlatformUrl = (acc: SocialAccount): string => {
    const handleClean = (acc.handle || '').replace(/^@/, '');
    switch (acc.platform) {
      case 'youtube':
        return `https://www.youtube.com/@${handleClean}`;
      case 'instagram':
        return `https://www.instagram.com/${handleClean}`;
      case 'facebook':
        return `https://www.facebook.com/${acc.platformAccountId}`;
      default:
        return '#';
    }
  };

  // Metrics aggregations
  const totalFollowers = accounts.reduce((acc, a) => acc + (a.followersCount || 0), 0);
  const recentPublishedCount = posts.filter((post) => post.status?.toLowerCase() === 'published').length;
  const activeAccount =
    accounts.find((a) =>
      a.platform === 'youtube'
        ? a.platformAccountId === activeYouTubeChannelId
        : a.handle === activeChannelKey || a.id === activeChannelKey,
    ) || accounts[0];
  const activeAccountVerified = activeAccount?.platform !== 'youtube' || activeChannelVerified;

  // Filtering
  const filteredAccounts = activeFilter === 'all'
    ? accounts
    : accounts.filter((a) => a.platform === activeFilter);

  const ytCount = accounts.filter((a) => a.platform === 'youtube').length;
  const igCount = accounts.filter((a) => a.platform === 'instagram').length;
  const fbCount = accounts.filter((a) => a.platform === 'facebook').length;

  return (
    <div className="w-full space-y-5 animate-fade-in text-[#E5E5E5]">
      
      {/* ── 1. Top Channel Linking Header & Primary Actions ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-[#121215] border border-[#24242A] shadow-xl relative overflow-hidden">
        {/* Subtle studio brand accent glow */}
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#3B82F6]/5 via-transparent to-transparent pointer-events-none" />

        <div className="flex items-start gap-3.5 relative z-10">
          <div className="w-11 h-11 rounded-xl bg-[#18181E] border border-[#2E2E38] flex items-center justify-center text-[#3B82F6] shadow-sm shrink-0">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Social Accounts
              </h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${
                accounts.length > 0
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-[#1C1C22] text-[#9CA3AF] border-[#2A2A34]'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  accounts.length > 0 ? 'bg-emerald-400' : 'bg-[#71717A]'
                }`}></span>
                {loading ? 'Loading accounts' : accountsError && accounts.length === 0 ? 'Accounts unavailable' : `${accounts.length} ${accounts.length === 1 ? 'account' : 'accounts'} connected`}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#9CA3AF] max-w-2xl leading-relaxed">
              Connect YouTube channels, Facebook Pages, and Instagram professional accounts. Instagram connects directly with Instagram Login; a Facebook Page is not required.
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 relative z-10">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#27272A] bg-[#16161A] hover:bg-[#1E1E24] text-[#E5E5E5] hover:text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#3B82F6]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── 2. Top Summary Metric Cards (4 Pillars) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Linked Channels */}
        <div className="p-4 rounded-xl bg-[#141418] border border-[#24242A] flex flex-col justify-between hover:border-[#2E2E36] transition-colors shadow-xs">
          <div className="flex items-center justify-between text-[#9CA3AF] text-xs">
            <span className="font-medium">Connected accounts</span>
            <Link2 className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-white tracking-tight">{loading || (accountsError && accounts.length === 0) ? '—' : accounts.length}</span>
            <span className="text-xs text-[#71717A] ml-1.5 font-medium">linked</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            {ytCount > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium bg-[#1C1C22] text-[#D4D4D8] border border-[#2A2A34]">{ytCount} YouTube</span>}
            {igCount > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium bg-[#1C1C22] text-[#D4D4D8] border border-[#2A2A34]">{igCount} Instagram</span>}
            {fbCount > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium bg-[#1C1C22] text-[#D4D4D8] border border-[#2A2A34]">{fbCount} Facebook</span>}
            {accounts.length === 0 && !loading && !accountsError && <span className="text-[10px] text-zinc-500">None linked</span>}
          </div>
        </div>

        {/* Card 2: Total Audience Reach */}
        <div className="p-4 rounded-xl bg-[#141418] border border-[#24242A] flex flex-col justify-between hover:border-[#2E2E36] transition-colors shadow-xs">
          <div className="flex items-center justify-between text-[#9CA3AF] text-xs">
            <span className="font-medium">Combined Audience</span>
            <Users className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-white tracking-tight">{loading || (accountsError && accounts.length === 0) ? '—' : formatCount(totalFollowers)}</span>
            <span className="text-xs text-[#71717A] ml-1.5 font-medium">followers</span>
          </div>
          <p className="mt-2 text-[10px] text-[#71717A] truncate">Across connected platforms</p>
        </div>

        {/* Card 3: Syndication Output */}
        <div className="p-4 rounded-xl bg-[#141418] border border-[#24242A] flex flex-col justify-between hover:border-[#2E2E36] transition-colors shadow-xs">
          <div className="flex items-center justify-between text-[#9CA3AF] text-xs">
            <span className="font-medium">Recent publishes</span>
            <Video className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-white tracking-tight">{postsLoading ? '—' : recentPublishedCount}</span>
            <span className="text-xs text-[#71717A] ml-1.5 font-medium">successful</span>
          </div>
          <p className="mt-2 text-[10px] text-[#71717A] truncate">
            {posts.length === 0
              ? 'No publishing activity yet'
              : posts.length >= 50
                ? 'From the latest 50 activity records'
                : 'From recent publishing history'}
          </p>
        </div>

        {/* Card 4: Active Target Destination */}
        <div className="p-4 rounded-xl bg-[#141418] border border-[#24242A] flex flex-col justify-between hover:border-[#2E2E36] transition-colors shadow-xs">
          <div className="flex items-center justify-between text-[#9CA3AF] text-xs">
            <span className="font-medium">
              {activeAccount?.platform === 'youtube' && !activeChannelVerified ? 'Saved Destination' : 'Active Destination'}
            </span>
            <span className={`w-2 h-2 rounded-full ${
              activeAccount && activeAccountVerified ? 'bg-emerald-400' : activeAccount ? 'bg-amber-400' : 'bg-[#71717A]'
            }`} />
          </div>
          <div className="mt-2 flex items-center gap-2.5 min-w-0">
            {activeAccount ? (
              <>
                <img
                  src={activeAccount.avatarUrl || getSocialAvatarFallback(activeAccount.name)}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover shrink-0 border border-[#2E2E38]"
                  onError={(event) => handleSocialAvatarError(event, activeAccount.name)}
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate leading-tight">{activeAccount.name}</p>
                  <p className="text-[10px] text-[#71717A] truncate font-mono">{activeAccount.handle}</p>
                </div>
              </>
            ) : (
              <span className="text-xs text-zinc-500">No destination selected</span>
            )}
          </div>
          <p className="mt-2 text-[10px] text-[#9CA3AF] truncate">
            {activeAccount?.platform === 'youtube' && !activeChannelVerified
              ? 'Saved in this browser; sign in to verify the YouTube target'
              : 'Target for Studio 1-click publishing'}
          </p>
        </div>
      </div>

      {/* ── 3. Link a New Social Account (Studio Color Palette) ── */}
      <div className="p-5 rounded-2xl bg-[#141418] border border-[#24242A] shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white">Connect a social account</h2>
            <p className="text-[11px] text-[#9CA3AF]">Choose a platform to filter accounts, or use + to connect another account. Select the same platform again to show all.</p>
            <p className="mt-1 text-[10px] text-[#71717A]">The + button opens the platform’s secure authorization page, then returns you here.</p>
          </div>
          <span className="text-[10px] text-zinc-500 font-medium">Secure OAuth connection</span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-2.5">
          {([
            { platform: 'youtube', label: 'YouTube', count: ytCount, Icon: Youtube, iconClass: 'text-[#EF4444] fill-current' },
            { platform: 'instagram', label: 'Instagram', count: igCount, Icon: Instagram, iconClass: 'text-[#EC4899]' },
            { platform: 'facebook', label: 'Facebook', count: fbCount, Icon: Facebook, iconClass: 'text-[#3B82F6] fill-current' },
          ] as const).map(({ platform, label, count, Icon, iconClass }) => {
            const isSelected = activeFilter === platform;
            const isConnecting = platform === 'youtube'
              ? connectingGoogle
              : connectingMetaPlatform === platform;
            const connectionInProgress = connectingGoogle || connectingMetaPlatform !== null;

            return (
              <div
                key={platform}
                className={`flex min-w-0 items-center gap-0.5 p-0.5 sm:gap-1 sm:p-1 rounded-xl border transition-colors ${
                  isSelected
                    ? 'bg-[#1A1A20] border-[#33333C]'
                    : 'bg-[#111114] border-[#24242A] hover:border-[#33333C]'
                }`}
              >
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setActiveFilter((current) => current === platform ? 'all' : platform)}
                  className="flex flex-1 min-w-0 items-center gap-1 px-1 py-2 sm:gap-2 sm:px-2 rounded-lg text-[10px] sm:text-xs font-medium text-[#D4D4D8] hover:text-white transition-colors cursor-pointer"
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${iconClass}`} />
                  <span className="truncate">{label}</span>
                  <span className="ml-auto px-1 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono bg-[#16161A] text-[#8E8E93] border border-[#282830]">
                    {count}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleConnectPlatform(platform)}
                  disabled={connectionInProgress}
                  aria-label={isConnecting ? `Connecting ${label}` : `Add ${label} account`}
                  title={isConnecting ? 'Connection in progress' : `Add ${label} account`}
                  className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 inline-flex items-center justify-center rounded-lg border border-[#303039] bg-[#202027] text-[#A1A1AA] hover:text-white hover:bg-[#292932] hover:border-[#454550] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting
                    ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    : <Plus className="w-4 h-4" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notifications / Alerts */}
      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notice}</span>
          </div>
          <button type="button" onClick={() => setNotice(null)} className="text-[10px] underline hover:text-white cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button type="button" onClick={() => setActionError(null)} className="text-[10px] underline hover:text-white cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {accountsError && (
        <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-red-300 flex items-start justify-between gap-3" role="alert">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 text-red-400 shrink-0" />
            <div>
              <p className="font-semibold">Social accounts couldn’t be loaded</p>
              <p className="mt-1 text-red-200/70">{accountsError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="shrink-0 px-3 py-1.5 rounded-lg border border-red-400/20 bg-red-500/10 text-xs font-semibold text-red-200 hover:bg-red-500/20 transition-colors cursor-pointer disabled:opacity-50"
          >
            Try again
          </button>
        </div>
      )}

      {/* ── 5. Linked Channel Cards Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-[#141418] border border-[#24242A]" />
          ))}
        </div>
      ) : accountsError && accounts.length === 0 ? null : filteredAccounts.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[#141418] border border-[#24242A] text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#1A1A22] border border-[#2E2E38] text-zinc-400 flex items-center justify-center">
            <Link2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">No {activeFilter === 'all' ? 'accounts' : `${activeFilter} accounts`} linked</h3>
            <p className="text-xs text-[#9CA3AF] mt-1 max-w-sm">
              Connect an account to see it here and use it as a publishing destination.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleConnectPlatform(activeFilter === 'all' ? 'youtube' : activeFilter)}
            disabled={connectingGoogle || connectingMetaPlatform !== null}
            className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {connectingGoogle || connectingMetaPlatform !== null
              ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              : <Plus className="w-3.5 h-3.5" />}
            <span>{connectingGoogle || connectingMetaPlatform !== null ? 'Connecting...' : 'Link Account'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAccounts.map((acc) => {
            const isTarget = acc.platform === 'youtube'
              ? acc.platformAccountId === activeYouTubeChannelId
              : acc.handle === activeChannelKey || acc.id === activeChannelKey;
            const isOwnedYouTubeChannel = acc.platform === 'youtube' && ownedYouTubeChannelIds.includes(acc.platformAccountId);
            const isVerifiedTarget = isTarget && (acc.platform !== 'youtube' || activeChannelVerified);
            const channelUrl = getPlatformUrl(acc);

            return (
              <div
                key={acc.id}
                className={`p-4 sm:p-5 rounded-2xl bg-[#141418] border transition-all flex flex-col justify-between gap-4 shadow-xs ${
                  isVerifiedTarget
                    ? 'border-emerald-500/40 bg-[#141816] shadow-emerald-950/20'
                    : isTarget
                      ? 'border-amber-500/40 bg-[#191611]'
                    : 'border-[#24242A] hover:border-[#33333C]'
                }`}
              >
                {/* Top Channel Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={acc.avatarUrl || getSocialAvatarFallback(acc.name)}
                        alt={acc.name}
                        className="w-12 h-12 rounded-full object-cover border border-[#2E2E38] shadow-sm"
                        onError={(event) => handleSocialAvatarError(event, acc.name)}
                      />
                      <div className="absolute -bottom-1 -right-1">
                        {renderPlatformBadge(acc.platform)}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-bold text-white truncate leading-tight">{acc.name}</h4>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold uppercase border ${getPlatformBadgeClasses(acc.platform)}`}>
                          {acc.platform}
                        </span>
                      </div>
                      <p className="text-xs text-[#9CA3AF] font-mono truncate mt-0.5">{acc.handle}</p>
                      <p className="text-[10px] text-[#71717A] mt-1">
                        Linked {formatDateTime(acc.connectedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Active Indicator Badge */}
                  {isTarget ? (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 flex items-center gap-1 ${
                      isVerifiedTarget
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isVerifiedTarget ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                      {isVerifiedTarget ? 'Active Target' : 'Saved Selection'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#1C1C22] text-[#8E8E93] border border-[#2A2A34] shrink-0">
                      Connected Account
                    </span>
                  )}
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-2 gap-2 py-2 px-3 rounded-xl bg-[#101014] border border-[#1E1E24] text-xs">
                  <div>
                    <span className="text-[10px] text-[#71717A] font-mono uppercase block">
                      {acc.platform === 'youtube' ? 'Subscribers' : 'Followers'}
                    </span>
                    <span className="font-bold text-white text-sm">
                      {acc.followersCount && acc.followersCount > 0 ? formatCount(acc.followersCount) : '0'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#71717A] font-mono uppercase block">
                      {acc.platform === 'youtube' ? 'Uploaded Videos' : 'Published Posts'}
                    </span>
                    <span className="font-bold text-white text-sm">{acc.postsCount || 0}</span>
                  </div>
                </div>

                {/* Bottom Action Strip */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1E1E24]">
                  <div className="flex items-center gap-2">
                    {!isTarget || (acc.platform === 'youtube' && !activeChannelVerified) ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (acc.platform === 'youtube' && !isOwnedYouTubeChannel) {
                            handleConnectGoogle(acc);
                          } else {
                            void handleSetActive(acc);
                          }
                        }}
                        disabled={connectingGoogle}
                        className="px-2.5 py-1.5 rounded-lg bg-[#1E1E24] hover:bg-[#26262E] text-zinc-300 hover:text-white border border-[#2E2E38] hover:border-[#3E3E48] text-[11px] font-medium cursor-pointer transition-colors"
                      >
                        {acc.platform === 'youtube' && !isOwnedYouTubeChannel ? 'Reconnect YouTube' : 'Set as Active Target'}
                      </button>
                    ) : (
                      <div className="px-2.5 py-1 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 text-[10px] font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>{isVerifiedTarget ? 'Current Target' : 'Saved Selection'}</span>
                      </div>
                    )}

                    {channelUrl !== '#' && (
                      <a
                        href={channelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-[#18181C] hover:bg-[#222228] text-zinc-400 hover:text-white border border-[#2A2A32] text-xs transition-colors flex items-center gap-1"
                        title={`Open ${acc.name} on ${acc.platform}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={disconnectingId === acc.id}
                    onClick={() => handleDisconnect(acc.id, acc.name)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition-colors cursor-pointer disabled:opacity-50"
                    title={`Disconnect ${acc.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 6. Publishing History ── */}
      <section className="p-5 sm:p-6 rounded-2xl bg-[#141418] border border-[#24242A] space-y-4 shadow-sm" aria-labelledby="publishing-history-title">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#202026]">
          <div>
            <h2 id="publishing-history-title" className="text-base font-bold text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#3B82F6]" />
              <span>Publishing history</span>
            </h2>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Check each channel’s publish status, troubleshoot failures, and open live posts.
            </p>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <span className="text-xs text-[#71717A]">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            </span>
            <button
              type="button"
              onClick={loadPublishedPosts}
              disabled={postsLoading}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#27272A] bg-[#18181C] hover:bg-[#202026] text-xs font-medium text-[#D4D4D8] hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Refresh publishing history"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${postsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {postsLoading ? (
          <div className="space-y-2.5" role="status" aria-label="Loading publishing history">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-20 rounded-xl bg-[#18181C] border border-[#24242A] animate-pulse" />
            ))}
          </div>
        ) : postsError ? (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3" role="alert">
            <div className="flex items-start gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
              <div>
                <p className="font-semibold">Publishing history couldn’t be loaded</p>
                <p className="mt-1 text-red-200/70">{postsError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={loadPublishedPosts}
              className="shrink-0 px-3 py-1.5 rounded-lg border border-red-400/20 bg-red-500/10 text-xs font-semibold text-red-200 hover:bg-red-500/20 transition-colors cursor-pointer"
            >
              Try again
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-7 px-4 text-center rounded-xl border border-dashed border-[#2A2A32] bg-[#111114]">
            <Video className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#D4D4D8]">No publishing activity yet</p>
            <p className="text-xs text-[#71717A] mt-1">
              Once you publish from Studio, every destination’s result will appear here.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('workspace')}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Open Studio</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5" aria-live="polite">
            {posts.map((post) => {
              const status = post.status?.toLowerCase() || 'unknown';
              const statusStyles = status === 'published'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : status === 'failed'
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : status === 'queued'
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                    : 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20';
              const postUrl = status === 'published' && post.videoIdOrUrl && /^https?:\/\//i.test(post.videoIdOrUrl)
                ? post.videoIdOrUrl
                : null;
              const account = accounts.find((item) => item.id === post.socialAccountId);

              return (
                <article key={post.id} className="p-3.5 sm:p-4 rounded-xl border border-[#24242A] bg-[#111114] hover:border-[#33333C] transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#1B1B20] border border-[#292930] flex items-center justify-center shrink-0">
                        {getPlatformIcon(post.platform, 'w-4 h-4')}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{post.title || 'Untitled video'}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#8E8E93]">
                          <span className="capitalize">{post.platform}</span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{account?.name || 'Disconnected account'}</span>
                          <span aria-hidden="true">·</span>
                          <time dateTime={post.publishedAt}>{formatDateTime(post.publishedAt)}</time>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 pl-12 sm:pl-0 shrink-0">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md border text-[10px] font-semibold capitalize ${statusStyles}`}>
                        {status}
                      </span>
                      {postUrl ? (
                        <a
                          href={postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[#60A5FA] hover:text-white font-medium transition-colors"
                        >
                          <span>View post</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-[#62626B]">No post link</span>
                      )}
                    </div>
                  </div>
                  {status === 'failed' && post.errorMessage && (
                    <p className="mt-3 ml-12 text-xs text-red-300/90 break-words">
                      <span className="font-semibold">Reason: </span>{post.errorMessage}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
