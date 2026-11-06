import { UserProfile, GoogleAuthPayload, AuthResponseData, OAuthAuthorizationResponse } from '../types';
import { consoleLogger } from '@/src/shared/utils/logger';
import { apiUrl } from '@/src/shared/utils/api';

export class AuthSessionError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'AuthSessionError';
  }
}

/**
 * Normalizes legacy YouTube channel emails for existing sessions.
 */
export function resolveChannelDeliveryEmail(email?: string, handle?: string): string {
  if (email && email.trim()) {
    return email.toLowerCase().trim();
  }
  const clean = (handle || 'creator').replace(/^@/, '').toLowerCase().trim();
  return `${clean || 'creator'}@youtube.com`;
}

export const authApi = {
  // Continue with Google using a token verified by the backend.
  async googleLogin(payload: GoogleAuthPayload): Promise<AuthResponseData> {
    const start = performance.now();
    consoleLogger.info('Auth', 'Attempting Google sign-in authentication...');
    const endpoint = apiUrl('/api/auth/google');

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const duration = performance.now() - start;
    consoleLogger.api('POST', '/api/auth/google', res.status, duration);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Google sign-in failed' }));
      throw new Error(err.detail || 'Google sign-in failed');
    }

    const data: AuthResponseData = await res.json();
    consoleLogger.success('Auth', `Google sign-in successful: ${data.user.name}`, data.user);
    return data;
  },

  async facebookLogin(accessToken: string): Promise<AuthResponseData> {
    const res = await fetch(apiUrl('/api/auth/facebook'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Facebook sign-in failed' }));
      throw new Error(err.detail || 'Facebook sign-in failed');
    }
    return res.json();
  },

  async startInstagramLogin(): Promise<OAuthAuthorizationResponse> {
    const res = await fetch(apiUrl('/api/auth/instagram'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start' }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Instagram sign-in is unavailable' }));
      throw new Error(err.detail || 'Instagram sign-in is unavailable');
    }
    return res.json();
  },

  async instagramLogin(code: string, state: string): Promise<AuthResponseData> {
    const res = await fetch(apiUrl('/api/auth/instagram'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'callback', code, state }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Instagram sign-in failed' }));
      throw new Error(err.detail || 'Instagram sign-in failed');
    }
    return res.json();
  },

  // Fetch current user profile
  async getMe(): Promise<UserProfile> {
    const start = performance.now();
    const endpoint = apiUrl('/api/auth/me');
    const token = typeof window !== 'undefined' ? localStorage.getItem('apexmind_token') : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(endpoint, { headers });
    const duration = performance.now() - start;
    consoleLogger.api('GET', '/api/auth/me', res.status, duration);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to retrieve user profile' }));
      throw new AuthSessionError(err.detail || 'Failed to retrieve user profile', res.status);
    }
    const data = await res.json();
    if (data && data.provider === 'youtube_oauth') {
      data.email = resolveChannelDeliveryEmail(data.email, data.handle);
    }
    return data;
  },

  // Logout
  async logout(): Promise<void> {
    consoleLogger.info('Auth', 'Logging out creator session...');
    try {
      await fetch(apiUrl('/api/auth/logout'), { method: 'POST' });
    } catch {
      // Ignored
    }
  },
};
