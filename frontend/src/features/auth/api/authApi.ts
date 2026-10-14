import { UserProfile, GoogleAuthPayload } from '../types';
import { consoleLogger } from '@/src/shared/utils/logger';
import { apiUrl } from '@/src/shared/utils/api';

export const authApi = {
  // Sign in with Google
  async googleLogin(payload: GoogleAuthPayload): Promise<{ user: UserProfile; token: string }> {
    const start = performance.now();
    consoleLogger.info('Auth', `Attempting Google authentication for ${payload.email || 'user'}...`);
    const endpoint = apiUrl('/api/auth/google');
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const duration = performance.now() - start;
    consoleLogger.api('POST', '/api/auth/google', res.status, duration);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Google login failed' }));
      throw new Error(err.detail || 'Google sign-in failed');
    }

    const data = await res.json();
    consoleLogger.success('Auth', `Successfully logged in via Google: ${data.user.name}`, data.user);
    return data;
  },

  // Fallback email login
  async emailLogin(email: string, password?: string): Promise<{ user: UserProfile; token: string }> {
    const start = performance.now();
    consoleLogger.info('Auth', `Attempting email authentication for ${email}...`);
    const endpoint = apiUrl('/api/auth/login');
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const duration = performance.now() - start;
    consoleLogger.api('POST', '/api/auth/login', res.status, duration);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(err.detail || 'Login failed');
    }

    const data = await res.json();
    consoleLogger.success('Auth', `Successfully logged in: ${data.user.name}`, data.user);
    return data;
  },

  // Fetch current user profile
  async getMe(): Promise<UserProfile> {
    const start = performance.now();
    const endpoint = apiUrl('/api/auth/me');
    const res = await fetch(endpoint);
    const duration = performance.now() - start;
    consoleLogger.api('GET', '/api/auth/me', res.status, duration);
    if (!res.ok) {
      throw new Error('Failed to retrieve user profile');
    }
    const data = await res.json();
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
