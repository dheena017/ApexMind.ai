import React, { useState, useEffect } from 'react';
import {
  X,
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
  Sparkles,
  Check,
  ArrowRight,
  Share2,
  Layers,
  Zap,
  Globe,
} from 'lucide-react';
import { socialApi } from '../api/socialApi';
import { SocialAccount, SocialPlatform } from '../types';
import { Button } from '@/src/shared/ui/common';
import { connectYouTubeWithGoogle } from '@/src/features/youtube/utils/googleOAuthConnect';
import { navigateOAuthPopup, openOAuthPopup } from '@/src/shared/utils/oauthPopup';

interface SocialFleetDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (page: string) => void;
}

export const SocialFleetDrawer: React.FC<SocialFleetDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [fleet, setFleet] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [activeChannelKey, setActiveChannelKey] = useState<string>('');

  const loadFleet = async () => {
    setLoading(true);
    setLoadError(false);
    setNotice(null);
    try {
      const accounts = await socialApi.getFleetAccounts();
      setFleet(accounts);

      // Check active channel
      const stored = typeof window !== 'undefined' ? localStorage.getItem('apexmind_yt_active_channel') : null;
      if (stored && accounts.some((a) => a.handle === stored || a.id === stored)) {
        setActiveChannelKey(stored);
      } else if (accounts.length > 0) {
        const fallback = accounts[0].handle || accounts[0].id;
        setActiveChannelKey(fallback);
        if (typeof window !== 'undefined') {
          localStorage.setItem('apexmind_yt_active_channel', fallback);
        }
      }
    } catch (err) {
      setLoadError(true);
      setNotice({
        text: err instanceof Error ? err.message : 'Failed to load connected social accounts.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadFleet();
      setNotice(null);
    }
  }, [isOpen]);

  const handleSetActive = (acc: SocialAccount) => {
    const key = acc.handle || acc.id;
    setActiveChannelKey(key);
    if (typeof window !== 'undefined') {
      localStorage.setItem('apexmind_yt_active_channel', key);
      window.dispatchEvent(
        new CustomEvent('youtube:channel-switched', {
          detail: { channel: acc, handle: key },
        })
      );
    }
    setNotice({ text: `Set "${acc.name}" as active publishing destination.`, type: 'success' });
    setTimeout(() => setNotice(null), 3500);
  };

  const handleDisconnect = async (accountId: string, accountName: string) => {
    if (!window.confirm(`Disconnect "${accountName}" from Social Accounts?`)) return;

    setDisconnectingId(accountId);
    try {
      await socialApi.disconnectAccount(accountId);
      const updated = fleet.filter((acc) => acc.id !== accountId);
      setFleet(updated);

      // If active channel was deleted, reassign active channel
      if (activeChannelKey === accountId || updated.length > 0) {
        const next = updated[0]?.handle || updated[0]?.id || '';
        setActiveChannelKey(next);
        if (typeof window !== 'undefined') {
          if (next) {
            localStorage.setItem('apexmind_yt_active_channel', next);
          } else {
            localStorage.removeItem('apexmind_yt_active_channel');
          }
        }
      }

      setNotice({ text: `Disconnected "${accountName}".`, type: 'info' });
      window.dispatchEvent(new CustomEvent('social:fleet-updated'));
    } catch (err: any) {
      setNotice({ text: err.message || 'Failed to disconnect account.', type: 'error' });
    } finally {
      setDisconnectingId(null);
    }
  };

  // Launch the provider OAuth flow; never create an unverified destination from a typed handle.
  const handleAddPlatformClick = async (platform: SocialPlatform) => {
    setNotice(null);

    if (platform === 'youtube') {
      try {
        await connectYouTubeWithGoogle({
          onSuccess: (ch) => {
            loadFleet();
            setNotice({ text: `Connected YouTube channel "${ch.name}"!`, type: 'success' });
            window.dispatchEvent(new CustomEvent('social:fleet-updated'));
          },
          onError: (err) => {
            setNotice({ text: err || 'YouTube authorization was not completed.', type: 'error' });
          },
        });
      } catch (err) {
        setNotice({ text: err instanceof Error ? err.message : 'YouTube authorization failed.', type: 'error' });
      }
      return;
    }

    const authWindow = openOAuthPopup();
    if (!authWindow) {
      setNotice({ text: 'Allow pop-ups to continue with secure social account connection.', type: 'error' });
      return;
    }

    try {
      const oauthUrl = await socialApi.getOAuthUrl(platform);
      navigateOAuthPopup(authWindow, oauthUrl);
    } catch (err: any) {
      authWindow.close();
      setNotice({ text: err.message || `Could not start ${platform} authorization.`, type: 'error' });
    }
  };

  const handleOpenFleetHub = () => {
    onClose();
    if (onNavigate) {
      onNavigate('channels');
    } else if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/social-accounts');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  if (!isOpen) return null;

  // Render high-polish platform avatar badge with brand colors
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

  const getProfileUrl = (acc: SocialAccount) => {
    const cleanHandle = (acc.handle || '').replace('@', '');
    switch (acc.platform) {
      case 'youtube':
        return acc.handle ? `https://www.youtube.com/${acc.handle}` : `https://www.youtube.com/channel/${acc.platformAccountId}`;
      case 'instagram':
        return `https://www.instagram.com/${cleanHandle}/`;
      case 'facebook':
        return `https://www.facebook.com/${acc.platformAccountId}`;
      default:
        return '#';
    }
  };

  const totalAudience = fleet.reduce((sum, acc) => sum + (acc.followersCount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-[#111114] border-l border-[#27272A] h-full flex flex-col shadow-2xl overflow-hidden">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#242426] flex items-center justify-between bg-[#141418]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600/20 to-pink-600/20 border border-red-500/30 flex items-center justify-center text-red-400 shadow-inner">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Social Accounts</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${
                  fleet.length > 0 && !loadError
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-[#1C1C22] text-[#9CA3AF] border-[#2A2A34]'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${fleet.length > 0 && !loadError ? 'bg-emerald-400' : 'bg-[#71717A]'}`}></span>
                  {loading ? 'Loading' : loadError ? 'Unavailable' : fleet.length > 0 ? 'Connected' : 'Not connected'}
                </span>
              </div>
              <p className="text-xs text-[#A1A1AA]">Manage connected accounts and publishing destinations</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-[#222226] cursor-pointer transition-colors"
            title="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Alert */}
        {notice && !loadError && (
          <div
            className={`mx-5 mt-4 p-3 rounded-xl border text-xs leading-relaxed flex items-center justify-between ${
              notice.type === 'error'
                ? 'bg-red-950/40 border-red-500/30 text-red-300'
                : notice.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : 'bg-[#18181C] border-[#2E2E34] text-zinc-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {notice.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              )}
              <span>{notice.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Add Destination Quick-Action Row */}
        <div className="p-5 border-b border-[#242426] space-y-2.5 bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#71717A]">
              Connect an account
            </span>
            <span className="text-[10px] text-zinc-500">Secure account authorization</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleAddPlatformClick('youtube')}
              className="group flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-red-500/30 bg-red-950/20 hover:bg-red-900/30 text-xs font-semibold text-red-300 hover:text-white transition-all cursor-pointer shadow-xs active:scale-98"
            >
              <Youtube className="w-3.5 h-3.5 text-red-400 fill-current group-hover:scale-110 transition-transform" />
              <span>YouTube</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddPlatformClick('instagram')}
              className="group flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-pink-500/30 bg-pink-950/20 hover:bg-pink-900/30 text-xs font-semibold text-pink-300 hover:text-white transition-all cursor-pointer shadow-xs active:scale-98"
            >
              <Instagram className="w-3.5 h-3.5 text-pink-400 group-hover:scale-110 transition-transform" />
              <span>Instagram</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddPlatformClick('facebook')}
              className="group flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-blue-500/30 bg-blue-950/20 hover:bg-blue-900/30 text-xs font-semibold text-blue-300 hover:text-white transition-all cursor-pointer shadow-xs active:scale-98"
            >
              <Facebook className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
              <span>Facebook</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Connected Platforms Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#71717A]">
                Connected accounts ({fleet.length})
              </span>
              <button
                type="button"
                onClick={loadFleet}
                className="text-xs text-[#A1A1AA] hover:text-white flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded-md hover:bg-[#1E1E24] transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {loadError ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-5 text-center space-y-3" role="alert">
                <AlertCircle className="w-7 h-7 text-red-400 mx-auto" />
                <h3 className="text-sm font-semibold text-white">Accounts couldn’t be loaded</h3>
                <p className="text-xs text-red-200/80">{notice?.text || 'Refresh to try loading your connected accounts again.'}</p>
                <Button variant="primary" size="sm" onClick={loadFleet}>Try again</Button>
              </div>
            ) : fleet.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#2E2E34] p-8 text-center space-y-3 bg-[#141418]/50">
                <Radio className="w-8 h-8 text-zinc-600 mx-auto" />
                <h3 className="text-sm font-semibold text-white">No social accounts yet</h3>
                <p className="text-xs text-[#A1A1AA] max-w-xs mx-auto">
                  Connect a YouTube channel, Facebook Page, or Instagram professional account. Instagram Login does not require a Facebook Page.
                </p>
                <Button variant="primary" size="sm" onClick={() => handleAddPlatformClick('youtube')}>
                  Connect first account
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {fleet.map((acc) => {
                  const isActive = activeChannelKey === acc.handle || activeChannelKey === acc.id;
                  const profileUrl = getProfileUrl(acc);

                  return (
                    <div
                      key={acc.id}
                      className={`rounded-xl border transition-all p-3.5 flex items-center justify-between gap-3 shadow-xs ${
                        isActive
                          ? 'border-emerald-500/40 bg-[#161B18] shadow-emerald-950/20'
                          : 'border-[#27272A] bg-[#16161A] hover:border-[#3F3F46]'
                      }`}
                    >
                      {/* Avatar with Crisp Platform Badge */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={
                              acc.avatarUrl ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(acc.name)}`
                            }
                            alt=""
                            className="w-11 h-11 rounded-full object-cover border border-[#333338] shadow-xs"
                          />
                          <div className="absolute -bottom-1 -right-1">
                            {renderPlatformBadge(acc.platform)}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-bold text-white truncate">{acc.name}</h4>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase border font-semibold ${
                                acc.platform === 'youtube'
                                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                  : acc.platform === 'instagram'
                                  ? 'bg-pink-500/10 text-pink-400 border-pink-500/20'
                                  : acc.platform === 'facebook'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                  : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                              }`}
                            >
                              {acc.platform}
                            </span>
                            {isActive && (
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                Active Target
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-[#A1A1AA] truncate font-mono mt-0.5">{acc.handle}</p>

                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#8E8E93]">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-zinc-500" />
                              <span>
                                {acc.followersCount && acc.followersCount > 0
                                  ? `${acc.followersCount.toLocaleString()} ${acc.platform === 'youtube' ? 'subscribers' : 'followers'}`
                                  : `0 ${acc.platform === 'youtube' ? 'subscribers' : 'followers'}`}
                              </span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Video className="w-3 h-3 text-zinc-500" />
                              <span>
                                {acc.postsCount && acc.postsCount > 0
                                  ? `${acc.postsCount} ${acc.platform === 'youtube' ? 'videos' : 'posts'}`
                                  : 'Ready for syndication'}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Set Active / Active Toggle */}
                        {!isActive ? (
                          <button
                            type="button"
                            onClick={() => handleSetActive(acc)}
                            className="px-2.5 py-1.5 rounded-lg border border-[#333338] hover:border-emerald-500/40 bg-[#1D1D22] hover:bg-emerald-950/20 text-[11px] font-medium text-zinc-300 hover:text-emerald-300 transition-all cursor-pointer"
                            title="Set as primary publishing target"
                          >
                            Set Active
                          </button>
                        ) : (
                          <div
                            className="px-2 py-1 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-[10px] font-semibold text-emerald-300 flex items-center gap-1"
                            title="Currently active publishing target"
                          >
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Active</span>
                          </div>
                        )}

                        {/* Open Public Profile */}
                        <a
                          href={profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#232328] transition-colors"
                          title={`Open ${acc.name} on ${acc.platform}`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        {/* Disconnect */}
                        <button
                          type="button"
                          onClick={() => handleDisconnect(acc.id, acc.name)}
                          disabled={disconnectingId === acc.id}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition-colors cursor-pointer"
                          title="Disconnect account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cross-Platform Syndication Capability Matrix */}
          <div className="rounded-2xl border border-[#27272A] bg-gradient-to-b from-[#16161C] to-[#121215] p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Omnichannel Syndication Pipeline
                </h3>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                100% Automated
              </span>
            </div>

            <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
              When triggered, video renders are automatically formatted, captioned, and syndicated across your active social channels simultaneously:
            </p>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="rounded-xl border border-[#26262E] bg-[#191920] p-2.5 flex items-start gap-2">
                <Youtube className="w-3.5 h-3.5 text-red-400 fill-current shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-zinc-200">YouTube Shorts</div>
                  <div className="text-zinc-500 text-[9px] mt-0.5">9:16 Vertical • Auto SEO Tags</div>
                </div>
              </div>

              <div className="rounded-xl border border-[#26262E] bg-[#191920] p-2.5 flex items-start gap-2">
                <Instagram className="w-3.5 h-3.5 text-pink-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-zinc-200">Instagram Reels</div>
                  <div className="text-zinc-500 text-[9px] mt-0.5">Trending Sound • Clustered Tags</div>
                </div>
              </div>

              <div className="rounded-xl border border-[#26262E] bg-[#191920] p-2.5 flex items-start gap-2">
                <Facebook className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-zinc-200">Facebook Reels</div>
                  <div className="text-zinc-500 text-[9px] mt-0.5">Page Auto-Share & Broadcast</div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Statistics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-[#27272A] bg-[#141418] p-3 text-center">
              <div className="text-[10px] text-[#71717A] uppercase font-semibold">Total Audience</div>
              <div className="text-sm font-bold text-white mt-1">
                {totalAudience > 0 ? totalAudience.toLocaleString() : '0'}
              </div>
            </div>
            <div className="rounded-xl border border-[#27272A] bg-[#141418] p-3 text-center">
              <div className="text-[10px] text-[#71717A] uppercase font-semibold">Publishing</div>
              <div className={`text-sm font-bold mt-1 flex items-center justify-center gap-1 ${fleet.length > 0 ? 'text-emerald-400' : 'text-[#9CA3AF]'}`}>
                <Zap className="w-3 h-3" />
                <span>{fleet.length > 0 ? 'Ready' : 'Connect an account'}</span>
              </div>
            </div>
            <div className="rounded-xl border border-[#27272A] bg-[#141418] p-3 text-center">
              <div className="text-[10px] text-[#71717A] uppercase font-semibold">Accounts</div>
              <div className="text-sm font-bold text-indigo-300 mt-1">
                {fleet.length}
              </div>
            </div>
          </div>

          {/* Full Social Accounts page link */}
          <button
            type="button"
            onClick={handleOpenFleetHub}
            className="w-full py-3 px-4 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-indigo-950/40 hover:from-indigo-900/40 hover:to-purple-900/40 text-xs font-semibold text-indigo-200 hover:text-white flex items-center justify-between transition-all cursor-pointer shadow-sm group"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span>Open Social Accounts</span>
            </div>
            <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
          </button>

        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[#242426] bg-[#141418] flex items-center justify-between text-[11px] text-[#71717A]">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>OAuth 2.0 Token Encryption Active</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#222228] hover:bg-[#2A2A32] text-xs font-medium text-white transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

    </div>
  );
};
