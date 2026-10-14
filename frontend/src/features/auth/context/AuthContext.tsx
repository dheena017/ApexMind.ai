import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, GoogleAuthPayload } from '../types';
import { authApi } from '../api/authApi';
import { consoleLogger } from '@/src/shared/utils/logger';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: (payload?: GoogleAuthPayload) => Promise<UserProfile>;
  loginWithEmail: (email: string, password?: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  loginWithGoogle: async (payload) => {
    if (!payload) {
      throw new Error('Google account details are required to sign in.');
    }

    try {
      const authData = await authApi.googleLogin(payload);
      localStorage.setItem('apexmind_user', JSON.stringify(authData.user));
      localStorage.setItem('apexmind_token', authData.token);
      return authData.user;
    } catch (error) {
      consoleLogger.error('Auth', `Google login failed: ${error}`);
      throw error;
    }
  },
  loginWithEmail: async (email, password) => {
    try {
      const authData = await authApi.emailLogin(email, password);
      localStorage.setItem('apexmind_user', JSON.stringify(authData.user));
      localStorage.setItem('apexmind_token', authData.token);
      return authData.user;
    } catch (error) {
      consoleLogger.error('Auth', `Email login failed: ${error}`);
      throw error;
    }
  },
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
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!stored || !token) return false;

    const authTimestamp = localStorage.getItem(AUTH_TIMESTAMP_KEY);
    if (!authTimestamp) {
      // Legacy session: seed timestamp now so user gets full 7 days from first run
      localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
      return true;
    }

    const loginTime = parseInt(authTimestamp, 10);
    if (isNaN(loginTime)) {
      return false;
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
      return stored ? JSON.parse(stored) : null;
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

    // Run immediate check
    enforceSessionLimits();

    // Check periodically every 10 seconds while application is open
    const interval = setInterval(enforceSessionLimits, 10000);

    // Also verify when window regains focus or storage event fires from other tabs
    window.addEventListener('focus', enforceSessionLimits);
    window.addEventListener('storage', enforceSessionLimits);

    // If session is valid, verify remote identity
    if (isSessionValid()) {
      authApi
        .getMe()
        .then((remoteUser) => {
          setUser((prev) => {
            if (!prev) return null;
            const merged = { ...prev, ...remoteUser };
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(merged));
            return merged;
          });
        })
        .catch(() => {
          // Session invalid on backend - reset
          setUser(null);
          clearAuthStorage();
        });
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', enforceSessionLimits);
      window.removeEventListener('storage', enforceSessionLimits);
    };
  }, []);

  const loginWithGoogle = async (payload?: GoogleAuthPayload): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      if (!payload) {
        throw new Error('Google account details are required to sign in.');
      }

      const finalPayload: GoogleAuthPayload = { ...payload };

      // If credential exists but email wasn't provided, decode JWT claims client-side
      if (finalPayload.credential && !finalPayload.email) {
        try {
          const parts = finalPayload.credential.split('.');
          if (parts.length >= 2) {
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            );
            const decoded = JSON.parse(jsonPayload);
            if (decoded?.email) {
              finalPayload.email = decoded.email;
              finalPayload.name = finalPayload.name || decoded.name;
              finalPayload.picture = finalPayload.picture || decoded.picture;
              finalPayload.sub = finalPayload.sub || decoded.sub;
            }
          }
        } catch {
          // Handled by backend token verification
        }
      }

      if (!finalPayload.email && !finalPayload.credential && !finalPayload.accessToken) {
        throw new Error('Google account email is required to sign in.');
      }

      const authData = await authApi.googleLogin(finalPayload);
      setUser(authData.user);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authData.user));
      localStorage.setItem(AUTH_TOKEN_KEY, authData.token);
      localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
      return authData.user;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password?: string): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const authData = await authApi.emailLogin(email, password);
      setUser(authData.user);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authData.user));
      localStorage.setItem(AUTH_TOKEN_KEY, authData.token);
      localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
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
        loginWithGoogle,
        loginWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { useAuth } from '../hooks/useAuth';
