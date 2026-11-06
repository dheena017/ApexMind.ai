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

export interface CreateCustomBadgeResponse {
  success: boolean;
  element: VisualElementItem;
}

export const elementsApi = {
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
