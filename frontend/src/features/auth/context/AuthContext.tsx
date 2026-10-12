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

const DEFAULT_USER: UserProfile = {
  id: 'usr_default',
  email: 'creator@apexmind.ai',
  name: 'ApexMind Creator Pro',
  avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=ApexMind',
  provider: 'google',
  verified: true,
};

const AuthContext = createContext<AuthContextType>({
  user: DEFAULT_USER,
  isAuthenticated: true,
  isLoading: false,
  loginWithGoogle: async () => DEFAULT_USER,
  loginWithEmail: async () => DEFAULT_USER,
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('apexmind_user');
      return stored ? JSON.parse(stored) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Sync active profile on mount
    authApi
      .getMe()
      .then((remoteUser) => {
        setUser((prev) => {
          const merged = { ...(prev || DEFAULT_USER), ...remoteUser };
          localStorage.setItem('apexmind_user', JSON.stringify(merged));
          return merged;
        });
      })
      .catch(() => {
        // Fallback to local user
      });
  }, []);

  const loginWithGoogle = async (payload?: GoogleAuthPayload): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const authData = await authApi.googleLogin(
        payload || {
          email: 'creator@apexmind.ai',
          name: 'ApexMind Creator Pro',
          picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
        }
      );
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

export const useAuth = () => useContext(AuthContext);
