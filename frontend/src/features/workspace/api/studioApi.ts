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
import { DEFAULT_SCRIPT_MODEL, DEFAULT_SCRIPT_MODEL_LABEL } from '@/src/shared/aiModels';
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
  genre?: string;
  genrePreset?: string;
  render3DEngine?: string;
  suggested3DProvider?: string;
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
      `[Stage 1] Generating script | category="${params.category}" model=${params.model || DEFAULT_SCRIPT_MODEL_LABEL}`
    );
    const envelope = await post<StudioScriptEnvelope>('/api/studio/generate-script', {
      genre: params.genre || 'motivation',
      genrePreset: params.genrePreset || undefined,
      render3DEngine: params.render3DEngine || undefined,
      suggested3DProvider: params.suggested3DProvider || undefined,
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
    });
    consoleLogger.success('Studio', `[Stage 1] Script ready: "${envelope.data?.title}"`);
    return envelope.data;
  },

  /**
   * Small API 1.1 — Generate Script Content (Hooks, Monologue, CTA, fullScript)
   * POST /api/studio/script-content
   */
  async generateScriptContent(params: {
    category: string;
    topic?: string;
    tone?: string;
    targetDurationSeconds?: number;
    userPrompt?: string;
    model?: string;
  }) {
    return post<{
      success: boolean;
      hookOptions: Array<{ id: string; angle: string; text: string; viralityScore: number }>;
      selectedHook: string;
      monologue: string;
      cta: string;
      fullScript: string;
      totalWords: number;
    }>('/api/studio/script-content', {
      category: params.category,
      topic: params.topic || params.category,
      tone: params.tone || 'aggressive',
      targetDurationSeconds: params.targetDurationSeconds || 30,
      userPrompt: params.userPrompt || undefined,
      model: params.model || undefined,
    });
  },

  /**
   * Small API 1.2 — Generate Script Subtitles (Timed cuts)
   * POST /api/studio/script-subtitles
   */
  async generateScriptSubtitles(params: {
    fullScript: string;
    targetDurationSeconds?: number;
    captionStylePreset?: string;
    aspectRatio?: string;
    model?: string;
  }) {
    return post<{
      success: boolean;
      totalDurationSeconds: number;
      subtitles: Array<{
        lineIndex: number;
        text: string;
        startTime: number;
        endTime: number;
        duration: number;
        highlightWords: string[];
      }>;
    }>('/api/studio/script-subtitles', {
      fullScript: params.fullScript,
      targetDurationSeconds: params.targetDurationSeconds || 30,
      captionStylePreset: params.captionStylePreset || 'sub-hormozi',
      aspectRatio: params.aspectRatio || '9:16',
      model: params.model || undefined,
    });
  },

  /**
   * Small API 1.3A — Generate Faceless Video Scenes
   * POST /api/studio/storyboard-scenes-video
   */
  async generateVideoScenes(params: {
    subtitles: Array<Record<string, unknown>>;
    visualTheme?: string;
    motionStyle?: string;
    aspectRatio?: string;
    userVisualPrompt?: string;
    model?: string;
  }) {
    return post<{
      success: boolean;
      mode: 'video';
      scenes: Array<{
        sceneNumber: number;
        startTime: number;
        duration: number;
        mediaType: 'video';
        subtitleText: string;
        searchQuery: string;
        fallbackQueries: string[];
        negativeTerms: string[];
        cameraMotion: string;
        transition: string;
        mediaStatus: string;
      }>;
    }>('/api/studio/storyboard-scenes-video', {
      subtitles: params.subtitles,
      visualTheme: params.visualTheme || 'Cinematic Dark Architecture',
      motionStyle: params.motionStyle || 'slow push in',
      aspectRatio: params.aspectRatio || '9:16',
      userVisualPrompt: params.userVisualPrompt || undefined,
      model: params.model || undefined,
    });
  },

  /**
   * Small API 1.3B — Generate Image Frames
   * POST /api/studio/storyboard-scenes-image
   */
  async generateImageScenes(params: {
    subtitles: Array<Record<string, unknown>>;
    artStyle?: string;
    colorPalette?: string;
    aspectRatio?: string;
    userVisualPrompt?: string;
    model?: string;
  }) {
    return post<{
      success: boolean;
      mode: 'image';
      frames: Array<{
        frameNumber: number;
        startTime: number;
        duration: number;
        mediaType: 'image';
        subtitleText: string;
        imagePrompt: string;
        negativePrompt: string;
        cameraShot: string;
        lightingStyle: string;
        kenBurnsMotion: string;
        transition: string;
        mediaStatus: string;
      }>;
    }>('/api/studio/storyboard-scenes-image', {
      subtitles: params.subtitles,
      artStyle: params.artStyle || 'hyperrealistic cinematic photography',
      colorPalette: params.colorPalette || 'moody dark teal and orange',
      aspectRatio: params.aspectRatio || '9:16',
      userVisualPrompt: params.userVisualPrompt || undefined,
      model: params.model || undefined,
    });
  },

  /**
   * Small API 1.4 — Plan Sound Design
   * POST /api/studio/sound-design
   */
  async planSoundDesign(params: {
    category: string;
    tone?: string;
    audioMood?: string;
    targetDurationSeconds?: number;
    sceneTimestamps?: number[];
    model?: string;
  }) {
    return post<{
      success: boolean;
      soundtrack: {
        genre: string;
        bpm: number;
        energyLevel: string;
        moodDescription: string;
        searchKeywords: string[];
      };
      sfxEvents: Array<{
        timeOffset: number;
        type: string;
        label: string;
        volume: number;
        reason?: string;
      }>;
      ducking: {
        active: boolean;
        voiceActiveVolume: number;
        pauseSwellVolume: number;
        attackMs: number;
        releaseMs: number;
        profile: string;
      };
    }>('/api/studio/sound-design', {
      category: params.category,
      tone: params.tone || 'aggressive',
      audioMood: params.audioMood || 'Dark Phonk / Intense',
      targetDurationSeconds: params.targetDurationSeconds || 30,
      sceneTimestamps: params.sceneTimestamps || undefined,
      model: params.model || undefined,
    });
  },

  /**
   * Small API 1.5 — Generate Video Metadata & SEO
   * POST /api/studio/video-metadata
   */
  async generateVideoMetadata(params: {
    category?: string;
    topic?: string;
    fullScript?: string;
    title?: string;
    hook?: string;
    quote?: string;
    cta?: string;
    model?: string;
  }) {
    return post<{
      success: boolean;
      titles: Array<{ title: string; angle: string; viralityScore: number }>;
      titleList: string[];
      description: string;
      hashtags: {
        trending: string[];
        niche: string[];
        growth: string[];
        ai?: string[];
      };
      allHashtags: string[];
      tags: string[];
      categoryNiche?: string;
    }>('/api/studio/video-metadata', {
      category: params.category || 'Stoic Mindset & Discipline',
      topic: params.topic || params.category,
      fullScript: params.fullScript || undefined,
      title: params.title || undefined,
      hook: params.hook || undefined,
      quote: params.quote || undefined,
      cta: params.cta || undefined,
      model: params.model || undefined,
    });
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
   * Small API 2.1 — Synthesize Raw Broadcast Audio
   * POST /api/studio/voice-tts
   */
  async synthesizeVoiceAudio(params: {
    voiceName: string;
    text: string;
    speechStyle?: string;
    targetDurationSeconds?: number;
    model?: string;
  }) {
    return post<{
      success: boolean;
      voiceName: string;
      audioUrl: string;
      audioBase64?: string;
      rawDurationSeconds: number;
      sampleRate: number;
      channels: number;
      mimeType: string;
    }>('/api/studio/voice-tts', params);
  },

  /**
   * Small API 2.2 — Extract Word Timestamps
   * POST /api/studio/voice-timestamps
   */
  async extractWordTimestamps(params: {
    text: string;
    durationSeconds?: number;
    audioUrl?: string;
  }) {
    return post<{
      success: boolean;
      totalWords: number;
      wordTimestamps: Array<{ word: string; start: number; end: number; emphasis: boolean; highlightColor?: string }>;
    }>('/api/studio/voice-timestamps', params);
  },

  /**
   * Small API 2.3 — Align Timeline to Voice Audio
   * POST /api/studio/voice-align-timeline
   */
  async alignTimelineToVoice(params: {
    subtitles?: Array<Record<string, unknown>>;
    scenes?: Array<Record<string, unknown>>;
    wordTimestamps: Array<{ word: string; start: number; end: number; emphasis: boolean }>;
    actualDurationSeconds: number;
  }) {
    return post<{
      success: boolean;
      totalDurationSeconds: number;
      alignedSubtitles: Array<Record<string, unknown>>;
      alignedScenes: Array<Record<string, unknown>>;
    }>('/api/studio/voice-align-timeline', params);
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

  /**
   * Small API 3.1 — Resolve Stock Videos
   * POST /api/studio/media-resolve-video
   */
  async resolveStockVideos(params: {
    queries: Array<{
      sceneNumber?: number;
      searchQuery: string;
      fallbackQueries?: string[];
      negativeTerms?: string[];
      duration?: number;
    }>;
    aspectRatio?: string;
  }) {
    return post<{
      success: boolean;
      results: Array<{
        sceneNumber: number;
        status: string;
        videoUrl?: string;
        previewUrl?: string;
        durationSeconds?: number;
        provider?: string;
      }>;
    }>('/api/studio/media-resolve-video', {
      queries: params.queries,
      aspectRatio: params.aspectRatio || '9:16',
    });
  },

  /**
   * Small API 3.2 — Resolve Stock Images / AI Frames
   * POST /api/studio/media-resolve-image
   */
  async resolveStockImages(params: {
    queries: Array<{
      sceneNumber?: number;
      imagePrompt?: string;
      visualQuery?: string;
      aspectRatio?: string;
    }>;
    aspectRatio?: string;
  }) {
    return post<{
      success: boolean;
      results: Array<{
        sceneNumber: number;
        status: string;
        imageUrl?: string;
        previewUrl?: string;
        durationSeconds?: number;
        provider?: string;
      }>;
    }>('/api/studio/media-resolve-image', {
      queries: params.queries,
      aspectRatio: params.aspectRatio || '9:16',
    });
  },

  /**
   * Small API 3.3 — Resolve Sound Effects
   * POST /api/studio/media-resolve-sfx
   */
  async resolveSoundEffects(params: {
    sfxEvents: Array<{
      time: number;
      sfxId: string;
      label: string;
      searchQuery?: string;
      volume?: number;
    }>;
  }) {
    return post<{
      success: boolean;
      resolvedEvents: Array<{
        time: number;
        sfxId: string;
        label: string;
        status: string;
        audioUrl?: string;
        volume?: number;
      }>;
    }>('/api/studio/media-resolve-sfx', params);
  },

  /**
   * Small API 3.4 — Resolve Music Track
   * POST /api/studio/media-resolve-music
   */
  async resolveMusicTrack(params: {
    genre?: string;
    bpm?: number;
    mood?: string;
  }) {
    return post<{
      success: boolean;
      track: {
        trackId: string;
        title: string;
        genre: string;
        bpm: number;
        audioUrl: string;
        durationSeconds: number;
      } | null;
    }>('/api/studio/media-resolve-music', {
      genre: params.genre || 'Drift Phonk',
      bpm: params.bpm || 132,
      mood: params.mood || 'dark aggressive motivational',
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

  /**
   * Small API 4.1 — Chunk Subtitles by Words
   * POST /api/studio/captions-chunking
   */
  async chunkSubtitlesByWords(params: {
    wordTimestamps: Array<{ word: string; start: number; end: number; emphasis?: boolean }>;
    maxWordsPerChunk?: number;
  }) {
    return post<{
      success: boolean;
      chunks: Array<{
        segmentIndex: number;
        start: number;
        end: number;
        duration: number;
        text: string;
        words: Array<{ word: string; start: number; end: number; emphasis: boolean }>;
      }>;
    }>('/api/studio/captions-chunking', {
      wordTimestamps: params.wordTimestamps,
      maxWordsPerChunk: params.maxWordsPerChunk || 4,
    });
  },

  /**
   * Small API 4.2 — Style Caption Segments & Highlight Words
   * POST /api/studio/captions-highlighting
   */
  async styleCaptionSegments(params: {
    chunks: Array<Record<string, unknown>>;
    stylePreset?: string;
    highlightColor?: string;
  }) {
    return post<{
      success: boolean;
      styledSegments: Array<{
        segmentIndex: number;
        start: number;
        end: number;
        duration: number;
        text: string;
        captionPresetClass: string;
        captionPresetColor: string;
        words: Array<{ word: string; start: number; end: number; emphasis: boolean }>;
      }>;
    }>('/api/studio/captions-highlighting', {
      chunks: params.chunks,
      stylePreset: params.stylePreset || 'sub-hormozi',
      highlightColor: params.highlightColor || '#FACC15',
    });
  },

  /**
   * Small API 4.3 — Export Captions to SubRip (.SRT)
   * POST /api/studio/captions-export-srt
   */
  async exportCaptionsSrt(params: {
    segments: Array<{
      start: number;
      end: number;
      text: string;
    }>;
  }) {
    return post<{
      success: boolean;
      format: 'srt';
      content: string;
    }>('/api/studio/captions-export-srt', params);
  },

  /**
   * Small API 4.4 — Export Captions to WebVTT (.VTT)
   * POST /api/studio/captions-export-vtt
   */
  async exportCaptionsVtt(params: {
    segments: Array<{
      start: number;
      end: number;
      text: string;
    }>;
  }) {
    return post<{
      success: boolean;
      format: 'vtt';
      content: string;
    }>('/api/studio/captions-export-vtt', params);
  },
};
