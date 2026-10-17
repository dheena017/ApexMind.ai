export interface YouTubeChannel {
  id: string;
  channelId?: string;
  name: string;
  handle: string;
  subscribers: number;
  videosUploaded: number;
  avatarUrl: string;
  bannerUrl?: string;
  verified?: boolean;
  channelUrl?: string;
  description?: string;
  isAutoUploadEnabled?: boolean;
  scheduleCron?: string;
  connectedAt?: string;
  niche?: string;
  isOAuthAuthenticated?: boolean;
  joinedDate?: string;
  country?: string;
  totalLifetimeViews?: number;
  links?: Array<{ title: string; url: string }>;
  source?: string;
}


export interface YouTubeLiveShort {
  id: string;
  title: string;
  views: string | number;
  thumbnailUrl: string;
  videoUrl: string;
  published: string;
  isShort?: boolean;
}

export interface YouTubeLiveVideo {
  id: string;
  title: string;
  duration: string;
  views: string | number;
  published: string;
  publishedAt?: string;
  thumbnailUrl: string;
  videoUrl: string;
  category?: string;
  isShort?: boolean;
  quote?: string;
  status?: string;
  likes?: number;
  voice?: string;
}

// Backwards compatibility alias for older page references
export type YouTubeVideo = YouTubeLiveVideo;

export interface YouTubeForYouItem {
  id: string;
  title: string;
  views: string | number;
  published?: string;
  duration?: string;
  thumbnailUrl: string;
  videoUrl: string;
  isShort?: boolean;
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
  videoCount?: number | string;
  thumbnailUrl: string;
  playlistUrl?: string;
  lastUpdated?: string;
}

export interface YouTubeAnalyticsData {
  channelId: string;
  channelName: string;
  subscribers: number;
  totalVideosUploaded?: number;
  videosUploaded?: number;
  totalViews?: number;
  totalEstimatedViews?: number;
  avgViewsPerVideo?: number;
  averageViewsPerVideo?: number;
  uploadCadence?: string;
  retentionRate?: number;
  engagementRate?: number;
  monthlyProjection?: string;
  topVideo?: YouTubeLiveVideo | null;
  latestUploadDate?: string;
  niches?: Array<{
    name: string;
    percentage: number;
    views: string;
    color: string;
  }>;
  bestPostingWindows?: Array<{
    time: string;
    status: string;
    recommendation: string;
  }>;
}

export interface YouTubeVideoDetails {
  id: string;
  title: string;
  author: string;
  authorUrl: string;
  views: number;
  likes: number;
  description: string;
  tags: string[];
  duration: string;
  thumbnailUrl: string;
  videoUrl: string;
}

export interface YouTubeComment {
  id: string;
  author: string;
  authorAvatar: string;
  text: string;
  likes: number;
  publishedAt: string;
}

export interface YouTubeChapter {
  time: string;
  seconds: number;
  title: string;
}

export interface YouTubeTranscriptSnippet {
  start: number;
  duration: number;
  text: string;
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
