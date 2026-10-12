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
  loginWithGoogle: async () => {
    throw new Error('AuthContext not initialized');
  },
  loginWithEmail: async () => {
    throw new Error('AuthContext not initialized');
  },
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('apexmind_user');
      const token = localStorage.getItem('apexmind_token');
      if (stored && token) {
        return JSON.parse(stored);
      }
      return null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Only verify session if token and user already exist in storage
    const token = localStorage.getItem('apexmind_token');
    const stored = localStorage.getItem('apexmind_user');
    if (!token || !stored) {
      setUser(null);
      return;
    }

    authApi
      .getMe()
      .then((remoteUser) => {
        setUser((prev) => {
          if (!prev) return null;
          const merged = { ...prev, ...remoteUser };
          localStorage.setItem('apexmind_user', JSON.stringify(merged));
          return merged;
        });
      })
      .catch(() => {
        // Session invalid or expired - reset
        setUser(null);
        localStorage.removeItem('apexmind_user');
        localStorage.removeItem('apexmind_token');
      });
  }, []);

  const loginWithGoogle = async (payload?: GoogleAuthPayload): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      if (!payload || !payload.email) {
        throw new Error('Google account email is required to sign in.');
      }
      const authData = await authApi.googleLogin(payload);
      setUser(authData.user);
      localStorage.setItem('apexmind_user', JSON.stringify(authData.user));
      localStorage.setItem('apexmind_token', authData.token);
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
      localStorage.setItem('apexmind_user', JSON.stringify(authData.user));
      localStorage.setItem('apexmind_token', authData.token);
      return authData.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authApi.logout();
      setUser(null);
      localStorage.removeItem('apexmind_user');
      localStorage.removeItem('apexmind_token');
      consoleLogger.info('Auth', 'Session cleared successfully');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
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
