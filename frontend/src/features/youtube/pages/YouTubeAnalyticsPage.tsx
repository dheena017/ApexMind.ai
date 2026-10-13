import React from 'react';
import { Eye, BarChart3, ThumbsUp, Flame, TrendingUp } from 'lucide-react';
import { Card, Badge } from '@/src/shared/ui/common';
import { YouTubeVideo, YouTubeChannel } from '../types';

export interface YouTubeAnalyticsPageProps {
  videos: YouTubeVideo[];
  channels: YouTubeChannel[];
}

export const YouTubeAnalyticsPage: React.FC<YouTubeAnalyticsPageProps> = ({
  videos,
}) => {
  const totalViews = videos.reduce((acc, v) => acc + v.views, 0);

  return (
    <div className="space-y-6 animate-fade-in font-sans-studio text-[#E5E5E5]">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2F2F2F] shadow-sm">
          <div className="flex items-center justify-between text-[#9CA3AF]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Shorts Views</span>
            <Eye className="w-4 h-4 text-[#60A5FA]" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-2 font-mono-studio">
            {totalViews.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>+18.4% this week</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2F2F2F] shadow-sm">
          <div className="flex items-center justify-between text-[#9CA3AF]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Avg. Retention Rate</span>
            <BarChart3 className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-2 font-mono-studio">86.2%</p>
          <p className="text-[11px] text-[#C084FC] font-medium mt-1">High loop completion</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2F2F2F] shadow-sm">
          <div className="flex items-center justify-between text-[#9CA3AF]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Engagement Rate</span>
            <ThumbsUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-2 font-mono-studio">12.8%</p>
          <p className="text-[11px] text-emerald-400 font-medium mt-1">Above channel benchmark</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2F2F2F] shadow-sm">
          <div className="flex items-center justify-between text-[#9CA3AF]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Monthly Projection</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-2 font-mono-studio">+1,420</p>
          <p className="text-[11px] text-amber-300 font-medium mt-1">Projected subscribers</p>
        </div>
      </div>

      {/* Niche Category Engagement breakdown */}
      <Card className="bg-[#141414] border-[#2F2F2F] p-6 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#262626] mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Performance by Motivational Niche</h3>
            <p className="text-xs text-[#9CA3AF]">Relative distribution of viewers and retention across quote categories</p>
          </div>
          <Badge variant="blue">Realtime Breakdown</Badge>
        </div>

        <div className="space-y-3.5">
          {[
            { name: 'Stoic Mindset & Discipline', percentage: 44, views: '14,200', color: 'bg-[#3B82F6]' },
            { name: 'Morning Energy & Grit', percentage: 28, views: '8,950', color: 'bg-emerald-500' },
            { name: 'Fitness & Power', percentage: 16, views: '5,120', color: 'bg-amber-500' },
            { name: 'Financial Freedom', percentage: 12, views: '3,840', color: 'bg-purple-500' },
          ].map((niche) => (
            <div key={niche.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">{niche.name}</span>
                <span className="font-mono-studio text-[#9CA3AF]">
                  {niche.views} views ({niche.percentage}%)
                </span>
              </div>
              <div className="h-2 w-full bg-[#1F1F1F] rounded-full overflow-hidden">
                <div
                  className={`h-full ${niche.color} rounded-full transition-all duration-500`}
                  style={{ width: `${niche.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Algorithmic Posting Windows */}
      <Card className="bg-[#141414] border-[#2F2F2F] p-6 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#262626] mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Recommended Posting Windows</h3>
            <p className="text-xs text-[#9CA3AF]">Optimal upload times to maximize the YouTube Shorts shelf distribution</p>
          </div>
          <Badge variant="green">Optimal Audience Timing</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-[#121212] border border-[#2F2F2F] space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Morning Spike</span>
            <p className="text-sm font-extrabold text-white font-mono-studio">06:30 AM – 08:30 AM EST</p>
            <p className="text-[11px] text-[#9CA3AF]">Highest engagement for morning discipline quotes</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#121212] border border-[#2F2F2F] space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#60A5FA] tracking-wider">Midday Boost</span>
            <p className="text-sm font-extrabold text-white font-mono-studio">12:00 PM – 01:30 PM EST</p>
            <p className="text-[11px] text-[#9CA3AF]">High click-through for midday focus resets</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#121212] border border-[#2F2F2F] space-y-1">
            <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Evening Prime</span>
            <p className="text-sm font-extrabold text-white font-mono-studio">06:00 PM – 08:30 PM EST</p>
            <p className="text-[11px] text-[#9CA3AF]">Peak Shorts feed velocity and comment interactions</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default YouTubeAnalyticsPage;
