import React, { Suspense } from 'react';
import { RouteLoadingFallback } from '@/src/shared/ui/feedback';

import LandingPage from '@/src/features/landing/pages/LandingPage';
import LoadingPage from '@/src/shared/ui/LoadingPage';
import LoginPage from '@/src/features/auth/pages/LoginPage';
import WorkspacePage from '@/src/features/workspace/pages/WorkspacePage';
import VideosPage from '@/src/features/videos/pages/VideosPage';
import YouTubePage from '@/src/features/youtube/pages/YouTubePage';
import ProfilePage from '@/src/features/profile/pages/ProfilePage';
import ProfileDetailsPage from '@/src/features/profile/pages/ProfileDetailsPage';
import ProfilePreferencesPage from '@/src/features/profile/pages/ProfilePreferencesPage';
import ProfileChannelsPage from '@/src/features/profile/pages/ProfileChannelsPage';
import ProfileActivityPage from '@/src/features/profile/pages/ProfileActivityPage';
import ProfileUsagePage from '@/src/features/profile/pages/ProfileUsagePage';
import RecentStudioActivityPage from '@/src/features/profile/pages/RecentStudioActivityPage';
import ProfileSecurityPage from '@/src/features/profile/pages/ProfileSecurityPage';
import ProfileSectionLayout from '@/src/features/profile/components/ProfileSectionLayout';
import SettingsPage from '@/src/features/settings/pages/SettingsPage';
import NotificationsPage from '@/src/features/notifications/pages/NotificationsPage';
import TermsPage from '@/src/features/legal/pages/TermsPage';
import PrivacyPage from '@/src/features/legal/pages/PrivacyPage';
import NotFoundPage from '@/src/shared/ui/NotFoundPage';
import { useAuth } from '@/src/features/auth/context/AuthContext';
import { WorkspaceTabType } from '@/src/features/workspace/components/WorkspaceSidebar';

interface AppRouterProps {
  activePage: string;
  onNavigate: (page: string) => void;
  activeWorkspacePane: WorkspaceTabType;
  onWorkspacePaneChange: (pane: WorkspaceTabType) => void;
}

export default function AppRouter({
  activePage,
  onNavigate,
  activeWorkspacePane,
  onWorkspacePaneChange,
}: AppRouterProps) {
  const { isAuthenticated } = useAuth();

  const isPublicPage =
    activePage === 'landing' ||
    activePage === 'login' ||
    activePage === 'loading' ||
    activePage === '404' ||
    activePage === 'terms' ||
    activePage === 'privacy';

  // Unauthenticated users are redirected to login for protected studio pages
  if (!isAuthenticated && !isPublicPage) {
    return <LoginPage onNavigate={onNavigate} />;
  }

  // Authenticated users on login or landing are sent directly to Workspace
  if (isAuthenticated && (activePage === 'login' || activePage === 'landing')) {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <WorkspacePage
          onNavigate={onNavigate}
          activePane={activeWorkspacePane}
          onPaneChange={onWorkspacePaneChange}
        />
      </Suspense>
    );
  }

  const page = (
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
          case 'workspace':
          case 'workspace-script':
          case 'workspace-prompt':
          case 'workspace-editor':
          case 'workspace-media':
          case 'workspace-audio':
          case 'workspace-elements':
          case 'workspace-text':
          case 'workspace-canvas':
          case 'workspace-image':
          case 'workspace-video':
            return (
              <WorkspacePage
                onNavigate={onNavigate}
                activePane={activeWorkspacePane}
                onPaneChange={onWorkspacePaneChange}
              />
            );
          case 'youtube':
            return <YouTubePage onNavigate={onNavigate} initialTab="overview" />;
          case 'youtube-videos':
            return <YouTubePage onNavigate={onNavigate} initialTab="videos" />;
          case 'youtube-shorts':
            return <YouTubePage onNavigate={onNavigate} initialTab="shorts" />;
          case 'youtube-playlists':
            return <YouTubePage onNavigate={onNavigate} initialTab="playlists" />;
          case 'youtube-posts':
            return <YouTubePage onNavigate={onNavigate} initialTab="posts" />;
          case 'youtube-seo':
            return <YouTubePage onNavigate={onNavigate} initialTab="seo" />;
          case 'youtube-trending':
            return <YouTubePage onNavigate={onNavigate} initialTab="trending" />;
          case 'youtube-schedules':
            return <YouTubePage onNavigate={onNavigate} initialTab="overview" />;
          case 'youtube-analytics':
            return <YouTubePage onNavigate={onNavigate} initialTab="analytics" />;
          case 'youtube-settings':
            return <YouTubePage onNavigate={onNavigate} initialTab="settings" />;
          case 'videos':
            return <VideosPage onNavigate={onNavigate} />;
          case 'profile':
            return <ProfilePage onNavigate={onNavigate} />;
          case 'profile-details':
            return <ProfileDetailsPage />;
          case 'profile-preferences':
            return <ProfilePreferencesPage />;
          case 'profile-channels':
            return <ProfileChannelsPage onNavigate={onNavigate} />;
          case 'profile-activity':
            return <ProfileActivityPage />;
          case 'profile-usage':
            return <ProfileUsagePage onNavigate={onNavigate} />;
          case 'profile-studio-activity':
            return <RecentStudioActivityPage onNavigate={onNavigate} />;
          case 'profile-security':
            return <ProfileSecurityPage />;
          case 'settings':
            return <SettingsPage />;
          case 'notifications':
            return <NotificationsPage onNavigate={onNavigate} />;
          case 'terms':
            return <TermsPage onNavigate={onNavigate} />;
          case 'privacy':
            return <PrivacyPage onNavigate={onNavigate} />;
          case '404':
            return <NotFoundPage onNavigate={onNavigate} />;
          default:
            return <NotFoundPage onNavigate={onNavigate} />;
        }
      })()}
    </Suspense>
  );
  return activePage.startsWith('profile') ? (
    <ProfileSectionLayout activePage={activePage} onNavigate={onNavigate}>{page}</ProfileSectionLayout>
  ) : page;
}
