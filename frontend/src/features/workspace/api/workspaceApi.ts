import { MusicTrack, VisualBackdrop, VoiceProfile, DEFAULT_VISUAL_BACKDROPS } from '../types';
import { consoleLogger } from '@/src/shared/utils/logger';
import { apiUrl } from '@/src/shared/utils/api';

const DEFAULT_VOICES: VoiceProfile[] = [
  { id: 'Fenrir', name: 'Fenrir (Deep, Stoic Leader)', gender: 'Male', style: 'Stoic Leader', speed: '0.95x' },
  { id: 'Kore', name: 'Kore (Clear, Inspiring, Authoritative)', gender: 'Female', style: 'Inspiring Leader', speed: '1.0x' },
  { id: 'Puck', name: 'Puck (High-Octane Motivational)', gender: 'Male', style: 'Energetic Coach', speed: '1.05x' },
  { id: 'Aoede', name: 'Aoede (Poetic, Calm, Deep Thought)', gender: 'Female', style: 'Poetic Calm', speed: '0.9x' },
  { id: 'Zephyr', name: 'Zephyr (Warm Cinematic Narrative)', gender: 'Male', style: 'Warm Cinematic', speed: '1.0x' },
];

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
    fullScript?: string;
  }): Promise<{
    titles: { title: string; angle: string; viralityScore: number }[];
    titleList?: string[];
    description: string;
    hashtags: {
      trending: string[];
      niche: string[];
      growth: string[];
      ai?: string[];
    };
    allHashtags: string[];
    tags?: string[];
    categoryNiche?: string;
  }> {
    const res = await fetch(apiUrl('/api/studio/video-metadata'), {
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
    const res = await fetch(apiUrl('/api/studio/voice-tts'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceName: voice, model }),
    });
    const duration = performance.now() - start;
    consoleLogger.api('POST', '/api/studio/voice-tts', res.status, duration);
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

  // Fetch studio presets (built-in catalog)
  async getMediaLibrary(_forceRefresh = false): Promise<{
    musicTracks: MusicTrack[];
    visualBackdrops: VisualBackdrop[];
    voiceProfiles: VoiceProfile[];
  }> {
    return {
      musicTracks: [],
      visualBackdrops: DEFAULT_VISUAL_BACKDROPS,
      voiceProfiles: DEFAULT_VOICES,
    };
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
    const token = typeof window !== 'undefined' ? localStorage.getItem('apexmind_token') : null;
    const res = await fetch(apiUrl('/api/youtube/publish'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
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

  // Search live Google Fonts (1,900+ fonts) & dynamic typography styles
  async searchOpenFonts(
    query: string = '',
    category: string = 'all',
    provider: string = 'all',
    page: number = 1,
    pageSize: number = 24,
    mood: string = 'all'
  ): Promise<any> {
    try {
      const params = new URLSearchParams({
        q: query,
        category,
        provider,
        page: String(page),
        pageSize: String(pageSize),
        mood,
      });
      const res = await fetch(apiUrl(`/api/media/font-search?${params.toString()}`));
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      consoleLogger.warn('OpenFonts', `Google Fonts search error: ${e}`);
    }
    return { success: false, items: [], total: 0 };
  },

  // Search live quotes & viral hooks from free public APIs
  async searchOpenQuotes(
    query: string = '',
    category: string = 'all',
    page: number = 1,
    pageSize: number = 20
  ): Promise<any> {
    try {
      const params = new URLSearchParams({
        q: query,
        category,
        page: String(page),
        pageSize: String(pageSize),
      });
      const res = await fetch(apiUrl(`/api/media/quote-search?${params.toString()}`));
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      consoleLogger.warn('OpenQuotes', `Quotes search error: ${e}`);
    }
    return { success: false, items: [], total: 0 };
  },

  // Check active status of stock media providers
  async getMediaProvidersStatus(): Promise<{ pexels: boolean; pixabay: boolean; unsplash: boolean; jamendo: boolean; google_cse?: boolean; [key: string]: any }> {
    try {
      const [vRes, iRes] = await Promise.all([
        fetch(apiUrl('/api/workspace/video/providers')).then((r) => r.json()).catch(() => ({})),
        fetch(apiUrl('/api/workspace/image/providers')).then((r) => r.json()).catch(() => ({})),
      ]);
      return {
        pexels: true,
        pixabay: true,
        unsplash: true,
        jamendo: true,
        ...(vRes.providers || {}),
        ...(iRes.providers || {}),
      };
    } catch {
      return { pexels: true, pixabay: true, unsplash: true, jamendo: true, google_cse: false };
    }
  },

  async searchOpenTracks(
    query: string = '',
    genre: string = '',
    limit: number = 24,
    provider: string = 'all',
    page: number = 1
  ): Promise<any> {
    const params = new URLSearchParams({
      q: query,
      genre,
      provider,
      page: String(page),
      limit: String(limit),
    });
    const res = await fetch(apiUrl(`/api/workspace/audio/soundtracks?${params.toString()}`));
    const response = await res.json();
    if (!res.ok) {
      throw new Error(response.detail || 'Failed to search soundtrack tracks');
    }

    const items = response.items || response.data?.items || [];
    const total = response.total ?? response.data?.total ?? 0;
    return {
      success: response.success,
      total,
      items: items.map((track: any) => ({
        id: track.id,
        title: track.title,
        artist: track.artist || '',
        genre: track.genre || 'Cinematic',
        mood: track.mood || track.genre || 'Music',
        bpm: track.bpm || 90,
        audioUrl: track.audioUrl,
        provider: track.provider,
        duration:
          track.durationFormatted ||
          (track.duration == null
            ? '2:30'
            : `${Math.floor(track.duration / 60)}:${String(Math.floor(track.duration % 60)).padStart(2, '0')}`),
      })),
    };
  },

  async searchOpenSfx(
    query: string = '',
    limit: number = 24,
    category: string = 'all',
    provider: string = 'all',
    page: number = 1
  ): Promise<any> {
    const params = new URLSearchParams({
      q: query,
      category,
      provider,
      page: String(page),
      limit: String(limit),
    });
    const res = await fetch(apiUrl(`/api/workspace/audio/sfx?${params.toString()}`));
    const response = await res.json();
    if (!res.ok) {
      throw new Error(response.detail || 'Failed to search sound effects');
    }

    const items = response.items || response.data?.items || [];
    const total = response.total ?? response.data?.total ?? 0;
    return {
      success: response.success,
      total,
      items: items.map((effect: any) => {
        const cat = String(effect.category || '').toLowerCase();
        let formattedCat = 'Action';
        if (cat.includes('whoosh') || cat.includes('transition') || cat.includes('swoosh')) formattedCat = 'Transition';
        else if (cat.includes('impact') || cat.includes('sub_drop') || cat.includes('boom') || cat.includes('slam')) formattedCat = 'Impact';
        else if (cat.includes('riser') || cat.includes('tension') || cat.includes('buildup')) formattedCat = 'Tension';
        else if (cat.includes('scifi') || cat.includes('laser') || cat.includes('cyber')) formattedCat = 'Sci-Fi';
        else if (cat.includes('ui') || cat.includes('click') || cat.includes('bell') || cat.includes('pop')) formattedCat = 'UI & Tech';
        else if (cat.includes('game') || cat.includes('8bit') || cat.includes('arcade')) formattedCat = 'Gaming';
        else if (cat.includes('foley') || cat.includes('footstep') || cat.includes('door')) formattedCat = 'Foley';
        else if (cat.includes('vehicle') || cat.includes('car') || cat.includes('engine')) formattedCat = 'Vehicles';
        else if (cat.includes('nature') || cat.includes('rain') || cat.includes('thunder')) formattedCat = 'Nature';
        else if (cat.includes('horror') || cat.includes('scream') || cat.includes('creak')) formattedCat = 'Horror';
        else if (cat.includes('cartoon') || cat.includes('boing') || cat.includes('whistle')) formattedCat = 'Cartoon';
        else if (cat.includes('cinematic') || cat.includes('braam')) formattedCat = 'Cinematic';
        else if (cat.includes('bass') || cat.includes('808')) formattedCat = 'Bass Drop';
        else if (effect.category) formattedCat = effect.category;

        return {
          id: effect.id,
          name: effect.title || effect.name || 'Sound Effect',
          category: formattedCat,
          duration: effect.durationFormatted || `${effect.duration ?? 1}s`,
          audioUrl: effect.audioUrl,
          provider: effect.provider,
        };
      }),
    };
  },

};
