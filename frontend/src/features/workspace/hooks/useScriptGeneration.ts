/**
 * frontend/src/features/workspace/hooks/useScriptGeneration.ts
 *
 * Dedicated hook for standalone Stage 1 Script Generation execution (Milestone 5).
 */

import { useState, useCallback, useRef } from 'react';
import { studioApi, GenerateScriptParams } from '../api/studioApi';
import { ScriptStageResult } from './useStudioPipeline';
import { ScriptGenerationSettings } from '../types/script';

export interface ScriptGenerationState {
  isGenerating: boolean;
  progressPercent: number;
  stageLabel: string;
  error: string | null;
  jobId: string | null;
}

export function useScriptGeneration() {
  const [state, setState] = useState<ScriptGenerationState>({
    isGenerating: false,
    progressPercent: 0,
    stageLabel: '',
    error: null,
    jobId: null,
  });

  const abortPollingRef = useRef<boolean>(false);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Execute Stage 1 script generation synchronously.
   */
  const generateScriptSync = useCallback(
    async (settings: ScriptGenerationSettings): Promise<ScriptStageResult> => {
      setState({
        isGenerating: true,
        progressPercent: 20,
        stageLabel: 'Constructing narrative prompts...',
        error: null,
        jobId: null,
      });

      try {
        const params: GenerateScriptParams = {
          category: settings.category,
          topic: settings.prompt || settings.category,
          userPrompt: settings.prompt || undefined,
          tone: settings.tone,
          length: settings.targetLength,
          model: settings.model,
          aspectRatio: settings.aspectRatio,
          voiceName: settings.voice,
          generationProfile: settings.generationProfile,
          audioMood: settings.musicMood,
          visualTheme: settings.visualStyle,
          captionStylePreset: settings.subtitleStyle,
        };

        setState((prev) => ({
          ...prev,
          progressPercent: 50,
          stageLabel: 'Calling Gemini Script Engine...',
        }));

        const result = await studioApi.generateScript(params);

        setState({
          isGenerating: false,
          progressPercent: 100,
          stageLabel: 'Script generated successfully!',
          error: null,
          jobId: null,
        });

        return result;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Script generation failed.';
        setState({
          isGenerating: false,
          progressPercent: 0,
          stageLabel: '',
          error: errorMsg,
          jobId: null,
        });
        throw err;
      }
    },
    []
  );

  /**
   * Execute Stage 1 script generation asynchronously with durable background job polling.
   */
  const generateScriptAsyncWithPolling = useCallback(
    async (
      settings: ScriptGenerationSettings,
      onProgress?: (percent: number, message: string) => void
    ): Promise<ScriptStageResult> => {
      abortPollingRef.current = false;
      setState({
        isGenerating: true,
        progressPercent: 10,
        stageLabel: 'Submitting job to queue...',
        error: null,
        jobId: null,
      });

      try {
        const params: GenerateScriptParams = {
          category: settings.category,
          topic: settings.prompt || settings.category,
          userPrompt: settings.prompt || undefined,
          tone: settings.tone,
          length: settings.targetLength,
          model: settings.model,
          aspectRatio: settings.aspectRatio,
          voiceName: settings.voice,
          generationProfile: settings.generationProfile,
          audioMood: settings.musicMood,
          visualTheme: settings.visualStyle,
          captionStylePreset: settings.subtitleStyle,
        };

        const jobResponse = await studioApi.generateScriptAsync(params);
        const currentJobId = jobResponse.jobId;

        setState((prev) => ({
          ...prev,
          jobId: currentJobId,
          progressPercent: 20,
          stageLabel: 'Job queued, awaiting execution...',
        }));

        // Poll job status until COMPLETED or FAILED
        let attempts = 0;
        const maxAttempts = 120; // Up to 2 minutes of polling

        while (attempts < maxAttempts) {
          if (abortPollingRef.current) {
            await studioApi.cancelJob(currentJobId).catch(() => {});
            throw new Error('Generation cancelled by user.');
          }

          await new Promise((resolve) => setTimeout(resolve, 1000));
          attempts++;

          const jobStatus = await studioApi.getJobStatus(currentJobId);

          const pct = jobStatus.progressPercent || Math.min(95, 20 + attempts * 2);
          const msg = jobStatus.currentStageMessage || `Generating script... (${pct}%)`;

          setState((prev) => ({
            ...prev,
            progressPercent: pct,
            stageLabel: msg,
          }));
          onProgress?.(pct, msg);

          if (jobStatus.status === 'completed' && jobStatus.result) {
            setState({
              isGenerating: false,
              progressPercent: 100,
              stageLabel: 'Completed!',
              error: null,
              jobId: currentJobId,
            });
            return (jobStatus.result as unknown) as ScriptStageResult;
          }

          if (jobStatus.status === 'failed' || jobStatus.status === 'cancelled') {
            throw new Error(jobStatus.errorMessage || `Job ${jobStatus.status}`);
          }
        }

        throw new Error('Script generation job timed out.');
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Async script generation failed.';
        setState({
          isGenerating: false,
          progressPercent: 0,
          stageLabel: '',
          error: errorMsg,
          jobId: null,
        });
        throw err;
      }
    },
    []
  );

  const cancelGeneration = useCallback(async () => {
    abortPollingRef.current = true;
    if (state.jobId) {
      try {
        await studioApi.cancelJob(state.jobId);
      } catch {}
    }
    setState((prev) => ({
      ...prev,
      isGenerating: false,
      stageLabel: 'Cancelled',
    }));
  }, [state.jobId]);

  return {
    ...state,
    clearError,
    generateScriptSync,
    generateScriptAsyncWithPolling,
    cancelGeneration,
  };
}
