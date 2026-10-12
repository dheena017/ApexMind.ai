import React, { Suspense } from 'react';
import { RouteLoadingFallback } from '@/src/shared/ui/feedback';

import LandingPage from '@/src/features/landing/pages/LandingPage';
import LoadingPage from '@/src/shared/ui/LoadingPage';
import LoginPage from '@/src/features/auth/pages/LoginPage';
import DashboardPage from '@/src/features/dashboard/pages/DashboardPage';
import WorkspacePage from '@/src/features/workspace/pages/WorkspacePage';
import YouTubePage from '@/src/features/youtube/pages/YouTubePage';
import ProfilePage from '@/src/features/profile/pages/ProfilePage';
import SettingsPage from '@/src/features/settings/pages/SettingsPage';
import NotificationsPage from '@/src/features/notifications/pages/NotificationsPage';
import NotFoundPage from '@/src/shared/ui/NotFoundPage';
import { useAuth } from '@/src/features/auth/context/AuthContext';

interface AppRouterProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export default function AppRouter({ activePage, onNavigate }: AppRouterProps) {
  const { isAuthenticated } = useAuth();

  const isPublicPage =
    activePage === 'landing' || activePage === 'login' || activePage === 'loading' || activePage === '404';

  // Unauthenticated users are redirected to login for protected studio pages
  if (!isAuthenticated && !isPublicPage) {
    return <LoginPage onNavigate={onNavigate} />;
  }

  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      {(() => {
        switch (activePage) {
          case 'landing':
            return <LandingPage onNavigate={onNavigate} />;
          case 'loading':
            return <LoadingPage onNavigate={onNavigate} />;
          case 'login':
            return <LoginPage onNavigate={onNavigate} />;
          case 'dashboard':
            return <DashboardPage onNavigate={onNavigate} />;
          case 'workspace':
            return <WorkspacePage onNavigate={onNavigate} />;
          case 'youtube':
            return <YouTubePage onNavigate={onNavigate} />;
          case 'profile':
            return <ProfilePage onNavigate={onNavigate} />;
          case 'settings':
            return <SettingsPage />;
          case 'notifications':
            return <NotificationsPage />;
          case '404':
            return <NotFoundPage onNavigate={onNavigate} />;
          default:
            return <NotFoundPage onNavigate={onNavigate} />;
        }
      })()}
    </Suspense>
  );
}
