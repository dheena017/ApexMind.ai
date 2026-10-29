/**
 * frontend/src/features/workspace/api/studioApi.ts
 *
 * ApexMind Studio Pipeline API client — 4 dedicated endpoints.
 *
 * Stage 1  POST /api/studio/generate-script   → ScriptStageResult
 * Stage 2  POST /api/studio/synthesize-voice  → VoiceStageResult
 * Stage 3  POST /api/studio/resolve-media     → MediaStageResult
 * Stage 4  POST /api/studio/generate-captions → CaptionsStageResult
 */

import { consoleLogger } from '@/src/shared/utils/logger';
import { apiUrl } from '@/src/shared/utils/api';
import type {
  ScriptStageResult,
  VoiceStageResult,
  MediaStageResult,
  CaptionsStageResult,
} from '../hooks/useStudioPipeline';

// ── Helpers ────────────────────────────────────────────────────────────────

async function post<T>(path: string, body: unknown): Promise<T> {
  const start = performance.now();
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const elapsed = performance.now() - start;
  consoleLogger.api('POST', path, res.status, elapsed);

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.detail || data?.message || `${path} failed (${res.status})`;
    consoleLogger.error('StudioApi', msg);
    throw new Error(msg);
  }
  return data as T;
}

// ── Stage 1 ─────────────────────────────────────────────────────────────────

interface GenerateScriptParams {
  category: string;
  topic?: string;
  userPrompt?: string;
  tone?: string;
  length?: string;
  model?: string;
  aspectRatio?: string;
  voiceName?: string;
  musicTrackId?: string;
  captionStylePreset?: string;
  backdropId?: string;
  audioMood?: string;
  backgroundStyle?: string;
  textStyle?: string;
  videoStyle?: string;
  visualTheme?: string;
  motionStyle?: string;
  outputFormat?: string;
  creativeContext?: Record<string, unknown>;
  availableAssets?: Record<string, unknown>;
}

interface StudioScriptEnvelope {
  success: boolean;
  stageId: string;
  data: ScriptStageResult;
  memoryCount: number;
  generatedAt: string;
}

export const studioApi = {
  /**
   * Stage 1 — AI Script + Storyboard Generation
   * POST /api/studio/generate-script
   */
  async generateScript(params: GenerateScriptParams): Promise<ScriptStageResult> {
    consoleLogger.info(
      'Studio',
      `[Stage 1] Generating script | category="${params.category}" model=${params.model || 'gemini-2.5-flash'}`
    );
    const envelope = await post<StudioScriptEnvelope>('/api/studio/generate-script', {
      category: params.category,
      topic: params.topic || params.category,
      userPrompt: params.userPrompt || undefined,
      tone: params.tone || undefined,
      length: params.length || '30 seconds',
      model: params.model || 'gemini-2.5-flash',
      aspectRatio: params.aspectRatio || '9:16',
      voiceName: params.voiceName || undefined,
      musicTrackId: params.musicTrackId || undefined,
      captionStylePreset: params.captionStylePreset || undefined,
      backdropId: params.backdropId || undefined,
      audioMood: params.audioMood || undefined,
      backgroundStyle: params.backgroundStyle || undefined,
      textStyle: params.textStyle || undefined,
      videoStyle: params.videoStyle || undefined,
      visualTheme: params.visualTheme || undefined,
      motionStyle: params.motionStyle || undefined,
      outputFormat: params.outputFormat || undefined,
      creativeContext: params.creativeContext || undefined,
      availableAssets: params.availableAssets || undefined,
    });
    consoleLogger.success('Studio', `[Stage 1] Script ready: "${envelope.data?.title}"`);
    return envelope.data;
  },

  // ── Stage 2 ───────────────────────────────────────────────────────────────

  /**
   * Stage 2 — Gemini TTS Voice Synthesis
   * POST /api/studio/synthesize-voice
   */
  async synthesizeVoice(params: {
    voiceName: string;
    storyboard?: Array<{ sceneNumber: number; subtitleText: string; start: number; duration: number }>;
    fullNarrationText?: string;
    model?: string;
    speechStyle?: string;
    targetDurationSeconds?: number;
  }): Promise<VoiceStageResult> {
    if (!params.voiceName?.trim()) throw new Error('voiceName is required for voice synthesis.');
    if (!params.storyboard?.length && !params.fullNarrationText?.trim()) {
      throw new Error('Provide either storyboard[] or fullNarrationText for voice synthesis.');
    }

    consoleLogger.info('Studio', `[Stage 2] Synthesizing voice | persona="${params.voiceName}"`);
    const data = await post<VoiceStageResult & { success: boolean; stageId: string }>('/api/studio/synthesize-voice', {
      voiceName: params.voiceName,
      storyboard: params.storyboard || undefined,
      fullNarrationText: params.fullNarrationText || undefined,
      model: params.model || undefined,
      speechStyle: params.speechStyle || undefined,
      targetDurationSeconds: params.targetDurationSeconds || undefined,
    });
    consoleLogger.success('Studio', `[Stage 2] Voice ready | duration=${data.durationSeconds}s url=${data.audioUrl}`);
    return {
      audioUrl: data.audioUrl,
      durationSeconds: data.durationSeconds,
      mimeType: data.mimeType,
      voiceName: data.voiceName,
      wordTimestamps: data.wordTimestamps || [],
    };
  },

  // ── Stage 3 ───────────────────────────────────────────────────────────────

  /**
   * Stage 3 — Stock Media Resolution (Videos, Images, SFX)
   * POST /api/studio/resolve-media
   */
  async resolveMedia(params: {
    scenes: Array<{
      sceneNumber: number;
      mediaType?: string;
      visualQuery: string;
      googleSearchQuery?: string;
      fallbackQueries?: string[];
      durationSeconds?: number;
    }>;
    aspectRatio?: string;
    sfxEvents?: Array<{ time: number; sfxId: string; label: string; searchQuery?: string }>;
    backdropId?: string;
    resolveBackground?: boolean;
    resolveImages?: boolean;
  }): Promise<MediaStageResult> {
    if (!params.scenes?.length) {
      return { scenes: [], sfxEvents: [], background: {}, resolvedCount: 0, totalScenes: 0 };
    }

    consoleLogger.info('Studio', `[Stage 3] Resolving media for ${params.scenes.length} scenes`);
    const data = await post<{ success: boolean; stageId: string; data: MediaStageResult }>(
      '/api/studio/resolve-media',
      {
        scenes: params.scenes.map((s) => ({
          sceneNumber: s.sceneNumber,
          mediaType: s.mediaType || 'video',
          visualQuery: s.visualQuery,
          googleSearchQuery: s.googleSearchQuery || undefined,
          fallbackQueries: s.fallbackQueries || [],
          durationSeconds: s.durationSeconds || 3.0,
        })),
        aspectRatio: params.aspectRatio || '9:16',
        sfxEvents: params.sfxEvents || [],
        backdropId: params.backdropId || undefined,
        resolveBackground: params.resolveBackground ?? true,
        resolveImages: params.resolveImages ?? false,
      }
    );
    consoleLogger.success(
      'Studio',
      `[Stage 3] Media resolved: ${data.data.resolvedCount}/${data.data.totalScenes} scenes`
    );
    return data.data;
  },

  // ── Stage 4 ───────────────────────────────────────────────────────────────

  /**
   * Stage 4 — Scene-Aligned Caption Generation
   * POST /api/studio/generate-captions
   */
  async generateCaptions(params: {
    storyboardScenes?: Array<{
      sceneNumber: number;
      subtitleText: string;
      start: number;
      duration: number;
      captionPresetClass?: string;
      captionPresetColor?: string;
    }>;
    fullNarrationText?: string;
    durationSeconds?: number;
    stylePreset?: string;
    maxWordsPerSegment?: number;
    aspectRatio?: string;
    captionColor?: string;
    captionFontFamily?: string;
  }): Promise<CaptionsStageResult> {
    if (!params.storyboardScenes?.length && !params.fullNarrationText?.trim()) {
      throw new Error('Provide either storyboardScenes[] or fullNarrationText for caption generation.');
    }

    consoleLogger.info(
      'Studio',
      `[Stage 4] Generating captions | scenes=${params.storyboardScenes?.length ?? 0} duration=${params.durationSeconds}s`
    );
    const data = await post<{ success: boolean; stageId: string; data: CaptionsStageResult }>(
      '/api/studio/generate-captions',
      {
        storyboardScenes: params.storyboardScenes || undefined,
        fullNarrationText: params.fullNarrationText || undefined,
        durationSeconds: params.durationSeconds || 10.0,
        stylePreset: params.stylePreset || 'sub-hormozi',
        maxWordsPerSegment: params.maxWordsPerSegment || 4,
        aspectRatio: params.aspectRatio || '9:16',
        captionColor: params.captionColor || '#FACC15',
        captionFontFamily: params.captionFontFamily || 'Impact, sans-serif',
      }
    );
    consoleLogger.success(
      'Studio',
      `[Stage 4] Captions ready | segments=${data.data.segments.length} clips=${data.data.timelineClips.length}`
    );
    return data.data;
  },
};

