import { YouTubeChannel, YouTubeVideo } from '../types';
import { consoleLogger } from '@/src/shared/utils/logger';

export const dashboardApi = {
  async getDashboardData(): Promise<{
    channels: YouTubeChannel[];
    videos: YouTubeVideo[];
  }> {
    const start = performance.now();
    const res = await fetch('/api/youtube/channels');
    const duration = performance.now() - start;
    consoleLogger.api('GET', '/api/youtube/channels', res.status, duration);
    const data = await res.json();
    consoleLogger.info('Dashboard', `Loaded analytics for ${data.channels?.length || 0} channels, ${data.videos?.length || 0} videos`);
    return { channels: data.channels, videos: data.videos };
  },
};

