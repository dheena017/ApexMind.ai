import { YouTubeChannel, YouTubeVideo, AutomationJob } from '../types';
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
    return { channels: data.channels, videos: data.videos };
  },

  // Connect new YouTube channel
  async connectYouTubeChannel(channelName: string, handle: string, niche: string): Promise<YouTubeChannel> {
    consoleLogger.info('YouTube', `Connecting channel "${channelName}" (${handle})...`);
    const start = performance.now();
    const res = await fetch('/api/youtube/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelName, handle, niche }),
    });
    const duration = performance.now() - start;
    consoleLogger.api('POST', '/api/youtube/connect', res.status, duration);
    const data = await res.json();
    consoleLogger.success('YouTube', `Channel "${data.channel?.name}" connected successfully!`, data.channel);
    return data.channel;
  },

  // Publish video to YouTube Shorts
  async publishVideo(payload: {
    title: string;
    quote: string;
    voice: string;
    visualTheme: string;
    category: string;
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
};

