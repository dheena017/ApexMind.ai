import React from 'react';
import {
  Film,
  Sparkles,
  Eye,
  Heart,
  Youtube,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { DashboardMetrics } from '../types';

interface DashboardStatsGridProps {
  metrics: DashboardMetrics;
  onNavigate: (page: string) => void;
}

export const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({
  metrics,
  onNavigate,
}) => {
  const statCards = [
    {
      id: 'videos',
      label: 'Studio Videos',
      value: metrics.totalVideos.toLocaleString(),
      subtext: 'Rendered & library assets',
      icon: Film,
      iconColor: 'text-[#60A5FA]',
      bgColor: 'bg-[#3B82F6]/10',
      borderColor: 'border-[#3B82F6]/25',
      glowColor: 'hover:border-[#3B82F6]/60',
      actionPage: 'videos',
      actionLabel: 'View Library',
    },
    {
      id: 'scripts',
      label: 'AI Scripts in Memory',
      value: metrics.totalScripts.toLocaleString(),
      subtext: 'Non-repeating monologues',
      icon: Sparkles,
      iconColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/25',
      glowColor: 'hover:border-amber-500/60',
      actionPage: 'workspace-script',
      actionLabel: 'Script Studio',
    },
    {
      id: 'views',
      label: 'Audience Views',
      value: metrics.totalViews.toLocaleString(),
      subtext: 'Across generated videos',
      icon: Eye,
      iconColor: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/25',
      glowColor: 'hover:border-purple-500/60',
      actionPage: 'youtube-analytics',
      actionLabel: 'Analytics',
    },
    {
      id: 'likes',
      label: 'Audience Likes',
      value: metrics.totalLikes.toLocaleString(),
      subtext: 'Viewer endorsements',
      icon: Heart,
      iconColor: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/25',
      glowColor: 'hover:border-rose-500/60',
      actionPage: 'youtube',
      actionLabel: 'Engagement',
    },
    {
      id: 'channels',
      label: 'YouTube Channels',
      value: metrics.connectedChannelsCount.toString(),
      subtext: metrics.connectedChannelsCount > 0 ? 'Active channel linked' : 'No channel linked',
      icon: Youtube,
      iconColor: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/25',
      glowColor: 'hover:border-red-500/60',
      actionPage: 'youtube',
      actionLabel: 'Manage',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.id}
            onClick={() => onNavigate(stat.actionPage)}
            className={`group relative overflow-hidden rounded-2xl bg-[#141414] border border-[#262626] p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer ${stat.glowColor}`}
          >
            {/* Top row: Icon & Action Link */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${stat.bgColor} ${stat.borderColor}`}
              >
                <Icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <span className="flex items-center gap-0.5 text-[11px] font-semibold text-[#8E8E93] group-hover:text-white transition-colors">
                {stat.actionLabel}
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
              </span>
            </div>

            {/* Middle: Number */}
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {stat.value}
              </div>
              <div className="text-xs font-bold text-[#CCCCCC]">
                {stat.label}
              </div>
            </div>

            {/* Bottom: Subtext */}
            <div className="mt-2.5 pt-2 border-t border-[#222222] flex items-center justify-between text-[11px] text-[#7A7A7A]">
              <span>{stat.subtext}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
