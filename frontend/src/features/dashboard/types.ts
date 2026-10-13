export type { YouTubeChannel, YouTubeVideo } from '../youtube/types';

export interface DashboardMetrics {
  totalViews: number;
  totalSubscribers: number;
  publishedCount: number;
  uniquenessScore: number;
}

export interface DashboardStats {
  totalShortsGenerated: number;
  totalViews: number;
  totalLikes: number;
  activeChannelsCount: number;
  totalQuotesGenerated: number;
  primaryChannel?: any;
}
