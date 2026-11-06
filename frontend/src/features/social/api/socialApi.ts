/**
 * frontend/src/features/social/api/socialApi.ts
 * API client for Omnichannel Social Fleet & Cross-Platform Syndication.
 */

import { apiUrl } from '@/src/shared/utils/api';
import { consoleLogger } from '@/src/shared/utils/logger';
import {
  SocialAccount,
  SyndicatePublishPayload,
  SyndicatePublishResponse,
  PublishedPost,
  SocialPlatform,
} from '../types';

const getAuthHeaders = (): Record<string, string> => {
  try {
    const token = localStorage.getItem('apexmind_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

export const socialApi = {
  // Fetch connected accounts from each platform's status endpoint
  async getFleetAccounts(): Promise<SocialAccount[]> {
    const platforms: SocialPlatform[] = ['youtube', 'facebook', 'instagram'];
    const accountLists = await Promise.all(platforms.map(async (platform) => {
      const path = `/api/${platform}/status`;
      const start = performance.now();
      const res = await fetch(apiUrl(path), { headers: getAuthHeaders() });
      consoleLogger.api('GET', path, res.status, performance.now() - start);
      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: `Failed to load ${platform} account status.` }));
        throw new Error(error.detail || `Failed to load ${platform} account status.`);
      }
      const data = await res.json();
      if (!Array.isArray(data.accounts)) {
        throw new Error(`The ${platform} account status response was invalid.`);
      }
      return data.accounts as SocialAccount[];
    }));
    return accountLists.flat();
  },

  // Start platform OAuth from the platform-specific connect endpoint
  async getOAuthUrl(platform: SocialPlatform, redirectUri?: string): Promise<string> {
    const query = new URLSearchParams();
    if (redirectUri) query.append('redirectUri', redirectUri);

    const queryString = query.toString();
    const path = `/api/${platform}/connect${queryString ? `?${queryString}` : ''}`;
    const res = await fetch(apiUrl(path), { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to generate OAuth URL' }));
      throw new Error(err.detail || 'Failed to generate OAuth URL');
    }
    const data = await res.json();
    return data.oauthUrl;
  },

  async completeMetaOAuth(code: string, state: string): Promise<{ platform: SocialPlatform; accounts: SocialAccount[]; message: string }> {
    const res = await fetch(apiUrl('/api/social/meta/oauth-callback'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ code, state }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to complete social account authorization' }));
      throw new Error(err.detail || 'Failed to complete social account authorization');
    }
    return res.json();
  },

  // Disconnect a social account from the fleet
  async disconnectAccount(platform: SocialPlatform, accountId: string): Promise<void> {
    const res = await fetch(apiUrl(`/api/${platform}/disconnect`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ accountId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to disconnect account' }));
      throw new Error(err.detail || 'Failed to disconnect account');
    }
  },

  // One-click multi-destination syndication publish
  async syndicatePublish(payload: SyndicatePublishPayload): Promise<SyndicatePublishResponse> {
    const start = performance.now();
    consoleLogger.info('Social', `Starting syndication publish to ${payload.targetAccountIds.length} destinations...`);

    const res = await fetch(apiUrl('/api/social/syndicate-publish'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });

    const duration = performance.now() - start;
    consoleLogger.api('POST', '/api/social/syndicate-publish', res.status, duration);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Syndication publish failed' }));
      throw new Error(err.detail || 'Syndication publish failed');
    }

    const data: SyndicatePublishResponse = await res.json();
    consoleLogger.success('Social', `Syndication completed: ${data.successfulCount} successful, ${data.failedCount} failed`, data);
    return data;
  },

  // List published posts history
  async getPublishedPosts(limit: number = 50): Promise<PublishedPost[]> {
    const res = await fetch(apiUrl(`/api/social/posts?limit=${limit}`), { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to load publishing history' }));
      throw new Error(err.detail || 'Failed to load publishing history');
    }

    const data = await res.json();
    if (!Array.isArray(data.posts)) {
      throw new Error('The publishing history response was invalid.');
    }
    return data.posts;
  },
};
