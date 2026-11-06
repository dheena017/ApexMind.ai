import { apiUrl } from '@/src/shared/utils/api';

export interface ScriptModelOption {
  value: string;
  label: string;
}

interface ScriptModelsResponse {
  models: Array<{ id: string; name: string }>;
  defaultModel: string;
}

export const DEFAULT_SCRIPT_MODEL = import.meta.env.VITE_DEFAULT_SCRIPT_MODEL?.trim() || '';
export const DEFAULT_TTS_MODEL = import.meta.env.VITE_DEFAULT_TTS_MODEL?.trim() || '';
export const DEFAULT_SCRIPT_MODEL_LABEL = DEFAULT_SCRIPT_MODEL || 'Gemini (auto-selected)';
export const DEFAULT_TTS_MODEL_LABEL = DEFAULT_TTS_MODEL || 'Gemini TTS (auto-selected)';

let cachedScriptModels: { options: ScriptModelOption[]; defaultModel: string; expiresAt: number } | null = null;
let scriptModelsRequest: Promise<{ options: ScriptModelOption[]; defaultModel: string }> | null = null;

export async function fetchAvailableScriptModels(
  forceRefresh = false,
): Promise<{ options: ScriptModelOption[]; defaultModel: string }> {
  if (!forceRefresh && cachedScriptModels && cachedScriptModels.expiresAt > Date.now()) {
    return cachedScriptModels;
  }
  if (scriptModelsRequest && !forceRefresh) return scriptModelsRequest;

  scriptModelsRequest = (async () => {
    const response = await fetch(apiUrl('/api/ai/models'), { cache: 'no-store' });
    const data = (await response.json().catch(() => ({}))) as Partial<ScriptModelsResponse> & {
      detail?: string;
    };
    if (!response.ok) {
      throw new Error(data.detail || `Could not load Gemini models (${response.status}).`);
    }
    if (!Array.isArray(data.models) || typeof data.defaultModel !== 'string') {
      throw new Error('The model service returned an invalid response.');
    }

    const options = data.models
      .filter((model) => typeof model.id === 'string' && typeof model.name === 'string')
      .map((model) => ({ value: model.id, label: model.name }));
    if (!options.length || !options.some((model) => model.value === data.defaultModel)) {
      throw new Error('The model service returned no usable text-generation models.');
    }

    const result = { options, defaultModel: data.defaultModel };
    cachedScriptModels = { ...result, expiresAt: Date.now() + 5 * 60 * 1000 };
    return result;
  })();

  try {
    return await scriptModelsRequest;
  } finally {
    scriptModelsRequest = null;
  }
}
