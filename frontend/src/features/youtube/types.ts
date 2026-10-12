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
  channelId: string;
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
