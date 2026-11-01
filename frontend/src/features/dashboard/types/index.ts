import { WebsiteVideo } from '@/src/features/videos/types';
import { YouTubeChannel } from '@/src/features/youtube/types';

export interface DashboardMetrics {
  totalVideos: number;
  totalScripts: number;
  totalViews: number;
  totalLikes: number;
  connectedChannelsCount: number;
  unreadNotificationsCount: number;
}

export interface GeminiModelQuota {
  name: string;
  category: string;
  rpmLimit: number;
  rpdLimit: number;
  tpmLimit: string;
  rps: string;
  status: string;
  description?: string;
}

export interface GeminiRateLimitsSummary {
  activeModel: string;
  currentRpm: number;
  limitRpm: number;
  currentRpd: number;
  limitRpd: number;
  currentTpm: number;
  limitTpm: number;
  usagePercentRpm: number;
  statusLevel: 'healthy' | 'warning' | 'critical' | 'exceeded';
  secondsToWindowReset: number;
  effectiveRps: number;
  totalRequests: number;
  tier: string;
  models: GeminiModelQuota[];
}

export interface SystemStatusSummary {
  database: string;
  geminiAi: string;
  cachedAudioCount: number;
  serverUptimeFormatted: string;
  geminiRateLimits?: GeminiRateLimitsSummary;
}

export interface TrendingPromptIdea {
  id: string;
  title: string;
  category: string;
  hook: string;
  topic: string;
  estimatedDuration: string;
}

export interface RecentScriptItem {
  id: string;
  title: string;
  hook?: string;
  quote: string;
  category?: string;
  generated_at: string;
}

export interface DashboardNotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type?: string;
  category?: string;
  action_url?: string;
}

export interface DashboardSummaryData {
  success: boolean;
  metrics: DashboardMetrics;
  recentVideos: WebsiteVideo[];
  recentScripts: RecentScriptItem[];
  activeChannel: YouTubeChannel | null;
  systemStatus: SystemStatusSummary;
  categories: string[];
  trendingPrompts: TrendingPromptIdea[];
  recentNotifications: DashboardNotificationItem[];
}
