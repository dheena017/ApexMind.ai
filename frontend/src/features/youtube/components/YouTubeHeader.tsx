import React from 'react';
import {
  RefreshCw,
  Plus,
  Home,
  Video,
  Film,
  ListVideo,
  MessageSquare,
  Clock,
  TrendingUp,
  Sliders,
} from 'lucide-react';
import { Button } from '@/src/shared/ui/common';

export type YouTubeTab =
  | 'overview'
  | 'videos'
  | 'shorts'
  | 'playlists'
  | 'posts'
  | 'schedules'
  | 'analytics'
  | 'settings';

export interface YouTubeHeaderProps {
  loading: boolean;
  onSyncLive: () => void;
  channelsCount: number;
  onConnectChannel?: () => void;
  activeTab: YouTubeTab;
  onTabChange: (tab: YouTubeTab) => void;
  videosCount?: number | string;
  shortsCount?: number | string;
  playlistsCount?: number | string;
  postsCount?: number | string;
  schedulesCount?: number | string;
  analyticsCount?: number | string;
  className?: string;
}

export const YouTubeHeader: React.FC<YouTubeHeaderProps> = ({
  loading,
  onSyncLive,
  channelsCount,
  onConnectChannel,
  activeTab,
  onTabChange,
  videosCount,
  shortsCount,
  playlistsCount,
  postsCount,
  schedulesCount,
  analyticsCount,
  className = '',
}) => {
  const tabs: { id: YouTubeTab; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    {
      id: 'overview',
      label: 'Home',
      icon: <Home className="w-3.5 h-3.5" />,
    },
    {
      id: 'videos',
      label: 'Videos',
      icon: <Video className="w-3.5 h-3.5" />,
      badge: videosCount !== undefined ? videosCount : undefined,
    },
    {
      id: 'shorts',
      label: 'Shorts',
      icon: <Film className="w-3.5 h-3.5" />,
      badge: shortsCount !== undefined ? shortsCount : undefined,
    },
    {
      id: 'playlists',
      label: 'Playlists',
      icon: <ListVideo className="w-3.5 h-3.5" />,
      badge: playlistsCount !== undefined ? playlistsCount : undefined,
    },
    {
      id: 'posts',
      label: 'Posts',
      icon: <MessageSquare className="w-3.5 h-3.5" />,
      badge: postsCount !== undefined ? postsCount : undefined,
    },
    {
      id: 'schedules',
      label: 'Schedules',
      icon: <Clock className="w-3.5 h-3.5" />,
      badge: schedulesCount !== undefined ? schedulesCount : undefined,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      badge: analyticsCount !== undefined ? analyticsCount : undefined,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Sliders className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <header
      className={`w-full bg-[#141414] border border-[#2F2F2F] rounded-2xl p-2.5 sm:p-3 shadow-xl shadow-black/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${className}`}
    >
      {/* Nav Tabs */}
      <nav className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar" aria-label="YouTube sub-pages">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-[#3B82F6]/15 border border-[#3B82F6]/40 text-[#60A5FA] shadow-xs'
                  : 'text-[#9CA3AF] hover:text-white hover:bg-[#1E1E1E] border border-transparent'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono-studio font-semibold leading-none ${
                    isActive
                      ? 'bg-[#3B82F6]/25 text-[#93C5FD]'
                      : 'bg-[#262626] text-[#9CA3AF]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          onClick={onSyncLive}
          title="Fetch latest subscriber count, view stats, and published Shorts"
          className="hover:border-[#3B82F6]/50 transition-colors text-xs"
        >
          Sync Live
        </Button>

        {channelsCount === 0 && onConnectChannel && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={onConnectChannel}
            className="text-xs"
          >
            Connect Channel
          </Button>
        )}
      </div>
    </header>
  );
};

export default YouTubeHeader;
