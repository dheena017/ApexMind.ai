import { useEffect, useState } from 'react';
import {
  DEFAULT_SCRIPT_MODEL,
  fetchAvailableScriptModels,
  type ScriptModelOption,
} from '@/src/shared/aiModels';

export function useAvailableScriptModels() {
  const [models, setModels] = useState<ScriptModelOption[]>([]);
  const [defaultModel, setDefaultModel] = useState(DEFAULT_SCRIPT_MODEL);
  const [loading, setLoading] = useState(true);
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
