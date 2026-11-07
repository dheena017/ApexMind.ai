/**
 * frontend/src/features/workspace/context/WorkspaceContext.tsx
 *
 * Unified Workspace Context providing decoupled state for Script Creator, Script Editor,
 * and AI Generation Engine (Milestone 5).
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { ScriptGenerationSettings, GenerationProfile } from '../types/script';
import { GeneratedScript } from '../types';
import { useScriptSettings, DEFAULT_SCRIPT_SETTINGS } from '../hooks/useScriptSettings';
import { useScriptGeneration } from '../hooks/useScriptGeneration';

export type StudioActivePane = 'creator' | 'editor';

interface WorkspaceContextValue {
  // Settings Store
  settings: ScriptGenerationSettings;
  updateSettings: (updates: Partial<ScriptGenerationSettings>) => void;
  setPrompt: (prompt: string) => void;
  setCategory: (category: string) => void;
  setTargetLength: (length: string) => void;
  setAspectRatio: (ratio: ScriptGenerationSettings['aspectRatio']) => void;
  setGenerationProfile: (profile: GenerationProfile) => void;
  setModel: (model: string) => void;
  setVoice: (voice: string) => void;
  setTone: (tone: string) => void;
  setVisualStyle: (style: string) => void;
  setSubtitleStyle: (style: string) => void;
  setMusicMood: (mood: string) => void;
  resetSettings: () => void;

  // Generation Store
  isGenerating: boolean;
  progressPercent: number;
  stageLabel: string;
  generationError: string | null;
  clearGenerationError: () => void;
  generateScript: () => Promise<GeneratedScript>;
  cancelGeneration: () => Promise<void>;

  // Script Editor Store
  currentScript: GeneratedScript | null;
  setCurrentScript: (script: GeneratedScript | null) => void;
  updateCurrentScript: (updates: Partial<GeneratedScript>) => void;

  // Navigation
  activeStudioPane: StudioActivePane;
  setActiveStudioPane: (pane: StudioActivePane) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export interface WorkspaceProviderProps {
  children: React.ReactNode;
  initialScript?: GeneratedScript | null;
  onScriptGenerated?: (script: GeneratedScript) => void;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({
  children,
  initialScript = null,
  onScriptGenerated,
}) => {
  const scriptSettings = useScriptSettings(DEFAULT_SCRIPT_SETTINGS);
  const scriptGeneration = useScriptGeneration();

  const [currentScript, setCurrentScript] = useState<GeneratedScript | null>(initialScript);
  const [activeStudioPane, setActiveStudioPane] = useState<StudioActivePane>(
    initialScript ? 'editor' : 'creator'
  );

  const updateCurrentScript = useCallback((updates: Partial<GeneratedScript>) => {
    setCurrentScript((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const handleGenerateScript = useCallback(async (): Promise<GeneratedScript> => {
    const stageResult = await scriptGeneration.generateScriptSync(scriptSettings.settings);
    const generated: GeneratedScript = {
      title: stageResult.title,
      hook: stageResult.hook,
      quote: stageResult.quote,
      cta: stageResult.cta,
      speechStyle: stageResult.speechStyle || '',
      visualTheme: stageResult.visualTheme || '',
      recommendedVoice: stageResult.recommendedVoice || 'Fenrir',
      tags: stageResult.tags || [],
      hashtags: stageResult.hashtags || [],
      subtitles: stageResult.subtitles || [],
      shotPacing: stageResult.shotPacing,
      transitionStyle: stageResult.transitionStyle,
      subtitleMotion: stageResult.subtitleMotion,
      cameraMovement: stageResult.cameraMovement,
      scenes: stageResult.scenes as any,
    };

    setCurrentScript(generated);
    setActiveStudioPane('editor');
    onScriptGenerated?.(generated);
    return generated;
  }, [scriptGeneration, scriptSettings.settings, onScriptGenerated]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      settings: scriptSettings.settings,
      updateSettings: scriptSettings.updateSettings,
      setPrompt: scriptSettings.setPrompt,
      setCategory: scriptSettings.setCategory,
      setTargetLength: scriptSettings.setTargetLength,
      setAspectRatio: scriptSettings.setAspectRatio,
      setGenerationProfile: scriptSettings.setGenerationProfile,
      setModel: scriptSettings.setModel,
      setVoice: scriptSettings.setVoice,
      setTone: scriptSettings.setTone,
      setVisualStyle: scriptSettings.setVisualStyle,
      setSubtitleStyle: scriptSettings.setSubtitleStyle,
      setMusicMood: scriptSettings.setMusicMood,
      resetSettings: scriptSettings.resetSettings,

      isGenerating: scriptGeneration.isGenerating,
      progressPercent: scriptGeneration.progressPercent,
      stageLabel: scriptGeneration.stageLabel,
      generationError: scriptGeneration.error,
      clearGenerationError: scriptGeneration.clearError,
      generateScript: handleGenerateScript,
      cancelGeneration: scriptGeneration.cancelGeneration,

      currentScript,
      setCurrentScript,
      updateCurrentScript,

      activeStudioPane,
      setActiveStudioPane,
    }),
    [scriptSettings, scriptGeneration, handleGenerateScript, currentScript, updateCurrentScript, activeStudioPane]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return ctx;
}
