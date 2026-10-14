import React from 'react';
import {
  Home,
  Video,
  Film,
  ListVideo,
  MessageSquare,
  TrendingUp,
  Sliders,
  Sparkles,
  Flame,
} from 'lucide-react';

export type YouTubeTab =
  | 'overview'
  | 'videos'
  | 'shorts'
  | 'playlists'
  | 'posts'
  | 'analytics'
  | 'seo'
  | 'trending'
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
  analyticsCount?: number | string;
  currentChannelQuery?: string;
  onSearchChannel?: (query: string) => void;
  className?: string;
}

export const YouTubeHeader: React.FC<YouTubeHeaderProps> = ({
  activeTab,
  onTabChange,
  videosCount,
  shortsCount,
  playlistsCount,
  postsCount,
  className = '',
}) => {
  const tabs: { id: YouTubeTab; label: string; badge?: number | string }[] = [
    {
      id: 'overview',
      label: 'Home',
    },
    {
      id: 'videos',
      label: 'Videos',
      badge: videosCount !== undefined ? videosCount : undefined,
    },
    {
      id: 'shorts',
      label: 'Shorts',
      badge: shortsCount !== undefined ? shortsCount : undefined,
    },
    {
      id: 'playlists',
      label: 'Playlists',
      badge: playlistsCount !== undefined ? playlistsCount : undefined,
    },
    {
      id: 'posts',
      label: 'Community',
      badge: postsCount !== undefined ? postsCount : undefined,
    },
    {
      id: 'analytics',
      label: 'Analytics',
    },
    {
      id: 'seo',
      label: 'SEO & Tags',
    },
    {
      id: 'trending',
      label: 'Trending',
    },
    {
      id: 'settings',
      label: 'Settings',
    },
  ];

  const renderIcon = (id: YouTubeTab, isActive: boolean) => {
    const iconClass = `w-4 h-4 shrink-0 transition-colors ${
      isActive ? 'text-gray-950' : 'transition-transform group-hover:scale-110'
    }`;

    switch (id) {
      case 'overview':
        return <Home className={iconClass} />;
      case 'videos':
        return <Video className={iconClass} />;
      case 'shorts':
        return <Film className={`${iconClass} ${!isActive ? 'text-red-500' : ''}`} />;
      case 'playlists':
        return <ListVideo className={iconClass} />;
      case 'posts':
        return <MessageSquare className={iconClass} />;
      case 'analytics':
        return <TrendingUp className={`${iconClass} ${!isActive ? 'text-emerald-400' : ''}`} />;
      case 'seo':
        return <Sparkles className={`${iconClass} ${!isActive ? 'text-amber-400' : ''}`} />;
      case 'trending':
        return <Flame className={`${iconClass} ${!isActive ? 'text-orange-500' : ''}`} />;
      case 'settings':
        return <Sliders className={iconClass} />;
    }
  };

  return (
    <header
      className={`relative z-10 w-full rounded-2xl border border-[#262626] bg-[#0E0E0E] px-3 sm:px-6 py-2.5 transition-all shadow-md ${className}`}
    >
      <nav
        aria-label="YouTube Studio sub-navigation"
        className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const hasCount = tab.badge !== undefined;
          const countNum = Number(tab.badge);
          const isNonZero = !isNaN(countNum) && countNum > 0;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer select-none ${
                isActive
                  ? 'bg-white text-gray-950 font-bold shadow-md shadow-white/10 scale-[1.02]'
                  : 'bg-[#141414] text-[#A1A1AA] hover:text-white hover:bg-[#202020] border border-[#262626] hover:border-[#383838] active:scale-95'
              }`}
            >
              <span>{renderIcon(tab.id, isActive)}</span>
              <span>{tab.label}</span>
              {hasCount && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-mono-studio font-bold leading-none transition-colors ${
                    isActive
                      ? 'bg-black/10 text-gray-950'
                      : isNonZero
                      ? 'bg-[#242424] text-white border border-white/10 group-hover:bg-[#2E2E2E]'
                      : 'bg-[#1A1A1A] text-[#6B7280]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};

export default YouTubeHeader;
