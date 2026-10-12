import { GeneratedScript, MusicTrack, VisualBackdrop, VoiceProfile } from '../types';
import { consoleLogger } from '@/src/shared/utils/logger';

export const workspaceApi = {
  // Generate motivational quote script via Gemini
  async generateScript(params: {
    category: string;
    topic?: string;
    tone?: string;
    length?: string;
  }): Promise<GeneratedScript> {
    consoleLogger.info('Gemini', `Generating AI script for topic: "${params.topic || params.category}"...`);
    const start = performance.now();
    const res = await fetch('/api/generate-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const duration = performance.now() - start;
    consoleLogger.api('POST', '/api/generate-script', res.status, duration);
    const data = await res.json();
    consoleLogger.success('Studio', `Script generated: "${data.data?.title}"`, data.data);
    return data.data;
  },

  // Generate voiceover audio via Gemini TTS
  async generateVoiceover(text: string, voiceName: string = 'Fenrir'): Promise<{ audioBase64: string; mimeType: string }> {
    consoleLogger.info('Gemini', `Synthesizing TTS audio for persona "${voiceName}"...`);
    const start = performance.now();
    const res = await fetch('/api/generate-voiceover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceName }),
    });
    const duration = performance.now() - start;
    consoleLogger.api('POST', '/api/generate-voiceover', res.status, duration);
    const data = await res.json();
    if (!res.ok || data.error) {
      consoleLogger.error('Gemini', `Voiceover synthesis failed: ${data.error || 'Server error'}`);
      throw new Error(data.error || 'Failed to generate voiceover');
    }
    consoleLogger.success('Studio', `Voiceover synthesized successfully (${data.mimeType || 'audio/wav'})`);
    return { audioBase64: data.audioBase64, mimeType: data.mimeType || 'audio/wav' };
  },

  // Fetch non-copyright media library
  async getMediaLibrary(): Promise<{
    musicTracks: MusicTrack[];
    visualBackdrops: VisualBackdrop[];
    voiceProfiles: VoiceProfile[];
  }> {
    const start = performance.now();
    const res = await fetch('/api/media-library');
    const duration = performance.now() - start;
    consoleLogger.api('GET', '/api/media-library', res.status, duration);
    const data = await res.json();
    consoleLogger.info('Studio', `Media library loaded (${data.data?.musicTracks?.length || 0} tracks, ${data.data?.visualBackdrops?.length || 0} backdrops)`);
    return data.data;
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

};
