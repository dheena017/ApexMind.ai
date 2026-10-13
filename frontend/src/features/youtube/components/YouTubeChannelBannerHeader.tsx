import React, { useState } from 'react';
import {
  ExternalLink,
  Sliders,
  Video,
  CheckCircle2,
  RefreshCw,
  Info,
  Calendar,
  Globe,
  Camera,
  Layers,
} from 'lucide-react';
import { Button, Modal } from '@/src/shared/ui/common';
import { YouTubeChannel } from '../types';

export interface YouTubeChannelBannerHeaderProps {
  channel?: YouTubeChannel | null;
  onCustomiseChannel: () => void;
  onManageVideos: () => void;
  onSyncLive?: () => void;
  syncing?: boolean;
  className?: string;
}

export const YouTubeChannelBannerHeader: React.FC<YouTubeChannelBannerHeaderProps> = ({
  channel,
  onCustomiseChannel,
  onManageVideos,
  onSyncLive,
  syncing = false,
  className = '',
}) => {
  const [showAboutModal, setShowAboutModal] = useState(false);
  const channelName = channel?.name || 'Connected Channel';
  const handle = channel?.handle || '@channel';
  const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(channelName)}&backgroundColor=0284c7,4f46e5,7c3aed`;

  const [bannerImgSrc, setBannerImgSrc] = useState<string>(channel?.bannerUrl || '');
  const [avatarImgSrc, setAvatarImgSrc] = useState<string>(channel?.avatarUrl || defaultAvatar);

  React.useEffect(() => {
    setBannerImgSrc(channel?.bannerUrl || '');
    setAvatarImgSrc(channel?.avatarUrl || defaultAvatar);
  }, [channel?.bannerUrl, channel?.avatarUrl, channelName]);

  const subscribers = (channel?.subscribers ?? 0).toLocaleString();
  const videoCount = (channel?.videosUploaded ?? 0).toLocaleString();
  const niche = channel?.niche || 'Motivational Content';
  const channelUrl = channel?.handle
    ? (channel.handle.startsWith('@')
        ? `https://www.youtube.com/${channel.handle}`
        : `https://www.youtube.com/@${channel.handle}`)
    : 'https://www.youtube.com';

  return (
    <div className={`w-full space-y-3 font-sans-studio ${className}`}>
      {/* ── 1. Wide YouTube Channel Banner ── */}
      <div className="relative w-full h-32 sm:h-44 md:h-52 lg:h-60 rounded-2xl md:rounded-3xl overflow-hidden border border-[#2F2F2F] bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#111827] shadow-2xl group">
        {bannerImgSrc ? (
          <img
            src={bannerImgSrc}
            alt={`${channelName} Banner`}
            onError={() => setBannerImgSrc('')}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.01]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-between px-6 sm:px-12 bg-gradient-to-r from-blue-950/80 via-purple-950/60 to-black/90">
            <div className="space-y-1">
              <span className="text-[10px] sm:text-xs font-bold tracking-widest text-blue-400 uppercase">YouTube Official Creator Feed</span>
              <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">{channelName}</h2>
              <p className="text-xs sm:text-sm text-gray-400">{handle} · Live Studio Hub</p>
            </div>
            <div className="hidden md:flex items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Video className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        )}

        {/* Gradient Overlay for subtle depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Banner Quick Actions (Floating on hover) */}
        <div className="absolute top-3 right-3 flex items-center gap-2 opacity-90 transition-opacity">
          {onSyncLive && (
            <button
              onClick={onSyncLive}
              disabled={syncing}
              title="Sync live subscribers & metrics"
              className="px-2.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 hover:border-[#3B82F6]/50 text-white/90 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#60A5FA] ${syncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Live</span>
            </button>
          )}

          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open on YouTube"
            className="px-2.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 hover:border-red-500/50 text-white/90 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 shadow-lg"
          >
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="hidden sm:inline">Visit Channel</span>
            <ExternalLink className="w-3 h-3 text-[#9CA3AF]" />
          </a>
        </div>
      </div>

      {/* ── 2. Channel Profile Identity Header ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-2 sm:px-4 pt-1">
        {/* Left: Avatar & Channel Details */}
        <div className="flex items-start sm:items-center gap-4 sm:gap-6 min-w-0">
          {/* Channel Avatar (Prominent Circle) */}
          <div className="relative shrink-0 -mt-10 sm:-mt-14 md:-mt-16 z-10">
            <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full p-1 bg-[#121212] shadow-2xl border-2 border-[#2F2F2F]">
              <img
                src={avatarImgSrc}
                alt={channelName}
                onError={() => setAvatarImgSrc(defaultAvatar)}
                className="w-full h-full rounded-full object-cover bg-[#1a1a1a]"
              />
            </div>
            {/* Live Indicator Badge */}
            <span
              className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#121212] flex items-center justify-center shadow-md"
              title="Channel Connected & Verified"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </span>
          </div>

          {/* Details (Name, Stats, Bio) */}
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight truncate">
                {channelName}
              </h1>
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#9CA3AF] shrink-0" title="Verified Creator" />
            </div>

            {/* Subtitle Stats: @handle · 72 subscribers · 11 videos */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-[#9CA3AF]">
              <span className="font-mono-studio text-[#E5E5E5] font-semibold">{handle}</span>
              <span>·</span>
              <span className="text-[#D1D5DB] font-medium">{subscribers} subscribers</span>
              <span>·</span>
              <span className="text-[#D1D5DB] font-medium">{videoCount} videos</span>
            </div>

            {/* Bio / Description line with clickable '...more' */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#9CA3AF] pt-0.5">
              <span className="text-[#9CA3AF]">{niche}</span>
              <button
                type="button"
                onClick={() => setShowAboutModal(true)}
                className="font-bold text-[#E5E5E5] hover:text-[#60A5FA] cursor-pointer transition-colors"
              >
                ...more
              </button>
            </div>
          </div>
        </div>

        {/* Right: Authentic YouTube Action Buttons (Customise channel & Manage videos) */}
        <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto pt-2 md:pt-0">
          <button
            type="button"
            onClick={onCustomiseChannel}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-full bg-[#272727] hover:bg-[#383838] active:bg-[#454545] text-white text-xs sm:text-sm font-semibold transition-all border border-[#3A3A3A] cursor-pointer shadow-sm flex items-center justify-center gap-2"
          >
            <Sliders className="w-3.5 h-3.5 text-[#9CA3AF]" />
            <span>Customise channel</span>
          </button>

          <button
            type="button"
            onClick={onManageVideos}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-full bg-[#272727] hover:bg-[#383838] active:bg-[#454545] text-white text-xs sm:text-sm font-semibold transition-all border border-[#3A3A3A] cursor-pointer shadow-sm flex items-center justify-center gap-2"
          >
            <Video className="w-3.5 h-3.5 text-[#9CA3AF]" />
            <span>Manage videos</span>
          </button>
        </div>
      </div>

      {/* ── About Channel Modal (Triggered by ...more) ── */}
      <Modal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        title="About Channel"
      >
        <div className="space-y-5 text-sm text-[#E5E5E5]">
          {/* Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-[#2F2F2F]">
            <img
              src={avatarImgSrc}
              alt={channelName}
              className="w-12 h-12 rounded-full object-cover border border-[#2F2F2F]"
            />
            <div>
              <h3 className="font-bold text-white text-base">{channelName}</h3>
              <p className="text-xs text-[#9CA3AF] font-mono-studio">{handle}</p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <h4 className="text-xs uppercase tracking-wider font-bold text-[#9CA3AF]">Description</h4>
            <p className="text-xs sm:text-sm text-[#D1D5DB] leading-relaxed bg-[#121212] p-3.5 rounded-xl border border-[#262626]">
              {channel?.description ||
                'Welcome to Emoji Eye Spy! High-engagement anime and visual motivational content channel. Featuring automated daily quotes, mindset lessons, and viral visual shorts.'}
            </p>
          </div>

          {/* Channel Stats Grid */}
          <div className="space-y-1.5">
            <h4 className="text-xs uppercase tracking-wider font-bold text-[#9CA3AF]">Channel Details</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#121212] border border-[#262626]">
                <p className="text-[11px] text-[#9CA3AF]">Subscribers</p>
                <p className="text-sm font-bold text-white font-mono-studio mt-0.5">{subscribers}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#121212] border border-[#262626]">
                <p className="text-[11px] text-[#9CA3AF]">Videos Uploaded</p>
                <p className="text-sm font-bold text-white font-mono-studio mt-0.5">{videoCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#121212] border border-[#262626]">
                <p className="text-[11px] text-[#9CA3AF]">Niche / Focus</p>
                <p className="text-sm font-bold text-[#60A5FA] mt-0.5 capitalize">{niche}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#121212] border border-[#262626]">
                <p className="text-[11px] text-[#9CA3AF]">Auto-Upload Status</p>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">
                  {channel?.isAutoUploadEnabled ? 'Active (Daily)' : 'Paused'}
                </p>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="pt-2 flex justify-between items-center border-t border-[#2F2F2F]">
            <a
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#60A5FA] hover:underline flex items-center gap-1.5"
            >
              <span>{channelUrl}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <Button variant="secondary" size="sm" onClick={() => setShowAboutModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default YouTubeChannelBannerHeader;
