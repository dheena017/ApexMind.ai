export interface YouTubeChannel {
  id: string;
  name: string;
  handle: string;
  subscribers: number;
  videosUploaded: number;
  avatarUrl: string;
  isAutoUploadEnabled: boolean;
  scheduleCron: string;
  connectedAt: string;
  niche: string;
  verified?: boolean;
  channelUrl?: string;
  description?: string;
  bannerUrl?: string;
  isOAuthAuthenticated?: boolean;
  hasRefreshToken?: boolean;
}

export interface YouTubeLookupResult {
  channelId: string;
  name: string;
  handle: string;
  avatarUrl: string;
  bannerUrl?: string;
  subscribers: number;
  videosUploaded: number;
  description: string;
  verified: boolean;
  channelUrl: string;
  source: string;
}

export interface YouTubeLiveShort {
  id: string;
  title: string;
  views: string;
  thumbnailUrl: string;
  videoUrl: string;
  published: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  quote: string;
  views: number;
  likes: number;
  publishedAt: string;
  status: 'published' | 'queued' | 'rendering';
  duration: string;
  channelId: string | null;
  videoUrl: string;
  category: string;
  voice: string;
}

export interface AutomationJob {
  id: string;
  theme: string;
  schedule: string;
  voice: string;
  musicTrack: string;
  active: boolean;
  nextRun: string;
}

export interface YouTubeLiveVideo {
  id: string;
  title: string;
  duration: string;
  views: string;
  published: string;
  thumbnailUrl: string;
  videoUrl: string;
  category?: string;
}

export interface YouTubeForYouItem {
  id: string;
  title: string;
  views: string;
  published?: string;
  duration?: string;
  thumbnailUrl: string;
  videoUrl: string;
  isShort?: boolean;
}

export interface YouTubeLiveFeedResponse {
  channel: YouTubeLookupResult | YouTubeChannel;
  videos: YouTubeLiveVideo[];
  shorts: YouTubeLiveShort[];
  forYou: YouTubeForYouItem[];
}

export interface YouTubeCommunityPost {
  id: string;
  channelId?: string;
  author: string;
  handle: string;
  avatarUrl?: string;
  content: string;
  likes: number;
  comments: number;
  publishedAt: string;
}

export interface YouTubePlaylist {
  id: string;
  title: string;
  description?: string;
  videoCount: number;
  videoCountText?: string;
  thumbnailUrl: string;
  playlistUrl?: string;
  lastUpdated?: string;
}

export interface YouTubeAnalyticsData {
  channelId: string;
  channelName: string;
  subscribers: number;
  videosUploaded: number;
  totalViews: number;
  avgViewsPerVideo: number;
  retentionRate: number;
  engagementRate: number;
  monthlyProjection: string;
  niches: Array<{
    name: string;
    percentage: number;
    views: string;
    color: string;
  }>;
  bestPostingWindows: Array<{
    time: string;
    status: string;
    recommendation: string;
  }>;
}
