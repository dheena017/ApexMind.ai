/**
 * frontend/src/features/workspace/hooks/useScriptSettings.ts
 *
 * Dedicated hook for Script Generation settings (Milestone 5).
 */

import { useState, useCallback } from 'react';
import { GenerationProfile, ScriptGenerationSettings } from '../types/script';
import { DEFAULT_SCRIPT_MODEL } from '@/src/shared/aiModels';

export const DEFAULT_SCRIPT_SETTINGS: ScriptGenerationSettings = {
  prompt: '',
  category: 'Nature & Stoic Solitude',
  targetLength: '30 seconds',
  aspectRatio: '9:16',
  generationProfile: 'motivational_reel',
  model: DEFAULT_SCRIPT_MODEL,
  voice: 'Fenrir',
  tone: 'authoritative',
  visualStyle: 'dark_cinematic',
  subtitleStyle: 'hormozi',
  musicMood: 'orchestral',
};

export function useScriptSettings(initial: Partial<ScriptGenerationSettings> = {}) {
  const [settings, setSettings] = useState<ScriptGenerationSettings>({
    ...DEFAULT_SCRIPT_SETTINGS,
    ...initial,
  });

  const updateSettings = useCallback((updates: Partial<ScriptGenerationSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const setPrompt = useCallback((prompt: string) => updateSettings({ prompt }), [updateSettings]);
  const setCategory = useCallback((category: string) => updateSettings({ category }), [updateSettings]);
  const setTargetLength = useCallback((targetLength: string) => updateSettings({ targetLength }), [updateSettings]);
  const setAspectRatio = useCallback((aspectRatio: ScriptGenerationSettings['aspectRatio']) => updateSettings({ aspectRatio }), [updateSettings]);
  const setGenerationProfile = useCallback((generationProfile: GenerationProfile) => updateSettings({ generationProfile }), [updateSettings]);
  const setModel = useCallback((model: string) => updateSettings({ model }), [updateSettings]);
  const setVoice = useCallback((voice: string) => updateSettings({ voice }), [updateSettings]);
  const setTone = useCallback((tone: string) => updateSettings({ tone }), [updateSettings]);
  const setVisualStyle = useCallback((visualStyle: string) => updateSettings({ visualStyle }), [updateSettings]);
  const setSubtitleStyle = useCallback((subtitleStyle: string) => updateSettings({ subtitleStyle }), [updateSettings]);
  const setMusicMood = useCallback((musicMood: string) => updateSettings({ musicMood }), [updateSettings]);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SCRIPT_SETTINGS);
  }, []);

  return {
    settings,
    updateSettings,
    setPrompt,
    setCategory,
    setTargetLength,
    setAspectRatio,
    setGenerationProfile,
    setModel,
    setVoice,
    setTone,
    setVisualStyle,
    setSubtitleStyle,
    setMusicMood,
    resetSettings,
  };
}

