/**
 * frontend/src/features/workspace/api/studioApi.ts
 *
 * ApexMind Studio Pipeline API client — 4 dedicated endpoints + Script Generation v2.
 *
 * Stage 1  POST /api/studio/generate-script         → ScriptStageResult
 *          POST /api/studio/generate-script/async   → ScriptJobResponse
 *          GET  /api/studio/jobs/{job_id}           → JobStatusResponse
 *          POST /api/studio/jobs/{job_id}/cancel    → { success: boolean }
 * Stage 2  POST /api/studio/generate-voice          → VoiceStageResult
 * Stage 3  POST /api/studio/resolve-media           → MediaStageResult
 * Stage 4  POST /api/studio/generate-captions       → CaptionsStageResult
 */

import { consoleLogger } from '@/src/shared/utils/logger';
import { apiUrl } from '@/src/shared/utils/api';
import { DEFAULT_SCRIPT_MODEL, DEFAULT_SCRIPT_MODEL_LABEL } from '@/src/shared/aiModels';
import type {
  ScriptStageResult,
  VoiceStageResult,
  MediaStageResult,
  CaptionsStageResult,
} from '../hooks/useStudioPipeline';
import type {
  GenerationProfile,
  ScriptJobResponse,
  JobStatusResponse,
} from '../types/script';

// ── Helpers ────────────────────────────────────────────────────────────────

async function post<T>(path: string, body: unknown, customHeaders?: Record<string, string>): Promise<T> {
  const start = performance.now();
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(customHeaders || {}) },
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

async function get<T>(path: string): Promise<T> {
  const start = performance.now();
  const res = await fetch(apiUrl(path), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  const elapsed = performance.now() - start;
  consoleLogger.api('GET', path, res.status, elapsed);

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.detail || data?.message || `${path} failed (${res.status})`;
    consoleLogger.error('StudioApi', msg);
    throw new Error(msg);
  }
  return data as T;
}

// ── Stage 1 ─────────────────────────────────────────────────────────────────

export interface GenerateScriptParams {
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
  generationProfile?: GenerationProfile;
}

// ── Stage 2 Types ──────────────────────────────────────────────────────────

export interface VoiceCapabilityOption {
  isOffline: boolean;
  supportsEmotions?: boolean;
  supportsPitch?: boolean;
  supportsRate?: boolean;
  supportsWordTimestamps?: boolean;
}

export interface VoiceItemOption {
  voiceId: string;
  name: string;
  gender: string;
  language: string;
  capabilities?: VoiceCapabilityOption;
}

export interface VoiceProviderOption {
  providerId: string;
  name: string;
  isOffline: boolean;
  voices: VoiceItemOption[];
}

export interface ListVoicesResponse {
  success: boolean;
  defaultProvider: string;
  providers: VoiceProviderOption[];
}

export interface SceneAudioMetadataResponse {
  sceneId: string;
  version: number;
  audioUrl: string;
  actualDuration: number;
}

export interface ScriptVoiceMetadataResponse {
  success: boolean;
  schemaVersion: string;
  scriptId: string;
  masterAudioUrl: string;
  masterDuration: number;
  scenes: SceneAudioMetadataResponse[];
}

export interface GenerateScriptVoiceParams {
  scriptId: string;
  projectId?: string;
  voiceConfig?: {
    provider?: string;
    voiceId?: string;
    language?: string;
    speed?: number;
    pitch?: number;
    preset?: string;
  };
  loudnessProfile?: {
    targetI?: number;
    targetTp?: number;
    targetLra?: number;
  };
  mode?: 'all' | 'selected_scenes' | 'regenerate';
  sceneIds?: string[];
  forceRegenerate?: boolean;
}

export interface ScriptVoiceResponseData {
  schemaVersion: string;
  scriptId: string;
  totalScenes: number;
  masterAudioUrl: string;
  masterDuration: number;
  timelineOffsets: Array<{ sceneId: string; timelineOffset: number; duration: number }>;
  loudnessMetrics: Record<string, unknown>;
  scenes: Array<{
    sceneId: string;
    version: number;
    audioUrl: string;
    actualDuration: number;
    timelineOffset: number;
    sampleRate: number;
    channels: number;
    loudness: Record<string, unknown>;
  }>;
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
   * Stage 1 — AI Script + Storyboard Generation (Synchronous)
   * POST /api/studio/generate-script
   */
  async generateScript(params: GenerateScriptParams): Promise<ScriptStageResult> {
    consoleLogger.info(
      'Studio',
      `[Stage 1] Generating script | category="${params.category}" profile="${params.generationProfile || 'motivational_reel'}" model=${params.model || DEFAULT_SCRIPT_MODEL_LABEL}`
    );
    const envelope = await post<StudioScriptEnvelope>('/api/studio/generate-script', {
      category: params.category,
      topic: params.topic || params.category,
      userPrompt: params.userPrompt || undefined,
      tone: params.tone || undefined,
      length: params.length || '30 seconds',
      model: params.model || DEFAULT_SCRIPT_MODEL,
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
      generationProfile: params.generationProfile || 'motivational_reel',
    });
    consoleLogger.success('Studio', `[Stage 1] Script ready: "${envelope.data?.title}"`);
    return envelope.data;
  },

  /**
   * Stage 1 — AI Script Generation (Asynchronous Background Job)
   * POST /api/studio/generate-script/async
   */
  async generateScriptAsync(params: GenerateScriptParams): Promise<ScriptJobResponse> {
    consoleLogger.info(
      'Studio',
      `[Stage 1 Async] Enqueuing generation job | profile="${params.generationProfile || 'motivational_reel'}"`
    );
    return post<ScriptJobResponse>('/api/studio/generate-script/async', {
      category: params.category,
      topic: params.topic || params.category,
      userPrompt: params.userPrompt || undefined,
      tone: params.tone || undefined,
      length: params.length || '30 seconds',
      model: params.model || DEFAULT_SCRIPT_MODEL,
      aspectRatio: params.aspectRatio || '9:16',
      voiceName: params.voiceName || undefined,
      generationProfile: params.generationProfile || 'motivational_reel',
    });
  },

  /**
   * Polling endpoint for background script generation job status.
   * GET /api/studio/jobs/{job_id}
   */
  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    return get<JobStatusResponse>(`/api/studio/jobs/${jobId}`);
  },

  /**
   * Cancel background script generation job.
   * POST /api/studio/jobs/{job_id}/cancel
   */
  async cancelJob(jobId: string): Promise<{ success: boolean; message: string }> {
    return post<{ success: boolean; message: string }>(`/api/studio/jobs/${jobId}/cancel`, {});
  },

  // ── Stage 2 ───────────────────────────────────────────────────────────────

  /**
   * List installed voice providers (Piper, Edge-TTS, System OS) and their available voices.
   * GET /api/studio/voices
   */
  async listVoices(): Promise<ListVoicesResponse> {
    consoleLogger.info('Studio', '[Stage 2] Fetching voice providers and installed models');
    return get<ListVoicesResponse>('/api/studio/voices');
  },

  /**
   * Retrieve generated voice assets and scene audio files for an approved script.
   * GET /api/studio/scripts/{scriptId}/voice
   */
  async getScriptVoice(scriptId: string): Promise<ScriptVoiceMetadataResponse> {
    return get<ScriptVoiceMetadataResponse>(`/api/studio/scripts/${scriptId}/voice`);
  },

  /**
   * Dispatch an asynchronous Stage 2 voice generation job for progress polling.
   * POST /api/studio/generate-voice/async
   */
  async generateVoiceAsync(
    params: GenerateScriptVoiceParams,
    idempotencyKey?: string
  ): Promise<ScriptJobResponse> {
    consoleLogger.info(
      'Studio',
      `[Stage 2 Async] Dispatching voice job for script "${params.scriptId}" (mode=${params.mode || 'all'})`
    );
    const headers = idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : undefined;
    return post<ScriptJobResponse>('/api/studio/generate-voice/async', params, headers);
  },

  /**
   * Stage 2 — Generate Multi-Scene Voiceover (Synchronous or script-based)
   * POST /api/studio/generate-voice
   */
  async generateScriptVoice(params: GenerateScriptVoiceParams): Promise<ScriptVoiceResponseData> {
    consoleLogger.info(
      'Studio',
      `[Stage 2] Generating multi-scene voice | scriptId="${params.scriptId}" mode="${params.mode || 'all'}"`
    );
    return post<ScriptVoiceResponseData>('/api/studio/generate-voice', params);
  },

  /**
   * Regenerate a single scene's voice audio with version increment (v1 -> v2)
   * POST /api/studio/generate-voice
   */
  async regenerateSceneVoice(
    scriptId: string,
    sceneId: string,
    options?: {
      provider?: string;
      voiceId?: string;
      preset?: string;
      speed?: number;
      pitch?: number;
    }
  ): Promise<ScriptVoiceResponseData> {
    consoleLogger.info('Studio', `[Stage 2] Regenerating scene audio | script="${scriptId}" scene="${sceneId}"`);
    return post<ScriptVoiceResponseData>('/api/studio/generate-voice', {
      scriptId,
      mode: 'selected_scenes',
      sceneIds: [sceneId],
      forceRegenerate: true,
      voiceConfig: options,
    });
  },

  /**
   * Stage 2 — Gemini TTS Voice Generation
   * POST /api/studio/generate-voice
   */
  async generateVoice(params: {
    voiceName: string;
    storyboard?: Array<{ sceneNumber: number; subtitleText: string; start: number; duration: number }>;
    fullNarrationText?: string;
    model?: string;
    speechStyle?: string;
    targetDurationSeconds?: number;
  }): Promise<VoiceStageResult> {
    if (!params.voiceName?.trim()) throw new Error('voiceName is required for voice generation.');
    if (!params.storyboard?.length && !params.fullNarrationText?.trim()) {
      throw new Error('Provide either storyboard[] or fullNarrationText for voice generation.');
    }

    consoleLogger.info('Studio', `[Stage 2] Generating voice | persona="${params.voiceName}"`);
    const data = await post<VoiceStageResult & { success: boolean; stageId: string }>('/api/studio/generate-voice', {
      voiceName: params.voiceName,
      storyboard: params.storyboard || undefined,
      fullNarrationText: params.fullNarrationText || undefined,
      model: params.model || undefined,
      speechStyle: params.speechStyle || undefined,
      targetDurationSeconds: params.targetDurationSeconds || undefined,
    });
    const shortUrl = data.audioUrl?.startsWith('data:')
      ? `${data.audioUrl.slice(0, 32)}... [base64 audio]`
      : (data.audioUrl ? `${data.audioUrl.slice(0, 60)}...` : 'none');
    consoleLogger.success('Studio', `[Stage 2] Voice ready | duration=${data.durationSeconds}s url=${shortUrl}`);
    return {
      audioUrl: data.audioUrl,
      durationSeconds: data.durationSeconds,
      mimeType: data.mimeType,
      voiceName: data.voiceName,
      wordTimestamps: data.wordTimestamps || [],
    };
  },

  /**
   * Backward-compatible alias for generateVoice.
   */
  async synthesizeVoice(params: {
    voiceName: string;
    storyboard?: Array<{ sceneNumber: number; subtitleText: string; start: number; duration: number }>;
    fullNarrationText?: string;
    model?: string;
    speechStyle?: string;
    targetDurationSeconds?: number;
  }): Promise<VoiceStageResult> {
    return this.generateVoice(params);
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

  // ── Stage 3 Visual Production (Media, 3D, Hybrid, Automatic) ──────────────

  /**
   * Stage 3 — Synchronous Visual Production
   * POST /api/studio/generate-visuals
   */
  async generateVisuals(params: {
    scriptId: string;
    projectMode?: 'media' | 'three_d' | 'hybrid' | 'automatic';
    scenes?: any[];
    aspectRatio?: string;
    stylePreference?: string;
    autoRoute?: boolean;
  }): Promise<any> {
    consoleLogger.info('Studio', `[Stage 3] Generating visuals | scriptId=${params.scriptId} mode=${params.projectMode || 'media'}`);
    return post('/api/studio/generate-visuals', {
      scriptId: params.scriptId,
      projectMode: params.projectMode || 'media',
      scenes: params.scenes,
      aspectRatio: params.aspectRatio || '9:16',
      stylePreference: params.stylePreference || 'cinematic_3d_story',
      autoRoute: params.autoRoute ?? false,
    });
  },

  /**
   * Stage 3 — Asynchronous Visual Production Job
   * POST /api/studio/generate-visuals/async
   */
  async generateVisualsAsync(
    params: {
      scriptId: string;
      projectMode?: 'media' | 'three_d' | 'hybrid' | 'automatic';
      scenes?: any[];
      aspectRatio?: string;
      stylePreference?: string;
      autoRoute?: boolean;
    },
    idempotencyKey?: string
  ): Promise<ScriptJobResponse> {
    consoleLogger.info('Studio', `[Stage 3] Dispatching async visuals job | scriptId=${params.scriptId}`);
    return post<ScriptJobResponse>(
      '/api/studio/generate-visuals/async',
      {
        scriptId: params.scriptId,
        projectMode: params.projectMode || 'media',
        scenes: params.scenes,
        aspectRatio: params.aspectRatio || '9:16',
        stylePreference: params.stylePreference || 'cinematic_3d_story',
        autoRoute: params.autoRoute ?? false,
      },
      idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : undefined
    );
  },

  /**
   * Stage 3 — Retrieve Visual Metadata & Manifest
   * GET /api/studio/scripts/{scriptId}/visuals
   */
  async getScriptVisuals(scriptId: string): Promise<any> {
    return get(`/api/studio/scripts/${scriptId}/visuals`);
  },

  /**
   * Stage 3 — Single Scene Visual Regeneration
   * POST /api/studio/scripts/{scriptId}/visuals/scenes/{sceneId}/regenerate
   */
  async regenerateSceneVisuals(
    scriptId: string,
    sceneId: string,
    params: {
      modeOverride?: 'media' | 'three_d' | 'hybrid' | 'automatic';
      promptOverride?: string;
      aspectRatio?: string;
    }
  ): Promise<any> {
    consoleLogger.info('Studio', `[Stage 3] Regenerating visuals for scene ${sceneId} (mode=${params.modeOverride || 'default'})`);
    return post(`/api/studio/scripts/${scriptId}/visuals/scenes/${sceneId}/regenerate`, {
      modeOverride: params.modeOverride,
      promptOverride: params.promptOverride,
      aspectRatio: params.aspectRatio || '9:16',
    });
  },

  /**
   * Stage 3 — Approve or Reject Scene Visual Preview
   * POST /api/studio/scripts/{scriptId}/visuals/scenes/{sceneId}/approve
   */
  async approveSceneVisual(
    scriptId: string,
    sceneId: string,
    approved: boolean,
    rejectionReason?: string
  ): Promise<any> {
    consoleLogger.info('Studio', `[Stage 3] Marking scene ${sceneId} as ${approved ? 'APPROVED' : 'REJECTED'}`);
    return post(`/api/studio/scripts/${scriptId}/visuals/scenes/${sceneId}/approve`, {
      approved,
      rejectionReason,
    });
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
