import React from 'react';
import {
  Youtube,
  Users,
  Video,
  ExternalLink,
  Plus,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { YouTubeChannel } from '@/src/features/youtube/types';
import { Button } from '@/src/shared/ui/common';

interface ChannelPulseCardProps {
  channel: YouTubeChannel | null;
  onNavigate: (page: string) => void;
}

export const ChannelPulseCard: React.FC<ChannelPulseCardProps> = ({
  channel,
  onNavigate,
}) => {
  return (
    <div className="rounded-2xl bg-[#141414] border border-[#262626] p-5 sm:p-6 shadow-xl flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#242424] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <Youtube className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                YouTube Channel Pulse
              </h3>
              <p className="text-xs text-[#8E8E93]">
                Connected broadcast channel & stats
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('youtube')}
            className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Channel Studio</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Channel Details or Empty State */}
        {channel ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#181818] border border-[#292929]">
              {channel.avatarUrl ? (
                <img
                  src={channel.avatarUrl}
                  alt={channel.name}
                  className="w-12 h-12 rounded-full border border-[#3A3A3A] object-cover shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 font-bold text-base shrink-0">
                  {channel.name?.slice(0, 2).toUpperCase() || 'YT'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-white truncate">
                    {channel.name}
                  </h4>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
                </div>
                <div className="text-xs text-[#8E8E93] truncate">
                  {channel.handle || '@channel'}
                </div>
                <span className="inline-block text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.2 rounded mt-1">
                  OAuth Verified
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-[#181818] border border-[#242424] text-center">
                <div className="text-xs text-[#7A7A7A] font-semibold mb-1 flex items-center justify-center gap-1">
                  <Users className="w-3 h-3 text-[#60A5FA]" />
                  Subscribers
                </div>
                <div className="text-lg font-extrabold text-white">
                  {typeof channel.subscribers === 'number'
                    ? channel.subscribers.toLocaleString()
                    : channel.subscribers || '—'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#181818] border border-[#242424] text-center">
                <div className="text-xs text-[#7A7A7A] font-semibold mb-1 flex items-center justify-center gap-1">
                  <Video className="w-3 h-3 text-red-400" />
                  Uploads
                </div>
                <div className="text-lg font-extrabold text-white">
                  {channel.videosUploaded || 0}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-[#181818] border border-dashed border-[#2E2E2E] p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
              <Youtube className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white">No YouTube Channel Connected</h4>
              <p className="text-[11px] text-[#7A7A7A]">
                Link your channel via Google OAuth to enable 1-click uploads and analytics tracking.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => onNavigate('youtube')}
              className="text-xs bg-[#202020] hover:bg-[#282828] text-white border-[#333333]"
            >
              Connect Channel
            </Button>
          </div>
        )}
      </div>

      {/* Sub-links */}
      <div className="mt-4 pt-3 border-t border-[#222222] flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => onNavigate('youtube-shorts')}
          className="text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
        >
          Channel Shorts
        </button>
        <span className="text-[#333333]">•</span>
        <button
          type="button"
          onClick={() => onNavigate('youtube-analytics')}
          className="text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
        >
          Analytics
        </button>
        <span className="text-[#333333]">•</span>
        <button
          type="button"
          onClick={() => onNavigate('youtube-schedules')}
          className="text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
        >
          Schedules
        </button>
      </div>
    </div>
  );
};
