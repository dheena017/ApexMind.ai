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
  }): Promise<GeneratedScript> {
    const topicText = params.userPrompt || params.topic || params.category;
    consoleLogger.info('Gemini', `Generating AI script with model: "${params.model || 'gemini-2.5-flash'}" for topic: "${topicText}"...`);
    const start = performance.now();
    const res = await fetch(apiUrl('/api/generate-script'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: params.category,
        topic: topicText,
        tone: params.tone,
        length: params.length,
        model: params.model,
      }),
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
    voiceName: string = 'Fenrir'
  ): Promise<{ audioBase64: string; mimeType: string; audioUrl: string }> {
    const text = typeof payloadOrText === 'string' ? payloadOrText : payloadOrText.text;
    const voice = typeof payloadOrText === 'string' ? voiceName : (payloadOrText.voiceName || 'Fenrir');
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
    consoleLogger.success('YouTube', `Short published to catalog: ${data.video?.title}`, data.video);
    return data.video;
  },
};
