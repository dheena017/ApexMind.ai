import { alignAudioVisualCuts } from '../utils/cutSyncEngine';
/**
 * frontend/src/features/workspace/hooks/useStudioPipeline.ts
 *
 * Custom hook that orchestrates the 4-stage ApexMind Studio pipeline:
 *
 *   Stage 1 → POST /api/studio/generate-script   (AI Script + Storyboard)
 *   Stage 2 → POST /api/studio/synthesize-voice  (Gemini TTS Voiceover)
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
  [key: string]: any;
}

export interface VoiceStageResult {
  audioUrl: string;
  durationSeconds: number;
  mimeType: string;
  voiceName: string;
  wordTimestamps: any[];
  alignedStoryboard?: any[];
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

  /** Run the full 4-stage pipeline sequentially */
  const runPipeline = useCallback(
    async (params: RunPipelineParams): Promise<StudioPipelineResult | null> => {
      if (isRunning) return null;
      setIsRunning(true);
      setResult({ script: null, voice: null, media: null, captions: null });

      const pipelineResult: StudioPipelineResult = {
        script: null,
        voice: null,
        media: null,
        captions: null,
      };

      try {
        // ── Stage 1: AI Script Generation ─────────────────────────────────
        setStage('script', 5, 'Generating AI Script & Storyboard…');
        consoleLogger.info('Studio', '[Pipeline] Stage 1 → /api/studio/generate-script');

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
        });

        pipelineResult.script = scriptData;
        setResult((prev) => ({ ...prev, script: scriptData }));
        setStage('script', 25, `Script ready: "${scriptData.title}"`);

        toast.success('Script Generated!', { description: scriptData.title });
        addWorkspaceNotification({
          title: 'AI Script Generated',
          message: `"${scriptData.title}" with ${scriptData.storyboard?.length ?? 0} scenes`,
          category: 'script',
          type: 'ai',
          targetPane: 'editor',
          actionLabel: 'Review Script',
        });

        const storyboard: any[] = scriptData.storyboard || [];
        const voiceName = params.voiceName || scriptData.recommendedVoice || 'Fenrir';

        // ── Stages 2 + 3 run in parallel (voice synth + media resolve) ────
        setStage('voice', 30, 'Synthesizing Voiceover & Resolving Media…');
        consoleLogger.info('Studio', '[Pipeline] Stage 2+3 → voice + media (parallel)');

        const [voiceResult, mediaResult] = await Promise.allSettled([
          // Stage 2: Voice synthesis
          studioApi.synthesizeVoice({
            voiceName,
            storyboard: storyboard.map((s: any) => ({
              sceneNumber: s.sceneNumber,
              subtitleText: s.subtitleText || '',
              start: s.start,
              duration: s.duration,
            })),
            model: params.model,
            speechStyle: scriptData.speechStyle,
          }),

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

        // ── Voice Audio Master Clock: Dynamic Acoustic Speech & Syllable Alignment ──
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
          consoleLogger.info('Studio', `[Pipeline] Locked ${resolvedStoryboard.length} scenes to acoustic speech audio pauses (duration: ${durationSeconds}s)`);
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
            consoleLogger.info('Studio', `[Pipeline] Scaled ${resolvedStoryboard.length} storyboard scenes to match audio duration: ${durationSeconds}s`);
          }
        }

        setStage('captions', 75, 'Generating Captions…');

        // ── Stage 4: Caption Generation ────────────────────────────────────
        consoleLogger.info('Studio', '[Pipeline] Stage 4 → /api/studio/generate-captions');

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
          consoleLogger.success(
            'Studio',
            `[Pipeline] Stage 4 done | segments=${captionsResult.segments.length} words=${captionsResult.totalWords}`
          );
        } catch (captionErr) {
          consoleLogger.warn('Studio', `[Pipeline] Stage 4 failed: ${captionErr}`);
        }

        // ── AI Audio-Visual Cut Sync: Align Cuts to Voice Pauses & Music Beat ──
        const bpm = scriptData.soundDesign?.bpm || 140;
        const sfxDrops = (scriptData.soundDesign?.sfxEvents || [])
          .map((e: any) => e.time)
          .filter((t: any) => typeof t === 'number' && t > 0);
        
        try {
          const cutSynced = alignAudioVisualCuts({
            storyboard: resolvedStoryboard,
            totalDuration: durationSeconds > 0 ? durationSeconds : 30,
            bpm,
            sfxDrops,
          });
          resolvedStoryboard = resolvedStoryboard.map((s: any, idx: number) => {
            const synced = cutSynced[idx];
            return synced ? { ...s, start: synced.start, duration: synced.duration } : s;
          });
          consoleLogger.success('Studio', `[Pipeline] AI Cut Sync applied to ${resolvedStoryboard.length} scenes (BPM=${bpm})`);
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
              // Stage 2 — inject captions from Stage 4 directly as LocalClips
              captions: captionsResult?.timelineClips ?? [],
              duration: durationSeconds,
            },
          })
        );

        // If we got a real audio URL from Stage 2, fire it as a timeline-clip event too
        if (audioUrl) {
          window.dispatchEvent(
            new CustomEvent('workspace:add-timeline-clip', {
              detail: { type: 'voice', url: audioUrl, duration: durationSeconds, start: 0 },
            })
          );
        }

        addWorkspaceNotification({
          title: 'Studio Pipeline Complete',
          message: `${resolvedStoryboard.length} scenes with AI-choreographed animations & transitions, ${captionsResult?.timelineClips.length ?? 0} captions ready.`,
          category: 'timeline',
          type: 'ai',
          targetPane: 'canvas',
          actionLabel: 'Preview Video',
        });

        consoleLogger.success('Studio', '[Pipeline] All 4 stages complete ✓');
        return pipelineResult;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        consoleLogger.error('Studio', `[Pipeline] Fatal error: ${errMsg}`);
        setStage('error', 0, 'Pipeline failed', errMsg);
        toast.error('Studio pipeline failed', { description: errMsg });
        return null;
      } finally {
        setIsRunning(false);
      }
    },
    [isRunning, setStage]
  );

  /** Re-run only Stage 2 (voice) with current storyboard */
  const retryVoice = useCallback(
    async (voiceName: string, storyboard: any[], model?: string) => {
      setStage('voice', 0, 'Re-synthesizing Voiceover…');
      try {
        const voiceResult = await studioApi.synthesizeVoice({ voiceName, storyboard, model });
        setResult((prev) => ({ ...prev, voice: voiceResult }));
        setStage('done', 100, 'Voiceover updated');
        if (voiceResult.audioUrl) {
          window.dispatchEvent(
            new CustomEvent('workspace:add-timeline-clip', {
              detail: { type: 'voice', url: voiceResult.audioUrl, duration: voiceResult.durationSeconds, start: 0 },
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

  const reset = useCallback(() => {
    setProgress({ stage: 'idle', percent: 0, label: '', error: null });
    setResult({ script: null, voice: null, media: null, captions: null });
    setIsRunning(false);
  }, []);

  return {
    progress,
    result,
    isRunning,
    runPipeline,
    retryVoice,
    retryMedia,
    retryCaptions,
    reset,
  };
}

