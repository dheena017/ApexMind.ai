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
} from 'lucide-react';
import { socialApi } from '../api/socialApi';
import { SocialAccount, SocialPlatform } from '../types';
import { Modal, Input, Button } from '@/src/shared/ui/common';

// ── TikTok Brand Icon ──
function TikTokIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.5 6.3 6.3 0 0 0 1.86-4.49V8.69a8.18 8.18 0 0 0 4.91 1.63v-3.63Z" />
    </svg>
  );
}

interface SocialFleetDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SocialFleetDrawer: React.FC<SocialFleetDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [fleet, setFleet] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Manual connect modal state
  const [connectModalPlatform, setConnectModalPlatform] = useState<SocialPlatform | null>(null);
  const [connectHandleInput, setConnectHandleInput] = useState('');
  const [connectNameInput, setConnectNameInput] = useState('');
  const [connecting, setConnecting] = useState(false);

  const loadFleet = async () => {
    setLoading(true);
    try {
      const accounts = await socialApi.getFleetAccounts();
      setFleet(accounts);
    } catch (err: any) {
      setNotice({ text: 'Failed to load social fleet accounts.', type: 'error' });
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

  const handleDisconnect = async (accountId: string, accountName: string) => {
    if (!window.confirm(`Disconnect "${accountName}" from your social fleet?`)) return;

    setDisconnectingId(accountId);
    try {
      await socialApi.disconnectAccount(accountId);
      setFleet((prev) => prev.filter((acc) => acc.id !== accountId));
      setNotice({ text: `Disconnected "${accountName}".`, type: 'info' });
      window.dispatchEvent(new CustomEvent('social:fleet-updated'));
    } catch (err: any) {
      setNotice({ text: err.message || 'Failed to disconnect account.', type: 'error' });
    } finally {
      setDisconnectingId(null);
    }
  };

  // Launch OAuth flow or fallback connect modal
  const handleAddPlatformClick = async (platform: SocialPlatform) => {
    setNotice(null);
    try {
      const oauthUrl = await socialApi.getOAuthUrl(platform);
      if (oauthUrl && !oauthUrl.includes('localhost') && !oauthUrl.includes('demo')) {
        // Open OAuth consent in a popup window
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        window.open(
          oauthUrl,
          `Connect_${platform}`,
          `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=yes`
        );
      } else {
        // Open manual handle connect modal for local/sandbox development
        setConnectModalPlatform(platform);
        setConnectHandleInput('');
        setConnectNameInput('');
      }
    } catch {
      setConnectModalPlatform(platform);
      setConnectHandleInput('');
      setConnectNameInput('');
    }
  };

  const handleManualConnectSubmit = async () => {
    if (!connectModalPlatform) return;
    const cleanHandle = connectHandleInput.trim();
    if (!cleanHandle) {
      setNotice({ text: 'Please enter a handle or channel identifier.', type: 'error' });
      return;
    }

    setConnecting(true);
    try {
      const formattedHandle = cleanHandle.startsWith('@') ? cleanHandle : `@${cleanHandle}`;
      const name = connectNameInput.trim() || cleanHandle.replace('@', '');
      const newAcc = await socialApi.connectAccount(connectModalPlatform, {
        handle: formattedHandle,
        name,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      });

      setFleet((prev) => [newAcc, ...prev]);
      setConnectModalPlatform(null);
      setNotice({ text: `Successfully connected ${newAcc.name}!`, type: 'success' });
      window.dispatchEvent(new CustomEvent('social:fleet-updated'));
    } catch (err: any) {
      setNotice({ text: err.message || 'Failed to connect account.', type: 'error' });
    } finally {
      setConnecting(false);
    }
  };

  if (!isOpen) return null;

  const getPlatformIcon = (platform: SocialPlatform) => {
    switch (platform) {
      case 'youtube':
        return <Youtube className="w-4 h-4 text-red-500 fill-current" />;
      case 'instagram':
        return <Instagram className="w-4 h-4 text-pink-500" />;
      case 'facebook':
        return <Facebook className="w-4 h-4 text-blue-500" />;
      case 'tiktok':
        return <TikTokIcon className="w-4 h-4 text-cyan-400" />;
      default:
        return <Radio className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-[#111114] border-l border-[#27272A] h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#242426] flex items-center justify-between bg-[#141418]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Omnichannel Social Fleet</h2>
              <p className="text-xs text-[#A1A1AA]">Manage connected multi-platform channels & syndication targets</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-[#222226] cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Alert */}
        {notice && (
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

        {/* Add Platform Action Row */}
        <div className="p-5 border-b border-[#242426] space-y-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#71717A]">
            Add Destination to Fleet
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleAddPlatformClick('youtube')}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-red-500/30 bg-red-950/20 hover:bg-red-900/30 text-xs font-semibold text-red-300 hover:text-white transition-all cursor-pointer shadow-xs"
            >
              <Youtube className="w-3.5 h-3.5 text-red-400 fill-current" />
              <span>YouTube</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddPlatformClick('instagram')}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-pink-500/30 bg-pink-950/20 hover:bg-pink-900/30 text-xs font-semibold text-pink-300 hover:text-white transition-all cursor-pointer shadow-xs"
            >
              <Instagram className="w-3.5 h-3.5 text-pink-400" />
              <span>Instagram</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddPlatformClick('facebook')}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-blue-500/30 bg-blue-950/20 hover:bg-blue-900/30 text-xs font-semibold text-blue-300 hover:text-white transition-all cursor-pointer shadow-xs"
            >
              <Facebook className="w-3.5 h-3.5 text-blue-400" />
              <span>Facebook</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddPlatformClick('tiktok')}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-900/30 text-xs font-semibold text-cyan-300 hover:text-white transition-all cursor-pointer shadow-xs"
            >
              <TikTokIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>TikTok</span>
            </button>
          </div>
        </div>

        {/* Fleet Accounts Grid */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#71717A]">
              Connected Platforms ({fleet.length})
            </span>
            <button
              type="button"
              onClick={loadFleet}
              className="text-xs text-[#A1A1AA] hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {fleet.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#2E2E34] p-8 text-center space-y-3">
              <Radio className="w-8 h-8 text-zinc-600 mx-auto" />
              <h3 className="text-sm font-semibold text-white">No Connected Platforms Yet</h3>
              <p className="text-xs text-[#A1A1AA] max-w-xs mx-auto">
                Connect your YouTube channel, Instagram Reels, Facebook Page, or TikTok to syndicate AI videos in one click.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {fleet.map((acc) => (
                <div
                  key={acc.id}
                  className="rounded-xl border border-[#27272A] bg-[#16161A] p-4 flex items-center justify-between gap-3 hover:border-[#3F3F46] transition-colors shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={
                          acc.avatarUrl ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(acc.name)}`
                        }
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border border-[#333338]"
                      />
                      <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-[#111114] border border-[#27272A]">
                        {getPlatformIcon(acc.platform)}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white truncate">{acc.name}</h4>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#202026] text-[#A1A1AA] uppercase border border-[#2F2F38]">
                          {acc.platform}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#A1A1AA] truncate">{acc.handle}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-[#71717A]">
                        <span className="flex items-center gap-1">
                          <Users className="w-2.5 h-2.5" />
                          <span>{acc.followersCount?.toLocaleString() || 0} followers</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Video className="w-2.5 h-2.5" />
                          <span>{acc.postsCount || 0} posts</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDisconnect(acc.id, acc.name)}
                      disabled={disconnectingId === acc.id}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition-colors cursor-pointer"
                      title="Disconnect account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[#242426] bg-[#141418] flex items-center justify-between text-[11px] text-[#71717A]">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>OAuth 2.0 Token Encryption Active</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-[#222228] hover:bg-[#2A2A32] text-xs font-medium text-white transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Manual Handle Connect Modal */}
      <Modal
        isOpen={!!connectModalPlatform}
        onClose={() => setConnectModalPlatform(null)}
        title={`Connect ${connectModalPlatform ? connectModalPlatform.toUpperCase() : ''} Account`}
      >
        <div className="space-y-4">
          <p className="text-xs text-[#A1A1AA]">
            Enter your {connectModalPlatform?.toUpperCase()} handle or username to link it to your omnichannel fleet:
          </p>

          <Input
            label="Account Handle or Username"
            value={connectHandleInput}
            onChange={(e) => setConnectHandleInput(e.target.value)}
            placeholder={
              connectModalPlatform === 'youtube'
                ? '@DailyStoicShorts'
                : connectModalPlatform === 'instagram'
                ? '@dailystoic_reels'
                : connectModalPlatform === 'facebook'
                ? 'Daily Stoic Page'
                : '@dailystoic_ai'
            }
            autoFocus
            required
          />

          <Input
            label="Profile / Display Name (Optional)"
            value={connectNameInput}
            onChange={(e) => setConnectNameInput(e.target.value)}
            placeholder="e.g. Daily Stoic Motivation"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setConnectModalPlatform(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={connecting || !connectHandleInput.trim()}
              onClick={handleManualConnectSubmit}
            >
              {connecting ? 'Connecting...' : `Add to Fleet`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

