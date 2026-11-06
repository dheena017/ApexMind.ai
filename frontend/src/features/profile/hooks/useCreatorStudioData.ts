import { useEffect, useState } from 'react';
import { videosApi } from '@/src/features/videos/api/videosApi';
import '@/src/features/workspace/api/workspaceApi';
import type { YouTubeChannel } from '@/src/features/youtube/types';
import type { WebsiteVideo } from '@/src/features/videos/types';
import { youtubeApi } from '@/src/features/youtube/api/youtubeApi';

export interface RecentGeneratedScript {
  id: string;
  title: string;
  hook?: string;
  quote: string;
  category?: string;
  generated_at: string;
}

export interface StudioStats {
  totalQuotesGenerated: number;
  totalShortsGenerated: number;
  totalViews: number;
  totalLikes: number;
  activeChannelsCount: number;
}

export function useCreatorStudioData() {
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [videos, setVideos] = useState<WebsiteVideo[]>([]);
  const [stats, setStats] = useState<StudioStats | null>(null);
  const [scripts, setScripts] = useState<RecentGeneratedScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudioData = async () => {
    const [channelsRes, videosRes] = await Promise.allSettled([
      youtubeApi.getChannels(),
      videosApi.getVideos(),
    ]);

    const loadedChannels: YouTubeChannel[] = channelsRes.status === 'fulfilled' ? channelsRes.value : [];
    const loadedVideos: WebsiteVideo[] = videosRes.status === 'fulfilled' ? videosRes.value || [] : [];
    const loadedScripts: RecentGeneratedScript[] = [];

    setChannels(loadedChannels);
    setVideos(loadedVideos);
    setScripts(loadedScripts);
    setStats({
      totalQuotesGenerated: loadedScripts.length,
      totalShortsGenerated: loadedVideos.length,
      totalViews: loadedVideos.reduce((acc, v) => acc + (v.views || 0), 0),
      totalLikes: loadedVideos.reduce((acc, v) => acc + (v.likes || 0), 0),
      activeChannelsCount: loadedChannels.length,
    });
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        await fetchStudioData();
      } catch (err: any) {
        if (active) setError(err?.message || 'Failed to load studio data.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchStudioData();
    } catch (err: any) {
      setError(err?.message || 'Failed to refresh studio data.');
    } finally {
      setLoading(false);
    }
  };

  return { channels, videos, stats, scripts, loading, error, setChannels, refresh };
}
