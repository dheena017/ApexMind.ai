import { UserProfile, RegisterPayload, LoginPayload, GoogleAuthPayload, MetaLoginProvider, ChannelAuthPayload, AuthResponseData, MetaAuthorizationResponse } from '../types';
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
 * Normalizes email to YouTube channel delivery address: [channel-identifier]@youtube.com
 * Only used for legacy channel-direct auth sessions.
 */
export function resolveChannelDeliveryEmail(email?: string, handle?: string): string {
  if (email && email.trim()) {
    return email.toLowerCase().trim();
  }
  const clean = (handle || 'creator').replace(/^@/, '').toLowerCase().trim();
  return `${clean || 'creator'}@youtube.com`;
}

export const authApi = {
  // Register with Email & Password
  async register(payload: RegisterPayload): Promise<AuthResponseData> {
    const start = performance.now();
    consoleLogger.info('Auth', `Attempting registration for ${payload.email}...`);
    const endpoint = apiUrl('/api/auth/register');

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const duration = performance.now() - start;
    consoleLogger.api('POST', '/api/auth/register', res.status, duration);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }

    const data: AuthResponseData = await res.json();
    consoleLogger.success('Auth', `Registered account for ${data.user.name} (${data.user.email})`, data.user);
    return data;
  },

  // Login with Email & Password
  async login(payload: LoginPayload): Promise<AuthResponseData> {
    const start = performance.now();
    consoleLogger.info('Auth', `Attempting login for ${payload.email}...`);
    const endpoint = apiUrl('/api/auth/login');

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const duration = performance.now() - start;
    consoleLogger.api('POST', '/api/auth/login', res.status, duration);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Invalid email or password' }));
      throw new Error(err.detail || 'Invalid email or password');
    }

    const data: AuthResponseData = await res.json();
    consoleLogger.success('Auth', `Logged in account for ${data.user.name} (${data.user.email})`, data.user);
    return data;
  },

  // Continue with Google (GIS Credential Token or Google OAuth payload)
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

  async getMetaAuthorizationUrl(provider: MetaLoginProvider): Promise<MetaAuthorizationResponse> {
    const res = await fetch(apiUrl(`/api/auth/meta/${provider}/authorize-url`));
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: `${provider} sign-in is unavailable` }));
      throw new Error(err.detail || `${provider} sign-in is unavailable`);
    }
    return res.json();
  },

  async metaLogin(provider: MetaLoginProvider, code: string, state: string): Promise<AuthResponseData> {
    const res = await fetch(apiUrl(`/api/auth/meta/${provider}/callback`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: `${provider} sign-in failed` }));
      throw new Error(err.detail || `${provider} sign-in failed`);
    }
    return res.json();
  },

  // Legacy YouTube channel sign-in adapter
  async channelLogin(payload: ChannelAuthPayload): Promise<{ user: UserProfile; token: string }> {
    const start = performance.now();
    consoleLogger.info('Auth', `Attempting YouTube channel authentication for ${payload.handle}...`);
    const endpoint = apiUrl('/api/auth/channel');

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const duration = performance.now() - start;
    consoleLogger.api('POST', '/api/auth/channel', res.status, duration);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'YouTube channel sign-in failed' }));
      throw new Error(err.detail || 'YouTube channel sign-in failed');
    }

    const data = await res.json();
    if (data.user) {
      data.user.email = resolveChannelDeliveryEmail(data.user.email, data.user.handle || payload.handle);
      data.user.provider = 'youtube_oauth';
    }
    consoleLogger.success('Auth', `Successfully logged in via YouTube Channel: ${data.user.name}`, data.user);
    return data;
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
