import React, { useState, useEffect } from 'react';
import {
  Youtube,
  Instagram,
  Facebook,
  Radio,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Users,
  Video,
  BarChart2,
  Sparkles,
  Loader2,
  X,
  Check,
  Globe,
  Share2,
  Layers,
  Zap,
  Link2,
} from 'lucide-react';
import { Badge, Button } from '@/src/shared/ui/common';
import { socialApi } from '@/src/features/social/api/socialApi';
import { SocialAccount, SocialPlatform, PublishedPost } from '@/src/features/social/types';
import { connectYouTubeWithGoogle } from '@/src/features/youtube/utils/googleOAuthConnect';

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
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<PublishedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | SocialPlatform>('all');
  const [activeChannelKey, setActiveChannelKey] = useState<string>('');

  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  // Manual connect modal state
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectPlatform, setConnectPlatform] = useState<SocialPlatform>('youtube');
  const [connectHandleInput, setConnectHandleInput] = useState('');
  const [connectNameInput, setConnectNameInput] = useState('');
  const [connectingPlatform, setConnectingPlatform] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fleet, published] = await Promise.all([
        socialApi.getFleetAccounts(),
        socialApi.getPublishedPosts(50),
      ]);
      setAccounts(fleet);
      setPosts(published);

      // Resolve active channel
      const stored = localStorage.getItem('apexmind_yt_active_channel');
      if (stored && fleet.some((a) => a.handle === stored || a.id === stored)) {
        setActiveChannelKey(stored);
      } else if (fleet.length > 0) {
        const fallbackKey = fleet[0].handle || fleet[0].id;
        setActiveChannelKey(fallbackKey);
        localStorage.setItem('apexmind_yt_active_channel', fallbackKey);
      }
    } catch (err: any) {
      console.warn('Failed to load fleet data:', err);
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

  const handleSetActive = (acc: SocialAccount) => {
    const key = acc.handle || acc.id;
    setActiveChannelKey(key);
    localStorage.setItem('apexmind_yt_active_channel', key);
    window.dispatchEvent(
      new CustomEvent('youtube:channel-switched', {
        detail: { channel: acc, handle: key },
      })
    );
    setNotice(`Active publishing destination set to "${acc.name}" (${acc.handle})`);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleConnectGoogle = () => {
    setActionError(null);
    setNotice(null);
    connectYouTubeWithGoogle({
      onLoading: setConnectingGoogle,
      onSuccess: (connectedChannel) => {
        setNotice(`Successfully connected YouTube channel "${connectedChannel.name}"!`);
        loadData();
        window.dispatchEvent(new CustomEvent('social:fleet-updated'));
      },
      onError: (err) => {
        setActionError(err);
      },
    });
  };

  const handleOpenConnectModal = (platform: SocialPlatform) => {
    setConnectPlatform(platform);
    setConnectHandleInput('');
    setConnectNameInput('');
    setActionError(null);
    setIsConnectModalOpen(true);
  };

  const handleSubmitConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectHandleInput.trim()) {
      setActionError('Channel or account handle is required.');
      return;
    }

    setConnectingPlatform(true);
    setActionError(null);
    try {
      const cleanHandle = connectHandleInput.trim().startsWith('@')
        ? connectHandleInput.trim()
        : `@${connectHandleInput.trim()}`;
      const defaultName = connectNameInput.trim() || cleanHandle.replace(/^@/, '');

      await socialApi.connectAccount(connectPlatform, {
        handle: cleanHandle,
        name: defaultName,
      });

      setIsConnectModalOpen(false);
      setNotice(`Successfully linked ${connectPlatform.toUpperCase()} account "${defaultName}"!`);
      loadData();
      window.dispatchEvent(new CustomEvent('social:fleet-updated'));
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to connect account.');
    } finally {
      setConnectingPlatform(false);
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

      if (activeChannelKey === accountId || activeChannelKey === accounts.find((a) => a.id === accountId)?.handle) {
        const next = updated[0]?.handle || updated[0]?.id || '';
        setActiveChannelKey(next);
        if (next) {
          localStorage.setItem('apexmind_yt_active_channel', next);
        } else {
          localStorage.removeItem('apexmind_yt_active_channel');
        }
      }

      setNotice(`Disconnected "${accountName}" from fleet.`);
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
        return `https://www.facebook.com/${handleClean}`;
      default:
        return '#';
    }
  };

  // Metrics aggregations
  const totalFollowers = accounts.reduce((acc, a) => acc + (a.followersCount || 0), 0);
  const totalPostsCount = accounts.reduce((acc, a) => acc + (a.postsCount || 0), 0) + posts.length;
  const activeAccount = accounts.find((a) => a.handle === activeChannelKey || a.id === activeChannelKey) || accounts[0];

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
            <Link2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Social Linking &amp; Fleet Hub
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Linked Fleet Active
              </span>
            </div>
            <p className="mt-1 text-xs text-[#9CA3AF] max-w-2xl leading-relaxed">
              Link, manage, and syndicate across your omnichannel social accounts. Connect YouTube, Instagram Reels, and Facebook Pages to publish productions in one click.
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 relative z-10">
          <button
            type="button"
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#27272A] bg-[#16161A] hover:bg-[#1E1E24] text-[#E5E5E5] hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#3B82F6]' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenConnectModal('youtube')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white border border-[#3B82F6]/40 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Link Channel</span>
          </button>
        </div>
      </div>

      {/* ── 2. Top Summary Metric Cards (4 Pillars) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Linked Channels */}
        <div className="p-4 rounded-xl bg-[#141418] border border-[#24242A] flex flex-col justify-between hover:border-[#2E2E36] transition-colors shadow-xs">
          <div className="flex items-center justify-between text-[#9CA3AF] text-xs">
            <span className="font-medium">Linked Channels</span>
            <Link2 className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-white tracking-tight">{accounts.length}</span>
            <span className="text-xs text-[#71717A] ml-1.5 font-medium">linked</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            {ytCount > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium bg-[#1C1C22] text-[#D4D4D8] border border-[#2A2A34]">{ytCount} YouTube</span>}
            {igCount > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium bg-[#1C1C22] text-[#D4D4D8] border border-[#2A2A34]">{igCount} Instagram</span>}
            {fbCount > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium bg-[#1C1C22] text-[#D4D4D8] border border-[#2A2A34]">{fbCount} Facebook</span>}
            {accounts.length === 0 && <span className="text-[10px] text-zinc-500">None linked</span>}
          </div>
        </div>

        {/* Card 2: Total Audience Reach */}
        <div className="p-4 rounded-xl bg-[#141418] border border-[#24242A] flex flex-col justify-between hover:border-[#2E2E36] transition-colors shadow-xs">
          <div className="flex items-center justify-between text-[#9CA3AF] text-xs">
            <span className="font-medium">Combined Audience</span>
            <Users className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-white tracking-tight">{formatCount(totalFollowers)}</span>
            <span className="text-xs text-[#71717A] ml-1.5 font-medium">followers</span>
          </div>
          <p className="mt-2 text-[10px] text-[#71717A] truncate">Total cross-network subscribers</p>
        </div>

        {/* Card 3: Syndication Output */}
        <div className="p-4 rounded-xl bg-[#141418] border border-[#24242A] flex flex-col justify-between hover:border-[#2E2E36] transition-colors shadow-xs">
          <div className="flex items-center justify-between text-[#9CA3AF] text-xs">
            <span className="font-medium">Syndicated Videos</span>
            <Video className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-white tracking-tight">{totalPostsCount}</span>
            <span className="text-xs text-[#71717A] ml-1.5 font-medium">published</span>
          </div>
          <p className="mt-2 text-[10px] text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Auto-cross-post ready
          </p>
        </div>

        {/* Card 4: Active Target Destination */}
        <div className="p-4 rounded-xl bg-[#141418] border border-[#24242A] flex flex-col justify-between hover:border-[#2E2E36] transition-colors shadow-xs">
          <div className="flex items-center justify-between text-[#9CA3AF] text-xs">
            <span className="font-medium">Active Destination</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="mt-2 flex items-center gap-2.5 min-w-0">
            {activeAccount ? (
              <>
                <img
                  src={activeAccount.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(activeAccount.name)}`}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover shrink-0 border border-[#2E2E38]"
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
          <p className="mt-2 text-[10px] text-[#9CA3AF] truncate">Target for Studio 1-click publishing</p>
        </div>
      </div>

      {/* ── 3. Link a New Social Account (Studio Color Palette) ── */}
      <div className="p-5 rounded-2xl bg-[#141418] border border-[#24242A] space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Link a New Social Account to Your Fleet</h2>
            <p className="text-[11px] text-[#9CA3AF]">Choose a platform below to connect with OAuth or direct handle registration.</p>
          </div>
          <span className="text-[10px] text-zinc-500 font-medium">1-Click Integration</span>
        </div>

        {/* 4 Sleek Studio Platform Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={handleConnectGoogle}
            disabled={connectingGoogle}
            className="flex items-center justify-center gap-2.5 py-3 px-3.5 rounded-xl border border-[#27272A] bg-[#18181C] hover:bg-[#202026] hover:border-[#383842] text-xs font-medium text-[#E5E5E5] hover:text-white transition-all cursor-pointer shadow-xs disabled:opacity-50 active:scale-98 group"
          >
            <Youtube className="w-4 h-4 text-[#EF4444] fill-current group-hover:scale-110 transition-transform" />
            <span>{connectingGoogle ? 'Connecting...' : 'YouTube (OAuth)'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenConnectModal('instagram')}
            className="flex items-center justify-center gap-2.5 py-3 px-3.5 rounded-xl border border-[#27272A] bg-[#18181C] hover:bg-[#202026] hover:border-[#383842] text-xs font-medium text-[#E5E5E5] hover:text-white transition-all cursor-pointer shadow-xs active:scale-98 group"
          >
            <Instagram className="w-4 h-4 text-[#EC4899] group-hover:scale-110 transition-transform" />
            <span>Instagram Reels</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenConnectModal('facebook')}
            className="flex items-center justify-center gap-2.5 py-3 px-3.5 rounded-xl border border-[#27272A] bg-[#18181C] hover:bg-[#202026] hover:border-[#383842] text-xs font-medium text-[#E5E5E5] hover:text-white transition-all cursor-pointer shadow-xs active:scale-98 group"
          >
            <Facebook className="w-4 h-4 text-[#3B82F6] fill-current group-hover:scale-110 transition-transform" />
            <span>Facebook Page</span>
          </button>

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

      {/* ── 4. Platform Filter Tabs (Unified Studio Tabs) ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#24242A]">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-[#222228] text-white border border-[#333338] shadow-xs'
              : 'text-[#9CA3AF] hover:text-white hover:bg-[#18181C] border border-transparent'
          }`}
        >
          <span>All Channels</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#16161A] text-[#8E8E93] border border-[#282830]">
            {accounts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('youtube')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeFilter === 'youtube'
              ? 'bg-[#222228] text-white border border-[#333338] shadow-xs'
              : 'text-[#9CA3AF] hover:text-white hover:bg-[#18181C] border border-transparent'
          }`}
        >
          <Youtube className="w-3.5 h-3.5 text-[#EF4444] fill-current" />
          <span>YouTube</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#16161A] text-[#8E8E93] border border-[#282830]">
            {ytCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('instagram')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeFilter === 'instagram'
              ? 'bg-[#222228] text-white border border-[#333338] shadow-xs'
              : 'text-[#9CA3AF] hover:text-white hover:bg-[#18181C] border border-transparent'
          }`}
        >
          <Instagram className="w-3.5 h-3.5 text-[#EC4899]" />
          <span>Instagram</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#16161A] text-[#8E8E93] border border-[#282830]">
            {igCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('facebook')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeFilter === 'facebook'
              ? 'bg-[#222228] text-white border border-[#333338] shadow-xs'
              : 'text-[#9CA3AF] hover:text-white hover:bg-[#18181C] border border-transparent'
          }`}
        >
          <Facebook className="w-3.5 h-3.5 text-[#3B82F6] fill-current" />
          <span>Facebook</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#16161A] text-[#8E8E93] border border-[#282830]">
            {fbCount}
          </span>
        </button>

      </div>

      {/* ── 5. Linked Channel Cards Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-[#141418] border border-[#24242A]" />
          ))}
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[#141418] border border-[#24242A] text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#1A1A22] border border-[#2E2E38] text-zinc-400 flex items-center justify-center">
            <Link2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">No {activeFilter !== 'all' ? activeFilter.toUpperCase() : ''} Channels Linked</h3>
            <p className="text-xs text-[#9CA3AF] mt-1 max-w-sm">
              Link a social account above to begin automated syndication and cross-platform publishing.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenConnectModal(activeFilter === 'all' ? 'youtube' : activeFilter)}
            className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Link Channel</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAccounts.map((acc) => {
            const isTarget = acc.handle === activeChannelKey || acc.id === activeChannelKey;
            const channelUrl = getPlatformUrl(acc);

            return (
              <div
                key={acc.id}
                className={`p-4 sm:p-5 rounded-2xl bg-[#141418] border transition-all flex flex-col justify-between gap-4 shadow-xs ${
                  isTarget
                    ? 'border-emerald-500/40 bg-[#141816] shadow-emerald-950/20'
                    : 'border-[#24242A] hover:border-[#33333C]'
                }`}
              >
                {/* Top Channel Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={
                          acc.avatarUrl ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(acc.name)}`
                        }
                        alt={acc.name}
                        className="w-12 h-12 rounded-full object-cover border border-[#2E2E38] shadow-sm"
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
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active Target
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#1C1C22] text-[#8E8E93] border border-[#2A2A34] shrink-0">
                      Fleet Channel
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
                    {!isTarget ? (
                      <button
                        type="button"
                        onClick={() => handleSetActive(acc)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#1E1E24] hover:bg-[#26262E] text-zinc-300 hover:text-white border border-[#2E2E38] hover:border-[#3E3E48] text-[11px] font-medium cursor-pointer transition-colors"
                      >
                        Set as Active Target
                      </button>
                    ) : (
                      <div className="px-2.5 py-1 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 text-[10px] font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Current Target</span>
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

      {/* ── 6. In-Depth Syndication & Publishing History Feed ── */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#141418] border border-[#24242A] space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#202026]">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#3B82F6]" />
              <span>Omnichannel Syndication &amp; Publishing Audit</span>
            </h2>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Live chronological feed of videos published across your connected YouTube, Instagram, and Facebook fleet.
            </p>
          </div>
          <span className="text-xs font-mono text-[#71717A]">
            {posts.length} recorded posts
          </span>
        </div>

        {posts.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#71717A]">
            <Video className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-60" />
            <p>No multi-platform syndications logged yet.</p>
            <p className="text-[11px] text-zinc-600 mt-0.5">
              Use "Publish Video" in the Studio to cross-post to your linked channels simultaneously.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#202026] text-[#71717A] font-mono uppercase text-[10px]">
                  <th className="pb-2.5 font-semibold">Video Title</th>
                  <th className="pb-2.5 font-semibold">Platform</th>
                  <th className="pb-2.5 font-semibold">Status</th>
                  <th className="pb-2.5 font-semibold">Published</th>
                  <th className="pb-2.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B1B20]">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-[#18181E] transition-colors">
                    <td className="py-3 pr-4 font-semibold text-white max-w-xs truncate">
                      {post.title}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border uppercase ${getPlatformBadgeClasses(post.platform)}`}>
                        {getPlatformIcon(post.platform, 'w-3 h-3')}
                        <span>{post.platform}</span>
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                        <Check className="w-3 h-3" /> Published
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[#8E8E93] font-mono text-[11px]">
                      {formatDateTime(post.publishedAt)}
                    </td>
                    <td className="py-3 text-right">
                      {post.videoIdOrUrl ? (
                        <a
                          href={post.videoIdOrUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[#3B82F6] hover:text-[#60A5FA] font-medium hover:underline"
                        >
                          <span>View Live</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-zinc-600 text-xs">Live</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 7. Direct Channel Connection Modal ── */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#141418] border border-[#2E2E38] rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#24242C] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1C1C22] border border-[#2E2E38] flex items-center justify-center">
                  {getPlatformIcon(connectPlatform, 'w-4 h-4')}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white capitalize">Link {connectPlatform} Account</h3>
                  <p className="text-[11px] text-[#9CA3AF]">Add this destination to your omnichannel publishing fleet</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConnectModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitConnect} className="p-5 space-y-4">
              {connectPlatform === 'youtube' && (
                <div className="p-3 rounded-xl border border-red-500/20 bg-red-950/20 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-red-300">
                    <Youtube className="w-4 h-4 text-red-400 fill-current" />
                    <span>Or connect via official Google OAuth:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsConnectModalOpen(false);
                      handleConnectGoogle();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-[11px] font-semibold text-white transition-colors cursor-pointer"
                  >
                    Google OAuth
                  </button>
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                  Account Handle or Username <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    connectPlatform === 'youtube'
                      ? '@DailyStoicShorts'
                      : connectPlatform === 'instagram'
                      ? '@dailystoic_reels'
                      : 'Daily Stoic Page'
                  }
                  value={connectHandleInput}
                  onChange={(e) => setConnectHandleInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0D0D10] border border-[#2A2A34] text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                  Display Name (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Daily Stoic Mindset"
                  value={connectNameInput}
                  onChange={(e) => setConnectNameInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0D0D10] border border-[#2A2A34] text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              {actionError && (
                <p className="text-xs text-red-400 bg-red-950/30 p-2.5 rounded-lg border border-red-500/20">
                  {actionError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#1C1C22] hover:bg-[#25252E] text-xs font-semibold text-zinc-300 cursor-pointer transition-colors border border-[#2E2E38]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={connectingPlatform}
                  className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-bold text-white cursor-pointer shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {connectingPlatform && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Link Destination</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
