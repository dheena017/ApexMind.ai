/**
 * frontend/src/features/workspace/api/elementsApi.ts
 *
 * API client for the Studio Elements & Overlays Service.
 * Fetches dynamic vector icons, animated stickers, color emojis, viral badges,
 * progress scrubbers, callout shapes, and custom creator badges across 16 live providers.
 */

import { consoleLogger } from '@/src/shared/utils/logger';
import { apiUrl } from '@/src/shared/utils/api';

export interface VisualElementItem {
  id: string;
  name: string;
  category: string;
  provider?: string;
  type: string;
  previewUrl?: string;
  svgUrl?: string;
  label?: string;
  desc?: string;
  color?: string;
  symbol?: string;
  tags?: string[];
  aspectRatio?: string;
}

export interface ElementsSearchResponse {
  success: boolean;
  error?: string;
  page: number;
  pageSize: number;
  total: number;
  provider: string;
  category: string;
  categories: Array<{ id: string; label: string }>;
  providers: Record<string, boolean>;
  elements: VisualElementItem[];
}

export interface CreateCustomBadgeResponse {
  success: boolean;
  element: VisualElementItem;
}

export interface SearchElementsParams {
  query?: string;
  category?: string;
  provider?: string;
  page?: number;
  pageSize?: number;
}

export const elementsApi = {
  /**
   * Search visual elements, icons, emojis, stickers & badges across 16 live providers.
   * GET /api/studio/elements/search
   */
  async searchElements(params: SearchElementsParams = {}): Promise<ElementsSearchResponse> {
    const start = performance.now();
    const queryParams = new URLSearchParams();
    if (params.query) queryParams.set('query', params.query);
    if (params.category && params.category !== 'all') queryParams.set('category', params.category);
    if (params.provider && params.provider !== 'all') queryParams.set('provider', params.provider);
    if (params.page) queryParams.set('page', String(params.page));
    if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));

    const endpoint = `/api/studio/elements/search?${queryParams.toString()}`;
    const res = await fetch(apiUrl(endpoint), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const elapsed = performance.now() - start;
    consoleLogger.api('GET', endpoint, res.status, elapsed);

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  },

  /**
   * Retrieve live connectivity status of all 16 element providers.
   * GET /api/studio/elements/providers
   */
  async getProviders(): Promise<{ success: boolean; providers: Record<string, boolean> }> {
    const start = performance.now();
    const endpoint = '/api/studio/elements/providers';
    const res = await fetch(apiUrl(endpoint), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const elapsed = performance.now() - start;
    consoleLogger.api('GET', endpoint, res.status, elapsed);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  },

  /**
   * Create a custom badge with styling and gradient.
   * POST /api/studio/elements/custom-badge
   */
  async createCustomBadge(params: {
    text: string;
    gradient?: string;
    icon?: string;
  }): Promise<CreateCustomBadgeResponse> {
    const start = performance.now();
    const res = await fetch(apiUrl('/api/studio/elements/custom-badge'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const elapsed = performance.now() - start;
    consoleLogger.api('POST', '/api/studio/elements/custom-badge', res.status, elapsed);
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  },
};
