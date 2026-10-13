import { useEffect, useState } from 'react';
import { dashboardApi } from '@/src/features/dashboard/api/dashboardApi';
import type { DashboardStats } from '@/src/features/dashboard/types';
import { workspaceApi } from '@/src/features/workspace/api/workspaceApi';
import type { YouTubeChannel, YouTubeVideo } from '@/src/features/youtube/types';

export interface RecentGeneratedScript {
  id: string;
  title: string;
  hook?: string;
  quote: string;
  category?: string;
  generated_at: string;
}

export function useCreatorStudioData() {
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [scripts, setScripts] = useState<RecentGeneratedScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      const [dashboardResult, memoryResult] = await Promise.allSettled([
        dashboardApi.getDashboardData(),
        workspaceApi.getQuoteMemory(),
      ]);
      if (!active) return;

      const errors: string[] = [];
      if (dashboardResult.status === 'fulfilled') {
        setChannels(dashboardResult.value.channels || []);
        setVideos(dashboardResult.value.videos || []);
        setStats(dashboardResult.value.stats || null);
      } else {
        errors.push('Could not load channel, usage, and published video data.');
      }

      if (memoryResult.status === 'fulfilled') {
        setScripts(memoryResult.value.memoryStore || []);
      } else {
        errors.push('Could not load recently generated scripts.');
      }

      setError(errors.length ? `${errors.join(' ')} Try refreshing the page.` : null);
      setLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  return { channels, videos, stats, scripts, loading, error, setChannels };
}
