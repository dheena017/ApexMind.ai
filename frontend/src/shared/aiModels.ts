import { apiUrl } from '@/src/shared/utils/api';

export interface ScriptModelOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  category?: 'flash' | 'pro';
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  quota?: {
    free?: { rpm: number; tpm: number; rpd: number | string };
    paid?: { rpm: number; tpm: number; rpd: number | string };
    description?: string;
  };
}

export interface QuotaItem {
  label: string;
  resetsIn: string;
  percentLeft: number;
  used?: number;
  limit?: number;
  unit?: string;
}

export interface ModelQuotaGroup {
  groupName: string;
  items: QuotaItem[];
}

export interface AiUsageResponse {
  activeModel?: string;
  category?: 'flash' | 'pro';
  limits?: {
    rpm: number;
    tpm: number;
    rpd: number | string;
  };
  groups: ModelQuotaGroup[];
  summary: {
    percentLeft: number;
    requestsRemainingToday?: number;
    requestsLimitDaily?: number;
    requestsThisMinute?: number;
    tokensConsumed: number;
  };
}

export interface AiOverviewResponse {
  success: boolean;
  models: Array<{
    id: string;
    name: string;
    category?: 'flash' | 'pro';
    description?: string;
    inputTokenLimit?: number;
    outputTokenLimit?: number;
    quota?: any;
  }>;
  defaultModel: string;
  usage: AiUsageResponse;
}

interface ScriptModelsResponse {
  models: Array<{
    id: string;
    name: string;
    category?: 'flash' | 'pro';
    description?: string;
    inputTokenLimit?: number;
    outputTokenLimit?: number;
    quota?: any;
  }>;
  defaultModel: string;
}

export const DEFAULT_SCRIPT_MODEL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEFAULT_SCRIPT_MODEL?.trim()) || '';
export const DEFAULT_TTS_MODEL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEFAULT_TTS_MODEL?.trim()) || '';
export const DEFAULT_SCRIPT_MODEL_LABEL = DEFAULT_SCRIPT_MODEL || 'Gemini (auto-selected)';
export const DEFAULT_TTS_MODEL_LABEL = DEFAULT_TTS_MODEL || 'Gemini TTS (auto-selected)';

let cachedScriptModels: { options: ScriptModelOption[]; defaultModel: string; expiresAt: number } | null = null;
let scriptModelsRequest: Promise<{ options: ScriptModelOption[]; defaultModel: string }> | null = null;

// ── SMALL API 1: Fetch Available AI Models ──────────────────────────────────
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

    const formatLimitNumber = (num?: number | string): string => {
      if (num === undefined || num === null) return '';
      if (typeof num === 'string') return num;
      if (num >= 1000000) return `${Math.round(num / 100000) / 10}M`;
      if (num >= 1000) return `${Math.round(num / 1000)}k`;
      return String(num);
    };

    const options: ScriptModelOption[] = data.models
      .filter((model) => typeof model.id === 'string' && typeof model.name === 'string')
      .map((model) => {
        const isPro = model.category === 'pro' || model.id.toLowerCase().includes('pro');
        const defaultDesc = isPro
          ? 'Deep reasoning, advanced logic & math'
          : 'High-speed multimodal script generation';

        const rpm = model.quota?.free?.rpm ?? (isPro ? 2 : 5);
        const tpm = model.quota?.free?.tpm ? `${formatLimitNumber(model.quota.free.tpm)} TPM` : (isPro ? '125k TPM' : '250k TPM');
        const rpd = model.quota?.free?.rpd ? `${model.quota.free.rpd} RPD` : (isPro ? '10 RPD' : '20 RPD');
        const rateLimitBadge = `${rpm} RPM`;
        const limitsText = `${rpm} RPM · ${tpm} · ${rpd}`;

        const rawDesc = model.description?.trim();
        const description = !rawDesc || rawDesc.toLowerCase() === model.name.toLowerCase()
          ? limitsText
          : `${rawDesc} (${limitsText})`;

        return {
          value: model.id,
          label: model.name,
          description,
          badge: rateLimitBadge,
          category: isPro ? 'pro' : 'flash',
          inputTokenLimit: model.inputTokenLimit,
          outputTokenLimit: model.outputTokenLimit,
          quota: model.quota,
        };
      });

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

// ── SMALL API 2: Fetch Live AI Usage & Quotas ──────────────────────────────
export async function fetchAiUsageSummary(): Promise<AiUsageResponse> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('apexmind_token') : null;
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(apiUrl('/api/ai/usage'), { headers, cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load AI usage: ${response.status}`);
  }
  return response.json();
}

// ── MAIN UNIFIED API: Fetch Models & Usage Together in Single Request ──────
export async function fetchAiOverview(): Promise<AiOverviewResponse> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('apexmind_token') : null;
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(apiUrl('/api/ai/overview'), { headers, cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load AI overview: ${response.status}`);
  }
  return response.json();
}
