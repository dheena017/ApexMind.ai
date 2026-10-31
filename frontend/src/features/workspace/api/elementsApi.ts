/**
 * frontend/src/features/workspace/api/elementsApi.ts
 *
 * API client for the Studio Elements & Overlays Service.
 * Fetches badges, frames, stickers, social tags, progress scrubbers,
 * AI element recommendations, and custom creator badges.
 */

import { consoleLogger } from '@/src/shared/utils/logger';
import { apiUrl } from '@/src/shared/utils/api';

export interface VisualElementItem {
  id: string;
  name: string;
  category: string;
  label?: string;
  desc?: string;
  color?: string;
  iconName?: string;
  symbol?: string;
  type: string;
  tags?: string[];
}

export interface ElementsCatalogResponse {
  success: boolean;
  total: number;
  category: string;
  categories: Array<{ id: string; label: string; count: number }>;
  elements: VisualElementItem[];
}

export interface RecommendedElementsResponse {
  success: boolean;
  category: string;
  recommended: VisualElementItem[];
}

export interface CreateCustomBadgeResponse {
  success: boolean;
  element: VisualElementItem;
}

export const elementsApi = {
  /**
   * Fetch all visual elements, optionally filtered by category or search query.
   * GET /api/workspace/elements
   */
  async getElements(category?: string, search?: string): Promise<ElementsCatalogResponse> {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (search?.trim()) params.append('q', search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const start = performance.now();
    try {
      const res = await fetch(apiUrl(`/api/workspace/elements${qs}`), { cache: 'no-store' });
      const elapsed = performance.now() - start;
      consoleLogger.api('GET', `/api/workspace/elements${qs}`, res.status, elapsed);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      consoleLogger.warn('Studio', `Failed to fetch elements from backend: ${err}`);
      throw err;
    }
  },

  /**
   * Get AI-recommended elements tailored to the video's theme/topic/tone.
   * POST /api/workspace/elements/recommend
   */
  async getRecommendedElements(params: {
    category: string;
    topic?: string;
    tone?: string;
  }): Promise<RecommendedElementsResponse> {
    const start = performance.now();
    try {
      const res = await fetch(apiUrl('/api/workspace/elements/recommend'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const elapsed = performance.now() - start;
      consoleLogger.api('POST', '/api/workspace/elements/recommend', res.status, elapsed);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      consoleLogger.warn('Studio', `Failed to fetch recommended elements: ${err}`);
      throw err;
    }
  },

  /**
   * Create a custom badge with styling and gradient.
   * POST /api/workspace/elements/custom
   */
  async createCustomBadge(params: {
    text: string;
    gradient?: string;
    icon?: string;
  }): Promise<CreateCustomBadgeResponse> {
    const start = performance.now();
    const res = await fetch(apiUrl('/api/workspace/elements/custom'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const elapsed = performance.now() - start;
    consoleLogger.api('POST', '/api/workspace/elements/custom', res.status, elapsed);
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  },
};

