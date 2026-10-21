import { GeneratedScript, MusicTrack, VisualBackdrop, VoiceProfile } from '../types';
import { consoleLogger } from '@/src/shared/utils/logger';
import { apiUrl } from '@/src/shared/utils/api';

export const workspaceApi = {
  // Generate motivational quote script via Gemini
  async generateScript(params: {
    category: string;
    topic?: string;
    userPrompt?: string;
    tone?: string;
    length?: string;
    model?: string;
    audioMood?: string;
    backgroundStyle?: string;
    textStyle?: string;
    videoStyle?: string;
    voiceName?: string;
    aspectRatio?: string;
    musicTrack?: string;
    captionStyle?: string;
    visualTheme?: string;
    motionStyle?: string;
    outputFormat?: string;
    creativeContext?: Record<string, unknown>;
    availableAssets?: Record<string, unknown>;
  }): Promise<GeneratedScript> {
    const topicText = params.userPrompt || params.topic || params.category;
    consoleLogger.info('Gemini', `Generating AI script with model: "${params.model || 'gemini-2.5-flash'}" for topic: "${topicText}"...`);
    const start = performance.now();

    const payload: Record<string, string | number | boolean | null | Record<string, unknown>> = {
      category: params.category,
      topic: topicText,
      tone: params.tone || '',
      length: params.length || '',
      model: params.model || '',
    };

    const optionalFields = {
      audioMood: params.audioMood,
      backgroundStyle: params.backgroundStyle,
      textStyle: params.textStyle,
      videoStyle: params.videoStyle,
      voiceName: params.voiceName,
      aspectRatio: params.aspectRatio,
      musicTrack: params.musicTrack,
      captionStyle: params.captionStyle,
      visualTheme: params.visualTheme,
      motionStyle: params.motionStyle,
      outputFormat: params.outputFormat,
    };

    Object.entries(optionalFields).forEach(([key, value]) => {
      if (value && value.trim()) payload[key] = value.trim();
    });

    if (params.creativeContext && Object.keys(params.creativeContext).length > 0) {
      payload.creativeContext = params.creativeContext;
    }

    if (params.availableAssets && Object.keys(params.availableAssets).length > 0) {
      payload.availableAssets = params.availableAssets;
    }

    const res = await fetch(apiUrl('/api/generate-script'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const duration = performance.now() - start;
    consoleLogger.api('POST', '/api/generate-script', res.status, duration);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.detail || data.message || `Failed to generate script (${res.status}: ${res.statusText})`;
      consoleLogger.error('Studio', 'Script generation error:', errorMsg);
      throw new Error(errorMsg);
    }

    consoleLogger.success('Studio', `Script generated: "${data.data?.title}"`, data.data);
    return data.data;
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

  // Fetch non-copyright media library
  async getMediaLibrary(): Promise<{
    musicTracks: MusicTrack[];
    visualBackdrops: VisualBackdrop[];
    voiceProfiles: VoiceProfile[];
  }> {
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
  },

  // Fetch quote memory catalog to avoid repetition
  // Fetch quote memory catalog to avoid repetition (supports filtering, search, pagination, sort)
  async getQuoteMemory(params?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
    sort?: string;
  }): Promise<{
    totalQuotesInMemory: number;
    totalQuotesSaved?: number;
    filteredCount?: number;
    uniquenessScore?: number;
    categories?: Record<string, number>;
    recentThemes?: string[];
    quotes: string[];
    memoryStore?: any[];
  }> {
    const start = performance.now();
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    if (params?.sort) query.set('sort', params.sort);

    const qs = query.toString();
    const url = qs ? `/api/quote-memory?${qs}` : '/api/quote-memory';
    const res = await fetch(apiUrl(url));
    const duration = performance.now() - start;
    consoleLogger.api('GET', url, res.status, duration);
    const data = await res.json();
    return {
      totalQuotesInMemory: data.totalQuotesSaved || data.totalQuotesInMemory || (data.memoryStore ? data.memoryStore.length : 0),
      totalQuotesSaved: data.totalQuotesSaved,
      filteredCount: data.filteredCount,
      uniquenessScore: data.uniquenessScore ?? 100,
      categories: data.categories || {},
      recentThemes: data.recentThemes || [],
      quotes: data.quotes || [],
      memoryStore: data.memoryStore || [],
    };
  },

  // Manually add quote to uniqueness memory store
  async addQuoteToMemory(payload: {
    title: string;
    quote: string;
    hook?: string;
    category?: string;
  }): Promise<any> {
    const res = await fetch(apiUrl('/api/quote-memory'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Clear quote memory or delete specific quote by ID
  async clearQuoteMemory(quoteId?: string): Promise<any> {
    const url = quoteId ? `/api/quote-memory?id=${encodeURIComponent(quoteId)}` : '/api/quote-memory';
    const res = await fetch(apiUrl(url), { method: 'DELETE' });
    return res.json();
  },

  // Upload & Publish to YouTube Shorts
  async publishVideo(payload: {
    title: string;
    quote: string;
    voice: string;
    visualTheme: string;
    category: string;
  }): Promise<any> {
    consoleLogger.info('YouTube', `Publishing Short: "${payload.title}"...`, payload);
    const start = performance.now();
    const res = await fetch(apiUrl('/api/youtube/videos'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const duration = performance.now() - start;
    consoleLogger.api('POST', '/api/youtube/videos', res.status, duration);
    const data = await res.json();
    if (!res.ok) {
      const errDetail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail || 'Failed to publish video');
      throw new Error(errDetail);
    }
    consoleLogger.success('YouTube', `Short published to catalog: ${data.video?.title}`, data.video);
    return data.video;
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
          `/api/workspace/open-media/videos?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}&page=${page}&pageSize=${pageSize}&provider=${encodeURIComponent(provider)}&aspectRatio=${encodeURIComponent(aspectRatio)}`
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
      const res = await fetch(apiUrl(`/api/workspace/open-media/images?${params.toString()}`));
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
      const res = await fetch(apiUrl('/api/workspace/open-media/providers'));
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      consoleLogger.warn('OpenMedia', `Provider status fetch error: ${e}`);
    }
    return { pexels: false, pixabay: false, unsplash: false, jamendo: false, google_cse: false };
  },

  // Search free royalty-free tracks via Jamendo API
  async searchOpenTracks(query: string = '', genre: string = '', limit: number = 20): Promise<any> {
    try {
      const res = await fetch(
        apiUrl(`/api/workspace/open-media/tracks?q=${encodeURIComponent(query)}&genre=${encodeURIComponent(genre)}&limit=${limit}`)
      );
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      consoleLogger.warn('OpenMedia', `Jamendo search error: ${e}`);
    }
    return { success: false, items: [] };
  },

  // Search free sound effects via FreeSound / Open SFX
  async searchOpenSfx(query: string = 'whoosh', limit: number = 20): Promise<any> {
    try {
      const res = await fetch(
        apiUrl(`/api/workspace/open-media/sfx?q=${encodeURIComponent(query)}&limit=${limit}`)
      );
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      consoleLogger.warn('OpenMedia', `SFX search error: ${e}`);
    }
    return { success: false, items: [] };
  },

  // Search live open-source quotes & viral hooks via ZenQuotes / DummyJSON / Vault
  async searchOpenQuotes(
    query: string = '',
    category: string = 'all',
    limit: number = 30,
    author: string = '',
    page: number = 1
  ): Promise<any> {
    try {
      const res = await fetch(
        apiUrl(
          `/api/workspace/open-media/quotes?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}&limit=${limit}&author=${encodeURIComponent(author)}&page=${page}`
        )
      );
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      consoleLogger.warn('OpenMedia', `Quotes fetch error: ${e}`);
    }
    return { success: false, items: [] };
  },

  // Batch resolve real media cuts for all storyboard scenes concurrently
  async resolveScenesMedia(params: {
    scenes: Array<{
      sceneNumber: number;
      visualQuery: string;
      googleSearchQuery?: string;
      fallbackQueries?: string[];
      mediaType?: string;
    }>;
    aspectRatio?: string;
  }): Promise<any> {
    const start = performance.now();
    try {
      const res = await fetch(apiUrl('/api/media/resolve-scenes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenes: params.scenes,
          aspectRatio: params.aspectRatio || '9:16',
        }),
      });
      const duration = performance.now() - start;
      consoleLogger.api('POST', '/api/media/resolve-scenes', res.status, duration);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      consoleLogger.error('MediaEngine', `Failed to batch resolve scene media: ${e}`);
    }
    return { success: false, data: { scenes: [] } };
  },

  // Regenerate visual footage for a single scene with exclusion list support
  async resolveSingleScene(params: {
    sceneNumber: number;
    query: string;
    mediaType?: string;
    aspectRatio?: string;
    excludeUrls?: string[];
  }): Promise<any> {
    const start = performance.now();
    try {
      const res = await fetch(apiUrl('/api/media/resolve-scene'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneNumber: params.sceneNumber,
          query: params.query,
          mediaType: params.mediaType || 'video',
          aspectRatio: params.aspectRatio || '9:16',
          excludeUrls: params.excludeUrls || [],
        }),
      });
      const duration = performance.now() - start;
      consoleLogger.api('POST', '/api/media/resolve-scene', res.status, duration);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      consoleLogger.error('MediaEngine', `Failed to resolve single scene visual: ${e}`);
    }
    return { success: false };
  },

  // Generate Closed Captions (word-level karaoke timings, SRT, WebVTT)
  async generateCaptions(params: {
    text: string;
    durationSeconds?: number;
    stylePreset?: string;
    maxWordsPerSegment?: number;
  }): Promise<any> {
    const start = performance.now();
    try {
      const res = await fetch(apiUrl('/api/generate-captions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: params.text,
          durationSeconds: params.durationSeconds || 5.0,
          stylePreset: params.stylePreset || 'sub-hormozi',
          maxWordsPerSegment: params.maxWordsPerSegment || 4,
        }),
      });
      const duration = performance.now() - start;
      consoleLogger.api('POST', '/api/generate-captions', res.status, duration);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      consoleLogger.error('Captions', `Failed to generate closed captions: ${e}`);
    }
    return { success: false };
  },
};


