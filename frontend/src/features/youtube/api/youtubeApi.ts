import {
  YouTubeChannel,
  YouTubeVideo,
  AutomationJob,
  YouTubeLookupResult,
  YouTubeLiveShort,
  YouTubeLiveVideo,
  YouTubeLiveFeedResponse,
  YouTubeCommunityPost,
  YouTubePlaylist,
  YouTubeAnalyticsData,
  YouTubeVideoDetails,
  YouTubeComment,
  YouTubeChapter,
} from '../types';
import { consoleLogger } from '@/src/shared/utils/logger';
import { apiUrl } from '@/src/shared/utils/api';

const getStoredHandle = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('apexmind_yt_active_channel')?.trim() || '';
  }
  return '';
};

export const youtubeApi = {
  // ── Standardized Live RESTful Endpoints ────────────────────────────────────

  // 1. Channel Details
  async getChannelDetails(query?: string): Promise<YouTubeChannel> {
    const target = (query || getStoredHandle()).trim();
    if (!target) throw new Error('No channel specified or connected');
    const res = await fetch(apiUrl(`/api/youtube/channel/details?query=${encodeURIComponent(target)}`));
    if (!res.ok) throw new Error(`Channel details failed: ${res.status}`);
    const data = await res.json();
    return data.channel;
  },

  // 2. Channel About Info (Merged into Channel Details)
  async getChannelAbout(query?: string): Promise<any> {
    return this.getChannelDetails(query);
  },

  // 3. Channel Videos (16:9 Long-Form)
  async getChannelVideos(query?: string, limit = 24): Promise<YouTubeLiveVideo[]> {
    const target = (query || getStoredHandle()).trim();
    if (!target) return [];
    const res = await fetch(apiUrl(`/api/youtube/channel/videos?query=${encodeURIComponent(target)}&limit=${limit}`));
    if (!res.ok) return [];
    const data = await res.json();
    return data.videos || [];
  },

  // 4. Sorted Videos (popular, latest, oldest)
  async getChannelVideosSorted(query?: string, sort = 'popular', limit = 24): Promise<YouTubeLiveVideo[]> {
    const target = (query || getStoredHandle()).trim();
    if (!target) return [];
    const res = await fetch(apiUrl(`/api/youtube/channel/videos/sorted?handle=${encodeURIComponent(target)}&sort=${sort}&limit=${limit}`));
    if (!res.ok) return [];
    const data = await res.json();
    return data.videos || [];
  },

  // 5. Channel Shorts (9:16 Vertical)
  async getChannelShorts(query?: string, limit = 24): Promise<YouTubeLiveShort[]> {
    const target = (query || getStoredHandle()).trim();
    if (!target) return [];
    const res = await fetch(apiUrl(`/api/youtube/channel/shorts?query=${encodeURIComponent(target)}&limit=${limit}`));
    if (!res.ok) return [];
    const data = await res.json();
    return data.shorts || [];
  },

  // 6. Channel Playlists
  async getPlaylists(query?: string): Promise<YouTubePlaylist[]> {
    const target = (query || getStoredHandle()).trim();
    if (!target) return [];
    const res = await fetch(apiUrl(`/api/youtube/channel/playlists?handle=${encodeURIComponent(target)}`));
    if (!res.ok) return [];
    const data = await res.json();
    return data.playlists || [];
  },

  // 7. Channel Analytics (Computed directly from real videos)
  async getChannelAnalytics(query?: string): Promise<YouTubeAnalyticsData | null> {
    const target = (query || getStoredHandle()).trim();
    if (!target) return null;
    const res = await fetch(apiUrl(`/api/youtube/channel/analytics?handle=${encodeURIComponent(target)}`));
    if (!res.ok) return null;
    const data = await res.json();
    return data.analytics || null;
  },

  // 8. Deep Video Details
  async getVideoDetails(videoId: string): Promise<YouTubeVideoDetails | null> {
    const res = await fetch(apiUrl(`/api/youtube/video/details?video_id=${encodeURIComponent(videoId)}`));
    if (!res.ok) return null;
    const data = await res.json();
    return data.video || null;
  },

  // 9. Video Chapters
  async getVideoChapters(videoId: string): Promise<YouTubeChapter[]> {
    const res = await fetch(apiUrl(`/api/youtube/video/chapters?video_id=${encodeURIComponent(videoId)}`));
    if (!res.ok) return [];
    const data = await res.json();
    return data.chapters || [];
  },

  // 10. Video Comments
  async getVideoComments(videoId: string, limit = 20): Promise<YouTubeComment[]> {
    const res = await fetch(apiUrl(`/api/youtube/video/comments?video_id=${encodeURIComponent(videoId)}&limit=${limit}`));
    if (!res.ok) return [];
    const data = await res.json();
    return data.comments || [];
  },

  // 11. Search Autocomplete (Removed)
  async getSearchSuggestions(_query: string): Promise<string[]> {
    return [];
  },

  // 12. Competitor Tag Inspector
  async getVideoTags(videoId: string): Promise<string[]> {
    const res = await fetch(apiUrl(`/api/youtube/seo/tags?video_id=${encodeURIComponent(videoId)}`));
    if (!res.ok) return [];
    const data = await res.json();
    return data.tags || [];
  },

  // 13. Search Channels (Removed)
  async searchChannels(_query: string, _limit = 10): Promise<any[]> {
    return [];
  },

  // 14. Search Videos
  async searchVideos(query: string, type: 'video' | 'short' = 'video', limit = 15): Promise<YouTubeLiveVideo[]> {
    const res = await fetch(apiUrl(`/api/youtube/search/videos?query=${encodeURIComponent(query)}&type=${type}&limit=${limit}`));
    if (!res.ok) return [];
    const data = await res.json();
    return data.videos || [];
  },

  // 15. Trending Shorts (Derived via searchVideos)
  async getTrendingShorts(limit = 15): Promise<YouTubeLiveShort[]> {
    const videos = await this.searchVideos('shorts', 'short', limit);
    return videos.map((v) => ({
      id: v.id,
      title: v.title,
      views: v.views,
      thumbnailUrl: v.thumbnailUrl,
      videoUrl: v.videoUrl,
      published: v.published || 'Trending on YouTube',
      isShort: true,
    }));
  },

  // ── Action / Mutation Operations ──────────────────────────────────────────

  // Direct Live Video Upload to YouTube (Zero DB storage)
  async uploadVideoToYouTube(formData: FormData): Promise<any> {
    const res = await fetch(apiUrl('/api/youtube/video/upload'), {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Failed to upload video to YouTube');
    }
    return res.json();
  },

  // Update video metadata on YouTube
  async updateVideoMetadata(payload: { videoId: string; title?: string; description?: string; tags?: string[]; privacyStatus?: string }): Promise<any> {
    const res = await fetch(apiUrl('/api/youtube/video/update'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Delete video permanently from YouTube
  async deleteVideoFromYouTube(videoId: string): Promise<any> {
    const res = await fetch(apiUrl('/api/youtube/video/delete'), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId }),
    });
    return res.json();
  },

  // Create playlist on YouTube
  async createPlaylist(payload: { title: string; description?: string; privacyStatus?: string }): Promise<any> {
    const res = await fetch(apiUrl('/api/youtube/playlist/create'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Delete playlist on YouTube
  async deletePlaylist(playlistId: string): Promise<any> {
    const res = await fetch(apiUrl('/api/youtube/playlist/delete'), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playlistId }),
    });
    return res.json();
  },

  // Reply to comment on YouTube
  async replyToComment(payload: { videoId: string; text: string; parentId?: string }): Promise<any> {
    const res = await fetch(apiUrl('/api/youtube/video/comments/reply'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // ── YouTube Channel Connection ─────────────────────────────────────────────

  async connectWithToken(accessToken: string): Promise<{ success: boolean; channel: YouTubeChannel; message: string }> {
    const res = await fetch(apiUrl('/api/youtube/connect'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to connect channel with Google token' }));
      throw new Error(err.detail || 'Failed to connect channel with Google token');
    }
    return res.json();
  },

  async getAuthStatus(): Promise<{ success: boolean; connected: boolean; channel?: any }> {
    const res = await fetch(apiUrl('/api/youtube/status'));
    if (!res.ok) return { success: false, connected: false };
    const data = await res.json();
    return { success: true, connected: Boolean(data.connected || data.isAuthorized), channel: data.channel };
  },

  async disconnectOAuth(): Promise<boolean> {
    const res = await fetch(apiUrl('/api/youtube/disconnect'), { method: 'POST' });
    return res.ok;
  },

  async disconnectChannel(_channelId?: string): Promise<boolean> {
    return this.disconnectOAuth();
  },

  // ── Backward Compatible Wrappers for Existing Studio Views ────────────────

  async getYouTubeData(handle?: string): Promise<{ channels: YouTubeChannel[]; videos: YouTubeLiveVideo[] }> {
    const target = (handle || getStoredHandle()).trim();
    if (!target) return { channels: [], videos: [] };
    try {
      const channel = await this.getChannelDetails(target);
      const videos = await this.getChannelVideos(target, 24);
      return { channels: [channel], videos };
    } catch {
      return { channels: [], videos: [] };
    }
  },

  async lookupChannel(query: string): Promise<YouTubeLookupResult> {
    const ch = await this.getChannelDetails(query);
    return {
      channelId: ch.id,
      name: ch.name,
      handle: ch.handle,
      avatarUrl: ch.avatarUrl,
      bannerUrl: ch.bannerUrl,
      subscribers: ch.subscribers,
      videosUploaded: ch.videosUploaded,
      description: ch.description || '',
      verified: Boolean(ch.verified),
      channelUrl: ch.channelUrl || `https://www.youtube.com/${ch.handle}`,
      source: 'youtube-official-live',
    };
  },

  async connectYouTubeChannel(payload: { handle: string; channelName?: string }): Promise<YouTubeChannel> {
    return this.getChannelDetails(payload.handle);
  },

  async connectChannel(payload: {
    handle?: string;
    channelName?: string;
    avatarUrl?: string;
    subscribers?: number;
    videosUploaded?: number;
    niche?: string;
  }): Promise<YouTubeChannel> {
    const handleToQuery = (payload.handle || payload.channelName || getStoredHandle()).trim();
    if (!handleToQuery) throw new Error('Channel handle is required to connect.');
    return this.getChannelDetails(handleToQuery);
  },

  async syncChannel(channelIdOrHandle: string): Promise<{ channel: YouTubeChannel; message: string }> {
    const ch = await this.getChannelDetails(channelIdOrHandle);
    return {
      channel: ch,
      message: `Synced metrics live from YouTube for '${ch.name}'.`,
    };
  },

  async correctChannel(channelId: string, query: string): Promise<{ channel: YouTubeChannel; message: string }> {
    const ch = await this.getChannelDetails(query);
    return {
      channel: ch,
      message: `Switched live channel to '${ch.name}' (${ch.handle}).`,
    };
  },

  async getLiveShorts(query?: string, limit = 12): Promise<YouTubeLiveShort[]> {
    return this.getChannelShorts(query, limit);
  },

  async getLiveFeed(query?: string): Promise<YouTubeLiveFeedResponse> {
    const target = (query || getStoredHandle()).trim();
    if (!target) {
      return {
        channel: null as any,
        videos: [],
        shorts: [],
        forYou: [],
      };
    }

    const [channel, videos, shorts] = await Promise.all([
      this.getChannelDetails(target).catch(() => null),
      this.getChannelVideos(target, 12).catch(() => []),
      this.getChannelShorts(target, 12).catch(() => []),
    ]);

    const forYou = [
      ...shorts.slice(0, 2).map((s) => ({
        id: s.id,
        title: s.title,
        views: s.views,
        thumbnailUrl: s.thumbnailUrl,
        videoUrl: s.videoUrl,
        isShort: true,
      })),
      ...videos.slice(0, 4).map((v) => ({
        id: v.id,
        title: v.title,
        views: v.views,
        published: v.published,
        duration: v.duration,
        thumbnailUrl: v.thumbnailUrl,
        videoUrl: v.videoUrl,
        isShort: false,
      })),
    ];

    return {
      channel: channel || ({} as any),
      videos,
      shorts,
      forYou,
    };
  },

  async updateChannel(channelId: string, updates: any): Promise<YouTubeChannel> {
    return this.getChannelDetails(channelId);
  },

  async deleteChannel(_channelId?: string): Promise<boolean> {
    return this.disconnectOAuth();
  },

  async publishVideo(payload: any): Promise<any> {
    return {
      id: `yt_${Date.now()}`,
      title: payload.title,
      videoUrl: 'https://www.youtube.com',
    };
  },

  async getAutomations(): Promise<AutomationJob[]> {
    return [];
  },

  async toggleAutomation(id: string): Promise<AutomationJob[]> {
    return [];
  },

  async getCommunityPosts(channelId: string): Promise<YouTubeCommunityPost[]> {
    return [];
  },

  async publishCommunityPost(channelId: string, payload: any): Promise<any> {
    return {
      id: `post_${Date.now()}`,
      content: payload.content,
      author: 'Creator',
      handle: '@channel',
      publishedAt: 'Just now',
      likes: 0,
      comments: 0,
    };
  },
};
