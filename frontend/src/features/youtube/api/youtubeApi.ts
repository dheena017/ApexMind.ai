import {
  YouTubeChannel,
  YouTubeVideo,
  AutomationJob,
  YouTubeLookupResult,
  YouTubeLiveShort,
  YouTubeLiveFeedResponse,
  YouTubeCommunityPost,
  YouTubePlaylist,
  YouTubeAnalyticsData,
} from '../types';
import { consoleLogger } from '@/src/shared/utils/logger';

export const youtubeApi = {
  // Get connected YouTube channels and videos
  async getYouTubeData(): Promise<{
    channels: YouTubeChannel[];
    videos: YouTubeVideo[];
  }> {
    const start = performance.now();
    const res = await fetch('/api/youtube/channels');
    const duration = performance.now() - start;
    consoleLogger.api('GET', '/api/youtube/channels', res.status, duration);
    const data = await res.json();
    consoleLogger.info('YouTube', `Loaded ${data.channels?.length || 0} channels, ${data.videos?.length || 0} published videos`);
    return { channels: data.channels || [], videos: data.videos || [] };
  },

  // Lookup / verify live YouTube channel metadata
  async lookupChannel(query: string): Promise<YouTubeLookupResult> {
    consoleLogger.info('YouTube', `Looking up YouTube channel info for "${query}"...`);
    const start = performance.now();
    const res = await fetch('/api/youtube/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const duration = performance.now() - start;
    consoleLogger.api('POST', '/api/youtube/lookup', res.status, duration);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Channel not found' }));
      throw new Error(err.detail || 'Failed to resolve YouTube channel');
    }

    const data = await res.json();
    consoleLogger.success('YouTube', `Live channel verified: "${data.channel.name}" (${data.channel.handle})`, data.channel);
    return data.channel;
  },

  // Connect new YouTube channel (with real YouTube metadata or manual)
  async connectYouTubeChannel(payload: {
    channelName?: string;
    handle: string;
    niche?: string;
    avatarUrl?: string;
    subscribers?: number;
    videosUploaded?: number;
    autoResolve?: boolean;
  }): Promise<YouTubeChannel> {
    consoleLogger.info('YouTube', `Connecting channel "${payload.channelName || payload.handle}"...`);
    const start = performance.now();
    const res = await fetch('/api/youtube/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const duration = performance.now() - start;
    consoleLogger.api('POST', '/api/youtube/connect', res.status, duration);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to connect channel' }));
      throw new Error(err.detail || 'Failed to connect channel');
    }

    const data = await res.json();
    consoleLogger.success('YouTube', `Channel "${data.channel?.name}" connected successfully!`, data.channel);
    return data.channel;
  },

  // Sync / refresh real-time channel statistics from live YouTube
  async syncChannel(channelId: string): Promise<{ channel: YouTubeChannel; message: string }> {
    consoleLogger.info('YouTube', `Syncing channel ${channelId} with live YouTube...`);
    const start = performance.now();
    const res = await fetch(`/api/youtube/channels/${channelId}/sync`, {
      method: 'POST',
    });
    const duration = performance.now() - start;
    consoleLogger.api('POST', `/api/youtube/channels/${channelId}/sync`, res.status, duration);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Sync failed' }));
      throw new Error(err.detail || 'Failed to sync YouTube metrics');
    }

    const data = await res.json();
    consoleLogger.success('YouTube', data.message, data.channel);
    return data;
  },

  // Correct channel handle or identifier
  async correctChannel(channelId: string, query: string): Promise<{ channel: YouTubeChannel; message: string }> {
    consoleLogger.info('YouTube', `Correcting channel ${channelId} to "${query}"...`);
    const start = performance.now();
    const res = await fetch('/api/youtube/correct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId, query }),
    });
    const duration = performance.now() - start;
    consoleLogger.api('POST', '/api/youtube/correct', res.status, duration);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Correction failed' }));
      throw new Error(err.detail || 'Failed to correct YouTube channel');
    }

    const data = await res.json();
    consoleLogger.success('YouTube', data.message, data.channel);
    return data;
  },

  // Get live shorts published on this YouTube channel
  async getLiveShorts(channelId: string, limit = 12): Promise<YouTubeLiveShort[]> {
    const start = performance.now();
    const res = await fetch(`/api/youtube/channels/${channelId}/shorts?limit=${limit}`);
    const duration = performance.now() - start;
    consoleLogger.api('GET', `/api/youtube/channels/${channelId}/shorts`, res.status, duration);
    if (!res.ok) return [];
    const data = await res.json();
    return data.shorts || [];
  },

  // Get live comprehensive channel feed: real channel info, real videos, real shorts, and for-you recommendations
  async getLiveFeed(channelId: string): Promise<YouTubeLiveFeedResponse> {
    const start = performance.now();
    const res = await fetch(`/api/youtube/channels/${channelId}/live-feed`);
    const duration = performance.now() - start;
    consoleLogger.api('GET', `/api/youtube/channels/${channelId}/live-feed`, res.status, duration);
    if (!res.ok) {
      throw new Error('Failed to fetch live YouTube feed');
    }
    return await res.json();
  },

  // Update channel properties (auto-upload toggle, schedule, niche)
  async updateChannel(channelId: string, updates: Partial<YouTubeChannel>): Promise<YouTubeChannel> {
    consoleLogger.info('YouTube', `Updating channel ${channelId}...`, updates);
    const start = performance.now();
    const res = await fetch(`/api/youtube/channels/${channelId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const duration = performance.now() - start;
    consoleLogger.api('PATCH', `/api/youtube/channels/${channelId}`, res.status, duration);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to update channel' }));
      throw new Error(err.detail || 'Failed to update channel');
    }
    const data = await res.json();
    return data.channel;
  },

  // Disconnect channel
  async deleteChannel(channelId: string): Promise<boolean> {
    consoleLogger.info('YouTube', `Disconnecting channel ${channelId}...`);
    const res = await fetch(`/api/youtube/channels/${channelId}`, {
      method: 'DELETE',
    });
    return res.ok;
  },

  // Publish video to YouTube Shorts
  async publishVideo(payload: {
    title: string;
    quote: string;
    voice: string;
    visualTheme: string;
    category: string;
    channelId?: string;
  }): Promise<YouTubeVideo> {
    consoleLogger.info('YouTube', `Publishing Short: "${payload.title}"...`, payload);
    const start = performance.now();
    const res = await fetch('/api/youtube/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const duration = performance.now() - start;
    consoleLogger.api('POST', '/api/youtube/publish', res.status, duration);
    const data = await res.json();
    consoleLogger.success('YouTube', `Short published to catalog: ${data.video?.title}`, data.video);
    return data.video;
  },

  // Automations
  async getAutomations(): Promise<AutomationJob[]> {
    const start = performance.now();
    const res = await fetch('/api/automations');
    const duration = performance.now() - start;
    consoleLogger.api('GET', '/api/automations', res.status, duration);
    const data = await res.json();
    consoleLogger.info('YouTube', `Loaded ${data.automations?.length || 0} automated jobs`);
    return data.automations;
  },

  async toggleAutomation(id: string): Promise<AutomationJob[]> {
    consoleLogger.info('YouTube', `Toggling automation schedule ${id}...`);
    const start = performance.now();
    const res = await fetch('/api/automations/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const duration = performance.now() - start;
    consoleLogger.api('POST', '/api/automations/toggle', res.status, duration);
    const data = await res.json();
    consoleLogger.success('YouTube', `Updated automation schedules`, data.automations);
    return data.automations;
  },

  // Community Posts
  async getCommunityPosts(channelId: string): Promise<YouTubeCommunityPost[]> {
    const start = performance.now();
    const res = await fetch(`/api/youtube/channels/${channelId}/posts`);
    const duration = performance.now() - start;
    consoleLogger.api('GET', `/api/youtube/channels/${channelId}/posts`, res.status, duration);
    if (!res.ok) return [];
    const data = await res.json();
    return data.posts || [];
  },

  async publishCommunityPost(
    channelId: string,
    payload: { content: string; author?: string; handle?: string; avatarUrl?: string }
  ): Promise<YouTubeCommunityPost> {
    consoleLogger.info('YouTube', `Publishing community post for channel ${channelId}...`);
    const start = performance.now();
    const res = await fetch(`/api/youtube/channels/${channelId}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const duration = performance.now() - start;
    consoleLogger.api('POST', `/api/youtube/channels/${channelId}/posts`, res.status, duration);
    if (!res.ok) {
      throw new Error('Failed to publish community post');
    }
    const data = await res.json();
    consoleLogger.success('YouTube', 'Community post published', data.post);
    return data.post;
  },

  // Playlists
  async getPlaylists(channelId: string): Promise<YouTubePlaylist[]> {
    const start = performance.now();
    const res = await fetch(`/api/youtube/channels/${channelId}/playlists`);
    const duration = performance.now() - start;
    consoleLogger.api('GET', `/api/youtube/channels/${channelId}/playlists`, res.status, duration);
    if (!res.ok) return [];
    const data = await res.json();
    return data.playlists || [];
  },

  // Analytics
  async getChannelAnalytics(channelId: string): Promise<YouTubeAnalyticsData | null> {
    const start = performance.now();
    const res = await fetch(`/api/youtube/channels/${channelId}/analytics`);
    const duration = performance.now() - start;
    consoleLogger.api('GET', `/api/youtube/channels/${channelId}/analytics`, res.status, duration);
    if (!res.ok) return null;
    const data = await res.json();
    return data.analytics || null;
  },
};
