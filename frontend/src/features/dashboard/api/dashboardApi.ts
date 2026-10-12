import { YouTubeChannel, YouTubeVideo, DashboardStats } from '../types';
import { consoleLogger } from '@/src/shared/utils/logger';

export const dashboardApi = {
  async getDashboardData(): Promise<{
    channels: YouTubeChannel[];
    videos: YouTubeVideo[];
    stats?: DashboardStats;
  }> {
    const start = performance.now();
    const [channelsRes, statsRes] = await Promise.all([
      fetch('/api/youtube/channels'),
      fetch('/api/dashboard/stats').catch(() => null),
    ]);
    const duration = performance.now() - start;
    consoleLogger.api('GET', '/api/youtube/channels', channelsRes.status, duration);
    const channelsData = await channelsRes.json();
    let stats: DashboardStats | undefined;
    if (statsRes && statsRes.ok) {
      stats = await statsRes.json();
    }
    consoleLogger.info('Dashboard', `Loaded analytics for ${channelsData.channels?.length || 0} channels, ${channelsData.videos?.length || 0} videos`);
    return {
      channels: channelsData.channels || [],
      videos: channelsData.videos || [],
      stats,
    };
  },
};


