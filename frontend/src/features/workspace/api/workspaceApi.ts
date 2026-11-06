import { MusicTrack, VisualBackdrop, VoiceProfile } from '../types';
import { consoleLogger } from '@/src/shared/utils/logger';
import { apiUrl } from '@/src/shared/utils/api';

let mediaLibraryPromise: Promise<{
  musicTracks: MusicTrack[];
  visualBackdrops: VisualBackdrop[];
  voiceProfiles: VoiceProfile[];
}> | null = null;

export const workspaceApi = {
  // Generate high-CTR titles, optimized description, and categorized hashtags via AI
  async generateMetadata(params: {
    category?: string;
    topic?: string;
    title?: string;
    hook?: string;
    quote?: string;
    cta?: string;
    model?: string;
  }): Promise<{
    titles: { title: string; angle: string; viralityScore: number }[];
    description: string;
    hashtags: {
      trending: string[];
      niche: string[];
      growth: string[];
      ai?: string[];
    };
    allHashtags: string[];
  }> {
    const res = await fetch(apiUrl('/api/workspace/generate-metadata'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.detail || data.message || `AI metadata generation failed (${res.status})`);
    }
    if (!Array.isArray(data.titles) || data.titles.length === 0) {
      throw new Error('The AI returned no title ideas. Please try again.');
    }
    if (
      typeof data.description !== 'string' ||
      !data.hashtags ||
      !Array.isArray(data.hashtags.trending) ||
      !Array.isArray(data.hashtags.niche) ||
      !Array.isArray(data.hashtags.growth) ||
      !Array.isArray(data.allHashtags)
    ) {
      throw new Error('The AI returned incomplete metadata. Please try again.');
    }

    return data;
  },

  // Generate voiceover audio via Gemini TTS
  async generateVoiceover(
    payloadOrText: string | { text: string; voiceName?: string; model?: string },
    voiceName?: string
  ): Promise<{ audioBase64: string; mimeType: string; audioUrl: string }> {
    const text = typeof payloadOrText === 'string' ? payloadOrText : payloadOrText.text;
    const voice = typeof payloadOrText === 'string' ? voiceName : payloadOrText.voiceName;
    if (!voice || !voice.trim()) {
      throw new Error('Voice name is required. Please select a workspace voice before generating audio.');
    }
    const model = typeof payloadOrText === 'string' ? undefined : payloadOrText.model;

    consoleLogger.info('Gemini', `Synthesizing TTS audio for persona "${voice}"...`);
    const start = performance.now();
    const res = await fetch(apiUrl('/api/generate-voiceover'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceName: voice, model }),
    });
    const duration = performance.now() - start;
    consoleLogger.api('POST', '/api/generate-voiceover', res.status, duration);
    const data = await res.json();
    if (!res.ok || data.error || data.detail) {
      const errMsg = data.detail || data.error || 'Failed to generate voiceover';
      consoleLogger.error('Gemini', `Voiceover synthesis failed: ${errMsg}`);
      throw new Error(errMsg);
    }
    const audioUrl = data.audioUrl || `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
    consoleLogger.success('Studio', `Voiceover synthesized successfully (${data.mimeType || 'audio/wav'})`);
    return {
      audioBase64: data.audioBase64,
      mimeType: data.mimeType || 'audio/wav',
      audioUrl,
    };
  },

  // Fetch non-copyright media library (deduplicated in-flight & cached)
  async getMediaLibrary(forceRefresh = false): Promise<{
    musicTracks: MusicTrack[];
    visualBackdrops: VisualBackdrop[];
    voiceProfiles: VoiceProfile[];
  }> {
    if (mediaLibraryPromise && !forceRefresh) {
      return mediaLibraryPromise;
    }

    mediaLibraryPromise = (async () => {
      try {
        const start = performance.now();
        const res = await fetch(apiUrl('/api/media-library'), { cache: 'no-store' });
        const duration = performance.now() - start;
        consoleLogger.api('GET', '/api/media-library', res.status, duration);
        const data = await res.json();
        consoleLogger.info(
          'Studio',
          `Media library loaded (${data.data?.musicTracks?.length || 0} tracks, ${data.data?.visualBackdrops?.length || 0} backdrops)`
        );
        return data.data;
      } catch (err) {
        mediaLibraryPromise = null;
        throw err;
      }
    })();

    return mediaLibraryPromise;
  },


  // Upload & Publish to YouTube Shorts
  async publishVideo(payload: {
    title: string;
    quote: string;
    voice?: string;
    visualTheme?: string;
    category?: string;
    videoUrl?: string;
    coverImageUrl?: string;
    audioUrl?: string;
    musicUrl?: string;
    subtitles?: any[];
    videoClips?: any[];
    imageClips?: any[];
    aspectRatio?: string;
    duration?: number;
    description?: string;
    tags?: string[];
    channelId?: string;
    privacyStatus?: string;
  }): Promise<any> {
    consoleLogger.info('YouTube', `Publishing Short: "${payload.title}"...`, payload);
    const start = performance.now();
    const res = await fetch(apiUrl('/api/youtube/publish'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const duration = performance.now() - start;
    consoleLogger.api('POST', '/api/youtube/publish', res.status, duration);
    const data = await res.json();
    if (!res.ok) {
      const errDetail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail || 'Failed to publish video');
      throw new Error(errDetail);
    }
    consoleLogger.success('YouTube', `Short published to catalog: ${data.video?.title}`, data.video);
    return {
      ...(data.video || {}),
      videoUrl: data.videoUrl || data.video?.videoUrl || data.video?.video_url,
      shortsUrl: data.shortsUrl || data.video?.shortsUrl,
      videoId: data.videoId || data.video?.id || data.video?.videoId,
      liveUploaded: Boolean(data.liveUploaded || data.video?.liveUploaded),
    };
  },

  // Render Broadcast Full HD MP4 Video via /api/workspace/render-video
  async renderVideo(payload: any): Promise<{ success: boolean; videoUrl?: string; filename?: string; duration?: number; thumbnailUrl?: string; downloadUrl?: string }> {
    consoleLogger.info('Workspace', `[RenderVideo] Calling render API for 1080p MP4...`, payload);
    const start = performance.now();
    const res = await fetch(apiUrl('/api/workspace/render-video'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const duration = performance.now() - start;
    consoleLogger.api('POST', '/api/workspace/render-video', res.status, duration);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Render failed' }));
      throw new Error(err.detail || 'Failed to render studio video');
    }
    return res.json();
  },

  // Search free open-source videos via Pexels, Pixabay, Wikimedia, Google CSE, or CC0 open stock loops
  async searchOpenVideos(
    query: string = '',
    category: string = 'all',
    page: number = 1,
    pageSize: number = 20,
    provider: string = 'all',
    aspectRatio: string = '9:16'
  ): Promise<any> {
    try {
      const res = await fetch(
        apiUrl(
          `/api/media/video-search?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}&page=${page}&pageSize=${pageSize}&provider=${encodeURIComponent(provider)}&aspectRatio=${encodeURIComponent(aspectRatio)}`
        )
      );
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      consoleLogger.warn('OpenMedia', `Open video search error: ${e}`);
    }
    return { success: false, items: [] };
  },

  // Search 100M+ stock photos across Pexels, Pixabay, Unsplash & Wikimedia
  async searchOpenImages(
    query: string = '',
    provider: string = 'all',
    category: string = 'all',
    page: number = 1,
    pageSize: number = 24,
    orientation: string = 'portrait'
  ): Promise<any> {
    try {
      const params = new URLSearchParams({
        q: query,
        provider,
        category,
        page: String(page),
        pageSize: String(pageSize),
        orientation,
      });
      const res = await fetch(apiUrl(`/api/media/image-search?${params.toString()}`));
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      consoleLogger.warn('OpenMedia', `Stock photo search error: ${e}`);
    }
    return { success: false, items: [], providers: {} };
  },

  // Check active status of stock media providers (Pexels, Pixabay, Unsplash, Google CSE)
  async getMediaProvidersStatus(): Promise<{ pexels: boolean; pixabay: boolean; unsplash: boolean; jamendo: boolean; google_cse?: boolean; [key: string]: any }> {
    try {
      const res = await fetch(apiUrl('/api/media/provider-status'));
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      consoleLogger.warn('OpenMedia', `Provider status fetch error: ${e}`);
    }
    return { pexels: false, pixabay: false, unsplash: false, jamendo: false, google_cse: false };
  },

  async searchOpenTracks(query: string = '', genre: string = '', limit: number = 20): Promise<any> {
    const params = new URLSearchParams({ q: query, genre, limit: String(limit) });
    const res = await fetch(apiUrl(`/api/media/audio-search?${params.toString()}`));
    const response = await res.json();
    if (!res.ok) {
      throw new Error(response.detail || 'Failed to search soundtrack tracks');
    }

    const data = response.data;
    return {
      success: response.success,
      total: data?.total || 0,
      items: (data?.items || []).map((track: any) => ({
        id: track.id,
        title: track.title,
        artist: track.artist || '',
        genre: track.genre || 'Cinematic',
        mood: track.mood || track.genre || 'Music',
        bpm: track.bpm || 90,
        audioUrl: track.audioUrl,
        provider: track.provider,
        duration: track.duration == null
          ? '2:00'
          : `${Math.floor(track.duration / 60)}:${String(Math.floor(track.duration % 60)).padStart(2, '0')}`,
      })),
    };
  },

  async searchOpenSfx(query: string = '', limit: number = 20): Promise<any> {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    const res = await fetch(apiUrl(`/api/media/sfx-search?${params.toString()}`));
    const response = await res.json();
    if (!res.ok) {
      throw new Error(response.detail || 'Failed to search sound effects');
    }

    const data = response.data;
    return {
      success: response.success,
      total: data?.total || 0,
      items: (data?.items || []).map((effect: any) => {
        const category = String(effect.category || '').toLowerCase();
        return {
          id: effect.id,
          name: effect.title,
          category: category.includes('whoosh')
            ? 'Transition'
            : category.includes('impact') || category.includes('sub_drop')
              ? 'Impact'
              : category.includes('riser')
                ? 'Tension'
                : 'Action',
          duration: `${effect.duration ?? 1}s`,
          audioUrl: effect.audioUrl,
          provider: effect.provider,
        };
      }),
    };
  },

};
