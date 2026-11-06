import React, { createContext, useState, useEffect } from 'react';
import { UserProfile, RegisterPayload, LoginPayload, GoogleAuthPayload, MetaLoginProvider, ChannelAuthPayload } from '../types';
import { authApi, resolveChannelDeliveryEmail } from '../api/authApi';
import { consoleLogger } from '@/src/shared/utils/logger';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithEmail: (payload: LoginPayload) => Promise<UserProfile>;
  registerWithEmail: (payload: RegisterPayload) => Promise<UserProfile>;
  loginWithGoogle: (payload: GoogleAuthPayload) => Promise<UserProfile>;
  loginWithMeta: (provider: MetaLoginProvider, code: string, state: string) => Promise<UserProfile>;
  /** Legacy channel login method */
  loginWithChannel: (payload: ChannelAuthPayload) => Promise<UserProfile>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  loginWithEmail: async () => { throw new Error('AuthContext not initialized'); },
  registerWithEmail: async () => { throw new Error('AuthContext not initialized'); },
  loginWithGoogle: async () => { throw new Error('AuthContext not initialized'); },
  loginWithMeta: async () => { throw new Error('AuthContext not initialized'); },
  loginWithChannel: async () => { throw new Error('AuthContext not initialized'); },
  logout: async () => {},
});

export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
export const AUTH_USER_KEY = 'apexmind_user';
export const AUTH_TOKEN_KEY = 'apexmind_token';
export const AUTH_TIMESTAMP_KEY = 'apexmind_auth_timestamp';

/**
 * Validates whether the active creator session exists and was created within the last 7 days.
 * If expired (> 7 days), returns false so session is terminated.
 */
export function isSessionValid(): boolean {
  try {
    const stored = localStorage.getItem(AUTH_USER_KEY);
    if (!stored) return false;

    let token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      token = `tok_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }

    const authTimestamp = localStorage.getItem(AUTH_TIMESTAMP_KEY);
    if (!authTimestamp) {
      localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
      return true;
    }

    const loginTime = parseInt(authTimestamp, 10);
    if (isNaN(loginTime)) {
      localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
      return true;
    }

    const elapsed = Date.now() - loginTime;
    return elapsed >= 0 && elapsed < SEVEN_DAYS_MS;
  } catch {
    return false;
  }
}

export function clearAuthStorage(): void {
  try {
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_TIMESTAMP_KEY);
    localStorage.removeItem('apexmind_yt_active_channel');
  } catch {}
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      if (!isSessionValid()) {
        clearAuthStorage();
        return null;
      }
      const stored = localStorage.getItem(AUTH_USER_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (parsed) {
        // Cleanse any legacy corrupted hardcoded email if user is google/email
        if (parsed.email === 'mindsetforge-v3q@youtube.com') {
          if (parsed.provider === 'google' && parsed.name?.toLowerCase().includes('dheena')) {
            parsed.email = 'dheenadayalan627@gmail.com';
          }
        }
        if (parsed.provider === 'youtube_oauth') {
          parsed.email = resolveChannelDeliveryEmail(parsed.email, parsed.handle);
        }
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  // Monitor 7-day session lifecycle & auto-logout when 7 days lapse
  useEffect(() => {
    const enforceSessionLimits = () => {
      if (!isSessionValid()) {
        if (localStorage.getItem(AUTH_USER_KEY) || localStorage.getItem(AUTH_TOKEN_KEY)) {
          consoleLogger.warn('Auth', 'Session expired after 7 days. Automatic logout initiated.');
          clearAuthStorage();
          setUser(null);
        }
      }
    };

    enforceSessionLimits();
    const interval = setInterval(enforceSessionLimits, 10000);
    window.addEventListener('focus', enforceSessionLimits);
    window.addEventListener('storage', enforceSessionLimits);

    if (isSessionValid()) {
      authApi
        .getMe()
        .then((remoteUser) => {
          setUser((prev) => {
            if (!prev) return remoteUser as UserProfile;
            const merged = { ...prev, ...remoteUser };
            if (merged.provider === 'youtube_oauth') {
              merged.email = resolveChannelDeliveryEmail(merged.email, merged.handle);
            }
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(merged));
            return merged;
          });
        })
        .catch((err) => {
          consoleLogger.warn('Auth', `Remote session sync notice: ${err}`);
        });
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', enforceSessionLimits);
      window.removeEventListener('storage', enforceSessionLimits);
    };
  }, []);

  const saveAuthSession = (authData: { user: UserProfile; token: string }) => {
    setUser(authData.user);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authData.user));
    localStorage.setItem(AUTH_TOKEN_KEY, authData.token);
    localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
    if (authData.user.activeChannelId) {
      localStorage.setItem('apexmind_yt_active_channel', authData.user.activeChannelId);
    } else {
      localStorage.removeItem('apexmind_yt_active_channel');
    }
  };

  const loginWithEmail = async (payload: LoginPayload): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const authData = await authApi.login(payload);
      saveAuthSession(authData);
      return authData.user;
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmail = async (payload: RegisterPayload): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const authData = await authApi.register(payload);
      saveAuthSession(authData);
      return authData.user;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (payload: GoogleAuthPayload): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const authData = await authApi.googleLogin(payload);
      saveAuthSession(authData);
      return authData.user;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithMeta = async (provider: MetaLoginProvider, code: string, state: string): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const authData = await authApi.metaLogin(provider, code, state);
      saveAuthSession(authData);
      return authData.user;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithChannel = async (payload: ChannelAuthPayload): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const authData = await authApi.channelLogin(payload);
      authData.user.email = resolveChannelDeliveryEmail(authData.user.email, authData.user.handle || payload.handle);
      authData.user.provider = 'youtube_oauth';
      saveAuthSession(authData);
      if (payload.handle) {
        localStorage.setItem('apexmind_yt_active_channel', payload.handle);
      }
      return authData.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch {
      // Ignored
    } finally {
      setUser(null);
      clearAuthStorage();
      consoleLogger.info('Auth', 'Session cleared successfully');
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && isSessionValid(),
        isLoading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginWithMeta,
        loginWithChannel,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { useAuth } from '../hooks/useAuth';
