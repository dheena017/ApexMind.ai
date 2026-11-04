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

export const socialApi = {
  // Fetch connected social fleet accounts
  async getFleetAccounts(): Promise<SocialAccount[]> {
    const start = performance.now();
    try {
      const res = await fetch(apiUrl('/api/social/accounts'));
      consoleLogger.api('GET', '/api/social/accounts', res.status, performance.now() - start);
      if (!res.ok) throw new Error('Failed to fetch social fleet');
      const data = await res.json();
      return data.accounts || [];
    } catch (err) {
      consoleLogger.warn('Social', `Fleet fetch note: ${err}`);
      return [];
    }
  },

  // Get OAuth authorization URL for any platform
  async getOAuthUrl(platform: SocialPlatform, redirectUri?: string): Promise<string> {
    const query = new URLSearchParams({ platform });
    if (redirectUri) query.append('redirectUri', redirectUri);

    const res = await fetch(apiUrl(`/api/social/oauth-url?${query.toString()}`));
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to generate OAuth URL' }));
      throw new Error(err.detail || 'Failed to generate OAuth URL');
    }
    const data = await res.json();
    return data.oauthUrl;
  },

  // Connect or simulate connecting a platform account
  async connectAccount(
    platform: SocialPlatform,
    payload: {
      handle?: string;
      name?: string;
      avatarUrl?: string;
      accessToken?: string;
      code?: string;
      redirectUri?: string;
    }
  ): Promise<SocialAccount> {
    const res = await fetch(apiUrl(`/api/social/connect/${platform}`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to connect account' }));
      throw new Error(err.detail || 'Failed to connect account');
    }
    const data = await res.json();
    return data.account;
  },

  // Disconnect a social account from the fleet
  async disconnectAccount(accountId: string): Promise<void> {
    const res = await fetch(apiUrl('/api/social/disconnect'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
    try {
      const res = await fetch(apiUrl(`/api/social/posts?limit=${limit}`));
      if (!res.ok) return [];
      const data = await res.json();
      return data.posts || [];
    } catch {
      return [];
    }
  },
};

