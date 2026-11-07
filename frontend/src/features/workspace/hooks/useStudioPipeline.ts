import { alignAudioVisualCuts } from '../utils/cutSyncEngine';
/**
 * frontend/src/features/workspace/hooks/useStudioPipeline.ts
 *
 * Custom hook that orchestrates the 4-stage ApexMind Studio pipeline:
 *
 *   Stage 1 → POST /api/studio/generate-script   (AI Script + Storyboard)
 *   Stage 2 → POST /api/studio/generate-voice    (Gemini TTS Voiceover)
 *   Stage 3 → POST /api/studio/resolve-media     (Stock Video/Image/SFX)
 *   Stage 4 → POST /api/studio/generate-captions (Word-level timed captions)
 *
 * Each stage is independently retryable. The hook fires a
 * 'workspace:set-timeline-storyboard' custom event after all stages complete
 * so the StudioTimelinePane populates automatically.
 */

import { useState, useCallback } from 'react';
import { studioApi } from '../api/studioApi';
import { consoleLogger } from '@/src/shared/utils/logger';
import { toast } from 'sonner';
import { addWorkspaceNotification } from '../utils/workspaceNotificationManager';
import { GenerationProfile } from '../types/script';

// ── Pipeline stage identifiers ─────────────────────────────────────────────

export type PipelineStage = 'idle' | 'script' | 'voice' | 'media' | 'captions' | 'done' | 'error';

export interface PipelineProgress {
  stage: PipelineStage;
  /** 0–100 overall progress percent */
  percent: number;
  label: string;
  error: string | null;
}

// ── Stage result shapes ─────────────────────────────────────────────────────

export interface ScriptStageResult {
  title: string;
  hook: string;
  quote: string;
  cta: string;
  hooks?: any[];
  soundDesign?: any;
  storyboard: any[];
  subtitles: any[];
  tags: string[];
  hashtags: string[];
  recommendedVoice?: string;
  aspectRatio?: string;
  musicTrack?: string;
  scenes?: any[];
  [key: string]: any;
}

export interface VoiceStageResult {
  audioUrl: string;
  durationSeconds: number;
  mimeType: string;
  voiceName: string;
  wordTimestamps: any[];
  alignedStoryboard?: any[];
  scriptVoiceData?: any;
}

export interface MediaStageResult {
  scenes: Array<{
    sceneNumber: number;
    status: string;
    media: { url: string; thumbnailUrl?: string; previewUrl?: string; duration?: number; provider?: string } | null;
  }>;
  sfxEvents: any[];
  background: any;
  resolvedCount: number;
  totalScenes: number;
}

export interface CaptionsStageResult {
  timelineClips: Array<{
    text: string;
    start: number;
    duration: number;
    captionPresetClass: string;
    captionPresetColor: string;
    words?: any[];
  }>;
  segments: any[];
  srtExport: string;
  vttExport: string;
  durationSeconds: number;
  totalWords: number;
}

export interface StudioPipelineResult {
  script: ScriptStageResult | null;
  voice: VoiceStageResult | null;
  media: MediaStageResult | null;
  captions: CaptionsStageResult | null;
}

// ── Hook input params ──────────────────────────────────────────────────────

export interface RunPipelineParams {
  category: string;
  topic?: string;
  userPrompt?: string;
  tone?: string;
  length?: string;
  model?: string;
  aspectRatio?: string;
  voiceName: string;
  musicTrackId?: string;
  captionStylePreset?: string;
  backdropId?: string;
  creativeContext?: Record<string, unknown>;
  availableAssets?: Record<string, unknown>;
  audioMood?: string;
  backgroundStyle?: string;
  textStyle?: string;
  videoStyle?: string;
  visualTheme?: string;
  motionStyle?: string;
  captionColor?: string;
  captionFontFamily?: string;
  generationProfile?: GenerationProfile;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useStudioPipeline() {
  const [progress, setProgress] = useState<PipelineProgress>({
    stage: 'idle',
    percent: 0,
    label: '',
    error: null,
  });
  const [result, setResult] = useState<StudioPipelineResult>({
    script: null,
    voice: null,
    media: null,
    captions: null,
  });
  const [isRunning, setIsRunning] = useState(false);

  const setStage = useCallback(
    (stage: PipelineStage, percent: number, label: string, error: string | null = null) => {
      setProgress({ stage, percent, label, error });
    },
    []
  );

  /** Run Stage 1 only and return script */
  const generateScriptOnly = useCallback(
    async (params: RunPipelineParams): Promise<ScriptStageResult | null> => {
      if (isRunning) return null;
      setIsRunning(true);
      setStage('script', 15, 'Generating AI Script & Storyboard…');

      try {
        const scriptData = await studioApi.generateScript({
          category: params.category,
          topic: params.topic,
          userPrompt: params.userPrompt,
          tone: params.tone,
          length: params.length,
          model: params.model,
          aspectRatio: params.aspectRatio,
          voiceName: params.voiceName,
          musicTrackId: params.musicTrackId,
          captionStylePreset: params.captionStylePreset,
          backdropId: params.backdropId,
          audioMood: params.audioMood,
          backgroundStyle: params.backgroundStyle,
          textStyle: params.textStyle,
          videoStyle: params.videoStyle,
          visualTheme: params.visualTheme,
          motionStyle: params.motionStyle,
          creativeContext: params.creativeContext,
          availableAssets: params.availableAssets,
          generationProfile: params.generationProfile || 'motivational_reel',
        });

        setResult((prev) => ({ ...prev, script: scriptData }));
        setStage('done', 100, `Script ready: "${scriptData.title}"`);
        toast.success('Script Generated!', { description: scriptData.title });
        return scriptData;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setStage('error', 0, 'Script generation failed', errMsg);
        toast.error('Script generation failed', { description: errMsg });
        return null;
      } finally {
        setIsRunning(false);
      }
    },
    [isRunning, setStage]
  );

  /** Execute Stages 2, 3, and 4 from an already approved script */
  const runStagesFromScript = useCallback(
    async (scriptData: ScriptStageResult, params: RunPipelineParams): Promise<StudioPipelineResult | null> => {
      if (isRunning) return null;
      setIsRunning(true);

      const pipelineResult: StudioPipelineResult = {
        script: scriptData,
        voice: null,
        media: null,
        captions: null,
      };

      try {
        const storyboard: any[] = scriptData.storyboard || [];
        const voiceName = params.voiceName || scriptData.recommendedVoice || 'Fenrir';

        // ── Stages 2 + 3 run in parallel (voice synth + media resolve) ────
        setStage('voice', 30, 'Synthesizing Voiceover & Resolving Media…');
        consoleLogger.info('Studio', '[Pipeline] Stage 2+3 → voice + media (parallel)');

        const [voiceResult, mediaResult] = await Promise.allSettled([
          // Stage 2: Voice generation (Script-based or inline storyboard fallback)
          (async () => {
            if (scriptData.scriptId) {
              try {
                const sv = await studioApi.generateScriptVoice({
                  scriptId: scriptData.scriptId,
                  voiceConfig: { voiceId: voiceName },
                });
                return {
                  audioUrl: sv.masterAudioUrl,
                  durationSeconds: sv.masterDuration,
                  mimeType: 'audio/wav',
                  voiceName,
                  wordTimestamps: [],
                  scriptVoiceData: sv,
                };
              } catch (voiceErr) {
                consoleLogger.warn('Studio', `Script voice failed, falling back to inline storyboard voice: ${voiceErr}`);
              }
            }
            return studioApi.generateVoice({
              voiceName,
              storyboard: storyboard.map((s: any) => ({
                sceneNumber: s.sceneNumber,
                subtitleText: s.subtitleText || '',
                start: s.start,
                duration: s.duration,
              })),
              model: params.model,
              speechStyle: scriptData.speechStyle,
              targetDurationSeconds: (() => {
                const m = String(params.length || '').match(/(\d+)/);
                return m ? parseInt(m[1], 10) : 30;
              })(),
            });
          })(),

          // Stage 3: Media resolution
          studioApi.resolveMedia({
            scenes: storyboard
              .filter((s: any) => !s.mediaUrl || s.mediaStatus === 'unresolved')
              .map((s: any) => ({
                sceneNumber: s.sceneNumber,
                mediaType: s.mediaType || 'video',
                visualQuery: s.visualQuery || s.subtitleText || 'cinematic landscape',
                googleSearchQuery: s.googleSearchQuery,
                fallbackQueries: s.fallbackQueries || [],
                durationSeconds: s.duration || 3.0,
              })),
            aspectRatio: params.aspectRatio || '9:16',
            sfxEvents: (scriptData.soundDesign?.sfxEvents || []).map((e: any) => ({
              time: e.time,
              sfxId: e.sfxId,
              label: e.label,
              searchQuery: e.label || 'whoosh impact',
            })),
            backdropId: params.backdropId,
            resolveBackground: true,
          }),
        ]);

        // Process voice result
        let audioUrl = '';
        let durationSeconds = 0;
        if (voiceResult.status === 'fulfilled') {
          pipelineResult.voice = voiceResult.value;
          audioUrl = voiceResult.value.audioUrl;
          durationSeconds = voiceResult.value.durationSeconds;
          setResult((prev) => ({ ...prev, voice: voiceResult.value }));
          consoleLogger.success('Studio', `[Pipeline] Stage 2 done | duration=${durationSeconds}s`);
        } else {
          consoleLogger.warn('Studio', `[Pipeline] Stage 2 failed: ${voiceResult.reason}`);
          toast.error('Voiceover synthesis failed', { description: String(voiceResult.reason) });
        }

        // Process media result — merge resolved URLs back into storyboard
        let resolvedStoryboard = [...storyboard];

        const requestedTargetSec = (() => {
          const m = String(params.length || '').match(/(\d+)/);
          return m ? parseInt(m[1], 10) : 30;
        })();
        if (durationSeconds <= 0) {
          const sbTotal = resolvedStoryboard.reduce((sum: number, s: any) => sum + (Number(s.duration) || 0), 0);
          durationSeconds = sbTotal > 0 ? parseFloat(sbTotal.toFixed(2)) : requestedTargetSec;
        }
        if (mediaResult.status === 'fulfilled') {
          pipelineResult.media = mediaResult.value;
          setResult((prev) => ({ ...prev, media: mediaResult.value }));

          const resolvedMap = new Map<number, any>();
          for (const s of mediaResult.value.scenes) {
            if (s.status === 'resolved' && s.media) resolvedMap.set(s.sceneNumber, s.media);
          }

          resolvedStoryboard = storyboard.map((s: any) => {
            const resolved = resolvedMap.get(s.sceneNumber);
            if (resolved) {
              return {
                ...s,
                mediaUrl: resolved.url,
                previewUrl: resolved.previewUrl || resolved.url,
                posterUrl: resolved.thumbnailUrl || resolved.previewUrl || '',
                thumbnailUrl: resolved.thumbnailUrl || '',
                mediaStatus: 'resolved',
                mediaName: resolved.title || s.mediaName,
              };
            }
            return s;
          });

          consoleLogger.success(
            'Studio',
            `[Pipeline] Stage 3 done | resolved=${mediaResult.value.resolvedCount}/${mediaResult.value.totalScenes}`
          );
        } else {
          consoleLogger.warn('Studio', `[Pipeline] Stage 3 failed: ${mediaResult.reason}`);
        }

        // Voice Master Clock Alignment
        const voiceVal = voiceResult.status === 'fulfilled' ? voiceResult.value : null;
        if (voiceVal?.alignedStoryboard && voiceVal.alignedStoryboard.length > 0) {
          const alignedMap = new Map<number, any>();
          for (const s of voiceVal.alignedStoryboard) {
            alignedMap.set(s.sceneNumber, s);
          }
          resolvedStoryboard = resolvedStoryboard.map((s: any) => {
            const aligned = alignedMap.get(s.sceneNumber);
            if (aligned) {
              return {
                ...s,
                start: aligned.start,
                duration: aligned.duration,
                words: aligned.words && aligned.words.length > 0 ? aligned.words : s.words,
              };
            }
            return s;
          });
        } else if (durationSeconds > 0 && resolvedStoryboard.length > 0) {
          const totalSbDuration = resolvedStoryboard.reduce(
            (sum, s) => sum + (Number(s.duration) || 3.0),
            0
          );
          if (totalSbDuration > 0) {
            let runningStart = 0;
            resolvedStoryboard = resolvedStoryboard.map((s, idx) => {
              const isLast = idx === resolvedStoryboard.length - 1;
              const origDur = Number(s.duration) || 3.0;
              const proportionalDur = isLast
                ? Math.max(0.4, parseFloat((durationSeconds - runningStart).toFixed(2)))
                : Math.max(0.4, parseFloat(((origDur / totalSbDuration) * durationSeconds).toFixed(2)));
              const start = parseFloat(runningStart.toFixed(2));
              runningStart = parseFloat((runningStart + proportionalDur).toFixed(2));
              return {
                ...s,
                start,
                duration: proportionalDur,
              };
            });
          }
        }

        setStage('captions', 75, 'Generating Captions…');

        // ── Stage 4: Caption Generation ────────────────────────────────────
        const captionScenes = resolvedStoryboard
          .filter((s: any) => s.subtitleText)
          .map((s: any) => ({
            sceneNumber: s.sceneNumber,
            subtitleText: s.subtitleText,
            start: s.start,
            duration: s.duration,
            words: s.words,
            captionPresetClass: s.captionPresetClass || params.captionStylePreset,
            captionPresetColor: s.captionPresetColor || params.captionColor,
          }));

        let captionsResult: CaptionsStageResult | null = null;
        try {
          captionsResult = await studioApi.generateCaptions({
            storyboardScenes: captionScenes.length > 0 ? captionScenes : undefined,
            durationSeconds: durationSeconds > 0 ? durationSeconds : 30,
            stylePreset: params.captionStylePreset || 'sub-hormozi',
            captionColor: params.captionColor || '#FACC15',
            captionFontFamily: params.captionFontFamily || 'Impact, sans-serif',
          });
          pipelineResult.captions = captionsResult;
          setResult((prev) => ({ ...prev, captions: captionsResult }));
        } catch (captionErr) {
          consoleLogger.warn('Studio', `[Pipeline] Stage 4 failed: ${captionErr}`);
        }

        // ── AI Audio-Visual Cut Sync ──
        const effectiveDuration = durationSeconds >= requestedTargetSec * 0.85 ? durationSeconds : requestedTargetSec;
        const bpm = scriptData.soundDesign?.bpm || 140;
        const sfxDrops = (scriptData.soundDesign?.sfxEvents || [])
          .map((e: any) => e.time)
          .filter((t: any) => typeof t === 'number' && t > 0);

        try {
          const cutSynced = alignAudioVisualCuts({
            storyboard: resolvedStoryboard,
            totalDuration: effectiveDuration,
            bpm,
            sfxDrops,
          });
          resolvedStoryboard = resolvedStoryboard.map((s: any, idx: number) => {
            const synced = cutSynced[idx];
            return synced ? { ...s, start: synced.start, duration: synced.duration } : s;
          });
        } catch (syncErr) {
          consoleLogger.warn('Studio', `[Pipeline] Cut sync notice: ${syncErr}`);
        }

        // ── Populate Timeline ──────────────────────────────────────────────
        setStage('done', 100, 'Timeline Ready with AI Motion & Transitions!');

        window.dispatchEvent(
          new CustomEvent('workspace:set-timeline-storyboard', {
            detail: {
              storyboard: resolvedStoryboard,
              musicTrack: scriptData.soundDesign?.soundtrackTrackId || scriptData.musicTrack,
              soundDesign: scriptData.soundDesign,
              hooks: scriptData.hooks,
              captions: captionsResult?.timelineClips ?? [],
              duration: effectiveDuration,
              audioUrl,
              audioDuration: durationSeconds,
            },
          })
        );

        addWorkspaceNotification({
          title: 'Studio Pipeline Complete',
          message: `${resolvedStoryboard.length} scenes with AI-choreographed animations & transitions, ${captionsResult?.timelineClips.length ?? 0} captions ready.`,
          category: 'timeline',
          type: 'ai',
          targetPane: 'canvas',
          actionLabel: 'Preview Video',
        });

        return pipelineResult;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setStage('error', 0, 'Pipeline failed', errMsg);
        toast.error('Studio pipeline failed', { description: errMsg });
        return null;
      } finally {
        setIsRunning(false);
      }
    },
    [isRunning, setStage]
  );

  /** Run the full 4-stage pipeline sequentially (1-click generation) */
  const runPipeline = useCallback(
    async (params: RunPipelineParams): Promise<StudioPipelineResult | null> => {
      if (isRunning) return null;
      const scriptData = await generateScriptOnly(params);
      if (!scriptData) return null;
      return runStagesFromScript(scriptData, params);
    },
    [generateScriptOnly, runStagesFromScript, isRunning]
  );

  /** Re-run only Stage 2 (voice) with current storyboard */
  const retryVoice = useCallback(
    async (voiceName: string, storyboard: any[], model?: string) => {
      setStage('voice', 0, 'Re-synthesizing Voiceover…');
      try {
        const voiceResult = await studioApi.generateVoice({ voiceName, storyboard, model });
        setResult((prev) => ({ ...prev, voice: voiceResult }));
        setStage('done', 100, 'Voiceover updated');
        if (voiceResult.audioUrl) {
          window.dispatchEvent(
            new CustomEvent('workspace:add-timeline-clip', {
              detail: {
                type: 'voice',
                url: voiceResult.audioUrl,
                duration: voiceResult.durationSeconds,
                start: 0,
                replaceExisting: true,
              },
            })
          );
        }
        return voiceResult;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setStage('error', 0, 'Voice retry failed', msg);
        toast.error('Voice retry failed', { description: msg });
        return null;
      }
    },
    [setStage]
  );

  /** Re-run only Stage 3 (media) for specific scenes */
  const retryMedia = useCallback(
    async (scenes: any[], aspectRatio = '9:16') => {
      setStage('media', 0, 'Re-resolving Media…');
      try {
        const mediaResult = await studioApi.resolveMedia({ scenes, aspectRatio });
        setResult((prev) => ({ ...prev, media: mediaResult }));
        setStage('done', 100, 'Media updated');
        return mediaResult;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setStage('error', 0, 'Media retry failed', msg);
        return null;
      }
    },
    [setStage]
  );

  /** Re-run only Stage 4 (captions) */
  const retryCaptions = useCallback(
    async (scenes: any[], durationSeconds: number, stylePreset?: string) => {
      setStage('captions', 0, 'Regenerating Captions…');
      try {
        const captionsResult = await studioApi.generateCaptions({
          storyboardScenes: scenes,
          durationSeconds,
          stylePreset: stylePreset || 'sub-hormozi',
        });
        setResult((prev) => ({ ...prev, captions: captionsResult }));
        setStage('done', 100, 'Captions updated');
        return captionsResult;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setStage('error', 0, 'Captions retry failed', msg);
        return null;
      }
    },
    [setStage]
  );

  const regenerateSceneVoice = useCallback(
    async (
      scriptId: string,
      sceneId: string,
      options?: { provider?: string; voiceId?: string; preset?: string; speed?: number; pitch?: number }
    ) => {
      try {
        const update = await studioApi.regenerateSceneVoice(scriptId, sceneId, options);
        toast.success(`Scene ${sceneId} narration regenerated`);
        return update;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(`Scene voice regeneration failed: ${msg}`);
        throw err;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setProgress({ stage: 'idle', percent: 0, label: '', error: null });
    setResult({ script: null, voice: null, media: null, captions: null });
    setIsRunning(false);
  }, []);

  return {
    progress,
    result,
    isRunning,
    generateScriptOnly,
    runStagesFromScript,
    runPipeline,
    retryVoice,
    retryMedia,
    retryCaptions,
    regenerateSceneVoice,
    reset,
  };
}
