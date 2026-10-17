import React from 'react';
import {
  Sparkles,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { DashboardHeaderBanner } from '../components/DashboardHeaderBanner';
import { DashboardStatsGrid } from '../components/DashboardStatsGrid';
import { QuickActionsBar } from '../components/QuickActionsBar';
import { QuickPromptSpark } from '../components/QuickPromptSpark';
import { RecentVideosSection } from '../components/RecentVideosSection';
import { RecentScriptsSection } from '../components/RecentScriptsSection';
import { ChannelPulseCard } from '../components/ChannelPulseCard';
import { SystemHealthWidget } from '../components/SystemHealthWidget';
import { Button } from '@/src/shared/ui/common';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { data, loading, error, refresh } = useDashboardData();

  if (loading && !data) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] flex items-center justify-center animate-pulse">
          <Sparkles className="w-6 h-6 text-[#60A5FA] animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <div className="text-sm font-bold text-white">Loading Creator Dashboard...</div>
          <div className="text-xs text-[#8E8E93]">Syncing studio videos, AI memory, and channel metrics</div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="w-full min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-md">
          <h2 className="text-base font-bold text-white">Unable to load dashboard</h2>
          <p className="text-xs text-[#9CA3AF]">{error}</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={refresh}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Fallback state if empty
  const metrics = data?.metrics || {
    totalVideos: 0,
    totalScripts: 0,
    totalViews: 0,
    totalLikes: 0,
    connectedChannelsCount: 0,
    unreadNotificationsCount: 0,
  };

  const recentVideos = data?.recentVideos || [];
  const recentScripts = data?.recentScripts || [];
  const activeChannel = data?.activeChannel || null;
  const systemStatus = data?.systemStatus || {
    database: 'connected',
    geminiAi: 'ready',
    cachedAudioCount: 0,
    serverUptimeFormatted: '0h 0m 0s',
  };
  const categories = data?.categories || [];
  const trendingPrompts = data?.trendingPrompts || [];

  return (
    <div className="w-full space-y-6 sm:space-y-8 font-sans-studio text-[#E5E5E5] pb-10">
      {/* 1. Executive Welcome Banner */}
      <DashboardHeaderBanner
        onNavigate={onNavigate}
        onRefresh={refresh}
        loading={loading}
      />

      {/* 2. Quick Action Shortcuts */}
      <QuickActionsBar onNavigate={onNavigate} />

      {/* 3. Core KPI Metrics Cards */}
      <DashboardStatsGrid
        metrics={metrics}
        onNavigate={onNavigate}
      />

      {/* 4. AI Script Spark / Quick Launch */}
      <QuickPromptSpark
        categories={categories}
        trendingPrompts={trendingPrompts}
        onNavigate={onNavigate}
      />

      {/* 5. Production Feed & Sidebars Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column (2 cols on large screen): Video Productions & Script History */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8 min-w-0">
          <RecentVideosSection
            videos={recentVideos}
            onNavigate={onNavigate}
          />

          <RecentScriptsSection
            scripts={recentScripts}
            onNavigate={onNavigate}
          />
        </div>

        {/* Right Column (1 col): Channel Pulse & Diagnostics */}
        <div className="space-y-6 sm:space-y-8 min-w-0">
          <ChannelPulseCard
            channel={activeChannel}
            onNavigate={onNavigate}
          />

          <SystemHealthWidget
            systemStatus={systemStatus}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </div>
  );
}
