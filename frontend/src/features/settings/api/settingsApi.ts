import { apiUrl } from '@/src/shared/utils/api';

export interface GeminiApiStatus {
  configured: boolean;
  usageUrl: string;
}

export const settingsApi = {
  async getGeminiApiStatus(): Promise<GeminiApiStatus> {
    const response = await fetch(apiUrl('/api/settings/gemini'));
    if (!response.ok) {
      throw new Error(`Failed to check Gemini API configuration (HTTP ${response.status}).`);
    }

    const data: unknown = await response.json();
    if (
      typeof data !== 'object' ||
      data === null ||
      !('configured' in data) ||
      typeof data.configured !== 'boolean' ||
      !('usageUrl' in data) ||
      typeof data.usageUrl !== 'string'
    ) {
      throw new Error('Gemini API status response was invalid.');
    }

    return { configured: data.configured, usageUrl: data.usageUrl };
  },
};
