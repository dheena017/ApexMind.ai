import React from 'react';
import {
  BarChart3,
  Sparkles,
  Youtube,
  Eye,
  Heart,
  TrendingUp,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { Button } from '@/src/shared/ui/common';
import { useCreatorStudioData } from '../hooks/useCreatorStudioData';
import { RecentStudioActivity } from '../components/RecentStudioActivity';

interface RecentStudioActivityPageProps {
  onNavigate?: (page: string) => void;
}

export default function RecentStudioActivityPage({ onNavigate }: RecentStudioActivityPageProps) {
  const { stats, videos, scripts, channels, loading, error, refresh } = useCreatorStudioData();

  const totalScripts = stats?.totalQuotesGenerated ?? scripts.length;
  const totalShorts = stats?.totalShortsGenerated ?? videos.length;
  const totalViews = stats?.totalViews ?? 0;
  const totalLikes = stats?.totalLikes ?? 0;

  const kpis = [
    {
      label: 'Scripts generated',
      value: totalScripts.toLocaleString(),
      subtext: 'AI script monologues',
      icon: <Sparkles className="h-5 w-5 text-[#60A5FA]" />,
      badgeColor: 'bg-[#3B82F6]/10 border-[#3B82F6]/25',
    },
    {
      label: 'Shorts created',
      value: totalShorts.toLocaleString(),
      subtext: 'Published video assets',
      icon: <Youtube className="h-5 w-5 text-red-400" />,
      badgeColor: 'bg-red-500/10 border-red-500/25',
    },
    {
      label: 'Total YouTube views',
      value: totalViews.toLocaleString(),
      subtext: 'Across all active shorts',
      icon: <Eye className="h-5 w-5 text-purple-400" />,
      badgeColor: 'bg-purple-500/10 border-purple-500/25',
    },
    {
      label: 'Total audience likes',
      value: totalLikes.toLocaleString(),
      subtext: 'Audience engagement',
      icon: <Heart className="h-5 w-5 text-pink-400" />,
      badgeColor: 'bg-pink-500/10 border-pink-500/25',
    },
  ];

  return (
    <div className="w-full space-y-6 font-sans-studio text-[#E5E5E5]">
      {/* ── Page Header Board ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#262626]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/25 text-[#60A5FA]">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Studio Activity &amp; Production</h2>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">
              Track your AI video creation timeline, generated scripts, and YouTube Shorts distribution.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          {refresh && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refresh()}
              icon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
          )}

          {onNavigate && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => onNavigate('workspace')}
              icon={<Plus className="h-3.5 w-3.5" />}
            >
              New Short
            </Button>
          )}
        </div>
      </div>

      {error && <p role="alert" className="text-xs text-amber-300">{error}</p>}

      {/* ── Production Metric KPI Cards ── */}
      <section aria-label="Studio production statistics" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-[#2F2F2F] hover:border-[#3B82F6]/40 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#9CA3AF] tracking-tight">{kpi.label}</span>
              <span className={`rounded-xl border p-2.5 ${kpi.badgeColor}`} aria-hidden="true">
                {kpi.icon}
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono-studio">
                {loading ? '—' : kpi.value}
              </p>
              <p className="mt-1 text-[11px] text-[#6B7280]">{kpi.subtext}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Standalone Recent Studio Activity Component ── */}
      <RecentStudioActivity
        scripts={scripts}
        videos={videos}
        loading={loading}
        error={error}
        showFilters={true}
        showSearch={true}
        title="Recent Studio Activity"
        subtitle="Complete history of your generated script quotes and published YouTube Shorts."
        onNavigate={onNavigate}
      />
    </div>
  );
}
