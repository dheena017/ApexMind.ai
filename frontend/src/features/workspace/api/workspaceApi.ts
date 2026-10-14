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

    const res = await fetch(apiUrl('/api/generate-script'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const duration = performance.now() - start;
    consoleLogger.api('POST', '/api/generate-script', res.status, duration);
    const data = await res.json();
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
    const res = await fetch(apiUrl('/api/media-library'));
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
  async getQuoteMemory(): Promise<{ totalQuotesInMemory: number; quotes: string[]; memoryStore?: any[] }> {
    const start = performance.now();
    const res = await fetch(apiUrl('/api/quote-memory'));
    const duration = performance.now() - start;
    consoleLogger.api('GET', '/api/quote-memory', res.status, duration);
    const data = await res.json();
    return {
      totalQuotesInMemory: data.totalQuotesSaved || data.totalQuotesInMemory || (data.memoryStore ? data.memoryStore.length : 0),
      quotes: data.quotes || [],
      memoryStore: data.memoryStore || [],
    };
  },

  // Fetch connected YouTube channel info
  async getConnectedChannels(): Promise<any[]> {
    try {
      const res = await fetch(apiUrl('/api/youtube/channels'));
      const data = await res.json();
      return data.channels || [];
    } catch {
      return [];
    }
  },

  // Clear quote memory
  async clearQuoteMemory(): Promise<void> {
    await fetch(apiUrl('/api/quote-memory'), { method: 'DELETE' });
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
    return data.video;
  },

  // Search free open-source images via Openverse API & curated fallback
  async searchOpenImages(query: string, page: number = 1, pageSize: number = 24): Promise<any> {
    try {
      const res = await fetch(
        apiUrl(`/api/workspace/open-media/images?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`)
      );
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      consoleLogger.warn('OpenMedia', `Openverse search error: ${e}`);
    }
    return { success: false, items: [] };
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

  // Generate 100% free instant AI visual via Pollinations (No API key needed)
  getFreeAiImageUrl(prompt: string, width: number = 1080, height: number = 1920): string {
    const encoded = encodeURIComponent(prompt.trim());
    return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true`;
  },
};

