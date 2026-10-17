import React from 'react';
import {
  Sparkles,
  Wand2,
  FileText,
  RefreshCw,
  Film,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/src/shared/ui/common';
import { useAuth } from '@/src/features/auth/context/AuthContext';

interface DashboardHeaderBannerProps {
  onNavigate: (page: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

export const DashboardHeaderBanner: React.FC<DashboardHeaderBannerProps> = ({
  onNavigate,
  onRefresh,
  loading,
}) => {
  const { user } = useAuth();

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#141414] via-[#121212] to-[#0D1526] border border-[#2F2F2F] p-5 sm:p-7 shadow-2xl">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#3B82F6]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-[#2563EB]/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: User greeting and inspirational title */}
        <div className="space-y-2.5 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-full bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#60A5FA]" />
              AI Motivational Studio
            </span>
            <span className="text-[#737373] hidden sm:inline">•</span>
            <span className="text-[#8E8E93]">{currentDate}</span>
            <span className="text-[#737373] hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Gemini 2.5 Active
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Welcome back,{' '}
            <span className="text-gradient-brand">
              {user?.name || 'Creator'}
            </span>
          </h1>

          <p className="text-sm text-[#9CA3AF] leading-relaxed max-w-xl">
            Create high-converting YouTube Shorts, generate viral Stoic monologues, synthesize lifelike voiceovers, and scale your channel from a single command center.
          </p>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            className="border-[#333333] hover:border-[#4A4A4A] bg-[#171717]"
            title="Refresh dashboard metrics"
          >
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </Button>

          <Button
            variant="secondary"
            size="md"
            icon={<Film className="w-4 h-4 text-[#60A5FA]" />}
            onClick={() => onNavigate('videos')}
            className="bg-[#181818] border-[#2F2F2F] hover:bg-[#202020] text-white"
          >
            My Videos
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={<Wand2 className="w-4 h-4" />}
            onClick={() => onNavigate('workspace')}
            className="shadow-lg shadow-[#3B82F6]/25 font-bold"
          >
            Launch AI Studio
          </Button>
        </div>
      </div>
    </div>
  );
};
