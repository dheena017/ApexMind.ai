import { useEffect, useState } from 'react';
import {
  DEFAULT_SCRIPT_MODEL,
  fetchAvailableScriptModels,
  type ScriptModelOption,
} from '@/src/shared/aiModels';

const FALLBACK_SCRIPT_MODELS: ScriptModelOption[] = [
  { value: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash' },
  { value: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
  { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro Preview' },
];

export function useAvailableScriptModels() {
  const [models, setModels] = useState<ScriptModelOption[]>(FALLBACK_SCRIPT_MODELS);
  const [defaultModel, setDefaultModel] = useState(DEFAULT_SCRIPT_MODEL || 'gemini-3.8-flash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchAvailableScriptModels()
      .then((result) => {
        if (!active) return;
        setModels(result.options);
        setDefaultModel(result.defaultModel);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : 'Could not load available Gemini models.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { models, defaultModel, loading, error };
}
