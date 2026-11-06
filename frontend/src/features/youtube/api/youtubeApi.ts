import {
  YouTubeChannel,
  YouTubeLiveShort,
  YouTubeLiveVideo,
  YouTubeCommunityPost,
  YouTubePlaylist,
  AutomationJob,
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
    const res = await fetch(apiUrl(`/api/youtube/channel/details?query=${encodeURIComponent(target)}`), {
      headers: this._getScheduleHeaders(),
    });
    if (!res.ok) throw new Error(`Channel details failed: ${res.status}`);
    const data = await res.json();
    return data.channel;
  },

  // 2. Channel Videos (16:9 Long-Form)
  async getChannelVideos(query?: string, limit = 24): Promise<YouTubeLiveVideo[]> {
    const target = (query || getStoredHandle()).trim();
    if (!target) return [];
    const res = await fetch(apiUrl(`/api/youtube/channel/videos?query=${encodeURIComponent(target)}&limit=${limit}`));
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

  // ── Action / Mutation Operations ──────────────────────────────────────────

  // ── YouTube Channel Connection ─────────────────────────────────────────────

  async connectWithCode(code: string, redirectUri = 'postmessage'): Promise<{ success: boolean; channel: YouTubeChannel; message: string }> {
    const res = await fetch(apiUrl('/api/youtube/oauth/code'), {
      method: 'POST',
      headers: this._getScheduleHeaders(),
      body: JSON.stringify({ code, redirectUri }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to authenticate channel with authorization code' }));
      throw new Error(err.detail || 'Failed to authenticate channel with authorization code');
    }
    return res.json();
  },

  async connectWithToken(accessToken: string): Promise<{ success: boolean; channel: YouTubeChannel; message: string }> {
    const res = await fetch(apiUrl('/api/youtube/connect'), {
      method: 'POST',
      headers: this._getScheduleHeaders(),
      body: JSON.stringify({ accessToken }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to connect channel with Google token' }));
      throw new Error(err.detail || 'Failed to connect channel with Google token');
    }
    return res.json();
  },

  async getAuthStatus(): Promise<{
    success: boolean;
    connected: boolean;
    activeChannelId?: string;
    channel?: any;
  }> {
    const res = await fetch(apiUrl('/api/youtube/status'), {
      headers: this._getScheduleHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Failed to load YouTube connection status' }));
      throw new Error(error.detail || 'Failed to load YouTube connection status');
    }
    const data = await res.json();
    return {
      success: true,
      connected: Boolean(data.connected || data.isAuthorized),
      activeChannelId: data.activeChannelId,
      channel: data.channel,
    };
  },

  async getChannels(): Promise<YouTubeChannel[]> {
    const res = await fetch(apiUrl('/api/youtube/channels'), {
      headers: this._getScheduleHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to load YouTube channels: ${res.status}`);
    const data = await res.json();
    return data.channels || [];
  },

  async setActiveChannel(channelId: string): Promise<void> {
    const res = await fetch(
      apiUrl(`/api/youtube/channels/${encodeURIComponent(channelId)}/active`),
      {
        method: 'POST',
        headers: this._getScheduleHeaders(),
      },
    );
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Could not select YouTube channel' }));
      throw new Error(error.detail || 'Could not select YouTube channel');
    }
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

  // ── Video Production & Publishing Schedules ─────────────────────────────────

  _resolveUserId(explicitId?: string): string | undefined {
    if (explicitId) return explicitId;
    try {
      const stored = localStorage.getItem('apexmind_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u?.id) return u.id;
      }
    } catch {}
    return undefined;
  },

  _getScheduleHeaders(userId?: string): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    try {
      const token = localStorage.getItem('apexmind_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const uid = this._resolveUserId(userId);
      if (uid) headers['X-User-Id'] = uid;
    } catch {}
    return headers;
  },

  async getAutomations(userId?: string): Promise<AutomationJob[]> {
    try {
      const uid = this._resolveUserId(userId);
      const url = uid
        ? apiUrl(`/api/schedules?userId=${encodeURIComponent(uid)}`)
        : apiUrl('/api/schedules');
      const res = await fetch(url, { headers: this._getScheduleHeaders(uid) });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    } catch (e) {
      consoleLogger.error('YouTubeApi', 'Failed to fetch schedules', e);
      return [];
    }
  },

  async createAutomation(payload: Partial<AutomationJob> & { userId?: string }): Promise<AutomationJob> {
    const uid = this._resolveUserId(payload.userId);
    const body = { ...payload, userId: uid };
    const res = await fetch(apiUrl('/api/schedules'), {
      method: 'POST',
      headers: this._getScheduleHeaders(uid),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create automation schedule' }));
      throw new Error(err.detail || 'Failed to create automation schedule');
    }
    const json = await res.json();
    return json.data;
  },

  async toggleAutomation(jobId: string, userId?: string): Promise<AutomationJob[]> {
    const uid = this._resolveUserId(userId);
    const url = uid
      ? apiUrl(`/api/schedules/${jobId}/toggle?userId=${encodeURIComponent(uid)}`)
      : apiUrl(`/api/schedules/${jobId}/toggle`);
    const res = await fetch(url, {
      method: 'PATCH',
      headers: this._getScheduleHeaders(uid),
    });
    if (!res.ok) throw new Error('Failed to toggle automation schedule');
    const json = await res.json();
    return json.data;
  },

  async deleteAutomation(jobId: string, userId?: string): Promise<AutomationJob[]> {
    const uid = this._resolveUserId(userId);
    const url = uid
      ? apiUrl(`/api/schedules/${jobId}?userId=${encodeURIComponent(uid)}`)
      : apiUrl(`/api/schedules/${jobId}`);
    const res = await fetch(url, {
      method: 'DELETE',
      headers: this._getScheduleHeaders(uid),
    });
    if (!res.ok) throw new Error('Failed to delete automation schedule');
    const json = await res.json();
    return json.data;
  },

  async runAutomationNow(
    jobId: string,
    payload?: any,
  ): Promise<{ success: boolean; accepted: boolean; jobId: string; message: string }> {
    const uid = this._resolveUserId();
    const query = uid ? `?userId=${encodeURIComponent(uid)}` : '';
    const res = await fetch(apiUrl(`/api/schedules/${encodeURIComponent(jobId)}/run-now${query}`), {
      method: 'POST',
      headers: this._getScheduleHeaders(uid),
      body: payload ? JSON.stringify(payload) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to execute automation pipeline' }));
      throw new Error(err.detail || 'Failed to execute automation pipeline');
    }
    return res.json();
  },

  async stopAutomation(jobId: string): Promise<any> {
    const uid = this._resolveUserId();
    const query = uid ? `?userId=${encodeURIComponent(uid)}` : '';
    const res = await fetch(apiUrl(`/api/schedules/${encodeURIComponent(jobId)}/stop${query}`), {
      method: 'POST',
      headers: this._getScheduleHeaders(uid),
    });
    if (!res.ok) return false;
    return res.json();
  },

  async getAutomationHistory(jobId: string, userId?: string): Promise<import('../types').AutomationHistoryEntry[]> {
    const uid = this._resolveUserId(userId);
    const url = uid
      ? apiUrl(`/api/schedules/${jobId}/history?userId=${encodeURIComponent(uid)}`)
      : apiUrl(`/api/schedules/${jobId}/history`);
    const res = await fetch(url, { headers: this._getScheduleHeaders(uid) });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  },

  async clearAutomationHistory(jobId: string, userId?: string): Promise<boolean> {
    const uid = this._resolveUserId(userId);
    const url = uid
      ? apiUrl(`/api/schedules/${jobId}/history?userId=${encodeURIComponent(uid)}`)
      : apiUrl(`/api/schedules/${jobId}/history`);
    const res = await fetch(url, {
      method: 'DELETE',
      headers: this._getScheduleHeaders(uid),
    });
    if (!res.ok) return false;
    const json = await res.json();
    return Boolean(json.cleared);
  },
};
