import { WebsiteVideo } from '../types';
import { consoleLogger } from '@/src/shared/utils/logger';
import { apiUrl } from '@/src/shared/utils/api';

export const videosApi = {
  // Fetch all videos created by the website studio
  async getVideos(params?: { category?: string; search?: string }): Promise<WebsiteVideo[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'all') {
      query.set('category', params.category);
    }
    if (params?.search && params.search.trim()) {
      query.set('search', params.search.trim());
    }

    const url = apiUrl(`/api/studio-videos${query.toString() ? `?${query.toString()}` : ''}`);
    const start = performance.now();
    const res = await fetch(url);
    const duration = performance.now() - start;
    consoleLogger.api('GET', '/api/studio-videos', res.status, duration);

    if (!res.ok) {
      throw new Error(`Failed to load studio videos: ${res.statusText}`);
    }

    const data = await res.json();
    consoleLogger.info('StudioVideos', `Loaded ${data.videos?.length || 0} website videos`);
    return data.videos || [];
  },

  // Get a single video
  async getVideoById(id: string): Promise<WebsiteVideo> {
    const res = await fetch(apiUrl(`/api/studio-videos/${id}`));
    if (!res.ok) {
      throw new Error('Video not found');
    }
    return res.json();
  },

  // Save/create a new website video
  async createVideo(payload: Partial<WebsiteVideo>): Promise<WebsiteVideo> {
    consoleLogger.info('StudioVideos', `Saving website video: "${payload.title}"`, payload);
    const res = await fetch(apiUrl('/api/studio-videos'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error('Failed to create video');
    }

    const data = await res.json();
    consoleLogger.success('StudioVideos', `Video saved: "${data.title}"`, data);
    return data;
  },

  // Update a website video
  async updateVideo(id: string, updates: Partial<WebsiteVideo>): Promise<WebsiteVideo> {
    const res = await fetch(apiUrl(`/api/studio-videos/${id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      throw new Error('Failed to update video');
    }

    return res.json();
  },

  // Delete a website video
  async deleteVideo(id: string): Promise<boolean> {
    consoleLogger.warn('StudioVideos', `Deleting website video ID: ${id}`);
    const res = await fetch(apiUrl(`/api/studio-videos/${id}`), {
      method: 'DELETE',
    });

    if (!res.ok) {
      throw new Error('Failed to delete video');
    }

    const data = await res.json();
    return Boolean(data.success);
  },
};
